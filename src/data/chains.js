// Motifs de détection des chaînes/enseignes à partir du nom de la salle.
// Utilisé à la fois pour le logo par défaut (fetchSalles.js) et pour le
// filtre "Chaîne" de la carte. Pour ajouter une nouvelle chaîne reconnue
// automatiquement, il suffit d'ajouter une entrée ici — aucune migration
// du Sheet n'est nécessaire.
export const CHAINS = [
  {
    key: "fitness-park",
    label: "Fitness Park",
    match: /fitness park/i,
    logo: { src: "/images/fitnesspark-logo.svg", alt: "Fitness Park" },
  },
  {
    key: "on-air",
    label: "On Air",
    match: /\bon air\b/i,
    logo: null,
  },
];

export function chainFor(typeSalle, nom) {
  const haystack = `${typeSalle || ""} ${nom || ""}`;
  return CHAINS.find((chain) => chain.match.test(haystack)) || null;
}
