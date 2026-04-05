---
read_when:
    - 既存のMatrixインストールをアップグレードしている
    - 暗号化されたMatrix履歴とデバイス状態を移行している
summary: OpenClawが以前のMatrix pluginをその場でどのようにアップグレードするか、暗号化状態の復旧限界と手動復旧手順を含めて説明します。
title: Matrix migration
x-i18n:
    generated_at: "2026-04-05T12:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b1ade057d90a524e09756bd981921988c980ea6259f5c4316a796a831e9f83b
    source_path: install/migrating-matrix.md
    workflow: 15
---

# Matrix migration

このページでは、以前の公開 `matrix` pluginから現在の実装へのアップグレードを扱います。

ほとんどのユーザーにとって、アップグレードはその場で行われます。

- pluginは `@openclaw/matrix` のままです
- channelは `matrix` のままです
- configは `channels.matrix` の下にそのまま残ります
- キャッシュされた資格情報は `~/.openclaw/credentials/matrix/` の下にそのまま残ります
- ランタイム状態は `~/.openclaw/matrix/` の下にそのまま残ります

configキーの名前を変えたり、新しい名前でpluginを再インストールしたりする必要はありません。

## 移行で自動的に行われること

Gateway起動時、および [`openclaw doctor --fix`](/gateway/doctor) を実行したときに、OpenClawは古いMatrix状態の自動修復を試みます。
実際に状態を変えるMatrix移行ステップでディスク上の状態を変更する前に、OpenClawは専用の復旧スナップショットを作成するか再利用します。

`openclaw update` を使う場合、正確なトリガーはOpenClawのインストール方法に依存します。

- ソースインストールでは、更新フロー中に `openclaw doctor --fix` を実行し、その後デフォルトでGatewayを再起動します
- パッケージマネージャー経由のインストールでは、パッケージを更新し、非対話のdoctorパスを実行し、その後デフォルトのGateway再起動によって起動時にMatrix migrationを完了させます
- `openclaw update --no-restart` を使う場合、起動時に行われるMatrix migrationは、後で `openclaw doctor --fix` を実行してGatewayを再起動するまで延期されます

自動移行の対象:

- `~/Backups/openclaw-migrations/` の下に移行前スナップショットを作成または再利用する
- キャッシュ済みのMatrix資格情報を再利用する
- 同じaccount選択と `channels.matrix` configを維持する
- 最も古いフラットなMatrix sync storeを現在のaccountスコープ付き場所へ移動する
- 対象accountを安全に解決できる場合、最も古いフラットなMatrix crypto storeを現在のaccountスコープ付き場所へ移動する
- そのキーがローカルに存在する場合、古いrust crypto storeから以前保存されたMatrix room-key backup復号キーを抽出する
- 同じMatrix account、homeserver、userに対して、後からaccess tokenが変わっても、最も完全な既存token-hash storage rootを再利用する
- Matrix access tokenが変わってもaccount/device identityが同じままのとき、保留中の暗号化状態復元メタデータを兄弟token-hash storage rootから走査する
- 次回のMatrix起動時に、バックアップ済みroom keyを新しいcrypto storeへ復元する

スナップショットの詳細:

- OpenClawは、スナップショット成功後に `~/.openclaw/matrix/migration-snapshot.json` へmarkerファイルを書き込み、後続の起動および修復パスで同じarchiveを再利用できるようにします。
- これらの自動Matrix migrationスナップショットは、config + stateのみをバックアップします（`includeWorkspace: false`）。
- Matrixに警告のみの移行状態しかない場合、たとえば `userId` や `accessToken` がまだ欠けている場合は、変更可能なMatrix mutationが存在しないため、OpenClawはまだスナップショットを作成しません。
- スナップショット手順に失敗した場合、OpenClawは復旧ポイントなしで状態を変更する代わりに、その実行ではMatrix migrationをスキップします。

multi-accountアップグレードについて:

- 最も古いフラットなMatrix store（`~/.openclaw/matrix/bot-storage.json` と `~/.openclaw/matrix/crypto/`）は単一storeレイアウト由来なので、OpenClawが移行できるのは解決済みの1つのMatrix account targetだけです
- すでにaccountスコープ化されたlegacy Matrix storeは、設定済みの各Matrix accountごとに検出され、準備されます

## 移行で自動的にはできないこと

以前の公開Matrix pluginは、Matrix room-key backupを**自動作成しませんでした**。ローカルcrypto stateを永続化し、device verificationを要求していましたが、room keyがhomeserverへバックアップされることは保証していませんでした。

そのため、一部の暗号化インストールでは部分的な移行しかできません。

OpenClawでは自動復旧できないもの:

- 一度もバックアップされていないローカル専用room key
- `homeserver`、`userId`、または `accessToken` がまだ利用できず、対象Matrix accountをまだ解決できないために暗号化状態を復旧できないケース
- 複数のMatrix accountが設定されているが `channels.matrix.defaultAccount` が設定されていない場合に、1つの共有フラットMatrix storeを自動移行すること
- 標準のMatrix packageではなくrepo pathに固定されたカスタムplugin pathインストール
- 古いstoreにバックアップ済みkeyがあっても、復号キーがローカルに保持されていなかった場合の欠落したrecovery key

現在の警告範囲:

- カスタムMatrix plugin pathインストールは、Gateway起動時と `openclaw doctor` の両方で通知されます

以前のインストールに、バックアップされたことのないローカル専用の暗号化履歴があった場合、アップグレード後も一部の古い暗号化メッセージは読めないまま残ることがあります。

## 推奨されるアップグレード手順

1. OpenClawとMatrix pluginを通常どおり更新します。
   起動時にすぐMatrix migrationを完了できるよう、`--no-restart` なしの通常の `openclaw update` を推奨します。
2. 次を実行します:

   ```bash
   openclaw doctor --fix
   ```

   Matrixに実行可能なmigration作業がある場合、doctorはまず移行前スナップショットを作成または再利用し、そのarchive pathを表示します。

3. Gatewayを起動または再起動します。
4. 現在のverification状態とbackup状態を確認します:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. OpenClawがrecovery keyが必要だと示した場合は、次を実行します:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. このdeviceがまだ未検証なら、次を実行します:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. 復旧不能な古い履歴を意図的にあきらめ、今後のメッセージのために新しいbackup基準を作りたい場合は、次を実行します:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. まだサーバー側key backupが存在しない場合は、今後の復旧のために作成します:

   ```bash
   openclaw matrix verify bootstrap
   ```

## 暗号化移行の仕組み

暗号化移行は2段階の処理です。

1. 起動時または `openclaw doctor --fix` で、暗号化移行が実行可能な場合に移行前スナップショットを作成または再利用します。
2. 起動時または `openclaw doctor --fix` で、アクティブなMatrix pluginインストールを通して古いMatrix crypto storeを検査します。
3. backup復号キーが見つかれば、OpenClawはそれを新しいrecovery-keyフローへ書き込み、room-key restoreを保留としてマークします。
4. 次回のMatrix起動時に、OpenClawはバックアップ済みroom keyを新しいcrypto storeへ自動復元します。

古いstoreが、一度もバックアップされていないroom keyを報告した場合、OpenClawは復旧成功を装うのではなく警告を出します。

## よくあるメッセージとその意味

### アップグレードと検出に関するメッセージ

`Matrix plugin upgraded in place.`

- 意味: 古いディスク上のMatrix stateが検出され、現在のレイアウトへ移行されました。
- 対応: 同じ出力に警告が含まれていない限り、何もする必要はありません。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 意味: OpenClawがMatrix stateを変更する前に復旧archiveを作成しました。
- 対応: 移行成功を確認するまで、表示されたarchive pathを保持してください。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 意味: OpenClawが既存のMatrix migration snapshot markerを見つけ、重複バックアップを作らずにそのarchiveを再利用しました。
- 対応: 移行成功を確認するまで、表示されたarchive pathを保持してください。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 意味: 古いMatrix stateは存在しますが、Matrixが設定されていないため、OpenClawはそれを現在のMatrix accountへマッピングできません。
- 対応: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: OpenClawは古いstateを見つけましたが、現在の正確なaccount/device rootをまだ特定できません。
- 対応: Matrix loginが正常に動作する状態で一度Gatewayを起動するか、キャッシュ済み資格情報が存在する状態で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClawは1つの共有フラットMatrix storeを見つけましたが、それをどのnamed Matrix accountへ渡すべきか推測することを拒否しています。
- 対応: 意図したaccountに `channels.matrix.defaultAccount` を設定し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 意味: 新しいaccountスコープ付き場所にすでにsyncまたはcrypto storeがあるため、OpenClawは自動上書きを行いませんでした。
- 対応: 競合するtargetを手動で削除または移動する前に、現在のaccountが正しいことを確認してください。

`Failed migrating Matrix legacy sync store (...)` または `Failed migrating Matrix legacy crypto store (...)`

- 意味: OpenClawは古いMatrix stateの移動を試みましたが、ファイルシステム操作に失敗しました。
- 対応: ファイルシステム権限とディスク状態を確認し、その後 `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 意味: OpenClawは古い暗号化されたMatrix storeを見つけましたが、それを紐付ける現在のMatrix configがありません。
- 対応: `channels.matrix` を設定し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 意味: 暗号化storeは存在しますが、OpenClawはそれがどの現在のaccount/deviceに属するかを安全に判断できません。
- 対応: Matrix loginが正常に動作する状態で一度Gatewayを起動するか、キャッシュ済み資格情報が利用可能になった後で `openclaw doctor --fix` を再実行してください。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 意味: OpenClawは1つの共有フラットlegacy crypto storeを見つけましたが、それをどのnamed Matrix accountへ渡すべきか推測することを拒否しています。
- 対応: 意図したaccountに `channels.matrix.defaultAccount` を設定し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 意味: OpenClawは古いMatrix stateを検出しましたが、移行はまだidentityまたは資格情報データ不足のためブロックされています。
- 対応: Matrix loginまたはconfig設定を完了し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 意味: OpenClawは古い暗号化Matrix stateを見つけましたが、通常そのstoreを検査するMatrix pluginのhelper entrypointを読み込めませんでした。
- 対応: Matrix pluginを再インストールまたは修復し（`openclaw plugins install @openclaw/matrix`、repo checkoutなら `openclaw plugins install ./path/to/local/matrix-plugin`）、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 意味: OpenClawはplugin rootの外へ出るhelper file path、またはplugin boundaryチェックに失敗するpathを見つけたため、importを拒否しました。
- 対応: 信頼できるpathからMatrix pluginを再インストールし、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 意味: OpenClawは、先に復旧スナップショットを作成できなかったため、Matrix stateの変更を拒否しました。
- 対応: バックアップエラーを解消し、その後 `openclaw doctor --fix` を再実行するかGatewayを再起動してください。

`Failed migrating legacy Matrix client storage: ...`

- 意味: Matrix client側のfallbackが古いフラットstorageを見つけましたが、移動に失敗しました。OpenClawは現在、黙って新しいstoreで起動する代わりに、そのfallbackを中止します。
- 対応: ファイルシステム権限や競合を確認し、古いstateはそのまま保持したまま、問題修正後に再試行してください。

`Matrix is installed from a custom path: ...`

- 意味: Matrixがpath installに固定されているため、mainline updateでrepo標準のMatrix packageへ自動置換されません。
- 対応: デフォルトのMatrix pluginへ戻したい場合は `openclaw plugins install @openclaw/matrix` で再インストールしてください。

### 暗号化状態復旧に関するメッセージ

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 意味: バックアップ済みroom keyが新しいcrypto storeへ正常に復元されました。
- 対応: 通常は何もする必要はありません。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 意味: 一部の古いroom keyは古いローカルstoreにしか存在せず、Matrix backupへ一度もアップロードされていませんでした。
- 対応: 別のverified clientからそれらのkeyを手動復旧できない限り、一部の古い暗号化履歴は利用できないままになることを想定してください。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 意味: backupは存在しますが、OpenClawはrecovery keyを自動復旧できませんでした。
- 対応: `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` を実行してください。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 意味: OpenClawは古い暗号化storeを見つけましたが、復旧準備に十分な安全性でそれを検査できませんでした。
- 対応: `openclaw doctor --fix` を再実行してください。繰り返し発生する場合は、古いstate directoryはそのまま保持し、別のverified Matrix clientと `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` を使って復旧してください。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 意味: OpenClawはbackup keyの競合を検出し、現在のrecovery-key fileを自動上書きすることを拒否しました。
- 対応: restore commandを再試行する前に、どのrecovery keyが正しいか確認してください。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 意味: これは古いstorage formatのハードな限界です。
- 対応: バックアップ済みkeyは引き続き復元できますが、ローカル専用の暗号化履歴は利用できないまま残ることがあります。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 意味: 新しいpluginがrestoreを試みましたが、Matrixがエラーを返しました。
- 対応: `openclaw matrix verify backup status` を実行し、必要なら `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` で再試行してください。

### 手動復旧に関するメッセージ

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 意味: OpenClawはbackup keyが必要だと認識していますが、このdeviceではまだ有効になっていません。
- 対応: `openclaw matrix verify backup restore` を実行するか、必要に応じて `--recovery-key` を付けてください。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 意味: このdeviceには現在recovery keyが保存されていません。
- 対応: まずrecovery keyでdeviceを検証し、その後backupを復元してください。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 意味: 保存されているkeyが現在のMatrix backupと一致しません。
- 対応: 正しいkeyで `openclaw matrix verify device "<your-recovery-key>"` を再実行してください。

復旧不能な古い暗号化履歴を失うことを受け入れる場合は、代わりに
`openclaw matrix verify backup reset --yes` で現在の
backup基準をリセットできます。保存されたbackup secretが壊れている場合、そのresetは再起動後に新しいbackup keyを正しく読み込めるよう、secret storageも再作成することがあります。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 意味: backupは存在しますが、このdeviceはまだcross-signing chainを十分に信頼していません。
- 対応: `openclaw matrix verify device "<your-recovery-key>"` を再実行してください。

`Matrix recovery key is required`

- 意味: 必要なrecovery keyを指定せずに復旧手順を実行しました。
- 対応: recovery keyを付けてcommandを再実行してください。

`Invalid Matrix recovery key: ...`

- 意味: 指定したkeyを解析できなかったか、期待される形式に一致しませんでした。
- 対応: Matrix clientまたはrecovery-key fileにある正確なrecovery keyで再試行してください。

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- 意味: keyは適用されましたが、このdeviceはまだverificationを完了できませんでした。
- 対応: 正しいkeyを使ったことと、そのaccountでcross-signingが利用可能であることを確認してから再試行してください。

`Matrix key backup is not active on this device after loading from secret storage.`

- 意味: secret storageから読み込んでも、このdeviceで有効なbackup sessionになりませんでした。
- 対応: まずdeviceを検証し、その後 `openclaw matrix verify backup status` で再確認してください。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 意味: このdeviceでは、device verificationが完了するまでsecret storageからbackup keyを復元できません。
- 対応: まず `openclaw matrix verify device "<your-recovery-key>"` を実行してください。

### カスタムpluginインストールに関するメッセージ

`Matrix is installed from a custom path that no longer exists: ...`

- 意味: plugin install recordが、すでに存在しないローカルpathを指しています。
- 対応: `openclaw plugins install @openclaw/matrix` で再インストールするか、repo checkoutから実行している場合は `openclaw plugins install ./path/to/local/matrix-plugin` を使ってください。

## 暗号化履歴がまだ戻らない場合

次の確認を順に実行してください。

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

backupの復元に成功しても、一部の古いroomで履歴が欠けたままなら、それらの欠けたkeyは以前のpluginによって一度もバックアップされていなかった可能性が高いです。

## 今後のメッセージ向けに新しく始めたい場合

復旧不能な古い暗号化履歴を失うことを受け入れ、今後に向けてクリーンなbackup基準だけ欲しい場合は、次のcommandを順に実行してください。

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

その後もdeviceが未検証のままなら、Matrix client側でSAS絵文字または10進コードを比較し、一致することを確認してverificationを完了してください。

## 関連ページ

- [Matrix](/ja-JP/channels/matrix)
- [Doctor](/gateway/doctor)
- [Migrating](/install/migrating)
- [Plugins](/tools/plugin)
