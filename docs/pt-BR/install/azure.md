---
read_when:
    - Você quer o OpenClaw executando 24/7 no Azure com reforço de segurança via Network Security Group
    - Você quer um Gateway OpenClaw sempre ativo, de nível de produção, na sua própria VM Linux no Azure
    - Você quer administração segura com SSH via Azure Bastion
summary: Execute o Gateway do OpenClaw 24/7 em uma VM Linux no Azure com estado persistente
title: Azure
x-i18n:
    generated_at: "2026-04-05T12:44:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw em VM Linux no Azure

Este guia configura uma VM Linux no Azure com a Azure CLI, aplica reforço de segurança com Network Security Group (NSG), configura o Azure Bastion para acesso SSH e instala o OpenClaw.

## O que você fará

- Criar recursos de rede do Azure (VNet, sub-redes, NSG) e computação com a Azure CLI
- Aplicar regras de Network Security Group para que o SSH da VM seja permitido apenas a partir do Azure Bastion
- Usar o Azure Bastion para acesso SSH (sem IP público na VM)
- Instalar o OpenClaw com o script de instalação
- Verificar o Gateway

## O que você precisa

- Uma assinatura do Azure com permissão para criar recursos de computação e rede
- Azure CLI instalada (consulte [Azure CLI install steps](https://learn.microsoft.com/cli/azure/install-azure-cli) se necessário)
- Um par de chaves SSH (o guia mostra como gerar um, se necessário)
- ~20 a 30 minutos

## Configurar a implantação

<Steps>
  <Step title="Entrar na Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    A extensão `ssh` é necessária para o tunelamento SSH nativo do Azure Bastion.

  </Step>

  <Step title="Registrar os provedores de recursos necessários (uma vez)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifique o registro. Aguarde até que ambos mostrem `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Definir variáveis de implantação">
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

    Ajuste nomes e intervalos CIDR para se adequarem ao seu ambiente. A sub-rede do Bastion deve ter no mínimo `/26`.

  </Step>

  <Step title="Selecionar a chave SSH">
    Use sua chave pública existente se já tiver uma:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Se você ainda não tiver uma chave SSH, gere uma:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Selecionar o tamanho da VM e o tamanho do disco do SO">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Escolha um tamanho de VM e um tamanho de disco do SO disponíveis na sua assinatura e região:

    - Comece menor para uso leve e aumente depois
    - Use mais vCPU/RAM/disco para automações mais pesadas, mais canais ou cargas maiores de modelo/ferramentas
    - Se um tamanho de VM não estiver disponível na sua região ou na cota da sua assinatura, escolha o SKU disponível mais próximo

    Liste os tamanhos de VM disponíveis na região de destino:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Verifique seu uso/cota atual de vCPU e disco:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Implantar recursos do Azure

<Steps>
  <Step title="Criar o grupo de recursos">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Criar o network security group">
    Crie o NSG e adicione regras para que somente a sub-rede do Bastion possa acessar a VM por SSH.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Permitir SSH somente a partir da sub-rede do Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Negar SSH a partir da internet pública
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Negar SSH de outras origens da VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    As regras são avaliadas por prioridade (número menor primeiro): o tráfego do Bastion é permitido em 100, depois todo o restante de SSH é bloqueado em 110 e 120.

  </Step>

  <Step title="Criar a rede virtual e as sub-redes">
    Crie a VNet com a sub-rede da VM (com o NSG anexado) e depois adicione a sub-rede do Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Anexar o NSG à sub-rede da VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — o nome é exigido pelo Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Criar a VM">
    A VM não terá IP público. O acesso SSH será feito exclusivamente por meio do Azure Bastion.

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

    `--public-ip-address ""` impede que um IP público seja atribuído. `--nsg ""` evita a criação de um NSG por NIC (o NSG no nível da sub-rede cuida da segurança).

    **Reprodutibilidade:** o comando acima usa `latest` para a imagem Ubuntu. Para fixar uma versão específica, liste as versões disponíveis e substitua `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Criar o Azure Bastion">
    O Azure Bastion oferece acesso SSH gerenciado à VM sem expor um IP público. O SKU Standard com tunneling é necessário para `az network bastion ssh` via CLI.

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

    O provisionamento do Bastion normalmente leva de 5 a 10 minutos, mas pode levar até 15 a 30 minutos em algumas regiões.

  </Step>
</Steps>

## Instalar o OpenClaw

<Steps>
  <Step title="Conectar por SSH à VM via Azure Bastion">
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

  <Step title="Instalar o OpenClaw (no shell da VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    O instalador instala Node LTS e dependências se ainda não estiverem presentes, instala o OpenClaw e inicia o assistente de onboarding. Consulte [Install](/install) para mais detalhes.

  </Step>

  <Step title="Verificar o Gateway">
    Após concluir o onboarding:

    ```bash
    openclaw gateway status
    ```

    A maioria das equipes corporativas no Azure já possui licenças do GitHub Copilot. Se esse for o seu caso, recomendamos escolher o provider GitHub Copilot no assistente de onboarding do OpenClaw. Consulte [GitHub Copilot provider](/providers/github-copilot).

  </Step>
</Steps>

## Considerações de custo

O SKU Standard do Azure Bastion custa aproximadamente **US\$140/mês** e a VM (Standard_B2as_v2) custa aproximadamente **US\$55/mês**.

Para reduzir custos:

- **Desaloque a VM** quando não estiver em uso (interrompe a cobrança de computação; cobranças de disco permanecem). O Gateway OpenClaw não ficará acessível enquanto a VM estiver desalocada — reinicie-a quando quiser colocá-la online novamente:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # reiniciar depois
  ```

- **Exclua o Bastion quando não for necessário** e recrie-o quando precisar de acesso SSH. O Bastion é o maior componente de custo e leva apenas alguns minutos para ser provisionado.
- **Use o SKU Basic do Bastion** (~US\$38/mês) se você só precisar de SSH pelo Portal e não precisar de tunneling via CLI (`az network bastion ssh`).

## Limpeza

Para excluir todos os recursos criados por este guia:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Isso remove o grupo de recursos e tudo que está dentro dele (VM, VNet, NSG, Bastion, IP público).

## Próximos passos

- Configurar canais de mensagens: [Channels](/channels)
- Parear dispositivos locais como nodes: [Nodes](/nodes)
- Configurar o Gateway: [Gateway configuration](/gateway/configuration)
- Para mais detalhes sobre a implantação do OpenClaw no Azure com o provider de modelo GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
