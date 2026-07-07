import { contextBridge } from "electron";

// No privileged APIs exposed yet; the renderer talks to the backend directly over HTTPS.
// This bridge exists as the place to add IPC (tray/notifications/settings) in Phase 6.
contextBridge.exposeInMainWorld("app", {
  platform: process.platform,
});
