---
read_when:
    - テストを実行または修正する
summary: ローカルでテストを実行する方法（Vitest）と、force/coverage モードを使うべき場面
title: テスト
x-i18n:
    generated_at: "2026-04-25T13:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- 完全なテストキット（スイート、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルト control port を保持している残存 gateway プロセスを kill し、その後、実行中インスタンスと server テストが衝突しないよう、分離された gateway port で完全な Vitest スイートを実行します。以前の gateway 実行で port 18789 が占有されたままのときに使ってください。
- `pnpm test:coverage`: V8 coverage 付きで unit スイートを実行します（`vitest.unit.config.ts` 経由）。これは whole-repo の all-file coverage ではなく、読み込まれたファイルに対する unit coverage gate です。しきい値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` が false のため、この gate は split-lane source ファイル全体を未カバーと見なすのではなく、unit coverage スイートで読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` から変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: diff がルーティング可能な source/test ファイルのみに触れている場合、変更された git path を scoped Vitest lane に展開します。config/setup 変更は引き続きネイティブ root projects 実行にフォールバックするため、必要なときは配線変更で広く再実行されます。
- `pnpm changed:lanes`: `origin/main` との差分によって発火するアーキテクチャ lane を表示します。
- `pnpm check:changed`: `origin/main` との差分に対して smart changed gate を実行します。core 作業は core test lane とともに、extension 作業は extension test lane とともに、test-only 作業は test typecheck/tests のみに限定して実行します。公開 Plugin SDK や plugin-contract 変更は 1 回の extension 検証へ拡張され、リリースメタデータだけのバージョン更新は対象を絞った version/config/root-dependency チェックのまま維持されます。
- `pnpm test`: 明示的な file/directory ターゲットを scoped Vitest lane 経由でルーティングします。ターゲット指定なしの実行では固定 shard group を使い、ローカル並列実行のために leaf config へ展開されます。extension group は、巨大な root-project プロセス 1 つではなく、常に extension ごとの shard config に展開されます。
- 完全スイートと extension shard 実行は、ローカル timing データを `.artifacts/vitest-shard-timings.json` に更新します。後続の実行では、その timing を使って遅い shard と速い shard のバランスを取ります。ローカル timing artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` と `commands` テストファイルは、`test/setup.ts` だけを維持する専用の軽量 lane にルーティングされ、ランタイムが重いケースは既存 lane のまま維持されます。
- 一部の `plugin-sdk` と `commands` ヘルパー source ファイルも、`pnpm test:changed` をそれらの軽量 lane 内の明示的な sibling test にマップするため、小さなヘルパー編集で重いランタイム依存スイート全体を再実行せずに済みます。
- `auto-reply` も 3 つの専用 config（`core`、`top-level`、`reply`）に分割され、reply harness が軽量な top-level status/token/helper テストを支配しないようになりました。
- ベース Vitest config は現在 `pool: "threads"` と `isolate: false` をデフォルトとし、共有の非分離 runner が repo 全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/Plugin shard を実行します。重い channel Plugin、browser Plugin、OpenAI は専用 shard として実行され、その他の Plugin group はバッチのままです。1 つのバンドル済み Plugin lane には `pnpm test extensions/<id>` を使ってください。
- `pnpm test:perf:imports`: Vitest の import-duration + import-breakdown レポートを有効にしつつ、明示的な file/directory ターゲットには引き続き scoped lane ルーティングを使います。
- `pnpm test:perf:imports:changed`: 同じ import profiling を、`origin/main` から変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff に対して、ルーティングされた changed-mode path とネイティブ root-project 実行をベンチマーク比較します。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせず現在の worktree 変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest main thread の CPU profile を書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap profile を書き出します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest leaf config を直列実行し、grouped duration データと config ごとの JSON/log artifact を書き出します。Test Performance Agent は、遅いテストの修正を試みる前の baseline としてこれを使います。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に grouped report を比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: gateway の end-to-end スモークテスト（multi-instance WS/HTTP/node pairing）を実行します。デフォルトでは `vitest.e2e.config.ts` 内で `threads` + `isolate: false` と adaptive worker を使います。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider live テスト（minimax/zai）を実行します。API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要で、これにより unskip されます。
- `pnpm test:docker:all`: 共有 live-test image と Docker E2E image を一度だけビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` を付けて Docker スモーク lane を weighted scheduler 経由で実行します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` は process slot を制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider-sensitive tail pool を制御し、デフォルトは 10 です。重い lane の上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider 上限はデフォルトで provider ごとに 1 重い lane で、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` です。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使ってください。lane の開始は、ローカル Docker daemon の create ストームを避けるため、デフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。runner はデフォルトで Docker を事前確認し、古い OpenClaw E2E コンテナを掃除し、30 秒ごとに active-lane status を出力し、互換 lane 間で provider CLI tool cache を共有し、一時的な live-provider 失敗をデフォルトで 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行で longest-first 順に並べるために lane timing を `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せず lane manifest だけ表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1`、status 出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`、timing 再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使ってください。決定的/ローカル lane のみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`、live-provider lane のみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使います。package alias は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only モードでは main と tail の live lane を 1 つの longest-first pool に統合するため、provider bucket が Claude、Codex、Gemini の作業を一緒に詰め込めます。runner は、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後は新しい pooled lane のスケジュールを停止します。各 lane には 120 分の fallback timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail lane には、より厳しい lane 単位の上限が使われます。CLI backend Docker setup command には独自の timeout があり、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）で制御されます。lane ごとのログは `.artifacts/docker-tests/<run-id>/` に書き出されます。
- CLI backend live Docker probe は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように focused lane として実行できます。Claude と Gemini にも対応する `:resume` と `:mcp` alias があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認し、その後 `/api/chat/completions` を通る実際の proxied chat を実行します。使用可能な live model key（たとえば `~/.profile` 内の OpenAI）が必要で、外部 Open WebUI image を pull し、通常の unit/e2e スイートのように CI 安定であることは想定されていません。
- `pnpm test:docker:mcp-channels`: seed 済み Gateway コンテナと、`openclaw mcp serve` を起動する第 2 クライアントコンテナを開始し、ルーティングされた会話発見、transcript 読み取り、添付ファイルメタデータ、live event queue の動作、outbound send routing、Claude 風の channel + permission 通知を、実際の stdio bridge 上で検証します。Claude 通知アサーションは生の stdio MCP frame を直接読み取るため、このスモークは bridge が実際に出力するものを反映します。

## ローカル PR gate

ローカルで PR の land/gate チェックを行うには、次を実行してください。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで flaky な場合、回帰とみなす前に 1 回だけ再実行し、それから `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使ってください。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## model レイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- デフォルト prompt: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20 runs）:

- minimax median 1279ms（min 1114、max 2431）
- opus median 2454ms（min 1224、max 3170）

## CLI 起動ベンチ

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

プリセット:

- `startup`: `--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`: `health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`: 両方のプリセット

出力には、各コマンドについて `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、および max RSS 要約が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は run ごとに V8 profile を書き出すため、タイミング計測と profile 取得に同じハーネスを使えます。

保存済み出力の慣例:

- `pnpm test:startup:bench:smoke` は対象を絞ったスモーク artifact を `.artifacts/cli-startup-bench-smoke.json` に書き出します
- `pnpm test:startup:bench:save` は full-suite artifact を `runs=5`、`warmup=1` で `.artifacts/cli-startup-bench-all.json` に書き出します
- `pnpm test:startup:bench:update` は、チェックイン済み baseline fixture を `runs=5`、`warmup=1` で `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- 更新は `pnpm test:startup:bench:update`
- 現在結果と fixture を比較するには `pnpm test:startup:bench:check`

## Onboarding E2E（Docker）

Docker は任意です。これはコンテナ化された onboarding スモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは擬似 TTY を通じて対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、gateway を起動して `openclaw health` を実行します。

## QR import スモーク（Docker）

メンテナンス対象の QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（デフォルトの Node 24、互換の Node 22）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [Testing](/ja-JP/help/testing)
- [Testing live](/ja-JP/help/testing-live)
