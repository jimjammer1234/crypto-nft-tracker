import type { MiningSnapshot } from "./mining.js";
import type { NftCollectionSnapshot, NftListingEvent } from "./nft.js";
import type { AlertEvent } from "./alerts.js";

export type WsServerEvent =
  | { type: "mining.snapshot"; data: MiningSnapshot }
  | { type: "nft.collection_snapshot"; data: NftCollectionSnapshot }
  | { type: "nft.listing"; data: NftListingEvent }
  | { type: "alert.fired"; data: AlertEvent }
  | { type: "connected"; data: { serverTime: string } };

export type WsClientEvent = { type: "ping" };
