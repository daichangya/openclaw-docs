---
read_when:
    - Exécution de plusieurs Gateway sur la même machine
    - Vous avez besoin d’une isolation de la configuration/de l’état/des ports par Gateway
summary: Exécuter plusieurs Gateways OpenClaw sur un même hôte (isolation, ports et profils)
title: plusieurs Gateways
x-i18n:
    generated_at: "2026-04-24T07:11:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Plusieurs Gateways (même hôte)

La plupart des configurations devraient utiliser une seule Gateway, car une seule Gateway peut gérer plusieurs connexions de messagerie et agents. Si vous avez besoin d’une isolation plus forte ou de redondance (par ex. un bot de secours), exécutez des Gateways séparées avec des profils/ports isolés.

## Meilleure configuration recommandée

Pour la plupart des utilisateurs, la configuration la plus simple pour un bot de secours est :

- garder le bot principal sur le profil par défaut
- exécuter le bot de secours sur `--profile rescue`
- utiliser un bot Telegram complètement distinct pour le compte de secours
- conserver le bot de secours sur un port de base différent, par exemple `19789`

Cela garde le bot de secours isolé du bot principal, afin qu’il puisse déboguer ou appliquer
des modifications de configuration si le bot principal est hors service. Laissez au moins 20 ports entre
les ports de base afin que les ports dérivés browser/canvas/CDP n’entrent jamais en collision.

## Démarrage rapide du bot de secours

Utilisez ceci comme chemin par défaut sauf si vous avez une raison forte de faire autrement :

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Si votre bot principal fonctionne déjà, c’est généralement tout ce dont vous avez besoin.

Pendant `openclaw --profile rescue onboard` :

- utilisez le jeton du bot Telegram distinct
- conservez le profil `rescue`
- utilisez un port de base au moins 20 plus élevé que celui du bot principal
- acceptez l’espace de travail de secours par défaut sauf si vous en gérez déjà un vous-même

Si l’intégration a déjà installé le service de secours pour vous, la commande finale
`gateway install` n’est pas nécessaire.

## Pourquoi cela fonctionne

Le bot de secours reste indépendant car il possède son propre :

- profil/configuration
- répertoire d’état
- espace de travail
- port de base (plus les ports dérivés)
- jeton de bot Telegram

Pour la plupart des configurations, utilisez un bot Telegram complètement distinct pour le profil de secours :

- facile à garder réservé aux opérateurs
- jeton de bot et identité séparés
- indépendant de l’installation du canal/de l’app du bot principal
- chemin simple de récupération basé sur les DM lorsque le bot principal est en panne

## Ce que change `--profile rescue onboard`

`openclaw --profile rescue onboard` utilise le flux d’intégration normal, mais il
écrit tout dans un profil distinct.

En pratique, cela signifie que le bot de secours obtient son propre :

- fichier de configuration
- répertoire d’état
- espace de travail (par défaut `~/.openclaw/workspace-rescue`)
- nom de service géré

Sinon, les invites sont les mêmes que pour une intégration normale.

## Configuration multi-Gateway générale

La disposition du bot de secours ci-dessus est la valeur par défaut la plus simple, mais le même modèle
d’isolation fonctionne pour n’importe quelle paire ou groupe de Gateways sur un même hôte.

Pour une configuration plus générale, donnez à chaque Gateway supplémentaire son propre profil nommé et son
propre port de base :

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Si vous voulez que les deux Gateways utilisent des profils nommés, cela fonctionne aussi :

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

Utilisez le démarrage rapide du bot de secours lorsque vous voulez une voie opérateur de repli. Utilisez le
modèle général à profils lorsque vous voulez plusieurs Gateways durables pour
différents canaux, locataires, espaces de travail ou rôles opérationnels.

## Liste de contrôle d’isolation

Gardez ces éléments uniques pour chaque instance de Gateway :

- `OPENCLAW_CONFIG_PATH` — fichier de configuration par instance
- `OPENCLAW_STATE_DIR` — sessions, identifiants, caches par instance
- `agents.defaults.workspace` — racine d’espace de travail par instance
- `gateway.port` (ou `--port`) — unique par instance
- ports dérivés browser/canvas/CDP

Si ces éléments sont partagés, vous aurez des conflits de configuration et de ports.

## Correspondance des ports (dérivés)

Port de base = `gateway.port` (ou `OPENCLAW_GATEWAY_PORT` / `--port`).

- port du service de contrôle browser = base + 2 (loopback uniquement)
- canvas host est servi sur le serveur HTTP Gateway (même port que `gateway.port`)
- les ports CDP de profil browser sont alloués automatiquement depuis `browser.controlPort + 9 .. + 108`

Si vous redéfinissez l’un de ceux-ci dans la configuration ou l’environnement, vous devez les garder uniques par instance.

## Remarques browser/CDP (piège courant)

- **Ne** fixez **pas** `browser.cdpUrl` aux mêmes valeurs sur plusieurs instances.
- Chaque instance a besoin de son propre port de contrôle browser et de sa propre plage CDP (dérivés de son port Gateway).
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

- `gateway status --deep` aide à détecter des services launchd/systemd/schtasks obsolètes provenant d’anciennes installations.
- Le texte d’avertissement de `gateway probe`, tel que `multiple reachable gateways detected`, n’est attendu que lorsque vous exécutez intentionnellement plus d’une Gateway isolée.

## Liens associés

- [Guide opérationnel Gateway](/fr/gateway)
- [Verrou Gateway](/fr/gateway/gateway-lock)
- [Configuration](/fr/gateway/configuration)
