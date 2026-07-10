import { create } from "zustand";
import type { AlertEvent } from "@crypto-nft-tracker/shared-types";

interface AlertStore {
  recentAlerts: AlertEvent[];
  dismissedIds: Set<string>;
  pushAlert: (alert: AlertEvent) => void;
  dismissAlert: (id: string) => void;
}

const MAX_RECENT = 30;

export const useAlertStore = create<AlertStore>((set) => ({
  recentAlerts: [],
  dismissedIds: new Set(),
  pushAlert: (alert) =>
    set((state) => ({ recentAlerts: [alert, ...state.recentAlerts].slice(0, MAX_RECENT) })),
  dismissAlert: (id) =>
    set((state) => ({ dismissedIds: new Set(state.dismissedIds).add(id) })),
}));
