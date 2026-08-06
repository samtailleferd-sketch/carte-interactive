import { useState } from "react";
import { Link } from "react-router-dom";
import {
  STREETLIFTING_FILTERS,
  FORCE_FILTERS,
  STATUT_FILTERS,
  NIVEAU_FILTERS,
  PRATIQUE_FILTERS,
  emptyFilters,
  hasActiveFilters,
} from "../utils/filters";

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function CheckboxGroup({ title, defaultOpen, options, selected, onToggle }) {
  return (
    <details className="filter-group" open={defaultOpen}>
      <summary className="filter-group__title">{title}</summary>
      <div className="filter-group__options">
        {options.map((opt) => (
          <label className="filter-option" key={opt.key}>
            <input
              type="checkbox"
              checked={selected.has(opt.key)}
              onChange={() => onToggle(opt.key)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </details>
  );
}

export default function FilterPanel({ salles, filters, onFiltersChange, onLocateMe, locateError, favoritesCount }) {
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
  collect("statuts", "statuts", STATUT_FILTERS);
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
            <button key={tag.id} className="filter-active-tag" onClick={tag.onRemove}>
              {tag.label} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <CheckboxGroup
        title="Chaîne / type de salle"
        defaultOpen
        options={chaineOptions}
        selected={filters.chaines}
        onToggle={(key) => set({ chaines: toggleInSet(filters.chaines, key) })}
      />

      <CheckboxGroup
        title="Streetlifting"
        defaultOpen
        options={STREETLIFTING_FILTERS}
        selected={filters.streetlifting}
        onToggle={(key) => set({ streetlifting: toggleInSet(filters.streetlifting, key) })}
      />

      <CheckboxGroup
        title="Force"
        defaultOpen
        options={FORCE_FILTERS}
        selected={filters.force}
        onToggle={(key) => set({ force: toggleInSet(filters.force, key) })}
      />

      <CheckboxGroup
        title="Statut FNSL Sud Est"
        options={STATUT_FILTERS}
        selected={filters.statuts}
        onToggle={(key) => set({ statuts: toggleInSet(filters.statuts, key) })}
      />

      <CheckboxGroup
        title="Niveau de pertinence"
        options={NIVEAU_FILTERS}
        selected={filters.niveaux}
        onToggle={(key) => set({ niveaux: toggleInSet(filters.niveaux, key) })}
      />

      <CheckboxGroup
        title="Plus de filtres"
        options={PRATIQUE_FILTERS}
        selected={filters.pratiques}
        onToggle={(key) => set({ pratiques: toggleInSet(filters.pratiques, key) })}
      />

      <button
        className="filter-reset"
        onClick={() => onFiltersChange(emptyFilters())}
        disabled={!hasActiveFilters(filters)}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
