import { Notification } from "electron";
import type { AlertEvent } from "@crypto-nft-tracker/shared-types";

export function notifyAlert(alert: AlertEvent) {
  if (!Notification.isSupported()) return;

  new Notification({
    title: alert.severity === "critical" ? "⚠ Critical Alert" : alert.severity === "warning" ? "Alert" : "Update",
    body: alert.message,
    silent: alert.severity === "info",
  }).show();
}
