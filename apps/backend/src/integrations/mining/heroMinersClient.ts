export interface HeroMinersWorkerRaw {
  name: string;
  hashrate: number;
  lastShare: number; // unix seconds
  shares_good: number;
  shares_invalid: number;
  shares_stale: number;
  blocksFound: number;
  hashrate_1h: number;
  hashrate_6h: number;
  hashrate_24h: number;
}

export interface HeroMinersStatsRaw {
  workers: HeroMinersWorkerRaw[];
  stats: {
    donation_level: string;
    solo_shares_good: number;
    solo_shares_stale: number;
    solo_shares_invalid: number;
    solo_hashes: string;
    lastShare: string; // unix seconds, as a string
    balance: string; // atomic units
    paid: string; // atomic units
    firstSeen: string;
    hashrate: number; // current solo hashrate, already in H/s
    hashrate_1h: number;
    hashrate_6h: number;
    hashrate_24h: number;
    blocksFound: string;
    blocksFoundSolo: number;
    networkHeight: number;
  };
  payments: unknown[];
  charts: {
    payments: [number, string][];
    hashrate: [number, number, number][];
  };
}

/** HeroMiners exposes a per-coin subdomain (e.g. pearl.herominers.com, monero.herominers.com) with an identical stats_address API shape. */
export async function fetchHeroMinersStats(coinSubdomain: string, address: string): Promise<HeroMinersStatsRaw> {
  const res = await fetch(`https://${coinSubdomain}.herominers.com/api/stats_address?address=${address}&longpoll=false`);
  if (!res.ok) {
    throw new Error(`herominers (${coinSubdomain}) request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as HeroMinersStatsRaw;
}
