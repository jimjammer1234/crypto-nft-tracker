import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { nftCollections } from "../../db/schema/nft.js";
import { fetchCollectionStats, fetchCollectionListings } from "../../integrations/nft/openSeaClient.js";
import { normalizeOpenSeaCollectionSnapshot, normalizeOpenSeaListing } from "../../domain/nft/normalize.js";
import { recordCollectionSnapshot, recordListings } from "../../domain/nft/recordSnapshot.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollOpenSeaCollections(notifiers?: Notifiers) {
  if (!env.OPENSEA_API_KEY) return;

  const collections = await db.select().from(nftCollections).where(eq(nftCollections.enabled, true));
  for (const collection of collections) {
    try {
      const stats = await fetchCollectionStats(env.OPENSEA_API_KEY, collection.slug);
      const snapshot = normalizeOpenSeaCollectionSnapshot(collection.id, stats);
      await recordCollectionSnapshot(collection.id, snapshot, notifiers);
      logger.info({ collection: collection.slug, floorPrice: snapshot.floorPrice }, "polled opensea collection stats");
    } catch (err) {
      logger.error({ err, collection: collection.slug }, "opensea collection stats poll failed");
    }
  }
}

export async function pollOpenSeaListings(notifiers?: Notifiers) {
  if (!env.OPENSEA_API_KEY) return;

  const collections = await db.select().from(nftCollections).where(eq(nftCollections.enabled, true));
  for (const collection of collections) {
    try {
      const response = await fetchCollectionListings(env.OPENSEA_API_KEY, collection.slug, 50);
      const listings = response.listings.map((raw) => normalizeOpenSeaListing(collection.id, raw));
      await recordListings(collection.id, listings, notifiers);
      logger.info({ collection: collection.slug, count: listings.length }, "polled opensea listings");
    } catch (err) {
      logger.error({ err, collection: collection.slug }, "opensea listings poll failed");
    }
  }
}
