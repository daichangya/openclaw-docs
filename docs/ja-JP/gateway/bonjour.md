---
read_when:
    - macOS/iOSでのBonjour検出の問題のデバッグ
    - mDNSサービス種別、TXTレコード、または検出UXの変更
summary: Bonjour/mDNS の検出とデバッグ（Gatewayビーコン、クライアント、一般的な障害モード）
title: Bonjour の検出
x-i18n:
    generated_at: "2026-04-24T08:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS の検出

OpenClawは、アクティブなGateway（WebSocketエンドポイント）を検出するためにBonjour（mDNS / DNS‑SD）を使用します。
マルチキャストの`local.`ブラウズは**LAN限定の利便機能**です。バンドルされている`bonjour`
PluginがLAN広告を担当し、デフォルトで有効になっています。ネットワークをまたぐ検出では、
同じビーコンを設定済みの広域DNS-SDドメイン経由で公開することもできます。
検出はあくまでベストエフォートであり、SSHやTailnetベースの接続の代替には**なりません**。

## Tailscale経由の広域Bonjour（ユニキャストDNS-SD）

Nodeとgatewayが異なるネットワーク上にある場合、マルチキャストmDNSはその境界を越えません。
その場合でも、Tailscale経由の**ユニキャストDNS‑SD**（「広域Bonjour」）に切り替えることで、
同じ検出UXを維持できます。

大まかな手順:

1. gatewayホスト上でDNSサーバーを実行する（Tailnet経由で到達可能にする）。
2. 専用ゾーン配下に`_openclaw-gw._tcp`のDNS‑SDレコードを公開する
   （例: `openclaw.internal.`）。
3. 選択したドメインがそのDNSサーバー経由でクライアント（iOSを含む）に解決されるよう、
   Tailscaleの**split DNS**を設定する。

OpenClawは任意の検出ドメインをサポートします。`openclaw.internal.`は単なる例です。
iOS/Android Nodeは`local.`と設定された広域ドメインの両方をブラウズします。

### Gateway設定（推奨）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet専用（推奨）
  discovery: { wideArea: { enabled: true } }, // 広域DNS-SD公開を有効化
}
```

### 1回限りのDNSサーバー設定（gatewayホスト）

```bash
openclaw dns setup --apply
```

これによりCoreDNSがインストールされ、次のように設定されます:

- gatewayのTailscaleインターフェース上でのみポート53をlistenする
- `~/.openclaw/dns/<domain>.db`から選択したドメイン（例: `openclaw.internal.`）を提供する

Tailnet接続済みマシンから検証します:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS設定

Tailscale管理コンソールで次を行います:

- gatewayのtailnet IPを向くネームサーバー（UDP/TCP 53）を追加する。
- 検出ドメインがそのネームサーバーを使うようにsplit DNSを追加する。

クライアントがtailnet DNSを受け入れると、iOS NodeとCLI検出は
マルチキャストなしで検出ドメイン内の`_openclaw-gw._tcp`をブラウズできます。

### Gatewayリスナーのセキュリティ（推奨）

GatewayのWSポート（デフォルト`18789`）は、デフォルトでloopbackにbindされます。LAN/tailnet
アクセスでは、明示的にbindし、認証を有効のままにしてください。

tailnet専用セットアップの場合:

- `~/.openclaw/openclaw.json`で`gateway.bind: "tailnet"`を設定する。
- Gatewayを再起動する（またはmacOSメニューバーアプリを再起動する）。

## 何が広告されるか

`_openclaw-gw._tcp`を広告するのはGatewayだけです。LANマルチキャスト広告は
バンドルされた`bonjour` Pluginによって提供され、広域DNS-SD公開は引き続き
Gatewayが管理します。

## サービス種別

- `_openclaw-gw._tcp` — gateway転送ビーコン（macOS/iOS/Android Nodeで使用）。

## TXTキー（秘密ではないヒント）

Gatewayは、UIフローを便利にするために、小さな非秘密ヒントを広告します:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（TLSが有効な場合のみ）
- `gatewayTlsSha256=<sha256>`（TLSが有効でフィンガープリントが利用可能な場合のみ）
- `canvasPort=<port>`（canvasホストが有効な場合のみ。現在は`gatewayPort`と同じ）
- `transport=gateway`
- `tailnetDns=<magicdns>`（mDNSフルモードのみ。Tailnetが利用可能な場合の任意ヒント）
- `sshPort=<port>`（mDNSフルモードのみ。広域DNS-SDでは省略される場合があります）
- `cliPath=<path>`（mDNSフルモードのみ。広域DNS-SDでもリモートインストール用ヒントとして書き込まれます）

セキュリティに関する注意:

- Bonjour/mDNSのTXTレコードは**認証されません**。クライアントはTXTを権威あるルーティング情報として扱ってはいけません。
- クライアントは、解決されたサービスエンドポイント（SRV + A/AAAA）を使ってルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256`はヒントとしてのみ扱ってください。
- SSHの自動ターゲティングも同様に、TXTのみのヒントではなく、解決されたサービスホストを使う必要があります。
- TLSピンニングでは、広告された`gatewayTlsSha256`が以前に保存されたピンを上書きできてはなりません。
- iOS/Android Nodeは、検出ベースの直接接続を**TLS専用**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

## macOSでのデバッグ

便利な組み込みツール:

- インスタンスをブラウズする:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1つのインスタンスを解決する（`<instance>`を置き換え）:

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは機能するのに解決に失敗する場合、通常はLANポリシーまたは
mDNSリゾルバーの問題です。

## Gatewayログでのデバッグ

Gatewayはローテーションログファイルを出力します（起動時に
`gateway log file: ...`として表示されます）。特に次の`bonjour:`行を確認してください:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS Nodeでのデバッグ

iOS Nodeは`NWBrowser`を使用して`_openclaw-gw._tcp`を検出します。

ログを取得するには:

- 設定 → Gateway → 詳細設定 → **Discovery Debug Logs**
- 設定 → Gateway → 詳細設定 → **Discovery Logs** → 再現 → **Copy**

ログには、ブラウザーの状態遷移と結果セットの変更が含まれます。

## 一般的な障害モード

- **Bonjourはネットワークをまたげない**: TailnetまたはSSHを使用してください。
- **マルチキャストがブロックされている**: 一部のWi‑FiネットワークではmDNSが無効化されています。
- **スリープ / インターフェース変動**: macOSは一時的にmDNS結果を失うことがあります。再試行してください。
- **ブラウズは機能するが解決に失敗する**: マシン名はシンプルに保ってください（絵文字や
  句読点は避ける）。その後、Gatewayを再起動してください。サービスインスタンス名は
  ホスト名から派生するため、複雑すぎる名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS‑SDでは、サービスインスタンス名のバイトが10進`\DDD`
シーケンスとしてエスケープされることがあります（例: スペースは`\032`になります）。

- これはプロトコルレベルでは正常です。
- UIは表示用にデコードする必要があります（iOSでは`BonjourEscapes.decode`を使用）。

## 無効化 / 設定

- `openclaw plugins disable bonjour`は、バンドルされたPluginを無効化することでLANマルチキャスト広告を無効にします。
- `openclaw plugins enable bonjour`は、デフォルトのLAN検出Pluginを復元します。
- `OPENCLAW_DISABLE_BONJOUR=1`は、Plugin設定を変更せずにLANマルチキャスト広告を無効にします。受け付けるtruthy値は`1`、`true`、`yes`、`on`です（旧: `OPENCLAW_DISABLE_BONJOUR`）。
- `~/.openclaw/openclaw.json`内の`gateway.bind`はGatewayのbindモードを制御します。
- `OPENCLAW_SSH_PORT`は、`sshPort`が広告されるときのSSHポートを上書きします（旧: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS`は、mDNSフルモードが有効な場合にTXT内へMagicDNSヒントを公開します（旧: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH`は、広告されるCLIパスを上書きします（旧: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- 検出ポリシーと転送選択: [Discovery](/ja-JP/gateway/discovery)
- Nodeのペアリング + approvals: [Gateway pairing](/ja-JP/gateway/pairing)
