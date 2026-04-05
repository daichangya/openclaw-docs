---
read_when:
    - Modification de l’exécution des réponses automatiques ou de la concurrence
summary: Conception de la file de commandes qui sérialise les exécutions de réponse automatique entrantes
title: File de commandes
x-i18n:
    generated_at: "2026-04-05T12:40:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36e1d004e9a2c21ad1470517a249285216114dd4cf876681cc860e992c73914f
    source_path: concepts/queue.md
    workflow: 15
---

# File de commandes (2026-01-16)

Nous sérialisons les exécutions entrantes de réponse automatique (tous canaux) via une petite file en mémoire dans le processus afin d’empêcher que plusieurs exécutions d’agent n’entrent en collision, tout en autorisant un parallélisme sûr entre les sessions.

## Pourquoi

- Les exécutions de réponse automatique peuvent être coûteuses (appels LLM) et peuvent entrer en collision lorsque plusieurs messages entrants arrivent à peu d’intervalle.
- La sérialisation évite la concurrence pour les ressources partagées (fichiers de session, journaux, stdin CLI) et réduit le risque de limites de débit en amont.

## Fonctionnement

- Une file FIFO tenant compte des voies vide chaque voie avec un plafond de concurrence configurable (1 par défaut pour les voies non configurées ; `main` vaut 4 par défaut, `subagent` 8).
- `runEmbeddedPiAgent` met en file par **clé de session** (voie `session:<key>`) afin de garantir une seule exécution active par session.
- Chaque exécution de session est ensuite mise en file dans une **voie globale** (`main` par défaut) afin que le parallélisme global soit plafonné par `agents.defaults.maxConcurrent`.
- Lorsque la journalisation verbeuse est activée, les exécutions en attente émettent un court message si elles ont attendu plus d’environ 2 s avant de démarrer.
- Les indicateurs de saisie se déclenchent toujours immédiatement à la mise en file (lorsque le canal le prend en charge), de sorte que l’expérience utilisateur reste inchangée pendant l’attente.

## Modes de file d’attente (par canal)

Les messages entrants peuvent rediriger l’exécution en cours, attendre un tour de suivi, ou faire les deux :

- `steer` : injecter immédiatement dans l’exécution en cours (annule les appels d’outil en attente après la prochaine frontière d’outil). En l’absence de streaming, revient à `followup`.
- `followup` : mettre en file pour le prochain tour d’agent une fois l’exécution en cours terminée.
- `collect` : fusionner tous les messages en file en **un seul** tour de suivi (par défaut). Si les messages ciblent des canaux/fils différents, ils sont vidés individuellement afin de préserver le routage.
- `steer-backlog` (alias `steer+backlog`) : rediriger maintenant **et** conserver le message pour un tour de suivi.
- `interrupt` (hérité) : interrompre l’exécution active pour cette session, puis exécuter le message le plus récent.
- `queue` (alias hérité) : identique à `steer`.

`steer-backlog` signifie que vous pouvez obtenir une réponse de suivi après l’exécution redirigée, donc
les surfaces avec streaming peuvent donner l’impression de doublons. Préférez `collect`/`steer` si vous souhaitez
une seule réponse par message entrant.
Envoyez `/queue collect` comme commande autonome (par session) ou définissez `messages.queue.byChannel.discord: "collect"`.

Valeurs par défaut (si non définies dans la configuration) :

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

Les options s’appliquent à `followup`, `collect` et `steer-backlog` (ainsi qu’à `steer` lorsqu’il revient à `followup`) :

- `debounceMs` : attendre une période de calme avant de démarrer un tour de suivi (évite les « continue, continue »).
- `cap` : nombre maximal de messages en file par session.
- `drop` : politique de débordement (`old`, `new`, `summarize`).

`Summarize` conserve une courte liste à puces des messages abandonnés et l’injecte sous forme d’invite synthétique de suivi.
Valeurs par défaut : `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## Remplacements par session

- Envoyez `/queue <mode>` comme commande autonome pour enregistrer le mode pour la session actuelle.
- Les options peuvent être combinées : `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` ou `/queue reset` efface le remplacement de session.

## Portée et garanties

- S’applique aux exécutions d’agent de réponse automatique sur tous les canaux entrants qui utilisent le pipeline de réponse de la passerelle (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- La voie par défaut (`main`) s’applique à l’échelle du processus pour les entrées + les heartbeat principaux ; définissez `agents.defaults.maxConcurrent` pour autoriser plusieurs sessions en parallèle.
- Des voies supplémentaires peuvent exister (par ex. `cron`, `subagent`) afin que les tâches en arrière-plan puissent s’exécuter en parallèle sans bloquer les réponses entrantes. Ces exécutions détachées sont suivies comme [tâches en arrière-plan](/automation/tasks).
- Les voies par session garantissent qu’une seule exécution d’agent touche une session donnée à la fois.
- Aucune dépendance externe ni thread worker en arrière-plan ; uniquement TypeScript + promises.

## Dépannage

- Si les commandes semblent bloquées, activez les journaux verbeux et recherchez les lignes « queued for …ms » pour confirmer que la file se vide.
- Si vous avez besoin de la profondeur de file, activez les journaux verbeux et surveillez les lignes de chronométrage de file.
