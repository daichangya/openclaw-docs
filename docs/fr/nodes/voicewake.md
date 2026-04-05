---
read_when:
    - Modifier le comportement ou les valeurs par défaut des mots d'activation vocale
    - Ajouter de nouvelles plateformes de nœud nécessitant la synchronisation des mots d'activation
summary: Mots d'activation vocale globaux (appartenant à la gateway) et synchronisation entre les nœuds
title: Réveil vocal
x-i18n:
    generated_at: "2026-04-05T12:47:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Réveil vocal (mots d'activation globaux)

OpenClaw traite les **mots d'activation** comme une liste globale unique appartenant à la **gateway**.

- Il n'existe **pas** de mots d'activation personnalisés par nœud.
- **Toute interface de nœud/application peut modifier** la liste ; les changements sont persistés par la gateway et diffusés à tout le monde.
- macOS et iOS conservent des bascules locales **Voice Wake activé/désactivé** (l'expérience utilisateur locale et les autorisations diffèrent).
- Android garde actuellement Voice Wake désactivé et utilise un flux micro manuel dans l'onglet Voice.

## Stockage (hôte gateway)

Les mots d'activation sont stockés sur la machine gateway à l'emplacement suivant :

- `~/.openclaw/settings/voicewake.json`

Structure :

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocole

### Méthodes

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` avec les paramètres `{ triggers: string[] }` → `{ triggers: string[] }`

Remarques :

- Les déclencheurs sont normalisés (espaces supprimés, entrées vides supprimées). Les listes vides reviennent aux valeurs par défaut.
- Des limites sont appliquées pour des raisons de sécurité (plafonds de nombre/longueur).

### Événements

- charge utile `voicewake.changed` `{ triggers: string[] }`

Qui le reçoit :

- Tous les clients WebSocket (application macOS, WebChat, etc.)
- Tous les nœuds connectés (iOS/Android), ainsi qu'au moment de la connexion d'un nœud sous forme d'envoi initial de « l'état actuel ».

## Comportement client

### Application macOS

- Utilise la liste globale pour filtrer les déclencheurs de `VoiceWakeRuntime`.
- Modifier « Trigger words » dans les paramètres Voice Wake appelle `voicewake.set`, puis s'appuie sur la diffusion pour maintenir les autres clients synchronisés.

### Nœud iOS

- Utilise la liste globale pour la détection des déclencheurs de `VoiceWakeManager`.
- Modifier Wake Words dans Réglages appelle `voicewake.set` (via la gateway WS) et maintient également la réactivité de la détection locale des mots d'activation.

### Nœud Android

- Voice Wake est actuellement désactivé dans le runtime/Réglages Android.
- La voix sur Android utilise une capture micro manuelle dans l'onglet Voice au lieu de déclencheurs par mot d'activation.
