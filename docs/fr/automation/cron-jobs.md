---
read_when:
    - Planification de tâches d’arrière-plan ou de réveils
    - Intégrer des déclencheurs externes (Webhooks, Gmail) dans OpenClaw
    - Choisir entre Heartbeat et Cron pour les tâches planifiées
summary: Tâches planifiées, Webhooks et déclencheurs Gmail PubSub pour le planificateur Gateway
title: Tâches planifiées
x-i18n:
    generated_at: "2026-04-24T06:59:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Tâches planifiées (Cron)

Cron est le planificateur intégré de Gateway. Il conserve les tâches, réveille l’agent au bon moment et peut renvoyer la sortie vers un canal de chat ou un endpoint Webhook.

## Démarrage rapide

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## Fonctionnement de cron

- Cron s’exécute **dans le processus Gateway** (et non dans le modèle).
- Les définitions de tâches sont conservées dans `~/.openclaw/cron/jobs.json`, afin que les redémarrages ne fassent pas perdre les planifications.
- L’état d’exécution à l’exécution est conservé à côté, dans `~/.openclaw/cron/jobs-state.json`. Si vous suivez les définitions cron dans git, suivez `jobs.json` et ignorez `jobs-state.json` via gitignore.
- Après la séparation, les anciennes versions d’OpenClaw peuvent lire `jobs.json`, mais peuvent traiter les tâches comme nouvelles, car les champs d’exécution se trouvent désormais dans `jobs-state.json`.
- Toutes les exécutions cron créent des enregistrements de [tâche d’arrière-plan](/fr/automation/tasks).
- Les tâches à exécution unique (`--at`) sont supprimées automatiquement après réussite par défaut.
- Les exécutions cron isolées ferment au mieux les onglets/processus de navigateur suivis pour leur session `cron:<jobId>` à la fin de l’exécution, afin que l’automatisation de navigateur détachée ne laisse pas de processus orphelins.
- Les exécutions cron isolées protègent également contre les réponses d’accusé de réception obsolètes. Si le premier résultat n’est qu’une mise à jour d’état intermédiaire (`on it`, `pulling everything
together` et indices similaires) et qu’aucune exécution de sous-agent descendante n’est encore
  responsable de la réponse finale, OpenClaw reformule la demande une fois pour obtenir le résultat
  réel avant la livraison.

<a id="maintenance"></a>

La réconciliation des tâches pour cron appartient à l’exécution : une tâche cron active reste active tant que l’exécution cron suit encore cette tâche comme étant en cours, même si une ancienne ligne de session enfant existe encore.
Une fois que l’exécution ne possède plus la tâche et que le délai de grâce de 5 minutes expire, la maintenance peut
marquer la tâche comme `lost`.

## Types de planification

| Type    | Indicateur CLI | Description                                                   |
| ------- | -------------- | ------------------------------------------------------------- |
| `at`    | `--at`         | Horodatage à exécution unique (ISO 8601 ou relatif comme `20m`) |
| `every` | `--every`      | Intervalle fixe                                               |
| `cron`  | `--cron`       | Expression cron à 5 ou 6 champs avec `--tz` facultatif       |

Les horodatages sans fuseau horaire sont traités comme UTC. Ajoutez `--tz America/New_York` pour une planification selon l’heure locale.

Les expressions récurrentes à l’heure pile sont automatiquement décalées jusqu’à 5 minutes pour réduire les pics de charge. Utilisez `--exact` pour forcer un horaire précis ou `--stagger 30s` pour une fenêtre explicite.

### Le jour du mois et le jour de la semaine utilisent une logique OR

Les expressions cron sont analysées par [croner](https://github.com/Hexagon/croner). Lorsque les champs jour du mois et jour de la semaine ne sont pas des jokers, croner correspond lorsque **l’un ou l’autre** champ correspond — pas les deux. Il s’agit du comportement standard de Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Cela se déclenche ~5–6 fois par mois au lieu de 0–1 fois par mois. OpenClaw utilise ici le comportement OR par défaut de Croner. Pour exiger les deux conditions, utilisez le modificateur `+` de jour de la semaine de Croner (`0 9 15 * +1`) ou planifiez sur un champ et contrôlez l’autre dans le prompt ou la commande de votre tâche.

## Styles d’exécution

| Style            | Valeur `--session`  | S’exécute dans          | Idéal pour                     |
| ---------------- | ------------------- | ----------------------- | ------------------------------ |
| Session principale | `main`            | Tour Heartbeat suivant  | Rappels, événements système    |
| Isolée           | `isolated`          | `cron:<jobId>` dédié    | Rapports, tâches d’arrière-plan |
| Session actuelle | `current`           | Liée au moment de la création | Travail récurrent tenant compte du contexte |
| Session personnalisée | `session:custom-id` | Session nommée persistante | Flux de travail qui s’appuient sur l’historique |

Les tâches de **session principale** mettent en file d’attente un événement système et peuvent éventuellement réveiller le Heartbeat (`--wake now` ou `--wake next-heartbeat`). Les tâches **isolées** exécutent un tour d’agent dédié avec une nouvelle session. Les **sessions personnalisées** (`session:xxx`) conservent le contexte entre les exécutions, ce qui permet des flux de travail comme des points quotidiens qui s’appuient sur les résumés précédents.

Pour les tâches isolées, le démontage d’exécution inclut désormais un nettoyage du navigateur au mieux pour cette session cron. Les échecs de nettoyage sont ignorés afin que le résultat cron réel reste prioritaire.

Les exécutions cron isolées détruisent également toutes les instances d’exécution MCP groupées créées pour la tâche via le chemin partagé de nettoyage d’exécution. Cela correspond à la manière dont les clients MCP des sessions principales et des sessions personnalisées sont démontés, afin que les tâches cron isolées ne laissent pas fuir de processus enfants stdio ni de connexions MCP longue durée entre les exécutions.

Lorsque des exécutions cron isolées orchestrent des sous-agents, la livraison privilégie également la sortie finale descendante plutôt qu’un texte intermédiaire obsolète du parent. Si des descendants sont encore en cours d’exécution, OpenClaw supprime cette mise à jour parent partielle au lieu de l’annoncer.

### Options de charge utile pour les tâches isolées

- `--message` : texte du prompt (obligatoire pour les tâches isolées)
- `--model` / `--thinking` : remplacements du modèle et du niveau de réflexion
- `--light-context` : ignore l’injection du fichier bootstrap de l’espace de travail
- `--tools exec,read` : restreint les outils que la tâche peut utiliser

`--model` utilise le modèle autorisé sélectionné pour cette tâche. Si le modèle demandé n’est pas autorisé, cron enregistre un avertissement et revient à la sélection de modèle par défaut/de l’agent de la tâche. Les chaînes de secours configurées s’appliquent toujours, mais un simple remplacement de modèle sans liste de secours explicite par tâche n’ajoute plus le primaire de l’agent comme cible de nouvelle tentative supplémentaire cachée.

L’ordre de priorité de sélection du modèle pour les tâches isolées est le suivant :

1. Remplacement du modèle du hook Gmail (lorsque l’exécution provient de Gmail et que ce remplacement est autorisé)
2. `model` dans la charge utile par tâche
3. Remplacement du modèle de session cron enregistré
4. Sélection du modèle par défaut/de l’agent

Le mode rapide suit également la sélection active résolue. Si la configuration du modèle sélectionné comporte `params.fastMode`, cron isolé l’utilise par défaut. Un remplacement `fastMode` de session enregistré reste prioritaire sur la configuration dans les deux sens.

Si une exécution isolée rencontre un transfert actif de changement de modèle, cron réessaie avec le fournisseur/modèle remplacé et conserve cette sélection active avant de réessayer. Lorsque le changement entraîne également un nouveau profil d’authentification, cron conserve également ce remplacement de profil d’authentification. Les nouvelles tentatives sont bornées : après la tentative initiale plus 2 nouvelles tentatives après changement, cron abandonne au lieu de boucler indéfiniment.

## Livraison et sortie

| Mode       | Ce qui se passe                                                     |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Livre en secours le texte final à la cible si l’agent n’a pas envoyé |
| `webhook`  | Envoie la charge utile de l’événement terminé en POST vers une URL  |
| `none`     | Aucune livraison de secours par l’exécuteur                         |

Utilisez `--announce --channel telegram --to "-1001234567890"` pour une livraison vers un canal. Pour les sujets de forum Telegram, utilisez `-1001234567890:topic:123`. Les cibles Slack/Discord/Mattermost doivent utiliser des préfixes explicites (`channel:<id>`, `user:<id>`).

Pour les tâches isolées, la livraison de chat est partagée. Si une route de chat est disponible, l’agent peut utiliser l’outil `message` même lorsque la tâche utilise `--no-deliver`. Si l’agent envoie vers la cible configurée/actuelle, OpenClaw ignore l’annonce de secours. Sinon, `announce`, `webhook` et `none` contrôlent uniquement ce que l’exécuteur fait de la réponse finale après le tour de l’agent.

Les notifications d’échec suivent un chemin de destination distinct :

- `cron.failureDestination` définit une valeur par défaut globale pour les notifications d’échec.
- `job.delivery.failureDestination` remplace cela par tâche.
- Si aucun des deux n’est défini et que la tâche livre déjà via `announce`, les notifications d’échec reviennent désormais vers cette cible principale `announce`.
- `delivery.failureDestination` n’est pris en charge que sur les tâches `sessionTarget="isolated"`, sauf si le mode principal de livraison est `webhook`.

## Exemples CLI

Rappel à exécution unique (session principale) :

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Tâche isolée récurrente avec livraison :

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Tâche isolée avec remplacement du modèle et du niveau de réflexion :

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhooks

Gateway peut exposer des endpoints HTTP Webhook pour des déclencheurs externes. Activez-les dans la configuration :

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentification

Chaque requête doit inclure le jeton du hook via un en-tête :

- `Authorization: Bearer <token>` (recommandé)
- `x-openclaw-token: <token>`

Les jetons dans la chaîne de requête sont rejetés.

### POST /hooks/wake

Met en file d’attente un événement système pour la session principale :

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (obligatoire) : description de l’événement
- `mode` (facultatif) : `now` (par défaut) ou `next-heartbeat`

### POST /hooks/agent

Exécute un tour d’agent isolé :

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Champs : `message` (obligatoire), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Hooks mappés (POST /hooks/\<name\>)

Les noms de hook personnalisés sont résolus via `hooks.mappings` dans la configuration. Les mappages peuvent transformer des charges utiles arbitraires en actions `wake` ou `agent` à l’aide de modèles ou de transformations de code.

### Sécurité

- Gardez les endpoints de hook derrière une boucle locale, un tailnet ou un proxy inverse de confiance.
- Utilisez un jeton de hook dédié ; ne réutilisez pas les jetons d’authentification Gateway.
- Conservez `hooks.path` sur un sous-chemin dédié ; `/` est rejeté.
- Définissez `hooks.allowedAgentIds` pour limiter le routage explicite par `agentId`.
- Conservez `hooks.allowRequestSessionKey=false` sauf si vous avez besoin de sessions choisies par l’appelant.
- Si vous activez `hooks.allowRequestSessionKey`, définissez aussi `hooks.allowedSessionKeyPrefixes` pour contraindre les formes de clé de session autorisées.
- Les charges utiles de hook sont encapsulées par des limites de sécurité par défaut.

## Intégration Gmail PubSub

Reliez les déclencheurs de boîte de réception Gmail à OpenClaw via Google PubSub.

**Prérequis** : CLI `gcloud`, `gog` (gogcli), hooks OpenClaw activés, Tailscale pour l’endpoint HTTPS public.

### Configuration avec l’assistant (recommandée)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Cela écrit la configuration `hooks.gmail`, active le préréglage Gmail et utilise Tailscale Funnel pour l’endpoint push.

### Démarrage automatique de Gateway

Lorsque `hooks.enabled=true` et que `hooks.gmail.account` est défini, Gateway démarre `gog gmail watch serve` au démarrage et renouvelle automatiquement la surveillance. Définissez `OPENCLAW_SKIP_GMAIL_WATCHER=1` pour désactiver ce comportement.

### Configuration manuelle ponctuelle

1. Sélectionnez le projet GCP qui possède le client OAuth utilisé par `gog` :

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Créez le sujet et accordez l’accès push à Gmail :

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Démarrez la surveillance :

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Remplacement du modèle Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Gestion des tâches

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Remarque sur le remplacement du modèle :

- `openclaw cron add|edit --model ...` modifie le modèle sélectionné de la tâche.
- Si le modèle est autorisé, ce fournisseur/modèle exact est transmis à l’exécution de l’agent isolé.
- S’il n’est pas autorisé, cron émet un avertissement et revient à la sélection de modèle par défaut/de l’agent de la tâche.
- Les chaînes de secours configurées s’appliquent toujours, mais un simple remplacement `--model` sans liste de secours explicite par tâche ne bascule plus vers le modèle principal de l’agent comme cible de nouvelle tentative silencieuse supplémentaire.

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Le fichier d’état d’exécution annexe est dérivé de `cron.store` : un stockage `.json` tel que
`~/clawd/cron/jobs.json` utilise `~/clawd/cron/jobs-state.json`, tandis qu’un chemin de stockage
sans suffixe `.json` ajoute `-state.json`.

Désactivez cron : `cron.enabled: false` ou `OPENCLAW_SKIP_CRON=1`.

**Nouvelle tentative pour exécution unique** : les erreurs transitoires (limitation de débit, surcharge, réseau, erreur serveur) sont réessayées jusqu’à 3 fois avec un backoff exponentiel. Les erreurs permanentes désactivent immédiatement.

**Nouvelle tentative récurrente** : backoff exponentiel (de 30s à 60m) entre les nouvelles tentatives. Le backoff est réinitialisé après la prochaine exécution réussie.

**Maintenance** : `cron.sessionRetention` (par défaut `24h`) supprime les entrées de session d’exécution isolée. `cron.runLog.maxBytes` / `cron.runLog.keepLines` suppriment automatiquement les fichiers de journal d’exécution.

## Dépannage

### Enchaînement de commandes

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron ne se déclenche pas

- Vérifiez `cron.enabled` et la variable d’environnement `OPENCLAW_SKIP_CRON`.
- Confirmez que Gateway s’exécute en continu.
- Pour les planifications `cron`, vérifiez le fuseau horaire (`--tz`) par rapport au fuseau horaire de l’hôte.
- `reason: not-due` dans la sortie d’exécution signifie que l’exécution manuelle a été vérifiée avec `openclaw cron run <jobId> --due` et que la tâche n’était pas encore due.

### Cron s’est déclenché mais il n’y a eu aucune livraison

- Le mode de livraison `none` signifie qu’aucun envoi de secours par l’exécuteur n’est attendu. L’agent peut toujours envoyer directement avec l’outil `message` lorsqu’une route de chat est disponible.
- Une cible de livraison manquante/invalide (`channel`/`to`) signifie que l’envoi sortant a été ignoré.
- Les erreurs d’authentification de canal (`unauthorized`, `Forbidden`) signifient que la livraison a été bloquée par les identifiants.
- Si l’exécution isolée renvoie uniquement le jeton silencieux (`NO_REPLY` / `no_reply`), OpenClaw supprime la livraison sortante directe et supprime également le chemin récapitulatif de secours mis en file d’attente, de sorte que rien n’est renvoyé dans le chat.
- Si l’agent doit lui-même envoyer un message à l’utilisateur, vérifiez que la tâche possède une route utilisable (`channel: "last"` avec un chat précédent, ou un canal/une cible explicite).

### Pièges liés au fuseau horaire

- Cron sans `--tz` utilise le fuseau horaire de l’hôte Gateway.
- Les planifications `at` sans fuseau horaire sont traitées comme UTC.
- Les `activeHours` de Heartbeat utilisent la résolution de fuseau horaire configurée.

## Voir aussi

- [Automatisation et tâches](/fr/automation) — aperçu de tous les mécanismes d’automatisation
- [Tâches d’arrière-plan](/fr/automation/tasks) — registre des tâches pour les exécutions cron
- [Heartbeat](/fr/gateway/heartbeat) — tours périodiques de la session principale
- [Fuseau horaire](/fr/concepts/timezone) — configuration du fuseau horaire
