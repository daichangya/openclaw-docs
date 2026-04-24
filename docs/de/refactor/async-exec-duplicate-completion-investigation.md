---
read_when:
    - Wiederholte Abschlussereignisse von Node-Exec debuggen
    - Arbeiten an Heartbeat-/System-Event-Deduplizierung
summary: Untersuchungsnotizen zur doppelten Injektion des Abschlusses asynchroner Exec-Ausführung
title: Untersuchung doppelter Abschlüsse bei asynchroner Exec-Ausführung
x-i18n:
    generated_at: "2026-04-24T06:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: e448cdcff6c799bf7f40caea2698c3293d1a78ed85ba5ffdfe10f53ce125f0ab
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

## Umfang

- Sitzung: `agent:main:telegram:group:-1003774691294:topic:1`
- Symptom: Derselbe Abschluss einer asynchronen Exec-Ausführung für Sitzung/Lauf `keen-nexus` wurde in LCM zweimal als Benutzerdurchlauf aufgezeichnet.
- Ziel: feststellen, ob dies am wahrscheinlichsten eine doppelte Sitzungsinjektion oder ein bloßer Retry der ausgehenden Zustellung ist.

## Fazit

Am wahrscheinlichsten handelt es sich um eine **doppelte Sitzungsinjektion**, nicht um einen reinen Retry der ausgehenden Zustellung.

Die stärkste Lücke auf Gateway-Seite liegt im **Pfad für den Abschluss von Node-Exec**:

1. Der Abschluss einer node-seitigen Exec-Ausführung sendet `exec.finished` mit der vollständigen `runId`.
2. Gateway `server-node-events` wandelt dies in ein Systemereignis um und fordert einen Heartbeat an.
3. Der Heartbeat-Lauf injiziert den geleerten Systemereignis-Block in den Agent-Prompt.
4. Der eingebettete Runner persistiert diesen Prompt als neuen Benutzerdurchlauf im Sitzungs-Transkript.

Wenn dasselbe `exec.finished` aus irgendeinem Grund (Replay, doppeltes Ereignis nach Reconnect, Upstream-Resend, duplizierter Producer) mit derselben `runId` zweimal das Gateway erreicht, hat OpenClaw auf diesem Pfad derzeit **keine Idempotenzprüfung anhand von `runId`/`contextKey`**. Die zweite Kopie wird zu einer zweiten Benutzernachricht mit identischem Inhalt.

## Exakter Codepfad

### 1. Producer: Ereignis für den Abschluss von Node-Exec

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` sendet `node.event` mit dem Ereignis `exec.finished`.
  - Die Payload enthält `sessionKey` und die vollständige `runId`.

### 2. Gateway-Ereignisaufnahme

- `src/gateway/server-node-events.ts:574-640`
  - Behandelt `exec.finished`.
  - Erstellt Text:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Stellt ihn in die Queue über:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Fordert sofort einen Wake an:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Schwäche bei der Deduplizierung von Systemereignissen

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` unterdrückt nur **aufeinanderfolgende doppelte Texte**:
    - `if (entry.lastText === cleaned) return false`
  - Es speichert `contextKey`, verwendet `contextKey` aber **nicht** für Idempotenz.
  - Nach dem Drain wird die Unterdrückung von Duplikaten zurückgesetzt.

Das bedeutet, dass ein erneut abgespieltes `exec.finished` mit derselben `runId` später erneut akzeptiert werden kann, obwohl der Code bereits einen stabilen Kandidaten für Idempotenz hatte (`exec:<runId>`).

### 4. Wake-Handling ist nicht der primäre Verursacher von Duplikaten

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakes werden nach `(agentId, sessionKey)` zusammengeführt.
  - Doppelte Wake-Anfragen für dasselbe Ziel kollabieren zu einem ausstehenden Wake-Eintrag.

Dadurch ist **dupliziertes Wake-Handling allein** eine schwächere Erklärung als doppelte Ereignisaufnahme.

### 5. Heartbeat konsumiert das Ereignis und wandelt es in Prompt-Eingabe um

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight schaut auf ausstehende Systemereignisse und klassifiziert Läufe mit Exec-Ereignissen.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` leert die Queue für die Sitzung.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Der geleerte Systemereignis-Block wird dem Agent-Prompt-Body vorangestellt.

### 6. Punkt der Transkript-Injektion

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` übergibt den vollständigen Prompt an die eingebettete PI-Sitzung.
  - Das ist der Punkt, an dem der vom Abschluss abgeleitete Prompt zu einem persistierten Benutzerdurchlauf wird.

Sobald dasselbe Systemereignis zweimal in den Prompt eingebaut wird, sind doppelte LCM-Benutzernachrichten also zu erwarten.

## Warum ein reiner Retry der ausgehenden Zustellung weniger wahrscheinlich ist

Es gibt einen echten Pfad für ausgehende Fehler im Heartbeat-Runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Die Antwort wird zuerst erzeugt.
  - Die ausgehende Zustellung erfolgt später über `deliverOutboundPayloads(...)`.
  - Ein Fehlschlag dort gibt `{ status: "failed" }` zurück.

Für denselben Systemereignis-Queue-Eintrag ist das allein jedoch **nicht ausreichend**, um die doppelten Benutzerdurchläufe zu erklären:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Die Queue der Systemereignisse wird bereits vor der ausgehenden Zustellung geleert.

Ein Channel-Send-Retry allein würde also nicht exakt denselben Queue-Eintrag erneut erzeugen. Er könnte fehlende/fehlgeschlagene externe Zustellung erklären, aber für sich genommen keine zweite identische Benutzernachricht in der Sitzung.

## Sekundäre Möglichkeit mit geringerer Sicherheit

Es gibt eine vollständige Retry-Schleife für den Lauf im Agent-Runner:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Bestimmte transiente Fehler können den gesamten Lauf erneut versuchen und denselben `commandBody` erneut senden.

Das kann einen persistierten Benutzer-Prompt **innerhalb derselben Antwortausführung** duplizieren, wenn der Prompt bereits angehängt war, bevor die Retry-Bedingung ausgelöst wurde.

Ich bewerte dies niedriger als doppelte Aufnahme von `exec.finished`, weil:

- der beobachtete Abstand bei etwa 51 Sekunden lag, was eher wie ein zweiter Wake/Turn als wie ein In-Process-Retry wirkt;
- der Bericht bereits wiederholte Fehlschläge beim Senden von Nachrichten erwähnt, was eher auf einen separaten späteren Durchlauf als auf einen unmittelbaren Modell-/Runtime-Retry hindeutet.

## Root-Cause-Hypothese

Hypothese mit der höchsten Sicherheit:

- Der Abschluss von `keen-nexus` kam über den **Node-Exec-Ereignispfad**.
- Dasselbe `exec.finished` wurde zweimal an `server-node-events` zugestellt.
- Gateway akzeptierte beide, weil `enqueueSystemEvent(...)` nicht nach `contextKey` / `runId` dedupliziert.
- Jedes akzeptierte Ereignis löste einen Heartbeat aus und wurde als Benutzerdurchlauf in das PI-Transkript injiziert.

## Vorgeschlagene kleine chirurgische Korrektur

Wenn eine Korrektur gewünscht ist, ist die kleinste wertvolle Änderung:

- Die Idempotenz von Exec-/Systemereignissen sollte `contextKey` über einen kurzen Zeitraum berücksichtigen, mindestens für exakte Wiederholungen von `(sessionKey, contextKey, text)`;
- oder eine dedizierte Deduplizierung in `server-node-events` für `exec.finished` hinzufügen, verschlüsselt nach `(sessionKey, runId, event kind)`.

Dadurch würden erneut abgespielte Duplikate von `exec.finished` direkt blockiert, bevor sie zu Sitzungsdurchläufen werden.

## Verwandt

- [Exec-Tool](/de/tools/exec)
- [Sitzungsverwaltung](/de/concepts/session)
