---
read_when:
    - Modification du comportement ou des valeurs par défaut des indicateurs de saisie
summary: Quand OpenClaw affiche des indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-04-24T07:08:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

Les indicateurs de saisie sont envoyés au canal de chat pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est rafraîchie.

## Valeurs par défaut

Lorsque `agents.defaults.typingMode` n’est **pas défini**, OpenClaw conserve le comportement hérité :

- **Discussions directes** : la saisie commence immédiatement dès que la boucle du modèle démarre.
- **Discussions de groupe avec une mention** : la saisie commence immédiatement.
- **Discussions de groupe sans mention** : la saisie commence seulement lorsque le texte du message commence à être diffusé.
- **Exécutions Heartbeat** : la saisie commence lorsque l’exécution Heartbeat démarre si la
  cible Heartbeat résolue est un chat compatible avec la saisie et si la saisie n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` — aucun indicateur de saisie, jamais.
- `instant` — démarrer la saisie **dès que la boucle du modèle commence**, même si l’exécution
  renvoie ensuite uniquement le jeton de réponse silencieuse.
- `thinking` — démarrer la saisie au **premier delta de raisonnement** (nécessite
  `reasoningLevel: "stream"` pour l’exécution).
- `message` — démarrer la saisie au **premier delta de texte non silencieux** (ignore
  le jeton silencieux `NO_REPLY`).

Ordre du « déclenchement le plus précoce » :
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

- Le mode `message` n’affiche pas la saisie pour les réponses uniquement silencieuses lorsque toute la
  charge utile est exactement le jeton silencieux (par exemple `NO_REPLY` / `no_reply`,
  comparaison insensible à la casse).
- `thinking` ne se déclenche que si l’exécution diffuse le raisonnement (`reasoningLevel: "stream"`).
  Si le modèle n’émet pas de deltas de raisonnement, la saisie ne démarre pas.
- La saisie Heartbeat est un signal de vivacité pour la cible de livraison résolue. Elle
  démarre au début de l’exécution Heartbeat au lieu de suivre la temporalité de diffusion
  `message` ou `thinking`. Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas la saisie lorsque `target: "none"`, lorsque la cible ne peut pas
  être résolue, lorsque la livraison au chat est désactivée pour le Heartbeat, ou lorsque le
  canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence de rafraîchissement**, et non le moment de démarrage.
  La valeur par défaut est de 6 secondes.

## Lié

- [Présence](/fr/concepts/presence)
- [Streaming et segmentation](/fr/concepts/streaming)
