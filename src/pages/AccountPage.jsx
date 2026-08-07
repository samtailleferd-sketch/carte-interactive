import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { supabase } from "../lib/supabaseClient";
import { fnslZones } from "../data/fnslZones";
import { compressImage } from "../utils/compressImage";
import { fetchSalles } from "../data/fetchSalles";
import {
  isPushSupported,
  isRunningAsInstalledApp,
  isIOS,
  subscribeToPush,
  unsubscribeFromPush,
} from "../utils/pushNotifications";

const DELETE_EMAIL = "tailleferdsam@gmail.com";
const AVATAR_BUCKET = "avatars";

function deleteAccountMailto(email) {
  const subject = "Demande de suppression de compte Street Map";
  const body = `Bonjour,\n\nJe souhaite supprimer mon compte Street Map associé à cette adresse : ${email}\n\n`;
  return `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [salles, setSalles] = useState([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    fetchSalles().then(setSalles);
  }, []);

  useEffect(() => {
    if (!user || !isPushSupported()) return;
    navigator.serviceWorker.getRegistration().then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      setPushSubscribed(!!subscription);
    });
  }, [user]);

  const handleTogglePush = async (e) => {
    const wantsSubscribed = e.target.checked;
    setPushError("");
    setPushBusy(true);
    try {
      if (wantsSubscribed) {
        await subscribeToPush(user.id);
      } else {
        await unsubscribeFromPush();
      }
      setPushSubscribed(wantsSubscribed);
    } catch (err) {
      setPushError(
        err?.name === "NotAllowedError"
          ? "Notifications refusées — active-les dans les réglages de ton navigateur/téléphone pour ce site."
          : `Impossible d'activer les notifications : ${err.message}`
      );
    } finally {
      setPushBusy(false);
    }
  };

  const current = form || profile || {};
  const favoriteSalles = salles.filter((s) => favorites.has(s.id));

  const set = (patch) => {
    setForm({ ...current, ...patch });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").upsert({
      id: user.id,
      nom: current.nom || null,
      prenom: current.prenom || null,
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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);

    let compressed;
    try {
      // Toujours réduite à 800px max et réencodée en JPEG — une photo de
      // téléphone de plusieurs dizaines de Mo devient quelques centaines de Ko.
      compressed = await compressImage(file);
    } catch {
      setUploading(false);
      setUploadError("Cette image n'a pas pu être traitée — essaie un autre fichier.");
      return;
    }

    const path = `${user.id}/avatar.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });

    if (uploadErr) {
      setUploading(false);
      setUploadError(`Envoi impossible : ${uploadErr.message}`);
      return;
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    // Paramètre pour forcer le rafraîchissement de l'aperçu (même chemin de
    // fichier à chaque envoi, sinon le navigateur garde l'ancienne image en cache).
    const photoUrl = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ id: user.id, photo_url: photoUrl });
    await refreshProfile();
    setUploading(false);
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
          <>
            <div className="account-page__avatar-row">
              <div className="account-page__avatar-wrap">
                {current.photo_url ? (
                  <img src={current.photo_url} alt="Photo de profil" className="account-page__avatar" />
                ) : (
                  <div className="account-page__avatar account-page__avatar--placeholder" aria-hidden="true">
                    {(current.prenom?.[0] || user.email[0]).toUpperCase()}
                  </div>
                )}
                <label
                  className="account-page__avatar-edit"
                  aria-label={uploading ? "Envoi en cours" : "Changer la photo"}
                >
                  {uploading ? "…" : "✎"}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} hidden disabled={uploading} />
                </label>
              </div>
            </div>
            {uploadError && <p className="auth-modal__error">{uploadError}</p>}

            <form onSubmit={handleSave} className="account-page__form">
              <label>
                Email
                <input type="email" value={user.email} disabled />
              </label>

              <label>
                Prénom
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={current.prenom || ""}
                  onChange={(e) => set({ prenom: e.target.value })}
                />
              </label>

              <label>
                Nom
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={current.nom || ""}
                  onChange={(e) => set({ nom: e.target.value })}
                />
              </label>

              <label>
                Ville
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={current.ville || ""}
                  onChange={(e) => set({ ville: e.target.value })}
                />
              </label>

              <label>
                Code postal
                <input
                  type="text"
                  autoComplete="off"
                  required
                  value={current.code_postal || ""}
                  onChange={(e) => set({ code_postal: e.target.value })}
                />
              </label>

              <label>
                Région FNSL
                <select
                  required
                  value={current.region_fnsl || ""}
                  onChange={(e) => set({ region_fnsl: e.target.value })}
                >
                  <option value="" disabled>
                    Choisis ta région
                  </option>
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
                Recevoir un email quand une nouvelle salle est publiée dans ma région FNSL
              </label>

              {isPushSupported() && isIOS() && !isRunningAsInstalledApp() && (
                <p className="account-page__hint">
                  Pour recevoir des notifications push, installe d'abord Street Map sur ton écran d'accueil
                  (Safari → icône de partage → "Sur l'écran d'accueil").
                </p>
              )}

              {isPushSupported() && (!isIOS() || isRunningAsInstalledApp()) && (
                <label className="account-page__checkbox">
                  <input
                    type="checkbox"
                    checked={pushSubscribed}
                    disabled={pushBusy}
                    onChange={handleTogglePush}
                  />
                  Recevoir une notification push quand une nouvelle salle est publiée dans ma région FNSL
                </label>
              )}
              {pushError && <p className="auth-modal__error">{pushError}</p>}

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

            <section className="account-page__favorites">
              <h2>Salles favorites</h2>
              {favoriteSalles.length === 0 ? (
                <p className="account-page__hint">
                  Aucune salle favorite pour l'instant — clique sur le cœur d'une fiche pour l'ajouter ici.
                </p>
              ) : (
                <ul className="account-page__favorites-list">
                  {favoriteSalles.map((salle) => (
                    <li key={salle.id} className="account-page__favorites-item">
                      <Link to={`/salles/${salle.slug}`}>
                        {salle.nom} <span>— {salle.ville}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(salle.id)}
                        aria-label="Retirer des favoris"
                        className="account-page__favorites-remove"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
