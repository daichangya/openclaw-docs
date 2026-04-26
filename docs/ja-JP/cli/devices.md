---
read_when:
    - デバイスのペアリングリクエストを承認しています
    - デバイストークンをローテーションまたは失効する必要があります
summary: '`openclaw devices` のCLIリファレンス（デバイスのペアリング + トークンのローテーション/失効）'
title: Devices
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

デバイスのペアリングリクエストとデバイススコープのトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のペアリングリクエストと、ペアリング済みデバイスを一覧表示します。

```
openclaw devices list
openclaw devices list --json
```

保留中リクエストの出力では、そのデバイスがすでにペアリング済みの場合、デバイスの現在承認されているアクセスの横に要求されたアクセスが表示されます。これにより、ペアリングが失われたように見えるのではなく、スコープ/ロールのアップグレードが明示されます。

### `openclaw devices remove <deviceId>`

1つのペアリング済みデバイスエントリを削除します。

ペアリング済みデバイストークンで認証されている場合、管理者ではない呼び出し元は **自分自身の** デバイスエントリだけを削除できます。別のデバイスを削除するには `operator.admin` が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ペアリング済みデバイスを一括でクリアします。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

正確な `requestId` を指定して、保留中のデバイスペアリングリクエストを承認します。`requestId` を省略するか `--latest` を渡した場合、OpenClawは選択された保留中リクエストを表示するだけで終了します。詳細を確認したあと、正確なリクエストIDを指定して再度承認を実行してください。

注: デバイスが変更された認証詳細（ロール/スコープ/公開鍵）で再度ペアリングを試みた場合、OpenClawは以前の保留エントリを置き換え、新しい `requestId` を発行します。現在のIDを使うため、承認直前に `openclaw devices list` を実行してください。

デバイスがすでにペアリング済みで、より広いスコープやロールを要求した場合、OpenClawは既存の承認を維持したまま、新しい保留中のアップグレードリクエストを作成します。承認前に、`openclaw devices list` の `Requested` 列と `Approved` 列を確認するか、`openclaw devices approve --latest` を使って正確なアップグレード内容をプレビューしてください。

Gatewayが `gateway.nodes.pairing.autoApproveCidrs` で明示的に設定されている場合、一致するクライアントIPからの初回 `role: node` リクエストは、この一覧に表示される前に承認されることがあります。このポリシーはデフォルトで無効で、operator/browserクライアントやアップグレードリクエストには適用されません。

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

特定のロールのデバイストークンをローテーションします（必要に応じてスコープも更新可能）。
対象ロールは、そのデバイスの承認済みペアリング契約内にすでに存在している必要があります。ローテーションで新しい未承認ロールを発行することはできません。
`--scope` を省略すると、保存済みのローテーション後トークンを使う後続の再接続では、そのトークンのキャッシュ済み承認スコープが再利用されます。明示的な `--scope` 値を渡した場合、それらが将来のキャッシュトークン再接続用の保存スコープ集合になります。
管理者ではないペアリング済みデバイスの呼び出し元は、**自分自身の** デバイストークンだけをローテーションできます。
対象トークンのスコープ集合は、呼び出し元セッション自身のoperatorスコープ内に収まっている必要があります。呼び出し元がすでに持っているより広いoperatorトークンを、ローテーションで発行または維持することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

新しいトークンペイロードをJSONで返します。

### `openclaw devices revoke --device <id> --role <role>`

特定のロールのデバイストークンを失効します。

管理者ではないペアリング済みデバイスの呼び出し元は、**自分自身の** デバイストークンだけを失効できます。
別のデバイスのトークンを失効するには `operator.admin` が必要です。
対象トークンのスコープ集合も、呼び出し元セッション自身のoperatorスコープ内に収まっている必要があります。ペアリング専用の呼び出し元は、admin/write operatorトークンを失効できません。

```
openclaw devices revoke --device <deviceId> --role node
```

失効結果をJSONで返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合はデフォルトで `gateway.remote.url`）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--password <password>`: Gatewayパスワード（パスワード認証）。
- `--timeout <ms>`: RPCタイムアウト。
- `--json`: JSON出力（スクリプト利用に推奨）。

注: `--url` を設定すると、CLIは設定や環境変数の認証情報にフォールバックしません。
`--token` または `--password` を明示的に渡してください。明示的な認証情報がない場合はエラーになります。

## 注意

- トークンローテーションは新しいトークンを返します（機密情報）。シークレットとして扱ってください。
- これらのコマンドには `operator.pairing`（または `operator.admin`）スコープが必要です。
- `gateway.nodes.pairing.autoApproveCidrs` は、新規のnodeデバイスペアリング専用のオプトインGatewayポリシーです。CLIの承認権限は変更しません。
- トークンのローテーションと失効は、そのデバイスの承認済みペアリングロール集合および承認済みスコープ基準内にとどまります。迷い込んだキャッシュトークンエントリがトークン管理対象を付与することはありません。
- ペアリング済みデバイストークンセッションでは、デバイスをまたぐ管理は管理者専用です。呼び出し元が `operator.admin` を持たない限り、`remove`、`rotate`、`revoke` は自分自身のものに限定されます。
- トークン変更も呼び出し元スコープ内に制限されます。ペアリング専用セッションでは、現在 `operator.admin` または `operator.write` を持つトークンをローテーションまたは失効できません。
- `devices clear` は意図的に `--yes` で保護されています。
- local loopback でペアリングスコープが利用できない場合（かつ明示的な `--url` を渡していない場合）、list/approve はローカルペアリングフォールバックを使用できます。
- `devices approve` は、トークンを発行する前に明示的なリクエストIDを必要とします。`requestId` を省略するか `--latest` を渡した場合は、最新の保留中リクエストをプレビューするだけです。

## トークンドリフト回復チェックリスト

Control UIやその他のクライアントが `AUTH_TOKEN_MISMATCH` または `AUTH_DEVICE_TOKEN_MISMATCH` で失敗し続ける場合に使用してください。

1. 現在のGatewayトークンソースを確認します。

```bash
openclaw config get gateway.auth.token
```

2. ペアリング済みデバイスを一覧表示し、影響を受けているデバイスIDを特定します。

```bash
openclaw devices list
```

3. 影響を受けたデバイスのoperatorトークンをローテーションします。

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションだけでは不十分な場合は、古いペアリングを削除して再承認します。

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注意:

- 通常の再接続時の認証優先順位は、明示的な共有トークン/パスワードが先で、その後に明示的な `deviceToken`、保存済みデバイストークン、ブートストラップトークンが続きます。
- 信頼済みの `AUTH_TOKEN_MISMATCH` 回復では、境界付きの1回のリトライに限り、共有トークンと保存済みデバイストークンの両方を一時的に一緒に送信できます。

関連:

- [Dashboard auth troubleshooting](/ja-JP/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 関連

- [CLI reference](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
