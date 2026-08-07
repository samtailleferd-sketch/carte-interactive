import { supabase } from "../lib/supabaseClient";
import { VAPID_PUBLIC_KEY } from "../config";

// pushManager.subscribe() attend la clé VAPID sous forme de Uint8Array, pas
// de la chaîne base64url telle qu'exportée par `web-push generate-vapid-keys`.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Sur iPhone, Safari ne délivre les notifications push que si la PWA a été
// installée sur l'écran d'accueil — un onglet Safari ouvert ne le peut
// jamais, quelle que soit la version d'iOS. Android n'a pas cette
// restriction, mais on l'applique aussi de son côté pour un parcours
// cohérent entre les deux plateformes.
export function isRunningAsInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function subscribeToPush(userId) {
  if (!supabase) throw new Error("Supabase indisponible.");
  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;

  return subscription;
}

export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  if (supabase) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}
