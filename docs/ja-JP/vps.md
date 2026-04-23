---
read_when:
    - LinuxサーバーまたはクラウドVPSでGatewayを実行したい場合
    - ホスティングガイドのクイックマップが必要です
    - OpenClaw向けの一般的なLinuxサーバーチューニングが必要です
sidebarTitle: Linux Server
summary: LinuxサーバーまたはクラウドVPSでOpenClawを実行する — プロバイダ選定、アーキテクチャ、チューニング
title: Linuxサーバー
x-i18n:
    generated_at: "2026-04-23T04:53:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Linuxサーバー

任意のLinuxサーバーまたはクラウドVPSでOpenClaw Gatewayを実行できます。このページでは、
プロバイダ選定、クラウドデプロイの仕組み、およびどこでも共通して使える一般的なLinux
チューニングについて説明します。

## プロバイダを選ぶ

<CardGroup cols={2}>
  <Card title="Railway" href="/ja-JP/install/railway">ワンクリック、ブラウザセットアップ</Card>
  <Card title="Northflank" href="/ja-JP/install/northflank">ワンクリック、ブラウザセットアップ</Card>
  <Card title="DigitalOcean" href="/ja-JP/install/digitalocean">シンプルな有料VPS</Card>
  <Card title="Oracle Cloud" href="/ja-JP/install/oracle">Always Free ARM tier</Card>
  <Card title="Fly.io" href="/ja-JP/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ja-JP/install/hetzner">Hetzner VPS上のDocker</Card>
  <Card title="Hostinger" href="/ja-JP/install/hostinger">ワンクリックセットアップ付きVPS</Card>
  <Card title="GCP" href="/ja-JP/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ja-JP/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ja-JP/install/exe-dev">HTTPSプロキシ付きVM</Card>
  <Card title="Raspberry Pi" href="/ja-JP/install/raspberry-pi">ARMセルフホスト</Card>
</CardGroup>

**AWS（EC2 / Lightsail / free tier）** でも問題なく動作します。
コミュニティによる動画ウォークスルーが
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
で利用できます
（コミュニティリソースのため、利用できなくなる可能性があります）。

## クラウド構成の仕組み

- **GatewayはVPS上で実行**され、state + workspace を保持します。
- **Control UI** または **Tailscale/SSH** 経由で、ノートPCやスマートフォンから接続します。
- VPSを信頼できる唯一のソースとして扱い、state + workspace を定期的に**バックアップ**してください。
- 安全なデフォルト: Gatewayは loopback のままにし、SSHトンネルまたは Tailscale Serve 経由でアクセスします。
  `lan` または `tailnet` に bind する場合は、`gateway.auth.token` または `gateway.auth.password` を必須にしてください。

関連ページ: [Gateway remote access](/ja-JP/gateway/remote)、[Platforms hub](/ja-JP/platforms)。

## VPS上の共有会社agent

チーム用に単一のagentを実行する構成は、すべてのユーザーが同じ信頼境界内にいて、そのagentが業務専用である場合には妥当です。

- 専用のランタイム（VPS/VM/コンテナ + 専用OSユーザー/アカウント）上に維持してください。
- そのランタイムで、個人のApple/Googleアカウントや個人のブラウザ/パスワードマネージャプロファイルにサインインしないでください。
- ユーザー同士が敵対的である場合は、gateway/host/OSユーザーごとに分離してください。

セキュリティモデルの詳細: [Security](/ja-JP/gateway/security)。

## VPSでNodeを使う

Gatewayをクラウドに置いたまま、ローカルデバイス
（Mac/iOS/Android/headless）上で **Node** をペアリングできます。Nodeはローカルの画面/カメラ/canvas と `system.run`
機能を提供し、一方でGatewayはクラウドに残ります。

ドキュメント: [Nodes](/ja-JP/nodes)、[Nodes CLI](/cli/nodes)。

## 小規模VMおよびARMホスト向けの起動チューニング

低性能VM（またはARMホスト）でCLIコマンドが遅く感じる場合は、Nodeのモジュールコンパイルキャッシュを有効にしてください。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` は、繰り返し実行するコマンドの起動時間を改善します。
- `OPENCLAW_NO_RESPAWN=1` は、自己再spawn経路による追加の起動オーバーヘッドを避けます。
- 最初のコマンド実行でキャッシュが温まり、その後の実行は高速になります。
- Raspberry Pi 固有の情報は [Raspberry Pi](/ja-JP/install/raspberry-pi) を参照してください。

### systemd チューニングチェックリスト（任意）

`systemd` を使うVMホストでは、以下を検討してください。

- 安定した起動経路のために service env を追加:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 再起動動作は明示的に保つ:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- state/cache パスのランダムI/Oによるコールドスタートのペナルティを減らすため、SSDベースのディスクを優先する。

標準の `openclaw onboard --install-daemon` 経路では、ユーザーユニットを編集してください。

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
`sudo systemctl edit openclaw-gateway.service` で
`openclaw-gateway.service` を編集してください。

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

LinuxのOOM挙動、子プロセスの犠牲者選択、および `exit 137`
診断については、[Linux memory pressure and OOM kills](/ja-JP/platforms/linux#memory-pressure-and-oom-kills) を参照してください。
