---
read_when:
    - リモートgatewayセットアップを実行またはトラブルシューティングする場合
summary: SSHトンネル（Gateway WS）とtailnetを使ったリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-25T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

このリポジトリは、「SSH経由のリモート」を、専用ホスト（デスクトップ/サーバー）上で単一のGateway（マスター）を動かし、クライアントをそこへ接続することでサポートします。

- **operator（あなた / macOSアプリ）**向け: SSHトンネリングが汎用的なフォールバックです。
- **Node（iOS/Androidおよび将来のデバイス）**向け: **WebSocket**でGatewayに接続します（必要に応じてLAN/tailnetまたはSSHトンネルを使用）。

## 基本の考え方

- Gateway WebSocketは、設定されたポート（デフォルトは18789）の**loopback**にバインドします。
- リモート利用では、そのloopbackポートをSSHで転送します（またはtailnet/VPNを使ってトンネルを減らします）。

## よくあるVPN/tailnetセットアップ（エージェントが動作する場所）

**Gatewayホスト**を「エージェントが生きている場所」と考えてください。そこがセッション、認証プロファイル、チャネル、状態を所有します。
あなたのノートPC/デスクトップ（およびNode）は、そのホストへ接続します。

### 1) tailnet内で常時稼働するGateway（VPSまたはホームサーバー）

永続ホスト上でGatewayを実行し、**Tailscale**またはSSH経由でアクセスします。

- **最良のUX:** `gateway.bind: "loopback"`のまま、Control UIには**Tailscale Serve**を使います。
- **フォールバック:** loopbackのまま、アクセスが必要な任意のマシンからSSHトンネルを張ります。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単なVM）または[Hetzner](/ja-JP/install/hetzner)（本番VPS）。

これは、ノートPCが頻繁にスリープしても、エージェントは常時稼働させたい場合に最適です。

### 2) 自宅デスクトップがGatewayを実行し、ノートPCがリモート操作する

ノートPCはエージェントを**実行しません**。代わりにリモート接続します。

- macOSアプリの**Remote over SSH**モードを使います（Settings → General → 「OpenClaw runs」）。
- アプリがトンネルを開いて管理するため、WebChat + ヘルスチェックが「そのまま」動作します。

Runbook: [macOS remote access](/ja-JP/platforms/mac/remote)

### 3) ノートPCがGatewayを実行し、他のマシンからリモートアクセスする

Gatewayをローカルに維持しつつ、安全に公開します。

- 他のマシンからノートPCへSSHトンネルを張る、または
- Tailscale ServeでControl UIを公開し、Gatewayはloopback専用のままにする。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) と [Web overview](/ja-JP/web)

## コマンドフロー（どこで何が動くか）

1つのgateway serviceが状態 + チャネルを所有します。Nodeは周辺装置です。

フロー例（Telegram → Node）:

- Telegramメッセージが**Gateway**に到着します。
- Gatewayが**agent**を実行し、Nodeツールを呼ぶかどうかを判断します。
- GatewayがGateway WebSocket（`node.*` RPC）経由で**Node**を呼び出します。
- Nodeが結果を返し、GatewayがTelegramへ返信します。

注:

- **Nodeはgateway serviceを実行しません。** 意図的に分離プロファイルを実行する場合を除き、ホストごとに実行するgatewayは1つだけにすべきです（[Multiple gateways](/ja-JP/gateway/multiple-gateways)を参照）。
- macOSアプリの「node mode」は、Gateway WebSocket経由の単なるNodeクライアントです。

## SSHトンネル（CLI + ツール）

リモートGateway WSへのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが有効な状態では:

- `openclaw health`と`openclaw status --deep`は、`ws://127.0.0.1:18789`経由でリモートgatewayに到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call`も、必要に応じて`--url`で転送先URLを指定できます。

注: `18789`は、設定した`gateway.port`（または`--port`/`OPENCLAW_GATEWAY_PORT`）に置き換えてください。
注: `--url`を渡した場合、CLIは設定や環境変数の認証情報へフォールバックしません。
`--token`または`--password`を明示的に含めてください。明示的な認証情報がない場合はエラーです。

## CLIのリモートデフォルト

リモートターゲットを永続化すると、CLIコマンドがデフォルトでそれを使用できます。

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

gatewayがloopback専用の場合は、URLを`ws://127.0.0.1:18789`のままにし、先にSSHトンネルを開いてください。

## 認証情報の優先順位

Gateway認証情報の解決は、call/probe/status経路およびDiscord exec承認監視全体で、1つの共通契約に従います。node-hostも同じ基本契約を使いますが、ローカルモードでは1つ例外があります（意図的に`gateway.remote.*`を無視します）。

- 明示的な認証情報（`--token`、`--password`、またはツールの`gatewayToken`）は、明示認証を受け付けるcall経路で常に最優先されます。
- URL上書きの安全性:
  - CLIのURL上書き（`--url`）では、暗黙の設定/環境変数認証情報を再利用しません。
  - 環境変数URL上書き（`OPENCLAW_GATEWAY_URL`）では、環境変数認証情報のみを使えます（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（リモートへのフォールバックは、ローカル認証トークン入力が未設定の場合にのみ適用）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（リモートへのフォールバックは、ローカル認証パスワード入力が未設定の場合にのみ適用）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- node-hostのローカルモード例外: `gateway.remote.token` / `gateway.remote.password`は無視されます。
- リモートprobe/statusのトークンチェックはデフォルトで厳格です。リモートモードを対象にする場合、`gateway.remote.token`のみを使用します（ローカルトークンへのフォールバックなし）。
- Gateway環境変数上書きでは`OPENCLAW_GATEWAY_*`のみを使用します。

## SSH経由のチャットUI

WebChatはもはや別のHTTPポートを使いません。SwiftUIチャットUIはGateway WebSocketへ直接接続します。

- 18789をSSH経由で転送し（上記参照）、その後クライアントを`ws://127.0.0.1:18789`へ接続します。
- macOSでは、トンネルを自動管理するアプリの「Remote over SSH」モードを推奨します。

## macOSアプリの「Remote over SSH」

macOSメニューバーアプリは、同じセットアップ全体をエンドツーエンドで扱えます（リモートステータスチェック、WebChat、Voice Wake転送）。

Runbook: [macOS remote access](/ja-JP/platforms/mac/remote)

## セキュリティルール（remote/VPN）

短く言うと: 必要性を確信していない限り、**Gatewayはloopback専用**に保ってください。

- **loopback + SSH/Tailscale Serve**が最も安全なデフォルトです（公開露出なし）。
- 平文`ws://`は、デフォルトでloopback専用です。信頼できるプライベートネットワークでは、
  緊急回避手段としてクライアントプロセスに
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`を設定します。`openclaw.json`に相当する設定はありません。これはWebSocket接続を行うクライアントプロセスの
  環境変数でなければなりません。
- **非loopback bind**（`lan` / `tailnet` / `custom`、またはloopbackが利用できないときの`auto`）では、gateway authが必要です: token、password、または`gateway.auth.mode: "trusted-proxy"`を使うidentity-aware reverse proxy。
- `gateway.remote.token` / `.password`はクライアント側の認証情報ソースです。これだけではサーバー認証を構成しません。
- ローカルcall経路では、`gateway.auth.*`が未設定のときにのみ`gateway.remote.*`をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRef経由で明示設定され、未解決の場合、解決はフェイルクローズドになります（リモートフォールバックで隠蔽されません）。
- `gateway.remote.tlsFingerprint`は、`wss://`使用時にリモートTLS証明書をピン留めします。
- **Tailscale Serve**は、`gateway.auth.allowTailscale: true`のとき、identity
  ヘッダー経由でControl UI/WebSocketトラフィックを認証できます。HTTP APIエンドポイントはこのTailscaleヘッダー認証を使わず、代わりにgatewayの通常のHTTP
  auth modeに従います。このトークンレスフローは、gatewayホストが信頼されている前提です。どこでも共有シークレット認証を使いたい場合は`false`に設定してください。
- **trusted-proxy** authは、非loopbackのidentity-aware proxyセットアップ専用です。
  同一ホストのloopback reverse proxyは`gateway.auth.mode: "trusted-proxy"`の要件を満たしません。
- ブラウザ制御はoperatorアクセス同様に扱ってください: tailnet専用 + 意図的なNodeペアリング。

詳細: [Security](/ja-JP/gateway/security)

### macOS: LaunchAgentによる永続SSHトンネル

リモートgatewayへ接続するmacOSクライアントでは、最も簡単な永続セットアップは、SSH `LocalForward`設定エントリと、再起動やクラッシュ後もトンネルを維持するLaunchAgentを組み合わせる方法です。

#### 手順1: SSH設定を追加

`~/.ssh/config`を編集します:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`と`<REMOTE_USER>`を実際の値に置き換えてください。

#### 手順2: SSHキーをコピー（1回だけ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 手順3: gateway tokenを設定

再起動後も保持されるよう、設定にトークンを保存します:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 手順4: LaunchAgentを作成

これを`~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`として保存します:

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

#### 手順5: LaunchAgentを読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動起動し、クラッシュ時に再起動し、転送ポートを維持します。

注: 古いセットアップの`com.openclaw.ssh-tunnel` LaunchAgentが残っている場合は、アンロードして削除してください。

#### トラブルシューティング

トンネルが動作中か確認:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定エントリ | 役割 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート18789をリモートポート18789へ転送               |
| `ssh -N`                             | リモートコマンドを実行しないSSH（ポート転送専用） |
| `KeepAlive`                          | クラッシュ時にトンネルを自動再起動              |
| `RunAtLoad`                          | ログイン時にLaunchAgentが読み込まれるとトンネルを起動        |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [Authentication](/ja-JP/gateway/authentication)
- [Remote gateway setup](/ja-JP/gateway/remote-gateway-readme)
