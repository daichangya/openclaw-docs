---
read_when:
    - You want deterministic multi-step workflows with explicit approvals
    - Vous devez reprendre un workflow sans réexécuter les étapes précédentes
summary: Runtime de workflow typé pour OpenClaw avec contrôles d’approbation reprenables.
title: Lobster
x-i18n:
    generated_at: "2026-04-24T07:37:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster est un shell de workflow qui permet à OpenClaw d’exécuter des séquences d’outils en plusieurs étapes comme une opération unique et déterministe avec des points de contrôle d’approbation explicites.

Lobster se situe à un niveau d’écriture au-dessus du travail détaché en arrière-plan. Pour l’orchestration de flux au-dessus des tâches individuelles, voir [Task Flow](/fr/automation/taskflow) (`openclaw tasks flow`). Pour le registre d’activité des tâches, voir [`openclaw tasks`](/fr/automation/tasks).

## Hook

Votre assistant peut construire les outils qui le gèrent lui-même. Demandez un workflow, et 30 minutes plus tard vous avez une CLI plus des pipelines qui s’exécutent en un seul appel. Lobster est la pièce manquante : pipelines déterministes, approbations explicites, et état reprenable.

## Pourquoi

Aujourd’hui, les workflows complexes exigent de nombreux appels d’outils aller-retour. Chaque appel coûte des tokens, et le LLM doit orchestrer chaque étape. Lobster déplace cette orchestration dans un runtime typé :

- **Un appel au lieu de plusieurs** : OpenClaw exécute un seul appel d’outil Lobster et obtient un résultat structuré.
- **Approbations intégrées** : les effets de bord (envoyer un email, publier un commentaire) arrêtent le workflow jusqu’à une approbation explicite.
- **Reprenable** : les workflows arrêtés renvoient un jeton ; approuvez et reprenez sans tout réexécuter.

## Pourquoi un DSL plutôt que des programmes classiques ?

Lobster est volontairement petit. L’objectif n’est pas « un nouveau langage », mais une spécification de pipeline prévisible et adaptée à l’IA, avec des approbations de première classe et des jetons de reprise.

- **Approve/resume est intégré** : un programme normal peut demander à un humain, mais il ne peut pas _suspendre et reprendre_ avec un jeton durable sans que vous inventiez vous-même ce runtime.
- **Déterminisme + auditabilité** : les pipelines sont des données, donc faciles à journaliser, comparer, rejouer, et revoir.
- **Surface contrainte pour l’IA** : une petite grammaire + un chaînage JSON réduisent les chemins de code « créatifs » et rendent la validation réaliste.
- **Politique de sécurité intégrée** : délais d’expiration, plafonds de sortie, vérifications de sandbox, et listes blanches sont appliqués par le runtime, pas par chaque script.
- **Toujours programmable** : chaque étape peut appeler n’importe quelle CLI ou script. Si vous voulez du JS/TS, générez des fichiers `.lobster` depuis du code.

## Comment cela fonctionne

OpenClaw exécute les workflows Lobster **en processus** à l’aide d’un exécuteur embarqué. Aucun sous-processus CLI externe n’est lancé ; le moteur de workflow s’exécute dans le processus du gateway et renvoie directement une enveloppe JSON.
Si le pipeline se met en pause pour une approbation, l’outil renvoie un `resumeToken` afin que vous puissiez continuer plus tard.

## Modèle : petite CLI + tubes JSON + approbations

Construisez de petites commandes qui parlent JSON, puis enchaînez-les dans un seul appel Lobster. (Les noms de commande ci-dessous sont des exemples — remplacez-les par les vôtres.)

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

L’IA déclenche le workflow ; Lobster exécute les étapes. Les contrôles d’approbation gardent les effets de bord explicites et auditables.

Exemple : mapper des éléments d’entrée en appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM JSON uniquement (`llm-task`)

Pour les workflows qui ont besoin d’une **étape LLM structurée**, activez l’outil de Plugin facultatif
`llm-task` et appelez-le depuis Lobster. Cela garde le workflow
déterministe tout en vous permettant de classifier/résumer/rédiger avec un modèle.

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

Voir [LLM Task](/fr/tools/llm-task) pour les détails et les options de configuration.

## Fichiers de workflow (.lobster)

Lobster peut exécuter des fichiers de workflow YAML/JSON avec les champs `name`, `args`, `steps`, `env`, `condition`, et `approval`. Dans les appels d’outil OpenClaw, définissez `pipeline` sur le chemin du fichier.

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
- `condition` (ou `when`) peut conditionner les étapes sur `$step.approved`.

## Installer Lobster

Les workflows Lobster intégrés s’exécutent en processus ; aucun binaire `lobster` séparé n’est requis. L’exécuteur embarqué est livré avec le Plugin Lobster.

Si vous avez besoin de la CLI Lobster autonome pour le développement ou des pipelines externes, installez-la depuis le [dépôt Lobster](https://github.com/openclaw/lobster) et assurez-vous que `lobster` est dans le `PATH`.

## Activer l’outil

Lobster est un outil de Plugin **facultatif** (non activé par défaut).

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

Évitez d’utiliser `tools.allow: ["lobster"]` à moins d’avoir l’intention d’exécuter en mode restrictif de liste blanche.

Remarque : les listes blanches sont sur adhésion explicite pour les plugins facultatifs. Si votre liste blanche ne nomme que
des outils de Plugin (comme `lobster`), OpenClaw garde les outils core activés. Pour restreindre les outils core,
incluez aussi dans la liste blanche les outils ou groupes core que vous voulez.

## Exemple : tri des emails

Sans Lobster :

```
Utilisateur : "Vérifie mes emails et rédige des réponses"
→ openclaw appelle gmail.list
→ le LLM résume
→ Utilisateur : "rédige des réponses pour les #2 et #5"
→ le LLM rédige
→ Utilisateur : "envoie le #2"
→ openclaw appelle gmail.send
(répété tous les jours, sans mémoire de ce qui a été trié)
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

Un workflow. Déterministe. Sûr.

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

Exécuter un fichier de workflow avec arguments :

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

- `cwd` : répertoire de travail relatif pour le pipeline (doit rester dans le répertoire de travail du gateway).
- `timeoutMs` : interrompt le workflow s’il dépasse cette durée (par défaut : 20000).
- `maxStdoutBytes` : interrompt le workflow si la sortie dépasse cette taille (par défaut : 512000).
- `argsJson` : chaîne JSON transmise à `lobster run --args-json` (fichiers de workflow uniquement).

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un des trois statuts suivants :

- `ok` → terminé avec succès
- `needs_approval` → en pause ; `requiresApproval.resumeToken` est requis pour reprendre
- `cancelled` → explicitement refusé ou annulé

L’outil expose l’enveloppe à la fois dans `content` (JSON formaté) et `details` (objet brut).

## Approbations

Si `requiresApproval` est présent, inspectez le prompt et décidez :

- `approve: true` → reprendre et continuer les effets de bord
- `approve: false` → annuler et finaliser le workflow

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux demandes d’approbation sans colle personnalisée `jq`/heredoc. Les jetons de reprise sont désormais compacts : Lobster stocke l’état de reprise du workflow dans son répertoire d’état et renvoie une petite clé de jeton.

## OpenProse

OpenProse se marie bien avec Lobster : utilisez `/prose` pour orchestrer une préparation multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme Prose a besoin de Lobster, autorisez l’outil `lobster` pour les sous-agents via `tools.subagents.tools`. Voir [OpenProse](/fr/prose).

## Sécurité

- **Local en processus uniquement** — les workflows s’exécutent dans le processus du gateway ; aucun appel réseau depuis le Plugin lui-même.
- **Pas de secrets** — Lobster ne gère pas OAuth ; il appelle des outils OpenClaw qui, eux, le font.
- **Compatible avec le sandbox** — désactivé lorsque le contexte de l’outil est sandboxé.
- **Renforcé** — délais d’expiration et plafonds de sortie appliqués par l’exécuteur embarqué.

## Dépannage

- **`lobster timed out`** → augmentez `timeoutMs`, ou scindez un long pipeline.
- **`lobster output exceeded maxStdoutBytes`** → augmentez `maxStdoutBytes` ou réduisez la taille de sortie.
- **`lobster returned invalid JSON`** → assurez-vous que le pipeline s’exécute en mode outil et n’affiche que du JSON.
- **`lobster failed`** → vérifiez les journaux du gateway pour les détails d’erreur de l’exécuteur embarqué.

## En savoir plus

- [Plugins](/fr/tools/plugin)
- [Création d’outil de Plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Étude de cas : workflows de la communauté

Un exemple public : une CLI « second brain » + des pipelines Lobster qui gèrent trois coffres Markdown (personnel, partenaire, partagé). La CLI émet du JSON pour les statistiques, les listes de boîte de réception, et les analyses d’obsolescence ; Lobster enchaîne ces commandes en workflows comme `weekly-review`, `inbox-triage`, `memory-consolidation`, et `shared-task-sync`, chacun avec des contrôles d’approbation. L’IA gère le jugement (catégorisation) lorsqu’elle est disponible et revient à des règles déterministes lorsqu’elle ne l’est pas.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Dépôt : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Lié

- [Automatisation et tâches](/fr/automation) — planifier des workflows Lobster
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
