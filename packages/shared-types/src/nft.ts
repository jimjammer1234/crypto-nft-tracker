export type Marketplace = "opensea" | "blur";

export interface NftWallet {
  id: string;
  address: string;
  label: string | null;
  chain: string;
  enabled: boolean;
}

export interface NftCollection {
  id: string;
  slug: string;
  contractAddress: string | null;
  name: string;
  chain: string;
  enabled: boolean;
}

export interface NftCollectionSnapshot {
  collectionId: string;
  marketplace: Marketplace;
  polledAt: string;
  floorPrice: number | null;
  floorCurrency: string;
  volume24h: number | null;
  numListed: number | null;
}

export interface NftListingEvent {
  collectionId: string;
  marketplace: Marketplace;
  tokenId: string;
  price: number | null;
  currency: string;
  seller: string | null;
  listedAt: string;
}

export interface NftWalletSnapshot {
  walletId: string;
  polledAt: string;
  totalValueEth: number | null;
  nftCount: number | null;
  holdings: Array<{ collectionSlug: string; tokenId: string; estValue: number | null }>;
}
