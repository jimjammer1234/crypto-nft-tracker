export interface HashvaultStatsRaw {
  solo: {
    hashRate: number;
    avg1hashRate: number;
    avg3hashRate: number;
    avg6hashRate: number;
    avg24hashRate: number;
    lastShare: number; // unix milliseconds
    validShares: number;
    invalidShares: number;
    staleShares: number;
    foundBlocks: number;
  };
  revenue: {
    confirmedBalance: number; // atomic units (piconero)
    totalPaid: number;
    payoutThreshold: number;
  };
}

export async function fetchHashvaultStats(address: string): Promise<HashvaultStatsRaw> {
  const res = await fetch(`https://api.hashvault.pro/v3/monero/wallet/${address}/stats`);
  if (!res.ok) {
    throw new Error(`hashvault request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as HashvaultStatsRaw;
}
