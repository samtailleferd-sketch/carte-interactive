import FilterPanel from "./FilterPanel";
import { emptyFilters, hasActiveFilters } from "../utils/filters";

// Panneau de filtres — même composant sur desktop (420px ancré à gauche,
// carte visible à droite) et mobile (plein écran), ouvert depuis la pastille
// « Filtres · n » plutôt que d'être une sidebar en permanence affichée.
export default function FilterOverlay({
  salles,
  filters,
  onFiltersChange,
  onClose,
  resultCount,
  onLocateMe,
  locateError,
  favoritesCount,
  userLocation,
}) {
  return (
    <div className="filter-overlay" role="dialog" aria-label="Filtres">
      <div className="filter-overlay__panel">
        <div className="filter-overlay__header">
          <h2>Filtres</h2>
          <button
            type="button"
            className="filter-overlay__clear"
            onClick={() => onFiltersChange(emptyFilters())}
            disabled={!hasActiveFilters(filters)}
          >
            Tout effacer
          </button>
          <button className="filter-overlay__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="filter-overlay__body">
          <FilterPanel
            salles={salles}
            filters={filters}
            onFiltersChange={onFiltersChange}
            onLocateMe={onLocateMe}
            locateError={locateError}
            favoritesCount={favoritesCount}
            userLocation={userLocation}
          />
        </div>
        <div className="filter-overlay__footer">
          <button className="btn btn--primary btn--full" onClick={onClose}>
            Voir {resultCount} salle{resultCount > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
