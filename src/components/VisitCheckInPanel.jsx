import { useState } from "react";
import { Link } from "react-router-dom";
import GymResultCard from "./GymResultCard";
import { normalize } from "../utils/filters";
import { useGeoCheckIn } from "../hooks/useGeoCheckIn";

const MAX_RESULTS = 8;
const MIN_QUERY_LENGTH = 2;

// Panneau inline (pas une page, pas une modale) pour marquer une salle
// visitée depuis le profil sans passer par sa fiche complète : recherche,
// sélection, puis même vérification géolocalisée que sur la fiche salle
// (voir useGeoCheckIn.js) avant de valider.
export default function VisitCheckInPanel({ salles, visited, checkIn, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { checkingIn, message, attemptCheckIn } = useGeoCheckIn(checkIn);

  const q = normalize(query);
  const results = q
    ? salles.filter((s) => !visited.has(s.id) && normalize(`${s.nom} ${s.ville}`).includes(q)).slice(0, MAX_RESULTS)
    : [];
  const selected = salles.find((s) => s.id === selectedId) || null;
  const noResults = q.length >= MIN_QUERY_LENGTH && results.length === 0;

  const handleValidate = async () => {
    if (!selected) return;
    const success = await attemptCheckIn(selected);
    if (success) onClose();
  };

  if (checkingIn) {
    return (
      <div className="checkin-panel">
        <div className="checkin-panel__loading">
          <span className="checkin-panel__spinner" aria-hidden="true" />
          <p>Localisation en cours pour vérifier ta présence…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-panel">
      <input
        type="text"
        className="checkin-panel__search"
        placeholder="Nom de la salle ou ville…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId(null);
        }}
        autoFocus
      />

      {results.length > 0 && (
        <div className="checkin-panel__results">
          {results.map((salle) => (
            <GymResultCard
              key={salle.id}
              salle={salle}
              compact
              active={salle.id === selectedId}
              onClick={() => setSelectedId(salle.id)}
            />
          ))}
        </div>
      )}

      {noResults && (
        <div className="checkin-panel__empty">
          <p>Aucune salle trouvée pour "{query}".</p>
          <Link to="/proposer" className="btn btn--primary">
            Proposer une salle
          </Link>
        </div>
      )}

      {message && <p className="detail-checkin-message">{message}</p>}

      <div className="checkin-panel__footer">
        <button type="button" className="btn" onClick={onClose}>
          Annuler
        </button>
        <button type="button" className="btn btn--primary" disabled={!selected} onClick={handleValidate}>
          Valider ma visite
        </button>
      </div>
    </div>
  );
}
