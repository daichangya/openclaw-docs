---
read_when:
    - 既存の Matrix インストールのアップグレード
    - 暗号化された Matrix 履歴とデバイス状態の移行
summary: OpenClaw が以前の Matrix Plugin をインプレースでどのようにアップグレードするか。暗号化状態の回復制限と手動回復手順も含みます。
title: Matrix migration
x-i18n:
    generated_at: "2026-04-26T11:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

このページでは、以前の公開 `matrix` Plugin から現在の実装へのアップグレードについて説明します。

ほとんどのユーザーでは、アップグレードはインプレースで行われます。

- Plugin は引き続き `@openclaw/matrix`
- チャンネルは引き続き `matrix`
- config は引き続き `channels.matrix` 配下
- キャッシュ済み認証情報は引き続き `~/.openclaw/credentials/matrix/` 配下
- ランタイム状態は引き続き `~/.openclaw/matrix/` 配下

config キーの名前変更や、Plugin を新しい名前で再インストールする必要はありません。

## 移行で自動的に行われること

Gateway の起動時、および [`openclaw doctor --fix`](/ja-JP/gateway/doctor) の実行時に、OpenClaw は古い Matrix 状態を自動修復しようとします。
実行可能な Matrix 移行ステップがディスク上の状態を変更する前に、OpenClaw は集中的な回復スナップショットを作成または再利用します。

`openclaw update` を使用する場合、正確なトリガーは OpenClaw のインストール方法によって異なります。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトで Gateway を再起動します
- パッケージマネージャーによるインストールでは、パッケージを更新し、非対話型の doctor パスを実行し、その後デフォルトの Gateway 再起動により起動時に Matrix 移行を完了させます
- `openclaw update --no-restart` を使った場合、起動時に行われる Matrix 移行は、後で `openclaw doctor --fix` を実行して Gateway を再起動するまで延期されます

自動移行の対象:

- `~/Backups/openclaw-migrations/` 配下に、移行前スナップショットを作成または再利用
- キャッシュされた Matrix 認証情報を再利用
- 同じアカウント選択と `channels.matrix` config を維持
- 最も古いフラットな Matrix sync ストアを現在のアカウントスコープ付き場所へ移動
- ターゲットアカウントを安全に解決できる場合、最も古いフラットな Matrix crypto ストアを現在のアカウントスコープ付き場所へ移動
- 以前の rust crypto ストアから、保存済みの Matrix room-key バックアップ復号鍵を抽出（その鍵がローカルに存在する場合）
- 後で access token が変わっても、同じ Matrix アカウント、homeserver、およびユーザーに対して、最も完全な既存の token-hash ストレージルートを再利用
- Matrix access token は変わったがアカウント/デバイス ID が同じままの場合、暗号化状態復元メタデータ待ちの sibling token-hash ストレージルートを走査
- 次回の Matrix 起動時に、バックアップされた room key を新しい crypto ストアへ復元

スナップショット詳細:

- スナップショット成功後、OpenClaw は `~/.openclaw/matrix/migration-snapshot.json` にマーカーファイルを書き込み、後続の起動時および修復パスで同じアーカイブを再利用できるようにします。
- これらの自動 Matrix 移行スナップショットは config + state のみをバックアップします（`includeWorkspace: false`）。
- `userId` や `accessToken` がまだ不足しているなど、Matrix が警告のみの移行状態である場合、Matrix 変更がまだ実行可能ではないため、OpenClaw はまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClaw は回復ポイントなしで状態を変更する代わりに、その実行では Matrix 移行をスキップします。

マルチアカウント アップグレードについて:

- 最も古いフラットな Matrix ストア（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一ストアレイアウト由来のため、OpenClaw が移行できるのは解決済みの 1 つの Matrix アカウントターゲットのみです
- すでにアカウントスコープ付きの古い Matrix ストアは、設定済みの各 Matrix アカウントごとに検出・準備されます

## 移行で自動的にはできないこと

以前の公開 Matrix Plugin は、**Matrix room-key バックアップを自動作成しませんでした**。ローカルの crypto 状態を保持し、デバイス検証を要求していましたが、room key が homeserver にバックアップされることは保証していませんでした。

つまり、一部の暗号化インストールでは部分的な移行しかできません。

OpenClaw が自動回復できないもの:

- 一度もバックアップされていないローカルのみの room key
- `homeserver`、`userId`、または `accessToken` がまだ利用できず、ターゲット Matrix アカウントをまだ解決できないために暗号化状態を回復できない場合
- 複数の Matrix アカウントが設定されているが `channels.matrix.defaultAccount` が未設定のとき、1 つの共有フラット Matrix ストアを自動移行すること
- 標準の Matrix パッケージではなくリポジトリパスに固定されたカスタム Plugin パスインストール
- 古いストアにバックアップされたキーがあっても、復号鍵をローカルに保持していなかった場合の、欠落した recovery key

現在の警告範囲:

- カスタム Matrix Plugin パスインストールは、Gateway 起動時と `openclaw doctor` の両方で通知されます

古いインストールに、バックアップされていないローカルのみの暗号化履歴があった場合、アップグレード後に一部の古い暗号化メッセージは読めないままになることがあります。

## 推奨アップグレード手順

1. OpenClaw と Matrix Plugin を通常どおり更新します。
   起動時にすぐ Matrix 移行を完了できるよう、`--no-restart` を付けない通常の `openclaw update` を推奨します。
2. 次を実行します:

   ```bash
   openclaw doctor --fix
   ```

   Matrix に実行可能な移行作業がある場合、doctor は最初に移行前スナップショットを作成または再利用し、アーカイブパスを表示します。

3. Gateway を起動または再起動します。
4. 現在の検証状態とバックアップ状態を確認します:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 修復対象の Matrix アカウント用 recovery key をアカウント固有の環境変数に設定します。単一のデフォルトアカウントなら `MATRIX_RECOVERY_KEY` で構いません。複数アカウントでは、`MATRIX_RECOVERY_KEY_ASSISTANT` のようにアカウントごとに 1 つずつ変数を使い、コマンドには `--account assistant` を追加します。

6. recovery key が必要だと OpenClaw が示した場合、対応するアカウントに対して次のコマンドを実行します:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. このデバイスがまだ未検証の場合、対応するアカウントに対して次のコマンドを実行します:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   recovery key が受理され、バックアップが利用可能でも、`Cross-signing verified`
   がまだ `no` の場合は、別の Matrix クライアントから自己検証を完了してください:

   ```bash
   openclaw matrix verify self
   ```

   別の Matrix クライアントでリクエストを承認し、絵文字または数字を比較して、
   一致した場合にのみ `yes` と入力してください。このコマンドが成功終了するのは、
   `Cross-signing verified` が `yes` になった後のみです。

8. 復元不能な古い履歴を意図的に諦め、今後のメッセージ用に新しいバックアップベースラインを作りたい場合は、次を実行します:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. サーバー側 key backup がまだ存在しない場合、将来の回復のために作成します:

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は 2 段階のプロセスです。

1. 起動時または `openclaw doctor --fix` 実行時に、暗号化移行が実行可能なら移行前スナップショットを作成または再利用します。
2. 起動時または `openclaw doctor --fix` 実行時に、アクティブな Matrix Plugin インストールを通じて古い Matrix crypto ストアを検査します。
3. バックアップ復号鍵が見つかると、OpenClaw はそれを新しい recovery-key フローに書き込み、room-key 復元を pending としてマークします。
4. 次回の Matrix 起動時に、OpenClaw はバックアップされた room key を新しい crypto ストアへ自動復元します。

古いストアが、バックアップされなかった room key を報告した場合、OpenClaw は回復成功を装うのではなく警告します。

## よくあるメッセージとその意味

### アップグレードと検出メッセージ

`Matrix plugin upgraded in place.`

- 意味: ディスク上の古い Matrix 状態が検出され、現在のレイアウトへ移行されました。
- 対応: 同じ出力に警告が含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: Matrix 状態を変更する前に、OpenClaw が回復アーカイブを作成しました。
- 対応: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClaw が既存の Matrix 移行スナップショットマーカーを見つけ、重複バックアップを作らずにそのアーカイブを再利用しました。
- 対応: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古い Matrix 状態は存在しますが、Matrix が未設定のため、OpenClaw はそれを現在の Matrix アカウントに対応付けできません。
- 対応: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClaw は古い状態を見つけましたが、現在の正確なアカウント/デバイスルートをまだ特定できません。
- 対応: 正常に Matrix ログインできる状態で Gateway を一度起動するか、キャッシュ済み認証情報が存在する状態で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラット Matrix ストアを見つけましたが、どの名前付き Matrix アカウントへ渡すべきか推測しません。
- 対応: `channels.matrix.defaultAccount` を意図したアカウントに設定し、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープ付き場所にすでに sync または crypto ストアがあるため、OpenClaw は自動的には上書きしませんでした。
- 対応: 競合するターゲットを手動で削除または移動する前に、現在のアカウントが正しいものか確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClaw は古い Matrix 状態を移動しようとしましたが、ファイルシステム操作が失敗しました。
- 対応: ファイルシステム権限とディスク状態を確認してから、`openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClaw は古い暗号化 Matrix ストアを見つけましたが、それを紐付ける現在の Matrix config がありません。
- 対応: `channels.matrix` を設定してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化ストアは存在しますが、OpenClaw はそれがどの現在のアカウント/デバイスに属するかを安全に判断できません。
- 対応: 正常に Matrix ログインできる状態で Gateway を一度起動するか、キャッシュ済み認証情報が利用可能になった後で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClaw は 1 つの共有フラットな古い crypto ストアを見つけましたが、どの名前付き Matrix アカウントへ渡すべきか推測しません。
- 対応: `channels.matrix.defaultAccount` を意図したアカウントに設定し、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClaw は古い Matrix 状態を検出しましたが、移行はまだ不足している ID または認証情報によりブロックされています。
- 対応: Matrix ログインまたは config 設定を完了してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClaw は古い暗号化 Matrix 状態を見つけましたが、通常そのストアを検査する Matrix Plugin の helper エントリポイントを読み込めませんでした。
- 対応: Matrix Plugin を再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、またはリポジトリチェックアウトなら `openclaw plugins install ./path/to/local/matrix-plugin`）、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClaw は Plugin ルート外へ抜ける helper ファイルパス、または Plugin 境界チェックに失敗するパスを見つけたため、読み込みを拒否しました。
- 対応: 信頼できるパスから Matrix Plugin を再インストールし、その後 `openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClaw は先に回復スナップショットを作成できなかったため、Matrix 状態の変更を拒否しました。
- 対応: バックアップエラーを解消してから、`openclaw doctor --fix` を再実行するか Gateway を再起動してください。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrix クライアント側フォールバックが古いフラットストレージを見つけましたが、移動に失敗しました。OpenClaw は現在、このフォールバックで新しいストアを黙って開始する代わりに中断します。
- 対応: ファイルシステム権限または競合を確認し、古い状態をそのまま保持したうえで、エラー修正後に再試行してください。

`Matrix is installed from a custom path: ...`

- 意味: Matrix はパスインストールに固定されているため、mainline 更新ではリポジトリ標準の Matrix パッケージへ自動置換されません。
- 対応: デフォルトの Matrix Plugin に戻したい場合は、`openclaw plugins install @openclaw/matrix` で再インストールしてください。

### 暗号化状態回復メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済み room key が新しい crypto ストアへ正常に復元されました。
- 対応: 通常は何も不要です。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古い room key は古いローカルストアにしか存在せず、一度も Matrix バックアップへアップロードされていませんでした。
- 対応: 別の検証済みクライアントからそれらのキーを手動回復できない限り、一部の古い暗号化履歴は引き続き利用できないことを想定してください。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 意味: バックアップは存在しますが、OpenClaw は recovery key を自動回復できませんでした。
- 対応: `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行してください。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClaw は古い暗号化ストアを見つけましたが、回復準備のために十分安全に検査できませんでした。
- 対応: `openclaw doctor --fix` を再実行してください。繰り返す場合は、古い状態ディレクトリをそのまま保持し、別の検証済み Matrix クライアントと `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を使って回復してください。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClaw はバックアップキーの競合を検出し、現在の recovery-key ファイルを自動では上書きしませんでした。
- 対応: 復元コマンドを再試行する前に、どの recovery key が正しいか確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いストレージ形式の限界です。
- 対応: バックアップ済みキーは引き続き復元できますが、ローカルのみの暗号化履歴は利用できないままの可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しい Plugin が復元を試みましたが、Matrix がエラーを返しました。
- 対応: `openclaw matrix verify backup status` を実行し、必要なら `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` で再試行してください。

### 手動回復メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClaw はこのデバイスにバックアップキーがあるべきだと認識していますが、現在有効ではありません。
- 対応: `openclaw matrix verify backup restore` を実行するか、必要に応じて `MATRIX_RECOVERY_KEY` を設定して `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` を実行してください。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在 recovery key が保存されていません。
- 対応: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してから、バックアップを復元してください。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 意味: 保存されているキーがアクティブな Matrix バックアップと一致しません。
- 対応: `MATRIX_RECOVERY_KEY` を正しいキーに設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してください。

復元不能な古い暗号化履歴を失ってもよい場合は、代わりに
`openclaw matrix verify backup reset --yes` で現在の
バックアップベースラインをリセットできます。保存済みバックアップ secret が壊れている場合、
そのリセットにより secret storage も再作成され、再起動後に新しいバックアップキーを
正しく読み込めるようになることがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 意味: バックアップは存在しますが、このデバイスはまだクロス署名チェーンを十分に強く信頼していません。
- 対応: `MATRIX_RECOVERY_KEY` を設定し、`printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してください。

`Matrix recovery key is required`

- 意味: recovery key が必要な回復手順を、recovery key を指定せずに実行しました。
- 対応: `--recovery-key-stdin` を付けてコマンドを再実行してください。たとえば `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` のようにします。

`Invalid Matrix recovery key: ...`

- 意味: 指定したキーを解析できなかったか、期待される形式と一致しませんでした。
- 対応: Matrix クライアントまたは recovery-key ファイルにある正確な recovery key で再試行してください。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: OpenClaw は recovery key を適用できましたが、このデバイスに対する完全な Matrix クロス署名 ID 信頼はまだ
  確立されていません。コマンド出力の `Recovery key accepted`、`Backup usable`、
  `Cross-signing verified`、`Device verified by owner` を確認してください。
- 対応: `openclaw matrix verify self` を実行し、別の
  Matrix クライアントでリクエストを承認して、SAS を比較し、一致した場合にのみ `yes` と入力してください。
  このコマンドは、完全な Matrix ID 信頼が確立されるまで成功を報告しません。現在のクロス署名 ID を意図的に置き換えたい場合にのみ
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  を使用してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: secret storage から読み込んでも、このデバイス上でアクティブなバックアップセッションが生成されませんでした。
- 対応: まずデバイスを検証し、その後 `openclaw matrix verify backup status` で再確認してください。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 意味: このデバイスは、デバイス検証が完了するまで secret storage から復元できません。
- 対応: まず `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` を実行してください。

### カスタム Plugin インストール メッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: Plugin インストール記録が、もう存在しないローカルパスを指しています。
- 対応: `openclaw plugins install @openclaw/matrix` で再インストールするか、リポジトリチェックアウトから実行している場合は `openclaw plugins install ./path/to/local/matrix-plugin` を使ってください。

## 暗号化履歴がまだ戻らない場合

次の確認を順に実行してください:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

バックアップの復元に成功しても、一部の古いルームで履歴がまだ欠けている場合、それらの欠落キーはおそらく以前の Plugin で一度もバックアップされていませんでした。

## 今後のメッセージのために新しく始めたい場合

復元不能な古い暗号化履歴を失ってもよく、今後に向けてクリーンなバックアップベースラインだけが欲しい場合は、次のコマンドを順に実行してください:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証のままであれば、Matrix クライアントから SAS の絵文字または 10 進コードを比較し、一致することを確認して検証を完了してください。

## 関連ページ

- [Matrix](/ja-JP/channels/matrix)
- [Doctor](/ja-JP/gateway/doctor)
- [Migrating](/ja-JP/install/migrating)
- [Plugins](/ja-JP/tools/plugin)
