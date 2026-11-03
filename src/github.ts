import type { Issue, PullRequest, Release, RepoData } from "./types.js";

export class GitHubError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export interface GitHubClientOptions {
  /** Personal access token. Optional, but unauthenticated calls are limited to 60 requests/hour. */
  token?: string;
  /** Defaults to https://api.github.com. Override for GitHub Enterprise. */
  baseUrl?: string;
  /** Custom fetch implementation (used for tests). Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Items per page, 1..100. Default: 100. */
  perPage?: number;
  /** Safety cap on the number of pages fetched per collection. Default: 10. */
  maxPages?: number;
}

export interface FetchRepoOptions {
  /** Stop paginating pull requests once they are older than this many days. Default: 365. */
  windowDays?: number;
  now?: Date;
}

export interface Page<T> {
  items: T[];
  /** True when the page cap was reached while more data was still available. */
  truncated: boolean;
}

const REPO_PART = /^[A-Za-z0-9_.-]+$/;

export function parseRepo(input: string): { owner: string; repo: string } {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/+$/, "");
  const parts = cleaned.split("/");
  const [owner, repo] = parts;
  if (
    parts.length !== 2 ||
    owner === undefined ||
    repo === undefined ||
    !REPO_PART.test(owner) ||
    !REPO_PART.test(repo) ||
    /^\.+$/.test(owner) ||
    /^\.+$/.test(repo)
  ) {
    throw new Error(`Invalid repository "${input}". Expected "owner/repo".`);
  }
  return { owner, repo };
}

export class GitHubClient {
  private readonly token: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly perPage: number;
  private readonly maxPages: number;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token;
    this.baseUrl = (options.baseUrl ?? "https://api.github.com").replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.perPage = Math.min(100, Math.max(1, options.perPage ?? 100));
    this.maxPages = Math.max(1, options.maxPages ?? 10);
  }

  private async getPage<T>(path: string, params: Record<string, string>, page: number): Promise<T[]> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set("per_page", String(this.perPage));
    url.searchParams.set("page", String(page));

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "repo-pulse",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await this.fetchImpl(url, { headers });
    if (!response.ok) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      let hint = "";
      if (response.status === 404) hint = " (repository not found, or private without a token)";
      else if (response.status === 401) hint = " (invalid token)";
      else if (response.status === 403 && remaining === "0") hint = " (rate limit exceeded)";
      throw new GitHubError(`GitHub API ${response.status} for ${path}${hint}`, response.status);
    }
    return (await response.json()) as T[];
  }

  /**
   * Fetches pages until one is short, `stop` returns true for the last item of a page,
   * or `maxPages` is reached. In the last case `truncated` is set, because the
   * collection may hold more items than were fetched.
   */
  async paginate<T>(
    path: string,
    params: Record<string, string> = {},
    stop?: (last: T) => boolean,
  ): Promise<Page<T>> {
    const all: T[] = [];
    let truncated = false;
    for (let page = 1; page <= this.maxPages; page++) {
      const items = await this.getPage<T>(path, params, page);
      all.push(...items);
      const last = items[items.length - 1];
      if (last !== undefined && stop?.(last)) break;
      if (items.length < this.perPage) break;
      if (page === this.maxPages) truncated = true;
    }
    return { items: all, truncated };
  }

  listPulls(owner: string, repo: string, windowDays = 365, now = new Date()): Promise<Page<PullRequest>> {
    const cutoff = now.getTime() - windowDays * 86_400_000;
    return this.paginate<PullRequest>(
      `/repos/${owner}/${repo}/pulls`,
      { state: "all", sort: "created", direction: "desc" },
      (last) => new Date(last.created_at).getTime() < cutoff,
    );
  }

  listIssues(owner: string, repo: string): Promise<Page<Issue>> {
    return this.paginate<Issue>(`/repos/${owner}/${repo}/issues`, {
      state: "all",
      sort: "updated",
      direction: "desc",
    });
  }

  listReleases(owner: string, repo: string): Promise<Page<Release>> {
    return this.paginate<Release>(`/repos/${owner}/${repo}/releases`);
  }

  async fetchRepoData(owner: string, repo: string, options: FetchRepoOptions = {}): Promise<RepoData> {
    const [pulls, issues, releases] = await Promise.all([
      this.listPulls(owner, repo, options.windowDays, options.now),
      this.listIssues(owner, repo),
      this.listReleases(owner, repo),
    ]);
    return {
      pulls: pulls.items,
      issues: issues.items,
      releases: releases.items,
      truncated: { pulls: pulls.truncated, issues: issues.truncated, releases: releases.truncated },
    };
  }
}
