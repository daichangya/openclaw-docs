---
read_when:
    - Vous souhaitez des tâches planifiées et des réveils
    - Vous déboguez l’exécution et les journaux Cron
summary: Référence CLI pour `openclaw cron` (planifier et exécuter des tâches d’arrière-plan)
title: Cron
x-i18n:
    generated_at: "2026-04-24T07:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Gérez les tâches Cron pour le planificateur du Gateway.

Lié :

- Tâches Cron : [Tâches Cron](/fr/automation/cron-jobs)

Conseil : exécutez `openclaw cron --help` pour afficher toute la surface de commande.

Remarque : `openclaw cron list` et `openclaw cron show <job-id>` prévisualisent la
route de livraison résolue. Pour `channel: "last"`, l’aperçu indique si la
route a été résolue à partir de la session principale/actuelle ou si elle
échouera en fermeture stricte.

Remarque : les tâches isolées `cron add` utilisent par défaut la livraison `--announce`. Utilisez `--no-deliver` pour conserver
la sortie en interne. `--deliver` reste un alias obsolète de `--announce`.

Remarque : la livraison au chat pour un Cron isolé est partagée. `--announce` est la livraison
de secours du runner pour la réponse finale ; `--no-deliver` désactive cette
solution de secours mais ne supprime pas l’outil `message` de l’agent lorsqu’une route de chat est disponible.

Remarque : les tâches à exécution unique (`--at`) sont supprimées après succès par défaut. Utilisez `--keep-after-run` pour les conserver.

Remarque : `--session` prend en charge `main`, `isolated`, `current` et `session:<id>`.
Utilisez `current` pour lier à la session active au moment de la création, ou `session:<id>` pour
une clé de session persistante explicite.

Remarque : pour les tâches CLI à exécution unique, les dates/horaires `--at` sans décalage sont traitées comme UTC, sauf si vous passez aussi
`--tz <iana>`, ce qui interprète cette heure locale dans le fuseau horaire donné.

Remarque : les tâches récurrentes utilisent désormais un backoff exponentiel de nouvelle tentative après des erreurs consécutives (30s → 1m → 5m → 15m → 60m), puis reviennent au calendrier normal après la prochaine exécution réussie.

Remarque : `openclaw cron run` revient maintenant dès que l’exécution manuelle est mise en file pour exécution. Les réponses réussies incluent `{ ok: true, enqueued: true, runId }` ; utilisez `openclaw cron runs --id <job-id>` pour suivre le résultat final.

Remarque : `openclaw cron run <job-id>` force l’exécution par défaut. Utilisez `--due` pour conserver l’ancien
comportement « exécuter uniquement si dû ».

Remarque : les tours Cron isolés suppriment les réponses obsolètes limitées à un accusé de réception. Si le
premier résultat n’est qu’une mise à jour de statut intermédiaire et qu’aucune exécution descendante de sous-agent n’est
responsable de la réponse finale, Cron relance une invite une fois pour obtenir le vrai résultat
avant la livraison.

Remarque : si une exécution isolée ne renvoie que le jeton silencieux (`NO_REPLY` /
`no_reply`), Cron supprime la livraison sortante directe ainsi que le chemin de résumé mis en file de secours,
de sorte que rien n’est republié dans le chat.

Remarque : `cron add|edit --model ...` utilise ce modèle autorisé sélectionné pour la tâche.
Si le modèle n’est pas autorisé, Cron émet un avertissement et revient à la sélection
du modèle de l’agent/par défaut de la tâche. Les chaînes de repli configurées s’appliquent toujours, mais une simple
surcharge de modèle sans liste explicite de repli par tâche n’ajoute plus le primaire de l’agent comme cible de nouvelle tentative cachée.

Remarque : l’ordre de priorité des modèles pour un Cron isolé est d’abord la surcharge Gmail-hook, puis le
`--model` par tâche, puis toute surcharge de modèle de session Cron stockée, puis la sélection normale
agent/par défaut.

Remarque : le mode rapide d’un Cron isolé suit la sélection de modèle en direct résolue. La config du modèle
`params.fastMode` s’applique par défaut, mais une surcharge `fastMode`
de session stockée prime toujours sur la config.

Remarque : si une exécution isolée lève `LiveSessionModelSwitchError`, Cron persiste le
provider/modèle remplacé (ainsi que la surcharge de profil d’authentification remplacée lorsqu’elle est présente) avant
de réessayer. La boucle externe de nouvelle tentative est limitée à 2 nouvelles tentatives de basculement après la tentative initiale,
puis s’interrompt au lieu de boucler indéfiniment.

Remarque : les notifications d’échec utilisent d’abord `delivery.failureDestination`, puis
`cron.failureDestination` global, et enfin reviennent à la cible d’annonce principale de la tâche
lorsqu’aucune destination d’échec explicite n’est configurée.

Remarque : la rétention/l’élagage est contrôlée dans la configuration :

- `cron.sessionRetention` (par défaut `24h`) élague les sessions d’exécution isolées terminées.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent `~/.openclaw/cron/runs/<jobId>.jsonl`.

Remarque de mise à niveau : si vous avez d’anciennes tâches Cron antérieures au format actuel de livraison/stockage, exécutez
`openclaw doctor --fix`. Doctor normalise désormais les champs Cron hérités (`jobId`, `schedule.cron`,
les champs de livraison de niveau supérieur, y compris l’ancien `threadId`, les alias de livraison `provider` de la charge utile) et migre les tâches de secours Webhook simples
`notify: true` vers une livraison Webhook explicite lorsque `cron.webhook` est
configuré.

## Modifications courantes

Mettre à jour les paramètres de livraison sans modifier le message :

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Désactiver la livraison pour une tâche isolée :

```bash
openclaw cron edit <job-id> --no-deliver
```

Activer le contexte bootstrap léger pour une tâche isolée :

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
  --name "Brief matinal léger" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Résume les mises à jour de la nuit." \
  --light-context \
  --no-deliver
```

`--light-context` s’applique uniquement aux tâches de tour d’agent isolé. Pour les exécutions Cron, le mode léger garde le contexte bootstrap vide au lieu d’injecter l’ensemble complet du bootstrap d’espace de travail.

Remarque sur la propriété de la livraison :

- La livraison au chat pour un Cron isolé est partagée. L’agent peut envoyer directement avec
  l’outil `message` lorsqu’une route de chat est disponible.
- `announce` livre de secours la réponse finale uniquement lorsque l’agent n’a pas envoyé
  directement à la cible résolue. `webhook` publie la charge utile finalisée à une URL.
  `none` désactive la livraison de secours du runner.

## Commandes d’administration courantes

Exécution manuelle :

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Les entrées `cron runs` incluent des diagnostics de livraison avec la cible Cron prévue,
la cible résolue, les envois par l’outil de message, l’utilisation du secours et l’état livré.

Redirection agent/session :

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Ajustements de livraison :

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Remarque sur la livraison des échecs :

- `delivery.failureDestination` est pris en charge pour les tâches isolées.
- Les tâches de session principale ne peuvent utiliser `delivery.failureDestination` que lorsque le mode principal
  de livraison est `webhook`.
- Si vous ne définissez aucune destination d’échec et que la tâche annonce déjà sur un
  canal, les notifications d’échec réutilisent cette même cible d’annonce.

## Lié

- [Référence CLI](/fr/cli)
- [Tâches planifiées](/fr/automation/cron-jobs)
