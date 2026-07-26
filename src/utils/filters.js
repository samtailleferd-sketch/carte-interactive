import { statusVariant } from "../statusStyle";

function normalize(value) {
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

export function emptyFilters() {
  return {
    query: "",
    chaines: new Set(),
    streetlifting: new Set(),
    force: new Set(),
    statuts: new Set(),
    niveaux: new Set(),
    pratiques: new Set(),
  };
}

export function hasActiveFilters(filters) {
  return Boolean(
    filters.query.trim() ||
      filters.chaines.size ||
      filters.streetlifting.size ||
      filters.force.size ||
      filters.statuts.size ||
      filters.niveaux.size ||
      filters.pratiques.size
  );
}

export function matchesFilters(salle, filters) {
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
