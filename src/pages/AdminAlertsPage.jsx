import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fetchSalles } from "../data/fetchSalles";
import { statusVariant } from "../statusStyle";
import { regionFromAddress } from "../utils/regionFromAddress";
import { alertEmailHtml } from "../utils/alertEmailTemplate";
import { ADMIN_EMAIL } from "../config";

// Une salle n'est "envoyable" que si elle est publiquement vérifiée/partenaire
// — une salle "à vérifier" ou au statut par défaut n'apparaît jamais ici,
// donc ne peut jamais déclencher d'alerte (voir §2 du plan).
function isPublished(salle) {
  const variant = statusVariant(salle.statut);
  return variant === "verified" || variant === "partner";
}

function salleAlertPayload(salle) {
  return {
    id: salle.id,
    nom: salle.nom,
    ville: salle.ville,
    adresse: salle.adresse,
    statut: salle.statut,
    niveau_pertinence: salle.niveau_pertinence,
    equipements: salle.equipements,
    slug: salle.slug,
  };
}

export default function AdminAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [salles, setSalles] = useState([]);
  const [sallesLoading, setSallesLoading] = useState(true);
  const [sentBySalleId, setSentBySalleId] = useState({});
  const [previewSalle, setPreviewSalle] = useState(null);
  const [pendingSalleId, setPendingSalleId] = useState(null);
  const [confirming, setConfirming] = useState(null); // { salle, region, count }
  const [resultBySalleId, setResultBySalleId] = useState({});

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    fetchSalles()
      .then(setSalles)
      .finally(() => setSallesLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || salles.length === 0) return;
    const ids = salles.filter(isPublished).map((s) => s.id);
    if (ids.length === 0) return;
    supabase
      .from("salle_alerts")
      .select("salle_id, sent_at, recipient_count")
      .in("salle_id", ids)
      .then(({ data }) => {
        const map = {};
        for (const row of data || []) map[row.salle_id] = row;
        setSentBySalleId(map);
      });
  }, [isAdmin, salles]);

  const publishable = useMemo(() => salles.filter(isPublished), [salles]);

  const handlePreview = (salle) => setPreviewSalle(salle);

  const handleSendClick = async (salle) => {
    const region = regionFromAddress(salle.adresse);
    setPendingSalleId(salle.id);
    const { data, error } = await supabase.functions.invoke("send-salle-alert", {
      body: { salle: salleAlertPayload(salle), target_region: region, dry_run: true },
    });
    setPendingSalleId(null);
    if (error) {
      setResultBySalleId((prev) => ({ ...prev, [salle.id]: { error: error.message } }));
      return;
    }
    setConfirming({ salle, region, count: data.recipient_count });
  };

  const handleConfirmSend = async () => {
    const { salle, region } = confirming;
    setPendingSalleId(salle.id);
    setConfirming(null);
    const { data, error } = await supabase.functions.invoke("send-salle-alert", {
      body: { salle: salleAlertPayload(salle), target_region: region },
    });
    setPendingSalleId(null);
    if (error) {
      setResultBySalleId((prev) => ({ ...prev, [salle.id]: { error: error.message } }));
      return;
    }
    setResultBySalleId((prev) => ({ ...prev, [salle.id]: data }));
    setSentBySalleId((prev) => ({
      ...prev,
      [salle.id]: { salle_id: salle.id, sent_at: new Date().toISOString(), recipient_count: data.recipient_count },
    }));
  };

  return (
    <div className="admin-alerts-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="admin-alerts-page__content">
        <h1>Alertes email</h1>

        {authLoading && <p className="account-page__hint">Chargement...</p>}

        {!authLoading && !isAdmin && (
          <p className="account-page__hint">Accès réservé à l'administrateur.</p>
        )}

        {!authLoading && isAdmin && sallesLoading && (
          <p className="account-page__hint">Chargement des salles...</p>
        )}

        {!authLoading && isAdmin && !sallesLoading && publishable.length === 0 && (
          <p className="account-page__hint">Aucune salle vérifiée ou partenaire pour le moment.</p>
        )}

        {!authLoading && isAdmin && !sallesLoading && publishable.length > 0 && (
          <ul className="admin-alerts-page__list">
            {publishable.map((salle) => {
              const sent = sentBySalleId[salle.id];
              const result = resultBySalleId[salle.id];
              const region = regionFromAddress(salle.adresse);
              return (
                <li key={salle.id} className="admin-alerts-page__item">
                  <div className="admin-alerts-page__item-info">
                    <p className="admin-alerts-page__item-nom">{salle.nom}</p>
                    <p className="admin-alerts-page__item-meta">
                      {salle.ville} — {region ? `région ${region}` : "région non déterminée"}
                    </p>
                  </div>

                  {sent ? (
                    <p className="admin-alerts-page__item-sent">
                      Alerte envoyée le {new Date(sent.sent_at).toLocaleDateString("fr-FR")} à{" "}
                      {sent.recipient_count} destinataire{sent.recipient_count > 1 ? "s" : ""}.
                    </p>
                  ) : (
                    <div className="admin-alerts-page__item-actions">
                      <button type="button" className="btn" onClick={() => handlePreview(salle)}>
                        Prévisualiser
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={pendingSalleId === salle.id}
                        onClick={() => handleSendClick(salle)}
                      >
                        {pendingSalleId === salle.id ? "..." : "Envoyer l'alerte"}
                      </button>
                    </div>
                  )}

                  {result?.error && <p className="admin-alerts-page__item-error">Erreur : {result.error}</p>}
                  {result && !result.error && (
                    <p className="admin-alerts-page__item-sent">
                      Envoyée à {result.recipient_count} destinataire{result.recipient_count > 1 ? "s" : ""}
                      {result.error_count > 0 ? ` (${result.error_count} échec(s))` : ""}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewSalle && (
        <div className="admin-alerts-page__modal-backdrop" onClick={() => setPreviewSalle(null)}>
          <div className="admin-alerts-page__modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-alerts-page__modal-close" onClick={() => setPreviewSalle(null)}>
              Fermer
            </button>
            <iframe
              title="Prévisualisation de l'email"
              className="admin-alerts-page__modal-frame"
              srcDoc={alertEmailHtml(previewSalle, "#")}
            />
          </div>
        </div>
      )}

      {confirming && (
        <div className="admin-alerts-page__modal-backdrop" onClick={() => setConfirming(null)}>
          <div className="admin-alerts-page__confirm" onClick={(e) => e.stopPropagation()}>
            <p>
              {confirming.count === 0
                ? "Aucun abonné ne recevra cet email (aucune correspondance de région)."
                : `${confirming.count} abonné${confirming.count > 1 ? "s" : ""} recevr${
                    confirming.count > 1 ? "ont" : "a"
                  } cet email.`}
            </p>
            <div className="admin-alerts-page__item-actions">
              <button type="button" className="btn" onClick={() => setConfirming(null)}>
                Annuler
              </button>
              <button type="button" className="btn btn--primary" onClick={handleConfirmSend}>
                Confirmer l'envoi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
