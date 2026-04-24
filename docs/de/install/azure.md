---
read_when:
    - Sie möchten OpenClaw 24/7 auf Azure mit Härtung durch Network Security Groups betreiben.
    - Sie möchten ein produktionsreifes, dauerhaft laufendes OpenClaw Gateway auf Ihrer eigenen Azure-Linux-VM.
    - Sie möchten eine sichere Administration mit Azure Bastion SSH.
summary: OpenClaw Gateway 24/7 auf einer Azure-Linux-VM mit dauerhaftem Status ausführen
title: Azure
x-i18n:
    generated_at: "2026-04-24T06:42:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e42e1a35e0340b959b73c548bc1efd6366bee38cf4c8cd23d986c5f14e5da0e0
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw auf einer Azure-Linux-VM

Diese Anleitung richtet eine Azure-Linux-VM mit der Azure CLI ein, wendet Härtung per Network Security Group (NSG) an, konfiguriert Azure Bastion für SSH-Zugriff und installiert OpenClaw.

## Was Sie tun werden

- Azure-Netzwerk- (VNet, Subnetze, NSG) und Compute-Ressourcen mit der Azure CLI erstellen
- Regeln für die Network Security Group anwenden, sodass SSH zur VM nur von Azure Bastion erlaubt ist
- Azure Bastion für SSH-Zugriff verwenden (keine öffentliche IP auf der VM)
- OpenClaw mit dem Installerskript installieren
- Das Gateway verifizieren

## Was Sie benötigen

- Ein Azure-Abonnement mit Berechtigung zum Erstellen von Compute- und Netzwerkressourcen
- Installierte Azure CLI (siehe bei Bedarf [Azure CLI install steps](https://learn.microsoft.com/cli/azure/install-azure-cli))
- Ein SSH-Schlüsselpaar (die Anleitung behandelt die Generierung, falls nötig)
- Etwa 20–30 Minuten

## Bereitstellung konfigurieren

<Steps>
  <Step title="An der Azure CLI anmelden">
    ```bash
    az login
    az extension add -n ssh
    ```

    Die Erweiterung `ssh` ist für natives SSH-Tunneling über Azure Bastion erforderlich.

  </Step>

  <Step title="Erforderliche Resource Provider registrieren (einmalig)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Verifizieren Sie die Registrierung. Warten Sie, bis beide `Registered` anzeigen.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Bereitstellungsvariablen setzen">
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

    Passen Sie Namen und CIDR-Bereiche an Ihre Umgebung an. Das Bastion-Subnetz muss mindestens `/26` groß sein.

  </Step>

  <Step title="SSH-Schlüssel auswählen">
    Verwenden Sie Ihren vorhandenen öffentlichen Schlüssel, falls vorhanden:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Falls Sie noch keinen SSH-Schlüssel haben, erzeugen Sie einen:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="VM-Größe und Größe des OS-Datenträgers auswählen">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Wählen Sie eine VM-Größe und Größe des OS-Datenträgers, die in Ihrem Abonnement und Ihrer Region verfügbar sind:

    - Beginnen Sie kleiner bei leichter Nutzung und skalieren Sie später hoch
    - Verwenden Sie mehr vCPU/RAM/Festplatte für stärkere Automatisierung, mehr Channels oder größere Modell-/Tool-Workloads
    - Wenn eine VM-Größe in Ihrer Region oder Ihrem Abonnementkontingent nicht verfügbar ist, wählen Sie die nächstliegende verfügbare SKU

    Verfügbare VM-Größen in Ihrer Zielregion auflisten:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Ihre aktuelle vCPU- und Datenträgernutzung/-quote prüfen:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Azure-Ressourcen bereitstellen

<Steps>
  <Step title="Resource Group erstellen">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Network Security Group erstellen">
    Erstellen Sie die NSG und fügen Sie Regeln hinzu, sodass nur das Bastion-Subnetz per SSH auf die VM zugreifen kann.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # SSH nur vom Bastion-Subnetz erlauben
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # SSH aus dem öffentlichen Internet verbieten
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # SSH von anderen VNet-Quellen verbieten
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Die Regeln werden nach Priorität ausgewertet (kleinste Zahl zuerst): Bastion-Verkehr wird bei 100 erlaubt, danach wird sämtlicher anderer SSH-Verkehr bei 110 und 120 blockiert.

  </Step>

  <Step title="Virtuelles Netzwerk und Subnetze erstellen">
    Erstellen Sie das VNet mit dem VM-Subnetz (NSG angehängt) und fügen Sie anschließend das Bastion-Subnetz hinzu.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # NSG an das VM-Subnetz anhängen
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — Name ist von Azure vorgeschrieben
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="VM erstellen">
    Die VM hat keine öffentliche IP. SSH-Zugriff erfolgt ausschließlich über Azure Bastion.

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

    `--public-ip-address ""` verhindert, dass eine öffentliche IP zugewiesen wird. `--nsg ""` überspringt die Erstellung einer NSG pro NIC (die Sicherheit übernimmt die NSG auf Subnetzebene).

    **Reproduzierbarkeit:** Der obige Befehl verwendet `latest` für das Ubuntu-Image. Um eine bestimmte Version festzunageln, listen Sie verfügbare Versionen auf und ersetzen Sie `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Azure Bastion erstellen">
    Azure Bastion stellt verwalteten SSH-Zugriff auf die VM bereit, ohne eine öffentliche IP offenzulegen. Für CLI-basiertes `az network bastion ssh` ist die Standard-SKU mit Tunneling erforderlich.

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

    Die Bereitstellung von Bastion dauert typischerweise 5–10 Minuten, kann in manchen Regionen aber auch 15–30 Minuten dauern.

  </Step>
</Steps>

## OpenClaw installieren

<Steps>
  <Step title="Per Azure Bastion per SSH auf die VM zugreifen">
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

  <Step title="OpenClaw installieren (in der VM-Shell)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Der Installer installiert Node LTS und Abhängigkeiten, falls diese noch nicht vorhanden sind, installiert OpenClaw und startet den Onboarding-Assistenten. Details siehe [Install](/de/install).

  </Step>

  <Step title="Das Gateway verifizieren">
    Nachdem das Onboarding abgeschlossen ist:

    ```bash
    openclaw gateway status
    ```

    Die meisten Enterprise-Azure-Teams verfügen bereits über GitHub-Copilot-Lizenzen. Falls das bei Ihnen der Fall ist, empfehlen wir, im OpenClaw-Onboarding-Assistenten den GitHub-Copilot-Provider auszuwählen. Siehe [GitHub Copilot provider](/de/providers/github-copilot).

  </Step>
</Steps>

## Kostenüberlegungen

Azure Bastion Standard SKU kostet ungefähr **\$140/Monat** und die VM (Standard_B2as_v2) ungefähr **\$55/Monat**.

Um Kosten zu reduzieren:

- **Die VM deallokieren**, wenn sie nicht verwendet wird (stoppt die Compute-Abrechnung; Datenträgerkosten bleiben bestehen). Das OpenClaw Gateway ist nicht erreichbar, solange die VM deallokiert ist — starten Sie sie wieder, wenn Sie sie erneut live benötigen:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # später neu starten
  ```

- **Bastion löschen, wenn es nicht benötigt wird**, und neu erstellen, wenn Sie SSH-Zugriff benötigen. Bastion ist der größte Kostenfaktor und lässt sich in nur wenigen Minuten bereitstellen.
- **Basic Bastion SKU** verwenden (~\$38/Monat), wenn Sie nur SSH über das Portal brauchen und kein CLI-Tunneling (`az network bastion ssh`) benötigen.

## Aufräumen

Um alle mit dieser Anleitung erstellten Ressourcen zu löschen:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Dadurch werden die Resource Group und alles darin entfernt (VM, VNet, NSG, Bastion, öffentliche IP).

## Nächste Schritte

- Messaging-Channels einrichten: [Channels](/de/channels)
- Lokale Geräte als Nodes pairen: [Nodes](/de/nodes)
- Das Gateway konfigurieren: [Gateway configuration](/de/gateway/configuration)
- Weitere Details zur Azure-Bereitstellung von OpenClaw mit dem GitHub-Copilot-Modellprovider: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

## Verwandt

- [Install overview](/de/install)
- [GCP](/de/install/gcp)
- [DigitalOcean](/de/install/digitalocean)
