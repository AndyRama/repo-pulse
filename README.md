# repo-pulse

Measure how well an open source project is maintained: how fast pull requests get merged, how fresh the issue backlog is, and how regularly releases ship.

`repo-pulse` is a small, dependency-free TypeScript library and CLI. It reads public GitHub data and turns it into numbers maintainers can track over time, and contributors and users can check before depending on a project.

## Why

Stars say a project is popular, not that it is looked after. Maintainers carry the invisible work: reviewing pull requests, triaging issues, cutting releases. `repo-pulse` makes that work visible with a handful of transparent metrics, so burnout shows up in a number before it shows up in an abandoned repository.

## What it measures

| Area | Metrics |
| --- | --- |
| Pull requests | opened, merged, closed without merge, merge rate, median and p90 time to merge |
| Issues | open and closed, stale open issues, open issues with no comment, median time to close |
| Releases | releases in the window, days since the last release, median gap between releases |
| Health score | 0 to 100, the average of the four components above that have data |

Every component is a simple linear scale with documented thresholds (see [`src/metrics.ts`](src/metrics.ts)). Nothing is hidden: if the score surprises you, the breakdown tells you why.

## Install

`repo-pulse` is pre-release (0.1.0) and not published to npm yet. Build it from source:

```sh
git clone https://github.com/<your-username>/repo-pulse.git
cd repo-pulse
npm install
npm run build
```

Requires Node.js 20 or later.

## CLI

```sh
export GITHUB_TOKEN=ghp_...            # optional, raises the rate limit from 60 to 5000 requests/hour
node dist/cli.js nodejs/node           # Markdown report
node dist/cli.js nodejs/node --json    # JSON, for scripts and dashboards
node dist/cli.js owner/repo --window 180 --stale 60
```

| Option | Default | Meaning |
| --- | --- | --- |
| `--token <token>` | `$GITHUB_TOKEN` | GitHub token |
| `--window <days>` | 365 | Look-back window for pull requests and releases |
| `--stale <days>` | 90 | Days without activity before an open issue counts as stale |
| `--json` | off | Output JSON instead of Markdown |

Exit codes: `0` success, `1` runtime error (network, rate limit, not found), `2` invalid arguments.

## Library

```ts
import { GitHubClient, computeMetrics, renderMarkdown } from "repo-pulse";

const client = new GitHubClient({ token: process.env.GITHUB_TOKEN });
const data = await client.fetchRepoData("nodejs", "node");
const metrics = computeMetrics(data, { windowDays: 365, staleDays: 90 });

console.log(metrics.health.score); // e.g. 74
console.log(renderMarkdown("nodejs/node", metrics));
```

`computeMetrics` is a pure function over plain data, so you can feed it data from any source (GitLab, a cached dump, test fixtures) without touching the network.

## Limits

- Data comes from GitHub's list endpoints, capped at 10 pages of 100 items per collection by default (`maxPages`). Very large repositories are sampled from their most recent activity.
- "Unanswered" means an open issue with zero comments. It does not distinguish maintainers from other commenters.
- The health score is a heuristic. Use it to spot trends, not to rank projects.

## Development

```sh
npm install
npm test          # type-checks and runs the test suite (node:test, no extra dependencies)
npm run build     # emits dist/
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
