import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { compressImage } from "../utils/compressImage";

const MAX_PHOTOS = 6;
const PROPOSITIONS_BUCKET = "propositions";

// Vocabulaire proche de STREETLIFTING_FILTERS/FORCE_FILTERS (src/utils/filters.js)
// mais volontairement plus détaillé — ce formulaire capture tout ce qu'une
// salle veut bien préciser, sans être limité aux seuls tags actuellement
// filtrables sur la carte. Les cases cochées sont jointes en texte
// virgule, même format que les colonnes du Sheet public.
const EQUIPEMENTS_STREETLIFTING = [
  "Barres de traction",
  "Tractions lestées possibles",
  "Station de dips",
  "Station de dips réglable",
  "Dips lestés possibles",
  "Anneaux",
  "Barres parallèles",
];

const EQUIPEMENTS_FORCE = [
  "Racks à squat",
  "Cages à squat",
  "Plateformes de soulevé de terre",
  "Barres olympiques",
  "Disques calibrés",
  "Bumpers",
  "Ceintures de lest",
  "Haltères lourds",
  "Bancs solides",
];

function newId() {
  return crypto.randomUUID();
}

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

// Formulaire partagé entre "Proposer une salle" (extended=false, un
// pratiquant suggère une salle qu'il connaît) et "Référencer votre salle"
// (extended=true, la salle renseigne elle-même ses informations). Le
// comportement par défaut (props non précisées) reproduit exactement
// l'ancien formulaire "Proposer une salle" — aucune régression attendue.
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
  const [descriptionCourte, setDescriptionCourte] = useState("");
  const [equipementsStreetlifting, setEquipementsStreetlifting] = useState(new Set());
  const [equipementsForce, setEquipementsForce] = useState(new Set());
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
    setDescriptionCourte("");
    setEquipementsStreetlifting(new Set());
    setEquipementsForce(new Set());
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
        remarques: remarques.trim() || null,
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
          google_maps_url: googleMapsUrl.trim() || null,
          chaine: chaine.trim() || null,
          description_courte: descriptionCourte.trim() || null,
          equipements_streetlifting: Array.from(equipementsStreetlifting).join(", ") || null,
          equipements_force: Array.from(equipementsForce).join(", ") || null,
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

      {extended && (
        <label>
          Code postal
          <input type="text" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} />
        </label>
      )}

      {extended && (
        <label>
          Téléphone
          <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </label>
      )}

      {extended && (
        <label>
          Email de contact
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      )}

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
        <input type="text" placeholder="https://..." value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} />
      </label>

      {extended && (
        <label>
          Lien Google Maps
          <input
            type="text"
            placeholder="https://maps.app.goo.gl/..."
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
          />
        </label>
      )}

      {extended && (
        <label>
          Lien de réservation / inscription
          <input
            type="text"
            placeholder="https://..."
            value={reservationUrl}
            onChange={(e) => setReservationUrl(e.target.value)}
          />
        </label>
      )}

      {extended && (
        <label>
          Horaires
          <input
            type="text"
            placeholder="Lun–Sam, 6h–22h"
            value={horaires}
            onChange={(e) => setHoraires(e.target.value)}
          />
        </label>
      )}

      {extended && (
        <label>
          Prix à la séance (si disponible sans abonnement)
          <input type="text" placeholder="12 €" value={prixSeance} onChange={(e) => setPrixSeance(e.target.value)} />
        </label>
      )}

      {extended && (
        <label>
          Chaîne ou salle indépendante
          <input
            type="text"
            placeholder="Indépendante, Fitness Park, On Air..."
            value={chaine}
            onChange={(e) => setChaine(e.target.value)}
          />
        </label>
      )}

      {extended && (
        <label>
          Description courte de la salle
          <textarea
            rows={3}
            value={descriptionCourte}
            onChange={(e) => setDescriptionCourte(e.target.value)}
          />
        </label>
      )}

      <label>
        Remarques (équipements, ambiance, ce qui rend la salle intéressante...)
        <textarea rows={4} value={remarques} onChange={(e) => setRemarques(e.target.value)} />
      </label>

      {extended && (
        <>
          <div className="propose-form__checkbox-group">
            <span className="propose-form__checkbox-group-label">Équipements streetlifting</span>
            <div className="propose-form__checkbox-grid">
              {EQUIPEMENTS_STREETLIFTING.map((item) => (
                <label key={item} className="propose-form__checkbox">
                  <input
                    type="checkbox"
                    checked={equipementsStreetlifting.has(item)}
                    onChange={() => setEquipementsStreetlifting((s) => toggleInSet(s, item))}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="propose-form__checkbox-group">
            <span className="propose-form__checkbox-group-label">Équipements force</span>
            <div className="propose-form__checkbox-grid">
              {EQUIPEMENTS_FORCE.map((item) => (
                <label key={item} className="propose-form__checkbox">
                  <input
                    type="checkbox"
                    checked={equipementsForce.has(item)}
                    onChange={() => setEquipementsForce((s) => toggleInSet(s, item))}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="propose-form__checkbox-group">
            <span className="propose-form__checkbox-group-label">Autres informations</span>
            <div className="propose-form__checkbox-grid">
              <label className="propose-form__checkbox">
                <input
                  type="checkbox"
                  checked={magnesieAutorisee}
                  onChange={(e) => setMagnesieAutorisee(e.target.checked)}
                />
                Magnésie autorisée
              </label>
              <label className="propose-form__checkbox">
                <input
                  type="checkbox"
                  checked={filmageAutorise}
                  onChange={(e) => setFilmageAutorise(e.target.checked)}
                />
                Possibilité de filmer ses entraînements
              </label>
              <label className="propose-form__checkbox">
                <input
                  type="checkbox"
                  checked={materielCompetition}
                  onChange={(e) => setMaterielCompetition(e.target.checked)}
                />
                Matériel de compétition
              </label>
            </div>
          </div>

          <label>
            Autre matériel utile
            <input
              type="text"
              value={equipementsAutres}
              onChange={(e) => setEquipementsAutres(e.target.value)}
            />
          </label>
        </>
      )}

      <div className="propose-form__photos">
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
  );
}
