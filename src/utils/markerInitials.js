// Abréviations fixes pour les chaînes reconnues — clé normalisée (minuscule,
// sans accent) pour matcher indépendamment de la casse/orthographe saisie
// dans le Sheet.
const CHAIN_INITIALS = {
  "fitness park": "FP",
  "on air": "ON",
  "basic-fit": "BF",
  "basic fit": "BF",
  "l'appart fitness": "AF",
  "appart fitness": "AF",
  "keep cool": "KC",
  "vita liberte": "VL",
  neoness: "NE",
  "l'orange bleue": "OB",
  "orange bleue": "OB",
  "magic form": "MF",
  "form'plus": "FP",
};

// Mots trop génériques pour porter une information distinctive dans des
// initiales (nom de salle indépendante) — on les ignore avant de prendre les
// premières lettres.
const STOPWORDS = new Set([
  "salle", "salles", "club", "gym", "gymnase", "gymnasium", "fitness",
  "sport", "sports", "force", "musculation", "center", "centre",
  "de", "du", "des", "la", "le", "les", "l", "d", "et", "au", "aux", "un", "une",
]);

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function initialsFromName(nom) {
  const words = normalize(nom)
    .split(/[\s'-]+/)
    .filter((w) => w && !STOPWORDS.has(w));

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  // Repli : le nom entier n'était fait que de mots vides (rare) — on prend
  // simplement les deux premiers caractères non-espace du nom brut.
  const raw = (nom || "").replace(/\s+/g, "");
  return raw.slice(0, 2).toUpperCase() || "?";
}

// Initiales affichées dans le badge d'un marqueur : abréviation fixe pour les
// chaînes connues, sinon dérivées du nom de la salle indépendante.
export function getMarkerInitials(salle) {
  const chaine = normalize(salle?.chaine);
  if (chaine && CHAIN_INITIALS[chaine]) {
    return CHAIN_INITIALS[chaine];
  }
  return initialsFromName(salle?.nom);
}
