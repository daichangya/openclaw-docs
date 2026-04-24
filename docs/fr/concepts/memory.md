---
read_when:
    - Vous souhaitez comprendre comment fonctionne la mémoire
    - Vous souhaitez savoir quels fichiers de mémoire écrire
summary: Comment OpenClaw se souvient des choses d’une session à l’autre
title: Vue d’ensemble de la mémoire
x-i18n:
    generated_at: "2026-04-24T07:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw se souvient des choses en écrivant des **fichiers Markdown simples** dans l’espace de travail de votre agent. Le modèle ne « se souvient » que de ce qui est enregistré sur le disque -- il n’y a pas d’état caché.

## Fonctionnement

Votre agent dispose de trois fichiers liés à la mémoire :

- **`MEMORY.md`** -- mémoire à long terme. Faits durables, préférences et
  décisions. Chargé au début de chaque session DM.
- **`memory/YYYY-MM-DD.md`** -- notes quotidiennes. Contexte courant et observations.
  Les notes d’aujourd’hui et d’hier sont chargées automatiquement.
- **`DREAMS.md`** (facultatif) -- journal des rêves et résumés des balayages Dreaming
  pour examen humain, y compris les entrées de backfill historique ancré.

Ces fichiers se trouvent dans l’espace de travail de l’agent (par défaut `~/.openclaw/workspace`).

<Tip>
Si vous voulez que votre agent se souvienne de quelque chose, demandez-le-lui simplement : « Souviens-toi que je
préfère TypeScript. » Il l’écrira dans le fichier approprié.
</Tip>

## Outils de mémoire

L’agent dispose de deux outils pour travailler avec la mémoire :

- **`memory_search`** -- trouve les notes pertinentes à l’aide de la recherche sémantique, même lorsque
  la formulation diffère de l’original.
- **`memory_get`** -- lit un fichier mémoire spécifique ou une plage de lignes.

Ces deux outils sont fournis par le plugin Active Memory actif (par défaut : `memory-core`).

## Plugin compagnon Memory Wiki

Si vous voulez que la mémoire durable se comporte davantage comme une base de connaissances maintenue que
comme de simples notes brutes, utilisez le plugin inclus `memory-wiki`.

`memory-wiki` compile les connaissances durables dans un coffre wiki avec :

- structure de page déterministe
- affirmations structurées et preuves
- suivi des contradictions et de la fraîcheur
- tableaux de bord générés
- condensés compilés pour les consommateurs agent/runtime
- outils natifs wiki comme `wiki_search`, `wiki_get`, `wiki_apply` et `wiki_lint`

Il ne remplace pas le plugin Active Memory. Le plugin Active Memory conserve la responsabilité
du rappel, de la promotion et de Dreaming. `memory-wiki` ajoute à côté une couche de connaissances
riche en provenance.

Voir [Memory Wiki](/fr/plugins/memory-wiki).

## Recherche mémoire

Lorsqu’un fournisseur d’embeddings est configuré, `memory_search` utilise une **recherche
hybride** -- combinant similarité vectorielle (sens sémantique) et correspondance par mots-clés
(termes exacts comme les identifiants et les symboles de code). Cela fonctionne immédiatement dès que vous avez
une clé API pour n’importe quel fournisseur pris en charge.

<Info>
OpenClaw détecte automatiquement votre fournisseur d’embeddings à partir des clés API disponibles. Si vous
avez configuré une clé OpenAI, Gemini, Voyage ou Mistral, la recherche mémoire est
activée automatiquement.
</Info>

Pour les détails sur le fonctionnement de la recherche, les options de réglage et la configuration des fournisseurs, voir
[Recherche mémoire](/fr/concepts/memory-search).

## Backends mémoire

<CardGroup cols={3}>
<Card title="Intégré (par défaut)" icon="database" href="/fr/concepts/memory-builtin">
Basé sur SQLite. Fonctionne immédiatement avec la recherche par mots-clés, la similarité vectorielle et la
recherche hybride. Aucune dépendance supplémentaire.
</Card>
<Card title="QMD" icon="search" href="/fr/concepts/memory-qmd">
Sidecar local-first avec reranking, expansion de requête et capacité à indexer
des répertoires en dehors de l’espace de travail.
</Card>
<Card title="Honcho" icon="brain" href="/fr/concepts/memory-honcho">
Mémoire intersessions native IA avec modélisation utilisateur, recherche sémantique et
prise en charge multi-agents. Installation par plugin.
</Card>
</CardGroup>

## Couche wiki de connaissances

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fr/plugins/memory-wiki">
Compile la mémoire durable dans un coffre wiki riche en provenance avec affirmations,
tableaux de bord, mode bridge et workflows compatibles Obsidian.
</Card>
</CardGroup>

## Flush mémoire automatique

Avant que la [Compaction](/fr/concepts/compaction) ne résume votre conversation, OpenClaw
exécute un tour silencieux qui rappelle à l’agent d’enregistrer le contexte important dans les fichiers
mémoire. C’est activé par défaut -- vous n’avez rien à configurer.

<Tip>
Le flush mémoire évite la perte de contexte pendant la Compaction. Si votre agent contient
des faits importants dans la conversation qui ne sont pas encore écrits dans un fichier, ils
seront enregistrés automatiquement avant que le résumé n’ait lieu.
</Tip>

## Dreaming

Dreaming est une passe facultative de consolidation de mémoire en arrière-plan. Elle collecte
des signaux à court terme, attribue un score aux candidats et ne promeut dans la mémoire à long terme
(`MEMORY.md`) que les éléments qualifiés.

Elle est conçue pour maintenir un signal élevé dans la mémoire à long terme :

- **Sur activation** : désactivé par défaut.
- **Planifié** : lorsqu’il est activé, `memory-core` gère automatiquement un job Cron récurrent
  pour un balayage Dreaming complet.
- **À seuils** : les promotions doivent franchir les barrières de score, de fréquence de rappel et de
  diversité des requêtes.
- **Révisable** : les résumés de phase et les entrées de journal sont écrits dans `DREAMS.md`
  pour examen humain.

Pour le comportement des phases, les signaux de score et les détails du journal des rêves, voir
[Dreaming](/fr/concepts/dreaming).

## Backfill ancré et promotion en direct

Le système Dreaming dispose désormais de deux voies de révision étroitement liées :

- **Dreaming en direct** fonctionne à partir du magasin Dreaming à court terme sous
  `memory/.dreams/` et c’est ce qu’utilise la phase deep normale lorsqu’elle décide de ce
  qui peut être promu dans `MEMORY.md`.
- **Backfill ancré** lit les notes historiques `memory/YYYY-MM-DD.md` comme
  fichiers journaliers autonomes et écrit une sortie de révision structurée dans `DREAMS.md`.

Le backfill ancré est utile lorsque vous voulez rejouer d’anciennes notes et inspecter ce
que le système considère comme durable sans modifier manuellement `MEMORY.md`.

Lorsque vous utilisez :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

les candidats durables ancrés ne sont pas promus directement. Ils sont préparés dans
le même magasin Dreaming à court terme que celui déjà utilisé par la phase deep normale. Cela
signifie que :

- `DREAMS.md` reste la surface de révision humaine.
- le magasin à court terme reste la surface de classement orientée machine.
- `MEMORY.md` n’est toujours écrit que par la promotion deep.

Si vous décidez que la relecture n’était pas utile, vous pouvez supprimer les artefacts préparés
sans toucher aux entrées ordinaires du journal ni à l’état normal du rappel :

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Vérifier l’état de l’index et du fournisseur
openclaw memory search "query"  # Rechercher depuis la ligne de commande
openclaw memory index --force   # Reconstruire l’index
```

## Pour aller plus loin

- [Moteur de mémoire intégré](/fr/concepts/memory-builtin) -- backend SQLite par défaut
- [Moteur de mémoire QMD](/fr/concepts/memory-qmd) -- sidecar local-first avancé
- [Mémoire Honcho](/fr/concepts/memory-honcho) -- mémoire intersessions native IA
- [Memory Wiki](/fr/plugins/memory-wiki) -- coffre de connaissances compilé et outils natifs wiki
- [Recherche mémoire](/fr/concepts/memory-search) -- pipeline de recherche, fournisseurs et
  réglage
- [Dreaming](/fr/concepts/dreaming) -- promotion en arrière-plan
  du rappel à court terme vers la mémoire à long terme
- [Référence de configuration de la mémoire](/fr/reference/memory-config) -- tous les réglages de configuration
- [Compaction](/fr/concepts/compaction) -- comment la Compaction interagit avec la mémoire

## Articles connexes

- [Active Memory](/fr/concepts/active-memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Moteur de mémoire intégré](/fr/concepts/memory-builtin)
- [Mémoire Honcho](/fr/concepts/memory-honcho)
