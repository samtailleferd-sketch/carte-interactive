import Papa from "papaparse";
import { SHEET_CSV_URL, PHOTOS_CSV_URL } from "../config";
import localSalles from "./salles.json";
import { slugify } from "../utils/slug";
import { chainFor } from "./chains";

const FALSE_VALUES = new Set(["false", "faux", "non", "0", "no"]);
const TRUE_VALUES = new Set(["true", "vrai", "oui", "1", "yes"]);

function parseVisible(raw) {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  if (!trimmed) return true;
  return !FALSE_VALUES.has(trimmed);
}

function parseBool(raw) {
  return TRUE_VALUES.has(String(raw ?? "").trim().toLowerCase());
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

// Insensible aux accents/casse pour comparer un statut de modération saisi à la main.
function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function normalize(row) {
  const id = row.id || row.nom;
  const equipementsStreetlifting = splitList(row.equipements_streetlifting);
  const equipementsForce = splitList(row.equipements_force);
  const chain = chainFor(row.type_salle, row.nom);
  const brandLogo = !row.photo_principale && chain?.logo;
  const photoPrincipale = row.photo_principale || brandLogo?.src || "";
  // Les photos de profil Instagram des clubs de chaînes (Fitness Park, On Air...)
  // sont des logos carrés (nom du club sur fond uni), pas des photos de la salle :
  // on les affiche en "contain" comme le logo générique, sauf si la Sheet précise autre chose.
  const isClubLogo = /^\/images\/(fitness-park|onair-fitness)\//.test(photoPrincipale);

  return {
    id,
    slug: slugify(id),
    nom: row.nom || "",
    ville: row.ville || "",
    adresse: row.adresse || "",
    lat: parseFloat(row.latitude),
    lng: parseFloat(row.longitude),
    google_maps_url: row.google_maps_url || "",
    instagram: row.instagram || "",
    site: row.site_web || "",
    reservation: row.reservation_url || "",
    chaine: row.chaine || chain?.label || "Indépendante",
    type_salle: row.type_salle || "",
    equipements: [...equipementsStreetlifting, ...equipementsForce],
    equipementsStreetlifting,
    equipementsForce,
    statut: row.statut || "À vérifier",
    niveau_pertinence: row.niveau_pertinence || "",
    description: row.remarques_publiques || "",
    descriptionLongue: row.description_longue || "",
    photoPrincipale,
    imageAlt: row.image_alt || brandLogo?.alt || "",
    imageType: row.image_type || (brandLogo || isClubLogo ? "logo" : "photo"),
    photos: [],
    horaires: row.horaires || "",
    telephone: row.telephone || "",
    email: row.email || "",
    conditionsAcces: row.conditions_acces || "",
    tarifs: row.tarifs || "",
    coachingDisponible: row.coaching_disponible || "",
    communaute: row.communaute || "",
    dateDerniereVerification: row.date_derniere_verification || "",
    sourceInformation: row.source_information || "",
    visible: parseVisible(row.visible),
  };
}

async function fetchCsv(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Réponse HTTP ${response.status}`);
  const csvText = await response.text();
  return Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
}

async function fetchFromSheet() {
  const data = await fetchCsv(SHEET_CSV_URL);
  return data.map(normalize);
}

function fromLocalFixture() {
  return localSalles.map(normalize);
}

// Groupe les lignes de l'onglet "Photos" (une ligne = une photo) par salle,
// en ne gardant que les photos autorisées et validées manuellement — une
// salle sans ligne, ou dont aucune ligne n'est encore validée, n'a
// simplement aucune photo (fiche complète affiche "Photos à venir.").
async function fetchPhotosBySalleId() {
  if (!PHOTOS_CSV_URL) return new Map();

  let rows;
  try {
    rows = await fetchCsv(PHOTOS_CSV_URL);
  } catch (err) {
    console.warn("Impossible de charger l'onglet Photos, les fiches s'afficheront sans galerie.", err);
    return new Map();
  }

  const bySalle = new Map();
  try {
    for (const row of rows) {
      const salleId = row.salle_id;
      if (!salleId || !row.url) continue;
      if (!parseBool(row.autorisee) || normalizeText(row.statut) !== "validee") continue;

      const photo = {
        url: row.url,
        alt: row.alt || "",
        legende: row.legende || "",
        credit: row.credit || "",
        ordre: Number.parseInt(row.ordre, 10),
        // "video" : la vignette (row.url) reste une image de couverture locale,
        // mais le clic redirige vers lienExterne (ex. le reel Instagram
        // d'origine) plutôt que d'ouvrir l'image en grand — on n'héberge pas
        // la vidéo elle-même.
        type: normalizeText(row.type) === "video" ? "video" : "photo",
        lienExterne: row.lien_externe || "",
      };
      if (!bySalle.has(salleId)) bySalle.set(salleId, []);
      bySalle.get(salleId).push(photo);
    }
  } catch (err) {
    // Une ligne malformée dans l'onglet Photos ne doit jamais faire échouer
    // le chargement des salles elles-mêmes (voir fetchSalles) — au pire, la
    // galerie reste incomplète pour cette salle.
    console.warn("Ligne(s) invalide(s) dans l'onglet Photos, galerie partielle.", err);
  }

  for (const photos of bySalle.values()) {
    photos.sort((a, b) => (Number.isNaN(a.ordre) ? 0 : a.ordre) - (Number.isNaN(b.ordre) ? 0 : b.ordre));
  }
  return bySalle;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSalles() {
  let salles;
  let photosBySalleId = new Map();

  if (SHEET_CSV_URL) {
    try {
      [salles, photosBySalleId] = await Promise.all([fetchFromSheet(), fetchPhotosBySalleId()]);
      // Un Sheet qui répond mais renvoie 0 ligne est plus probablement un
      // souci passager (propagation Google, réponse tronquée) qu'une vraie
      // carte sans salle — on retente une fois avant d'abandonner, pour
      // éviter d'afficher "Aucune salle" alors que les 80+ salles existent
      // bien côté Sheet.
      if (salles.length === 0) {
        await wait(1500);
        salles = await fetchFromSheet();
      }
      if (salles.length === 0) throw new Error("Onglet Public vide après nouvelle tentative");
    } catch (err) {
      console.warn("Impossible de charger le Google Sheet, repli sur les données locales.", err);
      salles = fromLocalFixture();
    }
  } else {
    salles = fromLocalFixture();
  }

  return salles
    .filter((s) => s.visible && Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .map((s) => ({ ...s, photos: photosBySalleId.get(s.id) || [] }));
}
