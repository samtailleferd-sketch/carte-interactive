// URL du CSV publié de l'onglet "Public" du Google Sheet FNSL Sud Est.
// File > Partager > Publier sur le web > sélectionner l'onglet "Public" > format CSV.
// Tant que cette valeur est vide, le site utilise les données fictives locales.
export const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ6AChPneyzx4clgx_z5za23PSnK9D8J5RyU3-0S6km-4ctjafN7XentXJR37Y5aTqh2_g8tL1f0-N/pub?output=csv";

// URL du CSV publié de l'onglet "Photos" (galerie salles, une ligne par photo).
// Même procédure de publication que SHEET_CSV_URL, sur l'onglet "Photos".
// Tant que cette valeur est vide, aucune salle n'affiche de galerie (fiche
// courte/complète continuent de fonctionner normalement sans photo).
export const PHOTOS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ6AChPneyzx4clgx_z5za23PSnK9D8J5RyU3-0S6km-4ctjafN7XentXJR37Y5aTqh2_g8tL1f0-N/pub?gid=56800666&single=true&output=csv";

// URL du Google Form "Proposer une salle". Tant que cette valeur est vide,
// le bouton correspondant reste masqué plutôt que de pointer vers rien.
export const PROPOSE_SALLE_FORM_URL = "";
