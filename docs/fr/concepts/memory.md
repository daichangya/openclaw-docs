---
read_when:
    - Vous voulez comprendre comment fonctionne la mémoire
    - Vous voulez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw se souvient des choses entre les sessions
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-04-06T03:06:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d19d4fa9c4b3232b7a97f7a382311d2a375b562040de15e9fe4a0b1990b825e7
    source_path: concepts/memory.md
    workflow: 15
---

# Vue d’ensemble de la mémoire

OpenClaw se souvient des choses en écrivant des **fichiers Markdown simples** dans l’espace de travail de votre agent. Le modèle ne « se souvient » que de ce qui est enregistré sur le disque -- il n’y a pas d’état caché.

## Comment cela fonctionne

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** -- mémoire à long terme. Faits durables, préférences et décisions. Chargé au début de chaque session DM.
- **`memory/YYYY-MM-DD.md`** -- notes quotidiennes. Contexte courant et observations. Les notes d’aujourd’hui et d’hier sont chargées automatiquement.
- **`DREAMS.md`** (expérimental, facultatif) -- journal des rêves et résumés des cycles de rêve pour examen humain.

Ces fichiers se trouvent dans l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).

<Tip>
Si vous voulez que votre agent se souvienne de quelque chose, demandez-le-lui simplement : « Souviens-toi que je préfère TypeScript. » Il l’écrira dans le fichier approprié.
</Tip>

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** -- trouve les notes pertinentes à l’aide d’une recherche sémantique, même lorsque la formulation diffère de l’original.
- **`memory_get`** -- lit un fichier de mémoire spécifique ou une plage de lignes.

Ces deux outils sont fournis par le plugin de mémoire actif (par défaut : `memory-core`).

## Recherche en mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une **recherche hybride** -- combinant similarité vectorielle (sens sémantique) et correspondance par mots-clés (termes exacts comme les identifiants et les symboles de code). Cela fonctionne immédiatement dès que vous disposez d’une clé API pour n’importe quel fournisseur pris en charge.

<Info>
OpenClaw détecte automatiquement votre fournisseur d’embeddings à partir des clés API disponibles. Si vous avez configuré une clé OpenAI, Gemini, Voyage ou Mistral, la recherche en mémoire est activée automatiquement.
</Info>

Pour plus de détails sur le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs, consultez [Recherche en mémoire](/fr/concepts/memory-search).

## Backends de mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et la recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requêtes et possibilité d’indexer des répertoires en dehors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersessions native pour l’IA avec modélisation utilisateur, recherche sémantique et prise en compte multi-agent. Installation via plugin.
</Card>
</CardGroup>

## Flush automatique de la mémoire

Avant que le [compactage](/fr/concepts/compaction) ne résume votre conversation, OpenClaw exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important dans des fichiers de mémoire. Cette fonction est activée par défaut -- vous n’avez rien à configurer.

<Tip>
Le flush de mémoire évite la perte de contexte pendant le compactage. Si votre agent a des faits importants dans la conversation qui ne sont pas encore écrits dans un fichier, ils seront enregistrés automatiquement avant que le résumé n’ait lieu.
</Tip>

## Rêve (expérimental)

Le rêve est un passage facultatif de consolidation en arrière-plan pour la mémoire. Il collecte des signaux à court terme, évalue des candidats et ne promeut dans la mémoire à long terme (`MEMORY.md`) que les éléments qualifiés.

Il est conçu pour maintenir une mémoire à long terme à fort signal :

- **Sur adhésion** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron récurrente pour un cycle complet de rêve.
- **Avec seuils** : les promotions doivent passer des seuils de score, de fréquence de rappel et de diversité des requêtes.
- **Révisable** : les résumés de phase et les entrées du journal sont écrits dans `DREAMS.md` pour examen humain.

Pour le comportement des phases, les signaux de score et les détails du journal des rêves, consultez [Rêve (expérimental)](/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Vérifier l’état de l’index et le fournisseur
openclaw memory search "query"  # Rechercher depuis la ligne de commande
openclaw memory index --force   # Reconstruire l’index
```

## Pour aller plus loin

- [Builtin Memory Engine](/fr/concepts/memory-builtin) -- backend SQLite par défaut
- [QMD Memory Engine](/fr/concepts/memory-qmd) -- sidecar local-first avancé
- [Honcho Memory](/fr/concepts/memory-honcho) -- mémoire intersessions native pour l’IA
- [Recherche en mémoire](/fr/concepts/memory-search) -- pipeline de recherche, fournisseurs et réglage
- [Rêve (expérimental)](/concepts/dreaming) -- promotion en arrière-plan
  du rappel à court terme vers la mémoire à long terme
- [Référence de configuration de la mémoire](/fr/reference/memory-config) -- tous les paramètres de configuration
- [Compactage](/fr/concepts/compaction) -- comment le compactage interagit avec la mémoire
