# ExplainThisError GitHub Action

Analyze failing logs and CI errors using [ExplainThisError](https://explainthiserror.com). The action posts a root-cause analysis with fixes, writes a step summary, and optionally comments on pull requests.

## Inputs

- `error` **required** – Error text or log snippet.
- `api_key` **required** – CI bearer key. Store as a repository secret.
- `api_url` optional – Default: `https://api.explainthiserror.com/ci/analyze`.
- `comment_pr` optional – Post a PR comment when on `pull_request` (default: `true`).
- `fail_on_api_error` optional – Fail the step if the API call fails (default: `false`).

## Outputs

- `json` – Raw JSON response.
- `root_cause_short`
- `root_cause_detail`

## Setup

1. **Provision CI keys in your backend**
   - Set the env `GITHUB_CI_API_KEYS` on your API service to a comma-separated list of keys, e.g.:
     ```
     GITHUB_CI_API_KEYS=ghci_prod_1,ghci_prod_2
     ```
   - Deploy with the new env. Your API already validates these against the `Authorization: Bearer <key>` header and bypasses rate limits at `/ci/analyze`.

2. **Create a GitHub secret with one of those keys**
   - In your repo: *Settings → Secrets and variables → Actions → New repository secret*
   - Name: `EXPLAINTHISERROR_API_KEY`
   - Value: one key from `GITHUB_CI_API_KEYS` (e.g. `ghci_prod_1`)

3. **Add a workflow**
   - See [`.github/workflows/example.yml`](.github/workflows/example.yml). Minimal usage:
     ```yaml
     - name: Analyze failure
       uses: your-org-or-user/explainthiserror-action@v1
       with:
         error: ${{ steps.build.outputs.error || '...' }}
         api_key: ${{ secrets.EXPLAINTHISERROR_API_KEY }}
     ```
   - Provide any error/log snippet you want analyzed.

## Local development

```bash
npm install
npm run build
# commit dist/ for the action to run on GitHub
