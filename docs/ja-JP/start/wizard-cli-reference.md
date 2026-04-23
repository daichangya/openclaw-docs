---
read_when:
    - '`openclaw onboard` の詳細な動作が必要です'
    - オンボーディング結果をデバッグしている、またはオンボーディングclientを統合しています
sidebarTitle: CLI reference
summary: CLIセットアップフロー、auth/modelセットアップ、出力、および内部動作の完全リファレンス
title: CLIセットアップリファレンス
x-i18n:
    generated_at: "2026-04-23T04:51:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# CLIセットアップリファレンス

このページは `openclaw onboard` の完全なリファレンスです。
短いガイドは [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード（デフォルト）では、次を順に設定します。

- modelとauthのセットアップ（OpenAI CodeサブスクリプションOAuth、Anthropic Claude CLIまたはAPI key、さらにMiniMax、GLM、Ollama、Moonshot、StepFun、AI Gatewayオプション）
- workspaceの場所とbootstrap file
- Gateway設定（port、bind、auth、Tailscale）
- channelとprovider（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles、その他の同梱channel plugin）
- daemon install（LaunchAgent、systemd user unit、またはネイティブWindows Scheduled Task。Startup folderフォールバックあり）
- health check
- Skillsセットアップ

remote modeでは、このマシンが別の場所にあるgatewayへ接続するよう設定します。
remote hostには何もinstallせず、変更もしません。

## ローカルフローの詳細

<Steps>
  <Step title="既存configの検出">
    - `~/.openclaw/openclaw.json` が存在する場合、Keep、Modify、またはResetを選択します。
    - ウィザードを再実行しても、明示的にResetを選ばない限り（または `--reset` を渡さない限り）何も消去されません。
    - CLIの `--reset` のデフォルトは `config+creds+sessions` です。workspaceも削除するには `--reset-scope full` を使います。
    - configが無効、または旧keyを含む場合、ウィザードは停止し、先に `openclaw doctor` を実行するよう求めます。
    - Resetは `trash` を使い、次のscopeを提供します。
      - Configのみ
      - Config + credentials + sessions
      - 完全リセット（workspaceも削除）
  </Step>
  <Step title="modelとauth">
    - 完全なオプション一覧は [Auth and model options](#auth-and-model-options) にあります。
  </Step>
  <Step title="Workspace">
    - デフォルトは `~/.openclaw/workspace`（変更可能）。
    - 初回実行bootstrap ritualに必要なworkspace fileを初期投入します。
    - Workspace layout: [Agent workspace](/ja-JP/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - port、bind、auth mode、tailscale公開を順に確認します。
    - 推奨: loopbackであってもtoken authを有効のままにして、ローカルWS clientにも認証を要求してください。
    - token modeでは、対話セットアップで次を選べます。
      - **平文tokenを生成して保存**（デフォルト）
      - **SecretRefを使う**（任意）
    - password modeでも、対話セットアップで平文またはSecretRef保存をサポートします。
    - 非対話token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`
      - オンボーディングprocess環境内に空でないenv varが必要です。
      - `--gateway-token` と併用できません。
    - authを無効にするのは、すべてのローカルprocessを完全に信頼している場合だけにしてください。
    - 非loopback bindでもauthは必須です。
  </Step>
  <Step title="Channels">
    - [WhatsApp](/ja-JP/channels/whatsapp): 任意のQR login
    - [Telegram](/ja-JP/channels/telegram): bot token
    - [Discord](/ja-JP/channels/discord): bot token
    - [Google Chat](/ja-JP/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/ja-JP/channels/mattermost): bot token + base URL
    - [Signal](/ja-JP/channels/signal): 任意の `signal-cli` install + account config
    - [BlueBubbles](/ja-JP/channels/bluebubbles): iMessageに推奨。server URL + password + webhook
    - [iMessage](/ja-JP/channels/imessage): 旧 `imsg` CLI path + DB access
    - DM security: デフォルトはペアリングです。最初のDMでcodeが送られます。`openclaw pairing approve <channel> <code>` で承認するか、allowlistを使ってください。
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - ログイン済みuser sessionが必要です。headlessではカスタムLaunchDaemonを使ってください（同梱なし）。
    - LinuxとWindows via WSL2: systemd user unit
      - ウィザードは、logout後もgatewayが動作し続けるよう `loginctl enable-linger <user>` を試みます。
      - sudoを求められることがあります（`/var/lib/systemd/linger` に書き込み）。まずsudoなしで試します。
    - ネイティブWindows: まずScheduled Task
      - task作成が拒否された場合、OpenClawはuserごとのStartup-folder login itemへフォールバックし、すぐにgatewayを起動します。
      - よりよいsupervisor statusが得られるため、引き続きScheduled Taskが推奨です。
    - Runtime選択: Node（推奨。WhatsAppとTelegramでは必須）。Bunは推奨されません。
  </Step>
  <Step title="Health check">
    - 必要に応じてgatewayを起動し、`openclaw health` を実行します。
    - `openclaw status --deep` を使うと、対応している場合はchannel probeも含めて、live gateway health probeがstatus出力に追加されます。
  </Step>
  <Step title="Skills">
    - 利用可能なSkillsを読み取り、要件を確認します。
    - node managerとして npm、pnpm、または bun を選べます。
    - 任意のdependencyをinstallします（一部はmacOSでHomebrewを使用）。
  </Step>
  <Step title="完了">
    - 概要と次のステップを表示します。iOS、Android、macOS appオプションも含みます。
  </Step>
</Steps>

<Note>
GUIが検出されない場合、ウィザードはbrowserを開く代わりにControl UI用のSSH port-forward手順を表示します。
Control UI assetがない場合、ウィザードはそれらのbuildを試みます。フォールバックは `pnpm ui:build` です（UI dependencyは自動installされます）。
</Note>

## Remote modeの詳細

remote modeでは、このマシンが別の場所にあるgatewayへ接続するよう設定します。

<Info>
remote modeではremote hostに何もinstallせず、変更もしません。
</Info>

設定するもの:

- remote gateway URL（`ws://...`）
- remote gateway authが必要な場合のtoken（推奨）

<Note>
- gatewayがloopback専用の場合は、SSH tunnelingまたはtailnetを使ってください。
- Discovery hint:
  - macOS: Bonjour（`dns-sd`）
  - Linux: Avahi（`avahi-browse`）
</Note>

## Auth and model options

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY` が存在すればそれを使い、なければkeyを確認して、daemon用に保存します。
  </Accordion>
  <Accordion title="OpenAI Codeサブスクリプション（OAuth）">
    browser flowです。`code#state` を貼り付けます。

    modelが未設定、または `openai/*` のとき、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="OpenAI Codeサブスクリプション（device pairing）">
    短時間有効なdevice codeを使うbrowser pairing flowです。

    modelが未設定、または `openai/*` のとき、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY` が存在すればそれを使い、なければkeyを確認し、そのcredentialをauth profileに保存します。

    modelが未設定、`openai/*`、または `openai-codex/*` のとき、`agents.defaults.model` を `openai/gpt-5.4` に設定します。

  </Accordion>
  <Accordion title="xAI（Grok）API key">
    `XAI_API_KEY` を確認し、model providerとしてxAIを設定します。
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）を確認し、Zen catalogまたはGo catalogを選択できます。
    セットアップURL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API key（generic）">
    keyを保存します。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` を確認します。
    詳細: [Vercel AI Gateway](/ja-JP/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID、gateway ID、および `CLOUDFLARE_AI_GATEWAY_API_KEY` を確認します。
    詳細: [Cloudflare AI Gateway](/ja-JP/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    configは自動で書き込まれます。hostedのデフォルトは `MiniMax-M2.7` です。API-keyセットアップでは
    `minimax/...`、OAuthセットアップでは `minimax-portal/...` を使います。
    詳細: [MiniMax](/ja-JP/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    configは、Chinaまたはglobal endpoint上のStepFun standardまたはStep Plan向けに自動で書き込まれます。
    現在、standardには `step-3.5-flash`、Step Planには `step-3.5-flash-2603` も含まれます。
    詳細: [StepFun](/ja-JP/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic互換）">
    `SYNTHETIC_API_KEY` を確認します。
    詳細: [Synthetic](/ja-JP/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（Cloudとlocal open model）">
    最初に `Cloud + Local`、`Cloud only`、または `Local only` を確認します。
    `Cloud only` は `OLLAMA_API_KEY` と `https://ollama.com` を使います。
    host連携モードではbase URL（デフォルト `http://127.0.0.1:11434`）を確認し、利用可能なmodelを検出して、デフォルトを提案します。
    `Cloud + Local` では、そのOllama hostがcloud accessにサインイン済みかどうかも確認します。
    詳細: [Ollama](/ja-JP/providers/ollama)。
  </Accordion>
  <Accordion title="MoonshotとKimi Coding">
    Moonshot（Kimi K2）とKimi Codingのconfigは自動で書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot)。
  </Accordion>
  <Accordion title="カスタムprovider">
    OpenAI互換およびAnthropic互換endpointに対応します。

    対話オンボーディングでは、他のprovider API key flowと同じAPI key保存方法をサポートします。
    - **今すぐAPI keyを貼り付ける**（平文）
    - **secret referenceを使う**（env refまたは設定済みprovider ref。事前検証あり）

    非対話flag:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（任意。未指定時は `CUSTOM_API_KEY` にフォールバック）
    - `--custom-provider-id`（任意）
    - `--custom-compatibility <openai|anthropic>`（任意。デフォルトは `openai`）

  </Accordion>
  <Accordion title="スキップ">
    authを未設定のままにします。
  </Accordion>
</AccordionGroup>

modelの動作:

- 検出されたoptionからデフォルトmodelを選択するか、providerとmodelを手動入力します。
- オンボーディングがprovider auth choiceから開始された場合、model pickerは自動的に
  そのproviderを優先します。VolcengineとBytePlusでは、同じ優先設定がそのcoding-plan variant（`volcengine-plan/*`、
  `byteplus-plan/*`）にも一致します。
- そのpreferred-provider filterが空になる場合、pickerはmodelなしを表示する代わりに
  全catalogへフォールバックします。
- ウィザードはmodel checkを実行し、設定されたmodelが不明またはauth不足であれば警告します。

credentialとprofileのpath:

- Auth profile（API key + OAuth）: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧OAuth import: `~/.openclaw/credentials/oauth.json`

credential保存モード:

- デフォルトのオンボーディング動作では、API keyはauth profile内に平文値として保存されます。
- `--secret-input-mode ref` を使うと、平文key保存の代わりにreference modeを有効にします。
  対話セットアップでは次のいずれかを選べます。
  - 環境変数ref（例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 設定済みprovider ref（`file` または `exec`）。provider alias + idを指定
- 対話reference modeでは、保存前に高速な事前検証を行います。
  - Env ref: 変数名と、現在のオンボーディング環境における空でない値を検証します。
  - Provider ref: provider configを検証し、要求されたidを解決します。
  - 事前検証に失敗した場合、オンボーディングはerrorを表示し、再試行できます。
- 非対話モードでは、`--secret-input-mode ref` はenv連携のみです。
  - provider env varをオンボーディングprocess環境に設定してください。
  - インラインkey flag（例: `--openai-api-key`）では、そのenv varが設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
  - カスタムproviderでは、非対話 `ref` modeは `models.providers.<id>.apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。
  - そのカスタムproviderケースでは、`--custom-api-key` を使うには `CUSTOM_API_KEY` が設定されている必要があります。そうでない場合、オンボーディングは即座に失敗します。
- Gateway auth credentialは、対話セットアップで平文とSecretRefの両方をサポートします。
  - Token mode: **平文tokenを生成して保存**（デフォルト）または **SecretRefを使う**
  - Password mode: 平文またはSecretRef
- 非対話token SecretRef path: `--gateway-token-ref-env <ENV_VAR>`
- 既存の平文セットアップはそのまま引き続き動作します。

<Note>
headless環境やserver向けのヒント: browserのあるマシンでOAuthを完了し、そのagentの
`auth-profiles.json`（例:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`、または対応する
`$OPENCLAW_STATE_DIR/...` path）をgateway hostへコピーしてください。`credentials/oauth.json`
は旧import元にすぎません。
</Note>

## 出力と内部動作

`~/.openclaw/openclaw.json` の典型的なfield:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（MiniMaxを選んだ場合）
- `tools.profile`（ローカルオンボーディングでは、未設定時のデフォルトが `"coding"` です。既存の明示的な値は保持されます）
- `gateway.*`（mode、bind、auth、tailscale）
- `session.dmScope`（ローカルオンボーディングでは、未設定時のデフォルトが `per-channel-peer` です。既存の明示的な値は保持されます）
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- prompt中に有効化した場合のchannel allowlist（Slack、Discord、Matrix、Microsoft Teams）。可能な場合は名前をIDへ解決します
- `skills.install.nodeManager`
  - `setup --node-manager` flagは `npm`、`pnpm`、または `bun` を受け付けます。
  - 手動configでは、後から `skills.install.nodeManager: "yarn"` を設定することもできます。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` と任意の `bindings` を書き込みます。

WhatsApp credentialは `~/.openclaw/credentials/whatsapp/<accountId>/` 配下に保存されます。
sessionは `~/.openclaw/agents/<agentId>/sessions/` 配下に保存されます。

<Note>
一部のchannelはpluginとして提供されます。セットアップ中にそれらを選択すると、ウィザードはchannel設定の前にpluginのinstall（npmまたはlocal path）を確認します。
</Note>

GatewayウィザードRPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

client（macOS appとControl UI）は、オンボーディングロジックを再実装せずにstepを描画できます。

Signalセットアップの動作:

- 適切なrelease assetをダウンロードする
- `~/.openclaw/tools/signal-cli/<version>/` 配下に保存する
- configに `channels.signal.cliPath` を書き込む
- JVM buildにはJava 21が必要
- 利用可能な場合はnative buildを使う
- WindowsではWSL2を使い、WSL内でLinuxのsignal-cliフローに従う

## 関連ドキュメント

- オンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- 自動化とscript: [CLI Automation](/ja-JP/start/wizard-cli-automation)
- コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
