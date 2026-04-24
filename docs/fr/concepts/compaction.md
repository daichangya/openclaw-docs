---
read_when:
    - Vous souhaitez comprendre la Compaction automatique et `/compact`
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-04-24T07:06:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

Chaque modèle a une fenêtre de contexte — le nombre maximal de tokens qu’il peut traiter.
Lorsqu’une conversation approche de cette limite, OpenClaw effectue une **Compaction** des anciens messages
en un résumé afin que la discussion puisse continuer.

## Comment cela fonctionne

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de session.
3. Les messages récents sont conservés intacts.

Lorsque OpenClaw découpe l’historique en blocs de Compaction, il conserve les appels
d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes. Si un point de découpe tombe
au milieu d’un bloc d’outil, OpenClaw déplace la limite pour que la paire reste ensemble et
que la fin actuelle non résumée soit préservée.

L’historique complet de la conversation reste sur le disque. La Compaction ne change que ce que le
modèle voit au tour suivant.

## Compaction automatique

La Compaction automatique est activée par défaut. Elle s’exécute lorsque la session approche de la limite
de contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte (dans ce cas,
OpenClaw effectue une Compaction puis réessaie). Les signatures de dépassement typiques incluent
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` et `ollama error: context length
exceeded`.

<Info>
Avant la Compaction, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes
dans les fichiers de [memory](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

Utilisez le paramètre `agents.defaults.compaction` dans votre `openclaw.json` pour configurer le comportement de la Compaction (mode, tokens cibles, etc.).
Le résumé de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Vous pouvez remplacer ce comportement avec `identifierPolicy: "off"` ou fournir un texte personnalisé avec `identifierPolicy: "custom"` et `identifierInstructions`.

Vous pouvez aussi éventuellement spécifier un modèle différent pour le résumé de Compaction via `agents.defaults.compaction.model`. Cela est utile lorsque votre modèle principal est un modèle local ou de petite taille et que vous voulez que les résumés de Compaction soient produits par un modèle plus performant. Le remplacement accepte toute chaîne `provider/model-id` :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Cela fonctionne aussi avec des modèles locaux, par exemple un second modèle Ollama dédié au résumé ou un spécialiste de la Compaction fine-tuné :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Lorsqu’il n’est pas défini, la Compaction utilise le modèle principal de l’agent.

## Fournisseurs de Compaction extensibles

Les plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` sur l’API Plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue le résumé au lieu d’utiliser le pipeline LLM intégré.

Pour utiliser un fournisseur enregistré, définissez l’ID du fournisseur dans votre configuration :

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw conserve toujours le contexte des tours récents et de la fin de tour après la sortie du fournisseur. Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient au résumé LLM intégré.

## Compaction automatique (activée par défaut)

Lorsqu’une session approche ou dépasse la fenêtre de contexte du modèle, OpenClaw déclenche la Compaction automatique et peut réessayer la requête d’origine avec le contexte compacté.

Vous verrez :

- `🧹 Auto-compaction complete` en mode verbeux
- `/status` affichant `🧹 Compactions: <count>`

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de memory** pour stocker
des notes durables sur le disque. Voir [Memory](/fr/concepts/memory) pour les détails et la configuration.

## Compaction manuelle

Tapez `/compact` dans n’importe quelle discussion pour forcer une Compaction. Ajoutez des instructions pour guider
le résumé :

```
/compact Focus on the API design decisions
```

## Utiliser un modèle différent

Par défaut, la Compaction utilise le modèle principal de votre agent. Vous pouvez utiliser un modèle
plus performant pour obtenir de meilleurs résumés :

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Notifications de Compaction

Par défaut, la Compaction s’exécute silencieusement. Pour afficher de brèves notifications lorsque la Compaction
commence et lorsqu’elle se termine, activez `notifyUser` :

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Lorsqu’elle est activée, l’utilisateur voit de courts messages d’état autour de chaque exécution de Compaction
(par exemple, « Compactage du contexte... » et « Compaction terminée »).

## Compaction vs élagage

|                  | Compaction                    | Élagage                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ce que cela fait** | Résume les anciennes conversations | Tronque les anciens résultats d’outils |
| **Enregistré ?**       | Oui (dans la transcription de session)   | Non (en mémoire uniquement, par requête) |
| **Périmètre**        | Conversation entière           | Résultats d’outils uniquement                |

[L’élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui
tronque la sortie des outils sans la résumer.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties
des outils peuvent être volumineuses. Essayez d’activer
[l’élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après la Compaction ?** Utilisez `/compact Focus on <topic>` pour
guider le résumé, ou activez le [vidage de memory](/fr/concepts/memory) afin que les notes
soient conservées.

**Besoin d’un nouveau départ ?** `/new` démarre une nouvelle session sans Compaction.

Pour la configuration avancée (réserve de tokens, préservation des identifiants, moteurs de
contexte personnalisés, Compaction côté serveur OpenAI), consultez la
[Présentation approfondie de la gestion de session](/fr/reference/session-management-compaction).

## Associé

- [Session](/fr/concepts/session) — gestion et cycle de vie des sessions
- [Élagage de session](/fr/concepts/session-pruning) — troncature des résultats d’outils
- [Contexte](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Hooks](/fr/automation/hooks) — hooks du cycle de vie de la Compaction (before_compaction, after_compaction)
