# Security policy

## Supported versions

Only the latest released version receives security fixes.

## Reporting a vulnerability

Please do not open a public issue.

Use GitHub's private vulnerability reporting: on the repository page, go to **Security** > **Report a vulnerability**. If that is unavailable, email **<contact-email>** (replace before publishing).

Include a description, steps to reproduce, and the version affected. You can expect an acknowledgement within a few days. We will coordinate a fix and a disclosure date with you.

## Scope notes

- `repo-pulse` sends your GitHub token only to the configured GitHub API host, in the `Authorization` header. It never logs or writes the token.
- Repository names are validated before being placed in request paths.
