import { Link } from "react-router-dom";
import { PROPOSE_SALLE_FORM_URL } from "../config";

export default function ProposeSallePage() {
  // Google Forms affiche une version allégée (sans son propre en-tête/logo)
  // quand on ajoute ce paramètre à l'URL — c'est la méthode standard pour
  // intégrer un Form en <iframe> proprement.
  const embedUrl = PROPOSE_SALLE_FORM_URL ? `${PROPOSE_SALLE_FORM_URL}?embedded=true` : "";

  return (
    <div className="propose-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="propose-page__content">
        <h1>Proposer une salle</h1>
        <p className="propose-page__intro">
          Tu connais une salle adaptée au streetlifting ou à la force qui n'est pas encore sur la carte ? Propose-la
          ci-dessous — elle sera vérifiée manuellement avant toute publication.
        </p>

        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Proposer une salle"
            className="propose-page__iframe"
            loading="lazy"
          >
            Chargement du formulaire…
          </iframe>
        ) : (
          <p className="propose-page__placeholder">
            Le formulaire est en cours de préparation, revenez bientôt. En attendant, tu peux nous signaler une salle
            par email via le lien "Signaler une erreur" présent sur les fiches existantes.
          </p>
        )}
      </div>
    </div>
  );
}
