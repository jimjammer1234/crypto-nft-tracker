import type { AlertRule, NftCollectionSnapshot } from "@crypto-nft-tracker/shared-types";
import type { FiredAlert } from "../mining/alertRules.js";

/** Fires only when the floor newly crosses the configured threshold (edge-triggered), not on every
 * poll while it remains past the threshold. */
export function evaluateFloorThresholdAlert(
  rule: AlertRule,
  current: NftCollectionSnapshot,
  previous: NftCollectionSnapshot | null
): FiredAlert | null {
  if (current.floorPrice === null) return null;

  const direction = rule.config.direction === "above" ? "above" : "below";
  const threshold = Number(rule.config.value);
  if (Number.isNaN(threshold)) return null;

  const meetsNow = direction === "above" ? current.floorPrice >= threshold : current.floorPrice <= threshold;
  if (!meetsNow) return null;

  const metBefore =
    previous?.floorPrice !== null &&
    previous?.floorPrice !== undefined &&
    (direction === "above" ? previous.floorPrice >= threshold : previous.floorPrice <= threshold);
  if (metBefore) return null;

  return {
    ruleId: rule.id,
    severity: "warning",
    message: `Floor price ${direction === "above" ? "rose above" : "dropped below"} ${threshold} ${current.floorCurrency} (now ${current.floorPrice})`,
    payload: { floorPrice: current.floorPrice, threshold, direction },
  };
}

export function evaluatePortfolioChangeAlert(
  rule: AlertRule,
  currentValueEth: number | null,
  previousValueEth: number | null
): FiredAlert | null {
  if (currentValueEth === null || previousValueEth === null || previousValueEth === 0) return null;

  const changePercentThreshold = Number(rule.config.changePercent ?? 15);
  const actualChangePercent = ((currentValueEth - previousValueEth) / previousValueEth) * 100;
  if (Math.abs(actualChangePercent) < changePercentThreshold) return null;

  return {
    ruleId: rule.id,
    severity: "info",
    message: `Portfolio value ${actualChangePercent > 0 ? "up" : "down"} ${Math.abs(actualChangePercent).toFixed(0)}% (${previousValueEth.toFixed(3)} -> ${currentValueEth.toFixed(3)} ETH)`,
    payload: { previousValueEth, currentValueEth, actualChangePercent },
  };
}
