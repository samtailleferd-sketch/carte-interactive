import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { compressImage } from "../utils/compressImage";

const MAX_PHOTOS = 6;
const PROPOSITIONS_BUCKET = "propositions";

function newId() {
  return crypto.randomUUID();
}

export default function ProposeSallePage() {
  const { user } = useAuth();
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [instagram, setInstagram] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [remarques, setRemarques] = useState("");
  const [photos, setPhotos] = useState([]); // [{ id, file, previewUrl }]
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    for (const file of files) {
      try {
        const compressed = await compressImage(file, `${newId()}.jpg`);
        setPhotos((prev) => [...prev, { id: newId(), file: compressed, previewUrl: URL.createObjectURL(compressed) }]);
      } catch {
        // Une photo illisible ne doit pas bloquer les autres — on l'ignore simplement.
      }
    }
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !ville.trim()) {
      setError("Le nom de la salle et la ville sont obligatoires.");
      return;
    }
    if (!supabase) {
      setError("L'envoi n'est pas disponible pour le moment — réessaie plus tard.");
      return;
    }

    setError("");
    setSubmitting(true);

    const propositionId = newId();

    try {
      for (const photo of photos) {
        const { error: uploadErr } = await supabase.storage
          .from(PROPOSITIONS_BUCKET)
          .upload(`${propositionId}/${photo.file.name}`, photo.file, { contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
      }

      const { error: insertErr } = await supabase.from("salle_propositions").insert({
        id: propositionId,
        nom: nom.trim(),
        ville: ville.trim(),
        adresse: adresse.trim() || null,
        instagram: instagram.trim() || null,
        site_web: siteWeb.trim() || null,
        remarques: remarques.trim() || null,
        submitted_by: user?.id || null,
      });
      if (insertErr) throw insertErr;

      setSubmitted(true);
    } catch (err) {
      setError(`Envoi impossible : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Un formulaire HTML soumet dès qu'on appuie sur Entrée dans un champ
  // texte, même si tout n'est pas encore rempli — on bloque ça partout sauf
  // dans le textarea (où Entrée doit rester un retour à la ligne normal) et
  // sur le bouton d'envoi lui-même, seul déclencheur voulu.
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.type !== "submit") {
      e.preventDefault();
    }
  };

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

        {submitted ? (
          <div className="propose-page__confirmation">
            <h2>Merci pour ta contribution !</h2>
            <p>
              Ta proposition a bien été envoyée à la FNSL Sud Est pour vérification. Elle n'apparaîtra sur la carte
              qu'une fois validée.
            </p>
            <Link to="/" className="btn btn--primary">
              ← Retour à la carte
            </Link>
          </div>
        ) : (
          <>
            <div className="propose-page__intro">
              <p>
                Cette carte recense, partout en France, les salles qui offrent un vrai terrain d'entraînement pour le
                streetlifting et les sports de force. Si tu connais une salle qui n'est pas encore référencée,
                remplis ce formulaire le plus précisément possible — chaque contribution aide à faire grandir la
                carte.
              </p>
            </div>

            <form className="propose-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
              <label>
                Nom de la salle *
                <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)} />
              </label>

              <label>
                Ville *
                <input type="text" required value={ville} onChange={(e) => setVille(e.target.value)} />
              </label>

              <label>
                Adresse
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
              </label>

              <label>
                Instagram
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </label>

              <label>
                Site web
                <input
                  type="text"
                  placeholder="https://..."
                  value={siteWeb}
                  onChange={(e) => setSiteWeb(e.target.value)}
                />
              </label>

              <label>
                Remarques (équipements, ambiance, ce qui rend la salle intéressante...)
                <textarea rows={4} value={remarques} onChange={(e) => setRemarques(e.target.value)} />
              </label>

              <div className="propose-form__photos">
                <span className="propose-form__photos-label">Photos ({photos.length}/{MAX_PHOTOS})</span>
                <div className="propose-form__photos-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className="propose-form__photo">
                      <img src={photo.previewUrl} alt="" />
                      <button
                        type="button"
                        className="propose-form__photo-remove"
                        onClick={() => removePhoto(photo.id)}
                        aria-label="Retirer cette photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="propose-form__photo-add">
                      + Ajouter des photos
                      <input type="file" accept="image/*" multiple hidden onChange={handleAddPhotos} />
                    </label>
                  )}
                </div>
              </div>

              {error && <p className="propose-form__error">{error}</p>}

              <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
                {submitting ? "Envoi..." : "Envoyer la proposition"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
