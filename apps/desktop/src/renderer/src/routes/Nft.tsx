import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageShell } from "../components/layout/PageShell.js";
import { Card } from "../components/ui/Card.js";
import {
  useNftCollections,
  useNftCollectionSnapshots,
  useNftCollectionListings,
  useNftWallets,
  useNftWalletSnapshots,
} from "../hooks/useNftData.js";
import { formatEth, formatRelativeTime } from "../lib/format.js";

export function Nft() {
  const collections = useNftCollections();
  const wallets = useNftWallets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? collections[0]?.id ?? null;

  const snapshots = useNftCollectionSnapshots(activeId).filter((s) => s.marketplace === "opensea");
  const listings = useNftCollectionListings(activeId);
  const activeCollection = collections.find((c) => c.id === activeId);
  const latest = snapshots[0];

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({
      time: new Date(s.polledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      floor: Number(s.floorPrice ?? 0),
    }));

  return (
    <PageShell title="NFTs">
      <div className="mb-4 flex flex-wrap gap-2">
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              c.id === activeId ? "bg-purple-600 text-white" : "bg-elevated text-gray-400 hover:text-white"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeCollection && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Card>
              <div className="text-xs uppercase text-gray-400">Floor Price</div>
              <div className="mt-1 text-xl font-semibold text-purple-400">{formatEth(latest?.floorPrice, latest?.floorCurrency)}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-gray-400">24h Volume</div>
              <div className="mt-1 text-xl font-semibold text-blue-400">{formatEth(latest?.volume24h)}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-gray-400">Active Listings Seen</div>
              <div className="mt-1 text-xl font-semibold text-yellow-400">{listings.length}</div>
            </Card>
          </div>

          <Card className="mb-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2438" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{ background: "#1f1b2e", border: "1px solid #2a2438", borderRadius: 8 }}
                  formatter={(value: number) => formatEth(value)}
                />
                <Line type="monotone" dataKey="floor" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recent Listings</h2>
          <Card className="mb-8">
            <div className="divide-y divide-border">
              {listings.slice(0, 10).map((listing) => (
                <div key={listing.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-300">#{listing.tokenId}</span>
                  <span className="text-yellow-400">{formatEth(listing.price, listing.currency ?? "ETH")}</span>
                  <span className="text-gray-500">{formatRelativeTime(listing.listedAt)}</span>
                </div>
              ))}
              {listings.length === 0 && <div className="py-2 text-sm text-gray-500">No listings tracked yet.</div>}
            </div>
          </Card>
        </>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Wallets</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {wallets.map((wallet) => (
          <WalletCard key={wallet.id} walletId={wallet.id} address={wallet.address} />
        ))}
      </div>
    </PageShell>
  );
}

function WalletCard({ walletId, address }: { walletId: string; address: string }) {
  const snapshots = useNftWalletSnapshots(walletId);
  const latest = snapshots[0];

  return (
    <Card>
      <div className="truncate text-xs text-gray-400" title={address}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
      <div className="mt-1 text-xl font-semibold text-purple-400">{latest?.nftCount ?? "—"} NFTs</div>
      <div className="mt-1 text-xs text-gray-500">
        {latest?.totalValueEth ? `${formatEth(latest.totalValueEth)} tracked value` : "value pending floor data"}
      </div>
    </Card>
  );
}
