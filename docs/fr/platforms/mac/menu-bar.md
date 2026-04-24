---
read_when:
    - Ajustement de l’interface du menu mac ou de la logique d’état
summary: Logique d’état de la barre de menus et ce qui est présenté aux utilisateurs
title: Barre de menus
x-i18n:
    generated_at: "2026-04-24T07:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logique d’état de la barre de menus

## Ce qui est affiché

- Nous affichons l’état de travail actuel de l’agent dans l’icône de la barre de menus et dans la première ligne d’état du menu.
- L’état de santé est masqué pendant qu’un travail est actif ; il réapparaît lorsque toutes les sessions sont inactives.
- Le bloc « Nodes » du menu liste uniquement les **appareils** (Nodes associés via `node.list`), et non les entrées client/presence.
- Une section « Usage » apparaît sous Context lorsque des instantanés d’utilisation provider sont disponibles.

## Modèle d’état

- Sessions : les événements arrivent avec `runId` (par exécution) plus `sessionKey` dans la charge utile. La session « main » est la clé `main` ; si elle est absente, nous revenons à la session mise à jour le plus récemment.
- Priorité : main gagne toujours. Si main est active, son état est affiché immédiatement. Si main est inactive, la session non-main active la plus récente est affichée. Nous n’oscillons pas en cours d’activité ; nous ne basculons que lorsque la session actuelle devient inactive ou que main devient active.
- Types d’activité :
  - `job` : exécution de commande de haut niveau (`state: started|streaming|done|error`).
  - `tool` : `phase: start|result` avec `toolName` et `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (surcharge de débogage)

### `ActivityKind` → glyphe

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- par défaut → 🛠️

### Mapping visuel

- `idle` : critter normal.
- `workingMain` : badge avec glyphe, teinte complète, animation de jambe « working ».
- `workingOther` : badge avec glyphe, teinte atténuée, pas de mouvement rapide.
- `overridden` : utilise le glyphe/la teinte choisis indépendamment de l’activité.

## Texte de la ligne d’état (menu)

- Pendant qu’un travail est actif : `<Session role> · <activity label>`
  - Exemples : `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Lorsqu’il est inactif : revient au résumé de santé.

## Ingestion des événements

- Source : événements `agent` du canal de contrôle (`ControlChannel.handleAgentEvent`).
- Champs analysés :
  - `stream: "job"` avec `data.state` pour le démarrage/l’arrêt.
  - `stream: "tool"` avec `data.phase`, `name`, `meta`/`args` facultatifs.
- Libellés :
  - `exec` : première ligne de `args.command`.
  - `read`/`write` : chemin raccourci.
  - `edit` : chemin plus type de changement inféré depuis `meta`/les compteurs de diff.
  - solution de repli : nom de l’outil.

## Surcharge de débogage

- Réglages ▸ Debug ▸ sélecteur « Icon override » :
  - `System (auto)` (par défaut)
  - `Working: main` (par type d’outil)
  - `Working: other` (par type d’outil)
  - `Idle`
- Stocké via `@AppStorage("iconOverride")` ; mappé vers `IconState.overridden`.

## Checklist de test

- Déclencher une tâche de session main : vérifier que l’icône bascule immédiatement et que la ligne d’état affiche le libellé main.
- Déclencher une tâche de session non-main pendant que main est inactive : l’icône/l’état affiche non-main ; reste stable jusqu’à la fin.
- Démarrer main alors qu’une autre session est active : l’icône bascule instantanément vers main.
- Rafales rapides d’outils : s’assurer que le badge ne scintille pas (grâce TTL sur les résultats d’outils).
- La ligne de santé réapparaît une fois toutes les sessions inactives.

## Lié

- [App macOS](/fr/platforms/macos)
- [Icône de la barre de menus](/fr/platforms/mac/icon)
