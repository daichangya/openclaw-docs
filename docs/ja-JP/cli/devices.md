---
read_when:
    - デバイスのペアリングリクエストを承認する場合
    - デバイストークンをローテーションまたは失効する必要がある場合
summary: '`openclaw devices`のCLIリファレンス（デバイスのペアリング + トークンのローテーション/失効）'
title: デバイス
x-i18n:
    generated_at: "2026-04-25T13:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

デバイスのペアリングリクエストとデバイススコープのトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のペアリングリクエストとペアリング済みデバイスを一覧表示します。

```
openclaw devices list
openclaw devices list --json
```

保留中リクエストの出力では、デバイスがすでにペアリング済みの場合、そのデバイスの現在承認済みアクセス権の横に要求されたアクセス権が表示されます。これにより、ペアリングが失われたように見せるのではなく、スコープ/ロールのアップグレードが明示されます。

### `openclaw devices remove <deviceId>`

1つのペアリング済みデバイスエントリを削除します。

ペアリング済みデバイストークンで認証されている場合、非管理者の呼び出し元は**自分自身の**デバイスエントリのみ削除できます。ほかのデバイスを削除するには`operator.admin`が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括で削除します。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

正確な`requestId`を指定して、保留中のデバイスペアリングリクエストを承認します。`requestId`を省略するか`--latest`を渡した場合、OpenClawは選択された保留中リクエストを表示するだけで終了します。詳細を確認したあと、正確なリクエストIDを指定して再度承認を実行してください。

注: デバイスが変更された認証詳細（ロール/スコープ/公開鍵）で再度ペアリングを試みた場合、OpenClawは以前の保留エントリを置き換え、新しい`requestId`を発行します。現在のIDを使うため、承認直前に`openclaw devices list`を実行してください。

デバイスがすでにペアリング済みで、より広いスコープまたはより広いロールを要求した場合、OpenClawは既存の承認を維持したまま、新しい保留中のアップグレードリクエストを作成します。`openclaw devices list`の`Requested`列と`Approved`列を確認するか、`openclaw devices approve --latest`を使って承認前に正確なアップグレード内容をプレビューしてください。

Gatewayで`gateway.nodes.pairing.autoApproveCidrs`が明示的に設定されている場合、一致するクライアントIPからの初回`role: node`リクエストは、この一覧に表示される前に承認されることがあります。このポリシーはデフォルトでは無効で、operator/browserクライアントやアップグレードリクエストには決して適用されません。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

保留中のデバイスペアリングリクエストを拒否します。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のロールのデバイストークンをローテーションします（必要に応じてスコープも更新）。
対象ロールは、そのデバイスの承認済みペアリング契約内にすでに存在している必要があります。ローテーションで新しい未承認ロールを発行することはできません。
`--scope`を省略した場合、保存済みのローテーション後トークンによる後続の再接続では、そのトークンのキャッシュ済み承認スコープが再利用されます。明示的に`--scope`値を渡した場合、それらが今後のキャッシュトークン再接続に対する保存済みスコープセットになります。
非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみローテーションできます。
また、明示的な`--scope`値は、呼び出し元セッション自身のoperatorスコープ内に収まっていなければなりません。ローテーションで、呼び出し元がすでに持っているより広いoperatorトークンを発行することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

新しいトークンペイロードをJSONで返します。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを失効します。

非管理者のペアリング済みデバイス呼び出し元は、**自分自身の**デバイストークンのみ失効できます。
ほかのデバイスのトークンを失効するには`operator.admin`が必要です。

```
openclaw devices revoke --device <deviceId> --role node
```

失効結果をJSONで返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合は`gateway.remote.url`がデフォルト）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--password <password>`: Gatewayパスワード（パスワード認証）。
- `--timeout <ms>`: RPCタイムアウト。
- `--json`: JSON出力（スクリプトでは推奨）。

注: `--url`を設定すると、CLIは設定や環境変数の認証情報へフォールバックしません。`--token`または`--password`を明示的に渡してください。明示的な認証情報がない場合はエラーになります。

## 注意

- トークンローテーションは新しいトークンを返します（機微情報）。シークレットとして扱ってください。
- これらのコマンドには`operator.pairing`（または`operator.admin`）スコープが必要です。
- `gateway.nodes.pairing.autoApproveCidrs`は、新規nodeデバイスペアリング専用のオプトインGatewayポリシーです。CLIの承認権限は変わりません。
- トークンローテーションは、そのデバイスに対する承認済みペアリングロール集合と承認済みスコープ基準の範囲内にとどまります。紛れ込んだキャッシュ済みトークンエントリが、新しいローテーション対象を付与することはありません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたいだ管理は管理者専用です。呼び出し元が`operator.admin`を持たない限り、`remove`、`rotate`、`revoke`は自分自身のみが対象です。
- `devices clear`は意図的に`--yes`でガードされています。
- local loopbackでペアリングスコープが利用できない場合（かつ明示的な`--url`が渡されていない場合）、list/approveはローカルペアリングフォールバックを使用できます。
- `devices approve`は、トークン発行前に明示的なリクエストIDが必要です。`requestId`を省略するか`--latest`を渡した場合は、最新の保留中リクエストをプレビューするだけです。

## トークンドリフト復旧チェックリスト

Control UIやほかのクライアントが`AUTH_TOKEN_MISMATCH`または`AUTH_DEVICE_TOKEN_MISMATCH`で失敗し続ける場合に使用してください。

1. 現在のgatewayトークンソースを確認します:

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けているdevice idを特定します:

```bash
openclaw devices list
```

3. 影響を受けているデバイスのoperatorトークンをローテーションします:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションで十分でない場合は、古いペアリングを削除して再承認します:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注:

- 通常の再接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な`deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
- 信頼された`AUTH_TOKEN_MISMATCH`復旧では、一時的に共有トークンと保存済みデバイストークンの両方を、その1回限りの限定再試行のために一緒に送信できます。

関連:

- [Dashboard auth troubleshooting](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLI reference](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
