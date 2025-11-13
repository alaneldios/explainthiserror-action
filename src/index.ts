import * as core from "@actions/core";
import * as github from "@actions/github";

type RootCause = {
  short?: string;
  detail?: string;
};

type Analysis = {
  root_cause?: RootCause;
  fixes?: unknown[];
  commands?: unknown[];
  docs?: unknown[];
};

type CIResponse = {
  source?: string;
  analysis?: Analysis;
  stack?: string;
  meta?: Record<string, unknown>;
};

type ETEPayload = {
  error: string;
  repo?: string;
  sha?: string;
  job?: string;
  step?: string;
  file?: string;
  line?: string | number;
  run_url?: string;
};

async function run(): Promise<void> {
  try {
    const errorText = core.getInput("error", { required: true });
    const apiKey = core.getInput("api_key", { required: true });
    const apiUrl =
      core.getInput("api_url") || "https://api.explainthiserror.com/ci/analyze";
    const commentPR = (core.getInput("comment_pr") || "true").toLowerCase() === "true";
    const failOnApiError =
      (core.getInput("fail_on_api_error") || "false").toLowerCase() === "true";

    const ctx = github.context;
    const repoSlug = `${ctx.repo.owner}/${ctx.repo.repo}`;
    const sha = ctx.sha;
    const job = ctx.job || process.env.GITHUB_JOB || "unknown";
    const runId = process.env.GITHUB_RUN_ID;
    const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
    const runUrl = `${serverUrl}/${repoSlug}/actions/runs/${runId}`;

    const payload: ETEPayload = {
      error: errorText.slice(0, 20000),
      repo: repoSlug,
      sha,
      job,
      step: "analysis",
      run_url: runUrl
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const msg = `ExplainThisError API ${res.status}: ${body || res.statusText}`;
      if (failOnApiError) throw new Error(msg);
      core.warning(msg);
      return;
    }

    // Important: undici's fetch types make res.json() -> unknown. Cast it.
    const data = (await res.json()) as CIResponse;

    // Outputs
    core.setOutput("json", JSON.stringify(data || {}));
    const rc = data?.analysis?.root_cause || {};
    const short = rc.short || "";
    const detail = rc.detail || "";
    core.setOutput("root_cause_short", short);
    core.setOutput("root_cause_detail", detail);

    // Step summary
    const summary = core.summary;
    summary.addHeading("ExplainThisError — CI Analysis");
    summary.addCodeBlock(errorText.slice(0, 1000), "text");
    if (short) summary.addHeading("Root cause", 3).addQuote(short);
    if (detail) summary.addHeading("Details", 3).addCodeBlock(detail, "markdown");

    const fixes = data?.analysis?.fixes || [];
    if (Array.isArray(fixes) && fixes.length) {
      summary.addHeading("Fixes", 3).addList(
        fixes.map((f: unknown) => String(f)).slice(0, 10)
      );
    }

    const commands = data?.analysis?.commands || [];
    if (Array.isArray(commands) && commands.length) {
      summary.addHeading("Commands", 3).addCodeBlock(
        commands.map((c: unknown) => String(c)).join("\n"),
        "bash"
      );
    }

    const docs = data?.analysis?.docs || [];
    if (Array.isArray(docs) && docs.length) {
      summary.addHeading("Docs", 3).addList(docs.map((d: unknown) => String(d)).slice(0, 10));
    }

    await summary.write();

    // Optional PR comment
    const isPR = ctx.eventName === "pull_request" || ctx.eventName === "pull_request_target";
    if (commentPR && isPR) {
      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      if (!token) {
        core.info("GITHUB_TOKEN not provided; skipping PR comment.");
        return;
      }
      const octokit = github.getOctokit(token);
      const prNumber =
        (ctx.payload as any)?.pull_request?.number ??
        (ctx.payload as any)?.issue?.number;
      if (!prNumber) {
        core.info("No PR number in context; skipping PR comment.");
        return;
      }

      const lines: string[] = [];
      lines.push("## 🔎 ExplainThisError — CI Analysis");
      if (short) {
        lines.push(`**Root cause:** ${short}`);
      }
      if (detail) {
        lines.push("<details><summary>Details</summary>\n\n");
        lines.push(detail);
        lines.push("\n</details>");
      }
      if (Array.isArray(fixes) && fixes.length) {
        lines.push("\n**Fixes:**");
        for (const f of fixes.slice(0, 10)) lines.push(`- ${String(f)}`);
      }
      if (Array.isArray(commands) && commands.length) {
        lines.push("\n**Commands:**");
        lines.push("```bash");
        for (const c of commands.slice(0, 12)) lines.push(String(c));
        lines.push("```");
      }
      if (Array.isArray(docs) && docs.length) {
        lines.push("\n**Docs:**");
        for (const d of docs.slice(0, 8)) lines.push(`- ${String(d)}`);
      }
      lines.push(`\n_Run:_ ${runUrl}`);

      await octokit.rest.issues.createComment({
        owner: ctx.repo.owner,
        repo: ctx.repo.repo,
        issue_number: prNumber,
        body: lines.join("\n")
      });
    }
  } catch (err: any) {
    core.setFailed(err?.message || String(err));
  }
}

run();
