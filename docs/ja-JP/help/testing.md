---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル / プロバイダーバグのリグレッションを追加する
    - Gateway + エージェントの動作をデバッグする
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストのカバー範囲'
title: テスト
x-i18n:
    generated_at: "2026-04-05T12:48:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の Docker ランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何を _カバーしない_ か）
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド
- live テストがどのように資格情報を検出し、モデル / プロバイダーを選択するか
- 実際のモデル / プロバイダー問題に対するリグレッションの追加方法

## クイックスタート

普段は次のとおりです。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ（モダンな projects config）: `pnpm test:watch`
- 直接のファイル指定は、extension / channel パスにも対応しています: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

テストに触れたときや、より高い確信が必要なとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー / モデルをデバッグするとき（実際の資格情報が必要）:

- live スイート（モデル + gateway の tool / image プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象化する: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

ヒント: 失敗している 1 ケースだけが必要な場合は、後述する allowlist 環境変数で live テストを絞り込むことを優先してください。

## テストスイート（何がどこで動くか）

スイートは「現実性が増す順」（そして不安定さ / コストも増す順）と考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: `vitest.config.ts` によるネイティブ Vitest `projects`
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core / unit 在庫、および `vitest.unit.config.ts` でカバーされる許可済みの `ui` node テスト
- スコープ:
  - 純粋な unit テスト
  - プロセス内 integration テスト（gateway auth、routing、tooling、parsing、config）
  - 既知バグに対する決定論的リグレッション
- 期待事項:
  - CI で実行される
  - 実際のキーは不要
  - 高速で安定しているべき
- Projects に関する注記:
  - `pnpm test`、`pnpm test:watch`、`pnpm test:changed` は、いずれも同じネイティブ Vitest ルート `projects` config を使います。
  - 直接のファイルフィルターは、ルート project グラフ経由でネイティブにルーティングされるため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はカスタムラッパーなしで動作します。
- Embedded runner に関する注記:
  - メッセージツール検出入力や compaction のランタイムコンテキストを変更する場合は、両レベルのカバレッジを維持してください。
  - 純粋な routing / normalization 境界には、焦点を絞った helper リグレッションを追加してください。
  - また、embedded runner integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付き id と compaction の動作が、実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、これらの integration パスの十分な代替にはなりません。
- Pool に関する注記:
  - ベースの Vitest config は現在 `threads` をデフォルトにしています。
  - 共有 Vitest config は `isolate: false` も固定し、ルート projects、e2e、live config 全体で非 isolated runner を使います。
  - ルート UI レーンは `jsdom` セットアップと optimizer を維持しますが、現在は共有の非 isolated runner でも動作します。
  - `pnpm test` は、ルート `vitest.config.ts` の projects config から同じ `threads` + `isolate: false` のデフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` ランチャーは、大きなローカル実行中の V8 コンパイルのチャーンを減らすため、Vitest の子 Node プロセスにデフォルトで `--no-maglev` も追加するようになりました。標準の V8 動作と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速ローカル反復に関する注記:
  - `pnpm test:changed` は、ネイティブ projects config を `--changed origin/main` 付きで実行します。
  - `pnpm test:max` と `pnpm test:changed:max` は同じネイティブ projects config を維持し、worker 上限だけを高くします。
  - ローカル worker の自動スケーリングは現在、意図的に保守的で、ホストの load average がすでに高い場合にも抑制されるため、複数の Vitest 実行を同時に走らせても、デフォルトでは被害が少なくなります。
  - ベースの Vitest config は、changed モードの再実行がテスト配線の変更時にも正しく保たれるよう、projects / config ファイルを `forceRerunTriggers` としてマークします。
  - config は、サポートされるホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のまま維持します。直接のプロファイリング用に 1 つの明示的なキャッシュ場所を使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf デバッグに関する注記:
  - `pnpm test:perf:imports` は Vitest の import-duration レポートと import-breakdown 出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を `origin/main` 以降に変更されたファイルに限定します。
  - `pnpm test:perf:profile:main` は、Vitest / Vite 起動と transform オーバーヘッドのメインスレッド CPU プロファイルを書き出します。
  - `pnpm test:perf:profile:runner` は、unit スイートに対してファイル並列を無効化した状態で、runner の CPU + heap プロファイルを書き出します。

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- ランタイムデフォルト:
  - リポジトリの他の部分に合わせて、Vitest `threads` と `isolate: false` を使います。
  - 適応的 worker を使います（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトでは silent mode で動作します。
- 便利な上書き:
  - `OPENCLAW_E2E_WORKERS=<n>` で worker 数を強制します（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効にします。
- スコープ:
  - 複数インスタンス gateway の end-to-end 動作
  - WebSocket / HTTP サーフェス、node pairing、および重めのネットワーク
- 期待事項:
  - CI で実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - Unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンド smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行する
  - sandbox fs bridge を通じて remote-canonical なファイルシステム動作を検証する
- 期待事項:
  - オプトイン専用で、デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使い、その後テスト gateway と sandbox を破棄する
- 便利な上書き:
  - より広い e2e スイートを手動実行するときにテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` によって **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー / モデルは、与えられた実際の資格情報で _今日_ 実際に動くか？」
  - プロバイダーフォーマット変更、tool-calling の癖、auth 問題、rate limit 動作の検出
- 期待事項:
  - 設計上、CI で安定しない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / rate limit を消費する
  - 「全部」ではなく、狭く絞ったサブセットを実行することを推奨
- Live 実行は `~/.profile` を source して、不足している API キーを取得します。
- デフォルトでは、live 実行は依然として `HOME` を分離し、config / auth 材料を一時テスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- Live テストに実際の home ディレクトリを使わせたい場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、gateway bootstrap ログ / Bonjour の雑音をミュートします。完全な起動ログを再表示したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー別）: `*_API_KEYS` をカンマ / セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` を設定します（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。または live 専用の上書きとして `OPENCLAW_LIVE_*_KEY` を使います。テストは rate limit 応答で再試行します。
- 進捗 / heartbeat 出力:
  - Live スイートは現在、長いプロバイダー呼び出しが Vitest のコンソールキャプチャが静かでも視覚的に進行中と分かるよう、stderr に進捗行を出力します。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、プロバイダー / gateway の進捗行は live 実行中に即座にストリームされます。
  - 直接モデル heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway / probe heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

次の判断表を使ってください。

- ロジック / テストを編集している: `pnpm test` を実行する（大きく変更したなら `pnpm test:coverage` も）
- Gateway のネットワーク / WS protocol / pairing に触れた: `pnpm test:e2e` も追加する
- 「ボットが落ちている」問題 / プロバイダー固有の失敗 / tool calling をデバッグしている: 絞り込んだ `pnpm test:live` を実行する

## Live: Android node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android node が現在広告している**すべてのコマンド**を呼び出し、コマンド契約の動作を検証する。
- スコープ:
  - 前提条件付き / 手動セットアップ（このスイートはアプリのインストール / 実行 / pairing を行いません）。
  - 選択した Android node に対する、コマンドごとの gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに gateway に接続済み + paired 済みであること。
  - アプリが foreground に保たれていること。
  - 成功が期待される capability に対して、権限 / キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/platforms/android)

## Live: model smoke（profile keys）

Live テストは、失敗を切り分けられるよう 2 層に分かれています。

- 「Direct model」は、そのプロバイダー / モデルがそのキーで少なくとも応答できることを教えてくれます。
- 「Gateway smoke」は、そのモデルで gateway + agent の完全なパイプライン（sessions、history、tools、sandbox policy など）が動作することを教えてくれます。

### Layer 1: 直接モデル補完（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 発見されたモデルを列挙する
  - `getApiKeyForModel` を使って、資格情報があるモデルを選ぶ
  - モデルごとに小さな completion を実行する（必要に応じて対象リグレッションも）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または modern の別名である `all`）を設定してください。そうしないと、`pnpm test:live` を gateway smoke に集中させるため skip されます。
- モデルの選び方:
  - モダン allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はモダン allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
- プロバイダーの選び方:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と env fallback
  - **profile store のみ**を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「gateway agent パイプラインが壊れている」を分離する
  - 小さく分離されたリグレッションを含める（例: OpenAI Responses / Codex Responses の reasoning replay + tool-call フロー）

### Layer 2: Gateway + dev agent smoke（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - in-process gateway を起動する
  - `agent:dev:*` session を作成 / patch する（実行ごとに model override）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（tools なし）
    - 実際の tool invocation が動作すること（read probe）
    - 任意の追加 tool probe（exec+read probe）
    - OpenAI のリグレッションパス（tool-call-only → follow-up）が動作し続けること
- Probe の詳細（失敗をすばやく説明できるようにするため）:
  - `read` probe: テストが workspace に nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返すよう依頼します。
  - `exec+read` probe: テストがエージェントに、`exec` で temp ファイルに nonce を書き込み、その後 `read` で読み返すよう依頼します。
  - image probe: テストが生成した PNG（猫 + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選び方:
  - デフォルト: モダン allowlist（Opus / Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン allowlist の別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞り込む
- プロバイダーの選び方（「OpenRouter のすべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- Tool + image probe はこの live テストでは常に有効です:
  - `read` probe + `exec+read` probe（tool stress）
  - image probe は、モデルが image input サポートを広告しているときに実行される
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコードの小さな PNG を生成する（`src/gateway/live-image-probe.ts`）
    - `agent` に `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信する
    - Gateway が添付ファイルを `images[]` に解析する（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent がマルチモーダルなユーザーメッセージをモデルに転送する
    - 検証: 返信に `cat` + コードが含まれる（OCR の許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンド smoke（Claude CLI または他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config に触れずに、ローカル CLI バックエンドを使った Gateway + agent パイプラインを検証する。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド: `claude`
  - 引数: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されているときの画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送って resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
- Claude CLI MCP config を有効のままにするには `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`（デフォルトでは、一時的な厳格な空の `--mcp-config` を注入し、ambient / global MCP サーバーが smoke 実行中に無効のままになるようにします）。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- Claude CLI は root として起動すると `bypassPermissions` を拒否するため、これはリポジトリ Docker image 内で非 root の `node` ユーザーとして live CLI-backend smoke を実行します。
- `claude-cli` では、Linux の `@anthropic-ai/claude-code` パッケージを、キャッシュ可能で書き込み可能な prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にインストールします。
- `claude-cli` では、`OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` を設定しない限り、live smoke は厳格な空の MCP config を注入します。
- 可能な場合は `~/.claude` をコンテナーにコピーしますが、Claude auth が `ANTHROPIC_API_KEY` によって支えられているマシンでは、子 Claude CLI 用に `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV` 経由で `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` も保持します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: 実際の ACP エージェントで、本物の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送る
  - synthetic な message-channel conversation をその場で bind する
  - 同じ conversation 上で通常の follow-up を送る
  - follow-up が bound された ACP session transcript に到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - ACP エージェント: `claude`
  - Synthetic channel: Slack DM 風の conversation context
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- 注記:
  - このレーンは、テストが外部配信を装わずに message-channel context を添付できるよう、admin 専用の synthetic originating-route fields を伴う gateway `chat.send` サーフェスを使います。
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` が未設定の場合、テストは設定済み / バンドル済みの acpx コマンドを使います。ハーネス auth が `~/.profile` の環境変数に依存する場合は、プロバイダー env を保持するカスタム `acpx` コマンドを優先してください。

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

Docker 注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- これは `~/.profile` を source し、一致する CLI auth home（`~/.claude` または `~/.codex`）をコンテナーにコピーし、acpx を書き込み可能な npm prefix にインストールし、その後、要求された live CLI（`@anthropic-ai/claude-code` または `@openai/codex`）がなければインストールします。
- Docker 内では、acpx が source 済み profile のプロバイダー env 変数を子ハーネス CLI で使えるようにするため、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定します。

### 推奨 live レシピ

狭く明示的な allowlist が最速で、最も不安定さが少ないです。

- 単一モデル、direct（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google に集中する場合（Gemini API キー + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` は Gemini API を使います（API key）。
- `google-antigravity/...` は Antigravity OAuth bridge を使います（Cloud Code Assist 風 agent endpoint）。
- `google-gemini-cli/...` は、マシン上のローカル Gemini CLI を使います（別個の auth + tooling の癖があります）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は Google のホスト型 Gemini API を HTTP 経由で呼び出します（API key / profile auth）。多くのユーザーが「Gemini」と言うときに意味するのはこちらです。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell-out して使います。独自の auth があり、動作も異なる場合があります（streaming / tool サポート / バージョン差異）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（live はオプトイン）が、これらはキーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルです。

### Modern smoke set（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` および `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` および `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image 付きで gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling（Read + 任意の Exec）

少なくともプロバイダーファミリーごとに 1 つ選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4`（または最新の利用可能なもの）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API mode に依存）

### Vision: image send（添付ファイル → マルチモーダルメッセージ）

少なくとも 1 つの image 対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めて、image probe を実行してください（Claude / Gemini / OpenAI の vision 対応バリアントなど）。

### Aggregators / 代替ゲートウェイ

キーを有効化している場合、次経由のテストもサポートします。

- OpenRouter: `openrouter/...`（何百ものモデル。tool + image 対応候補を見つけるには `openclaw models scan` を使ってください）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（auth は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrix に含められるその他のプロバイダー（資格情報 / config がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタム endpoint）: `minimax`（cloud / API）、および OpenAI / Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「すべてのモデル」をハードコードしようとしないでください。権威ある一覧は、そのマシンで `discoverModels(...)` が返すものと、利用可能なキーがあるものです。

## 資格情報（絶対にコミットしない）

Live テストは、CLI と同じ方法で資格情報を検出します。実務上の意味は次のとおりです。

- CLI が動作するなら、live テストも同じキーを見つけられるはずです。
- Live テストが「資格情報なし」と言う場合は、`openclaw models list` / model selection をデバッグするときと同じ方法でデバッグしてください。

- エージェントごとの auth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（これが live テストでいう「profile keys」です）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー state dir: `~/.openclaw/credentials/`（存在する場合は staged live home にコピーされますが、メインの profile-key store ではありません）
- Live のローカル実行では、デフォルトで、現在の config、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、およびサポートされている外部 CLI auth dir を一時テスト home にコピーします。その staged config では `agents.*.workspace` / `agentDir` のパス上書きは取り除かれるため、probe が実際のホスト workspace に触れません。

Env キー（たとえば `~/.profile` に export 済みのもの）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使ってください（コンテナーに `~/.profile` を mount できます）。

## Deepgram live（音声文字起こし）

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `src/agents/byteplus.live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Image generation live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- スコープ:
  - 登録されているすべての image-generation provider plugin を列挙する
  - probe 前に、欠けている provider env 変数をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile よりも live / env API キーを優先して使うため、`auth-profiles.json` の古いテストキーが本物のシェル資格情報を隠しません
  - 利用可能な auth / profile / model がないプロバイダーは skip する
  - 共有ランタイム capability を通して、標準の image-generation バリアントを実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済みプロバイダー:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の auth 動作:
  - env 専用の上書きを無視し、profile-store auth を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つの系統に分かれます。

- Live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、対応する profile-key live ファイルだけをリポジトリ Docker image 内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル config dir と workspace を mount し（mount されていれば `~/.profile` も source）、対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、フル Docker sweep を現実的に保つため、デフォルトで小さめの smoke cap を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使います。より大きな包括スキャンを明示的に望む場合は、これらの env 変数を上書きしてください。
- `test:docker:all` は `test:docker:live-build` で live Docker image を一度ビルドし、その後 2 つの live Docker レーンで再利用します。
- Container smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:plugins` は、1 つ以上の実際のコンテナーを起動し、より高レベルの integration パスを検証します。

Live-model Docker ランナーは、必要な CLI auth home だけを bind-mount し（実行が絞り込まれていない場合は、サポートされるものすべて）、外部 CLI OAuth がホスト auth store を変更せずにトークン更新できるよう、実行前にそれらをコンテナー home にコピーします。

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- Onboarding ウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2 コンテナー、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed 済み Gateway + stdio bridge + 生の Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install smoke + `/plugin` alias + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

Live-model Docker ランナーは、現在の checkout も読み取り専用で bind-mount し、
コンテナー内の一時 workdir に stage します。これにより、ランタイム
image を slim に保ちながら、正確なローカル source / config に対して Vitest を実行できます。
また、gateway live probe がコンテナー内で実際の Telegram / Discord などの channel worker を起動しないよう、
`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は依然として `pnpm test:live` を実行するため、
その Docker レーンから gateway live coverage を絞り込みまたは除外したい場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` はより高レベルな互換性 smoke です。OpenAI 互換 HTTP endpoint を有効化した
OpenClaw gateway コンテナーを起動し、その gateway に対して固定版 Open WebUI コンテナーを起動し、
Open WebUI を通じてサインインし、`/api/models` が `openclaw/default` を公開していることを検証し、
その後 Open WebUI の `/api/chat/completions` proxy 経由で実際の chat request を送信します。
初回実行は、Docker が Open WebUI image を pull する必要がある場合や、
Open WebUI 自身の cold-start セットアップを完了する必要がある場合があるため、かなり遅く感じることがあります。
このレーンは使用可能な live model key を期待しており、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトで `~/.profile`）です。
成功時の実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定論的で、実際の Telegram、Discord、iMessage アカウントを必要としません。
これは seed 済み Gateway
コンテナーを起動し、次に `openclaw mcp serve` を起動する 2 台目のコンテナーを起動し、
その後、実際の stdio MCP bridge 上で、ルーティングされた conversation discovery、transcript 読み取り、attachment metadata、
live event queue 動作、outbound send routing、Claude 風の channel +
permission 通知を検証します。通知チェックは、生の stdio MCP frame を直接検査するため、
この smoke は、特定クライアント SDK が偶然表面化する内容ではなく、bridge が実際に出力するものを検証します。

手動 ACP 平易言語 thread smoke（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション / デバッグワークフロー用に維持してください。ACP thread routing 検証で再度必要になる可能性があるため、削除しないでください。

便利な env 変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` に mount
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` に mount
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` に mount され、テスト実行前に source される
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュされた CLI install 用に `/home/node/.npm-global` に mount
- `$HOME` 配下の外部 CLI auth dir は、`/host-auth/...` 配下に読み取り専用で mount され、その後テスト開始前に `/home/node/...` へコピーされる
  - デフォルト: サポートされるすべての dir（`.codex`、`.claude`、`.minimax`）を mount
  - 絞り込み済みプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要な dir のみを mount
  - 手動で上書きするには `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリスト
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナー内でプロバイダーをフィルターするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 資格情報が profile store から来ることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env 由来ではない）
- Open WebUI smoke 用に gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke が使う nonce チェック prompt を上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定された Open WebUI image tag を上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメント健全性チェック

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify anchor 検証を実行してください: `pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

これらは、実際のプロバイダーなしで行う「実際のパイプライン」リグレッションです。

- Gateway tool calling（mock OpenAI、実際の gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start` / `wizard.next`、config + auth を強制して書き込む）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（Skills）

CI-safe で「エージェント信頼性 eval」のように振る舞うテストはすでにいくつかあります。

- 実際の gateway + agent loop を通した mock tool-calling（`src/gateway/gateway.test.ts`）。
- Session 配線と config 効果を検証する end-to-end なウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ欠けているもの（[Skills](/tools/skills) を参照）:

- **Decisioning:** Skills がプロンプトに列挙されているとき、エージェントは正しい Skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必要な手順 / 引数に従うか？
- **Workflow contracts:** tool の順序、session history の持ち越し、sandbox 境界を検証する multi-turn シナリオ。

将来の eval は、まず決定論的であるべきです。

- Mock プロバイダーを使い、tool call + 順序、skill file 読み取り、session 配線を検証するシナリオランナー。
- Skill に焦点を当てた小規模スイート（使うべきか避けるべきか、gating、プロンプトインジェクション）。
- CI-safe スイートが整ってからのみ、任意の live eval（オプトイン、env gated）。

## Contract tests（plugin と channel の形状）

Contract tests は、登録されたすべての plugin と channel が
それぞれのインターフェース契約に準拠していることを検証します。検出されたすべての plugin を反復し、
形状と動作に関する一連の検証を実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有 seam および smoke ファイルを意図的に skip します。共有 channel または provider surface に触れた場合は、
contract コマンドを明示的に実行してください。

### コマンド

- すべての contract: `pnpm test:contracts`
- Channel contract のみ: `pnpm test:contracts:channels`
- Provider contract のみ: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts` にあります。

- **plugin** - 基本的な plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - Session binding 動作
- **outbound-payload** - メッセージ payload 構造
- **inbound** - Inbound メッセージ処理
- **actions** - Channel action handler
- **threading** - Thread ID 処理
- **directory** - Directory / roster API
- **group-policy** - Group policy の強制

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - Channel status probe
- **registry** - Plugin registry の形状

### Provider contracts

`src/plugins/contracts/*.contract.test.ts` にあります。

- **auth** - Auth フロー契約
- **auth-choice** - Auth choice / selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin の形状 / インターフェース
- **wizard** - セットアップウィザード

### 実行すべきタイミング

- plugin-sdk の export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin registration または discovery をリファクタリングした後

Contract tests は CI で実行され、実際の API キーは必要ありません。

## リグレッションの追加方法（指針）

Live で見つかった provider / model 問題を修正する場合:

- 可能なら CI-safe なリグレッションを追加してください（mock / stub provider、または正確な request-shape 変換をキャプチャする）
- 本質的に live 専用の問題（rate limit、auth ポリシー）なら、live テストは狭く保ち、env 変数でオプトインにしてください
- バグを捕まえる最小の層を対象にすることを優先してください:
  - provider request conversion / replay バグ → direct models テスト
  - gateway session / history / tool パイプラインバグ → gateway live smoke または CI-safe な gateway mock テスト
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに 1 つのサンプル target を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加した場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、未分類 target id では意図的に失敗するため、新しい class が黙って skip されることはありません。
