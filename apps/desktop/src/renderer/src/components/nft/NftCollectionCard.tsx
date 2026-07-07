import type { NftCollectionRow } from "../../lib/apiClient.js";
import { useNftCollectionSnapshots } from "../../hooks/useNftData.js";
import { formatEth } from "../../lib/format.js";
import { Card } from "../ui/Card.js";

export function NftCollectionCard({ collection }: { collection: NftCollectionRow }) {
  const snapshots = useNftCollectionSnapshots(collection.id);
  const latest = snapshots.find((s) => s.marketplace === "opensea");

  return (
    <Card>
      <div className="text-sm font-medium text-white">{collection.name}</div>
      <div className="mt-2 text-2xl font-semibold text-blue-400">{formatEth(latest?.floorPrice, latest?.floorCurrency)}</div>
      <div className="mt-2 text-xs text-gray-500">
        {latest?.volume24h ? `${formatEth(latest.volume24h)} vol (24h)` : "no recent volume"}
      </div>
    </Card>
  );
}
