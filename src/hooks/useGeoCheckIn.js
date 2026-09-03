import { useCallback, useState } from "react";
import { distanceKm } from "../utils/geoDistance";

// Rayon de tolérance pour valider un check-in "j'ai visité" par géoloc —
// assez large pour absorber l'imprécision GPS en intérieur/façade
// d'immeuble, assez serré pour exclure "cocher depuis chez soi".
const CHECKIN_RADIUS_KM = 0.4;

// Logique de check-in géolocalisé partagée entre la fiche complète
// (SalleDetailPage) et le panneau "Ajouter une salle visitée" (profil) :
// demande la position, vérifie la proximité, puis appelle checkIn (venant
// de useVisitedSalles, qui applique lui-même le throttle 24h).
export function useGeoCheckIn(checkIn) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState("");

  const attemptCheckIn = useCallback(
    (salle) =>
      new Promise((resolve) => {
        setMessage("");
        if (!navigator.geolocation) {
          setMessage("Géolocalisation non disponible sur cet appareil.");
          resolve(false);
          return;
        }
        setCheckingIn(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const here = { lat: position.coords.latitude, lng: position.coords.longitude };
            const distance = distanceKm(here, { lat: salle.lat, lng: salle.lng });
            if (distance > CHECKIN_RADIUS_KM) {
              setCheckingIn(false);
              setMessage("Tu dois être à proximité de la salle pour la marquer comme visitée.");
              resolve(false);
              return;
            }
            const result = await checkIn(salle.id);
            setCheckingIn(false);
            if (result.ok) {
              resolve(true);
              return;
            }
            setMessage(
              result.reason === "throttled"
                ? "Tu as déjà marqué une salle comme visitée aujourd'hui — reviens demain !"
                : "Impossible d'enregistrer ta visite pour le moment."
            );
            resolve(false);
          },
          (error) => {
            setCheckingIn(false);
            setMessage(
              error.code === error.PERMISSION_DENIED
                ? "Localisation refusée. Autorise-la pour marquer une salle comme visitée."
                : "Impossible de récupérer ta position pour le moment."
            );
            resolve(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }),
    [checkIn]
  );

  return { checkingIn, message, setMessage, attemptCheckIn };
}
