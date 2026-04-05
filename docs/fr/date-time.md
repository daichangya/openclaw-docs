---
read_when:
    - Vous modifiez la manière dont les horodatages sont affichés au modèle ou aux utilisateurs
    - Vous déboguez le formatage de l’heure dans les messages ou dans la sortie du prompt système
summary: Gestion de la date et de l’heure dans les enveloppes, les prompts, les outils et les connecteurs
title: Date et heure
x-i18n:
    generated_at: "2026-04-05T12:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Date & Time

OpenClaw utilise par défaut **l’heure locale de l’hôte pour les horodatages de transport** et **le fuseau horaire de l’utilisateur uniquement dans le prompt système**.
Les horodatages du provider sont conservés afin que les outils gardent leur sémantique native (l’heure actuelle est disponible via `session_status`).

## Enveloppes de message (local par défaut)

Les messages entrants sont encapsulés avec un horodatage (précision à la minute) :

```
[Provider ... 2026-01-05 16:26 PST] texte du message
```

Cet horodatage d’enveloppe est **local à l’hôte par défaut**, quel que soit le fuseau horaire du provider.

Vous pouvez remplacer ce comportement :

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuseau horaire IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` utilise l’UTC.
- `envelopeTimezone: "local"` utilise le fuseau horaire de l’hôte.
- `envelopeTimezone: "user"` utilise `agents.defaults.userTimezone` (avec repli sur le fuseau horaire de l’hôte).
- Utilisez un fuseau horaire IANA explicite (par ex. `"America/Chicago"`) pour un fuseau fixe.
- `envelopeTimestamp: "off"` supprime les horodatages absolus des en-têtes d’enveloppe.
- `envelopeElapsed: "off"` supprime les suffixes de temps écoulé (style `+2m`).

### Exemples

**Local (par défaut) :**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Fuseau horaire de l’utilisateur :**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Temps écoulé activé :**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt système : Current Date & Time

Si le fuseau horaire de l’utilisateur est connu, le prompt système inclut une section dédiée
**Current Date & Time** avec **uniquement le fuseau horaire** (sans format d’heure/horloge)
afin de préserver la stabilité du cache de prompt :

```
Time zone: America/Chicago
```

Lorsque l’agent a besoin de l’heure actuelle, utilisez l’outil `session_status` ; la carte de statut
inclut une ligne d’horodatage.

## Lignes d’événement système (local par défaut)

Les événements système en file insérés dans le contexte de l’agent sont préfixés par un horodatage utilisant
la même sélection de fuseau horaire que les enveloppes de message (par défaut : heure locale de l’hôte).

```
System: [2026-01-12 12:19:17 PST] Modèle changé.
```

### Configurer le fuseau horaire de l’utilisateur + le format

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` définit le **fuseau horaire local de l’utilisateur** pour le contexte du prompt.
- `timeFormat` contrôle l’affichage en **12 h/24 h** dans le prompt. `auto` suit les préférences du système d’exploitation.

## Détection du format horaire (auto)

Lorsque `timeFormat: "auto"`, OpenClaw inspecte les préférences du système d’exploitation (macOS/Windows)
et utilise le formatage régional comme solution de repli. La valeur détectée est **mise en cache par processus**
afin d’éviter des appels système répétés.

## Charges utiles d’outils + connecteurs (heure brute du provider + champs normalisés)

Les outils de canal renvoient des **horodatages natifs du provider** et ajoutent des champs normalisés pour plus de cohérence :

- `timestampMs` : millisecondes epoch (UTC)
- `timestampUtc` : chaîne UTC ISO 8601

Les champs bruts du provider sont conservés afin de ne rien perdre.

- Slack : chaînes de type epoch issues de l’API
- Discord : horodatages UTC ISO
- Telegram/WhatsApp : horodatages numériques/ISO spécifiques au provider

Si vous avez besoin de l’heure locale, convertissez-la en aval à l’aide du fuseau horaire connu.

## Documentation associée

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)
