import { useEffect, useState } from "react";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export type PushStatus = "default" | "denied" | "granted" | "unsupported";

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permissionState, setPermissionState] = useState<PushStatus>("default");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (isMounted) {
            setIsSupported(false);
            setPermissionState("unsupported");
            setLoading(false);
        }
        return;
      }

      if (isMounted) setIsSupported(true);
      if (isMounted) setPermissionState(Notification.permission as PushStatus);

      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (isMounted) setSubscription(sub);
      } catch (error) {
        console.error("Failed to get subscription", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Register service worker if not already registered (idempotent)
    const init = async () => {
        try {
            await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            checkStatus();
        } catch (e) {
            console.error("SW registration failed", e);
            if (isMounted) setLoading(false);
        }
    }

    init();

    return () => { isMounted = false; };
  }, []);

  const subscribe = async () => {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        throw new Error("VAPID Public Key is missing");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setSubscription(sub);
      setPermissionState(Notification.permission as PushStatus);

      // Send to server
      const response = await fetch("/api/web-push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub),
      });

      if (!response.ok) {
          throw new Error("Failed to sync with server");
      }
      return true;
    } catch (error) {
      console.error("Subscription failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
      try {
          setLoading(true);
          if (subscription) {
              await subscription.unsubscribe();
              setSubscription(null);
              // Server sync implies removing from DB - conceptually optional but good for cleanup
              // For now, we just unsubscribe locally and let DB entry stale or implement delete endpoint later
          }
      } catch (error) {
          console.error("Unsubscription failed", error);
      } finally {
          setLoading(false);
      }
  };

  return {
    isSupported,
    subscription,
    permissionState,
    loading,
    subscribe,
    unsubscribe
  };
}
