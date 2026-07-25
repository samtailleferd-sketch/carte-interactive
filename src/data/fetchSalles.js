import Papa from "papaparse";
import { SHEET_CSV_URL } from "../config";
import localSalles from "./salles.json";
import { slugify } from "../utils/slug";

const FALSE_VALUES = new Set(["false", "faux", "non", "0", "no"]);

function parseVisible(raw) {
  const trimmed = String(raw ?? "").trim().toLowerCase();
  if (!trimmed) return true;
  return !FALSE_VALUES.has(trimmed);
}

function splitList(value) {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalize(row) {
  const id = row.id || row.nom;
  const equipementsStreetlifting = splitList(row.equipements_streetlifting);
  const equipementsForce = splitList(row.equipements_force);

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
    equipements: [...equipementsStreetlifting, ...equipementsForce],
    equipementsStreetlifting,
    equipementsForce,
    statut: row.statut || "À vérifier",
    niveau_pertinence: row.niveau_pertinence || "",
    description: row.remarques_publiques || "",
    descriptionLongue: row.description_longue || "",
    photoPrincipale: row.photo_principale || "",
    photos: splitList(row.photos),
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

async function fetchFromSheet() {
  const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Réponse HTTP ${response.status}`);
  const csvText = await response.text();
  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return data.map(normalize);
}

function fromLocalFixture() {
  return localSalles.map(normalize);
}

export async function fetchSalles() {
  let salles;
  if (SHEET_CSV_URL) {
    try {
      salles = await fetchFromSheet();
    } catch (err) {
      console.warn("Impossible de charger le Google Sheet, repli sur les données locales.", err);
      salles = fromLocalFixture();
    }
  } else {
    salles = fromLocalFixture();
  }

  return salles.filter((s) => s.visible && Number.isFinite(s.lat) && Number.isFinite(s.lng));
}
