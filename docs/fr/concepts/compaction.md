---
read_when:
    - Vous souhaitez comprendre l’auto-compaction et /compact
    - Vous déboguez de longues sessions atteignant les limites de contexte
summary: Comment OpenClaw résume les longues conversations pour rester dans les limites du modèle
title: Compaction
x-i18n:
    generated_at: "2026-04-05T12:39:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Chaque modèle possède une fenêtre de contexte -- le nombre maximal de jetons qu’il peut traiter.
Lorsqu’une conversation s’approche de cette limite, OpenClaw **compacte** les anciens messages
en un résumé afin que la discussion puisse continuer.

## Fonctionnement

1. Les anciens tours de conversation sont résumés dans une entrée compacte.
2. Le résumé est enregistré dans la transcription de session.
3. Les messages récents sont conservés intacts.

Lorsque OpenClaw divise l’historique en segments de compaction, il garde les appels d’outils de l’assistant
associés à leurs entrées `toolResult` correspondantes. Si un point de coupure tombe
au milieu d’un bloc d’outil, OpenClaw déplace la limite afin que la paire reste ensemble et
que la queue actuelle non résumée soit préservée.

L’historique complet de la conversation reste sur le disque. La compaction ne modifie que ce que le
modèle voit au tour suivant.

## Auto-compaction

L’auto-compaction est activée par défaut. Elle s’exécute lorsque la session approche de la
limite de contexte, ou lorsque le modèle renvoie une erreur de dépassement de contexte (dans ce cas,
OpenClaw compacte puis réessaie). Les signatures de dépassement typiques incluent
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, et `ollama error: context length
exceeded`.

<Info>
Avant de compacter, OpenClaw rappelle automatiquement à l’agent d’enregistrer les notes importantes
dans les fichiers de [memory](/concepts/memory). Cela évite la perte de contexte.
</Info>

## Compaction manuelle

Tapez `/compact` dans n’importe quelle discussion pour forcer une compaction. Ajoutez des instructions pour guider
le résumé :

```
/compact Focus on the API design decisions
```

## Utiliser un autre modèle

Par défaut, la compaction utilise le modèle principal de votre agent. Vous pouvez utiliser un modèle plus
capable pour obtenir de meilleurs résumés :

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

## Avis de début de compaction

Par défaut, la compaction s’exécute silencieusement. Pour afficher un bref avis lorsque la compaction
commence, activez `notifyUser` :

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

Lorsqu’il est activé, l’utilisateur voit un court message (par exemple, "Compacting
context...") au début de chaque exécution de compaction.

## Compaction vs élagage

|                  | Compaction                    | Élagage                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ce qu’elle fait** | Résume les anciennes conversations | Réduit les anciens résultats d’outils |
| **Enregistré ?** | Oui (dans la transcription de session)   | Non (en mémoire uniquement, par requête) |
| **Portée**        | Conversation entière           | Résultats d’outils uniquement                |

L’[élagage de session](/concepts/session-pruning) est un complément plus léger qui
réduit la sortie des outils sans résumé.

## Dépannage

**Compaction trop fréquente ?** La fenêtre de contexte du modèle est peut-être petite, ou les sorties
des outils sont peut-être volumineuses. Essayez d’activer
l’[élagage de session](/concepts/session-pruning).

**Le contexte semble obsolète après compaction ?** Utilisez `/compact Focus on <topic>` pour
guider le résumé, ou activez le [vidage de memory](/concepts/memory) afin que les notes
soient conservées.

**Besoin d’une page blanche ?** `/new` démarre une nouvelle session sans compaction.

Pour la configuration avancée (jetons réservés, préservation des identifiants, moteurs de
contexte personnalisés, compaction côté serveur OpenAI), consultez la
[Session Management Deep Dive](/reference/session-management-compaction).

## Lié

- [Session](/concepts/session) — gestion et cycle de vie des sessions
- [Session Pruning](/concepts/session-pruning) — réduction des résultats d’outils
- [Context](/concepts/context) — comment le contexte est construit pour les tours d’agent
- [Hooks](/automation/hooks) — hooks de cycle de vie de la compaction (before_compaction, after_compaction)
