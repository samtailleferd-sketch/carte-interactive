import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { PENDING_CONSENT_KEY } from "../hooks/useAuth";
import { SITE_URL } from "../config";
import { fnslZones } from "../data/fnslZones";
import Toggle from "./Toggle";

const STEP_EMAIL = "email";
const STEP_SENT = "sent";

// Connexion par lien envoyé par email (pas de mot de passe géré nous-mêmes,
// pas de bascule créer/se connecter — signInWithOtp gère les deux cas en une
// seule étape). Le modèle d'email par défaut de Supabase n'inclut qu'un lien
// cliquable tant qu'aucun SMTP personnalisé n'est configuré.
export default function AuthModal({ onClose }) {
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState("");
  const [regionFnsl, setRegionFnsl] = useState("");
  const [alertesLocales, setAlertesLocales] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!supabase) return null;

  const handleSendLink = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    // Les préférences sont choisies avant que le compte n'existe : on les
    // garde de côté pour que la fiche "profiles" les récupère juste après
    // que le lien reçu par email aura été cliqué (voir useAuth.js).
    localStorage.setItem(
      PENDING_CONSENT_KEY,
      JSON.stringify({
        newsletter_consent: newsletter,
        alertes_locales_consent: alertesLocales,
        region_fnsl: regionFnsl || null,
      })
    );
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      // Sans ce champ, Supabase retombe sur le "Site URL" configuré côté
      // dashboard (racine du domaine GitHub Pages) plutôt que le chemin réel
      // de l'app (/carte-interactive/) — le lien reçu par email atterrissait
      // sur un 404 GitHub Pages, la connexion échouait silencieusement pour
      // tout le monde. Découvert en testant les notifications push ce soir.
      options: { shouldCreateUser: true, emailRedirectTo: SITE_URL },
    });
    setSending(false);
    if (sendError) {
      setError("Impossible d'envoyer le lien — vérifie l'adresse email et réessaie.");
      return;
    }
    setStep(STEP_SENT);
  };

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {step === STEP_EMAIL && (
          <form onSubmit={handleSendLink}>
            <h2>Rejoins la carte</h2>
            <p className="auth-modal__hint">
              Enregistre tes salles favorites, propose des ajouts, reçois les nouveautés de ta région — aucun mot de
              passe à retenir, un simple lien par email.
            </p>
            <input
              type="email"
              required
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <label className="auth-modal__field-label">
              Région FNSL
              <select value={regionFnsl} onChange={(e) => setRegionFnsl(e.target.value)}>
                <option value="">Je ne sais pas encore</option>
                {Object.keys(fnslZones).map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <div className="auth-modal__toggles">
              <Toggle
                checked={alertesLocales}
                onChange={setAlertesLocales}
                label="Recevoir des alertes nouvelles salles"
              />
              <Toggle checked={newsletter} onChange={setNewsletter} label="Recevoir la newsletter FNSL Sud Est" />
            </div>

            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Envoi..." : "Recevoir un lien de connexion"}
            </button>
            <button type="button" className="auth-modal__skip" onClick={onClose}>
              Continuer sans compte →
            </button>
          </form>
        )}

        {step === STEP_SENT && (
          <div>
            <h2>Vérifie ton email</h2>
            <p className="auth-modal__hint">
              Un lien de connexion vient d'être envoyé à <strong>{email}</strong>. Ouvre cet email et clique sur le
              lien pour te connecter — tu peux fermer cette fenêtre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
