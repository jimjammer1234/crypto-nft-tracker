import { getStoredToken } from "./auth.js";

// Empty string (relative/same-origin) when not baked in at build time — the web build is served
// directly from the backend, so its own origin is always the right API host.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getStoredToken() ?? ""}` },
  });
  if (!res.ok) {
    throw new Error(`API request failed (${path}): ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function patchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getStoredToken() ?? ""}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API request failed (${path}): ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export interface MiningSourceRow {
  id: string;
  kind: string;
  label: string;
  coin: string;
  identifier: string;
  enabled: boolean;
}

export interface MiningSnapshotRow {
  id: number;
  sourceId: string;
  polledAt: string;
  hashrate1m: string | null;
  hashrate5m: string | null;
  hashrate1hr: string | null;
  hashrate1d: string | null;
  workersOnline: number | null;
  sharesTotal: string | null;
  balance: string | null;
  lastShareAt: string | null;
  bestDifficulty: string | null;
  workerBests: Array<{ workerName: string; bestDifficulty: number | null; hashrate: number | null }> | null;
  blocksFound: number | null;
}

export interface NftCollectionRow {
  id: string;
  slug: string;
  name: string;
  contractAddress: string | null;
  floorListings: Array<{ tokenId: string; price: number | null; currency: string }> | null;
}

export interface NftCollectionSnapshotRow {
  id: number;
  collectionId: string;
  marketplace: string;
  polledAt: string;
  floorPrice: string | null;
  floorCurrency: string;
  volume24h: string | null;
  numListed: number | null;
}

export interface NftListingRow {
  id: number;
  collectionId: string;
  tokenId: string;
  price: string | null;
  currency: string | null;
  seller: string | null;
  listedAt: string;
}

export interface NftWalletRow {
  id: string;
  address: string;
  label: string | null;
}

export interface NftWalletSnapshotRow {
  id: number;
  walletId: string;
  polledAt: string;
  totalValueEth: string | null;
  nftCount: number | null;
  holdings: Array<{ collectionSlug: string; tokenId: string; estValue: number | null }>;
}

export interface AlertRuleRow {
  id: string;
  kind: string;
  targetType: string;
  targetId: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AlertEventRow {
  id: number;
  ruleId: string;
  firedAt: string;
  message: string;
  severity: string;
  acknowledged: boolean;
}

export const api = {
  getMiningSources: () => getJson<MiningSourceRow[]>("/api/mining/sources"),
  getMiningSnapshots: (sourceId: string, limit = 100) =>
    getJson<MiningSnapshotRow[]>(`/api/mining/sources/${sourceId}/snapshots?limit=${limit}`),

  getNftCollections: () => getJson<NftCollectionRow[]>("/api/nft/collections"),
  getNftCollectionSnapshots: (collectionId: string, limit = 100) =>
    getJson<NftCollectionSnapshotRow[]>(`/api/nft/collections/${collectionId}/snapshots?limit=${limit}`),
  getNftCollectionListings: (collectionId: string, limit = 50) =>
    getJson<NftListingRow[]>(`/api/nft/collections/${collectionId}/listings?limit=${limit}`),

  getNftWallets: () => getJson<NftWalletRow[]>("/api/nft/wallets"),
  getNftWalletSnapshots: (walletId: string, limit = 10) =>
    getJson<NftWalletSnapshotRow[]>(`/api/nft/wallets/${walletId}/snapshots?limit=${limit}`),

  getAlertRules: () => getJson<AlertRuleRow[]>("/api/alerts/rules"),
  patchAlertRule: (id: string, body: { enabled?: boolean; config?: Record<string, unknown> }) =>
    patchJson<AlertRuleRow>(`/api/alerts/rules/${id}`, body),
  getAlertEvents: (limit = 100) => getJson<AlertEventRow[]>(`/api/alerts/events?limit=${limit}`),
};
