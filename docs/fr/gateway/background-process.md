---
read_when:
    - Ajouter ou modifier le comportement exec en arrière-plan
    - Déboguer des tâches exec de longue durée
summary: Exécution exec en arrière-plan et gestion des processus
title: Exec en arrière-plan et outil Process
x-i18n:
    generated_at: "2026-04-05T12:41:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4398e2850f6f050944f103ad637cd9f578e9cc7fb478bc5cd5d972c92289b831
    source_path: gateway/background-process.md
    workflow: 15
---

# Exec en arrière-plan + outil Process

OpenClaw exécute les commandes shell via l'outil `exec` et conserve en mémoire les tâches de longue durée. L'outil `process` gère ces sessions en arrière-plan.

## Outil exec

Paramètres clés :

- `command` (obligatoire)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après ce délai
- `background` (bool) : passage immédiat en arrière-plan
- `timeout` (secondes, par défaut 1800) : tuer le processus après ce délai
- `elevated` (bool) : exécuter en dehors de la sandbox si le mode elevated est activé/autorisé (`gateway` par défaut, ou `node` lorsque la cible exec est `node`)
- Besoin d'un vrai TTY ? Définissez `pty: true`.
- `workdir`, `env`

Comportement :

- Les exécutions au premier plan renvoient directement la sortie.
- Lorsqu'une exécution passe en arrière-plan (explicitement ou après expiration du délai), l'outil renvoie `status: "running"` + `sessionId` et une courte fin de sortie.
- La sortie est conservée en mémoire jusqu'à ce que la session soit interrogée ou effacée.
- Si l'outil `process` n'est pas autorisé, `exec` s'exécute de manière synchrone et ignore `yieldMs`/`background`.
- Les commandes exec lancées reçoivent `OPENCLAW_SHELL=exec` pour les règles shell/profil sensibles au contexte.
- Pour un travail de longue durée qui démarre maintenant, lancez-le une seule fois et appuyez-vous sur le réveil automatique à la fin lorsqu'il est activé et que la commande produit une sortie ou échoue.
- Si le réveil automatique à la fin n'est pas disponible, ou si vous avez besoin d'une confirmation silencieuse de réussite pour une commande terminée proprement sans sortie, utilisez `process` pour confirmer l'achèvement.
- N'émulez pas des rappels ou des suivis différés avec des boucles `sleep` ou des interrogations répétées ; utilisez cron pour le travail futur.

## Pontage de processus enfant

Lors du lancement de processus enfant de longue durée en dehors des outils exec/process (par exemple, relances CLI ou assistants gateway), attachez l'assistant de pont de processus enfant afin que les signaux de terminaison soient transmis et que les écouteurs soient détachés à la sortie/en cas d'erreur. Cela évite les processus orphelins sous systemd et maintient un comportement d'arrêt cohérent entre les plateformes.

Remplacements d'environnement :

- `PI_BASH_YIELD_MS` : délai de cession par défaut (ms)
- `PI_BASH_MAX_OUTPUT_CHARS` : limite de sortie en mémoire (caractères)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` : limite stdout/stderr en attente par flux (caractères)
- `PI_BASH_JOB_TTL_MS` : TTL pour les sessions terminées (ms, limité de 1 min à 3 h)

Configuration (préférée) :

- `tools.exec.backgroundMs` (par défaut 10000)
- `tools.exec.timeoutSec` (par défaut 1800)
- `tools.exec.cleanupMs` (par défaut 1800000)
- `tools.exec.notifyOnExit` (par défaut true) : met en file un événement système + demande un heartbeat lorsqu'un exec en arrière-plan se termine.
- `tools.exec.notifyOnExitEmptySuccess` (par défaut false) : lorsqu'il vaut true, met aussi en file des événements d'achèvement pour les exécutions en arrière-plan réussies qui n'ont produit aucune sortie.

## Outil process

Actions :

- `list` : sessions en cours + terminées
- `poll` : vider la nouvelle sortie d'une session (indique aussi le statut de sortie)
- `log` : lire la sortie agrégée (prend en charge `offset` + `limit`)
- `write` : envoyer stdin (`data`, `eof` facultatif)
- `send-keys` : envoyer des jetons de touches explicites ou des octets à une session adossée à un PTY
- `submit` : envoyer Entrée / retour chariot à une session adossée à un PTY
- `paste` : envoyer du texte littéral, éventuellement enveloppé dans le mode collage entre crochets
- `kill` : terminer une session en arrière-plan
- `clear` : supprimer une session terminée de la mémoire
- `remove` : tuer si en cours d'exécution, sinon effacer si terminée

Remarques :

- Seules les sessions passées en arrière-plan sont listées/persistées en mémoire.
- Les sessions sont perdues au redémarrage du processus (pas de persistance sur disque).
- Les journaux de session ne sont enregistrés dans l'historique de chat que si vous exécutez `process poll/log` et que le résultat de l'outil est enregistré.
- `process` est délimité par agent ; il ne voit que les sessions démarrées par cet agent.
- Utilisez `poll` / `log` pour le statut, les journaux, la confirmation silencieuse de réussite, ou la confirmation d'achèvement lorsque le réveil automatique à la fin n'est pas disponible.
- Utilisez `write` / `send-keys` / `submit` / `paste` / `kill` lorsque vous avez besoin d'une entrée ou d'une intervention.
- `process list` inclut un `name` dérivé (verbe de commande + cible) pour un balayage rapide.
- `process log` utilise des `offset`/`limit` basés sur les lignes.
- Lorsque `offset` et `limit` sont tous deux omis, il renvoie les 200 dernières lignes et inclut une indication de pagination.
- Lorsque `offset` est fourni et que `limit` est omis, il renvoie de `offset` jusqu'à la fin (sans être limité à 200).
- L'interrogation est destinée au statut à la demande, pas à une planification par boucle d'attente. Si le travail doit avoir lieu plus tard, utilisez cron à la place.

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

Envoyer à stdin :

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

Envoyer des touches PTY :

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

Soumettre la ligne en cours :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller du texte littéral :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```
