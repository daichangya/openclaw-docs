---
read_when:
    - セキュリティ強化を伴う自動サーバーデプロイを行いたい場合
    - VPNアクセス付きのファイアウォール分離構成が必要な場合
    - リモートのDebian/Ubuntuサーバーにデプロイしている場合
summary: Ansible、Tailscale VPN、ファイアウォール分離による、自動化され強化されたOpenClawインストール
title: Ansible
x-i18n:
    generated_at: "2026-04-05T12:46:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Ansibleインストール

本番サーバーにOpenClawをデプロイするには、**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使用します。これは、セキュリティファーストのアーキテクチャを備えた自動インストーラーです。

<Info>
Ansibleデプロイの信頼できる情報源は [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) リポジトリです。このページは簡単な概要です。
</Info>

## 前提条件

| Requirement | Details                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ または Ubuntu 20.04+                           |
| **Access**  | root または sudo 権限                                     |
| **Network** | パッケージインストール用のインターネット接続              |
| **Ansible** | 2.14+ （クイックスタートスクリプトによって自動インストールされます） |

## 導入されるもの

- **ファイアウォール優先のセキュリティ** -- UFW + Docker分離（SSH + Tailscaleのみアクセス可能）
- **Tailscale VPN** -- サービスを公開せずに安全なリモートアクセス
- **Docker** -- 分離されたサンドボックスコンテナ、localhost専用バインド
- **多層防御** -- 4層のセキュリティアーキテクチャ
- **Systemd統合** -- ハードニング付きで起動時に自動開始
- **ワンコマンドセットアップ** -- 数分で完全デプロイ

## クイックスタート

ワンコマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## インストールされる内容

Ansible playbookは次をインストールして設定します:

1. **Tailscale** -- 安全なリモートアクセスのためのメッシュVPN
2. **UFW firewall** -- SSH + Tailscaleポートのみ
3. **Docker CE + Compose V2** -- エージェントサンドボックス用
4. **Node.js 24 + pnpm** -- ランタイム依存関係（Node 22 LTS、現在 `22.14+`、も引き続きサポート）
5. **OpenClaw** -- コンテナ化ではなくホストベース
6. **Systemd service** -- セキュリティハードニング付き自動起動

<Note>
gatewayはDocker内ではなくホスト上で直接実行されますが、エージェントサンドボックスは分離のためにDockerを使用します。詳細は [サンドボックス化](/gateway/sandboxing) を参照してください。
</Note>

## インストール後のセットアップ

<Steps>
  <Step title="openclawユーザーに切り替える">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="オンボーディングウィザードを実行する">
    インストール後スクリプトが、OpenClaw設定の構成を案内します。
  </Step>
  <Step title="メッセージングプロバイダーを接続する">
    WhatsApp、Telegram、Discord、またはSignalにログインします:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="インストールを確認する">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscaleに接続する">
    安全なリモートアクセスのためにVPNメッシュに参加します。
  </Step>
</Steps>

### クイックコマンド

```bash
# サービス状態を確認
sudo systemctl status openclaw

# ライブログを表示
sudo journalctl -u openclaw -f

# gatewayを再起動
sudo systemctl restart openclaw

# プロバイダーログイン（openclawユーザーとして実行）
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

このデプロイは4層の防御モデルを使用します:

1. **ファイアウォール（UFW）** -- SSH（22）+ Tailscale（41641/udp）のみを公開
2. **VPN（Tailscale）** -- gatewayはVPNメッシュ経由でのみアクセス可能
3. **Docker分離** -- DOCKER-USER iptablesチェーンが外部ポート公開を防止
4. **Systemdハードニング** -- NoNewPrivileges、PrivateTmp、非特権ユーザー

外部攻撃面を確認するには:

```bash
nmap -p- YOUR_SERVER_IP
```

開いているべきなのはポート22（SSH）のみです。ほかのすべてのサービス（gateway、Docker）はロックダウンされます。

Dockerはgateway自体を実行するためではなく、エージェントサンドボックス（分離されたツール実行）のためにインストールされます。サンドボックス設定については [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) を参照してください。

## 手動インストール

自動化よりも手動で制御したい場合:

<Steps>
  <Step title="前提パッケージをインストールする">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="リポジトリをcloneする">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansibleコレクションをインストールする">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="playbookを実行する">
    ```bash
    ./run-playbook.sh
    ```

    あるいは、直接実行してから後でセットアップスクリプトを手動実行することもできます:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 次に実行: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansibleインストーラーは、OpenClawを手動更新できるように設定します。標準の更新フローについては [Updating](/install/updating) を参照してください。

Ansible playbookを再実行するには（たとえば設定変更のため）:

```bash
cd openclaw-ansible
./run-playbook.sh
```

これは冪等であり、複数回実行しても安全です。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ファイアウォールで接続がブロックされる">
    - まずTailscale VPN経由でアクセスできることを確認してください
    - SSHアクセス（ポート22）は常に許可されます
    - gatewayは設計上、Tailscale経由でのみアクセス可能です
  </Accordion>
  <Accordion title="サービスが起動しない">
    ```bash
    # ログを確認
    sudo journalctl -u openclaw -n 100

    # 権限を確認
    sudo ls -la /opt/openclaw

    # 手動起動をテスト
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Dockerサンドボックスの問題">
    ```bash
    # Dockerが動作していることを確認
    sudo systemctl status docker

    # サンドボックスイメージを確認
    sudo docker images | grep openclaw-sandbox

    # なければサンドボックスイメージをビルド
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="プロバイダーログインに失敗する">
    `openclaw` ユーザーとして実行していることを確認してください:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高度な設定

詳細なセキュリティアーキテクチャとトラブルシューティングについては、openclaw-ansibleリポジトリを参照してください:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完全なデプロイガイド
- [Docker](/install/docker) -- コンテナ化されたgatewayセットアップ
- [サンドボックス化](/gateway/sandboxing) -- エージェントサンドボックス設定
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- エージェントごとの分離
