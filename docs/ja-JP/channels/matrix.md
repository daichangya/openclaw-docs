---
read_when:
    - OpenClawでMatrixをセットアップする
    - MatrixのE2EEと検証を設定する
summary: Matrixのサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-09T01:30:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28fc13c7620c1152200315ae69c94205da6de3180c53c814dd8ce03b5cb1758f
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

MatrixはOpenClawに同梱されたチャネルプラグインです。
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートします。

## 同梱プラグイン

Matrixは現在のOpenClawリリースでは同梱プラグインとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドまたはMatrixを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

npmからインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

プラグインの動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. Matrixプラグインが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでに同梱されています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ご利用のhomeserverでMatrixアカウントを作成します。
3. 次のいずれかで`channels.matrix`を設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`。
4. Gatewayを再起動します。
5. ボットとのDMを開始するか、ルームに招待します。
   - 新しいMatrix招待は、`channels.matrix.autoJoin`で許可されている場合にのみ機能します。

対話型セットアップの手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrixウィザードで尋ねられる内容:

- homeserver URL
- 認証方式: access tokenまたはpassword
- user ID（password認証時のみ）
- 任意のデバイス名
- E2EEを有効にするかどうか
- ルームアクセスと招待の自動参加を設定するかどうか

ウィザードの主な動作:

- Matrix認証用の環境変数がすでに存在し、そのアカウントの認証情報がまだconfigに保存されていない場合、ウィザードは認証情報を環境変数に保持するための環境変数ショートカットを提案します。
- アカウント名はアカウントIDに正規化されます。たとえば、`Ops Bot`は`ops-bot`になります。
- DMの許可リスト項目には`@user:server`を直接指定できます。表示名は、ライブディレクトリ検索で厳密に1件一致した場合にのみ機能します。
- ルーム許可リスト項目にはルームIDとエイリアスを直接指定できます。`!room:server`または`#alias:server`を推奨します。未解決の名前は、許可リスト解決時にランタイムで無視されます。
- 招待の自動参加を許可リストモードで使う場合は、安定した招待対象のみを使用してください: `!roomId:server`、`#alias:server`、または`*`。通常のルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"`を使用します。

<Warning>
`channels.matrix.autoJoin`のデフォルトは`off`です。

未設定のままにすると、ボットは招待されたルームや新しいDM形式の招待に参加しないため、手動で先に参加しない限り、新しいグループや招待DMには表示されません。

受け入れる招待を制限したい場合は、`autoJoin: "allowlist"`を`autoJoinAllowlist`と組み合わせて設定するか、すべての招待に参加させたい場合は`autoJoin: "always"`を設定してください。

`allowlist`モードでは、`autoJoinAllowlist`には`!roomId:server`、`#alias:server`、または`*`のみ指定できます。
</Warning>

許可リストの例:

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

すべての招待に参加:

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

パスワードベース設定（ログイン後にトークンをキャッシュ）:

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

Matrixはキャッシュ済み認証情報を`~/.openclaw/credentials/matrix/`に保存します。
デフォルトアカウントは`credentials.json`を使用し、名前付きアカウントは`credentials-<account>.json`を使用します。
そこにキャッシュ済み認証情報が存在する場合、現在の認証情報がconfigに直接設定されていなくても、OpenClawはセットアップ、doctor、チャネル状態の検出でMatrixを設定済みとして扱います。

環境変数の対応関係（configキーが設定されていない場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウント単位の環境変数を使用します:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント`ops`の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウントID`ops-bot`では、次を使用します:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

MatrixはアカウントID内の句読点をエスケープして、アカウント単位の環境変数が衝突しないようにします。
たとえば、`-`は`_X2D_`になるため、`ops-prod`は`MATRIX_OPS_X2D_PROD_*`に対応します。

対話型ウィザードが環境変数ショートカットを提案するのは、それらの認証環境変数がすでに存在し、かつ選択したアカウントのMatrix認証情報がまだconfigに保存されていない場合のみです。

## 設定例

これは、DMペアリング、ルーム許可リスト、E2EE有効化を含む実用的なベースライン設定です:

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

`autoJoin`はDM形式の招待を含むすべてのMatrix招待に適用されます。OpenClawは招待時点で
招待されたルームをDMかグループかに確実に分類できないため、すべての招待は最初に`autoJoin`を通ります。
`dm.policy`は、ボットが参加してルームがDMとして分類された後に適用されます。

## ストリーミングプレビュー

Matrixの返信ストリーミングはオプトインです。

OpenClawに単一のライブプレビュー返信を送信させ、モデルがテキスト生成中にそのプレビューをその場で編集し、
返信完了時に確定させたい場合は、`channels.matrix.streaming`を`"partial"`に設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`がデフォルトです。OpenClawは最終返信を待ってから一度だけ送信します。
- `streaming: "partial"`は、現在のassistantブロック用に編集可能な単一のプレビューメッセージを通常のMatrixテキストメッセージとして作成します。これにより、Matrixの従来の「最初のプレビュー優先」の通知動作が維持されるため、標準クライアントでは完成済みブロックではなく最初のストリーミングプレビューテキストで通知されることがあります。
- `streaming: "quiet"`は、現在のassistantブロック用に編集可能な静かなプレビュー通知を1件作成します。これは、確定済みプレビュー編集に対する受信者のプッシュルールも設定する場合にのみ使用してください。
- `blockStreaming: true`は、別個のMatrix進行状況メッセージを有効にします。プレビューのストリーミングが有効な場合、Matrixは現在のブロックのライブドラフトを維持し、完了済みブロックは別メッセージとして保持します。
- プレビューのストリーミングが有効で`blockStreaming`がoffの場合、Matrixはライブドラフトをその場で編集し、ブロックまたはターンが完了した時点で同じイベントを確定します。
- プレビューが1つのMatrixイベントに収まらなくなった場合、OpenClawはプレビューストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終的なメディア返信を送る前にそれをredactします。
- プレビュー編集では追加のMatrix API呼び出しが発生します。最も保守的なレート制限動作を望む場合は、ストリーミングをoffのままにしてください。

`blockStreaming`自体ではドラフトプレビューは有効になりません。
プレビュー編集には`streaming: "partial"`または`streaming: "quiet"`を使い、そのうえで完了済みassistantブロックも別個の進行状況メッセージとして表示したい場合にのみ`blockStreaming: true`を追加してください。

カスタムプッシュルールなしで標準のMatrix通知が必要な場合は、プレビュー優先動作には`streaming: "partial"`を使用するか、最終返信のみの配信には`streaming`をoffのままにしてください。`streaming: "off"`の場合:

- `blockStreaming: true`は、各完了済みブロックを通常の通知付きMatrixメッセージとして送信します。
- `blockStreaming: false`は、最終的に完成した返信のみを通常の通知付きMatrixメッセージとして送信します。

### 自己ホスト型プッシュルールによる静かな確定済みプレビュー

独自のMatrixインフラを運用していて、静かなプレビューでブロックまたは
最終返信が完了したときだけ通知したい場合は、`streaming: "quiet"`を設定し、確定済みプレビュー編集用のユーザー単位プッシュルールを追加します。

これは通常、homeserver全体の設定変更ではなく受信ユーザー側の設定です:

開始前の簡単な対応表:

- recipient user = 通知を受け取るべきユーザー
- bot user = 返信を送信するOpenClaw Matrixアカウント
- 以下のAPI呼び出しにはrecipient userのaccess tokenを使用します
- プッシュルールの`sender`はbot userの完全なMXIDと一致させます

1. OpenClawで静かなプレビューを使用するよう設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. 受信者アカウントが、すでに通常のMatrixプッシュ通知を受け取れていることを確認します。静かなプレビュー
   ルールは、そのユーザーに正常に動作するpusherやデバイスがすでにある場合にのみ機能します。

3. recipient userのaccess tokenを取得します。
   - ボットのトークンではなく、受信側ユーザーのトークンを使用してください。
   - 既存のクライアントセッショントークンを再利用するのが通常は最も簡単です。
   - 新しいトークンを発行する必要がある場合は、標準のMatrix Client-Server APIでログインできます:

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

4. recipient accountにすでにpusherがあることを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

これでアクティブなpusherやデバイスが返らない場合は、以下の
OpenClawルールを追加する前に、まず通常のMatrix通知を修正してください。

OpenClawは、確定済みのテキストのみプレビュー編集に次の印を付けます:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取る各recipient accountに対してoverrideプッシュルールを作成します:

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

コマンド実行前に次の値を置き換えてください:

- `https://matrix.example.org`: あなたのhomeserverのベースURL
- `$USER_ACCESS_TOKEN`: 受信側ユーザーのaccess token
- `openclaw-finalized-preview-botname`: この受信側ユーザーに対するこのボット用の一意なrule ID
- `@bot:example.org`: 受信側ユーザーのMXIDではなく、あなたのOpenClaw MatrixボットのMXID

複数ボット構成での重要事項:

- プッシュルールは`ruleId`で識別されます。同じrule IDに対して`PUT`を再実行すると、その1つのルールが更新されます。
- 1人の受信側ユーザーが複数のOpenClaw Matrixボットアカウントから通知を受ける必要がある場合は、送信者一致ごとに一意なrule IDでボットごとに1つのルールを作成してください。
- 単純なパターンは`openclaw-finalized-preview-<botname>`です。たとえば`openclaw-finalized-preview-ops`や`openclaw-finalized-preview-support`です。

このルールはイベント送信者に対して評価されます:

- 受信側ユーザーのトークンで認証する
- `sender`をOpenClawボットのMXIDと一致させる

6. ルールが存在することを確認します:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quietモードでは、ルームには静かなドラフトプレビューが表示され、
   最終的なその場編集でブロックまたはターン完了時に1回通知されるはずです。

後でルールを削除する必要がある場合は、同じrule IDを受信側ユーザーのトークンで削除します:

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注記:

- ルール作成には、ボットのトークンではなく受信側ユーザーのaccess tokenを使用してください。
- 新しいユーザー定義`override`ルールはデフォルトの抑制ルールより前に挿入されるため、追加の順序パラメータは不要です。
- これは、OpenClawが安全にその場で確定できるテキストのみのプレビュー編集にのみ影響します。メディアフォールバックや古いプレビューフォールバックは、引き続き通常のMatrix配信を使用します。
- `GET /_matrix/client/v3/pushers`でpusherが表示されない場合、そのユーザーはまだそのアカウント/デバイスで正常に動作するMatrixプッシュ配信を利用できていません。

#### Synapse

Synapseでは、通常は上記のセットアップだけで十分です:

- 確定済みOpenClawプレビュー通知のために特別な`homeserver.yaml`変更は不要です。
- Synapse環境ですでに通常のMatrixプッシュ通知が送れている場合、主なセットアップ手順は上記のユーザートークン + `pushrules`呼び出しです。
- Synapseをリバースプロキシまたはworkerの背後で運用している場合は、`/_matrix/client/.../pushrules/`が正しくSynapseに届くことを確認してください。
- Synapse workerを使用している場合は、pusherが正常であることを確認してください。プッシュ配信はメインプロセスまたは`synapse.app.pusher` / 設定されたpusher workerで処理されます。

#### Tuwunel

Tuwunelでは、上記と同じセットアップ手順とpush-rule API呼び出しを使用します:

- 確定済みプレビューマーカー自体にTuwunel固有の設定は不要です。
- そのユーザーで通常のMatrix通知がすでに機能している場合、主なセットアップ手順は上記のユーザートークン + `pushrules`呼び出しです。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active`が有効か確認してください。Tuwunelは2025年9月12日のTuwunel 1.4.2でこのオプションを追加しており、1つのデバイスがアクティブな間は他のデバイスへのプッシュを意図的に抑制することがあります。

## ボット同士のルーム

デフォルトでは、他の設定済みOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

エージェント間のMatrixトラフィックを意図的に許可したい場合は、`allowBots`を使用します:

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

- `allowBots: true`は、許可されたルームとDMにおいて、他の設定済みMatrixボットアカウントからのメッセージを受け付けます。
- `allowBots: "mentions"`は、ルームではそれらのメッセージがこのボットに明示的にメンションしている場合にのみ受け付けます。DMは引き続き許可されます。
- `groups.<room>.allowBots`は、1つのルームに対してアカウントレベル設定を上書きします。
- OpenClawは、自己返信ループを避けるため、同じMatrix user IDからのメッセージは引き続き無視します。
- Matrixはここでネイティブのボットフラグを提供しません。OpenClawは「ボットによる送信」を「このOpenClaw Gateway上で設定された別のMatrixアカウントから送信されたもの」として扱います。

共有ルームでボット間通信を有効にする場合は、厳格なルーム許可リストとメンション必須設定を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは`thumbnail_file`を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは引き続き通常の`thumbnail_url`を使用します。設定は不要です — プラグインがE2EE状態を自動検出します。

暗号化を有効化:

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

検証状態を確認:

```bash
openclaw matrix verify status
```

詳細ステータス（完全な診断）:

```bash
openclaw matrix verify status --verbose
```

保存されているrecovery keyを機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

cross-signingと検証状態をブートストラップ:

```bash
openclaw matrix verify bootstrap
```

詳細なブートストラップ診断:

```bash
openclaw matrix verify bootstrap --verbose
```

ブートストラップ前に新しいcross-signing identityリセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery keyでこのデバイスを検証:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

room-key backupの健全性を確認:

```bash
openclaw matrix verify backup status
```

詳細なbackup健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーバックアップからroom keyを復元:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーバックアップを削除し、新しいバックアップベースラインを作成します。保存されている
backup keyを正常に読み込めない場合、このリセットではsecret storageも再作成され、
将来のコールドスタートで新しいbackup keyを読み込めるようになります:

```bash
openclaw matrix verify backup reset --yes
```

すべての`verify`コマンドはデフォルトで簡潔です（内部SDKログも静かに含む）し、詳細な診断は`--verbose`でのみ表示されます。
スクリプトで使用する場合は、完全な機械可読出力のために`--json`を使用してください。

複数アカウント構成では、`--account <id>`を渡さない限り、Matrix CLIコマンドは暗黙のMatrixデフォルトアカウントを使用します。
複数の名前付きアカウントを設定している場合は、まず`channels.matrix.defaultAccount`を設定してください。設定しないと、そのような暗黙のCLI操作は停止して明示的なアカウント選択を求めます。
検証またはデバイス操作を名前付きアカウントに明示的に向けたい場合は、常に`--account`を使用してください:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

名前付きアカウントで暗号化が無効または利用不可の場合、Matrixの警告と検証エラーは、そのアカウントのconfigキー、たとえば`channels.matrix.accounts.assistant.encryption`を指します。

### 「verified」の意味

OpenClawは、このMatrixデバイスがあなた自身のcross-signing identityによって検証されている場合にのみ、verifiedとして扱います。
実際には、`openclaw matrix verify status --verbose`は3つの信頼シグナルを公開します:

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDKがこのデバイスをcross-signing経由で検証済みとして報告しています
- `Signed by owner`: このデバイスはあなた自身のself-signing keyによって署名されています

`Verified by owner`が`yes`になるのは、cross-signing検証またはowner署名が存在する場合のみです。
ローカル信頼だけでは、OpenClawはそのデバイスを完全に検証済みとして扱いません。

### ブートストラップが行うこと

`openclaw matrix verify bootstrap`は、暗号化されたMatrixアカウント向けの修復およびセットアップコマンドです。
これは次のすべてを順番に実行します:

- secret storageをブートストラップし、可能な場合は既存のrecovery keyを再利用する
- cross-signingをブートストラップし、不足している公開cross-signing keyをアップロードする
- 現在のデバイスをマークしてcross-signingすることを試みる
- サーバー側room-key backupがまだ存在しない場合は新しいものを作成する

homeserverがcross-signing keyのアップロードに対して対話的認証を要求する場合、OpenClawはまず認証なしでアップロードを試し、その後`m.login.dummy`、さらに`channels.matrix.password`が設定されている場合は`m.login.password`で試します。

現在のcross-signing identityを破棄して新しいものを作成したい場合にのみ、`--force-reset-cross-signing`を使用してください。

現在のroom-key backupを意図的に破棄して、今後のメッセージ用に新しい
backup baselineを開始したい場合は、`openclaw matrix verify backup reset --yes`を使用してください。
これは、復旧不能な古い暗号化履歴が引き続き利用できないままになること、
また現在のbackup secretを安全に読み込めない場合にOpenClawがsecret storageを再作成する可能性があることを受け入れる場合にのみ実行してください。

### 新しいバックアップベースライン

今後の暗号化メッセージを維持しつつ、復旧不能な古い履歴の喪失を受け入れる場合は、次のコマンドを順番に実行してください:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、各コマンドに`--account <id>`を追加してください。

### 起動時の動作

`encryption: true`の場合、Matrixは`startupVerification`をデフォルトで`"if-unverified"`にします。
起動時にこのデバイスがまだ未検証であれば、Matrixは別のMatrixクライアントでの自己検証を要求し、
すでに保留中の要求がある場合は重複要求をスキップし、再起動後の再試行にはローカルのクールダウンを適用します。
失敗した要求試行は、デフォルトでは要求作成成功後よりも早く再試行されます。
自動起動時要求を無効にするには`startupVerification: "off"`を設定するか、再試行間隔を短くまたは長くしたい場合は`startupVerificationCooldownHours`を調整してください。

起動時には、自動的に保守的なcrypto bootstrap処理も実行されます。
この処理では、まず現在のsecret storageとcross-signing identityの再利用を試み、明示的なbootstrap修復フローを実行しない限りcross-signingをリセットしないようにします。

起動時に壊れたbootstrap状態が検出され、かつ`channels.matrix.password`が設定されている場合、OpenClawはより厳格な修復経路を試みることがあります。
現在のデバイスがすでにowner-signedである場合、OpenClawはそのidentityを自動でリセットせず保持します。

完全なアップグレード手順、制限、復旧コマンド、一般的な移行メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix)を参照してください。

### 検証通知

Matrixは、検証ライフサイクル通知を厳格なDM検証ルームに`m.notice`メッセージとして直接投稿します。
これには次が含まれます:

- 検証リクエスト通知
- 検証準備完了通知（明示的な「絵文字で検証する」案内付き）
- 検証開始および完了通知
- 利用可能な場合はSAS詳細（絵文字および10進数）

別のMatrixクライアントからの受信検証リクエストは、OpenClawが追跡して自動承認します。
自己検証フローでは、絵文字検証が利用可能になるとOpenClawはSASフローも自動的に開始し、自身の側を確認します。
別のMatrixユーザー/デバイスからの検証リクエストについては、OpenClawはリクエストを自動承認し、その後SASフローが通常どおり進行するのを待ちます。
検証を完了するには、引き続きMatrixクライアントで絵文字または10進数のSASを比較し、そこで「一致する」を確認する必要があります。

OpenClawは、自分自身が開始した重複フローを無条件に自動承認しません。起動時には、自己検証リクエストがすでに保留中の場合、新しいリクエストの作成をスキップします。

検証プロトコル/システム通知はエージェントチャットパイプラインには転送されないため、`NO_REPLY`は発生しません。

### デバイス衛生

OpenClawが管理する古いMatrixデバイスがアカウントに蓄積し、暗号化ルームの信頼関係が把握しにくくなることがあります。
一覧表示するには:

```bash
openclaw matrix devices list
```

古いOpenClaw管理デバイスを削除するには:

```bash
openclaw matrix devices prune-stale
```

### Crypto store

Matrix E2EEは、Node上で公式の`matrix-js-sdk` Rust cryptoパスを使用し、IndexedDB shimとして`fake-indexeddb`を使います。crypto状態はスナップショットファイル（`crypto-idb-snapshot.json`）に永続化され、起動時に復元されます。スナップショットファイルは、制限されたファイル権限で保存される機密ランタイム状態です。

暗号化されたランタイム状態は、アカウント・ユーザー・トークンハッシュごとのルート配下で
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`に保存されます。
このディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
recovery keyファイル（`recovery-key.json`）、IndexedDBスナップショット（`crypto-idb-snapshot.json`）、
thread bindings（`thread-bindings.json`）、およびstartup verification state（`startup-verification.json`）が含まれます。
トークンが変わってもアカウントidentityが同じであれば、OpenClawはそのアカウント/homeserver/user組に対して最適な既存ルートを再利用するため、以前のsync state、crypto state、thread bindings、
startup verification stateは引き続き見える状態のままです。

## プロファイル管理

選択したアカウントのMatrix self-profileを更新するには:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付きアカウントを明示的に対象にしたい場合は、`--account <id>`を追加してください。

Matrixは`mxc://`形式のavatar URLを直接受け付けます。`http://`または`https://`のavatar URLを渡すと、OpenClawはまずそれをMatrixにアップロードし、解決後の`mxc://` URLを`channels.matrix.avatarUrl`（または選択したアカウント上書き）に保存し直します。

## スレッド

Matrixは、自動返信とmessage-tool送信の両方でネイティブのMatrixスレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DMルーティングを送信者スコープのままにするため、同じ相手に解決される複数のDMルームが1つのセッションを共有できます。
- `dm.sessionScope: "per-room"`は、通常のDM認証と許可リストチェックを引き続き使用しながら、各Matrix DMルームを独自のセッションキーに分離します。
- 明示的なMatrix会話bindingは引き続き`dm.sessionScope`より優先されるため、bindingされたルームとスレッドは選択した対象セッションを維持します。
- `threadReplies: "off"`は、返信をトップレベルのままにし、受信したスレッド付きメッセージも親セッション上に維持します。
- `threadReplies: "inbound"`は、受信メッセージがすでにそのスレッド内にある場合にのみ、そのスレッド内で返信します。
- `threadReplies: "always"`は、ルーム返信をトリガーメッセージをルートとするスレッド内に保持し、その会話を最初のトリガーメッセージに一致するスレッドスコープのセッション経由でルーティングします。
- `dm.threadReplies`は、DMに対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DMはフラットに維持できます。
- 受信したスレッド付きメッセージには、追加のagent contextとしてスレッドルートメッセージが含まれます。
- message-tool送信は、明示的な`threadId`が指定されていない限り、対象が同じルーム、または同じDMユーザー対象であれば、現在のMatrixスレッドを自動継承します。
- 同一セッションのDMユーザー対象再利用は、現在のセッションメタデータが同じMatrixアカウント上の同一DM相手を証明している場合にのみ有効です。それ以外では、OpenClawは通常のユーザースコープルーティングにフォールバックします。
- OpenClawが、共有された同一Matrix DMセッション上であるMatrix DMルームが別のDMルームと衝突していることを検出した場合、thread bindingsが有効で、`dm.sessionScope`のヒントがあると、そのルームに一度だけ`/focus`エスケープハッチ付きの`m.notice`を投稿します。
- Matrixではランタイムthread bindingsがサポートされています。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた`/acp spawn`は、MatrixルームとDMで機能します。
- トップレベルのMatrixルーム/DMでの`/focus`は、`threadBindings.spawnSubagentSessions=true`のとき、新しいMatrixスレッドを作成して対象セッションにbindします。
- 既存のMatrixスレッド内で`/focus`または`/acp spawn --thread here`を実行すると、代わりにその現在のスレッドがbindされます。

## ACP会話bindings

Matrixルーム、DM、既存のMatrixスレッドは、チャット画面を変えることなく永続的なACPワークスペースにできます。

迅速なオペレーターフロー:

- 引き続き使いたいMatrix DM、ルーム、または既存スレッド内で`/acp spawn codex --bind here`を実行します。
- トップレベルのMatrix DMまたはルームでは、現在のDM/ルームがそのままチャット画面として使われ、今後のメッセージは生成されたACPセッションにルーティングされます。
- 既存のMatrixスレッド内では、`--bind here`がその現在のスレッドをその場でbindします。
- `/new`と`/reset`は、同じbind済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じてbindingを削除します。

注記:

- `--bind here`は子のMatrixスレッドを作成しません。
- `threadBindings.spawnAcpSessions`は、OpenClawが子のMatrixスレッドを作成またはbindする必要がある`/acp spawn --thread auto|here`でのみ必要です。

### スレッドbinding設定

Matrixは`session.threadBindings`からグローバルデフォルトを継承し、チャネル単位の上書きもサポートします:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrixのスレッドbindされたspawnフラグはオプトインです:

- トップレベルの`/focus`で新しいMatrixスレッドを作成してbindできるようにするには、`threadBindings.spawnSubagentSessions: true`を設定します。
- `/acp spawn --thread auto|here`でACPセッションをMatrixスレッドにbindできるようにするには、`threadBindings.spawnAcpSessions: true`を設定します。

## リアクション

Matrixは、送信リアクション操作、受信リアクション通知、受信ackリアクションをサポートします。

- 送信リアクションツールは`channels["matrix"].actions.reactions`で制御されます。
- `react`は特定のMatrixイベントにリアクションを追加します。
- `reactions`は特定のMatrixイベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""`は、そのイベント上のボットアカウント自身のリアクションを削除します。
- `remove: true`は、ボットアカウントの指定された絵文字リアクションのみを削除します。

ackリアクションは標準のOpenClaw解決順序を使用します:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent identityの絵文字フォールバック

ackリアクションのスコープは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順序で解決されます:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"`は、ボットが作成したMatrixメッセージを対象とする追加`m.reaction`イベントを転送します。
- `reactionNotifications: "off"`は、リアクションシステムイベントを無効にします。
- リアクション削除は、Matrixではそれらが独立した`m.reaction`削除ではなくredactionとして表現されるため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit`は、Matrixルームメッセージがagentをトリガーしたときに`InboundHistory`として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit`にフォールバックし、両方とも未設定の場合の実効デフォルトは`0`です。無効にするには`0`を設定してください。
- Matrixルーム履歴はルーム専用です。DMは通常のセッション履歴を引き続き使用します。
- Matrixルーム履歴はpendingのみです。OpenClawはまだ返信をトリガーしていないルームメッセージをバッファし、メンションなどのトリガーが来た時点でそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは`InboundHistory`には含まれません。そのターンのメイン受信本文に残ります。
- 同じMatrixイベントの再試行では、より新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrixは、取得した返信テキスト、スレッドルート、pending履歴などの補足ルームコンテキストに対して、共通の`contextVisibility`制御をサポートします。

- `contextVisibility: "all"`がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"`は、補足コンテキストを、アクティブなルーム/ユーザー許可リストチェックで許可された送信者に限定します。
- `contextVisibility: "allowlist_quote"`は`allowlist`と同様に動作しますが、1つの明示的な引用返信は引き続き保持します。

この設定は、補足コンテキストの可視性に影響し、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガー認可は引き続き`groupPolicy`、`groups`、`groupAllowFrom`、およびDMポリシー設定によって決まります。

## DMとルームのポリシー

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

メンション制御と許可リストの動作については、[Groups](/ja-JP/channels/groups)を参照してください。

Matrix DMのペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認のMatrixユーザーが承認前に何度もメッセージを送ってきた場合、OpenClawは同じ保留中のペアリングコードを再利用し、短いクールダウン後に新しいコードを発行する代わりにリマインダー返信を再送することがあります。

共通のDMペアリングフローとストレージレイアウトについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## 直接ルーム修復

ダイレクトメッセージ状態が同期ずれすると、OpenClawは古いソロルームを指す古い`m.direct`マッピングを保持し、実際のDMを指さなくなることがあります。相手に対する現在のマッピングを調べるには:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フローは次のように動作します:

- すでに`m.direct`にマップされている厳格な1対1 DMを優先する
- それがなければ、そのユーザーとの現在参加中の厳格な1対1 DMにフォールバックする
- 正常なDMが存在しない場合は、新しいダイレクトルームを作成して`m.direct`を書き換える

修復フローは古いルームを自動削除しません。正常なDMを選択してマッピングを更新するだけなので、新しいMatrix送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec承認

Matrixは、Matrixアカウントのネイティブ承認クライアントとして機能できます。ネイティブの
DM/チャネルルーティングのノブは、引き続きexec承認設定の下にあります:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom`にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は`@owner:example.org`のようなMatrix user IDである必要があります。Matrixは、`enabled`が未設定または`"auto"`で、少なくとも1人の承認者を解決できる場合にネイティブ承認を自動有効化します。Exec承認は最初に`execApprovals.approvers`を使用し、`channels.matrix.dm.allowFrom`にフォールバックできます。プラグイン承認は`channels.matrix.dm.allowFrom`経由で認可されます。Matrixをネイティブ承認クライアントとして明示的に無効化するには、`enabled: false`を設定してください。それ以外の場合、承認リクエストは他の設定済み承認経路または承認フォールバックポリシーにフォールバックします。

Matrixのネイティブルーティングは両方の承認種別をサポートします:

- `channels.matrix.execApprovals.*`は、Matrix承認プロンプトのネイティブDM/チャネルファンアウトモードを制御します。
- Exec承認は、`execApprovals.approvers`または`channels.matrix.dm.allowFrom`から取得したexec承認者セットを使用します。
- プラグイン承認は、`channels.matrix.dm.allowFrom`のMatrix DM許可リストを使用します。
- Matrixのリアクションショートカットとメッセージ更新は、exec承認とプラグイン承認の両方に適用されます。

配信ルール:

- `target: "dm"`は承認プロンプトを承認者のDMに送信します
- `target: "channel"`はプロンプトを発信元のMatrixルームまたはDMに送り返します
- `target: "both"`は承認者のDMと発信元のMatrixルームまたはDMの両方に送信します

Matrix承認プロンプトは、主たる承認メッセージにリアクションショートカットを設定します:

- `✅` = 1回だけ許可
- `❌` = 拒否
- `♾️` = 有効なexecポリシーでその判断が許可されている場合は常に許可

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または`/approve <id> deny`を使用できます。

許可または拒否できるのは、解決済みの承認者のみです。exec承認では、チャネル配信にコマンドテキストが含まれるため、`channel`または`both`は信頼できるルームでのみ有効にしてください。

アカウント単位の上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## 複数アカウント

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

トップレベルの`channels.matrix`値は、アカウントが上書きしない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルーム項目は`groups.<room>.account`で1つのMatrixアカウントに絞り込めます。
`account`なしの項目はすべてのMatrixアカウントで共有されたままで、`account: "default"`の項目はデフォルトアカウントがトップレベルの`channels.matrix.*`に直接設定されている場合でも引き続き機能します。
共有認証デフォルトが部分的にあるだけでは、それ自体で別の暗黙のデフォルトアカウントは作成されません。OpenClawがトップレベルの`default`アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または`homeserver` + `userId`と`password`）がある場合のみです。名前付きアカウントは、後でキャッシュ済み認証情報が認証条件を満たす場合、`homeserver` + `userId`だけでも引き続き検出可能なままにできます。
Matrixにすでに名前付きアカウントがちょうど1つある場合、または`defaultAccount`が既存の名前付きアカウントキーを指している場合、単一アカウントから複数アカウントへの修復/セットアップ昇格では、新しい`accounts.default`項目を作成する代わりにそのアカウントが保持されます。昇格されたアカウントに移動するのはMatrix認証/bootstrapキーのみで、共有配信ポリシーキーはトップレベルに残ります。
暗黙のルーティング、プローブ、CLI操作で1つの名前付きMatrixアカウントを優先したい場合は、`defaultAccount`を設定してください。
複数の名前付きアカウントを設定している場合は、暗黙のアカウント選択に依存するCLIコマンドのために`defaultAccount`を設定するか、`--account <id>`を渡してください。
1つのコマンドだけでその暗黙の選択を上書きしたい場合は、`openclaw matrix verify ...`と`openclaw matrix devices ...`に`--account <id>`を渡してください。

共通の複数アカウントパターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels)を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClawはSSRF保護のため、プライベート/内部のMatrix homeserverを
アカウント単位で明示的にオプトインしない限りブロックします。

homeserverがlocalhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、そのMatrixアカウントで
`network.dangerouslyAllowPrivateNetwork`を有効にしてください:

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

CLIセットアップ例:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

このオプトインは、信頼できるプライベート/内部ターゲットのみを許可します。`http://matrix.example.org:8008`のような
公開クリアテキストhomeserverは引き続きブロックされます。可能な限り`https://`を推奨します。

## Matrixトラフィックのプロキシ

Matrix環境で明示的な送信HTTP(S)プロキシが必要な場合は、`channels.matrix.proxy`を設定します:

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy`でトップレベルのデフォルトを上書きできます。
OpenClawは、ランタイムのMatrixトラフィックとアカウント状態プローブの両方に同じプロキシ設定を使用します。

## ターゲット解決

Matrixは、OpenClawがルームまたはユーザーターゲットを求めるあらゆる場所で、次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または`matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または`matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または`matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン済みのMatrixアカウントを使用します:

- ユーザー検索は、そのhomeserverのMatrixユーザーディレクトリを問い合わせます。
- ルーム検索は、明示的なルームIDとエイリアスを直接受け付け、その後そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加中ルーム名検索はベストエフォートです。ルーム名をIDまたはエイリアスに解決できない場合、ランタイム許可リスト解決で無視されます。

## 設定リファレンス

- `enabled`: チャネルを有効化または無効化します。
- `name`: アカウントの任意ラベルです。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合の優先アカウントIDです。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このMatrixアカウントがプライベート/内部homeserverに接続できるようにします。homeserverが`localhost`、LAN/Tailscale IP、または`matrix-synapse`のような内部ホストに解決される場合に有効化してください。
- `proxy`: Matrixトラフィック用の任意のHTTP(S)プロキシURLです。名前付きアカウントは独自の`proxy`でトップレベルのデフォルトを上書きできます。
- `userId`: 完全なMatrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のaccess tokenです。平文値とSecretRef値の両方が、env/file/execプロバイダー全体で`channels.matrix.accessToken`および`channels.matrix.accounts.<id>.accessToken`に対応しています。[Secrets Management](/ja-JP/gateway/secrets)を参照してください。
- `password`: パスワードベースログイン用のpasswordです。平文値とSecretRef値の両方がサポートされます。
- `deviceId`: 明示的なMatrix device IDです。
- `deviceName`: パスワードログイン用のデバイス表示名です。
- `avatarUrl`: プロファイル同期と`profile set`更新用に保存されるself-avatar URLです。
- `initialSyncLimit`: 起動時syncで取得するイベントの最大数です。
- `encryption`: E2EEを有効にします。
- `allowlistOnly`: `true`の場合、`open`ルームポリシーを`allowlist`に昇格し、`disabled`以外のすべての有効なDMポリシー（`pairing`と`open`を含む）を`allowlist`に強制します。`disabled`ポリシーには影響しません。
- `allowBots`: 他の設定済みOpenClaw Matrixアカウントからのメッセージを許可します（`true`または`"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または`disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のuser ID許可リストです。項目は完全なMatrix user IDにしてください。未解決の名前はランタイムで無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数です。`messages.groupChat.historyLimit`にフォールバックし、両方とも未設定の場合の実効デフォルトは`0`です。無効にするには`0`を設定してください。
- `replyToMode`: `off`、`first`、`all`、または`batched`。
- `markdown`: 送信Matrixテキスト用の任意のMarkdownレンダリング設定です。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または`false`。`"partial"`と`true`は、通常のMatrixテキストメッセージでプレビュー優先のドラフト更新を有効にします。`"quiet"`は、自己ホスト型プッシュルール構成向けの通知なしプレビュー通知を使用します。`false`は`"off"`と同等です。
- `blockStreaming`: `true`で、ドラフトプレビューストリーミングが有効な間、完了したassistantブロックの別個の進行状況メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または`always`。
- `threadBindings`: スレッドにbindされたセッションルーティングとライフサイクルのチャネル単位上書きです。
- `startupVerification`: 起動時の自動自己検証リクエストモード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 自動起動時検証リクエストを再試行するまでのクールダウンです。
- `textChunkLimit`: 送信メッセージの文字数単位チャンクサイズ（`chunkMode`が`length`のときに適用）。
- `chunkMode`: `length`は文字数でメッセージを分割し、`newline`は改行境界で分割します。
- `responsePrefix`: このチャネルのすべての送信返信の前に付加される任意の文字列です。
- `ackReaction`: このチャネル/アカウント用の任意のackリアクション上書きです。
- `ackReactionScope`: 任意のackリアクションスコープ上書き（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理用のメディアサイズ上限（MB）。
- `autoJoin`: 招待自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM形式の招待を含むすべてのMatrix招待に適用されます。
- `autoJoinAllowlist`: `autoJoin`が`allowlist`のときに許可されるルーム/エイリアス。エイリアス項目は招待処理中にルームIDに解決されます。OpenClawは、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DMポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClawがルームに参加し、それをDMとして分類した後のDMアクセスを制御します。招待が自動参加されるかどうかは変更しません。
- `dm.allowFrom`: ライブディレクトリ検索ですでに解決済みでない限り、項目は完全なMatrix user IDにしてください。
- `dm.sessionScope`: `per-user`（デフォルト）または`per-room`。相手が同じでも各Matrix DMルームで別個のコンテキストを保持したい場合は`per-room`を使用します。
- `dm.threadReplies`: DM専用のスレッドポリシー上書き（`off`、`inbound`、`always`）。これは、DMにおける返信配置とセッション分離の両方について、トップレベルの`threadReplies`設定を上書きします。
- `execApprovals`: Matrixネイティブのexec承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: execリクエストを承認できるMatrix user ID。`dm.allowFrom`ですでに承認者を特定できる場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きアカウント単位の上書き。トップレベルの`channels.matrix`値はこれらの項目のデフォルトとして機能します。
- `groups`: ルーム単位のポリシーマップ。ルームIDまたはエイリアスを推奨します。未解決のルーム名はランタイムで無視されます。セッション/グループidentityは、解決後の安定したルームIDを使用します。
- `groups.<room>.account`: 複数アカウント構成で、継承された1つのルーム項目を特定のMatrixアカウントに制限します。
- `groups.<room>.allowBots`: 設定済みボット送信者用のルームレベル上書き（`true`または`"mentions"`）。
- `groups.<room>.users`: ルーム単位の送信者許可リスト。
- `groups.<room>.tools`: ルーム単位のツール許可/拒否上書き。
- `groups.<room>.autoReply`: ルームレベルのメンション制御上書き。`true`でそのルームのメンション必須を無効にし、`false`で再び有効にします。
- `groups.<room>.skills`: 任意のルームレベルSkillsフィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベルsystem promptスニペット。
- `rooms`: `groups`のレガシーエイリアス。
- `actions`: アクション単位のツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
