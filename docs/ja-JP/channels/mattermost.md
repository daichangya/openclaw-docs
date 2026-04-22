---
read_when:
    - Mattermost のセットアップ
    - Mattermost のルーティングのデバッグ
summary: Mattermost bot のセットアップと OpenClaw の設定
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

ステータス: バンドル済み Plugin（bot token + WebSocket events）。チャンネル、グループ、DMに対応しています。
Mattermost はセルフホスト可能なチーム向けメッセージングプラットフォームです。製品の詳細とダウンロードについては公式サイト
[mattermost.com](https://mattermost.com) を参照してください。

## バンドル済み Plugin

Mattermost は現在の OpenClaw リリースにバンドル済み Plugin として含まれているため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルドまたは Mattermost を除外したカスタムインストールを使用している場合は、
手動でインストールしてください。

CLI 経由でインストール（npm registry）:

```bash
openclaw plugins install @openclaw/mattermost
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

詳細: [Plugins](/ja-JP/tools/plugin)

## クイックセットアップ

1. Mattermost Plugin が利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースにはすでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. Mattermost bot アカウントを作成し、**bot token** をコピーします。
3. Mattermost の **base URL** をコピーします（例: `https://chat.example.com`）。
4. OpenClaw を設定して Gateway を起動します。

最小構成:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## ネイティブ slash command

ネイティブ slash command はオプトインです。有効にすると、OpenClaw は Mattermost API 経由で `oc_*` slash command を登録し、
Gateway HTTP サーバー上で callback POST を受け取ります。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost から Gateway に直接到達できない場合に使用します（reverse proxy/public URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注:

- `native: "auto"` は Mattermost ではデフォルトで無効です。有効にするには `native: true` を設定してください。
- `callbackUrl` を省略すると、OpenClaw は Gateway の host/port と `callbackPath` から導出します。
- マルチアカウント構成では、`commands` はトップレベルまたは
  `channels.mattermost.accounts.<id>.commands` の下に設定できます（アカウント値はトップレベルのフィールドを上書きします）。
- command callback は、OpenClaw が `oc_*` command を登録したときに Mattermost から返される
  command ごとの token で検証されます。
- slash callback は、登録に失敗した場合、起動が部分的だった場合、または
  callback token が登録済み command のいずれとも一致しない場合に fail closed します。
- 到達性の要件: callback endpoint は Mattermost サーバーから到達可能でなければなりません。
  - Mattermost が OpenClaw と同じ host/network namespace 上で動作している場合を除き、`callbackUrl` に `localhost` を設定しないでください。
  - その URL が `/api/channels/mattermost/command` を OpenClaw に reverse proxy していない限り、`callbackUrl` に Mattermost の base URL を設定しないでください。
  - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく、OpenClaw からの `405 Method Not Allowed` を返すはずです。
- Mattermost egress allowlist の要件:
  - callback の送信先が private/tailnet/internal アドレスの場合は、Mattermost の
    `ServiceSettings.AllowedUntrustedInternalConnections` に callback の host/domain を含めてください。
  - 完全な URL ではなく、host/domain エントリを使用してください。
    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

## 環境変数（デフォルトアカウント）

環境変数を使いたい場合は、これらを Gateway host に設定してください:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

環境変数は **default** アカウント（`default`）にのみ適用されます。その他のアカウントでは config 値を使用する必要があります。

## チャットモード

Mattermost は DM に自動で応答します。チャンネルでの動作は `chatmode` で制御されます:

- `oncall`（デフォルト）: チャンネル内で @mention されたときだけ応答します。
- `onmessage`: すべてのチャンネルメッセージに応答します。
- `onchar`: メッセージがトリガー接頭辞で始まると応答します。

設定例:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注:

- `onchar` は明示的な @mention に対しても引き続き応答します。
- `channels.mattermost.requireMention` はレガシー config では尊重されますが、`chatmode` の使用を推奨します。

## スレッドとセッション

`channels.mattermost.replyToMode` を使用して、チャンネルとグループへの返信を
メインチャンネルに残すか、トリガーとなった投稿の下でスレッドを開始するかを制御します。

- `off`（デフォルト）: 受信した投稿がすでにスレッド内にある場合にのみ、スレッドで返信します。
- `first`: トップレベルのチャンネル/グループ投稿では、その投稿の下にスレッドを開始し、
  会話をスレッドスコープのセッションにルーティングします。
- `all`: 現在の Mattermost では `first` と同じ動作です。
- ダイレクトメッセージはこの設定を無視し、スレッド化されません。

設定例:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

注:

- スレッドスコープのセッションでは、トリガーとなった投稿 id をスレッド root として使用します。
- `first` と `all` は現在は同等です。Mattermost にスレッド root ができると、
  後続の chunk と media は同じスレッド内で継続されるためです。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（不明な送信者には pairing code が送られます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャンネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（mention 制御）。
- `channels.mattermost.groupAllowFrom` で送信者を allowlist に追加します（user ID 推奨）。
- チャンネルごとの mention 上書きは `channels.mattermost.groups.<channelId>.requireMention`
  またはデフォルト用の `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` の一致は可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true` の場合にのみ有効です。
- 公開チャンネル: `channels.mattermost.groupPolicy="open"`（mention 制御）。
- ランタイム注記: `channels.mattermost` が完全に欠けている場合、ランタイムはグループチェックに `groupPolicy="allowlist"` をフォールバックとして使用します（`channels.defaults.groupPolicy` が設定されていても同様です）。

例:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 外向き配信用の target

これらの target 形式を `openclaw message send` または Cron/Webhook で使用します:

- チャンネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username`（Mattermost API 経由で解決）

素の opaque ID（`64ifufp...` のようなもの）は Mattermost では **曖昧** です（user ID か channel ID か）。

OpenClaw はこれらを **user 優先** で解決します:

- ID が user として存在する場合（`GET /api/v4/users/<id>` が成功する場合）、OpenClaw は `/api/v4/channels/direct` を介して direct channel を解決し、**DM** を送信します。
- それ以外の場合、その ID は **channel ID** として扱われます。

動作を確定させたい場合は、必ず明示的な接頭辞（`user:<id>` / `channel:<id>`）を使用してください。

## DM channel retry

OpenClaw が Mattermost の DM target に送信し、最初に direct channel を解決する必要がある場合、
デフォルトで一時的な direct-channel 作成失敗を retry します。

この動作を Mattermost Plugin 全体で調整するには `channels.mattermost.dmChannelRetry` を、
特定のアカウントだけに適用するには `channels.mattermost.accounts.<id>.dmChannelRetry` を使用します。

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

注:

- これはすべての Mattermost API 呼び出しではなく、DM channel 作成（`/api/v4/channels/direct`）にのみ適用されます。
- retry は、レート制限、5xx 応答、ネットワークエラー、タイムアウトエラーなどの一時的失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは恒久的エラーとして扱われ、retry されません。

## プレビュー streaming

Mattermost は、thinking、tool activity、部分的な返信テキストを 1 つの **draft preview post** に streaming し、安全に最終回答を送信できる時点でその場で確定します。プレビューは chunk ごとのメッセージでチャンネルを埋めるのではなく、同じ post id 上で更新されます。media/error の最終送信時には、保留中のプレビュー編集をキャンセルし、使い捨てのプレビューポストを flush する代わりに通常の配信を使用します。

`channels.mattermost.streaming` で有効化します:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

注:

- `partial` が通常の選択です: 返信が伸びるにつれて編集される 1 つのプレビューポストを使い、最後に完全な回答で確定します。
- `block` はプレビューポスト内で追記スタイルの draft chunk を使用します。
- `progress` は生成中にステータスプレビューを表示し、完了時にのみ最終回答を投稿します。
- `off` は preview streaming を無効にします。
- ストリームをその場で確定できない場合（たとえば post が stream の途中で削除された場合）、OpenClaw は新しい最終 post の送信にフォールバックするため、返信が失われることはありません。
- チャンネルごとの対応マトリクスは [Streaming](/ja-JP/concepts/streaming#preview-streaming-modes) を参照してください。

## Reactions（message tool）

- `channel=mattermost` で `message action=react` を使用します。
- `messageId` は Mattermost の post id です。
- `emoji` には `thumbsup` や `:+1:` のような名前を指定できます（コロンは省略可能です）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、ルーティングされた agent session に system event として転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: reaction action の有効/無効を切り替えます（デフォルト true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（message tool）

クリック可能なボタン付きのメッセージを送信します。ユーザーがボタンをクリックすると、agent が
その選択を受け取り、応答できます。

チャンネル capabilities に `inlineButtons` を追加してボタンを有効にします:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメータ付きで `message action=send` を使用します。ボタンは 2 次元配列（ボタンの行）です:

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンのフィールド:

- `text`（必須）: 表示ラベル。
- `callback_data`（必須）: クリック時に返される値（action ID として使用）。
- `style`（任意）: `"default"`、`"primary"`、または `"danger"`。

ユーザーがボタンをクリックすると:

1. すべてのボタンが確認行に置き換えられます（例: "✓ **Yes** selected by @user"）。
2. agent がその選択を受信メッセージとして受け取り、応答します。

注:

- ボタン callback には HMAC-SHA256 検証が使用されます（自動で行われ、設定は不要です）。
- Mattermost は API 応答から callback data を削除するため（セキュリティ機能）、クリック時にはすべてのボタンが
  削除されます。部分的な削除はできません。
- ハイフンまたはアンダースコアを含む action ID は自動的にサニタイズされます
  （Mattermost のルーティング制限）。

設定:

- `channels.mattermost.capabilities`: capability 文字列の配列です。agent system prompt でボタン tool の説明を有効にするには
  `"inlineButtons"` を追加します。
- `channels.mattermost.interactions.callbackBaseUrl`: ボタン callback 用の任意の外部 base URL です
  （例: `https://gateway.example.com`）。Mattermost が bind host 上の Gateway に直接
  到達できない場合に使用します。
- マルチアカウント構成では、同じフィールドを
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` の下にも設定できます。
- `interactions.callbackBaseUrl` を省略すると、OpenClaw は callback URL を
  `gateway.customBindHost` + `gateway.port` から導出し、その後 `http://localhost:<port>` にフォールバックします。
- 到達性ルール: ボタン callback URL は Mattermost サーバーから到達可能でなければなりません。
  `localhost` が機能するのは、Mattermost と OpenClaw が同じ host/network namespace で動作している場合のみです。
- callback の送信先が private/tailnet/internal の場合は、その host/domain を Mattermost の
  `ServiceSettings.AllowedUntrustedInternalConnections` に追加してください。

### Direct API integration（外部スクリプト）

外部スクリプトと Webhook は、agent の `message` tool を経由せず、
Mattermost REST API 経由で直接ボタンを投稿できます。可能であれば extension の `buildButtonAttachments()` を使用し、
raw JSON を投稿する場合は次のルールに従ってください。

**ペイロード構造:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 英数字のみ — 詳細は下記を参照
            type: "button", // 必須。これがないとクリックは黙って無視されます
            name: "Approve", // 表示ラベル
            style: "primary", // 任意: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン id と一致している必要があります（名前参照に使用）
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 詳細は下記の HMAC セクションを参照
              },
            },
          },
        ],
      },
    ],
  },
}
```

**重要なルール:**

1. attachment はトップレベルの `attachments` ではなく `props.attachments` に配置します（そうしないと黙って無視されます）。
2. すべての action には `type: "button"` が必要です。これがないと、クリックは黙って吸収されます。
3. すべての action には `id` フィールドが必要です。Mattermost は ID のない action を無視します。
4. Action の `id` は **英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは
   Mattermost のサーバー側 action ルーティングを壊します（404 を返します）。使用前に除去してください。
5. `context.action_id` はボタンの `id` と一致している必要があります。これにより、確認メッセージに
   raw ID ではなくボタン名（例: 「Approve」）が表示されます。
6. `context.action_id` は必須です。ない場合、interaction handler は 400 を返します。

**HMAC token の生成:**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、
Gateway の検証ロジックに一致する token を生成する必要があります。

1. bot token から secret を導出します:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` を除くすべてのフィールドを含む context object を構築します。
3. **キーをソート**し、**スペースなし**でシリアライズします（Gateway はキーをソートした `JSON.stringify`
   を使用し、コンパクトな出力を生成します）。
4. 署名します: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 得られた hex digest を `_token` として context に追加します。

Python の例:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

よくある HMAC の落とし穴:

- Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。JavaScript のコンパクト出力（`{"key":"val"}`）に合わせるには
  `separators=(",", ":")` を使用してください。
- 必ず **すべて** の context フィールド（`_token` を除く）に署名してください。Gateway は `_token` を取り除いた後で
  残りすべてに署名します。一部だけに署名すると、黙って検証に失敗します。
- `sort_keys=True` を使用してください。Gateway は署名前にキーをソートし、Mattermost は
  ペイロード保存時に context フィールドを並べ替える可能性があります。
- secret はランダムバイトではなく bot token から導出してください（決定的です）。この secret は、
  ボタンを作成するプロセスと検証する Gateway の間で同一である必要があります。

## Directory adapter

Mattermost Plugin には、Mattermost API 経由でチャンネル名とユーザー名を解決する
directory adapter が含まれています。これにより、`openclaw message send` と Cron/Webhook 配信で
`#channel-name` と `@username` の target が有効になります。

設定は不要です。この adapter はアカウント config の bot token を使用します。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` の下で複数アカウントをサポートしています:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## トラブルシューティング

- チャンネルで返信がない: bot がそのチャンネルに参加していることを確認し、@mention する（oncall）、トリガー接頭辞を使う（onchar）、または `chatmode: "onmessage"` を設定してください。
- 認証エラー: bot token、base URL、アカウントが有効かどうかを確認してください。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ネイティブ slash command が `Unauthorized: invalid command token.` を返す: OpenClaw が
  callback token を受け付けませんでした。一般的な原因:
  - slash command の登録が失敗した、または起動時に一部しか完了しなかった
  - callback が誤った Gateway/アカウントに到達している
  - Mattermost に、以前の callback target を指す古い command が残っている
  - Gateway が slash command を再有効化せずに再起動した
- ネイティブ slash command が動かなくなった場合は、ログで
  `mattermost: failed to register slash commands` または
  `mattermost: native slash commands enabled but no commands could be registered`
  を確認してください。
- `callbackUrl` を省略し、ログで callback が
  `http://127.0.0.1:18789/...` に解決されたという警告が出る場合、その URL は
  Mattermost が OpenClaw と同じ host/network namespace で動作している場合にしか到達できない可能性があります。代わりに、
  外部から到達可能な `commands.callbackUrl` を明示的に設定してください。
- ボタンが白いボックスとして表示される: agent が不正なボタンデータを送信している可能性があります。各ボタンに `text` と `callback_data` の両方のフィールドがあることを確認してください。
- ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および ServiceSettings で `EnablePostActionIntegration` が `true` であることを確認してください。
- クリック時にボタンが 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost の action router は英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
- Gateway ログに `invalid _token`: HMAC の不一致です。すべての context フィールド（一部ではなく）に署名していること、キーをソートしていること、コンパクト JSON（スペースなし）を使っていることを確認してください。上記の HMAC セクションを参照してください。
- Gateway ログに `missing _token in context`: `_token` フィールドがボタンの context にありません。integration payload 作成時に含めていることを確認してください。
- 確認にボタン名ではなく raw ID が表示される: `context.action_id` がボタンの `id` と一致していません。両方に同じサニタイズ済み値を設定してください。
- Agent がボタンを認識しない: Mattermost チャンネル config に `capabilities: ["inlineButtons"]` を追加してください。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証と pairing フロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作と mention 制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
