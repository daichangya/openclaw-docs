---
read_when:
    - テストの実行または修正
summary: Vitest を使ったローカルでのテスト実行方法と、force/coverage モードを使うべきタイミング
title: Tests
x-i18n:
    generated_at: "2026-04-22T04:28:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Tests

- 完全なテストキット（suite、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの control port を保持している残存 Gateway process を強制終了し、その後、分離された Gateway port で完全な Vitest suite を実行して、server test が実行中インスタンスと衝突しないようにします。以前の Gateway 実行で port 18789 が占有されたままになっている場合に使用してください。
- `pnpm test:coverage`: V8 coverage を使って unit suite を実行します（`vitest.unit.config.ts` 経由）。これは、リポジトリ全体の全ファイル coverage ではなく、読み込まれたファイルに対する unit coverage gate です。閾値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` は false なので、この gate は分割 lane のすべての source file を未カバーとして扱うのではなく、unit coverage suite で読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` から変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: 変更された git path を、差分がルーティング可能な source/test file だけに触れている場合に、スコープ付き Vitest lane へ展開します。config/setup の変更は引き続きネイティブな root project 実行へフォールバックするため、配線まわりの編集は必要に応じて広く再実行されます。
- `pnpm changed:lanes`: `origin/main` に対する diff によってトリガーされるアーキテクチャ lane を表示します。
- `pnpm check:changed`: `origin/main` に対する diff 用のスマート changed gate を実行します。core の作業には core test lane、extension の作業には extension test lane、test-only の作業には test typecheck/tests のみを実行し、公開 Plugin SDK または plugin-contract の変更は extension 検証まで展開し、release metadata のみの version bump は対象を絞った version/config/root-dependency チェックに保ちます。
- `pnpm test`: 明示的な file/directory target をスコープ付き Vitest lane 経由で実行します。target なしの実行では固定 shard group を使い、ローカル並列実行のために leaf config へ展開します。extension group は、巨大な 1 つの root-project process ではなく、常に extension ごとの shard config へ展開されます。
- 完全実行および extension shard 実行は、ローカル timing data を `.artifacts/vitest-shard-timings.json` に更新します。後続の実行は、その timing を使って遅い shard と速い shard を均等化します。ローカル timing artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` と `commands` の test file は、`test/setup.ts` のみを残す専用の軽量 lane を通るようになっており、runtime が重いケースは既存 lane のままです。
- 一部の `plugin-sdk` と `commands` の helper source file も、`pnpm test:changed` でこれらの軽量 lane の明示的な sibling test にマップされるため、小さな helper 編集で重い runtime 依存 suite を再実行せずに済みます。
- `auto-reply` も 3 つの専用 config（`core`、`top-level`、`reply`）に分割され、reply harness が軽い top-level の status/token/helper test を支配しないようになっています。
- ベースの Vitest config は、現在 `pool: "threads"` と `isolate: false` がデフォルトで、共有の非分離 runner が repo 全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/Plugin shard を実行します。重い channel extension と OpenAI は専用 shard として実行され、それ以外の extension group はまとめて実行されます。1 つの同梱 Plugin lane だけ実行するには `pnpm test extensions/<id>` を使ってください。
- `pnpm test:perf:imports`: Vitest の import-duration + import-breakdown レポートを有効にしつつ、明示的な file/directory target に対しては引き続きスコープ付き lane ルーティングを使用します。
- `pnpm test:perf:imports:changed`: 同じ import profiling を、`origin/main` から変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 同じ commit 済み git diff に対して、ルーティングされた changed-mode path をネイティブ root-project 実行とベンチマーク比較します。
- `pnpm test:perf:changed:bench -- --worktree`: 現在の worktree の変更セットを、先に commit せずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest の main thread 用 CPU profile を `.artifacts/vitest-main-profile` に出力します。
- `pnpm test:perf:profile:runner`: unit runner 用の CPU + heap profile を `.artifacts/vitest-runner-profile` に出力します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway の end-to-end smoke test（複数インスタンスの WS/HTTP/Node pairing）を実行します。デフォルトでは `vitest.e2e.config.ts` 内で `threads` + `isolate: false` と適応 worker を使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider live test（minimax/zai）を実行します。スキップ解除には API key と `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認した後、`/api/chat/completions` 経由で実際のプロキシされた chat を実行します。利用可能な live model key（たとえば `~/.profile` の OpenAI）が必要で、外部の Open WebUI image を pull し、通常の unit/e2e suite のように CI で安定することは期待されていません。
- `pnpm test:docker:mcp-channels`: seed 済み Gateway container と、`openclaw mcp serve` を起動する 2 つ目の client container を立ち上げ、その後、実際の stdio bridge 上で、ルーティングされた会話 discovery、transcript 読み取り、添付 metadata、live event queue の挙動、送信ルーティング、Claude 形式の channel + permission 通知を検証します。Claude 通知のアサーションは生の stdio MCP frame を直接読み取るため、この smoke は bridge が実際に出力するものを反映します。

## ローカル PR gate

ローカルでの PR land/gate チェックには、次を実行してください。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで flaky になる場合は、回帰と判断する前に 1 回だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使用してください。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチ（ローカル key）

script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- オプション env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルト prompt: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20 回実行）:

- minimax median 1279ms（min 1114、max 2431）
- opus median 2454ms（min 1224、max 3170）

## CLI 起動ベンチ

script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使い方:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方の preset

出力には、各 command ごとの `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、max RSS 要約が含まれます。オプションの `--cpu-prof-dir` / `--heap-prof-dir` は、各実行ごとに V8 profile を出力するため、計測と profile 取得に同じ harness を使用できます。

保存済み出力の規約:

- `pnpm test:startup:bench:smoke` は、対象を絞った smoke artifact を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、完全 suite artifact を `runs=5` と `warmup=1` で `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` で、チェックイン済み baseline fixture を `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- 更新するには `pnpm test:startup:bench:update`
- 現在の結果を fixture と比較するには `pnpm test:startup:bench:check`

## オンボーディング E2E（Docker）

Docker はオプションです。これは container 化された onboarding smoke test にのみ必要です。

クリーンな Linux container での完全な cold-start フロー:

```bash
scripts/e2e/onboard-docker.sh
```

この script は、擬似 tty 経由で対話型ウィザードを操作し、config/workspace/session file を検証した後、Gateway を起動して `openclaw health` を実行します。

## QR import smoke（Docker）

`qrcode-terminal` がサポート対象の Docker Node runtime（Node 24 デフォルト、Node 22 互換）で読み込まれることを保証します。

```bash
pnpm test:docker:qr
```
