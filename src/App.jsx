import { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./App.css";
import "./pages/MapPage.css";
import "./components/FilterPanel.css";
import "./components/FilterOverlay.css";
import "./components/GymResultCard.css";
import "./pages/SalleDetailPage.css";
import "./pages/ProposeSallePage.css";
import "./pages/AccountPage.css";
import "./pages/AdminAlertsPage.css";
import "./components/AuthModal.css";
import "./components/Lightbox.css";
import "./components/ReportModal.css";
import "./components/PrimaryNav.css";
import MapPage from "./pages/MapPage";
import PrimaryNav from "./components/PrimaryNav";
import { fetchSalles } from "./data/fetchSalles";

// Chargées à la demande (pas dans le bundle initial) : la carte ("/") est la
// seule page vue par l'immense majorité des visiteurs, pas besoin d'alourdir
// son chargement avec le code des fiches salle, formulaires ou écrans admin.
const SalleDetailPage = lazy(() => import("./pages/SalleDetailPage"));
const ProposeSallePage = lazy(() => import("./pages/ProposeSallePage"));
const ReferencerSallePage = lazy(() => import("./pages/ReferencerSallePage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminAlertsPage = lazy(() => import("./pages/AdminAlertsPage"));
const AdminPropositionsPage = lazy(() => import("./pages/AdminPropositionsPage"));

const DEFAULT_MAP_VIEW = { center: [44.6, 5.6], zoom: 7 };

function App() {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [mapView, setMapView] = useState(DEFAULT_MAP_VIEW);

  useEffect(() => {
    fetchSalles()
      .then(setSalles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <Suspense fallback={<div className="detail-page detail-page--state"><p>Chargement...</p></div>}>
          <Routes>
            <Route
              path="/"
              element={
                <MapPage
                  salles={salles}
                  loading={loading}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  mapView={mapView}
                  onMapViewChange={setMapView}
                />
              }
            />
            <Route path="/salles/:slug" element={<SalleDetailPage salles={salles} loading={loading} />} />
            <Route path="/proposer" element={<ProposeSallePage />} />
            <Route path="/referencer-votre-salle" element={<ReferencerSallePage />} />
            <Route path="/favoris" element={<FavoritesPage salles={salles} loading={loading} />} />
            <Route path="/compte" element={<AccountPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/alertes" element={<AdminAlertsPage />} />
            <Route path="/admin/propositions" element={<AdminPropositionsPage />} />
          </Routes>
        </Suspense>
      </div>
      <PrimaryNav />
    </div>
  );
}

export default App;
