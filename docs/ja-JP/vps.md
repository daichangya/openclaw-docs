---
read_when:
    - Linux サーバーまたはクラウド VPS で Gateway を実行したいとき
    - ホスティングガイドの概要をすばやく確認したいとき
    - OpenClaw 向けの一般的な Linux サーバーチューニングを知りたいとき
sidebarTitle: Linux Server
summary: Linux サーバーまたはクラウド VPS で OpenClaw を実行する方法 — プロバイダーピッカー、アーキテクチャ、チューニング
title: Linux Server
x-i18n:
    generated_at: "2026-04-05T13:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Linux Server

任意の Linux サーバーまたはクラウド VPS で OpenClaw Gateway を実行できます。このページでは、
プロバイダー選び、クラウドデプロイの仕組み、そしてどこでも共通して使える一般的な Linux
チューニングを説明します。

## プロバイダーを選ぶ

<CardGroup cols={2}>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリック、ブラウザーで設定</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリック、ブラウザーで設定</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料 VPS</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS 上の Docker</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPS プロキシ付き VM</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARM セルフホスト</Card>
</CardGroup>

**AWS（EC2 / Lightsail / free tier）** もうまく動作します。
コミュニティによる動画ウォークスルーは次で利用できます。
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
（コミュニティリソース -- 利用できなくなる可能性があります）。

## クラウド構成の仕組み

- **Gateway は VPS 上で動作**し、状態とワークスペースを保持します。
- ノート PC やスマートフォンから **Control UI** または **Tailscale/SSH** 経由で接続します。
- VPS を唯一の正しい情報源として扱い、状態とワークスペースを定期的に**バックアップ**してください。
- 安全なデフォルトとして、Gateway は loopback に留め、SSH トンネルまたは Tailscale Serve 経由でアクセスしてください。
  `lan` または `tailnet` に bind する場合は、`gateway.auth.token` または `gateway.auth.password` を必須にしてください。

関連ページ: [Gateway remote access](/ja-JP/gateway/remote), [Platforms hub](/ja-JP/platforms)。

## VPS 上の共有会社エージェント

チーム向けに単一のエージェントを実行する構成は、すべてのユーザーが同じ信頼境界に属し、そのエージェントが業務専用である場合に有効です。

- 専用ランタイム（VPS/VM/container + 専用 OS ユーザー/アカウント）で運用してください。
- そのランタイムを個人の Apple/Google アカウントや、個人用ブラウザー/パスワードマネージャープロファイルにサインインさせないでください。
- ユーザー同士が互いに敵対的である可能性がある場合は、gateway/host/OS ユーザー単位で分離してください。

セキュリティモデルの詳細: [Security](/ja-JP/gateway/security)。

## VPS で nodes を使う

Gateway はクラウドに置いたまま、ローカルデバイス上で **nodes** をペアリングできます
（Mac/iOS/Android/headless）。nodes はローカルの画面/カメラ/canvas と `system.run`
機能を提供しつつ、Gateway はクラウド上に残せます。

ドキュメント: [Nodes](/ja-JP/nodes), [Nodes CLI](/cli/nodes)。

## 小型 VM と ARM ホスト向けの起動チューニング

低性能 VM（または ARM ホスト）で CLI コマンドが遅く感じる場合は、Node のモジュールコンパイルキャッシュを有効にしてください。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` は繰り返し実行するコマンドの起動時間を改善します。
- `OPENCLAW_NO_RESPAWN=1` は自己再起動パスによる追加の起動オーバーヘッドを避けます。
- 最初のコマンド実行でキャッシュが温まり、その後の実行は高速になります。
- Raspberry Pi 固有の内容については、[Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使う VM ホストでは、次を検討してください。

- 安定した起動パスのためにサービス env を追加する:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作を明示的に保つ:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 状態/キャッシュパスのランダム I/O によるコールドスタートのペナルティを減らすため、SSD ベースのディスクを優先する。

標準の `openclaw onboard --install-daemon` パスでは、ユーザーユニットを編集してください。

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

意図的に system unit をインストールした場合は、代わりに
`sudo systemctl edit openclaw-gateway.service` で `openclaw-gateway.service` を編集してください。

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。
