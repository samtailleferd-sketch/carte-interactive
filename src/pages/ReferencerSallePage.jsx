import { useEffect } from "react";
import SalleSubmissionForm from "../components/SalleSubmissionForm";

// Page volontairement non liée depuis nulle part dans l'app (pas de bouton
// carte, pas de lien menu/sidebar/compte) — accessible uniquement par lien
// direct envoyé à une salle de sport. En-tête minimal, aucune navigation
// vers le reste de Street Map, pas de retour carte après envoi.
export default function ReferencerSallePage() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <div className="propose-page">
      <header className="detail-header detail-header--minimal">
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="propose-page__content">
        <h1>Référencer votre salle sur Street Map</h1>

        <SalleSubmissionForm
          source="salle"
          extended
          showBackToMap={false}
          showResendButton
          confirmationTitle="Merci, votre salle a bien été transmise."
          confirmationText="Nous allons vérifier les informations avant publication éventuelle sur Street Map. Si certaines informations sont manquantes, nous pourrons vous recontacter."
        >
          <div className="propose-page__intro">
            <p>
              Nous construisons Street Map, une carte destinée à aider les pratiquants de streetlifting, de
              musculation et de sports de force à trouver des salles adaptées près de chez eux.
            </p>
            <p>
              Si vous représentez une salle de sport, vous pouvez remplir ce formulaire afin que nous puissions
              référencer votre établissement avec des informations fiables et à jour.
            </p>
            <p>
              Le formulaire prend environ 5 à 10 minutes. Aucun champ n'est obligatoire à l'exception du nom et de la
              ville, mais plus les informations sont complètes, meilleure sera votre fiche. Les informations sont
              vérifiées avant publication — l'envoi de ce formulaire ne garantit pas une publication immédiate.
            </p>
          </div>
        </SalleSubmissionForm>
      </div>
    </div>
  );
}
