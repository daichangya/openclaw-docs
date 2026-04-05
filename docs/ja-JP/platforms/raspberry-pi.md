---
read_when:
    - Raspberry Pi で OpenClaw をセットアップしている
    - ARM デバイス上で OpenClaw を実行している
    - 安価で常時稼働する個人用 AI を構築したい
summary: Raspberry Pi 上で OpenClaw を実行する（低予算のセルフホスト構成）
title: Raspberry Pi（プラットフォーム）
x-i18n:
    generated_at: "2026-04-05T12:51:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi 上の OpenClaw

## 目標

Raspberry Pi 上で、永続的かつ常時稼働する OpenClaw Gateway を、**約 $35〜80** の一回限りの費用で実行します（月額料金なし）。

最適な用途:

- 24 時間 365 日動く個人用 AI アシスタント
- ホームオートメーションハブ
- 低消費電力で常時利用可能な Telegram / WhatsApp ボット

## ハードウェア要件

| Pi モデル        | RAM     | 動作するか | 注記 |
| --------------- | ------- | ---------- | ---- |
| **Pi 5**        | 4GB/8GB | ✅ 最適    | 最も高速、推奨 |
| **Pi 4**        | 4GB     | ✅ 良好    | ほとんどのユーザーにとっての最適解 |
| **Pi 4**        | 2GB     | ✅ 可      | 動作するが、swap を追加 |
| **Pi 4**        | 1GB     | ⚠️ 厳しい  | swap と最小構成で可能 |
| **Pi 3B+**      | 1GB     | ⚠️ 遅い    | 動作するがもっさりする |
| **Pi Zero 2 W** | 512MB   | ❌         | 非推奨 |

**最小仕様:** 1GB RAM、1 コア、500MB ディスク  
**推奨:** 2GB 以上の RAM、64-bit OS、16GB 以上の SD カード（または USB SSD）

## 必要なもの

- Raspberry Pi 4 または 5（2GB 以上推奨）
- MicroSD カード（16GB 以上）または USB SSD（より高性能）
- 電源（公式 Pi PSU を推奨）
- ネットワーク接続（Ethernet または WiFi）
- 約 30 分

## 1) OS を書き込む

ヘッドレスサーバーにはデスクトップ不要なので、**Raspberry Pi OS Lite (64-bit)** を使います。

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロード
2. OS として **Raspberry Pi OS Lite (64-bit)** を選択
3. 歯車アイコン（⚙️）をクリックして事前設定:
   - ホスト名を設定: `gateway-host`
   - SSH を有効化
   - ユーザー名 / パスワードを設定
   - WiFi を設定（Ethernet を使わない場合）
4. SD カード / USB ドライブに書き込む
5. Pi に挿して起動する

## 2) SSH で接続する

```bash
ssh user@gateway-host
# または IP アドレスを使う
ssh user@192.168.x.x
```

## 3) システムセットアップ

```bash
# システムを更新
sudo apt update && sudo apt upgrade -y

# 必須パッケージをインストール
sudo apt install -y git curl build-essential

# タイムゾーンを設定（cron / リマインダーで重要）
sudo timedatectl set-timezone America/Chicago  # あなたのタイムゾーンに変更
```

## 4) Node.js 24 をインストールする（ARM64）

```bash
# NodeSource 経由で Node.js をインストール
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 確認
node --version  # v24.x.x と表示されるはず
npm --version
```

## 5) Swap を追加する（2GB 以下では重要）

Swap は out-of-memory クラッシュを防ぎます。

```bash
# 2GB の swap ファイルを作成
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永続化
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 低 RAM 向けに最適化（swappiness を下げる）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw をインストールする

### Option A: 標準インストール（推奨）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B: Hackable インストール（いじりたい場合）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Hackable インストールでは、ログとコードに直接アクセスできます。ARM 固有の問題をデバッグするときに便利です。

## 7) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードに従ってください。

1. **Gateway mode:** Local
2. **Auth:** API キーを推奨（OAuth はヘッドレス Pi では扱いにくいことがあります）
3. **Channels:** 最初は Telegram が最も簡単
4. **Daemon:** Yes（systemd）

## 8) インストールを確認する

```bash
# ステータス確認
openclaw status

# サービス確認（標準インストール = systemd user unit）
systemctl --user status openclaw-gateway.service

# ログ表示
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw Dashboard にアクセスする

`user@gateway-host` を、あなたの Pi のユーザー名とホスト名または IP アドレスに置き換えてください。

あなたのコンピューター上で、Pi に新しい dashboard URL を表示させます。

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

このコマンドは `Dashboard URL:` を出力します。`gateway.auth.token`
の設定方法によっては、URL は単純な `http://127.0.0.1:18789/` リンクか、
`#token=...` を含むリンクになります。

あなたのコンピューター上の別ターミナルで、SSH トンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

その後、表示された Dashboard URL をローカルブラウザーで開いてください。

UI が shared-secret auth を求める場合は、設定済みの token または password
を Control UI settings に貼り付けてください。token auth の場合は `gateway.auth.token`（または
`OPENCLAW_GATEWAY_TOKEN`）を使います。

常時接続のリモートアクセスについては、[Tailscale](/gateway/tailscale) を参照してください。

---

## パフォーマンス最適化

### USB SSD を使う（大幅改善）

SD カードは遅く、消耗します。USB SSD を使うとパフォーマンスが大きく改善します。

```bash
# USB から起動しているか確認
lsblk
```

セットアップについては [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

### CLI 起動を高速化する（module compile cache）

低性能な Pi ホストでは、Node の module compile cache を有効にすると、繰り返しの CLI 実行が速くなります。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

注意:

- `NODE_COMPILE_CACHE` は後続の実行（`status`、`health`、`--help`）を高速化します。
- `/var/tmp` は `/tmp` より再起動後も保持されやすいです。
- `OPENCLAW_NO_RESPAWN=1` は CLI の自己再起動による追加の起動コストを避けます。
- 初回実行でキャッシュが温まり、その後の実行で最も効果が出ます。

### systemd 起動調整（任意）

この Pi が主に OpenClaw を実行する用途であれば、service drop-in を追加して再起動時の
揺れを減らし、起動環境を安定させます。

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

その後適用します。

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

可能であれば、cold start 中の SD カードのランダム I/O ボトルネックを避けるため、
OpenClaw の state / cache は SSD ベースのストレージ上に置いてください。

これがヘッドレス Pi の場合、user service がログアウト後も維持されるよう、一度だけ lingering を有効にしてください。

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` ポリシーが自動復旧にどう役立つか:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### メモリ使用量を減らす

```bash
# GPU メモリ割り当てを無効化（ヘッドレス）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Bluetooth が不要なら無効化
sudo systemctl disable bluetooth
```

### リソースを監視する

```bash
# メモリ確認
free -h

# CPU 温度確認
vcgencmd measure_temp

# ライブ監視
htop
```

---

## ARM 固有の注意

### バイナリ互換性

OpenClaw のほとんどの機能は ARM64 で動作しますが、一部の外部バイナリには ARM ビルドが必要な場合があります。

| Tool               | ARM64 状態 | 注記 |
| ------------------ | ---------- | ---- |
| Node.js            | ✅         | 問題なく動作 |
| WhatsApp (Baileys) | ✅         | Pure JS、問題なし |
| Telegram           | ✅         | Pure JS、問題なし |
| gog (Gmail CLI)    | ⚠️         | ARM リリースがあるか確認 |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

Skill が失敗した場合は、そのバイナリに ARM ビルドがあるか確認してください。多くの Go / Rust ツールにはありますが、ないものもあります。

### 32-bit と 64-bit

**必ず 64-bit OS を使ってください。** Node.js や多くのモダンなツールで必要です。次で確認できます。

```bash
uname -m
# aarch64（64-bit）と表示されるべき。armv7l（32-bit）ではない
```

---

## 推奨モデル設定

Pi は Gateway にすぎず（モデルはクラウドで実行されるため）、API ベースのモデルを使ってください。

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Pi 上でローカル LLM を動かそうとしないでください**。小さいモデルでも遅すぎます。重い処理は Claude / GPT に任せてください。

---

## 起動時の自動起動

オンボーディングで設定されますが、確認するには:

```bash
# サービスが有効か確認
systemctl --user is-enabled openclaw-gateway.service

# 有効でなければ有効化
systemctl --user enable openclaw-gateway.service

# 起動時に開始
systemctl --user start openclaw-gateway.service
```

---

## トラブルシューティング

### Out of Memory（OOM）

```bash
# メモリ確認
free -h

# swap を増やす（ステップ 5 を参照）
# または Pi 上で動いているサービスを減らす
```

### 動作が遅い

- SD カードの代わりに USB SSD を使う
- 未使用のサービスを無効化: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU スロットリングを確認: `vcgencmd get_throttled`（`0x0` が返るべき）

### Service が起動しない

```bash
# ログ確認
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# よくある修正: rebuild
cd ~/openclaw  # hackable install を使っている場合
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM バイナリの問題

Skill が "exec format error" で失敗する場合:

1. そのバイナリに ARM64 ビルドがあるか確認する
2. ソースからビルドしてみる
3. または ARM サポート付きの Docker コンテナーを使う

### WiFi が切れる

WiFi 接続のヘッドレス Pi の場合:

```bash
# WiFi 電源管理を無効化
sudo iwconfig wlan0 power off

# 永続化
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## コスト比較

| 構成           | 初期費用 | 月額費用 | 注記 |
| -------------- | -------- | -------- | ---- |
| **Pi 4 (2GB)** | ~$45     | $0       | + 電気代（年間約 $5） |
| **Pi 4 (4GB)** | ~$55     | $0       | 推奨 |
| **Pi 5 (4GB)** | ~$60     | $0       | 最良のパフォーマンス |
| **Pi 5 (8GB)** | ~$80     | $0       | 過剰だが将来性あり |
| DigitalOcean   | $0       | $6/月    | 年間 $72 |
| Hetzner        | $0       | €3.79/月 | 年間約 $50 |

**損益分岐点:** Pi はクラウド VPS と比べて約 6〜12 か月で元が取れます。

---

## 関連項目

- [Linux guide](/platforms/linux) — 一般的な Linux セットアップ
- [DigitalOcean guide](/platforms/digitalocean) — クラウドの代替
- [Hetzner guide](/install/hetzner) — Docker セットアップ
- [Tailscale](/gateway/tailscale) — リモートアクセス
- [Nodes](/nodes) — ラップトップ / スマートフォンを Pi gateway と pairing する
