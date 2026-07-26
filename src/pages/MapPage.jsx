import { useEffect, useMemo, useState } from "react";
import GymMap from "../components/GymMap";
import GymPanel from "../components/GymPanel";
import BetaBanner from "../components/BetaBanner";
import ZonesLegend from "../components/ZonesLegend";
import FilterSidebar from "../components/FilterSidebar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import { emptyFilters, matchesFilters } from "../utils/filters";

export default function MapPage({ salles, loading, selectedId, onSelect, mapView, onMapViewChange }) {
  const [filters, setFilters] = useState(emptyFilters());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const filtered = useMemo(() => salles.filter((s) => matchesFilters(s, filters)), [salles, filters]);

  const selectedSalle = salles.find((s) => s.id === selectedId) || null;

  // Si la salle sélectionnée sort du résultat filtré, on ferme la fiche
  // plutôt que de laisser une fiche ouverte pour une salle devenue invisible.
  useEffect(() => {
    if (selectedId && !filtered.some((s) => s.id === selectedId)) {
      onSelect(null);
    }
  }, [filtered, selectedId, onSelect]);

  return (
    <div className="app">
      <BetaBanner />

      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">FNSL</span>
          <span className="app__brand-sub">Sud Est</span>
        </div>
        <label className="app__zones-toggle">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
          />
          Zones FNSL
        </label>
      </header>

      <main className="app__body">
        <FilterSidebar
          salles={salles}
          filters={filters}
          onFiltersChange={setFilters}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />

        <div className="map-area">
          <GymMap
            salles={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
            showZones={showZones}
            initialView={mapView}
            onViewChange={onMapViewChange}
          />

          {showZones && !selectedSalle && <ZonesLegend />}

          {selectedSalle && <GymPanel salle={selectedSalle} onClose={() => onSelect(null)} />}

          <MobileFilterDrawer
            salles={salles}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filtered.length}
          />

          {!selectedSalle && !loading && filtered.length > 0 && (
            <p className="app__hint">
              {filtered.length} salle{filtered.length > 1 ? "s" : ""} affichée
              {filtered.length > 1 ? "s" : ""} — cliquez sur un point de la carte
            </p>
          )}

          {!selectedSalle && !loading && filtered.length === 0 && (
            <p className="app__hint app__hint--empty">
              Aucune salle ne correspond à ces filtres.{" "}
              <button className="app__hint-reset" onClick={() => setFilters(emptyFilters())}>
                Réinitialiser les filtres
              </button>
            </p>
          )}

          {loading && <p className="app__hint">Chargement des salles...</p>}
        </div>
      </main>
    </div>
  );
}
