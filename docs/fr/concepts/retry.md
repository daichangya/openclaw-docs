---
read_when:
    - Mise à jour du comportement ou des valeurs par défaut de nouvelle tentative des fournisseurs
    - Débogage des erreurs d’envoi ou des limites de débit des fournisseurs
summary: Politique de nouvelle tentative pour les appels sortants aux fournisseurs
title: Politique de nouvelle tentative
x-i18n:
    generated_at: "2026-04-05T12:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Politique de nouvelle tentative

## Objectifs

- Réessayer par requête HTTP, et non par flux en plusieurs étapes.
- Préserver l’ordre en ne réessayant que l’étape en cours.
- Éviter de dupliquer les opérations non idempotentes.

## Valeurs par défaut

- Tentatives : 3
- Plafond maximal de délai : 30000 ms
- Gigue : 0.1 (10 pour cent)
- Valeurs par défaut par fournisseur :
  - Délai minimal Telegram : 400 ms
  - Délai minimal Discord : 500 ms

## Comportement

### Discord

- Réessaie uniquement sur les erreurs de limite de débit (HTTP 429).
- Utilise `retry_after` de Discord lorsqu’il est disponible, sinon un backoff exponentiel.

### Telegram

- Réessaie sur les erreurs transitoires (429, timeout, connect/reset/closed, temporairement indisponible).
- Utilise `retry_after` lorsqu’il est disponible, sinon un backoff exponentiel.
- Les erreurs d’analyse Markdown ne sont pas réessayées ; elles reviennent à du texte brut.

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
