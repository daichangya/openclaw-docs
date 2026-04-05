---
read_when:
    - Vous voulez des workflows multi-étapes déterministes avec des approbations explicites
    - Vous devez reprendre un workflow sans réexécuter les étapes précédentes
summary: Runtime de workflow typé pour OpenClaw avec portes d’approbation reprenables.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T12:57:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster est un shell de workflow qui permet à OpenClaw d’exécuter des séquences d’outils en plusieurs étapes comme une seule opération déterministe avec des points de contrôle d’approbation explicites.

Lobster se situe un niveau d’écriture au-dessus du travail détaché en arrière-plan. Pour l’orchestration de flux au-dessus des tâches individuelles, consultez [Task Flow](/fr/automation/taskflow) (`openclaw tasks flow`). Pour le registre d’activité des tâches, consultez [`openclaw tasks`](/fr/automation/tasks).

## Hook

Votre assistant peut créer les outils qui le gèrent lui-même. Demandez un workflow, et 30 minutes plus tard vous avez un CLI ainsi que des pipelines qui s’exécutent comme un seul appel. Lobster est la pièce manquante : des pipelines déterministes, des approbations explicites et un état reprenable.

## Pourquoi

Aujourd’hui, les workflows complexes nécessitent de nombreux appels d’outils aller-retour. Chaque appel coûte des jetons, et le LLM doit orchestrer chaque étape. Lobster déplace cette orchestration dans un runtime typé :

- **Un appel au lieu de plusieurs** : OpenClaw exécute un seul appel d’outil Lobster et obtient un résultat structuré.
- **Approbations intégrées** : les effets de bord (envoyer un e-mail, publier un commentaire) interrompent le workflow jusqu’à approbation explicite.
- **Reprenable** : les workflows interrompus renvoient un jeton ; approuvez puis reprenez sans tout réexécuter.

## Pourquoi un DSL plutôt que des programmes simples ?

Lobster est volontairement minimal. L’objectif n’est pas « un nouveau langage », mais une spécification de pipeline prévisible et adaptée à l’IA, avec approbations de premier plan et jetons de reprise.

- **L’approbation/reprise est intégrée** : un programme normal peut solliciter un humain, mais il ne peut pas _s’interrompre et reprendre_ avec un jeton durable sans que vous inventiez vous-même ce runtime.
- **Déterminisme + auditabilité** : les pipelines sont des données, ils sont donc faciles à journaliser, comparer, rejouer et examiner.
- **Surface contrainte pour l’IA** : une petite grammaire + des pipelines JSON réduisent les chemins de code « créatifs » et rendent la validation réaliste.
- **Politique de sécurité intégrée** : délais d’expiration, plafonds de sortie, vérifications de sandbox et listes d’autorisation sont appliqués par le runtime, pas par chaque script.
- **Toujours programmable** : chaque étape peut appeler n’importe quel CLI ou script. Si vous voulez du JS/TS, générez des fichiers `.lobster` à partir du code.

## Fonctionnement

OpenClaw lance le CLI local `lobster` en **mode outil** et analyse une enveloppe JSON depuis stdout.
Si le pipeline se met en pause pour une approbation, l’outil renvoie un `resumeToken` pour que vous puissiez continuer plus tard.

## Modèle : petit CLI + pipelines JSON + approbations

Créez de petites commandes qui parlent JSON, puis enchaînez-les dans un seul appel Lobster. (Noms de commandes d’exemple ci-dessous — remplacez-les par les vôtres.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Si le pipeline demande une approbation, reprenez avec le jeton :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

L’IA déclenche le workflow ; Lobster exécute les étapes. Les portes d’approbation rendent les effets de bord explicites et auditables.

Exemple : mapper des éléments d’entrée vers des appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM uniquement en JSON (llm-task)

Pour les workflows qui nécessitent une **étape LLM structurée**, activez l’outil de plugin facultatif
`llm-task` et appelez-le depuis Lobster. Cela permet au workflow de rester
déterministe tout en vous laissant classifier/résumer/rédiger avec un modèle.

Activez l’outil :

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Utilisez-le dans un pipeline :

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Consultez [LLM Task](/tools/llm-task) pour les détails et les options de configuration.

## Fichiers de workflow (.lobster)

Lobster peut exécuter des fichiers de workflow YAML/JSON avec les champs `name`, `args`, `steps`, `env`, `condition` et `approval`. Dans les appels d’outil OpenClaw, définissez `pipeline` sur le chemin du fichier.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Remarques :

- `stdin: $step.stdout` et `stdin: $step.json` transmettent la sortie d’une étape précédente.
- `condition` (ou `when`) peut contrôler des étapes selon `$step.approved`.

## Installer Lobster

Installez le CLI Lobster sur le **même hôte** que celui qui exécute la Gateway OpenClaw (voir le [dépôt Lobster](https://github.com/openclaw/lobster)), et assurez-vous que `lobster` est sur le `PATH`.

## Activer l’outil

Lobster est un outil de plugin **facultatif** (il n’est pas activé par défaut).

Recommandé (additif, sûr) :

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Ou par agent :

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Évitez d’utiliser `tools.allow: ["lobster"]` sauf si vous avez l’intention d’exécuter en mode restrictif par liste d’autorisation.

Remarque : les listes d’autorisation sont facultatives pour les plugins optionnels. Si votre liste d’autorisation ne nomme que
des outils de plugin (comme `lobster`), OpenClaw garde les outils principaux activés. Pour restreindre les outils principaux,
incluez aussi les outils ou groupes principaux que vous voulez dans la liste d’autorisation.

## Exemple : tri des e-mails

Sans Lobster :

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Avec Lobster :

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Renvoie une enveloppe JSON (tronquée) :

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

L’utilisateur approuve → reprise :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un seul workflow. Déterministe. Sûr.

## Paramètres de l’outil

### `run`

Exécuter un pipeline en mode outil.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Exécuter un fichier de workflow avec des arguments :

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continuer un workflow interrompu après approbation.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entrées facultatives

- `cwd` : Répertoire de travail relatif pour le pipeline (doit rester dans le répertoire de travail du processus courant).
- `timeoutMs` : Tuer le sous-processus s’il dépasse cette durée (par défaut : 20000).
- `maxStdoutBytes` : Tuer le sous-processus si stdout dépasse cette taille (par défaut : 512000).
- `argsJson` : Chaîne JSON transmise à `lobster run --args-json` (fichiers de workflow uniquement).

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un des trois statuts suivants :

- `ok` → terminé avec succès
- `needs_approval` → mis en pause ; `requiresApproval.resumeToken` est requis pour reprendre
- `cancelled` → explicitement refusé ou annulé

L’outil expose l’enveloppe à la fois dans `content` (JSON mis en forme) et `details` (objet brut).

## Approbations

Si `requiresApproval` est présent, examinez l’invite et décidez :

- `approve: true` → reprendre et poursuivre les effets de bord
- `approve: false` → annuler et finaliser le workflow

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux demandes d’approbation sans colle personnalisée `jq`/heredoc. Les jetons de reprise sont désormais compacts : Lobster stocke l’état de reprise du workflow dans son répertoire d’état et renvoie une petite clé de jeton.

## OpenProse

OpenProse se marie bien avec Lobster : utilisez `/prose` pour orchestrer une préparation multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme Prose a besoin de Lobster, autorisez l’outil `lobster` pour les sous-agents via `tools.subagents.tools`. Consultez [OpenProse](/fr/prose).

## Sécurité

- **Sous-processus local uniquement** — aucun appel réseau depuis le plugin lui-même.
- **Pas de secrets** — Lobster ne gère pas OAuth ; il appelle les outils OpenClaw qui le font.
- **Compatible sandbox** — désactivé lorsque le contexte de l’outil est sandboxé.
- **Renforcé** — nom d’exécutable fixe (`lobster`) sur le `PATH` ; délais d’expiration et plafonds de sortie appliqués.

## Dépannage

- **`lobster subprocess timed out`** → augmentez `timeoutMs`, ou divisez un pipeline long.
- **`lobster output exceeded maxStdoutBytes`** → augmentez `maxStdoutBytes` ou réduisez la taille de sortie.
- **`lobster returned invalid JSON`** → assurez-vous que le pipeline s’exécute en mode outil et n’affiche que du JSON.
- **`lobster failed (code …)`** → exécutez le même pipeline dans un terminal pour inspecter stderr.

## En savoir plus

- [Plugins](/tools/plugin)
- [Création d’outils de plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Étude de cas : workflows de la communauté

Un exemple public : un CLI de « second cerveau » + des pipelines Lobster qui gèrent trois coffres Markdown (personnel, partenaire, partagé). Le CLI produit du JSON pour les statistiques, les listes de boîte de réception et les analyses d’ancienneté ; Lobster enchaîne ces commandes dans des workflows comme `weekly-review`, `inbox-triage`, `memory-consolidation` et `shared-task-sync`, chacun avec des portes d’approbation. L’IA gère le jugement (catégorisation) lorsqu’elle est disponible et revient à des règles déterministes dans le cas contraire.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Dépôt : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Voir aussi

- [Automation & Tasks](/fr/automation) — planification des workflows Lobster
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/tools) — tous les outils d’agent disponibles
