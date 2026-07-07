import type { NftWalletRow } from "../../lib/apiClient.js";
import { useNftWalletSnapshots } from "../../hooks/useNftData.js";
import { formatEth } from "../../lib/format.js";
import { Sparkline } from "../ui/Sparkline.js";
import { Card } from "../ui/Card.js";

export function NftWalletWidget({ wallet }: { wallet: NftWalletRow }) {
  const snapshots = useNftWalletSnapshots(wallet.id);
  const latest = snapshots[0];
  const chartData = [...snapshots].reverse().map((s) => ({ x: s.polledAt, y: Number(s.totalValueEth ?? 0) }));

  return (
    <Card>
      <div className="truncate text-xs text-gray-400" title={wallet.address}>
        {wallet.label ?? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
      </div>
      <div className="mt-3 text-2xl font-semibold text-purple-400">{latest?.nftCount ?? "—"} NFTs</div>

      <div className="mt-2">
        <Sparkline data={chartData} color="#a78bfa" formatValue={(v) => formatEth(v)} />
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {latest?.totalValueEth ? `${formatEth(latest.totalValueEth)} tracked value` : "value pending floor data"}
      </div>
    </Card>
  );
}
