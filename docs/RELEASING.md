# Releasing

One-time setup:

1. Create an npm account and enable two-factor authentication.
2. On npmjs.com, create an **Automation** access token (Account > Access Tokens > Generate New Token > Classic Token > Automation), or a granular token with read and write access to packages.
3. In the GitHub repository, go to Settings > Secrets and variables > Actions > New repository secret. Name it `NPM_TOKEN` and paste the token.

For each release:

1. Update the version in `package.json` and move the `[Unreleased]` entries in `CHANGELOG.md` under the new version.
2. Commit and push to `main`.
3. On GitHub, go to Releases > **Draft a new release**. In "Choose a tag", type the new tag (for example `v0.1.0`) and pick **Create new tag on publish**, with the target set to `main`. Click **Generate release notes**, then **Publish release**.

Publishing the release triggers the `Release` workflow. It checks that the tag matches `package.json`, runs the tests, and publishes to npm with provenance.
