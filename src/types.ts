/** Subset of the GitHub REST API fields that repo-pulse relies on. */

export interface PullRequest {
  number: number;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft?: boolean;
}

export interface Issue {
  number: number;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  /** Number of comments on the issue. */
  comments: number;
  /** Present when the item is actually a pull request (GitHub's issues endpoint returns both). */
  pull_request?: unknown;
}

export interface Release {
  tag_name: string;
  published_at: string | null;
  draft?: boolean;
  prerelease?: boolean;
}

export interface RepoData {
  pulls: PullRequest[];
  issues: Issue[];
  releases: Release[];
  /** Which collections hit the fetch cap and may be incomplete. Defaults to none. */
  truncated?: { pulls: boolean; issues: boolean; releases: boolean };
}

export interface MetricsOptions {
  /** Reference "now" (defaults to the current time). Useful for deterministic tests. */
  now?: Date;
  /** Only pull requests created and releases published within this window are considered. Default: 365. */
  windowDays?: number;
  /** An open issue untouched for this many days is considered stale. Default: 90. */
  staleDays?: number;
}

export interface PullRequestMetrics {
  /** Pull requests opened within the window (drafts excluded). */
  total: number;
  merged: number;
  closedWithoutMerge: number;
  open: number;
  /** merged / (merged + closedWithoutMerge), or null when nothing was resolved. */
  mergeRate: number | null;
  /** Median days between opening and merging, or null when nothing was merged. */
  medianDaysToMerge: number | null;
  /** 90th percentile of days to merge, or null when nothing was merged. */
  p90DaysToMerge: number | null;
}

export interface IssueMetrics {
  open: number;
  closed: number;
  /** Open issues not updated for `staleDays` days or more. */
  stale: number;
  /** stale / open, or null when there are no open issues or the issue data was truncated. */
  staleRatio: number | null;
  /** Share of open issues that never received a comment, or null when there are none or the data was truncated. */
  unansweredRatio: number | null;
  /** Median days between opening and closing among closed issues, or null. */
  medianDaysToClose: number | null;
}

export interface ReleaseMetrics {
  /** Published, non-draft releases within the window. */
  count: number;
  /** Days since the most recent published release (any date), or null when there is none. */
  daysSinceLast: number | null;
  /** Median days between consecutive releases, or null with fewer than two releases. */
  medianDaysBetween: number | null;
}

export interface HealthScore {
  /** 0 (neglected) to 100 (very well maintained), or null when there is not enough data. */
  score: number | null;
  /** Individual components, each 0..1, null when its data is missing. */
  components: {
    prTurnaround: number | null;
    issueFreshness: number | null;
    issueResponsiveness: number | null;
    releaseRecency: number | null;
  };
}

export interface Coverage {
  pullsTruncated: boolean;
  issuesTruncated: boolean;
  releasesTruncated: boolean;
  /** When pull requests were truncated: creation date of the oldest one fetched. */
  pullsSince: string | null;
}

export interface Metrics {
  windowDays: number;
  staleDays: number;
  generatedAt: string;
  pullRequests: PullRequestMetrics;
  issues: IssueMetrics;
  releases: ReleaseMetrics;
  health: HealthScore;
  coverage: Coverage;
}
