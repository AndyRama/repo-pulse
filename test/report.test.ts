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
      { ...base, truncated: { pulls: true, issues: true, closedIssues: true, releases: true } },
      { now: NOW },
    );
    const md = renderMarkdown("o/r", metrics);
    assert.match(md, /\(partial data\)/);
    assert.match(md, /## Data coverage/);
    assert.match(md, /Pull requests: the fetch cap was reached/);
    assert.match(md, /Open issues: the fetch cap was reached/);
    assert.match(md, /Closed issues: the fetch cap was reached/);
    assert.match(md, /Releases: the fetch cap was reached/);
  });

  it("lists truncated closed issues without flagging the score as partial", () => {
    const metrics = computeMetrics(
      { ...base, truncated: { pulls: false, issues: false, closedIssues: true, releases: false } },
      { now: NOW },
    );
    const md = renderMarkdown("o/r", metrics);
    assert.match(md, /## Data coverage/);
    assert.match(md, /Closed issues: the fetch cap was reached/);
    assert.doesNotMatch(md, /\(partial data\)/);
  });

  it("states how many bot pull requests were excluded", () => {
    const bot = {
      number: 1,
      state: "closed" as const,
      created_at: "2026-05-20T00:00:00Z",
      updated_at: "2026-05-20T00:00:00Z",
      closed_at: "2026-05-20T01:00:00Z",
      merged_at: "2026-05-20T01:00:00Z",
      user: { login: "dependabot[bot]", type: "Bot" },
    };
    const md = renderMarkdown("o/r", computeMetrics({ ...base, pulls: [bot] }, { now: NOW }));
    assert.match(md, /Bot-authored PRs excluded: 1/);
  });
});
