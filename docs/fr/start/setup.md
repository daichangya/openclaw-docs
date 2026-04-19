---
read_when:
    - Configurer une nouvelle machine
    - Vous voulez la « dernière et meilleure » version sans casser votre configuration personnelle
summary: Configuration avancée et workflows de développement pour OpenClaw
title: Configuration
x-i18n:
    generated_at: "2026-04-19T06:52:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Configuration

<Note>
Si vous configurez OpenClaw pour la première fois, commencez par [Bien démarrer](/fr/start/getting-started).
Pour les détails de l’onboarding, consultez [Onboarding (CLI)](/fr/start/wizard).
</Note>

## En bref

- **La personnalisation se trouve en dehors du dépôt :** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configuration).
- **Workflow stable :** installez l’app macOS ; laissez-la exécuter le Gateway intégré.
- **Workflow de pointe :** exécutez vous-même le Gateway via `pnpm gateway:watch`, puis laissez l’app macOS s’y attacher en mode Local.

## Prérequis (depuis les sources)

- Node 24 recommandé (Node 22 LTS, actuellement `22.14+`, est toujours pris en charge)
- `pnpm` recommandé (ou Bun si vous utilisez intentionnellement le [workflow Bun](/fr/install/bun))
- Docker (facultatif ; uniquement pour une configuration conteneurisée / e2e — voir [Docker](/fr/install/docker))

## Stratégie de personnalisation (pour que les mises à jour ne posent pas problème)

Si vous voulez quelque chose de « 100 % adapté à moi » _et_ des mises à jour faciles, gardez votre personnalisation dans :

- **Configuration :** `~/.openclaw/openclaw.json` (JSON / semblable à JSON5)
- **Workspace :** `~/.openclaw/workspace` (Skills, prompts, memories ; faites-en un dépôt git privé)

Initialisez une fois :

```bash
openclaw setup
```

Depuis ce dépôt, utilisez l’entrée CLI locale :

```bash
openclaw setup
```

Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw setup` (ou `bun run openclaw setup` si vous utilisez le workflow Bun).

## Exécuter le Gateway depuis ce dépôt

Après `pnpm build`, vous pouvez exécuter directement la CLI packagée :

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Workflow stable (app macOS d’abord)

1. Installez et lancez **OpenClaw.app** (barre de menus).
2. Terminez la checklist d’onboarding / des permissions (invites TCC).
3. Assurez-vous que le Gateway est en mode **Local** et en cours d’exécution (l’app le gère).
4. Associez les surfaces (exemple : WhatsApp) :

```bash
openclaw channels login
```

5. Vérification rapide :

```bash
openclaw health
```

Si l’onboarding n’est pas disponible dans votre build :

- Exécutez `openclaw setup`, puis `openclaw channels login`, puis démarrez le Gateway manuellement (`openclaw gateway`).

## Workflow de pointe (Gateway dans un terminal)

Objectif : travailler sur le Gateway TypeScript, bénéficier du rechargement à chaud et garder l’interface de l’app macOS attachée.

### 0) (Facultatif) Exécuter aussi l’app macOS depuis les sources

Si vous voulez également que l’app macOS soit sur la version de pointe :

```bash
./scripts/restart-mac.sh
```

### 1) Démarrer le Gateway de développement

```bash
pnpm install
# Première exécution uniquement (ou après avoir réinitialisé la configuration / le workspace OpenClaw locaux)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` exécute le gateway en mode watch et recharge lors des changements pertinents du code source, de la configuration et des métadonnées des Plugins intégrés.
`pnpm openclaw setup` est l’étape d’initialisation locale unique de la configuration / du workspace pour un nouveau checkout.
`pnpm gateway:watch` ne reconstruit pas `dist/control-ui`, donc relancez `pnpm ui:build` après des changements dans `ui/` ou utilisez `pnpm ui:dev` pendant le développement de la Control UI.

Si vous utilisez intentionnellement le workflow Bun, les commandes équivalentes sont :

```bash
bun install
# Première exécution uniquement (ou après avoir réinitialisé la configuration / le workspace OpenClaw locaux)
bun run openclaw setup
bun run gateway:watch
```

### 2) Faire pointer l’app macOS vers votre Gateway en cours d’exécution

Dans **OpenClaw.app** :

- Mode de connexion : **Local**
  L’app se connectera au gateway en cours d’exécution sur le port configuré.

### 3) Vérifier

- Le statut du Gateway dans l’app doit afficher **« Utilisation du gateway existant … »**
- Ou via la CLI :

```bash
openclaw health
```

### Pièges fréquents

- **Mauvais port :** le WS du Gateway utilise par défaut `ws://127.0.0.1:18789` ; gardez l’app et la CLI sur le même port.
- **Où se trouve l’état :**
  - État des canaux / fournisseurs : `~/.openclaw/credentials/`
  - Profils d’authentification des modèles : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessions : `~/.openclaw/agents/<agentId>/sessions/`
  - Journaux : `/tmp/openclaw/`

## Carte du stockage des identifiants

Utilisez cette section lorsque vous déboguez l’authentification ou que vous décidez quoi sauvegarder :

- **WhatsApp** : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot Telegram** : config / env ou `channels.telegram.tokenFile` (fichier ordinaire uniquement ; les symlinks sont rejetés)
- **Token de bot Discord** : config / env ou SecretRef (fournisseurs env / file / exec)
- **Tokens Slack** : config / env (`channels.slack.*`)
- **Listes d’autorisation d’association** :
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (compte par défaut)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (comptes non par défaut)
- **Profils d’authentification des modèles** : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de secrets basé sur un fichier (facultatif)** : `~/.openclaw/secrets.json`
- **Import OAuth hérité** : `~/.openclaw/credentials/oauth.json`
  Plus de détails : [Sécurité](/fr/gateway/security#credential-storage-map).

## Mise à jour (sans casser votre configuration)

- Considérez `~/.openclaw/workspace` et `~/.openclaw/` comme « vos données » ; ne placez pas vos prompts / votre configuration personnels dans le dépôt `openclaw`.
- Mise à jour des sources : `git pull` + l’étape d’installation de votre gestionnaire de paquets choisi (`pnpm install` par défaut ; `bun install` pour le workflow Bun) + continuez à utiliser la commande `gateway:watch` correspondante.

## Linux (service utilisateur systemd)

Les installations Linux utilisent un service **utilisateur** systemd. Par défaut, systemd arrête les services utilisateur lors de la déconnexion / de l’inactivité, ce qui tue le Gateway. L’onboarding tente d’activer le lingering pour vous (peut demander sudo). Si ce n’est toujours pas activé, exécutez :

```bash
sudo loginctl enable-linger $USER
```

Pour des serveurs toujours actifs ou multi-utilisateurs, envisagez plutôt un service **système** qu’un service utilisateur (aucun lingering nécessaire). Consultez le [guide d’exploitation du Gateway](/fr/gateway) pour les notes sur systemd.

## Documentation associée

- [Guide d’exploitation du Gateway](/fr/gateway) (flags, supervision, ports)
- [Configuration du Gateway](/fr/gateway/configuration) (schéma de configuration + exemples)
- [Discord](/fr/channels/discord) et [Telegram](/fr/channels/telegram) (balises de réponse + paramètres replyToMode)
- [Configuration de l’assistant OpenClaw](/fr/start/openclaw)
- [App macOS](/fr/platforms/macos) (cycle de vie du gateway)
