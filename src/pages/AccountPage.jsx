import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fnslZones } from "../data/fnslZones";

const DELETE_EMAIL = "tailleferdsam@gmail.com";

function deleteAccountMailto(email) {
  const subject = "Demande de suppression de compte Street Map";
  const body = `Bonjour,\n\nJe souhaite supprimer mon compte Street Map associé à cette adresse : ${email}\n\n`;
  return `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = form || profile || {};

  const set = (patch) => {
    setForm({ ...current, ...patch });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: user.id,
      pseudo: current.pseudo || null,
      ville: current.ville || null,
      code_postal: current.code_postal || null,
      region_fnsl: current.region_fnsl || null,
      alertes_locales_consent: !!current.alertes_locales_consent,
      newsletter_consent: !!current.newsletter_consent,
    });
    await refreshProfile();
    setSaving(false);
    setSaved(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="account-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="account-page__content">
        <h1>Mon compte</h1>

        {loading && <p className="account-page__hint">Chargement...</p>}

        {!loading && !user && (
          <p className="account-page__hint">
            Tu n'es pas connecté. Retourne à la carte et clique sur "Se connecter" pour accéder à ton compte.
          </p>
        )}

        {!loading && user && (
          <form onSubmit={handleSave} className="account-page__form">
            <label>
              Email
              <input type="email" value={user.email} disabled />
            </label>

            <label>
              Pseudo
              <input
                type="text"
                value={current.pseudo || ""}
                onChange={(e) => set({ pseudo: e.target.value })}
                placeholder="Optionnel"
              />
            </label>

            <label>
              Ville
              <input
                type="text"
                value={current.ville || ""}
                onChange={(e) => set({ ville: e.target.value })}
                placeholder="Optionnel"
              />
            </label>

            <label>
              Code postal
              <input
                type="text"
                value={current.code_postal || ""}
                onChange={(e) => set({ code_postal: e.target.value })}
                placeholder="Optionnel"
              />
            </label>

            <label>
              Région FNSL
              <select value={current.region_fnsl || ""} onChange={(e) => set({ region_fnsl: e.target.value })}>
                <option value="">— Non renseignée —</option>
                {Object.keys(fnslZones).map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>

            <label className="account-page__checkbox">
              <input
                type="checkbox"
                checked={!!current.alertes_locales_consent}
                onChange={(e) => set({ alertes_locales_consent: e.target.checked })}
              />
              Recevoir les alertes de nouvelles salles proches de chez moi
            </label>

            <label className="account-page__checkbox">
              <input
                type="checkbox"
                checked={!!current.newsletter_consent}
                onChange={(e) => set({ newsletter_consent: e.target.checked })}
              />
              S'abonner à la newsletter Street Map / FNSL
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
              {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
            </button>

            <button type="button" className="btn btn--full account-page__signout" onClick={handleSignOut}>
              Se déconnecter
            </button>

            <a href={deleteAccountMailto(user.email)} className="account-page__delete-link">
              Demander la suppression de mon compte
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
