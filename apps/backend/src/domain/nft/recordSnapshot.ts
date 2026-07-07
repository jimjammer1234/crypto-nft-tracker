import { and, desc, eq } from "drizzle-orm";
import type {
  NftCollectionSnapshot,
  NftListingEvent,
  AlertRule,
} from "@crypto-nft-tracker/shared-types";
import { db } from "../../db/client.js";
import { nftCollectionSnapshots, nftListingEvents, nftCollections } from "../../db/schema/nft.js";
import { nftWalletSnapshots } from "../../db/schema/nft.js";
import { alertRules, alertEvents } from "../../db/schema/alerts.js";
import { evaluateFloorThresholdAlert, evaluatePortfolioChangeAlert } from "./alertRules.js";
import type { Notifiers } from "../../scheduler/types.js";
import { logger } from "../../utils/logger.js";

async function loadRules(targetType: "nft_collection" | "nft_wallet", targetId: string): Promise<AlertRule[]> {
  const rows = await db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.targetType, targetType), eq(alertRules.targetId, targetId), eq(alertRules.enabled, true)));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as AlertRule["kind"],
    targetType: r.targetType as AlertRule["targetType"],
    targetId: r.targetId,
    config: r.config as Record<string, unknown>,
    enabled: r.enabled,
  }));
}

async function fireAlert(fired: { ruleId: string; message: string; severity: string; payload: object }, notifiers?: Notifiers) {
  const [eventRow] = await db
    .insert(alertEvents)
    .values({ ruleId: fired.ruleId, message: fired.message, severity: fired.severity, payload: fired.payload })
    .returning();

  notifiers?.onAlert({
    id: eventRow.id.toString(),
    ruleId: eventRow.ruleId,
    firedAt: eventRow.firedAt.toISOString(),
    message: eventRow.message,
    severity: eventRow.severity as "info" | "warning" | "critical",
    payload: eventRow.payload as Record<string, unknown> | null,
    acknowledged: eventRow.acknowledged,
  });
}

export async function recordCollectionSnapshot(collectionId: string, snapshot: NftCollectionSnapshot, notifiers?: Notifiers) {
  const [previousRow] = await db
    .select()
    .from(nftCollectionSnapshots)
    .where(and(eq(nftCollectionSnapshots.collectionId, collectionId), eq(nftCollectionSnapshots.marketplace, snapshot.marketplace)))
    .orderBy(desc(nftCollectionSnapshots.polledAt))
    .limit(1);

  const previous: NftCollectionSnapshot | null = previousRow
    ? {
        collectionId,
        marketplace: snapshot.marketplace,
        polledAt: previousRow.polledAt.toISOString(),
        floorPrice: previousRow.floorPrice ? Number(previousRow.floorPrice) : null,
        floorCurrency: previousRow.floorCurrency,
        volume24h: previousRow.volume24h ? Number(previousRow.volume24h) : null,
        numListed: previousRow.numListed,
      }
    : null;

  await db.insert(nftCollectionSnapshots).values({
    collectionId,
    marketplace: snapshot.marketplace,
    polledAt: new Date(snapshot.polledAt),
    floorPrice: snapshot.floorPrice?.toString(),
    floorCurrency: snapshot.floorCurrency,
    volume24h: snapshot.volume24h?.toString(),
    numListed: snapshot.numListed,
  });

  notifiers?.onNftCollectionSnapshot(snapshot);

  const rules = await loadRules("nft_collection", collectionId);
  for (const rule of rules) {
    if (rule.kind !== "floor_threshold") continue;
    const fired = evaluateFloorThresholdAlert(rule, snapshot, previous);
    if (!fired) continue;
    logger.warn({ collectionId, message: fired.message }, "nft alert fired");
    await fireAlert(fired, notifiers);
  }
}

const BOT_RELIST_THRESHOLD_MS = 20 * 60 * 1000;

/** True when this token's previous listing (if any) ended less than 20 minutes before this one —
 * relisting that fast is a common bot pattern (bumping search rank, farming marketplace rewards)
 * rather than a genuine new listing. Compares against the most recent row regardless of its own
 * likelyBot flag, so a bot relisting every 15 minutes for hours keeps getting caught, not just once. */
async function isBotRelist(collectionId: string, marketplace: string, tokenId: string, listedAt: Date): Promise<boolean> {
  const [previous] = await db
    .select()
    .from(nftListingEvents)
    .where(
      and(
        eq(nftListingEvents.collectionId, collectionId),
        eq(nftListingEvents.marketplace, marketplace),
        eq(nftListingEvents.tokenId, tokenId)
      )
    )
    .orderBy(desc(nftListingEvents.listedAt))
    .limit(1);

  if (!previous) return false;
  const gapMs = listedAt.getTime() - previous.listedAt.getTime();
  return gapMs >= 0 && gapMs <= BOT_RELIST_THRESHOLD_MS;
}

/** Inserts only genuinely new listings (deduped by collection+marketplace+token+listedAt) and fires
 * new_listing alerts for each one actually inserted — except listings flagged as likely bot activity
 * (see isBotRelist), which are still recorded but silently, with no alert. */
export async function recordListings(collectionId: string, listings: NftListingEvent[], notifiers?: Notifiers) {
  if (listings.length === 0) return;

  const rules = await loadRules("nft_collection", collectionId);
  const newListingRule = rules.find((r) => r.kind === "new_listing");

  for (const listing of listings) {
    const listedAt = new Date(listing.listedAt);
    const likelyBot = await isBotRelist(collectionId, listing.marketplace, listing.tokenId, listedAt);

    const inserted = await db
      .insert(nftListingEvents)
      .values({
        collectionId,
        marketplace: listing.marketplace,
        tokenId: listing.tokenId,
        price: listing.price?.toString(),
        currency: listing.currency,
        seller: listing.seller,
        listedAt,
        likelyBot,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length === 0) continue; // already seen this listing
    if (likelyBot) {
      logger.debug({ collectionId, tokenId: listing.tokenId }, "suppressing likely bot relisting");
      continue;
    }

    notifiers?.onNftListing(listing);

    if (newListingRule) {
      await fireAlert(
        {
          ruleId: newListingRule.id,
          severity: "info",
          message: `New listing: token #${listing.tokenId} at ${listing.price} ${listing.currency}`,
          payload: { tokenId: listing.tokenId, price: listing.price, currency: listing.currency },
        },
        notifiers
      );
    }
  }
}

export async function recordWalletSnapshot(walletId: string, nftCount: number, holdings: Array<{ collectionSlug: string; tokenId: string }>, notifiers?: Notifiers) {
  const [previousRow] = await db
    .select()
    .from(nftWalletSnapshots)
    .where(eq(nftWalletSnapshots.walletId, walletId))
    .orderBy(desc(nftWalletSnapshots.polledAt))
    .limit(1);

  // Cross-reference each held NFT's collection against our tracked collections' latest floor price.
  const trackedCollections = await db.select().from(nftCollections);
  const slugToId = new Map(trackedCollections.map((c) => [c.slug, c.id]));

  let totalValueEth = 0;
  let pricedCount = 0;
  const pricedHoldings = [];
  for (const holding of holdings) {
    const collectionId = slugToId.get(holding.collectionSlug);
    let estValue: number | null = null;
    if (collectionId) {
      const [latest] = await db
        .select()
        .from(nftCollectionSnapshots)
        .where(eq(nftCollectionSnapshots.collectionId, collectionId))
        .orderBy(desc(nftCollectionSnapshots.polledAt))
        .limit(1);
      if (latest?.floorPrice) {
        estValue = Number(latest.floorPrice);
        totalValueEth += estValue;
        pricedCount++;
      }
    }
    pricedHoldings.push({ ...holding, estValue });
  }

  const currentValueEth = pricedCount > 0 ? totalValueEth : null;
  const previousValueEth = previousRow?.totalValueEth ? Number(previousRow.totalValueEth) : null;

  await db.insert(nftWalletSnapshots).values({
    walletId,
    polledAt: new Date(),
    totalValueEth: currentValueEth?.toString(),
    nftCount,
    holdings: pricedHoldings,
  });

  const rules = await loadRules("nft_wallet", walletId);
  for (const rule of rules) {
    if (rule.kind !== "portfolio_change") continue;
    const fired = evaluatePortfolioChangeAlert(rule, currentValueEth, previousValueEth);
    if (!fired) continue;
    logger.warn({ walletId, message: fired.message }, "nft alert fired");
    await fireAlert(fired, notifiers);
  }
}
