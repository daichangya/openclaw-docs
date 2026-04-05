---
read_when:
    - Modification du comportement ou des valeurs par défaut des indicateurs de saisie
summary: Quand OpenClaw affiche des indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-04-05T12:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28c8c395a135fc0745181aab66a93582177e6acd0b3496debcbb98159a4f11dc
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicateurs de saisie

Les indicateurs de saisie sont envoyés au canal de discussion pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est actualisée.

## Valeurs par défaut

Lorsque `agents.defaults.typingMode` n’est **pas défini**, OpenClaw conserve le comportement hérité :

- **Discussions directes** : la saisie commence immédiatement dès que la boucle du modèle démarre.
- **Discussions de groupe avec mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie ne commence que lorsque le texte du message commence à être diffusé.
- **Exécutions heartbeat** : la saisie est désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` — aucun indicateur de saisie, jamais.
- `instant` — démarrer la saisie **dès que la boucle du modèle commence**, même si l’exécution
  renvoie ensuite seulement le jeton de réponse silencieuse.
- `thinking` — démarrer la saisie au **premier delta de raisonnement** (nécessite
  `reasoningLevel: "stream"` pour l’exécution).
- `message` — démarrer la saisie au **premier delta de texte non silencieux** (ignore
  le jeton silencieux `NO_REPLY`).

Ordre de « déclenchement du plus tôt au plus tard » :
`never` → `message` → `thinking` → `instant`

## Configuration

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Vous pouvez remplacer le mode ou la cadence par session :

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Remarques

- Le mode `message` n’affichera pas l’indicateur de saisie pour les réponses uniquement silencieuses lorsque toute la
  charge utile correspond exactement au jeton silencieux (par exemple `NO_REPLY` / `no_reply`,
  avec correspondance insensible à la casse).
- `thinking` ne se déclenche que si l’exécution diffuse le raisonnement (`reasoningLevel: "stream"`).
  Si le modèle n’émet pas de deltas de raisonnement, la saisie ne commencera pas.
- Heartbeat n’affiche jamais de saisie, quel que soit le mode.
- `typingIntervalSeconds` contrôle la **cadence d’actualisation**, pas le moment de démarrage.
  La valeur par défaut est de 6 secondes.
