import StatusBadge from "./StatusBadge";
import GymImage from "./GymImage";

// Carte-résultat de la liste (panneau desktop 420px ou bottom sheet mobile) —
// deux tailles pilotées par `compact` (vignette 74px) vs la taille par
// défaut (vignette 96px), même contenu dans les deux cas.
export default function GymResultCard({ salle, distance, active, compact, onClick, onMouseEnter, onMouseLeave }) {
  const equipmentLine = salle.equipements?.slice(0, 3).join(" · ");

  return (
    <button
      type="button"
      className={`result-card ${compact ? "result-card--compact" : ""} ${active ? "result-card--active" : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <GymImage
        src={salle.photoPrincipale}
        alt={salle.imageAlt}
        type={salle.imageType}
        nom={salle.nom}
        variant="thumb"
      />
      <div className="result-card__body">
        <div className="result-card__top">
          <StatusBadge statut={salle.statut} />
          {distance && <span className="result-card__distance">{distance}</span>}
        </div>
        <div className="result-card__name">{salle.nom}</div>
        <div className="result-card__meta">
          {salle.ville}
          {salle.niveau_pertinence ? ` · ${salle.niveau_pertinence}` : ""}
        </div>
        {equipmentLine && <div className="result-card__equipment">{equipmentLine}</div>}
      </div>
    </button>
  );
}
