---
read_when:
    - OpenClaw で Matrix をセットアップする
    - Matrix の E2EE と検証を設定する
summary: Matrix のサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-22T04:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e78d85096ea84361951935a0daf34966c575d822f8581277eb384276c7c706a
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix は OpenClaw に同梱された channel Plugin です。  
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートしています。

## 同梱された Plugin

Matrix は現在の OpenClaw リリースでは同梱 Plugin として提供されるため、通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルド、または Matrix を含まないカスタムインストールを使っている場合は、手動でインストールしてください。

npm からインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Plugin の動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin) を参照してください。

## セットアップ

1. Matrix Plugin が利用可能であることを確認します。
   - 現在のパッケージ版 OpenClaw リリースにはすでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記コマンドで手動追加できます。
2. homeserver 上で Matrix アカウントを作成します。
3. `channels.matrix` を次のいずれかで設定します。
   - `homeserver` + `accessToken`
   - `homeserver` + `userId` + `password`
4. Gateway を再起動します。
5. ボットと DM を開始するか、ルームに招待します。
   - 新しい Matrix 招待は、`channels.matrix.autoJoin` が許可している場合にのみ機能します。

対話型セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix のウィザードでは次を尋ねます。

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- ユーザー ID（パスワード認証のみ）
- オプションのデバイス名
- E2EE を有効にするかどうか
- ルームアクセスと招待の自動参加を設定するかどうか

ウィザードの主な動作:

- Matrix 認証用の env var がすでに存在し、そのアカウントの認証情報がまだ config に保存されていない場合、認証を env var に保持するための env ショートカットが提示されます。
- アカウント名は account ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM の allowlist エントリには `@user:server` を直接指定できます。表示名は、ライブディレクトリ検索で正確に 1 件一致した場合にのみ機能します。
- ルームの allowlist エントリには、ルーム ID とエイリアスを直接指定できます。`!room:server` または `#alias:server` を推奨します。未解決の名前は allowlist 解決時に実行時で無視されます。
- 招待自動参加の allowlist モードでは、安定した招待対象のみを使用してください: `!roomId:server`、`#alias:server`、または `*`。プレーンなルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

未設定のままにすると、ボットは招待されたルームや新しい DM スタイルの招待に参加しないため、手動で先に参加しない限り、新しいグループや招待された DM に現れません。

受け入れる招待を制限したい場合は `autoJoin: "allowlist"` を `autoJoinAllowlist` と組み合わせて設定するか、すべての招待に参加させたい場合は `autoJoin: "always"` を設定してください。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` だけを受け付けます。
</Warning>

allowlist の例:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

すべての招待に参加する場合:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

最小構成のトークンベース設定:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

パスワードベース設定（ログイン後にトークンはキャッシュされます）:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix はキャッシュされた認証情報を `~/.openclaw/credentials/matrix/` に保存します。  
デフォルトアカウントでは `credentials.json` を使用し、名前付きアカウントでは `credentials-<account>.json` を使用します。  
そこにキャッシュされた認証情報が存在する場合、現在の認証が config に直接設定されていなくても、OpenClaw はセットアップ、doctor、および channel-status 検出において Matrix が設定済みであると見なします。

環境変数の対応関係（config キーが設定されていないときに使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付き env var を使用します。

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化された account ID `ops-bot` では、次を使用します。

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix はアカウント ID 内の句読点をエスケープして、スコープ付き env var が衝突しないようにします。  
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話型ウィザードが env var ショートカットを提示するのは、それらの認証 env var がすでに存在し、かつ選択したアカウントに Matrix 認証がまだ config に保存されていない場合のみです。

## 設定例

これは、DM ペアリング、ルーム allowlist、有効化された E2EE を含む実用的なベースライン設定です。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` は DM スタイルの招待を含むすべての Matrix 招待に適用されます。OpenClaw は招待時点で招待されたルームを DM かグループかに確実には分類できないため、すべての招待は最初に `autoJoin` を通ります。`dm.policy` は、ボットが参加し、そのルームが DM と分類された後に適用されます。

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

OpenClaw に 1 つのライブプレビュー返信を送信させ、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定させたい場合は、`channels.matrix.streaming` を `"partial"` に設定します。

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` がデフォルトです。OpenClaw は最終返信を待って 1 回だけ送信します。
- `streaming: "partial"` は、現在の assistant ブロック用に、通常の Matrix テキストメッセージを使った編集可能な 1 つのプレビュー メッセージを作成します。これにより Matrix の従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成したブロックではなく、最初のストリーミングプレビュー テキストで通知されることがあります。
- `streaming: "quiet"` は、現在の assistant ブロック用に編集可能な quiet preview notice を 1 つ作成します。これは、確定したプレビュー編集に対する受信者の push rule も設定する場合にのみ使用してください。
- `blockStreaming: true` は、個別の Matrix 進行状況メッセージを有効にします。プレビュー ストリーミングが有効な場合、Matrix は現在のブロックのライブ下書きを保持し、完了済みブロックを別々のメッセージとして保持します。
- プレビュー ストリーミングがオンで `blockStreaming` がオフの場合、Matrix はライブ下書きをその場で編集し、ブロックまたはターンの完了時に同じ event を確定します。
- プレビューが 1 つの Matrix event に収まらなくなった場合、OpenClaw はプレビュー ストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終的なメディア返信を送る前にそれを redact します。
- プレビュー編集には追加の Matrix API 呼び出しコストがかかります。最も保守的な rate limit 動作にしたい場合は、ストリーミングをオフのままにしてください。

`blockStreaming` だけでは下書きプレビューは有効になりません。  
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、完了した assistant ブロックも個別の進行状況メッセージとして表示したい場合にのみ、さらに `blockStreaming: true` を追加してください。

カスタム push rule を使わずに標準の Matrix 通知が必要な場合は、プレビュー先行動作には `streaming: "partial"` を使うか、最終結果のみの配信には `streaming` をオフのままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、各完了ブロックを通常の通知対象 Matrix メッセージとして送信します。
- `blockStreaming: false` は、最終的に完成した返信のみを通常の通知対象 Matrix メッセージとして送信します。

### quiet な確定済みプレビュー用のセルフホスト push rule

独自の Matrix インフラを運用していて、quiet preview でブロックまたは最終返信が完了したときだけ通知したい場合は、`streaming: "quiet"` を設定し、確定済みプレビュー編集用のユーザー単位 push rule を追加してください。

これは通常、homeserver 全体の設定変更ではなく、受信者ユーザーごとの設定です。

始める前の簡単な対応表:

- recipient user = 通知を受け取る人
- bot user = 返信を送る OpenClaw Matrix アカウント
- 以下の API 呼び出しには recipient user のアクセストークンを使用する
- push rule の `sender` は bot user の完全な MXID に一致させる

1. OpenClaw が quiet preview を使うよう設定します。

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 受信者アカウントがすでに通常の Matrix push 通知を受け取れることを確認します。quiet preview rule は、そのユーザーに動作中の pusher/デバイスがすでにある場合にのみ機能します。

3. recipient user のアクセストークンを取得します。
   - ボットのトークンではなく、受信側ユーザーのトークンを使用します。
   - 既存のクライアントセッショントークンを再利用するのが通常は最も簡単です。
   - 新しいトークンを発行する必要がある場合は、標準の Matrix Client-Server API でログインできます。

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. recipient account にすでに pusher があることを確認します。

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

これで有効な pusher/デバイスが 1 つも返らない場合は、下記の OpenClaw rule を追加する前に、まず通常の Matrix 通知を修正してください。

OpenClaw は、確定済みのテキストのみのプレビュー編集に次を付与します。

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取る必要がある各 recipient account に対して、override push rule を作成します。

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

コマンドを実行する前に、次の値を置き換えてください。

- `https://matrix.example.org`: あなたの homeserver のベース URL
- `$USER_ACCESS_TOKEN`: 受信側ユーザーのアクセストークン
- `openclaw-finalized-preview-botname`: この受信側ユーザーに対する、このボット専用の一意な rule ID
- `@bot:example.org`: 受信側ユーザーの MXID ではなく、あなたの OpenClaw Matrix bot MXID

複数ボット構成で重要な点:

- Push rule は `ruleId` で識別されます。同じ rule ID に対して `PUT` を再実行すると、その 1 つの rule が更新されます。
- 1 人の受信ユーザーが複数の OpenClaw Matrix bot アカウントからの通知を受け取る必要がある場合は、各 `sender` 条件に対して一意の rule ID を使い、bot ごとに 1 つの rule を作成してください。
- シンプルなパターンとしては `openclaw-finalized-preview-<botname>` があり、たとえば `openclaw-finalized-preview-ops` や `openclaw-finalized-preview-support` です。

この rule は event の送信者に対して評価されます。

- 受信ユーザーのトークンで認証する
- `sender` を OpenClaw bot の MXID に一致させる

6. rule が存在することを確認します。

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quiet モードでは、ルームには quiet な下書きプレビューが表示され、ブロックまたはターンの完了時に最終的なインプレース編集で 1 回通知されるはずです。

後で rule を削除する必要がある場合は、受信ユーザーのトークンを使って同じ rule ID を削除します。

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注意:

- rule はボットのトークンではなく、受信ユーザーのアクセストークンで作成してください。
- 新しいユーザー定義の `override` rule はデフォルトの抑制 rule より前に挿入されるため、追加の並び順パラメータは不要です。
- これは、OpenClaw が安全にその場で確定できるテキストのみのプレビュー編集にだけ影響します。メディアのフォールバックや stale preview のフォールバックでは、引き続き通常の Matrix 配信が使われます。
- `GET /_matrix/client/v3/pushers` で pusher が表示されない場合、そのユーザーはこのアカウント/デバイスに対してまだ動作する Matrix push 配信を持っていません。

#### Synapse

Synapse では、通常は上記のセットアップだけで十分です。

- 確定済み OpenClaw プレビュー通知のために特別な `homeserver.yaml` 変更は不要です。
- Synapse デプロイですでに通常の Matrix push 通知が送られている場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- Synapse をリバースプロキシや worker の背後で動かしている場合は、`/_matrix/client/.../pushrules/` が正しく Synapse に到達することを確認してください。
- Synapse worker を使用している場合は、pusher が正常であることを確認してください。push 配信はメインプロセス、または `synapse.app.pusher` / 設定済み pusher worker によって処理されます。

#### Tuwunel

Tuwunel では、上記と同じセットアップ手順および push-rule API 呼び出しを使用します。

- 確定済みプレビュー marker 自体のために、Tuwunel 固有の設定は不要です。
- そのユーザーに対して通常の Matrix 通知がすでに動作している場合、主なセットアップ手順は上記のユーザートークン + `pushrules` 呼び出しです。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active` が有効かどうかを確認してください。Tuwunel はこのオプションを 2025 年 9 月 12 日の Tuwunel 1.4.2 で追加しており、1 台のデバイスがアクティブな間は他のデバイスへの push を意図的に抑制することがあります。

## Bot-to-bot ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

意図的にエージェント間の Matrix トラフィックを許可したい場合は、`allowBots` を使用します。

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` は、許可されたルームおよび DM で、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でそのメッセージがこの bot に明示的にメンションしている場合にのみ受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベル設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix user ID からのメッセージは引き続き無視します。
- Matrix はここでネイティブな bot フラグを公開していないため、OpenClaw は「bot-authored」を「この OpenClaw Gateway 上で設定された別の Matrix アカウントから送信されたもの」として扱います。

共有ルームで bot-to-bot トラフィックを有効にする場合は、厳格なルーム allowlist とメンション必須設定を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像 event は `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは引き続きプレーンな `thumbnail_url` を使用します。設定は不要です — Plugin が E2EE 状態を自動検出します。

暗号化を有効にする:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

検証状態を確認する:

```bash
openclaw matrix verify status
```

詳細な状態表示（完全な診断）:

```bash
openclaw matrix verify status --verbose
```

保存された recovery key を machine-readable 出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

cross-signing と検証状態を bootstrap する:

```bash
openclaw matrix verify bootstrap
```

詳細な bootstrap 診断:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap 前に新しい cross-signing identity リセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery key でこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

room-key backup の健全性を確認する:

```bash
openclaw matrix verify backup status
```

詳細な backup 健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバー backup から room key を復元する:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバー backup を削除し、新しい backup ベースラインを作成します。保存された backup key を正常に読み込めない場合、このリセットにより secret storage も再作成され、将来のコールドスタートで新しい backup key を読み込めるようになります。

```bash
openclaw matrix verify backup reset --yes
```

すべての `verify` コマンドは、デフォルトでは簡潔な出力（内部 SDK の quiet ログを含む）で、詳細な診断は `--verbose` を指定したときのみ表示します。  
スクリプトで使う場合は、完全な machine-readable 出力に `--json` を使用してください。

マルチアカウント構成では、`--account <id>` を指定しない限り、Matrix CLI コマンドは暗黙の Matrix デフォルトアカウントを使用します。  
複数の名前付きアカウントを設定している場合は、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、それらの暗黙的な CLI 操作は停止し、明示的にアカウントを選ぶよう求められます。  
検証またはデバイス操作の対象を名前付きアカウントに明示したい場合は、`--account` を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効、または名前付きアカウントで利用できない場合、Matrix の警告および検証エラーはそのアカウントの config key を指します。たとえば `channels.matrix.accounts.assistant.encryption` です。

### 「verified」の意味

OpenClaw は、この Matrix デバイスが自分自身の cross-signing identity によって検証されている場合にのみ verified として扱います。  
実際には、`openclaw matrix verify status --verbose` は次の 3 つの trust signal を表示します。

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDK がこのデバイスを cross-signing により検証済みと報告しています
- `Signed by owner`: このデバイスは自分自身の self-signing key によって署名されています

`Verified by owner` が `yes` になるのは、cross-signing 検証または owner-signing が存在する場合だけです。  
ローカル trust だけでは、OpenClaw がこのデバイスを完全に検証済みとして扱うには不十分です。

### bootstrap が行うこと

`openclaw matrix verify bootstrap` は、暗号化された Matrix アカウント用の修復およびセットアップコマンドです。  
これにより、次のすべてが順に実行されます。

- 可能であれば既存の recovery key を再利用して secret storage を bootstrap する
- cross-signing を bootstrap し、不足している公開 cross-signing key をアップロードする
- 現在のデバイスにマークを付けて cross-sign することを試みる
- サーバー側の新しい room-key backup を、まだ存在しない場合に作成する

homeserver が cross-signing key のアップロードに対話的認証を要求する場合、OpenClaw はまず認証なしでアップロードを試し、次に `m.login.dummy`、`channels.matrix.password` が設定されている場合は `m.login.password` の順で試みます。

現在の cross-signing identity を破棄して新しく作り直したいと意図している場合にのみ、`--force-reset-cross-signing` を使用してください。

現在の room-key backup を破棄して、将来のメッセージ用に新しい backup ベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes` を使用してください。  
これは、復旧不能な古い暗号化履歴が利用不能のまま残ること、および現在の backup secret を安全に読み込めない場合に OpenClaw が secret storage を再作成する可能性があることを許容する場合にのみ実行してください。

### 新しい backup ベースライン

今後の暗号化メッセージを引き続き使えるようにしつつ、復旧不能な古い履歴を失うことを許容する場合は、次のコマンドを順に実行してください。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、各コマンドに `--account <id>` を追加してください。

### 起動時の動作

`encryption: true` の場合、Matrix はデフォルトで `startupVerification` を `"if-unverified"` に設定します。  
起動時、このデバイスがまだ未検証であれば、Matrix は別の Matrix クライアントで自己検証を要求し、すでに保留中の要求がある場合は重複要求をスキップし、再起動後の再試行前にはローカルのクールダウンを適用します。  
失敗した要求試行は、デフォルトでは成功した要求作成よりも早く再試行されます。  
自動起動時要求を無効にするには `startupVerification: "off"` を設定し、再試行ウィンドウを短くまたは長くしたい場合は `startupVerificationCooldownHours` を調整してください。

起動時には保守的な crypto bootstrap パスも自動的に実行されます。  
このパスはまず現在の secret storage と cross-signing identity の再利用を試み、明示的な bootstrap 修復フローを実行しない限り、cross-signing のリセットを避けます。

起動時に壊れた bootstrap 状態がまだ見つかる場合、`channels.matrix.password` が設定されていなくても、OpenClaw は保護された修復パスを試みることがあります。  
その修復に homeserver がパスワードベースの UIA を要求する場合、OpenClaw は警告をログに出し、ボットを中断するのではなく起動を非致命的なまま維持します。  
現在のデバイスがすでに owner-signed である場合、OpenClaw はその identity を自動的にリセットせず保持します。

完全なアップグレードフロー、制限、回復コマンド、および一般的な migration メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix) を参照してください。

### 検証通知

Matrix は、厳格な DM 検証ルームに検証ライフサイクル通知を `m.notice` メッセージとして直接投稿します。  
これには以下が含まれます。

- verification request 通知
- verification ready 通知（明示的な「Verify by emoji」ガイダンス付き）
- verification の開始および完了通知
- 利用可能な場合の SAS 詳細（絵文字および 10 進数）

別の Matrix クライアントからの受信 verification request は追跡され、OpenClaw によって自動受諾されます。  
自己検証フローでは、絵文字検証が利用可能になると OpenClaw は SAS フローも自動的に開始し、自身の側を確認します。  
別の Matrix ユーザー/デバイスからの verification request では、OpenClaw は要求を自動受諾し、その後 SAS フローが通常どおり進むのを待ちます。  
検証を完了するには、引き続き Matrix クライアントで絵文字または 10 進数の SAS を比較し、そこで「They match」を確認する必要があります。

OpenClaw は自己開始の重複フローを無条件に自動受諾しません。起動時には、自己検証 request がすでに保留中であれば新しい request の作成をスキップします。

検証プロトコル/システム通知はエージェントのチャットパイプラインには転送されないため、`NO_REPLY` は生成されません。

### デバイスの整理

古い OpenClaw 管理の Matrix デバイスがアカウント上に蓄積し、暗号化ルームの trust が把握しにくくなることがあります。  
一覧表示するには次を使用します。

```bash
openclaw matrix devices list
```

古い OpenClaw 管理デバイスを削除するには次を使用します。

```bash
openclaw matrix devices prune-stale
```

### Crypto ストア

Matrix E2EE は Node 上で公式の `matrix-js-sdk` Rust crypto パスを使用し、IndexedDB shim として `fake-indexeddb` を使います。crypto 状態はスナップショットファイル（`crypto-idb-snapshot.json`）に永続化され、起動時に復元されます。このスナップショットファイルは機微な実行時状態であり、制限されたファイル権限で保存されます。

暗号化された実行時状態は、アカウントごと・ユーザーごと・トークンハッシュごとのルート配下にある  
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`  
に保存されます。  
このディレクトリには、sync ストア（`bot-storage.json`）、crypto ストア（`crypto/`）、recovery key ファイル（`recovery-key.json`）、IndexedDB スナップショット（`crypto-idb-snapshot.json`）、thread binding（`thread-bindings.json`）、および起動時検証状態（`startup-verification.json`）が含まれます。  
トークンが変わってもアカウント identity が同じであれば、OpenClaw はその account/homeserver/user タプルに対して最適な既存ルートを再利用するため、以前の sync 状態、crypto 状態、thread binding、および起動時検証状態は引き続き見えるままです。

## プロファイル管理

選択したアカウントの Matrix self-profile を更新するには、次を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、`--account <id>` を追加してください。

Matrix は `mxc://` avatar URL を直接受け付けます。`http://` または `https://` の avatar URL を渡した場合、OpenClaw はまずそれを Matrix にアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウントの上書き設定）に書き戻します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブ Matrix スレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DM ルーティングを送信者スコープのまま維持するため、複数の DM ルームでも同じ peer に解決される場合は 1 つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常の DM 認証と allowlist チェックを使いつつ、各 Matrix DM ルームをそれぞれ独自の session key に分離します。
- 明示的な Matrix conversation binding は引き続き `dm.sessionScope` より優先されるため、binding 済みのルームとスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は返信をトップレベルのままにし、受信したスレッド内メッセージも親セッション上に維持します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にある場合にのみ、スレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーメッセージをルートとするスレッド内に維持し、その会話を最初のトリガーメッセージから対応するスレッドスコープ付きセッションへルーティングします。
- `dm.threadReplies` は、DM に対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保てます。
- 受信したスレッド内メッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- message-tool 送信は、対象が同じルーム、または同じ DM ユーザー対象である場合、明示的な `threadId` が指定されていなければ現在の Matrix スレッドを自動継承します。
- 同一セッションでの DM ユーザー対象の再利用は、現在のセッション metadata によって同一 Matrix アカウント上の同一 DM peer であることが証明される場合にのみ有効になります。それ以外では、OpenClaw は通常のユーザースコープのルーティングにフォールバックします。
- OpenClaw が、同じ共有 Matrix DM セッション上で、ある Matrix DM ルームが別の DM ルームと衝突していることを検出すると、thread binding が有効で `dm.sessionScope` ヒントがある場合、そのルームに `/focus` のエスケープハッチを含む 1 回限りの `m.notice` を投稿します。
- Matrix では実行時 thread binding をサポートします。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドに bind された `/acp spawn` は、Matrix ルームと DM で動作します。
- トップレベルの Matrix ルーム/DM での `/focus` は、`threadBindings.spawnSubagentSessions=true` の場合、新しい Matrix スレッドを作成して対象セッションに bind します。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、代わりにその現在のスレッドが bind されます。

## ACP conversation binding

Matrix ルーム、DM、および既存の Matrix スレッドは、チャット面を変更せずに永続的な ACP ワークスペースへ変換できます。

高速なオペレーターフロー:

- 引き続き使いたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがそのままチャット面として維持され、以後のメッセージは生成された ACP セッションへルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場で bind します。
- `/new` と `/reset` は、同じ bind 済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、その binding を削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` が必要なのは `/acp spawn --thread auto|here` の場合だけで、このとき OpenClaw は子 Matrix スレッドを作成または bind する必要があります。

### Thread binding 設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、channel ごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッド bind 付き spawn フラグはオプトインです。

- トップレベルの `/focus` で新しい Matrix スレッドを作成して bind できるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` で ACP セッションを Matrix スレッドに bind できるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix は、送信リアクション操作、受信リアクション通知、および受信 ack リアクションをサポートします。

- 送信リアクション機能は `channels["matrix"].actions.reactions` で制御されます。
- `react` は特定の Matrix event にリアクションを追加します。
- `reactions` は特定の Matrix event に対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、その event に対する bot アカウント自身のリアクションを削除します。
- `remove: true` は、bot アカウントから指定された絵文字リアクションのみを削除します。

ack リアクションは標準の OpenClaw 解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- エージェント identity の絵文字フォールバック

ack リアクションのスコープは次の順序で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順序で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"` は、bot が作成した Matrix メッセージを対象とする追加済み `m.reaction` event を転送します。
- `reactionNotifications: "off"` はリアクションのシステム event を無効にします。
- リアクション削除は、Matrix ではそれが独立した `m.reaction` 削除ではなく redaction として表現されるため、システム event には変換されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の実効デフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルームのみです。DM は通常のセッション履歴を使い続けます。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、その後メンションや他のトリガーが到着した時点でそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` には含まれず、そのターンのメインの受信 body に残ります。
- 同じ Matrix event の再試行では、新しいルームメッセージへ前進してずれることなく、元の履歴スナップショットが再利用されます。

## コンテキストの可視性

Matrix は、取得された返信テキスト、スレッドルート、pending 履歴などの補足ルームコンテキストに対して、共有の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、1 件の明示的な引用返信は保持します。

この設定は補足コンテキストの可視性に影響するものであり、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。  
トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM policy 設定によって決まります。

## DM とルームのポリシー

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

メンション制御と allowlist の動作については、[Groups](/ja-JP/channels/groups) を参照してください。

Matrix DM の pairing 例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClaw は同じ保留中 pairing code を再利用し、新しい code を発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共有の DM pairing フローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態が同期ずれすると、OpenClaw は古いソロルームを live DM ではなく指す stale な `m.direct` マッピングを持つことがあります。peer に対する現在のマッピングを確認するには、次を使用します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには次を使用します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- すでに `m.direct` にマッピングされている厳密な 1:1 DM を優先する
- それがなければ、そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックする
- 正常な DM が存在しなければ、新しいダイレクトルームを作成し `m.direct` を書き換える

修復フローは古いルームを自動削除しません。正常な DM を選択してマッピングを更新するだけなので、新しい Matrix 送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec 承認

Matrix は Matrix アカウントのネイティブ承認クライアントとして機能できます。ネイティブの  
DM/channel ルーティング設定は引き続き exec 承認設定配下にあります。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（オプション。`channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix user ID である必要があります。`enabled` が未設定または `"auto"` で、少なくとも 1 人の承認者を解決できる場合、Matrix はネイティブ承認を自動有効化します。Exec 承認はまず `execApprovals.approvers` を使い、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin 承認は `channels.matrix.dm.allowFrom` を通じて認可されます。Matrix をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定してください。それ以外では、承認要求は他の設定済み承認ルートまたは承認フォールバック policy にフォールバックします。

Matrix のネイティブルーティングは両方の承認種別をサポートします。

- `channels.matrix.execApprovals.*` は、Matrix 承認プロンプトのネイティブ DM/channel ファンアウトモードを制御します。
- Exec 承認は `execApprovals.approvers` または `channels.matrix.dm.allowFrom` から得た exec 承認者セットを使用します。
- Plugin 承認は `channels.matrix.dm.allowFrom` の Matrix DM allowlist を使用します。
- Matrix のリアクションショートカットとメッセージ更新は、exec 承認と Plugin 承認の両方に適用されます。

配信ルール:

- `target: "dm"` は承認プロンプトを承認者 DM に送信します
- `target: "channel"` はプロンプトを発生元の Matrix ルームまたは DM に送り返します
- `target: "both"` は承認者 DM と発生元の Matrix ルームまたは DM の両方に送信します

Matrix 承認プロンプトは、主要な承認メッセージにリアクションショートカットを設定します。

- `✅` = allow once
- `❌` = deny
- `♾️` = 有効な exec policy でその判断が許可されている場合の allow always

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使用できます。

承認または拒否できるのは解決済み承認者だけです。Exec 承認では channel 配信にコマンドテキストが含まれるため、`channel` または `both` は信頼できるルームでのみ有効にしてください。

アカウント単位の上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrix のスラッシュコマンド（たとえば `/new`、`/reset`、`/model`）は DM で直接動作します。ルームでは、OpenClaw は bot 自身の Matrix メンションが前置されたスラッシュコマンドも認識するため、`@bot:server /new` はカスタムのメンション正規表現を必要とせずにコマンド経路をトリガーします。これにより、Element や類似クライアントで、ユーザーがコマンド入力前にタブ補完で bot を挿入したときに出力されるルーム形式の `@mention /command` 投稿にも bot が応答し続けられます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同様に DM またはルームの allowlist/owner policy を満たしている必要があります。

## マルチアカウント

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

トップレベルの `channels.matrix` の値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。  
継承されたルームエントリは `groups.<room>.account` で 1 つの Matrix アカウントに限定できます。  
`account` を持たないエントリはすべての Matrix アカウント間で共有されたままとなり、`account: "default"` を持つエントリは、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合でも引き続き機能します。  
部分的な共有認証デフォルトだけでは、それ自体で別個の暗黙のデフォルトアカウントは作成されません。OpenClaw がトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` と `accessToken`、または `homeserver` と `userId` および `password`）がある場合だけです。名前付きアカウントは、あとでキャッシュ済み認証情報が認証要件を満たすなら、`homeserver` と `userId` だけでも引き続き発見可能です。  
Matrix にすでにちょうど 1 つの名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリを作成する代わりに、そのアカウントが保持されます。昇格されたアカウントに移されるのは Matrix の auth/bootstrap キーだけで、共有配信 policy キーはトップレベルに残ります。  
暗黙のルーティング、プローブ、および CLI 操作において 1 つの名前付き Matrix アカウントを優先したい場合は、`defaultAccount` を設定してください。  
複数の Matrix アカウントが設定されていて、かつそのうち 1 つの account id が `default` である場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。  
複数の名前付きアカウントを設定する場合は、暗黙のアカウント選択に依存する CLI コマンドのために `defaultAccount` を設定するか、`--account <id>` を渡してください。  
1 回のコマンドでその暗黙選択を上書きしたい場合は、`openclaw matrix verify ...` および `openclaw matrix devices ...` に `--account <id>` を渡してください。

共有のマルチアカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部 Matrix homeserver をブロックします。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、その Matrix アカウントで  
`network.dangerouslyAllowPrivateNetwork` を有効にしてください。

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

CLI セットアップ例:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

このオプトインは、信頼済みのプライベート/内部ターゲットのみを許可します。  
`http://matrix.example.org:8008` のような公開プレーンテキスト homeserver は引き続きブロックされます。可能な限り `https://` を推奨します。

## Matrix トラフィックのプロキシ

Matrix デプロイで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定してください。

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

名前付きアカウントは `channels.matrix.accounts.<id>.proxy` でトップレベルのデフォルトを上書きできます。  
OpenClaw は、実行時の Matrix トラフィックとアカウント状態プローブの両方で同じ proxy 設定を使用します。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーターゲットを要求するあらゆる場所で、次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン中の Matrix アカウントを使用します。

- ユーザー検索は、その homeserver の Matrix ユーザーディレクトリに問い合わせます。
- ルーム検索は明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントの参加済みルーム名検索にフォールバックします。
- 参加済みルーム名検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の allowlist 解決では無視されます。

## 設定リファレンス

- `enabled`: channel を有効または無効にします。
- `name`: アカウントの任意ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先 account ID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: この Matrix アカウントがプライベート/内部 homeserver に接続できるようにします。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) proxy URL。名前付きアカウントは独自の `proxy` でトップレベルのデフォルトを上書きできます。
- `userId`: 完全な Matrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークン。平文値と SecretRef 値は、env/file/exec provider 全体で `channels.matrix.accessToken` および `channels.matrix.accounts.<id>.accessToken` に対応しています。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用のパスワード。平文値と SecretRef 値に対応しています。
- `deviceId`: 明示的な Matrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: profile sync と `profile set` 更新のために保存される self-avatar URL。
- `initialSyncLimit`: 起動時 sync 中に取得する event の最大数。
- `encryption`: E2EE を有効にします。
- `allowlistOnly`: `true` の場合、`open` ルーム policy を `allowlist` に引き上げ、`disabled` を除くすべての有効な DM policy（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` policy には影響しません。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。正確なディレクトリ一致は、起動時およびモニター実行中に allowlist が変更されたときに解決されます。未解決の名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定なら実効デフォルトは `0` です。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は、通常の Matrix テキストメッセージでプレビュー先行の下書き更新を有効にします。`"quiet"` は、セルフホストの push-rule 構成向けに通知しないプレビュー notice を使用します。`false` は `"off"` と同等です。
- `blockStreaming`: `true` は、下書きプレビュー ストリーミングが有効な間、完了した assistant ブロック用の個別進行状況メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドに bind されたセッションルーティングとライフサイクルに対する channel 単位の上書き。
- `startupVerification`: 起動時の自動自己検証要求モード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証要求を再試行するまでのクールダウン時間。
- `textChunkLimit`: 送信メッセージの文字数単位チャンクサイズ（`chunkMode` が `length` の場合に適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は行境界で分割します。
- `responsePrefix`: この channel のすべての送信返信の先頭に付ける任意文字列。
- `ackReaction`: この channel/アカウント用の任意の ack リアクション上書き。
- `ackReactionScope`: 任意の ack リアクションスコープ上書き（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信送信および受信メディア処理用のメディアサイズ上限（MB）。
- `autoJoin`: 招待自動参加 policy（`always`、`allowlist`、`off`）。デフォルト: `off`。DM スタイルの招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` のときに許可されるルーム/エイリアス。エイリアスエントリは招待処理中にルーム ID に解決されます。OpenClaw は招待されたルームが主張するエイリアス状態を信用しません。
- `dm`: DM policy ブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClaw がルームに参加し、それを DM と分類した後の DM アクセスを制御します。招待が自動参加されるかどうかは変更しません。
- `dm.allowFrom`: DM トラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。正確なディレクトリ一致は、起動時およびモニター実行中に allowlist が変更されたときに解決されます。未解決の名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。同じ peer であっても各 Matrix DM ルームに個別のコンテキストを持たせたい場合は `per-room` を使用します。
- `dm.threadReplies`: DM 専用のスレッド policy 上書き（`off`、`inbound`、`always`）。DM における返信配置とセッション分離の両方について、トップレベルの `threadReplies` 設定を上書きします。
- `execApprovals`: Matrix ネイティブ exec 承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec 要求を承認できる Matrix user ID。`dm.allowFrom` がすでに承認者を特定している場合は省略可能です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウント単位上書き。トップレベルの `channels.matrix` 値がこれらのエントリのデフォルトとして機能します。
- `groups`: ルーム単位の policy マップ。ルーム ID またはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。セッション/グループ identity は、解決後の安定したルーム ID を使用します。
- `groups.<room>.account`: マルチアカウント構成で、継承された 1 つのルームエントリを特定の Matrix アカウントに限定します。
- `groups.<room>.allowBots`: 設定済み bot 送信者に対するルームレベル上書き（`true` または `"mentions"`）。
- `groups.<room>.users`: ルーム単位の送信者 allowlist。
- `groups.<room>.tools`: ルーム単位の tool 許可/拒否上書き。
- `groups.<room>.autoReply`: ルームレベルのメンション必須上書き。`true` はそのルームのメンション要件を無効にし、`false` は再度有効化します。
- `groups.<room>.skills`: 任意のルームレベル Skills フィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペット。
- `rooms`: `groups` のレガシーエイリアス。
- `actions`: アクション単位の tool 制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべての channel
- [Pairing](/ja-JP/channels/pairing) — DM 認証と pairing フロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
