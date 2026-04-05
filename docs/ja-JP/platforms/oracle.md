---
read_when:
    - Oracle Cloud上でOpenClawをセットアップする場合
    - OpenClaw向けの低コストVPSホスティングを探している場合
    - 小さなサーバーで24時間365日OpenClawを動かしたい場合
summary: Oracle Cloud上のOpenClaw（Always Free ARM）
title: Oracle Cloud（プラットフォーム）
x-i18n:
    generated_at: "2026-04-05T12:51:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# Oracle Cloud（OCI）上のOpenClaw

## 目標

Oracle Cloudの**Always Free** ARM tierで、永続的なOpenClaw Gatewayを実行します。

Oracleのfree tierはOpenClawにとって非常に相性が良い場合があります（特に、すでにOCIアカウントを持っている場合）が、いくつかのトレードオフがあります:

- ARMアーキテクチャ（ほとんどのものは動作しますが、一部のバイナリはx86専用の可能性があります）
- 容量やサインアップが不安定なことがある

## コスト比較（2026年）

| Provider     | Plan            | Specs                  | Price/mo | Notes                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 最大4 OCPU、24GB RAM   | $0       | ARM、容量制限あり     |
| Hetzner      | CX22            | 2 vCPU、4GB RAM        | ~ $4     | 最安の有料オプション  |
| DigitalOcean | Basic           | 1 vCPU、1GB RAM        | $6       | UIが簡単、ドキュメント充実 |
| Vultr        | Cloud Compute   | 1 vCPU、1GB RAM        | $6       | ロケーションが多い    |
| Linode       | Nanode          | 1 vCPU、1GB RAM        | $5       | 現在はAkamai傘下      |

---

## 前提条件

- Oracle Cloudアカウント（[signup](https://www.oracle.com/cloud/free/)） — 問題が発生した場合は[コミュニティのsignup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照してください
- Tailscaleアカウント（[tailscale.com](https://tailscale.com)で無料）
- 約30分

## 1) OCIインスタンスを作成する

1. [Oracle Cloud Console](https://cloud.oracle.com/)にログインします
2. **Compute → Instances → Create Instance**へ移動します
3. 次のように設定します:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04（aarch64）
   - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs:** 2（または最大4）
   - **Memory:** 12 GB（または最大24 GB）
   - **Boot volume:** 50 GB（最大200 GBまで無料）
   - **SSH key:** 公開鍵を追加
4. **Create**をクリックします
5. Public IPアドレスを控えます

**Tip:** インスタンス作成が「Out of capacity」で失敗する場合は、別のavailability domainを試すか、後で再試行してください。free tierの容量には制限があります。

## 2) 接続して更新する

```bash
# Public IP経由で接続
ssh ubuntu@YOUR_PUBLIC_IP

# システムを更新
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注:** `build-essential`は、一部の依存関係をARM向けにコンパイルするために必要です。

## 3) ユーザーとhostnameを設定する

```bash
# hostnameを設定
sudo hostnamectl set-hostname openclaw

# ubuntuユーザーのパスワードを設定
sudo passwd ubuntu

# lingeringを有効化（logout後もユーザーサービスを動かし続ける）
sudo loginctl enable-linger ubuntu
```

## 4) Tailscaleをインストールする

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

これによりTailscale SSHが有効になり、tailnet上の任意のデバイスから`ssh openclaw`で接続できるようになります。public IPは不要です。

確認:

```bash
tailscale status
```

**以後はTailscale経由で接続してください:** `ssh ubuntu@openclaw`（またはTailscale IPを使用）。

## 5) OpenClawをインストールする

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

「How do you want to hatch your bot?」と表示されたら、**「Do this later」**を選択してください。

> 注: ARMネイティブのビルド問題に遭遇した場合は、Homebrewに頼る前に、まずシステムパッケージ（例: `sudo apt install -y build-essential`）から始めてください。

## 6) Gatewayを設定する（loopback + token auth）し、Tailscale Serveを有効にする

デフォルトとしてtoken authを使用します。予測しやすく、Control UIで「insecure auth」フラグを必要としません。

```bash
# VM上ではGatewayを非公開に保つ
openclaw config set gateway.bind loopback

# Gateway + Control UIに認証を必須化
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Tailscale Serve経由で公開（HTTPS + tailnetアクセス）
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

ここでの`gateway.trustedProxies=["127.0.0.1"]`は、ローカルのTailscale Serve proxyのforwarded-IP/local-client処理専用です。これは**`gateway.auth.mode: "trusted-proxy"`ではありません**。この構成では、diff viewerルートはfail-closed動作を維持します。forwarded proxyヘッダーのない生の`127.0.0.1` viewerリクエストは`Diff not found`を返すことがあります。添付ファイルには`mode=file` / `mode=both`を使用するか、共有可能なviewerリンクが必要な場合は、意図的にremote viewerを有効にし、`plugins.entries.diffs.config.viewerBaseUrl`（またはproxyの`baseUrl`）を設定してください。

## 7) 確認する

```bash
# バージョンを確認
openclaw --version

# daemon状態を確認
systemctl --user status openclaw-gateway.service

# Tailscale Serveを確認
tailscale serve status

# ローカル応答をテスト
curl http://localhost:18789
```

## 8) VCNセキュリティをロックダウンする

すべてが動作したら、Tailscale以外のすべてのトラフィックをブロックするようにVCNをロックダウンします。OCIのVirtual Cloud Networkはネットワークエッジのファイアウォールとして機能し、トラフィックはインスタンスに到達する前にブロックされます。

1. OCI Consoleで**Networking → Virtual Cloud Networks**へ移動します
2. 自分のVCNをクリック → **Security Lists** → Default Security List
3. 次以外のすべてのingressルールを**削除**します:
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. デフォルトのegressルールは維持します（すべてのoutboundを許可）

これにより、ポート22のSSH、HTTP、HTTPS、その他すべてがネットワークエッジでブロックされます。以後、接続できるのはTailscale経由のみです。

---

## Control UIにアクセスする

Tailscaleネットワーク上の任意のデバイスから:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>`は自分のtailnet名に置き換えてください（`tailscale status`で確認できます）。

SSHトンネルは不要です。Tailscaleが次を提供します:

- HTTPS暗号化（自動証明書）
- Tailscale identityによる認証
- tailnet上の任意のデバイス（ラップトップ、スマートフォンなど）からのアクセス

---

## セキュリティ: VCN + Tailscale（推奨ベースライン）

VCNをロックダウンし（UDP 41641のみ開放）、Gatewayをloopbackにbindすると、強力な多層防御が得られます。publicトラフィックはネットワークエッジでブロックされ、管理アクセスはtailnet経由で行われます。

この構成では、インターネット全体からのSSHブルートフォースを止めるためだけの追加のホストベースファイアウォールルールは不要になることが多いですが、それでもOSは更新し、`openclaw security audit`を実行し、誤ってpublic interfaceでlistenしていないことを確認してください。

### すでに保護されているもの

| Traditional Step   | Needed?     | Why                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW firewall       | 不要        | VCNがトラフィックがインスタンスへ到達する前にブロックする                                   |
| fail2ban           | 不要        | VCNでポート22がブロックされていればブルートフォースは起きない                                     |
| sshd hardening     | 不要        | Tailscale SSHはsshdを使わない                                               |
| Disable root login | 不要        | TailscaleはシステムユーザーではなくTailscale identityを使う                          |
| SSH key-only auth  | 不要        | Tailscaleはtailnet経由で認証する                                     |
| IPv6 hardening     | 通常は不要  | VCN/subnet設定次第。実際に何が割り当て/公開されているか確認してください |

### 引き続き推奨されるもの

- **認証情報の権限:** `chmod 700 ~/.openclaw`
- **セキュリティ監査:** `openclaw security audit`
- **システム更新:** 定期的に`sudo apt update && sudo apt upgrade`
- **Tailscaleの監視:** [Tailscale admin console](https://login.tailscale.com/admin)でデバイスを確認

### セキュリティ状態を確認する

```bash
# Publicポートでlistenしていないことを確認
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Tailscale SSHが有効か確認
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 任意: sshdを完全に無効化
sudo systemctl disable --now ssh
```

---

## フォールバック: SSHトンネル

Tailscale Serveが動作しない場合は、SSHトンネルを使用します:

```bash
# ローカルマシンから（Tailscale経由）
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789`を開いてください。

---

## トラブルシューティング

### インスタンス作成が失敗する（「Out of capacity」）

free tierのARMインスタンスは人気があります。次を試してください:

- 別のavailability domain
- 混雑していない時間帯に再試行（早朝など）
- shape選択時に「Always Free」フィルターを使う

### Tailscaleが接続しない

```bash
# 状態を確認
sudo tailscale status

# 再認証
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gatewayが起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UIに到達できない

```bash
# Tailscale Serveが動作していることを確認
tailscale serve status

# gatewayがlistenしていることを確認
curl http://localhost:18789

# 必要なら再起動
systemctl --user restart openclaw-gateway.service
```

### ARMバイナリの問題

一部のtoolにはARMビルドがない場合があります。確認:

```bash
uname -m  # aarch64と表示されるはず
```

ほとんどのnpmパッケージは問題なく動作します。バイナリについては、`linux-arm64`または`aarch64`リリースを探してください。

---

## 永続化

すべての状態は次に保存されます:

- `~/.openclaw/` — `openclaw.json`、エージェントごとの`auth-profiles.json`、channel/provider状態、およびセッションデータ
- `~/.openclaw/workspace/` — workspace（SOUL.md、memory、artifacts）

定期的にバックアップしてください:

```bash
openclaw backup create
```

---

## 関連

- [Gateway remote access](/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale integration](/gateway/tailscale) — Tailscaleの完全なドキュメント
- [Gateway configuration](/gateway/configuration) — すべての設定オプション
- [DigitalOcean guide](/platforms/digitalocean) — 有料でsignupがより簡単な選択肢が欲しい場合
- [Hetzner guide](/install/hetzner) — Dockerベースの代替手段
