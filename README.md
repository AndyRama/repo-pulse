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

```sh
npm install repo-pulse        # as a library
npx repo-pulse nodejs/node    # or run the CLI without installing
```

Requires Node.js 20 or later.

To work from source instead, see [Development](#development).

## CLI

```sh
export GITHUB_TOKEN=ghp_...            # optional, raises the rate limit from 60 to 5000 requests/hour
npx repo-pulse nodejs/node             # Markdown report
npx repo-pulse nodejs/node --json      # JSON, for scripts and dashboards
npx repo-pulse owner/repo --window 180 --stale 60
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

## Run it on your own repository

This repository ships [a workflow](.github/workflows/pulse.yml) that runs `repo-pulse` every Monday and writes the report to the job summary. Copy it into your project to get a weekly maintenance snapshot, with no token setup: the built-in `GITHUB_TOKEN` is enough.

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
