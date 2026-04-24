---
read_when:
    - テストの実行または修正
summary: Vitest を使ってローカルでテストを実行する方法と、force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-24T09:02:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- 完全なテストキット（スイート、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの control port を保持している残留 gateway プロセスを終了し、その後、分離された gateway port で完全な Vitest スイートを実行します。これにより、server テストが実行中インスタンスと衝突しません。以前の gateway 実行で port 18789 が使用中のままになった場合に使ってください。
- `pnpm test:coverage`: V8 coverage を使って unit スイートを実行します（`vitest.unit.config.ts` 経由）。これはリポジトリ全体の全ファイルカバレッジではなく、読み込まれたファイルに対する unit カバレッジゲートです。しきい値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` は false のため、このゲートは、分割レーンのすべての source ファイルを未カバーとして扱うのではなく、unit coverage スイートで読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: 差分がルーティング可能な source/test ファイルだけに触れている場合、変更された git パスを scoped Vitest lane に展開します。config/setup の変更は、必要に応じて配線変更を広く再実行できるよう、引き続きネイティブルートプロジェクト実行にフォールバックします。
- `pnpm changed:lanes`: `origin/main` に対する差分によって発火するアーキテクチャ lane を表示します。
- `pnpm check:changed`: `origin/main` に対する差分に対して、スマートな changed ゲートを実行します。core の作業には core のテストレーン、extension の作業には extension のテストレーン、テストのみの作業には test の typecheck/tests のみを実行し、公開 Plugin SDK または plugin-contract の変更は 1 回の extension 検証パスに拡張され、リリースメタデータだけのバージョンバンプは対象を絞った version/config/root-dependency チェックにとどめます。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットを scoped Vitest lane 経由でルーティングします。ターゲットを絞らない実行では固定 shard グループを使い、ローカル並列実行のために leaf config へ展開します。extension グループは、巨大なルートプロジェクトプロセス 1 つではなく、常に extension ごとの shard config に展開されます。
- 完全実行と extension shard 実行では、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の実行では、そのタイミングを使って遅い shard と速い shard のバランスを取ります。ローカルのタイミング artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` および `commands` テストファイルは、`test/setup.ts` だけを保持する専用の軽量 lane を通るようになっており、ランタイムが重いケースは既存 lane のままです。
- 一部の `plugin-sdk` および `commands` helper source ファイルも、`pnpm test:changed` をそれらの軽量 lane の明示的な兄弟テストにマッピングするため、小さな helper 編集で重いランタイム依存スイートを再実行せずに済みます。
- `auto-reply` も 3 つの専用 config（`core`、`top-level`、`reply`）に分割されており、reply harness が軽量な top-level の status/token/helper テストを圧迫しないようになっています。
- ベースの Vitest config は、現在 `pool: "threads"` と `isolate: false` をデフォルトとし、共有の非分離 runner がリポジトリ全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` および `pnpm test extensions` は、すべての extension/plugin shard を実行します。重い channel plugin、browser plugin、OpenAI は専用 shard として実行され、それ以外の plugin グループはまとめて処理されます。1 つの bundled plugin lane を対象にするには `pnpm test extensions/<id>` を使ってください。
- `pnpm test:perf:imports`: Vitest の import-duration + import-breakdown レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットには scoped lane ルーティングを引き続き使用します。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングですが、`origin/main` 以降で変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: ルーティングされた changed-mode パスを、同じコミット済み git 差分に対するネイティブルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree`: 現在の worktree の変更セットを、先にコミットせずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap プロファイルを書き出します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest leaf config を直列実行し、グループ化された所要時間データと config ごとの JSON/log artifact を書き出します。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使います。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にグループ化レポートを比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: gateway の end-to-end スモークテスト（複数インスタンスの WS/HTTP/ノードペアリング）を実行します。`vitest.e2e.config.ts` では、デフォルトで `threads` + `isolate: false` と適応型ワーカーを使います。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログが必要なら `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider の live テスト（minimax/zai）を実行します。API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）を設定しないとスキップ解除されません。
- `pnpm test:docker:all`: 共有 live-test イメージと Docker E2E イメージをそれぞれ 1 回だけビルドし、その後、デフォルトでは同時実行数 8 で `OPENCLAW_SKIP_DOCKER_BUILD=1` を付けて Docker スモークレーンを実行します。メインプールは `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>`、provider に敏感な末尾プールは `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` で調整できます。どちらもデフォルトは 8 です。ローカルの Docker daemon に create ストームが起きるのを避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。上書きするには `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` を使ってください。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、runner は最初の失敗後に新しいプール済みレーンのスケジュールを停止します。各レーンには 120 分のタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。レーンごとのログは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認し、その後 `/api/chat/completions` を通じて実際のプロキシチャットを実行します。使用可能な live モデルキー（たとえば `~/.profile` の OpenAI）が必要で、外部の Open WebUI イメージを pull し、通常の unit/e2e スイートのような CI 安定性は想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、その後、ルーティングされた会話 discovery、transcript 読み取り、添付メタデータ、live event queue の挙動、outbound send routing、そして Claude 形式の channel + permission notification を実際の stdio bridge 上で検証します。Claude の notification 検証は、生の stdio MCP frame を直接読み取るため、このスモークは bridge が実際に出力する内容を反映します。

## ローカル PR ゲート

ローカルでの PR land/gate チェックには、次を実行してください。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が高負荷ホストで flaky な場合は、リグレッションと見なす前に 1 回だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは次を使ってください。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

前回の実行（2025-12-31、20 回）:

- minimax 中央値 1279ms（最小 1114、最大 2431）
- opus 中央値 2454ms（最小 1224、最大 3170）

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

出力には、各コマンドの `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、および max RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、実行ごとに V8 プロファイルを書き出すため、タイミング計測とプロファイル取得が同じ harness を使います。

保存出力の慣例:

- `pnpm test:startup:bench:smoke` は対象を絞ったスモーク artifact を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は full-suite artifact を `runs=5` と `warmup=1` で `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使って、チェックイン済みベースライン fixture を `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- 現在の結果を fixture と比較するには `pnpm test:startup:bench:check`

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナ内での完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似 TTY 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク（Docker）

保守されている QR ランタイム helper が、サポートされる Docker Node ランタイム（Node 24 がデフォルト、Node 22 互換）で読み込まれることを保証します:

```bash
pnpm test:docker:qr
```

## 関連

- [Testing](/ja-JP/help/testing)
- [Testing live](/ja-JP/help/testing-live)
