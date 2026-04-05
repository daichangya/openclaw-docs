---
read_when:
    - Mise en route d’une nouvelle instance d’assistant
    - Examen des implications en matière de sécurité et d’autorisations
summary: Guide de bout en bout pour exécuter OpenClaw comme assistant personnel avec des avertissements de sécurité
title: Configuration d’un assistant personnel
x-i18n:
    generated_at: "2026-04-05T12:55:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02f10a9f7ec08f71143cbae996d91cbdaa19897a40f725d8ef524def41cf2759
    source_path: start/openclaw.md
    workflow: 15
---

# Créer un assistant personnel avec OpenClaw

OpenClaw est une passerelle auto-hébergée qui connecte Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et plus encore à des agents IA. Ce guide couvre la configuration « assistant personnel » : un numéro WhatsApp dédié qui se comporte comme votre assistant IA toujours actif.

## ⚠️ La sécurité avant tout

Vous placez un agent dans une position où il peut :

- exécuter des commandes sur votre machine (selon votre politique d’outils)
- lire/écrire des fichiers dans votre espace de travail
- renvoyer des messages via WhatsApp/Telegram/Discord/Mattermost et d’autres canaux intégrés

Commencez prudemment :

- Définissez toujours `channels.whatsapp.allowFrom` (ne faites jamais tourner un service ouvert à tous sur votre Mac personnel).
- Utilisez un numéro WhatsApp dédié pour l’assistant.
- Les heartbeats sont désormais définis par défaut toutes les 30 minutes. Désactivez-les jusqu’à ce que vous fassiez confiance à la configuration en définissant `agents.defaults.heartbeat.every: "0m"`.

## Prérequis

- OpenClaw installé et configuré — consultez [Getting Started](/fr/start/getting-started) si vous ne l’avez pas encore fait
- Un second numéro de téléphone (SIM/eSIM/prépayé) pour l’assistant

## La configuration à deux téléphones (recommandée)

Vous voulez ceci :

```mermaid
flowchart TB
    A["<b>Votre téléphone (personnel)<br></b><br>Votre WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second téléphone (assistant)<br></b><br>WhatsApp de l’assistant<br>+1-555-ASSIST"]
    B -- lié via QR --> C["<b>Votre Mac (openclaw)<br></b><br>Agent IA"]
```

Si vous liez votre WhatsApp personnel à OpenClaw, chaque message qui vous est envoyé devient une « entrée agent ». C’est rarement ce que vous voulez.

## Démarrage rapide en 5 minutes

1. Associez WhatsApp Web (affiche un QR ; scannez-le avec le téléphone de l’assistant) :

```bash
openclaw channels login
```

2. Démarrez la Gateway (laissez-la en cours d’exécution) :

```bash
openclaw gateway --port 18789
```

3. Placez une configuration minimale dans `~/.openclaw/openclaw.json` :

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Envoyez maintenant un message au numéro de l’assistant depuis votre téléphone autorisé.

Une fois l’onboarding terminé, nous ouvrons automatiquement le tableau de bord et affichons un lien propre (sans jeton). Si une authentification est demandée, collez le secret partagé configuré dans les paramètres de l’interface de contrôle. L’onboarding utilise un jeton par défaut (`gateway.auth.token`), mais l’authentification par mot de passe fonctionne aussi si vous avez changé `gateway.auth.mode` en `password`. Pour le rouvrir plus tard : `openclaw dashboard`.

## Donner à l’agent un espace de travail (AGENTS)

OpenClaw lit les instructions de fonctionnement et la « mémoire » depuis son répertoire d’espace de travail.

Par défaut, OpenClaw utilise `~/.openclaw/workspace` comme espace de travail de l’agent, et le créera automatiquement (ainsi que les fichiers initiaux `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) lors de la configuration/première exécution de l’agent. `BOOTSTRAP.md` n’est créé que lorsque l’espace de travail est entièrement nouveau (il ne doit pas réapparaître après sa suppression). `MEMORY.md` est facultatif (il n’est pas créé automatiquement) ; lorsqu’il est présent, il est chargé pour les sessions normales. Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md`.

Astuce : traitez ce dossier comme la « mémoire » d’OpenClaw et faites-en un dépôt git (idéalement privé) afin que vos fichiers `AGENTS.md` + mémoire soient sauvegardés. Si git est installé, les espaces de travail entièrement nouveaux sont initialisés automatiquement.

```bash
openclaw setup
```

Disposition complète de l’espace de travail + guide de sauvegarde : [Agent workspace](/fr/concepts/agent-workspace)
Flux de travail mémoire : [Memory](/fr/concepts/memory)

Facultatif : choisissez un autre espace de travail avec `agents.defaults.workspace` (prend en charge `~`).

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

Si vous fournissez déjà vos propres fichiers d’espace de travail depuis un dépôt, vous pouvez désactiver complètement la création des fichiers bootstrap :

```json5
{
  agent: {
    skipBootstrap: true,
  },
}
```

## La configuration qui le transforme en « assistant »

OpenClaw utilise par défaut une bonne configuration d’assistant, mais vous voudrez généralement ajuster :

- la persona/les instructions dans [`SOUL.md`](/fr/concepts/soul)
- les paramètres par défaut de réflexion (si souhaité)
- les heartbeats (une fois que vous lui faites confiance)

Exemple :

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Commencez avec 0 ; activez plus tard.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessions et mémoire

- Fichiers de session : `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Métadonnées de session (utilisation de jetons, dernière route, etc.) : `~/.openclaw/agents/<agentId>/sessions/sessions.json` (ancien : `~/.openclaw/sessions/sessions.json`)
- `/new` ou `/reset` démarre une nouvelle session pour cette discussion (configurable via `resetTriggers`). S’il est envoyé seul, l’agent répond par un court message de bienvenue pour confirmer la réinitialisation.
- `/compact [instructions]` compacte le contexte de la session et indique le budget de contexte restant.

## Heartbeats (mode proactif)

Par défaut, OpenClaw exécute un heartbeat toutes les 30 minutes avec l’invite :
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Définissez `agents.defaults.heartbeat.every: "0m"` pour le désactiver.

- Si `HEARTBEAT.md` existe mais est en pratique vide (uniquement des lignes vides et des en-têtes markdown comme `# Heading`), OpenClaw ignore l’exécution du heartbeat pour économiser des appels API.
- Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.
- Si l’agent répond par `HEARTBEAT_OK` (éventuellement avec un court remplissage ; voir `agents.defaults.heartbeat.ackMaxChars`), OpenClaw supprime la livraison sortante pour ce heartbeat.
- Par défaut, la livraison des heartbeats aux cibles de type message direct `user:<id>` est autorisée. Définissez `agents.defaults.heartbeat.directPolicy: "block"` pour supprimer la livraison vers les cibles directes tout en gardant les exécutions de heartbeat actives.
- Les heartbeats exécutent des tours complets d’agent — des intervalles plus courts consomment davantage de jetons.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Médias entrants et sortants

Les pièces jointes entrantes (images/audio/documents) peuvent être exposées à votre commande via des modèles :

- `{{MediaPath}}` (chemin local du fichier temporaire)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (si la transcription audio est activée)

Pièces jointes sortantes de l’agent : incluez `MEDIA:<path-or-url>` sur sa propre ligne (sans espaces). Exemple :

```
Voici la capture d’écran.
MEDIA:https://example.com/screenshot.png
```

OpenClaw les extrait et les envoie comme média avec le texte.

Le comportement des chemins locaux suit le même modèle de confiance de lecture de fichiers que l’agent :

- Si `tools.fs.workspaceOnly` vaut `true`, les chemins locaux sortants `MEDIA:` restent limités à la racine temporaire d’OpenClaw, au cache média, aux chemins de l’espace de travail de l’agent et aux fichiers générés par le sandbox.
- Si `tools.fs.workspaceOnly` vaut `false`, `MEDIA:` en sortie peut utiliser des fichiers locaux de l’hôte que l’agent est déjà autorisé à lire.
- Les envois locaux depuis l’hôte n’autorisent toujours que les médias et les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Les fichiers texte brut et de type secret ne sont pas traités comme des médias envoyables.

Cela signifie que les images/fichiers générés en dehors de l’espace de travail peuvent désormais être envoyés lorsque votre politique fs autorise déjà ces lectures, sans rouvrir l’exfiltration arbitraire de pièces jointes texte depuis l’hôte.

## Liste de contrôle des opérations

```bash
openclaw status          # statut local (identifiants, sessions, événements en file d’attente)
openclaw status --all    # diagnostic complet (lecture seule, prêt à coller)
openclaw status --deep   # demande à la gateway une sonde d’état en direct avec des sondes de canal lorsque prises en charge
openclaw health --json   # instantané d’état de la gateway (WS ; la valeur par défaut peut renvoyer un instantané récent mis en cache)
```

Les journaux se trouvent dans `/tmp/openclaw/` (par défaut : `openclaw-YYYY-MM-DD.log`).

## Étapes suivantes

- WebChat : [WebChat](/web/webchat)
- Opérations de Gateway : [Gateway runbook](/fr/gateway)
- Cron + réveils : [Cron jobs](/fr/automation/cron-jobs)
- Compagnon de barre de menus macOS : [OpenClaw macOS app](/fr/platforms/macos)
- Application de nœud iOS : [iOS app](/fr/platforms/ios)
- Application de nœud Android : [Android app](/fr/platforms/android)
- État de Windows : [Windows (WSL2)](/fr/platforms/windows)
- État de Linux : [Linux app](/fr/platforms/linux)
- Sécurité : [Security](/fr/gateway/security)
