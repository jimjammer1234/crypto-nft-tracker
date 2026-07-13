export interface ParasiteWorkerRaw {
  id: string;
  name: string;
  hashrate: string; // H/s, as a string
  bestDifficulty: string; // raw number as a string, unlike the account-level abbreviated form
  lastSubmission: string; // unix seconds, as a string
  uptime: string;
}

export interface ParasiteStatsRaw {
  hashrate: number; // H/s
  workers: number;
  lastSubmission: string; // human string like "1m ago", not machine-parseable
  bestDifficulty: string; // abbreviated form, e.g. "1.13T"
  uptime: string;
  workerData: ParasiteWorkerRaw[];
}

export async function fetchParasiteStats(address: string): Promise<ParasiteStatsRaw> {
  const res = await fetch(`https://parasite.space/api/user/${address}`);
  if (!res.ok) {
    throw new Error(`parasite.space request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ParasiteStatsRaw;
}
