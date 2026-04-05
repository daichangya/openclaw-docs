---
read_when:
    - Raspberry Pi 上で OpenClaw をセットアップする場合
    - ARM デバイス上で OpenClaw を実行する場合
    - 安価で常時稼働する個人用 AI を構築する場合
summary: 常時稼働のセルフホスティングのために Raspberry Pi 上で OpenClaw をホストする
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T12:49:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Raspberry Pi 上で永続的かつ常時稼働する OpenClaw Gateway を実行します。Pi は Gateway だけを担当し（モデルは API 経由でクラウド上で実行される）ため、控えめな Pi でもこのワークロードを十分に処理できます。

## 前提条件

- 2 GB 以上の RAM を搭載した Raspberry Pi 4 または 5（4 GB 推奨）
- MicroSD カード（16 GB 以上）または USB SSD（より高性能）
- 公式 Pi 電源
- ネットワーク接続（Ethernet または WiFi）
- 64-bit Raspberry Pi OS（必須 -- 32-bit は使用しないでください）
- 約 30 分

## セットアップ

<Steps>
  <Step title="OS を書き込む">
    ヘッドレスサーバーには **Raspberry Pi OS Lite (64-bit)** を使います。デスクトップは不要です。

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
    2. OS に **Raspberry Pi OS Lite (64-bit)** を選択します。
    3. 設定ダイアログで事前設定します:
       - ホスト名: `gateway-host`
       - SSH を有効にする
       - ユーザー名とパスワードを設定する
       - WiFi を設定する（Ethernet を使わない場合）
    4. SD カードまたは USB ドライブに書き込み、挿入して Pi を起動します。

  </Step>

  <Step title="SSH で接続する">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="システムを更新する">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # タイムゾーンを設定（cron とリマインダーに重要）
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 をインストールする">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="swap を追加する（2 GB 以下では重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 低 RAM デバイス向けに swappiness を下げる
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw をインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従って進めてください。ヘッドレスデバイスでは OAuth より API キーが推奨です。最初に始めるチャネルとしては Telegram が最も簡単です。

  </Step>

  <Step title="確認する">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI にアクセスする">
    自分のコンピューターで、Pi からダッシュボード URL を取得します:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    次に、別のターミナルで SSH トンネルを作成します:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    表示された URL をローカルブラウザーで開いてください。常時利用できるリモートアクセスについては、[Tailscale integration](/gateway/tailscale) を参照してください。

  </Step>
</Steps>

## パフォーマンスのヒント

**USB SSD を使う** -- SD カードは遅く、摩耗しやすいです。USB SSD を使うとパフォーマンスが大幅に向上します。[Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

**module compile cache を有効にする** -- 低性能な Pi ホストでは、CLI の繰り返し実行を高速化します:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**メモリー使用量を減らす** -- ヘッドレス構成では、GPU メモリーを解放し、未使用サービスを無効にします:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## トラブルシューティング

**メモリー不足** -- `free -h` で swap が有効か確認してください。未使用サービスを無効にします（`sudo systemctl disable cups bluetooth avahi-daemon`）。API ベースのモデルのみを使用してください。

**パフォーマンスが遅い** -- SD カードではなく USB SSD を使ってください。`vcgencmd get_throttled` で CPU スロットリングを確認します（`0x0` を返すはずです）。

**サービスが起動しない** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100` でログを確認し、`openclaw doctor --non-interactive` を実行してください。これがヘッドレス Pi の場合は、lingering が有効になっていることも確認してください: `sudo loginctl enable-linger "$(whoami)"`。

**ARM バイナリの問題** -- Skill が `exec format error` で失敗する場合、そのバイナリに ARM64 ビルドがあるか確認してください。`uname -m` でアーキテクチャーを確認します（`aarch64` が表示されるはずです）。

**WiFi が切断される** -- WiFi の省電力管理を無効にします: `sudo iwconfig wlan0 power off`。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discord などを接続する
- [Gateway configuration](/gateway/configuration) -- すべての設定オプション
- [Updating](/install/updating) -- OpenClaw を最新の状態に保つ
