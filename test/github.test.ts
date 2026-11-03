import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GitHubClient, GitHubError, parseRepo } from "../src/github.js";

type Handler = (url: URL, init: RequestInit | undefined) => Response;

function mockFetch(handler: Handler): { fetch: typeof fetch; calls: URL[]; inits: (RequestInit | undefined)[] } {
  const calls: URL[] = [];
  const inits: (RequestInit | undefined)[] = [];
  const impl = (async (input: URL | string | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    calls.push(url);
    inits.push(init);
    return handler(url, init);
  }) as typeof fetch;
  return { fetch: impl, calls, inits };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

describe("parseRepo", () => {
  it("accepts owner/repo and GitHub URLs", () => {
    assert.deepEqual(parseRepo("nodejs/node"), { owner: "nodejs", repo: "node" });
    assert.deepEqual(parseRepo("https://github.com/nodejs/node.git"), { owner: "nodejs", repo: "node" });
    assert.deepEqual(parseRepo("https://github.com/nodejs/node/"), { owner: "nodejs", repo: "node" });
  });

  it("rejects malformed input", () => {
    assert.throws(() => parseRepo("nodejs"), /Invalid repository/);
    assert.throws(() => parseRepo("a/b/c"), /Invalid repository/);
    assert.throws(() => parseRepo("a/b c"), /Invalid repository/);
    assert.throws(() => parseRepo("../etc"), /Invalid repository/);
  });
});

describe("GitHubClient", () => {
  it("sends auth and API headers", async () => {
    const { fetch, inits } = mockFetch(() => json([]));
    await new GitHubClient({ token: "secret", fetch }).listReleases("o", "r");
    const headers = inits[0]?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer secret");
    assert.equal(headers.Accept, "application/vnd.github+json");
  });

  it("omits the Authorization header without a token", async () => {
    const { fetch, inits } = mockFetch(() => json([]));
    await new GitHubClient({ fetch }).listReleases("o", "r");
    const headers = inits[0]?.headers as Record<string, string>;
    assert.equal(headers.Authorization, undefined);
  });

  it("paginates until a short page", async () => {
    const { fetch, calls } = mockFetch((url) => {
      const page = Number(url.searchParams.get("page"));
      return json(page === 1 ? [{ tag_name: "a" }, { tag_name: "b" }] : [{ tag_name: "c" }]);
    });
    const page = await new GitHubClient({ fetch, perPage: 2 }).listReleases("o", "r");
    assert.equal(page.items.length, 3);
    assert.equal(page.truncated, false);
    assert.equal(calls.length, 2);
  });

  it("respects maxPages", async () => {
    const { fetch, calls } = mockFetch(() => json([{ tag_name: "a" }, { tag_name: "b" }]));
    const page = await new GitHubClient({ fetch, perPage: 2, maxPages: 3 }).listReleases("o", "r");
    assert.equal(calls.length, 3);
    assert.equal(page.truncated, true, "cap reached while pages were still full");
  });

  it("stops paginating pull requests once they leave the window", async () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const old = "2024-01-01T00:00:00Z";
    const { fetch, calls } = mockFetch(() =>
      json([
        { number: 2, created_at: "2026-05-30T00:00:00Z" },
        { number: 1, created_at: old },
      ]),
    );
    const pulls = await new GitHubClient({ fetch, perPage: 2 }).listPulls("o", "r", 365, now);
    assert.equal(pulls.items.length, 2);
    assert.equal(pulls.truncated, false, "window reached, so nothing relevant is missing");
    assert.equal(calls.length, 1, "no second page requested");
  });

  it("raises a helpful error on 404", async () => {
    const { fetch } = mockFetch(() => json({ message: "Not Found" }, 404));
    await assert.rejects(
      new GitHubClient({ fetch }).listReleases("o", "r"),
      (error: unknown) =>
        error instanceof GitHubError && error.status === 404 && /not found/.test(error.message),
    );
  });

  it("flags rate limiting", async () => {
    const { fetch } = mockFetch(() => json({}, 403, { "x-ratelimit-remaining": "0" }));
    await assert.rejects(new GitHubClient({ fetch }).listReleases("o", "r"), /rate limit/);
  });

  it("fetches pulls, issues and releases together", async () => {
    const { fetch, calls } = mockFetch(() => json([]));
    const data = await new GitHubClient({ fetch }).fetchRepoData("o", "r");
    assert.deepEqual(data, {
      pulls: [],
      issues: [],
      releases: [],
      truncated: { pulls: false, issues: false, releases: false },
    });
    const paths = calls.map((u) => u.pathname).sort();
    assert.deepEqual(paths, ["/repos/o/r/issues", "/repos/o/r/pulls", "/repos/o/r/releases"]);
  });
});
