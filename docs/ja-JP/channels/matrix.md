---
read_when:
    - OpenClawでMatrixをセットアップすること
    - MatrixのE2EEと検証を設定すること
summary: Matrixのサポート状況、セットアップ、および設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-25T13:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e764c837f34131f20d1e912c059ffdce61421227a44b7f91faa624a6f878ed2
    source_path: channels/matrix.md
    workflow: 15
---

MatrixはOpenClawにバンドルされたchannel pluginです。  
公式の`matrix-js-sdk`を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EEをサポートしています。

## バンドルされたplugin

Matrixは現在のOpenClawリリースではバンドルされたpluginとして提供されるため、通常のパッケージ済みビルドでは別途インストールは不要です。

古いビルドまたはMatrixを除外したカスタムインストールを使用している場合は、手動でインストールしてください。

npmからインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

pluginの動作とインストールルールについては、[Plugins](/ja-JP/tools/plugin)を参照してください。

## セットアップ

1. Matrix pluginが利用可能であることを確認します。
   - 現在のパッケージ版OpenClawリリースには、すでに同梱されています。
   - 古い/カスタムインストールでは、上記のコマンドで手動追加できます。
2. 自分のhomeserverでMatrixアカウントを作成します。
3. `channels.matrix`を次のいずれかで設定します。
   - `homeserver` + `accessToken`
   - `homeserver` + `userId` + `password`
4. Gatewayを再起動します。
5. botとのDMを開始するか、ルームに招待します。
   - 新しいMatrix招待が機能するのは、`channels.matrix.autoJoin`で許可されている場合のみです。

対話型セットアップのパス:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrixのウィザードで尋ねられる内容:

- homeserver URL
- 認証方法: access tokenまたはpassword
- ユーザーID（password認証のみ）
- 任意のデバイス名
- E2EEを有効にするかどうか
- ルームアクセスと招待の自動参加を設定するかどうか

ウィザードの主な動作:

- Matrix認証用env varがすでに存在し、そのアカウントの認証がまだconfigに保存されていない場合、ウィザードは認証をenv varに保持するためのenvショートカットを提案します。
- アカウント名はアカウントIDに正規化されます。たとえば、`Ops Bot`は`ops-bot`になります。
- DMのallowlistエントリは`@user:server`を直接受け付けます。表示名が機能するのは、ライブディレクトリ参照で正確に1件一致した場合のみです。
- ルームのallowlistエントリはルームIDとエイリアスを直接受け付けます。`!room:server`または`#alias:server`を推奨します。未解決の名前は、allowlist解決時に実行時に無視されます。
- 招待自動参加のallowlistモードでは、安定した招待対象のみを使用してください: `!roomId:server`、`#alias:server`、または`*`。単なるルーム名は拒否されます。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"`を使用します。

<Warning>
`channels.matrix.autoJoin`のデフォルトは`off`です。

未設定のままにすると、botは招待されたルームや新しいDM形式の招待に参加しないため、手動で先に参加しない限り、新しいグループや招待DMには現れません。

受け付ける招待を制限したい場合は、`autoJoin: "allowlist"`を`autoJoinAllowlist`と一緒に設定するか、すべての招待に参加させたい場合は`autoJoin: "always"`を設定してください。

`allowlist`モードでは、`autoJoinAllowlist`は`!roomId:server`、`#alias:server`、または`*`のみを受け付けます。
</Warning>

allowlistの例:

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

すべての招待に参加する:

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

passwordベースの設定（ログイン後にtokenがキャッシュされます）:

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
デフォルトアカウントは`credentials.json`を使用し、名前付きアカウントは`credentials-<account>.json`を使用します。  
そこにキャッシュ済み認証情報が存在する場合、現在の認証がconfigに直接設定されていなくても、OpenClawはセットアップ、doctor、channel-status検出においてMatrixが設定済みであると見なします。

環境変数の同等項目（configキーが未設定の場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウント単位のenv varを使用します:

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

Matrixは、アカウントID内の句読点をエスケープして、スコープ付きenv varの衝突を防ぎます。  
たとえば、`-`は`_X2D_`になるため、`ops-prod`は`MATRIX_OPS_X2D_PROD_*`に対応します。

対話型ウィザードがenv-varショートカットを提案するのは、それらの認証env varがすでに存在し、選択されたアカウントにMatrix認証がまだconfigへ保存されていない場合のみです。

`MATRIX_HOMESERVER`はワークスペースの`.env`からは設定できません。[Workspace `.env` files](/ja-JP/gateway/security)を参照してください。

## 設定例

これは、DMペアリング、ルームallowlist、E2EE有効化を含む実用的なベースライン設定です:

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

`autoJoin`はDM形式の招待を含むすべてのMatrix招待に適用されます。OpenClawは、招待時点で招待されたルームがDMかグループかを確実に分類できないため、すべての招待は最初に`autoJoin`を通過します。`dm.policy`は、botが参加し、そのルームがDMとして分類された後に適用されます。

## ストリーミングプレビュー

Matrixの返信ストリーミングはオプトインです。

OpenClawに単一のライブプレビュー返信を送信させ、モデルがテキストを生成している間はそのプレビューをその場で編集し、返信完了時に確定させたい場合は、`channels.matrix.streaming`を`"partial"`に設定します:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"`がデフォルトです。OpenClawは最終返信を待ってから1回だけ送信します。
- `streaming: "partial"`は、現在のassistantブロック用に、通常のMatrixテキストメッセージとして編集可能なプレビューメッセージを1つ作成します。これにより、Matrixの従来の「プレビュー先行」通知動作が維持されるため、標準クライアントでは完成済みブロックではなく最初のストリーミングプレビューテキストで通知されることがあります。
- `streaming: "quiet"`は、現在のassistantブロック用に編集可能な静かなプレビュー通知を1つ作成します。これは、確定済みプレビュー編集用の受信者プッシュルールも設定している場合にのみ使用してください。
- `blockStreaming: true`は、個別のMatrix進捗メッセージを有効にします。プレビューのストリーミングを有効にすると、Matrixは現在のブロックのライブドラフトを保持し、完了したブロックは別メッセージとして保持します。
- プレビューのストリーミングがオンで`blockStreaming`がオフの場合、Matrixはライブドラフトをその場で編集し、ブロックまたはターンの完了時にその同じイベントを確定します。
- プレビューが1つのMatrixイベントに収まらなくなった場合、OpenClawはプレビューのストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は引き続き通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClawは最終的なメディア返信を送る前にそれをリダクトします。
- プレビュー編集には追加のMatrix API呼び出しコストがかかります。最も保守的なレート制限動作を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming`自体ではドラフトプレビューは有効になりません。  
プレビュー編集には`streaming: "partial"`または`streaming: "quiet"`を使用し、完了済みassistantブロックも別個の進捗メッセージとして表示したい場合にのみ`blockStreaming: true`を追加してください。

カスタムプッシュルールなしで標準のMatrix通知が必要な場合は、プレビュー先行動作には`streaming: "partial"`を使うか、最終のみの配信には`streaming`をオフのままにしてください。`streaming: "off"`の場合:

- `blockStreaming: true`は、完成した各ブロックを通常の通知付きMatrixメッセージとして送信します。
- `blockStreaming: false`は、最終的に完成した返信のみを通常の通知付きMatrixメッセージとして送信します。

### 静かな確定済みプレビューのためのセルフホスト型プッシュルール

静かなストリーミング（`streaming: "quiet"`）は、ブロックまたはターンが確定したときにのみ受信者へ通知します。ユーザーごとのプッシュルールが、確定済みプレビューマーカーに一致している必要があります。完全なセットアップ（受信者token、pusher確認、ルールインストール、homeserverごとの注意点）については、[Matrix push rules for quiet previews](/ja-JP/channels/matrix-push-rules)を参照してください。

## Bot-to-botルーム

デフォルトでは、他の設定済みOpenClaw MatrixアカウントからのMatrixメッセージは無視されます。

エージェント間のMatrixトラフィックを意図的に有効にしたい場合は、`allowBots`を使用します:

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

- `allowBots: true`は、許可されたルームとDMで、他の設定済みMatrix botアカウントからのメッセージを受け付けます。
- `allowBots: "mentions"`は、ルーム内でそのbotがこのbotに明示的にメンションした場合にのみ、そのメッセージを受け付けます。DMは引き続き許可されます。
- `groups.<room>.allowBots`は、1つのルームに対してアカウントレベル設定を上書きします。
- OpenClawは、自己返信ループを避けるため、同じMatrix user IDからのメッセージは引き続き無視します。
- Matrixはここでネイティブなbotフラグを公開していません。OpenClawは「botが作成した」を「このOpenClaw Gateway上の別の設定済みMatrixアカウントから送信された」と見なします。

共有ルームでbot-to-botトラフィックを有効にする場合は、厳格なルームallowlistとメンション要件を使用してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは`thumbnail_file`を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは、引き続き通常の`thumbnail_url`を使用します。設定は不要です。pluginがE2EE状態を自動的に検出します。

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

検証コマンド（すべて`--verbose`で診断、`--json`で機械可読出力に対応）:

```bash
openclaw matrix verify status
```

詳細なステータス（完全な診断）:

```bash
openclaw matrix verify status --verbose
```

保存された回復キーを機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロスサイニングと検証状態をブートストラップする:

```bash
openclaw matrix verify bootstrap
```

詳細なブートストラップ診断:

```bash
openclaw matrix verify bootstrap --verbose
```

ブートストラップ前に新しいクロスサイニングIDリセットを強制する:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

回復キーでこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

このコマンドは3つの状態を個別に報告します:

- `Recovery key accepted`: Matrixがシークレットストレージまたはデバイス信頼のために回復キーを受け入れました。
- `Backup usable`: 信頼できる回復情報でルームキーのバックアップを読み込めます。
- `Device verified by owner`: 現在のOpenClawデバイスが完全なMatrixクロスサイニングID信頼を持っています。

詳細出力またはJSON出力の`Signed by owner`は診断用情報にすぎません。OpenClawは、`Cross-signing verified`も`yes`でない限り、それだけでは十分と見なしません。

回復キーでバックアップ情報を解除できる場合でも、完全なMatrix ID信頼が未完了であれば、このコマンドは引き続き非ゼロで終了します。その場合は、別のMatrixクライアントからセルフ検証を完了してください:

```bash
openclaw matrix verify self
```

別のMatrixクライアントでリクエストを受け入れ、SASの絵文字または10進数を比較し、一致した場合にのみ`yes`と入力してください。このコマンドは、Matrixが`Cross-signing verified: yes`を報告するまで待機してから正常終了します。

`verify bootstrap --force-reset-cross-signing`は、現在のクロスサイニングIDを意図的に置き換えたい場合にのみ使用してください。

詳細なデバイス検証情報:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキーバックアップの健全性を確認する:

```bash
openclaw matrix verify backup status
```

詳細なバックアップ健全性診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーバックアップからルームキーを復元する:

```bash
openclaw matrix verify backup restore
```

対話型のセルフ検証フロー:

```bash
openclaw matrix verify self
```

より低レベルの検証リクエストまたは受信した検証リクエストには、次を使用します:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

リクエストをキャンセルするには`openclaw matrix verify cancel <id>`を使用します。

詳細な復元診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーバックアップを削除し、新しいバックアップベースラインを作成します。保存されたバックアップキーを正常に読み込めない場合、このリセットによってシークレットストレージも再作成され、今後のコールドスタートで新しいバックアップキーを読み込めるようになります。

```bash
openclaw matrix verify backup reset --yes
```

すべての`verify`コマンドはデフォルトで簡潔です（内部SDKの静かなロギングも含む）。詳細な診断は`--verbose`を付けた場合にのみ表示されます。  
スクリプトで使用する場合は、完全な機械可読出力のために`--json`を使用してください。

複数アカウント構成では、`--account <id>`を渡さない限り、Matrix CLIコマンドは暗黙のMatrixデフォルトアカウントを使用します。  
複数の名前付きアカウントを設定している場合は、まず`channels.matrix.defaultAccount`を設定してください。そうしないと、それらの暗黙的なCLI操作は停止し、明示的にアカウントを選択するよう求めます。  
検証やデバイス操作の対象を名前付きアカウントに明示的にしたい場合は、常に`--account`を使用してください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

暗号化が無効になっている、または名前付きアカウントで利用できない場合、Matrixの警告および検証エラーは、そのアカウントのconfigキーを指します。たとえば`channels.matrix.accounts.assistant.encryption`です。

<AccordionGroup>
  <Accordion title="verifiedの意味">
    OpenClawは、あなた自身のクロスサイニングIDがそのデバイスに署名した場合にのみ、そのデバイスをverifiedとして扱います。`verify status --verbose`は3つの信頼シグナルを表示します。

    - `Locally trusted`: このクライアントでのみ信頼されている
    - `Cross-signing verified`: SDKがクロスサイニングによる検証を報告している
    - `Signed by owner`: あなた自身のself-signingキーで署名されている

    `Verified by owner`が`yes`になるのは、クロスサイニング検証が存在する場合のみです。  
    ローカル信頼やowner署名だけでは、OpenClawはそのデバイスを完全にverifiedとは見なしません。

  </Accordion>

  <Accordion title="bootstrapが行うこと">
    `verify bootstrap`は、暗号化アカウント向けの修復およびセットアップコマンドです。順に次を行います。

    - 可能であれば既存の回復キーを再利用して、シークレットストレージをブートストラップする
    - クロスサイニングをブートストラップし、不足している公開クロスサイニングキーをアップロードする
    - 現在のデバイスをマークし、クロスサインする
    - サーバー側のルームキーバックアップがまだ存在しない場合は作成する

    homeserverがクロスサイニングキーのアップロードにUIAを要求する場合、OpenClawはまず認証なしを試し、その後`m.login.dummy`、次に`m.login.password`を試します（`channels.matrix.password`が必要です）。`--force-reset-cross-signing`は、現在のIDを意図的に破棄する場合にのみ使用してください。

  </Accordion>

  <Accordion title="新しいバックアップベースライン">
    将来の暗号化メッセージを引き続き動作させたい一方で、復元不可能な古い履歴を失うことを受け入れる場合:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    名前付きアカウントを対象にするには`--account <id>`を追加してください。現在のバックアップシークレットを安全に読み込めない場合、これによってシークレットストレージも再作成されることがあります。

  </Accordion>

  <Accordion title="起動時の動作">
    `encryption: true`の場合、`startupVerification`のデフォルトは`"if-unverified"`です。起動時に、未検証のデバイスは別のMatrixクライアントでのセルフ検証を要求し、重複をスキップしてクールダウンを適用します。`startupVerificationCooldownHours`で調整するか、`startupVerification: "off"`で無効化してください。

    起動時には、現在のシークレットストレージとクロスサイニングIDを再利用する保守的なcryptoブートストラップ処理も実行されます。ブートストラップ状態が壊れている場合、OpenClawは`channels.matrix.password`がなくてもガード付きの修復を試みます。homeserverがpassword UIAを要求する場合、起動時に警告をログ出力し、致命的にはなりません。すでにowner署名済みのデバイスは保持されます。

    完全なアップグレードフローについては、[Matrix migration](/ja-JP/install/migrating-matrix)を参照してください。

  </Accordion>

  <Accordion title="検証通知">
    Matrixは、厳格なDM検証ルームに`m.notice`メッセージとして検証ライフサイクル通知を投稿します: リクエスト、ready（「絵文字で検証」ガイダンス付き）、開始/完了、利用可能な場合はSAS（絵文字/10進数）詳細です。

    別のMatrixクライアントからの受信リクエストは追跡され、自動受諾されます。セルフ検証では、OpenClawはSASフローを自動的に開始し、絵文字検証が利用可能になった時点で自分側を確認します。あなたは引き続きMatrixクライアントで比較し、「一致する」を確認する必要があります。

    検証システム通知は、エージェントのチャットパイプラインには転送されません。

  </Accordion>

  <Accordion title="デバイス衛生">
    OpenClaw管理の古いデバイスが蓄積することがあります。一覧表示して整理します:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EEは、IndexedDB shimとして`fake-indexeddb`を使う公式の`matrix-js-sdk` Rust cryptoパスを使用します。crypto状態は`crypto-idb-snapshot.json`に永続化されます（制限的なファイル権限）。

    暗号化された実行時状態は`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`配下に保存され、sync store、crypto store、回復キー、IDBスナップショット、スレッドバインディング、起動時検証状態が含まれます。tokenが変わってもアカウントIDが同じであれば、OpenClawは既存の最適なルートを再利用するため、以前の状態は引き続き参照できます。

  </Accordion>
</AccordionGroup>

## プロファイル管理

選択したアカウントのMatrixセルフプロファイルを更新するには、次を使用します:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

名前付きMatrixアカウントを明示的に対象にしたい場合は、`--account <id>`を追加してください。

Matrixは`mxc://`のアバターURLをそのまま受け付けます。`http://`または`https://`のアバターURLを渡した場合、OpenClawは最初にそれをMatrixへアップロードし、解決された`mxc://` URLを`channels.matrix.avatarUrl`（または選択したアカウントの上書き設定）に保存し直します。

## スレッド

Matrixは、自動返信とmessage-tool送信の両方でネイティブなMatrixスレッドをサポートしています。

- `dm.sessionScope: "per-user"`（デフォルト）は、Matrix DMルーティングを送信者スコープのまま維持するため、同じ相手に解決される複数のDMルームで1つのセッションを共有できます。
- `dm.sessionScope: "per-room"`は、通常のDM認証およびallowlistチェックを引き続き使用しつつ、各Matrix DMルームを独自のセッションキーに分離します。
- 明示的なMatrix会話バインディングは引き続き`dm.sessionScope`より優先されるため、バインド済みルームやスレッドは選択された対象セッションを維持します。
- `threadReplies: "off"`は、返信をトップレベルのままにし、受信したスレッド付きメッセージも親セッション上に維持します。
- `threadReplies: "inbound"`は、受信メッセージがすでにそのスレッド内にあった場合にのみ、そのスレッド内で返信します。
- `threadReplies: "always"`は、トリガーとなったメッセージをルートとするスレッド内にルーム返信を維持し、その会話を最初のトリガーメッセージに対応するスレッドスコープのセッションでルーティングします。
- `dm.threadReplies`は、DMに対してのみトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DMはフラットに保つことができます。
- 受信したスレッド付きメッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- message-tool送信は、明示的な`threadId`が指定されていない限り、対象が同じルーム、または同じDMユーザー対象であれば、現在のMatrixスレッドを自動継承します。
- 同一セッションのDMユーザー対象の再利用が有効になるのは、現在のセッションメタデータが同じMatrixアカウント上の同じDM相手であることを証明している場合のみです。そうでない場合、OpenClawは通常のユーザースコープルーティングにフォールバックします。
- OpenClawが、同じ共有Matrix DMセッション上であるMatrix DMルームが別のDMルームと衝突していることを検知すると、thread bindingsが有効で`dm.sessionScope`ヒントがある場合、そのルームに一度だけ`/focus`エスケープハッチ付きの`m.notice`を投稿します。
- 実行時スレッドバインディングはMatrixでサポートされています。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドバインドされた`/acp spawn`は、MatrixルームとDMで動作します。
- `threadBindings.spawnSubagentSessions=true`の場合、トップレベルのMatrixルーム/DMでの`/focus`は新しいMatrixスレッドを作成し、それを対象セッションにバインドします。
- 既存のMatrixスレッド内で`/focus`または`/acp spawn --thread here`を実行すると、代わりにその現在のスレッドがバインドされます。

## ACP会話バインディング

Matrixルーム、DM、既存のMatrixスレッドは、チャット表面を変えることなく永続的なACPワークスペースにできます。

高速なオペレーターフロー:

- 使い続けたいMatrix DM、ルーム、または既存スレッド内で`/acp spawn codex --bind here`を実行します。
- トップレベルのMatrix DMまたはルームでは、現在のDM/ルームがチャット表面のまま維持され、以後のメッセージは生成されたACPセッションへルーティングされます。
- 既存のMatrixスレッド内では、`--bind here`はその現在のスレッドをその場でバインドします。
- `/new`および`/reset`は、同じバインド済みACPセッションをその場でリセットします。
- `/acp close`はACPセッションを閉じ、バインディングを削除します。

注意:

- `--bind here`は子Matrixスレッドを作成しません。
- `threadBindings.spawnAcpSessions`が必要なのは、OpenClawが子Matrixスレッドを作成またはバインドする必要がある`/acp spawn --thread auto|here`の場合のみです。

### スレッドバインディング設定

Matrixは`session.threadBindings`からグローバルデフォルトを継承し、チャネルごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrixのスレッドバインドspawnフラグはオプトインです。

- トップレベルの`/focus`で新しいMatrixスレッドを作成してバインドできるようにするには、`threadBindings.spawnSubagentSessions: true`を設定します。
- `/acp spawn --thread auto|here`でACPセッションをMatrixスレッドにバインドできるようにするには、`threadBindings.spawnAcpSessions: true`を設定します。

## リアクション

Matrixは、送信リアクションアクション、受信リアクション通知、受信ackリアクションをサポートしています。

- 送信リアクションツールは`channels["matrix"].actions.reactions`で制御されます。
- `react`は特定のMatrixイベントにリアクションを追加します。
- `reactions`は特定のMatrixイベントの現在のリアクション要約を一覧表示します。
- `emoji=""`は、そのイベント上のbotアカウント自身のリアクションを削除します。
- `remove: true`は、botアカウントの指定された絵文字リアクションのみを削除します。

ackリアクションは、標準のOpenClaw解決順序を使用します。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- エージェントIDの絵文字フォールバック

ackリアクションスコープは、次の順に解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは、次の順に解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

動作:

- `reactionNotifications: "own"`は、botが作成したMatrixメッセージを対象とする追加済み`m.reaction`イベントを転送します。
- `reactionNotifications: "off"`は、リアクションのシステムイベントを無効にします。
- リアクション削除は、Matrixでは独立した`m.reaction`削除としてではなくredactionとして扱われるため、システムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit`は、Matrixルームメッセージがエージェントをトリガーしたときに`InboundHistory`として含まれる最近のルームメッセージ数を制御します。`messages.groupChat.historyLimit`にフォールバックし、両方未設定の場合の実効デフォルトは`0`です。無効にするには`0`を設定してください。
- Matrixルーム履歴はルーム専用です。DMは通常のセッション履歴を引き続き使用します。
- Matrixルーム履歴はpending-onlyです。OpenClawは、まだ返信をトリガーしていないルームメッセージをバッファし、メンションや他のトリガーが到着したときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは`InboundHistory`に含まれません。そのターンのメインの受信本文に残ります。
- 同じMatrixイベントの再試行では、新しいルームメッセージへ前進してずれるのではなく、元の履歴スナップショットを再利用します。

## コンテキストの可視性

Matrixは、取得した返信テキスト、スレッドルート、保留中履歴などの補足ルームコンテキストに対して、共有の`contextVisibility`制御をサポートしています。

- `contextVisibility: "all"`がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"`は、補足コンテキストを、現在有効なルーム/ユーザーallowlistチェックで許可された送信者に絞り込みます。
- `contextVisibility: "allowlist_quote"`は`allowlist`と同様に動作しますが、明示的に引用された返信1件は保持します。

この設定は、補足コンテキストの可視性に影響するものであり、受信メッセージ自体が返信をトリガーできるかどうかには影響しません。  
トリガー認可は引き続き`groupPolicy`、`groups`、`groupAllowFrom`、およびDMポリシー設定から決まります。

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

メンションゲーティングとallowlistの動作については、[Groups](/ja-JP/channels/groups)を参照してください。

Matrix DMのペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認のMatrixユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClawは同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後に再びリマインダー返信を送ることがあります。

共有のDMペアリングフローと保存レイアウトについては、[Pairing](/ja-JP/channels/pairing)を参照してください。

## 直接ルーム修復

ダイレクトメッセージ状態の同期が崩れると、OpenClawは、ライブDMではなく古い1対1ルームを指す古い`m.direct`マッピングを持つことがあります。相手の現在のマッピングを確認するには、次を使用します:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復フロー:

- すでに`m.direct`にマッピングされている厳密な1:1 DMを優先します
- それがなければ、そのユーザーとの現在参加中の任意の厳密な1:1 DMにフォールバックします
- 正常なDMが存在しない場合は、新しいダイレクトルームを作成し、`m.direct`を書き換えます

修復フローは古いルームを自動削除しません。正常なDMを選択し、マッピングを更新するだけなので、新しいMatrix送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようになります。

## Exec approvals

Matrixは、Matrixアカウントのネイティブ承認クライアントとして機能できます。ネイティブのDM/channelルーティングノブは引き続きexec approval設定配下にあります:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom`にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は`@owner:example.org`のようなMatrix user IDでなければなりません。`enabled`が未設定または`"auto"`で、少なくとも1人の承認者を解決できる場合、Matrixはネイティブ承認を自動有効化します。Exec approvalsは最初に`execApprovals.approvers`を使用し、`channels.matrix.dm.allowFrom`にフォールバックできます。Plugin approvalsは`channels.matrix.dm.allowFrom`を通じて認可されます。Matrixをネイティブ承認クライアントとして明示的に無効化するには、`enabled: false`を設定してください。そうでない場合、承認リクエストは他の設定済み承認ルートまたは承認フォールバックポリシーにフォールバックします。

Matrixのネイティブルーティングは、両方の承認種別をサポートします:

- `channels.matrix.execApprovals.*`は、Matrix承認プロンプトのネイティブDM/channelファンアウトモードを制御します。
- Exec approvalsは、`execApprovals.approvers`または`channels.matrix.dm.allowFrom`のexec承認者セットを使用します。
- Plugin approvalsは、`channels.matrix.dm.allowFrom`のMatrix DM allowlistを使用します。
- Matrixのリアクションショートカットとメッセージ更新は、exec approvalsとplugin approvalsの両方に適用されます。

配信ルール:

- `target: "dm"`は、承認プロンプトを承認者のDMに送信します
- `target: "channel"`は、プロンプトを元のMatrixルームまたはDMに送り返します
- `target: "both"`は、承認者のDMと元のMatrixルームまたはDMの両方に送信します

Matrix承認プロンプトは、主要な承認メッセージにリアクションショートカットを初期設定します:

- `✅` = 1回だけ許可
- `❌` = 拒否
- `♾️` = 実効execポリシーでその判断が許可されている場合は常に許可

承認者はそのメッセージにリアクションするか、フォールバックのスラッシュコマンド `/approve <id> allow-once`、`/approve <id> allow-always`、または`/approve <id> deny` を使用できます。

承認または拒否できるのは、解決済み承認者のみです。exec approvalsでは、channel配信にコマンドテキストが含まれるため、`channel`または`both`は信頼できるルームでのみ有効にしてください。

アカウントごとの上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/ja-JP/tools/exec-approvals)

## スラッシュコマンド

Matrixのスラッシュコマンド（たとえば`/new`、`/reset`、`/model`）はDMで直接動作します。ルームでは、OpenClawはbot自身のMatrixメンションを前置したスラッシュコマンドも認識するため、`@bot:server /new`はカスタムのメンション正規表現を必要とせずにコマンドパスをトリガーします。これにより、Elementや類似クライアントで、ユーザーがコマンドを入力する前にbotをタブ補完したときに出るルーム形式の`@mention /command`投稿にもbotが応答できるようになります。

認可ルールは引き続き適用されます。コマンド送信者は、通常メッセージと同様にDMまたはルームのallowlist/ownerポリシーを満たしている必要があります。

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

トップレベルの`channels.matrix`値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。  
継承されたルームエントリは、`groups.<room>.account`で1つのMatrixアカウントにスコープ指定できます。  
`account`を持たないエントリはすべてのMatrixアカウント間で共有されたままで、`account: "default"`を持つエントリは、デフォルトアカウントがトップレベルの`channels.matrix.*`で直接設定されている場合でも引き続き機能します。  
共有認証デフォルトが部分的に存在するだけでは、それ自体で別個の暗黙的デフォルトアカウントは作成されません。OpenClawがトップレベルの`default`アカウントを合成するのは、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または`homeserver` + `userId` + `password`）がある場合のみです。名前付きアカウントは、後でキャッシュ済み認証情報で認証が満たされる場合、`homeserver` + `userId`だけでも引き続き検出可能にできます。  
Matrixにすでにちょうど1つの名前付きアカウントがある場合、または`defaultAccount`が既存の名前付きアカウントキーを指している場合、単一アカウントから複数アカウントへの修復/セットアップ昇格では、新しい`accounts.default`エントリを作成せずにそのアカウントを保持します。昇格したアカウントへ移動するのはMatrixの認証/ブートストラップキーのみで、共有配信ポリシーキーはトップレベルに残ります。  
暗黙のルーティング、プローブ、CLI操作でOpenClawに1つの名前付きMatrixアカウントを優先させたい場合は、`defaultAccount`を設定してください。  
複数のMatrixアカウントが設定され、そのうち1つのアカウントIDが`default`である場合、`defaultAccount`が未設定でもOpenClawはそのアカウントを暗黙的に使用します。  
複数の名前付きアカウントを設定する場合は、`defaultAccount`を設定するか、暗黙のアカウント選択に依存するCLIコマンドで`--account <id>`を渡してください。  
1つのコマンドでその暗黙選択を上書きしたい場合は、`openclaw matrix verify ...`および`openclaw matrix devices ...`に`--account <id>`を渡してください。

共有の複数アカウントパターンについては、[Configuration reference](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## プライベート/LAN homeserver

デフォルトでは、OpenClawはSSRF保護のため、アカウントごとに明示的にオプトインしない限り、プライベート/内部のMatrix homeserverをブロックします。

homeserverがlocalhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、そのMatrixアカウントに対して`network.dangerouslyAllowPrivateNetwork`を有効にしてください:

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

このオプトインは、信頼されたプライベート/内部ターゲットのみを許可します。`http://matrix.example.org:8008`のような公開平文homeserverは引き続きブロックされます。可能な限り`https://`を推奨します。

## Matrixトラフィックのプロキシ

Matrixデプロイメントで明示的な送信HTTP(S)プロキシが必要な場合は、`channels.matrix.proxy`を設定します:

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

名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy`でトップレベルのデフォルトを上書きできます。OpenClawは、実行時のMatrixトラフィックとアカウント状態プローブの両方で同じプロキシ設定を使用します。

## ターゲット解決

OpenClawがルームまたはユーザーターゲットを求めるあらゆる場所で、Matrixは次のターゲット形式を受け付けます:

- ユーザー: `@user:server`、`user:@user:server`、または`matrix:user:@user:server`
- ルーム: `!room:server`、`room:!room:server`、または`matrix:room:!room:server`
- エイリアス: `#alias:server`、`channel:#alias:server`、または`matrix:channel:#alias:server`

ライブディレクトリ参照では、ログイン済みのMatrixアカウントを使用します:

- ユーザー参照は、そのhomeserver上のMatrixユーザーディレクトリを問い合わせます。
- ルーム参照は、明示的なルームIDとエイリアスを直接受け付け、その後そのアカウントの参加済みルーム名検索にフォールバックします。
- 参加済みルーム名の参照はベストエフォートです。ルーム名をIDまたはエイリアスに解決できない場合、実行時のallowlist解決では無視されます。

## 設定リファレンス

- `enabled`: channelを有効または無効にします。
- `name`: アカウントの任意ラベルです。
- `defaultAccount`: 複数のMatrixアカウントが設定されている場合に優先されるアカウントIDです。
- `homeserver`: homeserver URLです。例: `https://matrix.example.org`。
- `network.dangerouslyAllowPrivateNetwork`: このMatrixアカウントがプライベート/内部homeserverに接続できるようにします。homeserverが`localhost`、LAN/Tailscale IP、または`matrix-synapse`のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrixトラフィック用の任意のHTTP(S)プロキシURLです。名前付きアカウントは、自身の`proxy`でトップレベルのデフォルトを上書きできます。
- `userId`: 完全なMatrix user IDです。例: `@bot:example.org`。
- `accessToken`: tokenベース認証用のaccess tokenです。プレーンテキスト値とSecretRef値は、env/file/execプロバイダー全体で`channels.matrix.accessToken`および`channels.matrix.accounts.<id>.accessToken`に対応しています。[Secrets Management](/ja-JP/gateway/secrets)を参照してください。
- `password`: passwordベースログイン用のpasswordです。プレーンテキスト値とSecretRef値に対応しています。
- `deviceId`: 明示的なMatrix device IDです。
- `deviceName`: passwordログイン用のデバイス表示名です。
- `avatarUrl`: プロファイル同期および`profile set`更新用に保存されるself-avatar URLです。
- `initialSyncLimit`: 起動時sync中に取得するイベントの最大数です。
- `encryption`: E2EEを有効にします。
- `allowlistOnly`: `true`の場合、`open`ルームポリシーを`allowlist`に引き上げ、`disabled`以外のすべてのアクティブなDMポリシー（`pairing`および`open`を含む）を`allowlist`に強制します。`disabled`ポリシーには影響しません。
- `allowBots`: 他の設定済みOpenClaw Matrixアカウントからのメッセージを許可します（`true`または`"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または`disabled`です。
- `contextVisibility`: 補足ルームコンテキストの可視性モードです（`all`、`allowlist`、`allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用のuser ID allowlistです。完全なMatrix user IDが最も安全です。正確なディレクトリ一致は起動時と、モニター実行中にallowlistが変更されたときに解決されます。未解決の名前は無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージの最大数です。`messages.groupChat.historyLimit`にフォールバックし、両方未設定の場合の実効デフォルトは`0`です。無効にするには`0`を設定してください。
- `replyToMode`: `off`、`first`、`all`、または`batched`です。
- `markdown`: 送信Matrixテキスト用の任意のMarkdownレンダリング設定です。
- `streaming`: `off`（デフォルト）、`"partial"`、`"quiet"`、`true`、または`false`です。`"partial"`と`true`は、通常のMatrixテキストメッセージによるプレビュー先行のドラフト更新を有効にします。`"quiet"`は、セルフホスト型プッシュルール構成向けに通知しないプレビューnoticeを使用します。`false`は`"off"`と同等です。
- `blockStreaming`: `true`の場合、ドラフトプレビューのストリーミングが有効な間、完了したassistantブロックごとの個別進捗メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または`always`です。
- `threadBindings`: スレッドにバインドされたセッションルーティングとライフサイクルのチャネルごとの上書きです。
- `startupVerification`: 起動時の自動セルフ検証リクエストモードです（`if-unverified`、`off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証リクエストを再試行するまでのクールダウンです。
- `textChunkLimit`: 送信メッセージの文字数単位のチャンクサイズです（`chunkMode`が`length`の場合に適用）。
- `chunkMode`: `length`はメッセージを文字数で分割し、`newline`は行境界で分割します。
- `responsePrefix`: このchannelのすべての送信返信の先頭に付加される任意の文字列です。
- `ackReaction`: このchannel/アカウント用の任意のackリアクション上書きです。
- `ackReactionScope`: 任意のackリアクションスコープ上書きです（`group-mentions`、`group-all`、`direct`、`all`、`none`、`off`）。
- `reactionNotifications`: 受信リアクション通知モードです（`own`、`off`）。
- `mediaMaxMb`: 送信と受信メディア処理における、メディアサイズ上限（MB）です。
- `autoJoin`: 招待の自動参加ポリシーです（`always`、`allowlist`、`off`）。デフォルト: `off`。DM形式の招待を含むすべてのMatrix招待に適用されます。
- `autoJoinAllowlist`: `autoJoin`が`allowlist`のときに許可されるルーム/エイリアスです。エイリアス項目は招待処理中にルームIDへ解決されます。OpenClawは、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DMポリシーブロックです（`enabled`、`policy`、`allowFrom`、`sessionScope`、`threadReplies`）。
- `dm.policy`: OpenClawがルームに参加し、それがDMとして分類された後のDMアクセスを制御します。招待が自動参加されるかどうかは変更しません。
- `dm.allowFrom`: DMトラフィック用のuser ID allowlistです。完全なMatrix user IDが最も安全です。正確なディレクトリ一致は起動時と、モニター実行中にallowlistが変更されたときに解決されます。未解決の名前は無視されます。
- `dm.sessionScope`: `per-user`（デフォルト）または`per-room`です。同じ相手であっても各Matrix DMルームで別々のコンテキストを維持したい場合は`per-room`を使用します。
- `dm.threadReplies`: DM専用のスレッドポリシー上書きです（`off`、`inbound`、`always`）。DMにおける返信配置とセッション分離の両方について、トップレベルの`threadReplies`設定を上書きします。
- `execApprovals`: Matrixネイティブのexec approval配信です（`enabled`、`approvers`、`target`、`agentFilter`、`sessionFilter`）。
- `execApprovals.approvers`: execリクエストを承認できるMatrix user IDです。`dm.allowFrom`がすでに承認者を示している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）です。
- `accounts`: 名前付きのアカウントごとの上書きです。トップレベルの`channels.matrix`値がこれらの項目のデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップです。ルームIDまたはエイリアスを推奨します。未解決のルーム名は実行時に無視されます。セッション/グループIDは、解決後の安定したルームIDを使用します。
- `groups.<room>.account`: 複数アカウント構成で、継承された1つのルーム項目を特定のMatrixアカウントに限定します。
- `groups.<room>.allowBots`: 設定済みbot送信者用のルームレベル上書きです（`true`または`"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者allowlistです。
- `groups.<room>.tools`: ルームごとのツール許可/拒否上書きです。
- `groups.<room>.autoReply`: ルームレベルのメンションゲーティング上書きです。`true`はそのルームのメンション要件を無効にし、`false`は再び有効にします。
- `groups.<room>.skills`: 任意のルームレベルskillフィルターです。
- `groups.<room>.systemPrompt`: 任意のルームレベルsystem promptスニペットです。
- `rooms`: `groups`の従来エイリアスです。
- `actions`: アクションごとのツールゲーティングです（`messages`、`reactions`、`pins`、`profile`、`memberInfo`、`channelInfo`、`verification`）。

## 関連

- [Channels Overview](/ja-JP/channels) — すべての対応channel
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
