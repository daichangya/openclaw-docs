---
read_when:
    - '`openclaw onboard` の詳細な動作が必要である'
    - オンボーディング結果をデバッグしている、またはオンボーディングクライアントを統合している
sidebarTitle: CLI reference
summary: CLI セットアップフロー、認証/モデル設定、出力、内部仕様の完全リファレンス
title: CLI セットアップリファレンス
x-i18n:
    generated_at: "2026-04-05T12:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLI セットアップリファレンス

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドについては、[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード（既定）では、次の内容を順に案内します:

- モデルと認証のセットアップ（OpenAI Code サブスクリプション OAuth、Anthropic Claude CLI または API キー、加えて MiniMax、GLM、Ollama、Moonshot、StepFun、AI Gateway の各オプション）
- ワークスペースの場所とブートストラップファイル
- Gateway 設定（port、bind、auth、tailscale）
- チャンネルとプロバイダー（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、およびその他のバンドル済み channel plugins）
- デーモンのインストール（LaunchAgent、systemd user unit、またはネイティブ Windows Scheduled Task。Startup-folder フォールバックあり）
- ヘルスチェック
- Skills のセットアップ

リモートモードでは、このマシンが別の場所にある gateway に接続するよう設定します。
リモートホスト上のものはインストールも変更も行いません。

## ローカルフローの詳細

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合、Keep、Modify、または Reset を選択します。
    - ウィザードを再実行しても、明示的に Reset を選ばない限り（または `--reset` を渡さない限り）、何も消去されません。
    - CLI の `--reset` は既定で `config+creds+sessions` です。workspace も削除するには `--reset-scope full` を使用してください。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使用し、次のスコープを提供します:
      - Config のみ
      - Config + credentials + sessions
      - 完全リセット（workspace も削除）
  </Step>
  <Step title="モデルと認証">
    - 完全なオプション一覧は [認証とモデルのオプション](#auth-and-model-options) にあります。
  </Step>
  <Step title="ワークスペース">
    - 既定は `~/.openclaw/workspace`（変更可能）。
    - 初回実行のブートストラップ儀式に必要な workspace files を配置します。
    - ワークスペースレイアウト: [Agent workspace](/ja-JP/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - port、bind、auth モード、tailscale 公開を尋ねます。
    - 推奨: loopback であっても token 認証を有効のままにし、ローカル WS クライアントにも認証を必須にしてください。
    - token モードでは、対話型セットアップで次を提供します:
      - **平文 token を生成して保存**（既定）
      - **SecretRef を使用**（オプトイン）
    - password モードでも、対話型セットアップは平文または SecretRef 保存をサポートします。
    - 非対話型の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない env var が必要です。
      - `--gateway-token` とは併用できません。
    - 認証を無効にするのは、すべてのローカルプロセスを完全に信頼している場合だけにしてください。
    - 非 loopback bind でも認証は必須です。
  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン
    - [Telegram](/ja-JP/channels/telegram): bot token
    - [Discord](/ja-JP/channels/discord): bot token
    - [Google Chat](/ja-JP/channels/googlechat): サービスアカウント JSON + webhook audience
    - [Mattermost](/ja-JP/channels/mattermost): bot token + base URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessage に推奨。server URL + password + webhook
    - [iMessage](/ja-JP/channels/imessage): レガシー `imsg` CLI パス + DB アクセス
    - DM セキュリティ: 既定はペアリングです。最初の DM でコードが送信されます。`openclaw pairing approve <channel> <code>` で承認するか、allowlists を使用してください。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレス用途では、カスタム LaunchDaemon を使用してください（同梱されていません）。
    - Linux および WSL2 経由の Windows: systemd user unit
      - gateway がログアウト後も稼働し続けるよう、ウィザードは `loginctl enable-linger <user>` を試みます。
      - sudo の入力を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。まず sudo なしで試します。
    - ネイティブ Windows: まず Scheduled Task
      - タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup-folder ログイン項目にフォールバックし、直ちに gateway を起動します。
      - Scheduled Task のほうが supervisor 状態をよりよく提供するため、引き続き推奨です。
    - ランタイム選択: Node（推奨。WhatsApp と Telegram に必須）。bun は推奨されません。
  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて gateway を起動し、`openclaw health` を実行します。
    - `openclaw status --deep` は、対応時には channel probes を含むライブ gateway health probe をステータス出力に追加します。
  </Step>
  <Step title="Skills">
    - 利用可能な Skills を読み取り、要件を確認します。
    - node manager として npm、pnpm、または bun を選択できます。
    - 任意の依存関係をインストールします（一部は macOS で Homebrew を使用します）。
  </Step>
  <Step title="完了">
    - iOS、Android、macOS app の各オプションを含むサマリーと次のステップを表示します。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザを開く代わりに、Control UI 用の SSH ポートフォワード手順を表示します。
Control UI のアセットが不足している場合、ウィザードはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードでは、このマシンが別の場所にある gateway に接続するよう設定します。

<Info>
リモートモードは、リモートホスト上のものをインストールも変更も行いません。
</Info>

設定する内容:

- リモート gateway URL（`ws://...`）
- リモート gateway 認証が必要な場合の token（推奨）

<Note>
- gateway が loopback-only の場合は、SSH トンネリングまたは tailnet を使用してください。
- 検出のヒント:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在すればそれを使用し、なければキー入力を求めてから、デーモンで使えるよう保存します。
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    gateway host 上のローカル Claude CLI ログインを再利用し、モデル選択を
    標準的な `claude-cli/claude-*` 参照に切り替えます。

    これは `openclaw onboard` と
    `openclaw configure` で利用可能なローカルのフォールバック経路です。本番環境では Anthropic API キーを推奨します。

    - macOS: Keychain 項目「Claude Code-credentials」を確認
    - Linux と Windows: `~/.claude/.credentials.json` が存在すれば再利用

    macOS では、「Always Allow」を選択して、launchd による起動がブロックされないようにしてください。

  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（Codex CLI 再利用）">
    `~/.codex/auth.json` が存在する場合、ウィザードはそれを再利用できます。
    再利用された Codex CLI 資格情報は引き続き Codex CLI によって管理されます。期限切れ時には OpenClaw が
    まずそのソースを再読み込みし、プロバイダー側で更新可能な場合は、
    自身で所有するのではなく、更新された資格情報を Codex ストレージへ書き戻します。
  </Accordion>
  <Accordion title="OpenAI Code サブスクリプション（OAuth）">
    ブラウザフローです。`code#state` を貼り付けます。

    モデルが未設定または `openai/*` の場合、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在すればそれを使用し、なければキー入力を求めてから、資格情報を auth profiles に保存します。

    モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="xAI（Grok）API キー">
    `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）の入力を求め、Zen カタログまたは Go カタログを選択できます。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API キー（汎用）">
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
    設定は自動で書き込まれます。ホスト型の既定値は `MiniMax-M2.7` です。API キーセットアップでは
    `minimax/...` を使用し、OAuth セットアップでは `minimax-portal/...` を使用します。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    設定は、中国またはグローバルエンドポイント向けの StepFun standard または Step Plan に対して自動で書き込まれます。
    現在、Standard には `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 互換）">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloud とローカルのオープンモデル）">
    base URL（既定 `http://127.0.0.1:11434`）の入力を求め、その後 Cloud + Local または Local モードを選べます。
    利用可能なモデルを検出し、既定候補を提案します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot と Kimi Coding">
    Moonshot（Kimi K2）および Kimi Coding の設定は自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムプロバイダー">
    OpenAI 互換および Anthropic 互換エンドポイントで動作します。

    対話型オンボーディングでは、他のプロバイダー API キーフローと同じ API キー保存方法をサポートします:
    - **今すぐ API キーを貼り付ける**（平文）
    - **secret reference を使用**（env ref または設定済み provider ref。事前検証あり）

    非対話型フラグ:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。`CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。既定は `openai`）

  </Accordion>
  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作:

- 検出されたオプションから既定モデルを選択するか、provider と model を手動で入力します。
- オンボーディングが provider 認証の選択から始まる場合、モデルピッカーは
  その provider を自動的に優先します。Volcengine と BytePlus については、この優先設定は
  それらの coding-plan バリアント（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- その provider 優先フィルターで空になる場合、モデルピッカーは
  モデルが 0 件と表示する代わりにフルカタログへフォールバックします。
- ウィザードはモデルチェックを実行し、設定されたモデルが不明または認証不足の場合は警告します。

資格情報とプロファイルのパス:

- Auth profiles（API キー + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- レガシー OAuth インポート: `~/.openclaw/credentials/oauth.json`

資格情報の保存モード:

- 既定のオンボーディング動作では、API キーを auth profiles に平文値として永続化します。
- `--secret-input-mode ref` は、平文キー保存の代わりに参照モードを有効にします。
  対話型セットアップでは、次のいずれかを選べます:
  - 環境変数 ref（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 設定済み provider ref（`file` または `exec`）と provider alias + id
- 対話型の参照モードでは、保存前に高速な事前検証を実行します。
  - Env refs: 現在のオンボーディング環境内で、変数名と空でない値を検証します。
  - Provider refs: provider 設定を検証し、要求された id を解決します。
  - 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。
- 非対話型モードでは、`--secret-input-mode ref` は env ベースのみです。
  - プロバイダー env var をオンボーディングプロセス環境に設定してください。
  - インラインのキーフラグ（例: `--openai-api-key`）では、その env var が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
  - カスタムプロバイダーでは、非対話型 `ref` モードは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - このカスタムプロバイダーのケースでは、`--custom-api-key` を使うには `CUSTOM_API_KEY` が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
- Gateway 認証資格情報は、対話型セットアップで平文と SecretRef の両方をサポートします:
  - Token モード: **平文 token を生成して保存**（既定）または **SecretRef を使用**。
  - Password モード: 平文または SecretRef。
- 非対話型の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
- 既存の平文セットアップも、変更なしで引き続き動作します。

<Note>
ヘッドレス環境およびサーバー向けのヒント: ブラウザのあるマシンで OAuth を完了し、その後、
そのエージェントの `auth-profiles.json`（たとえば
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` パス）を gateway host にコピーしてください。`credentials/oauth.json`
はレガシーなインポート元にすぎません。
</Note>

## 出力と内部仕様

`~/.openclaw/openclaw.json` の典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（Minimax を選択した場合）
- `tools.profile`（ローカルのオンボーディングでは、未設定時にこれを `"coding"` に既定設定します。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（ローカルのオンボーディングでは、未設定時にこれを `per-channel-peer` に既定設定します。既存の明示的な値は保持されます）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合の channel allowlists（Slack、Discord、Matrix、Microsoft Teams）。可能な場合は名前が ID に解決されます
- `skills.install.nodeManager`
  - `setup --node-manager` フラグは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp の資格情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に置かれます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のチャンネルは plugins として提供されます。セットアップ中に選択した場合、ウィザードは
channel 設定の前に plugin のインストール（npm またはローカルパス）を求めます。
</Note>

Gateway ウィザード RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

クライアント（macOS app と Control UI）は、オンボーディングロジックを再実装せずにステップを描画できます。

Signal セットアップの挙動:

- 適切なリリースアセットをダウンロードします
- それを `~/.openclaw/tools/signal-cli/<version>/` 配下に保存します
- 設定に `channels.signal.cliPath` を書き込みます
- JVM ビルドには Java 21 が必要です
- 利用可能な場合はネイティブビルドが使用されます
- Windows では WSL2 を使用し、WSL 内で Linux の signal-cli フローに従います

## 関連ドキュメント

- オンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- 自動化とスクリプト: [CLI Automation](/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
