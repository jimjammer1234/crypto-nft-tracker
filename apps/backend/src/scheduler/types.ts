import type { MiningSnapshot, NftCollectionSnapshot, NftListingEvent, AlertEvent } from "@crypto-nft-tracker/shared-types";

export interface Notifiers {
  onMiningSnapshot: (snapshot: MiningSnapshot) => void;
  onNftCollectionSnapshot: (snapshot: NftCollectionSnapshot) => void;
  onNftListing: (listing: NftListingEvent) => void;
  onAlert: (alert: AlertEvent) => void;
}
