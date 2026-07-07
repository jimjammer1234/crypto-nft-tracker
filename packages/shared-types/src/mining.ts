export type MiningSourceKind = "ckpool" | "kano" | "herominers" | "hashvault";
export type MiningCoin = "BTC" | "PRL" | "XMR";

export interface MiningSource {
  id: string;
  kind: MiningSourceKind;
  label: string;
  coin: MiningCoin;
  identifier: string;
  enabled: boolean;
}

/** Normalized snapshot shape every pool client's normalize() function must produce, regardless of source. */
export interface MiningSnapshot {
  sourceId: string;
  polledAt: string;
  hashrate1m: number | null;
  hashrate5m: number | null;
  hashrate1hr: number | null;
  hashrate1d: number | null;
  workersOnline: number | null;
  sharesTotal: number | null;
  /** unpaid/pending balance, in the coin's smallest or display unit depending on source; see normalize.ts comments per source */
  balance: number | null;
  lastShareAt: string | null;
  /** Highest-difficulty share ever submitted (account-level); null where the source doesn't expose it. */
  bestDifficulty: number | null;
  /** Per-worker breakdown of the same stat, where the source exposes individual workers. */
  workerBests: Array<{ workerName: string; bestDifficulty: number | null }>;
  /** Cumulative blocks found so far, where the source exposes it. */
  blocksFound: number | null;
}

export interface MiningPayoutEvent {
  sourceId: string;
  amount: number;
  coin: MiningCoin;
  txReference: string | null;
  occurredAt: string;
}
