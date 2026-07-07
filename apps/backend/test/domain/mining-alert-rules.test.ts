import { describe, it, expect } from "vitest";
import { evaluateMiningAlert } from "../../src/domain/mining/alertRules.js";
import type { AlertRule, MiningSnapshot } from "@crypto-nft-tracker/shared-types";

function snapshot(overrides: Partial<MiningSnapshot> = {}): MiningSnapshot {
  return {
    sourceId: "source-1",
    polledAt: new Date().toISOString(),
    hashrate1m: null,
    hashrate5m: null,
    hashrate1hr: null,
    hashrate1d: null,
    workersOnline: null,
    sharesTotal: null,
    balance: null,
    lastShareAt: null,
    bestDifficulty: null,
    workerBests: [],
    blocksFound: null,
    ...overrides,
  };
}

const rule: AlertRule = {
  id: "rule-1",
  kind: "block_found",
  targetType: "mining_source",
  targetId: "source-1",
  config: {},
  enabled: true,
};

describe("block_found alert", () => {
  it("fires when blocksFound increases", () => {
    const previous = snapshot({ blocksFound: 2 });
    const current = snapshot({ blocksFound: 3 });
    const fired = evaluateMiningAlert(rule, current, previous);
    expect(fired?.severity).toBe("critical");
    expect(fired?.payload).toMatchObject({ sourceId: "source-1", blocksFound: 3 });
  });

  it("does not fire when blocksFound is unchanged", () => {
    const previous = snapshot({ blocksFound: 3 });
    const current = snapshot({ blocksFound: 3 });
    expect(evaluateMiningAlert(rule, current, previous)).toBeNull();
  });

  it("does not fire when there is no previous snapshot to compare against", () => {
    const current = snapshot({ blocksFound: 1 });
    expect(evaluateMiningAlert(rule, current, null)).toBeNull();
  });

  it("does not fire for sources that don't report blocksFound at all", () => {
    const previous = snapshot({ blocksFound: null });
    const current = snapshot({ blocksFound: null });
    expect(evaluateMiningAlert(rule, current, previous)).toBeNull();
  });
});
