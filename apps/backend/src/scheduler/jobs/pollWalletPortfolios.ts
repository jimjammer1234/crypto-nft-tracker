import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { nftWallets } from "../../db/schema/nft.js";
import { fetchWalletNfts } from "../../integrations/nft/openSeaClient.js";
import { recordWalletSnapshot } from "../../domain/nft/recordSnapshot.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollWalletPortfolios(notifiers?: Notifiers) {
  if (!env.OPENSEA_API_KEY) return;

  const wallets = await db.select().from(nftWallets).where(eq(nftWallets.enabled, true));
  for (const wallet of wallets) {
    try {
      const response = await fetchWalletNfts(env.OPENSEA_API_KEY, wallet.address, wallet.chain);
      const holdings = response.nfts.map((nft) => ({ collectionSlug: nft.collection, tokenId: nft.identifier }));
      await recordWalletSnapshot(wallet.id, response.nfts.length, holdings, notifiers);
      logger.info({ wallet: wallet.address, nftCount: response.nfts.length }, "polled wallet portfolio");
    } catch (err) {
      logger.error({ err, wallet: wallet.address }, "wallet portfolio poll failed");
    }
  }
}
