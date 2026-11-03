import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeMetrics } from "../src/metrics.js";
import { renderJson, renderMarkdown } from "../src/report.js";

const NOW = new Date("2026-06-01T00:00:00Z");

describe("report", () => {
  it("renders n/a for missing data instead of NaN", () => {
    const metrics = computeMetrics({ pulls: [], issues: [], releases: [] }, { now: NOW });
    const md = renderMarkdown("o/r", metrics);
    assert.match(md, /# Maintenance pulse: o\/r/);
    assert.match(md, /Health score: n\/a/);
    assert.doesNotMatch(md, /NaN|undefined|null/);
  });

  it("renders valid JSON including the repo name", () => {
    const metrics = computeMetrics({ pulls: [], issues: [], releases: [] }, { now: NOW });
    const parsed = JSON.parse(renderJson("o/r", metrics)) as { repo: string; windowDays: number };
    assert.equal(parsed.repo, "o/r");
    assert.equal(parsed.windowDays, 365);
  });
});

describe("report coverage warnings", () => {
  const base = { pulls: [], issues: [], releases: [] };

  it("shows no coverage section when nothing was truncated", () => {
    const md = renderMarkdown("o/r", computeMetrics(base, { now: NOW }));
    assert.doesNotMatch(md, /Data coverage|partial data/i);
  });

  it("warns when data was truncated", () => {
    const metrics = computeMetrics(
      { ...base, truncated: { pulls: true, issues: true, releases: true } },
      { now: NOW },
    );
    const md = renderMarkdown("o/r", metrics);
    assert.match(md, /\(partial data\)/);
    assert.match(md, /## Data coverage/);
    assert.match(md, /Pull requests: the fetch cap was reached/);
    assert.match(md, /Issues: the fetch cap was reached/);
    assert.match(md, /Releases: the fetch cap was reached/);
  });
});
