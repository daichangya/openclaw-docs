---
read_when:
    - Modifier le comportement de l’icône de barre des menus
summary: États et animations de l’icône de barre des menus pour OpenClaw sur macOS
title: Icône de barre des menus
x-i18n:
    generated_at: "2026-04-05T12:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# États de l’icône de barre des menus

Auteur : steipete · Mise à jour : 2025-12-06 · Portée : application macOS (`apps/macos`)

- **Inactif :** animation normale de l’icône (clignement, léger mouvement occasionnel).
- **En pause :** l’élément de statut utilise `appearsDisabled` ; aucun mouvement.
- **Déclencheur vocal (grandes oreilles) :** le détecteur de réveil vocal appelle `AppState.triggerVoiceEars(ttl: nil)` lorsque le mot de réveil est entendu, ce qui maintient `earBoostActive=true` pendant la capture de l’énoncé. Les oreilles s’agrandissent (1.9x), obtiennent des trous circulaires pour améliorer la lisibilité, puis reviennent à la normale via `stopVoiceEars()` après 1 s de silence. Déclenché uniquement depuis le pipeline vocal intégré à l’application.
- **En cours de traitement (agent en cours d’exécution) :** `AppState.isWorking=true` pilote un micro-mouvement de « course de queue/pattes » : mouvement plus rapide des pattes et léger décalage pendant l’exécution du travail. Actuellement activé autour des exécutions d’agent WebChat ; ajoutez la même bascule autour des autres tâches longues lorsque vous les câblez.

Points d’intégration

- Réveil vocal : le runtime/tester appelle `AppState.triggerVoiceEars(ttl: nil)` au déclenchement et `stopVoiceEars()` après 1 s de silence pour correspondre à la fenêtre de capture.
- Activité de l’agent : définissez `AppStateStore.shared.setWorking(true/false)` autour des périodes de travail (déjà fait dans l’appel d’agent WebChat). Gardez les périodes courtes et réinitialisez dans des blocs `defer` pour éviter des animations bloquées.

Formes et tailles

- Icône de base dessinée dans `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- L’échelle des oreilles vaut `1.0` par défaut ; le boost vocal définit `earScale=1.9` et active `earHoles=true` sans modifier le cadre global (image template de 18×18 pt rendue dans un backing store Retina de 36×36 px).
- La course utilise un mouvement des pattes pouvant aller jusqu’à ~1.0 avec une petite oscillation horizontale ; elle s’ajoute à tout mouvement inactif existant.

Notes comportementales

- Aucun basculement CLI/broker externe pour les oreilles/le mode en cours de traitement ; conservez cela en interne aux propres signaux de l’application afin d’éviter des activations/désactivations accidentelles.
- Gardez les TTL courts (&lt;10s) pour que l’icône revienne rapidement à son état de base si une tâche se bloque.
