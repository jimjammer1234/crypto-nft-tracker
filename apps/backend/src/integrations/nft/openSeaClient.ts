const BASE_URL = "https://api.opensea.io/api/v2";

export interface OpenSeaCollectionStatsRaw {
  total: {
    volume: number;
    sales: number;
    num_owners: number;
    floor_price: number;
    floor_price_symbol: string;
  };
  intervals: Array<{ interval: string; volume: number; sales: number }>;
}

export interface OpenSeaListingRaw {
  order_hash: string;
  asset: { identifier: string; contract: string };
  protocol_data: { parameters: { offerer: string } };
  order_created_at: number;
  price: { current: { currency: string; decimals: number; value: string } };
}

export interface OpenSeaListingsResponseRaw {
  listings: OpenSeaListingRaw[];
  next?: string | null;
}

export interface OpenSeaNftRaw {
  identifier: string;
  collection: string;
  contract: string;
}

export interface OpenSeaWalletNftsResponseRaw {
  nfts: OpenSeaNftRaw[];
  next?: string | null;
}

function headers(apiKey: string) {
  return { "X-API-KEY": apiKey, Accept: "application/json" };
}

async function get<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers(apiKey) });
  if (!res.ok) {
    throw new Error(`OpenSea request failed (${path}): ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export function fetchCollectionStats(apiKey: string, slug: string) {
  return get<OpenSeaCollectionStatsRaw>(apiKey, `/collections/${slug}/stats`);
}

export function fetchCollectionListings(apiKey: string, slug: string, limit = 50) {
  return get<OpenSeaListingsResponseRaw>(apiKey, `/listings/collection/${slug}/all?limit=${limit}`);
}

export function fetchWalletNfts(apiKey: string, address: string, chain = "ethereum", limit = 200) {
  return get<OpenSeaWalletNftsResponseRaw>(apiKey, `/chain/${chain}/account/${address}/nfts?limit=${limit}`);
}
