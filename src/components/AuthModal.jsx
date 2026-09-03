import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { PENDING_CONSENT_KEY } from "../hooks/useAuth";
import { SITE_URL } from "../config";
import { fnslZones } from "../data/fnslZones";
import Toggle from "./Toggle";

const MODE_LOGIN = "login";
const MODE_SIGNUP = "signup";
const MODE_FORGOT = "forgot";
const MODE_FORGOT_SENT = "forgot-sent";
const MODE_RESET_PASSWORD = "reset-password";

// 8 caractères minimum, au moins une lettre, un chiffre, un caractère spécial.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_HINT = "8 caractères minimum, avec au moins une lettre, un chiffre et un caractère spécial.";

// Connexion email + mot de passe (remplace l'ancien lien magique). Le mode
// reset-password ne se choisit jamais manuellement : il s'ouvre depuis
// MapPage quand useAuth() détecte l'événement PASSWORD_RECOVERY de Supabase
// (utilisateur arrivé via un lien "mot de passe oublié").
export default function AuthModal({ onClose, initialMode = MODE_LOGIN }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [regionFnsl, setRegionFnsl] = useState("");
  const [alertesLocales, setAlertesLocales] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  if (!supabase) return null;

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setPassword("");
    setPasswordConfirm("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setSending(false);
    if (loginError) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    onClose();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!PASSWORD_RULE.test(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSending(true);
    // Les préférences sont choisies avant que le compte ne soit confirmé :
    // on les garde de côté pour que la fiche "profiles" les récupère juste
    // après (session immédiate ou juste après confirmation — voir useAuth.js).
    localStorage.setItem(
      PENDING_CONSENT_KEY,
      JSON.stringify({
        newsletter_consent: newsletter,
        alertes_locales_consent: alertesLocales,
        region_fnsl: regionFnsl || null,
      })
    );
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SITE_URL },
    });
    setSending(false);
    if (signupError) {
      if (signupError.message?.includes("already registered")) {
        setError("Un compte existe déjà avec cet email — connecte-toi plutôt.");
      } else if (signupError.code === "email_address_invalid") {
        setError("Cette adresse email n'est pas valide.");
      } else if (signupError.code === "over_email_send_rate_limit") {
        setError("Trop de tentatives récentes — réessaie dans quelques minutes.");
      } else {
        setError("Impossible de créer le compte — réessaie.");
      }
      return;
    }
    if (data.session) {
      onClose();
      return;
    }
    // Pas de session immédiate : la confirmation par email est activée sur
    // ce projet Supabase.
    setAwaitingConfirmation(true);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL });
    setSending(false);
    if (resetError) {
      setError(
        resetError.code === "over_email_send_rate_limit"
          ? "Trop de tentatives récentes — réessaie dans quelques minutes."
          : "Impossible d'envoyer l'email — vérifie l'adresse et réessaie."
      );
      return;
    }
    setMode(MODE_FORGOT_SENT);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (!PASSWORD_RULE.test(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSending(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSending(false);
    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe — réessaie.");
      return;
    }
    onClose();
  };

  const showTabs = mode === MODE_LOGIN || (mode === MODE_SIGNUP && !awaitingConfirmation);

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>

        {showTabs && (
          <div className="auth-modal__tabs">
            <button
              type="button"
              className={`auth-modal__tab ${mode === MODE_LOGIN ? "auth-modal__tab--active" : ""}`}
              onClick={() => switchMode(MODE_LOGIN)}
            >
              Se connecter
            </button>
            <button
              type="button"
              className={`auth-modal__tab ${mode === MODE_SIGNUP ? "auth-modal__tab--active" : ""}`}
              onClick={() => switchMode(MODE_SIGNUP)}
            >
              Créer un compte
            </button>
          </div>
        )}

        {mode === MODE_LOGIN && (
          <form onSubmit={handleLogin}>
            <p className="auth-modal__hint">
              Retrouve tes salles favorites, tes propositions et tes préférences.
            </p>
            <input
              type="email"
              required
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="auth-modal__forgot" onClick={() => switchMode(MODE_FORGOT)}>
              Mot de passe oublié ?
            </button>

            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Connexion..." : "Se connecter"}
            </button>
            <button type="button" className="auth-modal__skip" onClick={onClose}>
              Continuer sans compte →
            </button>
          </form>
        )}

        {mode === MODE_SIGNUP && !awaitingConfirmation && (
          <form onSubmit={handleSignup}>
            <p className="auth-modal__hint">
              Enregistre tes salles favorites, propose des ajouts, reçois les nouveautés de ta région.
            </p>
            <input
              type="email"
              required
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              placeholder="Confirme ton mot de passe"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <p className="auth-modal__password-hint">{PASSWORD_HINT}</p>

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
              {sending ? "Création..." : "Créer mon compte"}
            </button>
            <button type="button" className="auth-modal__skip" onClick={onClose}>
              Continuer sans compte →
            </button>
          </form>
        )}

        {mode === MODE_SIGNUP && awaitingConfirmation && (
          <div>
            <h2>Vérifie ton email</h2>
            <p className="auth-modal__hint">
              Un email de confirmation vient d'être envoyé à <strong>{email}</strong>. Ouvre-le et clique sur le lien
              pour activer ton compte, puis reviens te connecter avec ton mot de passe.
            </p>
          </div>
        )}

        {mode === MODE_FORGOT && (
          <form onSubmit={handleForgot}>
            <h2>Mot de passe oublié</h2>
            <p className="auth-modal__hint">
              Indique ton email — tu recevras un lien pour choisir un nouveau mot de passe.
            </p>
            <input
              type="email"
              required
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </button>
            <button type="button" className="auth-modal__switch" onClick={() => switchMode(MODE_LOGIN)}>
              ← Retour à la connexion
            </button>
          </form>
        )}

        {mode === MODE_FORGOT_SENT && (
          <div>
            <h2>Vérifie ton email</h2>
            <p className="auth-modal__hint">
              Un lien de réinitialisation vient d'être envoyé à <strong>{email}</strong>. Ouvre-le pour choisir un
              nouveau mot de passe.
            </p>
          </div>
        )}

        {mode === MODE_RESET_PASSWORD && (
          <form onSubmit={handleResetPassword}>
            <h2>Nouveau mot de passe</h2>
            <p className="auth-modal__hint">Choisis un nouveau mot de passe pour ton compte.</p>
            <input
              type="password"
              required
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <input
              type="password"
              required
              placeholder="Confirme le nouveau mot de passe"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            <p className="auth-modal__password-hint">{PASSWORD_HINT}</p>
            {error && <p className="auth-modal__error">{error}</p>}
            <button type="submit" className="btn btn--primary auth-modal__submit" disabled={sending}>
              {sending ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
