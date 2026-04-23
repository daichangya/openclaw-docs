---
read_when:
    - Debuggen wiederholter Node-Exec-Abschlussereignisse
    - An Heartbeat-/System-Event-Deduplizierung arbeiten
summary: Untersuchungsnotizen zur doppelten Injektion des Abschlusses asynchroner Exec-Ausführung
title: Untersuchung zur doppelten Vervollständigung von Async Exec
x-i18n:
    generated_at: "2026-04-23T14:06:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b0a3287b78bbc4c41e4354e9062daba7ae790fa207eee9a5f77515b958b510b
    source_path: refactor/async-exec-duplicate-completion-investigation.md
    workflow: 15
---

# Untersuchung zur doppelten Vervollständigung von Async Exec

## Geltungsbereich

- Sitzung: `agent:main:telegram:group:-1003774691294:topic:1`
- Symptom: Dieselbe Async-Exec-Vervollständigung für Sitzung/Run `keen-nexus` wurde in LCM zweimal als Benutzer-Turn aufgezeichnet.
- Ziel: Feststellen, ob dies höchstwahrscheinlich eine doppelte Sitzungsinjektion oder nur ein einfacher Retry der ausgehenden Zustellung ist.

## Fazit

Höchstwahrscheinlich handelt es sich um eine **doppelte Sitzungsinjektion**, nicht um einen reinen Retry der ausgehenden Zustellung.

Die stärkste Lücke auf Gateway-Seite liegt im **Node-Exec-Vervollständigungspfad**:

1. Ein Node-seitiges Exec-Ende sendet `exec.finished` mit vollständigem `runId`.
2. Gateway `server-node-events` wandelt dies in ein Systemereignis um und fordert einen Heartbeat an.
3. Der Heartbeat-Lauf injiziert den geleerten Systemereignisblock in den Agent-Prompt.
4. Der eingebettete Runner speichert diesen Prompt als neuen Benutzer-Turn im Sitzungs-Transkript.

Wenn dasselbe `exec.finished` aus irgendeinem Grund zweimal mit demselben `runId` das Gateway erreicht (Replay, doppelte Zustellung nach Reconnect, Upstream-Resend, doppelter Producer), hat OpenClaw auf diesem Pfad derzeit **keine Idempotenzprüfung mit Schlüssel `runId`/`contextKey`**. Die zweite Kopie wird zu einer zweiten Benutzernachricht mit demselben Inhalt.

## Exakter Codepfad

### 1. Producer: Node-Exec-Vervollständigungsereignis

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` sendet `node.event` mit Ereignis `exec.finished`.
  - Die Payload enthält `sessionKey` und vollständiges `runId`.

### 2. Gateway-Ereignisaufnahme

- `src/gateway/server-node-events.ts:574-640`
  - Behandelt `exec.finished`.
  - Erstellt Text:
    - `Exec finished (node=..., id=<runId>, code ...)`
  - Reiht ihn ein über:
    - `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Fordert sofort ein Wake an:
    - `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. Schwäche bei der Deduplizierung von Systemereignissen

- `src/infra/system-events.ts:90-115`
  - `enqueueSystemEvent(...)` unterdrückt nur **aufeinanderfolgende doppelte Texte**:
    - `if (entry.lastText === cleaned) return false`
  - Es speichert `contextKey`, verwendet `contextKey` aber **nicht** für Idempotenz.
  - Nach dem Leeren wird die Deduplizierungsunterdrückung zurückgesetzt.

Das bedeutet: Ein wiederholtes `exec.finished` mit demselben `runId` kann später erneut akzeptiert werden, obwohl der Code bereits einen stabilen Kandidaten für Idempotenz hatte (`exec:<runId>`).

### 4. Wake-Handling ist nicht der primäre Duplikator

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakes werden per `(agentId, sessionKey)` zusammengefasst.
  - Doppelte Wake-Anfragen für dasselbe Ziel fallen zu einem einzelnen ausstehenden Wake-Eintrag zusammen.

Dadurch ist **doppeltes Wake-Handling allein** eine schwächere Erklärung als doppelte Ereignisaufnahme.

### 5. Heartbeat verbraucht das Ereignis und wandelt es in Prompt-Eingabe um

- `src/infra/heartbeat-runner.ts:535-574`
  - Preflight schaut in ausstehende Systemereignisse und klassifiziert Läufe vom Typ Exec-Event.
- `src/auto-reply/reply/session-system-events.ts:86-90`
  - `drainFormattedSystemEvents(...)` leert die Queue für die Sitzung.
- `src/auto-reply/reply/get-reply-run.ts:400-427`
  - Der geleerte Systemereignisblock wird dem Agent-Prompt-Body vorangestellt.

### 6. Transkript-Injektionspunkt

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` übergibt den vollständigen Prompt an die eingebettete PI-Sitzung.
  - Das ist der Punkt, an dem der von der Vervollständigung abgeleitete Prompt zu einem gespeicherten Benutzer-Turn wird.

Sobald also dasselbe Systemereignis zweimal in den Prompt eingebaut wird, sind doppelte LCM-Benutzernachrichten erwartbar.

## Warum ein reiner Retry der ausgehenden Zustellung weniger wahrscheinlich ist

Es gibt einen realen Fehlerpfad für ausgehende Zustellung im Heartbeat-Runner:

- `src/infra/heartbeat-runner.ts:1194-1242`
  - Die Antwort wird zuerst erzeugt.
  - Die ausgehende Zustellung erfolgt später über `deliverOutboundPayloads(...)`.
  - Ein Fehler dort gibt `{ status: "failed" }` zurück.

Für denselben Eintrag in der Systemereignis-Queue reicht dies allein jedoch **nicht aus**, um die doppelten Benutzer-Turns zu erklären:

- `src/auto-reply/reply/session-system-events.ts:86-90`
  - Die Systemereignis-Queue ist bereits vor der ausgehenden Zustellung geleert.

Ein Retry beim Senden an den Kanal würde also das exakt gleiche in die Queue eingereihte Ereignis nicht von selbst erneut erzeugen. Er könnte fehlende/fehlgeschlagene externe Zustellung erklären, aber nicht allein eine zweite identische Benutzernachricht in der Sitzung.

## Sekundäre Möglichkeit mit geringerer Sicherheit

Es gibt eine Full-Run-Retry-Schleife im Agent-Runner:

- `src/auto-reply/reply/agent-runner-execution.ts:741-1473`
  - Bestimmte transiente Fehler können den gesamten Lauf wiederholen und denselben `commandBody` erneut übermitteln.

Das kann einen gespeicherten Benutzer-Prompt **innerhalb derselben Antwortausführung** duplizieren, wenn der Prompt bereits angehängt wurde, bevor die Retry-Bedingung ausgelöst wurde.

Ich bewerte dies niedriger als doppelte Aufnahme von `exec.finished`, weil:

- die beobachtete Lücke etwa 51 Sekunden betrug, was eher wie ein zweiter Wake/Turn als wie ein In-Process-Retry aussieht;
- der Bericht bereits wiederholte Fehlversuche beim Senden von Nachrichten erwähnt, was eher auf einen separaten späteren Turn als auf einen unmittelbaren Modell-/Laufzeit-Retry hindeutet.

## Root-Cause-Hypothese

Hypothese mit der höchsten Sicherheit:

- Die Vervollständigung von `keen-nexus` kam über den **Node-Exec-Ereignispfad**.
- Dasselbe `exec.finished` wurde zweimal an `server-node-events` zugestellt.
- Gateway akzeptierte beide, weil `enqueueSystemEvent(...)` nicht per `contextKey` / `runId` dedupliziert.
- Jedes akzeptierte Ereignis löste einen Heartbeat aus und wurde als Benutzer-Turn in das PI-Transkript injiziert.

## Vorgeschlagener kleiner chirurgischer Fix

Falls ein Fix gewünscht ist, ist die kleinste Änderung mit hohem Nutzen:

- Idempotenz für Exec-/Systemereignisse so ändern, dass `contextKey` für einen kurzen Horizont berücksichtigt wird, zumindest für exakte Wiederholungen von `(sessionKey, contextKey, text)`;
- oder eine dedizierte Deduplizierung in `server-node-events` für `exec.finished` hinzufügen, mit Schlüssel `(sessionKey, runId, event kind)`.

Das würde wiederholte Duplikate von `exec.finished` direkt blockieren, bevor sie zu Sitzungs-Turns werden.
