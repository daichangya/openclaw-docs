---
read_when:
    - Vous voulez comprendre la Compaction automatique et `/compact`
    - Vous déboguez de longues sessions qui atteignent les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-04-21T06:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Chaque modèle a une fenêtre de contexte — le nombre maximal de jetons qu’il peut traiter.
Lorsqu’une conversation approche de cette limite, OpenClaw effectue une **Compaction** des anciens messages
en un résumé afin que le chat puisse continuer.

## Comment cela fonctionne

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de la session.
3. Les messages récents sont conservés intacts.

Lorsque OpenClaw découpe l’historique en blocs de Compaction, il conserve les appels d’outil
de l’assistant associés à leurs entrées `toolResult` correspondantes. Si un point de découpage tombe
au milieu d’un bloc d’outil, OpenClaw déplace la frontière pour garder la paire ensemble et
préserver la partie finale actuelle non résumée.

L’historique complet de la conversation reste sur le disque. La Compaction ne modifie que ce que le
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
Avant d’effectuer une Compaction, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes
dans des fichiers de [memory](/fr/concepts/memory). Cela évite la perte de contexte.
</Info>

Utilisez le paramètre `agents.defaults.compaction` dans votre `openclaw.json` pour configurer le comportement de la Compaction (mode, jetons cibles, etc.).
Le résumé de Compaction préserve par défaut les identifiants opaques (`identifierPolicy: "strict"`). Vous pouvez remplacer ce comportement avec `identifierPolicy: "off"` ou fournir un texte personnalisé avec `identifierPolicy: "custom"` et `identifierInstructions`.

Vous pouvez éventuellement spécifier un autre modèle pour le résumé de Compaction via `agents.defaults.compaction.model`. Cela est utile lorsque votre modèle principal est un modèle local ou de petite taille et que vous souhaitez des résumés de Compaction produits par un modèle plus performant. Cette substitution accepte toute chaîne `provider/model-id` :

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

Cela fonctionne aussi avec des modèles locaux, par exemple un second modèle Ollama dédié à la synthèse ou un spécialiste de la Compaction affiné :

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

## Fournisseurs de Compaction enfichables

Les plugins peuvent enregistrer un fournisseur de Compaction personnalisé via `registerCompactionProvider()` sur l’API du plugin. Lorsqu’un fournisseur est enregistré et configuré, OpenClaw lui délègue la synthèse au lieu d’utiliser le pipeline LLM intégré.

Pour utiliser un fournisseur enregistré, définissez l’identifiant du fournisseur dans votre configuration :

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

Définir un `provider` force automatiquement `mode: "safeguard"`. Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation des identifiants que le chemin intégré, et OpenClaw préserve toujours le contexte suffixe des tours récents et des tours découpés après la sortie du fournisseur. Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient au résumé LLM intégré.

## Compaction automatique (activée par défaut)

Lorsqu’une session approche ou dépasse la fenêtre de contexte du modèle, OpenClaw déclenche la Compaction automatique et peut réessayer la requête d’origine en utilisant le contexte compacté.

Vous verrez :

- `🧹 Auto-compaction complete` en mode verbeux
- `/status` affichant `🧹 Compactions: <count>`

Avant la Compaction, OpenClaw peut exécuter un tour de **vidage silencieux de la mémoire** pour stocker
des notes durables sur le disque. Voir [Memory](/fr/concepts/memory) pour les détails et la configuration.

## Compaction manuelle

Tapez `/compact` dans n’importe quel chat pour forcer une Compaction. Ajoutez des instructions pour guider
le résumé :

```
/compact Focus on the API design decisions
```

## Utiliser un autre modèle

Par défaut, la Compaction utilise le modèle principal de votre agent. Vous pouvez utiliser un modèle plus
performant pour obtenir de meilleurs résumés :

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

## Avis de Compaction

Par défaut, la Compaction s’exécute silencieusement. Pour afficher de brefs avis lorsque la Compaction
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

|                  | Compaction                         | Élagage                                 |
| ---------------- | ---------------------------------- | --------------------------------------- |
| **Ce qu’elle fait** | Résume les anciennes conversations | Supprime les anciens résultats d’outil  |
| **Enregistré ?** | Oui (dans la transcription de session) | Non (en mémoire uniquement, par requête) |
| **Portée**       | Conversation entière               | Résultats d’outil uniquement            |

L’[élagage de session](/fr/concepts/session-pruning) est un complément plus léger qui
supprime la sortie des outils sans la résumer.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties
des outils sont peut-être volumineuses. Essayez d’activer
l’[élagage de session](/fr/concepts/session-pruning).

**Le contexte semble obsolète après la Compaction ?** Utilisez `/compact Focus on <topic>` pour
guider le résumé, ou activez le [vidage de la mémoire](/fr/concepts/memory) afin que les notes
soient conservées.

**Besoin de repartir de zéro ?** `/new` démarre une nouvelle session sans effectuer de Compaction.

Pour la configuration avancée (jetons réservés, préservation des identifiants, moteurs de
contexte personnalisés, Compaction côté serveur OpenAI), consultez la
[présentation approfondie de la gestion de session](/fr/reference/session-management-compaction).

## Liens connexes

- [Session](/fr/concepts/session) — gestion et cycle de vie des sessions
- [Session Pruning](/fr/concepts/session-pruning) — suppression des résultats d’outil
- [Context](/fr/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Hooks](/fr/automation/hooks) — hooks du cycle de vie de la Compaction (before_compaction, after_compaction)
