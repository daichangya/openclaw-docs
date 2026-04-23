---
read_when:
    - Slack のセットアップ、または Slack のソケット/HTTP モードのデバッグ
summary: Slack のセットアップと実行時の動作（ソケットモード + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-04-23T04:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1609ab5570daac455005cb00cee578c8954e05b25c25bf5759ae032d2a12c2c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slack アプリ連携による DM とチャンネルに対応した本番運用対応。デフォルトモードは Socket Mode で、HTTP リクエスト URL もサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    Slack DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックスタート

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - 以下の [manifest の例](#manifest-and-scope-checklist) を貼り付けて、そのまま作成を続けます
        - `connections:write` を付与した **App-Level Token** (`xapp-...`) を生成します
        - アプリをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします
      </Step>

      <Step title="OpenClaw を設定する">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        環境変数でのフォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP リクエスト URL">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選択し、アプリ用のワークスペースを選びます
        - [manifest の例](#manifest-and-scope-checklist) を貼り付け、作成前に URL を更新します
        - リクエスト検証用の **Signing Secret** を保存します
        - アプリをインストールし、表示される **Bot Token** (`xoxb-...`) をコピーします

      </Step>

      <Step title="OpenClaw を設定する">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        マルチアカウント HTTP では一意の webhook パスを使用してください

        登録が衝突しないように、各アカウントに個別の `webhookPath`（デフォルトは `/slack/events`）を設定してください。
        </Note>

      </Step>

      <Step title="Gateway を起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## manifest とスコープのチェックリスト

<Tabs>
  <Tab title="Socket Mode (デフォルト)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Tab>

  <Tab title="HTTP リクエスト URL">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### 追加の manifest 設定

上記のデフォルトを拡張する、異なる機能の表示方法です。

<AccordionGroup>
  <Accordion title="オプションのネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を使うこともでき、その際にはいくつか注意点があります。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 同時に利用可能にできるスラッシュコマンドは 25 個までです。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) の一部で置き換えてください。

    <Tabs>
      <Tab title="Socket Mode (デフォルト)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP リクエスト URL">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "新しいセッションを開始する",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセットする",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストをコンパクト化する",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "スレッドバインディングの有効期限を管理する",
        "usage_hint": "idle <duration|off> または max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定する",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替える",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "fast モードを表示または設定する",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "reasoning の表示を切り替える",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "elevated モードを切り替える",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "exec のデフォルト設定を表示または設定する",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "モデルを表示または設定する",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "プロバイダーを一覧表示する、またはプロバイダーのモデルを一覧表示する",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "簡潔なヘルプ概要を表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "現在のエージェントが今使えるものを表示する",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダーの使用状況やクォータを含む実行時ステータスを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブまたは最近のバックグラウンドタスクを一覧表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明する",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "自分の送信者 ID を表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "名前で skill を実行する",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに横道の質問をする",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "usage フッターを制御する、またはコスト概要を表示する",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="オプションの作成者表示スコープ（書き込み操作）">
    送信メッセージでデフォルトの Slack アプリ ID ではなく、アクティブなエージェント ID（カスタムユーザー名とアイコン）を使いたい場合は、`chat:write.customize` bot スコープを追加してください。

    絵文字アイコンを使う場合、Slack では `:emoji_name:` 構文が必要です。

  </Accordion>
  <Accordion title="オプションのユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken` を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack 検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Mode には `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken` は平文の
  文字列または SecretRef オブジェクトを受け付けます。
- config のトークンは env フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の env フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は config 専用です（env フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）になります。

ステータススナップショットの動作:

- Slack アカウント検査では、認証情報ごとの `*Source` と `*Status`
  フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、または `missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef
  や別の非インラインなシークレットソースで設定されているものの、現在のコマンド/実行時パスでは
  実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では、必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリ読み取りでは、設定されていれば user token が優先されることがあります。書き込みでは引き続き bot token が優先されます。user-token による書き込みが許可されるのは、`userTokenReadOnly: false` で、かつ bot token が利用できない場合だけです。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` によって制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在の Slack メッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します（レガシー: `channels.slack.dm.policy`）:

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。レガシー: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（レガシー）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（オプションの MPIM 許可リスト）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自分自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します:

    - `open`
    - `allowlist`
    - `disabled`

    チャンネルの許可リストは `channels.slack.channels` 配下にあり、安定したチャンネル ID を使うべきです。

    実行時メモ: `channels.slack` が完全に欠けている場合（env のみのセットアップ）、実行時は `groupPolicy="allowlist"` にフォールバックし、警告をログに出します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャンネル許可リスト項目と DM 許可リスト項目は、トークンアクセスが許可されていれば起動時に解決されます
    - 解決できなかったチャンネル名の項目は設定どおり保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。username/slug の直接一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションゲートされます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション regex パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙の bot 宛てスレッド返信動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（許可リスト）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （レガシーの接頭辞なしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` としてルーティングされ、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、適用可能な場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、bot がすでにそのスレッドに参加していても、スレッド内では明示的な `@bot` メンションにのみ応答します。これがない場合、bot が参加しているスレッド内の返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- direct チャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack での**すべて**の返信スレッド化を無効にします。これは Telegram と異なり、Telegram では `"off"` モードでも明示タグが引き続き尊重されます。この違いはプラットフォームのスレッドモデルを反映しています。Slack のスレッドはメッセージをチャンネルから隠しますが、Telegram の返信はメインチャットの流れの中で表示されたままです。

## 確認用リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理中に確認用の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

注意:

- Slack では shortcode が必要です（例: `"eyes"`）。
- Slack アカウント単位またはグローバルにリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビューの動作を制御します:

- `off`: ライブプレビューのストリーミングを無効にします。
- `partial`（デフォルト）: プレビューのテキストを最新の部分出力で置き換えます。
- `block`: 分割されたプレビュー更新を追記します。
- `progress`: 生成中は進行状況テキストを表示し、その後で最終テキストを送信します。
- `streaming.preview.toolProgress`: ドラフトプレビューが有効なとき、ツール/進行状況の更新を同じ編集対象のプレビューメッセージに流します（デフォルト: `true`）。別々のツール/進行状況メッセージを維持するには `false` に設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときの Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- Slack ネイティブテキストストリーミングと Slack assistant のスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- ネイティブストリーミングが利用できない場合でも、チャンネルおよびグループチャットのルートでは通常のドラフトプレビューを使用できます。
- 最上位の Slack DM はデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこでも進行状況を見せたい場合は、スレッド返信または `typingReaction` を使用してください。
- メディアと非テキストのペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力では、一時的なドラフトを反映せずに保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、プレビューをその場で編集できる場合にのみ反映されます。
- 返信の途中でストリーミングに失敗した場合、OpenClaw は残りのペイロードを通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりにドラフトプレビューを使用する:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

レガシーキー:

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- レガシーの `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## typing リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行完了時にそれを削除します。これは、デフォルトの「入力中...」ステータス表示を使うスレッド返信の外側で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack では shortcode が必要です（例: `"hourglass_flowing_sand"`）。
- このリアクションはベストエフォートであり、返信または失敗処理の完了後に自動でクリーンアップが試みられます。

## メディア、分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は、Slack がホストする非公開 URL から（トークン認証付きリクエストフローで）ダウンロードされ、取得に成功しサイズ制限内であればメディアストアに書き込まれます。

    実行時の受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキスト分割には `channels.slack.textChunkLimit` を使用します（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` で段落優先の分割が有効になります
    - ファイル送信には Slack のアップロード API を使用し、スレッド返信（`thread_ts`）を含めることもできます
    - 送信メディア上限は、設定されていれば `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャンネル送信はメディアパイプラインの MIME 種別デフォルトに従います
  </Accordion>

  <Accordion title="配信先">
    推奨される明示的な送信先:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    Slack DM は、user ターゲットへの送信時に Slack の conversation API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

Slack では、スラッシュコマンドは単一の設定済みコマンドとして、または複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slack アプリで[追加の manifest 設定](#additional-manifest-settings)が必要であり、代わりに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは **off** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使用します。

- 最大 5 オプション: ボタンブロック
- 6〜100 オプション: 静的セレクトメニュー
- 100 を超えるオプション: interactivity のオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部セレクト
- Slack の上限超過時: エンコード済みオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションでは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使用しつつ、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションへルーティングされます。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトでは無効です。

グローバルに有効化する:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

または、1 つの Slack アカウントだけで有効化する:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

有効にすると、エージェントは Slack 専用の返信ディレクティブを出力できます。

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択は既存の Slack interaction イベント経路を通って返送されます。

注意:

- これは Slack 固有の UI です。他のチャンネルは Slack Block Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は OpenClaw が生成した不透明トークンであり、生のエージェント作成値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の上限を超える場合、OpenClaw は無効な blocks ペイロードを送る代わりに、元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルへフォールバックする代わりに、インタラクティブボタンと interaction を備えたネイティブ承認クライアントとして動作できます。

- exec 承認では、ネイティブ DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使用します。
- Plugin 承認は、リクエストがすでに Slack に届いていて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブボタン表示を通して解決できます。
- 承認者の認可は引き続き適用されます。Slack 経由でリクエストを承認または拒否できるのは、承認者として識別されたユーザーだけです。

これは他のチャンネルと同じ共有承認ボタン表示を使います。Slack アプリ設定で `interactivity` が有効になっていると、承認プロンプトは会話内に直接 Block Kit ボタンとして表示されます。
これらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw
は、ツール結果がチャット承認を利用不可と示している場合、または手動承認が唯一の手段である場合にのみ、手動の `/approve` コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（省略可。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の
承認者が解決されると、ネイティブ exec 承認を自動有効化します。Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。
承認者が解決されるときにネイティブ承認を強制有効化するには `enabled: true` を設定してください。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者を上書きしたい、フィルターを追加したい、または送信元チャットへの配信を有効にしたい場合にのみ、明示的な Slack ネイティブ設定が必要です。

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共有の `approvals.exec` 転送は別機能です。exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別です。Slack ネイティブボタンは、それらのリクエストがすでに
Slack に届いている場合、引き続き plugin 承認を解決できます。

同じチャット内での `/approve` も、すでにコマンドをサポートしている Slack チャンネルと DM で機能します。完全な承認転送モデルについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用時の動作

- メッセージ編集/削除/スレッドブロードキャストはシステムイベントにマッピングされます。
- リアクションの追加/削除イベントはシステムイベントにマッピングされます。
- メンバーの参加/離脱、チャンネル作成/名前変更、ピン追加/削除イベントはシステムイベントにマッピングされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル設定キーを移行できます。
- チャンネルトピック/目的メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴のコンテキスト投入は、適用可能な場合、設定済み送信者許可リストによってフィルタリングされます。
- ブロックアクションとモーダル interaction は、リッチなペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを出力します。
  - block actions: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - モーダル `view_submission` および `view_closed` イベント: ルーティングされたチャンネルメタデータとフォーム入力付き

## 設定リファレンスへのポインタ

主なリファレンス:

- [Configuration reference - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要な Slack フィールド:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（レガシー: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（最終手段。必要になるまでオフのままにしてください）
  - チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順に確認してください。

    - `groupPolicy`
    - チャンネル許可リスト（`channels.slack.channels`）
    - `requireMention`
    - チャンネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    確認項目:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（またはレガシーの `channels.slack.dm.policy`）
    - ペアリング承認 / 許可リスト項目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    bot + app トークンと、Slack アプリ設定での Socket Mode 有効化を確認してください。

    `openclaw channels status --probe --json` に `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、その Slack アカウントは
    設定済みですが、現在の実行時に SecretRef を使った
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    次を確認してください。

    - signing secret
    - webhook パス
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が表示される場合、その HTTP アカウントは設定済みですが、現在の実行時に SecretRef を使った signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが反応しない">
    次のどちらを意図していたか確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、Slack に対応するスラッシュコマンドが登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    あわせて、`commands.useAccessGroups` とチャンネル/ユーザー許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [設定](/ja-JP/gateway/configuration)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
