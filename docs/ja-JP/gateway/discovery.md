---
read_when:
    - Bonjourの検出/広告を実装または変更するとき
    - リモート接続モード（direct と SSH）を調整するとき
    - リモートノード向けのノード検出とペアリングを設計するとき
summary: Gatewayを見つけるためのノード検出とトランスポート（Bonjour、Tailscale、SSH）
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-04-05T12:43:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# 検出とトランスポート

OpenClawには、表面的には似て見えるものの、実際には異なる2つの問題があります。

1. **オペレーターのリモート制御**: 別の場所で動作しているGatewayをmacOSメニューバーアプリが制御すること。
2. **ノードのペアリング**: iOS/Android（および将来のノード）がGatewayを見つけ、安全にペアリングすること。

設計目標は、すべてのネットワーク検出/広告を**Node Gateway**（`openclaw gateway`）に集約し、クライアント（mac app、iOS）はその利用者として保つことです。

## 用語

- **Gateway**: 状態（セッション、ペアリング、ノードレジストリ）を保持し、チャネルを実行する単一の長時間稼働するGatewayプロセス。ほとんどの構成ではホストごとに1つ使用しますが、分離されたマルチGateway構成も可能です。
- **Gateway WS（コントロールプレーン）**: デフォルトでは `127.0.0.1:18789` 上のWebSocketエンドポイント。`gateway.bind` によりLAN/tailnetにバインドできます。
- **Direct WS transport**: LAN/tailnet向けのGateway WSエンドポイント（SSHなし）。
- **SSH transport（フォールバック）**: SSH越しに `127.0.0.1:18789` を転送して行うリモート制御。
- **Legacy TCP bridge（削除済み）**: 以前のノードトランスポート（
  [Bridge protocol](/gateway/bridge-protocol) を参照）。現在は検出用に広告されず、
  現行ビルドにも含まれていません。

プロトコルの詳細:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol（レガシー）](/gateway/bridge-protocol)

## 「direct」とSSHの両方を維持する理由

- **Direct WS** は、同一ネットワーク内およびtailnet内で最良のUXを提供します:
  - BonjourによるLAN上の自動検出
  - Gatewayが所有するペアリングトークンとACL
  - シェルアクセス不要。プロトコルサーフェスを限定的かつ監査可能に保てる
- **SSH** は依然として汎用のフォールバックです:
  - SSHアクセスさえあればどこでも動作する（無関係なネットワーク間でも）
  - マルチキャスト/mDNSの問題があっても利用可能
  - SSH以外に新しい受信ポートを必要としない

## 検出入力（クライアントがGatewayの場所を知る方法）

### 1) Bonjour / DNS-SD検出

マルチキャストBonjourはベストエフォートであり、ネットワークをまたいでは届きません。OpenClawは、
設定された広域DNS-SDドメイン経由でも同じGatewayビーコンを参照できるため、検出は次をカバーできます。

- 同一LAN上の `local.`
- ネットワークをまたぐ検出のための、設定済みのユニキャストDNS-SDドメイン

対象の方向性:

- **Gateway** はBonjour経由でそのWSエンドポイントを広告します。
- クライアントは参照して「Gatewayを選ぶ」一覧を表示し、選択されたエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ:
  - `_openclaw-gw._tcp`（gateway transportビーコン）
- TXTキー（非シークレット）:
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（オペレーター設定の表示名）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（TLSが有効な場合のみ）
  - `gatewayTlsSha256=<sha256>`（TLSが有効で、かつフィンガープリントが利用可能な場合のみ）
  - `canvasPort=<port>`（canvas hostポート。現在、canvas hostが有効な場合は `gatewayPort` と同じ）
  - `tailnetDns=<magicdns>`（任意のヒント。Tailscaleが利用可能な場合は自動検出）
  - `sshPort=<port>`（mDNSフルモードのみ。広域DNS-SDでは省略される場合があり、その場合SSHのデフォルトは `22` のまま）
  - `cliPath=<path>`（mDNSフルモードのみ。広域DNS-SDでもリモートインストールのヒントとして書き込まれます）

セキュリティに関する注:

- Bonjour/mDNS TXTレコードは**認証されていません**。クライアントはTXT値をUXのヒントとしてのみ扱う必要があります。
- ルーティング（host/port）は、TXTで提供される `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決済みサービスエンドポイント**（SRV + A/AAAA）を優先するべきです。
- TLSピンニングでは、広告された `gatewayTlsSha256` によって、以前保存されたピンが上書きされることがあってはなりません。
- iOS/Androidノードは、選択された経路がセキュア/TLSベースの場合、初回ピン保存前に、明示的な「このフィンガープリントを信頼する」確認（帯域外検証）を要求するべきです。

無効化/上書き:

- `OPENCLAW_DISABLE_BONJOUR=1` は広告を無効化します。
- `~/.openclaw/openclaw.json` の `gateway.bind` がGatewayのバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が出力される場合の広告SSHポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は広告されるCLIパスを上書きします。

### 2) Tailnet（ネットワーク越し）

London/Viennaスタイルの構成では、Bonjourは役に立ちません。推奨される「direct」ターゲットは次のとおりです。

- Tailscale MagicDNS名（推奨）または安定したtailnet IP。

GatewayがTailscale上で動作していることを検出できる場合、クライアント向けの任意ヒントとして `tailnetDns` を公開します（広域ビーコンを含む）。

macOSアプリは現在、Gateway検出において生のTailscale IPよりMagicDNS名を優先します。これにより、tailnet IPが変更された場合（たとえばノード再起動後やCGNAT再割り当て後）でも、MagicDNS名が現在のIPへ自動解決されるため、信頼性が向上します。

モバイルノードのペアリングでは、検出ヒントによってtailnet/公開経路上のトランスポートセキュリティが緩和されることはありません。

- iOS/Androidは、初回のtailnet/公開接続経路として、引き続きセキュアな経路（`wss://` または Tailscale Serve/Funnel）を必要とします。
- 検出された生のtailnet IPはルーティングヒントであり、平文のリモート `ws://` を使ってよいという許可ではありません。
- プライベートLANのdirect-connect `ws://` は引き続きサポートされます。
- モバイルノード向けに最も簡単なTailscale経路が必要なら、Tailscale Serveを使用してください。これにより、検出とセットアップコードの両方が同じセキュアなMagicDNSエンドポイントに解決されます。

### 3) 手動 / SSHターゲット

direct経路がない場合（またはdirectが無効な場合）、クライアントはいつでもループバックGatewayポートを転送してSSH経由で接続できます。

[Remote access](/gateway/remote) を参照してください。

## トランスポート選択（クライアントポリシー）

推奨されるクライアント動作:

1. ペアリング済みのdirectエンドポイントが設定されていて到達可能なら、それを使用する。
2. そうでなければ、検出で `local.` または設定済みの広域ドメイン上のGatewayが見つかった場合、ワンタップの「このGatewayを使う」選択肢を提示し、それをdirectエンドポイントとして保存する。
3. そうでなければ、tailnet DNS/IPが設定されている場合はdirectを試す。
   tailnet/公開経路上のモバイルノードでは、directとはセキュアなエンドポイントを意味し、平文のリモート `ws://` ではありません。
4. それでもだめなら、SSHにフォールバックする。

## ペアリングと認証（direct transport）

Gatewayはノード/クライアント受け入れの信頼できる唯一の情報源です。

- ペアリング要求はGatewayで作成、承認、拒否されます（[Gateway pairing](/gateway/pairing) を参照）。
- Gatewayは次を強制します:
  - 認証（トークン / keypair）
  - スコープ/ACL（Gatewayはあらゆるメソッドへの生のプロキシではありません）
  - レート制限

## コンポーネントごとの責務

- **Gateway**: 検出ビーコンを広告し、ペアリング判断を保持し、WSエンドポイントをホストします。
- **macOS app**: Gateway選択を支援し、ペアリングプロンプトを表示し、SSHはフォールバックとしてのみ使用します。
- **iOS/Androidノード**: 利便性のためにBonjourを参照し、ペアリング済みGateway WSへ接続します。
