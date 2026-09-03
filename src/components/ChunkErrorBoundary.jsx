import { Component } from "react";

const RELOAD_FLAG_KEY = "streetmap_chunk_reload";

// Filet de sécurité pour un problème classique des apps découpées en
// morceaux (code-splitting) : un onglet resté ouvert pendant un déploiement
// tente ensuite de charger le code d'une page (ex. /compte) via un fichier
// dont le nom a changé — ce fichier n'existe plus sur le serveur, l'import
// échoue, et sans ce filet React abandonne tout l'affichage (écran noir,
// rien ne charge). On distingue ce cas précis (rechargement automatique,
// une seule fois par session pour éviter une boucle) d'une vraie erreur de
// rendu (message clair + bouton, pas de rechargement en boucle aveugle).
function isChunkLoadError(error) {
  const message = String(error?.message || "");
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

export default class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG_KEY)) {
      sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="detail-page detail-page--state">
          <p>Une erreur est survenue.</p>
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
