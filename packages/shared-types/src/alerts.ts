export type AlertKind =
  | "rig_offline"
  | "hashrate_drop"
  | "payout_received"
  | "new_listing"
  | "floor_threshold"
  | "portfolio_change";

export type AlertTargetType = "mining_source" | "nft_collection" | "nft_wallet";
export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertRule {
  id: string;
  kind: AlertKind;
  targetType: AlertTargetType;
  targetId: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  firedAt: string;
  message: string;
  severity: AlertSeverity;
  payload: Record<string, unknown> | null;
  acknowledged: boolean;
}
