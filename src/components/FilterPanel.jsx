import { useState } from "react";
import { Link } from "react-router-dom";
import Toggle from "./Toggle";
import {
  STREETLIFTING_FILTERS,
  FORCE_FILTERS,
  STATUT_FILTERS,
  NIVEAU_FILTERS,
  PRATIQUE_FILTERS,
  countByStatut,
} from "../utils/filters";
import { VARIANT_COLORS } from "../statusStyle";

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function PillGroup({ title, options, selected, onToggle }) {
  if (options.length === 0) return null;
  return (
    <div className="filter-group filter-group--pills">
      <h3 className="filter-group__title filter-group__title--static">{title}</h3>
      <div className="option-pill-grid">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`option-pill ${selected.has(opt.key) ? "option-pill--selected" : ""}`}
            onClick={() => onToggle(opt.key)}
            aria-pressed={selected.has(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterPanel({
  salles,
  filters,
  onFiltersChange,
  onLocateMe,
  locateError,
  favoritesCount,
  userLocation,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const set = (patch) => onFiltersChange({ ...filters, ...patch });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const chaineOptions = Array.from(new Set(salles.map((s) => s.chaine)))
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((chaine) => ({ key: chaine, label: chaine }));

  const activeTags = [];
  if (filters.query.trim()) {
    activeTags.push({ id: "query", label: `"${filters.query.trim()}"`, onRemove: () => set({ query: "" }) });
  }
  if (filters.favorisOnly) {
    activeTags.push({ id: "favorisOnly", label: "Favoris", onRemove: () => set({ favorisOnly: false }) });
  }
  const collect = (group, groupKey, options) => {
    for (const key of filters[groupKey]) {
      const opt = options.find((o) => o.key === key);
      if (opt) {
        activeTags.push({
          id: `${groupKey}-${key}`,
          label: opt.label,
          onRemove: () => set({ [groupKey]: toggleInSet(filters[groupKey], key) }),
        });
      }
    }
  };
  collect("chaines", "chaines", chaineOptions);
  collect("streetlifting", "streetlifting", STREETLIFTING_FILTERS);
  collect("force", "force", FORCE_FILTERS);
  collect("niveaux", "niveaux", NIVEAU_FILTERS);
  collect("pratiques", "pratiques", PRATIQUE_FILTERS);

  return (
    <div className="filter-panel">
      <div className="filter-search">
        <input
          type="text"
          placeholder="Nom, ville, chaîne..."
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
        />
      </div>

      <div className="filter-actions-row">
        <button type="button" className="filter-action-btn" onClick={onLocateMe}>
          Autour de moi
        </button>
        <button type="button" className="filter-action-btn" onClick={handleCopyLink}>
          {linkCopied ? "Lien copié !" : "Copier le lien"}
        </button>
        <Link to="/proposer" className="filter-action-btn filter-action-btn--full">
          Proposer une salle
        </Link>
      </div>
      {locateError && <p className="filter-error">{locateError}</p>}

      <label className="filter-favoris-toggle">
        <input
          type="checkbox"
          checked={filters.favorisOnly}
          onChange={(e) => set({ favorisOnly: e.target.checked })}
        />
        Voir uniquement mes favoris {favoritesCount > 0 ? `(${favoritesCount})` : ""}
      </label>

      {activeTags.length > 0 && (
        <div className="filter-active-tags">
          {activeTags.map((tag) => (
            <button key={tag.id} type="button" className="filter-active-tag" onClick={tag.onRemove}>
              {tag.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="radius-slider">
        <div className="radius-slider__head">
          <h3>Autour de moi</h3>
          <span className="radius-slider__value">{filters.radiusKm} km</span>
        </div>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={filters.radiusKm}
          disabled={!userLocation}
          onChange={(e) => set({ radiusKm: Number(e.target.value) })}
          aria-label="Rayon de recherche autour de moi"
        />
        <div className="radius-slider__bounds">
          <span>5 km</span>
          <span>120 km</span>
        </div>
        {!userLocation && (
          <p className="radius-slider__hint">
            Active « Autour de moi » pour filtrer les salles par distance.
          </p>
        )}
      </div>

      <PillGroup
        title="Chaîne / type de salle"
        options={chaineOptions}
        selected={filters.chaines}
        onToggle={(key) => set({ chaines: toggleInSet(filters.chaines, key) })}
      />

      <PillGroup
        title="Streetlifting"
        options={STREETLIFTING_FILTERS}
        selected={filters.streetlifting}
        onToggle={(key) => set({ streetlifting: toggleInSet(filters.streetlifting, key) })}
      />

      <PillGroup
        title="Force"
        options={FORCE_FILTERS}
        selected={filters.force}
        onToggle={(key) => set({ force: toggleInSet(filters.force, key) })}
      />

      <div className="filter-group">
        <h3 className="filter-group__title filter-group__title--static">Statut FNSL Sud Est</h3>
        <div className="status-list">
          {STATUT_FILTERS.map((def) => (
            <div className="status-row" key={def.key}>
              <span className="status-row__dot" style={{ background: VARIANT_COLORS[def.variant] }} />
              {def.label}
              <span className="status-row__count">{countByStatut(salles, filters, undefined, def.variant)}</span>
              <Toggle
                checked={filters.statuts.has(def.variant)}
                onChange={() => set({ statuts: toggleInSet(filters.statuts, def.variant) })}
                ariaLabel={def.label}
              />
            </div>
          ))}
        </div>
      </div>

      <PillGroup
        title="Niveau de pertinence"
        options={NIVEAU_FILTERS}
        selected={filters.niveaux}
        onToggle={(key) => set({ niveaux: toggleInSet(filters.niveaux, key) })}
      />

      <PillGroup
        title="Plus de filtres"
        options={PRATIQUE_FILTERS}
        selected={filters.pratiques}
        onToggle={(key) => set({ pratiques: toggleInSet(filters.pratiques, key) })}
      />
    </div>
  );
}
