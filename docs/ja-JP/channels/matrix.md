---
read_when:
    - OpenClaw での Matrix のセットアップ
    - Matrix の E2EE と検証の設定
summary: Matrix のサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix は OpenClaw にバンドルされたチャンネル Plugin です。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## バンドル済み Plugin

Matrix は現在の OpenClaw リリースではバンドル済み Plugin として提供されるため、通常のパッケージ版ビルドでは別途インストールは不要です。

古いビルドまたは Matrix を含まないカスタムインストールを使用している場合は、手動でインストールしてください。

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
   - 現在のパッケージ版 OpenClaw リリースにはすでにバンドルされています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. homeserver 上で Matrix アカウントを作成します。
3. `channels.matrix` を次のいずれかで設定します。
   - `homeserver` + `accessToken`、または
   - `homeserver` + `userId` + `password`
4. Gateway を再起動します。
5. ボットと DM を開始するか、ルームに招待します。
   - 新しい Matrix 招待は、`channels.matrix.autoJoin` がそれを許可している場合にのみ機能します。

対話型セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix ウィザードで求められる内容:

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- ユーザー ID（パスワード認証のみ）
- 任意のデバイス名
- E2EE を有効にするかどうか
- ルームアクセスと招待 auto-join を設定するかどうか

ウィザードの主な動作:

- Matrix 認証用の環境変数がすでに存在し、そのアカウントに対する認証情報がまだ config に保存されていない場合、ウィザードは認証情報を環境変数に保持するための env ショートカットを提示します。
- アカウント名はアカウント ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM の allowlist エントリには `@user:server` を直接使用できます。表示名が機能するのは、ライブディレクトリ検索で一致が 1 件だけ見つかった場合のみです。
- ルームの allowlist エントリには、ルーム ID とエイリアスを直接使用できます。`!room:server` または `#alias:server` を推奨します。未解決の名前は、allowlist 解決時に実行時に無視されます。
- 招待 auto-join の allowlist モードでは、安定した招待ターゲットのみを使用してください: `!roomId:server`、`#alias:server`、または `*`。単純なルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使用します。

<Warning>
`channels.matrix.autoJoin` のデフォルトは `off` です。

これを未設定のままにすると、ボットは招待されたルームや新しい DM スタイルの招待に参加しないため、手動で先に参加しない限り、新しいグループや招待 DM に表示されません。

受け入れる招待を制限したい場合は、`autoJoin: "allowlist"` と `autoJoinAllowlist` を組み合わせて設定してください。すべての招待に参加させたい場合は、`autoJoin: "always"` を設定してください。

`allowlist` モードでは、`autoJoinAllowlist` は `!roomId:server`、`#alias:server`、または `*` のみを受け付けます。
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
デフォルトアカウントでは `credentials.json`、名前付きアカウントでは `credentials-<account>.json` を使用します。
そこにキャッシュされた認証情報が存在する場合、現在の認証が config に直接設定されていなくても、OpenClaw はセットアップ、doctor、および channel-status 検出において Matrix が設定済みであるとみなします。

対応する環境変数（config キーが設定されていない場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付き環境変数を使用します。

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウント ID `ops-bot` では、次を使用します。

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix は、スコープ付き環境変数で衝突が起きないように、アカウント ID 内の句読点をエスケープします。
たとえば、`-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話型ウィザードが env-var ショートカットを提示するのは、それらの認証用環境変数がすでに存在し、選択したアカウントに対する Matrix 認証情報が config にまだ保存されていない場合のみです。

`MATRIX_HOMESERVER` はワークスペースの `.env` から設定できません。詳細は [Workspace `.env` files](/ja-JP/gateway/security) を参照してください。

## 設定例

これは、DM pairing、ルーム allowlist、E2EE 有効化を含む実用的なベースライン設定です。

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

`autoJoin` は、DM スタイルの招待を含むすべての Matrix 招待に適用されます。OpenClaw は、招待時点で招待されたルームが DM かグループかを確実に分類できないため、すべての招待は最初に `autoJoin` を通過します。`dm.policy` は、ボットが参加し、そのルームが DM と分類された後に適用されます。

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

OpenClaw に 1 つのライブプレビュー返信を送信させ、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定したい場合は、`channels.matrix.streaming` を `"partial"` に設定します。

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
- `streaming: "partial"` は、通常の Matrix テキストメッセージを使用して、現在のアシスタントブロック用に編集可能なプレビューメッセージを 1 つ作成します。これにより Matrix の従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成したブロックではなく、最初のストリーミングプレビューテキストで通知される場合があります。
- `streaming: "quiet"` は、現在のアシスタントブロック用に編集可能な静かなプレビュー通知を 1 つ作成します。これは、確定したプレビュー編集に対する受信者側の push ルールも設定している場合にのみ使用してください。
- `blockStreaming: true` は、別個の Matrix 進捗メッセージを有効にします。プレビュー ストリーミングが有効な場合、Matrix は現在のブロックのライブドラフトを維持し、完了したブロックを別メッセージとして保持します。
- プレビュー ストリーミングが有効で `blockStreaming` がオフの場合、Matrix はライブドラフトをその場で編集し、ブロックまたはターンの完了時にその同じイベントを確定します。
- プレビューが 1 つの Matrix イベントに収まらなくなった場合、OpenClaw はプレビュー ストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信では、引き続き通常どおり添付ファイルが送信されます。古いプレビューを安全に再利用できない場合、OpenClaw は最終的なメディア返信を送る前にそれを redact します。
- プレビュー編集には追加の Matrix API 呼び出しコストがかかります。最も保守的なレート制限動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming` 自体ではドラフトプレビューは有効になりません。
プレビュー編集には `streaming: "partial"` または `streaming: "quiet"` を使用し、完了したアシスタントブロックも別個の進捗メッセージとして見えるようにしたい場合にのみ `blockStreaming: true` を追加してください。

カスタム push ルールなしで標準 Matrix 通知が必要な場合は、プレビュー先行動作には `streaming: "partial"` を使用するか、最終配信のみにするには `streaming` をオフのままにしてください。`streaming: "off"` の場合:

- `blockStreaming: true` は、各完了ブロックを通常の通知付き Matrix メッセージとして送信します。
- `blockStreaming: false` は、最終的な完成返信のみを通常の通知付き Matrix メッセージとして送信します。

### セルフホスト push ルールによる静かな確定プレビュー

静かなストリーミング（`streaming: "quiet"`）は、ブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとの push ルールで確定済みプレビューマーカーに一致させる必要があります。完全なセットアップ（受信者トークン、pusher 確認、ルールインストール、homeserver ごとの注意点）については、[Matrix push rules for quiet previews](/ja-JP/channels/matrix-push-rules) を参照してください。

## Bot 間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

エージェント間の Matrix トラフィックを意図的に許可したい場合は、`allowBots` を使用します。

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

- `allowBots: true` は、許可されたルームおよび DM において、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内でその bot がこの bot を明示的にメンションした場合にのみ、そのメッセージを受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームについてアカウントレベル設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix user ID からのメッセージは引き続き無視します。
- Matrix にはここでのネイティブな bot フラグがないため、OpenClaw は「bot によって作成された」を「この OpenClaw Gateway 上の別の設定済み Matrix アカウントから送信された」とみなします。

共有ルームで bot 間トラフィックを有効にする場合は、厳格なルーム allowlist とメンション必須設定を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューも完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続き通常の `thumbnail_url` を使用します。設定は不要で、Plugin が E2EE 状態を自動検出します。

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

検証コマンド（すべて `--verbose` で診断、`--json` で機械可読出力を追加可能）:

```bash
openclaw matrix verify status
```

詳細ステータス（完全な診断情報）:

```bash
openclaw matrix verify status --verbose
```

保存済みの recovery key を機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロス署名と検証状態を bootstrap:

```bash
openclaw matrix verify bootstrap
```

詳細な bootstrap 診断情報:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap 前に新しいクロス署名 ID のリセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery key でこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

このコマンドは 3 つの状態を個別に報告します。

- `Recovery key accepted`: Matrix が secret storage またはデバイス信頼のために recovery key を受け入れた
- `Backup usable`: 信頼された recovery マテリアルでルームキーのバックアップを読み込める
- `Device verified by owner`: 現在の OpenClaw デバイスが完全な Matrix クロス署名 ID 信頼を持っている

詳細表示または JSON 出力の `Signed by owner` は診断専用です。OpenClaw は、`Cross-signing verified` も `yes` でない限り、これだけでは十分とみなしません。

recovery key でバックアップマテリアルをアンロックできる場合でも、完全な Matrix ID 信頼が未完了であれば、このコマンドは引き続き非ゼロで終了します。その場合は、別の Matrix クライアントから自己検証を完了してください:

```bash
openclaw matrix verify self
```

別の Matrix クライアントでリクエストを承認し、SAS の絵文字または数字を比較して、一致した場合にのみ `yes` と入力してください。このコマンドは、Matrix が `Cross-signing verified: yes` を報告するまで待機し、その後正常終了します。

`verify bootstrap --force-reset-cross-signing` は、現在のクロス署名 ID を意図的に置き換えたい場合にのみ使用してください。

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキー バックアップの状態を確認:

```bash
openclaw matrix verify backup status
```

詳細なバックアップ状態診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーバックアップからルームキーを復元:

```bash
openclaw matrix verify backup restore
```

バックアップキーがまだディスク上に読み込まれていない場合は、Matrix recovery key を渡します:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

対話型の自己検証フロー:

```bash
openclaw matrix verify self
```

より低レベルの、または受信した検証リクエストには、次を使用します。

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

リクエストをキャンセルするには `openclaw matrix verify cancel <id>` を使用します。

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーバックアップを削除し、新しいバックアップベースラインを作成します。保存済みのバックアップキーを正常に読み込めない場合、このリセットによって secret storage を再作成し、将来のコールドスタートで新しいバックアップキーを読み込めるようにすることもできます。

```bash
openclaw matrix verify backup reset --yes
```

すべての `verify` コマンドは、デフォルトでは簡潔です（内部 SDK ログも静かに抑制されます）。詳細な診断は `--verbose` を付けた場合のみ表示されます。
スクリプトで使用する場合は、完全な機械可読出力のために `--json` を使ってください。

複数アカウント構成では、`--account <id>` を指定しない限り、Matrix CLI コマンドは暗黙の Matrix デフォルトアカウントを使用します。
複数の名前付きアカウントを設定している場合は、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、それらの暗黙的な CLI 操作は停止し、明示的にアカウントを選ぶよう求められます。
検証やデバイス操作の対象を名前付きアカウントに明示的にしたい場合は、常に `--account` を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効、または名前付きアカウントで利用できない場合、Matrix の警告と検証エラーは、そのアカウントの config キーを指します。たとえば `channels.matrix.accounts.assistant.encryption` のようになります。

<AccordionGroup>
  <Accordion title="verified の意味">
    OpenClaw は、自分自身のクロス署名 ID がそのデバイスに署名した場合にのみ、そのデバイスを verified とみなします。`verify status --verbose` は 3 つの信頼シグナルを表示します。

    - `Locally trusted`: このクライアントでのみ信頼されている
    - `Cross-signing verified`: SDK がクロス署名による検証を報告している
    - `Signed by owner`: 自分自身の self-signing key によって署名されている

    `Verified by owner` が `yes` になるのは、クロス署名による検証が存在する場合のみです。
    ローカル信頼や owner 署名だけでは、OpenClaw はそのデバイスを完全に verified とはみなしません。

  </Accordion>

  <Accordion title="bootstrap が行うこと">
    `verify bootstrap` は、暗号化されたアカウント用の修復およびセットアップコマンドです。順に次を実行します。

    - 可能であれば既存の recovery key を再利用して secret storage を bootstrap
    - クロス署名を bootstrap し、不足している公開クロス署名キーをアップロード
    - 現在のデバイスをマークしてクロス署名
    - サーバー側のルームキー バックアップがまだ存在しない場合は作成

    homeserver がクロス署名キーのアップロードに UIA を要求する場合、OpenClaw はまず認証なしを試し、次に `m.login.dummy`、その次に `m.login.password`（`channels.matrix.password` が必要）を試します。`--force-reset-cross-signing` は、現在の ID を意図的に破棄する場合にのみ使用してください。

  </Accordion>

  <Accordion title="新しいバックアップベースライン">
    将来の暗号化メッセージを引き続き機能させつつ、復元不能な古い履歴を失うことを受け入れる場合:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    名前付きアカウントを対象にするには `--account <id>` を追加してください。現在のバックアップ secret を安全に読み込めない場合、これによって secret storage を再作成することもできます。
    古い recovery key で新しいバックアップベースラインを解除できないようにしたい場合にのみ、`--rotate-recovery-key` を追加してください。

  </Accordion>

  <Accordion title="起動時の動作">
    `encryption: true` の場合、`startupVerification` のデフォルトは `"if-unverified"` です。起動時に、未検証のデバイスは別の Matrix クライアントで自己検証を要求し、重複を避けてクールダウンを適用します。`startupVerificationCooldownHours` で調整するか、`startupVerification: "off"` で無効化できます。

    起動時には、現在の secret storage とクロス署名 ID を再利用する保守的な crypto bootstrap パスも実行されます。bootstrap 状態が壊れている場合、OpenClaw は `channels.matrix.password` がなくても保護付き修復を試みます。homeserver がパスワード UIA を要求する場合、起動時に警告が記録され、致命的エラーにはなりません。すでに owner 署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix migration](/ja-JP/install/migrating-matrix) を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrix は、厳格な DM 検証ルームに検証ライフサイクル通知を `m.notice` メッセージとして投稿します: リクエスト、ready（「絵文字で検証」の案内付き）、開始/完了、および利用可能な場合は SAS（絵文字/数字）の詳細です。

    別の Matrix クライアントからの受信リクエストは追跡され、自動承認されます。自己検証では、OpenClaw は SAS フローを自動的に開始し、絵文字検証が利用可能になると自分側を自動確認します。ただし、Matrix クライアント側で比較し、「一致する」を確認する必要はあります。

    検証システム通知はエージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="削除された、または無効な Matrix デバイス">
    `verify status` が現在のデバイスが homeserver 上にもう存在しないことを示す場合は、新しい OpenClaw Matrix デバイスを作成してください。パスワードログインの場合:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    トークン認証の場合は、Matrix クライアントまたは管理 UI で新しい access token を作成し、その後 OpenClaw を更新してください。

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    `assistant` は失敗したコマンドのアカウント ID に置き換えてください。デフォルトアカウントの場合は `--account` を省略します。

  </Accordion>

  <Accordion title="デバイス管理">
    OpenClaw 管理下の古いデバイスは蓄積することがあります。一覧表示と整理:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto ストア">
    Matrix E2EE は、IndexedDB shim として `fake-indexeddb` を使う公式の `matrix-js-sdk` Rust crypto パスを使用します。crypto 状態は `crypto-idb-snapshot.json` に永続化されます（厳しいファイル権限）。

    暗号化ランタイム状態は `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` 配下に保存され、sync ストア、crypto ストア、recovery key、IDB スナップショット、スレッドバインディング、起動時検証状態を含みます。トークンが変わってもアカウント ID が同じであれば、OpenClaw は利用可能な最適な既存ルートを再利用するため、以前の状態を引き続き参照できます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントの Matrix self-profile を更新するには、次を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付き Matrix アカウントを明示的に対象にしたい場合は、`--account <id>` を追加してください。

Matrix は `mxc://` の avatar URL を直接受け付けます。`http://` または `https://` の avatar URL を渡した場合、OpenClaw はまずそれを Matrix にアップロードし、解決された `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウントの上書き設定）に保存します。

## スレッド

Matrix は、自動返信と message-tool 送信の両方でネイティブ Matrix スレッドをサポートします。

- `dm.sessionScope: "per-user"`（デフォルト）は Matrix DM ルーティングを送信者スコープのまま維持するため、同じ相手に解決される複数の DM ルームで 1 つのセッションを共有できます。
- `dm.sessionScope: "per-room"` は、通常の DM 認証と allowlist チェックを使用しつつ、各 Matrix DM ルームを独自のセッションキーに分離します。
- 明示的な Matrix 会話バインディングは `dm.sessionScope` より優先されるため、バインド済みルームやスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"` は返信をトップレベルのままにし、受信したスレッドメッセージも親セッション上に維持します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にあった場合にのみスレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーメッセージをルートとするスレッド内に維持し、その会話を最初のトリガーメッセージから対応するスレッドスコープのセッションにルーティングします。
- `dm.threadReplies` は DM に対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保つことができます。
- 受信したスレッドメッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- message-tool 送信は、明示的な `threadId` が指定されていない限り、対象が同じルーム、または同じ DM ユーザー対象であれば、現在の Matrix スレッドを自動継承します。
- 同一セッションの DM ユーザー対象再利用は、現在のセッションメタデータが同じ Matrix アカウント上の同じ DM 相手を示している場合にのみ有効になります。それ以外では、OpenClaw は通常のユーザースコープ ルーティングにフォールバックします。
- OpenClaw が、同じ共有 Matrix DM セッション上である Matrix DM ルームが別の DM ルームと衝突していることを検出した場合、thread bindings が有効で `dm.sessionScope` ヒントがあると、そのルームに `/focus` エスケープハッチ付きの一度限りの `m.notice` を投稿します。
- Matrix ではランタイム スレッドバインディングがサポートされています。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた `/acp spawn` は Matrix のルームと DM で動作します。
- `threadBindings.spawnSubagentSessions=true` の場合、トップレベルの Matrix ルーム/DM での `/focus` は新しい Matrix スレッドを作成し、それを対象セッションにバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行すると、代わりにその現在のスレッドがバインドされます。

## ACP 会話バインディング

Matrix ルーム、DM、既存の Matrix スレッドは、チャット画面を変えずに永続的な ACP ワークスペースに変換できます。

高速なオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッドの中で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM/ルームがそのままチャット画面となり、以後のメッセージは生成された ACP セッションにルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じて、バインディングを削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` が必要なのは `/acp spawn --thread auto|here` の場合のみで、このとき OpenClaw は子 Matrix スレッドを作成またはバインドする必要があります。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャンネルごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッドバインドされた spawn フラグはオプトインです。

- トップレベルの `/focus` で新しい Matrix スレッドを作成・バインドできるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` で ACP セッションを Matrix スレッドにバインドできるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix は、送信リアクションアクション、受信リアクション通知、および受信 ack リアクションをサポートします。

- 送信リアクション機能は `channels["matrix"].actions.reactions` で制御されます。
- `react` は特定の Matrix イベントにリアクションを追加します。
- `reactions` は特定の Matrix イベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、そのイベントに対する bot アカウント自身のリアクションを削除します。
- `remove: true` は、bot アカウントの指定した絵文字リアクションのみを削除します。

ack リアクションは、標準の OpenClaw 解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック

ack リアクションのスコープは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"` は、bot が作成した Matrix メッセージを対象とする追加済み `m.reaction` イベントを転送します。
- `reactionNotifications: "off"` はリアクションのシステムイベントを無効化します。
- リアクション削除は、Matrix ではそれが独立した `m.reaction` 削除ではなく redaction として扱われるため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の有効デフォルトは `0` です。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を引き続き使用します。
- Matrix ルーム履歴は pending-only です。OpenClaw は、まだ返信をトリガーしていないルームメッセージをバッファし、その後メンションやその他のトリガーが来た時点でそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` に含まれません。そのターンのメインの受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへずれていくのではなく、元の履歴スナップショットを再利用します。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、pending 履歴などの補足ルームコンテキストに対して、共通の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、アクティブなルーム/ユーザー allowlist チェックで許可された送信者に補足コンテキストを絞り込みます。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様に動作しますが、1 件の明示的な引用返信は保持します。

この設定は補足コンテキストの可視性に影響するものであり、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。
トリガーの認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、および DM ポリシー設定から決まります。

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

未承認の Matrix ユーザーが承認前にメッセージを送り続けた場合、OpenClaw は同じ保留中の pairing コードを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再度リマインダー返信を送ることがあります。

共通の DM pairing フローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing) を参照してください。

## ダイレクトルーム修復

ダイレクトメッセージ状態が同期ずれを起こすと、OpenClaw がライブ DM ではなく古い 1 対 1 ルームを指す古い `m.direct` マッピングを持ってしまうことがあります。相手に対する現在のマッピングを確認するには、次を使用します。

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- すでに `m.direct` にマッピングされている厳密な 1 対 1 DM を優先
- そのユーザーとの現在参加中の厳密な 1 対 1 DM にフォールバック
- 健全な DM が存在しない場合は、新しいダイレクトルームを作成して `m.direct` を書き換え

修復フローは古いルームを自動削除しません。健全な DM を選択し、マッピングを更新するだけなので、新しい Matrix 送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## exec 承認

Matrix は、Matrix アカウント用のネイティブ承認クライアントとして機能できます。ネイティブの
DM/チャンネル ルーティング設定は、引き続き exec 承認設定の下にあります。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix user ID である必要があります。`enabled` が未設定または `"auto"` で、かつ少なくとも 1 人の承認者を解決できる場合、Matrix はネイティブ承認を自動有効化します。exec 承認はまず `execApprovals.approvers` を使用し、`channels.matrix.dm.allowFrom` にフォールバックできます。Plugin 承認は `channels.matrix.dm.allowFrom` を通じて認可されます。Matrix をネイティブ承認クライアントとして明示的に無効化するには `enabled: false` を設定してください。それ以外の場合、承認リクエストは他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrix のネイティブルーティングは両方の承認種別をサポートします。

- `channels.matrix.execApprovals.*` は、Matrix 承認プロンプトのネイティブ DM/チャンネル配信モードを制御します。
- exec 承認は `execApprovals.approvers` または `channels.matrix.dm.allowFrom` から exec 承認者セットを使用します。
- Plugin 承認は `channels.matrix.dm.allowFrom` の Matrix DM allowlist を使用します。
- Matrix のリアクション ショートカットとメッセージ更新は、exec 承認と Plugin 承認の両方に適用されます。

配信ルール:

- `target: "dm"` は承認プロンプトを承認者の DM に送信します
- `target: "channel"` はプロンプトを元の Matrix ルームまたは DM に送り返します
- `target: "both"` は承認プロンプトを承認者の DM と元の Matrix ルームまたは DM の両方に送信します

Matrix 承認プロンプトは、主要な承認メッセージにリアクション ショートカットを設定します。

- `✅` = 1 回だけ許可
- `❌` = 拒否
- `♾️` = 有効な exec ポリシーでその決定が許可されている場合は常に許可

承認者は、そのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` を使用できます。

承認または拒否できるのは、解決済みの承認者だけです。exec 承認では、チャンネル配信にコマンドテキストが含まれるため、`channel` または `both` を有効にするのは信頼できるルームのみにしてください。

アカウントごとの上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrix スラッシュコマンド（たとえば `/new`、`/reset`、`/model`）は DM で直接動作します。ルームでは、OpenClaw は bot 自身への Matrix メンションが前置されたスラッシュコマンドも認識するため、`@bot:server /new` はカスタムメンション正規表現なしでコマンドパスをトリガーします。これにより、ユーザーがコマンド入力前に bot をタブ補完したときに Element などのクライアントが出力する、ルーム形式の `@mention /command` 投稿にも bot が応答できます。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同様に DM またはルームの allowlist/owner ポリシーを満たす必要があります。

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
継承されたルームエントリは `groups.<room>.account` で 1 つの Matrix アカウントにスコープできます。
`account` を持たないエントリはすべての Matrix アカウント間で共有され、`account: "default"` を持つエントリは、デフォルトアカウントがトップレベルの `channels.matrix.*` に直接設定されている場合でも引き続き機能します。
部分的な共有認証デフォルトだけでは、それ自体で別個の暗黙的デフォルトアカウントは作成されません。OpenClaw がトップレベルの `default` アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または `homeserver` + `userId` と `password`）がある場合のみです。名前付きアカウントは、後でキャッシュされた認証情報が認証を満たす場合、`homeserver` + `userId` だけでも引き続き検出可能なままです。
Matrix にすでに名前付きアカウントがちょうど 1 つある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復/セットアップ昇格では、新しい `accounts.default` エントリを作成するのではなく、そのアカウントが保持されます。昇格先アカウントへ移動されるのは Matrix の認証/bootstrap キーのみで、共有配信ポリシーキーはトップレベルに残ります。
暗黙的なルーティング、プローブ、CLI 操作で 1 つの名前付き Matrix アカウントを優先させたい場合は、`defaultAccount` を設定してください。
複数の Matrix アカウントが設定されていて、そのうち 1 つのアカウント ID が `default` の場合、`defaultAccount` が未設定でも OpenClaw はそのアカウントを暗黙的に使用します。
複数の名前付きアカウントを設定する場合は、暗黙的なアカウント選択に依存する CLI コマンドのために `defaultAccount` を設定するか、`--account <id>` を渡してください。
1 つのコマンドだけその暗黙的選択を上書きしたい場合は、`openclaw matrix verify ...` と `openclaw matrix devices ...` に `--account <id>` を渡してください。

共通のマルチアカウント パターンについては、[Configuration reference](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClaw は SSRF 保護のため、アカウントごとに
明示的にオプトインしない限り、プライベート/内部 Matrix homeserver をブロックします。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名上で動作している場合は、
その Matrix アカウントで `network.dangerouslyAllowPrivateNetwork` を有効にしてください。

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

このオプトインは、信頼できるプライベート/内部ターゲットのみを許可します。`http://matrix.example.org:8008` のような
パブリックな平文 homeserver は引き続きブロックされます。可能な限り `https://` を使用してください。

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
OpenClaw は、この同じプロキシ設定をランタイムの Matrix トラフィックとアカウント状態プローブの両方に使用します。

## ターゲット解決

OpenClaw がルームまたはユーザーターゲットを要求するあらゆる場面で、Matrix は次のターゲット形式を受け付けます。

- ユーザー: `@user:server`、`user:@user:server`、または `matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または `matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または `matrix:channel:#alias:server`

Matrix ルーム ID は大文字小文字を区別します。明示的な配信ターゲット、Cron ジョブ、バインディング、allowlist を設定するときは、
Matrix 上の正確なルーム ID の大文字小文字を使用してください。
OpenClaw は保存用に内部セッションキーを正規化して保持するため、それらの小文字キーは
Matrix 配信 ID の信頼できる情報源ではありません。

ライブディレクトリ検索は、ログイン中の Matrix アカウントを使用します。

- ユーザー検索は、その homeserver 上の Matrix ユーザーディレクトリを照会します。
- ルーム検索は、明示的なルーム ID とエイリアスを直接受け付け、その後そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加中ルーム名の検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、実行時の allowlist 解決では無視されます。

## 設定リファレンス

- `enabled`: チャンネルを有効または無効にします。
- `name`: アカウントの任意ラベルです。
- `defaultAccount`: 複数の Matrix アカウントが設定されている場合の優先アカウント ID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: この Matrix アカウントがプライベート/内部 homeserver に接続できるようにします。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。名前付きアカウントは独自の `proxy` でトップレベルのデフォルトを上書きできます。
- `userId`: 完全な Matrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用の access token。プレーンテキスト値と SecretRef 値は、env/file/exec プロバイダーをまたいで `channels.matrix.accessToken` および `channels.matrix.accounts.<id>.accessToken` でサポートされます。[Secrets Management](/ja-JP/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用のパスワード。プレーンテキスト値と SecretRef 値がサポートされます。
- `deviceId`: 明示的な Matrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロファイル同期および `profile set` 更新用に保存される self-avatar URL。
- `initialSyncLimit`: 起動時 sync 中に取得するイベントの最大数。
- `encryption`: E2EE を有効にします。
- `allowlistOnly`: `true` の場合、`open` ルームポリシーを `allowlist` に昇格し、`disabled` 以外のすべてのアクティブな DM ポリシー（`pairing` と `open` を含む）を `allowlist` に強制します。`disabled` ポリシーには影響しません。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。完全一致するディレクトリエントリは、起動時およびモニター実行中に allowlist が変更されたときに解決されます。未解決の名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数。`messages.groupChat.historyLimit` にフォールバックし、両方とも未設定の場合の有効デフォルトは `0` です。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、`all`、または `batched`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または `false`。`"partial"` と `true` は、通常の Matrix テキストメッセージによるプレビュー先行のドラフト更新を有効にします。`"quiet"` は、セルフホスト push-rule 構成向けに通知しないプレビュー notice を使用します。`false` は `"off"` と同等です。
- `blockStreaming`: `true` にすると、ドラフトプレビュー ストリーミングが有効な間、完了したアシスタントブロック用の個別の進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドにバインドされたセッションルーティングとライフサイクルに対するチャンネルごとの上書きです。
- `startupVerification`: 起動時の自動自己検証リクエストモード（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証リクエストを再試行するまでのクールダウン。
- `textChunkLimit`: 文字単位での送信メッセージチャンクサイズ（`chunkMode` が `length` の場合に適用）。
- `chunkMode`: `length` は文字数でメッセージを分割し、`newline` は行境界で分割します。
- `responsePrefix`: このチャンネルのすべての送信返信の先頭に付加する任意の文字列。
- `ackReaction`: このチャンネル/アカウント用の任意の ack リアクション上書きです。
- `ackReactionScope`: 任意の ack リアクションスコープ上書き（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理用の MB 単位のメディアサイズ上限。
- `autoJoin`: 招待 auto-join ポリシー（`always`、`allowlist`、`off`）。デフォルト: `off`。DM スタイルの招待を含むすべての Matrix 招待に適用されます。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` の場合に許可されるルーム/エイリアス。エイリアスエントリは招待処理中にルーム ID に解決されます。OpenClaw は招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DM ポリシーブロック（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClaw がルームに参加し、それを DM と分類した後の DM アクセスを制御します。招待が auto-join されるかどうかは変更しません。
- `dm.allowFrom`: DM トラフィック用の user ID allowlist。完全な Matrix user ID が最も安全です。完全一致するディレクトリエントリは、起動時およびモニター実行中に allowlist が変更されたときに解決されます。未解決の名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または `per-room`。相手が同じでも各 Matrix DM ルームを別々のコンテキストにしたい場合は `per-room` を使用します。
- `dm.threadReplies`: DM 専用のスレッドポリシー上書き（`off`、`inbound`、`always`）。これは、返信配置と DM でのセッション分離の両方について、トップレベルの `threadReplies` 設定を上書きします。
- `execApprovals`: Matrix ネイティブ exec 承認配信（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: exec リクエストを承認できる Matrix user ID。`dm.allowFrom` がすでに承認者を識別している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きのアカウントごとの上書き。トップレベルの `channels.matrix` 値は、これらのエントリのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップ。ルーム ID またはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。セッション/グループ ID は、解決後の安定したルーム ID を使用します。
- `groups.<room>.account`: マルチアカウント構成で、1 つの継承ルームエントリを特定の Matrix アカウントに限定します。
- `groups.<room>.allowBots`: 設定済み bot 送信者に対するルームレベル上書き（`true` または `"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者 allowlist。
- `groups.<room>.tools`: ルームごとのツール許可/拒否上書き。
- `groups.<room>.autoReply`: ルームレベルのメンション制御上書き。`true` はそのルームのメンション必須を無効化し、`false` は再び有効化します。
- `groups.<room>.skills`: 任意のルームレベル Skill フィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペット。
- `rooms`: `groups` のレガシーエイリアス。
- `actions`: アクションごとのツール制御（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャンネル
- [Pairing](/ja-JP/channels/pairing) — DM 認証と pairing フロー
- [Groups](/ja-JP/channels/groups) — グループチャット動作とメンション制御
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
