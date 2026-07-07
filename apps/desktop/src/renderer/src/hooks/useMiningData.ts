import { useEffect, useState } from "react";
import { api, type MiningSourceRow, type MiningSnapshotRow } from "../lib/apiClient.js";

const REFRESH_MS = 30_000;

export function useMiningSources() {
  const [sources, setSources] = useState<MiningSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getMiningSources();
        if (!cancelled) {
          setSources(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { sources, loading, error };
}

export function useMiningSnapshots(sourceId: string | null, limit = 60) {
  const [snapshots, setSnapshots] = useState<MiningSnapshotRow[]>([]);

  useEffect(() => {
    if (!sourceId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getMiningSnapshots(sourceId!, limit);
        if (!cancelled) setSnapshots(data);
      } catch {
        // transient fetch errors are fine; the next poll retries
      }
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sourceId, limit]);

  return snapshots;
}
