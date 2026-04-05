---
read_when:
    - Vous voulez comprendre comment fonctionne la mémoire
    - Vous voulez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw se souvient des choses d’une session à l’autre
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-04-05T12:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Vue d’ensemble de la mémoire

OpenClaw se souvient des choses en écrivant des **fichiers Markdown simples** dans l’espace de travail
de votre agent. Le modèle ne « se souvient » que de ce qui est enregistré sur le disque — il n’y a
pas d’état caché.

## Comment cela fonctionne

Votre agent dispose de deux emplacements pour stocker les souvenirs :

- **`MEMORY.md`** — mémoire à long terme. Faits durables, préférences et
  décisions. Chargé au début de chaque session de message privé.
- **`memory/YYYY-MM-DD.md`** — notes quotidiennes. Contexte courant et observations.
  Les notes d’aujourd’hui et d’hier sont chargées automatiquement.

Ces fichiers se trouvent dans l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).

<Tip>
Si vous voulez que votre agent se souvienne de quelque chose, demandez-le-lui simplement : « Souviens-toi que je
préfère TypeScript. » Il l’écrira dans le fichier approprié.
</Tip>

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** — trouve des notes pertinentes à l’aide d’une recherche sémantique, même lorsque
  la formulation diffère de l’original.
- **`memory_get`** — lit un fichier de mémoire spécifique ou une plage de lignes.

Les deux outils sont fournis par le plugin de mémoire actif (par défaut : `memory-core`).

## Recherche mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une **recherche
hybride** — combinant la similarité vectorielle (sens sémantique) avec la correspondance par mots-clés
(termes exacts comme les identifiants et les symboles de code). Cela fonctionne immédiatement dès que vous avez
une clé API pour n’importe quel fournisseur pris en charge.

<Info>
OpenClaw détecte automatiquement votre fournisseur d’embeddings à partir des clés API disponibles. Si vous
avez une clé OpenAI, Gemini, Voyage ou Mistral configurée, la recherche mémoire est
activée automatiquement.
</Info>

Pour plus de détails sur le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs, voir
[Recherche mémoire](/concepts/memory-search).

## Backends de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et
la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requête et possibilité d’indexer
des répertoires en dehors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Mémoire intersessions native IA avec modélisation des utilisateurs, recherche sémantique et
prise en charge multi-agent. Installation via plugin.
</Card>
</CardGroup>

## Vidage automatique de la mémoire

Avant que la [compaction](/concepts/compaction) ne résume votre conversation, OpenClaw
exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important dans les fichiers de mémoire.
Ceci est activé par défaut — vous n’avez rien à configurer.

<Tip>
Le vidage de la mémoire empêche la perte de contexte pendant la compaction. Si votre agent contient des
informations importantes dans la conversation qui ne sont pas encore écrites dans un fichier, elles
seront enregistrées automatiquement avant que le résumé n’ait lieu.
</Tip>

## Dreaming (expérimental)

Dreaming est un passage facultatif de consolidation en arrière-plan pour la mémoire. Il revisite
les rappels à court terme depuis les fichiers quotidiens (`memory/YYYY-MM-DD.md`), les évalue et
ne promeut dans la mémoire à long terme (`MEMORY.md`) que les éléments qualifiés.

Il est conçu pour maintenir un signal élevé dans la mémoire à long terme :

- **Optionnel** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement la tâche
  récurrente.
- **À seuil** : les promotions doivent franchir des seuils de score, de fréquence de rappel et de
  diversité des requêtes.

Pour le comportement des modes (`off`, `core`, `rem`, `deep`), les signaux de score et les paramètres de réglage, voir
[Dreaming (expérimental)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Pour aller plus loin

- [Moteur de mémoire intégré](/concepts/memory-builtin) — backend SQLite par défaut
- [Moteur de mémoire QMD](/concepts/memory-qmd) — sidecar local-first avancé
- [Mémoire Honcho](/concepts/memory-honcho) — mémoire intersessions native IA
- [Recherche mémoire](/concepts/memory-search) — pipeline de recherche, fournisseurs et
  réglage
- [Dreaming (expérimental)](/concepts/memory-dreaming) — promotion en arrière-plan
  du rappel à court terme vers la mémoire à long terme
- [Référence de configuration de la mémoire](/reference/memory-config) — tous les paramètres de configuration
- [Compaction](/concepts/compaction) — comment la compaction interagit avec la mémoire
