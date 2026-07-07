import { PageShell } from "../components/layout/PageShell.js";
import { MiningSourceCard } from "../components/mining/MiningSourceCard.js";
import { NftCollectionCard } from "../components/nft/NftCollectionCard.js";
import { useMiningSources } from "../hooks/useMiningData.js";
import { useNftCollections } from "../hooks/useNftData.js";

export function Dashboard() {
  const { sources } = useMiningSources();
  const collections = useNftCollections();

  return (
    <PageShell title="Dashboard">
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Mining</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {sources.map((source) => (
            <MiningSourceCard key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">NFT Collections</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {collections.map((collection) => (
            <NftCollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
