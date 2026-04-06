---
read_when:
    - OpenClawでMatrixをセットアップする場合
    - MatrixのE2EEと検証を設定する場合
summary: Matrixのサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-06T04:46:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06f833bf0ede81bad69f140994c32e8cc5d1635764f95fc5db4fc5dc25f2b85e
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrixは、OpenClaw用のMatrixバンドル済みチャネルpluginです。
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートします。

## バンドル済みplugin

Matrixは現在のOpenClawリリースではバンドル済みpluginとして提供されるため、通常の
パッケージ版ビルドでは別途インストールは不要です。

古いビルドや、Matrixを含まないカスタムインストールを使用している場合は、
手動でインストールしてください。

npmからインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルのチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

pluginの動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. Matrix pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでにバンドルされています。
   - 古いインストールやカスタムインストールでは、上記のコマンドで手動追加できます。
2. ご利用のhomeserverでMatrixアカウントを作成します。
3. `channels.matrix`を次のいずれかで設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`。
4. Gatewayを再起動します。
5. botとのDMを開始するか、ルームに招待します。

対話型セットアップの手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrixウィザードが実際に尋ねる内容:

- homeserver URL
- 認証方法: access token または password
- `password`認証を選んだ場合のみ user ID
- 任意のデバイス名
- E2EEを有効にするかどうか
- Matrixルームアクセスを今すぐ設定するかどうか

重要なウィザード動作:

- 選択したアカウントに対応するMatrix認証用env varがすでに存在し、そのアカウントの認証情報がまだconfigに保存されていない場合、ウィザードはenvショートカットを提示し、そのアカウントには`enabled: true`のみを書き込みます。
- 別のMatrixアカウントを対話的に追加すると、入力したアカウント名はconfigとenv varsで使用されるアカウントIDに正規化されます。たとえば、`Ops Bot`は`ops-bot`になります。
- DM allowlistのプロンプトでは、完全な`@user:server`値をそのまま受け付けます。表示名が使えるのは、ライブのディレクトリ検索で正確に1件だけ一致した場合のみで、それ以外では完全なMatrix IDで再入力するようウィザードが求めます。
- ルームallowlistのプロンプトでは、ルームIDとエイリアスを直接受け付けます。参加済みルーム名のライブ解決も可能ですが、解決できない名前はセットアップ時に入力された文字列のまま保持されるだけで、実行時のallowlist解決では無視されます。`!room:server`または`#alias:server`の使用を推奨します。
- 実行時のルーム/セッション識別には安定したMatrixルームIDが使われます。ルームで宣言されたエイリアスは、長期的なセッションキーや安定したグループ識別子ではなく、検索入力としてのみ使われます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"`を使用します。

最小限のトークンベース設定:

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

パスワードベース設定（ログイン後にトークンがキャッシュされます）:

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

Matrixはキャッシュされた認証情報を`~/.openclaw/credentials/matrix/`に保存します。
デフォルトアカウントでは`credentials.json`、名前付きアカウントでは`credentials-<account>.json`を使います。
そこにキャッシュ済み認証情報が存在する場合、現在の認証情報がconfigに直接設定されていなくても、OpenClawはセットアップ、doctor、チャネル状態の検出においてMatrixが設定済みだと扱います。

環境変数の対応表（configキーが未設定の場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付きenv varsを使用します。

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント`ops`の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化済みアカウントID`ops-bot`では、次を使用します。

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

MatrixはアカウントID内の句読点をエスケープして、スコープ付きenv varsで衝突が起きないようにします。
たとえば、`-`は`_X2D_`になり、`ops-prod`は`MATRIX_OPS_X2D_PROD_*`に対応します。

対話型ウィザードがenv varショートカットを提示するのは、それらの認証用env varsがすでに存在し、かつ選択したアカウントにMatrix認証情報がまだconfigへ保存されていない場合のみです。

## 設定例

これは、DM pairing、ルームallowlist、E2EE有効化を含む実用的なベースライン設定です。

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

`autoJoin`は、ルーム/グループ招待だけでなく、一般的なMatrix招待に適用されます。
これには新しいDM形式の招待も含まれます。招待時点では、OpenClawは招待された
ルームが最終的にDMとして扱われるかグループとして扱われるかを確実には判断できないため、すべての招待はまず同じ
`autoJoin`判定を通ります。botが参加し、そのルームが
DMとして分類された後は、引き続き`dm.policy`が適用されるため、`autoJoin`は参加動作を、`dm.policy`は返信/アクセス
動作を制御します。

## ストリーミングプレビュー

Matrixの返信ストリーミングはオプトインです。

OpenClawに単一のライブプレビュー返信を送信させ、
モデルがテキストを生成している間そのプレビューをその場で編集し、返信完了時に確定したい場合は、
`channels.matrix.streaming`を`"partial"`に設定します。

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
- `streaming: "partial"`は、現在のassistantブロックに対して、通常のMatrixテキストメッセージを使った編集可能なプレビューメッセージを1つ作成します。これにより、Matrixの従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成済みブロックではなく最初のストリーミングプレビューテキストに対して通知される場合があります。
- `streaming: "quiet"`は、現在のassistantブロックに対して編集可能な静かなプレビュー通知を1つ作成します。これは、確定したプレビュー編集に対する受信者側push ruleも設定している場合にのみ使用してください。
- `blockStreaming: true`は、Matrixの進捗メッセージを個別に有効化します。プレビュー ストリーミングが有効な場合、Matrixは現在のブロックのライブ下書きを維持し、完了済みブロックを別メッセージとして保持します。
- プレビュー ストリーミングがオンで`blockStreaming`がオフの場合、Matrixはライブ下書きをその場で編集し、ブロックまたはターンが終わると同じイベントを確定します。
- プレビューが1つのMatrixイベントに収まらなくなった場合、OpenClawはプレビュー ストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルとして送信されます。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終メディア返信を送信する前にそれをredactします。
- プレビュー編集には追加のMatrix API呼び出しコストがかかります。最も保守的なrate limit動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming`自体では下書きプレビューは有効になりません。
プレビュー編集には`streaming: "partial"`または`streaming: "quiet"`を使い、
完了済みassistantブロックも個別の進捗メッセージとして表示したい場合にのみ`blockStreaming: true`を追加してください。

カスタムpush ruleなしで標準のMatrix通知が必要な場合は、プレビュー先行動作には`streaming: "partial"`を使うか、最終結果のみ配信するには`streaming`をオフのままにしてください。`streaming: "off"`の場合:

- `blockStreaming: true`は、完了した各ブロックを通常の通知対象となるMatrixメッセージとして送信します。
- `blockStreaming: false`は、最終的に完成した返信のみを通常の通知対象となるMatrixメッセージとして送信します。

### 静かな確定プレビュー向けのセルフホストpush rules

独自のMatrixインフラを運用していて、静かなプレビューでブロックまたは
最終返信の完了時のみ通知したい場合は、`streaming: "quiet"`を設定し、確定したプレビュー編集に対するユーザーごとのpush ruleを追加します。

これは通常、homeserver全体の設定変更ではなく、受信者ユーザー側のセットアップです。

始める前の対応表:

- recipient user = 通知を受け取る人
- bot user = 返信を送信するOpenClaw Matrixアカウント
- 以下のAPI呼び出しにはrecipient userのaccess tokenを使用する
- push rule内の`sender`はbot userの完全なMXIDに一致させる

1. OpenClawで静かなプレビューを使うよう設定します。

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. recipientアカウントが通常のMatrix push通知をすでに受け取れていることを確認します。静かなプレビュー
   ルールは、そのユーザーに有効なpushers/devicesがすでにある場合にのみ機能します。

3. recipient userのaccess tokenを取得します。
   - botのtokenではなく、受信するユーザーのtokenを使ってください。
   - 既存のクライアントセッショントークンを再利用するのが通常は最も簡単です。
   - 新しいtokenを発行する必要がある場合は、標準のMatrix Client-Server APIからログインできます。

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

4. recipientアカウントにすでにpushersがあることを確認します。

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

これで有効なpushers/devicesが返らない場合は、以下の
OpenClawルールを追加する前に、まず通常のMatrix通知を修正してください。

OpenClawは、確定したテキストのみのプレビュー編集に次のマーカーを付けます。

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. これらの通知を受け取る各recipientアカウントに対してoverride push ruleを作成します。

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

コマンド実行前に、次の値を置き換えてください。

- `https://matrix.example.org`: あなたのhomeserverベースURL
- `$USER_ACCESS_TOKEN`: 受信ユーザーのaccess token
- `openclaw-finalized-preview-botname`: この受信ユーザーに対するこのbot専用の一意なrule ID
- `@bot:example.org`: 受信ユーザーのMXIDではなく、あなたのOpenClaw Matrix bot MXID

複数bot構成で重要な点:

- Push rulesは`ruleId`でキー付けされます。同じrule IDに対して`PUT`を再実行すると、その1つのルールが更新されます。
- 1人の受信ユーザーが複数のOpenClaw Matrix botアカウントから通知を受ける必要がある場合は、送信者一致ごとに一意なrule IDを持つルールをbotごとに1つ作成してください。
- 単純なパターンとしては、`openclaw-finalized-preview-<botname>`、たとえば`openclaw-finalized-preview-ops`や`openclaw-finalized-preview-support`があります。

このルールはイベント送信者に対して評価されます。

- 受信ユーザーのtokenで認証する
- `sender`をOpenClaw bot MXIDに一致させる

6. ルールが存在することを確認します。

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

7. ストリーミング返信をテストします。quietモードでは、ルームに静かな下書きプレビューが表示され、
   ブロックまたはターンの完了時に、その場での最終編集で1回だけ通知されるはずです。

後でルールを削除する必要がある場合は、受信ユーザーのtokenで同じrule IDを削除します。

```bash
curl -sS -X DELETE \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

注記:

- ルールの作成には、botのtokenではなく受信ユーザーのaccess tokenを使ってください。
- 新しいユーザー定義の`override`ルールは、デフォルトの抑制ルールより前に挿入されるため、追加の順序パラメータは不要です。
- これは、OpenClawが安全にその場で確定できるテキストのみのプレビュー編集にのみ影響します。メディアフォールバックや古いプレビューフォールバックでは、引き続き通常のMatrix配信が使われます。
- `GET /_matrix/client/v3/pushers`でpushersが表示されない場合、そのユーザーはまだこのアカウント/デバイスで有効なMatrix push配信を持っていません。

#### Synapse

Synapseでは、通常は上記のセットアップだけで十分です。

- 確定済みOpenClawプレビュー通知のために特別な`homeserver.yaml`変更は不要です。
- Synapseデプロイがすでに通常のMatrix push通知を送信している場合、ユーザーtoken + 上記の`pushrules`呼び出しが主なセットアップ手順です。
- Synapseをリバースプロキシまたはworkerの背後で実行している場合は、`/_matrix/client/.../pushrules/`が正しくSynapseに届くことを確認してください。
- Synapse workersを使用している場合は、pushersが正常であることを確認してください。push配信はメインプロセス、または`synapse.app.pusher` / 設定されたpusher workerで処理されます。

#### Tuwunel

Tuwunelでは、上記と同じセットアップ手順とpush-rule API呼び出しを使用します。

- 確定プレビューマーカー自体のためにTuwunel固有の設定は不要です。
- そのユーザーですでに通常のMatrix通知が機能している場合、ユーザーtoken + 上記の`pushrules`呼び出しが主なセットアップ手順です。
- ユーザーが別のデバイスでアクティブな間に通知が消えるように見える場合は、`suppress_push_when_active`が有効かどうかを確認してください。Tuwunelは2025年9月12日のTuwunel 1.4.2でこのオプションを追加しており、1台のデバイスがアクティブな間は他のデバイスへのpushを意図的に抑制することがあります。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントに`thumbnail_file`が使われるため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続きプレーンな`thumbnail_url`が使われます。設定は不要です — pluginがE2EE状態を自動検出します。

### Bot to botルーム

デフォルトでは、他の設定済みOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

エージェント間のMatrixトラフィックを意図的に許可したい場合は、`allowBots`を使用してください。

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

- `allowBots: true`は、許可されたルームとDMにおいて、他の設定済みMatrix botアカウントからのメッセージを受け付けます。
- `allowBots: "mentions"`は、ルーム内でそのメッセージがこのbotに明示的にメンションしている場合にのみ受け付けます。DMは引き続き許可されます。
- `groups.<room>.allowBots`は、1つのルームに対してアカウントレベル設定を上書きします。
- OpenClawは自己返信ループを避けるため、同じMatrix user IDからのメッセージは引き続き無視します。
- Matrixはここでネイティブのbotフラグを公開していないため、OpenClawは「bot作成メッセージ」を「このOpenClaw Gateway上で設定された別のMatrixアカウントから送信されたもの」として扱います。

共有ルームでbot間トラフィックを有効にする場合は、厳格なルームallowlistとメンション要件を使用してください。

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

詳細ステータス（完全な診断）:

```bash
openclaw matrix verify status --verbose
```

保存されたrecovery keyを機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロス署名と検証状態をbootstrapする:

```bash
openclaw matrix verify bootstrap
```

複数アカウント対応: `channels.matrix.accounts`を使って、アカウントごとの認証情報と任意の`name`を設定します。共有パターンについては、[Configuration reference](/ja-JP/gateway/configuration-reference#multi-account-all-channels)を参照してください。

詳細なbootstrap診断:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap前に新しいクロス署名IDリセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery keyでこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキーbackupの健全性を確認する:

```bash
openclaw matrix verify backup status
```

詳細なbackup健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーbackupからルームキーを復元する:

```bash
openclaw matrix verify backup restore
```

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーbackupを削除し、新しいbackupベースラインを作成します。保存された
backup keyを正常に読み込めない場合、このリセットではsecret storageも再作成されるため、
今後のコールドスタートで新しいbackup keyを読み込めるようになります。

```bash
openclaw matrix verify backup reset --yes
```

すべての`verify`コマンドはデフォルトでは簡潔で（内部SDKログの抑制も含む）、詳細な診断は`--verbose`を付けた場合にのみ表示されます。
スクリプトで使う場合は、完全な機械可読出力に`--json`を使用してください。

複数アカウント構成では、`--account <id>`を渡さない限り、Matrix CLIコマンドは暗黙のMatrixデフォルトアカウントを使用します。
複数の名前付きアカウントを設定している場合は、まず`channels.matrix.defaultAccount`を設定してください。そうしないと、それらの暗黙的なCLI操作は停止して、明示的にアカウントを選ぶよう求められます。
検証やデバイス操作の対象を名前付きアカウントに明示的にしたい場合は、必ず`--account`を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効、または名前付きアカウントで利用できない場合、Matrixの警告と検証エラーは、そのアカウントのconfigキー、たとえば`channels.matrix.accounts.assistant.encryption`を指します。

### 「検証済み」の意味

OpenClawは、このMatrixデバイスがあなた自身のクロス署名IDによって検証された場合にのみ、このデバイスを検証済みとして扱います。
実際には、`openclaw matrix verify status --verbose`は次の3つの信頼シグナルを公開します。

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDKが、このデバイスがクロス署名を通じて検証済みであると報告しています
- `Signed by owner`: このデバイスがあなた自身のself-signing keyで署名されています

`Verified by owner`が`yes`になるのは、クロス署名検証またはowner署名が存在する場合のみです。
ローカル信頼だけでは、OpenClawがそのデバイスを完全検証済みとして扱うには不十分です。

### bootstrapが行うこと

`openclaw matrix verify bootstrap`は、暗号化されたMatrixアカウント向けの修復兼セットアップコマンドです。
次のすべてを順に実行します。

- 可能であれば既存のrecovery keyを再利用してsecret storageをbootstrapする
- クロス署名をbootstrapし、不足している公開クロス署名キーをアップロードする
- 現在のデバイスをマークしてクロス署名することを試みる
- まだ存在しない場合、新しいサーバー側ルームキーbackupを作成する

homeserverがクロス署名キーのアップロードに対話的認証を要求する場合、OpenClawはまず認証なしで、その後`m.login.dummy`で、最後に`channels.matrix.password`が設定されているときは`m.login.password`で試行します。

現在のクロス署名IDを破棄して新しく作成したい場合にのみ、`--force-reset-cross-signing`を使用してください。

現在のルームキーbackupを意図的に破棄し、今後のメッセージのために新しい
backupベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes`を使用してください。
これは、復旧不能な古い暗号化履歴が引き続き利用できないままであること、
および現在のbackup
secretを安全に読み込めない場合にOpenClawがsecret storageを再作成する可能性があることを受け入れる場合にのみ実行してください。

### 新しいbackupベースライン

今後の暗号化メッセージを維持しつつ、復旧不能な古い履歴が失われても構わない場合は、次のコマンドを順に実行します。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、各コマンドに`--account <id>`を追加してください。

### 起動時の動作

`encryption: true`の場合、Matrixは`startupVerification`のデフォルトを`"if-unverified"`にします。
起動時にこのデバイスがまだ未検証であれば、Matrixは別のMatrixクライアントでの自己検証を要求し、
すでに1件保留中なら重複要求をスキップし、再起動後の再試行前にローカルのクールダウンを適用します。
失敗した要求試行は、成功した要求作成よりもデフォルトで早く再試行されます。
自動の起動時要求を無効にするには`startupVerification: "off"`を設定し、再試行間隔を短くまたは長くしたい場合は
`startupVerificationCooldownHours`を調整してください。

起動時には、保守的なcrypto bootstrapパスも自動的に実行されます。
このパスは、まず現在のsecret storageとクロス署名IDの再利用を試み、明示的なbootstrap修復フローを実行しない限りクロス署名のリセットを避けます。

起動時にbootstrap状態の破損が見つかり、`channels.matrix.password`が設定されている場合、OpenClawはより厳密な修復パスを試みることができます。
現在のデバイスがすでにowner-signedである場合、OpenClawはそのIDを自動的にリセットせず保持します。

以前の公開Matrix pluginからアップグレードする場合:

- OpenClawは可能な限り、同じMatrixアカウント、access token、デバイスIDを自動的に再利用します。
- 実行可能なMatrix移行変更を行う前に、OpenClawは`~/Backups/openclaw-migrations/`配下にrecovery snapshotを作成または再利用します。
- 複数のMatrixアカウントを使用している場合は、古いフラットストアレイアウトからアップグレードする前に`channels.matrix.defaultAccount`を設定し、その共有レガシー状態をどのアカウントに割り当てるかをOpenClawが把握できるようにしてください。
- 以前のpluginがMatrixルームキーbackup復号キーをローカル保存していた場合、起動時または`openclaw doctor --fix`がそれを新しいrecovery-keyフローへ自動的にインポートします。
- Matrix access tokenが移行準備後に変更された場合、起動時は自動backup復元を諦める前に、保留中のレガシー復元状態を探すため兄弟トークンハッシュ保存ルートをスキャンします。
- 同じアカウント、homeserver、ユーザーに対して後からMatrix access tokenが変わった場合、OpenClawは空のMatrix状態ディレクトリから開始する代わりに、最も完全な既存のトークンハッシュ保存ルートの再利用を優先します。
- 次回Gateway起動時に、backup済みルームキーは自動的に新しいcrypto storeへ復元されます。
- 古いpluginにローカルのみのルームキーがあり、それが一度もbackupされていなかった場合、OpenClawは明確に警告します。これらのキーは以前のrust crypto storeから自動エクスポートできないため、手動で復旧するまで古い暗号化履歴の一部が引き続き利用できない可能性があります。
- アップグレード手順全体、制限、復旧コマンド、一般的な移行メッセージについては、[Matrix migration](/ja-JP/install/migrating-matrix)を参照してください。

暗号化された実行時状態は、アカウントごと・ユーザーごとのトークンハッシュルートの下に
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`として整理されます。
このディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
recovery keyファイル（`recovery-key.json`）、IndexedDB snapshot（`crypto-idb-snapshot.json`）、
thread bindings（`thread-bindings.json`）、startup verification state（`startup-verification.json`）
が、それらの機能の使用時に含まれます。
トークンが変わってもアカウントIDが同じである場合、OpenClawはそのアカウント/homeserver/ユーザー組に対して最良の既存
ルートを再利用するため、以前のsync state、crypto state、thread bindings、
startup verification stateが引き続き見える状態のままになります。

### Node crypto storeモデル

このpluginのMatrix E2EEは、Node上で公式の`matrix-js-sdk` Rust cryptoパスを使用します。
このパスでは、crypto stateを再起動後も保持したい場合、IndexedDBベースの永続化が必要です。

OpenClawは現在、Node上でこれを次の方法で提供しています。

- SDKが期待するIndexedDB API shimとして`fake-indexeddb`を使用する
- `initRustCrypto`の前に`crypto-idb-snapshot.json`からRust crypto IndexedDBの内容を復元する
- init後および実行中に、更新されたIndexedDBの内容を`crypto-idb-snapshot.json`へ永続化する
- `crypto-idb-snapshot.json`に対するsnapshotの復元と永続化を、助言的ファイルロックで直列化し、Gateway実行時の永続化とCLIメンテナンスが同じsnapshotファイルを競合しないようにする

これは互換性/保存のための配線であり、カスタム暗号実装ではありません。
snapshotファイルは機密な実行時状態であり、制限の厳しいファイル権限で保存されます。
OpenClawのセキュリティモデルでは、GatewayホストとローカルOpenClaw状態ディレクトリはすでに信頼された運用者境界内にあるため、これは主に別個のリモート信頼境界というより運用上の耐久性の問題です。

今後の改善予定:

- 永続的なMatrixキーマテリアルに対するSecretRefサポートを追加し、recovery keysや関連するstore暗号化secretをローカルファイルだけでなくOpenClaw secrets providersからも取得できるようにする

## プロファイル管理

選択したアカウントのMatrix自己プロファイルを更新するには、次を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、`--account <id>`を追加してください。

Matrixは`mxc://`アバターURLを直接受け付けます。`http://`または`https://`のアバターURLを渡した場合、OpenClawはまずそれをMatrixへアップロードし、解決後の`mxc://` URLを`channels.matrix.avatarUrl`（または選択したアカウントのoverride）へ保存し直します。

## 自動検証通知

Matrixは、厳格なDM検証ルームに検証ライフサイクル通知を`m.notice`メッセージとして直接投稿するようになりました。
これには以下が含まれます。

- 検証要求通知
- 検証準備完了通知（明示的な「絵文字で検証」ガイダンス付き）
- 検証開始通知と完了通知
- 利用可能な場合のSAS詳細（絵文字と10進数）

別のMatrixクライアントからの受信検証要求は追跡され、OpenClawによって自動承認されます。
自己検証フローでは、絵文字検証が利用可能になるとOpenClawも自動的にSASフローを開始し、自身の側を確認します。
別のMatrix user/deviceからの検証要求では、OpenClawは要求を自動承認し、その後SASフローが通常どおり進むのを待ちます。
検証を完了するには、引き続きあなたのMatrixクライアントで絵文字または10進数のSASを比較し、「一致する」を確認する必要があります。

OpenClawは、自己開始の重複フローを無条件には自動承認しません。自己検証要求がすでに保留中の場合、起動時には新しい要求の作成をスキップします。

検証プロトコル/システム通知はagent chat pipelineには転送されないため、`NO_REPLY`は生成されません。

### デバイス衛生

OpenClawが管理する古いMatrixデバイスはアカウント上に蓄積し、暗号化ルームの信頼状態を把握しにくくすることがあります。
次で一覧表示できます。

```bash
openclaw matrix devices list
```

古いOpenClaw管理デバイスを削除するには、次を使用します。

```bash
openclaw matrix devices prune-stale
```

### Direct Room Repair

ダイレクトメッセージ状態の同期が崩れると、OpenClawが古いソロルームを指す古い`m.direct`マッピングを保持し、ライブDMではなくそちらを参照してしまうことがあります。相手との現在のマッピングを調べるには、次を使用します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには、次を使用します。

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復処理では、Matrix固有のロジックをplugin内に保持します。

- まず、`m.direct`にすでにマッピングされている厳密な1対1 DMを優先します
- それがなければ、そのユーザーとの現在参加中の厳密な1対1 DMにフォールバックします
- 正常なDMが存在しない場合は、新しいダイレクトルームを作成し、`m.direct`を書き換えてそれを指すようにします

修復フローは古いルームを自動削除しません。正常なDMを選択し、マッピングを更新するだけで、その後の新しいMatrix送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようにします。

## スレッド

Matrixは、自動返信とmessage-tool送信の両方でネイティブMatrixスレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DMルーティングを送信者スコープのままにするため、同じ相手に解決される複数のDMルームで1つのセッションを共有できます。
- `dm.sessionScope: "per-room"`は、通常のDM認証とallowlistチェックを使いながら、各Matrix DMルームをそれぞれ独立したセッションキーに分離します。
- 明示的なMatrix会話バインディングは引き続き`dm.sessionScope`より優先されるため、バインド済みのルームとスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"`は、返信をトップレベルのままにし、受信スレッドメッセージを親セッション上に維持します。
- `threadReplies: "inbound"`は、受信メッセージがすでにそのスレッド内にあった場合にのみスレッド内で返信します。
- `threadReplies: "always"`は、ルーム返信をトリガーメッセージをルートとするスレッドに維持し、その会話を最初のトリガーメッセージに対応するスレッドスコープのセッション経由でルーティングします。
- `dm.threadReplies`は、DMに限ってトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DMはフラットに保てます。
- 受信スレッドメッセージには、追加のagentコンテキストとしてスレッドルートメッセージが含まれます。
- message-tool送信は、対象が同じルーム、または同じDMユーザー対象である場合、明示的な`threadId`が指定されていなければ、現在のMatrixスレッドを自動継承します。
- 同一セッションのDMユーザー対象再利用は、現在のセッションメタデータが同じMatrixアカウント上の同じDM相手を証明できる場合にのみ有効で、それ以外ではOpenClawは通常のユーザースコープルーティングにフォールバックします。
- OpenClawが、同じ共有Matrix DMセッション上で別のDMルームと衝突するMatrix DMルームを検出した場合、スレッドバインディングが有効で`dm.sessionScope`のヒントがあると、そのルームに1回限りの`m.notice`を投稿し、`/focus`というエスケープハッチを案内します。
- Matrixでは実行時スレッドバインディングがサポートされます。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた`/acp spawn`が、MatrixルームとDMで動作します。
- トップレベルのMatrixルーム/DMでの`/focus`は、`threadBindings.spawnSubagentSessions=true`のとき、新しいMatrixスレッドを作成し、それを対象セッションにバインドします。
- 既存のMatrixスレッド内で`/focus`または`/acp spawn --thread here`を実行した場合は、代わりにその現在のスレッドをバインドします。

## ACP会話バインディング

Matrixルーム、DM、既存のMatrixスレッドは、チャット画面を変えずに永続的なACPワークスペースへ変換できます。

高速な運用フロー:

- 使い続けたいMatrix DM、ルーム、または既存スレッドの中で`/acp spawn codex --bind here`を実行します。
- トップレベルのMatrix DMまたはルームでは、現在のDM/ルームがチャット画面のまま維持され、今後のメッセージは生成されたACPセッションにルーティングされます。
- 既存のMatrixスレッド内では、`--bind here`はその現在のスレッドをその場でバインドします。
- `/new`と`/reset`は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close`は、ACPセッションを閉じてバインディングを削除します。

注記:

- `--bind here`は子のMatrixスレッドを作成しません。
- `threadBindings.spawnAcpSessions`が必要なのは`/acp spawn --thread auto|here`の場合のみで、そのときOpenClawは子のMatrixスレッドを作成またはバインドする必要があります。

### Thread Binding Config

Matrixは`session.threadBindings`からグローバルデフォルトを継承し、チャネルごとのoverrideもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrixのスレッドバインドspawnフラグはオプトインです。

- トップレベルの`/focus`で新しいMatrixスレッドを作成してバインドできるようにするには、`threadBindings.spawnSubagentSessions: true`を設定します。
- `/acp spawn --thread auto|here`でACPセッションをMatrixスレッドにバインドできるようにするには、`threadBindings.spawnAcpSessions: true`を設定します。

## リアクション

Matrixは、送信リアクション操作、受信リアクション通知、受信ackリアクションをサポートします。

- 送信リアクションtoolingは`channels["matrix"].actions.reactions`で制御されます。
- `react`は、特定のMatrixイベントにリアクションを追加します。
- `reactions`は、特定のMatrixイベントに対する現在のリアクション概要を一覧表示します。
- `emoji=""`は、そのイベント上のbotアカウント自身のリアクションを削除します。
- `remove: true`は、botアカウントの指定した絵文字リアクションのみを削除します。

ackリアクションは、標準のOpenClaw解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- agent IDの絵文字フォールバック

ackリアクションスコープは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

現在の動作:

- `reactionNotifications: "own"`は、botが作成したMatrixメッセージを対象とする追加済み`m.reaction`イベントを転送します。
- `reactionNotifications: "off"`は、リアクションシステムイベントを無効にします。
- リアクション削除は、Matrixではそれが独立した`m.reaction`削除ではなくredactionとして表現されるため、依然としてシステムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit`は、Matrixルームメッセージがagentをトリガーしたときに`InboundHistory`として含める最近のルームメッセージ数を制御します。
- これは`messages.groupChat.historyLimit`にフォールバックします。両方とも未設定の場合、有効なデフォルトは`0`であるため、メンション制御されたルームメッセージはバッファされません。無効にするには`0`を設定します。
- Matrixルーム履歴はルーム専用です。DMは引き続き通常のセッション履歴を使用します。
- Matrixルーム履歴はpendingのみです。OpenClawは、まだ返信をトリガーしていないルームメッセージをバッファし、メンションや他のトリガーが到着したときにそのウィンドウをsnapshotします。
- 現在のトリガーメッセージ自体は`InboundHistory`に含まれず、そのターンのメインの受信本文に残ります。
- 同じMatrixイベントの再試行では、新しいルームメッセージへ前進してずれることなく、元の履歴snapshotを再利用します。

## コンテキスト可視性

Matrixは、取得した返信テキスト、スレッドルート、保留中履歴などの補助的なルームコンテキストに対して、共有の`contextVisibility`制御をサポートします。

- `contextVisibility: "all"`がデフォルトです。補助コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"`は、補助コンテキストを、アクティブなルーム/ユーザーallowlistチェックで許可された送信者に絞り込みます。
- `contextVisibility: "allowlist_quote"`は`allowlist`と同様に動作しますが、明示的な引用返信を1つだけ保持します。

この設定が影響するのは補助コンテキストの可視性であり、受信メッセージ自体が返信をトリガーできるかどうかではありません。
トリガーの認可は、引き続き`groupPolicy`、`groups`、`groupAllowFrom`、DMポリシー設定によって決まります。

## DMとルームポリシーの例

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

メンション制御とallowlistの動作については、[Groups](/ja-JP/channels/groups)を参照してください。

Matrix DMのpairing例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認のMatrixユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClawは同じ保留中pairingコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共有のDM pairingフローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## Exec approvals

Matrixは、Matrixアカウント向けのexec approvalクライアントとして機能できます。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。未設定時は`channels.matrix.dm.allowFrom`にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は、`@owner:example.org`のようなMatrix user IDである必要があります。`enabled`が未設定または`"auto"`で、`execApprovals.approvers`または`channels.matrix.dm.allowFrom`のいずれかから少なくとも1人の承認者を解決できる場合、Matrixはネイティブexec approvalsを自動有効化します。ネイティブapprovalクライアントとしてのMatrixを明示的に無効にするには、`enabled: false`を設定してください。それ以外の場合、approval requestsは他の設定済みapproval routesまたはexec approval fallback policyにフォールバックします。

現在、ネイティブMatrixルーティングはexec専用です。

- `channels.matrix.execApprovals.*`は、exec approvals専用のネイティブDM/チャネルルーティングを制御します。
- Plugin approvalsは引き続き、共有の同一チャット内`/approve`と、設定済みであれば`approvals.plugin`転送を使用します。
- Matrixは、承認者を安全に推測できる場合、plugin-approval認可のために`channels.matrix.dm.allowFrom`を再利用できますが、ネイティブの個別plugin-approval DM/チャネルfanoutパスは公開しません。

配信ルール:

- `target: "dm"`は、承認プロンプトを承認者のDMへ送信します
- `target: "channel"`は、プロンプトを元のMatrixルームまたはDMへ送り返します
- `target: "both"`は、承認者のDMと元のMatrixルームまたはDMの両方へ送信します

Matrix approval promptsは、主たるapprovalメッセージにリアクションショートカットを設定します。

- `✅` = 一度だけ許可
- `❌` = 拒否
- `♾️` = 有効なexec policyでその判断が許可される場合は常に許可

承認者は、そのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または`/approve <id> deny`を使えます。

承認または拒否できるのは、解決済みの承認者のみです。チャネル配信にはコマンドテキストが含まれるため、`channel`または`both`は信頼されたルームでのみ有効にしてください。

Matrix approval promptsは、共有のコアapproval plannerを再利用します。Matrix固有のネイティブ画面は、exec approvalsのためのトランスポートのみです: ルーム/DMルーティングと、メッセージ送信/更新/削除の動作です。

アカウントごとのoverride:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## 複数アカウントの例

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

トップレベルの`channels.matrix`値は、アカウント側でoverrideされない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルームエントリを1つのMatrixアカウントに限定するには、`groups.<room>.account`（またはレガシーの`rooms.<room>.account`）を使用できます。
`account`のないエントリはすべてのMatrixアカウントで共有され、`account: "default"`付きエントリも、デフォルトアカウントがトップレベル`channels.matrix.*`に直接設定されている場合は引き続き動作します。
共有認証デフォルトが部分的に設定されているだけでは、それ自体で別個の暗黙のデフォルトアカウントは作成されません。OpenClawがトップレベルの`default`アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または`homeserver` + `userId`と`password`）がある場合のみです。名前付きアカウントは、あとでキャッシュ済み認証情報が認証要件を満たすなら、`homeserver` + `userId`だけでも引き続き検出可能なままにできます。
Matrixにすでに名前付きアカウントがちょうど1つある場合、または`defaultAccount`が既存の名前付きアカウントキーを指している場合、単一アカウントから複数アカウントへの修復/セットアップ昇格では、新しい`accounts.default`エントリを作成せず、そのアカウントを保持します。昇格されたアカウントへ移動するのはMatrix auth/bootstrapキーのみで、共有配信ポリシーキーはトップレベルに残ります。
暗黙のルーティング、プローブ、CLI操作で1つの名前付きMatrixアカウントを優先したい場合は、`defaultAccount`を設定してください。
複数の名前付きアカウントを設定する場合は、暗黙のアカウント選択に依存するCLIコマンドで`defaultAccount`を設定するか、`--account <id>`を渡してください。
1つのコマンドだけその暗黙選択を上書きしたい場合は、`openclaw matrix verify ...`と`openclaw matrix devices ...`に`--account <id>`を渡してください。

## プライベート/LAN homeservers

デフォルトでは、OpenClawはSSRF保護のため、private/internal Matrix homeserversをブロックします。
アカウントごとに明示的にオプトインしない限り接続できません。

homeserverがlocalhost、LAN/Tailscale IP、または内部ホスト名上で動作している場合は、
そのMatrixアカウントで`allowPrivateNetwork`を有効にしてください。

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
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

このオプトインは、信頼されたprivate/internal targetsのみを許可します。`http://matrix.example.org:8008`のような
公開の平文homeserversは引き続きブロックされます。可能な限り`https://`を使用してください。

## Matrixトラフィックのプロキシ

Matrixデプロイで明示的な送信HTTP(S) proxyが必要な場合は、`channels.matrix.proxy`を設定します。

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

名前付きアカウントは、`channels.matrix.accounts.<id>.proxy`でトップレベルのデフォルトをoverrideできます。
OpenClawは、実行時のMatrixトラフィックとアカウント状態のプローブの両方で同じproxy設定を使用します。

## ターゲット解決

Matrixは、OpenClawがルームまたはユーザー対象の入力を求めるあらゆる場所で、次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または`matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または`matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または`matrix:channel:#alias:server`

ライブディレクトリ検索は、ログイン済みMatrixアカウントを使用します。

- ユーザー検索は、そのhomeserverのMatrix user directoryに問い合わせます。
- ルーム検索は、明示的なルームIDとエイリアスを直接受け付けた後、そのアカウントの参加済みルーム名検索にフォールバックします。
- 参加済みルーム名検索はベストエフォートです。ルーム名をIDまたはエイリアスに解決できない場合、実行時allowlist解決では無視されます。

## Configuration reference

- `enabled`: チャネルを有効または無効にします。
- `name`: アカウント用の任意ラベル。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合の優先アカウントID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `allowPrivateNetwork`: このMatrixアカウントがprivate/internal homeserversへ接続することを許可します。homeserverが`localhost`、LAN/Tailscale IP、または`matrix-synapse`のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrixトラフィック用の任意のHTTP(S) proxy URL。名前付きアカウントは独自の`proxy`でトップレベルデフォルトをoverrideできます。
- `userId`: 完全なMatrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のaccess token。`channels.matrix.accessToken`および`channels.matrix.accounts.<id>.accessToken`では、env/file/exec providers全体でプレーンテキスト値とSecretRef値をサポートします。詳細は[Secrets Management](/ja-JP/gateway/secrets)を参照してください。
- `password`: パスワードベースログイン用のpassword。プレーンテキスト値とSecretRef値をサポートします。
- `deviceId`: 明示的なMatrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロファイル同期と`set-profile`更新に使う保存済み自己アバターURL。
- `initialSyncLimit`: 起動時syncイベント上限。
- `encryption`: E2EEを有効にします。
- `allowlistOnly`: DMとルームでallowlistのみの動作を強制します。
- `allowBots`: 他の設定済みOpenClaw Matrixアカウントからのメッセージを許可します（`true`または`"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または`disabled`。
- `contextVisibility`: 補助ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用user IDのallowlist。
- `groupAllowFrom`エントリは完全なMatrix user IDである必要があります。未解決名は実行時に無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit`にフォールバックし、両方未設定なら有効デフォルトは`0`です。無効にするには`0`を設定します。
- `replyToMode`: `off`、`first`、または`all`。
- `markdown`: 送信Matrixテキスト用の任意のMarkdownレンダリング設定。
- `streaming`: `off`（デフォルト）、`partial`、`quiet`、`true`、または`false`。`partial`と`true`は、通常のMatrixテキストメッセージによるプレビュー先行の下書き更新を有効にします。`quiet`は、セルフホストpush-rule構成向けの通知しないプレビュー通知を使います。
- `blockStreaming`: `true`は、下書きプレビュー ストリーミングがアクティブな間、完了済みassistantブロックごとの個別進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または`always`。
- `threadBindings`: スレッドバインドされたセッションルーティングとライフサイクルのチャネルごとのoverride。
- `startupVerification`: 起動時の自動自己検証要求モード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 自動起動時検証要求の再試行までのクールダウン。
- `textChunkLimit`: 送信メッセージのchunkサイズ。
- `chunkMode`: `length`または`newline`。
- `responsePrefix`: 送信返信用の任意のメッセージ接頭辞。
- `ackReaction`: このチャネル/アカウント用の任意のackリアクションoverride。
- `ackReactionScope`: 任意のackリアクションスコープoverride（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: Matrixメディア処理用のメディアサイズ上限（MB）。送信と受信メディア処理の両方に適用されます。
- `autoJoin`: 招待の自動参加ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。これはルーム/グループ招待だけでなく、DM形式の招待を含む一般的なMatrix招待に適用されます。OpenClawは、参加したルームをDMかグループか確実に分類できる前の招待時点でこの判定を行います。
- `autoJoinAllowlist`: `autoJoin`が`allowlist`のときに許可されるルーム/エイリアス。エイリアス項目は招待処理中にルームIDへ解決されます。OpenClawは招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DMポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClawがルームに参加し、それをDMとして分類した後のDMアクセスを制御します。招待が自動参加されるかどうかは変えません。
- `dm.allowFrom`エントリは、ライブディレクトリ検索で解決済みでない限り、完全なMatrix user IDである必要があります。
- `dm.sessionScope`: `per-user`（デフォルト）または`per-room`。相手が同じでも各Matrix DMルームで別々のコンテキストを保持したい場合は`per-room`を使用します。
- `dm.threadReplies`: DM専用のスレッドポリシーoverride（`off`、`inbound`、`always`）。DMでの返信配置とセッション分離の両方について、トップレベルの`threadReplies`設定をoverrideします。
- `execApprovals`: Matrixネイティブのexec approval配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec requestsを承認できるMatrix user IDs。`dm.allowFrom`がすでに承認者を識別している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウントごとのoverride。トップレベルの`channels.matrix`値がこれらのエントリのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップ。ルームIDまたはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。セッション/グループIDは解決後の安定したルームIDを使用し、人間向けラベルは引き続きルーム名から取得します。
- `groups.<room>.account`: 複数アカウント構成で、継承された1つのルームエントリを特定のMatrixアカウントに限定します。
- `groups.<room>.allowBots`: 設定済みbot送信者に対するルームレベルoverride（`true`または`"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者allowlist。
- `groups.<room>.tools`: ルームごとのtool許可/拒否override。
- `groups.<room>.autoReply`: ルームレベルのメンション制御override。`true`はそのルームのメンション要件を無効にし、`false`は再び有効にします。
- `groups.<room>.skills`: 任意のルームレベルskillフィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベルsystem promptスニペット。
- `rooms`: `groups`のレガシーエイリアス。
- `actions`: アクションごとのtool制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とpairingフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
