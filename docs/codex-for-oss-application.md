# Codex for Open Source: application draft

Form: https://openai.com/fr-FR/form/codex-for-oss/
Program details: https://developers.openai.com/codex/codex-for-oss

**Do not submit yet.** The program supports maintainers of widely used, actively maintained projects. OpenAI says it looks at repository usage, importance to the ecosystem, and evidence of ongoing maintenance (PR review, triage, releases). A brand-new repository has none of that. The same page says projects that do not fit the criteria perfectly but matter to the ecosystem should still apply and explain why, so apply once you have real numbers to show.

## Before applying

- [ ] Publish the repository publicly on GitHub (the form requires a public profile and public repo)
- [ ] Publish a first release (npm and a GitHub release)
- [ ] Use repo-pulse on a handful of real projects and publish the reports (dogfooding)
- [ ] Run it on this repo regularly so there is a visible maintenance history
- [ ] Gather adoption evidence: stars, npm downloads, dependents, issues and PRs from other people
- [ ] Have your ChatGPT account email and OpenAI organization ID ready (platform.openai.com/settings/organization/general)

## Form fields

| Field | Answer |
| --- | --- |
| First name, last name | (yours) |
| Email | The email tied to your ChatGPT account |
| GitHub username | (yours), profile set to public |
| Repository URL | https://github.com/andyrama/repo-pulse, set to public |
| Role | Lead maintainer (if you are the main maintainer) |
| Interested in | Codex Security (optional), API credits for my project |
| OpenAI organization ID | org-... |

## Why is this repository eligible? (max 500 characters)

Replace the bracketed numbers with real ones. Do not claim figures you cannot show.

> repo-pulse is a dependency-free TypeScript library and CLI that measures open source maintenance health: PR turnaround, issue staleness, release cadence. It helps maintainers see burnout early and users judge projects before adopting them. [X] GitHub stars, [Y] monthly npm downloads, used by [Z] projects. I review every PR and triage every issue, with [N] releases in [M] months.

## How will you use API credits? (max 500 characters)

> Codex-powered PR review on every pull request, automated issue triage and labeling, release-note drafting from merged PRs, and a scheduled workflow that runs repo-pulse on itself and opens issues when metrics degrade. Credits would also fund reviewing contributions from first-time contributors faster, which is the bottleneck for a solo maintainer.

## Anything else? (max 500 characters)

> repo-pulse is MIT-licensed, has no runtime dependencies, and ships with tests and CI. The goal is to make maintainer workload measurable, which is the same problem this program addresses. Happy to share maintenance reports for any project as an example.

Character counts: the two long answers above are under 500 characters once the bracketed placeholders are filled with short numbers. Re-check the count before submitting.
