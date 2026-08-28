import { useEffect, useMemo, useState } from "react";
import { GeoJSON } from "react-leaflet";
import { zoneForDepartment } from "../data/fnslZones";

// Contours des départements (556 Ko) servis comme asset statique plutôt
// qu'importés dans le JS : ce fichier ne concerne que l'affichage des zones
// FNSL (calque optionnel), il n'a aucune raison d'alourdir et de bloquer le
// parsing du bundle principal chargé par tout le monde dès la page carte.
const DEPARTEMENTS_URL = `${import.meta.env.BASE_URL}departements.json`;

const UNASSIGNED_COLOR = "#5f6068";

// Les contours officiels du 13 (Bouches-du-Rhône, étang de Berre) et du 26
// (Drôme) contiennent un anneau intérieur ("trou") dans leur polygone, comme
// la mer n'est jamais coloriée. Visuellement ça ressemblait à une zone
// manquante en plein milieu du département — on ne garde donc que le contour
// extérieur pour ces départements afin qu'ils se colorient uniformément avec
// le reste de leur zone.
const DEPARTMENTS_WITHOUT_HOLES = new Set(["13", "26"]);

// La FNSL ne recense pas encore de club ni de compétition en Corse : plutôt
// que de l'afficher en gris "à confirmer" (qui laissait penser à un oubli),
// on l'exclut du calque des zones pour qu'elle se fonde dans la carte comme
// un pays voisin non couvert (Suisse, Italie...).
const EXCLUDED_DEPARTMENTS = new Set(["2A", "2B"]);

function prepareZonesData(geojson) {
  return {
    ...geojson,
    features: geojson.features
      .filter((feature) => !EXCLUDED_DEPARTMENTS.has(feature.properties.code))
      .map((feature) => {
        const code = feature.properties.code;
        if (!DEPARTMENTS_WITHOUT_HOLES.has(code) || feature.geometry.type !== "Polygon") {
          return feature;
        }
        return {
          ...feature,
          geometry: { ...feature.geometry, coordinates: [feature.geometry.coordinates[0]] },
        };
      }),
  };
}

function styleForDepartment(feature) {
  const zone = zoneForDepartment(feature.properties.code);
  if (!zone) {
    return { color: UNASSIGNED_COLOR, weight: 1, fillColor: UNASSIGNED_COLOR, fillOpacity: 0.1, dashArray: "4 3" };
  }
  return { color: zone.color, weight: 1.2, fillColor: zone.color, fillOpacity: zone.statut === "confirme" ? 0.25 : 0.18 };
}

function popupContent(feature) {
  const zone = zoneForDepartment(feature.properties.code);
  const dept = `${feature.properties.nom} (${feature.properties.code})`;
  if (!zone) {
    return `<b>${dept}</b><br/>Zone FNSL non déterminée<br/><span style="color:#7c8492">À confirmer</span>`;
  }
  const statutLabel = zone.statut === "confirme" ? "Confirmé" : "Provisoire";
  const statutColor = zone.statut === "confirme" ? "#22e58a" : "#7c8492";
  return `<b>FNSL ${zone.name}</b><br/>${dept}<br/><span style="color:${statutColor}">${statutLabel}</span><br/><span style="font-size:12px;opacity:0.8">${zone.source}</span>`;
}

export default function ZonesLayer() {
  const [departements, setDepartements] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DEPARTEMENTS_URL)
      .then((res) => res.json())
      .then((geojson) => {
        if (!cancelled) setDepartements(geojson);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo(() => (departements ? prepareZonesData(departements) : null), [departements]);

  if (!data) return null;

  return (
    <GeoJSON
      data={data}
      style={styleForDepartment}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(popupContent(feature));
        layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.4 }));
        layer.on("mouseout", () => layer.setStyle(styleForDepartment(feature)));
      }}
    />
  );
}
