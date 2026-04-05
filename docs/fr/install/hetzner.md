---
read_when:
    - Vous voulez OpenClaw en fonctionnement 24 h/24 et 7 j/7 sur un VPS cloud (pas sur votre laptop)
    - Vous voulez une Gateway toujours active de niveau production sur votre propre VPS
    - Vous voulez un contrôle complet sur la persistance, les binaires et le comportement au redémarrage
    - Vous exécutez OpenClaw dans Docker sur Hetzner ou un fournisseur similaire
summary: Exécuter OpenClaw Gateway 24 h/24 et 7 j/7 sur un VPS Hetzner économique (Docker) avec état persistant et binaires intégrés
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T12:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw sur Hetzner (Docker, guide VPS de production)

## Objectif

Exécuter une Gateway OpenClaw persistante sur un VPS Hetzner à l’aide de Docker, avec état durable, binaires intégrés et comportement de redémarrage sûr.

Si vous voulez « OpenClaw 24 h/24, 7 j/7 pour ~5 $ », c’est la configuration fiable la plus simple.
Les tarifs Hetzner changent ; choisissez le plus petit VPS Debian/Ubuntu et augmentez si vous rencontrez des OOM.

Rappel sur le modèle de sécurité :

- Les agents partagés d’entreprise conviennent lorsque tout le monde se trouve dans la même limite de confiance et que le runtime est exclusivement professionnel.
- Gardez une séparation stricte : VPS/runtime dédié + comptes dédiés ; pas de profils personnels Apple/Google/navigateur/gestionnaire de mots de passe sur cet hôte.
- Si les utilisateurs sont adversaires les uns des autres, séparez par gateway/hôte/utilisateur OS.

Voir [Sécurité](/gateway/security) et [Hébergement VPS](/vps).

## Ce que nous faisons (en termes simples)

- Louer un petit serveur Linux (VPS Hetzner)
- Installer Docker (runtime d’application isolé)
- Démarrer la Gateway OpenClaw dans Docker
- Persister `~/.openclaw` + `~/.openclaw/workspace` sur l’hôte (survit aux redémarrages/rebuilds)
- Accéder à l’UI de contrôle depuis votre laptop via un tunnel SSH

Cet état monté `~/.openclaw` inclut `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` par agent et `.env`.

La Gateway peut être accessible via :

- Transfert de port SSH depuis votre laptop
- Exposition directe du port si vous gérez vous-même le pare-feu et les jetons

Ce guide suppose Ubuntu ou Debian sur Hetzner.  
Si vous êtes sur un autre VPS Linux, adaptez les paquets en conséquence.
Pour le flux Docker générique, voir [Docker](/install/docker).

---

## Chemin rapide (opérateurs expérimentés)

1. Provisionner un VPS Hetzner
2. Installer Docker
3. Cloner le dépôt OpenClaw
4. Créer les répertoires hôte persistants
5. Configurer `.env` et `docker-compose.yml`
6. Intégrer les binaires requis dans l’image
7. `docker compose up -d`
8. Vérifier la persistance et l’accès à la Gateway

---

## Ce dont vous avez besoin

- VPS Hetzner avec accès root
- Accès SSH depuis votre laptop
- Une aisance de base avec SSH + copier/coller
- ~20 minutes
- Docker et Docker Compose
- Identifiants d’authentification du modèle
- Identifiants facultatifs de fournisseurs
  - QR WhatsApp
  - Jeton de bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provisionner le VPS">
    Créez un VPS Ubuntu ou Debian chez Hetzner.

    Connectez-vous en root :

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

  <Step title="Créer des répertoires hôte persistants">
    Les conteneurs Docker sont éphémères.
    Tout état de longue durée doit vivre sur l’hôte.

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
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Générez des secrets forts :

    ```bash
    openssl rand -hex 32
    ```

    **Ne validez pas ce fichier.**

    Ce fichier `.env` sert aux variables d’environnement du conteneur/runtime telles que `OPENCLAW_GATEWAY_TOKEN`.
    L’authentification OAuth/clé API des fournisseurs stockée se trouve dans
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
          # Recommandé : gardez la Gateway en loopback uniquement sur le VPS ; accédez-y via un tunnel SSH.
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

    `--allow-unconfigured` n’est là que pour la commodité du bootstrap ; ce n’est pas un remplacement pour une configuration gateway correcte. Définissez quand même l’authentification (`gateway.auth.token` ou mot de passe) et utilisez des paramètres de liaison sûrs pour votre déploiement.

  </Step>

  <Step title="Étapes partagées du runtime Docker VM">
    Utilisez le guide de runtime partagé pour le flux courant d’hôte Docker :

    - [Intégrer les binaires requis dans l’image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Construire et lancer](/install/docker-vm-runtime#build-and-launch)
    - [Ce qui persiste où](/install/docker-vm-runtime#what-persists-where)
    - [Mises à jour](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Accès spécifique à Hetzner">
    Après les étapes partagées de construction et de lancement, créez un tunnel depuis votre laptop :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Ouvrez :

    `http://127.0.0.1:18789/`

    Collez le secret partagé configuré. Ce guide utilise le jeton gateway par
    défaut ; si vous êtes passé à l’authentification par mot de passe, utilisez ce mot de passe à la place.

  </Step>
</Steps>

La carte de persistance partagée se trouve dans [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Pour les équipes qui préfèrent les flux infrastructure-as-code, une configuration Terraform maintenue par la communauté fournit :

- Configuration Terraform modulaire avec gestion d’état distant
- Provisionnement automatisé via cloud-init
- Scripts de déploiement (bootstrap, déploiement, sauvegarde/restauration)
- Renforcement de la sécurité (pare-feu, UFW, accès SSH uniquement)
- Configuration de tunnel SSH pour l’accès à la gateway

**Dépôts :**

- Infrastructure : [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Configuration Docker : [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cette approche complète la configuration Docker ci-dessus avec des déploiements reproductibles, une infrastructure versionnée et une reprise après sinistre automatisée.

> **Remarque :** maintenu par la communauté. Pour les problèmes ou contributions, consultez les liens de dépôt ci-dessus.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/channels)
- Configurer la Gateway : [Configuration Gateway](/gateway/configuration)
- Garder OpenClaw à jour : [Mise à jour](/install/updating)
