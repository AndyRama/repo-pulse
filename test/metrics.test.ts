import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeMetrics } from "../src/metrics.js";
import type { Issue, PullRequest, RepoData } from "../src/types.js";

const NOW = new Date("2026-06-01T00:00:00Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

function pr(overrides: Partial<PullRequest> & { number: number }): PullRequest {
  return {
    state: "closed",
    created_at: daysAgo(10),
    updated_at: daysAgo(5),
    closed_at: null,
    merged_at: null,
    ...overrides,
  };
}

function issue(overrides: Partial<Issue> & { number: number }): Issue {
  return {
    state: "open",
    created_at: daysAgo(30),
    updated_at: daysAgo(10),
    closed_at: null,
    comments: 1,
    ...overrides,
  };
}

const empty: RepoData = { pulls: [], issues: [], releases: [] };

describe("computeMetrics", () => {
  it("returns nulls and no score for an empty repository", () => {
    const m = computeMetrics(empty, { now: NOW });
    assert.equal(m.pullRequests.total, 0);
    assert.equal(m.pullRequests.medianDaysToMerge, null);
    assert.equal(m.issues.staleRatio, null);
    assert.equal(m.releases.daysSinceLast, null);
    assert.equal(m.health.score, null);
  });

  it("computes pull request metrics", () => {
    const m = computeMetrics(
      {
        ...empty,
        pulls: [
          pr({ number: 1, created_at: daysAgo(20), merged_at: daysAgo(19), closed_at: daysAgo(19) }),
          pr({ number: 2, created_at: daysAgo(20), merged_at: daysAgo(15), closed_at: daysAgo(15) }),
          pr({ number: 3, created_at: daysAgo(20), closed_at: daysAgo(18) }),
          pr({ number: 4, state: "open", created_at: daysAgo(2) }),
          pr({ number: 5, state: "open", draft: true, created_at: daysAgo(2) }),
          pr({ number: 6, created_at: daysAgo(400), merged_at: daysAgo(399) }),
        ],
      },
      { now: NOW },
    );
    assert.equal(m.pullRequests.total, 4, "drafts and PRs outside the window are excluded");
    assert.equal(m.pullRequests.merged, 2);
    assert.equal(m.pullRequests.closedWithoutMerge, 1);
    assert.equal(m.pullRequests.open, 1);
    assert.equal(m.pullRequests.mergeRate, 2 / 3);
    assert.equal(m.pullRequests.medianDaysToMerge, 3);
  });

  it("ignores pull requests returned by the issues endpoint", () => {
    const m = computeMetrics(
      {
        ...empty,
        issues: [issue({ number: 1 }), issue({ number: 2, pull_request: {} })],
      },
      { now: NOW },
    );
    assert.equal(m.issues.open, 1);
  });

  it("detects stale and unanswered issues", () => {
    const m = computeMetrics(
      {
        ...empty,
        issues: [
          issue({ number: 1, updated_at: daysAgo(200), comments: 0 }),
          issue({ number: 2, updated_at: daysAgo(5), comments: 3 }),
          issue({ number: 3, updated_at: daysAgo(90), comments: 0 }),
          issue({ number: 4, updated_at: daysAgo(1), comments: 2 }),
        ],
      },
      { now: NOW },
    );
    assert.equal(m.issues.stale, 2, "exactly staleDays counts as stale");
    assert.equal(m.issues.staleRatio, 0.5);
    assert.equal(m.issues.unansweredRatio, 0.5);
  });

  it("computes the median time to close issues", () => {
    const m = computeMetrics(
      {
        ...empty,
        issues: [
          issue({ number: 1, state: "closed", created_at: daysAgo(10), closed_at: daysAgo(8) }),
          issue({ number: 2, state: "closed", created_at: daysAgo(10), closed_at: daysAgo(4) }),
        ],
      },
      { now: NOW },
    );
    assert.equal(m.issues.closed, 2);
    assert.equal(m.issues.medianDaysToClose, 4);
  });

  it("computes release cadence and skips drafts", () => {
    const m = computeMetrics(
      {
        ...empty,
        releases: [
          { tag_name: "v3", published_at: daysAgo(10) },
          { tag_name: "v2", published_at: daysAgo(40) },
          { tag_name: "v1", published_at: daysAgo(70) },
          { tag_name: "v4-draft", published_at: daysAgo(1), draft: true },
          { tag_name: "v0", published_at: null },
        ],
      },
      { now: NOW },
    );
    assert.equal(m.releases.count, 3);
    assert.equal(m.releases.daysSinceLast, 10);
    assert.equal(m.releases.medianDaysBetween, 30);
  });

  it("gives a high score to a well-maintained project", () => {
    const m = computeMetrics(
      {
        pulls: [pr({ number: 1, created_at: daysAgo(5), merged_at: daysAgo(4) })],
        issues: [issue({ number: 1, updated_at: daysAgo(2), comments: 2 })],
        releases: [{ tag_name: "v1", published_at: daysAgo(7) }],
      },
      { now: NOW },
    );
    assert.equal(m.health.score, 100);
  });

  it("gives a low score to a neglected project", () => {
    const m = computeMetrics(
      {
        pulls: [pr({ number: 1, created_at: daysAgo(100), merged_at: daysAgo(40) })],
        issues: [issue({ number: 1, updated_at: daysAgo(300), comments: 0 })],
        releases: [{ tag_name: "v1", published_at: daysAgo(500) }],
      },
      { now: NOW },
    );
    assert.equal(m.health.score, 0);
  });

  it("averages only the components that have data", () => {
    const m = computeMetrics(
      { ...empty, releases: [{ tag_name: "v1", published_at: daysAgo(10) }] },
      { now: NOW },
    );
    assert.equal(m.health.components.prTurnaround, null);
    assert.equal(m.health.score, 100);
  });

  it("rejects invalid options", () => {
    assert.throws(() => computeMetrics(empty, { windowDays: 0 }), RangeError);
    assert.throws(() => computeMetrics(empty, { staleDays: -5 }), RangeError);
  });

  it("reports full coverage by default", () => {
    const m = computeMetrics(empty, { now: NOW });
    assert.deepEqual(m.coverage, {
      pullsTruncated: false,
      issuesTruncated: false,
      closedIssuesTruncated: false,
      releasesTruncated: false,
      pullsSince: null,
    });
  });

  it("skips issue ratios and flags coverage when data was truncated", () => {
    const m = computeMetrics(
      {
        pulls: [
          pr({ number: 1, created_at: daysAgo(30), merged_at: daysAgo(29) }),
          pr({ number: 2, created_at: daysAgo(60), merged_at: daysAgo(58) }),
        ],
        issues: [issue({ number: 1, updated_at: daysAgo(500), comments: 0 })],
        releases: [],
        truncated: { pulls: true, issues: true, releases: false },
      },
      { now: NOW },
    );
    assert.equal(m.issues.staleRatio, null);
    assert.equal(m.issues.unansweredRatio, null);
    assert.equal(m.health.components.issueFreshness, null);
    assert.equal(m.health.components.issueResponsiveness, null);
    assert.equal(m.coverage.issuesTruncated, true);
    assert.equal(m.coverage.pullsSince, daysAgo(60));
  });

  it("keeps issue ratios when only closed issues were truncated", () => {
    const m = computeMetrics(
      {
        ...empty,
        issues: [
          issue({ number: 1, updated_at: daysAgo(200), comments: 0 }),
          issue({ number: 2, updated_at: daysAgo(2), comments: 1 }),
        ],
        truncated: { pulls: false, issues: false, closedIssues: true, releases: false },
      },
      { now: NOW },
    );
    assert.equal(m.issues.staleRatio, 0.5);
    assert.equal(m.coverage.closedIssuesTruncated, true);
    assert.equal(m.coverage.issuesTruncated, false);
  });

  it("counts only issues closed within the window", () => {
    const m = computeMetrics(
      {
        ...empty,
        issues: [
          issue({ number: 1, state: "closed", created_at: daysAgo(20), closed_at: daysAgo(10) }),
          issue({ number: 2, state: "closed", created_at: daysAgo(500), closed_at: daysAgo(400) }),
        ],
      },
      { now: NOW },
    );
    assert.equal(m.issues.closed, 1);
    assert.equal(m.issues.medianDaysToClose, 10);
  });
});
