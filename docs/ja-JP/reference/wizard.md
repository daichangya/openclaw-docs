---
read_when:
    - 特定のオンボーディング手順やフラグを調べるとき
    - 非対話モードでオンボーディングを自動化するとき
    - オンボーディングの挙動をデバッグするとき
sidebarTitle: Onboarding Reference
summary: 'CLIオンボーディングの完全なリファレンス: すべてのステップ、フラグ、設定フィールド'
title: オンボーディング リファレンス
x-i18n:
    generated_at: "2026-04-05T12:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# オンボーディング リファレンス

これは `openclaw onboard` の完全なリファレンスです。
高レベルの概要については、[Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

## フロー詳細（ローカルモード）

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**Keep / Modify / Reset** を選択します。
    - オンボーディングを再実行しても、明示的に **Reset** を選ばない限り
      （または `--reset` を渡さない限り）何も消去されません。
    - CLIの `--reset` はデフォルトで `config+creds+sessions` です。workspaceも削除するには
      `--reset-scope full` を使用します。
    - 設定が無効であるかレガシーキーを含んでいる場合、ウィザードは停止し、
      続行前に `openclaw doctor` を実行するよう求めます。
    - Reset は `trash` を使用し（`rm` は決して使いません）、次のスコープを提供します:
      - Configのみ
      - Config + credentials + sessions
      - 完全リセット（workspaceも削除）
  </Step>
  <Step title="モデル/認証">
    - **Anthropic APIキー**: 存在する場合は `ANTHROPIC_API_KEY` を使用し、なければキーの入力を求めたうえで、デーモン利用のために保存します。
    - **Anthropic Claude CLI**: オンボーディング/設定で推奨されるAnthropicアシスタントの選択肢です。macOSではオンボーディング時にKeychain項目「Claude Code-credentials」を確認します（launchd起動がブロックされないよう「Always Allow」を選んでください）。Linux/Windowsでは、存在する場合 `~/.claude/.credentials.json` を再利用し、モデル選択を正規の `claude-cli/claude-*` 参照に切り替えます。
    - **Anthropic setup-token（レガシー/手動）**: オンボーディング/設定で再び利用可能ですが、AnthropicはOpenClawユーザーに対し、OpenClawのClaudeログイン経路はサードパーティ製ハーネス利用として扱われるため、Claudeアカウントで **Extra Usage** が必要だと案内しています。
    - **OpenAI Code (Codex) subscription（Codex CLI）**: `~/.codex/auth.json` が存在する場合、オンボーディングで再利用できます。再利用されたCodex CLI認証情報は引き続きCodex CLIによって管理されます。期限切れ時には、OpenClawはまずそのソースを再読込し、プロバイダー側で更新可能な場合は、自身で所有権を持つのではなく、更新済み認証情報をCodexストレージへ書き戻します。
    - **OpenAI Code (Codex) subscription（OAuth）**: ブラウザーフローです。`code#state` を貼り付けてください。
      - モデルが未設定、または `openai/*` の場合、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。
    - **OpenAI APIキー**: 存在する場合は `OPENAI_API_KEY` を使用し、なければキーの入力を求めたうえで、auth profileに保存します。
      - モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.4` に設定します。
    - **xAI（Grok）APIキー**: `XAI_API_KEY` の入力を求め、xAIをモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`、取得先は https://opencode.ai/auth）を求め、ZenカタログまたはGoカタログを選択できます。
    - **Ollama**: OllamaのベースURLを求め、**Cloud + Local** または **Local** モードを提示し、利用可能なモデルを検出し、必要に応じて選択したローカルモデルを自動でpullします。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **APIキー**: キーを保存します。
    - **Vercel AI Gateway（マルチモデルプロキシ）**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID、Gateway ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれます。ホスト版のデフォルトは `MiniMax-M2.7` です。
      APIキー設定では `minimax/...` を使用し、OAuth設定では
      `minimax-portal/...` を使用します。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: 中国またはグローバルのエンドポイント上のStepFun standardまたはStep Plan向けに、設定が自動で書き込まれます。
    - Standardには現在 `step-3.5-flash` が含まれ、Step Planには `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic（Anthropic互換）**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot（Kimi K2）**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **Skip**: まだ認証は設定されません。
    - 検出された選択肢からデフォルトモデルを選ぶか（または provider/model を手動入力します）。最良の品質とより低いプロンプトインジェクションリスクのために、利用可能なプロバイダースタックの中で最も強力な最新世代モデルを選んでください。
    - オンボーディングはモデルチェックを実行し、設定されたモデルが不明であるか、認証が不足している場合に警告します。
    - APIキーストレージモードは、デフォルトで平文のauth-profile値です。代わりにenvベースの参照を保存するには `--secret-input-mode ref` を使用します（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - Auth profileは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（APIキー + OAuth）。`~/.openclaw/credentials/oauth.json` はレガシーのインポート専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバー向けのヒント: ブラウザーのあるマシンでOAuthを完了し、その
    エージェントの `auth-profiles.json` を（たとえば
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` のパスから）Gatewayホストへコピーしてください。`credentials/oauth.json`
    はレガシーのインポート元にすぎません。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` です（変更可能）。
    - エージェントのブートストラップ儀式に必要なworkspaceファイルを初期配置します。
    - 完全なworkspaceレイアウトとバックアップガイド: [Agent workspace](/ja-JP/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - ポート、bind、認証モード、Tailscale公開。
    - 認証の推奨: loopbackであっても **Token** を維持し、ローカルWSクライアントにも認証を必須にしてください。
    - tokenモードでは、対話型セットアップで次を選べます:
      - **平文トークンを生成して保存**（デフォルト）
      - **SecretRefを使用**（オプトイン）
      - Quickstart は、オンボーディングのプローブ/ダッシュボードブートストラップのために、`env`、`file`、`exec` プロバイダー全体で既存の `gateway.auth.token` SecretRef を再利用します。
      - そのSecretRefが設定されていても解決できない場合、オンボーディングはランタイム認証を黙って劣化させるのではなく、明確な修正メッセージを出して早期に失敗します。
    - passwordモードでも、対話型セットアップは平文またはSecretRef保存をサポートします。
    - 非対話型のtoken SecretRefパス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない環境変数が必要です。
      - `--gateway-token` と併用できません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ認証を無効にしてください。
    - 非loopback bindでも認証は必須です。
  </Step>
  <Step title="チャネル">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意のQRログイン。
    - [Telegram](/ja-JP/channels/telegram): bot token。
    - [Discord](/ja-JP/channels/discord): bot token。
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost)（plugin）: bot token + base URL。
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定。
    - [BlueBubbles](/ja-JP/channels/bluebubbles): **iMessageには推奨**。server URL + password + webhook。
    - [iMessage](/ja-JP/channels/imessage): レガシーの `imsg` CLIパス + DBアクセス。
    - DMセキュリティ: デフォルトはペアリングです。最初のDMでコードが送られます。`openclaw pairing approve <channel> <code>` で承認するか、allowlistを使用します。
  </Step>
  <Step title="ウェブ検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などのサポート対象プロバイダーを選択します（またはスキップします）。
    - APIベースのプロバイダーは、クイックセットアップのためにenv varまたは既存設定を使用できます。キーレスのプロバイダーは、それぞれの前提条件を使用します。
    - `--skip-search` でスキップします。
    - 後で設定: `openclaw configure --section web`。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みのユーザーセッションが必要です。ヘッドレス用途では、カスタムLaunchDaemonを使用してください（同梱されていません）。
    - Linux（およびWSL2経由のWindows）: systemd user unit
      - オンボーディングは `loginctl enable-linger <user>` を有効にして、ログアウト後もGatewayが稼働し続けるよう試みます。
      - sudoを求められる場合があります（`/var/lib/systemd/linger` に書き込みます）。まずsudoなしで試します。
    - **ランタイム選択:** Node（推奨。WhatsApp/Telegramに必要）。Bun は **推奨されません**。
    - token認証でトークンが必要かつ `gateway.auth.token` がSecretRef管理の場合、デーモンのインストール時にそれを検証しますが、解決済み平文トークン値をsupervisorサービスの環境メタデータには永続化しません。
    - token認証でトークンが必要かつ設定されたtoken SecretRefが未解決の場合、デーモンのインストールは実行可能な案内付きでブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じてGatewayを起動し、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、サポートされている場合はチャネルプローブも含めて、ライブのGatewayヘルスプローブをstatus出力に追加します（到達可能なGatewayが必要です）。
  </Step>
  <Step title="Skills（推奨）">
    - 利用可能なSkillsを読み取り、要件を確認します。
    - ノードマネージャーを選択できます: **npm / pnpm**（bunは推奨されません）。
    - 任意の依存関係をインストールします（一部はmacOSでHomebrewを使用します）。
  </Step>
  <Step title="完了">
    - 追加機能向けのiOS/Android/macOSアプリを含む、要約と次のステップを表示します。
  </Step>
</Steps>

<Note>
GUIが検出されない場合、オンボーディングはブラウザーを開く代わりに、Control UI用のSSHポートフォワード手順を表示します。
Control UIアセットが欠けている場合、オンボーディングはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI依存関係を自動インストールします）。
</Note>

## 非対話モード

オンボーディングを自動化またはスクリプト化するには `--non-interactive` を使用します:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読なサマリーには `--json` を追加します。

非対話モードでのGateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互排他的です。

<Note>
`--json` は **非対話モードを意味しません**。スクリプトでは `--non-interactive`（および `--workspace`）を使用してください。
</Note>

プロバイダー固有のコマンド例は [CLI Automation](/start/wizard-cli-automation#provider-specific-examples) にあります。
このリファレンスページは、フラグの意味とステップ順序を確認するために使用してください。

### エージェントを追加（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## GatewayウィザードRPC

Gatewayは、RPC（`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`）を通じてオンボーディングフローを公開します。
クライアント（macOSアプリ、Control UI）は、オンボーディングロジックを再実装することなくステップを描画できます。

## Signalセットアップ（signal-cli）

オンボーディングはGitHub releasesから `signal-cli` をインストールできます:

- 適切なrelease assetをダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` に保存します。
- 設定に `channels.signal.cliPath` を書き込みます。

注意:

- JVMビルドには **Java 21** が必要です。
- 利用可能な場合はネイティブビルドが使用されます。
- WindowsはWSL2を使用します。signal-cliのインストールはWSL内でLinuxフローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の代表的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMaxを選択した場合）
- `tools.profile`（ローカルオンボーディングでは未設定時に `"coding"` をデフォルトにします。既存の明示値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（挙動の詳細: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- プロンプト中にオプトインした場合のチャネルallowlist（Slack/Discord/Matrix/Microsoft Teams）。可能であれば名前はIDに解決されます。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで引き続き `yarn` を使用できます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` に保存されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` に保存されます。

一部のチャネルはpluginとして提供されます。セットアップ中にそれらを選択すると、オンボーディングは
設定できるようにする前に、そのインストール（npmまたはローカルパス）を求めます。

## 関連ドキュメント

- オンボーディング概要: [Onboarding (CLI)](/ja-JP/start/wizard)
- macOSアプリのオンボーディング: [Onboarding](/start/onboarding)
- 設定リファレンス: [Gateway configuration](/ja-JP/gateway/configuration)
- プロバイダー: [WhatsApp](/ja-JP/channels/whatsapp), [Telegram](/ja-JP/channels/telegram), [Discord](/ja-JP/channels/discord), [Google Chat](/ja-JP/channels/googlechat), [Signal](/ja-JP/channels/signal), [BlueBubbles](/ja-JP/channels/bluebubbles)（iMessage）, [iMessage](/ja-JP/channels/imessage)（レガシー）
- Skills: [Skills](/tools/skills), [Skills config](/tools/skills-config)
