---
read_when:
    - Modifier le comportement ou les valeurs par défaut des mots de réveil vocaux
    - Ajouter de nouvelles plateformes Node qui nécessitent la synchronisation des mots de réveil
summary: Mots de réveil vocaux globaux (gérés par Gateway) et leur synchronisation entre les Nodes
title: Réveil vocal
x-i18n:
    generated_at: "2026-04-24T07:19:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw traite les **mots de réveil** comme une liste globale unique gérée par le **Gateway**.

- Il n’existe **pas de mots de réveil personnalisés par Node**.
- **N’importe quelle interface Node/app peut modifier** la liste ; les changements sont conservés par le Gateway et diffusés à tout le monde.
- macOS et iOS conservent des bascules locales **Voice Wake activé/désactivé** (l’expérience utilisateur locale + les autorisations diffèrent).
- Android garde actuellement Voice Wake désactivé et utilise un flux micro manuel dans l’onglet Voice.

## Stockage (hôte Gateway)

Les mots de réveil sont stockés sur la machine gateway à l’emplacement :

- `~/.openclaw/settings/voicewake.json`

Forme :

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocole

### Méthodes

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` avec paramètres `{ triggers: string[] }` → `{ triggers: string[] }`

Remarques :

- Les déclencheurs sont normalisés (espaces supprimés, vides supprimés). Les listes vides reviennent aux valeurs par défaut.
- Des limites sont appliquées pour la sécurité (plafonds de nombre/longueur).

### Événements

- charge utile `voicewake.changed` `{ triggers: string[] }`

Qui la reçoit :

- Tous les clients WebSocket (application macOS, WebChat, etc.)
- Tous les Nodes connectés (iOS/Android), ainsi qu’à la connexion du Node comme poussée initiale de « l’état actuel ».

## Comportement client

### Application macOS

- Utilise la liste globale pour filtrer les déclencheurs `VoiceWakeRuntime`.
- Modifier « Trigger words » dans les paramètres Voice Wake appelle `voicewake.set`, puis s’appuie sur la diffusion pour garder les autres clients synchronisés.

### Node iOS

- Utilise la liste globale pour la détection de déclencheur `VoiceWakeManager`.
- Modifier Wake Words dans Réglages appelle `voicewake.set` (via le WS Gateway) et maintient aussi la détection locale des mots de réveil réactive.

### Node Android

- Voice Wake est actuellement désactivé dans l’exécution/les paramètres Android.
- La voix Android utilise une capture micro manuelle dans l’onglet Voice au lieu de déclencheurs par mot de réveil.

## Voir aussi

- [Mode Talk](/fr/nodes/talk)
- [Audio et notes vocales](/fr/nodes/audio)
- [Compréhension des médias](/fr/nodes/media-understanding)
