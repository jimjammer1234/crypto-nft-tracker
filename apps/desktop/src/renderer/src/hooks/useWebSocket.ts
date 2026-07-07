import { useEffect } from "react";
import { useAlertStore } from "../state/alertStore.js";

/** Subscribes once to the main process's WS bridge (see preload/index.ts) and feeds live
 * alert.fired events into the alert store. Mining/NFT widgets still poll over REST; this is
 * only for the live alert feed and native-notification-adjacent in-app updates. */
export function useWebSocket() {
  const pushAlert = useAlertStore((s) => s.pushAlert);

  useEffect(() => {
    if (!window.electronBridge) return; // running in a plain browser preview, not Electron

    const unsubscribe = window.electronBridge.onWsEvent((event) => {
      if (event.type === "alert.fired") {
        pushAlert(event.data);
      }
    });

    return unsubscribe;
  }, [pushAlert]);
}
