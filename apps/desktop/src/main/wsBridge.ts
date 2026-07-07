import WebSocket from "ws";
import type { BrowserWindow } from "electron";
import type { WsServerEvent } from "@crypto-nft-tracker/shared-types";
import { config } from "./config.js";
import { notifyAlert } from "./notifications.js";

const RECONNECT_DELAY_MS = 5000;

export function startWsBridge(getWindow: () => BrowserWindow | null) {
  connect(getWindow);
}

function connect(getWindow: () => BrowserWindow | null) {
  const wsUrl = config.apiBaseUrl.replace(/^http/, "ws") + `/ws?token=${config.apiToken}`;
  const socket = new WebSocket(wsUrl);

  socket.on("open", () => console.log("[ws] connected to backend"));

  socket.on("message", (raw) => {
    let event: WsServerEvent;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      return;
    }

    getWindow()?.webContents.send("ws-event", event);

    if (event.type === "alert.fired") {
      notifyAlert(event.data);
    }
  });

  socket.on("close", () => {
    console.log(`[ws] disconnected, reconnecting in ${RECONNECT_DELAY_MS}ms`);
    setTimeout(() => connect(getWindow), RECONNECT_DELAY_MS);
  });

  socket.on("error", (err) => {
    console.error("[ws] error", err.message);
    socket.close();
  });
}
