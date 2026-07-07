import type { MiningSourceRow } from "./apiClient.js";

const HEROMINERS_SUBDOMAIN: Record<string, string> = { PRL: "pearl", XMR: "monero" };

export function miningSourceUrl(source: MiningSourceRow): string {
  switch (source.kind) {
    case "ckpool":
      return `https://solo.ckpool.org/users/${source.identifier}`;
    case "kano":
      return `https://kano.is/index.php?k=work&username=${source.identifier}`;
    case "herominers":
      return `https://${HEROMINERS_SUBDOMAIN[source.coin] ?? "www"}.herominers.com/`;
    case "hashvault":
      return "https://hashvault.pro/monero/dashboard";
    default:
      return "https://kano.is/";
  }
}
