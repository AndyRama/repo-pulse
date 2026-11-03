import type { Metrics } from "./types.js";

function days(value: number | null): string {
  if (value === null) return "n/a";
  return value < 10 ? `${value.toFixed(1)} d` : `${Math.round(value)} d`;
}

function percent(value: number | null): string {
  return value === null ? "n/a" : `${Math.round(value * 100)}%`;
}

function component(value: number | null): string {
  return value === null ? "n/a" : `${Math.round(value * 100)}/100`;
}

function coverageSection(m: Metrics): string[] {
  const c = m.coverage;
  const lines: string[] = [];
  if (c.pullsTruncated) {
    lines.push(
      `- Pull requests: the fetch cap was reached, so only PRs opened since ${c.pullsSince?.slice(0, 10) ?? "an unknown date"} are included, not the full ${m.windowDays} days.`,
    );
  }
  if (c.issuesTruncated) {
    lines.push(
      "- Open issues: the fetch cap was reached, so counts come from the most recently updated open items only (open pull requests are part of that sample). Stale and unanswered figures are not computed and the score ignores them.",
    );
  }
  if (c.closedIssuesTruncated) {
    lines.push(
      "- Closed issues: the fetch cap was reached, so only the most recently updated ones are included and the time to close covers a shorter period.",
    );
  }
  if (c.releasesTruncated) {
    lines.push("- Releases: the fetch cap was reached, so older releases are missing.");
  }
  return lines.length === 0 ? [] : ["## Data coverage", "", ...lines, ""];
}

export function renderJson(repo: string, metrics: Metrics): string {
  return JSON.stringify({ repo, ...metrics }, null, 2);
}

export function renderMarkdown(repo: string, m: Metrics): string {
  const { pullRequests: pr, issues, releases, health } = m;
  const score = health.score === null ? "n/a" : `${health.score}/100`;
  const coverage = coverageSection(m);
  const partial = coverage.length > 0;

  return [
    `# Maintenance pulse: ${repo}`,
    "",
    `Window: last ${m.windowDays} days · generated ${m.generatedAt}`,
    "",
    `**Health score: ${score}**${partial ? " (partial data)" : ""}`,
    "",
    ...(partial ? ['> Some data was truncated: see "Data coverage" at the end of this report.', ""] : []),
    "## Pull requests",
    "",
    `- Opened${m.coverage.pullsTruncated ? " (partial window)" : ""}: ${pr.total} (merged ${pr.merged}, closed without merge ${pr.closedWithoutMerge}, open ${pr.open})`,
    `- Merge rate: ${percent(pr.mergeRate)}`,
    `- Time to merge: median ${days(pr.medianDaysToMerge)}, p90 ${days(pr.p90DaysToMerge)}`,
    "",
    "## Issues",
    "",
    `- Open: ${issues.open}${m.coverage.issuesTruncated ? " (sample)" : ""} · closed in the last ${m.windowDays} days: ${issues.closed}${m.coverage.closedIssuesTruncated ? " (partial)" : ""}`,
    `- Stale (no activity for ${m.staleDays}+ days): ${m.coverage.issuesTruncated ? "n/a (sample)" : `${issues.stale} (${percent(issues.staleRatio)} of open)`}`,
    `- Open issues without any comment: ${percent(issues.unansweredRatio)}`,
    `- Median time to close: ${days(issues.medianDaysToClose)}`,
    "",
    "## Releases",
    "",
    `- Published in window: ${releases.count}`,
    `- Since last release: ${days(releases.daysSinceLast)}`,
    `- Median gap between releases: ${days(releases.medianDaysBetween)}`,
    "",
    "## Score breakdown",
    "",
    `- PR turnaround: ${component(health.components.prTurnaround)}`,
    `- Issue freshness: ${component(health.components.issueFreshness)}`,
    `- Issue responsiveness: ${component(health.components.issueResponsiveness)}`,
    `- Release recency: ${component(health.components.releaseRecency)}`,
    "",
    ...coverage,
  ].join("\n");
}
