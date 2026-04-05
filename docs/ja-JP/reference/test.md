---
read_when:
    - テストを実行または修正するとき
summary: ローカルでテスト（vitest）を実行する方法と、force/coverageモードを使うべきタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-05T12:56:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# テスト

- 完全なテストキット（スイート、ライブ、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存Gatewayプロセスを強制終了し、その後、分離されたGatewayポートで完全なVitestスイートを実行して、サーバーテストが実行中のインスタンスと衝突しないようにします。前回のGateway実行でポート18789が使用中のままになった場合に使用します。
- `pnpm test:coverage`: V8カバレッジ付きでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。グローバルしきい値は行数/分岐/関数/ステートメントで70%です。カバレッジからは、対象をユニットテスト可能なロジックに絞るため、統合負荷の高いエントリーポイント（CLI配線、gateway/telegramブリッジ、webchat静的サーバー）を除外します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: `--changed origin/main` を付けてネイティブVitestプロジェクト設定を実行します。ベース設定では、プロジェクト/設定ファイルを `forceRerunTriggers` として扱うため、必要な場合には配線変更でも広範囲に再実行されます。
- `pnpm test`: ネイティブVitestルートプロジェクト設定を直接実行します。ファイルフィルターは、設定された各プロジェクト全体でネイティブに動作します。
- ベースのVitest設定は、現在 `pool: "threads"` と `isolate: false` をデフォルトとし、共有の非分離ランナーがリポジトリ設定全体で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` は `vitest.extensions.config.ts` を実行します。
- `pnpm test:extensions`: extension/plugin スイートを実行します。
- `pnpm test:perf:imports`: ネイティブルートプロジェクト実行で、Vitestのインポート時間およびインポート内訳レポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じインポートプロファイリングを実行しますが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:profile:main`: VitestメインスレッドのCPUプロファイルを書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニットランナーのCPU + ヒーププロファイルを書き出します（`.artifacts/vitest-runner-profile`）。
- Gateway統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gatewayのエンドツーエンドスモークテスト（マルチインスタンスWS/HTTP/nodeペアリング）を実行します。デフォルトでは `vitest.e2e.config.ts` で `threads` + `isolate: false` と適応的ワーカーを使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: プロバイダーのライブテスト（minimax/zai）を実行します。APIキーが必要で、スキップ解除には `LIVE=1`（またはプロバイダー固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:openwebui`: Docker化されたOpenClaw + Open WebUIを起動し、Open WebUI経由でサインインし、`/api/models` を確認した後、`/api/chat/completions` を通して実際のプロキシチャットを実行します。使用可能なライブモデルキー（たとえば `~/.profile` 内のOpenAI）が必要で、外部のOpen WebUIイメージをpullし、通常のunit/e2eスイートのようにCIで安定することは想定していません。
- `pnpm test:docker:mcp-channels`: シード済みのGatewayコンテナと、`openclaw mcp serve` を起動する2つ目のクライアントコンテナを開始し、ルーティングされた会話の検出、トランスクリプト読み取り、添付メタデータ、ライブイベントキューの挙動、送信ルーティング、および実際のstdioブリッジ上でのClaudeスタイルのチャネル + 権限通知を検証します。Claude通知のアサーションは、生のstdio MCPフレームを直接読み取るため、このスモークはブリッジが実際に出力するものを反映します。

## ローカルPRゲート

ローカルのPR land/gateチェックでは、次を実行します。

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで不安定な場合は、回帰と見なす前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチマーク（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20回）:

- minimax 中央値 1279ms（最小 1114、最大 2431）
- opus 中央値 2454ms（最小 1224、最大 3170）

## CLI起動ベンチマーク

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使用方法:

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

出力には、各コマンドについて `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、および最大RSSサマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、実行ごとのV8プロファイルを書き出すため、タイミング計測とプロファイル取得に同じハーネスを使用します。

保存済み出力の規約:

- `pnpm test:startup:bench:smoke` は、対象のスモーク成果物を `.artifacts/cli-startup-bench-smoke.json` に書き出します
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使って完全スイート成果物を `.artifacts/cli-startup-bench-all.json` に書き出します
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使って、チェックイン済みベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較

## オンボーディング E2E（Docker）

Dockerは任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンなLinuxコンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似TTY経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、Gatewayを起動して `openclaw health` を実行します。

## QRインポートスモーク（Docker）

サポート対象のDocker Nodeランタイム（デフォルトのNode 24、互換のあるNode 22）で `qrcode-terminal` が読み込まれることを保証します。

```bash
pnpm test:docker:qr
```
