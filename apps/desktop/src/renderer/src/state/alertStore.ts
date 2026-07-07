import { create } from "zustand";
import type { AlertEvent } from "@crypto-nft-tracker/shared-types";

interface AlertStore {
  recentAlerts: AlertEvent[];
  pushAlert: (alert: AlertEvent) => void;
}

const MAX_RECENT = 30;

export const useAlertStore = create<AlertStore>((set) => ({
  recentAlerts: [],
  pushAlert: (alert) =>
    set((state) => ({ recentAlerts: [alert, ...state.recentAlerts].slice(0, MAX_RECENT) })),
}));
