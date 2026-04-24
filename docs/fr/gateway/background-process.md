---
read_when:
    - Ajouter ou modifier le comportement de `exec` en arrière-plan
    - Déboguer les tâches `exec` de longue durée
summary: Exécution `exec` en arrière-plan et gestion des processus
title: '`exec` en arrière-plan et outil de processus'
x-i18n:
    generated_at: "2026-04-24T07:09:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# `exec` en arrière-plan + outil de processus

OpenClaw exécute les commandes shell via l’outil `exec` et conserve les tâches de longue durée en mémoire. L’outil `process` gère ces sessions en arrière-plan.

## Outil exec

Paramètres clés :

- `command` (requis)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après ce délai
- `background` (bool) : passage immédiat en arrière-plan
- `timeout` (secondes, par défaut 1800) : tuer le processus après ce délai
- `elevated` (bool) : exécuter hors de la sandbox si le mode élevé est activé/autorisée (`gateway` par défaut, ou `node` lorsque la cible exec est `node`)
- Besoin d’un vrai TTY ? Définissez `pty: true`.
- `workdir`, `env`

Comportement :

- Les exécutions au premier plan renvoient directement la sortie.
- Lorsqu’elle passe en arrière-plan (explicitement ou par délai), l’outil renvoie `status: "running"` + `sessionId` et une courte fin de sortie.
- La sortie est conservée en mémoire jusqu’à ce que la session soit interrogée ou effacée.
- Si l’outil `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` pour des règles de shell/profil sensibles au contexte.
- Pour un travail de longue durée qui commence maintenant, démarrez-le une seule fois et appuyez-vous sur le réveil automatique à l’achèvement lorsqu’il est activé et que la commande émet une sortie ou échoue.
- Si le réveil automatique à l’achèvement n’est pas disponible, ou si vous avez besoin d’une confirmation de succès silencieux pour une commande qui s’est terminée proprement sans sortie, utilisez `process` pour confirmer l’achèvement.
- N’imitez pas les rappels ou les suivis différés avec des boucles `sleep` ou des interrogations répétées ; utilisez Cron pour le travail futur.

## Pont des processus enfants

Lors du lancement de processus enfants de longue durée hors des outils exec/process (par exemple, relances CLI ou helpers gateway), attachez le helper de pont des processus enfants afin que les signaux de terminaison soient transmis et que les écouteurs soient détachés à la sortie/en cas d’erreur. Cela évite les processus orphelins sous systemd et maintient un comportement d’arrêt cohérent sur toutes les plateformes.

Surcharges d’environnement :

- `PI_BASH_YIELD_MS` : délai de yield par défaut (ms)
- `PI_BASH_MAX_OUTPUT_CHARS` : plafond de sortie en mémoire (caractères)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` : plafond stdout/stderr en attente par flux (caractères)
- `PI_BASH_JOB_TTL_MS` : TTL des sessions terminées (ms, borné à 1 min–3 h)

Configuration (préférée) :

- `tools.exec.backgroundMs` (par défaut 10000)
- `tools.exec.timeoutSec` (par défaut 1800)
- `tools.exec.cleanupMs` (par défaut 1800000)
- `tools.exec.notifyOnExit` (par défaut true) : mettre en file un événement système + demander un Heartbeat lorsqu’un exec en arrière-plan se termine.
- `tools.exec.notifyOnExitEmptySuccess` (par défaut false) : lorsque défini à true, mettre aussi en file des événements d’achèvement pour les exécutions en arrière-plan réussies qui n’ont produit aucune sortie.

## Outil process

Actions :

- `list` : sessions en cours + terminées
- `poll` : vider la nouvelle sortie d’une session (signale aussi l’état de sortie)
- `log` : lire la sortie agrégée (prend en charge `offset` + `limit`)
- `write` : envoyer stdin (`data`, `eof` facultatif)
- `send-keys` : envoyer des jetons de touches explicites ou des octets à une session adossée à un PTY
- `submit` : envoyer Entrée / retour chariot à une session adossée à un PTY
- `paste` : envoyer du texte littéral, éventuellement encapsulé en mode collage entre crochets
- `kill` : terminer une session en arrière-plan
- `clear` : supprimer de la mémoire une session terminée
- `remove` : tuer si en cours d’exécution, sinon effacer si terminée

Remarques :

- Seules les sessions passées en arrière-plan sont listées/persistées en mémoire.
- Les sessions sont perdues au redémarrage du processus (aucune persistance sur disque).
- Les journaux de session ne sont enregistrés dans l’historique du chat que si vous exécutez `process poll/log` et que le résultat de l’outil est enregistré.
- `process` est limité par agent ; il ne voit que les sessions démarrées par cet agent.
- Utilisez `poll` / `log` pour l’état, les journaux, la confirmation de succès silencieux ou la confirmation d’achèvement lorsque le réveil automatique à l’achèvement n’est pas disponible.
- Utilisez `write` / `send-keys` / `submit` / `paste` / `kill` lorsque vous avez besoin d’entrée ou d’intervention.
- `process list` inclut un `name` dérivé (verbe de commande + cible) pour des scans rapides.
- `process log` utilise `offset`/`limit` par lignes.
- Lorsque `offset` et `limit` sont tous deux omis, il renvoie les 200 dernières lignes et inclut un indice de pagination.
- Lorsque `offset` est fourni et `limit` est omis, il renvoie de `offset` jusqu’à la fin (sans plafond à 200).
- L’interrogation sert à obtenir un état à la demande, pas à planifier des boucles d’attente. Si le travail doit avoir lieu plus tard, utilisez Cron à la place.

## Exemples

Exécuter une tâche longue et interroger plus tard :

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

Démarrer immédiatement en arrière-plan :

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

Envoyer stdin :

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envoyer des touches PTY :

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Valider la ligne courante :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller du texte littéral :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## Articles connexes

- [Outil Exec](/fr/tools/exec)
- [Approbations Exec](/fr/tools/exec-approvals)
