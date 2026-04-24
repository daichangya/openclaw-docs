---
read_when:
    - Modifier l’exécution ou la concurrence des réponses automatiques
summary: Conception de la file de commandes qui sérialise les exécutions de réponse automatique entrantes
title: File de commandes
x-i18n:
    generated_at: "2026-04-24T07:07:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa442e9aa2f0d6d95770d43e987d19ce8d9343450b302ee448e1fa4ab3feeb15
    source_path: concepts/queue.md
    workflow: 15
---

# File de commandes (2026-01-16)

Nous sérialisons les exécutions de réponse automatique entrantes (tous canaux) via une petite file en mémoire dans le processus afin d’empêcher les collisions entre plusieurs exécutions d’agents, tout en permettant un parallélisme sûr entre sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et entrer en collision lorsque plusieurs messages entrants arrivent à peu d’intervalle.
- La sérialisation évite la compétition pour les ressources partagées (fichiers de session, journaux, stdin CLI) et réduit le risque de limites de débit en amont.

## Fonctionnement

- Une file FIFO sensible aux voies vide chaque voie avec un plafond de concurrence configurable (1 par défaut pour les voies non configurées ; `main` vaut 4 par défaut, `subagent` 8).
- `runEmbeddedPiAgent` met en file par **clé de session** (voie `session:<key>`) afin de garantir qu’une seule exécution est active par session.
- Chaque exécution de session est ensuite mise en file dans une **voie globale** (`main` par défaut) afin que le parallélisme global soit plafonné par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation détaillée est activée, les exécutions mises en file émettent un court avis si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement lors de la mise en file (lorsque le canal les prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente.

## Modes de file d’attente (par canal)

Les messages entrants peuvent infléchir l’exécution en cours, attendre un tour de suivi, ou faire les deux :

- `steer` : injecter immédiatement dans l’exécution en cours (annule les appels d’outils en attente après la prochaine frontière d’outil). En l’absence de diffusion, revient à `followup`.
- `followup` : mettre en file pour le prochain tour d’agent une fois l’exécution en cours terminée.
- `collect` : fusionner tous les messages mis en file en **un seul** tour de suivi (par défaut). Si les messages ciblent différents canaux/threads, ils sont vidés séparément pour préserver le routage.
- `steer-backlog` (alias `steer+backlog`) : infléchir maintenant **et** conserver le message pour un tour de suivi.
- `interrupt` (hérité) : interrompre l’exécution active de cette session, puis exécuter le message le plus récent.
- `queue` (alias hérité) : identique à `steer`.

Steer-backlog signifie que vous pouvez obtenir une réponse de suivi après l’exécution infléchie ; sur les surfaces de diffusion, cela peut donc ressembler à des doublons. Préférez `collect`/`steer` si vous voulez une seule réponse par message entrant.
Envoyez `/queue collect` comme commande autonome (par session) ou définissez `messages.queue.byChannel.discord: "collect"`.

Par défaut (lorsque rien n’est défini dans la configuration) :

- Toutes les surfaces → `collect`

Configurez globalement ou par canal via `messages.queue` :

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Options de file d’attente

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (ainsi qu’à `steer` lorsqu’il revient à followup) :

- `debounceMs` : attendre un temps calme avant de démarrer un tour de suivi (évite « continue, continue »).
- `cap` : nombre maximal de messages mis en file par session.
- `drop` : politique de débordement (`old`, `new`, `summarize`).

Summarize conserve une courte liste à puces des messages supprimés et l’injecte comme prompt de suivi synthétique.
Valeurs par défaut : `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Surcharges par session

- Envoyez `/queue <mode>` comme commande autonome pour enregistrer le mode de la session en cours.
- Les options peuvent être combinées : `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface la surcharge de session.

## Portée et garanties

- S’applique aux exécutions d’agents en réponse automatique sur tous les canaux entrants utilisant le pipeline de réponse du gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) est à l’échelle du processus pour l’entrant + les Heartbeat principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par ex. `cron`, `subagent`) afin que les jobs d’arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Ces exécutions détachées sont suivies comme [tâches en arrière-plan](/fr/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni thread worker en arrière-plan ; TypeScript pur + promesses.

## Dépannage

- Si des commandes semblent bloquées, activez les journaux détaillés et recherchez les lignes « queued for …ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux détaillés et surveillez les lignes de timing de la file.

## Articles connexes

- [Gestion des sessions](/fr/concepts/session)
- [Politique de nouvelle tentative](/fr/concepts/retry)
