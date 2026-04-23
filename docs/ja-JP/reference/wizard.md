---
read_when:
    - 特定のオンボーディング手順やフラグを調べること
    - 非対話モードでオンボーディングを自動化すること
    - オンボーディング動作のデバッグ
sidebarTitle: Onboarding Reference
summary: 'CLI オンボーディングの完全リファレンス: すべての手順、フラグ、および設定フィールド'
title: オンボーディングリファレンス
x-i18n:
    generated_at: "2026-04-23T04:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# オンボーディングリファレンス

これは `openclaw onboard` の完全リファレンスです。
高レベルな概要については、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。

## フロー詳細（ローカルモード）

<Steps>
  <Step title="既存設定の検出">
    - `~/.openclaw/openclaw.json` が存在する場合、**Keep / Modify / Reset** を選択します。
    - オンボーディングを再実行しても、明示的に **Reset** を選ばない限り
      （または `--reset` を渡さない限り）、何も消去されません。
    - CLI の `--reset` はデフォルトで `config+creds+sessions` です。ワークスペースも削除するには
      `--reset-scope full` を使ってください。
    - 設定が無効、またはレガシーキーを含む場合、ウィザードは停止し、
      続行前に `openclaw doctor` を実行するよう求めます。
    - Reset では `trash` を使い（`rm` は決して使いません）、次のスコープを提供します:
      - 設定のみ
      - 設定 + 認証情報 + セッション
      - フルリセット（ワークスペースも削除）
  </Step>
  <Step title="モデル/認証">
    - **Anthropic API key**: `ANTHROPIC_API_KEY` が存在すればそれを使用し、なければキーの入力を求め、その後デーモン利用のために保存します。
    - **Anthropic API key**: オンボーディング/設定で優先される Anthropic assistant の選択肢です。
    - **Anthropic setup-token**: 引き続きオンボーディング/設定で利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用を優先します。
    - **OpenAI Code (Codex) subscription (OAuth)**: ブラウザフロー。`code#state` を貼り付けます。
      - モデルが未設定または `openai/*` の場合、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。
    - **OpenAI Code (Codex) subscription (device pairing)**: 短命なデバイスコードを使うブラウザペアリングフローです。
      - モデルが未設定または `openai/*` の場合、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。
    - **OpenAI API key**: `OPENAI_API_KEY` が存在すればそれを使用し、なければキーの入力を求め、その後 auth profile に保存します。
      - モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.4` に設定します。
    - **xAI (Grok) API key**: `XAI_API_KEY` の入力を求め、xAI をモデルプロバイダーとして設定します。
    - **OpenCode**: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`、取得先は https://opencode.ai/auth）の入力を求め、Zen または Go カタログを選択できます。
    - **Ollama**: 最初に **Cloud + Local**、**Cloud only**、または **Local only** を提示します。`Cloud only` では `OLLAMA_API_KEY` を求めて `https://ollama.com` を使用します。ホスト利用モードでは Ollama のベース URL を求め、利用可能なモデルを検出し、必要に応じて選択したローカルモデルを自動 pull します。`Cloud + Local` では、その Ollama ホストが cloud access 用にサインイン済みかどうかも確認します。
    - 詳細: [Ollama](/ja-JP/providers/ollama)
    - **API key**: キーを保存します。
    - **Vercel AI Gateway (multi-model proxy)**: `AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID、Gateway ID、および `CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    - 詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)
    - **MiniMax**: 設定は自動で書き込まれ、ホスト版のデフォルトは `MiniMax-M2.7` です。
      API-key セットアップでは `minimax/...` を使い、OAuth セットアップでは
      `minimax-portal/...` を使います。
    - 詳細: [MiniMax](/ja-JP/providers/minimax)
    - **StepFun**: 中国またはグローバル endpoint 上の StepFun standard または Step Plan 用に設定が自動で書き込まれます。
    - Standard には現在 `step-3.5-flash` が含まれ、Step Plan には `step-3.5-flash-2603` も含まれます。
    - 詳細: [StepFun](/ja-JP/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: `SYNTHETIC_API_KEY` の入力を求めます。
    - 詳細: [Synthetic](/ja-JP/providers/synthetic)
    - **Moonshot (Kimi K2)**: 設定は自動で書き込まれます。
    - **Kimi Coding**: 設定は自動で書き込まれます。
    - 詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)
    - **Skip**: まだ認証は設定しません。
    - 検出された選択肢からデフォルトモデルを選ぶか、provider/model を手動入力します。最良の品質と、プロンプトインジェクションリスクの低減のため、利用可能な provider スタック内で最新世代の最も強力なモデルを選んでください。
    - オンボーディングではモデルチェックを実行し、設定されたモデルが不明または認証不足であれば警告します。
    - API キーの保存モードはデフォルトで平文の auth-profile 値です。代わりに env バックの参照を保存するには `--secret-input-mode ref` を使ってください（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - Auth profile は `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に保存されます（API キー + OAuth）。`~/.openclaw/credentials/oauth.json` はレガシーな import 専用です。
    - 詳細: [/concepts/oauth](/ja-JP/concepts/oauth)
    <Note>
    ヘッドレス/サーバーのヒント: ブラウザのあるマシンで OAuth を完了してから、
    そのエージェントの `auth-profiles.json`（たとえば
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
    `$OPENCLAW_STATE_DIR/...` パス）を gateway host にコピーしてください。`credentials/oauth.json`
    はレガシーな import ソースにすぎません。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルトは `~/.openclaw/workspace` です（設定変更可）。
    - エージェントのブートストラップ手順に必要なワークスペースファイルをシードします。
    - 完全なワークスペースレイアウト + バックアップガイド: [エージェントワークスペース](/ja-JP/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - ポート、bind、認証モード、Tailscale 公開。
    - 認証の推奨: loopback であっても **Token** を維持し、ローカル WS クライアントにも認証を必須にしてください。
    - token モードでは、対話セットアップで次を提供します:
      - **平文 token を生成して保存**（デフォルト）
      - **SecretRef を使用**（明示的に有効化）
      - Quickstart は、オンボーディングの probe/dashboard bootstrap のために、`env`、`file`、`exec` provider 全体で既存の `gateway.auth.token` SecretRef を再利用します。
      - その SecretRef が設定されているが解決できない場合、オンボーディングはランタイム認証を黙って劣化させるのではなく、明確な修正メッセージとともに早期失敗します。
    - password モードでは、対話セットアップでも平文または SecretRef 保存をサポートします。
    - 非対話の token SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディングプロセス環境内に空でない環境変数が必要です。
      - `--gateway-token` とは併用できません。
    - すべてのローカルプロセスを完全に信頼している場合にのみ認証を無効にしてください。
    - 非 loopback bind では引き続き認証が必要です。
  </Step>
  <Step title="Channels">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意の QR ログイン。
    - [Telegram](/ja-JP/channels/telegram): bot token。
    - [Discord](/ja-JP/channels/discord): bot token。
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + Webhook audience。
    - [Mattermost](/ja-JP/channels/mattermost)（Plugin）: bot token + ベース URL。
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` インストール + アカウント設定。
    - [BlueBubbles](/ja-JP/channels/bluebubbles): **iMessage には推奨**。server URL + password + Webhook。
    - [iMessage](/ja-JP/channels/imessage): レガシーな `imsg` CLI パス + DB アクセス。
    - DM セキュリティ: デフォルトはペアリングです。最初の DM でコードが送られます。`openclaw pairing approve <channel> <code>` で承認するか、allowlist を使用してください。
  </Step>
  <Step title="Web 検索">
    - Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily などのサポート対象 provider を選びます（またはスキップ）。
    - API 利用型 provider では env vars または既存設定をクイックセットアップに使えます。キー不要の provider では、それぞれの provider 固有の前提条件を使います。
    - `--skip-search` でスキップします。
    - 後で設定: `openclaw configure --section web`。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログイン済みユーザーセッションが必要です。ヘッドレスの場合はカスタム LaunchDaemon を使用してください（同梱されていません）。
    - Linux（および WSL2 経由の Windows）: systemd user unit
      - オンボーディングは `loginctl enable-linger <user>` を有効化して、ログアウト後も Gateway が起動し続けるよう試みます。
      - sudo を求める場合があります（`/var/lib/systemd/linger` に書き込みます）。まず sudo なしで試みます。
    - **ランタイム選択:** Node（推奨。WhatsApp/Telegram に必須）。Bun は**推奨されません**。
    - token 認証に token が必要で、`gateway.auth.token` が SecretRef 管理されている場合、デーモンインストールはそれを検証しますが、解決された平文 token 値を supervisor service の環境メタデータには保存しません。
    - token 認証に token が必要で、設定済み token SecretRef が未解決の場合、デーモンインストールは実行可能なガイダンス付きでブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンインストールはブロックされます。
  </Step>
  <Step title="ヘルスチェック">
    - 必要に応じて Gateway を起動し、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` を使うと、ライブ gateway ヘルス probe がステータス出力に追加され、サポートされる場合は Channel probe も含まれます（到達可能な gateway が必要です）。
  </Step>
  <Step title="Skills（推奨）">
    - 利用可能な Skills を読み取り、要件を確認します。
    - Node マネージャーを選択できます: **npm / pnpm**（bun は推奨されません）。
    - 任意の依存関係をインストールします（一部は macOS で Homebrew を使います）。
  </Step>
  <Step title="完了">
    - 追加機能向けの iOS/Android/macOS アプリを含む、概要と次の手順を表示します。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、オンボーディングはブラウザを開く代わりに、Control UI 用の SSH ポートフォワード手順を表示します。
Control UI アセットが存在しない場合、オンボーディングはそれらのビルドを試みます。fallback は `pnpm ui:build` です（UI 依存関係を自動インストールします）。
</Note>

## 非対話モード

`--non-interactive` を使うと、オンボーディングを自動化またはスクリプト化できます。

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

機械可読な概要が必要な場合は `--json` を追加してください。

非対話モードでの Gateway token SecretRef:

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
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive`（および `--workspace`）を使ってください。
</Note>

provider ごとのコマンド例は [CLI Automation](/ja-JP/start/wizard-cli-automation#provider-specific-examples) にあります。
フラグの意味と手順の順序については、このリファレンスページを使ってください。

### エージェント追加（非対話）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway ウィザード RPC

Gateway はオンボーディングフローを RPC（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）として公開します。
クライアント（macOS アプリ、Control UI）は、オンボーディングロジックを再実装せずにステップを描画できます。

## Signal セットアップ（signal-cli）

オンボーディングでは GitHub リリースから `signal-cli` をインストールできます。

- 適切なリリースアセットをダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` に保存します。
- 設定に `channels.signal.cliPath` を書き込みます。

注記:

- JVM ビルドには **Java 21** が必要です。
- 利用可能な場合はネイティブビルドが使われます。
- Windows では WSL2 を使用し、signal-cli のインストールは WSL 内で Linux フローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` に書き込まれる典型的なフィールド:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMax を選択した場合）
- `tools.profile`（ローカルオンボーディングでは未設定時のデフォルトとして `"coding"` を使用し、既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、Tailscale）
- `session.dmScope`（動作の詳細: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中に有効化を選んだ場合の Channel allowlist（Slack/Discord/Matrix/Microsoft Teams）。可能な場合は名前から ID に解決されます。
- `skills.install.nodeManager`
  - `setup --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動設定では、`skills.install.nodeManager` を直接設定することで引き続き `yarn` を使えます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp の認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に保存されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

一部の Channel は Plugin として配信されます。セットアップ中にそれらを選択すると、オンボーディングは
設定できるようにする前に、そのインストール（npm またはローカルパス）を求めます。

## 関連ドキュメント

- オンボーディング概要: [オンボーディング（CLI）](/ja-JP/start/wizard)
- macOS アプリのオンボーディング: [オンボーディング](/ja-JP/start/onboarding)
- 設定リファレンス: [Gateway 設定](/ja-JP/gateway/configuration)
- Provider: [WhatsApp](/ja-JP/channels/whatsapp)、[Telegram](/ja-JP/channels/telegram)、[Discord](/ja-JP/channels/discord)、[Google Chat](/ja-JP/channels/googlechat)、[Signal](/ja-JP/channels/signal)、[BlueBubbles](/ja-JP/channels/bluebubbles)（iMessage）、[iMessage](/ja-JP/channels/imessage)（レガシー）
- Skills: [Skills](/ja-JP/tools/skills)、[Skills 設定](/ja-JP/tools/skills-config)
