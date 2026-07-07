import { describe, it, expect } from "vitest";
import {
  normalizeOpenSeaCollectionSnapshot,
  normalizeOpenSeaListing,
  normalizeOpenSeaWalletHoldings,
} from "../../src/domain/nft/normalize.js";
import type {
  OpenSeaCollectionStatsRaw,
  OpenSeaListingsResponseRaw,
  OpenSeaWalletNftsResponseRaw,
} from "../../src/integrations/nft/openSeaClient.js";
import statsFixture from "../integrations/__fixtures__/opensea-stats-bayc.json" with { type: "json" };
import listingsFixture from "../integrations/__fixtures__/opensea-listings-bayc.json" with { type: "json" };
import walletFixture from "../integrations/__fixtures__/opensea-wallet-nfts.json" with { type: "json" };

describe("normalizeOpenSeaCollectionSnapshot", () => {
  it("normalizes a real BAYC stats response", () => {
    const snapshot = normalizeOpenSeaCollectionSnapshot("col-1", statsFixture as OpenSeaCollectionStatsRaw);
    expect(snapshot.marketplace).toBe("opensea");
    expect(snapshot.floorPrice).toBe(statsFixture.total.floor_price);
    expect(snapshot.floorCurrency).toBe("ETH");
  });
});

describe("normalizeOpenSeaListing", () => {
  it("converts a real listing's wei price into a decimal ETH price", () => {
    const raw = (listingsFixture as OpenSeaListingsResponseRaw).listings[0];
    const listing = normalizeOpenSeaListing("col-1", raw);
    expect(listing.tokenId).toBe(raw.asset.identifier);
    expect(listing.price).toBeCloseTo(Number(raw.price.current.value) / 1e18, 6);
    expect(listing.seller).toBe(raw.protocol_data.parameters.offerer);
  });
});

describe("normalizeOpenSeaWalletHoldings", () => {
  it("counts NFTs and maps collection/token id from a real wallet holdings response", () => {
    const nfts = (walletFixture as OpenSeaWalletNftsResponseRaw).nfts;
    const snapshot = normalizeOpenSeaWalletHoldings("wallet-1", nfts);
    expect(snapshot.nftCount).toBe(nfts.length);
    expect(snapshot.holdings[0].tokenId).toBe(nfts[0].identifier);
    expect(snapshot.holdings[0].collectionSlug).toBe(nfts[0].collection);
  });
});
