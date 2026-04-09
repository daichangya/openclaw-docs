---
read_when:
    - ローカルまたは CI でテストを実行する場合
    - モデル/プロバイダのバグに対する回帰テストを追加する場合
    - Gateway + エージェントの挙動をデバッグする場合
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-09T01:30:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01117f41d8b171a4f1da11ed78486ee700e70ae70af54eb6060c57baf64ab21b
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の Docker ランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何をカバーしないか）
- 一般的なワークフロー（ローカル、push 前、デバッグ）でどのコマンドを実行するか
- live テストが資格情報をどのように検出し、モデル/プロバイダを選択するか
- 実際のモデル/プロバイダの問題に対する回帰テストをどう追加するか

## クイックスタート

普段は次のとおりです。

- 完全なゲート（push 前に想定されるもの）: `pnpm build && pnpm check && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は now で extension/channel パスもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Docker ベースの QA サイト: `pnpm qa:lab:up`

テストに手を入れたときや、より高い確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダ/モデルをデバッグするとき（実際の資格情報が必要）:

- live スイート（モデル + Gateway のツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルだけを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

ヒント: 必要なのが 1 件の失敗ケースだけなら、下で説明する allowlist 環境変数で live テストを絞ることを推奨します。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が増す順」（そして不安定さ/コストも増す順）と考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ済み Vitest project に対する、10 個の逐次シャード実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリと、`vitest.unit.config.ts` がカバーする許可済み `ui` node テスト
- スコープ:
  - 純粋な unit テスト
  - インプロセスの integration テスト（Gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的な回帰テスト
- 期待値:
  - CI で実行される
  - 実際のキーは不要
  - 高速で安定しているべき
- Projects に関する注記:
  - 対象を絞らない `pnpm test` は now で、1 つの巨大な native root-project process ではなく、11 個のより小さい shard config（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、高負荷マシンでのピーク RSS を抑え、auto-reply/extension の処理が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は still で native root `vitest.config.ts` project graph を使用します。multi-shard の watch ループは現実的ではないためです。
  - `pnpm test`、`pnpm test:watch`、および `pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象をまずスコープ済みレーン経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` は完全な root project 起動コストを負わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルだけに触れている場合、変更された git パスを同じスコープ済みレーンに展開します。config/setup の編集は still で広い root-project 再実行にフォールバックします。
  - 選択された `plugin-sdk` および `commands` テストも、`test/setup-openclaw-runtime.ts` をスキップする専用の軽量レーン経由でルーティングされます。状態依存/ランタイム負荷の高いファイルは既存のレーンに残ります。
  - 選択された `plugin-sdk` および `commands` のヘルパー source ファイルも、changed-mode 実行をそれらの軽量レーン内の明示的な sibling テストにマッピングするため、ヘルパー編集でそのディレクトリ向けの重い全スイートを再実行せずに済みます。
  - `auto-reply` には now で 3 つの専用バケットがあります: top-level の core helper、top-level の `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリーです。これにより、最も重い reply harness の処理を、軽量な status/chunk/token テストから切り離します。
- Embedded runner に関する注記:
  - メッセージツール検出入力や compaction のランタイムコンテキストを変更する場合は、
    両レベルのカバレッジを維持してください。
  - 純粋な routing/normalization 境界には、焦点を絞った helper 回帰テストを追加してください。
  - また、embedded runner integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ済み id と compaction の挙動が実際の
    `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、
    それらの integration パスの十分な代替にはなりません。
- Pool に関する注記:
  - ベースの Vitest config は now で `threads` をデフォルトにしています。
  - 共有 Vitest config では `isolate: false` も固定され、root projects、e2e、live config 全体で非分離 runner を使用します。
  - root UI レーンは `jsdom` の setup と optimizer を維持しますが、now で共有の非分離 runner 上で動作します。
  - 各 `pnpm test` shard は、共有 Vitest config から同じ `threads` + `isolate: false` のデフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` launcher は now で、Vitest の子 Node process に対してデフォルトで `--no-maglev` も追加し、大規模なローカル実行時の V8 コンパイルのチャーンを減らします。標準の V8 挙動と比較する必要がある場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速なローカル反復に関する注記:
  - `pnpm test:changed` は、変更パスがより小さなスイートにきれいにマップされる場合、スコープ済みレーン経由でルーティングされます。
  - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング挙動を維持しつつ、worker 上限だけを高くします。
  - ローカル worker の自動スケーリングは now で意図的に保守的であり、ホストの load average がすでに高い場合にも抑制されるため、複数の並行 Vitest 実行が通常より悪影響を与えにくくなっています。
  - ベースの Vitest config は project/config ファイルを `forceRerunTriggers` としてマークしているため、test wiring が変わったときも changed-mode の再実行が正しく保たれます。
  - config は、対応ホストでは `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接の profiling 用に明示的なキャッシュ場所を 1 つ指定したい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する注記:
  - `pnpm test:perf:imports` は、Vitest の import-duration レポートと import-breakdown 出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じ profiling ビューを `origin/main` 以降に変更されたファイルにスコープします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分について、ルーティングされた `test:changed` と native root-project パスを比較し、wall time と macOS 最大 RSS を出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、現在の dirty tree を `scripts/test-projects.mjs` と root Vitest config に変更ファイル一覧をルーティングしてベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対する main-thread CPU profile を書き出します。
  - `pnpm test:perf:profile:runner` は、unit スイートについて、ファイル並列化を無効にした runner CPU+heap profile を書き出します。

### E2E（Gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- ランタイムデフォルト:
  - リポジトリの他と合わせて、Vitest `threads` と `isolate: false` を使用します。
  - 適応的な worker を使用します（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行されます。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`
- スコープ:
  - 複数インスタンス Gateway のエンドツーエンド挙動
  - WebSocket/HTTP surface、ノードのペアリング、およびより重いネットワーキング
- 期待値:
  - CI で実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンド smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に隔離された OpenShell Gateway を起動
  - 一時的なローカル Dockerfile から sandbox を作成
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell バックエンドを実行
  - sandbox fs bridge を通じて remote-canonical filesystem の挙動を検証
- 期待値:
  - オプトインのみで、デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 隔離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway と sandbox を破棄する
- 便利な上書き:
  - より広い e2e スイートを手動で実行するときにこのテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたは wrapper script を指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダ + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダ/モデルは、今日、実際の資格情報で本当に動くか？」
  - プロバイダのフォーマット変更、ツール呼び出しの癖、auth 問題、rate limit の挙動を検出
- 期待値:
  - 設計上 CI で安定しない（実ネットワーク、実プロバイダポリシー、クォータ、障害）
  - コストがかかる / rate limit を消費する
  - 「全部」ではなく、絞り込んだサブセットを実行することを推奨
- live 実行では、不足している API キーを取得するために `~/.profile` を読み込みます。
- デフォルトでは、live 実行は still で `HOME` を隔離し、config/auth 資料を一時的なテスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストに実際の home directory を意図的に使わせたい場合のみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は now でより静かなモードをデフォルトにしています: `[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、Gateway bootstrap log/Bonjour chatter をミュートします。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーローテーション（プロバイダ別）: `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` を設定します（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。または live 専用上書きとして `OPENCLAW_LIVE_*_KEY` を使います。テストは rate limit 応答時に再試行します。
- 進捗/heartbeat 出力:
  - live スイートは now で進捗行を stderr に出力するため、長時間のプロバイダ呼び出しでも、Vitest のコンソールキャプチャが静かなときに動作中であることが視認できます。
  - `vitest.live.config.ts` は Vitest のコンソール介入を無効化しているため、プロバイダ/Gateway の進捗行は live 実行中に即座にストリーミングされます。
  - 直接モデルの heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/probe の heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか？

次の判断表を使ってください。

- ロジック/テストを編集している: `pnpm test` を実行（大きく変更した場合は `pnpm test:coverage` も）
- Gateway networking / WS protocol / pairing に触れた: `pnpm test:e2e` を追加
- 「ボットが落ちている」/ プロバイダ固有の失敗 / ツール呼び出しをデバッグしている: 絞り込んだ `pnpm test:live` を実行

## Live: Android ノード capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android ノードが現在 advertise している **すべてのコマンド** を呼び出し、コマンド契約の挙動を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（スイートはアプリのインストール/起動/ペアリングは行わない）
  - 選択した Android ノードに対する、コマンドごとの Gateway `node.invoke` 検証
- 必須の事前セットアップ:
  - Android アプリがすでに Gateway に接続・ペアリングされていること
  - アプリがフォアグラウンドに維持されていること
  - 成功を期待する capability に必要な permission/capture consent が許可されていること
- 任意の対象上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: model smoke（profile keys）

live テストは、失敗を切り分けられるよう 2 層に分割されています。

- 「直接モデル」は、与えられたキーでそのプロバイダ/モデルがそもそも応答できるかを示します。
- 「Gateway smoke」は、そのモデルに対して完全な Gateway+エージェントパイプラインが動作するか（セッション、履歴、ツール、sandbox policy など）を示します。

### レイヤー 1: 直接モデル completion（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、資格情報を持つモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞った回帰も）
- 有効化方法:
  - `pnpm test:live`（または、Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または modern の別名である `all`）を設定します。そうしないと、`pnpm test:live` を Gateway smoke に集中させるためスキップされます。
- モデルの選び方:
  - modern allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all sweep はデフォルトで厳選された高シグナルの上限を使用します。網羅的な modern sweep にするには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限にするには正の数を設定します。
- プロバイダの選び方:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と env fallback
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダ API が壊れている / キーが無効」と「Gateway のエージェントパイプラインが壊れている」を分離する
  - 小さく独立した回帰を収容する（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent smoke（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセスの Gateway を立ち上げる
  - `agent:dev:*` セッションを作成/patch する（実行ごとにモデルを上書き）
  - キーを持つモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read probe）
    - 任意の追加ツールプローブ（exec+read probe）
    - OpenAI の回帰パス（tool-call-only → follow-up）が動作し続ける
- プローブ詳細（失敗をすばやく説明できるように）:
  - `read` probe: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返答させます。
  - `exec+read` probe: テストはエージェントに `exec` で一時ファイルへ nonce を書かせ、その後 `read` で読み返させます。
  - image probe: テストは生成した PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`
- 有効化方法:
  - `pnpm test:live`（または、Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選び方:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞り込む
  - modern/all の Gateway sweep はデフォルトで厳選された高シグナルの上限を使用します。網羅的な modern sweep にするには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限にするには正の数を設定します。
- プロバイダの選び方（「OpenRouter の全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- ツール + 画像プローブは、この live テストでは常に有効です:
  - `read` probe + `exec+read` probe（ツールストレス）
  - image input support を広告しているモデルでは image probe を実行
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - `agent` に `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信します
    - Gateway は attachment を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent は multimodal user message をモデルに転送します
    - アサーション: 返信に `cat` + コードが含まれること（OCR 許容: 軽微な誤りは許容）

ヒント: 自分のマシンで何がテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンド smoke（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config に触れずに、ローカル CLI バックエンドを使用して Gateway + エージェントパイプラインを検証すること。
- バックエンド固有の smoke デフォルトは、所有 extension の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または、Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトの provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有 CLI バックエンド plugin metadata から取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG` が設定されているときに画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）
  - 2 回目のターンを送って resume flow を検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続性プローブを無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが切り替え先をサポートする場合に強制有効化するには `1`）

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダの Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは live CLI-backend smoke を、リポジトリの Docker image 内で非 root の `node` ユーザーとして実行します。
- 所有 extension から CLI smoke metadata を解決し、対応する Linux CLI package（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、キャッシュ可能で書き込み可能な prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にインストールします。
- live CLI-backend smoke は now で、Claude、Codex、Gemini に対して同じ end-to-end flow を実行します: text turn、image classification turn、その後 Gateway CLI を通じて検証される MCP `cron` ツール呼び出し。
- Claude のデフォルト smoke はさらにセッションを Sonnet から Opus に patch し、resume されたセッションが以前のメモを still 覚えていることを検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agent で実際の ACP conversation-bind flow を検証すること:
  - `/acp spawn <agent> --bind here` を送る
  - 合成 message-channel conversation をその場で bind する
  - 同じ conversation 上で通常の follow-up を送る
  - follow-up が bind 済み ACP セッション transcript に届くことを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成チャネル: Slack DM 風の conversation context
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注記:
  - このレーンは、管理者専用の合成 originating-route フィールド付きの Gateway `chat.send` surface を使用するため、外部配信を装わずにテストが message-channel context を付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、このテストは選択された ACP harness agent に対して、埋め込み `acpx` plugin の組み込み agent registry を使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一エージェントの Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべての live CLI agent に対して ACP bind smoke を順番に実行します: `claude`、`codex`、`gemini`。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使用します。
- これは `~/.profile` を読み込み、一致する CLI auth 資料をコンテナにステージし、書き込み可能な npm prefix に `acpx` をインストールし、その後、必要なら要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker 内では、runner は `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は読み込んだ profile 由来の provider env var を子 harness CLI で利用できます。

### 推奨される live レシピ

絞り込まれた明示的な allowlist が最も高速で不安定さも少なくなります。

- 単一モデル、直接実行（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` は Gemini API（API キー）を使用します。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 風の agent endpoint）を使用します。
- `google-gemini-cli/...` は、マシン上のローカル Gemini CLI を使用します（別個の auth + tooling の癖があります）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は Google のホスト型 Gemini API を HTTP 経由で呼び出します（API キー / profile auth）。ほとんどのユーザーが「Gemini」と言うときはこちらを指します。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行します。独自の auth を持ち、挙動も異なる場合があります（streaming/tool support/version skew）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（live はオプトインです）が、開発マシン上でキーを使って定期的にカバーすることが推奨されるモデルは次のとおりです。

### Modern smoke set（ツール呼び出し + 画像）

これは、動作し続けることを期待する「一般的なモデル」の実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` および `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` および `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + 画像で Gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

少なくとも provider family ごとに 1 つ選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると良いもの）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化されている「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API mode に依存）

### Vision: 画像送信（attachment → multimodal message）

画像プローブを実行するために、少なくとも 1 つの画像対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の vision 対応 variant など）。

### Aggregators / 代替 Gateway

キーが有効なら、次経由のテストもサポートします。

- OpenRouter: `openrouter/...`（何百ものモデル。`openclaw models scan` を使って tools+image 対応候補を見つけてください）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（auth は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrix に含められる他のプロバイダ（資格情報/config がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタム endpoint）: `minimax`（cloud/API）、および OpenAI/Anthropic 互換の proxy（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「すべてのモデル」を固定で書こうとしないでください。権威ある一覧は、あなたのマシンで `discoverModels(...)` が返すものと、利用可能なキーの組み合わせです。

## 資格情報（コミットしないこと）

live テストは CLI と同じ方法で資格情報を検出します。実際上の意味は次のとおりです。

- CLI が動くなら、live テストも同じキーを見つけられるはずです。
- live テストが「資格情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live テストで「profile keys」と言うときはこれを指します）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー state dir: `~/.openclaw/credentials/`（存在する場合はステージされた live home にコピーされますが、メインの profile-key store ではありません）
- ローカルの live 実行は、デフォルトで active config、各エージェントの `auth-profiles.json`、legacy `credentials/`、およびサポートされる外部 CLI auth directory を一時的な test home にコピーします。ステージされた live home では `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` のパス上書きは削除されるため、プローブが実際のホスト workspace に触れません。

env キーに依存したい場合（たとえば `~/.profile` に export されているもの）は、ローカルテスト前に `source ~/.profile` を実行するか、下の Docker ランナーを使ってください（これらは `~/.profile` をコンテナに mount できます）。

## Deepgram live（音声文字起こし）

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `src/agents/byteplus.live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドルされた comfy の image、video、`music_generate` パスを実行する
  - `models.providers.comfy.<capability>` が設定されていない限り、各 capability をスキップする
  - comfy workflow の送信、polling、download、または plugin registration を変更した後に有用

## Image generation live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての image-generation provider plugin を列挙する
  - プローブ前に login shell（`~/.profile`）から不足している provider env var を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` にある古いテストキーが実際の shell 資格情報を隠しません
  - 使用可能な auth/profile/model がないプロバイダはスキップする
  - 共有 runtime capability を通じて標準の image-generation variant を実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされているバンドルプロバイダ:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の auth 挙動:
  - profile-store auth を強制し、env-only の上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドルされた music-generation provider パスを実行する
  - 現在は Google と MiniMax をカバーする
  - プローブ前に login shell（`~/.profile`）から provider env var を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` にある古いテストキーが実際の shell 資格情報を隠しません
  - 使用可能な auth/profile/model がないプロバイダはスキップする
  - 利用可能な場合は、宣言された両方の runtime mode を実行する:
    - prompt のみ入力による `generate`
    - provider が `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: この共有 sweep ではなく、別の Comfy live ファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の auth 挙動:
  - profile-store auth を強制し、env-only の上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドルされた video-generation provider パスを実行する
  - プローブ前に login shell（`~/.profile`）から provider env var を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` にある古いテストキーが実際の shell 資格情報を隠しません
  - 使用可能な auth/profile/model がないプロバイダはスキップする
  - 利用可能な場合は、宣言された両方の runtime mode を実行する:
    - prompt のみ入力による `generate`
    - provider が `capabilities.imageToVideo.enabled` を宣言しており、選択された provider/model が共有 sweep でバッファベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - provider が `capabilities.videoToVideo.enabled` を宣言しており、選択された provider/model が共有 sweep でバッファベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有 sweep で現在宣言されているがスキップされる `imageToVideo` プロバイダ:
    - バンドルされた `veo3` が text-only で、バンドルされた `kling` がリモート画像 URL を要求するため `vydra`
  - プロバイダ固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有 sweep で現在宣言されているがスキップされる `videoToVideo` プロバイダ:
    - これらのパスが現在リモート `http(s)` / MP4 参照 URL を必要とするため `alibaba`、`qwen`、`xai`
    - 現在の共有 Gemini/Veo レーンがローカルのバッファベース入力を使っており、そのパスが共有 sweep では受理されないため `google`
    - 現在の共有レーンでは org 固有の動画 inpaint/remix アクセス保証がないため `openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 任意の auth 挙動:
  - profile-store auth を強制し、env-only の上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live harness

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の image、music、video の live スイートを、リポジトリ標準の 1 つの entrypoint から実行する
  - `~/.profile` から不足している provider env var を自動読み込みする
  - デフォルトで、現在使用可能な auth を持つ provider に各スイートを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、heartbeat と quiet-mode の挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux で動く」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれます。

- live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応する profile-key live ファイルのみをリポジトリの Docker image 内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル config dir と workspace を mount し（mount されていれば `~/.profile` も読み込みます）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker sweep を実用的に保つために、デフォルトでより小さな smoke 上限を使用します:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使用します。より大きい網羅的スキャンを
  明示的に望む場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker image を一度ビルドし、その後 2 つの live Docker レーンで再利用します。
- コンテナ smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、および `test:docker:plugins` は、1 つ以上の実コンテナを起動し、より高レベルな integration path を検証します。

live-model Docker ランナーは、必要な CLI auth home のみ（あるいは実行が絞り込まれていない場合はサポートされるすべて）を bind-mount し、実行前にそれらをコンテナ home にコピーするため、外部 CLI OAuth はホスト auth store を変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI バックエンド smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディング ウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed 済み Gateway + stdio bridge + 生の Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install smoke + `/plugin` alias + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live-model Docker ランナーはさらに、現在の checkout を読み取り専用で bind-mount し、
コンテナ内の一時 workdir にステージします。これにより、ランタイム image を
軽量に保ちながら、正確にあなたのローカル source/config に対して Vitest を実行できます。
ステージング手順では、大きなローカル専用キャッシュやアプリの build 出力
（`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build`、
Gradle 出力ディレクトリなど）をスキップするため、Docker live 実行で
マシン固有の artifact のコピーに何分も費やすことがありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway live probe は
コンテナ内で実際の Telegram/Discord などの channel worker を起動しません。
`test:docker:live-models` は still で `pnpm test:live` を実行するため、
その Docker レーンで Gateway live カバレッジを絞るまたは除外したい場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性 smoke です。これは
OpenAI 互換 HTTP endpoint を有効にした OpenClaw Gateway コンテナを起動し、
その Gateway に対して固定バージョンの Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証し、
その後 Open WebUI の `/api/chat/completions` proxy 経由で実際の
chat request を送信します。
初回実行は目に見えて遅くなる場合があります。Docker が
Open WebUI image を pull する必要があったり、Open WebUI 自身の cold-start setup を
完了する必要があるためです。
このレーンは、使用可能な live model key を期待しており、Docker 化された実行で
それを提供する主要な方法は `OPENCLAW_PROFILE_FILE`
（デフォルトは `~/.profile`）です。
成功時には `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントを必要としません。これは seed 済み Gateway
コンテナを起動し、続いて `openclaw mcp serve` を起動する 2 つ目のコンテナを開始し、
その後 routed conversation discovery、transcript read、attachment metadata、
live event queue behavior、outbound send routing、および Claude 風の channel +
permission notification を実際の stdio MCP bridge 上で検証します。notification チェックでは
生の stdio MCP frame を直接検査するため、この smoke は特定の client SDK が
偶然 surface したものではなく、bridge が実際に何を発行しているかを検証します。

手動の ACP 平易言語 thread smoke（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に維持してください。ACP thread routing の検証に再び必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` に mount
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` に mount
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` に mount し、テスト実行前に source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を Docker 内のキャッシュされた CLI install 用に `/home/node/.npm-global` に mount
- `$HOME` 配下の外部 CLI auth dir/file は `/host-auth...` 配下に読み取り専用で mount され、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルト dir: `.minimax`
  - デフォルト file: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込んだ provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推測された必要な dir/file のみを mount
  - 手動上書きは `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで可能
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 資格情報を profile store 由来に限定するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke で Gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke が使う nonce-check prompt を上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定の Open WebUI image tag を上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメント健全性チェック

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
インページ見出しチェックも必要な場合は、完全な Mintlify anchor 検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI 安全）

これらは、実際のプロバイダなしでの「実際のパイプライン」回帰です。

- Gateway ツール呼び出し（mock OpenAI、実際の Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config + auth enforced の書き込み）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 eval（Skills）

すでにいくつかの CI 安全なテストがあり、「エージェント信頼性 eval」のように振る舞います。

- 実際の Gateway + エージェントループを通る mock のツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション wiring と config の影響を検証する end-to-end のウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** Skills がプロンプトに列挙されているとき、エージェントは正しい skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、sandbox 境界を検証するマルチターンシナリオ。

今後の eval は、まず決定的であるべきです。

- mock provider を使って、ツール呼び出し + 順序、skill ファイルの読み取り、セッション wiring を検証するシナリオランナー。
- skill に焦点を当てた小規模なシナリオスイート（使う/使わない、ゲーティング、prompt injection）。
- CI 安全なスイートが整ってからの、任意の live eval（opt-in、env-gated）。

## 契約テスト（plugin と channel の形状）

契約テストは、登録されたすべての plugin と channel がその
インターフェース契約に準拠していることを検証します。これらは検出されたすべての plugin を反復し、
形状と挙動に関する一連のアサーションを実行します。デフォルトの `pnpm test` unit レーンは意図的に
これらの共有 seam および smoke ファイルをスキップするため、共有 channel または provider surface に触れた場合は
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- channel 契約のみ: `pnpm test:contracts:channels`
- provider 契約のみ: `pnpm test:contracts:plugins`

### Channel 契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります。

- **plugin** - 基本的な plugin 形状（id、name、capabilities）
- **setup** - セットアップ ウィザード契約
- **session-binding** - セッション binding の挙動
- **outbound-payload** - メッセージ payload 構造
- **inbound** - 受信メッセージ処理
- **actions** - channel action handler
- **threading** - thread ID の扱い
- **directory** - directory/roster API
- **group-policy** - group policy の強制

### Provider status 契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel status probe
- **registry** - plugin registry の形状

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - auth フロー契約
- **auth-choice** - auth の選択/選定
- **catalog** - model catalog API
- **discovery** - plugin の検出
- **loader** - plugin の読み込み
- **runtime** - provider ランタイム
- **shape** - plugin の形状/インターフェース
- **wizard** - セットアップ ウィザード

### 実行するタイミング

- plugin-sdk の export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin registration または discovery をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰テストの追加（ガイダンス）

live で発見した provider/model の問題を修正したとき:

- 可能なら CI 安全な回帰を追加してください（mock/stub provider、または正確な request-shape transformation をキャプチャ）
- 本質的に live 専用の場合（rate limit、auth policy）は、live テストを狭く保ち、env var で opt-in にしてください
- バグを検出できる最小レイヤーを狙うことを推奨します:
  - provider request conversion/replay バグ → 直接モデルテスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway live smoke または CI 安全な Gateway mock テスト
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに 1 つのサンプル対象を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは未分類の target id に対して意図的に失敗するため、新しい class が黙ってスキップされることはありません。
