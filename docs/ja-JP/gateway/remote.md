---
read_when:
    - リモートGatewayセットアップの実行またはトラブルシューティング
summary: SSHトンネル（Gateway WS）と tailnet を使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-24T08:57:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# リモートアクセス（SSH、トンネル、tailnet）

このリポジトリは、専用ホスト（デスクトップ/サーバー）で単一のGateway（マスター）を稼働させ、クライアントをそこに接続することで「SSH経由のリモート」をサポートしています。

- **オペレーター（あなた / macOSアプリ）**向け: SSHトンネリングが汎用的なフォールバックです。
- **ノード（iOS/Android と将来のデバイス）**向け: Gateway **WebSocket** に接続します（必要に応じて LAN/tailnet または SSHトンネルを使用）。

## 中核となる考え方

- Gateway WebSocket は、設定されたポート上の **loopback** にバインドされます（デフォルトは 18789）。
- リモート利用では、その loopback ポートを SSH 経由で転送します（または tailnet/VPN を使ってトンネルを減らします）。

## 一般的なVPN/tailnet構成（エージェントが存在する場所）

**Gatewayホスト** を「エージェントが存在する場所」と考えてください。ここがセッション、auth profile、チャネル、状態を保持します。
あなたのラップトップ/デスクトップ（およびノード）は、そのホストに接続します。

### 1) tailnet 内で常時稼働するGateway（VPS またはホームサーバー）

永続的なホスト上でGatewayを実行し、**Tailscale** または SSH 経由でアクセスします。

- **最適なUX:** `gateway.bind: "loopback"` を維持し、Control UI には **Tailscale Serve** を使用します。
- **フォールバック:** loopback のまま、アクセスが必要な任意のマシンから SSHトンネルを張ります。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単なVM）または [Hetzner](/ja-JP/install/hetzner)（本番用VPS）。

これは、ラップトップが頻繁にスリープする一方で、エージェントを常時稼働させたい場合に理想的です。

### 2) ホームデスクトップでGatewayを実行し、ラップトップをリモートコントロールにする

ラップトップはエージェントを **実行しません**。代わりにリモート接続します。

- macOSアプリの **Remote over SSH** モードを使います（Settings → General → 「OpenClaw runs」）。
- アプリがトンネルを開いて管理するため、WebChat + ヘルスチェックが「そのまま」動作します。

運用手順: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。

### 3) ラップトップでGatewayを実行し、他のマシンからリモートアクセスする

Gatewayはローカルに維持しつつ、安全に公開します。

- 他のマシンからラップトップへ SSHトンネルを張る、または
- Tailscale Serve で Control UI を公開し、Gateway は loopback 専用のままにします。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) および [Web overview](/ja-JP/web)。

## コマンドフロー（何がどこで実行されるか）

1つの gateway service が状態 + チャネルを所有します。ノードは周辺要素です。

フロー例（Telegram → ノード）:

- Telegram メッセージが **Gateway** に到着します。
- Gateway が **agent** を実行し、ノードツールを呼び出すかどうかを判断します。
- Gateway は Gateway WebSocket（`node.*` RPC）経由で **ノード** を呼び出します。
- ノードが結果を返し、Gateway が Telegram に返信します。

注意:

- **ノードは gateway service を実行しません。** 意図的に分離されたプロファイルを動かすのでない限り、ホストごとに実行すべき gateway は1つだけです（[複数のGateway](/ja-JP/gateway/multiple-gateways) を参照）。
- macOSアプリの「node mode」は、Gateway WebSocket 経由のノードクライアントにすぎません。

## SSHトンネル（CLI + ツール）

リモートGateway WS へのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが有効な状態では:

- `openclaw health` と `openclaw status --deep` は、`ws://127.0.0.1:18789` 経由でリモート gateway に到達します。
- 必要に応じて、`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も `--url` を使って転送先URLを対象にできます。

注: `18789` は、設定済みの `gateway.port`（または `--port` / `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
注: `--url` を渡した場合、CLI は config や環境の認証情報にフォールバックしません。
`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。

## CLIのリモートデフォルト

CLIコマンドがデフォルトで利用するように、リモートターゲットを永続化できます。

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

gateway が loopback 専用の場合は、URL を `ws://127.0.0.1:18789` のままにし、先に SSHトンネルを開いてください。

## 認証情報の優先順位

Gateway の認証情報解決は、call/probe/status パスおよび Discord の exec-approval 監視全体で、1つの共有契約に従います。Node-host も同じ基本契約を使いますが、1つだけローカルモードの例外があります（意図的に `gateway.remote.*` を無視します）。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的認証を受け付ける call パスで常に優先されます。
- URLオーバーライドの安全性:
  - CLI の URL オーバーライド（`--url`）は、暗黙の config/env 認証情報を再利用しません。
  - 環境の URL オーバーライド（`OPENCLAW_GATEWAY_URL`）は、env 認証情報のみ（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用できます。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（リモートフォールバックは、ローカル認証トークン入力が未設定の場合にのみ適用されます）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（リモートフォールバックは、ローカル認証パスワード入力が未設定の場合にのみ適用されます）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host のローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモート probe/status のトークンチェックは、デフォルトで厳格です。リモートモードを対象とする場合、`gateway.remote.token` のみを使用します（ローカルトークンへのフォールバックなし）。
- Gateway の環境オーバーライドは `OPENCLAW_GATEWAY_*` のみを使用します。

## SSH経由のChat UI

WebChat は、もはや別個の HTTP ポートを使用しません。SwiftUI チャットUIは、Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（上記参照）、クライアントを `ws://127.0.0.1:18789` に接続してください。
- macOSでは、トンネルを自動管理するアプリの「Remote over SSH」モードを優先してください。

## macOSアプリの「Remote over SSH」

macOSメニューバーアプリは、同じ構成をエンドツーエンドで扱えます（リモートステータスチェック、WebChat、Voice Wake 転送）。

運用手順: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（リモート/VPN）

要約: **bind が本当に必要だと確信していない限り、Gateway は loopback 専用のままにしてください。**

- **Loopback + SSH/Tailscale Serve** が最も安全なデフォルトです（パブリック公開なし）。
- 平文の `ws://` は、デフォルトで loopback 専用です。信頼できるプライベートネットワークでは、
  クライアントプロセス上で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を
  緊急回避策として設定してください。`openclaw.json` 相当はありません。これは
  WebSocket 接続を行うクライアントのプロセス環境である必要があります。
- **非loopback bind**（`lan` / `tailnet` / `custom`、または loopback が使えないときの `auto`）では、gateway auth を使う必要があります: token、password、または `gateway.auth.mode: "trusted-proxy"` を持つ identity-aware reverse proxy。
- `gateway.remote.token` / `.password` はクライアントの認証情報ソースです。これ自体ではサーバー認証を設定しません。
- ローカル call パスでは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定されていて未解決の場合、解決はクローズドフェイルします（リモートフォールバックで隠蔽されません）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモート TLS 証明書をピン留めします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` のとき、identity
  headers を通じて Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントでは
  その Tailscale ヘッダー認証は使用されず、代わりに gateway の通常の HTTP
  auth mode に従います。このトークン不要フローは、gateway host が信頼できることを前提とします。どこでも共有シークレット認証を使いたい場合は、これを
  `false` に設定してください。
- **Trusted-proxy** auth は、非loopback の identity-aware proxy 構成専用です。
  同一ホストの loopback reverse proxy は `gateway.auth.mode: "trusted-proxy"` の条件を満たしません。
- ブラウザ制御はオペレーターアクセスとして扱ってください: tailnet 専用 + 意図的なノードペアリング。

詳細: [Security](/ja-JP/gateway/security)。

### macOS: LaunchAgent による永続SSHトンネル

リモート gateway に接続する macOS クライアントでは、最も簡単な永続構成は、SSH の `LocalForward` 設定エントリと LaunchAgent を使って、再起動やクラッシュ後もトンネルを維持する方法です。

#### ステップ1: SSH設定を追加する

`~/.ssh/config` を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` を実際の値に置き換えてください。

#### ステップ2: SSHキーをコピーする（1回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ3: gateway token を設定する

再起動後も保持されるよう、トークンを config に保存します。

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ステップ4: LaunchAgent を作成する

これを `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` として保存します。

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

#### ステップ5: LaunchAgent を読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動的に開始し、クラッシュ時に再起動し、転送ポートを維持します。

注: 古い構成の `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、それをアンロードして削除してください。

#### トラブルシューティング

トンネルが実行中か確認します。

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止します。

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定エントリ                         | 役割                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送します     |
| `ssh -N`                             | リモートコマンドを実行しない SSH（ポートフォワーディングのみ） |
| `KeepAlive`                          | クラッシュした場合にトンネルを自動的に再起動します           |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれるとトンネルを開始します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [Authentication](/ja-JP/gateway/authentication)
- [Remote gateway setup](/ja-JP/gateway/remote-gateway-readme)
