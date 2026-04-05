---
read_when:
    - Vous voulez déclencher des exécutions d'agent depuis des scripts ou la ligne de commande
    - Vous devez distribuer par programmation les réponses d'agent vers un canal de discussion
summary: Exécutez des tours d'agent depuis la CLI et distribuez éventuellement les réponses vers des canaux
title: Envoi d'agent
x-i18n:
    generated_at: "2026-04-05T12:55:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Envoi d'agent

`openclaw agent` exécute un seul tour d'agent depuis la ligne de commande sans nécessiter
de message de discussion entrant. Utilisez-le pour les workflows scriptés, les tests et
la distribution programmatique.

## Démarrage rapide

<Steps>
  <Step title="Exécuter un tour d'agent simple">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Cela envoie le message via la Gateway et affiche la réponse.

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

  <Step title="Distribuer la réponse vers un canal">
    ```bash
    # Distribuer vers WhatsApp (canal par défaut)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Distribuer vers Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Drapeaux

| Flag                          | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `--message \<text\>`          | Message à envoyer (obligatoire)                                  |
| `--to \<dest\>`               | Dériver la clé de session à partir d'une cible (téléphone, id de chat) |
| `--agent \<id\>`              | Cibler un agent configuré (utilise sa session `main`)            |
| `--session-id \<id\>`         | Réutiliser une session existante par id                          |
| `--local`                     | Forcer le runtime embarqué local (ignorer la Gateway)            |
| `--deliver`                   | Envoyer la réponse vers un canal de discussion                   |
| `--channel \<name\>`          | Canal de distribution (whatsapp, telegram, discord, slack, etc.) |
| `--reply-to \<target\>`       | Remplacement de la cible de distribution                         |
| `--reply-channel \<name\>`    | Remplacement du canal de distribution                            |
| `--reply-account \<id\>`      | Remplacement de l'id du compte de distribution                   |
| `--thinking \<level\>`        | Définir le niveau de réflexion (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Définir le niveau de verbosité                                   |
| `--timeout \<seconds\>`       | Remplacer le délai d'expiration de l'agent                       |
| `--json`                      | Produire du JSON structuré                                       |

## Comportement

- Par défaut, la CLI passe **par la Gateway**. Ajoutez `--local` pour forcer le
  runtime embarqué sur la machine actuelle.
- Si la Gateway est inaccessible, la CLI **bascule** sur l'exécution embarquée locale.
- Sélection de session : `--to` dérive la clé de session (les cibles de groupe/canal
  préservent l'isolation ; les discussions directes sont ramenées à `main`).
- Les drapeaux de réflexion et de verbosité persistent dans le stockage de session.
- Sortie : texte brut par défaut, ou `--json` pour une charge utile structurée + métadonnées.

## Exemples

```bash
# Tour simple avec sortie JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Tour avec niveau de réflexion
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Distribuer vers un canal différent de celui de la session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liens associés

- [Référence CLI de l'agent](/cli/agent)
- [Sub-agents](/tools/subagents) — lancement de sub-agents en arrière-plan
- [Sessions](/fr/concepts/session) — fonctionnement des clés de session
