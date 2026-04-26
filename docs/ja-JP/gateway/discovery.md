---
read_when:
    - Bonjour の検出/告知を実装または変更すること
    - リモート接続モード（direct と SSH）の調整
    - リモート Node 用の Node 検出 + ペアリングを設計すること
summary: Gateway を見つけるための Node 検出とトランスポート（Bonjour、Tailscale、SSH）
title: 検出とトランスポート
x-i18n:
    generated_at: "2026-04-26T11:29:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# 検出とトランスポート

OpenClaw には、表面上は似て見えても異なる 2 つの問題があります。

1. **オペレーターのリモート制御**: 別の場所で動作している Gateway を macOS メニューバーアプリが制御すること。
2. **Node のペアリング**: iOS/Android（および将来の Node）が Gateway を見つけて安全にペアリングすること。

設計目標は、すべてのネットワーク検出/告知を **Node Gateway**（`openclaw gateway`）に集約し、クライアント（mac アプリ、iOS）は利用側に保つことです。

## 用語

- **Gateway**: 状態（sessions、pairing、Node レジストリ）を保持し、チャネルを実行する単一の長時間実行 Gateway プロセス。多くの構成ではホストごとに 1 つですが、分離されたマルチ Gateway 構成も可能です。
- **Gateway WS（コントロールプレーン）**: デフォルトでは `127.0.0.1:18789` 上の WebSocket エンドポイント。`gateway.bind` によって LAN/tailnet にバインドできます。
- **Direct WS transport**: LAN/tailnet 向けの Gateway WS エンドポイント（SSH なし）。
- **SSH transport（フォールバック）**: `127.0.0.1:18789` を SSH 経由で転送することによるリモート制御。
- **Legacy TCP bridge（削除済み）**: 旧式の Node トランスポート（[Bridge protocol](/ja-JP/gateway/bridge-protocol) を参照）。現在は検出用に告知されず、現行ビルドの一部でもありません。

プロトコルの詳細:

- [Gateway protocol](/ja-JP/gateway/protocol)
- [Bridge protocol（legacy）](/ja-JP/gateway/bridge-protocol)

## なぜ「direct」と SSH の両方を維持するのか

- **Direct WS** は、同一ネットワーク内や tailnet 内では最もよい UX です。
  - Bonjour による LAN 上での自動検出
  - Gateway が管理するペアリングトークン + ACL
  - シェルアクセス不要。プロトコル面を限定的かつ監査しやすく保てる
- **SSH** は依然として汎用的なフォールバックです。
  - SSH アクセスさえあればどこでも動作する（無関係なネットワーク間でも）
  - マルチキャスト/mDNS の問題を回避できる
  - SSH 以外に新しい受信ポートを必要としない

## 検出入力（クライアントが Gateway の場所を知る方法）

### 1) Bonjour / DNS-SD 検出

マルチキャスト Bonjour はベストエフォートであり、ネットワークをまたぎません。OpenClaw は、
設定された広域 DNS-SD ドメイン経由でも同じ Gateway ビーコンを参照できるため、検出範囲は次をカバーできます。

- 同一 LAN 上の `local.`
- クロスネットワーク検出用に設定されたユニキャスト DNS-SD ドメイン

対象となる方向:

- **Gateway** が、Bonjour 経由で自身の WS エンドポイントを告知します。
- クライアントはそれを参照して「Gateway を選択する」一覧を表示し、選択したエンドポイントを保存します。

トラブルシューティングとビーコンの詳細: [Bonjour](/ja-JP/gateway/bonjour)。

#### サービスビーコンの詳細

- サービスタイプ:
  - `_openclaw-gw._tcp`（Gateway transport ビーコン）
- TXT キー（非シークレット）:
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`（オペレーターが設定した表示名）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（TLS が有効な場合のみ）
  - `gatewayTlsSha256=<sha256>`（TLS が有効で、フィンガープリントが利用可能な場合のみ）
  - `canvasPort=<port>`（canvas host ポート。現在は canvas host が有効な場合、`gatewayPort` と同じ）
  - `tailnetDns=<magicdns>`（任意のヒント。Tailscale が利用可能な場合は自動検出）
  - `sshPort=<port>`（mDNS フルモードのみ。広域 DNS-SD では省略されることがあり、その場合 SSH のデフォルトは `22` のまま）
  - `cliPath=<path>`（mDNS フルモードのみ。広域 DNS-SD でもリモートインストールのヒントとして書き込まれます）

セキュリティに関する注記:

- Bonjour/mDNS の TXT レコードは **認証されません**。クライアントは TXT 値を UX のヒントとしてのみ扱う必要があります。
- ルーティング（host/port）は、TXT 提供の `lanHost`、`tailnetDns`、`gatewayPort` よりも、**解決されたサービスエンドポイント**（SRV + A/AAAA）を優先すべきです。
- TLS ピンニングでは、告知された `gatewayTlsSha256` が以前に保存された pin を上書きできてはなりません。
- iOS/Android Node は、選択したルートが secure/TLS ベースである場合、初回 pin を保存する前に、明示的な「このフィンガープリントを信頼する」確認（帯域外検証）を要求すべきです。

無効化/上書き:

- `OPENCLAW_DISABLE_BONJOUR=1` は告知を無効化します。
- Docker Compose では、ブリッジネットワークが通常 mDNS マルチキャストを信頼性高く運ばないため、デフォルトで `OPENCLAW_DISABLE_BONJOUR=1` です。host、macvlan、または他の mDNS 対応ネットワーク上でのみ `0` を使ってください。
- `~/.openclaw/openclaw.json` の `gateway.bind` が Gateway のバインドモードを制御します。
- `OPENCLAW_SSH_PORT` は、`sshPort` が出力されるときに告知される SSH ポートを上書きします。
- `OPENCLAW_TAILNET_DNS` は `tailnetDns` ヒント（MagicDNS）を公開します。
- `OPENCLAW_CLI_PATH` は告知される CLI パスを上書きします。

### 2) tailnet（クロスネットワーク）

London/Vienna スタイルの構成では、Bonjour は役に立ちません。推奨される「direct」対象は次です。

- Tailscale MagicDNS 名（推奨）または安定した tailnet IP。

Gateway が Tailscale 上で動作していることを検出できる場合、クライアント向けの任意ヒントとして `tailnetDns` を公開します（広域ビーコンも含む）。

macOS アプリは現在、Gateway 検出で生の Tailscale IP よりも MagicDNS 名を優先します。これにより、tailnet IP が変わる場合（たとえば Node 再起動後や CGNAT の再割り当て後）でも、MagicDNS 名が自動的に現在の IP に解決されるため、信頼性が向上します。

モバイル Node のペアリングでは、検出ヒントによって tailnet/公開ルート上のトランスポートセキュリティ要件は緩和されません。

- iOS/Android では、初回の tailnet/公開接続経路に引き続き secure な経路（`wss://` または Tailscale Serve/Funnel）が必要です。
- 検出された生の tailnet IP はルーティングヒントであり、平文のリモート `ws://` を使う許可ではありません。
- プライベート LAN 上の direct-connect `ws://` は引き続きサポートされます。
- モバイル Node で最も簡単な Tailscale 経路が欲しい場合は、検出とセットアップコードの両方が同じ secure な MagicDNS エンドポイントに解決されるよう、Tailscale Serve を使ってください。

### 3) 手動 / SSH 対象

direct 経路がない場合（または direct が無効な場合）、クライアントはいつでも SSH で loopback Gateway ポートを転送して接続できます。

[Remote access](/ja-JP/gateway/remote) を参照してください。

## トランスポート選択（クライアントポリシー）

推奨されるクライアント動作:

1. ペアリング済みの direct エンドポイントが設定されており到達可能なら、それを使う。
2. そうでなければ、検出で `local.` または設定済み広域ドメイン上に Gateway が見つかった場合、ワンタップの「この Gateway を使う」選択肢を提示し、direct エンドポイントとして保存する。
3. そうでなければ、tailnet DNS/IP が設定されていれば direct を試す。
   tailnet/公開ルート上のモバイル Node では、direct は平文のリモート `ws://` ではなく secure なエンドポイントを意味します。
4. それでもだめなら SSH にフォールバックする。

## ペアリング + 認証（direct transport）

Gateway は Node/クライアント受け入れの信頼できる唯一の情報源です。

- ペアリング要求は Gateway で作成/承認/拒否されます（[Gateway pairing](/ja-JP/gateway/pairing) を参照）。
- Gateway は次を強制します。
  - 認証（token / keypair）
  - スコープ/ACL（Gateway はあらゆるメソッドへの生のプロキシではありません）
  - レート制限

## コンポーネントごとの責務

- **Gateway**: 検出ビーコンを告知し、ペアリング判断を管理し、WS エンドポイントをホストする。
- **macOS アプリ**: Gateway 選択を支援し、ペアリングプロンプトを表示し、SSH はフォールバックとしてのみ使用する。
- **iOS/Android Node**: 利便性のために Bonjour を参照し、ペアリング済み Gateway WS に接続する。

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Tailscale](/ja-JP/gateway/tailscale)
- [Bonjour discovery](/ja-JP/gateway/bonjour)
