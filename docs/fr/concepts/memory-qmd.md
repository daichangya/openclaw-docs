---
read_when:
    - Vous voulez configurer QMD comme backend de mémoire
    - Vous voulez des fonctionnalités de mémoire avancées comme le reranking ou des chemins indexés supplémentaires
summary: Sidecar de recherche local-first avec BM25, vecteurs, reranking et expansion de requêtes
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-04-06T03:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36642c7df94b88f562745dd2270334379f2aeeef4b363a8c13ef6be42dadbe5c
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Moteur de mémoire QMD

[QMD](https://github.com/tobi/qmd) est un sidecar de recherche local-first qui s’exécute
aux côtés d’OpenClaw. Il combine BM25, la recherche vectorielle et le reranking dans un seul
binaire, et peut indexer du contenu au-delà des fichiers de mémoire de votre espace de travail.

## Ce qu’il ajoute par rapport au moteur intégré

- **Reranking et expansion de requêtes** pour un meilleur rappel.
- **Indexer des répertoires supplémentaires** -- documentation de projet, notes d’équipe, tout ce qui se trouve sur le disque.
- **Indexer les transcriptions de session** -- pour retrouver des conversations antérieures.
- **Entièrement local** -- s’exécute via Bun + node-llama-cpp, télécharge automatiquement les modèles GGUF.
- **Basculement automatique** -- si QMD n’est pas disponible, OpenClaw revient au
  moteur intégré de manière transparente.

## Pour commencer

### Prérequis

- Installez QMD : `npm install -g @tobilu/qmd` ou `bun install -g @tobilu/qmd`
- Une build SQLite qui autorise les extensions (`brew install sqlite` sur macOS).
- QMD doit être présent dans le `PATH` de la passerelle.
- macOS et Linux fonctionnent immédiatement. Windows est mieux pris en charge via WSL2.

### Activer

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crée un répertoire personnel QMD autonome sous
`~/.openclaw/agents/<agentId>/qmd/` et gère automatiquement le cycle de vie du sidecar
-- les collections, les mises à jour et les exécutions d’embedding sont prises en charge pour vous.
Il privilégie les formes actuelles de collection QMD et de requête MCP, mais revient toujours aux
indicateurs de collection hérités `--mask` et aux anciens noms d’outils MCP lorsque nécessaire.

## Fonctionnement du sidecar

- OpenClaw crée des collections à partir des fichiers de mémoire de votre espace de travail et de tous les
  `memory.qmd.paths` configurés, puis exécute `qmd update` + `qmd embed` au démarrage
  et périodiquement (par défaut toutes les 5 minutes).
- L’actualisation au démarrage s’exécute en arrière-plan afin de ne pas bloquer le démarrage du chat.
- Les recherches utilisent le `searchMode` configuré (par défaut : `search` ; prend aussi en charge
  `vsearch` et `query`). Si un mode échoue, OpenClaw réessaie avec `qmd query`.
- Si QMD échoue complètement, OpenClaw revient au moteur SQLite intégré.

<Info>
La première recherche peut être lente -- QMD télécharge automatiquement des modèles GGUF (~2 Go) pour le
reranking et l’expansion de requêtes lors de la première exécution de `qmd query`.
</Info>

## Substitutions de modèles

Les variables d’environnement de modèle QMD sont transmises telles quelles depuis le processus
de la passerelle ; vous pouvez donc ajuster QMD globalement sans ajouter de nouvelle configuration OpenClaw :

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Après avoir modifié le modèle d’embedding, réexécutez les embeddings afin que l’index corresponde au
nouvel espace vectoriel.

## Indexer des chemins supplémentaires

Faites pointer QMD vers des répertoires supplémentaires pour les rendre recherchables :

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Les extraits issus de chemins supplémentaires apparaissent sous la forme `qmd/<collection>/<relative-path>` dans
les résultats de recherche. `memory_get` comprend ce préfixe et lit depuis la racine de collection correcte.

## Indexer les transcriptions de session

Activez l’indexation des sessions pour retrouver des conversations antérieures :

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Les transcriptions sont exportées comme tours User/Assistant nettoyés dans une collection QMD dédiée
sous `~/.openclaw/agents/<id>/qmd/sessions/`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD ne sont exposés que dans les sessions DM (pas dans les groupes ni les
canaux). Configurez `memory.qmd.scope` pour modifier cela :

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Lorsque la portée refuse une recherche, OpenClaw enregistre un avertissement avec le canal dérivé et le
type de chat afin que les résultats vides soient plus faciles à déboguer.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, les extraits de recherche incluent un pied de page
`Source: <path#line>`. Définissez `memory.citations = "off"` pour omettre ce pied de page
tout en transmettant le chemin à l’agent en interne.

## Quand l’utiliser

Choisissez QMD lorsque vous avez besoin de :

- Reranking pour des résultats de meilleure qualité.
- Rechercher dans la documentation du projet ou des notes en dehors de l’espace de travail.
- Retrouver des conversations de sessions passées.
- Recherche entièrement locale sans clés API.

Pour des configurations plus simples, le [moteur intégré](/fr/concepts/memory-builtin) fonctionne bien
sans dépendances supplémentaires.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire est présent dans le `PATH` de la passerelle. Si OpenClaw
s’exécute comme service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Première recherche très lente ?** QMD télécharge des modèles GGUF lors de la première utilisation. Préchargez-les
avec `qmd query "test"` en utilisant les mêmes répertoires XDG que ceux utilisés par OpenClaw.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (par défaut : 4000 ms).
Définissez-le sur `120000` pour du matériel plus lent.

**Résultats vides dans les discussions de groupe ?** Vérifiez `memory.qmd.scope` -- par défaut, seules
les sessions DM sont autorisées.

**Des dépôts temporaires visibles depuis l’espace de travail provoquent `ENAMETOOLONG` ou une indexation défaillante ?**
La traversée QMD suit actuellement le comportement du scanner QMD sous-jacent plutôt que
les règles de liens symboliques intégrées d’OpenClaw. Conservez les extractions temporaires de monorepos dans des
répertoires cachés comme `.tmp/` ou en dehors des racines QMD indexées jusqu’à ce que QMD expose
une traversée sûre face aux cycles ou des contrôles d’exclusion explicites.

## Configuration

Pour la surface de configuration complète (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres réglages, consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config).
