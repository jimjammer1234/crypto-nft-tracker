import "../config/loadEnv.js";
import { and, eq } from "drizzle-orm";
import { db, queryClient } from "./client.js";
import { miningSources } from "./schema/mining.js";
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

    await seedDefaultAlertRules(sourceId, seed.tracksBalance);
  }
}

async function seedDefaultAlertRules(sourceId: string, tracksBalance: boolean) {
  const existingRules = await db.select().from(alertRules).where(eq(alertRules.targetId, sourceId));
  const existingKinds = new Set(existingRules.map((r) => r.kind));

  const toInsert: Array<{ kind: string; config: Record<string, unknown> }> = [];
  if (!existingKinds.has("rig_offline")) {
    toInsert.push({ kind: "rig_offline", config: { staleMinutes: 30 } });
  }
  if (!existingKinds.has("hashrate_drop")) {
    toInsert.push({ kind: "hashrate_drop", config: { dropPercent: 30 } });
  }
  if (tracksBalance && !existingKinds.has("payout_received")) {
    toInsert.push({ kind: "payout_received", config: {} });
  }

  if (toInsert.length === 0) return;

  await db.insert(alertRules).values(
    toInsert.map((rule) => ({
      kind: rule.kind,
      targetType: "mining_source",
      targetId: sourceId,
      config: rule.config,
    }))
  );
}

await seedMiningSources();
await queryClient.end();
