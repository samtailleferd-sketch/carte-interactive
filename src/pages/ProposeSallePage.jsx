import { Link } from "react-router-dom";
import SalleSubmissionForm from "../components/SalleSubmissionForm";

export default function ProposeSallePage() {
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

        <SalleSubmissionForm source="utilisateur">
          <div className="propose-page__intro">
            <p>
              Cette carte recense, partout en France, les salles qui offrent un vrai terrain d'entraînement pour le
              streetlifting et les sports de force. Si tu connais une salle qui n'est pas encore référencée, remplis
              ce formulaire le plus précisément possible — chaque contribution aide à faire grandir la carte.
            </p>
          </div>
        </SalleSubmissionForm>
      </div>
    </div>
  );
}
