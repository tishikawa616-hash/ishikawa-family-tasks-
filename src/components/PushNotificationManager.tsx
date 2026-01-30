"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

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

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (isMounted) setSubscription(sub);
      } catch (error) {
          console.error("SW registration failed", error);
      }
    };

    if ("serviceWorker" in navigator && "PushManager" in window) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (isMounted) setIsSupported(true);
      registerServiceWorker();
    }
    
    return () => { isMounted = false; };
  }, []);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error("VAPID Public Key is missing. Check environment variables.");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      setSubscription(sub);
      
      // Send to server
      const response = await fetch("/api/web-push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sub),
      });

      if (response.ok) {
        showToast("通知をオンにしました！", "success");
      } else {
        const errorData = await response.json();
        console.error("Subscription server error:", errorData);
        throw new Error(errorData.error || "Failed to save subscription");
      }
    } catch (error: any) {
      console.error("Subscription failed", error);
      showToast(`通知設定失敗: ${error.message || "不明なエラー"}`, "error");
    }
  };

  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  if (subscription) {
      return null; // Already subscribed, hide button (or show 'Subscribed')
  }

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <button
        onClick={subscribeToPush}
        className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-bounce"
      >
        🔔 通知を受け取る
      </button>
    </div>
  );
}
