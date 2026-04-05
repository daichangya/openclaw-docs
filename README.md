# openclaw-docs

Mirror repo for the published OpenClaw docs site.

Source of truth lives in [`openclaw/openclaw`](https://github.com/openclaw/openclaw), under `docs/`.

## How it works

1. English docs are authored in `openclaw/openclaw`.
2. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` mirrors the docs tree into this repo.
3. This repo stores the published docs tree plus generated locale output.
4. `openclaw/docs/.github/workflows/translate-zh-cn.yml` and `translate-uk.yml` run on push, schedule, and release dispatch to refresh `docs/zh-CN/**` and `docs/uk/**`.

## Translation behavior

- zh-CN and uk pages are generated output.
- Each translated page stores `x-i18n.source_hash`.
- The translate workflow computes a pending file list before calling the model.
- If no English source hashes changed, the workflow skips the expensive translation step entirely.
- If files changed, only the pending files are translated.
- The workflow retries transient model-format failures.

## Editing rules

- Do not treat this repo as the primary place for English doc edits.
- Make English doc changes in `openclaw/openclaw`, then let sync copy them here.
- zh-CN pages in `docs/zh-CN/**` and uk pages in `docs/uk/**` are generated output.
- `.openclaw-sync/source.json` records which `openclaw/openclaw` commit this mirror was synced from.

## Secrets

- `OPENCLAW_DOCS_SYNC_TOKEN` lives in `openclaw/openclaw` and lets the source repo push into this repo.
- `OPENCLAW_DOCS_I18N_OPENAI_API_KEY` lives in this repo and powers locale translation refreshes.
