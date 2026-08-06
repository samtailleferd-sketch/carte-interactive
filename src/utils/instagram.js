// Extrait "@handle" d'une URL de profil Instagram (ex.
// "https://www.instagram.com/alpha_powergym/?hl=fr" → "@alpha_powergym"),
// pour l'afficher en haut de la fiche complète plutôt qu'un simple bouton.
export function instagramHandle(url) {
  try {
    const path = new URL(url).pathname;
    const handle = path.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : null;
  } catch {
    return null;
  }
}
