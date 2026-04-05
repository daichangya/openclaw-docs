---
read_when:
    - macOS/iOSでBonjourディスカバリーの問題をデバッグする場合
    - mDNSサービス種別、TXTレコード、またはディスカバリーUXを変更する場合
summary: Bonjour/mDNSディスカバリーとデバッグ（Gatewayビーコン、クライアント、一般的な障害モード）
title: Bonjourディスカバリー
x-i18n:
    generated_at: "2026-04-05T12:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNSディスカバリー

OpenClawは、アクティブなGateway（WebSocketエンドポイント）を検出するためにBonjour（mDNS / DNS‑SD）を使用します。
マルチキャストの`local.`ブラウジングは、**LAN内限定の利便機能**です。ネットワークをまたぐディスカバリーでは、同じビーコンを設定済みの広域DNS-SDドメイン経由でも公開できます。ディスカバリーは依然としてベストエフォートであり、SSHやTailnetベースの接続の代替には**なりません**。

## Tailscale経由の広域Bonjour（ユニキャストDNS-SD）

ノードとgatewayが異なるネットワーク上にある場合、マルチキャストmDNSはその境界を越えません。同じディスカバリーUXを維持したまま、Tailscale経由の**ユニキャストDNS‑SD**（「広域Bonjour」）に切り替えることができます。

大まかな手順:

1. gatewayホスト上でDNSサーバーを実行する（Tailnet経由で到達可能）。
2. 専用ゾーン配下に`_openclaw-gw._tcp`のDNS‑SDレコードを公開する
   （例: `openclaw.internal.`）。
3. 選択したドメインがそのDNSサーバー経由で解決されるように、Tailscale **split DNS**を設定する
   （iOSを含むクライアント向け）。

OpenClawは任意のディスカバリードメインをサポートします。`openclaw.internal.`は単なる例です。
iOS/Androidノードは、`local.`と設定済みの広域ドメインの両方をブラウズします。

### Gateway設定（推奨）

```json5
{
  gateway: { bind: "tailnet" }, // tailnet専用（推奨）
  discovery: { wideArea: { enabled: true } }, // 広域DNS-SD公開を有効化
}
```

### 初回DNSサーバー設定（gatewayホスト）

```bash
openclaw dns setup --apply
```

これによりCoreDNSがインストールされ、次のように設定されます:

- gatewayのTailscaleインターフェース上でのみポート53をlistenする
- 選択したドメイン（例: `openclaw.internal.`）を`~/.openclaw/dns/<domain>.db`から提供する

tailnet接続済みのマシンから検証します:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS設定

Tailscale管理コンソールで:

- gatewayのtailnet IP（UDP/TCP 53）を指すネームサーバーを追加します。
- ディスカバリードメインがそのネームサーバーを使用するようにsplit DNSを追加します。

クライアントがtailnet DNSを受け入れると、iOSノードとCLIディスカバリーは、マルチキャストなしでディスカバリードメイン内の`_openclaw-gw._tcp`をブラウズできます。

### Gatewayリスナーのセキュリティ（推奨）

GatewayのWSポート（デフォルト`18789`）は、デフォルトではloopbackにbindします。LAN/tailnetアクセスでは、明示的にbindし、認証を有効にしたままにしてください。

tailnet専用構成では:

- `~/.openclaw/openclaw.json`で`gateway.bind: "tailnet"`を設定します。
- Gatewayを再起動します（またはmacOSメニューバーアプリを再起動します）。

## 公開するもの

`_openclaw-gw._tcp`を公開するのはGatewayのみです。

## サービス種別

- `_openclaw-gw._tcp` — gateway転送ビーコン（macOS/iOS/Androidノードで使用）。

## TXTキー（秘密ではないヒント）

Gatewayは、UIフローを便利にするために、小さな非秘密ヒントを公開します:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（TLS有効時のみ）
- `gatewayTlsSha256=<sha256>`（TLS有効かつフィンガープリント利用可能時のみ）
- `canvasPort=<port>`（canvas host有効時のみ。現在は`gatewayPort`と同じ）
- `transport=gateway`
- `tailnetDns=<magicdns>`（Tailnet利用可能時の任意ヒント）
- `sshPort=<port>`（mDNS完全モードのみ。広域DNS-SDでは省略される場合あり）
- `cliPath=<path>`（mDNS完全モードのみ。広域DNS-SDでもリモートインストールヒントとして書き込まれます）

セキュリティ上の注意:

- Bonjour/mDNSのTXTレコードは**認証されません**。クライアントはTXTを信頼できるルーティング情報として扱ってはいけません。
- クライアントは、解決済みのサービスエンドポイント（SRV + A/AAAA）を使用してルーティングする必要があります。`lanHost`、`tailnetDns`、`gatewayPort`、`gatewayTlsSha256`はヒントとしてのみ扱ってください。
- SSH自動ターゲット指定も同様に、TXTのみのヒントではなく、解決済みのサービスホストを使う必要があります。
- TLSピン留めでは、広告された`gatewayTlsSha256`によって、以前に保存されたピンが上書きされることがあってはなりません。
- iOS/Androidノードは、ディスカバリーベースの直接接続を**TLS専用**として扱い、初回フィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

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

ブラウズは動作するのに解決が失敗する場合は、通常LANポリシーまたはmDNSリゾルバーの問題です。

## Gatewayログでのデバッグ

Gatewayはローテーションログファイルを書き込みます（起動時に`gateway log file: ...`として表示されます）。特に次のような`bonjour:`行を確認してください:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOSノードでのデバッグ

iOSノードは、`_openclaw-gw._tcp`を検出するために`NWBrowser`を使用します。

ログを取得するには:

- 設定 → Gateway → 詳細 → **Discovery Debug Logs**
- 設定 → Gateway → 詳細 → **Discovery Logs** → 再現 → **Copy**

ログには、ブラウザーの状態遷移と結果セットの変化が含まれます。

## 一般的な障害モード

- **Bonjourはネットワークをまたげない**: TailnetまたはSSHを使用してください。
- **マルチキャストがブロックされている**: 一部のWi‑FiネットワークではmDNSが無効化されています。
- **スリープ / インターフェースの変動**: macOSが一時的にmDNS結果を落とすことがあります。再試行してください。
- **ブラウズは動作するが解決に失敗する**: マシン名はシンプルに保ってください（絵文字や句読点を避ける）。その後、Gatewayを再起動してください。サービスインスタンス名はホスト名から導出されるため、複雑すぎる名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名（`\032`）

Bonjour/DNS‑SDは、サービスインスタンス名中のバイトを10進の`\DDD`シーケンスとしてエスケープすることがよくあります（例: スペースは`\032`になります）。

- これはプロトコルレベルでは正常です。
- UIでは表示用にデコードする必要があります（iOSは`BonjourEscapes.decode`を使用します）。

## 無効化 / 設定

- `OPENCLAW_DISABLE_BONJOUR=1`は公開を無効にします（legacy: `OPENCLAW_DISABLE_BONJOUR`）。
- `~/.openclaw/openclaw.json`内の`gateway.bind`はGatewayのbindモードを制御します。
- `OPENCLAW_SSH_PORT`は、`sshPort`が公開されるときのSSHポートを上書きします（legacy: `OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS`は、TXTにMagicDNSヒントを公開します（legacy: `OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH`は、公開されるCLIパスを上書きします（legacy: `OPENCLAW_CLI_PATH`）。

## 関連ドキュメント

- ディスカバリーポリシーと転送選択: [ディスカバリー](/gateway/discovery)
- ノードのペアリングと承認: [Gatewayペアリング](/gateway/pairing)
