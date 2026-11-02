#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { USAGE, parseArgs } from "./args.js";
import { GitHubClient, parseRepo } from "./github.js";
import { computeMetrics } from "./metrics.js";
import { renderJson, renderMarkdown } from "./report.js";

function version(): string {
  const url = new URL("../package.json", import.meta.url);
  return (JSON.parse(readFileSync(url, "utf8")) as { version: string }).version;
}

async function main(): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  if (parsed.kind === "help") {
    console.log(USAGE);
    return 0;
  }
  if (parsed.kind === "version") {
    console.log(version());
    return 0;
  }

  const { repo, token, json, windowDays, staleDays } = parsed.options;
  try {
    const { owner, repo: name } = parseRepo(repo);
    const client = new GitHubClient({ token });
    const data = await client.fetchRepoData(owner, name, { windowDays });
    const metrics = computeMetrics(data, { windowDays, staleDays });
    const label = `${owner}/${name}`;
    console.log(json ? renderJson(label, metrics) : renderMarkdown(label, metrics));
    return 0;
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
