---
read_when:
    - Vous souhaitez exécuter ou écrire des workflows `.prose`
    - Vous souhaitez activer le plugin OpenProse
    - Vous devez comprendre le stockage de l’état
summary: 'OpenProse : workflows `.prose`, slash commands et état dans OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T07:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse est un format de workflow portable, centré sur Markdown, pour orchestrer des sessions IA. Dans OpenClaw, il est livré sous forme de plugin qui installe un pack de Skills OpenProse ainsi qu’une slash command `/prose`. Les programmes vivent dans des fichiers `.prose` et peuvent lancer plusieurs sous-agents avec un contrôle de flux explicite.

Site officiel : [https://www.prose.md](https://www.prose.md)

## Ce qu’il peut faire

- Recherche multi-agent + synthèse avec parallélisme explicite.
- Workflows répétables et sûrs vis-à-vis des approbations (revue de code, triage d’incident, pipelines de contenu).
- Programmes `.prose` réutilisables que vous pouvez exécuter sur les runtimes d’agent pris en charge.

## Installer + activer

Les plugins intégrés sont désactivés par défaut. Activez OpenProse :

```bash
openclaw plugins enable open-prose
```

Redémarrez le Gateway après avoir activé le plugin.

Copie locale de développement : `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentation associée : [Plugins](/fr/tools/plugin), [Manifeste de plugin](/fr/plugins/manifest), [Skills](/fr/tools/skills).

## Slash command

OpenProse enregistre `/prose` comme commande de Skill invocable par l’utilisateur. Elle route vers les instructions de la VM OpenProse et utilise les outils OpenClaw en arrière-plan.

Commandes courantes :

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Exemple : un fichier `.prose` simple

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Emplacements des fichiers

OpenProse conserve l’état sous `.prose/` dans votre espace de travail :

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Les agents persistants au niveau utilisateur vivent dans :

```
~/.prose/agents/
```

## Modes d’état

OpenProse prend en charge plusieurs backends d’état :

- **filesystem** (par défaut) : `.prose/runs/...`
- **in-context** : transitoire, pour les petits programmes
- **sqlite** (expérimental) : nécessite le binaire `sqlite3`
- **postgres** (expérimental) : nécessite `psql` et une chaîne de connexion

Remarques :

- sqlite/postgres sont optionnels et expérimentaux.
- Les identifiants postgres se propagent dans les journaux des sous-agents ; utilisez une base dédiée avec privilèges minimaux.

## Programmes distants

`/prose run <handle/slug>` se résout vers `https://p.prose.md/<handle>/<slug>`.
Les URL directes sont récupérées telles quelles. Cela utilise l’outil `web_fetch` (ou `exec` pour POST).

## Correspondance avec le runtime OpenClaw

Les programmes OpenProse se mappent vers les primitives OpenClaw :

| Concept OpenProse         | Outil OpenClaw  |
| ------------------------- | --------------- |
| Lancer une session / outil Task | `sessions_spawn` |
| Lecture/écriture de fichier | `read` / `write` |
| Récupération web          | `web_fetch`     |

Si votre liste d’autorisation d’outils bloque ces outils, les programmes OpenProse échoueront. Voir [Configuration des Skills](/fr/tools/skills-config).

## Sécurité + approbations

Traitez les fichiers `.prose` comme du code. Relisez-les avant exécution. Utilisez les listes d’autorisation d’outils OpenClaw et les barrières d’approbation pour contrôler les effets de bord.

Pour des workflows déterministes et contrôlés par approbation, comparez avec [Lobster](/fr/tools/lobster).

## Associé

- [Synthèse vocale](/fr/tools/tts)
- [Mise en forme Markdown](/fr/concepts/markdown-formatting)
