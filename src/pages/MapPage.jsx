import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import GymMap from "../components/GymMap";
import GymPanel from "../components/GymPanel";
import GymResultCard from "../components/GymResultCard";
import ZonesLegend from "../components/ZonesLegend";
import FilterOverlay from "../components/FilterOverlay";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { emptyFilters, matchesFilters, filtersToParams, filtersFromParams } from "../utils/filters";
import { distanceKm, formatDistance } from "../utils/geoDistance";
import { ADMIN_EMAIL } from "../config";

const PERTINENCE_RANK = {
  "très adaptée": 0,
  adaptée: 1,
  "partiellement adaptée": 2,
};

function pertinenceRank(niveau) {
  const key = (niveau || "").toLowerCase();
  return PERTINENCE_RANK[key] ?? 3;
}

function activeFilterCount(filters) {
  return (
    filters.chaines.size +
    filters.streetlifting.size +
    filters.force.size +
    filters.statuts.size +
    filters.niveaux.size +
    filters.pratiques.size +
    (filters.favorisOnly ? 1 : 0)
  );
}

export default function MapPage({ salles, loading, selectedId, onSelect, mapView, onMapViewChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [resultsPanelCollapsed, setResultsPanelCollapsed] = useState(false);
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [showZones, setShowZones] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locateError, setLocateError] = useState("");
  const [locating, setLocating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState("");
  const { user, passwordRecovery, clearPasswordRecovery } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  // Un lien de connexion Supabase expiré/invalide redirige ici avec un
  // message d'erreur stocké par main.jsx (voir commentaire là-bas) — on
  // l'affiche une fois puis on l'efface pour ne pas le montrer à nouveau.
  useEffect(() => {
    const stored = sessionStorage.getItem("authError");
    if (stored) {
      setAuthError(stored);
      sessionStorage.removeItem("authError");
    }
  }, []);

  // Utilisateur arrivé via un lien "mot de passe oublié" — ouvre directement
  // le modal en mode "nouveau mot de passe" plutôt que la connexion normale.
  useEffect(() => {
    if (passwordRecovery) {
      setShowAuthModal(true);
    }
  }, [passwordRecovery]);

  // Reflète les filtres actifs dans l'URL (sans polluer l'historique) pour
  // qu'un lien copié restaure exactement la même vue filtrée.
  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Ouvre le panneau de filtres quand on arrive via le lien "Filtres" de la
  // nav globale (/?openFilters=1) — fonctionne aussi bien depuis une autre
  // page que depuis la carte elle-même (HashRouter ne démonte pas MapPage
  // en re-naviguant vers la même route). Le paramètre est retiré aussitôt
  // pour ne pas rouvrir le panneau à un retour arrière.
  useEffect(() => {
    if (searchParams.get("openFilters")) {
      setShowFilterOverlay(true);
      const next = new URLSearchParams(searchParams);
      next.delete("openFilters");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Message d'erreur de géolocalisation affiché en toast flottant, masqué
  // automatiquement pour ne pas rester bloqué à l'écran.
  useEffect(() => {
    if (!locateError) return undefined;
    const timer = setTimeout(() => setLocateError(""), 5000);
    return () => clearTimeout(timer);
  }, [locateError]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    setLocateError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocateError("Localisation refusée. Vous pouvez l'activer dans les réglages de votre navigateur.");
        } else {
          setLocateError("Impossible de récupérer votre position pour le moment.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const filtered = useMemo(() => {
    const base = salles.filter((s) => matchesFilters(s, filters, favorites));
    // Le curseur de rayon ne filtre qu'une fois la position connue — tant
    // que la géoloc n'est pas accordée, il reste affiché mais inactif.
    if (!userLocation) return base;
    return base.filter((s) => distanceKm(userLocation, { lat: s.lat, lng: s.lng }) <= filters.radiusKm);
  }, [salles, filters, favorites, userLocation]);

  // Triée par distance quand la géoloc est active, sinon par pertinence puis
  // par nom — jamais dans l'ordre brut du Sheet.
  const sorted = useMemo(() => {
    const withDistance = filtered.map((s) => ({
      ...s,
      _distanceKm: userLocation ? distanceKm(userLocation, { lat: s.lat, lng: s.lng }) : null,
    }));
    withDistance.sort((a, b) => {
      if (userLocation) return a._distanceKm - b._distanceKm;
      const rankDiff = pertinenceRank(a.niveau_pertinence) - pertinenceRank(b.niveau_pertinence);
      if (rankDiff !== 0) return rankDiff;
      return a.nom.localeCompare(b.nom, "fr");
    });
    return withDistance;
  }, [filtered, userLocation]);

  const selectedSalle = salles.find((s) => s.id === selectedId) || null;
  const filterCount = activeFilterCount(filters);
  const query = filters.query.trim();

  // Si la salle sélectionnée sort du résultat filtré, on ferme la fiche
  // plutôt que de laisser une fiche ouverte pour une salle devenue invisible.
  useEffect(() => {
    if (selectedId && !filtered.some((s) => s.id === selectedId)) {
      onSelect(null);
    }
  }, [filtered, selectedId, onSelect]);

  const handleSelect = (id) => {
    onSelect(id);
  };

  const resultsList = sorted.map((salle) => (
    <GymResultCard
      key={salle.id}
      salle={salle}
      distance={salle._distanceKm != null ? formatDistance(salle._distanceKm) : null}
      active={salle.id === selectedId || salle.id === hoveredId}
      onClick={() => handleSelect(salle.id)}
      onMouseEnter={() => setHoveredId(salle.id)}
      onMouseLeave={() => setHoveredId((id) => (id === salle.id ? null : id))}
    />
  ));

  return (
    <div className="app">
      {authError && (
        <p className="app__auth-error">
          Connexion impossible : {authError}{" "}
          <button
            type="button"
            className="app__auth-error-retry"
            onClick={() => {
              setAuthError("");
              setShowAuthModal(true);
            }}
          >
            Réessayer
          </button>
        </p>
      )}

      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>

        <div className="header-search">
          <span className="header-search__icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher une ville, une salle…"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>

        <div className="app__header-actions">
          <label className="app__zones-toggle">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
            />
            Zones FNSL
          </label>
          <Link to="/proposer" className="app__account-link">
            Proposer une salle
          </Link>
          {user?.email === ADMIN_EMAIL && (
            <Link to="/admin" className="app__account-link">
              Admin
            </Link>
          )}
          {user ? (
            <Link to="/compte" className="app__account-link">
              Mon compte
            </Link>
          ) : (
            <button type="button" className="app__account-link" onClick={() => setShowAuthModal(true)}>
              Se connecter
            </button>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal
          initialMode={passwordRecovery ? "reset-password" : "login"}
          onClose={() => {
            setShowAuthModal(false);
            clearPasswordRecovery();
          }}
        />
      )}

      <main className="app__body">
        <aside className={`results-panel ${resultsPanelCollapsed ? "results-panel--collapsed" : ""}`}>
          {!resultsPanelCollapsed && (
            <>
              <div className="results-panel__head">
                <h2>
                  {sorted.length} salle{sorted.length > 1 ? "s" : ""}
                </h2>
                <span className="results-panel__zone">Sud Est</span>
                <button className="results-panel__hide" onClick={() => setResultsPanelCollapsed(true)}>
                  Masquer
                </button>
              </div>

              <div className="results-panel__pills">
                <button
                  type="button"
                  className={`pill-trigger ${filterCount > 0 ? "pill-trigger--active" : ""}`}
                  onClick={() => setShowFilterOverlay(true)}
                >
                  <span className="pill-trigger__dot" aria-hidden="true" />
                  Filtres{filterCount > 0 ? ` · ${filterCount}` : ""}
                </button>
                {query && (
                  <button type="button" className="filter-active-tag" onClick={() => setFilters({ ...filters, query: "" })}>
                    « {query} » <span aria-hidden="true">×</span>
                  </button>
                )}
                <button type="button" className="pill-trigger" onClick={handleLocateMe}>
                  Autour de moi
                </button>
              </div>

              <div className="results-panel__list">
                {loading && <p className="results-panel__empty">Chargement des salles…</p>}
                {!loading && sorted.length === 0 && (
                  <p className="results-panel__empty">
                    Aucune salle ne correspond à ces filtres.
                    <br />
                    <button className="app__hint-reset" onClick={() => setFilters(emptyFilters())}>
                      Réinitialiser les filtres
                    </button>
                  </p>
                )}
                {resultsList}
                {!loading && sorted.length > 0 && (
                  <p className="results-panel__footer-hint">Déplacez la carte pour actualiser les résultats</p>
                )}
              </div>
            </>
          )}
        </aside>

        {resultsPanelCollapsed && (
          <button
            className="results-panel__reopen"
            onClick={() => setResultsPanelCollapsed(false)}
            aria-label="Afficher les résultats"
          >
            ›
          </button>
        )}

        <div className="map-area">
          <GymMap
            salles={filtered}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleSelect}
            showZones={showZones}
            initialView={mapView}
            onViewChange={onMapViewChange}
            userLocation={userLocation}
            searchQuery={filters.query}
            onRecenter={handleLocateMe}
            locating={locating}
          />

          {locateError && (
            <div className="location-toast" role="status">
              <span>{locateError}</span>
              <button type="button" onClick={() => setLocateError("")} aria-label="Fermer">
                ×
              </button>
            </div>
          )}

          {showZones && !selectedSalle && <ZonesLegend />}

          {selectedSalle && (
            <GymPanel
              salle={selectedSalle}
              onClose={() => onSelect(null)}
              isFavorite={isFavorite(selectedSalle.id)}
              onToggleFavorite={toggleFavorite}
              userLocation={userLocation}
            />
          )}

          <div className="mobile-top-bar">
            <div className="header-search">
              <span className="header-search__icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Rechercher une salle…"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              />
            </div>
            {user ? (
              <Link to="/compte" className="mobile-top-bar__avatar" aria-label="Mon compte">
                {(user.email || "?").slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <button
                type="button"
                className="mobile-top-bar__avatar"
                onClick={() => setShowAuthModal(true)}
                aria-label="Se connecter"
              >
                ?
              </button>
            )}
          </div>

          <div className="mobile-pills-row">
            <button
              type="button"
              className={`pill-trigger ${filterCount > 0 ? "pill-trigger--active" : ""}`}
              onClick={() => setShowFilterOverlay(true)}
            >
              <span className="pill-trigger__dot" aria-hidden="true" />
              Filtres{filterCount > 0 ? ` · ${filterCount}` : ""}
            </button>
            {query && (
              <button type="button" className="filter-active-tag" onClick={() => setFilters({ ...filters, query: "" })}>
                « {query} » <span aria-hidden="true">×</span>
              </button>
            )}
            <button type="button" className="pill-trigger" onClick={handleLocateMe}>
              Autour de moi
            </button>
          </div>

          {!selectedSalle && (
            <div className="mobile-results-sheet">
              <div className="mobile-results-sheet__handle" />
              <div className="mobile-results-sheet__head">
                <h2>
                  {sorted.length} salle{sorted.length > 1 ? "s" : ""}
                </h2>
                <span className="mobile-results-sheet__zone">Sud Est</span>
              </div>
              <div className="mobile-results-sheet__list">
                {loading && <p className="results-panel__empty">Chargement des salles…</p>}
                {!loading && sorted.length === 0 && (
                  <p className="results-panel__empty">Aucune salle ne correspond à ces filtres.</p>
                )}
                {sorted.map((salle) => (
                  <GymResultCard
                    key={salle.id}
                    salle={salle}
                    distance={salle._distanceKm != null ? formatDistance(salle._distanceKm) : null}
                    compact
                    active={salle.id === selectedId}
                    onClick={() => handleSelect(salle.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showFilterOverlay && (
        <FilterOverlay
          salles={salles}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilterOverlay(false)}
          resultCount={sorted.length}
          onLocateMe={handleLocateMe}
          locateError={locateError}
          favoritesCount={favorites.size}
          userLocation={userLocation}
        />
      )}
    </div>
  );
}
