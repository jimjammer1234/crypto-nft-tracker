import { and, desc, eq } from "drizzle-orm";
import type { MiningSnapshot, AlertRule, AlertSeverity } from "@crypto-nft-tracker/shared-types";
import { db } from "../../db/client.js";
import { miningSnapshots } from "../../db/schema/mining.js";
import { alertRules, alertEvents } from "../../db/schema/alerts.js";
import { evaluateMiningAlert } from "./alertRules.js";
import type { Notifiers } from "../../scheduler/types.js";
import { logger } from "../../utils/logger.js";

/** Shared by every mining poll job: fetch the prior snapshot for comparison, persist the new one,
 * evaluate alert rules against the before/after pair, and notify listeners of both. */
export async function recordMiningSnapshot(
  sourceId: string,
  snapshot: MiningSnapshot,
  rawPayload: unknown,
  notifiers?: Notifiers
) {
  const [previousRow] = await db
    .select()
    .from(miningSnapshots)
    .where(eq(miningSnapshots.sourceId, sourceId))
    .orderBy(desc(miningSnapshots.polledAt))
    .limit(1);

  const previous: MiningSnapshot | null = previousRow
    ? {
        sourceId,
        polledAt: previousRow.polledAt.toISOString(),
        hashrate1m: previousRow.hashrate1m ? Number(previousRow.hashrate1m) : null,
        hashrate5m: previousRow.hashrate5m ? Number(previousRow.hashrate5m) : null,
        hashrate1hr: previousRow.hashrate1hr ? Number(previousRow.hashrate1hr) : null,
        hashrate1d: previousRow.hashrate1d ? Number(previousRow.hashrate1d) : null,
        workersOnline: previousRow.workersOnline,
        sharesTotal: previousRow.sharesTotal ? Number(previousRow.sharesTotal) : null,
        balance: previousRow.balance ? Number(previousRow.balance) : null,
        lastShareAt: previousRow.lastShareAt?.toISOString() ?? null,
        bestDifficulty: previousRow.bestDifficulty ? Number(previousRow.bestDifficulty) : null,
        workerBests: (previousRow.workerBests as MiningSnapshot["workerBests"]) ?? [],
        blocksFound: previousRow.blocksFound,
      }
    : null;

  await db.insert(miningSnapshots).values({
    sourceId: snapshot.sourceId,
    polledAt: new Date(snapshot.polledAt),
    hashrate1m: snapshot.hashrate1m?.toString(),
    hashrate5m: snapshot.hashrate5m?.toString(),
    hashrate1hr: snapshot.hashrate1hr?.toString(),
    hashrate1d: snapshot.hashrate1d?.toString(),
    workersOnline: snapshot.workersOnline,
    sharesTotal: snapshot.sharesTotal?.toString(),
    balance: snapshot.balance?.toString(),
    lastShareAt: snapshot.lastShareAt ? new Date(snapshot.lastShareAt) : null,
    bestDifficulty: snapshot.bestDifficulty?.toString(),
    workerBests: snapshot.workerBests,
    blocksFound: snapshot.blocksFound,
    rawPayload: rawPayload as object,
  });

  notifiers?.onMiningSnapshot(snapshot);

  const rules = await db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.targetType, "mining_source"), eq(alertRules.targetId, sourceId), eq(alertRules.enabled, true)));

  for (const ruleRow of rules) {
    const rule: AlertRule = {
      id: ruleRow.id,
      kind: ruleRow.kind as AlertRule["kind"],
      targetType: ruleRow.targetType as AlertRule["targetType"],
      targetId: ruleRow.targetId,
      config: ruleRow.config as Record<string, unknown>,
      enabled: ruleRow.enabled,
    };

    const fired = evaluateMiningAlert(rule, snapshot, previous);
    if (!fired) continue;

    const [eventRow] = await db
      .insert(alertEvents)
      .values({
        ruleId: fired.ruleId,
        message: fired.message,
        severity: fired.severity,
        payload: fired.payload,
      })
      .returning();

    logger.warn({ sourceId, kind: rule.kind, message: fired.message }, "mining alert fired");

    notifiers?.onAlert({
      id: eventRow.id.toString(),
      ruleId: eventRow.ruleId,
      firedAt: eventRow.firedAt.toISOString(),
      message: eventRow.message,
      severity: eventRow.severity as AlertSeverity,
      payload: eventRow.payload as Record<string, unknown> | null,
      acknowledged: eventRow.acknowledged,
    });
  }
}
