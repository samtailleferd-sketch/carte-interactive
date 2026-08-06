import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { ADMIN_EMAIL } from "../config";

const PROPOSITIONS_BUCKET = "propositions";
const STATUT_LABELS = { en_attente: "En attente", validee: "Validée", rejetee: "Rejetée" };

function isRealLink(url) {
  return Boolean(url) && url !== "#";
}

export default function AdminPropositionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [propositions, setPropositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photosById, setPhotosById] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("salle_propositions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPropositions(data || []))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || propositions.length === 0) return;
    // Une salle proposée n'a en général que quelques photos — récupérer les
    // URLs signées de toutes les propositions au chargement reste léger.
    propositions.forEach((prop) => {
      if (photosById[prop.id]) return;
      supabase.storage
        .from(PROPOSITIONS_BUCKET)
        .list(prop.id)
        .then(async ({ data: files }) => {
          if (!files || files.length === 0) {
            setPhotosById((prev) => ({ ...prev, [prop.id]: [] }));
            return;
          }
          const urls = await Promise.all(
            files.map(async (file) => {
              const { data } = await supabase.storage
                .from(PROPOSITIONS_BUCKET)
                .createSignedUrl(`${prop.id}/${file.name}`, 3600);
              return data?.signedUrl;
            })
          );
          setPhotosById((prev) => ({ ...prev, [prop.id]: urls.filter(Boolean) }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, propositions]);

  const updateStatut = async (id, statut) => {
    setUpdatingId(id);
    const { error } = await supabase.from("salle_propositions").update({ statut }).eq("id", id);
    setUpdatingId(null);
    if (error) return;
    setPropositions((prev) => prev.map((p) => (p.id === id ? { ...p, statut } : p)));
  };

  return (
    <div className="admin-alerts-page">
      <header className="detail-header">
        <Link to="/admin" className="detail-header__back">
          ← Admin
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="admin-alerts-page__content">
        <h1>Salles proposées</h1>

        {authLoading && <p className="account-page__hint">Chargement...</p>}
        {!authLoading && !isAdmin && <p className="account-page__hint">Accès réservé à l'administrateur.</p>}
        {!authLoading && isAdmin && loading && <p className="account-page__hint">Chargement des propositions...</p>}
        {!authLoading && isAdmin && !loading && propositions.length === 0 && (
          <p className="account-page__hint">Aucune proposition pour le moment.</p>
        )}

        {!authLoading && isAdmin && !loading && propositions.length > 0 && (
          <ul className="admin-alerts-page__list">
            {propositions.map((prop) => (
              <li key={prop.id} className="admin-alerts-page__item">
                <div className="admin-alerts-page__item-info">
                  <p className="admin-alerts-page__item-nom">
                    {prop.nom} <span className={`admin-propositions__statut admin-propositions__statut--${prop.statut}`}>{STATUT_LABELS[prop.statut] || prop.statut}</span>
                  </p>
                  <p className="admin-alerts-page__item-meta">
                    {prop.ville}
                    {prop.adresse ? ` — ${prop.adresse}` : ""}
                  </p>
                  <p className="admin-alerts-page__item-meta">
                    Proposée le {new Date(prop.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                {prop.remarques && <p className="admin-propositions__remarques">{prop.remarques}</p>}

                <div className="admin-alerts-page__item-actions">
                  {isRealLink(prop.instagram) && (
                    <a className="btn" href={prop.instagram} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  )}
                  {isRealLink(prop.site_web) && (
                    <a className="btn" href={prop.site_web} target="_blank" rel="noopener noreferrer">
                      Site web
                    </a>
                  )}
                </div>

                {photosById[prop.id]?.length > 0 && (
                  <div className="admin-propositions__photos">
                    {photosById[prop.id].map((url) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" />
                      </a>
                    ))}
                  </div>
                )}

                {prop.statut === "en_attente" && (
                  <div className="admin-alerts-page__item-actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={updatingId === prop.id}
                      onClick={() => updateStatut(prop.id, "validee")}
                    >
                      Marquer validée
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={updatingId === prop.id}
                      onClick={() => updateStatut(prop.id, "rejetee")}
                    >
                      Marquer rejetée
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
