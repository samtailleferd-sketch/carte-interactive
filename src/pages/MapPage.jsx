import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import GymMap from "../components/GymMap";
import GymPanel from "../components/GymPanel";
import ZonesLegend from "../components/ZonesLegend";
import FilterSidebar from "../components/FilterSidebar";
import MobileFilterDrawer from "../components/MobileFilterDrawer";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { useFavorites } from "../hooks/useFavorites";
import { emptyFilters, matchesFilters, filtersToParams, filtersFromParams } from "../utils/filters";
import { ADMIN_EMAIL } from "../config";

export default function MapPage({ salles, loading, selectedId, onSelect, mapView, onMapViewChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locateError, setLocateError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState("");
  const { user } = useAuth();
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

  // Reflète les filtres actifs dans l'URL (sans polluer l'historique) pour
  // qu'un lien copié restaure exactement la même vue filtrée.
  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocateError("Impossible d'accéder à ta position — vérifie l'autorisation de localisation.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const filtered = useMemo(
    () => salles.filter((s) => matchesFilters(s, filters, favorites)),
    [salles, filters, favorites]
  );

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
        <div className="app__header-actions">
          <label className="app__zones-toggle">
            <input
              type="checkbox"
              checked={showZones}
              onChange={(e) => setShowZones(e.target.checked)}
            />
            Zones FNSL
          </label>
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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <main className="app__body">
        <FilterSidebar
          salles={salles}
          filters={filters}
          onFiltersChange={setFilters}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onLocateMe={handleLocateMe}
          locateError={locateError}
          favoritesCount={favorites.size}
        />

        <div className="map-area">
          <GymMap
            salles={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
            showZones={showZones}
            initialView={mapView}
            onViewChange={onMapViewChange}
            userLocation={userLocation}
          />

          {showZones && !selectedSalle && <ZonesLegend />}

          {selectedSalle && (
            <GymPanel
              salle={selectedSalle}
              onClose={() => onSelect(null)}
              isFavorite={isFavorite(selectedSalle.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}

          <MobileFilterDrawer
            salles={salles}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filtered.length}
            onLocateMe={handleLocateMe}
            locateError={locateError}
            favoritesCount={favorites.size}
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
