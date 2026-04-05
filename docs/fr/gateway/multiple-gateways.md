---
read_when:
    - Exécution de plusieurs passerelles sur la même machine
    - Vous avez besoin d’une config/d’un état/de ports isolés par passerelle
summary: Exécuter plusieurs passerelles OpenClaw sur un même hôte (isolation, ports et profils)
title: Passerelles multiples
x-i18n:
    generated_at: "2026-04-05T12:42:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Passerelles multiples (même hôte)

La plupart des configurations devraient utiliser une seule passerelle, car une seule passerelle peut gérer plusieurs connexions de messagerie et agents. Si vous avez besoin d’une isolation ou d’une redondance plus forte (par ex. un bot de secours), exécutez des passerelles distinctes avec des profils/ports isolés.

## Checklist d’isolation (obligatoire)

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants, caches par instance
- `agents.defaults.workspace` — racine de workspace par instance
- `gateway.port` (ou `--port`) — unique par instance
- Les ports dérivés (browser/canvas) ne doivent pas se chevaucher

Si ces éléments sont partagés, vous rencontrerez des courses de configuration et des conflits de port.

## Recommandé : profils (`--profile`)

Les profils limitent automatiquement `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` et suffixent les noms de service.

```bash
# principal
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# secours
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

Services par profil :

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## Guide du bot de secours

Exécutez une seconde passerelle sur le même hôte avec ses propres :

- profil/configuration
- répertoire d’état
- workspace
- port de base (plus les ports dérivés)

Cela maintient le bot de secours isolé du bot principal afin qu’il puisse déboguer ou appliquer des changements de configuration si le bot principal est hors service.

Espacement des ports : laissez au moins 20 ports entre les ports de base afin que les ports dérivés browser/canvas/CDP n’entrent jamais en collision.

### Comment installer (bot de secours)

```bash
# Bot principal (existant ou nouveau, sans paramètre --profile)
# S’exécute sur le port 18789 + ports Chrome CDC/Canvas/...
openclaw onboard
openclaw gateway install

# Bot de secours (profil + ports isolés)
openclaw --profile rescue onboard
# Remarques :
# - le nom du workspace recevra par défaut le suffixe -rescue
# - le port doit être au moins 18789 + 20 ports,
#   il est préférable de choisir un port de base complètement différent, comme 19789,
# - le reste de l’intégration guidée est identique à la normale

# Pour installer le service (si cela n’a pas eu lieu automatiquement pendant la configuration)
openclaw --profile rescue gateway install
```

## Mappage des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle browser = base + 2 (loopback uniquement)
- l’hôte canvas est servi sur le serveur HTTP de la passerelle (même port que `gateway.port`)
- les ports CDP des profils browser sont alloués automatiquement depuis `browser.controlPort + 9 .. + 108`

Si vous remplacez l’un de ces paramètres dans la config ou l’environnement, vous devez les garder uniques par instance.

## Remarques sur Browser/CDP (piège courant)

- **Ne fixez pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle browser et de sa propre plage CDP (dérivés de son port de passerelle).
- Si vous avez besoin de ports CDP explicites, définissez `browser.profiles.<name>.cdpPort` par instance.
- Chrome distant : utilisez `browser.profiles.<name>.cdpUrl` (par profil, par instance).

## Exemple manuel avec env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## Vérifications rapides

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Interprétation :

- `gateway status --deep` aide à détecter les services launchd/systemd/schtasks obsolètes issus d’installations plus anciennes.
- Un texte d’avertissement de `gateway probe` tel que `multiple reachable gateways detected` n’est attendu que lorsque vous exécutez intentionnellement plusieurs passerelles isolées.
