---
read_when:
    - Vous souhaitez déclencher des exécutions d’agent depuis des scripts ou la ligne de commande
    - Vous devez livrer par programme les réponses d’agent à un canal de discussion
summary: Exécuter des tours d’agent depuis la CLI et éventuellement livrer les réponses vers des canaux
title: Envoi d’agent
x-i18n:
    generated_at: "2026-04-24T07:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` exécute un seul tour d’agent depuis la ligne de commande sans avoir besoin
d’un message entrant depuis un chat. Utilisez-le pour des workflows scriptés, des tests et
des livraisons programmatiques.

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d’agent simple">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Cela envoie le message via le Gateway et affiche la réponse.

  </Step>

  <Step title="Cibler un agent ou une session spécifique">
    ```bash
    # Cibler un agent spécifique
    openclaw agent --agent ops --message "Summarize logs"

    # Cibler un numéro de téléphone (dérive la clé de session)
    openclaw agent --to +15555550123 --message "Status update"

    # Réutiliser une session existante
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Livrer la réponse à un canal">
    ```bash
    # Livrer à WhatsApp (canal par défaut)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Livrer à Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Options

| Option                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Message à envoyer (requis)                                  |
| `--to \<dest\>`               | Dériver la clé de session à partir d’une cible (téléphone, identifiant de chat) |
| `--agent \<id\>`              | Cibler un agent configuré (utilise sa session `main`)       |
| `--session-id \<id\>`         | Réutiliser une session existante par son identifiant        |
| `--local`                     | Forcer le runtime embarqué local (ignorer le Gateway)       |
| `--deliver`                   | Envoyer la réponse à un canal de discussion                 |
| `--channel \<name\>`          | Canal de livraison (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Surcharge de la cible de livraison                          |
| `--reply-channel \<name\>`    | Surcharge du canal de livraison                             |
| `--reply-account \<id\>`      | Surcharge de l’identifiant de compte de livraison           |
| `--thinking \<level\>`        | Définir le niveau de thinking pour le profil de modèle sélectionné |
| `--verbose \<on\|full\|off\>` | Définir le niveau verbose                                   |
| `--timeout \<seconds\>`       | Surcharger le délai d’expiration de l’agent                 |
| `--json`                      | Sortie JSON structurée                                      |

## Comportement

- Par défaut, la CLI passe **par le Gateway**. Ajoutez `--local` pour forcer le
  runtime embarqué sur la machine courante.
- Si le Gateway est inaccessible, la CLI **revient** à l’exécution embarquée locale.
- Sélection de session : `--to` dérive la clé de session (les cibles de groupe/canal
  préservent l’isolation ; les discussions directes se replient sur `main`).
- Les options thinking et verbose sont persistées dans le magasin de sessions.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée + métadonnées.

## Exemples

```bash
# Tour simple avec sortie JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Tour avec niveau de thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Livrer à un canal différent de celui de la session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Articles connexes

- [Référence CLI agent](/fr/cli/agent)
- [Sous-agents](/fr/tools/subagents) — lancement de sous-agents en arrière-plan
- [Sessions](/fr/concepts/session) — fonctionnement des clés de session
