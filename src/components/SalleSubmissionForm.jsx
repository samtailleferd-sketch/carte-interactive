import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { compressImage } from "../utils/compressImage";
import { STREETLIFTING_FILTERS, FORCE_FILTERS } from "../utils/filters";

const MAX_PHOTOS = 10;
const PROPOSITIONS_BUCKET = "propositions";

// Même vocabulaire que les filtres de la carte et le badge des fiches salle —
// un seul tableau source, importé partout (voir 04-MODELE-DONNEES.md).
const EQUIPEMENTS = [...FORCE_FILTERS, ...STREETLIFTING_FILTERS].map((f) => f.label);

function newId() {
  return crypto.randomUUID();
}

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FormBlock({ number, title, children }) {
  return (
    <div className="form-block">
      <div className="form-block__head">
        <span className="form-block__number">{number}</span>
        <h2 className="form-block__title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// Formulaire partagé entre "Proposer une salle" (extended=false, un
// pratiquant suggère une salle qu'il connaît) et "Référencer votre salle"
// (extended=true, la salle renseigne elle-même ses informations).
export default function SalleSubmissionForm({
  source = "utilisateur",
  extended = false,
  confirmationTitle = "Merci pour ta contribution !",
  confirmationText = "Ta proposition a bien été envoyée à la FNSL Sud Est pour vérification. Elle n'apparaîtra sur la carte qu'une fois validée.",
  showBackToMap = true,
  showResendButton = false,
  // Contenu affiché au-dessus du formulaire (intro), masqué une fois
  // soumis — comme l'intro n'a plus lieu d'être une fois la confirmation
  // affichée.
  children,
}) {
  const { user } = useAuth();
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [adresse, setAdresse] = useState("");
  const [instagram, setInstagram] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [remarques, setRemarques] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [horaires, setHoraires] = useState("");
  const [prixSeance, setPrixSeance] = useState("");
  const [reservationUrl, setReservationUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [chaine, setChaine] = useState("");
  const [equipements, setEquipements] = useState(new Set());
  const [magnesieAutorisee, setMagnesieAutorisee] = useState(false);
  const [filmageAutorise, setFilmageAutorise] = useState(false);
  const [materielCompetition, setMaterielCompetition] = useState(false);
  const [equipementsAutres, setEquipementsAutres] = useState("");
  const [photos, setPhotos] = useState([]); // [{ id, file, previewUrl }]
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setNom("");
    setVille("");
    setAdresse("");
    setInstagram("");
    setSiteWeb("");
    setRemarques("");
    setCodePostal("");
    setTelephone("");
    setEmail("");
    setHoraires("");
    setPrixSeance("");
    setReservationUrl("");
    setGoogleMapsUrl("");
    setChaine("");
    setEquipements(new Set());
    setMagnesieAutorisee(false);
    setFilmageAutorise(false);
    setMaterielCompetition(false);
    setEquipementsAutres("");
    setPhotos([]);
    setError("");
    setSubmitted(false);
  };

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
    const equipementsList = Array.from(equipements);
    const equipementsStreetlifting = equipementsList.filter((label) =>
      STREETLIFTING_FILTERS.some((f) => f.label === label)
    );
    const equipementsForce = equipementsList.filter((label) => FORCE_FILTERS.some((f) => f.label === label));

    try {
      for (const photo of photos) {
        const { error: uploadErr } = await supabase.storage
          .from(PROPOSITIONS_BUCKET)
          .upload(`${propositionId}/${photo.file.name}`, photo.file, { contentType: "image/jpeg" });
        if (uploadErr) throw uploadErr;
      }

      const payload = {
        id: propositionId,
        nom: nom.trim(),
        ville: ville.trim(),
        adresse: adresse.trim() || null,
        instagram: instagram.trim() || null,
        site_web: siteWeb.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
        equipements_streetlifting: equipementsStreetlifting.join(", ") || null,
        equipements_force: equipementsForce.join(", ") || null,
        remarques: remarques.trim() || null,
        email: !extended ? email.trim() || null : undefined,
        submitted_by: user?.id || null,
        source,
      };

      if (extended) {
        Object.assign(payload, {
          code_postal: codePostal.trim() || null,
          telephone: telephone.trim() || null,
          email: email.trim() || null,
          horaires: horaires.trim() || null,
          prix_seance: prixSeance.trim() || null,
          reservation_url: reservationUrl.trim() || null,
          chaine: chaine.trim() || null,
          magnesie_autorisee: magnesieAutorisee,
          filmage_autorise: filmageAutorise,
          materiel_competition: materielCompetition,
          equipements_autres: equipementsAutres.trim() || null,
        });
      }

      const { error: insertErr } = await supabase.from("salle_propositions").insert(payload);
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
  // dans un textarea (où Entrée doit rester un retour à la ligne normal) et
  // sur le bouton d'envoi lui-même, seul déclencheur voulu.
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.type !== "submit") {
      e.preventDefault();
    }
  };

  if (submitted) {
    return (
      <div className="propose-page__confirmation">
        <h2>{confirmationTitle}</h2>
        <p>{confirmationText}</p>
        <div className="propose-page__confirmation-actions">
          {showResendButton && (
            <button type="button" className="btn btn--primary" onClick={resetForm}>
              Envoyer une autre salle
            </button>
          )}
          {showBackToMap && (
            <Link to="/" className="btn btn--primary">
              ← Retour à la carte
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      <div className="form-banner">
        <span className="form-banner__icon" aria-hidden="true">
          i
        </span>
        La salle sera vérifiée par la FNSL Sud Est avant publication.
      </div>

      <form className="propose-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <FormBlock number={1} title="La salle">
          <label>
            Nom de la salle *
            <input type="text" required placeholder="ex. Force Club Marseille" value={nom} onChange={(e) => setNom(e.target.value)} />
          </label>

          <div className="form-row">
            <label>
              Ville *
              <input type="text" required placeholder="ex. Marseille" value={ville} onChange={(e) => setVille(e.target.value)} />
            </label>
            <label>
              Adresse{extended ? " *" : ""}
              <input
                type="text"
                required={extended}
                placeholder="Numéro, rue, code postal"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </label>
          </div>

          {extended && (
            <div className="form-row">
              <label>
                Code postal *
                <input type="text" required value={codePostal} onChange={(e) => setCodePostal(e.target.value)} />
              </label>
              <label>
                Chaîne ou salle indépendante *
                <input
                  type="text"
                  required
                  placeholder="Indépendante, Fitness Park, On Air..."
                  value={chaine}
                  onChange={(e) => setChaine(e.target.value)}
                />
              </label>
            </div>
          )}

          <label>
            Lien Google Maps
            <input
              type="text"
              placeholder="https://maps.google.com/…"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
            />
          </label>
        </FormBlock>

        <FormBlock number={2} title="Liens">
          {extended && (
            <div className="form-row">
              <label>
                Téléphone *
                <input type="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </label>
              <label>
                Email de contact *
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
          )}

          <div className="form-row">
            <label>
              Instagram{extended ? " *" : ""}
              <input
                type="text"
                required={extended}
                placeholder="@nomducompte"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </label>
            <label>
              Site web{extended ? " *" : ""}
              <input
                type="text"
                required={extended}
                placeholder="https://..."
                value={siteWeb}
                onChange={(e) => setSiteWeb(e.target.value)}
              />
            </label>
          </div>

          {extended && (
            <label>
              Lien de réservation / inscription *
              <input
                type="text"
                required
                placeholder="https://..."
                value={reservationUrl}
                onChange={(e) => setReservationUrl(e.target.value)}
              />
            </label>
          )}
        </FormBlock>

        <FormBlock number={3} title="Équipements disponibles">
          <div className="option-pill-grid">
            {EQUIPEMENTS.map((item) => (
              <button
                key={item}
                type="button"
                className={`option-pill ${equipements.has(item) ? "option-pill--selected" : ""}`}
                onClick={() => setEquipements((s) => toggleInSet(s, item))}
                aria-pressed={equipements.has(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {extended && (
            <>
              <div className="form-row">
                <label>
                  Horaires *
                  <input
                    type="text"
                    required
                    placeholder="Lun–Sam, 6h–22h"
                    value={horaires}
                    onChange={(e) => setHoraires(e.target.value)}
                  />
                </label>
                <label>
                  Prix à la séance (si disponible sans abonnement)
                  <input type="text" placeholder="12 €" value={prixSeance} onChange={(e) => setPrixSeance(e.target.value)} />
                </label>
              </div>

              <div className="option-pill-grid">
                <button
                  type="button"
                  className={`option-pill ${magnesieAutorisee ? "option-pill--selected" : ""}`}
                  onClick={() => setMagnesieAutorisee((v) => !v)}
                  aria-pressed={magnesieAutorisee}
                >
                  Magnésie autorisée
                </button>
                <button
                  type="button"
                  className={`option-pill ${filmageAutorise ? "option-pill--selected" : ""}`}
                  onClick={() => setFilmageAutorise((v) => !v)}
                  aria-pressed={filmageAutorise}
                >
                  Filmage autorisé
                </button>
                <button
                  type="button"
                  className={`option-pill ${materielCompetition ? "option-pill--selected" : ""}`}
                  onClick={() => setMaterielCompetition((v) => !v)}
                  aria-pressed={materielCompetition}
                >
                  Matériel de compétition
                </button>
              </div>

              <label>
                Autre matériel utile
                <input type="text" value={equipementsAutres} onChange={(e) => setEquipementsAutres(e.target.value)} />
              </label>
            </>
          )}
        </FormBlock>

        <FormBlock number={4} title="Photos et remarques">
          {extended && (
            <p className="propose-form__photos-consent">
              En envoyant des photos, vous confirmez disposer des droits nécessaires pour les partager ou représenter
              la salle concernée.
            </p>
          )}
          <span className="propose-form__photos-label">
            Photos ({photos.length}/{MAX_PHOTOS})
          </span>
          <div className="propose-form__photos-grid">
            <label className="propose-form__photo-add">
              <span className="propose-form__photo-add-plus" aria-hidden="true">
                +
              </span>
              Photo
              <input type="file" accept="image/*" multiple hidden onChange={handleAddPhotos} disabled={photos.length >= MAX_PHOTOS} />
            </label>
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
          </div>

          <label>
            {extended
              ? "Description ou remarques supplémentaires (équipements, ambiance, tout ce qui peut être intéressant à ajouter)"
              : "Remarques (équipements, ambiance, ce qui rend la salle intéressante...)"}
            <textarea rows={4} value={remarques} onChange={(e) => setRemarques(e.target.value)} />
          </label>

          {!extended && (
            <label>
              Email (facultatif, si on a besoin de préciser)
              <input type="email" placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
        </FormBlock>

        {error && <p className="propose-form__error">{error}</p>}

        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer la proposition"}
        </button>
        <p className="propose-form__submit-hint">Cette salle sera vérifiée avant d'apparaître sur la carte.</p>
      </form>
    </>
  );
}
