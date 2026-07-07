import { useEffect, useState } from "react";
import {
  api,
  type NftCollectionRow,
  type NftCollectionSnapshotRow,
  type NftListingRow,
  type NftWalletRow,
  type NftWalletSnapshotRow,
} from "../lib/apiClient.js";

const REFRESH_MS = 30_000;

function usePolled<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]): T {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

export function useNftCollections(): NftCollectionRow[] {
  return usePolled(() => api.getNftCollections(), [], []);
}

export function useNftCollectionSnapshots(collectionId: string | null): NftCollectionSnapshotRow[] {
  return usePolled(
    () => (collectionId ? api.getNftCollectionSnapshots(collectionId) : Promise.resolve([])),
    [],
    [collectionId]
  );
}

export function useNftCollectionListings(collectionId: string | null): NftListingRow[] {
  return usePolled(
    () => (collectionId ? api.getNftCollectionListings(collectionId) : Promise.resolve([])),
    [],
    [collectionId]
  );
}

export function useNftWallets(): NftWalletRow[] {
  return usePolled(() => api.getNftWallets(), [], []);
}

export function useNftWalletSnapshots(walletId: string | null): NftWalletSnapshotRow[] {
  return usePolled(
    () => (walletId ? api.getNftWalletSnapshots(walletId) : Promise.resolve([])),
    [],
    [walletId]
  );
}
