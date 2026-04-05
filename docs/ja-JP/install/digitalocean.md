---
read_when:
    - DigitalOcean上でOpenClawをセットアップする場合
    - OpenClaw向けのシンプルな有料VPSを探している場合
summary: DigitalOcean DropletでOpenClawをホストする
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T12:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

DigitalOcean Droplet上で永続的なOpenClaw Gatewayを実行します。

## 前提条件

- DigitalOceanアカウント（[登録](https://cloud.digitalocean.com/registrations/new)）
- SSHキーペア（またはパスワード認証を使う意思）
- 約20分

## セットアップ

<Steps>
  <Step title="Dropletを作成する">
    <Warning>
    クリーンなベースイメージ（Ubuntu 24.04 LTS）を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティのMarketplace 1-clickイメージは避けてください。
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/)にログインします。
    2. **Create > Droplets**をクリックします。
    3. 次を選択します:
       - **Region:** 自分に最も近いもの
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic、Regular、1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key（推奨）またはpassword
    4. **Create Droplet**をクリックし、IPアドレスを控えます。

  </Step>

  <Step title="接続してインストールする">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24をインストール
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClawをインストール
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    このウィザードでは、モデル認証、channel設定、gatewayトークン生成、daemonインストール（systemd）を順に設定します。

  </Step>

  <Step title="swapを追加する（1 GB Dropletでは推奨）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="gatewayを確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UIにアクセスする">
    gatewayはデフォルトでloopbackにbindします。次のいずれかの方法を選んでください。

    **オプションA: SSHトンネル（最も簡単）**

    ```bash
    # ローカルマシンから
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    その後、`http://localhost:18789`を開きます。

    **オプションB: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    その後、tailnet上の任意のデバイスから`https://<magicdns>/`を開きます。

    **オプションC: Tailnet bind（Serveなし）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    その後、`http://<tailscale-ip>:18789`を開きます（トークンが必要です）。

  </Step>
</Steps>

## トラブルシューティング

**Gatewayが起動しない** -- `openclaw doctor --non-interactive`を実行し、`journalctl --user -u openclaw-gateway.service -n 50`でログを確認してください。

**ポートがすでに使用中** -- `lsof -i :18789`を実行してプロセスを見つけ、その後停止してください。

**メモリ不足** -- `free -h`でswapが有効か確認してください。それでもOOMが発生する場合は、ローカルモデルではなくAPIベースのモデル（Claude、GPT）を使うか、2 GB Dropletにアップグレードしてください。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discordなどを接続する
- [Gateway configuration](/gateway/configuration) -- すべての設定オプション
- [Updating](/install/updating) -- OpenClawを最新に保つ
