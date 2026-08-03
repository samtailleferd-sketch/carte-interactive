import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STEP_EMAIL = "email";
const STEP_CODE = "code";

export default function AuthModal({ onClose }) {
  const [step, setStep] = useState(STEP_EMAIL);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [alertesLocales, setAlertesLocales] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (!supabase) return null;

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (sendError) {
      setError("Impossible d'envoyer le code — vérifie l'adresse email et réessaie.");
      return;
    }
    setStep(STEP_CODE);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (verifyError || !data.user) {
      setSending(false);
      setError("Code invalide ou expiré — vérifie le code reçu par email.");
      return;
    }
    await supabase.from("profiles").upsert({
      id: data.user.id,
      newsletter_consent: newsletter,
      alertes_locales_consent: alertesLocales,
    });
    setSending(false);
    onClose();
  };

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {step === STEP_EMAIL && (
          <form onSubmit={handleSendCode}>
            <h2>Se connecter</h2>
            <p className="auth-modal__hint">
              Reçois un code de connexion par email — aucun mot de passe à retenir. La carte reste consultable sans
              compte.
            </p>
            <input
              type="email"
              required
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />

            <label className="auth-modal__checkbox">
              <input
                type="checkbox"
                checked={alertesLocales}
                onChange={(e) => setAlertesLocales(e.target.checked)}
              />
              Recevoir les alertes de nouvelles salles proches de chez moi
            </label>
            <label className="auth-modal__checkbox">
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
              S'abonner à la newsletter Street Map / FNSL
            </label>

            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Envoi..." : "Recevoir un code"}
            </button>
          </form>
        )}

        {step === STEP_CODE && (
          <form onSubmit={handleVerifyCode}>
            <h2>Vérifie ton email</h2>
            <p className="auth-modal__hint">Code à 6 chiffres envoyé à {email}.</p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Vérification..." : "Valider"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
