---
read_when:
    - デバイスのpairingリクエストを承認しているとき
    - デバイストークンをローテーションまたは失効する必要があるとき
summary: '`openclaw devices`のCLIリファレンス（デバイスpairing + トークンのローテーション/失効）'
title: devices
x-i18n:
    generated_at: "2026-04-05T12:38:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f9fcb8e3508a703590f87caaafd953a5d3557e11c958cbb2be1d67bb8720f4
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

デバイスのpairingリクエストと、デバイス単位のトークンを管理します。

## コマンド

### `openclaw devices list`

保留中のpairingリクエストと、pairing済みデバイスを一覧表示します。

```
openclaw devices list
openclaw devices list --json
```

保留中リクエストの出力には、要求されたroleとscopesが含まれるため、承認前に内容を確認できます。

### `openclaw devices remove <deviceId>`

pairing済みデバイスのエントリーを1つ削除します。

pairing済みデバイストークンで認証されている場合、adminでない呼び出し元は**自分自身**のデバイスエントリーのみ削除できます。他のデバイスを削除するには`operator.admin`が必要です。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

pairing済みデバイスを一括削除します。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

保留中のデバイスpairingリクエストを承認します。`requestId`を省略した場合、OpenClawは最新の保留中リクエストを自動承認します。

注記: デバイスが変更された認証詳細（role/scopes/public key）でpairingを再試行すると、OpenClawは以前の保留中エントリーを置き換え、新しい`requestId`を発行します。現在のIDを使うため、承認直前に`openclaw devices list`を実行してください。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

保留中のデバイスpairingリクエストを拒否します。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

特定のroleに対するデバイストークンをローテーションします（必要に応じてscopesも更新します）。
対象roleは、そのデバイスの承認済みpairing契約内にすでに存在している必要があります。ローテーションで新しい未承認roleを発行することはできません。
`--scope`を省略すると、保存済みのローテーション後トークンで後から再接続した際に、そのトークンのキャッシュ済み承認scopesが再利用されます。明示的な`--scope`値を渡した場合、それらが今後のキャッシュ済みトークン再接続用の保存scopeセットになります。
adminでないpairing済みデバイスの呼び出し元は、**自分自身**のデバイストークンのみローテーションできます。また、明示的な`--scope`値はすべて、呼び出し元セッション自身のoperator scopes内に収まっている必要があります。ローテーションによって、呼び出し元がすでに持っているより広いoperatorトークンを発行することはできません。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

新しいトークンpayloadをJSONで返します。

### `openclaw devices revoke --device <id> --role <role>`

特定のroleに対するデバイストークンを失効します。

adminでないpairing済みデバイスの呼び出し元は、**自分自身**のデバイストークンのみ失効できます。他のデバイスのトークンを失効するには`operator.admin`が必要です。

```
openclaw devices revoke --device <deviceId> --role node
```

失効結果をJSONで返します。

## 共通オプション

- `--url <url>`: Gateway WebSocket URL（設定されている場合はデフォルトで`gateway.remote.url`）。
- `--token <token>`: Gatewayトークン（必要な場合）。
- `--password <password>`: Gatewayパスワード（パスワード認証）。
- `--timeout <ms>`: RPCタイムアウト。
- `--json`: JSON出力（スクリプト向けに推奨）。

注記: `--url`を設定した場合、CLIはconfigや環境の認証情報にはフォールバックしません。
`--token`または`--password`を明示的に渡してください。明示的な認証情報がない場合はエラーになります。

## 注記

- トークンローテーションは新しいトークンを返します（機微情報）。シークレットとして扱ってください。
- これらのコマンドには`operator.pairing`（または`operator.admin`）scopeが必要です。
- トークンローテーションは、そのデバイスに対して承認されたpairing roleセットと承認済みscopeベースラインの範囲内にとどまります。迷い込んだキャッシュ済みトークンエントリーが新しいローテーション対象を付与することはありません。
- pairing済みデバイストークンセッションでは、デバイス横断の管理はadmin専用です。`remove`、`rotate`、`revoke`は、呼び出し元に`operator.admin`がない限り自分自身にのみ許可されます。
- `devices clear`は意図的に`--yes`でゲートされています。
- local loopbackでpairing scopeが利用できない場合（かつ明示的な`--url`が渡されていない場合）、list/approveはローカルpairingフォールバックを使用できます。
- `devices approve`は、`requestId`を省略した場合または`--latest`を渡した場合に、最新の保留中リクエストを自動選択します。

## トークンドリフト回復チェックリスト

Control UIや他のクライアントが`AUTH_TOKEN_MISMATCH`または`AUTH_DEVICE_TOKEN_MISMATCH`で失敗し続ける場合に使用してください。

1. 現在のGatewayトークンソースを確認します。

```bash
openclaw config get gateway.auth.token
```

2. pairing済みデバイスを一覧表示し、影響を受けているdevice idを特定します。

```bash
openclaw devices list
```

3. 影響を受けているデバイスのoperatorトークンをローテーションします。

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. ローテーションだけでは不十分な場合は、古いpairingを削除して再承認します。

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 現在の共有トークン/パスワードでクライアント接続を再試行します。

注記:

- 通常の再接続認証の優先順位は、明示的な共有トークン/パスワード、次に明示的な`deviceToken`、次に保存済みデバイストークン、最後にブートストラップトークンです。
- 信頼済みの`AUTH_TOKEN_MISMATCH`回復では、1回に限った制限付き再試行のために、共有トークンと保存済みデバイストークンの両方を一時的に一緒に送信できます。

関連:

- [Dashboard auth troubleshooting](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/gateway/troubleshooting#dashboard-control-ui-connectivity)
