import { daysBetween, median, percentile, ratio, round, scale } from "./stats.js";
import type {
  HealthScore,
  IssueMetrics,
  Metrics,
  MetricsOptions,
  PullRequestMetrics,
  RepoData,
  ReleaseMetrics,
} from "./types.js";

const DEFAULT_WINDOW_DAYS = 365;
const DEFAULT_STALE_DAYS = 90;

function pullRequestMetrics(
  pulls: RepoData["pulls"],
  now: Date,
  windowDays: number,
): PullRequestMetrics {
  const inWindow = pulls.filter(
    (pr) => !pr.draft && daysBetween(pr.created_at, now) <= windowDays,
  );
  const merged = inWindow.filter((pr) => pr.merged_at !== null);
  const closedWithoutMerge = inWindow.filter(
    (pr) => pr.state === "closed" && pr.merged_at === null,
  );
  const open = inWindow.filter((pr) => pr.state === "open");
  const daysToMerge = merged.map((pr) => daysBetween(pr.created_at, pr.merged_at as string));

  const mergedCount = merged.length;
  return {
    total: inWindow.length,
    merged: mergedCount,
    closedWithoutMerge: closedWithoutMerge.length,
    open: open.length,
    mergeRate: ratio(mergedCount, mergedCount + closedWithoutMerge.length),
    medianDaysToMerge: median(daysToMerge),
    p90DaysToMerge: percentile(daysToMerge, 90),
  };
}

function issueMetrics(
  issues: RepoData["issues"],
  now: Date,
  staleDays: number,
  windowDays: number,
  sampled: boolean,
): IssueMetrics {
  // GitHub's issues endpoint also returns pull requests; ignore them here.
  const real = issues.filter((i) => i.pull_request === undefined);
  const open = real.filter((i) => i.state === "open");
  const closed = real.filter(
    (i) => i.state === "closed" && i.closed_at !== null && daysBetween(i.closed_at, now) <= windowDays,
  );
  const stale = open.filter((i) => daysBetween(i.updated_at, now) >= staleDays);
  const unanswered = open.filter((i) => i.comments === 0);

  return {
    open: open.length,
    closed: closed.length,
    stale: stale.length,
    // A truncated sample is biased towards recently updated items, so ratios would mislead.
    staleRatio: sampled ? null : ratio(stale.length, open.length),
    unansweredRatio: sampled ? null : ratio(unanswered.length, open.length),
    medianDaysToClose: median(closed.map((i) => daysBetween(i.created_at, i.closed_at as string))),
  };
}

function releaseMetrics(
  releases: RepoData["releases"],
  now: Date,
  windowDays: number,
): ReleaseMetrics {
  const published = releases
    .filter((r) => !r.draft && r.published_at !== null)
    .map((r) => new Date(r.published_at as string))
    .sort((a, b) => a.getTime() - b.getTime());

  const inWindow = published.filter((d) => daysBetween(d, now) <= windowDays);
  const gaps: number[] = [];
  for (let i = 1; i < inWindow.length; i++) {
    gaps.push(daysBetween(inWindow[i - 1] as Date, inWindow[i] as Date));
  }
  const last = published[published.length - 1];

  return {
    count: inWindow.length,
    daysSinceLast: last === undefined ? null : Math.max(0, daysBetween(last, now)),
    medianDaysBetween: median(gaps),
  };
}

function healthScore(
  pr: PullRequestMetrics,
  issues: IssueMetrics,
  releases: ReleaseMetrics,
): HealthScore {
  const components = {
    // 3 days to merge or less is excellent, 30 days or more is poor.
    prTurnaround: pr.medianDaysToMerge === null ? null : scale(pr.medianDaysToMerge, 3, 30),
    // No stale issues is excellent, half of the backlog stale is poor.
    issueFreshness: issues.staleRatio === null ? null : scale(issues.staleRatio, 0, 0.5),
    // Every issue answered is excellent, 60% unanswered is poor.
    issueResponsiveness:
      issues.unansweredRatio === null ? null : scale(issues.unansweredRatio, 0, 0.6),
    // A release in the last 30 days is excellent, none for a year is poor.
    releaseRecency: releases.daysSinceLast === null ? null : scale(releases.daysSinceLast, 30, 365),
  };

  const present = Object.values(components).filter((v): v is number => v !== null);
  const score =
    present.length === 0
      ? null
      : round((present.reduce((sum, v) => sum + v, 0) / present.length) * 100, 0);

  return { score, components };
}

/** Pure function: turns raw GitHub data into maintenance-health metrics. */
export function computeMetrics(data: RepoData, options: MetricsOptions = {}): Metrics {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const staleDays = options.staleDays ?? DEFAULT_STALE_DAYS;

  if (windowDays <= 0 || staleDays <= 0) {
    throw new RangeError("windowDays and staleDays must be positive");
  }

  const pullRequests = pullRequestMetrics(data.pulls, now, windowDays);
  const truncated: NonNullable<RepoData["truncated"]> = data.truncated ?? {
    pulls: false,
    issues: false,
    releases: false,
  };
  const issues = issueMetrics(data.issues, now, staleDays, windowDays, truncated.issues);
  const oldestPull = data.pulls.reduce<string | null>(
    (oldest, pr) => (oldest === null || pr.created_at < oldest ? pr.created_at : oldest),
    null,
  );
  const releases = releaseMetrics(data.releases, now, windowDays);

  return {
    windowDays,
    staleDays,
    generatedAt: now.toISOString(),
    pullRequests,
    issues,
    releases,
    health: healthScore(pullRequests, issues, releases),
    coverage: {
      pullsTruncated: truncated.pulls,
      issuesTruncated: truncated.issues,
      closedIssuesTruncated: truncated.closedIssues ?? false,
      releasesTruncated: truncated.releases,
      pullsSince: truncated.pulls ? oldestPull : null,
    },
  };
}
