---
read_when:
    - Exécuter plusieurs Gateway sur la même machine
    - Vous avez besoin d’une configuration, d’un état et de ports isolés pour chaque Gateway
summary: Exécuter plusieurs Gateway OpenClaw sur un seul hôte (isolation, ports et profils)
title: Plusieurs Gateway
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Plusieurs Gateway (même hôte)

La plupart des configurations devraient utiliser un seul Gateway, car un Gateway unique peut gérer plusieurs connexions de messagerie et agents. Si vous avez besoin d’une isolation plus forte ou de redondance (par exemple, un bot de secours), exécutez des Gateway séparés avec des profils/ports isolés.

## Configuration la plus recommandée

Pour la plupart des utilisateurs, la configuration la plus simple pour un bot de secours est la suivante :

- garder le bot principal sur le profil par défaut
- exécuter le bot de secours avec `--profile rescue`
- utiliser un bot Telegram complètement distinct pour le compte de secours
- garder le bot de secours sur un port de base différent, par exemple `19789`

Cela permet de garder le bot de secours isolé du bot principal afin qu’il puisse déboguer ou appliquer des modifications de configuration si le bot principal est indisponible. Laissez au moins 20 ports d’écart entre les ports de base afin que les ports dérivés browser/canvas/CDP n’entrent jamais en conflit.

## Démarrage rapide du bot de secours

Utilisez ceci comme chemin par défaut sauf si vous avez une raison importante de faire autrement :

```bash
# Bot de secours (bot Telegram séparé, profil séparé, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal fonctionne déjà, c’est généralement tout ce dont vous avez besoin.

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram séparé
- conservez le profil `rescue`
- utilisez un port de base au moins 20 plus élevé que celui du bot principal
- acceptez l’espace de travail de secours par défaut sauf si vous en gérez déjà un vous-même

Si l’onboarding a déjà installé le service de secours pour vous, la commande finale `gateway install` n’est pas nécessaire.

## Pourquoi cela fonctionne

Le bot de secours reste indépendant parce qu’il a son propre :

- profil/configuration
- répertoire d’état
- espace de travail
- port de base (plus les ports dérivés)
- jeton de bot Telegram

Pour la plupart des configurations, utilisez un bot Telegram complètement distinct pour le profil de secours :

- facile à réserver aux opérateurs
- jeton et identité de bot séparés
- indépendant de l’installation du canal/de l’application du bot principal
- chemin de récupération simple basé sur les messages privés lorsque le bot principal est cassé

## Ce que modifie `--profile rescue onboard`

`openclaw --profile rescue onboard` utilise le flux d’onboarding normal, mais écrit tout dans un profil séparé.

En pratique, cela signifie que le bot de secours obtient son propre :

- fichier de configuration
- répertoire d’état
- espace de travail (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Les invites sont par ailleurs les mêmes que pour l’onboarding normal.

## Configuration générale multi-Gateway

La disposition du bot de secours ci-dessus est le choix par défaut le plus simple, mais le même modèle d’isolation fonctionne pour toute paire ou tout groupe de Gateway sur un même hôte.

Pour une configuration plus générale, donnez à chaque Gateway supplémentaire son propre profil nommé ainsi que son propre port de base :

```bash
# principal (profil par défaut)
openclaw setup
openclaw gateway --port 18789

# gateway supplémentaire
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si vous voulez que les deux Gateway utilisent des profils nommés, cela fonctionne aussi :

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Les services suivent le même modèle :

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Utilisez le démarrage rapide du bot de secours lorsque vous voulez une voie opérateur de secours. Utilisez le modèle général par profil lorsque vous voulez plusieurs Gateway persistants pour différents canaux, locataires, espaces de travail ou rôles opérationnels.

## Liste de contrôle d’isolation

Gardez les éléments suivants uniques pour chaque instance de Gateway :

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants et caches par instance
- `agents.defaults.workspace` — racine d’espace de travail par instance
- `gateway.port` (ou `--port`) — unique par instance
- ports dérivés browser/canvas/CDP

Si ces éléments sont partagés, vous rencontrerez des conflits de configuration et de ports.

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle du navigateur = port de base + 2 (loopback uniquement)
- l’hôte canvas est servi sur le serveur HTTP du Gateway (même port que `gateway.port`)
- les ports CDP du profil de navigateur sont alloués automatiquement à partir de `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un de ces éléments dans la configuration ou l’environnement, vous devez les garder uniques par instance.

## Notes sur browser/CDP (piège courant)

- **Ne** fixez **pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle du navigateur et de sa propre plage CDP (dérivée de son port Gateway).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

## Exemple manuel avec variables d’environnement

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Vérifications rapides

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interprétation :

- `gateway status --deep` aide à détecter les services `launchd`/`systemd`/`schtasks` obsolètes provenant d’installations plus anciennes.
- Le texte d’avertissement de `gateway probe`, comme `multiple reachable gateways detected`, n’est attendu que lorsque vous exécutez intentionnellement plus d’un Gateway isolé.
