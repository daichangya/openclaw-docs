---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน Azure พร้อมการเสริมความปลอดภัยด้วย Network Security Group
    - คุณต้องการ Gateway ของ OpenClaw ที่พร้อมใช้งานระดับ production และทำงานตลอดเวลา บน Azure Linux VM ของคุณเอง
    - คุณต้องการการดูแลระบบอย่างปลอดภัยด้วย Azure Bastion SSH
summary: รัน OpenClaw Gateway ตลอด 24/7 บน Azure Linux VM พร้อมสถานะถาวร
title: Azure
x-i18n:
    generated_at: "2026-04-23T05:38:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw บน Azure Linux VM

คู่มือนี้จะตั้งค่า Azure Linux VM ด้วย Azure CLI, ใช้การเสริมความปลอดภัยด้วย Network Security Group (NSG), กำหนดค่า Azure Bastion สำหรับการเข้าถึง SSH และติดตั้ง OpenClaw

## สิ่งที่คุณจะทำ

- สร้างทรัพยากรเครือข่าย Azure (VNet, subnets, NSG) และทรัพยากรคอมพิวต์ด้วย Azure CLI
- ใช้กฎของ Network Security Group เพื่อให้ VM อนุญาต SSH ได้เฉพาะจาก Azure Bastion
- ใช้ Azure Bastion สำหรับการเข้าถึง SSH (VM ไม่มี public IP)
- ติดตั้ง OpenClaw ด้วยสคริปต์ติดตั้ง
- ตรวจสอบ Gateway

## สิ่งที่คุณต้องมี

- Azure subscription ที่มีสิทธิ์สร้างทรัพยากรคอมพิวต์และเครือข่าย
- ติดตั้ง Azure CLI แล้ว (ดู [ขั้นตอนการติดตั้ง Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) หากจำเป็น)
- คู่กุญแจ SSH (คู่มือนี้จะครอบคลุมการสร้างหากคุณยังไม่มี)
- เวลาประมาณ 20-30 นาที

## กำหนดค่าการปรับใช้

<Steps>
  <Step title="ลงชื่อเข้าใช้ Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    ส่วนขยาย `ssh` จำเป็นสำหรับ Azure Bastion native SSH tunneling

  </Step>

  <Step title="ลงทะเบียน resource providers ที่จำเป็น (ทำครั้งเดียว)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    ตรวจสอบการลงทะเบียน รอจนทั้งสองตัวแสดงเป็น `Registered`

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="ตั้งค่าตัวแปรสำหรับการปรับใช้">
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

    ปรับชื่อและช่วง CIDR ให้เหมาะกับสภาพแวดล้อมของคุณ Bastion subnet ต้องมีขนาดอย่างน้อย `/26`

  </Step>

  <Step title="เลือก SSH key">
    ใช้ public key ที่มีอยู่แล้วหากคุณมี:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    หากคุณยังไม่มี SSH key ให้สร้างใหม่:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="เลือกขนาด VM และขนาดดิสก์ระบบปฏิบัติการ">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    เลือกขนาด VM และขนาดดิสก์ระบบปฏิบัติการที่มีอยู่ใน subscription และ region ของคุณ:

    - เริ่มจากขนาดเล็กสำหรับการใช้งานเบา แล้วค่อยขยายภายหลัง
    - ใช้ vCPU/RAM/disk มากขึ้นสำหรับงานอัตโนมัติที่หนักขึ้น, channels มากขึ้น หรือโหลดโมเดล/เครื่องมือที่ใหญ่ขึ้น
    - หากขนาด VM ไม่มีใน region หรือ quota ของ subscription ของคุณ ให้เลือก SKU ที่ใกล้เคียงที่สุดที่มีอยู่

    แสดงรายการขนาด VM ที่มีใน region เป้าหมาย:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    ตรวจสอบการใช้งาน/quota ปัจจุบันของ vCPU และดิสก์:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## ปรับใช้ทรัพยากร Azure

<Steps>
  <Step title="สร้าง resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="สร้าง network security group">
    สร้าง NSG และเพิ่มกฎเพื่อให้มีเพียง Bastion subnet เท่านั้นที่สามารถ SSH เข้า VM ได้

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # อนุญาต SSH จาก Bastion subnet เท่านั้น
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # ปฏิเสธ SSH จากอินเทอร์เน็ตสาธารณะ
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # ปฏิเสธ SSH จากแหล่งอื่นใน VNet
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    กฎเหล่านี้จะถูกประเมินตามลำดับความสำคัญ (ตัวเลขน้อยกว่าก่อน): ทราฟฟิกจาก Bastion จะได้รับอนุญาตที่ 100 จากนั้น SSH อื่นทั้งหมดจะถูกบล็อกที่ 110 และ 120

  </Step>

  <Step title="สร้าง virtual network และ subnets">
    สร้าง VNet พร้อม VM subnet (ผูก NSG ไว้) จากนั้นเพิ่ม Bastion subnet

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # ผูก NSG เข้ากับ VM subnet
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — Azure กำหนดให้ใช้ชื่อนี้
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="สร้าง VM">
    VM นี้ไม่มี public IP การเข้าถึง SSH จะผ่าน Azure Bastion เท่านั้น

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

    `--public-ip-address ""` ป้องกันไม่ให้มีการกำหนด public IP ส่วน `--nsg ""` จะข้ามการสร้าง per-NIC NSG (ความปลอดภัยจะจัดการโดย NSG ระดับ subnet)

    **ความสามารถในการทำซ้ำ:** คำสั่งด้านบนใช้ `latest` สำหรับอิมเมจ Ubuntu หากต้องการ pin เวอร์ชันเฉพาะ ให้แสดงรายการเวอร์ชันที่มีและแทน `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="สร้าง Azure Bastion">
    Azure Bastion ให้การเข้าถึง SSH แบบมีการจัดการไปยัง VM โดยไม่ต้องเปิดเผย public IP Standard SKU พร้อม tunneling จำเป็นสำหรับ `az network bastion ssh` แบบ CLI

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

    การ provision Bastion โดยทั่วไปใช้เวลา 5-10 นาที แต่ในบาง region อาจนานถึง 15-30 นาที

  </Step>
</Steps>

## ติดตั้ง OpenClaw

<Steps>
  <Step title="SSH เข้า VM ผ่าน Azure Bastion">
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

  <Step title="ติดตั้ง OpenClaw (ภายใน shell ของ VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    ตัวติดตั้งจะติดตั้ง Node LTS และ dependencies หากยังไม่มี, ติดตั้ง OpenClaw และเปิด onboarding wizard ดู [Install](/th/install) สำหรับรายละเอียด

  </Step>

  <Step title="ตรวจสอบ Gateway">
    หลังจาก onboarding เสร็จสมบูรณ์:

    ```bash
    openclaw gateway status
    ```

    ทีม Azure ระดับองค์กรส่วนใหญ่มักมีไลเซนส์ GitHub Copilot อยู่แล้ว หากกรณีของคุณเป็นเช่นนั้น เราแนะนำให้เลือกผู้ให้บริการ GitHub Copilot ใน onboarding wizard ของ OpenClaw ดู [GitHub Copilot provider](/th/providers/github-copilot)

  </Step>
</Steps>

## ข้อพิจารณาด้านต้นทุน

Azure Bastion Standard SKU มีค่าใช้จ่ายประมาณ **\$140/เดือน** และ VM (Standard_B2as_v2) มีค่าใช้จ่ายประมาณ **\$55/เดือน**

เพื่อลดต้นทุน:

- **Deallocate VM** เมื่อไม่ใช้งาน (หยุดค่าบริการคอมพิวต์; ค่าดิสก์ยังคงอยู่) Gateway ของ OpenClaw จะไม่สามารถเข้าถึงได้ขณะ VM ถูก deallocate — ให้เริ่มใหม่เมื่อคุณต้องการใช้งานอีกครั้ง:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # เริ่มใหม่ภายหลัง
  ```

- **ลบ Bastion เมื่อไม่จำเป็น** และสร้างใหม่เมื่อคุณต้องการเข้าถึง SSH Bastion เป็นส่วนที่มีต้นทุนสูงที่สุด และใช้เวลา provision เพียงไม่กี่นาที
- **ใช้ Basic Bastion SKU** (~\$38/เดือน) หากคุณต้องการเพียง SSH ผ่าน Portal และไม่ต้องใช้ CLI tunneling (`az network bastion ssh`)

## การล้างทรัพยากร

หากต้องการลบทรัพยากรทั้งหมดที่สร้างโดยคู่มือนี้:

```bash
az group delete -n "${RG}" --yes --no-wait
```

คำสั่งนี้จะลบ resource group และทุกอย่างภายในนั้น (VM, VNet, NSG, Bastion, public IP)

## ขั้นตอนถัดไป

- ตั้งค่า messaging channels: [Channels](/th/channels)
- จับคู่อุปกรณ์ภายในเครื่องเป็น nodes: [Nodes](/th/nodes)
- กำหนดค่า Gateway: [Gateway configuration](/th/gateway/configuration)
- สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับการปรับใช้ OpenClaw บน Azure ด้วยผู้ให้บริการโมเดล GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
