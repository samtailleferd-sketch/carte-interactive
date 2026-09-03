import { statusVariant } from "../statusStyle";

export function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function listHasTag(list, tag) {
  const target = normalize(tag);
  return list.some((item) => normalize(item).includes(target));
}

function isRealLink(url) {
  return Boolean(url) && url !== "#";
}

// Vocabulaire des filtres matériel : chaque filtre cherche un tag dans les
// colonnes existantes equipements_streetlifting / equipements_force (texte
// libre séparé par virgule/point-virgule). Ajouter un filtre ici ne demande
// aucune nouvelle colonne côté Sheet.
export const STREETLIFTING_FILTERS = [
  { key: "tractions-lestees", label: "Tractions lestées possibles", tag: "tractions lestées" },
  { key: "dips-lestes", label: "Dips lestés possibles", tag: "dips lestés" },
  { key: "station-dips", label: "Station de dips réglable", tag: "station de dips réglable" },
  { key: "anneaux", label: "Anneaux", tag: "anneaux" },
  { key: "barres-paralleles", label: "Barres parallèles", tag: "barres parallèles" },
];

export const FORCE_FILTERS = [
  { key: "rack-squat", label: "Rack / cage à squat", tag: "rack à squat" },
  { key: "disques-calibres", label: "Disques calibrés", tag: "disques calibrés" },
  { key: "plateforme", label: "Plateforme", tag: "plateforme" },
];

export const STATUT_FILTERS = [
  { key: "partner", label: "Partenaire FNSL Sud Est", variant: "partner" },
  { key: "verified", label: "Vérifiée", variant: "verified" },
  { key: "unverified", label: "À vérifier", variant: "unverified" },
  { key: "test", label: "Recensée", variant: "test" },
];

export const NIVEAU_FILTERS = [
  { key: "tres-adaptee", label: "Très adaptée" },
  { key: "adaptee", label: "Adaptée" },
  { key: "partiellement-adaptee", label: "Partiellement adaptée" },
  { key: "a-verifier", label: "À vérifier" },
];

export const PRATIQUE_FILTERS = [
  { key: "instagram", label: "Instagram disponible", check: (s) => isRealLink(s.instagram) },
  { key: "site", label: "Site web disponible", check: (s) => isRealLink(s.site) },
  { key: "reservation", label: "Réservation possible", check: (s) => isRealLink(s.reservation) },
  { key: "coaching", label: "Coaching disponible", check: (s) => Boolean(s.coachingDisponible) },
];

export const DEFAULT_RADIUS_KM = 50;

export function emptyFilters() {
  return {
    query: "",
    chaines: new Set(),
    streetlifting: new Set(),
    force: new Set(),
    statuts: new Set(),
    niveaux: new Set(),
    pratiques: new Set(),
    favorisOnly: false,
    radiusKm: DEFAULT_RADIUS_KM,
  };
}

// Sérialisation des filtres dans l'URL (paramètres courts) pour permettre de
// partager un lien vers une vue filtrée précise (ex. "Fitness Park" + "Disques
// calibrés"). Lecture au montage uniquement, écriture (replace) à chaque
// changement — pas de synchronisation bidirectionnelle après coup.
const PARAM_KEYS = {
  query: "q",
  chaines: "chaine",
  streetlifting: "sl",
  force: "fo",
  statuts: "st",
  niveaux: "ni",
  pratiques: "pr",
  favorisOnly: "fav",
};

const SET_FILTER_KEYS = ["chaines", "streetlifting", "force", "statuts", "niveaux", "pratiques"];

export function filtersToParams(filters) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set(PARAM_KEYS.query, filters.query.trim());
  for (const key of SET_FILTER_KEYS) {
    if (filters[key].size) params.set(PARAM_KEYS[key], Array.from(filters[key]).join(","));
  }
  if (filters.favorisOnly) params.set(PARAM_KEYS.favorisOnly, "1");
  return params;
}

export function filtersFromParams(params) {
  const filters = emptyFilters();
  const q = params.get(PARAM_KEYS.query);
  if (q) filters.query = q;
  for (const key of SET_FILTER_KEYS) {
    const raw = params.get(PARAM_KEYS[key]);
    if (raw) filters[key] = new Set(raw.split(",").filter(Boolean));
  }
  filters.favorisOnly = params.get(PARAM_KEYS.favorisOnly) === "1";
  return filters;
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.query.trim() ||
      filters.chaines.size ||
      filters.streetlifting.size ||
      filters.force.size ||
      filters.statuts.size ||
      filters.niveaux.size ||
      filters.pratiques.size ||
      filters.favorisOnly
  );
}

// `favorites` (Set d'ids) est optionnel : seul le filtre "Favoris" en a
// besoin, les autres écrans qui appellent matchesFilters sans favoris (s'il
// y en avait) continueraient de fonctionner, favorisOnly étant alors ignoré.
export function matchesFilters(salle, filters, favorites) {
  if (filters.favorisOnly && !favorites?.has(salle.id)) return false;

  const q = normalize(filters.query);
  if (q) {
    const haystack = normalize(`${salle.nom} ${salle.ville} ${salle.adresse} ${salle.chaine}`);
    if (!haystack.includes(q)) return false;
  }

  if (filters.chaines.size && !filters.chaines.has(salle.chaine)) return false;

  for (const key of filters.streetlifting) {
    const def = STREETLIFTING_FILTERS.find((f) => f.key === key);
    if (def && !listHasTag(salle.equipementsStreetlifting, def.tag)) return false;
  }

  for (const key of filters.force) {
    const def = FORCE_FILTERS.find((f) => f.key === key);
    if (def && !listHasTag(salle.equipementsForce, def.tag)) return false;
  }

  if (filters.statuts.size && !filters.statuts.has(statusVariant(salle.statut))) return false;

  if (filters.niveaux.size) {
    const niveau = normalize(salle.niveau_pertinence) || normalize("À vérifier");
    const match = NIVEAU_FILTERS.some(
      (def) => filters.niveaux.has(def.key) && normalize(def.label) === niveau
    );
    if (!match) return false;
  }

  for (const key of filters.pratiques) {
    const def = PRATIQUE_FILTERS.find((f) => f.key === key);
    if (def && !def.check(salle)) return false;
  }

  return true;
}

// Nombre de salles qui correspondraient à ce statut si on l'ajoutait, tous
// les autres filtres actifs restant inchangés — indépendant de la sélection
// de statuts actuelle, pour que chaque interrupteur affiche un compte
// pertinent même quand plusieurs statuts sont déjà cochés.
export function countByStatut(salles, filters, favorites, variantKey) {
  const probe = { ...filters, statuts: new Set([variantKey]) };
  return salles.filter((s) => matchesFilters(s, probe, favorites)).length;
}
