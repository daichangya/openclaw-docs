---
read_when:
    - Ви хочете, щоб OpenClaw працював 24/7 в Azure із зміцненням Network Security Group
    - Вам потрібен production-grade, постійно увімкнений OpenClaw Gateway на власній Azure Linux VM
    - Вам потрібно безпечне адміністрування через Azure Bastion SSH
summary: Запуск OpenClaw Gateway 24/7 на Linux VM в Azure зі стійким станом
title: Azure
x-i18n:
    generated_at: "2026-04-05T18:06:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw на Azure Linux VM

Цей посібник налаштовує Azure Linux VM за допомогою Azure CLI, застосовує зміцнення Network Security Group (NSG), налаштовує Azure Bastion для SSH-доступу й установлює OpenClaw.

## Що ви зробите

- Створите мережеві ресурси Azure (VNet, підмережі, NSG) і обчислювальні ресурси за допомогою Azure CLI
- Застосуєте правила Network Security Group так, щоб SSH до VM був дозволений лише з Azure Bastion
- Використаєте Azure Bastion для SSH-доступу (без публічної IP-адреси на VM)
- Установите OpenClaw за допомогою скрипту встановлення
- Перевірите Gateway

## Що вам потрібно

- Підписка Azure з правами на створення обчислювальних і мережевих ресурсів
- Установлений Azure CLI (за потреби див. [кроки встановлення Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Пара SSH-ключів (у посібнику також показано, як створити її за потреби)
- ~20-30 хвилин

## Налаштування розгортання

<Steps>
  <Step title="Увійдіть в Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Розширення `ssh` потрібне для нативного SSH-тунелювання Azure Bastion.

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

    Скоригуйте назви й діапазони CIDR відповідно до свого середовища. Підмережа Bastion має бути щонайменше `/26`.

  </Step>

  <Step title="Виберіть SSH-ключ">
    Якщо у вас уже є публічний ключ, використайте його:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Якщо SSH-ключа ще немає, згенеруйте його:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Виберіть розмір VM і розмір диска ОС">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Виберіть розмір VM і розмір диска ОС, доступні у вашій підписці та регіоні:

    - Починайте з менших ресурсів для легкого використання й масштабуйте пізніше
    - Використовуйте більше vCPU/RAM/диска для важчої автоматизації, більшої кількості каналів або більших навантажень моделей/інструментів
    - Якщо певний розмір VM недоступний у вашому регіоні або через квоту підписки, виберіть найближчий доступний SKU

    Перелік розмірів VM, доступних у цільовому регіоні:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Перевірка поточного використання/квот vCPU і дисків:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Розгортання ресурсів Azure

<Steps>
  <Step title="Створіть resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Створіть network security group">
    Створіть NSG і додайте правила так, щоб лише підмережа Bastion могла підключатися до VM через SSH.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Дозволити SSH лише з підмережі Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Заборонити SSH з публічного інтернету
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Заборонити SSH з інших джерел у VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Правила оцінюються за пріоритетом (спочатку найменше число): трафік Bastion дозволяється на 100, а весь інший SSH блокується на 110 і 120.

  </Step>

  <Step title="Створіть virtual network і підмережі">
    Створіть VNet із підмережею VM (із підключеним NSG), а потім додайте підмережу Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Підключити NSG до підмережі VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — ця назва обов’язкова для Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Створіть VM">
    VM не має публічної IP-адреси. SSH-доступ здійснюється виключно через Azure Bastion.

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

    `--public-ip-address ""` запобігає призначенню публічної IP-адреси. `--nsg ""` пропускає створення NSG для окремого NIC (безпеку забезпечує NSG на рівні підмережі).

    **Відтворюваність:** команда вище використовує `latest` для образу Ubuntu. Щоб зафіксувати конкретну версію, виведіть доступні версії й замініть `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Створіть Azure Bastion">
    Azure Bastion надає керований SSH-доступ до VM без відкриття публічної IP-адреси. Для CLI-команди `az network bastion ssh` потрібен Standard SKU з увімкненим тунелюванням.

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

    Розгортання Bastion зазвичай займає 5-10 хвилин, але в деяких регіонах може тривати до 15-30 хвилин.

  </Step>
</Steps>

## Установлення OpenClaw

<Steps>
  <Step title="Підключіться до VM через Azure Bastion по SSH">
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

  <Step title="Установіть OpenClaw (в оболонці VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Інсталятор установлює Node LTS і залежності, якщо їх ще немає, установлює OpenClaw і запускає майстер онбордингу. Докладніше див. у [Install](/install).

  </Step>

  <Step title="Перевірте Gateway">
    Після завершення онбордингу:

    ```bash
    openclaw gateway status
    ```

    У більшості корпоративних команд Azure вже є ліцензії GitHub Copilot. Якщо це ваш випадок, ми рекомендуємо вибрати провайдера GitHub Copilot у майстрі онбордингу OpenClaw. Див. [провайдер GitHub Copilot](/providers/github-copilot).

  </Step>
</Steps>

## Вартість

Azure Bastion Standard SKU коштує приблизно **\$140/місяць**, а VM (Standard_B2as_v2) — приблизно **\$55/місяць**.

Щоб зменшити витрати:

- **Деалокуйте VM**, коли вона не використовується (це зупиняє тарифікацію за обчислення; плата за диск залишається). Gateway OpenClaw не буде доступний, поки VM деалокована — запустіть її знову, коли він знову знадобиться:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # перезапустити пізніше
  ```

- **Видаляйте Bastion, коли він не потрібен**, і створюйте його знову, коли потрібен SSH-доступ. Bastion — найбільший компонент витрат, а розгортається лише за кілька хвилин.
- **Використовуйте Basic Bastion SKU** (~\$38/місяць), якщо вам потрібен лише SSH через Portal і не потрібне тунелювання CLI (`az network bastion ssh`).

## Очищення

Щоб видалити всі ресурси, створені за цим посібником:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Це видалить resource group і все всередині неї (VM, VNet, NSG, Bastion, публічну IP-адресу).

## Наступні кроки

- Налаштуйте канали повідомлень: [Channels](/channels)
- Спаруйте локальні пристрої як вузли: [Nodes](/nodes)
- Налаштуйте Gateway: [Конфігурація Gateway](/gateway/configuration)
- Докладніше про розгортання OpenClaw в Azure з провайдером моделей GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
