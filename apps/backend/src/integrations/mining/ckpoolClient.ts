export interface CkpoolWorkerRaw {
  workername: string;
  hashrate1m: string;
  hashrate5m: string;
  hashrate1hr: string;
  hashrate1d: string;
  hashrate7d: string;
  lastshare: number;
  shares: number;
  bestshare: number;
  bestever: number;
}

export interface CkpoolStatsRaw {
  hashrate1m: string;
  hashrate5m: string;
  hashrate1hr: string;
  hashrate1d: string;
  hashrate7d: string;
  lastshare: number;
  workers: number;
  shares: number;
  bestshare: number;
  bestever: number;
  authorised: number;
  worker: CkpoolWorkerRaw[];
}

export async function fetchCkpoolStats(btcAddress: string): Promise<CkpoolStatsRaw> {
  const res = await fetch(`https://solo.ckpool.org/users/${btcAddress}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`ckpool request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CkpoolStatsRaw;
}
