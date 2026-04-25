---
read_when:
    - ライブのモデルマトリクス / CLI バックエンド / ACP / メディアプロバイダースモークを実行すること
    - ライブテストの認証情報解決をデバッグすること
    - 新しいプロバイダー固有のライブテストを追加すること
sidebarTitle: Live tests
summary: 'ライブ（ネットワークに接続する）テスト: モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-04-25T13:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

クイックスタート、QA ランナー、unit/integration スイート、Docker フローについては
[Testing](/ja-JP/help/testing) を参照してください。このページでは **ライブ**（ネットワークに接続する）
テストスイート、つまりモデルマトリクス、CLI バックエンド、ACP、メディアプロバイダーのライブテストに加え、認証情報処理を扱います。

## ライブ: ローカルプロファイル用スモークコマンド

アドホックなライブチェックの前に `~/.profile` を読み込んで、プロバイダーキーとローカル tool
パスがシェルと一致するようにしてください。

```bash
source ~/.profile
```

安全なメディアスモーク:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な voice call 準備確認スモーク:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際に通知通話を発信したい場合にのみ
`--yes` を使ってください。Twilio、Telnyx、Plivo では、
準備確認が成功するには公開 Webhook URL が必要です。ローカル専用の
loopback/プライベートフォールバックは設計上拒否されます。

## ライブ: Android Node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android Node が現在公開している **すべてのコマンド** を呼び出し、コマンド契約の動作を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android Node に対する、コマンドごとの gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに gateway に接続済みかつペアリング済みであること。
  - アプリをフォアグラウンドに保持すること。
  - 成功を期待する capability に必要な権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブテストは、失敗を切り分けられるよう 2 層に分かれています。

- 「直接モデル」は、そのプロバイダー/モデルが、そのキーでそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルで gateway+agent パイプライン全体が機能するか（セッション、履歴、tools、sandbox policy など）を示します。

### レイヤー 1: 直接モデル completion（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 発見されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報のあるモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞った回帰も含む）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または modern の別名である `all`）を設定します。未設定だと、`pnpm test:live` を gateway スモークに集中させるためスキップされます
- モデル選択方法:
  - モダン許可リストを実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はモダン許可リストの別名です
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（カンマ区切り許可リスト）
  - modern/all スイープはデフォルトでキュレート済みの高シグナル上限を使用します。完全な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0`、小さな上限には正の数を設定します。
  - 完全スイープでは、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使います。デフォルト: 60 分。
  - 直接モデルプローブはデフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダー選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り許可リスト）
- キーの取得元:
  - デフォルト: profile store と env フォールバック
  - **profile store のみ** を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「gateway agent パイプラインが壊れている」を分離するため
  - 小さく独立した回帰を隔離するため（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent スモーク（「@openclaw」が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - in-process gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとに model override）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（tools なし）
    - 実際の tool 呼び出しが機能すること（read probe）
    - 任意の追加 tool probe（exec+read probe）
    - OpenAI の回帰経路（tool-call-only → follow-up）が引き続き機能すること
- プローブ詳細（失敗をすばやく説明できるように）:
  - `read` probe: テストは workspace に nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返答するよう求めます。
  - `exec+read` probe: テストはエージェントに、nonce を一時ファイルへ `exec` 書き込みし、その後 `read` で読み戻すよう求めます。
  - image probe: テストは生成した PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデル選択方法:
  - デフォルト: モダン許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン許可リストの別名です
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞り込みます
  - modern/all gateway スイープはデフォルトでキュレート済みの高シグナル上限を使用します。完全な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、小さな上限には正の数を設定します。
- プロバイダー選択方法（「何でも OpenRouter」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り許可リスト）
- tool + image probe はこのライブテストでは常に有効です:
  - `read` probe + `exec+read` probe（tool ストレス）
  - モデルが画像入力対応を公開している場合は image probe が実行されます
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - これを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントがマルチモーダルな user メッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR の許容: 軽微な誤りは許容）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` ID）を確認するには、次を実行します。

```bash
openclaw models list
openclaw models list --json
```

## ライブ: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config に触れずに、ローカル CLI バックエンドを使った Gateway + agent パイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有する extension の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルト provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の動作は、所有する CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限りデフォルトで off です。
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG` が設定されているときに画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）
  - 2 ターン目を送り、resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 選択モデルが切り替え先をサポートしている場合に Claude Sonnet -> Opus の同一セッション継続性プローブへオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは、全体的な信頼性のためこれをデフォルトで off にしています。
  - MCP/tool loopback プローブへオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限りデフォルトで off です。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー用 Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、repo Docker イメージ内で非 root の `node` user としてライブ CLI バックエンドスモークを実行します。
- 所有する extension から CLI スモークメタデータを解決し、その後、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、キャッシュ可能で書き込み可能なプレフィックス `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`~/.claude/.credentials.json` と `claudeAiOauth.subscriptionType`、または `claude setup-token` による `CLAUDE_CODE_OAUTH_TOKEN` のいずれかを通じたポータブル Claude Code subscription OAuth が必要です。これはまず Docker 内で直接 `claude -p` を確認し、その後 Anthropic API-key env var を保持せずに 2 回の Gateway CLI バックエンドターンを実行します。この subscription レーンでは、Claude が現在サードパーティアプリ利用を通常の subscription プラン制限ではなく追加利用課金にルーティングしているため、Claude MCP/tool と image probe はデフォルトで無効化されています。
- ライブ CLI バックエンドスモークは、Claude、Codex、Gemini に対して同じエンドツーエンドフローを実行するようになりました: テキストターン、画像分類ターン、その後 gateway CLI を通じて検証される MCP `cron` tool 呼び出しです。
- Claude のデフォルトスモークでは、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモを引き続き記憶していることも検証します。

## ライブ: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP agent で実際の ACP 会話バインドフローを検証すること:
  - `/acp spawn <agent> --bind here` を送る
  - 合成メッセージチャンネル会話をその場でバインドする
  - 同じ会話で通常の follow-up を送る
  - follow-up がバインド済み ACP セッショントランスクリプトに到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成チャンネル: Slack の DM スタイル会話コンテキスト
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 注記:
  - このレーンは、admin 専用の合成 originating-route フィールドを持つ gateway `chat.send` サーフェスを使用するため、テストは外部配信を装わずにメッセージチャンネルコンテキストを添付できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP harness agent に対して埋め込み `acpx` Plugin の組み込み agent registry を使用します。

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

単一エージェント用 Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker の注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、ACP bind スモークを集約ライブ CLI エージェント `claude`、`codex`、`gemini` の順に実行します。
- マトリクスを絞り込むには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使います。
- これは `~/.profile` を読み込み、一致する CLI 認証情報をコンテナにステージし、その後、必要に応じて要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`@google/gemini-cli`、または `opencode-ai`）をインストールします。ACP バックエンド自体は、`acpx` Plugin に含まれる bundled の埋め込み `acpx/runtime` パッケージです。
- OpenCode の Docker バリアントは厳密な単一エージェント回帰レーンです。`~/.profile` を読み込んだ後、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込みます。`pnpm test:docker:live-acp-bind:opencode` では、汎用の post-bind skip を許容せず、バインド済み assistant transcript を必須とします。
- Gateway 外での挙動比較のために直接 `acpx` CLI を呼ぶのは、手動/回避策の経路にすぎません。Docker ACP bind スモークは OpenClaw の埋め込み `acpx` ランタイムバックエンドを実行します。

## ライブ: Codex app-server harness スモーク

- 目的: 通常の gateway
  `agent` メソッドを通じて Plugin 管理の Codex harness を検証すること:
  - bundled の `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex harness を強制した状態で、最初の gateway agent ターンを `openai/gpt-5.2` に送る
  - 2 回目のターンを同じ OpenClaw セッションに送り、app-server
    thread が再開できることを確認する
  - 同じ gateway command
    パスを通じて `/codex status` と `/codex models` を実行する
  - 必要に応じて、Guardian 審査付きの昇格 shell プローブを 2 つ実行する。承認されるべき無害な
    コマンド 1 つと、拒否されてエージェントが確認を返すべき偽の secret upload 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.2`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が PI へ暗黙フォールバックして通過することはできません。
- 認証: Codex app-server 認証はローカルの Codex subscription ログインから取得されます。Docker
  スモークでは、必要に応じて非 Codex プローブ用に `OPENAI_API_KEY` も提供でき、さらに
  `~/.codex/auth.json` と `~/.codex/config.toml` の任意コピーにも対応しています。

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker の注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- マウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在すれば Codex CLI
  認証ファイルをコピーし、書き込み可能なマウント済み npm
  プレフィックスに `@openai/codex` をインストールし、ソースツリーをステージした後、Codex-harness ライブテストのみを実行します。
- Docker では image、MCP/tool、Guardian プローブがデフォルトで有効です。より狭いデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Docker でも `OPENCLAW_AGENT_HARNESS_FALLBACK=none` をエクスポートし、ライブ
  テスト設定と一致させることで、従来のエイリアスや PI フォールバックが Codex harness
  回帰を隠せないようにしています。

### 推奨ライブレシピ

狭く明示的な許可リストが最も速く、最も不安定になりにくいです。

- 単一モデル、直接（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool 呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - ローカルキーがシェルプロファイルにある場合: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使います。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 風エージェントエンドポイント）を使います。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使います（別個の認証 + tool 挙動の癖があります）。
- Gemini API と Gemini CLI の違い:
  - API: OpenClaw は Google のホストされた Gemini API を HTTP 経由で呼び出します（API キー / profile 認証）。多くのユーザーが「Gemini」と言うときに意味しているのはこれです。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell 実行します。独自の認証を持ち、挙動が異なることがあります（ストリーミング/tool サポート/バージョンずれ）。

## ライブ: モデルマトリクス（カバー範囲）

固定の「CI モデル一覧」はありません（ライブはオプトイン）が、認証情報のある開発マシンで定期的にカバーすることを **推奨** するモデルは次のとおりです。

### Modern スモークセット（tool 呼び出し + image）

これは、動作し続けることを期待する「一般的なモデル」の実行です。

- OpenAI（非 Codex）: `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image 付きで gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool 呼び出し（Read + 任意の Exec）

少なくとも各プロバイダーファミリーから 1 つ選んでください。

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると望ましい）:

- xAI: `xai/grok-4`（または最新の利用可能なもの）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool 呼び出しは API モードに依存）

### Vision: image send（添付 → マルチモーダルメッセージ）

image probe を実行するには、画像対応モデルを少なくとも 1 つ `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の画像対応バリアントなど）。

### Aggregator / 代替 Gateway

キーが有効なら、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tool+image 対応候補を見つけるには `openclaw models scan` を使います）
- OpenCode: Zen には `opencode/...`、Go には `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

ライブマトリクスに含められるその他のプロバイダー（認証情報/config がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（cloud/API）、および任意の OpenAI/Anthropic 互換 proxy（LM Studio、vLLM、LiteLLM など）

ヒント: docs に「すべてのモデル」をハードコードしようとしないでください。信頼できる一覧は、あなたのマシンで `discoverModels(...)` が返すものと、利用可能なキーがあるものです。

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出します。実際上の意味:

- CLI が動くなら、ライブテストも同じキーを見つけられるはずです。
- ライブテストが「認証情報なし」と言うなら、`openclaw models list` / モデル選択をデバッグするときと同じ方法で調べてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストで「profile keys」と言っているのはこれです）
- config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 旧来の state dir: `~/.openclaw/credentials/`（存在する場合、ステージされたライブホームへコピーされますが、メインの profile-key ストアではありません）
- ローカルのライブ実行では、通常、アクティブ config、エージェントごとの `auth-profiles.json`、旧来の `credentials/`、および対応する外部 CLI 認証ディレクトリが一時テストホームへコピーされます。ステージされたライブホームでは `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` パス上書きも除去されるため、プローブが実ホスト workspace を触らないようになっています。

env キー（たとえば `~/.profile` に export されたもの）に依存したい場合は、ローカルテストの前に `source ~/.profile` を実行するか、以下の Docker ランナーを使ってください（コンテナ内に `~/.profile` をマウントできます）。

## Deepgram ライブ（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan ライブ

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow メディアライブ

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - bundled の comfy image、video、`music_generate` 経路を実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない capability はそれぞれスキップします
  - comfy workflow の送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成プロバイダー Plugin を列挙します
  - プローブ前に、欠落しているプロバイダー env var をログインシェル（`~/.profile`）から読み込みます
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がないプロバイダーはスキップします
  - 設定された各プロバイダーを共有画像生成ランタイム経由で実行します:
    - `<provider>:generate`
    - プロバイダーが edit サポートを宣言している場合は `<provider>:edit`
- 現在カバーされている bundled プロバイダー:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 任意の認証動作:
  - profile-store 認証を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

出荷済み CLI 経路については、プロバイダー/ランタイムのライブ
テストが通った後に `infer` スモークを追加してください。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これにより、CLI 引数パース、config/デフォルトエージェント解決、bundled
Plugin 有効化、オンデマンドの bundled ランタイム依存修復、共有
画像生成ランタイム、そしてライブプロバイダーリクエストをカバーします。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有 bundled 音楽生成プロバイダー経路を実行します
  - 現在は Google と MiniMax をカバーします
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー env var を読み込みます
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がないプロバイダーはスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します:
    - プロンプトのみ入力による `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy ライブファイルであり、この共有スイープではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - profile-store 認証を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有 bundled 動画生成プロバイダー経路を実行します
  - デフォルトでは release-safe なスモーク経路を使用します。非 FAL プロバイダー、プロバイダーごとに 1 件の text-to-video リクエスト、1 秒のロブスタープロンプト、さらに `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）から得られるプロバイダーごとの操作上限です
  - FAL は、プロバイダー側キュー遅延がリリース時間を支配し得るため、デフォルトでスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を指定してください
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー env var を読み込みます
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な auth/profile/model がないプロバイダーはスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言済み transform モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言しており、選択したプロバイダー/モデルが共有スイープで buffer-backed ローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言しており、選択したプロバイダー/モデルが共有スイープで buffer-backed ローカル動画入力を受け付ける場合は `videoToVideo`
  - 現在、共有スイープで宣言はされているがスキップされる `imageToVideo` プロバイダー:
    - `vydra`。bundled の `veo3` は text-only で、bundled の `kling` はリモート画像 URL を要求するため
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 現在、共有スイープで宣言はされているがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`qwen`、`xai`。これらの経路は現在、リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカル buffer-backed 入力を使っており、その経路は共有スイープでは受け付けられないため
    - `openai`。現在の共有レーンには org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープに FAL を含むすべてのプロバイダーを入れるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行のために各プロバイダー操作上限を下げるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - profile-store 認証を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の image、music、video ライブスイートを 1 つの repo-native エントリーポイントで実行します
  - 不足しているプロバイダー env var を `~/.profile` から自動読み込みします
  - デフォルトでは、現在利用可能な auth を持つプロバイダーに各スイートを自動的に絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の動作が一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [Testing](/ja-JP/help/testing) — unit、integration、QA、および Docker スイート
