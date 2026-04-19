---
read_when:
    - Vous souhaitez exécuter OpenClaw 24 h/24 et 7 j/7 sur un VPS cloud (pas sur votre ordinateur portable)
    - Vous souhaitez un Gateway de niveau production, toujours actif, sur votre propre VPS
    - Vous souhaitez un contrôle total sur la persistance, les binaires et le comportement de redémarrage
    - Vous exécutez OpenClaw dans Docker sur Hetzner ou un fournisseur similaire
summary: Exécutez OpenClaw Gateway 24 h/24 et 7 j/7 sur un VPS Hetzner peu coûteux (Docker) avec un état persistant et des binaires intégrés
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw sur Hetzner (Docker, guide VPS de production)

## Objectif

Exécuter un Gateway OpenClaw persistant sur un VPS Hetzner à l’aide de Docker, avec un état persistant, des binaires intégrés et un comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24 h/24 et 7 j/7 pour ~5 $ », c’est la configuration fiable la plus simple.
Les tarifs de Hetzner évoluent ; choisissez le plus petit VPS Debian/Ubuntu et augmentez la capacité si vous rencontrez des OOM.

Rappel du modèle de sécurité :

- Les agents partagés dans une entreprise conviennent si tout le monde se trouve dans la même limite de confiance et si le runtime est réservé à un usage professionnel.
- Maintenez une séparation stricte : VPS/runtime dédié + comptes dédiés ; aucun profil personnel Apple/Google/navigateur/gestionnaire de mots de passe sur cet hôte.
- Si les utilisateurs sont adversariaux les uns envers les autres, séparez par gateway/hôte/utilisateur OS.

Voir [Sécurité](/fr/gateway/security) et [Hébergement VPS](/fr/vps).

## Que faisons-nous exactement (en termes simples) ?

- Louer un petit serveur Linux (VPS Hetzner)
- Installer Docker (runtime d’application isolé)
- Démarrer le Gateway OpenClaw dans Docker
- Faire persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/reconstructions)
- Accéder à l’interface de contrôle depuis votre ordinateur portable via un tunnel SSH

Cet état monté `~/.openclaw` inclut `openclaw.json`, le fichier
`agents/<agentId>/agent/auth-profiles.json` par agent, et `.env`.

Le Gateway est accessible via :

- Redirection de port SSH depuis votre ordinateur portable
- Exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide suppose Ubuntu ou Debian sur Hetzner.  
Si vous utilisez un autre VPS Linux, adaptez les paquets en conséquence.
Pour le flux Docker générique, voir [Docker](/fr/install/docker).

---

## Chemin rapide (opérateurs expérimentés)

1. Provisionner un VPS Hetzner
2. Installer Docker
3. Cloner le dépôt OpenClaw
4. Créer des répertoires hôtes persistants
5. Configurer `.env` et `docker-compose.yml`
6. Intégrer les binaires requis dans l’image
7. `docker compose up -d`
8. Vérifier la persistance et l’accès au Gateway

---

## Ce dont vous avez besoin

- Un VPS Hetzner avec accès root
- Un accès SSH depuis votre ordinateur portable
- Une aisance de base avec SSH + copier/coller
- ~20 minutes
- Docker et Docker Compose
- Des identifiants d’authentification de modèle
- Des identifiants de fournisseur en option
  - QR WhatsApp
  - Jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provisionner le VPS">
    Créez un VPS Ubuntu ou Debian dans Hetzner.

    Connectez-vous en tant que root :

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ce guide suppose que le VPS est avec état.
    Ne le traitez pas comme une infrastructure jetable.

  </Step>

  <Step title="Installer Docker (sur le VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
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
    Tout état de longue durée doit résider sur l’hôte.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Définir le propriétaire sur l’utilisateur du conteneur (uid 1000) :
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configurer les variables d’environnement">
    Créez `.env` à la racine du dépôt.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Laissez `OPENCLAW_GATEWAY_TOKEN` vide sauf si vous souhaitez explicitement
    le gérer via `.env` ; OpenClaw écrit un jeton de gateway aléatoire dans la
    configuration au premier démarrage. Générez un mot de passe de trousseau et collez-le dans
    `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier dans le dépôt.**

    Ce fichier `.env` sert aux variables d’environnement du conteneur/runtime, telles que `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification OAuth/clé API des fournisseurs stockée se trouve dans le montage
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
          # Recommandé : gardez le Gateway accessible uniquement en loopback sur le VPS ; accédez-y via un tunnel SSH.
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

    `--allow-unconfigured` n’est là que pour simplifier l’amorçage ; il ne remplace pas une configuration de gateway correcte. Configurez quand même l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de liaison sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes runtime partagées pour VM Docker">
    Utilisez le guide runtime partagé pour le flux hôte Docker commun :

    - [Intégrer les binaires requis dans l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accès spécifique à Hetzner">
    Après les étapes partagées de construction et de lancement, créez un tunnel depuis votre ordinateur portable :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Ouvrez :

    `http://127.0.0.1:18789/`

    Collez le secret partagé configuré. Ce guide utilise par défaut le jeton du gateway ;
    si vous êtes passé à l’authentification par mot de passe, utilisez ce mot de passe à la place.

  </Step>
</Steps>

La carte de persistance partagée se trouve dans [Docker VM Runtime](/fr/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Pour les équipes qui préfèrent des flux de travail d’infrastructure as code, une configuration Terraform maintenue par la communauté fournit :

- Une configuration Terraform modulaire avec gestion d’état distant
- Un provisionnement automatisé via cloud-init
- Des scripts de déploiement (bootstrap, deploy, backup/restore)
- Un durcissement de sécurité (pare-feu, UFW, accès SSH uniquement)
- Une configuration de tunnel SSH pour l’accès au gateway

**Dépôts :**

- Infrastructure : [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuration Docker : [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cette approche complète la configuration Docker ci-dessus avec des déploiements reproductibles, une infrastructure versionnée et une reprise après sinistre automatisée.

> **Remarque :** Maintenu par la communauté. Pour les problèmes ou les contributions, consultez les liens des dépôts ci-dessus.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)
