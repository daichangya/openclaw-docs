---
read_when:
    - Vous devez comprendre comment les horodatages sont normalisés pour le modèle
    - Configuration du fuseau horaire utilisateur pour les prompts système
summary: Gestion des fuseaux horaires pour les agents, les enveloppes et les prompts
title: Fuseaux horaires
x-i18n:
    generated_at: "2026-04-05T12:41:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Fuseaux horaires

OpenClaw standardise les horodatages afin que le modèle voie une **heure de référence unique**.

## Enveloppes de message (locales par défaut)

Les messages entrants sont encapsulés dans une enveloppe comme :

```
[Provider ... 2026-01-05 16:26 PST] message text
```

L’horodatage dans l’enveloppe est **local à l’hôte par défaut**, avec une précision à la minute.

Vous pouvez remplacer cela avec :

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` utilise UTC.
- `envelopeTimezone: "user"` utilise `agents.defaults.userTimezone` (se rabat sur le fuseau horaire de l’hôte).
- Utilisez un fuseau horaire IANA explicite (par ex. `"Europe/Vienna"`) pour un décalage fixe.
- `envelopeTimestamp: "off"` supprime les horodatages absolus des en-têtes d’enveloppe.
- `envelopeElapsed: "off"` supprime les suffixes de temps écoulé (style `+2m`).

### Exemples

**Local (par défaut) :**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Fuseau horaire fixe :**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Temps écoulé :**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Charges utiles d’outils (données brutes du fournisseur + champs normalisés)

Les appels d’outils (`channels.discord.readMessages`, `channels.slack.readMessages`, etc.) renvoient des **horodatages bruts du fournisseur**.
Nous ajoutons aussi des champs normalisés pour garantir la cohérence :

- `timestampMs` (millisecondes d’époque UTC)
- `timestampUtc` (chaîne UTC ISO 8601)

Les champs bruts du fournisseur sont conservés.

## Fuseau horaire utilisateur pour le prompt système

Définissez `agents.defaults.userTimezone` pour indiquer au modèle le fuseau horaire local de l’utilisateur. S’il n’est pas
défini, OpenClaw résout le **fuseau horaire de l’hôte à l’exécution** (sans écriture dans la configuration).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Le prompt système inclut :

- une section `Current Date & Time` avec l’heure locale et le fuseau horaire
- `Time format: 12-hour` ou `24-hour`

Vous pouvez contrôler le format du prompt avec `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Voir [Date & Time](/date-time) pour le comportement complet et des exemples.

## Lié

- [Heartbeat](/gateway/heartbeat) — les heures actives utilisent le fuseau horaire pour la planification
- [Cron Jobs](/automation/cron-jobs) — les expressions cron utilisent le fuseau horaire pour la planification
- [Date & Time](/date-time) — comportement complet date/heure et exemples
