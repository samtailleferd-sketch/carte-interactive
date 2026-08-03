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
        <div className="propose-page__intro">
          <p>
            Cette carte recense, partout en France, les salles qui offrent un vrai terrain d'entraînement pour le
            streetlifting et les sports de force — salle spécialisée, espace dédié dans une salle généraliste, ou
            simplement du matériel adapté (rack, disques calibrés, anneaux, barres parallèles, station de dips...).
            Plus les fiches sont complètes, plus la carte devient un outil utile pour toute la communauté — notamment
            pour repérer une salle avant un déplacement ou un déménagement.
          </p>
          <p>
            Si tu connais une salle qui n'est pas encore référencée, prends quelques minutes pour remplir le
            formulaire ci-dessous le <strong>plus précisément possible</strong> : équipements exacts, photos,
            remarques utiles. Plus les informations sont complètes, plus vite la salle pourra être vérifiée et
            ajoutée. Chaque contribution aide à faire grandir cette carte dans toute la France, pas seulement dans
            le Sud Est — merci pour ton aide au développement du streetlifting !
          </p>
        </div>

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
