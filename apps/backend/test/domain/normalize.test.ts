import { describe, it, expect } from "vitest";
import { normalizeCkpool, normalizeHeroMiners, normalizeHashvault, normalizeKano } from "../../src/domain/mining/normalize.js";
import { parseKanoWorkersHtml } from "../../src/integrations/mining/kanoClient.js";
import type { CkpoolStatsRaw } from "../../src/integrations/mining/ckpoolClient.js";
import type { HeroMinersStatsRaw } from "../../src/integrations/mining/heroMinersClient.js";
import type { HashvaultStatsRaw, HashvaultWorkersRaw } from "../../src/integrations/mining/hashvaultClient.js";
import ckpoolFixture from "../integrations/__fixtures__/ckpool-solo.json" with { type: "json" };
import heroMinersPrlFixture from "../integrations/__fixtures__/herominers-prl.json" with { type: "json" };
import heroMinersXmrFixture from "../integrations/__fixtures__/herominers-xmr.json" with { type: "json" };
import hashvaultFixture from "../integrations/__fixtures__/hashvault-xmr.json" with { type: "json" };
import hashvaultWorkersFixture from "../integrations/__fixtures__/hashvault-workers.json" with { type: "json" };
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const kanoHtml = readFileSync(
  fileURLToPath(new URL("../integrations/__fixtures__/kano-workers.html", import.meta.url)),
  "utf-8"
);

describe("normalizeCkpool", () => {
  it("parses hashrate suffixes and lastshare from a real captured ckpool response", () => {
    const snapshot = normalizeCkpool("source-1", ckpoolFixture as CkpoolStatsRaw);

    expect(snapshot.sourceId).toBe("source-1");
    expect(snapshot.hashrate1hr).toBeCloseTo(219e12, -9);
    expect(snapshot.hashrate1d).toBeCloseTo(370e12, -9);
    expect(snapshot.workersOnline).toBe(5);
    expect(snapshot.sharesTotal).toBe(6541698908997);
    expect(snapshot.balance).toBeNull();
    expect(snapshot.lastShareAt).toBe(new Date(1783366299 * 1000).toISOString());
    expect(snapshot.bestDifficulty).toBe(ckpoolFixture.bestever);
    expect(snapshot.workerBests.length).toBe(ckpoolFixture.worker.length);
    expect(snapshot.workerBests[0]).toMatchObject({
      workerName: ckpoolFixture.worker[0].workername,
      bestDifficulty: ckpoolFixture.worker[0].bestever,
    });
    expect(snapshot.workerBests[0].hashrate).toBeGreaterThan(0);
    expect(snapshot.blocksFound).toBeNull();
  });
});

describe("normalizeHeroMiners", () => {
  it("normalizes a real PRL herominers response", () => {
    const snapshot = normalizeHeroMiners("source-prl", heroMinersPrlFixture as HeroMinersStatsRaw);
    expect(snapshot.hashrate1m).toBeGreaterThan(0);
    expect(snapshot.sharesTotal).toBe(heroMinersPrlFixture.stats.solo_shares_good);
    expect(snapshot.balance).toBe(Number(heroMinersPrlFixture.stats.balance));
    expect(snapshot.lastShareAt).toBe(new Date(Number(heroMinersPrlFixture.stats.lastShare) * 1000).toISOString());
    expect(snapshot.bestDifficulty).toBeNull();
    expect(snapshot.blocksFound).toBe(heroMinersPrlFixture.stats.blocksFoundSolo);
    expect(snapshot.workersOnline).toBe(heroMinersPrlFixture.workers.length);
    expect(snapshot.workerBests.length).toBe(heroMinersPrlFixture.workers.length);
    expect(snapshot.workerBests[0]).toEqual({
      workerName: heroMinersPrlFixture.workers[0].name,
      bestDifficulty: null,
      hashrate: heroMinersPrlFixture.workers[0].hashrate,
    });
  });

  it("normalizes a real XMR herominers response", () => {
    const snapshot = normalizeHeroMiners("source-xmr", heroMinersXmrFixture as HeroMinersStatsRaw);
    expect(snapshot.hashrate1m).toBeGreaterThan(0);
    expect(snapshot.balance).toBe(Number(heroMinersXmrFixture.stats.balance));
    expect(snapshot.workersOnline).toBe(heroMinersXmrFixture.workers.length);
  });
});

describe("normalizeHashvault", () => {
  it("normalizes a real hashvault XMR response and treats lastShare as milliseconds", () => {
    const snapshot = normalizeHashvault("source-hv", hashvaultFixture as HashvaultStatsRaw);
    expect(snapshot.hashrate1m).toBe(hashvaultFixture.solo.hashRate);
    expect(snapshot.balance).toBe(hashvaultFixture.revenue.confirmedBalance);
    expect(snapshot.lastShareAt).toBe(new Date(hashvaultFixture.solo.lastShare).toISOString());
    expect(snapshot.blocksFound).toBe(hashvaultFixture.solo.foundBlocks);
    expect(snapshot.workersOnline).toBeNull();
  });

  it("counts non-offline solo workers when a workers response is provided", () => {
    const snapshot = normalizeHashvault(
      "source-hv",
      hashvaultFixture as HashvaultStatsRaw,
      hashvaultWorkersFixture as HashvaultWorkersRaw
    );
    const expectedOnline = hashvaultWorkersFixture.solo.filter((w) => !w.offline).length;
    expect(snapshot.workersOnline).toBe(expectedOnline);
    expect(snapshot.workerBests.length).toBe(hashvaultWorkersFixture.solo.length);
    expect(snapshot.workerBests[0]).toEqual({
      workerName: hashvaultWorkersFixture.solo[0].name,
      bestDifficulty: null,
      hashrate: hashvaultWorkersFixture.solo[0].hashRate,
    });
  });
});

describe("kano.is HTML parsing", () => {
  it("extracts worker counts, hashrate, shares, and last-share recency from a real captured page", () => {
    const parsed = parseKanoWorkersHtml(kanoHtml);
    expect(parsed.totalWorkers).toBe(4);
    expect(parsed.activeWorkers).toBe(3);
    expect(parsed.totalShares).toBe(22135063);
    expect(parsed.totalHashrate).toBeCloseTo(218.73e12, -9);
    expect(parsed.secondsSinceLastShare).toBe(0);
    expect(parsed.bestDifficulty).toBe(554199303943);
    expect(parsed.workerBests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workerName: "jimjam123123.SWITCH", bestDifficulty: 554199303943 }),
      ])
    );
    const switchWorker = parsed.workerBests.find((w) => w.workerName === "jimjam123123.SWITCH")!;
    expect(switchWorker.hashrate).toBeCloseTo(206.13e12, -10);
  });

  it("normalizeKano converts parsed HTML stats into a MiningSnapshot", () => {
    const parsed = parseKanoWorkersHtml(kanoHtml);
    const polledAt = new Date("2026-07-06T19:00:00.000Z");
    const snapshot = normalizeKano("source-kano", parsed, polledAt);
    expect(snapshot.workersOnline).toBe(3);
    expect(snapshot.hashrate1m).toBeCloseTo(218.73e12, -9);
    expect(snapshot.lastShareAt).toBe(polledAt.toISOString());
    expect(snapshot.bestDifficulty).toBe(554199303943);
    expect(snapshot.blocksFound).toBeNull();
  });
});
