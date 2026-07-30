// Les chemins d'images viennent du Google Sheet sous forme absolue
// (ex. "/images/fitness-park/vitrolles.jpg"), en supposant un site servi à
// la racine du domaine. Sous GitHub Pages, le site est servi sous
// /carte-interactive/ : cette fonction ajoute ce préfixe au moment de
// l'affichage, sans avoir à toucher aux données du Sheet.
export function resolveAssetUrl(path) {
  if (!path || !path.startsWith("/")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
