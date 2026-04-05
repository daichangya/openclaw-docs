---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、バインディング'
title: Multi-Agent Routing
x-i18n:
    generated_at: "2026-04-05T12:42:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Multi-Agent Routing

目的: 1つの実行中のGateway内で、複数の_分離された_エージェント（それぞれ別のworkspace + `agentDir` + sessions）と、複数のチャネルアカウント（例: 2つのWhatsApp）を扱うことです。受信メッセージはbindingsによってエージェントへルーティングされます。

## 「1つのエージェント」とは何か

**agent** とは、次のものをそれぞれ独自に持つ、完全にスコープ分離された頭脳です。

- **Workspace**（ファイル、AGENTS.md/SOUL.md/USER.md、ローカルノート、personaルール）。
- 認証プロファイル、モデルレジストリ、エージェント単位の設定を格納する**状態ディレクトリ**（`agentDir`）。
- `~/.openclaw/agents/<agentId>/sessions` 配下の**セッションストア**（チャット履歴 + ルーティング状態）。

認証プロファイルは**エージェント単位**です。各エージェントはそれぞれ次の場所から読み込みます。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` はここでも、より安全なセッション横断の再想起経路です。これは生のトランスクリプトダンプではなく、境界づけられたサニタイズ済みビューを返します。assistantの再想起では、redaction/truncationの前に、thinkingタグ、`<relevant-memories>` の足場、プレーンテキストのtool-call XMLペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、切り詰められたtool-callブロックを含む）、格下げされたtool-callの足場、漏洩したASCII/全角のモデル制御トークン、不正なMiniMax tool-call XMLが取り除かれます。

メインエージェントの認証情報は**自動では共有されません**。エージェント間で `agentDir` を再利用してはいけません（認証/セッションの衝突を引き起こします）。認証情報を共有したい場合は、`auth-profiles.json` を別のエージェントの `agentDir` にコピーしてください。

Skillsは、各エージェントのworkspaceと `~/.openclaw/skills` などの共有ルートから読み込まれ、設定されている場合は有効なエージェントskill allowlistでフィルタリングされます。共有のベースラインには `agents.defaults.skills`、エージェント単位の置き換えには `agents.list[].skills` を使います。詳しくは
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) と
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists) を参照してください。

Gatewayは**1つのagent**（デフォルト）または複数のagentを並行してホストできます。

**Workspaceに関する注意:** 各エージェントのworkspaceは厳格なサンドボックスではなく、**デフォルトのcwd**です。相対パスはworkspace内で解決されますが、サンドボックスを有効にしていない限り、絶対パスはホスト上の他の場所へ到達できます。詳しくは
[Sandboxing](/gateway/sandboxing) を参照してください。

## パス（簡易マップ）

- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 状態ディレクトリ: `~/.openclaw`（または `OPENCLAW_STATE_DIR`）
- Workspace: `~/.openclaw/workspace`（または `~/.openclaw/workspace-<agentId>`）
- Agent dir: `~/.openclaw/agents/<agentId>/agent`（または `agents.list[].agentDir`）
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### シングルエージェントモード（デフォルト）

何もしなければ、OpenClawは単一のagentとして動作します。

- `agentId` のデフォルトは **`main`** です。
- Sessionsは `agent:main:<mainKey>` としてキー付けされます。
- Workspaceのデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## Agent helper

agentウィザードを使って、新しい分離されたagentを追加します。

```bash
openclaw agents add work
```

その後、受信メッセージをルーティングするために `bindings` を追加します（またはウィザードに任せます）。

次で確認します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各agentのworkspaceを作成">

ウィザードを使うか、手動でworkspaceを作成します。

```bash
openclaw agents add coding
openclaw agents add social
```

各agentには、`SOUL.md`、`AGENTS.md`、オプションの `USER.md` を含む独自のworkspaceに加え、専用の `agentDir` と `~/.openclaw/agents/<agentId>` 配下のセッションストアが作成されます。

  </Step>

  <Step title="チャネルアカウントを作成">

希望するチャネルで、agentごとに1つのアカウントを作成します。

- Discord: agentごとに1つのbotを作成し、Message Content Intentを有効にして、それぞれのトークンをコピーします。
- Telegram: agentごとにBotFatherで1つのbotを作成し、それぞれのトークンをコピーします。
- WhatsApp: アカウントごとに各電話番号をリンクします。

```bash
openclaw channels login --channel whatsapp --account work
```

チャネルガイド: [Discord](/ja-JP/channels/discord)、[Telegram](/ja-JP/channels/telegram)、[WhatsApp](/ja-JP/channels/whatsapp)。

  </Step>

  <Step title="agents、accounts、bindingsを追加">

`agents.list` にagentsを、`channels.<channel>.accounts` にチャネルアカウントを追加し、`bindings` でそれらを接続します（例は以下）。

  </Step>

  <Step title="再起動して確認">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 複数のagents = 複数の人、複数の人格

**複数のagents** を使うと、各 `agentId` は**完全に分離されたpersona**になります。

- **異なる電話番号/アカウント**（チャネルごとの `accountId` 単位）。
- **異なる人格**（`AGENTS.md` や `SOUL.md` などのエージェント単位workspaceファイル）。
- **分離された認証 + sessions**（明示的に有効化しない限り相互干渉なし）。

これにより、複数の人が1つのGatewayサーバーを共有しつつ、AIの「頭脳」とデータを分離したままにできます。

## エージェント間のQMD memory検索

あるagentから別のagentのQMDセッショントランスクリプトを検索したい場合は、
`agents.list[].memorySearch.qmd.extraCollections` に追加コレクションを指定します。
すべてのagentが同じ共有トランスクリプトコレクションを継承すべき場合にのみ、
`agents.defaults.memorySearch.qmd.extraCollections` を使ってください。

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // workspace内で解決 -> "notes-main" という名前のcollection
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

追加コレクションのパスはagents間で共有できますが、パスがagent workspaceの外にある場合、collection名は明示的なままです。workspace内のパスはagent単位のままなので、各agentは独自のトランスクリプト検索セットを維持します。

## 1つのWhatsApp番号、複数の人（DM分割）

**異なるWhatsApp DM** を、**1つのWhatsAppアカウント**のまま別々のagentsへルーティングできます。送信者のE.164（例: `+15551234567`）に対して `peer.kind: "direct"` でマッチさせます。返信は引き続き同じWhatsApp番号から送られます（agent単位の送信者IDはありません）。

重要な詳細: direct chatはagentの**main session key**に集約されるため、真の分離には**1人につき1agent**が必要です。

例:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

注意:

- DMアクセス制御は**WhatsAppアカウント単位でグローバル**です（pairing/allowlist）。agent単位ではありません。
- 共有グループについては、そのグループを1つのagentにバインドするか、[Broadcast groups](/ja-JP/channels/broadcast-groups) を使ってください。

## ルーティングルール（メッセージがどのagentを選ぶか）

bindingsは**決定的**で、**最も具体的なものが優先**されます。

1. `peer` マッチ（正確なDM/group/channel id）
2. `parentPeer` マッチ（スレッド継承）
3. `guildId + roles`（Discordロールルーティング）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. チャネルの `accountId` マッチ
7. チャネルレベルのマッチ（`accountId: "*"`）
8. デフォルトagentへのフォールバック（`agents.list[].default`、なければリストの最初の要素、デフォルト: `main`）

同じ階層で複数のbindingがマッチした場合、設定順で最初のものが勝ちます。
bindingが複数のmatchフィールド（たとえば `peer` + `guildId`）を設定している場合、指定されたすべてのフィールドが必要です（`AND` セマンティクス）。

重要なaccountスコープの詳細:

- `accountId` を省略したbindingは、デフォルトアカウントのみにマッチします。
- すべてのアカウントに対するチャネル全体のフォールバックには `accountId: "*"` を使います。
- 後から同じagentに対して同じbindingを明示的なaccount id付きで追加した場合、OpenClawは既存のチャネルのみのbindingを複製せず、accountスコープ付きにアップグレードします。

## 複数のaccounts / 電話番号

**複数accounts** をサポートするチャネル（例: WhatsApp）では、各ログインを識別するために `accountId` を使います。各 `accountId` は異なるagentへルーティングできるため、1つのサーバーで複数の電話番号を扱ってもsessionsが混ざりません。

`accountId` 省略時のチャネル全体のデフォルトアカウントを使いたい場合は、
`channels.<channel>.defaultAccount` を設定します（任意）。未設定の場合、OpenClawは `default` が存在すればそれに、なければ設定済みaccount idの先頭（ソート順）にフォールバックします。

このパターンをサポートする一般的なチャネルには次が含まれます。

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## 概念

- `agentId`: 1つの「頭脳」（workspace、エージェント単位の認証、エージェント単位のセッションストア）。
- `accountId`: 1つのチャネルアカウントインスタンス（例: WhatsAppアカウント `"personal"` と `"biz"`）。
- `binding`: `(channel, accountId, peer)` と、必要に応じてguild/team idによって、受信メッセージを `agentId` へルーティングします。
- direct chatは `agent:<agentId>:<mainKey>`（agent単位の「main」、`session.mainKey`）に集約されます。

## プラットフォーム別の例

### agentごとのDiscord bot

各Discord botアカウントは一意の `accountId` に対応します。各accountをagentへバインドし、botごとにallowlistを維持します。

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

注意:

- 各botをguildへ招待し、Message Content Intentを有効にしてください。
- トークンは `channels.discord.accounts.<id>.token` に置きます（デフォルトaccountは `DISCORD_BOT_TOKEN` も使えます）。

### agentごとのTelegram bot

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

注意:

- BotFatherでagentごとに1つのbotを作成し、それぞれのトークンをコピーしてください。
- トークンは `channels.telegram.accounts.<id>.botToken` に置きます（デフォルトaccountは `TELEGRAM_BOT_TOKEN` も使えます）。

### agentごとのWhatsApp番号

Gatewayを起動する前に各accountをリンクします。

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json`（JSON5）:

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // 決定的ルーティング: 最初に一致したものが勝つ（最も具体的なものを先に）。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 任意のpeer単位オーバーライド（例: 特定のグループをwork agentへ送る）。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // デフォルトではオフ: agent間メッセージングは明示的に有効化し、allowlistする必要があります。
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 任意の上書き。デフォルト: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 任意の上書き。デフォルト: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 例: WhatsAppの日常チャット + Telegramの深い作業

チャネル単位で分割します。WhatsAppは日常向けの高速agentへ、TelegramはOpus agentへルーティングします。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注意:

- チャネルに複数accountsがある場合は、bindingに `accountId` を追加してください（例: `{ channel: "whatsapp", accountId: "personal" }`）。
- 1つのDM/groupだけをOpusへルーティングし、残りはchatのままにしたい場合は、そのpeerに対する `match.peer` bindingを追加してください。peerマッチは常にチャネル全体ルールより優先されます。

## 例: 同じチャネルで、1つのpeerだけをOpusへ

WhatsAppは高速agentのままにしつつ、1つのDMだけをOpusへルーティングします。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

peer bindingは常に勝つため、チャネル全体ルールの上に置いてください。

## WhatsAppグループにバインドされたfamily agent

専用のfamily agentを1つのWhatsAppグループにバインドし、mentionによるゲートとより厳しいtoolポリシーを設定します。

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

注意:

- Toolのallow/denyリストは**skillsではなくtools**に対するものです。skillがバイナリを実行する必要がある場合は、`exec` が許可されていて、そのバイナリがsandbox内に存在することを確認してください。
- より厳密に制御したい場合は、`agents.list[].groupChat.mentionPatterns` を設定し、チャネルのgroup allowlistを有効のままにしてください。

## エージェント単位のSandboxとTool設定

各agentは独自のsandboxとtool制限を持てます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal agentではsandboxなし
        },
        // tool制限なし - すべてのtoolが利用可能
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 常にsandbox化
          scope: "agent",  // agentごとに1コンテナ
          docker: {
            // コンテナ作成後の任意の一回限りセットアップ
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // read toolのみ
          deny: ["exec", "write", "edit", "apply_patch"],    // その他を拒否
        },
      },
    ],
  },
}
```

注: `setupCommand` は `sandbox.docker` 配下にあり、コンテナ作成時に1回だけ実行されます。
解決後のscopeが `"shared"` の場合、agent単位の `sandbox.docker.*` 上書きは無視されます。

**利点:**

- **セキュリティ分離**: 信頼できないagentsに対してtoolsを制限
- **リソース制御**: 特定のagentsだけをsandbox化し、他はホスト上で実行
- **柔軟なポリシー**: agentごとに異なる権限を設定

注: `tools.elevated` は**グローバル**かつ送信者ベースであり、agent単位には設定できません。
agent単位の境界が必要な場合は、`agents.list[].tools` を使って `exec` を拒否してください。
グループ対象指定には `agents.list[].groupChat.mentionPatterns` を使うと、@mentionが意図したagentへ明確に対応します。

詳しい例は [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

## 関連

- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージがagentsへルーティングされる仕組み
- [Sub-Agents](/tools/subagents) — バックグラウンドagent実行の起動
- [ACP Agents](/tools/acp-agents) — 外部コーディングハーネスの実行
- [Presence](/concepts/presence) — agentのpresenceと可用性
- [Session](/concepts/session) — セッション分離とルーティング
