import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { nftCollections, nftCollectionSnapshots, nftListingEvents, nftWallets, nftWalletSnapshots } from "../../db/schema/nft.js";

export async function registerNftRoutes(app: FastifyInstance) {
  app.get("/api/nft/collections", async () => db.select().from(nftCollections));

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/api/nft/collections/:id/snapshots",
    async (request) => {
      const limit = Math.min(Number(request.query.limit ?? 100), 1000);
      return db
        .select()
        .from(nftCollectionSnapshots)
        .where(eq(nftCollectionSnapshots.collectionId, request.params.id))
        .orderBy(desc(nftCollectionSnapshots.polledAt))
        .limit(limit);
    }
  );

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/api/nft/collections/:id/listings",
    async (request) => {
      const limit = Math.min(Number(request.query.limit ?? 50), 500);
      // Bot/wash relistings are still recorded (for accurate gap-detection) but excluded here by
      // default, since they're not genuine listings a user would want to see or act on.
      return db
        .select()
        .from(nftListingEvents)
        .where(and(eq(nftListingEvents.collectionId, request.params.id), eq(nftListingEvents.likelyBot, false)))
        .orderBy(desc(nftListingEvents.listedAt))
        .limit(limit);
    }
  );

  app.get("/api/nft/wallets", async () => db.select().from(nftWallets));

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/api/nft/wallets/:id/snapshots",
    async (request) => {
      const limit = Math.min(Number(request.query.limit ?? 50), 500);
      return db
        .select()
        .from(nftWalletSnapshots)
        .where(eq(nftWalletSnapshots.walletId, request.params.id))
        .orderBy(desc(nftWalletSnapshots.polledAt))
        .limit(limit);
    }
  );
}
