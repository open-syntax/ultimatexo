# CI/CD Rewrite Plan

## Critical Bugs Found & Fixed

### 1. `cleanup.yml` - Subshell variable loss (lines 128-155)

`while read` in a pipe runs in a subshell, so `deleted` and `freed_bytes` increments are lost. The outputs are always 0.
**Fix:** Use process substitution `< <(...)` or rewrite with `gh api --paginate` and `jq` array processing.

### 2. `cleanup.yml` - Broken jq iteration (lines 51-63)

`jq '.workflow_runs[]'` outputs multiple JSON objects, then piping to `jq -c '.'` doesn't iterate correctly over NDJSON.
**Fix:** Use `jq -c '.workflow_runs[]'` in one step.

### 3. `build.yml` - Wrong digest references (lines 149, 163)

Trivy references `needs.build.outputs.client-digest` but `docker/build-push-action` outputs a single `digest` key, not per-image outputs.
**Fix:** Use a matrix for builds and capture digests properly, or use image refs by tag instead of digest.

### 4. `ci.yml` - Silent tarpaulin failure (lines 114-115)

`cargo install cargo-tarpaulin --locked || true` silently fails, then coverage silently fails. No coverage is ever uploaded.
**Fix:** Replace with `cargo-llvm-cov` via `taiki-e/install-action` (pre-built, instant).

### 5. `ci.yml` - No path filtering

CI runs on docs-only changes, wasting minutes and runner time.
**Fix:** Add `paths-ignore` for `**/*.md`, `docs/**`, `.gitignore`, `LICENSE`.

## Major Improvements

### ci.yml

- **Path filtering** - skip CI on docs-only changes
- **Change detection** - use `dorny/paths-filter` to only run relevant jobs
- **Replace `Swatinem/rust-cache@v2`** instead of manual `actions/cache` (handles target dir, registry, git db automatically)
- **Remove redundant `summary` job** - GitHub shows job status natively; the summary job adds no value
- **Matrix test jobs** - server and client tests run in parallel
- **Proper permissions** - least-privilege with `contents: read`, `checks: write`
- **Replace `cargo-tarpaulin`** with `cargo-llvm-cov` (pre-built binary, no compile time)
- **Pin `dtolnay/rust-toolchain@master`** instead of `@stable` (stable is a mutable tag)
- **Remove `|| echo` fallbacks** that hide real failures

### build.yml

- **Matrix build** - all 3 components build in parallel instead of sequentially
- **Proper digest capture** - use matrix with proper output mapping
- **Add SBOM generation** - `docker/build-push-action` with `provenance` and `sbom` attestation
- **Pin QEMU** - only needed for multi-arch; add comment if not actually building multi-arch
- **Fix Trivy** - scan by tag instead of broken digest reference
- **Add `fail_ci_if_error`** to security uploads
- **Consolidate tag logic** - use `docker/metadata-action@v5` for proper semantic versioning tags

### deploy.yml

- **Extract inline scripts** - move deploy.sh to `scripts/deploy.sh` in repo (versioned, testable)
- **Add rollback job** - ability to rollback to previous version on failure
- **Fix variable scoping** - `GITHUB_TOKEN` env is set in envs but also referenced in script inconsistently
- **Improve health checks** - use proper HTTP status code checking with retries
- **Add deployment gates** - require approval for production
- **Remove Discord notification on every deploy** - only notify on failure or first success

### cleanup.yml

- **Fix subshell bug** - rewrite cache/run cleanup with proper variable scoping
- **Use `actions/github-script`** instead of fragile shell date parsing
- **Replace manual workflow deletion** with `Mattraks/delete-workflow-runs@v2`
- **Consolidate jobs** - single maintenance job instead of 3 fragmented ones
- **Remove `bc` dependency** - use pure bash arithmetic

### pr-labeler.yml

- **Consolidate into single job** - 3 jobs for labeling is overkill
- **Fix permissions** - `contents: read` not needed for labeler

### Dockerfiles

- **client**: Pin `node:22-alpine` (LTS) instead of `node:25-alpine` (non-LTS). Add proper runner stage with Caddy/nginx instead of bare alpine.
- **server**: Pin `rust:1-bookworm` instead of floating `cargo-chef:latest`. Use `apt-get upgrade` properly.
- **caddy**: Remove `apk upgrade` (breaks reproducibility). Pin `caddy:2-builder`. Remove redundant `ca-certificates` (already in base).

## Architecture: Sequential Pipeline

```
PR:
  ci.yml (lint, test, security, docker-build-check)
    └── stops here (no build/deploy for PRs)

Push to dev:
  ci.yml (lint, test, security, docker-build-check)
    └── stops here (no build/deploy for dev)

Push to main:
  ci.yml → build.yml (build + push to GHCR as 'main' + security scan)

Tag push (v*):
  ci.yml → build.yml (build + push to GHCR as 'v1.2.3', '1', '1.2') → deploy.yml (production)
```

### How it works

- **`ci.yml`** - Gatekeeper. Runs on all PRs, pushes to `dev`/`main`. Validates code quality. On success + `main` or tag, calls `build.yml` via `workflow_call`.
- **`build.yml`** - Build & publish. Triggered by `ci.yml` (on main/tag) or directly on tag push. Builds all 3 images in parallel matrix, pushes to GHCR, runs Trivy scan. On tag push, calls `deploy.yml`.
- **`deploy.yml`** - Production deploy. Only triggered by `build.yml` on tag push, or manually via `workflow_dispatch`.

### Tagging strategy

| Trigger         | Tags                 |
| --------------- | -------------------- |
| Push to `main`  | `main`               |
| Tag `v1.2.3`    | `v1.2.3`, `1`, `1.2` |
| Manual dispatch | `latest`             |

### Key design decisions

- Use `workflow_call` to enforce sequential CI → Build → Deploy
- `ci.yml` is the only entry point for PRs and pushes
- Deploy script extracted to `scripts/deploy.sh` (versioned, testable)
- All images go to `ghcr.io/open-syntax/ultimatexo-*` only

## File Changes Summary

| File                                    | Changes                                                                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`              | Full rewrite: path filters, change detection, matrix tests, proper caching, remove summary job, add `workflow_call` trigger to chain to build              |
| `.github/workflows/build.yml`           | Full rewrite: triggered via `workflow_call` from CI or on tag, matrix builds, metadata-action for tags, SBOM, fix Trivy, GHCR only, chain to deploy on tag |
| `.github/workflows/deploy.yml`          | Full rewrite: triggered via `workflow_call` from build or manual dispatch, extract scripts, rollback, better health checks, GHCR only                      |
| `.github/workflows/cleanup.yml`         | Full rewrite: fix subshell bug, use proper actions, consolidate                                                                                            |
| `.github/workflows/pr-labeler.yml`      | Consolidate jobs, fix permissions                                                                                                                          |
| `.github/workflows/release-drafter.yml` | Minor: add permissions block                                                                                                                               |
| `.github/workflows/stale.yml`           | No changes needed (already well-configured)                                                                                                                |
| `client/Dockerfile`                     | Pin Node 22 LTS, add proper runner                                                                                                                         |
| `server/Dockerfile`                     | Pin Rust version, fix apt handling                                                                                                                         |
| `caddy/Dockerfile`                      | Pin Caddy version, remove apk upgrade                                                                                                                      |

## Estimated Impact

- **CI runtime**: ~40% reduction (parallel matrix, proper caching, path filters)
- **Reliability**: Fix 4 critical bugs that silently fail
- **Security**: Add SBOM, fix Trivy scanning, least-privilege permissions
- **Maintainability**: Extract scripts, consolidate jobs, consistent patterns
- **Pipeline clarity**: Strict CI → Build → Deploy sequence, no orphaned runs
