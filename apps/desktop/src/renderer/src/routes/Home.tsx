import { useMemo } from "react";
import { MiningWidget } from "../components/widgets/MiningWidget.js";
import { NftCollectionWidget } from "../components/widgets/NftCollectionWidget.js";
import { NftWalletWidget } from "../components/widgets/NftWalletWidget.js";
import { useMiningSources } from "../hooks/useMiningData.js";
import { useNftCollections, useNftWallets } from "../hooks/useNftData.js";

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h2>;
}

export function Home() {
  const { sources } = useMiningSources();
  const collections = useNftCollections();
  const wallets = useNftWallets();

  // Highest best-difficulty first; sources that don't expose one (herominers, hashvault, 2miners) sink to the bottom.
  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => (b.latestBestDifficulty ?? -1) - (a.latestBestDifficulty ?? -1)),
    [sources]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <section className="mb-8">
        <SectionHeader title="Mining Rigs" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedSources.map((source) => (
            <MiningWidget key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionHeader title="NFT Collections" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => (
            <NftCollectionWidget key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="NFT Wallets" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wallets.map((wallet) => (
            <NftWalletWidget key={wallet.id} wallet={wallet} />
          ))}
        </div>
      </section>
    </div>
  );
}
