---
read_when:
    - IPC コントラクトやメニューバーアプリの IPC を編集する場合
summary: OpenClaw アプリ、Gateway ノード転送、PeekabooBridge のための macOS IPC アーキテクチャ
title: macOS IPC
x-i18n:
    generated_at: "2026-04-05T12:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC architecture

**現在のモデル:** ローカル Unix ソケットにより、**node host service** と **macOS app** が exec 承認および `system.run` のために接続されます。`openclaw-mac` デバッグ CLI は discovery/connect チェック用に存在します。エージェントアクションは引き続き Gateway WebSocket と `node.invoke` を通って流れます。UI オートメーションには PeekabooBridge を使用します。

## 目的

- すべての TCC 関連処理（通知、画面収録、マイク、音声、AppleScript）を所有する単一の GUI アプリインスタンス。
- オートメーション向けの小さなサーフェス: Gateway + node コマンド、および UI オートメーション用の PeekabooBridge。
- 予測可能な権限: 常に同じ署名済み bundle ID を使い、launchd によって起動されるため、TCC 付与が維持されます。

## 仕組み

### Gateway + node 転送

- アプリは Gateway（local mode）を実行し、ノードとしてそれに接続します。
- エージェントアクションは `node.invoke` 経由で実行されます（例: `system.run`、`system.notify`、`canvas.*`）。

### Node service + app IPC

- ヘッドレス node host service が Gateway WebSocket に接続します。
- `system.run` リクエストは、ローカル Unix ソケット経由で macOS app に転送されます。
- アプリは UI コンテキストで exec を実行し、必要に応じて確認を求め、出力を返します。

図（SCI）:

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI オートメーション）

- UI オートメーションでは、`bridge.sock` という名前の別の UNIX ソケットと PeekabooBridge JSON プロトコルを使用します。
- ホストの優先順（クライアント側）: Peekaboo.app → Claude.app → OpenClaw.app → ローカル実行。
- セキュリティ: bridge host には許可された TeamID が必要です。DEBUG 専用の same-UID エスケープハッチは `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` によってガードされます（Peekaboo の慣例）。
- 詳細は [PeekabooBridge usage](/platforms/mac/peekaboo) を参照してください。

## 運用フロー

- 再起動/再ビルド: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 既存インスタンスを終了
  - Swift build + package
  - LaunchAgent を書き込み/ブートストラップ/キックスタート
- 単一インスタンス: 同じ bundle ID の別インスタンスが実行中の場合、アプリは早期終了します。

## hardening に関する注意

- すべての特権サーフェスで TeamID 一致を要求することを推奨します。
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（DEBUG 専用）は、ローカル開発用に same-UID 呼び出し元を許可する場合があります。
- 通信はすべてローカル限定のままです。ネットワークソケットは公開されません。
- TCC プロンプトは GUI app bundle からのみ発生します。再ビルドをまたいで署名済み bundle ID を安定させてください。
- IPC hardening: ソケットモード `0600`、token、peer-UID チェック、HMAC challenge/response、短い TTL。
