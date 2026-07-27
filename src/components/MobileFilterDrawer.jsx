import { useState } from "react";
import FilterPanel from "./FilterPanel";
import { hasActiveFilters } from "../utils/filters";

export default function MobileFilterDrawer({
  salles,
  filters,
  onFiltersChange,
  resultCount,
  onLocateMe,
  locateError,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="mobile-filter-fab" onClick={() => setOpen(true)}>
        Filtres
        {hasActiveFilters(filters) && <span className="mobile-filter-fab__dot" aria-hidden="true" />}
      </button>

      {open && (
        <div className="mobile-filter-drawer" role="dialog" aria-label="Filtres">
          <div className="mobile-filter-drawer__header">
            <h2>Filtres</h2>
            <button className="mobile-filter-drawer__close" onClick={() => setOpen(false)} aria-label="Fermer">
              ×
            </button>
          </div>
          <div className="mobile-filter-drawer__body">
            <FilterPanel
              salles={salles}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onLocateMe={onLocateMe}
              locateError={locateError}
            />
          </div>
          <div className="mobile-filter-drawer__footer">
            <button className="btn btn--primary btn--full" onClick={() => setOpen(false)}>
              Voir {resultCount} salle{resultCount > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
