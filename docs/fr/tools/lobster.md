---
read_when:
    - Vous voulez des workflows déterministes en plusieurs étapes avec des approbations explicites
    - Vous devez reprendre un workflow sans réexécuter les étapes précédentes
summary: Runtime de workflow typé pour OpenClaw avec des points de contrôle d’approbation reprenables.
title: Lobster
x-i18n:
    generated_at: "2026-04-06T03:13:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster est un shell de workflow qui permet à OpenClaw d’exécuter des séquences d’outils en plusieurs étapes comme une opération unique et déterministe avec des points de contrôle d’approbation explicites.

Lobster se situe un niveau de conception au-dessus du travail en arrière-plan détaché. Pour l’orchestration de flux au-dessus des tâches individuelles, consultez [Task Flow](/fr/automation/taskflow) (`openclaw tasks flow`). Pour le registre d’activité des tâches, consultez [`openclaw tasks`](/fr/automation/tasks).

## Accroche

Votre assistant peut créer les outils qui lui permettent de se gérer lui-même. Demandez un workflow, et 30 minutes plus tard vous avez une CLI ainsi que des pipelines qui s’exécutent en un seul appel. Lobster est la pièce manquante : des pipelines déterministes, des approbations explicites et un état reprenable.

## Pourquoi

Aujourd’hui, les workflows complexes nécessitent de nombreux appels d’outils avec aller-retour. Chaque appel coûte des tokens, et le LLM doit orchestrer chaque étape. Lobster déplace cette orchestration vers un runtime typé :

- **Un appel au lieu de plusieurs** : OpenClaw exécute un seul appel d’outil Lobster et obtient un résultat structuré.
- **Approbations intégrées** : les effets de bord (envoyer un e-mail, publier un commentaire) interrompent le workflow jusqu’à approbation explicite.
- **Reprenable** : les workflows interrompus renvoient un token ; approuvez et reprenez sans tout réexécuter.

## Pourquoi un DSL au lieu de programmes classiques ?

Lobster est volontairement minimal. L’objectif n’est pas de créer « un nouveau langage », mais une spécification de pipeline prévisible et adaptée à l’IA, avec des approbations et des tokens de reprise comme fonctionnalités de premier plan.

- **L’approbation/la reprise est intégrée** : un programme normal peut solliciter un humain, mais il ne peut pas _suspendre et reprendre_ avec un token durable sans que vous inventiez vous-même ce runtime.
- **Déterminisme + auditabilité** : les pipelines sont des données, donc ils sont faciles à journaliser, comparer, rejouer et relire.
- **Surface contrainte pour l’IA** : une petite grammaire + des canaux JSON réduisent les chemins de code « créatifs » et rendent la validation réaliste.
- **Politique de sécurité intégrée** : les délais d’expiration, plafonds de sortie, vérifications de sandbox et listes d’autorisation sont appliqués par le runtime, pas par chaque script.
- **Toujours programmable** : chaque étape peut appeler n’importe quelle CLI ou script. Si vous voulez du JS/TS, générez des fichiers `.lobster` à partir du code.

## Fonctionnement

OpenClaw exécute les workflows Lobster **dans le processus** à l’aide d’un exécuteur intégré. Aucun sous-processus CLI externe n’est lancé ; le moteur de workflow s’exécute à l’intérieur du processus gateway et renvoie directement une enveloppe JSON.
Si le pipeline se met en pause pour une approbation, l’outil renvoie un `resumeToken` afin que vous puissiez continuer plus tard.

## Modèle : petite CLI + canaux JSON + approbations

Créez de petites commandes qui parlent JSON, puis chaînez-les en un seul appel Lobster. (Noms de commandes d’exemple ci-dessous — remplacez-les par les vôtres.)

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

Si le pipeline demande une approbation, reprenez avec le token :

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

L’IA déclenche le workflow ; Lobster exécute les étapes. Les portes d’approbation rendent les effets de bord explicites et auditables.

Exemple : mapper des éléments d’entrée en appels d’outils :

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Étapes LLM JSON uniquement (llm-task)

Pour les workflows qui nécessitent une **étape LLM structurée**, activez l’outil de plugin optionnel
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

Consultez [LLM Task](/fr/tools/llm-task) pour les détails et les options de configuration.

## Fichiers de workflow (.lobster)

Lobster peut exécuter des fichiers de workflow YAML/JSON avec les champs `name`, `args`, `steps`, `env`, `condition` et `approval`. Dans les appels d’outils OpenClaw, définissez `pipeline` sur le chemin du fichier.

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
- `condition` (ou `when`) peut conditionner les étapes selon `$step.approved`.

## Installer Lobster

Les workflows Lobster intégrés s’exécutent dans le processus ; aucun binaire `lobster` distinct n’est requis. L’exécuteur intégré est fourni avec le plugin Lobster.

Si vous avez besoin de la CLI Lobster autonome pour le développement ou des pipelines externes, installez-la depuis le [repo Lobster](https://github.com/openclaw/lobster) et assurez-vous que `lobster` est présent dans le `PATH`.

## Activer l’outil

Lobster est un outil de plugin **optionnel** (non activé par défaut).

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

Évitez d’utiliser `tools.allow: ["lobster"]` sauf si vous avez l’intention d’utiliser un mode de liste d’autorisation restrictif.

Remarque : les listes d’autorisation sont facultatives pour les plugins optionnels. Si votre liste d’autorisation ne nomme que
des outils de plugin (comme `lobster`), OpenClaw conserve les outils de base activés. Pour restreindre les outils de base,
incluez aussi dans la liste d’autorisation les outils ou groupes de base que vous souhaitez.

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

Un workflow. Déterministe. Sûr.

## Paramètres de l’outil

### `run`

Exécute un pipeline en mode outil.

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

Continue un workflow interrompu après approbation.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entrées facultatives

- `cwd` : répertoire de travail relatif pour le pipeline (doit rester dans le répertoire de travail de la gateway).
- `timeoutMs` : abandonne le workflow s’il dépasse cette durée (par défaut : 20000).
- `maxStdoutBytes` : abandonne le workflow si la sortie dépasse cette taille (par défaut : 512000).
- `argsJson` : chaîne JSON transmise à `lobster run --args-json` (fichiers de workflow uniquement).

## Enveloppe de sortie

Lobster renvoie une enveloppe JSON avec l’un de ces trois statuts :

- `ok` → terminé avec succès
- `needs_approval` → en pause ; `requiresApproval.resumeToken` est nécessaire pour reprendre
- `cancelled` → explicitement refusé ou annulé

L’outil expose l’enveloppe dans `content` (JSON formaté) et `details` (objet brut).

## Approbations

Si `requiresApproval` est présent, examinez l’invite et décidez :

- `approve: true` → reprendre et poursuivre les effets de bord
- `approve: false` → annuler et finaliser le workflow

Utilisez `approve --preview-from-stdin --limit N` pour joindre un aperçu JSON aux demandes d’approbation sans assemblage personnalisé avec jq/heredoc. Les tokens de reprise sont désormais compacts : Lobster stocke l’état de reprise du workflow dans son répertoire d’état et renvoie une petite clé de token.

## OpenProse

OpenProse fonctionne bien avec Lobster : utilisez `/prose` pour orchestrer une préparation multi-agent, puis exécutez un pipeline Lobster pour des approbations déterministes. Si un programme Prose a besoin de Lobster, autorisez l’outil `lobster` pour les sous-agents via `tools.subagents.tools`. Consultez [OpenProse](/fr/prose).

## Sécurité

- **Local dans le processus uniquement** — les workflows s’exécutent à l’intérieur du processus gateway ; aucun appel réseau depuis le plugin lui-même.
- **Pas de secrets** — Lobster ne gère pas OAuth ; il appelle des outils OpenClaw qui le font.
- **Compatible avec la sandbox** — désactivé lorsque le contexte de l’outil est en sandbox.
- **Renforcé** — délais d’expiration et plafonds de sortie appliqués par l’exécuteur intégré.

## Dépannage

- **`lobster timed out`** → augmentez `timeoutMs`, ou divisez un pipeline long.
- **`lobster output exceeded maxStdoutBytes`** → augmentez `maxStdoutBytes` ou réduisez la taille de sortie.
- **`lobster returned invalid JSON`** → assurez-vous que le pipeline s’exécute en mode outil et n’affiche que du JSON.
- **`lobster failed`** → consultez les journaux de la gateway pour les détails d’erreur de l’exécuteur intégré.

## En savoir plus

- [Plugins](/fr/tools/plugin)
- [Création d’outils de plugin](/fr/plugins/building-plugins#registering-agent-tools)

## Cas d’étude : workflows de la communauté

Un exemple public : une CLI « second brain » + des pipelines Lobster qui gèrent trois coffres Markdown (personnel, partenaire, partagé). La CLI émet du JSON pour les statistiques, les listes de boîte de réception et les analyses d’obsolescence ; Lobster chaîne ces commandes en workflows comme `weekly-review`, `inbox-triage`, `memory-consolidation` et `shared-task-sync`, chacun avec des portes d’approbation. L’IA gère le jugement (catégorisation) lorsqu’elle est disponible et revient à des règles déterministes sinon.

- Fil : [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo : [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Lié

- [Automatisation et tâches](/fr/automation) — planification des workflows Lobster
- [Vue d’ensemble de l’automatisation](/fr/automation) — tous les mécanismes d’automatisation
- [Vue d’ensemble des outils](/fr/tools) — tous les outils d’agent disponibles
