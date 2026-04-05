---
read_when:
    - Mattermost をセットアップしている
    - Mattermost のルーティングをデバッグしている
summary: Mattermost ボットのセットアップと OpenClaw の設定
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T12:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

ステータス: バンドルされたプラグイン（ボットトークン + WebSocket イベント）。チャネル、グループ、DM をサポートしています。
Mattermost はセルフホスト可能なチーム向けメッセージングプラットフォームです。製品の詳細とダウンロードについては、公式サイト
[mattermost.com](https://mattermost.com) を参照してください。

## バンドルされたプラグイン

Mattermost は現在の OpenClaw リリースではバンドルされたプラグインとして同梱されているため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドまたは Mattermost を含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

CLI でインストール（npm レジストリ）:

```bash
openclaw plugins install @openclaw/mattermost
```

ローカルチェックアウト（git リポジトリから実行している場合）:

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

詳細: [Plugins](/tools/plugin)

## クイックセットアップ

1. Mattermost プラグインが利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. Mattermost のボットアカウントを作成し、**bot token** をコピーします。
3. Mattermost の **base URL** をコピーします（例: `https://chat.example.com`）。
4. OpenClaw を設定して Gateway を起動します。

最小設定:

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

## ネイティブスラッシュコマンド

ネイティブスラッシュコマンドはオプトインです。有効にすると、OpenClaw は
Mattermost API 経由で `oc_*` スラッシュコマンドを登録し、Gateway HTTP サーバー上で
コールバック POST を受信します。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost から Gateway に直接到達できない場合に使用します（リバースプロキシ/公開 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注意:

- `native: "auto"` は Mattermost ではデフォルトで無効です。有効にするには `native: true` を設定してください。
- `callbackUrl` を省略した場合、OpenClaw は Gateway の host/port と `callbackPath` から導出します。
- マルチアカウント構成では、`commands` は最上位または
  `channels.mattermost.accounts.<id>.commands` の下に設定できます（アカウント値が最上位フィールドを上書きします）。
- コマンドコールバックは、OpenClaw が `oc_*` コマンドを登録した際に Mattermost から返される
  コマンドごとのトークンで検証されます。
- スラッシュコールバックは、登録に失敗した場合、起動が部分的にしか完了しなかった場合、
  またはコールバックトークンが登録済みコマンドのいずれにも一致しない場合にフェイルクローズします。
- 到達可能性の要件: コールバックエンドポイントは Mattermost サーバーから到達可能である必要があります。
  - Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で動作していない限り、`callbackUrl` に `localhost` を設定しないでください。
  - その URL が `/api/channels/mattermost/command` を OpenClaw にリバースプロキシしていない限り、`callbackUrl` に Mattermost の base URL を設定しないでください。
  - 簡単な確認方法は `curl https://<gateway-host>/api/channels/mattermost/command` です。GET は `404` ではなく OpenClaw から `405 Method Not Allowed` を返す必要があります。
- Mattermost の送信先許可リスト要件:
  - コールバックがプライベート/Tailnet/内部アドレスを対象にする場合は、Mattermost の
    `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含めてください。
  - 完全な URL ではなく、ホスト/ドメインのエントリを使用してください。
    - 良い例: `gateway.tailnet-name.ts.net`
    - 悪い例: `https://gateway.tailnet-name.ts.net`

## 環境変数（デフォルトアカウント）

環境変数を使いたい場合は、Gateway ホストで次を設定します。

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

環境変数は **default** アカウント（`default`）にのみ適用されます。他のアカウントでは設定値を使用する必要があります。

## チャットモード

Mattermost は DM には自動で応答します。チャネルでの挙動は `chatmode` で制御されます。

- `oncall`（デフォルト）: チャネルでは @メンションされたときだけ応答します。
- `onmessage`: すべてのチャネルメッセージに応答します。
- `onchar`: メッセージがトリガープレフィックスで始まると応答します。

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

注意:

- `onchar` は明示的な @メンションにも引き続き応答します。
- `channels.mattermost.requireMention` は従来の設定との互換性のために尊重されますが、`chatmode` の使用が推奨されます。

## スレッド化とセッション

`channels.mattermost.replyToMode` を使用すると、チャネルおよびグループへの返信を
メインチャネルに保持するか、トリガーとなった投稿の下でスレッドを開始するかを制御できます。

- `off`（デフォルト）: 受信した投稿がすでにスレッド内にある場合にのみスレッドで返信します。
- `first`: 最上位のチャネル/グループ投稿に対して、その投稿の下にスレッドを開始し、
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

注意:

- スレッドスコープのセッションは、トリガーとなった投稿 ID をスレッドルートとして使用します。
- `first` と `all` は現在同等です。Mattermost にスレッドルートが一度できると、
  後続のチャンクとメディアは同じスレッド内で継続されるためです。

## アクセス制御（DM）

- デフォルト: `channels.mattermost.dmPolicy = "pairing"`（未知の送信者にはペアリングコードが渡されます）。
- 承認方法:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公開 DM: `channels.mattermost.dmPolicy="open"` と `channels.mattermost.allowFrom=["*"]`。

## チャネル（グループ）

- デフォルト: `channels.mattermost.groupPolicy = "allowlist"`（メンションゲートあり）。
- `channels.mattermost.groupAllowFrom` で送信者を許可リストに追加します（ユーザー ID 推奨）。
- チャネルごとのメンション上書きは `channels.mattermost.groups.<channelId>.requireMention`
  またはデフォルト用の `channels.mattermost.groups["*"].requireMention` にあります。
- `@username` のマッチングは可変であり、`channels.mattermost.dangerouslyAllowNameMatching: true` のときだけ有効です。
- オープンチャネル: `channels.mattermost.groupPolicy="open"`（メンションゲートあり）。
- ランタイム上の注意: `channels.mattermost` が完全に存在しない場合、ランタイムはグループチェックで
  `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されていても同様です）。

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

## 送信配信のターゲット

`openclaw message send` または cron/webhook では、次のターゲット形式を使用します。

- チャネルには `channel:<id>`
- DM には `user:<id>`
- DM には `@username` も使用可能です（Mattermost API 経由で解決されます）

プレフィックスのない不透明 ID（`64ifufp...` のようなもの）は、Mattermost では **曖昧** です（ユーザー ID かチャネル ID か）。

OpenClaw はこれを **ユーザー優先** で解決します。

- その ID がユーザーとして存在する場合（`GET /api/v4/users/<id>` が成功）、OpenClaw は
  `/api/v4/channels/direct` でダイレクトチャネルを解決して **DM** を送信します。
- それ以外の場合、その ID は **チャネル ID** として扱われます。

決定的な動作が必要な場合は、必ず明示的なプレフィックス（`user:<id>` / `channel:<id>`）を使用してください。

## DM チャネル再試行

OpenClaw が Mattermost の DM ターゲットに送信し、最初にダイレクトチャネルを解決する必要がある場合、
デフォルトで一時的なダイレクトチャネル作成失敗を再試行します。

この挙動を Mattermost プラグイン全体で調整するには `channels.mattermost.dmChannelRetry` を、
1 つのアカウントだけに適用するには `channels.mattermost.accounts.<id>.dmChannelRetry` を使います。

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

注意:

- これはすべての Mattermost API 呼び出しではなく、DM チャネル作成（`/api/v4/channels/direct`）にのみ適用されます。
- 再試行は、レート制限、5xx 応答、ネットワークエラー、タイムアウトエラーなどの一時的失敗に適用されます。
- `429` 以外の 4xx クライアントエラーは恒久的な失敗として扱われ、再試行されません。

## リアクション（message ツール）

- `channel=mattermost` とともに `message action=react` を使用します。
- `messageId` は Mattermost の投稿 ID です。
- `emoji` は `thumbsup` や `:+1:` のような名前を受け付けます（コロンは省略可能です）。
- リアクションを削除するには `remove=true`（boolean）を設定します。
- リアクションの追加/削除イベントは、ルーティングされたエージェントセッションにシステムイベントとして転送されます。

例:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

設定:

- `channels.mattermost.actions.reactions`: リアクション操作を有効/無効にします（デフォルトは true）。
- アカウントごとの上書き: `channels.mattermost.accounts.<id>.actions.reactions`。

## インタラクティブボタン（message ツール）

クリック可能なボタン付きメッセージを送信します。ユーザーがボタンをクリックすると、エージェントが
選択内容を受け取り、応答できます。

チャネル機能に `inlineButtons` を追加してボタンを有効化します。

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` パラメータ付きで `message action=send` を使用します。ボタンは 2 次元配列（ボタンの行）です。

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

ボタンフィールド:

- `text`（必須）: 表示ラベル。
- `callback_data`（必須）: クリック時に送り返される値（アクション ID として使用）。
- `style`（省略可）: `"default"`、`"primary"`、または `"danger"`。

ユーザーがボタンをクリックすると:

1. すべてのボタンが確認行に置き換えられます（例: 「✓ **Yes** selected by @user」）。
2. エージェントが選択内容を受信メッセージとして受け取り、応答します。

注意:

- ボタンコールバックは HMAC-SHA256 検証を使用します（自動、設定不要）。
- Mattermost は API 応答から callback data を削除するため（セキュリティ機能）、
  クリック時にはすべてのボタンが削除されます。部分削除はできません。
- ハイフンやアンダースコアを含むアクション ID は自動的にサニタイズされます
  （Mattermost のルーティング制限）。

設定:

- `channels.mattermost.capabilities`: 機能文字列の配列。ボタンツールの説明をエージェントのシステムプロンプトで有効にするには
  `"inlineButtons"` を追加します。
- `channels.mattermost.interactions.callbackBaseUrl`: ボタンコールバック用の省略可能な外部 base URL
  （例: `https://gateway.example.com`）。Mattermost が
  bind host 上の Gateway に直接到達できない場合に使用します。
- マルチアカウント構成では、同じフィールドを
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` に設定することもできます。
- `interactions.callbackBaseUrl` を省略した場合、OpenClaw は
  `gateway.customBindHost` + `gateway.port` からコールバック URL を導出し、その後 `http://localhost:<port>` にフォールバックします。
- 到達可能性ルール: ボタンコールバック URL は Mattermost サーバーから到達可能である必要があります。
  `localhost` が機能するのは、Mattermost と OpenClaw が同じホスト/ネットワーク名前空間で動作している場合だけです。
- コールバック対象がプライベート/Tailnet/内部の場合は、そのホスト/ドメインを Mattermost の
  `ServiceSettings.AllowedUntrustedInternalConnections` に追加してください。

### 直接 API 統合（外部スクリプト）

外部スクリプトや webhook は、エージェントの `message` ツールを経由せず、
Mattermost REST API 経由でボタンを直接投稿できます。可能であれば拡張機能の
`buildButtonAttachments()` を使用してください。生の JSON を投稿する場合は、次のルールに従ってください。

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
            id: "mybutton01", // 英数字のみ — 下記参照
            type: "button", // 必須。これがないとクリックは黙って無視される
            name: "Approve", // 表示ラベル
            style: "primary", // 省略可: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // ボタン id と一致する必要がある（名前参照のため）
                action: "approve",
                // ... 任意のカスタムフィールド ...
                _token: "<hmac>", // 下記の HMAC セクションを参照
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

1. attachments は最上位の `attachments` ではなく `props.attachments` に入れます（そうしないと黙って無視されます）。
2. すべての action に `type: "button"` が必要です。これがないとクリックは黙って飲み込まれます。
3. すべての action に `id` フィールドが必要です。Mattermost は ID のない action を無視します。
4. action の `id` は **英数字のみ**（`[a-zA-Z0-9]`）でなければなりません。ハイフンとアンダースコアは
   Mattermost のサーバー側 action ルーティングを壊します（404 を返します）。使用前に除去してください。
5. 確認メッセージに生の ID ではなくボタン名（例: 「Approve」）を表示するには、
   `context.action_id` をボタンの `id` と一致させる必要があります。
6. `context.action_id` は必須です。これがないと interaction handler は 400 を返します。

**HMAC トークン生成:**

Gateway は HMAC-SHA256 でボタンクリックを検証します。外部スクリプトは、
Gateway の検証ロジックに一致するトークンを生成する必要があります。

1. ボットトークンからシークレットを導出します:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token` を除くすべてのフィールドを含む context オブジェクトを構築します。
3. **キーをソート**し、**スペースなし**でシリアライズします（Gateway は
   キーをソートした `JSON.stringify` を使用し、コンパクトな出力を生成します）。
4. 署名します: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 結果の 16 進ダイジェストを `_token` として context に追加します。

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

- Python の `json.dumps` はデフォルトでスペースを追加します（`{"key": "val"}`）。
  JavaScript のコンパクトな出力（`{"key":"val"}`）に合わせるには
  `separators=(",", ":")` を使用してください。
- 必ず **すべて** の context フィールド（`_token` を除く）に署名してください。Gateway は `_token` を取り除いた後、
  残りすべてに署名します。一部だけに署名すると検証は黙って失敗します。
- `sort_keys=True` を使ってください。Gateway は署名前にキーをソートし、Mattermost は
  ペイロード保存時に context フィールドを並べ替える場合があります。
- ランダムバイトではなく、ボットトークンからシークレットを導出してください（決定的です）。シークレットは、
  ボタンを作成するプロセスと Gateway 側で検証するプロセスで同一でなければなりません。

## ディレクトリアダプター

Mattermost プラグインには、Mattermost API 経由でチャネル名とユーザー名を解決する
ディレクトリアダプターが含まれています。これにより、
`openclaw message send` や cron/webhook 配信で `#channel-name` と `@username` ターゲットを使用できます。

設定は不要です。このアダプターはアカウント設定のボットトークンを使用します。

## マルチアカウント

Mattermost は `channels.mattermost.accounts` 配下で複数アカウントをサポートします。

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

- チャネルで返信がない: ボットがチャネルに参加していることを確認し、メンションする（oncall）、トリガープレフィックスを使う（onchar）、または `chatmode: "onmessage"` を設定してください。
- 認証エラー: ボットトークン、base URL、アカウントが有効かどうかを確認してください。
- マルチアカウントの問題: 環境変数は `default` アカウントにのみ適用されます。
- ネイティブスラッシュコマンドが `Unauthorized: invalid command token.` を返す: OpenClaw が
  コールバックトークンを受け入れませんでした。典型的な原因:
  - スラッシュコマンド登録が失敗した、または起動時に部分的にしか完了しなかった
  - コールバックが誤った Gateway/アカウントに到達している
  - Mattermost に以前のコールバックターゲットを指す古いコマンドが残っている
  - Gateway がスラッシュコマンドを再有効化せずに再起動した
- ネイティブスラッシュコマンドが動かなくなった場合は、ログで
  `mattermost: failed to register slash commands` または
  `mattermost: native slash commands enabled but no commands could be registered`
  を確認してください。
- `callbackUrl` を省略し、ログにコールバックが
  `http://127.0.0.1:18789/...` に解決されたという警告が出る場合、その URL は
  Mattermost が OpenClaw と同じホスト/ネットワーク名前空間で動作している場合にのみ到達可能である可能性が高いです。
  外部から到達可能な `commands.callbackUrl` を明示的に設定してください。
- ボタンが白いボックスとして表示される: エージェントが不正なボタンデータを送っている可能性があります。各ボタンに `text` と `callback_data` の両方があることを確認してください。
- ボタンは表示されるがクリックしても何も起きない: Mattermost サーバー設定の `AllowedUntrustedInternalConnections` に `127.0.0.1 localhost` が含まれていること、および ServiceSettings の `EnablePostActionIntegration` が `true` であることを確認してください。
- クリック時にボタンが 404 を返す: ボタンの `id` にハイフンまたはアンダースコアが含まれている可能性があります。Mattermost の action router は英数字以外の ID で壊れます。`[a-zA-Z0-9]` のみを使用してください。
- Gateway ログに `invalid _token` が出る: HMAC 不一致です。すべての context フィールドに署名していること（一部ではない）、キーをソートしていること、コンパクトな JSON（スペースなし）を使っていることを確認してください。上記の HMAC セクションを参照してください。
- Gateway ログに `missing _token in context` が出る: `_token` フィールドがボタンの context にありません。integration ペイロード構築時に含めていることを確認してください。
- 確認表示にボタン名ではなく生の ID が出る: `context.action_id` がボタンの `id` と一致していません。両方に同じサニタイズ済みの値を設定してください。
- エージェントがボタンを認識しない: Mattermost チャネル設定に `capabilities: ["inlineButtons"]` を追加してください。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
