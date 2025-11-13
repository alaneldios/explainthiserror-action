# ExplainThisError GitHub Action

Analyze failing build, test, or deployment logs using [ExplainThisError](https://explainthiserror.com).  
This action sends error text to the ExplainThisError API and returns structured root-cause explanations, fixes, suggested commands, and documentation links.

It automatically:
- Posts a **step summary** in your CI logs.
- Optionally comments on pull requests with detailed analysis.
- Provides outputs you can reuse in later steps.

---

## 🔧 Inputs

| Name | Required | Default | Description |
|------|-----------|----------|-------------|
| `error` | ✅ Yes | – | Error text or log snippet to analyze. Usually from a failed command’s captured output. |
| `api_key` | ✅ Yes | – | Bearer key provisioned for CI. You can use the public key `ghci_public_free_1` for evaluation, or store your own key as a repository secret. |
| `api_url` | ✅ Yes | `https://api.explainthiserror.com/ci/analyze` | API endpoint for analysis (use your ExplainThisError instance URL). |
| `comment_pr` | ❌ No | `true` | Whether to comment on pull requests with the root cause. |
| `fail_on_api_error` | ❌ No | `false` | Whether to fail the workflow step if the ExplainThisError API call fails. |

---

## 📤 Outputs

| Name | Description |
|------|--------------|
| `json` | Full raw JSON response from the ExplainThisError API. |
| `root_cause_short` | Short summary of the detected root cause. |
| `root_cause_detail` | Detailed explanation of the root cause. |

---

## 🚀 Quick Start

```yaml
name: ExplainThisError Demo

on:
  workflow_dispatch:
  push:
    branches: [ main ]
  pull_request:

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: ExplainThisError
        id: explain
        uses: alaneldios/explainthiserror-action@v1
        with:
          error: |
            PermissionError: [Errno 13] Permission denied: '/etc/shadow'
          api_key: ghci_public_free_1
          api_url: https://api.explainthiserror.com/ci/analyze
          comment_pr: true
          fail_on_api_error: false

      - name: Use outputs
        shell: bash
        run: |
          printf 'Short: %s\n' "${{ steps.explain.outputs.root_cause_short }}"
          echo 'Detail:'
          printf '%s\n' "${{ steps.explain.outputs.root_cause_detail }}"
```

---

## 🧩 Real-World Integration Examples

### 1. Capture a failed build log
```yaml
- name: Build
  id: build
  run: |
    set -o pipefail
    make build 2>&1 | tee build.log

- name: Collect build error
  if: failure()
  id: err
  run: |
    echo "error<<EOF" >> "$GITHUB_OUTPUT"
    tail -n 300 build.log >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"

- name: ExplainThisError
  if: failure()
  uses: alaneldios/explainthiserror-action@v1
  with:
    error: ${{ steps.err.outputs.error }}
    api_key: ghci_public_free_1
    api_url: https://api.explainthiserror.com/ci/analyze
```

### 2. Python (pytest)
```yaml
- name: Run pytest
  id: pytest
  run: |
    set -o pipefail
    pytest -q -rA 2>&1 | tee pytest.log

- name: Collect error
  if: failure()
  id: err
  run: |
    echo "error<<EOF" >> "$GITHUB_OUTPUT"
    tail -n 400 pytest.log >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"

- name: ExplainThisError
  if: failure()
  uses: alaneldios/explainthiserror-action@v1
  with:
    error: ${{ steps.err.outputs.error }}
    api_key: ghci_public_free_1
    api_url: https://api.explainthiserror.com/ci/analyze
```

### 3. Node / npm test
```yaml
- name: Run tests
  id: test
  run: |
    set -o pipefail
    npm test --silent 2>&1 | tee test.log

- name: Collect error
  if: failure()
  id: err
  run: |
    echo "error<<EOF" >> "$GITHUB_OUTPUT"
    tail -n 300 test.log >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"

- name: ExplainThisError
  if: failure()
  uses: alaneldios/explainthiserror-action@v1
  with:
    error: ${{ steps.err.outputs.error }}
    api_key: ghci_public_free_1
    api_url: https://api.explainthiserror.com/ci/analyze
```

### 4. Docker build
```yaml
- name: Docker build
  id: docker
  run: |
    set -o pipefail
    docker build . 2>&1 | tee docker.log

- name: Collect docker error
  if: failure()
  id: err
  run: |
    echo "error<<EOF" >> "$GITHUB_OUTPUT"
    tail -n 400 docker.log >> "$GITHUB_OUTPUT"
    echo "EOF" >> "$GITHUB_OUTPUT"

- name: ExplainThisError
  if: failure()
  uses: alaneldios/explainthiserror-action@v1
  with:
    error: ${{ steps.err.outputs.error }}
    api_key: ghci_public_free_1
    api_url: https://api.explainthiserror.com/ci/analyze
```

---

## 🔒 Security Notes

- Always store private API keys in repository or organization secrets (`EXPLAINTHISERROR_API_KEY`) if you use your own keys.
- The public key `ghci_public_free_1` is rate-limited but functional for demos and public repositories.
- The action requires only standard GitHub token permissions for posting PR comments:  
  ```yaml
  permissions:
    contents: read
    pull-requests: write
  ```

---

## 🧠 How it Works

This action posts your CI logs to `https://api.explainthiserror.com/ci/analyze`.  
The backend runs ExplainThisError’s analysis pipeline (rules + LLM) and returns:
- A probable root cause (`root_cause_short` + `root_cause_detail`)
- Diagnostics and suggested commands
- Fixes and documentation links

The JSON structure is consistent with the web app’s `/analyze` endpoint.

---

## 📄 License

MIT © 2025 ExplainThisError  
Author: [Alan El Dios](https://github.com/alaneldios)
