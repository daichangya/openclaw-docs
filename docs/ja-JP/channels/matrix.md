---
read_when:
    - OpenClaw で Matrix をセットアップするとき
    - Matrix の E2EE と検証を設定するとき
summary: Matrix のサポート状況、セットアップ、設定例
title: Matrix
x-i18n:
    generated_at: "2026-04-05T12:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba5c49ad2125d97adf66b5517f8409567eff8b86e20224a32fcb940a02cb0659
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix は OpenClaw 用の Matrix バンドル済みチャネルプラグインです。
公式の `matrix-js-sdk` を使用し、DM、ルーム、スレッド、メディア、リアクション、投票、位置情報、E2EE をサポートします。

## バンドル済みプラグイン

Matrix は現在の OpenClaw リリースではバンドル済みプラグインとして提供されるため、通常の
パッケージ済みビルドでは別途インストールは不要です。

古いビルド、または Matrix を含まないカスタムインストールを使用している場合は、手動で
インストールしてください。

npm からインストール:

```bash
openclaw plugins install @openclaw/matrix
```

ローカルチェックアウトからインストール:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

プラグインの動作とインストールルールについては [Plugins](/tools/plugin) を参照してください。

## セットアップ

1. Matrix プラグインが利用可能であることを確認します。
   - 現在のパッケージ済み OpenClaw リリースにはすでに同梱されています。
   - 古い / カスタムインストールでは、上記のコマンドで手動追加できます。
2. homeserver 上で Matrix アカウントを作成します。
3. `channels.matrix` を以下のいずれかで設定します。
   - `homeserver` + `accessToken`
   - `homeserver` + `userId` + `password`
4. Gateway を再起動します。
5. ボットとの DM を開始するか、ルームに招待します。

対話型セットアップ手順:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix ウィザードが実際に尋ねる内容:

- homeserver URL
- 認証方式: アクセストークンまたはパスワード
- パスワード認証を選んだ場合のみユーザー ID
- 任意のデバイス名
- E2EE を有効にするかどうか
- Matrix ルームアクセスを今すぐ設定するかどうか

重要なウィザードの挙動:

- 選択したアカウントに対応する Matrix 認証環境変数がすでに存在し、そのアカウントの認証情報がまだ config に保存されていない場合、ウィザードは環境変数ショートカットを提示し、そのアカウントには `enabled: true` だけを書き込みます。
- 別の Matrix アカウントを対話的に追加すると、入力したアカウント名は config と env vars で使われるアカウント ID に正規化されます。たとえば、`Ops Bot` は `ops-bot` になります。
- DM allowlist のプロンプトでは、完全な `@user:server` 値をそのまま受け付けます。表示名が使えるのは、ライブディレクトリ参照で 1 件だけ完全一致した場合のみです。それ以外では、完全な Matrix ID を使って再入力するようウィザードが求めます。
- ルーム allowlist のプロンプトでは、ルーム ID とエイリアスをそのまま受け付けます。また、参加済みルーム名をライブで解決することもできますが、解決できなかった名前はセットアップ中に入力された文字列のまま保持されるだけで、後でランタイムの allowlist 解決では無視されます。`!room:server` または `#alias:server` を推奨します。
- ランタイムのルーム / セッション識別には安定した Matrix ルーム ID を使います。ルームに定義されたエイリアスは参照入力としてのみ使われ、長期的なセッションキーや安定したグループ識別子としては使われません。
- 保存前にルーム名を解決するには、`openclaw channels resolve --channel matrix "Project Room"` を使ってください。

トークンベースの最小構成:

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

パスワードベースのセットアップ（ログイン後にトークンがキャッシュされます）:

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
デフォルトアカウントは `credentials.json` を使い、名前付きアカウントは `credentials-<account>.json` を使います。

対応する環境変数（config キーが設定されていない場合に使用）:

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

デフォルト以外のアカウントでは、アカウントスコープ付き環境変数を使います。

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

アカウント `ops` の例:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

正規化されたアカウント ID `ops-bot` では、以下を使います。

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix は、アカウント ID 内の記号をエスケープして、スコープ付き env vars の衝突を防ぎます。
たとえば `-` は `_X2D_` になるため、`ops-prod` は `MATRIX_OPS_X2D_PROD_*` に対応します。

対話型ウィザードは、それらの認証環境変数がすでに存在し、かつ選択されたアカウントに Matrix 認証がまだ config に保存されていない場合にのみ、env-var ショートカットを提示します。

## 設定例

これは DM ペアリング、ルーム allowlist、E2EE 有効化を含む実用的なベースライン設定です。

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

## ストリーミングプレビュー

Matrix の返信ストリーミングはオプトインです。

`channels.matrix.streaming` を `"partial"` に設定すると、OpenClaw は 1 つの下書き返信を送信し、
モデルがテキストを生成している間はその下書きをその場で編集し、返信が
完了したら最終化します。

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
- `streaming: "partial"` は、複数の部分メッセージを送る代わりに、現在の assistant ブロック用の編集可能なプレビューメッセージを 1 つ作成します。
- `blockStreaming: true` を指定すると、Matrix で別個の進行メッセージを有効にします。`streaming: "partial"` と組み合わせると、Matrix は現在のブロック用のライブ下書きを維持しつつ、完了済みブロックを別メッセージとして残します。
- `streaming: "partial"` かつ `blockStreaming` がオフの場合、Matrix はライブ下書きだけを編集し、そのブロックまたはターンが終了した時点で完了済み返信を 1 回送信します。
- プレビューが 1 つの Matrix イベントに収まらなくなった場合、OpenClaw はプレビューのストリーミングを停止し、通常の最終配信にフォールバックします。
- メディア返信は通常どおり添付ファイルを送信します。古いプレビューを安全に再利用できなくなった場合、OpenClaw は最終メディア返信を送る前にそれを redact します。
- プレビュー編集には追加の Matrix API 呼び出しが必要です。もっとも保守的なレート制限挙動を望む場合は、ストリーミングをオフのままにしてください。

`blockStreaming` だけでは下書きプレビューは有効になりません。
プレビュー編集には `streaming: "partial"` を使い、完了した assistant ブロックも別々の進行メッセージとして見せたい場合にのみ、さらに `blockStreaming: true` を追加してください。

## 暗号化と検証

暗号化された（E2EE）ルームでは、送信画像イベントは `thumbnail_file` を使用するため、画像プレビューは完全な添付ファイルと一緒に暗号化されます。暗号化されていないルームでは引き続き通常の `thumbnail_url` を使います。設定は不要です。プラグインが E2EE 状態を自動検出します。

### Bot 間ルーム

デフォルトでは、他の設定済み OpenClaw Matrix アカウントからの Matrix メッセージは無視されます。

エージェント間 Matrix トラフィックを意図的に許可したい場合は `allowBots` を使ってください。

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

- `allowBots: true` は、許可されたルームおよび DM 内で、他の設定済み Matrix bot アカウントからのメッセージを受け入れます。
- `allowBots: "mentions"` は、ルーム内ではそのようなメッセージがこの bot に明示的にメンションしている場合にのみ受け入れます。DM は引き続き許可されます。
- `groups.<room>.allowBots` は、1 つのルームに対してアカウントレベル設定を上書きします。
- OpenClaw は自己返信ループを避けるため、同じ Matrix user ID からのメッセージは引き続き無視します。
- Matrix にはここで使えるネイティブの bot フラグはありません。OpenClaw は「bot-authored」を「この OpenClaw Gateway 上の別の設定済み Matrix アカウントによって送信されたもの」として扱います。

共有ルームで bot 間トラフィックを有効にする場合は、厳格なルーム allowlist とメンション要件を使ってください。

暗号化を有効にするには:

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

保存済み recovery key を機械可読出力に含める:

```bash
openclaw matrix verify status --include-recovery-key --json
```

クロスサイニングと検証状態を bootstrap する:

```bash
openclaw matrix verify bootstrap
```

マルチアカウント対応: `channels.matrix.accounts` を使用し、アカウントごとの認証情報と任意の `name` を設定します。共通パターンについては [Configuration reference](/gateway/configuration-reference#multi-account-all-channels) を参照してください。

bootstrap の詳細診断:

```bash
openclaw matrix verify bootstrap --verbose
```

bootstrap 前に新しいクロスサイニング ID を強制的にリセットする:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

recovery key でこのデバイスを検証する:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

デバイス検証の詳細:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

ルームキーバックアップの健全性を確認:

```bash
openclaw matrix verify backup status
```

バックアップ健全性の詳細診断:

```bash
openclaw matrix verify backup status --verbose
```

サーバーバックアップからルームキーを復元:

```bash
openclaw matrix verify backup restore
```

復元の詳細診断:

```bash
openclaw matrix verify backup restore --verbose
```

現在のサーバーバックアップを削除し、新しいバックアップベースラインを作成します。保存済みの
バックアップキーを正常に読み込めない場合、このリセットは secret storage も再作成し、
将来のコールドスタートで新しいバックアップキーを読み込めるようにすることがあります。

```bash
openclaw matrix verify backup reset --yes
```

すべての `verify` コマンドはデフォルトで簡潔な出力です（内部 SDK ログも quiet を含む）であり、詳細診断は `--verbose` を付けた場合のみ表示されます。
スクリプトで使う場合は、完全な機械可読出力のために `--json` を使ってください。

マルチアカウント構成では、`--account <id>` を渡さない限り、Matrix CLI コマンドは暗黙の Matrix デフォルトアカウントを使います。
複数の名前付きアカウントを設定している場合、まず `channels.matrix.defaultAccount` を設定してください。そうしないと、そのような暗黙の CLI 操作は停止してアカウントを明示選択するよう求めます。
検証やデバイス操作を明示的に名前付きアカウントに向けたい場合は、`--account` を使ってください。

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

名前付きアカウントで暗号化が無効または利用不可の場合、Matrix の警告と検証エラーは、そのアカウントの config キー、たとえば `channels.matrix.accounts.assistant.encryption` を指します。

### 「verified」の意味

OpenClaw は、この Matrix デバイスが自分自身のクロスサイニング ID によって検証されている場合にのみ、verified として扱います。
実際には、`openclaw matrix verify status --verbose` は 3 つの信頼シグナルを表示します。

- `Locally trusted`: このデバイスは現在のクライアントでのみ信頼されています
- `Cross-signing verified`: SDK が、このデバイスがクロスサイニングによって検証されたと報告しています
- `Signed by owner`: このデバイスが自分自身の self-signing key によって署名されています

`Verified by owner` は、クロスサイニング検証または owner-signing がある場合にのみ `yes` になります。
ローカル信頼だけでは、OpenClaw はそのデバイスを完全に検証済みとは扱いません。

### bootstrap が行うこと

`openclaw matrix verify bootstrap` は、暗号化された Matrix アカウントの修復とセットアップを行うコマンドです。
以下を順番に実行します。

- 可能であれば既存の recovery key を再利用しながら secret storage を bootstrap
- クロスサイニングを bootstrap し、不足している公開クロスサイニングキーをアップロード
- 現在のデバイスにマークを付け、クロスサインすることを試行
- サーバー側のルームキーバックアップがまだ存在しない場合は新規作成

homeserver がクロスサイニングキーのアップロードに対話的認証を要求する場合、OpenClaw はまず認証なしでアップロードを試し、その後 `m.login.dummy`、さらに `channels.matrix.password` が設定されている場合は `m.login.password` を試します。

現在のクロスサイニング ID を破棄して新しく作り直したい場合にのみ、`--force-reset-cross-signing` を使ってください。

現在のルームキーバックアップを意図的に破棄し、今後のメッセージ向けに新しい
バックアップベースラインを開始したい場合は、`openclaw matrix verify backup reset --yes` を使ってください。
これは、復元不能な古い暗号化履歴が引き続き利用不可のままになることと、
現在のバックアップ secret を安全に読み込めない場合に OpenClaw が secret storage を再作成する可能性があることを受け入れる場合にのみ実行してください。

### 新しいバックアップベースライン

今後の暗号化メッセージを正常に保ちつつ、復元不能な古い履歴を失うことを受け入れる場合は、以下のコマンドを順に実行してください。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

特定の名前付き Matrix アカウントを明示的に対象にしたい場合は、各コマンドに `--account <id>` を追加してください。

### 起動時の挙動

`encryption: true` の場合、Matrix は `startupVerification` のデフォルトを `"if-unverified"` にします。
起動時、このデバイスがまだ未検証であれば、Matrix は別の Matrix クライアントで自己検証を要求し、
すでに保留中の要求がある間は重複要求をスキップし、再起動後の再試行前にローカルクールダウンを適用します。
要求作成に成功した場合よりも、要求試行の失敗のほうがデフォルトでは早く再試行されます。
起動時の自動要求を無効にするには `startupVerification: "off"` を設定するか、より短い / 長い再試行間隔が必要な場合は `startupVerificationCooldownHours`
を調整してください。

起動時には保守的な crypto bootstrap パスも自動実行されます。
このパスはまず現在の secret storage とクロスサイニング ID の再利用を試み、明示的な bootstrap 修復フローを実行しない限りクロスサイニングのリセットを避けます。

起動時に壊れた bootstrap 状態が見つかり、`channels.matrix.password` が設定されている場合、OpenClaw はより厳格な修復パスを試行できます。
現在のデバイスがすでに owner-signed であれば、OpenClaw はそれを自動リセットせず、その ID を保持します。

以前の公開 Matrix プラグインからのアップグレード:

- OpenClaw は、可能であれば同じ Matrix アカウント、アクセストークン、デバイス ID を自動で再利用します。
- 実行可能な Matrix 移行変更が走る前に、OpenClaw は `~/Backups/openclaw-migrations/` 配下に recovery snapshot を作成または再利用します。
- 複数の Matrix アカウントを使っている場合、古いフラットストア構成からアップグレードする前に `channels.matrix.defaultAccount` を設定してください。これにより、その共有されたレガシー状態をどのアカウントが受け取るべきか OpenClaw が判断できます。
- 以前のプラグインが Matrix のルームキーバックアップ復号キーをローカル保存していた場合、起動時または `openclaw doctor --fix` がそれを新しい recovery-key フローへ自動インポートします。
- 移行準備後に Matrix アクセストークンが変更された場合、起動時は自動バックアップ復元を諦める前に、保留中のレガシー復元状態を探すために兄弟のトークンハッシュ保存ルートをスキャンします。
- 同じアカウント、homeserver、ユーザーに対して後で Matrix アクセストークンが変わった場合、OpenClaw は空の Matrix 状態ディレクトリから始めるのではなく、もっとも完全な既存のトークンハッシュ保存ルートの再利用を優先します。
- 次回 Gateway 起動時に、バックアップされたルームキーが新しい crypto store へ自動復元されます。
- 古いプラグインにローカル専用で未バックアップのルームキーがあった場合、OpenClaw は明確に警告します。それらのキーは以前の rust crypto store から自動エクスポートできないため、一部の古い暗号化履歴は手動回復されるまで利用不可のままになる可能性があります。
- 完全なアップグレード手順、制限、回復コマンド、一般的な移行メッセージについては [Matrix migration](/install/migrating-matrix) を参照してください。

暗号化されたランタイム状態は、アカウントごと、ユーザーごと、トークンハッシュごとのルートとして
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`
配下に整理されます。
そのディレクトリには、sync store（`bot-storage.json`）、crypto store（`crypto/`）、
recovery key ファイル（`recovery-key.json`）、IndexedDB スナップショット（`crypto-idb-snapshot.json`）、
thread bindings（`thread-bindings.json`）、起動時検証状態（`startup-verification.json`）
が、それらの機能使用時に含まれます。
トークンが変わってもアカウント ID が同じであれば、OpenClaw はそのアカウント / homeserver / ユーザー組み合わせに対して最良の既存
ルートを再利用するため、以前の sync 状態、crypto 状態、thread bindings、
起動時検証状態はそのまま見える状態で保たれます。

### Node crypto store モデル

このプラグインの Matrix E2EE は、Node 上で公式 `matrix-js-sdk` の Rust crypto パスを使います。
このパスでは、crypto 状態を再起動後も保持したい場合、IndexedDB ベースの永続化が必要です。

OpenClaw は現在、Node 上でこれを以下の方法で提供しています。

- SDK が期待する IndexedDB API shim として `fake-indexeddb` を使用
- `initRustCrypto` の前に `crypto-idb-snapshot.json` から Rust crypto IndexedDB の内容を復元
- init 後およびランタイム中に、更新された IndexedDB 内容を `crypto-idb-snapshot.json` へ永続化
- Gateway ランタイムの永続化と CLI メンテナンスが同じスナップショットファイル上で競合しないよう、advisory file lock を使って `crypto-idb-snapshot.json` に対するスナップショット復元と永続化を直列化

これは互換性 / ストレージの配線であり、独自の crypto 実装ではありません。
このスナップショットファイルは機微なランタイム状態であり、制限的なファイル権限で保存されます。
OpenClaw のセキュリティモデルでは、Gateway ホストとローカル OpenClaw 状態ディレクトリはすでに信頼されたオペレーター境界の内側にあるため、これは主に別個のリモート信頼境界ではなく運用上の耐久性の問題です。

予定されている改善:

- 永続的な Matrix キーマテリアルに対する SecretRef サポートを追加し、recovery key や関連する store 暗号化シークレットを、ローカルファイルだけでなく OpenClaw シークレットプロバイダーから供給できるようにする

## プロフィール管理

選択したアカウントの Matrix 自己プロフィールを更新するには、以下を使用します。

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

明示的に名前付きアカウントを対象にしたい場合は `--account <id>` を追加してください。

Matrix は `mxc://` アバター URL を直接受け付けます。`http://` または `https://` のアバター URL を渡した場合、OpenClaw はまずそれを Matrix にアップロードし、解決済みの `mxc://` URL を `channels.matrix.avatarUrl`（または選択したアカウントの上書き設定）に保存します。

## 自動検証通知

Matrix は現在、検証ライフサイクル通知を厳格な DM 検証ルームへ `m.notice` メッセージとして直接投稿します。
これには以下が含まれます。

- 検証要求通知
- 検証準備完了通知（明示的な「絵文字で検証」ガイダンス付き）
- 検証開始および完了通知
- 利用可能な場合の SAS 詳細（絵文字と 10 進数）

別の Matrix クライアントからの受信検証要求は OpenClaw によって追跡され、自動承認されます。
自己検証フローでは、OpenClaw は絵文字検証が利用可能になると自動で SAS フローも開始し、自分側を確認します。
別の Matrix ユーザー / デバイスからの検証要求では、OpenClaw は要求を自動承認したうえで、SAS フローが通常どおり進むのを待ちます。
検証を完了するには、引き続き Matrix クライアント側で絵文字または 10 進 SAS を比較し、「一致する」を確認する必要があります。

OpenClaw は、自分で開始した重複フローを無条件に自動承認しません。起動時は、自己検証要求がすでに保留中であれば新規要求の作成をスキップします。

検証プロトコル / システム通知はエージェントチャットパイプラインには転送されないため、`NO_REPLY` は生成されません。

### デバイス衛生

OpenClaw が管理する古い Matrix デバイスがアカウントに蓄積し、暗号化ルームの信頼性が把握しにくくなることがあります。
一覧表示するには:

```bash
openclaw matrix devices list
```

古い OpenClaw 管理デバイスを削除するには:

```bash
openclaw matrix devices prune-stale
```

### ダイレクトルーム修復

ダイレクトメッセージ状態の同期が崩れると、OpenClaw に古い 1 対 1 ルームを指す古い `m.direct` マッピングが残り、ライブ DM を指さなくなることがあります。特定の peer に対する現在のマッピングを確認するには:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

修復するには:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

修復では Matrix 固有ロジックをプラグイン内に閉じ込めています。

- まず `m.direct` にすでにマッピングされている厳密な 1:1 DM を優先します
- それがなければ、そのユーザーとの現在参加中の厳密な 1:1 DM にフォールバックします
- 健全な DM が存在しなければ、新しいダイレクトルームを作成し、`m.direct` を書き換えてそこを指すようにします

修復フローは古いルームを自動削除しません。健全な DM を選択し、マッピングを更新して、新しい Matrix 送信、検証通知、その他のダイレクトメッセージフローが再び正しいルームを対象にするようにするだけです。

## スレッド

Matrix は、自動返信とメッセージツール送信の両方でネイティブ Matrix スレッドをサポートします。

- `threadReplies: "off"` は返信をトップレベルに維持し、受信したスレッド付きメッセージも親セッション上に維持します。
- `threadReplies: "inbound"` は、受信メッセージがすでにそのスレッド内にあった場合にのみ、そのスレッド内で返信します。
- `threadReplies: "always"` は、ルーム返信をトリガーメッセージをルートとするスレッド内に保持し、その会話を最初のトリガーメッセージから対応するスレッドスコープのセッションにルーティングします。
- `dm.threadReplies` は DM 専用でトップレベル設定を上書きします。たとえば、ルームスレッドは分離したまま、DM はフラットに保つことができます。
- 受信スレッドメッセージには、追加のエージェントコンテキストとしてスレッドルートメッセージが含まれます。
- メッセージツール送信は、ターゲットが同じルームまたは同じ DM ユーザーターゲットであれば、明示的な `threadId` が指定されない限り、現在の Matrix スレッドを自動継承するようになりました。
- Matrix ではランタイム thread bindings がサポートされます。`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、およびスレッドにバインドされた `/acp spawn` が Matrix ルームと DM で動作するようになりました。
- トップレベルの Matrix ルーム / DM で `/focus` を実行すると、`threadBindings.spawnSubagentSessions=true` の場合、新しい Matrix スレッドを作成し、それを対象セッションへバインドします。
- 既存の Matrix スレッド内で `/focus` または `/acp spawn --thread here` を実行した場合は、その現在のスレッドが代わりにバインドされます。

## ACP 会話バインディング

Matrix のルーム、DM、既存の Matrix スレッドは、チャット画面を変えずに永続的な ACP ワークスペースへ変換できます。

すばやいオペレーターフロー:

- 使い続けたい Matrix DM、ルーム、または既存スレッド内で `/acp spawn codex --bind here` を実行します。
- トップレベルの Matrix DM またはルームでは、現在の DM / ルームがそのままチャット画面として維持され、今後のメッセージは起動された ACP セッションへルーティングされます。
- 既存の Matrix スレッド内では、`--bind here` はその現在のスレッドをその場でバインドします。
- `/new` と `/reset` は、同じバインド済み ACP セッションをその場でリセットします。
- `/acp close` は ACP セッションを閉じ、バインディングを削除します。

注意:

- `--bind here` は子 Matrix スレッドを作成しません。
- `threadBindings.spawnAcpSessions` は、OpenClaw が子 Matrix スレッドを作成またはバインドする必要がある `/acp spawn --thread auto|here` の場合にのみ必要です。

### スレッドバインディング設定

Matrix は `session.threadBindings` からグローバルデフォルトを継承し、チャネルごとの上書きもサポートします。

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Matrix のスレッドバインド付き spawn フラグはオプトインです。

- トップレベルの `/focus` が新しい Matrix スレッドを作成してバインドできるようにするには、`threadBindings.spawnSubagentSessions: true` を設定します。
- `/acp spawn --thread auto|here` が ACP セッションを Matrix スレッドへバインドできるようにするには、`threadBindings.spawnAcpSessions: true` を設定します。

## リアクション

Matrix は、送信リアクションアクション、受信リアクション通知、受信 ack リアクションをサポートします。

- 送信リアクションツールは `channels["matrix"].actions.reactions` によって制御されます。
- `react` は特定の Matrix イベントにリアクションを追加します。
- `reactions` は特定の Matrix イベントに対する現在のリアクション要約を一覧表示します。
- `emoji=""` は、そのイベント上の bot アカウント自身のリアクションを削除します。
- `remove: true` は、bot アカウントの指定された絵文字リアクションだけを削除します。

ack リアクションは、標準の OpenClaw 解決順序を使います。

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- エージェント ID の絵文字フォールバック

ack リアクションスコープは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

リアクション通知モードは次の順で解決されます。

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- デフォルト: `own`

現在の挙動:

- `reactionNotifications: "own"` は、bot-authored の Matrix メッセージを対象にした追加済み `m.reaction` イベントを転送します。
- `reactionNotifications: "off"` はリアクションシステムイベントを無効にします。
- リアクション削除は、Matrix では独立した `m.reaction` 削除ではなく redaction として表現されるため、依然としてシステムイベントには合成されません。

## 履歴コンテキスト

- `channels.matrix.historyLimit` は、Matrix ルームメッセージがエージェントをトリガーしたときに `InboundHistory` として含める最近のルームメッセージ数を制御します。
- これは `messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します。
- Matrix ルーム履歴はルーム専用です。DM は通常のセッション履歴を使い続けます。
- Matrix ルーム履歴は pending-only です。OpenClaw はまだ返信をトリガーしていないルームメッセージをバッファし、メンションやその他のトリガーが到着したときにそのウィンドウをスナップショットします。
- 現在のトリガーメッセージは `InboundHistory` には含まれず、そのターンのメイン受信本文に残ります。
- 同じ Matrix イベントの再試行では、新しいルームメッセージへ前進してずれるのではなく、元の履歴スナップショットが再利用されます。

## コンテキスト可視性

Matrix は、取得した返信テキスト、スレッドルート、pending 履歴などの補足ルームコンテキストに対して、共通の `contextVisibility` 制御をサポートします。

- `contextVisibility: "all"` がデフォルトです。補足コンテキストは受信したまま保持されます。
- `contextVisibility: "allowlist"` は、補足コンテキストを、現在有効なルーム / ユーザー allowlist チェックで許可された送信者に限定します。
- `contextVisibility: "allowlist_quote"` は `allowlist` と同様ですが、1 つの明示的な引用返信は保持します。

この設定が影響するのは補足コンテキストの可視性であり、受信メッセージ自体が返信をトリガーできるかどうかではありません。
トリガー認可は引き続き `groupPolicy`、`groups`、`groupAllowFrom`、DM policy 設定から決まります。

## DM とルームポリシーの例

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

メンションゲートと allowlist の挙動については [Groups](/channels/groups) を参照してください。

Matrix DM のペアリング例:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

未承認の Matrix ユーザーが承認前に繰り返しメッセージを送ってきた場合、OpenClaw は同じ保留中のペアリングコードを再利用し、新しいコードを発行する代わりに、短いクールダウン後にリマインダー返信を再送することがあります。

共通の DM ペアリングフローと保存レイアウトについては [Pairing](/channels/pairing) を参照してください。

## Exec 承認

Matrix は Matrix アカウント用の exec 承認クライアントとして動作できます。

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers`（任意。`channels.matrix.dm.allowFrom` にフォールバック）
- `channels.matrix.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

承認者は `@owner:example.org` のような Matrix user ID である必要があります。`enabled` が未設定または `"auto"` で、`execApprovals.approvers` または `channels.matrix.dm.allowFrom` から少なくとも 1 人の承認者を解決できる場合、Matrix はネイティブ exec 承認を自動有効化します。Matrix をネイティブ承認クライアントとして明示的に無効にするには `enabled: false` を設定してください。それ以外では、承認要求は他の設定済み承認ルートまたは exec 承認フォールバックポリシーへフォールバックします。

ネイティブ Matrix ルーティングは現在 exec 専用です。

- `channels.matrix.execApprovals.*` は、exec 承認専用のネイティブ DM / チャネルルーティングを制御します。
- プラグイン承認は引き続き共通の同一チャット `/approve` と、設定済みなら `approvals.plugin` 転送を使います。
- Matrix は、承認者を安全に推測できる場合には、プラグイン承認認可のために `channels.matrix.dm.allowFrom` を再利用できますが、ネイティブのプラグイン承認 DM / チャネル配信パスは別途公開しません。

配信ルール:

- `target: "dm"` は承認プロンプトを承認者 DM に送信します
- `target: "channel"` はプロンプトを発信元の Matrix ルームまたは DM に送り返します
- `target: "both"` は承認者 DM と発信元の Matrix ルームまたは DM の両方に送信します

Matrix は現在テキスト承認プロンプトを使います。承認者は `/approve <id> allow-once`、`/approve <id> allow-always`、または `/approve <id> deny` で処理します。

承認または拒否できるのは解決済み承認者だけです。チャネル配信ではコマンドテキストも含まれるため、`channel` または `both` は信頼できるルームでのみ有効にしてください。

Matrix 承認プロンプトは共通のコア承認プランナーを再利用します。Matrix 固有のネイティブ画面は exec 承認のトランスポートのみです。つまり、ルーム / DM ルーティングとメッセージ送信 / 更新 / 削除の挙動だけを担当します。

アカウントごとの上書き:

- `channels.matrix.accounts.<account>.execApprovals`

関連ドキュメント: [Exec approvals](/tools/exec-approvals)

## マルチアカウントの例

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

トップレベルの `channels.matrix` 値は、アカウント側で上書きされない限り、名前付きアカウントのデフォルトとして機能します。
継承されたルームエントリーを 1 つの Matrix アカウントに限定するには、`groups.<room>.account`（またはレガシーの `rooms.<room>.account`）を使えます。
`account` を持たないエントリーはすべての Matrix アカウントで共有され、`account: "default"` を持つエントリーも、デフォルトアカウントがトップレベル `channels.matrix.*` で直接設定されている場合には引き続き動作します。
部分的な共有認証デフォルトだけでは、それ自体で別個の暗黙的デフォルトアカウントは作成されません。OpenClaw は、そのデフォルトに新しい認証情報（`homeserver` + `accessToken`、または `homeserver` + `userId` と `password`）がある場合にのみ、トップレベルの `default` アカウントを合成します。名前付きアカウントは、後でキャッシュ済み認証情報が認証要件を満たす場合、`homeserver` + `userId` から引き続き検出可能です。
Matrix にすでにちょうど 1 つの名前付きアカウントがある場合、または `defaultAccount` が既存の名前付きアカウントキーを指している場合、単一アカウントからマルチアカウントへの修復 / セットアップ昇格では、新しい `accounts.default` エントリーを作らず、そのアカウントを維持します。昇格先アカウントへ移動するのは Matrix 認証 / bootstrap キーだけであり、共有配信ポリシーキーはトップレベルに残ります。
OpenClaw に暗黙ルーティング、プローブ、CLI 操作で優先する名前付き Matrix アカウントを持たせたい場合は、`defaultAccount` を設定してください。
複数の名前付きアカウントを設定している場合は、暗黙のアカウント選択に依存する CLI コマンドで `defaultAccount` を設定するか、`--account <id>` を渡してください。
その暗黙選択を 1 つのコマンドだけで上書きしたい場合は、`openclaw matrix verify ...` と `openclaw matrix devices ...` に `--account <id>` を渡してください。

## プライベート / LAN homeserver

デフォルトでは、SSRF 保護のため、OpenClaw はプライベート / 内部 Matrix homeserver への接続をブロックします。ただし、
アカウント単位で明示的にオプトインした場合は除きます。

homeserver が localhost、LAN/Tailscale IP、または内部ホスト名で動作している場合は、
その Matrix アカウントに対して `allowPrivateNetwork` を有効にしてください。

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

CLI セットアップ例:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

このオプトインは、信頼されたプライベート / 内部ターゲットのみを許可します。`http://matrix.example.org:8008` のような
公開クリアテキスト homeserver は引き続きブロックされます。可能であれば `https://` を推奨します。

## Matrix トラフィックのプロキシ

Matrix デプロイメントで明示的な送信 HTTP(S) プロキシが必要な場合は、`channels.matrix.proxy` を設定してください。

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

名前付きアカウントでは、`channels.matrix.accounts.<id>.proxy` でトップレベルデフォルトを上書きできます。
OpenClaw は、ランタイム Matrix トラフィックとアカウント状態プローブの両方に同じプロキシ設定を使います。

## ターゲット解決

Matrix は、OpenClaw がルームまたはユーザーターゲットを求めるあらゆる場面で、以下のターゲット形式を受け付けます。

- ユーザー: `@user:server`, `user:@user:server`, または `matrix:user:@user:server`
- ルーム: `!room:server`, `room:!room:server`, または `matrix:room:!room:server`
- エイリアス: `#alias:server`, `channel:#alias:server`, または `matrix:channel:#alias:server`

ライブディレクトリ参照はログイン済み Matrix アカウントを使います。

- ユーザー参照は、その homeserver の Matrix ユーザーディレクトリに問い合わせます。
- ルーム参照は、明示的なルーム ID とエイリアスを直接受け付けたうえで、そのアカウントで参加中のルーム名検索にフォールバックします。
- 参加済みルーム名検索はベストエフォートです。ルーム名を ID またはエイリアスに解決できない場合、その名前はランタイム allowlist 解決で無視されます。

## 設定リファレンス

- `enabled`: チャネルを有効または無効にします。
- `name`: アカウントの任意ラベル。
- `defaultAccount`: 複数の Matrix アカウントが設定されているときの優先アカウント ID。
- `homeserver`: homeserver URL。例: `https://matrix.example.org`。
- `allowPrivateNetwork`: この Matrix アカウントがプライベート / 内部 homeserver に接続できるようにします。homeserver が `localhost`、LAN/Tailscale IP、または `matrix-synapse` のような内部ホストに解決される場合に有効にしてください。
- `proxy`: Matrix トラフィック用の任意の HTTP(S) プロキシ URL。名前付きアカウントは独自の `proxy` でトップレベルデフォルトを上書きできます。
- `userId`: 完全な Matrix user ID。例: `@bot:example.org`。
- `accessToken`: トークンベース認証用のアクセストークン。平文値と SecretRef 値の両方が、`channels.matrix.accessToken` と `channels.matrix.accounts.<id>.accessToken` に対して env/file/exec プロバイダー全体でサポートされます。[Secrets Management](/gateway/secrets) を参照してください。
- `password`: パスワードベースログイン用パスワード。平文値と SecretRef 値の両方がサポートされます。
- `deviceId`: 明示的な Matrix device ID。
- `deviceName`: パスワードログイン用のデバイス表示名。
- `avatarUrl`: プロフィール同期および `set-profile` 更新用に保存される自己アバター URL。
- `initialSyncLimit`: 起動時の同期イベント上限。
- `encryption`: E2EE を有効化します。
- `allowlistOnly`: DM とルームに対して allowlist-only の挙動を強制します。
- `allowBots`: 他の設定済み OpenClaw Matrix アカウントからのメッセージを許可します（`true` または `"mentions"`）。
- `groupPolicy`: `open`、`allowlist`、または `disabled`。
- `contextVisibility`: 補足ルームコンテキストの可視性モード（`all`, `allowlist`, `allowlist_quote`）。
- `groupAllowFrom`: ルームトラフィック用の user ID allowlist。
- `groupAllowFrom` エントリーは完全な Matrix user ID にしてください。解決できない名前はランタイムで無視されます。
- `historyLimit`: グループ履歴コンテキストとして含めるルームメッセージ最大数。`messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します。
- `replyToMode`: `off`、`first`、または `all`。
- `markdown`: 送信 Matrix テキスト用の任意の Markdown レンダリング設定。
- `streaming`: `off`（デフォルト）、`partial`、`true`、または `false`。`partial` と `true` は、その場で編集更新する単一メッセージ下書きプレビューを有効にします。
- `blockStreaming`: `true` は、下書きプレビューストリーミングが有効な間、完了済み assistant ブロック用の別個の進行メッセージを有効にします。
- `threadReplies`: `off`、`inbound`、または `always`。
- `threadBindings`: スレッドバインドセッションのルーティングとライフサイクルに対するチャネル単位の上書き。
- `startupVerification`: 起動時の自動自己検証要求モード（`if-unverified`, `off`）。
- `startupVerificationCooldownHours`: 起動時の自動検証要求を再試行する前のクールダウン。
- `textChunkLimit`: 送信メッセージのチャンクサイズ。
- `chunkMode`: `length` または `newline`。
- `responsePrefix`: 送信返信用の任意のメッセージプレフィックス。
- `ackReaction`: このチャネル / アカウント用の任意の ack リアクション上書き。
- `ackReactionScope`: 任意の ack リアクションスコープ上書き（`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`）。
- `reactionNotifications`: 受信リアクション通知モード（`own`, `off`）。
- `mediaMaxMb`: Matrix メディア処理におけるメディアサイズ上限（MB）。送信と受信メディア処理の両方に適用されます。
- `autoJoin`: 招待時の自動参加ポリシー（`always`, `allowlist`, `off`）。デフォルト: `off`。
- `autoJoinAllowlist`: `autoJoin` が `allowlist` の場合に許可されるルーム / エイリアス。エイリアスエントリーは招待処理時にルーム ID に解決されます。OpenClaw は、招待されたルームが主張するエイリアス状態を信頼しません。
- `dm`: DM ポリシーブロック（`enabled`, `policy`, `allowFrom`, `threadReplies`）。
- `dm.allowFrom` エントリーは、ライブディレクトリ参照ですでに解決済みでない限り、完全な Matrix user ID にしてください。
- `dm.threadReplies`: DM 専用のスレッドポリシー上書き（`off`, `inbound`, `always`）。これは、返信配置と DM におけるセッション分離の両方についてトップレベル `threadReplies` 設定を上書きします。
- `execApprovals`: Matrix ネイティブ exec 承認配信（`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`）。
- `execApprovals.approvers`: exec 要求を承認できる Matrix user ID。`dm.allowFrom` がすでに承認者を特定している場合は任意です。
- `execApprovals.target`: `dm | channel | both`（デフォルト: `dm`）。
- `accounts`: 名前付きアカウントごとの上書き。トップレベル `channels.matrix` 値がこれらのエントリーのデフォルトとして機能します。
- `groups`: ルームごとのポリシーマップ。ルーム ID またはエイリアスを推奨します。解決できないルーム名はランタイムで無視されます。セッション / グループ ID は解決後の安定したルーム ID を使い、人間向けラベルは引き続きルーム名から取得されます。
- `groups.<room>.account`: マルチアカウント構成で、継承された 1 つのルームエントリーを特定の Matrix アカウントに限定します。
- `groups.<room>.allowBots`: 設定済み bot 送信者に対するルームレベル上書き（`true` または `"mentions"`）。
- `groups.<room>.users`: ルームごとの送信者 allowlist。
- `groups.<room>.tools`: ルームごとのツール許可 / 拒否上書き。
- `groups.<room>.autoReply`: ルームレベルのメンションゲート上書き。`true` はそのルームのメンション要件を無効化し、`false` は再び強制的に有効化します。
- `groups.<room>.skills`: 任意のルームレベル skill フィルター。
- `groups.<room>.systemPrompt`: 任意のルームレベル system prompt スニペット。
- `rooms`: `groups` のレガシーエイリアス。
- `actions`: アクションごとのツールゲート（`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`）。

## 関連

- [Channels Overview](/channels) — サポートされているすべてのチャネル
- [Pairing](/channels/pairing) — DM 認証とペアリングフロー
- [Groups](/channels/groups) — グループチャットの挙動とメンションゲート
- [Channel Routing](/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/gateway/security) — アクセスモデルとハードニング
