import FilterPanel from "./FilterPanel";

export default function FilterSidebar({
  salles,
  filters,
  onFiltersChange,
  collapsed,
  onToggleCollapsed,
  onLocateMe,
  locateError,
}) {
  return (
    <aside className={`filter-sidebar ${collapsed ? "filter-sidebar--collapsed" : ""}`}>
      <button
        className="filter-sidebar__toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Déplier les filtres" : "Replier les filtres"}
        aria-expanded={!collapsed}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <span className="filter-sidebar__rail-label">Filtres</span>
      ) : (
        <div className="filter-sidebar__content">
          <h2 className="filter-sidebar__title">Filtres</h2>
          <FilterPanel
            salles={salles}
            filters={filters}
            onFiltersChange={onFiltersChange}
            onLocateMe={onLocateMe}
            locateError={locateError}
          />
        </div>
      )}
    </aside>
  );
}
