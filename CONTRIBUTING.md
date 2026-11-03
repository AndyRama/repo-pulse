# Contributing to repo-pulse

Thanks for your interest. Contributions of every size are welcome: bug reports, documentation fixes, new metrics, new data sources.

## Getting started

```sh
git clone https://github.com/AndyRama/repo-pulse.git
cd repo-pulse
npm install
npm test
```

Node.js 20 or later is required. The project has no runtime dependencies and we would like to keep it that way.

## Workflow

1. Open an issue first for anything bigger than a small fix, so we can agree on the approach before you invest time.
2. Create a branch from `main`.
3. Make your change with tests. `npm test` must pass.
4. Open a pull request that explains what changed and why.

## Guidelines

- **Tests.** Every behavior change comes with a test. Metrics are pure functions, so tests need no network. Use the injected `fetch` for client tests.
- **Types.** The code is strict TypeScript. Avoid `any`.
- **Metrics must be explainable.** A new metric needs a clear definition in the README and, if it feeds the health score, documented thresholds.
- **Be kind to the GitHub API.** New calls must paginate with a cap and should stop early when possible.
- **Commits.** Short imperative subject line (`Fix stale issue boundary`), details in the body if needed.

## Reporting bugs

Use the bug report template. Include the repository you ran against (if public), the command or code, the expected result and the actual result.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).

## Code of conduct

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
