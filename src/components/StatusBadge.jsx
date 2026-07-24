import { statusVariant } from "../statusStyle";

export default function StatusBadge({ statut }) {
  if (!statut) return null;
  return <span className={`badge badge--${statusVariant(statut)}`}>{statut}</span>;
}
