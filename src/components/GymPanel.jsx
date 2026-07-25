import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import GymImage from "./GymImage";

function isRealLink(url) {
  return Boolean(url) && url !== "#";
}

export default function GymPanel({ salle, onClose }) {
  if (!salle) return null;

  const directionsUrl =
    salle.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${salle.lat},${salle.lng}`;

  return (
    <div className="gym-panel" role="dialog" aria-label={`Fiche ${salle.nom}`}>
      <button className="gym-panel__close" onClick={onClose} aria-label="Fermer">
        ×
      </button>

      <GymImage
        src={salle.photoPrincipale}
        alt={salle.imageAlt}
        type={salle.imageType}
        nom={salle.nom}
        variant="preview"
      />

      <div className="gym-panel__header">
        <h2>{salle.nom}</h2>
        <StatusBadge statut={salle.statut} />
      </div>

      <p className="gym-panel__ville">{salle.ville}</p>
      {salle.adresse && <p className="gym-panel__adresse">{salle.adresse}</p>}

      {salle.description && <p className="gym-panel__description">{salle.description}</p>}

      {salle.equipements?.length > 0 && (
        <div className="gym-panel__tags">
          {salle.equipements.map((eq) => (
            <span className="tag" key={eq}>
              {eq}
            </span>
          ))}
        </div>
      )}

      {salle.niveau_pertinence && (
        <p className="gym-panel__niveau">Pertinence streetlifting : {salle.niveau_pertinence}</p>
      )}

      <div className="gym-panel__actions">
        <a className="btn btn--primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          Itinéraire
        </a>
        {isRealLink(salle.site) && (
          <a className="btn" href={salle.site} target="_blank" rel="noopener noreferrer">
            Site web
          </a>
        )}
        {isRealLink(salle.instagram) && (
          <a className="btn btn--ghost" href={salle.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        )}
        {isRealLink(salle.reservation) && (
          <a className="btn btn--ghost" href={salle.reservation} target="_blank" rel="noopener noreferrer">
            Réserver
          </a>
        )}
      </div>

      <Link to={`/salles/${salle.slug}`} className="btn btn--full gym-panel__detail-link">
        Voir la fiche complète →
      </Link>

      <p className="gym-panel__disclaimer">
        Informations non garanties par la FNSL Sud Est — susceptibles d'évoluer, à vérifier avant de vous déplacer.
      </p>
    </div>
  );
}
