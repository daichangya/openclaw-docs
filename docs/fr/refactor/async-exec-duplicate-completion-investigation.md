---
read_when:
    - Déboguer les événements répétés de complétion exec des Nodes
    - Travailler sur la déduplication Heartbeat/system-event
summary: Notes d’investigation pour l’injection dupliquée de complétion exec asynchrone
title: Investigation sur la complétion dupliquée exec asynchrone
x-i18n:
    generated_at: "2026-04-24T07:30:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Portée

- Session : `agent:main:telegram:group:-1003774691294:topic:1`
- Symptôme : la même complétion exec asynchrone pour la session/l’exécution `keen-nexus` a été enregistrée deux fois dans LCM comme tours utilisateur.
- Objectif : identifier s’il s’agit plus probablement d’une injection de session dupliquée ou d’une simple nouvelle tentative de livraison sortante.

## Conclusion

Il s’agit très probablement d’une **injection de session dupliquée**, et non d’une simple nouvelle tentative de livraison sortante.

La principale lacune côté gateway se situe dans le **chemin de complétion exec des Nodes** :

1. Une fin d’exec côté Node émet `exec.finished` avec le `runId` complet.
2. Le Gateway `server-node-events` convertit cela en événement système et demande un Heartbeat.
3. L’exécution Heartbeat injecte le bloc d’événements système vidés dans le prompt de l’agent.
4. L’exécuteur embarqué conserve ce prompt comme nouveau tour utilisateur dans la transcription de session.

Si le même `exec.finished` atteint le gateway deux fois pour le même `runId` pour une raison quelconque (relecture, doublon de reconnexion, renvoi en amont, producteur dupliqué), OpenClaw ne possède actuellement **aucune vérification d’idempotence indexée par `runId`/`contextKey`** sur ce chemin. La seconde copie deviendra un deuxième message utilisateur avec le même contenu.

## Chemin de code exact

### 1. Producteur : événement de complétion exec du Node

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` émet `node.event` avec l’événement `exec.finished`.
  - La charge utile inclut `sessionKey` et le `runId` complet.

### 2. Ingestion de l’événement par le Gateway

- `src/gateway/server-node-events.ts:574-640`
  - Gère `exec.finished`.
  - Construit le texte :
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Le met en file via :
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Demande immédiatement un réveil :
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Faiblesse de déduplication des événements système

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` ne supprime que les **textes dupliqués consécutifs** :
    - `if (entry.lastText === cleaned) return false`
  - Il stocke `contextKey`, mais **n’utilise pas** `contextKey` pour l’idempotence.
  - Après vidage, la suppression des doublons est réinitialisée.

Cela signifie qu’un `exec.finished` rejoué avec le même `runId` peut être accepté de nouveau plus tard, même si le code disposait déjà d’un candidat stable pour l’idempotence (`exec:<runId>`).

### 4. La gestion du réveil n’est pas le principal facteur de duplication

- `src/infra/heartbeat-wake.ts:79-117`
  - Les réveils sont fusionnés par `(agentId, sessionKey)`.
  - Les demandes de réveil dupliquées pour la même cible sont fusionnées en une seule entrée de réveil en attente.

Cela fait de la **gestion des réveils dupliqués seule** une explication moins solide que l’ingestion d’événements dupliqués.

### 5. Heartbeat consomme l’événement et le transforme en entrée de prompt

- `src/infra/heartbeat-runner.ts:535-574`
  - Le prévol examine les événements système en attente et classe les exécutions d’événement exec.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` vide la file pour la session.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Le bloc d’événements système vidé est ajouté au début du corps du prompt de l’agent.

### 6. Point d’injection dans la transcription

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` soumet le prompt complet à la session PI embarquée.
  - C’est le point où le prompt dérivé de la complétion devient un tour utilisateur conservé.

Ainsi, une fois que le même événement système est reconstruit deux fois dans le prompt, des messages utilisateur LCM dupliqués sont attendus.

## Pourquoi une simple nouvelle tentative de livraison sortante est moins probable

Il existe un véritable chemin d’échec sortant dans l’exécuteur Heartbeat :

- `src/infra/heartbeat-runner.ts:1194-1242`
  - La réponse est d’abord générée.
  - La livraison sortante se produit plus tard via `deliverOutboundPayloads(...)`.
  - Un échec renvoie `{ status: "failed" }`.

Cependant, pour la même entrée de file d’événement système, cela **ne suffit pas** à expliquer les tours utilisateur dupliqués :

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - La file d’événements système est déjà vidée avant la livraison sortante.

Donc une nouvelle tentative d’envoi de canal, à elle seule, ne recréerait pas exactement le même événement mis en file. Elle pourrait expliquer une livraison externe manquante/en échec, mais pas à elle seule un second message utilisateur identique dans la session.

## Possibilité secondaire, confiance plus faible

Il existe une boucle complète de nouvelle tentative d’exécution dans l’exécuteur d’agent :

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Certaines erreurs transitoires peuvent réessayer toute l’exécution et renvoyer le même `commandBody`.

Cela peut dupliquer un prompt utilisateur conservé **dans la même exécution de réponse** si le prompt avait déjà été ajouté avant le déclenchement de la condition de nouvelle tentative.

Je classe cette hypothèse plus bas que l’ingestion dupliquée de `exec.finished` parce que :

- l’écart observé était d’environ 51 secondes, ce qui ressemble davantage à un second réveil/tour qu’à une nouvelle tentative en cours de processus ;
- le signalement mentionne déjà des échecs répétés d’envoi de message, ce qui pointe davantage vers un second tour séparé ultérieur que vers une nouvelle tentative immédiate du modèle/de l’exécution.

## Hypothèse de cause racine

Hypothèse la plus probable :

- La complétion `keen-nexus` est passée par le **chemin d’événement exec du Node**.
- Le même `exec.finished` a été livré deux fois à `server-node-events`.
- Le Gateway a accepté les deux parce que `enqueueSystemEvent(...)` ne déduplique pas par `contextKey` / `runId`.
- Chaque événement accepté a déclenché un Heartbeat et a été injecté comme tour utilisateur dans la transcription PI.

## Correctif chirurgical minimal proposé

Si un correctif est souhaité, la modification de plus forte valeur et la plus petite est :

- faire en sorte que l’idempotence des événements exec/système respecte `contextKey` sur un horizon court, au moins pour les répétitions exactes `(sessionKey, contextKey, text)` ;
- ou ajouter une déduplication dédiée dans `server-node-events` pour `exec.finished` indexée par `(sessionKey, runId, type d’événement)`.

Cela bloquerait directement les doublons rejoués de `exec.finished` avant qu’ils ne deviennent des tours de session.

## Voir aussi

- [Outil Exec](/fr/tools/exec)
- [Gestion de session](/fr/concepts/session)
