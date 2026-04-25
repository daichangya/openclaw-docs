---
read_when:
    - '`openclaw onboard` の詳細な動作が必要です'
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合しています
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/model セットアップ、出力、内部動作の完全なリファレンス
title: CLI セットアップ リファレンス
x-i18n:
    generated_at: "2026-04-25T13:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドについては、[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードで行うこと

ローカルモード（デフォルト）では、次の内容を案内します。

- モデルと認証のセットアップ（OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、さらに MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway のオプション）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（port、bind、auth、Tailscale）
- channels と providers（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、およびその他の同梱 channel Plugin）
- デーモンのインストール（LaunchAgent、systemd user unit、またはネイティブ Windows Scheduled Task。Startup フォルダへのフォールバックあり）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンが別の場所にある gateway に接続するよう設定します。
リモートホストには何もインストールせず、変更も加えません。

## ローカルフローの詳細

<Steps>
  <Step title="既存 config の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、Keep、Modify、Reset から選択します。
    - ウィザードを再実行しても、明示的に Reset を選ばない限り（または `--reset` を渡さない限り）何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには `--reset-scope full` を使います。
    - config が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使い、次のスコープを提供します。
      - Config のみ
      - Config + credentials + sessions
      - 完全リセット（ワークスペースも削除）
  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace`（変更可能）。
    - 初回実行のブートストラップ手順に必要なワークスペースファイルを初期投入します。
    - ワークスペースレイアウト: [Agent workspace](/ja-JP/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - port、bind、auth mode、Tailscale 公開を確認します。
    - 推奨: loopback だけの場合でも token auth を有効にしたままにして、ローカル WS クライアントにも認証を必須にします。
    - token mode では、対話セットアップで次を選べます。
      - **Generate/store plaintext token**（デフォルト）
      - **Use SecretRef**（任意選択）
    - password mode でも、対話セットアップは plaintext または SecretRef の保存をサポートします。
    - 非対話 token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に、空でない env var が必要です。
      - `--gateway-token` とは併用できません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ auth を無効にしてください。
    - non-loopback bind では引き続き auth が必要です。
  </Step>
  <Step title="Channels">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot token
    - [Discord](/ja-JP/channels/discord): bot token
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/ja-JP/channels/mattermost): bot token + base URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + account config
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessage に推奨。server URL + password + webhook
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードが送信されます。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使います。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス環境ではカスタム LaunchDaemon を使ってください（同梱されていません）。
    - Linux と Windows via WSL2: systemd user unit
      - ログアウト後も gateway が動作し続けるよう、ウィザードは `loginctl enable-linger <user>` を試みます。
      - sudo を求められることがあります（`/var/lib/systemd/linger` に書き込み）。まず sudo なしで試行します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザー単位の Startup フォルダのログイン項目にフォールバックし、gateway を即座に起動します。
      - Scheduled Tasks のほうが supervisor status をより適切に提供できるため、引き続き推奨されます。
    - ランタイム選択: Node（推奨。WhatsApp と Telegram には必須）。Bun は推奨されません。
  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、サポートされる場合は channel probe を含むライブ gateway health probe を status 出力に追加します。
  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node manager として npm、pnpm、bun を選べます。
    - 任意の依存関係をインストールします（macOS では Homebrew を使うものもあります）。
  </Step>
  <Step title="完了">
    - iOS、Android、macOS app の選択肢を含む、要約と次のステップを表示します。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザを開く代わりに、Control UI 用の SSH ポートフォワード手順を表示します。
Control UI アセットがない場合、ウィザードはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンが別の場所にある gateway に接続するよう設定します。

<Info>
リモートモードは、リモートホストに何もインストールせず、変更も加えません。
</Info>

設定する内容:

- リモート gateway URL（`ws://...`）
- リモート gateway auth が必要な場合の token（推奨）

<Note>
- gateway が loopback のみの場合は、SSH トンネルまたは tailnet を使ってください。
- Discovery ヒント:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY` があればそれを使い、なければキーの入力を求め、その後デーモン利用のために保存します。
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    ブラウザフローです。`code#state` を貼り付けます。

    model が未設定、またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    短命な device code を使うブラウザペアリングフローです。

    model が未設定、またはすでに OpenAI ファミリーの場合、`agents.defaults.model` を `openai-codex/gpt-5.5` に設定します。

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY` があればそれを使い、なければキーの入力を求め、その後認証プロファイルに認証情報を保存します。

    model が未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY` の入力を求め、xAI をモデル provider として設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen または Go カタログを選択できます。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key (generic)">
    キーを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID、gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    config は自動で書き込まれます。ホスト型のデフォルトは `MiniMax-M2.7` です。API キーセットアップでは
    `minimax/...` を使い、OAuth セットアップでは `minimax-portal/...` を使います。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    China または global endpoint 上の StepFun standard または Step Plan 用に config が自動で書き込まれます。
    現在、standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    最初に `Cloud + Local`、`Cloud only`、`Local only` を確認します。
    `Cloud only` は `OLLAMA_API_KEY` と `https://ollama.com` を使います。
    host ベースのモードでは base URL（デフォルトは `http://127.0.0.1:11434`）を確認し、利用可能なモデルを検出して、デフォルトを提案します。
    `Cloud + Local` では、その Ollama ホストが cloud access 用にサインイン済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot（Kimi K2）と Kimi Coding の config は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI 互換および Anthropic 互換 endpoint で動作します。

    対話オンボーディングは、他の provider API キーフローと同じ API キー保存方法をサポートします。
    - **Paste API key now**（plaintext）
    - **Use secret reference**（env ref または設定済み provider ref。事前検証あり）

    非対話フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。`CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。デフォルトは `openai`）

  </Accordion>
  <Accordion title="Skip">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

model の動作:

- 検出された選択肢からデフォルト model を選ぶか、provider と model を手入力します。
- オンボーディングが provider 認証の選択から始まる場合、model picker は自動的にその provider を優先します。Volcengine と BytePlus では、この同じ優先設定はその coding-plan バリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- その優先 provider フィルターが空になる場合、model picker はモデルが 0 件と表示する代わりに完全なカタログへフォールバックします。
- ウィザードは model チェックを実行し、設定済み model が不明または認証不足の場合に警告します。

認証情報とプロファイルのパス:

- 認証プロファイル（API キー + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth import: `~/.openclaw/credentials/oauth.json`

認証情報の保存モード:

- デフォルトのオンボーディング動作では、API キーは plaintext 値として認証プロファイルに保存されます。
- `--secret-input-mode ref` を指定すると、plaintext キー保存の代わりに参照モードが有効になります。
  対話セットアップでは、次のいずれかを選べます。
  - 環境変数 ref（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - provider alias + id を持つ設定済み provider ref（`file` または `exec`）
- 対話参照モードでは、保存前に高速な事前検証を実行します。
  - Env ref: 現在のオンボーディング環境で変数名と空でない値を検証します。
  - Provider ref: provider config を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。
- 非対話モードでは、`--secret-input-mode ref` は env ベースのみです。
  - オンボーディングプロセス環境に provider env var を設定してください。
  - インラインキーフラグ（例: `--openai-api-key`）では、その env var が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
  - custom provider では、非対話 `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - その custom-provider の場合、`--custom-api-key` を使うには `CUSTOM_API_KEY` が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
- Gateway auth 認証情報は、対話セットアップで plaintext と SecretRef の両方をサポートします。
  - Token mode: **Generate/store plaintext token**（デフォルト）または **Use SecretRef**。
  - Password mode: plaintext または SecretRef。
- 非対話 token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存の plaintext セットアップも、変更なしで引き続き動作します。

<Note>
ヘッドレス環境やサーバー環境のヒント: ブラウザがあるマシンで OAuth を完了し、そのエージェントの `auth-profiles.json`（例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を gateway ホストにコピーしてください。`credentials/oauth.json`
はレガシー import ソースにすぎません。
</Note>

## 出力と内部動作

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `--skip-bootstrap` が渡された場合は `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`（MiniMax を選択した場合）
- `tools.profile`（ローカルオンボーディングでは未設定時にデフォルトで `"coding"`。既存の明示値は保持されます）
- `gateway.*`（mode、bind、auth、Tailscale）
- `session.dmScope`（ローカルオンボーディングでは未設定時にデフォルトで `per-channel-peer`。既存の明示値は保持されます）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中に任意選択した場合の channel allowlist（Slack、Discord、Matrix、Microsoft Teams）。可能な場合は名前が ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、`bun` を受け付けます。
  - 手動 config では後から `skills.install.nodeManager: "yarn"` を設定することも可能です。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に置かれます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

<Note>
一部の channel は Plugin として提供されます。セットアップ中にそれらを選択すると、ウィザードは channel 設定の前に、その Plugin をインストールするよう求めます（npm またはローカルパス）。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS app と Control UI）は、オンボーディングロジックを再実装せずにステップを描画できます。

Signal セットアップの動作:

- 適切なリリースアセットをダウンロードする
- `~/.openclaw/tools/signal-cli/<version>/` の下に保存する
- config に `channels.signal.cliPath` を書き込む
- JVM ビルドには Java 21 が必要
- 利用可能な場合はネイティブビルドを使う
- Windows は WSL2 を使い、WSL 内で Linux の signal-cli フローに従う

## 関連 docs

- オンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI Automation](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
