---
read_when:
    - Modification du comportement de l’icône de la barre de menu
summary: États et animations de l’icône de la barre de menu pour OpenClaw sur macOS
title: Icône de la barre de menu
x-i18n:
    generated_at: "2026-04-24T07:20:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# États de l’icône de la barre de menu

Auteur : steipete · Mis à jour : 2025-12-06 · Portée : app macOS (`apps/macos`)

- **Idle :** animation normale de l’icône (clignement, léger tortillement occasionnel).
- **Paused :** l’élément de statut utilise `appearsDisabled` ; aucun mouvement.
- **Déclencheur vocal (grandes oreilles) :** le détecteur de réveil vocal appelle `AppState.triggerVoiceEars(ttl: nil)` lorsque le mot d’activation est entendu, en gardant `earBoostActive=true` pendant la capture de l’énoncé. Les oreilles s’agrandissent (1,9x), obtiennent des trous d’oreille circulaires pour la lisibilité, puis reviennent à la normale via `stopVoiceEars()` après 1 seconde de silence. Déclenché uniquement depuis le pipeline vocal intégré à l’app.
- **En cours de travail (agent en cours d’exécution) :** `AppState.isWorking=true` pilote un micro-mouvement de « frétilllement de queue/pattes » : frémissement plus rapide des pattes et léger décalage pendant que le travail est en cours. Actuellement basculé autour des exécutions d’agent WebChat ; ajoutez le même basculement autour des autres tâches longues lorsque vous les raccordez.

Points de raccordement

- Réveil vocal : le runtime/tester appelle `AppState.triggerVoiceEars(ttl: nil)` au déclenchement et `stopVoiceEars()` après 1 seconde de silence pour correspondre à la fenêtre de capture.
- Activité de l’agent : définissez `AppStateStore.shared.setWorking(true/false)` autour des périodes de travail (déjà fait dans l’appel d’agent WebChat). Gardez les périodes courtes et réinitialisez dans des blocs `defer` pour éviter les animations bloquées.

Formes et tailles

- L’icône de base est dessinée dans `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- L’échelle des oreilles vaut `1.0` par défaut ; le boost vocal définit `earScale=1.9` et active `earHoles=true` sans modifier le cadre global (image template de 18×18 pt rendue dans un tampon Retina de 36×36 px).
- Le déplacement rapide utilise un frétillement des pattes jusqu’à ~1.0 avec un petit tremblement horizontal ; il s’ajoute à tout léger tortillement déjà présent à l’état idle.

Remarques comportementales

- Aucun basculement externe CLI/broker pour les oreilles/le travail ; conservez cela en interne, piloté uniquement par les signaux propres à l’app, afin d’éviter des activations intempestives.
- Gardez les TTL courts (&lt;10s) pour que l’icône revienne rapidement à son état de base si une tâche se bloque.

## Lié

- [Barre de menu](/fr/platforms/mac/menu-bar)
- [App macOS](/fr/platforms/macos)
