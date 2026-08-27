// Palette de marqueur par chaîne — clé normalisée (minuscule, sans accent)
// pour matcher indépendamment de la casse/orthographe saisie dans le Sheet.
// `secondary` sert de couleur de bordure du badge (accent de marque), `text`
// est explicite quand connu ; sinon calculé automatiquement (voir plus bas).
const CHAIN_COLORS = {
  "fitness park": { primary: "#1f2d3d", secondary: "#c9a227", text: "#ffffff" },
  "on air": { primary: "#c81d25", secondary: "#1a1a1a", text: "#ffffff" },
};

// Couleur neutre pour les salles indépendantes ou toute chaîne pas encore
// répertoriée ci-dessus — reste sobre plutôt que d'inventer une identité.
const DEFAULT_COLORS = { primary: "#6b6e78", secondary: "rgba(255, 255, 255, 0.85)", text: "#ffffff" };

function normalize(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Luminance relative (WCAG) pour choisir automatiquement un texte noir ou
// blanc quand une couleur primaire est ajoutée sans texte explicite.
function contrastTextFor(hex) {
  const clean = (hex || "").replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.5 ? "#141414" : "#ffffff";
}

// Couleurs du marqueur d'une salle : identité de la chaîne si connue, sinon
// palette neutre par défaut.
export function getMarkerColors(salle) {
  const chaine = normalize(salle?.chaine);
  const entry = CHAIN_COLORS[chaine];
  if (entry) {
    return { ...entry, text: entry.text || contrastTextFor(entry.primary) };
  }
  return DEFAULT_COLORS;
}
