---
read_when:
    - Configuration d'une nouvelle machine
    - Vous voulez le « dernier cri » sans casser votre configuration personnelle
summary: Configuration avancée et workflows de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-04-05T12:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Configuration

<Note>
Si vous effectuez la configuration pour la première fois, commencez par [Premiers pas](/fr/start/getting-started).
Pour les détails d'intégration, consultez [Intégration (CLI)](/fr/start/wizard).
</Note>

## En bref

- **La personnalisation se trouve hors du dépôt :** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configuration).
- **Workflow stable :** installez l'application macOS ; laissez-la exécuter le Gateway intégré.
- **Workflow en pointe :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l'application macOS s'y connecter en mode Local.

## Prérequis (depuis le code source)

- Node 24 recommandé (Node 22 LTS, actuellement `22.14+`, toujours pris en charge)
- `pnpm` préféré (ou Bun si vous utilisez intentionnellement le [workflow Bun](/fr/install/bun))
- Docker (facultatif ; uniquement pour la configuration conteneurisée/e2e — voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne fassent pas de mal)

Si vous voulez « 100 % personnalisé pour moi » _et_ des mises à jour faciles, conservez votre personnalisation dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace :** `~/.openclaw/workspace` (Skills, prompts, mémoires ; faites-en un dépôt git privé)

Initialisez une fois :

```bash
openclaw setup
```

Depuis l'intérieur de ce dépôt, utilisez l'entrée CLI locale :

```bash
openclaw setup
```

Si vous n'avez pas encore d'installation globale, exécutez-la via `pnpm openclaw setup` (ou `bun run openclaw setup` si vous utilisez le workflow Bun).

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI empaquetée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Workflow stable (application macOS d'abord)

1. Installez et lancez **OpenClaw.app** (barre de menus).
2. Terminez la liste de contrôle d'intégration/autorisations (invites TCC).
3. Assurez-vous que le Gateway est en mode **Local** et en cours d'exécution (l'application le gère).
4. Reliez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l'intégration n'est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Workflow en pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, bénéficier du rechargement à chaud et garder l'interface de l'application macOS connectée.

### 0) (Facultatif) Exécuter aussi l'application macOS depuis le code source

Si vous voulez aussi que l'application macOS soit en pointe :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` exécute le gateway en mode watch et recharge lors des modifications pertinentes du code source, de la configuration et des métadonnées des plugins intégrés.

Si vous utilisez intentionnellement le workflow Bun, les commandes équivalentes sont :

```bash
bun install
bun run gateway:watch
```

### 2) Pointer l'application macOS vers votre Gateway en cours d'exécution

Dans **OpenClaw.app** :

- Mode de connexion : **Local**
  L'application se connectera au gateway en cours d'exécution sur le port configuré.

### 3) Vérifier

- L'état du Gateway dans l'application doit afficher **« Utilisation du gateway existant … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges fréquents

- **Mauvais port :** le Gateway WS utilise par défaut `ws://127.0.0.1:18789` ; gardez l'application et la CLI sur le même port.
- **Où l'état est stocké :**
  - État des canaux/providers : `~/.openclaw/credentials/`
  - Profils d'authentification de modèle : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte du stockage des identifiants

Utilisez ceci pour déboguer l'authentification ou décider quoi sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Jeton de bot Telegram** : config/env ou `channels.telegram.tokenFile` (fichier normal uniquement ; liens symboliques refusés)
- **Jeton de bot Discord** : config/env ou SecretRef (providers env/file/exec)
- **Jetons Slack** : config/env (`channels.slack.*`)
- **Listes d'autorisation d'appairage** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d'authentification de modèle** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de secrets basé sur fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans ruiner votre configuration)

- Conservez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos affaires » ; ne mettez pas vos prompts/configuration personnels dans le dépôt `openclaw`.
- Mise à jour depuis le code source : `git pull` + l'étape d'installation de votre gestionnaire de paquets choisi (`pnpm install` par défaut ; `bun install` pour le workflow Bun) + continuez à utiliser la commande `gateway:watch` correspondante.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les services utilisateur à la déconnexion/en cas d'inactivité, ce qui tue le Gateway. L'intégration tente d'activer le mode lingering pour vous (peut demander sudo). Si ce n'est toujours pas activé, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour les serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service **système** qu'un service utilisateur (pas besoin de lingering). Consultez le [runbook Gateway](/fr/gateway) pour les notes systemd.

## Documentation associée

- [Runbook Gateway](/fr/gateway) (flags, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse + paramètres replyToMode)
- [Configuration de l'assistant OpenClaw](/start/openclaw)
- [Application macOS](/fr/platforms/macos) (cycle de vie du gateway)
