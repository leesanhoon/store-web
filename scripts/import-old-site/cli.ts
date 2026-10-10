type Command = {
    summary: string;
    run: (args: string[]) => Promise<void>;
};

// One entry per subcommand; each module parses its own arguments and handles `--help`.
const COMMANDS: Record<string, Command> = {
    fetch: {
        summary: "Download the old catalog into data/snapshot.json and its images into data/images/",
        run: async (args) => (await import("./fetch.ts")).runFetch(args),
    },
    plan: {
        summary: "Dry-run: parse the snapshot, group it into families, compare with production (GET only), write out/plan.json and out/plan.md",
        run: async (args) => (await import("./plan.ts")).runPlan(args),
    },
    apply: {
        summary: "Write the reviewed plan to the target backend (a dry run unless --apply and every gate pass), with manifest and journal",
        run: async (args) => (await import("./apply.ts")).runApply(args),
    },
    verify: {
        summary: "Check that everything out/manifest.json lists is on the target backend, avatar images reachable included (GET only, no token)",
        run: async (args) => (await import("./verify.ts")).runVerify(args),
    },
    rollback: {
        summary: "Delete what out/manifest.json says apply created, and only that (refuses without --rollback and --confirm-host)",
        run: async (args) => (await import("./rollback.ts")).runRollback(args),
    },
};

function helpText(): string {
    const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length));
    const lines = Object.entries(COMMANDS).map(([name, { summary }]) => `  ${name.padEnd(width)}  ${summary}`);
    return [
        "Usage: node scripts/import-old-site/cli.ts <command> [options]",
        "",
        "Commands:",
        ...lines,
        "",
        'Run "<command> --help" for the options of a command.',
    ].join("\n");
}

async function main(argv: string[]) {
    const [name, ...args] = argv;
    if (name === undefined || name === "help" || name === "--help" || name === "-h") {
        console.log(helpText());
        return;
    }
    if (!Object.hasOwn(COMMANDS, name)) {
        console.error(`error: unknown command "${name}"\n\n${helpText()}`);
        process.exitCode = 1;
        return;
    }
    await COMMANDS[name].run(args);
}

main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
});
