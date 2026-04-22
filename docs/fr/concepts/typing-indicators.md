---
read_when:
    - Modification du comportement ou des paramètres par défaut des indicateurs de saisie
summary: Quand OpenClaw affiche des indicateurs de saisie et comment les ajuster
title: Indicateurs de saisie
x-i18n:
    generated_at: "2026-04-22T06:57:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# Indicateurs de saisie

Des indicateurs de saisie sont envoyés au canal de discussion pendant qu’une exécution est active. Utilisez
`agents.defaults.typingMode` pour contrôler **quand** la saisie commence et `typingIntervalSeconds`
pour contrôler **à quelle fréquence** elle est rafraîchie.

## Paramètres par défaut

Lorsque `agents.defaults.typingMode` est **non défini**, OpenClaw conserve le comportement historique :

- **Conversations directes** : la saisie commence immédiatement dès que la boucle du modèle démarre.
- **Conversations de groupe avec une mention** : la saisie commence immédiatement.
- **Conversations de groupe sans mention** : la saisie commence seulement lorsque le texte du message commence à être diffusé.
- **Exécutions Heartbeat** : la saisie commence au démarrage de l’exécution Heartbeat si la cible Heartbeat résolue est une discussion prenant en charge la saisie et si la saisie n’est pas désactivée.

## Modes

Définissez `agents.defaults.typingMode` sur l’une des valeurs suivantes :

- `never` — aucun indicateur de saisie, jamais.
- `instant` — commence à afficher la saisie **dès le début de la boucle du modèle**, même si l’exécution
  ne renvoie ensuite que le jeton de réponse silencieuse.
- `thinking` — commence à afficher la saisie lors du **premier delta de raisonnement** (nécessite
  `reasoningLevel: "stream"` pour l’exécution).
- `message` — commence à afficher la saisie lors du **premier delta de texte non silencieux** (ignore
  le jeton silencieux `NO_REPLY`).

Ordre du « déclenchement le plus précoce au plus tardif » :
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

- Le mode `message` n’affichera pas l’indicateur de saisie pour les réponses uniquement silencieuses lorsque l’ensemble
  de la charge utile correspond exactement au jeton silencieux (par exemple `NO_REPLY` / `no_reply`,
  avec une correspondance insensible à la casse).
- `thinking` ne se déclenche que si l’exécution diffuse le raisonnement (`reasoningLevel: "stream"`).
  Si le modèle n’émet pas de deltas de raisonnement, la saisie ne commencera pas.
- La saisie Heartbeat est un signal de disponibilité pour la cible de livraison résolue. Elle
  commence au démarrage de l’exécution Heartbeat au lieu de suivre le timing de diffusion de `message` ou `thinking`. Définissez `typingMode: "never"` pour la désactiver.
- Les Heartbeats n’affichent pas l’indicateur de saisie lorsque `target: "none"`, lorsque la cible ne peut
  pas être résolue, lorsque la livraison de discussion est désactivée pour le Heartbeat, ou lorsque le
  canal ne prend pas en charge la saisie.
- `typingIntervalSeconds` contrôle la **cadence de rafraîchissement**, et non l’instant de démarrage.
  La valeur par défaut est de 6 secondes.
