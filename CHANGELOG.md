# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0]

### Changed

- Pull requests opened by bots (Dependabot, pre-commit.ci and other GitHub Apps) are now excluded from the pull request figures by default. They are usually merged within hours and pulled the median time to merge towards zero. The report states how many were excluded. Pass `--include-bots` (CLI) or `includeBots: true` (library) to count them. Scores change accordingly.
- `PullRequestMetrics` gains `botsExcluded`; `PullRequest` gains an optional `user`.

### Fixed

- The score is only labelled "partial data" when truncation affects it (pull requests or open issues). Truncated closed issues or releases are listed under "Data coverage" without discrediting the score.

## [0.1.3]

### Fixed

- Issue metrics are now complete for most established repositories. Open issues and issues closed within the window are fetched separately, instead of sampling the 1,000 most recently updated items (issues and pull requests together). Stale and unanswered ratios are only skipped when there are more open items than the fetch cap.

### Changed

- `GitHubClient.listIssues` is replaced by `listOpenIssues` and `listClosedIssues`.
- `Metrics.issues.closed` counts issues closed within the window. `RepoData.truncated` gains `closedIssues` and `Metrics.coverage` gains `closedIssuesTruncated`.

## [0.1.2]

### Fixed

- Reports on very large repositories no longer present truncated data as complete. When the fetch cap is reached, the report adds a "Data coverage" section, flags the score as partial, and skips the stale and unanswered issue ratios.

### Changed

- `GitHubClient.listPulls`, `listIssues` and `listReleases` now return `{ items, truncated }`. `RepoData` and `Metrics` gain optional truncation and `coverage` fields.

## [0.1.1]

### Changed

- Package renamed to `@andyrama/repo-pulse`: npm rejected the unscoped name as too similar to an existing package. The `repo-pulse` command name is unchanged. Version 0.1.0 was never published to npm.

## [0.1.0]

### Added

- Metrics for pull requests, issues, and releases, plus a 0 to 100 health score.
- GitHub client with pagination, page caps, and helpful errors.
- `repo-pulse` CLI with Markdown and JSON output.
