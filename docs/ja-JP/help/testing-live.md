---
read_when:
    - ライブのモデルマトリクス / CLIバックエンド / ACP / メディアプロバイダースモークの実行
    - ライブテストの認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストの追加
sidebarTitle: Live tests
summary: 'ライブ（ネットワークに接触する）テスト: モデルマトリクス、CLIバックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-04-24T08:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03689542176843de6e0163011250d1c1225ee5af492f88acf945b242addd1cc9
    source_path: help/testing-live.md
    workflow: 15
---

クイックスタート、QAランナー、ユニット/統合スイート、Dockerフローについては、[テスト](/ja-JP/help/testing) を参照してください。このページでは、**ライブ**（ネットワークに接触する）テストスイート、つまりモデルマトリクス、CLIバックエンド、ACP、メディアプロバイダーのライブテスト、および認証情報の扱いを説明します。

## ライブ: Android Node機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続されたAndroid Nodeが**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングを行いません）。
  - 選択したAndroid Nodeに対するコマンド単位のGateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - AndroidアプリがすでにGatewayに接続済みかつペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する機能に必要な権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Androidの完全なセットアップ詳細: [Androidアプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブテストは、障害を切り分けられるように2層に分かれています:

- 「ダイレクトモデル」は、指定したキーでそのプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gatewayスモーク」は、そのモデルに対してGateway+エージェントの完全なパイプライン（セッション、履歴、ツール、サンドボックスポリシーなど）が動作することを示します。

### レイヤー1: ダイレクトモデル完了（Gatewayなし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報があるモデルを選択する
  - モデルごとに小さな完了処理を実行する（必要に応じて対象を絞ったリグレッションも含む）
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`。`modern` の別名）を設定します。未設定の場合、`pnpm test:live` の焦点をGatewayスモークに保つためスキップされます
- モデルの選び方:
  - `OPENCLAW_LIVE_MODELS=modern` でモダン許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）を実行
  - `OPENCLAW_LIVE_MODELS=all` はモダン許可リストの別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（カンマ区切り許可リスト）
  - modern/allスイープは、デフォルトで厳選された高シグナル上限を使用します。完全なモダンスイープにするには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限にするには正の数を設定します。
  - 完全スイープでは、ダイレクトモデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。デフォルトは60分です。
  - ダイレクトモデルプローブはデフォルトで20並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選び方:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り許可リスト）
- キーの取得元:
  - デフォルト: プロファイルストアと環境変数フォールバック
  - **プロファイルストアのみ** を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダーAPIが壊れている / キーが無効」と「Gatewayエージェントパイプラインが壊れている」を分離する
  - 小さく独立したリグレッションを収容する（例: OpenAI Responses/Codex Responsesのreasoning再生 + ツール呼び出しフロー）

### レイヤー2: Gateway + 開発エージェントスモーク（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内Gatewayを起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデル上書き）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能すること（readプローブ）
    - 任意の追加ツールプローブ（exec+readプローブ）
    - OpenAIリグレッション経路（ツール呼び出しのみ → フォローアップ）が動作し続けること
- プローブ詳細（失敗をすぐ説明できるように）:
  - `read` プローブ: テストがワークスペースにnonceファイルを書き込み、エージェントにそれを `read` してnonceを返すよう要求します。
  - `exec+read` プローブ: テストがエージェントに `exec` で一時ファイルへnonceを書き込み、その後 `read` で読み返すよう要求します。
  - imageプローブ: テストが生成したPNG（猫 + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選び方:
  - デフォルト: モダン許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン許可リストの別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込み
  - modern/all Gatewayスイープは、デフォルトで厳選された高シグナル上限を使用します。完全なモダンスイープにするには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限にするには正の数を設定します。
- プロバイダーの選び方（「OpenRouterの全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り許可リスト）
- このライブテストではツール + imageプローブが常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷テスト）
  - imageプローブは、モデルが画像入力サポートを公開している場合に実行されます
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコード付きの小さなPNGを生成します（`src/gateway/live-image-probe.ts`）
    - これを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gatewayが添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 組み込みエージェントがマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR許容: 軽微な誤りは許容）

ヒント: 自分の環境で何をテストできるか（および正確な `provider/model` ID）を確認するには、次を実行してください:

```bash
openclaw models list
openclaw models list --json
```

## ライブ: CLIバックエンドスモーク（Claude、Codex、Gemini、またはその他のローカルCLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカルCLIバックエンドを使ってGateway + エージェントパイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有する拡張機能の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/image動作は、所有するCLIバックエンドPluginのメタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - プロンプト注入の代わりに画像ファイルパスをCLI引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` 設定時に画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2つ目のターンを送ってresumeフローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトのClaude Sonnet -> Opus同一セッション継続性プローブを無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが切り替え先をサポートしている場合に強制有効化するには `1`）。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダーのDockerレシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Dockerランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これはライブCLIバックエンドスモークを、リポジトリDockerイメージ内で非rootの `node` ユーザーとして実行します。
- 所有する拡張機能からCLIスモークメタデータを解決し、一致するLinux CLIパッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ可能で書き込み可能なprefixにインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`~/.claude/.credentials.json` に `claudeAiOauth.subscriptionType` を含めるか、`claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` によるポータブルClaude CodeサブスクリプションOAuthが必要です。まずDocker内で直接 `claude -p` を証明し、その後Anthropic APIキー環境変数を保持せずに2回のGateway CLIバックエンドターンを実行します。このサブスクリプションレーンでは、Claudeが現在、通常のサブスクリプションプラン上限ではなく追加利用課金を通じてサードパーティアプリ利用をルーティングするため、Claude MCP/ツールおよびimageプローブはデフォルトで無効化されます。
- ライブCLIバックエンドスモークは現在、Claude、Codex、Geminiに対して同じエンドツーエンドフローを実行します: テキストターン、画像分類ターン、その後Gateway CLI経由で検証されるMCP `cron` ツール呼び出し。
- Claudeのデフォルトスモークは、セッションをSonnetからOpusへパッチし、再開したセッションが以前のメモを引き続き覚えていることも検証します。

## ライブ: ACP bindスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブACPエージェントで実際のACP会話bindフローを検証すること:
  - `/acp spawn <agent> --bind here` を送信
  - 合成されたメッセージチャンネル会話をその場でbind
  - 同じ会話上で通常のフォローアップを送信
  - そのフォローアップがbind済みACPセッショントランスクリプトに記録されることを検証
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker内のACPエージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用のACPエージェント: `claude`
  - 合成チャンネル: Slack DMスタイルの会話コンテキスト
  - ACPバックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 注記:
  - このレーンは、管理者専用の合成originating-routeフィールドを持つGateway `chat.send` サーフェスを使用するため、外部配信を装わずにテストがメッセージチャンネルコンテキストを付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択したACPハーネスエージェントに対して、埋め込み `acpx` Pluginの組み込みエージェントレジストリを使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一エージェントのDockerレシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker注記:

- Dockerランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべてのライブCLIエージェント `claude`、`codex`、`gemini` に対して順番にACP bindスモークを実行します。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使用します。
- これは `~/.profile` を読み込み、一致するCLI認証情報をコンテナにステージし、`acpx` を書き込み可能なnpm prefixへインストールし、その後必要に応じて要求されたライブCLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定し、読み込んだprofileのプロバイダー環境変数が子ハーネスCLIで利用可能なままになるようにします。

## ライブ: Codex app-serverハーネススモーク

- 目的: 通常のGateway `agent` メソッドを通じて、Pluginが所有するCodexハーネスを検証すること:
  - バンドルされた `codex` Pluginを読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codexハーネスを強制した状態で、`openai/gpt-5.2` に対する最初のGatewayエージェントターンを送信する
  - 同じOpenClawセッションに2回目のターンを送信し、app-serverスレッドが再開できることを検証する
  - 同じGatewayコマンド経路を通じて `/codex status` と `/codex models` を実行する
  - 任意で、Guardianレビュー付きの昇格されたシェルプローブを2つ実行する: 承認されるべき無害なコマンド1つと、拒否されてエージェントが確認を求め返すべき偽のシークレットアップロード1つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.2`
- 任意のimageプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意のMCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意のGuardianプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れたCodexハーネスがPIへのサイレントフォールバックで通過することはできません。
- 認証: Codex app-server認証はローカルのCodexサブスクリプションログインから取得されます。Dockerスモークでは、該当する場合に非Codexプローブ用の `OPENAI_API_KEY` を提供できるほか、任意でコピーした `~/.codex/auth.json` と `~/.codex/config.toml` も利用できます。

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

Dockerレシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker注記:

- Dockerランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合はCodex CLI認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済みnpm prefixにインストールし、ソースツリーをステージしてから、Codexハーネスのライブテストのみを実行します。
- Dockerでは、image、MCP/ツール、Guardianプローブがデフォルトで有効になります。より狭いデバッグ実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Dockerは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` もエクスポートし、ライブテスト設定と一致させることで、従来のエイリアスやPIフォールバックがCodexハーネスのリグレッションを隠せないようにします。

### 推奨ライブレシピ

狭く明示的な許可リストが、最も高速で不安定になりにくいです:

- 単一モデル、ダイレクト（Gatewayなし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gatewayスモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにわたるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google重視（Gemini APIキー + Antigravity）:
  - Gemini（APIキー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` はGemini API（APIキー）を使用します。
- `google-antigravity/...` はAntigravity OAuthブリッジ（Cloud Code Assistスタイルのエージェントエンドポイント）を使用します。
- `google-gemini-cli/...` は、あなたのマシン上のローカルGemini CLIを使用します（認証とツールの癖が別です）。
- Gemini APIとGemini CLIの違い:
  - API: OpenClawはGoogleのホスト型Gemini APIをHTTP経由で呼び出します（APIキー / プロファイル認証）。これが、たいていのユーザーが「Gemini」と言うときに意味するものです。
  - CLI: OpenClawはローカルの `gemini` バイナリをシェル実行します。独自の認証を持ち、挙動が異なる場合があります（ストリーミング/ツールサポート/バージョン差異）。

## ライブ: モデルマトリクス（対象範囲）

固定の「CIモデルリスト」はありません（ライブはオプトイン）ですが、キーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルは次のとおりです。

### モダンスモークセット（ツール呼び出し + image）

これは、動作し続けることを期待する「共通モデル」実行です:

- OpenAI（非Codex）: `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` および `google/gemini-3-flash-preview`（古いGemini 2.xモデルは避けてください）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` および `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + image付きでGatewayスモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意のExec）

少なくともプロバイダーファミリーごとに1つは選んでください:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると望ましい）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを1つ選択）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しはAPIモードに依存）

### Vision: 画像送信（添付 → マルチモーダルメッセージ）

`OPENCLAW_LIVE_GATEWAY_MODELS` に少なくとも1つの画像対応モデル（Claude/Gemini/OpenAIのVision対応バリアントなど）を含めて、imageプローブを実行してください。

### アグリゲーター / 代替Gateway

キーを有効にしている場合、以下を通じたテストにも対応しています:

- OpenRouter: `openrouter/...`（数百のモデル。`openclaw models scan` を使ってツール+image対応候補を見つけてください）
- OpenCode: Zen用の `opencode/...` および Go用の `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

ライブマトリクスに含められるその他のプロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）、および任意のOpenAI/Anthropic互換プロキシ（LM Studio、vLLM、LiteLLMなど）

ヒント: ドキュメントに「すべてのモデル」をハードコードしようとしないでください。権威ある一覧は、あなたの環境で `discoverModels(...)` が返すもの + 利用可能なキーです。

## 認証情報（絶対にコミットしない）

ライブテストは、CLIと同じ方法で認証情報を検出します。実際上の意味は次のとおりです:

- CLIが動作するなら、ライブテストも同じキーを見つけられるはずです。
- ライブテストが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするときと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（これがライブテストでいう「プロファイルキー」です）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 従来のstateディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームにコピーされますが、メインのプロファイルキーストアではありません）
- ライブのローカル実行では、アクティブな設定、エージェントごとの `auth-profiles.json` ファイル、従来の `credentials/`、およびサポートされる外部CLI認証ディレクトリを、デフォルトで一時的なテストホームへコピーします。ステージングされたライブホームでは `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きも除去されるため、プローブが実際のホストワークスペースに触れません。

環境変数キー（例: `~/.profile` でexportしているもの）に依存したい場合は、ローカルテストを `source ~/.profile` 後に実行するか、以下のDockerランナーを使用してください（`~/.profile` をコンテナにマウントできます）。

## Deepgramライブ（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlusコーディングプランライブ

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUIワークフローメディアライブ

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドルされたcomfy画像、動画、`music_generate` パスを実行します
  - `models.providers.comfy.<capability>` が設定されていない限り、各機能をスキップします
  - comfyワークフローの送信、ポーリング、ダウンロード、またはPlugin登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成プロバイダーPluginを列挙します
  - プローブ前に、欠けているプロバイダー環境変数をログインシェル（`~/.profile`）から読み込みます
  - デフォルトでは、保存済み認証プロファイルよりもライブ/環境変数APIキーを優先して使用するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 共有ランタイム機能を通じて、標準の画像生成バリアントを実行します:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済みプロバイダー:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成プロバイダーパスを実行します
  - 現在はGoogleとMiniMaxをカバーします
  - プローブ前に、プロバイダー環境変数をログインシェル（`~/.profile`）から読み込みます
  - デフォルトでは、保存済み認証プロファイルよりもライブ/環境変数APIキーを優先して使用するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します:
    - プロンプトのみの入力による `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別のComfyライブファイルであり、この共有スイープではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成プロバイダーパスを実行します
  - デフォルトではリリース安全なスモークパスを使用します: 非FALプロバイダー、プロバイダーごとに1件のtext-to-videoリクエスト、1秒のロブスタープロンプト、さらに `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）によるプロバイダーごとの操作上限
  - FALは、プロバイダー側のキュー待ち遅延がリリース時間を支配しうるため、デフォルトではスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前に、プロバイダー環境変数をログインシェル（`~/.profile`）から読み込みます
  - デフォルトでは、保存済み認証プロファイルよりもライブ/環境変数APIキーを優先して使用するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言済みの変換モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、かつ選択したプロバイダー/モデルが共有スイープでバッファベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、かつ選択したプロバイダー/モデルが共有スイープでバッファベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在「宣言されているがスキップされる」 `imageToVideo` プロバイダー:
    - `vydra`。バンドル済みの `veo3` はtext-onlyで、バンドル済みの `kling` はリモート画像URLを必要とするため
  - Vydra固有のプロバイダーカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルでは、`veo3` のtext-to-videoに加え、デフォルトでリモート画像URLフィクスチャを使用する `kling` レーンを実行します
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在「宣言されているがスキップされる」 `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`。これらのパスは現在、リモートの `http(s)` / MP4参照URLを必要とするため
    - `google`。現在の共有Gemini/Veoレーンはローカルのバッファベース入力を使用しており、そのパスは共有スイープでは受け付けられないため
    - `openai`。現在の共有レーンには、組織固有の動画インペイント/リミックスアクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` ですべてのプロバイダーをデフォルトスイープに含めます（FALを含む）
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` で、積極的なスモーク実行のために各プロバイダー操作上限を短縮します
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画のライブスイートを、リポジトリ標準の単一エントリポイントで実行します
  - 不足しているプロバイダー環境変数を `~/.profile` から自動読み込みします
  - デフォルトで、現在利用可能な認証を持つプロバイダーに各スイートを自動で絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeatとquietモードの動作に一貫性があります
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) — ユニット、統合、QA、およびDockerスイート
