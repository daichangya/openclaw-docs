---
read_when:
    - テストの実行または修正
summary: ローカルでテスト（vitest）を実行する方法と、force モード / coverage モードを使うべきタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-26T11:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- 完全なテストキット（スイート、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの control ポートを保持している残留 Gateway プロセスを終了してから、分離された Gateway ポートで完全な Vitest スイートを実行し、サーバーテストが実行中インスタンスと衝突しないようにします。以前の Gateway 実行でポート 18789 が占有されたままになっている場合に使用してください。
- `pnpm test:coverage`: V8 カバレッジ付きで unit スイートを実行します（`vitest.unit.config.ts` 経由）。これは、リポジトリ全体の全ファイルカバレッジではなく、読み込まれたファイルに対する unit カバレッジゲートです。しきい値は、lines/functions/statements が 70%、branches が 55% です。`coverage.all` が false のため、このゲートは unit coverage スイートで読み込まれたファイルを測定し、分割レーン内のすべてのソースファイルを未カバーとして扱うことはしません。
- `pnpm test:coverage:changed`: `origin/main` 以降で変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: diff がルーティング可能なソース/テストファイルのみを変更している場合、変更された git パスをスコープ付き Vitest レーンに展開します。config/setup の変更は、必要に応じて配線変更を広く再実行するため、引き続きネイティブなルートプロジェクト実行へフォールバックします。
- `pnpm test:changed:focused`: 内側ループ向けの changed test 実行です。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、およびローカル import graph から正確なターゲットだけを実行します。広範な変更 / config / package の変更は、完全な changed-test フォールバックに展開する代わりにスキップされます。
- `pnpm changed:lanes`: `origin/main` に対する diff によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` に対する diff 用のスマート changed gate を実行します。core の作業は core test レーンで、extension の作業は extension test レーンで、テスト専用の作業は test typecheck/tests のみで実行し、公開 Plugin SDK または plugin-contract の変更は extension 検証 1 回に展開し、リリースメタデータのみの version bump は対象を絞った version/config/root-dependency チェックに留めます。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットを、スコープ付き Vitest レーン経由でルーティングします。ターゲット未指定の実行では固定 shard グループを使用し、ローカル並列実行のため leaf config に展開されます。extension グループは、1 つの巨大な root-project プロセスではなく、常に extension ごとの shard config に展開されます。
- full、extension、および include-pattern shard 実行は、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の whole-config 実行では、そのタイミングを使って遅い shard と速い shard のバランスを取ります。include-pattern の CI shards は shard 名をタイミングキーに追加するため、フィルターされた shard のタイミングは、whole-config のタイミングデータを置き換えずに可視のままになります。ローカルのタイミングアーティファクトを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 選択された `plugin-sdk` および `commands` のテストファイルは、`test/setup.ts` のみを維持する専用の軽量レーン経由でルーティングされ、runtime が重いケースは既存レーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマッピングされます。`test/helpers/channels` と `test/helpers/plugins` 配下の helper 編集は、依存パスが正確な場合、すべての shard を広く実行する代わりに、ローカル import graph を使ってそれらを import しているテストを実行します。
- `auto-reply` は、reply harness がより軽い top-level の status/token/helper テストを支配しないように、3 つの専用 config（`core`、`top-level`、`reply`）にも分割されました。
- ベースの Vitest config は現在、`pool: "threads"` と `isolate: false` をデフォルトとし、共有の非分離ランナーがリポジトリ内の各 config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/plugin shards を実行します。重い channel plugins、browser plugin、および OpenAI は専用 shards として実行され、その他の plugin グループは引き続きバッチ化されます。1 つのバンドル済み plugin レーンに対しては `pnpm test extensions/<id>` を使用してください。
- `pnpm test:perf:imports`: Vitest の import-duration と import-breakdown レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットには引き続きスコープ付きレーンルーティングを使用します。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングですが、`origin/main` 以降で変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 同じコミット済み git diff に対して、ルーティングされた changed-mode パスとネイティブな root-project 実行をベンチマーク比較します。
- `pnpm test:perf:changed:bench -- --worktree`: 先にコミットせず、現在の worktree の変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest の main thread 用 CPU profile を書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner 用の CPU + heap profiles を書き出します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: full-suite の各 Vitest leaf config を直列実行し、グループ化された duration データと per-config の JSON/log アーティファクトを書き出します。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にグループ化レポートを比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: Gateway の end-to-end smoke tests（複数インスタンスの WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` ではデフォルトで `threads` + `isolate: false` と adaptive workers を使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider の live tests（minimax/zai）を実行します。スキップ解除には API keys と `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test image と Docker E2E image を 1 回だけビルドし、その後 Docker smoke lanes を `OPENCLAW_SKIP_DOCKER_BUILD=1` で重み付きスケジューラ経由で実行します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider に敏感な tail pool を制御し、デフォルトは 10 です。重いレーン上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider 上限はデフォルトで provider ごとに重いレーン 1 本で、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` です。より大きいホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用してください。レーン開始は、ローカル Docker daemon の create ストームを避けるためデフォルトで 2 秒ずつずらされます。上書きには `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` を使用してください。ランナーはデフォルトで Docker を preflight し、古い OpenClaw E2E containers をクリーンアップし、30 秒ごとに active-lane status を出力し、互換レーン間で provider CLI tool caches を共有し、一時的な live-provider failure をデフォルトで 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行で longest-first 順序に使うため `.artifacts/docker-tests/lane-timings.json` にレーンタイミングを保存します。実行せずにレーン manifest を表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1`、status 出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使います。決定的 / ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`、live-provider レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。package aliases は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only モードでは、main と tail の live lanes を 1 つの longest-first pool に統合し、provider バケットで Claude、Codex、Gemini の作業をまとめて詰め込めるようにします。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` を設定しない限り、ランナーは最初の failure 後に新しい pooled lanes のスケジューリングを停止します。また、各レーンには 120 分のフォールバック timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail lanes では、より厳しい per-lane 上限が使われます。CLI backend の Docker setup コマンドには、独自の timeout として `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）があります。per-lane logs は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースの source E2E container をビルドし、生の CDP と分離された Gateway を起動して、`browser doctor --deep` を実行し、CDP の role snapshots に link URL、cursor で昇格した clickables、iframe refs、および frame metadata が含まれることを検証します。
- CLI backend の live Docker probes は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、フォーカスされたレーンとして実行できます。Claude と Gemini にも、対応する `:resume` および `:mcp` aliases があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認した後、`/api/chat/completions` 経由で実際のプロキシチャットを実行します。使用可能な live model key（たとえば `~/.profile` 内の OpenAI）が必要で、外部の Open WebUI image を pull し、通常の unit/e2e スイートのように CI 安定であることは想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway container と、`openclaw mcp serve` を起動する 2 つ目の client container を開始し、ルーティングされた会話検出、transcript 読み取り、添付ファイルメタデータ、live event queue の動作、送信ルーティング、および実際の stdio bridge 上での Claude 形式の channel + permission notifications を検証します。Claude notification のアサーションは生の stdio MCP frames を直接読み取るため、この smoke は bridge が実際に出力するものを反映します。

## ローカル PR ゲート

ローカルでの PR land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで flake した場合、回帰と見なす前に 1 回だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトの prompt: 「Reply with a single word: ok. No punctuation or extra text.」

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

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方のプリセット

出力には、各コマンドの `sampleCount`、avg、p50、p95、min/max、exit-code/signal distribution、および max RSS summaries が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとの V8 profiles を書き出すため、タイミング取得と profile 収集で同じ harness を使用します。

保存済み出力の規約:

- `pnpm test:startup:bench:smoke` は、対象の smoke アーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き出します
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、full-suite アーティファクトを `.artifacts/cli-startup-bench-all.json` に書き出します
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みの baseline fixture を `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果を fixture と比較します

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディング smoke テストにのみ必要です。

クリーンな Linux container での完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、pseudo-tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、Gateway を起動して `openclaw health` を実行します。

## QR import smoke（Docker）

メンテナンス対象の QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（デフォルトの Node 24、互換の Node 22）でロードされることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [Testing](/ja-JP/help/testing)
- [Testing live](/ja-JP/help/testing-live)
