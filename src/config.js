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

// URL du Google Form "Proposer une salle" (page /proposer, intégré en
// <iframe>). Tant que cette valeur est vide, la page affiche un message
// "en cours de préparation" plutôt qu'un iframe cassé.
export const PROPOSE_SALLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdKAZdQ0ZgWJcMvVu1P-_pKqi7PRwknV-OUVxaHueKbGDD3vw/viewform";

// Projet Supabase (comptes utilisateurs). La clé "publishable"/"anon" est
// conçue pour être exposée côté client — la sécurité vient des policies RLS
// définies sur chaque table, jamais du secret de cette clé. Ne JAMAIS mettre
// ici la clé "secret"/"service_role", qui contourne les RLS.
export const SUPABASE_URL = "https://cldvzzccraenzcnsotpo.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_JXfWV0asYIoNoKksI72Z1w_hJ5WhPwm";
