# ExplainThisError GitHub Action

Analyze failing logs and CI errors using [ExplainThisError](https://explainthiserror.com). The action posts a root-cause analysis with fixes, writes a step summary, and optionally comments on pull requests.

## Inputs

- `error` **required** – Error text or log snippet.
- `api_key` **required** – CI bearer key. Store as a repository secret.
- `api_url` **required** – Default: `https://api.explainthiserror.com/ci/analyze`.
- `comment_pr` optional – Post a PR comment when on `pull_request` (default: `true`).
- `fail_on_api_error` optional – Fail the step if the API call fails (default: `false`).

## Outputs

- `json` – Raw JSON response.
- `root_cause_short`
- `root_cause_detail`

