import { fnslZones } from "../data/fnslZones";

export default function ZonesLegend() {
  return (
    <div className="zones-legend">
      <p className="zones-legend__title">Zones FNSL</p>
      {Object.entries(fnslZones).map(([name, zone]) => (
        <div className="zones-legend__row" key={name}>
          <span className="zones-legend__swatch" style={{ background: zone.color }} />
          {name}
          {zone.statut === "provisoire" && <span className="zones-legend__tag">provisoire</span>}
        </div>
      ))}
      <div className="zones-legend__row zones-legend__row--muted">
        <span className="zones-legend__swatch" style={{ background: "#5f6068" }} />
        À confirmer
      </div>
    </div>
  );
}
