import { useState } from "react";
import { reportErrorMailto } from "../utils/report";

// Pas de backend dédié : le formulaire construit le même lien mailto que
// l'ancien lien direct (report.js), juste avec le texte réellement saisi —
// on garde le zéro-coût/zéro-service tout en donnant une vraie interface de
// signalement avec confirmation, plutôt qu'un lien mailto nu.
export default function ReportModal({ salle, onClose }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = reportErrorMailto(salle, { message, email });
    setSent(true);
  };

  return (
    <div className="report-modal__backdrop" onClick={onClose}>
      <div className="report-modal" role="dialog" aria-label="Signaler une erreur" onClick={(e) => e.stopPropagation()}>
        <button className="report-modal__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {sent ? (
          <>
            <h2>Merci !</h2>
            <p className="report-modal__text">
              Ton client mail devrait s'être ouvert avec le signalement pré-rempli — il ne reste qu'à l'envoyer.
            </p>
            <button type="button" className="btn btn--primary btn--full" onClick={onClose}>
              Fermer
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Signaler une erreur</h2>
            <p className="report-modal__text">
              Sur la fiche "{salle.nom}" — décris ce qui est incorrect ou à mettre à jour.
            </p>
            <label>
              Description
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex : la salle a déménagé, le lien Instagram ne fonctionne plus..."
              />
            </label>
            <label>
              Ton email (facultatif, pour te répondre)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button type="submit" className="btn btn--primary btn--full">
              Envoyer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
