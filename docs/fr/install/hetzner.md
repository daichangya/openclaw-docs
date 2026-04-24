---
read_when:
    - Vous souhaitez qu’OpenClaw s’exécute 24h/24 et 7j/7 sur un VPS cloud (pas sur votre laptop)
    - Vous souhaitez un Gateway toujours actif de niveau production sur votre propre VPS
    - Vous voulez un contrôle total sur la persistance, les binaires et le comportement au redémarrage
    - Vous exécutez OpenClaw dans Docker sur Hetzner ou un provider similaire
summary: Exécuter OpenClaw Gateway 24h/24 et 7j/7 sur un VPS Hetzner bon marché (Docker) avec état persistant et binaires intégrés
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T07:16:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw sur Hetzner (Docker, guide VPS de production)

## Objectif

Exécuter un Gateway OpenClaw persistant sur un VPS Hetzner avec Docker, avec état persistant, binaires intégrés et comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24h/24 et 7j/7 pour ~5 $ », c’est la configuration fiable la plus simple.
Les tarifs Hetzner changent ; choisissez le plus petit VPS Debian/Ubuntu et augmentez la taille si vous rencontrez des OOM.

Rappel du modèle de sécurité :

- Les agents partagés en entreprise conviennent lorsque tout le monde appartient à la même frontière de confiance et que l’exécution est strictement professionnelle.
- Gardez une séparation stricte : VPS/runtime dédié + comptes dédiés ; aucun profil personnel Apple/Google/browser/gestionnaire de mots de passe sur cet hôte.
- Si les utilisateurs sont adversariaux entre eux, séparez par gateway/hôte/utilisateur OS.

Voir [Sécurité](/fr/gateway/security) et [Hébergement VPS](/fr/vps).

## Que faisons-nous exactement ? (en termes simples)

- Louer un petit serveur Linux (VPS Hetzner)
- Installer Docker (runtime applicatif isolé)
- Démarrer le Gateway OpenClaw dans Docker
- Persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/reconstructions)
- Accéder à l’interface de contrôle depuis votre laptop via un tunnel SSH

Cet état monté `~/.openclaw` inclut `openclaw.json`, les
`agents/<agentId>/agent/auth-profiles.json` par agent, et `.env`.

Le Gateway est accessible via :

- redirection de port SSH depuis votre laptop
- exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide suppose Ubuntu ou Debian sur Hetzner.  
Si vous êtes sur un autre VPS Linux, adaptez les paquets en conséquence.
Pour le flux Docker générique, voir [Docker](/fr/install/docker).

---

## Chemin rapide (opérateurs expérimentés)

1. Provisionner un VPS Hetzner
2. Installer Docker
3. Cloner le dépôt OpenClaw
4. Créer les répertoires persistants sur l’hôte
5. Configurer `.env` et `docker-compose.yml`
6. Intégrer les binaires requis dans l’image
7. `docker compose up -d`
8. Vérifier la persistance et l’accès au Gateway

---

## Ce dont vous avez besoin

- VPS Hetzner avec accès root
- Accès SSH depuis votre laptop
- Une aisance minimale avec SSH + copier/coller
- ~20 minutes
- Docker et Docker Compose
- Identifiants d’authentification de modèle
- Identifiants de provider facultatifs
  - QR WhatsApp
  - jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provisionner le VPS">
    Créez un VPS Ubuntu ou Debian chez Hetzner.

    Connectez-vous en root :

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ce guide suppose que le VPS est avec état persistant.
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

    Ce guide suppose que vous allez construire une image personnalisée afin de garantir la persistance des binaires.

  </Step>

  <Step title="Créer des répertoires persistants sur l’hôte">
    Les conteneurs Docker sont éphémères.
    Tout état de longue durée doit vivre sur l’hôte.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
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

    Laissez `OPENCLAW_GATEWAY_TOKEN` vide, sauf si vous souhaitez explicitement le
    gérer via `.env` ; OpenClaw écrit un jeton gateway aléatoire dans la
    configuration au premier démarrage. Générez un mot de passe de porte-clés et collez-le dans
    `GOG_KEYRING_PASSWORD` :

    ```bash
    openssl rand -hex 32
    ```

    **Ne commitez pas ce fichier.**

    Ce fichier `.env` est destiné à l’environnement du conteneur/runtime, par exemple `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification OAuth/clé API des providers stockée vit dans le
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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` n’est là que pour la commodité du bootstrap ; ce n’est pas un remplacement d’une configuration correcte du gateway. Définissez toujours l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de bind sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes partagées du runtime Docker VM">
    Utilisez le guide runtime partagé pour le flux commun d’hôte Docker :

    - [Intégrer les binaires requis dans l’image](/fr/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/fr/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste et où](/fr/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/fr/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accès spécifique à Hetzner">
    Après les étapes partagées de construction et de lancement, créez un tunnel depuis votre laptop :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Ouvrez :

    `http://127.0.0.1:18789/`

    Collez le secret partagé configuré. Ce guide utilise le jeton gateway par
    défaut ; si vous êtes passé à l’authentification par mot de passe, utilisez plutôt ce mot de passe.

  </Step>
</Steps>

La carte de persistance partagée se trouve dans [Docker VM Runtime](/fr/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Pour les équipes qui préfèrent les flux infrastructure-as-code, une configuration Terraform maintenue par la communauté fournit :

- configuration Terraform modulaire avec gestion d’état distant
- provisioning automatisé via cloud-init
- scripts de déploiement (bootstrap, déploiement, sauvegarde/restauration)
- renforcement de la sécurité (pare-feu, UFW, accès SSH uniquement)
- configuration de tunnel SSH pour l’accès au gateway

**Dépôts :**

- Infrastructure : [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuration Docker : [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cette approche complète la configuration Docker ci-dessus avec des déploiements reproductibles, une infrastructure versionnée et une reprise après sinistre automatisée.

> **Remarque :** maintenu par la communauté. Pour les problèmes ou contributions, consultez les liens de dépôt ci-dessus.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer le Gateway : [Configuration du Gateway](/fr/gateway/configuration)
- Garder OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Lié

- [Vue d’ensemble de l’installation](/fr/install)
- [Fly.io](/fr/install/fly)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
