# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
