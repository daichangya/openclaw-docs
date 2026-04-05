---
read_when:
    - DigitalOceanでOpenClawをセットアップしている場合
    - OpenClaw向けの安価なVPSホスティングを探している場合
summary: DigitalOcean上でOpenClawを動かす（シンプルな有料VPSオプション）
title: DigitalOcean（プラットフォーム）
x-i18n:
    generated_at: "2026-04-05T12:50:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# DigitalOcean上のOpenClaw

## 目的

DigitalOcean上で、永続的なOpenClaw Gatewayを **$6/月** で実行します（予約料金なら $4/月）。

$0/月の選択肢がよく、ARM + プロバイダー固有のセットアップを気にしないなら、[Oracle Cloud guide](/platforms/oracle) を参照してください。

## コスト比較（2026年）

| Provider     | Plan            | Specs                  | Price/mo    | Notes                                 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | up to 4 OCPU, 24GB RAM | $0          | ARM、容量制限 / signup時の癖あり      |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | 最も安い有料オプション                |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | UIが簡単、ドキュメントも充実          |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | ロケーションが多い                    |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | 現在はAkamaiの一部                    |

**プロバイダー選び:**

- DigitalOcean: 最も簡単なUX + 予測しやすいセットアップ（このガイド）
- Hetzner: 価格性能比がよい（[Hetzner guide](/install/hetzner) を参照）
- Oracle Cloud: $0/月にできるが、より癖がありARM専用（[Oracle guide](/platforms/oracle) を参照）

---

## 前提条件

- DigitalOceanアカウント（[signup with $200 free credit](https://m.do.co/c/signup)）
- SSH key pair（またはpassword authを使う意思）
- 約20分

## 1) Dropletを作成する

<Warning>
クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトやファイアウォールのデフォルトを確認していない限り、サードパーティのMarketplace 1-click imagesは避けてください。
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) にログインします
2. **Create → Droplets** をクリックします
3. 次を選択します:
   - **Region:** 自分（またはユーザー）に最も近い場所
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo**（1 vCPU、1GB RAM、25GB SSD）
   - **Authentication:** SSH key（推奨）またはpassword
4. **Create Droplet** をクリックします
5. IPアドレスを控えます

## 2) SSHで接続する

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClawをインストールする

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードが次を案内します:

- モデル認証（API keys または OAuth）
- チャンネル設定（Telegram、WhatsApp、Discordなど）
- Gateway token（自動生成）
- デーモンインストール（systemd）

## 5) Gatewayを確認する

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) ダッシュボードへアクセスする

gatewayはデフォルトでloopbackにbindします。Control UIへアクセスするには:

**オプションA: SSHトンネル（推奨）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**オプションB: Tailscale Serve（HTTPS、loopback専用）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開く: `https://<magicdns>/`

注意:

- ServeはGatewayをloopback専用のまま保ち、Control UI/WebSocketトラフィックをTailscale identity headersで認証します（token不要の認証はgateway hostが信頼されている前提です。HTTP APIはこれらのTailscale headersを使わず、代わりにgatewayの通常のHTTP auth modeに従います）。
- 代わりに明示的なshared-secret credentialsを必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使ってください。

**オプションC: tailnet bind（Serveなし）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開く: `http://<tailscale-ip>:18789`（token必須）。

## 7) チャンネルを接続する

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

他のプロバイダーについては [Channels](/ja-JP/channels) を参照してください。

---

## 1GB RAM向けの最適化

$6のdropletには1GB RAMしかありません。安定して動かすには:

### swapを追加する（推奨）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### より軽いモデルを使う

OOMが起きる場合は、次を検討してください:

- ローカルモデルではなく、APIベースのモデル（Claude、GPT）を使う
- `agents.defaults.model.primary` をより小さいモデルに設定する

### メモリを監視する

```bash
free -h
htop
```

---

## 永続性

すべての状態は次に保存されます:

- `~/.openclaw/` — `openclaw.json`、agentごとの `auth-profiles.json`、channel/provider state、session data
- `~/.openclaw/workspace/` — ワークスペース（SOUL.md、memoryなど）

これらは再起動後も保持されます。定期的にバックアップしてください:

```bash
openclaw backup create
```

---

## Oracle Cloudの無料代替案

Oracle Cloudは **Always Free** のARMインスタンスを提供しており、ここにあるどの有料オプションよりも大幅に強力です。それでいて $0/月 です。

| 利用できるもの     | Specs             |
| ------------------ | ----------------- |
| **4 OCPUs**        | ARM Ampere A1     |
| **24GB RAM**       | 十分すぎる容量    |
| **200GB storage**  | Block volume      |
| **永久無料**       | クレジットカード請求なし |

**注意点:**

- Signupに癖があることがあります（失敗したら再試行してください）
- ARMアーキテクチャ — ほとんどのものは動きますが、一部のバイナリにはARM buildが必要です

完全なセットアップガイドは [Oracle Cloud](/platforms/oracle) を参照してください。signupのコツや登録プロセスのトラブルシューティングについては、この [community guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照してください。

---

## トラブルシューティング

### Gatewayが起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Portがすでに使われている

```bash
lsof -i :18789
kill <PID>
```

### メモリ不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 関連項目

- [Hetzner guide](/install/hetzner) — より安く、より高性能
- [Docker install](/install/docker) — コンテナ化セットアップ
- [Tailscale](/gateway/tailscale) — 安全なリモートアクセス
- [Configuration](/gateway/configuration) — 完全な設定リファレンス
