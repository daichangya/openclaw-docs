---
read_when:
    - Network Security Groupの強化を行いつつ、Azure上でOpenClawを24時間365日実行したい場合
    - 自分のAzure Linux VM上で、本番グレードの常時稼働するOpenClaw Gatewayを使いたい場合
    - Azure Bastion SSHで安全に管理したい場合
summary: 耐久性のある状態を保持しながら、Azure Linux VM上でOpenClaw Gatewayを24時間365日実行する
title: Azure
x-i18n:
    generated_at: "2026-04-05T12:47:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# Azure Linux VM上のOpenClaw

このガイドでは、Azure CLIを使ってAzure Linux VMをセットアップし、Network Security Group（NSG）の強化を適用し、SSHアクセス用にAzure Bastionを設定し、OpenClawをインストールします。

## 実施内容

- Azure CLIでAzureのネットワーク（VNet、subnets、NSG）とコンピュートリソースを作成する
- Azure BastionからのみVM SSHを許可するようにNetwork Security Groupルールを適用する
- SSHアクセスにAzure Bastionを使用する（VMにはpublic IPを付与しない）
- インストーラスクリプトでOpenClawをインストールする
- Gatewayを確認する

## 必要なもの

- コンピュートおよびネットワークリソースを作成する権限を持つAzureサブスクリプション
- インストール済みのAzure CLI（必要に応じて[Azure CLIのインストール手順](https://learn.microsoft.com/cli/azure/install-azure-cli)を参照）
- SSHキーペア（必要であればこのガイドで生成方法も案内します）
- 約20〜30分

## デプロイを設定する

<Steps>
  <Step title="Azure CLIにサインインする">
    ```bash
    az login
    az extension add -n ssh
    ```

    `ssh`拡張機能は、Azure BastionのネイティブSSHトンネリングに必要です。

  </Step>

  <Step title="必要なresource providerを登録する（初回のみ）">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    登録状態を確認します。両方が`Registered`になるまで待ってください。

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="デプロイ変数を設定する">
    ```bash
    RG="rg-openclaw"
    LOCATION="westus2"
    VNET_NAME="vnet-openclaw"
    VNET_PREFIX="10.40.0.0/16"
    VM_SUBNET_NAME="snet-openclaw-vm"
    VM_SUBNET_PREFIX="10.40.2.0/24"
    BASTION_SUBNET_PREFIX="10.40.1.0/26"
    NSG_NAME="nsg-openclaw-vm"
    VM_NAME="vm-openclaw"
    ADMIN_USERNAME="openclaw"
    BASTION_NAME="bas-openclaw"
    BASTION_PIP_NAME="pip-openclaw-bastion"
    ```

    名前やCIDR範囲は環境に合わせて調整してください。Bastion subnetは少なくとも`/26`である必要があります。

  </Step>

  <Step title="SSHキーを選択する">
    既存の公開鍵がある場合は、それを使用します:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    まだSSHキーがない場合は生成します:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VMサイズとOSディスクサイズを選択する">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    サブスクリプションとリージョンで利用可能なVMサイズとOSディスクサイズを選択してください:

    - 軽い用途なら小さめで開始し、後でスケールアップする
    - より重い自動化、より多くのchannels、またはより大きなモデル/toolワークロードには、より多くのvCPU/RAM/diskを使う
    - リージョンやサブスクリプションクォータでVMサイズが利用できない場合は、最も近い利用可能SKUを選ぶ

    対象リージョンで利用可能なVMサイズを一覧表示します:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    現在のvCPUおよびdiskの使用量/クォータを確認します:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azureリソースをデプロイする

<Steps>
  <Step title="resource groupを作成する">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="network security groupを作成する">
    NSGを作成し、Bastion subnetからのみVMへSSH接続できるようにルールを追加します。

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Bastion subnetからのみSSHを許可
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # public internetからのSSHを拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # その他のVNetソースからのSSHを拒否
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    ルールは優先順位で評価されます（数値が小さい方が先です）。Bastionトラフィックは100で許可され、その後、その他すべてのSSHは110と120でブロックされます。

  </Step>

  <Step title="virtual networkとsubnetsを作成する">
    VM subnet（NSGをアタッチ）付きでVNetを作成し、その後Bastion subnetを追加します。

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # VM subnetにNSGをアタッチ
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — Azureで必須の名前
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VMを作成する">
    このVMにはpublic IPがありません。SSHアクセスはAzure Bastion経由のみです。

    ```bash
    az vm create \
      -g "${RG}" -n "${VM_NAME}" -l "${LOCATION}" \
      --image "Canonical:ubuntu-24_04-lts:server:latest" \
      --size "${VM_SIZE}" \
      --os-disk-size-gb "${OS_DISK_SIZE_GB}" \
      --storage-sku StandardSSD_LRS \
      --admin-username "${ADMIN_USERNAME}" \
      --ssh-key-values "${SSH_PUB_KEY}" \
      --vnet-name "${VNET_NAME}" \
      --subnet "${VM_SUBNET_NAME}" \
      --public-ip-address "" \
      --nsg ""
    ```

    `--public-ip-address ""`はpublic IPが割り当てられるのを防ぎます。`--nsg ""`はNIC単位のNSG作成をスキップします（subnetレベルのNSGがセキュリティを処理します）。

    **再現性:** 上記コマンドではUbuntuイメージに`latest`を使用しています。特定バージョンに固定するには、利用可能なバージョンを一覧表示して`latest`を置き換えてください:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastionを作成する">
    Azure Bastionは、public IPを公開せずに、VMへのマネージドSSHアクセスを提供します。CLIベースの`az network bastion ssh`には、トンネリング対応のStandard SKUが必要です。

    ```bash
    az network public-ip create \
      -g "${RG}" -n "${BASTION_PIP_NAME}" -l "${LOCATION}" \
      --sku Standard --allocation-method Static

    az network bastion create \
      -g "${RG}" -n "${BASTION_NAME}" -l "${LOCATION}" \
      --vnet-name "${VNET_NAME}" \
      --public-ip-address "${BASTION_PIP_NAME}" \
      --sku Standard --enable-tunneling true
    ```

    Bastionのプロビジョニングには通常5〜10分かかりますが、リージョンによっては15〜30分かかることがあります。

  </Step>
</Steps>

## OpenClawをインストールする

<Steps>
  <Step title="Azure Bastion経由でVMにSSH接続する">
    ```bash
    VM_ID="$(az vm show -g "${RG}" -n "${VM_NAME}" --query id -o tsv)"

    az network bastion ssh \
      --name "${BASTION_NAME}" \
      --resource-group "${RG}" \
      --target-resource-id "${VM_ID}" \
      --auth-type ssh-key \
      --username "${ADMIN_USERNAME}" \
      --ssh-key ~/.ssh/id_ed25519
    ```

  </Step>

  <Step title="OpenClawをインストールする（VMシェル内で実行）">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    インストーラーは、まだ存在しない場合はNode LTSと依存関係をインストールし、OpenClawをインストールして、オンボーディングウィザードを起動します。詳細は[Install](/install)を参照してください。

  </Step>

  <Step title="Gatewayを確認する">
    オンボーディング完了後:

    ```bash
    openclaw gateway status
    ```

    多くの企業AzureチームはすでにGitHub Copilotライセンスを持っています。その場合は、OpenClawのオンボーディングウィザードでGitHub Copilotプロバイダーを選ぶことをおすすめします。[GitHub Copilot provider](/providers/github-copilot)を参照してください。

  </Step>
</Steps>

## コストに関する考慮事項

Azure Bastion Standard SKUの費用はおよそ**\$140/月**、VM（Standard_B2as_v2）はおよそ**\$55/月**です。

コストを抑えるには:

- **未使用時はVMをdeallocateする**（コンピュート課金は停止しますが、disk料金は残ります）。VMがdeallocateされている間はOpenClaw Gatewayに到達できません。再び利用する際に起動してください:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # 後で再起動
  ```

- **不要時はBastionを削除**し、SSHアクセスが必要なときに再作成する。Bastionが最大のコスト要因であり、プロビジョニングには数分しかかかりません。
- **Basic Bastion SKU**（約\$38/月）を使用する。PortalベースのSSHだけで十分で、CLIトンネリング（`az network bastion ssh`）が不要な場合に適しています。

## クリーンアップ

このガイドで作成したすべてのリソースを削除するには:

```bash
az group delete -n "${RG}" --yes --no-wait
```

これによりresource groupと、その中のすべて（VM、VNet、NSG、Bastion、public IP）が削除されます。

## 次のステップ

- メッセージングchannelsを設定する: [Channels](/ja-JP/channels)
- ローカルデバイスをnodeとしてペアリングする: [Nodes](/nodes)
- Gatewayを設定する: [Gateway configuration](/gateway/configuration)
- GitHub Copilotモデルプロバイダーを使ったOpenClawのAzureデプロイ詳細: [GitHub Copilotを使ったAzure上のOpenClaw](https://github.com/johnsonshi/openclaw-azure-github-copilot)
