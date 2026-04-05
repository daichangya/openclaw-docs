---
read_when:
    - Vous souhaitez configurer QMD comme backend de mémoire
    - Vous souhaitez des fonctionnalités de mémoire avancées comme le reranking ou des chemins indexés supplémentaires
summary: Sidecar de recherche local-first avec BM25, vecteurs, reranking et expansion de requêtes
title: Moteur de mémoire QMD
x-i18n:
    generated_at: "2026-04-05T12:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Moteur de mémoire QMD

[QMD](https://github.com/tobi/qmd) est un sidecar de recherche local-first qui s'exécute
aux côtés d'OpenClaw. Il combine BM25, la recherche vectorielle et le reranking dans un seul
binaire, et peut indexer du contenu au-delà des fichiers de mémoire de votre espace de travail.

## Ce qu'il ajoute par rapport au moteur intégré

- **Reranking et expansion de requêtes** pour un meilleur rappel.
- **Indexer des répertoires supplémentaires** -- documentation de projet, notes d'équipe, tout ce qui se trouve sur le disque.
- **Indexer les transcriptions de session** -- rappeler des conversations précédentes.
- **Entièrement local** -- fonctionne via Bun + node-llama-cpp, télécharge automatiquement les modèles GGUF.
- **Repli automatique** -- si QMD n'est pas disponible, OpenClaw revient de manière transparente au
  moteur intégré.

## Premiers pas

### Prérequis

- Installez QMD : `bun install -g @tobilu/qmd`
- Une build SQLite qui autorise les extensions (`brew install sqlite` sur macOS).
- QMD doit se trouver dans le `PATH` de la gateway.
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
-- collections, mises à jour et exécutions d'embedding sont gérées pour vous.

## Fonctionnement du sidecar

- OpenClaw crée des collections à partir de vos fichiers de mémoire d'espace de travail et de tous les
  `memory.qmd.paths` configurés, puis exécute `qmd update` + `qmd embed` au démarrage
  et périodiquement (toutes les 5 minutes par défaut).
- Le rafraîchissement au démarrage s'exécute en arrière-plan afin de ne pas bloquer le démarrage du chat.
- Les recherches utilisent le `searchMode` configuré (par défaut : `search` ; prend aussi en charge
  `vsearch` et `query`). Si un mode échoue, OpenClaw réessaie avec `qmd query`.
- Si QMD échoue complètement, OpenClaw revient au moteur SQLite intégré.

<Info>
La première recherche peut être lente -- QMD télécharge automatiquement des modèles GGUF (~2 Go) pour le
reranking et l'expansion de requêtes lors de la première exécution de `qmd query`.
</Info>

## Indexer des chemins supplémentaires

Pointez QMD vers des répertoires supplémentaires pour les rendre interrogeables :

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

Les extraits provenant de chemins supplémentaires apparaissent sous la forme `qmd/<collection>/<relative-path>` dans les
résultats de recherche. `memory_get` comprend ce préfixe et lit depuis la racine de collection
correcte.

## Indexer les transcriptions de session

Activez l'indexation des sessions pour rappeler des conversations précédentes :

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

Les transcriptions sont exportées sous forme de tours User/Assistant assainis dans une collection QMD dédiée
sous `~/.openclaw/agents/<id>/qmd/sessions/`.

## Portée de la recherche

Par défaut, les résultats de recherche QMD ne sont affichés que dans les sessions de messages privés (pas dans les groupes ni
les canaux). Configurez `memory.qmd.scope` pour modifier cela :

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

Lorsque la portée refuse une recherche, OpenClaw consigne un avertissement avec le canal dérivé et
le type de chat afin de faciliter le débogage des résultats vides.

## Citations

Lorsque `memory.citations` vaut `auto` ou `on`, les extraits de recherche incluent un
pied de page `Source: <path#line>`. Définissez `memory.citations = "off"` pour omettre ce pied de page
tout en transmettant le chemin à l'agent en interne.

## Quand l'utiliser

Choisissez QMD lorsque vous avez besoin :

- D'un reranking pour des résultats de meilleure qualité.
- De rechercher dans la documentation de projet ou les notes en dehors de l'espace de travail.
- De rappeler des conversations de sessions passées.
- D'une recherche entièrement locale sans clés API.

Pour des configurations plus simples, le [moteur intégré](/concepts/memory-builtin) fonctionne bien
sans dépendances supplémentaires.

## Dépannage

**QMD introuvable ?** Assurez-vous que le binaire est dans le `PATH` de la gateway. Si OpenClaw
s'exécute comme service, créez un lien symbolique :
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Première recherche très lente ?** QMD télécharge des modèles GGUF lors de la première utilisation. Préchargez
avec `qmd query "test"` en utilisant les mêmes répertoires XDG qu'OpenClaw.

**La recherche expire ?** Augmentez `memory.qmd.limits.timeoutMs` (par défaut : 4000 ms).
Définissez-le sur `120000` pour du matériel plus lent.

**Résultats vides dans les discussions de groupe ?** Vérifiez `memory.qmd.scope` -- par défaut, il
autorise uniquement les sessions de messages privés.

**Les dépôts temporaires visibles depuis l'espace de travail provoquent `ENAMETOOLONG` ou une indexation défaillante ?**
Le parcours QMD suit actuellement le comportement du scanner QMD sous-jacent plutôt que
les règles de liens symboliques intégrées d'OpenClaw. Conservez les extractions temporaires de monorepo sous
des répertoires cachés comme `.tmp/` ou en dehors des racines QMD indexées jusqu'à ce que QMD expose
un parcours sûr vis-à-vis des cycles ou des contrôles d'exclusion explicites.

## Configuration

Pour la surface de configuration complète (`memory.qmd.*`), les modes de recherche, les intervalles de mise à jour,
les règles de portée et tous les autres réglages, consultez la
[référence de configuration de la mémoire](/reference/memory-config).
