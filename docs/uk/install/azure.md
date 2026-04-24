---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 в Azure із посиленням безпеки через Network Security Group
    - Ви хочете production-grade, постійно ввімкнений Gateway OpenClaw на власній Linux VM в Azure
    - Ви хочете безпечне адміністрування через Azure Bastion SSH
summary: Запускайте OpenClaw Gateway 24/7 на Linux VM в Azure зі стійким станом
title: Azure
x-i18n:
    generated_at: "2026-04-24T03:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw на Azure Linux VM

У цьому посібнику налаштовується Azure Linux VM за допомогою Azure CLI, застосовується посилення безпеки через Network Security Group (NSG), налаштовується Azure Bastion для доступу через SSH та встановлюється OpenClaw.

## Що ви зробите

- Створите мережеві ресурси Azure (VNet, підмережі, NSG) і обчислювальні ресурси за допомогою Azure CLI
- Застосуєте правила Network Security Group так, щоб SSH до VM був дозволений лише через Azure Bastion
- Використовуватимете Azure Bastion для доступу через SSH (без публічної IP-адреси на VM)
- Встановите OpenClaw за допомогою інсталяційного скрипта
- Перевірите Gateway

## Що вам потрібно

- Підписка Azure з правами на створення обчислювальних і мережевих ресурсів
- Встановлений Azure CLI (за потреби див. [кроки встановлення Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Пара SSH-ключів (у посібнику також описано, як згенерувати її за потреби)
- ~20–30 хвилин

## Налаштування розгортання

<Steps>
  <Step title="Увійдіть в Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Розширення `ssh` потрібне для нативного SSH-тунелювання через Azure Bastion.

  </Step>

  <Step title="Зареєструйте потрібних постачальників ресурсів (одноразово)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Перевірте реєстрацію. Дочекайтеся, поки обидва покажуть `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Задайте змінні розгортання">
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

    Скоригуйте назви й діапазони CIDR відповідно до вашого середовища. Підмережа Bastion має бути щонайменше `/26`.

  </Step>

  <Step title="Виберіть SSH-ключ">
    Якщо у вас уже є відкритий ключ, використайте його:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Якщо SSH-ключа ще немає, згенеруйте його:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Виберіть розмір VM і розмір OS-диска">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Виберіть розмір VM і розмір OS-диска, доступні у вашій підписці та регіоні:

    - Для невеликого навантаження почніть із меншого розміру й масштабуйтеся пізніше
    - Для важчої автоматизації, більшої кількості каналів або більших навантажень моделі/інструментів використовуйте більше vCPU/RAM/диска
    - Якщо певний розмір VM недоступний у вашому регіоні або в межах квоти підписки, виберіть найближчий доступний SKU

    Перелічіть розміри VM, доступні у цільовому регіоні:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Перевірте поточне використання/квоту vCPU і дисків:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Розгортання ресурсів Azure

<Steps>
  <Step title="Створіть групу ресурсів">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Створіть network security group">
    Створіть NSG і додайте правила так, щоб лише підмережа Bastion могла підключатися до VM через SSH.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Allow SSH from the Bastion subnet only
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Deny SSH from the public internet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Deny SSH from other VNet sources
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Правила обробляються за пріоритетом (спочатку менше число): трафік Bastion дозволяється з пріоритетом 100, після чого весь інший SSH блокується з пріоритетами 110 і 120.

  </Step>

  <Step title="Створіть віртуальну мережу та підмережі">
    Створіть VNet із підмережею VM (із прикріпленим NSG), потім додайте підмережу Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Attach the NSG to the VM subnet
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — name is required by Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Створіть VM">
    VM не має публічної IP-адреси. Доступ через SSH здійснюється виключно через Azure Bastion.

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

    `--public-ip-address ""` запобігає призначенню публічної IP-адреси. `--nsg ""` пропускає створення NSG на рівні окремого NIC (безпеку забезпечує NSG на рівні підмережі).

    **Відтворюваність:** Команда вище використовує `latest` для образу Ubuntu. Щоб зафіксувати конкретну версію, перелічіть доступні версії й замініть `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Створіть Azure Bastion">
    Azure Bastion надає керований SSH-доступ до VM без відкриття публічної IP-адреси. Для SSH через CLI на основі `az network bastion ssh` потрібен SKU Standard із підтримкою tunneling.

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

    Розгортання Bastion зазвичай триває 5–10 хвилин, але в деяких регіонах може займати до 15–30 хвилин.

  </Step>
</Steps>

## Встановлення OpenClaw

<Steps>
  <Step title="Підключіться до VM через SSH через Azure Bastion">
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

  <Step title="Встановіть OpenClaw (у shell VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Інсталятор установлює Node LTS і залежності, якщо вони ще не встановлені, установлює OpenClaw і запускає майстер початкового налаштування. Докладніше див. у [Встановлення](/uk/install).

  </Step>

  <Step title="Перевірте Gateway">
    Після завершення початкового налаштування виконайте:

    ```bash
    openclaw gateway status
    ```

    Більшість корпоративних команд Azure уже мають ліцензії GitHub Copilot. Якщо це ваш випадок, рекомендуємо вибрати провайдера GitHub Copilot у майстрі початкового налаштування OpenClaw. Див. [провайдер GitHub Copilot](/uk/providers/github-copilot).

  </Step>
</Steps>

## Міркування щодо вартості

Azure Bastion SKU Standard коштує приблизно **\$140/місяць**, а VM (Standard_B2as_v2) — приблизно **\$55/місяць**.

Щоб зменшити витрати:

- **Деалокуйте VM**, коли вона не використовується (це зупиняє нарахування за обчислення; плата за диск зберігається). Поки VM деалокована, Gateway OpenClaw буде недоступний — запустіть її знову, коли він вам знадобиться:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Видаляйте Bastion, коли він не потрібен**, і створюйте його знову, коли знадобиться доступ через SSH. Bastion є найбільшою складовою вартості й розгортається лише за кілька хвилин.
- **Використовуйте SKU Basic для Bastion** (~\$38/місяць), якщо вам потрібен лише SSH через Portal і не потрібне тунелювання CLI (`az network bastion ssh`).

## Очищення

Щоб видалити всі ресурси, створені за цим посібником:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Це видалить групу ресурсів і все, що в ній міститься (VM, VNet, NSG, Bastion, публічну IP-адресу).

## Наступні кроки

- Налаштуйте канали обміну повідомленнями: [Канали](/uk/channels)
- Спарте локальні пристрої як Node: [Node](/uk/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/uk/gateway/configuration)
- Докладнішу інформацію про розгортання OpenClaw в Azure з провайдером моделей GitHub Copilot див. тут: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Пов’язано

- [Огляд встановлення](/uk/install)
- [GCP](/uk/install/gcp)
- [DigitalOcean](/uk/install/digitalocean)
