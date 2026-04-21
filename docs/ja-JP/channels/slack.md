---
read_when:
    - Slack のセットアップ、または Slack の socket/HTTP モードのデバッグ
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP リクエスト URL）
title: Slack
x-i18n:
    generated_at: "2026-04-21T17:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30b372a3ae10b7b649532181306e42792aca76b41422516e9633eb79f73f009
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

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode (デフォルト)">
    <Steps>
      <Step title="新しい Slack アプリを作成する">
        Slack アプリ設定で **[Create New App](https://api.slack.com/apps/new)** ボタンを押します。

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - 以下の[マニフェスト例](#manifest-and-scope-checklist)を貼り付け、そのまま作成に進みます
        - `connections:write` を付けた **App-Level Token** (`xapp-...`) を生成します
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

        - **from a manifest** を選び、アプリ用のワークスペースを選択します
        - [マニフェスト例](#manifest-and-scope-checklist)を貼り付け、作成前に URL を更新します
        - リクエスト検証用に **Signing Secret** を保存します
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
        マルチアカウント HTTP では一意の Webhook パスを使用してください

        登録が衝突しないように、各アカウントに別々の `webhookPath`（デフォルトは `/slack/events`）を設定してください。
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

## マニフェストとスコープのチェックリスト

<Tabs>
  <Tab title="Socket Mode (デフォルト)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 用 Slack コネクター"
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
        "description": "OpenClaw にメッセージを送信",
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
    "description": "OpenClaw 用 Slack コネクター"
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
        "description": "OpenClaw にメッセージを送信",
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

### 追加のマニフェスト設定

上記のデフォルトを拡張する各種機能を有効にします。

<AccordionGroup>
  <Accordion title="オプションのネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)を条件付きで使用できます。

    - `/status` コマンドは予約されているため、`/status` の代わりに `/agentstatus` を使用します。
    - 同時に利用可能にできるスラッシュコマンドは最大 25 個です。

    既存の `features.slash_commands` セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list) のサブセットに置き換えてください。

    <Tabs>
      <Tab title="Socket Mode (デフォルト)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "新しいセッションを開始",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセット"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストを Compaction する",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止"
      },
      {
        "command": "/session",
        "description": "スレッドバインディングの有効期限を管理",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替え",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "高速モードの表示または設定",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "reasoning の表示を切り替え",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "elevated モードを切り替え",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "exec のデフォルトを表示または設定",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "モデルの表示または設定",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "プロバイダー一覧、またはプロバイダーのモデル一覧を表示",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "短いヘルプ概要を表示"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示"
      },
      {
        "command": "/tools",
        "description": "現在のエージェントが今使えるものを表示",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用状況やクォータを含むランタイムステータスを表示"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブまたは最近のバックグラウンドタスクを一覧表示"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "送信者 ID を表示"
      },
      {
        "command": "/skill",
        "description": "名前で skill を実行",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに脇道の質問をする",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御するか、コスト概要を表示",
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
        "description": "新しいセッションを開始",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセット",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストを Compaction する",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "スレッドバインディングの有効期限を管理",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替え",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "高速モードの表示または設定",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "reasoning の表示を切り替え",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "elevated モードを切り替え",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "exec のデフォルトを表示または設定",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "モデルの表示または設定",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "プロバイダー一覧、またはプロバイダーのモデル一覧を表示",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "短いヘルプ概要を表示",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "現在のエージェントが今使えるものを表示",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用状況やクォータを含むランタイムステータスを表示",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブまたは最近のバックグラウンドタスクを一覧表示",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "送信者 ID を表示",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "名前で skill を実行",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに脇道の質問をする",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御するか、コスト概要を表示",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="オプションの作成者スコープ（書き込み操作）">
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
- `botToken`、`appToken`、`signingSecret`、`userToken` はプレーンテキスト文字列または SecretRef オブジェクトを受け付けます。
- config のトークンは環境変数フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` の環境変数フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は config 専用です（環境変数フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）です。

ステータススナップショットの動作:

- Slack アカウント検査では、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、`missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別のインラインではないシークレットソース経由で設定されているものの、現在のコマンドまたはランタイム経路では実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリー読み取りでは、設定されていれば user token が優先されることがあります。書き込みでは bot token が引き続き優先されます。user-token での書き込みが許可されるのは、`userTokenReadOnly: false` で、かつ bot token が利用できない場合のみです。
</Tip>

## アクションとゲート

Slack アクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在の Slack メッセージアクションには `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list` が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します（旧: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。旧: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧）
    - `dm.groupEnabled`（グループ DM のデフォルトは false）
    - `dm.groupChannels`（オプションの MPIM allowlist）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャンネルポリシー">
    `channels.slack.groupPolicy` はチャンネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャンネル allowlist は `channels.slack.channels` 配下にあり、安定したチャンネル ID を使う必要があります。

    ランタイムに関する注意: `channels.slack` が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告を記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャンネル allowlist エントリーと DM allowlist エントリーは、トークンアクセスが可能であれば起動時に解決されます
    - 未解決のチャンネル名エントリーは設定どおり保持されますが、デフォルトではルーティング時に無視されます
    - 受信認可とチャンネルルーティングはデフォルトで ID 優先です。直接のユーザー名/slug 一致を使うには `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネルユーザー">
    チャンネルメッセージはデフォルトでメンションによるゲートがかかります。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - 暗黙の bot 返信スレッド動作（`thread.requireExplicitMention` が `true` の場合は無効）

    チャンネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧来の接頭辞なしキーも `id:` のみに引き続きマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct` としてルーティングされ、チャンネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに集約されます。
- チャンネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、必要に応じてスレッドセッション接尾辞（`:thread:<threadTs>`）が作成されることがあります。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` を設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト `false`）: `true` の場合、暗黙のスレッドメンションを抑制し、bot がすでにそのスレッドに参加していても、スレッド内で明示的な `@bot` メンションがある場合にのみ bot が応答します。これがない場合、bot が参加済みのスレッド内返信は `requireMention` ゲートをバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- direct チャット向けの旧フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む Slack の**すべての**返信スレッドを無効化します。これは、明示タグが `"off"` モードでも引き続き尊重される Telegram とは異なります。この違いはプラットフォームのスレッドモデルを反映しています。Slack のスレッドではメッセージがチャンネルから隠れますが、Telegram の返信はメインチャットの流れの中で見えたままです。

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理している間、確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

注意:

- Slack ではショートコードが必要です（例: `"eyes"`）。
- Slack アカウント単位またはグローバルでリアクションを無効にするには `""` を使用します。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します:

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: 分割されたプレビュー更新を追記します。
- `progress`: 生成中は進行状況のステータステキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効なとき、ツール/進捗更新を同じ編集済みプレビューメッセージに流します（デフォルト: `true`）。別個のツール/進捗メッセージのままにするには `false` に設定します。

`channels.slack.streaming.nativeTransport` は、`channels.slack.streaming.mode` が `partial` のときの Slack ネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- ネイティブテキストストリーミングと Slack assistant のスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。
- チャンネルとグループチャットのルートでは、ネイティブストリーミングが使えない場合でも通常の下書きプレビューを使えます。
- トップレベルの Slack DM はデフォルトではスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進行状況を見せたい場合は、スレッド返信または `typingReaction` を使用してください。
- メディアおよび非テキスト payload は通常配信にフォールバックします。
- 返信途中でストリーミングに失敗した場合、OpenClaw は残りの payload を通常配信にフォールバックします。

Slack ネイティブテキストストリーミングの代わりに下書きプレビューを使用する:

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

旧キー:

- `channels.slack.streamMode`（`replace | status_final | append`）は `channels.slack.streaming.mode` に自動移行されます。
- boolean の `channels.slack.streaming` は `channels.slack.streaming.mode` と `channels.slack.streaming.nativeTransport` に自動移行されます。
- 旧 `channels.slack.nativeStreaming` は `channels.slack.streaming.nativeTransport` に自動移行されます。

## typing リアクションのフォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行終了時にそれを削除します。これは、デフォルトの「is typing...」ステータス表示を使うスレッド返信の外側で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意:

- Slack ではショートコードが必要です（例: `"hourglass_flowing_sand"`）。
- リアクションはベストエフォートです。返信または失敗パスの完了後に自動クリーンアップが試行されます。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack のファイル添付は Slack ホストのプライベート URL からダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であれば media store に書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限り、デフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` を使います（デフォルト 4000）
    - `channels.slack.chunkMode="newline"` で段落優先の分割が有効になります
    - ファイル送信では Slack のアップロード API を使い、スレッド返信（`thread_ts`）を含められます
    - 送信メディア上限は、設定されていれば `channels.slack.mediaMaxMb` に従います。未設定の場合、チャンネル送信は media pipeline の MIME kind デフォルトに従います
  </Accordion>

  <Accordion title="配信先">
    推奨される明示ターゲット:

    - DM には `user:<id>`
    - チャンネルには `channel:<id>`

    Slack DM は、user ターゲットへ送信する際に Slack conversation API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは Slack 上で、単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドのデフォルトを変更するには `channels.slack.slashCommand` を設定します。

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドを使うには、Slack アプリに[追加のマニフェスト設定](#additional-manifest-settings)が必要で、さらに `channels.slack.commands.native: true` またはグローバル設定の `commands.native: true` で有効にします。

- Slack ではネイティブコマンドの自動モードは **off** なので、`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使います。

- 最大 5 オプション: ボタンブロック
- 6〜100 オプション: 静的セレクトメニュー
- 100 を超えるオプション: interactivity options handler が利用可能な場合、非同期オプションフィルタリング付き external select
- Slack 制限超過時: エンコード済みオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは `agent:<agentId>:slack:slash:<userId>` のような分離キーを使い、コマンド実行は引き続き `CommandTargetSessionKey` を使って対象の会話セッションへルーティングされます。

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択を既存の Slack interaction event path 経由で戻します。

注意:

- これは Slack 固有の UI です。他のチャンネルでは Slack Block Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は OpenClaw 生成の opaque token であり、生のエージェント作成値ではありません。
- 生成されたインタラクティブブロックが Slack Block Kit の制限を超える場合、OpenClaw は無効な blocks payload を送る代わりに元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI や端末へフォールバックする代わりに、インタラクティブボタンと interaction を備えたネイティブ承認クライアントとして動作できます。

- exec 承認では、ネイティブ DM/チャンネルルーティングに `channels.slack.execApprovals.*` を使います。
- Plugin 承認は、リクエストがすでに Slack に到達しており、承認 ID 種別が `plugin:` であれば、同じ Slack ネイティブボタン UI 経由で引き続き解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーだけが Slack 経由でリクエストを承認または拒否できます。

これは他チャンネルと同じ共有承認ボタン UI を使います。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとして表示されます。
それらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw は、ツール結果がチャット承認を利用不可と示す場合、または手動承認が唯一の経路である場合にのみ、手動 `/approve` コマンドを含めるべきです。

config パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（オプション。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の
承認者が解決されると、ネイティブ exec 承認を自動で有効にします。Slack をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。
承認者が解決されるときにネイティブ承認を強制的に有効にするには `enabled: true` を設定してください。

明示的な Slack exec 承認 config がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的な Slack ネイティブ config が必要なのは、承認者を上書きしたい場合、フィルターを追加したい場合、または origin-chat 配信を有効にしたい場合だけです。

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

共有の `approvals.exec` 転送は別機能です。exec 承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別機能です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に到達している場合、引き続き Plugin 承認を解決できます。

同一チャット内の `/approve` も、すでにコマンド対応している Slack チャンネルと DM で動作します。完全な承認転送モデルについては [Exec approvals](/ja-JP/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージ編集/削除/スレッドブロードキャストは system event にマップされます。
- リアクション追加/削除イベントは system event にマップされます。
- メンバー参加/離脱、チャンネル作成/名前変更、ピン追加/削除イベントは system event にマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャンネル config キーを移行できます。
- チャンネル topic/purpose メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシーディングは、該当する場合は設定済み送信者 allowlist でフィルタリングされます。
- Block action とモーダル interaction は、リッチな payload フィールドを持つ構造化 `Slack interaction: ...` system event を出力します。
  - block action: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - モーダル `view_submission` および `view_closed` イベント。ルーティング済みチャンネルメタデータとフォーム入力を含みます

## 設定リファレンスの参照先

主要リファレンス:

- [設定リファレンス - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要度の高い Slack フィールド:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（旧: `dm.policy`, `dm.allowFrom`）、`dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用; 必要な場合を除き off のままにしてください）
  - チャンネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルで返信がない">
    次の順で確認してください。

    - `groupPolicy`
    - チャンネル allowlist（`channels.slack.channels`）
    - `requireMention`
    - チャンネルごとの `users` allowlist

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
    - `channels.slack.dmPolicy`（または旧 `channels.slack.dm.policy`）
    - ペアリング承認 / allowlist エントリー

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続されない">
    bot トークンと app トークン、および Slack アプリ設定での Socket Mode 有効化を確認してください。

    `openclaw channels status --probe --json` で `botTokenStatus` または
    `appTokenStatus: "configured_unavailable"` が表示される場合、その Slack アカウントは
    設定されていますが、現在のランタイムでは SecretRef ベースの
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP mode でイベントを受信しない">
    次を確認してください。

    - signing secret
    - webhook path
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - HTTP アカウントごとに一意の `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムでは
    SecretRef ベースの signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが反応しない">
    意図したのがどちらかを確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、Slack に対応するスラッシュコマンドが登録されている
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    併せて `commands.useAccessGroups` とチャンネル/ユーザー allowlist も確認してください。

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
