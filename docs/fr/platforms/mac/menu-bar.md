---
read_when:
    - Ajustement de l’interface du menu mac ou de la logique d’état
summary: Logique d’état de la barre de menus et ce qui est affiché aux utilisateurs
title: Barre de menus
x-i18n:
    generated_at: "2026-04-05T12:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8eb73c0e671a76aae4ebb653c65147610bf3e6d3c9c0943d150e292e7761d16d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Logique d’état de la barre de menus

## Ce qui est affiché

- Nous affichons l’état de travail actuel de l’agent dans l’icône de la barre de menus et dans la première ligne d’état du menu.
- L’état de santé est masqué pendant qu’un travail est actif ; il réapparaît lorsque toutes les sessions sont inactives.
- Le bloc « Nodes » dans le menu liste uniquement les **appareils** (nœuds appairés via `node.list`), pas les entrées client/presence.
- Une section « Usage » apparaît sous Context lorsque des instantanés d’utilisation du fournisseur sont disponibles.

## Modèle d’état

- Sessions : les événements arrivent avec `runId` (par exécution) plus `sessionKey` dans la charge utile. La session « main » correspond à la clé `main` ; si elle est absente, nous revenons à la session la plus récemment mise à jour.
- Priorité : main l’emporte toujours. Si main est active, son état est affiché immédiatement. Si main est inactive, la session non principale active la plus récente est affichée. Nous n’oscillons pas en cours d’activité ; nous ne basculons que lorsque la session courante devient inactive ou que main devient active.
- Types d’activité :
  - `job` : exécution de commande de haut niveau (`state: started|streaming|done|error`).
  - `tool` : `phase: start|result` avec `toolName` et `meta/args`.

## Enum `IconState` (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (remplacement de débogage)

### `ActivityKind` → glyphe

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- par défaut → 🛠️

### Mappage visuel

- `idle` : créature normale.
- `workingMain` : badge avec glyphe, teinte complète, animation de pattes « en train de travailler ».
- `workingOther` : badge avec glyphe, teinte atténuée, pas de déplacement rapide.
- `overridden` : utilise le glyphe/la teinte choisi quel que soit l’état d’activité.

## Texte de la ligne d’état (menu)

- Tant qu’un travail est actif : `<Rôle de session> · <libellé d’activité>`
  - Exemples : `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Lorsqu’il est inactif : revient au résumé de santé.

## Ingestion des événements

- Source : événements `agent` du canal de contrôle (`ControlChannel.handleAgentEvent`).
- Champs analysés :
  - `stream: "job"` avec `data.state` pour le démarrage/l’arrêt.
  - `stream: "tool"` avec `data.phase`, `name`, `meta`/`args` facultatifs.
- Libellés :
  - `exec` : première ligne de `args.command`.
  - `read`/`write` : chemin abrégé.
  - `edit` : chemin plus type de modification inféré à partir de `meta`/du nombre de diffs.
  - repli : nom de l’outil.

## Remplacement de débogage

- Réglages ▸ Debug ▸ sélecteur « Icon override » :
  - `System (auto)` (par défaut)
  - `Working: main` (par type d’outil)
  - `Working: other` (par type d’outil)
  - `Idle`
- Stocké via `@AppStorage("iconOverride")` ; mappé vers `IconState.overridden`.

## Checklist de test

- Déclencher une tâche de session principale : vérifier que l’icône bascule immédiatement et que la ligne d’état affiche le libellé principal.
- Déclencher une tâche de session non principale alors que main est inactive : l’icône/l’état affichent la session non principale ; cela reste stable jusqu’à la fin.
- Démarrer main alors qu’une autre session est active : l’icône bascule instantanément vers main.
- Rafales rapides d’outils : s’assurer que le badge ne clignote pas (grâce à une période de grâce TTL sur les résultats d’outil).
- La ligne de santé réapparaît une fois que toutes les sessions sont inactives.
