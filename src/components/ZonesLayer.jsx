import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import departements from "../data/departements.json";
import { zoneForDepartment } from "../data/fnslZones";

const UNASSIGNED_COLOR = "#5f6068";

// Les contours officiels du 13 (Bouches-du-Rhône, étang de Berre) et du 26
// (Drôme) contiennent un anneau intérieur ("trou") dans leur polygone, comme
// la mer n'est jamais coloriée. Visuellement ça ressemblait à une zone
// manquante en plein milieu du département — on ne garde donc que le contour
// extérieur pour ces départements afin qu'ils se colorient uniformément avec
// le reste de leur zone.
const DEPARTMENTS_WITHOUT_HOLES = new Set(["13", "26"]);

function withoutInteriorRings(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((feature) => {
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
    return `<b>${dept}</b><br/>Zone FNSL non déterminée<br/><span style="color:#ffb703">À confirmer</span>`;
  }
  const statutLabel = zone.statut === "confirme" ? "Confirmé" : "Provisoire";
  const statutColor = zone.statut === "confirme" ? "#4cc995" : "#ffb703";
  return `<b>FNSL ${zone.name}</b><br/>${dept}<br/><span style="color:${statutColor}">${statutLabel}</span><br/><span style="font-size:12px;opacity:0.8">${zone.source}</span>`;
}

export default function ZonesLayer() {
  const data = useMemo(() => withoutInteriorRings(departements), []);

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
