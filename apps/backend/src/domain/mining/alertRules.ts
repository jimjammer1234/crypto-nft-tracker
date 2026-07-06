import type { AlertRule, AlertSeverity, MiningSnapshot } from "@crypto-nft-tracker/shared-types";

export interface FiredAlert {
  ruleId: string;
  message: string;
  severity: AlertSeverity;
  payload: Record<string, unknown>;
}

const DEFAULT_STALE_MINUTES = 30;
const DEFAULT_HASHRATE_DROP_PERCENT = 30;

function minutesSince(isoDate: string, now: Date): number {
  return (now.getTime() - new Date(isoDate).getTime()) / 60_000;
}

export function evaluateMiningAlert(
  rule: AlertRule,
  current: MiningSnapshot,
  previous: MiningSnapshot | null,
  now: Date = new Date()
): FiredAlert | null {
  switch (rule.kind) {
    case "rig_offline": {
      if (!current.lastShareAt) return null;
      const staleMinutes = Number(rule.config.staleMinutes ?? DEFAULT_STALE_MINUTES);
      const idleMinutes = minutesSince(current.lastShareAt, now);
      if (idleMinutes < staleMinutes) return null;
      return {
        ruleId: rule.id,
        severity: "critical",
        message: `No shares received in ${Math.round(idleMinutes)} minutes`,
        payload: { idleMinutes, lastShareAt: current.lastShareAt },
      };
    }

    case "hashrate_drop": {
      const currentRate = current.hashrate1hr ?? current.hashrate1m;
      const previousRate = previous?.hashrate1hr ?? previous?.hashrate1m;
      if (currentRate === null || currentRate === undefined) return null;
      if (previousRate === null || previousRate === undefined || previousRate === 0) return null;

      const dropPercent = Number(rule.config.dropPercent ?? DEFAULT_HASHRATE_DROP_PERCENT);
      const actualDropPercent = ((previousRate - currentRate) / previousRate) * 100;
      if (actualDropPercent < dropPercent) return null;

      return {
        ruleId: rule.id,
        severity: "warning",
        message: `Hashrate dropped ${actualDropPercent.toFixed(0)}% (${previousRate.toExponential(2)} -> ${currentRate.toExponential(2)} H/s)`,
        payload: { previousRate, currentRate, actualDropPercent },
      };
    }

    case "payout_received": {
      if (current.balance === null || current.balance === undefined) return null;
      if (previous?.balance === null || previous?.balance === undefined) return null;
      if (current.balance >= previous.balance) return null;

      const amount = previous.balance - current.balance;
      return {
        ruleId: rule.id,
        severity: "info",
        message: `Balance decreased by ${amount} (likely a payout)`,
        payload: { amount, previousBalance: previous.balance, currentBalance: current.balance },
      };
    }

    default:
      return null;
  }
}
