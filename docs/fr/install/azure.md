---
read_when:
    - Vous voulez qu’OpenClaw s’exécute 24 h/24 et 7 j/7 sur Azure avec durcissement Network Security Group
    - Vous voulez une OpenClaw Gateway de production, toujours active, sur votre propre VM Linux Azure
    - Vous voulez une administration sécurisée avec Azure Bastion SSH
summary: Exécuter OpenClaw Gateway 24 h/24 et 7 j/7 sur une VM Linux Azure avec un état persistant
title: Azure
x-i18n:
    generated_at: "2026-04-05T12:44:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcdcf6dcf5096cd21e1b64f455656f7d77b477d03e9a088db74c6e988c3031db
    source_path: install/azure.md
    workflow: 15
---

# OpenClaw sur une VM Linux Azure

Ce guide configure une VM Linux Azure avec Azure CLI, applique un durcissement Network Security Group (NSG), configure Azure Bastion pour l’accès SSH et installe OpenClaw.

## Ce que vous allez faire

- Créer les ressources réseau Azure (VNet, sous-réseaux, NSG) et de calcul avec Azure CLI
- Appliquer des règles Network Security Group pour que le SSH de la VM soit autorisé uniquement depuis Azure Bastion
- Utiliser Azure Bastion pour l’accès SSH (pas d’IP publique sur la VM)
- Installer OpenClaw avec le script d’installation
- Vérifier la Gateway

## Ce dont vous avez besoin

- Un abonnement Azure avec les permissions nécessaires pour créer des ressources de calcul et réseau
- Azure CLI installé (voir [étapes d’installation d’Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) si nécessaire)
- Une paire de clés SSH (le guide couvre sa génération si nécessaire)
- ~20 à 30 minutes

## Configurer le déploiement

<Steps>
  <Step title="Se connecter à Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    L’extension `ssh` est nécessaire pour le tunneling SSH natif Azure Bastion.

  </Step>

  <Step title="Enregistrer les fournisseurs de ressources requis (une seule fois)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Vérifiez l’enregistrement. Attendez que les deux affichent `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Définir les variables de déploiement">
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

    Ajustez les noms et les plages CIDR à votre environnement. Le sous-réseau Bastion doit être au minimum en `/26`.

  </Step>

  <Step title="Choisir la clé SSH">
    Utilisez votre clé publique existante si vous en avez une :

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Si vous n’avez pas encore de clé SSH, générez-en une :

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Choisir la taille de VM et la taille du disque OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Choisissez une taille de VM et une taille de disque OS disponibles dans votre abonnement et votre région :

    - Commencez plus petit pour un usage léger et augmentez la taille plus tard
    - Utilisez davantage de vCPU/RAM/disque pour une automatisation plus lourde, plus de canaux, ou des charges de travail modèle/outil plus importantes
    - Si une taille de VM n’est pas disponible dans votre région ou dans votre quota d’abonnement, choisissez la SKU disponible la plus proche

    Listez les tailles de VM disponibles dans votre région cible :

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Vérifiez votre utilisation/quota actuels en vCPU et disque :

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Déployer les ressources Azure

<Steps>
  <Step title="Créer le groupe de ressources">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Créer le groupe de sécurité réseau">
    Créez le NSG et ajoutez des règles pour que seul le sous-réseau Bastion puisse accéder en SSH à la VM.

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

    Les règles sont évaluées par priorité (numéro le plus bas d’abord) : le trafic Bastion est autorisé à 100, puis tout autre trafic SSH est bloqué à 110 et 120.

  </Step>

  <Step title="Créer le réseau virtuel et les sous-réseaux">
    Créez le VNet avec le sous-réseau VM (NSG attaché), puis ajoutez le sous-réseau Bastion.

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

  <Step title="Créer la VM">
    La VM n’a pas d’IP publique. L’accès SSH se fait exclusivement via Azure Bastion.

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

    `--public-ip-address ""` empêche l’attribution d’une IP publique. `--nsg ""` évite la création d’un NSG par NIC (le NSG au niveau du sous-réseau gère la sécurité).

    **Reproductibilité :** la commande ci-dessus utilise `latest` pour l’image Ubuntu. Pour épingler une version spécifique, listez les versions disponibles et remplacez `latest` :

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Créer Azure Bastion">
    Azure Bastion fournit un accès SSH géré à la VM sans exposer d’IP publique. La SKU Standard avec tunneling est requise pour `az network bastion ssh` via CLI.

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

    Le provisionnement de Bastion prend généralement 5 à 10 minutes, mais peut aller jusqu’à 15 à 30 minutes dans certaines régions.

  </Step>
</Steps>

## Installer OpenClaw

<Steps>
  <Step title="Se connecter en SSH à la VM via Azure Bastion">
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

  <Step title="Installer OpenClaw (dans le shell de la VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Le programme d’installation installe Node LTS et les dépendances si nécessaire, installe OpenClaw et lance l’assistant d’onboarding. Voir [Installation](/install) pour plus de détails.

  </Step>

  <Step title="Vérifier la Gateway">
    Une fois l’onboarding terminé :

    ```bash
    openclaw gateway status
    ```

    La plupart des équipes Azure d’entreprise disposent déjà de licences GitHub Copilot. Si c’est votre cas, nous recommandons de choisir le fournisseur GitHub Copilot dans l’assistant d’onboarding OpenClaw. Voir [Fournisseur GitHub Copilot](/providers/github-copilot).

  </Step>
</Steps>

## Considérations de coût

La SKU Azure Bastion Standard coûte environ **140 $/mois** et la VM (Standard_B2as_v2) coûte environ **55 $/mois**.

Pour réduire les coûts :

- **Désallouez la VM** lorsqu’elle n’est pas utilisée (cela arrête la facturation du calcul ; les frais de disque restent). La Gateway OpenClaw ne sera pas joignable tant que la VM est désallouée — redémarrez-la quand vous aurez besoin qu’elle soit de nouveau active :

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # restart later
  ```

- **Supprimez Bastion lorsqu’il n’est pas nécessaire** et recréez-le quand vous avez besoin d’un accès SSH. Bastion est le principal poste de coût et ne prend que quelques minutes à provisionner.
- **Utilisez la SKU Basic Bastion** (~38 $/mois) si vous avez seulement besoin d’un SSH via le portail et n’avez pas besoin du tunneling CLI (`az network bastion ssh`).

## Nettoyage

Pour supprimer toutes les ressources créées par ce guide :

```bash
az group delete -n "${RG}" --yes --no-wait
```

Cela supprime le groupe de ressources et tout ce qu’il contient (VM, VNet, NSG, Bastion, IP publique).

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/channels)
- Appairer des appareils locaux comme nœuds : [Nœuds](/nodes)
- Configurer la Gateway : [Configuration Gateway](/gateway/configuration)
- Pour plus de détails sur le déploiement Azure d’OpenClaw avec le fournisseur de modèles GitHub Copilot : [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)
