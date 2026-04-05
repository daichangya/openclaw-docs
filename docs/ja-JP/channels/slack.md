---
read_when:
    - Slack を設定するとき、または Slack の socket/HTTP モードをデバッグするとき
summary: Slack のセットアップとランタイム動作（Socket Mode + HTTP Events API）
title: Slack
x-i18n:
    generated_at: "2026-04-05T12:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

ステータス: Slack アプリ統合を介した DM とチャネルに対して本番運用対応。デフォルトモードは Socket Mode で、HTTP Events API モードもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Slack DM はデフォルトでペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブコマンド動作とコマンドカタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="Socket Mode（デフォルト）">
    <Steps>
      <Step title="Slack アプリとトークンを作成">
        Slack アプリ設定で次を行います。

        - **Socket Mode** を有効化
        - `connections:write` を持つ **App Token**（`xapp-...`）を作成
        - アプリをインストールし、**Bot Token**（`xoxb-...`）をコピー
      </Step>

      <Step title="OpenClaw を設定">

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

        環境変数フォールバック（デフォルトアカウントのみ）:

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="アプリイベントを購読">
        次の bot イベントを購読します。

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        さらに、DM 用に App Home の **Messages Tab** を有効にします。
      </Step>

      <Step title="gateway を起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API モード">
    <Steps>
      <Step title="HTTP 用に Slack アプリを設定">

        - モードを HTTP に設定（`channels.slack.mode="http"`）
        - Slack の **Signing Secret** をコピー
        - Event Subscriptions、Interactivity、Slash command の Request URL を同じ webhook path（デフォルトは `/slack/events`）に設定

      </Step>

      <Step title="OpenClaw の HTTP モードを設定">

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

      </Step>

      <Step title="複数アカウントの HTTP では一意の webhook path を使う">
        アカウントごとの HTTP モードをサポートしています。

        登録が衝突しないよう、各アカウントに異なる `webhookPath` を設定してください。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## マニフェストとスコープのチェックリスト

<AccordionGroup>
  <Accordion title="Slack アプリマニフェストの例" defaultOpen>

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

  </Accordion>

  <Accordion title="オプションの user-token スコープ（読み取り操作）">
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
- 環境変数フォールバック `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` はデフォルトアカウントにのみ適用されます。
- `userToken`（`xoxp-...`）は config 専用です（環境変数フォールバックなし）。デフォルトでは読み取り専用動作（`userTokenReadOnly: true`）です。
- オプション: 送信メッセージでアクティブなエージェントの identity（カスタム `username` と icon）を使いたい場合は `chat:write.customize` を追加してください。`icon_emoji` には `:emoji_name:` 形式を使います。

ステータススナップショットの動作:

- Slack アカウント検査では、認証情報ごとの `*Source` と `*Status` フィールド（`botToken`、`appToken`、`signingSecret`、`userToken`）を追跡します。
- ステータスは `available`、`configured_unavailable`、`missing` です。
- `configured_unavailable` は、そのアカウントが SecretRef または別の非インラインなシークレットソースで設定されているが、現在のコマンド/ランタイム経路では実際の値を解決できなかったことを意味します。
- HTTP モードでは `signingSecretStatus` が含まれます。Socket Mode では必要な組み合わせは `botTokenStatus` + `appTokenStatus` です。

<Tip>
アクションやディレクトリ読み取りでは、設定されていれば user token が優先されることがあります。書き込みでは bot token が引き続き優先されます。user token による書き込みは、`userTokenReadOnly: false` かつ bot token が利用できない場合にのみ許可されます。
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
    `channels.slack.dmPolicy` は DM アクセスを制御します（旧形式: `channels.slack.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.slack.allowFrom` に `"*"` を含める必要があります。旧形式: `channels.slack.dm.allowFrom`）
    - `disabled`

    DM フラグ:

    - `dm.enabled`（デフォルト true）
    - `channels.slack.allowFrom`（推奨）
    - `dm.allowFrom`（旧形式）
    - `dm.groupEnabled`（グループ DM はデフォルト false）
    - `dm.groupChannels`（任意の MPIM allowlist）

    複数アカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合に `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使います。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy` はチャネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャネル allowlist は `channels.slack.channels` 配下にあり、安定したチャネル ID を使うべきです。

    ランタイムに関する注意: `channels.slack` が完全に存在しない場合（環境変数のみのセットアップ）、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告を記録します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID 解決:

    - チャネル allowlist エントリと DM allowlist エントリは、トークンアクセスが許可される場合、起動時に解決されます
    - 解決できなかったチャネル名エントリは設定されたまま保持されますが、デフォルトではルーティングで無視されます
    - 受信認可とチャネルルーティングはデフォルトで ID 優先です。直接の username/slug 一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャネルユーザー">
    チャネルメッセージはデフォルトで mention ゲートが有効です。

    mention ソース:

    - 明示的な app mention（`<@botId>`）
    - mention 正規表現パターン（`agents.list[].groupChat.mentionPatterns`、フォールバックは `messages.groupChat.mentionPatterns`）
    - bot への返信スレッドの暗黙的動作

    チャネルごとの制御（`channels.slack.channels.<id>`。名前は起動時解決または `dangerouslyAllowNameMatching` 経由のみ）:

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      （旧来のプレフィックスなしキーも引き続き `id:` のみにマップされます）

  </Tab>
</Tabs>

## スレッド、セッション、返信タグ

- DM は `direct`、チャネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメインセッションに統合されます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド返信では、必要に応じてスレッドセッション接尾辞（`:thread:<threadTs>`）が作成されます。
- `channels.slack.thread.historyScope` のデフォルトは `thread`、`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存スレッドメッセージ数を制御します（デフォルト `20`。無効化するには `0` に設定）。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all`（デフォルト `off`）
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごと
- ダイレクトチャット向け旧形式フォールバック: `channels.slack.dm.replyToMode`

手動返信タグをサポートしています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む **すべての** Slack 返信スレッドを無効化します。これは Telegram と異なり、Telegram では `"off"` モードでも明示タグが尊重されます。この違いはプラットフォームのスレッドモデルを反映しています。Slack スレッドはメッセージをチャネルから隠しますが、Telegram の返信はメインチャットフロー内で可視のままです。

## 確認リアクション

`ackReaction` は、OpenClaw が受信メッセージを処理中であることを示す確認絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント identity の絵文字フォールバック（`agents.list[].identity.emoji`、なければ `"👀"`）

注:

- Slack では shortcode（例: `"eyes"`）が必要です。
- Slack アカウント単位またはグローバルでリアクションを無効化するには `""` を使います。

## テキストストリーミング

`channels.slack.streaming` はライブプレビュー動作を制御します。

- `off`: ライブプレビューのストリーミングを無効化。
- `partial`（デフォルト）: プレビュー文字列を最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中は進捗ステータステキストを表示し、その後で最終テキストを送信します。

`channels.slack.nativeStreaming` は、`streaming` が `partial` のときに Slack ネイティブのテキストストリーミングを制御します（デフォルト: `true`）。

- Slack ネイティブのテキストストリーミングを表示するには返信スレッドが利用可能である必要があります。スレッド選択は引き続き `replyToMode` に従います。利用できない場合は通常のドラフトプレビューが使われます。
- メディアおよび非テキストのペイロードは通常配信にフォールバックします。
- ストリーミングが返信の途中で失敗した場合、OpenClaw は残りのペイロードを通常配信にフォールバックします。

Slack ネイティブのテキストストリーミングの代わりにドラフトプレビューを使うには:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

旧形式キー:

- `channels.slack.streamMode`（`replace | status_final | append`）は自動的に `channels.slack.streaming` へ移行されます。
- 真偽値の `channels.slack.streaming` は自動的に `channels.slack.nativeStreaming` へ移行されます。

## typing reaction フォールバック

`typingReaction` は、OpenClaw が返信を処理している間、受信した Slack メッセージに一時的なリアクションを追加し、実行終了時に削除します。これは特に、デフォルトの「入力中...」ステータス表示を使うスレッド返信以外で有用です。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注:

- Slack では shortcode（例: `"hourglass_flowing_sand"`）が必要です。
- このリアクションはベストエフォートで、返信または失敗経路の完了後に自動クリーンアップが試行されます。

## メディア、分割、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack ファイル添付は、Slack ホストのプライベート URL からダウンロードされ（トークン認証付きリクエストフロー）、取得に成功しサイズ制限内であればメディアストアに書き込まれます。

    ランタイムの受信サイズ上限は、`channels.slack.mediaMaxMb` で上書きしない限りデフォルトで `20MB` です。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキスト分割には `channels.slack.textChunkLimit`（デフォルト 4000）を使います
    - `channels.slack.chunkMode="newline"` は段落優先の分割を有効化します
    - ファイル送信には Slack の upload API を使い、スレッド返信（`thread_ts`）を含められます
    - 送信メディア上限は、設定されていれば `channels.slack.mediaMaxMb` に従います。未設定の場合、チャネル送信では media pipeline の MIME 種別デフォルトが使われます
  </Accordion>

  <Accordion title="配信先">
    推奨される明示的なターゲット:

    - DM には `user:<id>`
    - チャネルには `channel:<id>`

    Slack DM は、user ターゲットへ送信する際に Slack 会話 API を通じて開かれます。

  </Accordion>
</AccordionGroup>

## コマンドとスラッシュ動作

- Slack のネイティブコマンド自動モードは **オフ** です（`commands.native: "auto"` では Slack ネイティブコマンドは有効になりません）。
- Slack ネイティブコマンドハンドラーを有効にするには `channels.slack.commands.native: true`（またはグローバルの `commands.native: true`）を設定してください。
- ネイティブコマンドが有効な場合は、対応するスラッシュコマンドを Slack に登録してください（`/<command>` 名）。ただし 1 つ例外があります。
  - ステータスコマンドには `/agentstatus` を登録してください（Slack は `/status` を予約しています）
- ネイティブコマンドが有効でない場合は、`channels.slack.slashCommand` により 1 つの設定済みスラッシュコマンドを実行できます。
- ネイティブ引数メニューは、表示戦略を自動調整するようになりました。
  - 最大 5 個の選択肢: button block
  - 6〜100 個の選択肢: static select menu
  - 100 個超の選択肢: interactivity options handler が利用可能な場合は、非同期オプションフィルタ付き external select
  - エンコードされた選択肢の値が Slack 制限を超える場合、フローは button にフォールバックします
- 長い選択肢ペイロードでは、スラッシュコマンド引数メニューは選択値を送信する前に確認ダイアログを使います。

デフォルトのスラッシュコマンド設定:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

スラッシュセッションは分離されたキーを使います。

- `agent:<agentId>:slack:slash:<userId>`

また、コマンド実行は対象会話セッション（`CommandTargetSessionKey`）に対して引き続きルーティングされます。

## インタラクティブ返信

Slack はエージェント作成のインタラクティブ返信コントロールを表示できますが、この機能はデフォルトで無効です。

グローバルに有効化するには:

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

または 1 つの Slack アカウントだけで有効化するには:

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

これらのディレクティブは Slack Block Kit にコンパイルされ、クリックや選択を既存の Slack interaction event 経路へ戻します。

注:

- これは Slack 固有の UI です。他のチャネルでは Slack Block Kit ディレクティブを独自のボタンシステムに変換しません。
- インタラクティブコールバック値は、エージェントが生で記述した値ではなく、OpenClaw が生成した不透明トークンです。
- 生成されたインタラクティブ block が Slack Block Kit の制限を超える場合、OpenClaw は無効な block ペイロードを送信する代わりに元のテキスト返信へフォールバックします。

## Slack での exec 承認

Slack は、Web UI やターミナルにフォールバックする代わりに、インタラクティブボタンと interaction を備えたネイティブ承認クライアントとして動作できます。

- exec 承認はネイティブ DM/チャネルルーティングに `channels.slack.execApprovals.*` を使います。
- plugin 承認も、リクエストがすでに Slack に届いていて承認 ID 種別が `plugin:` の場合、同じ Slack ネイティブのボタン UI で解決できます。
- 承認者の認可は引き続き強制されます。承認または拒否できるのは承認者として識別されたユーザーのみです。

これは他のチャネルと同じ共有承認ボタン UI を使います。Slack アプリ設定で `interactivity` が有効な場合、承認プロンプトは会話内に直接 Block Kit ボタンとして表示されます。
それらのボタンが存在する場合、それが主要な承認 UX です。OpenClaw は、tool result がチャット承認を利用できないと示す場合、または手動承認のみが唯一の経路である場合にのみ、手動の `/approve` コマンドを含めるべきです。

config path:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（任意。可能な場合は `commands.ownerAllowFrom` にフォールバック）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `agentFilter`, `sessionFilter`

Slack は、`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者が解決される場合、ネイティブ exec 承認を自動で有効化します。Slack をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定してください。
承認者が解決されるときにネイティブ承認を強制的にオンにするには `enabled: true` を設定してください。

明示的な Slack exec 承認設定がない場合のデフォルト動作:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

承認者の上書き、フィルター追加、または origin-chat 配信への切り替えをしたい場合にのみ、明示的な Slack ネイティブ設定が必要です。

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

共有の `approvals.exec` 転送は別機能です。exec 承認プロンプトも他のチャットまたは明示的な帯域外ターゲットへルーティングする必要がある場合にのみ使用してください。共有の `approvals.plugin` 転送も別機能です。Slack ネイティブボタンは、それらのリクエストがすでに Slack に届いている場合、引き続き plugin 承認を解決できます。

同一チャット内の `/approve` も、すでにコマンドをサポートしている Slack チャネルと DM で動作します。完全な承認転送モデルについては [Exec approvals](/tools/exec-approvals) を参照してください。

## イベントと運用動作

- メッセージ編集/削除/スレッドブロードキャストは system event にマップされます。
- reaction の追加/削除イベントは system event にマップされます。
- メンバー参加/離脱、チャネル作成/名称変更、pin 追加/削除イベントは system event にマップされます。
- `channel_id_changed` は、`configWrites` が有効な場合にチャネル config キーを移行できます。
- チャネルトピック/目的メタデータは信頼されないコンテキストとして扱われ、ルーティングコンテキストに注入できます。
- スレッド開始メッセージと初期スレッド履歴コンテキストのシーディングは、適用可能な場合、設定済み送信者 allowlist によってフィルタされます。
- Block action と modal interaction は、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` system event を出力します。
  - block action: 選択値、ラベル、picker 値、`workflow_*` メタデータ
  - modal の `view_submission` および `view_closed` イベントと、ルーティングされたチャネルメタデータおよびフォーム入力

## 設定リファレンスへのポインタ

主なリファレンス:

- [Configuration reference - Slack](/gateway/configuration-reference#slack)

  重要な Slack フィールド:
  - モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom`（旧形式: `dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
  - 互換性トグル: `dangerouslyAllowNameMatching`（緊急用。必要な場合を除きオフのままにしてください）
  - チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - 運用/機能: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    次の順で確認してください。

    - `groupPolicy`
    - チャネル allowlist（`channels.slack.channels`）
    - `requireMention`
    - チャネルごとの `users` allowlist

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    次を確認してください。

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（または旧形式の `channels.slack.dm.policy`）
    - pairing 承認 / allowlist エントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode が接続しない">
    bot token と app token、および Slack アプリ設定での Socket Mode 有効化を確認してください。

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
    - HTTP アカウントごとの一意な `webhookPath`

    アカウントスナップショットに `signingSecretStatus: "configured_unavailable"` が
    表示される場合、その HTTP アカウントは設定されていますが、現在のランタイムでは
    SecretRef ベースの signing secret を解決できませんでした。

  </Accordion>

  <Accordion title="ネイティブ/スラッシュコマンドが動作しない">
    意図したものがどちらかを確認してください。

    - ネイティブコマンドモード（`channels.slack.commands.native: true`）で、対応するスラッシュコマンドを Slack に登録している
    - または単一スラッシュコマンドモード（`channels.slack.slashCommand.enabled: true`）

    あわせて `commands.useAccessGroups` とチャネル/ユーザー allowlist も確認してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Configuration](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
