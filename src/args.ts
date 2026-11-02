export interface CliOptions {
  repo: string;
  token: string | undefined;
  json: boolean;
  windowDays: number;
  staleDays: number;
}

export type ParsedArgs =
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "run"; options: CliOptions };

export const USAGE = `Usage: repo-pulse <owner/repo> [options]

Options:
  --token <token>     GitHub token (default: $GITHUB_TOKEN)
  --window <days>     Look-back window for PRs and releases (default: 365)
  --stale <days>      Days without activity before an open issue is stale (default: 90)
  --json              Output JSON instead of Markdown
  -h, --help          Show this help
  -v, --version       Show the version
`;

function positiveInt(flag: string, value: string | undefined): number {
  const n = Number(value);
  if (value === undefined || !Number.isInteger(n) || n <= 0) {
    throw new Error(`${flag} expects a positive integer`);
  }
  return n;
}

export function parseArgs(argv: readonly string[], env: Record<string, string | undefined> = {}): ParsedArgs {
  let repo: string | undefined;
  let token = env.GITHUB_TOKEN;
  let json = false;
  let windowDays = 365;
  let staleDays = 90;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    switch (arg) {
      case "-h":
      case "--help":
        return { kind: "help" };
      case "-v":
      case "--version":
        return { kind: "version" };
      case "--json":
        json = true;
        break;
      case "--token":
        token = argv[++i];
        if (!token) throw new Error("--token expects a value");
        break;
      case "--window":
        windowDays = positiveInt(arg, argv[++i]);
        break;
      case "--stale":
        staleDays = positiveInt(arg, argv[++i]);
        break;
      default:
        if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
        if (repo !== undefined) throw new Error(`Unexpected argument: ${arg}`);
        repo = arg;
    }
  }

  if (repo === undefined) throw new Error("Missing repository argument (owner/repo)");
  return { kind: "run", options: { repo, token, json, windowDays, staleDays } };
}
