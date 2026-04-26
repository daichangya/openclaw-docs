---
read_when:
    - macOS/iOSでBonjour検出の問題をデバッグする
    - mDNSのサービスタイプ、TXTレコード、または検出UXを変更する
summary: Bonjour/mDNS検出とデバッグ（Gatewayビーコン、クライアント、よくある障害モード）
title: Bonjour検出
x-i18n:
    generated_at: "2026-04-26T11:28:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS検出

OpenClawは、アクティブなGateway（WebSocketエンドポイント）を検出するためにBonjour（mDNS / DNS‑SD）を使用します。
マルチキャスト `local.` ブラウジングは **LAN専用の利便機能** です。バンドルされた `bonjour`
PluginがLAN広告を担当し、デフォルトで有効です。ネットワークをまたぐ検出については、
同じビーコンを設定済みの広域DNS-SDドメイン経由で公開することもできます。
ただし、検出はあくまでベストエフォートであり、SSHやTailnetベースの接続の代替にはなりません。

## Tailscale上の広域Bonjour（Unicast DNS-SD）

nodeとgatewayが別ネットワーク上にある場合、マルチキャストmDNSはその境界を越えません。
その場合、Tailscale上の **unicast DNS‑SD**
（「Wide‑Area Bonjour」）に切り替えることで、同じ検出UXを維持できます。

大まかな手順:

1. gatewayホスト上でDNSサーバーを実行します（Tailnet経由で到達可能であること）。
2. 専用ゾーン配下で `_openclaw-gw._tcp` のDNS‑SDレコードを公開します
   （例: `openclaw.internal.`）。
3. 選択したドメインがそのDNSサーバー経由で解決されるように、Tailscaleの **split DNS** を設定します
   （iOSを含むクライアント向け）。

OpenClawは任意の検出ドメインをサポートします。`openclaw.internal.` はあくまで例です。
iOS/Androidのnodeは、`local.` と設定済みの広域ドメインの両方をブラウズします。

### Gateway設定（推奨）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet専用（推奨）
  discovery: { wideArea: { enabled: true } }, // 広域DNS-SD公開を有効化
}
```

### 一度だけ必要なDNSサーバー設定（gatewayホスト）

```bash
openclaw dns setup --apply
```

これによりCoreDNSがインストールされ、次のように設定されます。

- gatewayのTailscaleインターフェース上でのみ、ポート53をリッスン
- 選択したドメイン（例: `openclaw.internal.`）を `~/.openclaw/dns/<domain>.db` から提供

tailnet接続済みマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS設定

Tailscale管理コンソールで:

- gatewayのtailnet IP（UDP/TCP 53）を指すネームサーバーを追加します。
- 検出ドメインがそのネームサーバーを使うようにsplit DNSを追加します。

クライアントがtailnet DNSを受け入れると、iOSのnodeとCLI検出は、
マルチキャストなしで検出ドメイン内の `_openclaw-gw._tcp` をブラウズできます。

### Gatewayリスナーのセキュリティ（推奨）

GatewayのWSポート（デフォルト `18789`）は、デフォルトではloopbackにバインドされます。LAN/tailnet
アクセス用には、明示的にbindし、認証を有効なままにしてください。

tailnet専用構成の場合:

- `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
- Gatewayを再起動します（またはmacOSメニューバーアプリを再起動します）。

## 何が広告されるか

`_openclaw-gw._tcp` を広告するのはGatewayだけです。LANマルチキャスト広告は
バンドルされた `bonjour` Pluginによって提供され、広域DNS-SD公開は引き続き
Gatewayが担当します。

## サービスタイプ

- `_openclaw-gw._tcp` — gateway転送ビーコン（macOS/iOS/Androidのnodeで使用）。

## TXTキー（秘密ではないヒント）

Gatewayは、UIフローを便利にするために、小さな非秘密ヒントを広告します。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS有効時のみ)
- `gatewayTlsSha256=<sha256>` (TLS有効時かつフィンガープリントが利用可能な場合のみ)
- `canvasPort=<port>` (canvas host有効時のみ。現在は `gatewayPort` と同じ)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS full mode時のみ。Tailnetが利用可能な場合の任意ヒント)
- `sshPort=<port>` (mDNS full mode時のみ。広域DNS-SDでは省略されることがあります)
- `cliPath=<path>` (mDNS full mode時のみ。広域DNS-SDでもリモートインストールヒントとして書き込まれます)

セキュリティに関する注意:

- Bonjour/mDNSのTXTレコードは **認証されません**。クライアントはTXTを信頼できるルーティング情報として扱ってはいけません。
- クライアントは、解決済みサービスエンドポイント（SRV + A/AAAA）を使ってルーティングすべきです。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256` はヒントとしてのみ扱ってください。
- SSH自動ターゲット指定も同様に、TXTだけのヒントではなく、解決済みサービスホストを使うべきです。
- TLSピンニングでは、広告された `gatewayTlsSha256` が以前に保存されたpinを上書きできてはなりません。
- iOS/Androidのnodeは、検出ベースの直接接続を **TLS専用** として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求すべきです。

## macOSでのデバッグ

便利な組み込みツール:

- インスタンスをブラウズする:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1つのインスタンスを解決する（`<instance>` を置き換えてください）:

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

ブラウズは機能するのに解決が失敗する場合、通常はLANポリシーまたは
mDNSリゾルバーの問題です。

## Gatewayログでのデバッグ

Gatewayはローテーションするログファイルを書き込みます（起動時に
`gateway log file: ...` と表示されます）。`bonjour:` 行、特に次のものを確認してください。

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## iOS nodeでのデバッグ

iOSのnodeは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログを取得するには:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 再現 → **Copy**

ログには、browserの状態遷移と結果セットの変化が含まれます。

## Bonjourを無効化するタイミング

Bonjourは、LANマルチキャスト広告が利用できない、または有害な場合にのみ無効化してください。
典型的なのは、Dockerブリッジネットワーク、WSL、または
mDNSマルチキャストを落とすネットワークポリシーの背後でGatewayが動作している場合です。
そのような環境でも、Gatewayには公開URL、SSH、Tailnet、または広域DNS-SD経由で到達できますが、
LAN自動検出は信頼できません。

問題がデプロイメント単位である場合は、既存の環境変数上書きを優先してください。

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

これにより、Plugin設定を変更せずにLANマルチキャスト広告を無効化できます。
この設定は環境変数が消えれば無効になるため、Dockerイメージ、サービスファイル、起動スクリプト、一時的な
デバッグに安全です。

特定のOpenClaw設定で、バンドルされたLAN検出Pluginを意図的に無効化したい場合にのみ、
Plugin設定を使用してください。

```bash
openclaw plugins disable bonjour
```

## Dockerの落とし穴

バンドルされたDocker Composeでは、Gatewayサービスに対してデフォルトで
`OPENCLAW_DISABLE_BONJOUR=1` が設定されています。Dockerブリッジネットワークは通常、mDNSマルチキャスト
（`224.0.0.251:5353`）をコンテナとLANの間で転送しないため、Bonjourを有効なままにすると
検出は機能しないまま、ciao の `probing` や `announcing` の失敗が繰り返し発生することがあります。

重要な落とし穴:

- Bonjourを無効化してもGatewayは停止しません。停止するのはLANマルチキャスト
  広告だけです。
- Bonjourを無効化しても `gateway.bind` は変わりません。Dockerでは引き続き
  `OPENCLAW_GATEWAY_BIND=lan` がデフォルトなので、公開されたホストポートは機能します。
- Bonjourを無効化しても広域DNS-SDは無効になりません。Gatewayとnodeが同じLAN上にない場合は、
  広域検出またはTailnetを使用してください。
- Docker外で同じ `OPENCLAW_CONFIG_DIR` を再利用しても、環境に `OPENCLAW_DISABLE_BONJOUR` が
  まだ設定されていない限り、Composeのデフォルトは引き継がれません。
- `OPENCLAW_DISABLE_BONJOUR=0` を設定するのは、host networking、macvlan、またはmDNSマルチキャストが
  通ることが分かっている別のネットワークの場合だけにしてください。

## Bonjour無効化時のトラブルシューティング

Dockerセットアップ後にnodeがGatewayを自動検出しなくなった場合:

1. Gatewayが意図的にLAN広告を抑制しているか確認します。

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 公開ポート経由でGateway自体に到達できることを確認します。

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjourが無効な場合は直接ターゲットを使用します。
   - Control UIまたはローカルツール: `http://127.0.0.1:18789`
   - LANクライアント: `http://<gateway-host>:18789`
   - ネットワーク越しのクライアント: Tailnet MagicDNS、Tailnet IP、SSHトンネル、または
     広域DNS-SD

4. Dockerで意図的に `OPENCLAW_DISABLE_BONJOUR=0` としてBonjourを有効化した場合は、
   ホストからマルチキャストをテストします。

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   ブラウズ結果が空、またはGatewayログにciao watchdogの
   キャンセルが繰り返し表示される場合は、`OPENCLAW_DISABLE_BONJOUR=1` に戻し、直接経路または
   Tailnet経路を使用してください。

## よくある障害モード

- **Bonjourはネットワークをまたげない**: TailnetまたはSSHを使用してください。
- **マルチキャストがブロックされている**: 一部のWi‑FiネットワークではmDNSが無効化されています。
- **広告がprobing/announcingで止まる**: マルチキャストがブロックされたホスト、
  コンテナブリッジ、WSL、またはインターフェース変動により、ciao advertiser が
  non-announced 状態に留まることがあります。OpenClawはいくつか再試行し、その後は
  永遠にadvertiserを再起動し続ける代わりに、現在のGatewayプロセスでBonjourを無効化します。
- **Dockerブリッジネットワーク**: バンドルされたDocker Composeでは、デフォルトで
  `OPENCLAW_DISABLE_BONJOUR=1` によりBonjourが無効です。`0` に設定するのは、host、
  macvlan、または別のmDNS対応ネットワークの場合だけにしてください。
- **スリープ / インターフェース変動**: macOSでは一時的にmDNS結果が消えることがあります。再試行してください。
- **ブラウズは動くが解決に失敗する**: マシン名をシンプルに保ってください（絵文字や
  句読点を避ける）。その後Gatewayを再起動してください。サービスインスタンス名は
  ホスト名から派生するため、複雑すぎる名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS‑SDでは、サービスインスタンス名のバイトが10進の `\DDD`
シーケンスとしてエスケープされることがあります（例: スペースは `\032` になります）。

- これはプロトコルレベルでは正常です。
- UIは表示用にデコードするべきです（iOSでは `BonjourEscapes.decode` を使用します）。

## 無効化 / 設定

- `openclaw plugins disable bonjour` は、バンドルされたPluginを無効化することでLANマルチキャスト広告を無効にします。
- `openclaw plugins enable bonjour` は、デフォルトのLAN検出Pluginを復元します。
- `OPENCLAW_DISABLE_BONJOUR=1` は、Plugin設定を変更せずにLANマルチキャスト広告を無効化します。受け付けるtruthy値は `1`、`true`、`yes`、`on` です（legacy: `OPENCLAW_DISABLE_BONJOUR`）。
- Docker Composeは、ブリッジネットワーク用にデフォルトで `OPENCLAW_DISABLE_BONJOUR=1` を設定します。mDNSマルチキャストが利用可能な場合にのみ、`OPENCLAW_DISABLE_BONJOUR=0` で上書きしてください。
- `~/.openclaw/openclaw.json` の `gateway.bind` はGatewayのbindモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が広告される場合のSSHポートを上書きします（legacy: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` は、mDNS full mode有効時にTXTでMagicDNSヒントを公開します（legacy: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` は、広告されるCLIパスを上書きします（legacy: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- 検出ポリシーと転送選択: [Discovery](/ja-JP/gateway/discovery)
- nodeペアリングと承認: [Gateway pairing](/ja-JP/gateway/pairing)
