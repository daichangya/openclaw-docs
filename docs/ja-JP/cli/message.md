---
read_when:
    - message CLI アクションを追加または変更するとき
    - 送信チャネルの動作を変更するとき
summary: '`openclaw message` の CLI リファレンス（send + チャネルアクション）'
title: message
x-i18n:
    generated_at: "2026-04-05T12:39:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

メッセージ送信とチャネルアクションのための単一の送信コマンド
（Discord/Google Chat/iMessage/Matrix/Mattermost（plugin）/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 使用方法

```
openclaw message <subcommand> [flags]
```

チャネル選択:

- 2 つ以上のチャネルが設定されている場合、`--channel` が必須です。
- ちょうど 1 つのチャネルだけが設定されている場合、それがデフォルトになります。
- 値: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（Mattermost には plugin が必要）

ターゲット形式（`--target`）:

- WhatsApp: E.164 または group JID
- Telegram: chat id または `@username`
- Discord: `channel:<id>` または `user:<id>`（または `<@id>` メンション。生の数値 id はチャネルとして扱われます）
- Google Chat: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>`（生の channel id も受け付けます）
- Mattermost（plugin）: `channel:<id>`、`user:<id>`、または `@username`（プレフィックスなし id はチャネルとして扱われます）
- Signal: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: handle、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- Matrix: `@user:server`、`!room:server`、または `#alias:server`
- Microsoft Teams: conversation id（`19:...@thread.tacv2`）または `conversation:<id>` または `user:<aad-object-id>`

名前解決:

- サポート対象プロバイダー（Discord/Slack など）では、`Help` や `#help` のようなチャネル名は directory cache 経由で解決されます。
- cache miss の場合、プロバイダーが対応していれば、OpenClaw は live directory lookup を試行します。

## 共通フラグ

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（send/poll/read などのターゲットチャネルまたはユーザー）
- `--targets <name>`（繰り返し指定。broadcast のみ）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef の挙動

- `openclaw message` は、選択したアクションを実行する前に、サポート対象チャネルの SecretRef を解決します。
- 解決は可能な限りアクティブなアクションターゲットにスコープされます:
  - `--channel` が設定されている場合のチャネルスコープ（または `discord:...` のようなプレフィックス付きターゲットから推定される場合）
  - `--account` が設定されている場合のアカウントスコープ（チャネル globals + 選択したアカウント surface）
  - `--account` が省略されている場合、OpenClaw は `default` アカウントの SecretRef スコープを強制しません
- 関連のないチャネル上の未解決 SecretRef は、ターゲット指定されたメッセージアクションを妨げません。
- 選択したチャネル/アカウントの SecretRef が未解決の場合、そのアクションではコマンドは fail-closed します。

## アクション

### コア

- `send`
  - チャネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（plugin）/Signal/iMessage/Matrix/Microsoft Teams
  - 必須: `--target`、および `--message` または `--media`
  - 任意: `--media`、`--interactive`、`--buttons`、`--components`、`--card`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共通 interactive payload: `--interactive` は、対応している場合にチャネルネイティブの interactive JSON payload を送信します
  - Telegram のみ: `--buttons`（`channels.telegram.capabilities.inlineButtons` で許可されている必要があります）
  - Telegram のみ: `--force-document`（Telegram の圧縮を避けるために画像と GIF を document として送信）
  - Telegram のみ: `--thread-id`（forum topic id）
  - Slack のみ: `--thread-id`（thread timestamp。`--reply-to` は同じフィールドを使います）
  - Discord のみ: `--components` JSON payload
  - Adaptive Card 対応チャネル: 対応している場合の `--card` JSON payload
  - Telegram + Discord: `--silent`
  - WhatsApp のみ: `--gif-playback`

- `poll`
  - チャネル: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必須: `--target`、`--poll-question`、`--poll-option`（繰り返し）
  - 任意: `--poll-multi`
  - Discord のみ: `--poll-duration-hours`、`--silent`、`--message`
  - Telegram のみ: `--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - チャネル: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注記: `--remove` には `--emoji` が必要です（対応している場合に自分のリアクションを消去するには `--emoji` を省略します。詳細は /tools/reactions を参照）
  - WhatsApp のみ: `--participant`、`--from-me`
  - Signal グループリアクション: `--target-author` または `--target-author-uuid` が必須

- `reactions`
  - チャネル: Discord/Google Chat/Slack/Matrix
  - 必須: `--message-id`、`--target`
  - 任意: `--limit`

- `read`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--target`
  - 任意: `--limit`、`--before`、`--after`
  - Discord のみ: `--around`

- `edit`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--message`、`--target`

- `delete`
  - チャネル: Discord/Slack/Telegram/Matrix
  - 必須: `--message-id`、`--target`

- `pin` / `unpin`
  - チャネル: Discord/Slack/Matrix
  - 必須: `--message-id`、`--target`

- `pins`（一覧）
  - チャネル: Discord/Slack/Matrix
  - 必須: `--target`

- `permissions`
  - チャネル: Discord/Matrix
  - 必須: `--target`
  - Matrix のみ: Matrix encryption が有効で verification action が許可されている場合に利用可能

- `search`
  - チャネル: Discord
  - 必須: `--guild-id`、`--query`
  - 任意: `--channel-id`、`--channel-ids`（繰り返し）、`--author-id`、`--author-ids`（繰り返し）、`--limit`

### スレッド

- `thread create`
  - チャネル: Discord
  - 必須: `--thread-name`、`--target`（channel id）
  - 任意: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - チャネル: Discord
  - 必須: `--guild-id`
  - 任意: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - チャネル: Discord
  - 必須: `--target`（thread id）、`--message`
  - 任意: `--media`、`--reply-to`

### 絵文字

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 追加フラグなし

- `emoji upload`
  - チャネル: Discord
  - 必須: `--guild-id`、`--emoji-name`、`--media`
  - 任意: `--role-ids`（繰り返し）

### ステッカー

- `sticker send`
  - チャネル: Discord
  - 必須: `--target`、`--sticker-id`（繰り返し）
  - 任意: `--message`

- `sticker upload`
  - チャネル: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### ロール / チャネル / メンバー / Voice

- `role info`（Discord）: `--guild-id`
- `role add` / `role remove`（Discord）: `--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）: `--target`
- `channel list`（Discord）: `--guild-id`
- `member info`（Discord/Slack）: `--user-id`（Discord ではさらに `--guild-id`）
- `voice status`（Discord）: `--guild-id`、`--user-id`

### イベント

- `event list`（Discord）: `--guild-id`
- `event create`（Discord）: `--guild-id`、`--event-name`、`--start-time`
  - 任意: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### モデレーション（Discord）

- `timeout`: `--guild-id`、`--user-id`（任意で `--duration-min` または `--until`。どちらも省略すると timeout を解除）
- `kick`: `--guild-id`、`--user-id`（+ `--reason`）
- `ban`: `--guild-id`、`--user-id`（+ `--delete-days`、`--reason`）
  - `timeout` でも `--reason` をサポートします

### Broadcast

- `broadcast`
  - チャネル: 設定済みの任意のチャネル。すべてのプロバイダーを対象にするには `--channel all` を使います
  - 必須: `--targets <target...>`
  - 任意: `--message`、`--media`、`--dry-run`

## 例

Discord で返信を送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

components 付きの Discord メッセージを送信する:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

完全な schema については [Discord components](/channels/discord#interactive-components) を参照してください。

共通 interactive payload を送信する:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Discord poll を作成する:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram poll を作成する（2 分後に自動終了）:

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams の proactive message を送信する:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams poll を作成する:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack でリアクションする:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal グループでリアクションする:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram のインラインボタンを送信する:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Teams Adaptive Card を送信する:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Telegram の画像を圧縮回避のため document として送信する:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
