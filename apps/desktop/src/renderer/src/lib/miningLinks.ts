import type { MiningSourceRow } from "./apiClient.js";

const HEROMINERS_SUBDOMAIN: Record<string, string> = { PRL: "pearl", XMR: "monero" };
const TWOMINERS_SUBDOMAIN: Record<string, string> = { ZEC: "solo-zec" };

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
    case "2miners":
      return `https://${TWOMINERS_SUBDOMAIN[source.coin] ?? "solo-zec"}.2miners.com/account/${source.identifier}`;
    default:
      return "https://kano.is/";
  }
}
