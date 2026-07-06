import type { MiningSnapshot, AlertEvent } from "@crypto-nft-tracker/shared-types";

export interface Notifiers {
  onSnapshot: (snapshot: MiningSnapshot) => void;
  onAlert: (alert: AlertEvent) => void;
}
