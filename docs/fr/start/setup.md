---
read_when:
    - Configurer une nouvelle machine
    - Vous voulez « le plus récent + le meilleur » sans casser votre configuration personnelle
summary: Configuration avancée et flux de travail de développement pour OpenClaw
title: Configuration initiale
x-i18n:
    generated_at: "2026-04-24T07:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Si vous configurez OpenClaw pour la première fois, commencez par [Premiers pas](/fr/start/getting-started).
Pour les détails d’onboarding, voir [Onboarding (CLI)](/fr/start/wizard).
</Note>

## TL;DR

Choisissez un flux de configuration selon la fréquence à laquelle vous voulez des mises à jour et selon que vous souhaitez exécuter vous-même le Gateway :

- **La personnalisation vit en dehors du dépôt :** gardez votre configuration et votre espace de travail dans `~/.openclaw/openclaw.json` et `~/.openclaw/workspace/` afin que les mises à jour du dépôt n’y touchent pas.
- **Flux stable (recommandé pour la plupart) :** installez l’application macOS et laissez-la exécuter le Gateway groupé.
- **Flux à la pointe (développement) :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l’application macOS s’y connecter en mode Local.

## Prérequis (depuis la source)

- Node 24 recommandé (Node 22 LTS, actuellement `22.14+`, toujours pris en charge)
- `pnpm` préféré (ou Bun si vous utilisez intentionnellement le [flux Bun](/fr/install/bun))
- Docker (facultatif ; uniquement pour la configuration/e2e conteneurisée — voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne fassent pas mal)

Si vous voulez « 100 % adapté à moi » _et_ des mises à jour faciles, gardez vos personnalisations dans :

- **Config :** `~/.openclaw/openclaw.json` (JSON/à peu près JSON5)
- **Espace de travail :** `~/.openclaw/workspace` (skills, prompts, mémoires ; faites-en un dépôt git privé)

Initialisez une fois :

```bash
openclaw setup
```

Depuis l’intérieur de ce dépôt, utilisez l’entrée CLI locale :

```bash
openclaw setup
```

Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw setup` (ou `bun run openclaw setup` si vous utilisez le flux Bun).

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flux stable (application macOS d’abord)

1. Installez + lancez **OpenClaw.app** (barre de menus).
2. Terminez la checklist d’onboarding/autorisations (invites TCC).
3. Assurez-vous que le Gateway est en mode **Local** et en cours d’exécution (l’application le gère).
4. Liez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l’onboarding n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Flux à la pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, obtenir le hot reload et garder l’interface de l’application macOS connectée.

### 0) (Facultatif) Exécuter aussi l’application macOS depuis la source

Si vous voulez également l’application macOS à la pointe :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` exécute le gateway en mode watch et recharge sur les changements pertinents de la source,
de la configuration et des métadonnées de Plugins groupés.
`pnpm openclaw setup` est l’étape ponctuelle d’initialisation locale de la configuration/de l’espace de travail pour une extraction fraîche.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui`, donc relancez `pnpm ui:build` après des modifications dans `ui/`, ou utilisez `pnpm ui:dev` pendant le développement de l’interface Control UI.

Si vous utilisez intentionnellement le flux Bun, les commandes équivalentes sont :

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Pointer l’application macOS vers votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Mode de connexion : **Local**
  L’application se connectera au gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Le statut du Gateway dans l’application doit indiquer **« Using existing gateway … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges fréquents

- **Mauvais port :** le WS Gateway est par défaut sur `ws://127.0.0.1:18789` ; gardez l’application et la CLI sur le même port.
- **Où vit l’état :**
  - État des canaux/fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification des modèles : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte de stockage des identifiants

Utilisez ceci lorsque vous déboguez l’authentification ou décidez de ce qu’il faut sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton du bot Telegram** : configuration/environnement ou `channels.telegram.tokenFile` (fichier régulier uniquement ; les liens symboliques sont rejetés)
- **Jeton du bot Discord** : configuration/environnement ou SecretRef (fournisseurs env/file/exec)
- **Jetons Slack** : configuration/environnement (`channels.slack.*`)
- **Listes d’autorisation d’appairage** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d’authentification des modèles** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Charge utile de secrets basée sur fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans casser votre configuration)

- Gardez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos données » ; ne placez pas vos prompts/config personnels dans le dépôt `openclaw`.
- Mise à jour de la source : `git pull` + étape d’installation de votre gestionnaire de paquets choisi (`pnpm install` par défaut ; `bun install` pour le flux Bun) + continuez à utiliser la commande `gateway:watch` correspondante.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les
services utilisateur lors de la déconnexion/de l’inactivité, ce qui tue le Gateway. L’onboarding tente d’activer
la persistance pour vous (peut demander sudo). Si c’est toujours désactivé, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez un service **système** au lieu d’un
service utilisateur (pas besoin de persistance). Voir [Runbook Gateway](/fr/gateway) pour les notes systemd.

## Documentation associée

- [Runbook Gateway](/fr/gateway) (indicateurs, supervision, ports)
- [Configuration Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse + paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du gateway)
