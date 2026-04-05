---
read_when:
    - リモート Gateway セットアップを実行またはトラブルシューティングしている
summary: SSH トンネル（Gateway WS）と tailnet を使ったリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-05T12:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# リモートアクセス（SSH、トンネル、tailnet）

このリポジトリは、専用ホスト（デスクトップ / サーバー）上で単一の Gateway（マスター）を稼働させ、クライアントをそこへ接続することで、「SSH 経由のリモート」をサポートしています。

- **オペレーター（あなた / macOS アプリ）**向け: SSH トンネリングが普遍的なフォールバックです。
- **ノード（iOS / Android および将来のデバイス）**向け: 必要に応じて LAN / tailnet または SSH トンネル経由で Gateway **WebSocket** に接続します。

## コアとなる考え方

- Gateway WebSocket は、設定されたポートで **loopback** にバインドします（デフォルトは 18789）。
- リモート利用では、その loopback ポートを SSH 経由で転送します（または tailnet / VPN を使ってトンネルを減らします）。

## 一般的な VPN / tailnet セットアップ（エージェントが存在する場所）

**Gateway ホスト**を「エージェントが存在する場所」と考えてください。そこがセッション、認証プロファイル、チャンネル、状態を所有します。
あなたのラップトップ / デスクトップ（およびノード）はそのホストに接続します。

### 1) tailnet 内で常時稼働する Gateway（VPS またはホームサーバー）

永続ホスト上で Gateway を実行し、**Tailscale** または SSH 経由でアクセスします。

- **最良の UX:** `gateway.bind: "loopback"` のままにして、Control UI には **Tailscale Serve** を使います。
- **フォールバック:** loopback のままにして、アクセスが必要なマシンから SSH トンネルを張ります。
- **例:** [exe.dev](/install/exe-dev)（簡単な VM）または [Hetzner](/install/hetzner)（本番用 VPS）。

これは、ラップトップが頻繁にスリープしても、エージェントは常時稼働させたい場合に最適です。

### 2) ホームデスクトップで Gateway を実行し、ラップトップはリモート制御だけを行う

ラップトップはエージェントを実行しません。リモート接続のみを行います。

- macOS アプリの **Remote over SSH** モードを使用します（設定 → 一般 → 「OpenClaw runs」）。
- アプリがトンネルを開いて管理するため、WebChat とヘルスチェックが「そのまま」動作します。

手順書: [macOS remote access](/platforms/mac/remote)。

### 3) ラップトップで Gateway を実行し、他のマシンからリモートアクセスする

Gateway をローカルに維持しつつ、安全に公開します。

- 他のマシンからラップトップへ SSH トンネルを張る、または
- Control UI を Tailscale Serve し、Gateway は loopback 専用のままにする。

ガイド: [Tailscale](/gateway/tailscale) と [Web overview](/web)。

## コマンドフロー（何がどこで動くか）

1 つの gateway service が state とチャンネルを所有します。ノードは周辺機器です。

フロー例（Telegram → ノード）:

- Telegram メッセージが **Gateway** に到着する。
- Gateway が **エージェント** を実行し、ノードツールを呼ぶかどうかを判断する。
- Gateway が Gateway WebSocket（`node.*` RPC）経由で **ノード** を呼び出す。
- ノードが結果を返し、Gateway が Telegram に返信を返す。

注意:

- **ノードは gateway service を実行しません。** 分離されたプロファイルを意図的に実行する場合を除き、ホストごとに実行すべき gateway は 1 つだけです（[Multiple gateways](/gateway/multiple-gateways) を参照）。
- macOS アプリの「node mode」は、Gateway WebSocket 経由の単なるノードクライアントです。

## SSH トンネル（CLI + ツール）

リモート Gateway WS へのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネル起動中は:

- `openclaw health` と `openclaw status --deep` は `ws://127.0.0.1:18789` 経由でリモート gateway に到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` で転送先 URL を指定できます。

注意: `18789` は設定した `gateway.port`（または `--port` / `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
注意: `--url` を渡した場合、CLI は設定や環境変数の資格情報にフォールバックしません。
`--token` または `--password` を明示的に含めてください。明示的な資格情報がない場合はエラーになります。

## CLI のリモートデフォルト

リモートターゲットを永続化すれば、CLI コマンドがデフォルトでそれを使うようにできます。

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

gateway が loopback 専用の場合、URL は `ws://127.0.0.1:18789` のままにし、先に SSH トンネルを開いてください。

## 資格情報の優先順位

Gateway の資格情報解決は、call / probe / status パスと Discord の exec 承認監視で、共通の契約に従います。node-host は同じ基本契約を使いますが、ローカルモードに 1 つ例外があります（意図的に `gateway.remote.*` を無視します）。

- 明示的な資格情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示認証を受け付ける call パスでは常に最優先です。
- URL 上書きの安全性:
  - CLI の URL 上書き（`--url`）では、暗黙の設定 / 環境変数の資格情報は再利用されません。
  - 環境変数の URL 上書き（`OPENCLAW_GATEWAY_URL`）では、環境変数の資格情報のみ使用できます（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（ローカル認証トークン入力が未設定の場合にのみ remote fallback が適用されます）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（ローカル認証パスワード入力が未設定の場合にのみ remote fallback が適用されます）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- node-host のローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモート probe / status のトークンチェックは、デフォルトで厳格です。remote mode を対象にする場合、`gateway.remote.token` のみを使います（ローカルトークンへのフォールバックはありません）。
- Gateway の環境変数上書きでは `OPENCLAW_GATEWAY_*` のみを使用します。

## SSH 経由のチャット UI

WebChat はもう別の HTTP ポートを使いません。SwiftUI のチャット UI は Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（上記参照）、その後クライアントを `ws://127.0.0.1:18789` に接続します。
- macOS では、自動的にトンネルを管理するアプリの「Remote over SSH」モードを推奨します。

## macOS アプリの「Remote over SSH」

macOS メニューバーアプリは、同じセットアップをエンドツーエンドで扱えます（リモートステータスチェック、WebChat、Voice Wake 転送）。

手順書: [macOS remote access](/platforms/mac/remote)。

## セキュリティルール（remote / VPN）

短く言うと: bind が本当に必要だと確信できるまでは、**Gateway は loopback 専用のまま**にしてください。

- **loopback + SSH / Tailscale Serve** が最も安全なデフォルトです（公開されません）。
- 平文の `ws://` はデフォルトで loopback 専用です。信頼できるプライベートネットワークでは、
  緊急回避策としてクライアントプロセスで `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。
- **loopback 以外への bind**（`lan` / `tailnet` / `custom`、または loopback が使えないときの `auto`）では、Gateway auth を使う必要があります: token、password、または `gateway.auth.mode: "trusted-proxy"` を使う正しく設定された identity-aware reverse proxy。
- `gateway.remote.token` / `.password` はクライアント側の資格情報ソースです。これだけではサーバー側認証は設定されません。
- ローカル call パスでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されていて未解決の場合、解決はフェイルクローズします（remote fallback で隠蔽されません）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモート TLS 証明書をピン留めします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` のとき、identity
  ヘッダーを使って Control UI / WebSocket トラフィックを認証できます。HTTP API エンドポイントでは
  この Tailscale ヘッダー認証は使われず、代わりに gateway の通常の HTTP
  認証モードに従います。このトークン不要フローは、gateway host が信頼されていることを前提にしています。どこでも shared-secret 認証を使いたい場合は、これを `false` に設定してください。
- **trusted-proxy** 認証は、loopback 以外の identity-aware proxy セットアップ専用です。
  同一ホストの loopback reverse proxy は `gateway.auth.mode: "trusted-proxy"` を満たしません。
- browser control はオペレーターアクセスとして扱ってください: tailnet 専用 + 意図的なノードペアリング。

詳細: [Security](/gateway/security)。

### macOS: LaunchAgent による永続 SSH トンネル

リモート gateway に接続する macOS クライアントでは、再起動やクラッシュをまたいでトンネルを維持する最も簡単な方法は、SSH の `LocalForward` 設定エントリーと、それを維持する LaunchAgent を使うことです。

#### ステップ 1: SSH 設定を追加する

`~/.ssh/config` を編集します:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` は実際の値に置き換えてください。

#### ステップ 2: SSH キーをコピーする（1 回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ 3: gateway token を設定する

再起動後も保持されるよう、設定に token を保存します。

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ステップ 4: LaunchAgent を作成する

これを `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` として保存します:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### ステップ 5: LaunchAgent を読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動起動し、クラッシュ時には再起動し、転送ポートを維持します。

注意: 古いセットアップの `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、アンロードして削除してください。

#### トラブルシューティング

トンネルが動作中か確認します:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動します:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止します:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config entry                         | 機能 |
| ------------------------------------ | ---- |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送する |
| `ssh -N`                             | リモートコマンドを実行しない SSH（ポート転送のみ） |
| `KeepAlive`                          | クラッシュ時にトンネルを自動再起動する |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれたときトンネルを開始する |
