---
read_when:
    - Mettre à jour le comportement ou les valeurs par défaut des nouvelles tentatives des fournisseurs
    - Déboguer les erreurs d’envoi des fournisseurs ou les limites de débit
summary: Politique de nouvelle tentative pour les appels sortants vers les fournisseurs
title: Politique de nouvelle tentative
x-i18n:
    generated_at: "2026-04-24T07:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 38811a6dabb0b60b71167ee4fcc09fb042f941b4bbb1cf8b0f5a91c3c93b2e75
    source_path: concepts/retry.md
    workflow: 15
---

## Objectifs

- Réessayer par requête HTTP, pas par flux multi-étapes.
- Préserver l’ordre en ne réessayant que l’étape en cours.
- Éviter de dupliquer les opérations non idempotentes.

## Valeurs par défaut

- Tentatives : 3
- Plafond maximal du délai : 30000 ms
- Jitter : 0.1 (10 pour cent)
- Valeurs par défaut par fournisseur :
  - Délai minimal Telegram : 400 ms
  - Délai minimal Discord : 500 ms

## Comportement

### Fournisseurs de modèles

- OpenClaw laisse les SDK des fournisseurs gérer les nouvelles tentatives courtes normales.
- Pour les SDK basés sur Stainless comme Anthropic et OpenAI, les réponses réessayables
  (`408`, `409`, `429` et `5xx`) peuvent inclure `retry-after-ms` ou
  `retry-after`. Lorsque cette attente dépasse 60 secondes, OpenClaw injecte
  `x-should-retry: false` afin que le SDK expose immédiatement l’erreur et que le basculement de modèle puisse passer à un autre profil d’authentification ou à un modèle de secours.
- Remplacez ce plafond avec `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Définissez-le sur `0`, `false`, `off`, `none` ou `disabled` pour laisser les SDK honorer en interne les longues attentes `Retry-After`.

### Discord

- Réessaie uniquement en cas d’erreurs de limitation de débit (HTTP 429).
- Utilise `retry_after` de Discord lorsqu’il est disponible, sinon un backoff exponentiel.

### Telegram

- Réessaie en cas d’erreurs transitoires (429, timeout, connexion/réinitialisation/fermeture, temporairement indisponible).
- Utilise `retry_after` lorsqu’il est disponible, sinon un backoff exponentiel.
- Les erreurs d’analyse Markdown ne sont pas réessayées ; elles reviennent au texte brut.

## Configuration

Définissez la politique de nouvelle tentative par fournisseur dans `~/.openclaw/openclaw.json` :

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Remarques

- Les nouvelles tentatives s’appliquent par requête (envoi de message, téléversement de média, réaction, sondage, sticker).
- Les flux composites ne réessaient pas les étapes déjà terminées.

## Associé

- [Basculement de modèle](/fr/concepts/model-failover)
- [File de commandes](/fr/concepts/queue)
