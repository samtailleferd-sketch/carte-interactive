import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { supabase } from "../lib/supabaseClient";
import { fnslZones } from "../data/fnslZones";
import { compressImage } from "../utils/compressImage";
import { fetchSalles } from "../data/fetchSalles";
import GymResultCard from "../components/GymResultCard";
import Toggle from "../components/Toggle";
import AuthModal from "../components/AuthModal";
import {
  isPushSupported,
  isRunningAsInstalledApp,
  isIOS,
  subscribeToPush,
  unsubscribeFromPush,
} from "../utils/pushNotifications";

const DELETE_EMAIL = "tailleferdsam@gmail.com";
const AVATAR_BUCKET = "avatars";

const PROPOSITION_STATUT_LABEL = {
  en_attente: "En attente de vérification",
  publiee: "Publiée",
  rejetee: "Non retenue",
};

function deleteAccountMailto(email) {
  const subject = "Demande de suppression de compte Street Map";
  const body = `Bonjour,\n\nJe souhaite supprimer mon compte Street Map associé à cette adresse : ${email}\n\n`;
  return `mailto:${DELETE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function memberSince(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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
  const [propositions, setPropositions] = useState([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchSalles().then(setSalles);
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from("salle_propositions")
      .select("id, nom, ville, statut, created_at")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPropositions(data || []));
  }, [user]);

  useEffect(() => {
    if (!user || !isPushSupported()) return;
    navigator.serviceWorker.getRegistration().then(async (registration) => {
      const subscription = await registration?.pushManager.getSubscription();
      setPushSubscribed(!!subscription);
    });
  }, [user]);

  const handleTogglePush = async (checked) => {
    setPushError("");
    setPushBusy(true);
    try {
      if (checked) {
        await subscribeToPush(user.id);
      } else {
        await unsubscribeFromPush();
      }
      setPushSubscribed(checked);
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

  const pushToggleVisible = isPushSupported() && (!isIOS() || isRunningAsInstalledApp());

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
        {loading && <p className="account-page__hint">Chargement...</p>}

        {!loading && !user && (
          <div className="account-page__hint">
            <p>Connecte-toi pour enregistrer tes favoris, suivre tes propositions et gérer tes préférences.</p>
            <button type="button" className="btn btn--primary" onClick={() => setShowAuthModal(true)}>
              Se connecter
            </button>
          </div>
        )}

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

        {!loading && user && (
          <>
            <div className="account-card account-card--profile">
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
              <div className="account-card--profile__info">
                <h1>{current.prenom ? `${current.prenom} ${current.nom || ""}`.trim() : user.email}</h1>
                <p>
                  {[memberSince(user.created_at) && `Membre depuis ${memberSince(user.created_at)}`, current.region_fnsl]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="account-card--profile__counters">
                <div>
                  <div className="account-card--profile__counter-value">{favoriteSalles.length}</div>
                  <div className="account-card--profile__counter-label">Favoris</div>
                </div>
                <div>
                  <div className="account-card--profile__counter-value">{propositions.length}</div>
                  <div className="account-card--profile__counter-label">Proposition{propositions.length > 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>

            {uploadError && <p className="auth-modal__error">{uploadError}</p>}

            <form onSubmit={handleSave} className="account-card">
              <h2>Informations</h2>
              <div className="account-page__form">
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
                  Région FNSL suivie
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

                <button type="submit" className="btn btn--primary" disabled={saving} style={{ alignSelf: "flex-start" }}>
                  {saving ? "Enregistrement..." : saved ? "Enregistré ✓" : "Enregistrer"}
                </button>
              </div>
            </form>

            <div className="account-card">
              <h2>Préférences</h2>
              <div className="account-page__toggles">
                <Toggle
                  checked={!!current.alertes_locales_consent}
                  onChange={(v) => set({ alertes_locales_consent: v })}
                  label="Recevoir un email quand une nouvelle salle est publiée dans ma région FNSL"
                />

                {isPushSupported() && isIOS() && !isRunningAsInstalledApp() && (
                  <p className="account-page__hint">
                    Pour recevoir des notifications push, installe d'abord Street Map sur ton écran d'accueil
                    (Safari → icône de partage → "Sur l'écran d'accueil").
                  </p>
                )}

                {pushToggleVisible && (
                  <Toggle
                    checked={pushSubscribed}
                    onChange={handleTogglePush}
                    label="Recevoir une notification push pour les nouvelles salles de ma région"
                  />
                )}
                {pushBusy && <p className="account-page__hint">Mise à jour...</p>}
                {pushError && <p className="auth-modal__error">{pushError}</p>}

                <Toggle
                  checked={!!current.newsletter_consent}
                  onChange={(v) => set({ newsletter_consent: v })}
                  label="Recevoir la newsletter Street Map / FNSL Sud Est"
                />
              </div>
            </div>

            <div className="account-card">
              <div className="account-card__head">
                <h2>Salles favorites</h2>
                <span className="account-card__count">{favoriteSalles.length}</span>
              </div>
              {favoriteSalles.length === 0 ? (
                <p className="account-page__hint">
                  Aucune salle favorite pour l'instant — clique sur le cœur d'une fiche pour l'ajouter ici.
                </p>
              ) : (
                <div className="account-page__favorites-list">
                  {favoriteSalles.map((salle) => (
                    <div className="account-favorite-row" key={salle.id}>
                      <GymResultCard salle={salle} compact onClick={() => window.location.assign(`#/salles/${salle.slug}`)} />
                      <button
                        type="button"
                        onClick={() => toggleFavorite(salle.id)}
                        aria-label="Retirer des favoris"
                        className="account-favorite-row__remove"
                      >
                        ♥
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="account-card account-card--propositions">
              <div className="account-card__head">
                <h2>Mes propositions</h2>
              </div>
              {propositions.length === 0 ? (
                <p className="account-page__hint">Tu n'as pas encore proposé de salle.</p>
              ) : (
                <p className="account-page__hint">
                  {propositions.length} salle{propositions.length > 1 ? "s" : ""} proposée
                  {propositions.length > 1 ? "s" : ""} —{" "}
                  {propositions.filter((p) => p.statut === "en_attente").length} en attente de vérification.
                </p>
              )}
              {propositions.length > 0 && (
                <ul className="account-propositions-list">
                  {propositions.map((p) => (
                    <li key={p.id} className="account-propositions-item">
                      <span>{p.nom || "Salle sans nom"}</span>
                      <span className="account-propositions-item__statut">
                        {PROPOSITION_STATUT_LABEL[p.statut] || "En attente de vérification"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <a href={deleteAccountMailto(user.email)} className="account-page__delete-link">
              Demander la suppression de mon compte
            </a>

            <button type="button" className="account-page__signout" onClick={handleSignOut}>
              Se déconnecter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
