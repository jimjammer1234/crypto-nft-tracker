import type { WsServerEvent } from "@crypto-nft-tracker/shared-types";

declare global {
  interface Window {
    electronBridge?: {
      platform: string;
      onWsEvent: (callback: (event: WsServerEvent) => void) => () => void;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};
