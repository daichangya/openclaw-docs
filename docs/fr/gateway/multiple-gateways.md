---
read_when:
    - Exécution de plusieurs Gateway sur la même machine
    - Vous avez besoin d’une configuration, d’un état et de ports isolés pour chaque Gateway
summary: Exécuter plusieurs Gateway OpenClaw sur un même hôte (isolation, ports et profils)
title: Plusieurs Gateway
x-i18n:
    generated_at: "2026-04-21T17:45:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c3fcb921bc6596040e9249467964bd9dcd40ea7c16e958bb378247b0f994a7b
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Plusieurs Gateway (même hôte)

La plupart des configurations devraient utiliser un seul Gateway, car un Gateway unique peut gérer plusieurs connexions de messagerie et agents. Si vous avez besoin d’une isolation plus forte ou de redondance (par exemple, un bot de secours), exécutez des Gateway distincts avec des profils et des ports isolés.

## Liste de contrôle d’isolation (obligatoire)

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants et caches par instance
- `agents.defaults.workspace` — racine d’espace de travail par instance
- `gateway.port` (ou `--port`) — unique par instance
- Les ports dérivés (browser/canvas) ne doivent pas se chevaucher

Si ces éléments sont partagés, vous rencontrerez des conflits de configuration et de ports.

## Recommandé : utilisez le profil par défaut pour le principal, un profil nommé pour le secours

Les profils appliquent automatiquement un périmètre à `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` et ajoutent un suffixe aux noms de service. Pour
la plupart des configurations de bot de secours, gardez le bot principal sur le profil par défaut et attribuez uniquement
au bot de secours un profil nommé tel que `rescue`.

```bash
# principal (profil par défaut)
openclaw setup
openclaw gateway --port 18789

# secours
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Services :

```bash
openclaw gateway install
openclaw --profile rescue gateway install
```

Si vous souhaitez que les deux Gateway utilisent des profils nommés, cela fonctionne aussi, mais ce n’est pas
obligatoire.

## Guide du bot de secours

Configuration recommandée :

- gardez le bot principal sur le profil par défaut
- exécutez le bot de secours avec `--profile rescue`
- utilisez un bot Telegram complètement distinct pour le compte de secours
- gardez le bot de secours sur un port de base différent, par exemple `19001`

Cela permet d’isoler le bot de secours du bot principal afin qu’il puisse déboguer ou appliquer
des modifications de configuration si le bot principal est indisponible. Laissez au moins 20 ports entre les
ports de base afin que les ports dérivés browser/canvas/CDP n’entrent jamais en collision.

### Canal/compte de secours recommandé

Pour la plupart des configurations, utilisez un bot Telegram complètement distinct pour le profil de secours.

Pourquoi Telegram :

- facile à réserver aux opérateurs uniquement
- jeton de bot et identité distincts
- indépendant de l’installation du canal/de l’application du bot principal
- chemin de récupération simple basé sur les messages privés lorsque le bot principal est défaillant

L’élément important est l’indépendance complète : compte de bot distinct, identifiants distincts, profil OpenClaw distinct, espace de travail distinct et port distinct.

### Flux d’installation recommandé

Utilisez ceci comme configuration par défaut, sauf si vous avez une raison solide de faire autrement :

```bash
# Bot principal (profil par défaut, port 18789)
openclaw onboard
openclaw gateway install

# Bot de secours (bot Telegram distinct, profil distinct, port 19001)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install
```

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram distinct
- conservez le profil `rescue`
- utilisez un port de base au moins 20 plus élevé que celui du bot principal
- acceptez l’espace de travail de secours par défaut, sauf si vous en gérez déjà un vous-même

Si l’onboarding a déjà installé le service de secours pour vous, le
`gateway install` final n’est pas nécessaire.

### Ce que l’onboarding modifie

`openclaw --profile rescue onboard` utilise le flux d’onboarding normal, mais
écrit tout dans un profil distinct.

En pratique, cela signifie que le bot de secours obtient son propre :

- fichier de configuration
- répertoire d’état
- espace de travail (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Les invites sont par ailleurs les mêmes que pour un onboarding normal.

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle du browser = base + 2 (loopback uniquement)
- l’hôte canvas est servi sur le serveur HTTP Gateway (même port que `gateway.port`)
- les ports CDP du profil Browser sont alloués automatiquement à partir de `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un de ces paramètres dans la configuration ou l’environnement, vous devez les garder uniques par instance.

## Notes browser/CDP (piège fréquent)

- **N’épinglez pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle browser et de sa propre plage CDP (dérivée de son port Gateway).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

## Exemple manuel avec variables d’environnement

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
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

- `gateway status --deep` aide à détecter les services launchd/systemd/schtasks obsolètes issus d’anciennes installations.
- Le texte d’avertissement de `gateway probe`, tel que `multiple reachable gateways detected`, n’est attendu que lorsque vous exécutez intentionnellement plus d’un gateway isolé.
