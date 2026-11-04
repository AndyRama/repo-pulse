import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArgs } from "../src/args.js";

function run(argv: string[], env: Record<string, string | undefined> = {}) {
  const parsed = parseArgs(argv, env);
  assert.equal(parsed.kind, "run");
  return parsed.kind === "run" ? parsed.options : (undefined as never);
}

describe("parseArgs", () => {
  it("parses a repository with defaults", () => {
    assert.deepEqual(run(["nodejs/node"]), {
      repo: "nodejs/node",
      token: undefined,
      json: false,
      includeBots: false,
      windowDays: 365,
      staleDays: 90,
    });
  });

  it("reads the token from the environment, overridable by the flag", () => {
    assert.equal(run(["a/b"], { GITHUB_TOKEN: "env" }).token, "env");
    assert.equal(run(["a/b", "--token", "flag"], { GITHUB_TOKEN: "env" }).token, "flag");
  });

  it("parses numeric options and --json", () => {
    const options = run(["a/b", "--json", "--window", "30", "--stale", "14"]);
    assert.equal(options.json, true);
    assert.equal(options.windowDays, 30);
    assert.equal(options.staleDays, 14);
  });

  it("parses --include-bots", () => {
    assert.equal(run(["a/b", "--include-bots"]).includeBots, true);
  });

  it("recognizes help and version", () => {
    assert.equal(parseArgs(["--help"]).kind, "help");
    assert.equal(parseArgs(["-v"]).kind, "version");
  });

  it("rejects bad input", () => {
    assert.throws(() => parseArgs([]), /Missing repository/);
    assert.throws(() => parseArgs(["a/b", "--window", "abc"]), /positive integer/);
    assert.throws(() => parseArgs(["a/b", "--window"]), /positive integer/);
    assert.throws(() => parseArgs(["a/b", "--token"]), /--token expects/);
    assert.throws(() => parseArgs(["a/b", "--nope"]), /Unknown option/);
    assert.throws(() => parseArgs(["a/b", "c/d"]), /Unexpected argument/);
  });
});
