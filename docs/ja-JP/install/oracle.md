---
read_when:
    - Oracle CloudでOpenClawをセットアップする場合
    - OpenClaw向けの無料VPSホスティングを探している場合
    - 小さなサーバーで24時間365日OpenClawを動かしたい場合
summary: Oracle CloudのAlways Free ARMティアでOpenClawをホストする
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-05T12:48:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6915f8c428cfcbc215ba6547273df6e7b93212af6590827a3853f15617ba245e
    source_path: install/oracle.md
    workflow: 15
---

# Oracle Cloud

Oracle Cloudの**Always Free** ARMティア（最大4 OCPU、24 GB RAM、200 GBストレージ）で、永続的なOpenClaw Gatewayを無料で実行できます。

## 前提条件

- Oracle Cloudアカウント（[signup](https://www.oracle.com/cloud/free/)） -- 問題が発生した場合は[community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照してください
- Tailscaleアカウント（[tailscale.com](https://tailscale.com) で無料）
- SSHキーペア
- 約30分

## セットアップ

<Steps>
  <Step title="OCIインスタンスを作成する">
    1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします。
    2. **Compute > Instances > Create Instance** に移動します。
    3. 次のように設定します:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04（aarch64）
       - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPUs:** 2（または最大4）
       - **Memory:** 12 GB（または最大24 GB）
       - **Boot volume:** 50 GB（無料で最大200 GB）
       - **SSH key:** 公開鍵を追加
    4. **Create** をクリックし、パブリックIPアドレスを控えます。

    <Tip>
    インスタンス作成が「Out of capacity」で失敗する場合は、別のavailability domainを試すか、後でもう一度試してください。無料ティアの容量には限りがあります。
    </Tip>

  </Step>

  <Step title="接続してシステムを更新する">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` は、一部の依存関係をARMでコンパイルするために必要です。

  </Step>

  <Step title="ユーザーとホスト名を設定する">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    lingerを有効にすると、ログアウト後もユーザーサービスが動作し続けます。

  </Step>

  <Step title="Tailscaleをインストールする">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    以後はTailscale経由で接続します: `ssh ubuntu@openclaw`。

  </Step>

  <Step title="OpenClawをインストールする">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    「How do you want to hatch your bot?」と表示されたら、**Do this later** を選択します。

  </Step>

  <Step title="gatewayを設定する">
    安全なリモートアクセスのために、Tailscale Serveとtoken認証を使用します。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    ここでの `gateway.trustedProxies=["127.0.0.1"]` は、ローカルのTailscale Serveプロキシのforwarded-IP/local-client処理のためだけの設定です。これは **not** `gateway.auth.mode: "trusted-proxy"` です。この構成では、差分ビューアールートは引き続きfail-closed動作を保ちます。forwarded proxy headerなしの生の `127.0.0.1` ビューアーリクエストは `Diff not found` を返すことがあります。添付には `mode=file` / `mode=both` を使うか、共有可能なビューアーリンクが必要な場合は、意図的にリモートビューアーを有効にして `plugins.entries.diffs.config.viewerBaseUrl` を設定する（またはプロキシの `baseUrl` を渡す）ようにしてください。

  </Step>

  <Step title="VCNセキュリティをロックダウンする">
    ネットワークエッジで、Tailscale以外のすべてのトラフィックを遮断します:

    1. OCI Consoleで **Networking > Virtual Cloud Networks** に移動します。
    2. 自分のVCNをクリックし、次に **Security Lists > Default Security List** を開きます。
    3. `0.0.0.0/0 UDP 41641`（Tailscale）を除くすべてのingressルールを**削除**します。
    4. デフォルトのegressルール（すべての送信を許可）はそのままにします。

    これにより、ネットワークエッジでポート22のSSH、HTTP、HTTPS、そのほかすべてが遮断されます。以後はTailscale経由でしか接続できません。

  </Step>

  <Step title="確認する">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    tailnet上の任意のデバイスからコントロールUIにアクセスします:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>` は自分のtailnet名に置き換えてください（`tailscale status` で確認できます）。

  </Step>
</Steps>

## フォールバック: SSHトンネル

Tailscale Serveが動作しない場合は、ローカルマシンからSSHトンネルを使用します:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789` を開きます。

## トラブルシューティング

**インスタンス作成に失敗する（「Out of capacity」）** -- 無料ティアのARMインスタンスは人気があります。別のavailability domainを試すか、混雑していない時間帯に再試行してください。

**Tailscaleが接続しない** -- `sudo tailscale up --ssh --hostname=openclaw --reset` を実行して再認証してください。

**Gatewayが起動しない** -- `openclaw doctor --non-interactive` を実行し、`journalctl --user -u openclaw-gateway.service -n 50` でログを確認してください。

**ARMバイナリの問題** -- ほとんどのnpmパッケージはARM64で動作します。ネイティブバイナリについては、`linux-arm64` または `aarch64` リリースを探してください。アーキテクチャは `uname -m` で確認できます。

## 次のステップ

- [Channels](/ja-JP/channels) -- Telegram、WhatsApp、Discordなどを接続
- [Gateway configuration](/gateway/configuration) -- すべての設定オプション
- [Updating](/install/updating) -- OpenClawを最新に保つ
