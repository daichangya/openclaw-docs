---
read_when:
    - Vous voyez une clé de configuration `.experimental` et voulez savoir si elle est stable
    - Vous voulez essayer des fonctionnalités runtime en préversion sans les confondre avec les valeurs par défaut normales
    - Vous voulez un endroit unique pour trouver les indicateurs expérimentaux actuellement documentés
summary: ce que signifient les indicateurs expérimentaux dans OpenClaw et lesquels sont actuellement documentés
title: fonctionnalités expérimentales
x-i18n:
    generated_at: "2026-04-24T07:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Les fonctionnalités expérimentales dans OpenClaw sont des **surfaces de préversion à activation explicite**. Elles sont
derrière des indicateurs explicites parce qu’elles ont encore besoin d’un usage réel avant
de mériter une valeur par défaut stable ou un contrat public durable.

Traitez-les différemment d’une configuration normale :

- Laissez-les **désactivées par défaut** sauf si la documentation associée vous dit d’en essayer une.
- Attendez-vous à ce que **la forme et le comportement changent** plus vite qu’une configuration stable.
- Préférez d’abord le chemin stable lorsqu’il en existe déjà un.
- Si vous déployez OpenClaw largement, testez les indicateurs expérimentaux dans un environnement plus restreint
  avant de les intégrer dans une base partagée.

## Indicateurs actuellement documentés

| Surface                  | Clé                                                       | Utilisez-la lorsque                                                                                           | En savoir plus                                                                                |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modèle local  | `agents.defaults.experimental.localModelLean`             | Un backend local plus petit ou plus strict supporte mal la surface complète des outils par défaut d’OpenClaw | [Modèles locaux](/fr/gateway/local-models)                                                       |
| Recherche mémoire        | `agents.defaults.memorySearch.experimental.sessionMemory` | Vous voulez que `memory_search` indexe les transcriptions de sessions précédentes et acceptez le coût supplémentaire de stockage/indexation | [Référence de configuration de la mémoire](/fr/reference/memory-config#session-memory-search-experimental) |
| Outil de planification structurée | `tools.experimental.planTool`                     | Vous voulez que l’outil structuré `update_plan` soit exposé pour le suivi de travaux à plusieurs étapes dans les runtimes et interfaces compatibles | [Référence de configuration Gateway](/fr/gateway/config-tools#toolsexperimental)                |

## Mode lean de modèle local

`agents.defaults.experimental.localModelLean: true` est une soupape de décompression
pour les configurations de modèles locaux plus faibles. Il retire des outils par défaut lourds comme
`browser`, `cron` et `message` afin que la forme du prompt soit plus petite et moins fragile
pour des backends compatibles OpenAI à petit contexte ou plus stricts.

Ce n’est volontairement **pas** le chemin normal. Si votre backend gère proprement le runtime
complet, laissez cette option désactivée.

## Expérimental ne veut pas dire caché

Si une fonctionnalité est expérimentale, OpenClaw doit le dire clairement dans la documentation et dans le
chemin de configuration lui-même. Ce qu’il ne doit **pas** faire, c’est glisser un comportement de préversion dans un
paramètre par défaut à l’apparence stable et prétendre que c’est normal. C’est comme cela que les surfaces de
configuration deviennent désordonnées.

## Liens associés

- [Fonctionnalités](/fr/concepts/features)
- [Canaux de version](/fr/install/development-channels)
