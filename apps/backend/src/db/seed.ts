import "../config/loadEnv.js";
import { and, eq } from "drizzle-orm";
import { db, queryClient } from "./client.js";
import { miningSources } from "./schema/mining.js";
import { nftCollections, nftWallets } from "./schema/nft.js";
import { alertRules } from "./schema/alerts.js";
import { env } from "../config/env.js";

interface SourceSeed {
  kind: string;
  label: string;
  coin: string;
  identifier: string;
  endpointMeta?: Record<string, unknown>;
  tracksBalance: boolean;
}

async function seedMiningSources() {
  const seeds: SourceSeed[] = [
    { kind: "ckpool", label: "BTC Solo (ckpool)", coin: "BTC", identifier: env.CKPOOL_BTC_ADDRESS, tracksBalance: false },
    ...(env.KANO_USERNAME && env.KANO_API_KEY
      ? [
          {
            kind: "kano",
            label: "BTC Solo (kano.is)",
            coin: "BTC",
            identifier: env.KANO_USERNAME,
            endpointMeta: { apiKey: env.KANO_API_KEY },
            tracksBalance: false,
          } satisfies SourceSeed,
        ]
      : []),
    ...(env.HEROMINERS_PRL_ADDRESS
      ? [
          {
            kind: "herominers",
            label: "PRL Solo (herominers)",
            coin: "PRL",
            identifier: env.HEROMINERS_PRL_ADDRESS,
            tracksBalance: true,
          } satisfies SourceSeed,
        ]
      : []),
    ...(env.HEROMINERS_XMR_ADDRESS
      ? [
          {
            kind: "herominers",
            label: "XMR Solo (herominers)",
            coin: "XMR",
            identifier: env.HEROMINERS_XMR_ADDRESS,
            tracksBalance: true,
          } satisfies SourceSeed,
        ]
      : []),
    ...(env.HASHVAULT_XMR_ADDRESS
      ? [
          {
            kind: "hashvault",
            label: "XMR Solo (hashvault)",
            coin: "XMR",
            identifier: env.HASHVAULT_XMR_ADDRESS,
            tracksBalance: true,
          } satisfies SourceSeed,
        ]
      : []),
  ];

  for (const seed of seeds) {
    // Dedupe by (kind, coin), not identifier alone: herominers-XMR and hashvault-XMR are
    // different pools that happen to share the same wallet address.
    const [existing] = await db
      .select()
      .from(miningSources)
      .where(and(eq(miningSources.kind, seed.kind), eq(miningSources.coin, seed.coin)));

    const sourceId = existing
      ? existing.id
      : (
          await db
            .insert(miningSources)
            .values({
              kind: seed.kind,
              label: seed.label,
              coin: seed.coin,
              identifier: seed.identifier,
              endpointMeta: seed.endpointMeta ?? null,
            })
            .returning()
        )[0].id;

    if (!existing) {
      console.log(`Seeded mining source: ${seed.label}`);
    }

    const rules: Array<{ kind: string; config: Record<string, unknown> }> = [
      { kind: "rig_offline", config: { staleMinutes: 30 } },
      { kind: "hashrate_drop", config: { dropPercent: 30 } },
    ];
    if (seed.tracksBalance) {
      // herominers/hashvault report a blocks-found counter; ckpool/kano's stats endpoints don't.
      rules.push({ kind: "payout_received", config: {} }, { kind: "block_found", config: {} });
    }
    await seedAlertRules("mining_source", sourceId, rules);
  }
}

const NFT_COLLECTION_SEEDS = [
  { slug: "boredapeyachtclub", name: "Bored Ape Yacht Club" },
  { slug: "azuki", name: "Azuki" },
  { slug: "pudgypenguins", name: "Pudgy Penguins" },
  { slug: "azuki-elementals", name: "Azuki Elementals" },
];

const NFT_WALLET_SEEDS = [
  { address: "0xBa93cA89F754D7FDE479678a1d7d53891fad6151" },
  { address: "0x9a19b22F0e19597401CF548c1843A8E9a1DB8792" },
  { address: "0x07C669Fc7bC04E015fE8d53425b6f32f67a38eEa" },
];

async function seedNftSources() {
  for (const seed of NFT_COLLECTION_SEEDS) {
    const [existing] = await db.select().from(nftCollections).where(eq(nftCollections.slug, seed.slug));
    const collectionId = existing
      ? existing.id
      : (await db.insert(nftCollections).values({ slug: seed.slug, name: seed.name }).returning())[0].id;

    if (!existing) console.log(`Seeded NFT collection: ${seed.name}`);

    await seedAlertRules("nft_collection", collectionId, [
      { kind: "new_listing", config: {} },
      { kind: "floor_threshold", config: { direction: "below", value: 0 } }, // disabled by default (0 ETH never triggers); edit via alert_rules to set a real threshold
    ]);
  }

  for (const seed of NFT_WALLET_SEEDS) {
    const [existing] = await db.select().from(nftWallets).where(eq(nftWallets.address, seed.address));
    const walletId = existing
      ? existing.id
      : (await db.insert(nftWallets).values({ address: seed.address }).returning())[0].id;

    if (!existing) console.log(`Seeded NFT wallet: ${seed.address}`);

    await seedAlertRules("nft_wallet", walletId, [{ kind: "portfolio_change", config: { changePercent: 15 } }]);
  }
}

async function seedAlertRules(
  targetType: "mining_source" | "nft_collection" | "nft_wallet",
  targetId: string,
  rules: Array<{ kind: string; config: Record<string, unknown> }>
) {
  const existingRules = await db.select().from(alertRules).where(eq(alertRules.targetId, targetId));
  const existingKinds = new Set(existingRules.map((r) => r.kind));
  const toInsert = rules.filter((r) => !existingKinds.has(r.kind));
  if (toInsert.length === 0) return;

  await db.insert(alertRules).values(
    toInsert.map((rule) => ({
      kind: rule.kind,
      targetType,
      targetId,
      config: rule.config,
    }))
  );
}

await seedMiningSources();
await seedNftSources();
await queryClient.end();
