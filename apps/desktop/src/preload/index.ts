import { contextBridge, ipcRenderer } from "electron";
import type { WsServerEvent } from "@crypto-nft-tracker/shared-types";

contextBridge.exposeInMainWorld("electronBridge", {
  platform: process.platform,
  onWsEvent: (callback: (event: WsServerEvent) => void) => {
    const listener = (_: unknown, event: WsServerEvent) => callback(event);
    ipcRenderer.on("ws-event", listener);
    return () => ipcRenderer.removeListener("ws-event", listener);
  },
});
