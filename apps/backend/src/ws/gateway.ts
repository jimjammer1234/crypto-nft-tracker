import type { FastifyInstance } from "fastify";
import type { WsServerEvent } from "@crypto-nft-tracker/shared-types";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

type Client = { send: (data: string) => void };

const clients = new Set<Client>();

export function broadcast(event: WsServerEvent) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.send(payload);
  }
}

export async function registerWsGateway(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket, request) => {
    const token = new URL(request.url, "http://localhost").searchParams.get("token");
    if (token !== env.API_AUTH_TOKEN) {
      socket.close(4401, "unauthorized");
      return;
    }

    const client: Client = { send: (data) => socket.send(data) };
    clients.add(client);
    logger.info({ clients: clients.size }, "ws client connected");

    socket.send(JSON.stringify({ type: "connected", data: { serverTime: new Date().toISOString() } } satisfies WsServerEvent));

    socket.on("close", () => {
      clients.delete(client);
      logger.info({ clients: clients.size }, "ws client disconnected");
    });
  });
}
