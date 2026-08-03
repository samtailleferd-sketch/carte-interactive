import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./App.css";
import "./components/FilterSidebar.css";
import "./pages/SalleDetailPage.css";
import "./pages/ProposeSallePage.css";
import "./pages/AccountPage.css";
import "./components/AuthModal.css";
import MapPage from "./pages/MapPage";
import SalleDetailPage from "./pages/SalleDetailPage";
import ProposeSallePage from "./pages/ProposeSallePage";
import AccountPage from "./pages/AccountPage";
import { fetchSalles } from "./data/fetchSalles";

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
      <Route path="/compte" element={<AccountPage />} />
    </Routes>
  );
}

export default App;
