---
read_when:
    - Vous voulez des tâches planifiées et des réveils programmés
    - Vous déboguez l’exécution et les journaux cron
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches en arrière-plan)
title: cron
x-i18n:
    generated_at: "2026-04-05T12:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gérez les tâches cron pour le planificateur de la Gateway.

Voir aussi :

- Tâches cron : [Cron jobs](/automation/cron-jobs)

Astuce : exécutez `openclaw cron --help` pour voir la surface de commande complète.

Remarque : les tâches isolées `cron add` utilisent par défaut la remise `--announce`. Utilisez `--no-deliver` pour garder
la sortie interne. `--deliver` reste un alias obsolète de `--announce`.

Remarque : les exécutions isolées gérées par cron attendent un résumé en texte brut et l’exécuteur est propriétaire
du chemin d’envoi final. `--no-deliver` garde l’exécution interne ; il ne redonne pas
la remise à l’outil de message de l’agent.

Remarque : les tâches à exécution unique (`--at`) sont supprimées après succès par défaut. Utilisez `--keep-after-run` pour les conserver.

Remarque : `--session` prend en charge `main`, `isolated`, `current` et `session:<id>`.
Utilisez `current` pour lier à la session active au moment de la création, ou `session:<id>` pour
une clé de session persistante explicite.

Remarque : pour les tâches CLI à exécution unique, les dates/heures `--at` sans décalage sont traitées comme UTC sauf si vous passez aussi
`--tz <iana>`, qui interprète cette heure locale dans le fuseau horaire donné.

Remarque : les tâches récurrentes utilisent désormais un backoff exponentiel de nouvelle tentative après des erreurs consécutives (30s → 1m → 5m → 15m → 60m), puis reviennent à la planification normale après la prochaine exécution réussie.

Remarque : `openclaw cron run` retourne désormais dès que l’exécution manuelle est mise en file d’attente. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }` ; utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

Remarque : `openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien comportement
« exécuter uniquement si l’échéance est atteinte ».

Remarque : les tours cron isolés suppriment les réponses obsolètes limitées à un accusé de réception. Si le
premier résultat n’est qu’une mise à jour de statut intermédiaire et qu’aucune exécution descendante de sous-agent n’est
responsable de la réponse finale, cron relance une fois pour obtenir le vrai résultat
avant la remise.

Remarque : si une exécution cron isolée retourne uniquement le jeton silencieux (`NO_REPLY` /
`no_reply`), cron supprime la remise directe sortante et le chemin de résumé mis en file d’attente de secours,
de sorte que rien n’est publié dans le chat.

Remarque : `cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche.
Si le modèle n’est pas autorisé, cron affiche un avertissement et revient à la sélection
de modèle de l’agent/par défaut de la tâche. Les chaînes de repli configurées s’appliquent toujours, mais une simple
surcharge de modèle sans liste de repli explicite par tâche n’ajoute plus le modèle principal
de l’agent comme cible de nouvelle tentative supplémentaire cachée.

Remarque : l’ordre de priorité des modèles cron isolés est : surcharge du hook Gmail d’abord, puis
`--model` par tâche, puis toute surcharge de modèle de session cron stockée, puis la sélection normale
de l’agent/par défaut.

Remarque : le mode rapide cron isolé suit la sélection de modèle live résolue. La configuration de modèle
`params.fastMode` s’applique par défaut, mais une surcharge `fastMode` de session stockée l’emporte toujours sur la configuration.

Remarque : si une exécution isolée lève `LiveSessionModelSwitchError`, cron persiste le
fournisseur/modèle remplacé (et la surcharge de profil d’authentification remplacée, le cas échéant) avant de
réessayer. La boucle externe de nouvelle tentative est limitée à 2 nouvelles tentatives de changement après la
tentative initiale, puis elle abandonne au lieu de boucler indéfiniment.

Remarque : les notifications d’échec utilisent d’abord `delivery.failureDestination`, puis
`cron.failureDestination` global, et se replient enfin sur la cible d’annonce principale
de la tâche lorsqu’aucune destination d’échec explicite n’est configurée.

Remarque : la rétention/l’élagage est contrôlée dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

Note de mise à niveau : si vous avez d’anciennes tâches cron datant d’avant le format actuel de remise/stockage, exécutez
`openclaw doctor --fix`. Doctor normalise désormais les champs cron historiques (`jobId`, `schedule.cron`,
les champs de remise de niveau supérieur, y compris l’ancien `threadId`, les alias de remise `provider` dans la charge utile) et migre les tâches de repli webhook simples avec
`notify: true` vers une remise webhook explicite lorsque `cron.webhook` est
configuré.

## Modifications courantes

Mettre à jour les paramètres de remise sans changer le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la remise pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer un contexte bootstrap léger pour une tâche isolée :

```bash
openclaw cron edit <job-id> --light-context
```

Annoncer sur un canal spécifique :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Créer une tâche isolée avec un contexte bootstrap léger :

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches de tour d’agent isolé. Pour les exécutions cron, le mode léger garde le contexte bootstrap vide au lieu d’injecter l’ensemble complet du bootstrap du workspace.

Remarque sur la propriété de la remise :

- Les tâches isolées gérées par cron routent toujours la remise finale visible par l’utilisateur via l’exécuteur
  cron (`announce`, `webhook` ou `none` interne uniquement).
- Si la tâche mentionne l’envoi à un destinataire externe, l’agent doit
  décrire la destination prévue dans son résultat au lieu d’essayer de l’envoyer directement.

## Commandes d’administration courantes

Exécution manuelle :

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Retargeting agent/session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustements de remise :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Remarque sur la remise en cas d’échec :

- `delivery.failureDestination` est pris en charge pour les tâches isolées.
- Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le
  mode de remise principal est `webhook`.
- Si vous ne définissez aucune destination d’échec et que la tâche annonce déjà sur un
  canal, les notifications d’échec réutilisent cette même cible d’annonce.
