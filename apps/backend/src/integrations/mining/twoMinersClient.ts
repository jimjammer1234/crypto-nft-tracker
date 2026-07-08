export interface TwoMinersWorkerRaw {
  lastBeat: number; // unix seconds
  hr: number; // current hashrate, H/s
  hr2: number; // averaged hashrate, H/s
  offline: boolean;
  sharesValid: number;
  sharesInvalid: number;
  sharesStale: number;
}

export interface TwoMinersStatsRaw {
  currentHashrate: number;
  hashrate: number;
  sharesValid: number;
  sharesInvalid: number;
  sharesStale: number;
  workersOnline: number;
  workersOffline: number;
  workersTotal: number;
  workers: Record<string, TwoMinersWorkerRaw>;
  stats: {
    balance: number;
    blocksFound: number;
    immature: number;
    lastShare: number; // unix seconds
    paid: number;
    pending: number;
  };
}

/** 2Miners exposes a per-coin "solo-<coin>" subdomain (e.g. solo-zec.2miners.com) with an
 * identical accounts API shape across coins. */
export async function fetchTwoMinersStats(coinSubdomain: string, address: string): Promise<TwoMinersStatsRaw> {
  const res = await fetch(`https://${coinSubdomain}.2miners.com/api/accounts/${address}`);
  if (!res.ok) {
    throw new Error(`2miners (${coinSubdomain}) request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as TwoMinersStatsRaw;
}
