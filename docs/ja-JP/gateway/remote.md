---
read_when:
    - リモート Gateway セットアップを実行またはトラブルシュートする
summary: SSH トンネル（Gateway WS）と tailnet を使ったリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-26T11:31:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

このリポジトリは、専用ホスト（デスクトップ/サーバー）上で 1 つの Gateway（マスター）を動かし、クライアントをそこへ接続することで「SSH 経由のリモート」をサポートします。

- **operator（あなた / macOS アプリ）** 向け: SSH トンネリングが汎用的なフォールバックです。
- **Node（iOS/Android および将来のデバイス）** 向け: Gateway **WebSocket** に接続します（必要に応じて LAN/tailnet または SSH トンネルを使用）。

## 基本的な考え方

- Gateway WebSocket は、設定されたポート（デフォルトは 18789）の **loopback** に bind します。
- リモート利用では、その loopback ポートを SSH 経由で転送します（または tailnet/VPN を使ってトンネルを減らします）。

## 一般的な VPN/tailnet セットアップ（エージェントが存在する場所）

**Gateway ホスト** を「エージェントが存在する場所」と考えてください。そこがセッション、auth profile、チャネル、state を所有します。
あなたのラップトップ/デスクトップ（および Node）は、そのホストに接続します。

### 1) tailnet 内で常時稼働する Gateway（VPS またはホームサーバー）

永続的なホスト上で Gateway を実行し、**Tailscale** または SSH 経由でアクセスします。

- **最良の UX:** `gateway.bind: "loopback"` を維持し、Control UI には **Tailscale Serve** を使います。
- **フォールバック:** loopback を維持し、アクセスが必要なマシンから SSH トンネルを張ります。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単な VM）または [Hetzner](/ja-JP/install/hetzner)（本番向け VPS）。

これは、ラップトップがしばしばスリープするが、エージェントは常時稼働させたい場合に理想的です。

### 2) ホームデスクトップで Gateway を実行し、ラップトップはリモート操作のみ

ラップトップはエージェントを**実行しません**。代わりにリモート接続します:

- macOS アプリの **Remote over SSH** モードを使用します（Settings → General → 「OpenClaw runs」）。
- アプリがトンネルを開いて管理するため、WebChat + health checks が「そのまま」動作します。

ランブック: [macOS remote access](/ja-JP/platforms/mac/remote)。

### 3) ラップトップで Gateway を実行し、他のマシンからリモートアクセスする

Gateway はローカルに保ちつつ、安全に公開します:

- 他のマシンからラップトップへ SSH トンネルする、または
- Control UI を Tailscale Serve し、Gateway は loopback 専用のままにする。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) および [Web overview](/ja-JP/web)。

## コマンドフロー（どこで何が動くか）

1 つの Gateway service が state + channel を所有します。Node は周辺要素です。

フロー例（Telegram → Node）:

- Telegram メッセージが **Gateway** に到着します。
- Gateway が **agent** を実行し、Node ツールを呼ぶかどうかを決定します。
- Gateway が Gateway WebSocket（`node.*` RPC）経由で **Node** を呼び出します。
- Node が結果を返し、Gateway が Telegram に返信します。

注意:

- **Node は gateway service を実行しません。** 意図的に分離プロファイルを動かしている場合を除き、ホストごとに 1 つの gateway のみを実行するべきです（[Multiple gateways](/ja-JP/gateway/multiple-gateways) を参照）。
- macOS アプリの「node mode」は、Gateway WebSocket 上の Node クライアントにすぎません。

## SSH トンネル（CLI + ツール）

リモート Gateway WS へのローカルトンネルを作成します:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが有効な状態では:

- `openclaw health` と `openclaw status --deep` は、`ws://127.0.0.1:18789` 経由でリモート gateway に到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` で転送先 URL を指定できます。

注意: `18789` は設定した `gateway.port`（または `--port`/`OPENCLAW_GATEWAY_PORT`）に置き換えてください。
注意: `--url` を渡した場合、CLI は config や環境変数の認証情報にフォールバックしません。
`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーになります。

## CLI のリモートデフォルト

CLI コマンドがデフォルトで使うリモートターゲットを永続化できます:

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

Gateway が loopback 専用の場合、URL は `ws://127.0.0.1:18789` のままにして、先に SSH トンネルを開いてください。
macOS アプリの SSH トンネル転送では、検出された gateway hostname は
`gateway.remote.sshTarget` に入ります。`gateway.remote.url` はローカルトンネル URL のままです。

## 認証情報の優先順位

Gateway の認証情報解決は、call/probe/status パスと Discord の exec-approval 監視全体で共有される 1 つの契約に従います。Node ホストも同じ基本契約を使いますが、ローカルモードには 1 つ例外があります（意図的に `gateway.remote.*` を無視します）:

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的認証を受け付ける call パスで常に最優先です。
- URL 上書きの安全性:
  - CLI の URL 上書き（`--url`）では、暗黙の config/env 認証情報は再利用されません。
  - 環境変数の URL 上書き（`OPENCLAW_GATEWAY_URL`）では、env 認証情報のみ使用できます（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（remote フォールバックは、ローカル auth token 入力が未設定の場合にのみ適用）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（remote フォールバックは、ローカル auth password 入力が未設定の場合にのみ適用）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node ホストのローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモートの probe/status における token チェックは、デフォルトで厳格です: リモートモードを対象にするときは `gateway.remote.token` のみを使用し（ローカル token へのフォールバックなし）。
- Gateway の環境変数上書きは `OPENCLAW_GATEWAY_*` のみを使用します。

## SSH 経由のチャット UI

WebChat は、もはや別の HTTP ポートを使用しません。SwiftUI のチャット UI は Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（上記参照）、その後クライアントを `ws://127.0.0.1:18789` に接続してください。
- macOS では、自動的にトンネルを管理するアプリの「Remote over SSH」モードを推奨します。

## macOS アプリの「Remote over SSH」

macOS のメニューバーアプリは、同じセットアップをエンドツーエンドで扱えます（リモート status check、WebChat、Voice Wake 転送）。

ランブック: [macOS remote access](/ja-JP/platforms/mac/remote)。

## セキュリティルール（remote/VPN）

短く言うと: **本当に bind が必要だと確信している場合を除き、Gateway は loopback 専用のままにしてください。**

- **Loopback + SSH/Tailscale Serve** が最も安全なデフォルトです（公開露出なし）。
- 平文の `ws://` はデフォルトで loopback 専用です。信頼できるプライベートネットワークでは、
  クライアントプロセス上で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を
  緊急用として設定してください。`openclaw.json` で同等の設定はありません。これは
  WebSocket 接続を行うクライアントのプロセス環境である必要があります。
- **non-loopback bind**（`lan`/`tailnet`/`custom`、または loopback が使えないときの `auto`）では、gateway auth が必要です: token、password、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware reverse proxy。
- `gateway.remote.token` / `.password` はクライアント側の認証情報ソースです。これ自体ではサーバー auth は設定されません。
- ローカル call パスで `gateway.remote.*` をフォールバックとして使えるのは、`gateway.auth.*` が未設定の場合のみです。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、解決は fail closed します（remote フォールバックによるマスキングなし）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモート TLS 証明書をピン留めします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` の場合、identity
  ヘッダーを使って Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントはその Tailscale ヘッダー認証を使わず、代わりに gateway の通常の HTTP
  auth mode に従います。この token なしフローは、gateway host が信頼されていることを前提とします。共有シークレット auth をどこでも使いたい場合は、これを
  `false` に設定してください。
- **Trusted-proxy** auth は、non-loopback の identity-aware proxy セットアップ専用です。
  同一ホストの loopback reverse proxy は `gateway.auth.mode: "trusted-proxy"` の条件を満たしません。
- ブラウザー制御は operator アクセスとして扱ってください: tailnet 専用 + 意図的な Node ペアリング。

詳しくは: [Security](/ja-JP/gateway/security)。

### macOS: LaunchAgent による永続的な SSH トンネル

リモート gateway に接続する macOS クライアントでは、最も簡単な永続セットアップは、SSH の `LocalForward` 設定エントリーと、再起動やクラッシュをまたいでトンネルを維持する LaunchAgent を使う方法です。

#### ステップ 1: SSH 設定を追加する

`~/.ssh/config` を編集します:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` はあなたの値に置き換えてください。

#### ステップ 2: SSH キーをコピーする（1 回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ 3: Gateway token を設定する

再起動後も保持されるよう、token を設定に保存します:

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

トンネルはログイン時に自動起動し、クラッシュ時に再起動し、転送ポートを常に有効に保ちます。

注意: 古いセットアップの `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、それをアンロードして削除してください。

#### トラブルシューティング

トンネルが実行中かを確認する:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動する:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止する:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config entry                         | What it does                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送します     |
| `ssh -N`                             | リモートコマンドを実行しない SSH（ポート転送のみ）          |
| `KeepAlive`                          | クラッシュ時にトンネルを自動再起動します                     |
| `RunAtLoad`                          | LaunchAgent の読み込み時に、ログイン時からトンネルを開始します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモート Gateway セットアップ](/ja-JP/gateway/remote-gateway-readme)
