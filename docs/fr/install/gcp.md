---
read_when:
    - Vous souhaitez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur GCP
    - Vous souhaitez une passerelle de production toujours active sur votre propre VM
    - Vous voulez un contrôle total sur la persistance, les binaires et le comportement de redémarrage
summary: Exécuter OpenClaw Gateway 24 h/24 et 7 j/7 sur une VM GCP Compute Engine (Docker) avec un état persistant
title: GCP
x-i18n:
    generated_at: "2026-04-05T12:45:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw sur GCP Compute Engine (Docker, guide VPS de production)

## Objectif

Exécuter une passerelle OpenClaw persistante sur une VM GCP Compute Engine avec Docker, avec un état durable, des binaires intégrés à l’image et un comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24 h/24 et 7 j/7 pour ~5 à 12 $/mois », c’est une configuration fiable sur Google Cloud.
Le prix varie selon le type de machine et la région ; choisissez la plus petite VM adaptée à votre charge, puis montez en taille si vous rencontrez des OOM.

## Que faisons-nous exactement ? (en termes simples)

- Créer un projet GCP et activer la facturation
- Créer une VM Compute Engine
- Installer Docker (runtime d’application isolé)
- Démarrer OpenClaw Gateway dans Docker
- Persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/reconstructions)
- Accéder à l’interface de contrôle depuis votre ordinateur portable via un tunnel SSH

Cet état monté `~/.openclaw` inclut `openclaw.json`, les fichiers par agent
`agents/<agentId>/agent/auth-profiles.json` et `.env`.

La passerelle est accessible via :

- redirection de port SSH depuis votre ordinateur portable
- exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide utilise Debian sur GCP Compute Engine.
Ubuntu fonctionne également ; adaptez les packages en conséquence.
Pour le flux Docker générique, consultez [Docker](/install/docker).

---

## Chemin rapide (opérateurs expérimentés)

1. Créer un projet GCP + activer l’API Compute Engine
2. Créer une VM Compute Engine (e2-small, Debian 12, 20GB)
3. Se connecter en SSH à la VM
4. Installer Docker
5. Cloner le dépôt OpenClaw
6. Créer les répertoires hôte persistants
7. Configurer `.env` et `docker-compose.yml`
8. Intégrer les binaires requis, construire et lancer

---

## Ce dont vous avez besoin

- Un compte GCP (éligible au niveau gratuit pour e2-micro)
- La CLI gcloud installée (ou utiliser Cloud Console)
- Un accès SSH depuis votre ordinateur portable
- Une aisance minimale avec SSH + copier/coller
- ~20-30 minutes
- Docker et Docker Compose
- Des identifiants d’authentification de modèle
- Identifiants de fournisseurs facultatifs
  - QR WhatsApp
  - jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Installer la CLI gcloud (ou utiliser la Console)">
    **Option A : CLI gcloud** (recommandée pour l’automatisation)

    Installez-la depuis [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisez et authentifiez-vous :

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B : Cloud Console**

    Toutes les étapes peuvent être réalisées via l’interface web sur [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Créer un projet GCP">
    **CLI :**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Activez la facturation sur [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (obligatoire pour Compute Engine).

    Activez l’API Compute Engine :

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console :**

    1. Allez dans IAM et administration > Créer un projet
    2. Donnez-lui un nom et créez-le
    3. Activez la facturation pour le projet
    4. Accédez à API et services > Activer des API > recherchez « Compute Engine API » > Activer

  </Step>

  <Step title="Créer la VM">
    **Types de machine :**

    | Type      | Spécifications          | Coût               | Remarques                                    |
    | --------- | ----------------------- | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB de RAM      | ~25 $/mois         | Le plus fiable pour les builds Docker locaux |
    | e2-small  | 2 vCPU, 2GB de RAM      | ~12 $/mois         | Minimum recommandé pour un build Docker      |
    | e2-micro  | 2 vCPU (partagés), 1GB RAM | Éligible au niveau gratuit | Échoue souvent avec OOM lors du build Docker (exit 137) |

    **CLI :**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console :**

    1. Allez dans Compute Engine > Instances de VM > Créer une instance
    2. Nom : `openclaw-gateway`
    3. Région : `us-central1`, Zone : `us-central1-a`
    4. Type de machine : `e2-small`
    5. Disque de démarrage : Debian 12, 20GB
    6. Créer

  </Step>

  <Step title="Se connecter en SSH à la VM">
    **CLI :**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console :**

    Cliquez sur le bouton « SSH » à côté de votre VM dans le tableau de bord Compute Engine.

    Remarque : la propagation des clés SSH peut prendre 1 à 2 minutes après la création de la VM. Si la connexion est refusée, attendez puis réessayez.

  </Step>

  <Step title="Installer Docker (sur la VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Déconnectez-vous puis reconnectez-vous pour que le changement de groupe prenne effet :

    ```bash
    exit
    ```

    Puis reconnectez-vous en SSH :

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Vérifiez :

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Cloner le dépôt OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Ce guide suppose que vous allez construire une image personnalisée pour garantir la persistance des binaires.

  </Step>

  <Step title="Créer les répertoires hôte persistants">
    Les conteneurs Docker sont éphémères.
    Tout l’état de longue durée doit vivre sur l’hôte.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Générez des secrets robustes :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier dans le dépôt.**

    Ce fichier `.env` sert aux variables env du conteneur/runtime telles que `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification OAuth/clés API des fournisseurs stockée se trouve dans le
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` monté.

  </Step>

  <Step title="Configuration Docker Compose">
    Créez ou mettez à jour `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` n’est là que pour faciliter le bootstrap, ce n’est pas un remplacement d’une configuration correcte de la passerelle. Configurez tout de même l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de liaison sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes partagées du runtime Docker VM">
    Utilisez le guide runtime partagé pour le flux Docker hôte commun :

    - [Intégrer les binaires requis dans l’image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste et où](/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Remarques spécifiques au lancement sur GCP">
    Sur GCP, si le build échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire. Utilisez au minimum `e2-small`, ou `e2-medium` pour des premiers builds plus fiables.

    Lors d’une liaison au LAN (`OPENCLAW_GATEWAY_BIND=lan`), configurez une origine de navigateur de confiance avant de continuer :

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Si vous avez changé le port de la passerelle, remplacez `18789` par votre port configuré.

  </Step>

  <Step title="Accès depuis votre ordinateur portable">
    Créez un tunnel SSH pour transférer le port de la passerelle :

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Ouvrez dans votre navigateur :

    `http://127.0.0.1:18789/`

    Réafficher un lien de tableau de bord propre :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Si l’interface vous demande une authentification par secret partagé, collez le jeton ou
    mot de passe configuré dans les paramètres de l’interface de contrôle. Ce flux Docker écrit un jeton par
    défaut ; si vous basculez la configuration du conteneur vers une authentification par mot de passe, utilisez ce
    mot de passe à la place.

    Si l’interface de contrôle affiche `unauthorized` ou `disconnected (1008): pairing required`, approuvez l’appareil du navigateur :

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Besoin de revoir la référence de persistance et de mise à jour partagées ?
    Consultez [Runtime Docker VM](/install/docker-vm-runtime#what-persists-where) et [mises à jour du Runtime Docker VM](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Dépannage

**Connexion SSH refusée**

La propagation des clés SSH peut prendre 1 à 2 minutes après la création de la VM. Attendez puis réessayez.

**Problèmes OS Login**

Vérifiez votre profil OS Login :

```bash
gcloud compute os-login describe-profile
```

Assurez-vous que votre compte dispose des autorisations IAM requises (Compute OS Login ou Compute OS Admin Login).

**Mémoire insuffisante (OOM)**

Si le build Docker échoue avec `Killed` et `exit code 137`, la VM a été tuée pour cause d’OOM. Passez à e2-small (minimum) ou e2-medium (recommandé pour des builds locaux fiables) :

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Comptes de service (bonne pratique de sécurité)

Pour un usage personnel, votre compte utilisateur par défaut convient très bien.

Pour les pipelines d’automatisation ou CI/CD, créez un compte de service dédié avec des autorisations minimales :

1. Créez un compte de service :

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Accordez le rôle Compute Instance Admin (ou un rôle personnalisé plus restreint) :

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Évitez d’utiliser le rôle Owner pour l’automatisation. Appliquez le principe du moindre privilège.

Consultez [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) pour les détails sur les rôles IAM.

---

## Étapes suivantes

- Configurer les canaux de messagerie : [Channels](/channels)
- Appairer des appareils locaux comme nœuds : [Nodes](/nodes)
- Configurer la passerelle : [Configuration de la passerelle](/gateway/configuration)
