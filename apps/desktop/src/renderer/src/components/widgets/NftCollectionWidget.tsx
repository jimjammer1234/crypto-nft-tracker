import type { NftCollectionRow } from "../../lib/apiClient.js";
import { useNftCollectionSnapshots, useNftCollectionListings } from "../../hooks/useNftData.js";
import { formatEth, formatRelativeTime } from "../../lib/format.js";
import { openExternal } from "../../lib/openExternal.js";
import { Sparkline } from "../ui/Sparkline.js";
import { Card } from "../ui/Card.js";

export function NftCollectionWidget({ collection }: { collection: NftCollectionRow }) {
  const snapshots = useNftCollectionSnapshots(collection.id).filter((s) => s.marketplace === "opensea");
  const listings = useNftCollectionListings(collection.id);
  const latest = snapshots[0];

  const chartData = [...snapshots].reverse().map((s) => ({ x: s.polledAt, y: Number(s.floorPrice ?? 0) }));

  return (
    <Card
      onClick={() => openExternal(`https://opensea.io/collection/${collection.slug}`)}
      className="cursor-pointer transition-colors hover:border-blue-500"
    >
      <div className="text-sm font-medium text-white">{collection.name}</div>
      <div className="mt-3 text-2xl font-semibold text-blue-400">{formatEth(latest?.floorPrice, latest?.floorCurrency)}</div>

      <div className="mt-2">
        <Sparkline data={chartData} color="#60a5fa" formatValue={(v) => formatEth(v)} />
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{latest?.volume24h ? `${formatEth(latest.volume24h)} vol` : "no volume"}</span>
        <span>{listings.length} listed</span>
      </div>

      {listings.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-border pt-2">
          {listings.slice(0, 3).map((listing) => (
            <div key={listing.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">#{listing.tokenId}</span>
              <span className="text-yellow-400">{formatEth(listing.price, listing.currency ?? "ETH")}</span>
              <span className="text-gray-600">{formatRelativeTime(listing.listedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
