import type { NftCollectionSnapshot, NftListingEvent, NftWalletSnapshot } from "@crypto-nft-tracker/shared-types";
import type {
  OpenSeaCollectionStatsRaw,
  OpenSeaListingRaw,
  OpenSeaNftRaw,
} from "../../integrations/nft/openSeaClient.js";

export function normalizeOpenSeaCollectionSnapshot(
  collectionId: string,
  raw: OpenSeaCollectionStatsRaw
): NftCollectionSnapshot {
  const oneDay = raw.intervals.find((i) => i.interval === "one_day");
  return {
    collectionId,
    marketplace: "opensea",
    polledAt: new Date().toISOString(),
    floorPrice: raw.total.floor_price ?? null,
    floorCurrency: raw.total.floor_price_symbol ?? "ETH",
    volume24h: oneDay?.volume ?? null,
    numListed: null, // not present on the /stats endpoint; would need a separate count query
  };
}

export function normalizeOpenSeaListing(collectionId: string, raw: OpenSeaListingRaw): NftListingEvent {
  const decimals = raw.price.current.decimals;
  const price = Number(raw.price.current.value) / 10 ** decimals;
  return {
    collectionId,
    marketplace: "opensea",
    tokenId: raw.asset.identifier,
    price,
    currency: raw.price.current.currency,
    seller: raw.protocol_data.parameters.offerer,
    listedAt: new Date(raw.order_created_at * 1000).toISOString(),
  };
}

/** estValue per holding is left null here; the poll job fills it in from the collection's latest
 * floor price snapshot, since OpenSea's wallet NFT listing doesn't include a per-item price. */
export function normalizeOpenSeaWalletHoldings(walletId: string, nfts: OpenSeaNftRaw[]): NftWalletSnapshot {
  return {
    walletId,
    polledAt: new Date().toISOString(),
    totalValueEth: null,
    nftCount: nfts.length,
    holdings: nfts.map((nft) => ({ collectionSlug: nft.collection, tokenId: nft.identifier, estValue: null })),
  };
}
