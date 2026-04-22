---
read_when:
    - SlackのセットアップまたはSlackのソケット/HTTPモードのデバッグ
summary: Slackのセットアップとランタイム動作（Socket Mode + HTTPリクエストURL）
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slackアプリ連携によるDM + チャネル向けの本番対応済み。デフォルトモードはSocket Modeで、HTTPリクエストURLもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    SlackのDMはデフォルトでペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/ja-JP/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="新しいSlackアプリを作成する">
        Slackアプリ設定で**[Create New App](https://api.slack.com/apps/new)**ボタンを押します。

        - **from a manifest**を選び、アプリ用のワークスペースを選択します
        - 下記の[マニフェストとスコープのチェックリスト](#manifest-and-scope-checklist)にあるサンプルマニフェストを貼り付け、そのまま作成を続けます
        - `connections:write`付きの**App-Level Token**（`xapp-...`）を生成します
        - アプリをインストールし、表示される**Bot Token**（`xoxb-...`）をコピーします
      </Step>

      <Step title="OpenClawを設定する">

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

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTPリクエストURL">
    <Steps>
      <Step title="新しいSlackアプリを作成する">
        Slackアプリ設定で**[Create New App](https://api.slack.com/apps/new)**ボタンを押します。

        - **from a manifest**を選び、アプリ用のワークスペースを選択します
        - [サンプルマニフェスト](#manifest-and-scope-checklist)を貼り付け、作成前にURLを更新します
        - リクエスト検証用に**Signing Secret**を保存します
        - アプリをインストールし、表示される**Bot Token**（`xoxb-...`）をコピーします

      </Step>

      <Step title="OpenClawを設定する">

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
        マルチアカウントHTTPでは一意のwebhookパスを使用してください

        登録が衝突しないよう、各アカウントに異なる`webhookPath`（デフォルトは`/slack/events`）を設定してください。
        </Note>

      </Step>

      <Step title="Gatewayを起動する">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## マニフェストとスコープのチェックリスト

<Tabs>
  <Tab title="Socket Mode（デフォルト）">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw向けSlackコネクタ"
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
        "description": "OpenClawにメッセージを送信",
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

  <Tab title="HTTPリクエストURL">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw向けSlackコネクタ"
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
        "description": "OpenClawにメッセージを送信",
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

上記のデフォルトを拡張するさまざまな機能を表面化します。

<AccordionGroup>
  <Accordion title="任意のネイティブスラッシュコマンド">

    単一の設定済みコマンドの代わりに、複数の[ネイティブスラッシュコマンド](#commands-and-slash-behavior)をニュアンス付きで使用できます。

    - `/status`コマンドは予約されているため、`/status`の代わりに`/agentstatus`を使用します。
    - 同時に利用可能にできるスラッシュコマンドは25個までです。

    既存の`features.slash_commands`セクションを、[利用可能なコマンド](/ja-JP/tools/slash-commands#command-list)の一部で置き換えてください。

    <Tabs>
      <Tab title="Socket Mode（デフォルト）">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "新しいセッションを開始する",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "現在のセッションをリセットする"
      },
      {
        "command": "/compact",
        "description": "セッションコンテキストを圧縮する",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "現在の実行を停止する"
      },
      {
        "command": "/session",
        "description": "スレッドバインディングの有効期限を管理する",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "思考レベルを設定する",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "詳細出力を切り替える",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "高速モードを表示または設定する",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "reasoningの表示を切り替える",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "elevatedモードを切り替える",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "execのデフォルトを表示または設定する",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "モデルを表示または設定する",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "プロバイダー、またはプロバイダーのモデルを一覧表示する",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "短いヘルプ概要を表示する"
      },
      {
        "command": "/commands",
        "description": "生成されたコマンドカタログを表示する"
      },
      {
        "command": "/tools",
        "description": "現在のエージェントが今使えるものを表示する",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "利用可能な場合はプロバイダー使用量/クォータを含むランタイムステータスを表示する"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブな/最近のバックグラウンドタスクを一覧表示する"
      },
      {
        "command": "/context",
        "description": "コンテキストがどのように組み立てられるかを説明する",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "自分の送信者IDを表示する"
      },
      {
        "command": "/skill",
        "description": "名前でskillを実行する",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに補足の質問をする",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御するか、コスト概要を表示する",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTPリクエストURL">

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
        "description": "セッションコンテキストを圧縮する",
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
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
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
        "description": "高速モードを表示または設定する",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "reasoningの表示を切り替える",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "elevatedモードを切り替える",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "execのデフォルトを表示または設定する",
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
        "description": "プロバイダー、またはプロバイダーのモデルを一覧表示する",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "短いヘルプ概要を表示する",
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
        "description": "利用可能な場合はプロバイダー使用量/クォータを含むランタイムステータスを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "現在のセッションのアクティブな/最近のバックグラウンドタスクを一覧表示する",
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
        "description": "自分の送信者IDを表示する",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "名前でSkillsを実行する",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "セッションコンテキストを変更せずに補足の質問をする",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "使用量フッターを制御するか、コスト概要を表示する",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="任意の著者表示スコープ（書き込み操作）">
    送信メッセージで、デフォルトのSlackアプリIDではなくアクティブなエージェントID（カスタムユーザー名とアイコン）を使用したい場合は、`chat:write.customize`ボットスコープを追加してください。

    絵文字アイコンを使用する場合、Slackでは`:emoji_name:`構文が必要です。

  </Accordion>
  <Accordion title="任意のユーザートークンスコープ（読み取り操作）">
    `channels.slack.userToken`を設定する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（Slack検索の読み取りに依存する場合）

  </Accordion>
</AccordionGroup>

## トークンモデル

- Socket Modeでは`botToken` + `appToken`が必要です。
- HTTPモードでは`botToken` + `signingSecret`が必要です。
- `botToken`、`appToken`、`signingSecret`、`userToken`は、平文の文字列またはSecretRefオブジェクトを受け入れます。
- 設定内のトークンは環境変数フォールバックより優先されます。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN`の環境変数フォールバックはデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は設定内のみ対応です（環境変数フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）です。

ステータススナップショットの動作:

- Slackアカウント検査では、資格情報ごとの`*Source`および`*Status`フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは`available`、`configured_unavailable`、`missing`です。
- `configured_unavailable`は、そのアカウントがSecretRefまたは別の非インラインなシークレットソースで設定されているものの、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTPモードでは`signingSecretStatus`が含まれます。Socket Modeでは必要な組み合わせは`botTokenStatus` + `appTokenStatus`です。

<Tip>
アクション/ディレクトリ読み取りでは、設定されている場合はユーザートークンを優先できます。書き込みでは引き続きボットトークンが優先されます。ユーザートークンでの書き込みは、`userTokenReadOnly: false`かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクションと制御

Slackアクションは`channels.slack.actions.*`で制御されます。

現在のSlackツールで利用可能なアクショングループ:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

現在のSlackメッセージアクションには、`send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info`、`emoji-list`が含まれます。

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.slack.dmPolicy`はDMアクセスを制御します（旧形式: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom`に`"*"`を含める必要があります。旧形式: `channels.slack.dm.allowFrom`）
    - `disabled`

    DMフラグ:

    - `dm.enabled`（デフォルトtrue）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧形式）
    - `dm.groupEnabled`（グループDMはデフォルトでfalse）
    - `dm.groupChannels`（任意のMPIM allowlist）

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom`は`default`アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の`allowFrom`が未設定の場合に`channels.slack.allowFrom`を継承します。
    - 名前付きアカウントは`channels.slack.accounts.default.allowFrom`を継承しません。

    DMでのペアリングには`openclaw pairing approve slack <code>`を使用します。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy`はチャネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャネルallowlistは`channels.slack.channels`配下にあり、安定したチャネルIDを使用する必要があります。

    ランタイム注記: `channels.slack`自体が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは`groupPolicy="allowlist"`にフォールバックし、警告を記録します（`channels.defaults.groupPolicy`が設定されていても同様です）。

    名前/ID解決:

    - チャネルallowlistエントリとDM allowlistエントリは、トークンアクセスが可能であれば起動時に解決されます
    - 解決されないチャネル名エントリは設定どおり保持されますが、デフォルトではルーティング時に無視されます
    - 受信認可とチャネルルーティングはデフォルトでID優先です。直接のユーザー名/スラッグ一致には`channels.slack.dangerouslyAllowNameMatching: true`が必要です

  </Tab>

  <Tab title="メンションとチャネルユーザー">
    チャネルメッセージはデフォルトでメンション制御されます。

    メンションソース:

    - 明示的なアプリメンション（`<@botId>`）
    - メンション正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは`messages.groupChat.mentionPatterns`）
    - 暗黙のbot宛てスレッド返信動作（`thread.requireExplicitMention`が`true`の場合は無効）

    チャネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または`dangerouslyAllowNameMatching`経由のみ）:

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender`のキー形式: `id:`、`e164:`、`username:`、`name:`、または`"*"`ワイルドカード
      （旧来の接頭辞なしキーは引き続き`id:`のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DMは`direct`として、チャネルは`channel`として、MPIMは`group`としてルーティングされます。
- デフォルトの`session.dmScope=main`では、Slack DMはエージェントのメインセッションに集約されます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信は、該当する場合にスレッドセッション接尾辞（`:thread:<threadTs>`）を作成できます。
- `channels.slack.thread.historyScope`のデフォルトは`thread`、`thread.inheritParent`のデフォルトは`false`です。
- `channels.slack.thread.initialHistoryLimit`は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルトは`20`。無効化するには`0`に設定）。
- `channels.slack.thread.requireExplicitMention`（デフォルト`false`）: `true`の場合、暗黙のスレッドメンションを抑制し、botがすでにそのスレッドに参加していても、スレッド内の明示的な`@bot`メンションにのみ応答します。これがない場合、bot参加済みスレッド内の返信は`requireMention`制御をバイパスします。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all|batched`（デフォルト`off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel`ごと
- ダイレクトチャット向けの旧来のフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"`は、明示的な`[[reply_to_*]]`タグを含め、Slackにおける**すべての**返信スレッド化を無効にします。これはTelegramと異なり、Telegramでは`"off"`モードでも明示的タグは引き続き尊重されます。この違いはプラットフォームのスレッドモデルを反映したものです。Slackスレッドではメッセージがチャネルから隠れますが、Telegramの返信はメインチャットフロー内で可視のままです。

## ackリアクション

`ackReaction`は、OpenClawが受信メッセージを処理中であることを示す確認用絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェントIDの絵文字フォールバック（`agents.list[].identity.emoji`、なければ`"👀"`）

注記:

- Slackはショートコードを期待します（例: `"eyes"`）。
- Slackアカウント単位またはグローバルでリアクションを無効にするには`""`を使用します。

## テキストストリーミング

`channels.slack.streaming`はライブプレビュー動作を制御します:

- `off`: ライブプレビューストリーミングを無効にします。
- `partial`（デフォルト）: プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追記します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後に最終テキストを送信します。
- `streaming.preview.toolProgress`: 下書きプレビューが有効なとき、ツール/進捗更新を同じ編集済みプレビューメッセージに流します（デフォルト: `true`）。分離したツール/進捗メッセージのままにするには`false`に設定します。

`channels.slack.streaming.nativeTransport`は、`channels.slack.streaming.mode`が`partial`のときのSlackネイティブテキストストリーミングを制御します（デフォルト: `true`）。

- SlackネイティブテキストストリーミングとSlack assistantスレッドステータスを表示するには、返信スレッドが利用可能である必要があります。スレッド選択は引き続き`replyToMode`に従います。
- チャネルおよびグループチャットのルートでは、ネイティブストリーミングが利用できない場合でも通常の下書きプレビューを使用できます。
- 最上位のSlack DMはデフォルトでスレッド外のままなので、スレッド形式のプレビューは表示されません。そこで進捗を見えるようにしたい場合は、スレッド返信または`typingReaction`を使用してください。
- メディアおよび非テキストペイロードは通常の配信にフォールバックします。
- メディア/エラーの最終出力では、一時的な下書きをフラッシュせずに保留中のプレビュー編集をキャンセルします。対象となるテキスト/ブロックの最終出力は、その場でプレビューを編集できる場合にのみフラッシュされます。
- 返信の途中でストリーミングに失敗した場合、OpenClawは残りのペイロードについて通常の配信にフォールバックします。

Slackネイティブテキストストリーミングの代わりに下書きプレビューを使用するには:

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

- `channels.slack.streamMode`（`replace | status_final | append`）は自動的に`channels.slack.streaming.mode`へ移行されます。
- 真偽値の`channels.slack.streaming`は自動的に`channels.slack.streaming.mode`および`channels.slack.streaming.nativeTransport`へ移行されます。
- 旧来の`channels.slack.nativeStreaming`は自動的に`channels.slack.streaming.nativeTransport`へ移行されます。

## typingリアクションのフォールバック

`typingReaction`は、OpenClawが返信を処理している間、受信したSlackメッセージに一時的なリアクションを追加し、実行完了時にそれを削除します。これは、デフォルトの「入力中...」ステータスインジケーターを使用するスレッド返信の外側で特に有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注記:

- Slackはショートコードを期待します（例: `"hourglass_flowing_sand"`）。
- このリアクションはベストエフォートであり、返信または失敗経路の完了後に自動的にクリーンアップが試行されます。

## メディア、チャンク分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slackのファイル添付は、SlackホストのプライベートURLからダウンロードされ（トークン認証リクエストフロー）、取得成功かつサイズ制限内であればメディアストアに書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb`で上書きされない限り、デフォルトで`20MB`です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは`channels.slack.textChunkLimit`を使用します（デフォルト4000）
    - `channels.slack.chunkMode="newline"`で段落優先の分割を有効にします
    - ファイル送信はSlackアップロードAPIを使用し、スレッド返信（`thread_ts`）を含めることができます
    - 送信メディア上限は、設定されていれば`channels.slack.mediaMaxMb`に従います。それ以外の場合、チャネル送信はメディアパイプラインのMIME種別デフォルトに従います
  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的ターゲット:

    - DM向けの`user:<id>`
    - チャネル向けの`channel:<id>`

    Slack DMは、ユーザーターゲットへの送信時にSlack conversation API経由で開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

スラッシュコマンドは、Slackでは単一の設定済みコマンドまたは複数のネイティブコマンドとして表示されます。コマンドデフォルトを変更するには`channels.slack.slashCommand`を設定します:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

ネイティブコマンドには、Slackアプリで[追加のマニフェスト設定](#additional-manifest-settings)が必要で、代わりに`channels.slack.commands.native: true`またはグローバル設定の`commands.native: true`で有効にします。

- Slackではネイティブコマンド自動モードは**off**なので、`commands.native: "auto"`ではSlackネイティブコマンドは有効になりません。

```txt
/help
```

ネイティブ引数メニューは、選択したオプション値を送信する前に確認モーダルを表示する適応型レンダリング戦略を使用します:

- 最大5個のオプション: ボタンブロック
- 6〜100個のオプション: 静的選択メニュー
- 100個超のオプション: インタラクティビティのオプションハンドラーが利用可能な場合、非同期オプションフィルタリング付きの外部選択
- Slack制限超過時: エンコード済みオプション値はボタンにフォールバック

```txt
/think
```

スラッシュセッションは`agent:<agentId>:slack:slash:<userId>`のような分離キーを使用しつつ、コマンド実行は引き続き`CommandTargetSessionKey`を使って対象会話セッションにルーティングされます。

## インタラクティブ返信

Slackはエージェント作成のインタラクティブ返信コントロールをレンダリングできますが、この機能はデフォルトでは無効です。

グローバルで有効にするには:

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

または、1つのSlackアカウントでのみ有効にするには:

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

有効時、エージェントはSlack専用の返信ディレクティブを出力できます:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

これらのディレクティブはSlack Block Kitにコンパイルされ、クリックまたは選択は既存のSlackインタラクションイベント経路を通じて戻されます。

注記:

- これはSlack専用UIです。他のチャネルはSlack Block Kitディレクティブを独自のボタンシステムへ変換しません。
- インタラクティブコールバック値は、エージェントが生で書いた値ではなく、OpenClaw生成の不透明トークンです。
- 生成されたインタラクティブブロックがSlack Block Kitの制限を超える場合、OpenClawは無効なblocksペイロードを送る代わりに元のテキスト返信へフォールバックします。

## Slackでのexec承認

Slackは、Web UIやターミナルにフォールバックする代わりに、インタラクティブボタンとインタラクションを備えたネイティブ承認クライアントとして動作できます。

- Exec承認は、ネイティブDM/チャネルルーティング向けに`channels.slack.execApprovals.*`を使用します。
- Plugin承認も、リクエストがすでにSlackに届いていて承認ID種別が`plugin:`である場合、同じSlackネイティブボタンUIを通じて解決できます。
- 承認者の認可は引き続き強制されます。承認者として識別されたユーザーのみがSlack経由でリクエストを承認または拒否できます。

これは他のチャネルと同じ共有承認ボタンUIを使用します。Slackアプリ設定で`interactivity`が有効な場合、承認プロンプトは会話内に直接Block Kitボタンとしてレンダリングされます。
これらのボタンが存在する場合、それが主要な承認UXです。OpenClawは、ツール結果がチャット承認不可を示す場合、または手動承認が唯一の経路である場合にのみ、手動の`/approve`コマンドを含めるべきです。

設定パス:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は`commands.ownerAllowFrom`にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`、`sessionFilter`

Slackは、`enabled`が未設定または`"auto"`で、かつ少なくとも1人の承認者が解決された場合、ネイティブexec承認を自動有効化します。Slackをネイティブ承認クライアントとして明示的に無効にするには`enabled: false`を設定してください。
承認者が解決されるときにネイティブ承認を強制的に有効化するには`enabled: true`を設定してください。

明示的なSlack exec承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

明示的なSlackネイティブ設定が必要なのは、承認者を上書きしたい、フィルターを追加したい、または発信元チャット配信を選びたい場合だけです:

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

共有の`approvals.exec`転送は別です。exec承認プロンプトを他のチャットや明示的な帯域外ターゲットにもルーティングする必要がある場合にのみ使用してください。共有の`approvals.plugin`転送も別です。Slackネイティブボタンは、それらのリクエストがすでにSlackに届いている場合、引き続きPlugin承認を解決できます。

同一チャットでの`/approve`も、すでにコマンドをサポートしているSlackチャネルとDMで動作します。完全な承認転送モデルについては[Exec approvals](/ja-JP/tools/exec-approvals)を参照してください。

## イベントと運用時の動作

- メッセージ編集/削除/スレッドブロードキャストはシステムイベントにマップされます。
- リアクション追加/削除イベントはシステムイベントにマップされます。
- メンバー参加/退出、チャネル作成/名前変更、ピン追加/削除イベントはシステムイベントにマップされます。
- `channel_id_changed`は、`configWrites`が有効な場合にチャネル設定キーを移行できます。
- チャネルtopic/purposeメタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入されることがあります。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシーディングは、該当する場合は設定済み送信者allowlistでフィルタリングされます。
- ブロックアクションとモーダルインタラクションは、豊富なペイロードフィールドを含む構造化された`Slack interaction: ...`システムイベントを出力します:
  - ブロックアクション: 選択値、ラベル、picker値、`workflow_*`メタデータ
  - モーダルの`view_submission`および`view_closed`イベント: ルーティングされたチャネルメタデータとフォーム入力付き

## 設定リファレンスへのポインタ

主要リファレンス:

- [設定リファレンス - Slack](/ja-JP/gateway/configuration-reference#slack)

  重要なSlackフィールド:
  - mode/auth: `mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - DMアクセス: `dm.enabled`、`dmPolicy`、`allowFrom`（旧形式: `dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要な場合以外はoffのままにしてください）
  - チャネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 配信: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
  - 運用/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順に確認してください:

    - `groupPolicy`
    - チャネルallowlist（`channels.slack.channels`）
    - `requireMention`
    - チャネルごとの`users` allowlist

    役立つコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DMメッセージが無視される">
    次を確認してください:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または旧形式の`channels.slack.dm.policy`）
    - ペアリング承認 / allowlistエントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket modeが接続しない">
    ボットトークンとアプリトークン、およびSlackアプリ設定でのSocket Mode有効化を確認してください。

    `openclaw channels status --probe --json`で`botTokenStatus`または
    `appTokenStatus: "configured_unavailable"`が表示される場合、そのSlackアカウントは
    設定済みですが、現在のランタイムではSecretRefで管理された
    値を解決できませんでした。

  </Accordion>

  <Accordion title="HTTP modeでイベントを受信しない">
    次を確認してください:

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - HTTPアカウントごとの一意な`webhookPath`

    アカウントスナップショットに`signingSecretStatus: "configured_unavailable"`が
    表示される場合、そのHTTPアカウントは設定済みですが、現在のランタイムでは
    SecretRefで管理されたsigning secretを解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが発火しない">
    意図していたものを確認してください:

    - Slackに登録された対応するスラッシュコマンドを伴うネイティブコマンドモード（`channels.slack.commands.native: true`）
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    あわせて`commands.useAccessGroups`とチャネル/ユーザーallowlistも確認してください。

  </Accordion>
</AccordionGroup>

## 関連

- [ペアリング](/ja-JP/channels/pairing)
- [グループ](/ja-JP/channels/groups)
- [セキュリティ](/ja-JP/gateway/security)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [トラブルシューティング](/ja-JP/channels/troubleshooting)
- [設定](/ja-JP/gateway/configuration)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
