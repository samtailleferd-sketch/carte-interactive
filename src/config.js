// URL du CSV publié de l'onglet "Public" du Google Sheet FNSL Sud Est.
// File > Partager > Publier sur le web > sélectionner l'onglet "Public" > format CSV.
// Tant que cette valeur est vide, le site utilise les données fictives locales.
export const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ6AChPneyzx4clgx_z5za23PSnK9D8J5RyU3-0S6km-4ctjafN7XentXJR37Y5aTqh2_g8tL1f0-N/pub?gid=611977440&single=true&output=tsv";

// URL du CSV publié de l'onglet "Photos" (galerie salles, une ligne par photo).
// Même procédure de publication que SHEET_CSV_URL, sur l'onglet "Photos".
// Tant que cette valeur est vide, aucune salle n'affiche de galerie (fiche
// courte/complète continuent de fonctionner normalement sans photo).
export const PHOTOS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ6AChPneyzx4clgx_z5za23PSnK9D8J5RyU3-0S6km-4ctjafN7XentXJR37Y5aTqh2_g8tL1f0-N/pub?gid=56800666&single=true&output=csv";

// Projet Supabase (comptes utilisateurs). La clé "publishable"/"anon" est
// conçue pour être exposée côté client — la sécurité vient des policies RLS
// définies sur chaque table, jamais du secret de cette clé. Ne JAMAIS mettre
// ici la clé "secret"/"service_role", qui contourne les RLS.
export const SUPABASE_URL = "https://cldvzzccraenzcnsotpo.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_JXfWV0asYIoNoKksI72Z1w_hJ5WhPwm";

// URL publique du site déployé (GitHub Pages) — sert à construire des liens
// absolus utilisables en dehors de l'app (emails d'alerte notamment), là où
// des liens relatifs n'ont pas de sens.
export const SITE_URL = "https://samtailleferd-sketch.github.io/carte-interactive/";

// Seul compte autorisé à envoyer des alertes email et à voir /admin/alertes
// — vérifié côté client (masquer l'écran) ET côté Edge Function (la vraie
// barrière de sécurité, RLS + vérification du JWT ne peuvent pas être
// contournées depuis le navigateur).
export const ADMIN_EMAIL = "tailleferdsam@gmail.com";

// Clé publique VAPID (identité du serveur d'envoi Web Push) — sans risque à
// exposer côté client, c'est sa contrepartie privée (secret Edge Function
// VAPID_PRIVATE_KEY, jamais dans ce fichier) qui protège l'envoi réel.
export const VAPID_PUBLIC_KEY =
  "BMcuyWMpGilqqEICjFip5hPCgEaPLXXeY80jvq9pVVquX5tIxB2qATTVNk__aSWnPjJMR23QXHQLZIlxUCpRDA8";
