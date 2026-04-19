---
read_when:
    - Vous voulez qu’OpenClaw fonctionne 24 h/24 et 7 j/7 sur GCP
    - Vous voulez un Gateway de qualité production, toujours actif, sur votre propre VM
    - Vous voulez un contrôle total sur la persistance, les binaires et le comportement de redémarrage
summary: Exécutez OpenClaw Gateway 24 h/24 et 7 j/7 sur une VM GCP Compute Engine (Docker) avec un état persistant
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw sur GCP Compute Engine (Docker, guide VPS de production)

## Objectif

Exécuter un Gateway OpenClaw persistant sur une VM GCP Compute Engine à l’aide de Docker, avec un état persistant, des binaires intégrés à l’image et un comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24/7 pour ~5 à 12 $/mois », c’est une configuration fiable sur Google Cloud.
Le tarif varie selon le type de machine et la région ; choisissez la plus petite VM adaptée à votre charge de travail et augmentez la taille si vous rencontrez des OOM.

## Que faisons-nous (en termes simples) ?

- Créer un projet GCP et activer la facturation
- Créer une VM Compute Engine
- Installer Docker (runtime d’application isolé)
- Démarrer le Gateway OpenClaw dans Docker
- Persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/reconstructions)
- Accéder à l’interface utilisateur de contrôle depuis votre ordinateur portable via un tunnel SSH

Cet état monté de `~/.openclaw` inclut `openclaw.json`, les profils par agent
`agents/<agentId>/agent/auth-profiles.json`, et `.env`.

Le Gateway est accessible via :

- la redirection de port SSH depuis votre ordinateur portable
- l’exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide utilise Debian sur GCP Compute Engine.
Ubuntu fonctionne aussi ; adaptez les paquets en conséquence.
Pour le flux Docker générique, voir [Docker](/fr/install/docker).

---

## Chemin rapide (opérateurs expérimentés)

1. Créer un projet GCP + activer l’API Compute Engine
2. Créer une VM Compute Engine (e2-small, Debian 12, 20 Go)
3. Se connecter en SSH à la VM
4. Installer Docker
5. Cloner le dépôt OpenClaw
6. Créer des répertoires hôtes persistants
7. Configurer `.env` et `docker-compose.yml`
8. Intégrer les binaires requis à l’image, construire et lancer

---

## Ce dont vous avez besoin

- Un compte GCP (niveau gratuit éligible pour e2-micro)
- La CLI gcloud installée (ou utiliser Cloud Console)
- Un accès SSH depuis votre ordinateur portable
- Une aisance de base avec SSH + le copier/coller
- ~20 à 30 minutes
- Docker et Docker Compose
- Des identifiants d’authentification de modèle
- Des identifiants de fournisseur facultatifs
  - QR WhatsApp
  - jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Installer la CLI gcloud (ou utiliser la Console)">
    **Option A : CLI gcloud** (recommandée pour l’automatisation)

    Installez-la depuis [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Initialisez-la et authentifiez-vous :

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Option B : Cloud Console**

    Toutes les étapes peuvent être effectuées via l’interface web sur [https://console.cloud.google.com](https://console.cloud.google.com)

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
    4. Accédez à API et services > Activer des API et des services > recherchez « Compute Engine API » > Activer

  </Step>

  <Step title="Créer la VM">
    **Types de machine :**

    | Type      | Spécifications           | Coût               | Notes                                         |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU, 4 Go de RAM      | ~25 $/mois         | Le plus fiable pour les builds Docker locaux  |
    | e2-small  | 2 vCPU, 2 Go de RAM      | ~12 $/mois         | Minimum recommandé pour un build Docker       |
    | e2-micro  | 2 vCPU (partagés), 1 Go RAM | Éligible au niveau gratuit | Échoue souvent sur OOM pendant le build Docker (exit 137) |

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
    3. Région : `us-central1`, zone : `us-central1-a`
    4. Type de machine : `e2-small`
    5. Disque de démarrage : Debian 12, 20 Go
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

  <Step title="Créer des répertoires hôtes persistants">
    Les conteneurs Docker sont éphémères.
    Tout état de longue durée doit vivre sur l’hôte.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Laissez `OPENCLAW_GATEWAY_TOKEN` vide sauf si vous voulez explicitement
    le gérer via `.env` ; OpenClaw écrit un jeton Gateway aléatoire dans la
    configuration au premier démarrage. Générez un mot de passe de trousseau
    puis collez-le dans `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier dans le dépôt.**

    Ce fichier `.env` est destiné aux variables d’environnement du conteneur/runtime telles que `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification stockée du fournisseur OAuth/clé API vit dans le montage
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

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
          # Recommandé : gardez le Gateway accessible uniquement en loopback sur la VM ; accédez-y via un tunnel SSH.
          # Pour l’exposer publiquement, supprimez le préfixe `127.0.0.1:` et configurez le pare-feu en conséquence.
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

    `--allow-unconfigured` sert uniquement à faciliter l’initialisation ; ce n’est pas un remplacement à une configuration Gateway correcte. Configurez quand même l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de liaison sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes partagées du runtime Docker sur VM">
    Utilisez le guide de runtime partagé pour le flux hôte Docker commun :

    - [Intégrer les binaires requis à l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Notes de lancement spécifiques à GCP">
    Sur GCP, si le build échoue avec `Killed` ou `exit code 137` pendant `pnpm install --frozen-lockfile`, la VM manque de mémoire. Utilisez au minimum `e2-small`, ou `e2-medium` pour des premiers builds plus fiables.

    Lors d’une liaison au LAN (`OPENCLAW_GATEWAY_BIND=lan`), configurez une origine de navigateur approuvée avant de continuer :

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Si vous avez changé le port du gateway, remplacez `18789` par le port configuré.

  </Step>

  <Step title="Accéder depuis votre ordinateur portable">
    Créez un tunnel SSH pour rediriger le port du Gateway :

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Ouvrez dans votre navigateur :

    `http://127.0.0.1:18789/`

    Réaffichez un lien propre vers le tableau de bord :

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Si l’interface utilisateur de contrôle demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de l’interface utilisateur de contrôle. Ce flux Docker écrit un jeton par défaut ; si vous basculez la configuration du conteneur vers une authentification par mot de passe, utilisez ce mot de passe à la place.

    Si l’interface utilisateur de contrôle affiche `unauthorized` ou `disconnected (1008): pairing required`, approuvez l’appareil navigateur :

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Vous avez à nouveau besoin de la référence sur la persistance partagée et les mises à jour ?
    Voir [Docker VM Runtime](/fr/install/docker-vm-runtime#what-persists-where) et [Mises à jour Docker VM Runtime](/fr/install/docker-vm-runtime#updates).

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

Si le build Docker échoue avec `Killed` et `exit code 137`, la VM a été arrêtée par OOM. Passez à e2-small (minimum) ou e2-medium (recommandé pour des builds locaux fiables) :

```bash
# Arrêtez d’abord la VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Changer le type de machine
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Démarrer la VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Comptes de service (bonne pratique de sécurité)

Pour un usage personnel, votre compte utilisateur par défaut convient très bien.

Pour l’automatisation ou les pipelines CI/CD, créez un compte de service dédié avec des autorisations minimales :

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

Voir [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) pour plus d’informations sur les rôles IAM.

---

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Associer des appareils locaux comme Nodes : [Nodes](/fr/nodes)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
