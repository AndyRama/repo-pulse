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

export function renderJson(repo: string, metrics: Metrics): string {
  return JSON.stringify({ repo, ...metrics }, null, 2);
}

export function renderMarkdown(repo: string, m: Metrics): string {
  const { pullRequests: pr, issues, releases, health } = m;
  const score = health.score === null ? "n/a" : `${health.score}/100`;

  return [
    `# Maintenance pulse: ${repo}`,
    "",
    `Window: last ${m.windowDays} days · generated ${m.generatedAt}`,
    "",
    `**Health score: ${score}**`,
    "",
    "## Pull requests",
    "",
    `- Opened: ${pr.total} (merged ${pr.merged}, closed without merge ${pr.closedWithoutMerge}, open ${pr.open})`,
    `- Merge rate: ${percent(pr.mergeRate)}`,
    `- Time to merge: median ${days(pr.medianDaysToMerge)}, p90 ${days(pr.p90DaysToMerge)}`,
    "",
    "## Issues",
    "",
    `- Open: ${issues.open} · closed: ${issues.closed}`,
    `- Stale (no activity for ${m.staleDays}+ days): ${issues.stale} (${percent(issues.staleRatio)} of open)`,
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
  ].join("\n");
}
