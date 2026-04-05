---
read_when:
    - OpenClaw.appでPeekabooBridgeをホストする場合
    - Swift Package Manager経由でPeekabooを統合する場合
    - PeekabooBridgeのプロトコル/パスを変更する場合
summary: macOS UI自動化向けのPeekabooBridge統合
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T12:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge（macOS UI自動化）

OpenClawは、ローカルで権限を考慮したUI自動化ブローカーとして **PeekabooBridge** をホストできます。
これにより、`peekaboo` CLIはmacOSアプリのTCC権限を再利用しながらUI自動化を操作できます。

## これは何で、何ではないか

- **ホスト**: OpenClaw.appはPeekabooBridgeホストとして動作できます。
- **クライアント**: `peekaboo` CLIを使用します（別個の `openclaw ui ...` インターフェースはありません）。
- **UI**: 視覚的なオーバーレイはPeekaboo.app側に残り、OpenClawは薄いブローカーホストです。

## ブリッジを有効にする

macOSアプリ内で:

- Settings → **Enable Peekaboo Bridge**

有効にすると、OpenClawはローカルのUNIXソケットサーバーを起動します。無効にすると、ホストは停止し、`peekaboo` は利用可能なほかのホストにフォールバックします。

## クライアント検出順序

Peekabooクライアントは通常、次の順序でホストを試します:

1. Peekaboo.app（完全なUX）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄いブローカー）

どのホストがアクティブで、どのソケットパスが使われているかを確認するには、`peekaboo bridge status --verbose` を使用してください。次のようにして上書きすることもできます:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは**呼び出し元のコード署名**を検証します。TeamIDのallowlist
  （PeekabooホストのTeamID + OpenClawアプリのTeamID）が適用されます。
- リクエストは約10秒でタイムアウトします。
- 必要な権限が不足している場合、ブリッジはSystem Settingsを起動するのではなく、明確なエラーメッセージを返します。

## スナップショットの動作（自動化）

スナップショットはメモリ内に保存され、短時間後に自動的に失効します。
より長く保持したい場合は、クライアントから再取得してください。

## トラブルシューティング

- `peekaboo` が「bridge client is not authorized」と報告する場合、クライアントが適切に署名されていることを確認するか、**debug** モードでのみ `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  を設定してホストを実行してください。
- ホストが見つからない場合は、ホストアプリのいずれか（Peekaboo.app または OpenClaw.app）
  を開き、権限が付与されていることを確認してください。
