---
read_when:
    - Vous voulez exécuter ou écrire des workflows `.prose`
    - Vous voulez activer le plugin OpenProse
    - Vous devez comprendre le stockage de l’état
summary: 'OpenProse : workflows `.prose`, slash commands et état dans OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T12:51:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse est un format de workflow portable et axé sur Markdown pour orchestrer des sessions d’IA. Dans OpenClaw, il est livré sous forme de plugin qui installe un pack de Skills OpenProse plus une slash command `/prose`. Les programmes vivent dans des fichiers `.prose` et peuvent lancer plusieurs sous-agents avec un contrôle de flux explicite.

Site officiel : [https://www.prose.md](https://www.prose.md)

## Ce qu’il peut faire

- Recherche multi-agent + synthèse avec parallélisme explicite.
- Workflows répétables et sûrs vis-à-vis des approbations (revue de code, triage d’incident, pipelines de contenu).
- Programmes `.prose` réutilisables que vous pouvez exécuter sur les runtimes d’agents pris en charge.

## Installer + activer

Les plugins intégrés sont désactivés par défaut. Activez OpenProse :

```bash
openclaw plugins enable open-prose
```

Redémarrez la Gateway après avoir activé le plugin.

Checkout dev/local : `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentation associée : [Plugins](/tools/plugin), [Manifest de plugin](/plugins/manifest), [Skills](/tools/skills).

## Slash command

OpenProse enregistre `/prose` comme commande de Skill invocable par l’utilisateur. Elle route vers les instructions de la VM OpenProse et utilise les outils OpenClaw sous le capot.

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

OpenProse conserve son état sous `.prose/` dans votre espace de travail :

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
- les identifiants postgres circulent dans les journaux de sous-agent ; utilisez une base dédiée avec le moins de privilèges possible.

## Programmes distants

`/prose run <handle/slug>` se résout en `https://p.prose.md/<handle>/<slug>`.
Les URL directes sont récupérées telles quelles. Cela utilise l’outil `web_fetch` (ou `exec` pour POST).

## Mapping du runtime OpenClaw

Les programmes OpenProse se mappent sur des primitives OpenClaw :

| Concept OpenProse          | Outil OpenClaw   |
| -------------------------- | ---------------- |
| Spawn session / outil Task | `sessions_spawn` |
| Lecture/écriture de fichier | `read` / `write` |
| Web fetch                  | `web_fetch`      |

Si votre allowlist d’outils bloque ces outils, les programmes OpenProse échoueront. Voir [Configuration des Skills](/tools/skills-config).

## Sécurité + approbations

Traitez les fichiers `.prose` comme du code. Vérifiez-les avant exécution. Utilisez les allowlists d’outils et les garde-fous d’approbation d’OpenClaw pour contrôler les effets de bord.

Pour des workflows déterministes avec approbation obligatoire, comparez avec [Lobster](/tools/lobster).
