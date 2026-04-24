---
read_when:
    - Configuration de workflows d’agents autonomes qui s’exécutent sans instruction pour chaque tâche
    - Définir ce que l’agent peut faire de manière autonome par rapport à ce qui nécessite une approbation humaine
    - Structurer des agents multi-programmes avec des limites claires et des règles d’escalade
summary: Définir une autorité opérationnelle permanente pour les programmes d’agents autonomes
title: Ordres permanents
x-i18n:
    generated_at: "2026-04-24T06:59:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Les ordres permanents accordent à votre agent une **autorité opérationnelle permanente** pour des programmes définis. Au lieu de donner des instructions de tâche individuelles à chaque fois, vous définissez des programmes avec un périmètre, des déclencheurs et des règles d’escalade clairs — et l’agent s’exécute de manière autonome dans ces limites.

C’est la différence entre dire à votre assistant « envoie le rapport hebdomadaire » chaque vendredi et lui accorder une autorité permanente : « Tu es responsable du rapport hebdomadaire. Compile-le chaque vendredi, envoie-le et n’escalade que si quelque chose semble anormal. »

## Pourquoi les ordres permanents ?

**Sans ordres permanents :**

- Vous devez solliciter l’agent pour chaque tâche
- L’agent reste inactif entre les demandes
- Le travail de routine est oublié ou retardé
- Vous devenez le goulot d’étranglement

**Avec des ordres permanents :**

- L’agent s’exécute de manière autonome dans des limites définies
- Le travail de routine est effectué selon le calendrier sans sollicitation
- Vous n’intervenez que pour les exceptions et les approbations
- L’agent met à profit son temps d’inactivité de manière productive

## Comment ils fonctionnent

Les ordres permanents sont définis dans les fichiers de votre [espace de travail d’agent](/fr/concepts/agent-workspace). L’approche recommandée consiste à les inclure directement dans `AGENTS.md` (qui est injecté automatiquement à chaque session) afin que l’agent les ait toujours dans son contexte. Pour les configurations plus importantes, vous pouvez aussi les placer dans un fichier dédié comme `standing-orders.md` et y faire référence depuis `AGENTS.md`.

Chaque programme précise :

1. **Périmètre** — ce que l’agent est autorisé à faire
2. **Déclencheurs** — quand s’exécuter (horaire, événement ou condition)
3. **Paliers d’approbation** — ce qui nécessite une validation humaine avant d’agir
4. **Règles d’escalade** — quand s’arrêter et demander de l’aide

L’agent charge ces instructions à chaque session via les fichiers d’initialisation de l’espace de travail (voir [Espace de travail d’agent](/fr/concepts/agent-workspace) pour la liste complète des fichiers injectés automatiquement) et s’y conforme, en combinaison avec les [tâches Cron](/fr/automation/cron-jobs) pour l’application basée sur le temps.

<Tip>
Placez les ordres permanents dans `AGENTS.md` pour garantir qu’ils sont chargés à chaque session. L’initialisation de l’espace de travail injecte automatiquement `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` et `MEMORY.md` — mais pas des fichiers arbitraires dans des sous-répertoires.
</Tip>

## Anatomie d’un ordre permanent

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Ordres permanents + tâches Cron

Les ordres permanents définissent **ce que** l’agent est autorisé à faire. Les [tâches Cron](/fr/automation/cron-jobs) définissent **quand** cela se produit. Ils fonctionnent ensemble :

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

L’invite de la tâche Cron doit faire référence à l’ordre permanent plutôt que de le dupliquer :

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Exemples

### Exemple 1 : contenu et réseaux sociaux (cycle hebdomadaire)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Exemple 2 : opérations financières (déclenchées par événement)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Exemple 3 : surveillance et alertes (continu)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Le modèle Exécuter-Vérifier-Rapporter

Les ordres permanents fonctionnent mieux lorsqu’ils sont combinés à une discipline d’exécution stricte. Chaque tâche dans un ordre permanent doit suivre cette boucle :

1. **Exécuter** — faire le travail réel (ne pas simplement accuser réception de l’instruction)
2. **Vérifier** — confirmer que le résultat est correct (le fichier existe, le message a été remis, les données ont été analysées)
3. **Rapporter** — indiquer au propriétaire ce qui a été fait et ce qui a été vérifié

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Ce modèle évite le mode d’échec le plus courant des agents : reconnaître une tâche sans la mener à bien.

## Architecture multi-programmes

Pour les agents qui gèrent plusieurs domaines, organisez les ordres permanents en programmes distincts avec des limites claires :

```markdown
# Standing Orders

## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Chaque programme doit avoir :

- Son propre **rythme de déclenchement** (hebdomadaire, mensuel, piloté par événement, continu)
- Ses propres **paliers d’approbation** (certains programmes nécessitent plus de supervision que d’autres)
- Des **limites** claires (l’agent doit savoir où un programme se termine et où un autre commence)

## Bonnes pratiques

### À faire

- Commencer avec une autorité limitée et l’élargir à mesure que la confiance s’installe
- Définir des paliers d’approbation explicites pour les actions à haut risque
- Inclure des sections « Ce qu’il NE FAUT PAS faire » — les limites comptent autant que les autorisations
- Combiner avec des tâches Cron pour une exécution fiable basée sur le temps
- Examiner les journaux de l’agent chaque semaine pour vérifier que les ordres permanents sont suivis
- Mettre à jour les ordres permanents à mesure que vos besoins évoluent — ce sont des documents vivants

### À éviter

- Accorder une autorité large dès le premier jour (« fais ce qui te semble le mieux »)
- Ignorer les règles d’escalade — chaque programme a besoin d’une clause « quand s’arrêter et demander »
- Supposer que l’agent se souviendra d’instructions verbales — mettez tout dans le fichier
- Mélanger plusieurs sujets dans un seul programme — un programme distinct pour chaque domaine
- Oublier de faire appliquer cela avec des tâches Cron — des ordres permanents sans déclencheurs deviennent des suggestions

## Associé

- [Automatisation et tâches](/fr/automation) — tous les mécanismes d’automatisation en un coup d’œil
- [Tâches Cron](/fr/automation/cron-jobs) — application de la planification pour les ordres permanents
- [Hooks](/fr/automation/hooks) — scripts pilotés par événements pour les événements du cycle de vie de l’agent
- [Webhooks](/fr/automation/cron-jobs#webhooks) — déclencheurs d’événements HTTP entrants
- [Espace de travail d’agent](/fr/concepts/agent-workspace) — où vivent les ordres permanents, y compris la liste complète des fichiers bootstrap injectés automatiquement (AGENTS.md, SOUL.md, etc.)
