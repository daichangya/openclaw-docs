---
read_when:
    - 既存のMatrixインストールをアップグレードすること
    - 暗号化されたMatrix履歴とデバイス状態を移行すること
summary: OpenClawが以前のMatrix pluginをその場でアップグレードする方法。暗号化状態の復旧限界や手動復旧手順も含みます。
title: Matrix移行
x-i18n:
    generated_at: "2026-04-25T13:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

このページでは、以前公開されていた`matrix` pluginから現在の実装へのアップグレードを扱います。

ほとんどのユーザーでは、アップグレードはその場で行われます。

- pluginは引き続き`@openclaw/matrix`
- channelは引き続き`matrix`
- configは引き続き`channels.matrix`配下
- キャッシュ済み認証情報は引き続き`~/.openclaw/credentials/matrix/`配下
- runtime stateは引き続き`~/.openclaw/matrix/`配下

configキー名を変更したり、新しい名前でpluginを再インストールしたりする必要はありません。

## 移行で自動的に行われること

Gateway起動時、および[`openclaw doctor --fix`](/ja-JP/gateway/doctor)実行時に、OpenClawは古いMatrix stateを自動修復しようとします。実行可能なMatrix移行ステップがディスク上のstateを変更する前に、OpenClawは専用の復旧スナップショットを作成または再利用します。

`openclaw update`を使う場合、正確なトリガーはOpenClawのインストール方法によって異なります。

- ソースインストールでは、更新フロー中に`openclaw doctor --fix`を実行し、その後デフォルトでgatewayを再起動します
- パッケージマネージャーインストールでは、パッケージを更新し、非対話のdoctorパスを実行し、その後デフォルトのgateway再起動により起動時にMatrix移行を完了させます
- `openclaw update --no-restart`を使う場合、起動依存のMatrix移行は、後で`openclaw doctor --fix`を実行してgatewayを再起動するまで延期されます

自動移行の対象:

- `~/Backups/openclaw-migrations/`配下への移行前スナップショットの作成または再利用
- キャッシュ済みMatrix認証情報の再利用
- 同じアカウント選択と`channels.matrix` configの維持
- 最も古いフラットなMatrix sync storeを現在のアカウントスコープ位置へ移動
- 対象アカウントを安全に解決できる場合、最も古いフラットなMatrix crypto storeを現在のアカウントスコープ位置へ移動
- 古いrust crypto storeにローカルで存在する場合、以前保存されたMatrix room-key backup復号キーを抽出
- 後でaccess tokenが変わった場合でも、同じMatrixアカウント、homeserver、ユーザーに対して最も完全な既存token-hash storage rootを再利用
- Matrix access tokenが変わってもアカウント/デバイスidentityが同じままの場合、保留中の暗号化state復元メタデータを探すために兄弟token-hash storage rootを走査
- 次回Matrix起動時に、新しいcrypto storeへバックアップ済みroom keyを復元

スナップショットの詳細:

- スナップショット成功後、OpenClawは`~/.openclaw/matrix/migration-snapshot.json`にマーカーファイルを書き込み、後続の起動および修復パスで同じアーカイブを再利用できるようにします。
- これらの自動Matrix移行スナップショットは、config + stateのみをバックアップします（`includeWorkspace: false`）。
- Matrixに警告のみの移行stateしかない場合、たとえば`userId`や`accessToken`がまだ不足している場合は、実行可能なMatrix変更がないため、OpenClawはまだスナップショットを作成しません。
- スナップショット手順が失敗した場合、OpenClawは復旧ポイントなしでstateを変更する代わりに、その実行ではMatrix移行をスキップします。

複数アカウントのアップグレードについて:

- 最も古いフラットなMatrix store（`~/.openclaw/matrix/bot-storage.json`と`~/.openclaw/matrix/crypto/`）は単一storeレイアウト由来のため、OpenClawが移行できるのは解決済みの1つのMatrixアカウント対象だけです
- すでにアカウントスコープ化されたlegacy Matrix storeは、設定済みの各Matrixアカウントごとに検出され、準備されます

## 移行で自動的にできないこと

以前の公開Matrix pluginは、**自動的に**Matrix room-key backupを作成していませんでした。ローカルcrypto stateを保持し、デバイス検証を要求していましたが、room keyがhomeserverへバックアップされることを保証していませんでした。

そのため、一部の暗号化インストールは部分的にしか移行できません。

OpenClawが自動復旧できないもの:

- 一度もバックアップされていないローカル専用room key
- `homeserver`、`userId`、または`accessToken`がまだ利用できず、対象Matrixアカウントをまだ解決できないための暗号化state
- 複数のMatrixアカウントが設定されているが`channels.matrix.defaultAccount`が未設定である場合の、1つの共有フラットMatrix storeの自動移行
- 標準のMatrix packageではなくrepo pathに固定されたcustom plugin pathインストール
- 古いstoreにバックアップ済みkeyがあったが、復号キーをローカル保持していなかった場合の、欠落したrecovery key

現在の警告対象:

- custom Matrix plugin pathインストールは、gateway起動時と`openclaw doctor`の両方で通知されます

古いインストールに、バックアップされていないローカル専用の暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読み取れないままになる可能性があります。

## 推奨されるアップグレード手順

1. OpenClawとMatrix pluginを通常どおり更新します。  
   起動時にすぐMatrix移行を完了できるよう、`--no-restart`なしの通常の`openclaw update`を推奨します。
2. 次を実行します:

   ```bash
   openclaw doctor --fix
   ```

   Matrixに実行可能な移行作業がある場合、doctorはまず移行前スナップショットを作成または再利用し、そのアーカイブパスを表示します。

3. Gatewayを起動または再起動します。
4. 現在の検証状態とバックアップ状態を確認します:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClawがrecovery keyが必要だと示した場合は、次を実行します:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. このデバイスがまだ未検証の場合は、次を実行します:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   recovery keyが受理され、backupが利用可能でも、`Cross-signing verified`
   がまだ`no`である場合は、別のMatrixクライアントからセルフ検証を完了してください:

   ```bash
   openclaw matrix verify self
   ```

   別のMatrixクライアントでリクエストを受け入れ、絵文字または10進数を比較し、一致した場合にのみ`yes`を入力してください。このコマンドは、`Cross-signing verified`が`yes`になった後にのみ正常終了します。

7. 復旧不能な古い履歴を意図的に放棄し、今後のメッセージ用に新しいバックアップベースラインを作りたい場合は、次を実行します:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. サーバー側key backupがまだ存在しない場合は、今後の復旧に備えて1つ作成します:

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は2段階のプロセスです。

1. 起動時または`openclaw doctor --fix`実行時に、暗号化移行が実行可能であれば、移行前スナップショットを作成または再利用します。
2. 起動時または`openclaw doctor --fix`実行時に、アクティブなMatrix pluginインストールを通じて古いMatrix crypto storeを検査します。
3. backup復号キーが見つかった場合、OpenClawはそれを新しいrecovery-keyフローへ書き込み、room-key restoreを保留としてマークします。
4. 次回Matrix起動時に、OpenClawはバックアップ済みroom keyを新しいcrypto storeへ自動復元します。

古いstoreが、バックアップされていないroom keyを報告した場合、OpenClawは復旧成功を装うのではなく警告します。

## よくあるメッセージとその意味

### アップグレードと検出メッセージ

`Matrix plugin upgraded in place.`

- 意味: 古いオンディスクのMatrix stateが検出され、現在のレイアウトへ移行されました。
- 対応: 同じ出力に警告も含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClawは、Matrix stateを変更する前に復旧アーカイブを作成しました。
- 対応: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClawは既存のMatrix移行スナップショットマーカーを見つけ、新しいバックアップを重複作成せずにそのアーカイブを再利用しました。
- 対応: 移行成功を確認するまで、表示されたアーカイブパスを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古いMatrix stateは存在しますが、Matrixが未設定のため、OpenClawはそれを現在のMatrixアカウントへ対応付けできません。
- 対応: `channels.matrix`を設定し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClawは古いstateを見つけましたが、現在の正確なアカウント/デバイスrootをまだ判定できません。
- 対応: 正常なMatrixログイン状態で一度gatewayを起動するか、キャッシュ済み認証情報が存在する状態で`openclaw doctor --fix`を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClawは1つの共有フラットMatrix storeを見つけましたが、どの名前付きMatrixアカウントへ渡すべきかを推測することを拒否しています。
- 対応: `channels.matrix.defaultAccount`を意図したアカウントに設定し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいアカウントスコープ位置にすでにsyncまたはcrypto storeが存在するため、OpenClawは自動上書きを行いませんでした。
- 対応: 競合する対象を手動で削除または移動する前に、現在のアカウントが正しいことを確認してください。

`Failed migrating Matrix legacy sync store (...)`または`Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClawは古いMatrix stateの移動を試みましたが、ファイルシステム操作に失敗しました。
- 対応: ファイルシステム権限とディスク状態を確認し、その後`openclaw doctor --fix`を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClawは古い暗号化Matrix storeを見つけましたが、それを関連付ける現在のMatrix configがありません。
- 対応: `channels.matrix`を設定し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化storeは存在しますが、それがどの現在のアカウント/デバイスに属するかをOpenClawが安全に判断できません。
- 対応: 正常なMatrixログイン状態で一度gatewayを起動するか、キャッシュ済み認証情報が利用可能になった後で`openclaw doctor --fix`を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClawは1つの共有フラットlegacy crypto storeを見つけましたが、どの名前付きMatrixアカウントへ渡すべきかを推測することを拒否しています。
- 対応: `channels.matrix.defaultAccount`を意図したアカウントに設定し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClawは古いMatrix stateを検出しましたが、移行はまだ不足しているidentityまたは認証情報データのためにブロックされています。
- 対応: Matrixログインまたはconfigセットアップを完了し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClawは古い暗号化Matrix stateを見つけましたが、そのstoreを通常検査するMatrix pluginのhelper entrypointを読み込めませんでした。
- 対応: Matrix pluginを再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、またはrepo checkoutなら`openclaw plugins install ./path/to/local/matrix-plugin`）、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClawはplugin rootを逸脱するhelper file path、またはplugin境界チェックに失敗するpathを見つけたため、それをimportすることを拒否しました。
- 対応: 信頼できるpathからMatrix pluginを再インストールし、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClawは、最初に復旧スナップショットを作成できなかったため、Matrix stateの変更を拒否しました。
- 対応: バックアップエラーを解消し、その後`openclaw doctor --fix`を再実行するかgatewayを再起動してください。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrixクライアント側フォールバックが古いフラットstorageを見つけましたが、移動に失敗しました。OpenClawは現在、このフォールバックを中断し、黙って新しいstoreで起動することはありません。
- 対応: ファイルシステム権限または競合を確認し、古いstateをそのまま保持したうえで、エラーを修正してから再試行してください。

`Matrix is installed from a custom path: ...`

- 意味: Matrixはpathインストールに固定されているため、メインライン更新ではrepoの標準Matrix packageへ自動置換されません。
- 対応: デフォルトのMatrix pluginへ戻したい場合は、`openclaw plugins install @openclaw/matrix`で再インストールしてください。

### 暗号化state復旧メッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みroom keyが、新しいcrypto storeへ正常に復元されました。
- 対応: 通常は何も不要です。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いroom keyは古いローカルstoreにしか存在せず、Matrix backupへ一度もアップロードされていませんでした。
- 対応: 別のverified clientからそれらのkeyを手動復旧できない限り、一部の古い暗号化履歴は引き続き利用できないと見込んでください。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 意味: backupは存在しますが、OpenClawはrecovery keyを自動復旧できませんでした。
- 対応: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`を実行してください。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClawは古い暗号化storeを見つけましたが、復旧準備に十分な安全性で検査できませんでした。
- 対応: `openclaw doctor --fix`を再実行してください。繰り返される場合は、古いstateディレクトリをそのまま保持し、別のverified Matrix clientと`openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`を使って復旧してください。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClawはbackup keyの競合を検出し、現在のrecovery-keyファイルを自動上書きすることを拒否しました。
- 対応: 復元コマンドを再試行する前に、どのrecovery keyが正しいか確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いstorage formatの限界です。
- 対応: バックアップ済みkeyは引き続き復元できますが、ローカル専用の暗号化履歴は利用できないまま残る可能性があります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しいpluginが復元を試みましたが、Matrixがエラーを返しました。
- 対応: `openclaw matrix verify backup status`を実行し、必要に応じて`openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`で再試行してください。

### 手動復旧メッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClawはbackup keyがあるはずだと認識していますが、このデバイスでは有効になっていません。
- 対応: `openclaw matrix verify backup restore`を実行するか、必要に応じて`--recovery-key`を付けてください。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 意味: このデバイスには現在recovery keyが保存されていません。
- 対応: まずrecovery keyでデバイスを検証し、その後backupを復元してください。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 意味: 保存されているkeyが現在のMatrix backupと一致しません。
- 対応: 正しいkeyで`openclaw matrix verify device "<your-recovery-key>"`を再実行してください。

復旧不能な古い暗号化履歴を失うことを受け入れる場合は、代わりに
`openclaw matrix verify backup reset --yes`で現在のbackupベースラインをリセットできます。保存された
backup secretが壊れている場合、このリセットでsecret storageも再作成され、
再起動後に新しいbackup keyを正しく読み込めるようになることがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 意味: backupは存在しますが、このデバイスはまだクロスサイニングチェーンを十分強く信頼していません。
- 対応: `openclaw matrix verify device "<your-recovery-key>"`を再実行してください。

`Matrix recovery key is required`

- 意味: recovery keyが必要な復旧手順を、recovery keyなしで実行しようとしました。
- 対応: recovery keyを付けてコマンドを再実行してください。

`Invalid Matrix recovery key: ...`

- 意味: 指定したkeyをパースできなかったか、期待される形式と一致しませんでした。
- 対応: Matrix clientまたはrecovery-keyファイルにある正確なrecovery keyで再試行してください。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 意味: OpenClawはrecovery keyを適用できましたが、このデバイスに対する完全なMatrixクロスサイニングID信頼はまだ確立されていません。コマンド出力の`Recovery key accepted`、`Backup usable`、`Cross-signing verified`、`Device verified by owner`を確認してください。
- 対応: `openclaw matrix verify self`を実行し、別のMatrix clientでリクエストを受け入れ、SASを比較し、一致した場合にのみ`yes`を入力してください。このコマンドは、完全なMatrix ID信頼が確立されるまで成功を報告しません。現在のクロスサイニングIDを意図的に置き換えたい場合にのみ、`openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`を使用してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: secret storageから読み込んでも、このデバイス上でアクティブなbackup sessionになりませんでした。
- 対応: まずデバイスを検証し、その後`openclaw matrix verify backup status`で再確認してください。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 意味: このデバイスでは、デバイス検証が完了するまでsecret storageから復元できません。
- 対応: まず`openclaw matrix verify device "<your-recovery-key>"`を実行してください。

### Custom plugin installメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: plugin install recordが、すでに存在しないローカルpathを指しています。
- 対応: `openclaw plugins install @openclaw/matrix`で再インストールするか、repo checkoutから実行している場合は`openclaw plugins install ./path/to/local/matrix-plugin`を使ってください。

## 暗号化履歴がまだ戻らない場合

次の確認を順番に実行してください:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

backupの復元が成功しても一部の古いルームに履歴が戻らない場合、それらの欠落keyはおそらく以前のpluginで一度もバックアップされていませんでした。

## 今後のメッセージ用に新しく始めたい場合

復旧不能な古い暗号化履歴を失うことを受け入れ、今後に向けたクリーンなbackupベースラインだけを望む場合は、次のコマンドを順に実行してください:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もデバイスが未検証の場合は、Matrix clientでSASの絵文字または10進コードを比較し、一致することを確認して検証を完了してください。

## 関連ページ

- [Matrix](/ja-JP/channels/matrix)
- [Doctor](/ja-JP/gateway/doctor)
- [Migrating](/ja-JP/install/migrating)
- [Plugins](/ja-JP/tools/plugin)
