---
read_when:
    - Planen von Hintergrundjobs oder Weckvorgängen
    - Einbinden externer Trigger (Webhooks, Gmail) in OpenClaw
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-23T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agent zur richtigen Zeit und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt zustellen.

## Schnellstart

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

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` gespeichert, damit Neustarts Zeitpläne nicht verlieren.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn du Cron-Definitionen in Git nachverfolgst, versioniere `jobs.json` und setze `jobs-state.json` in `.gitignore`.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, behandeln Jobs aber möglicherweise als neu, da Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig automatisch gelöscht.
- Isolierte Cron-Läufe schließen nach bestem Bemühen verfolgte Browser-Tabs/Prozesse für ihre Sitzung `cron:<jobId>`, wenn der Lauf abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Läufe schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein nachgeordneter Subagent-Lauf noch für die endgültige Antwort verantwortlich ist, fordert OpenClaw einmal erneut das eigentliche Ergebnis an, bevor es zugestellt wird.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron ist laufzeiteigen: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr verwaltet und das Kulanzfenster von 5 Minuten abläuft, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                                  |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)      |
| `every` | `--every`| Festes Intervall                                              |
| `cron`  | `--cron` | Cron-Ausdruck mit 5 oder 6 Feldern mit optionalem `--tz`      |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Füge `--tz America/New_York` hinzu, um nach lokaler Uhrzeit zu planen.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu verringern. Verwende `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag des Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für den Tag des Monats als auch für den Wochentag kein Wildcard sind, gleicht croner ab, wenn **eines** der Felder übereinstimmt — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Das wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu verlangen, verwende den `+`-Wochentag-Modifikator von Croner (`0 9 15 * +1`) oder plane nach einem Feld und prüfe das andere im Prompt oder Befehl deines Jobs.

## Ausführungsstile

| Stil            | Wert für `--session` | Läuft in                 | Am besten geeignet für          |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Hauptsitzung    | `main`               | Nächster Heartbeat-Zug   | Erinnerungen, Systemereignisse  |
| Isoliert        | `isolated`           | Dediziertes `cron:<jobId>` | Berichte, Hintergrundaufgaben |
| Aktuelle Sitzung| `current`            | Zum Erstellungszeitpunkt gebunden | Wiederkehrende kontextbezogene Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Persistente benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agent-Zug mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) erhalten den Kontext über Läufe hinweg und ermöglichen so Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst das Herunterfahren der Laufzeit jetzt auch die Browser-Bereinigung nach bestem Bemühen für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das eigentliche Cron-Ergebnis weiterhin Vorrang hat.

Isolierte Cron-Läufe entsorgen außerdem alle gebündelten MCP-Laufzeitinstanzen, die für den Job über den gemeinsamen Laufzeit-Bereinigungspfad erstellt wurden. Das entspricht dem Abbau von MCP-Clients in Hauptsitzungen und benutzerdefinierten Sitzungen, sodass isolierte Cron-Jobs keine stdio-Kindprozesse oder langlebigen MCP-Verbindungen über mehrere Läufe hinweg leaken.

Wenn isolierte Cron-Läufe Subagents orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe des letzten Nachfahren gegenüber veraltetem vorläufigem Text des Elternlaufs. Wenn Nachfahren noch laufen, unterdrückt OpenClaw dieses teilweise Eltern-Update, statt es anzukündigen.

### Payload-Optionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Thinking-Stufe
- `--light-context`: Workspace-Bootstrap-Dateiinjektion überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden darf

`--model` verwendet das für diesen Job ausgewählte erlaubte Modell. Wenn das angeforderte Modell nicht erlaubt ist, protokolliert Cron eine Warnung und greift stattdessen auf die Auswahl des Agent-/Standardmodells für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das Primärmodell des Agenten nicht mehr als verborgenes zusätzliches Wiederholungsziel an.

Die Prioritätsreihenfolge der Modellauswahl für isolierte Jobs ist:

1. Modellüberschreibung des Gmail-Hooks (wenn der Lauf von Gmail kam und diese Überschreibung erlaubt ist)
2. `model` im Payload pro Job
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Auswahl des Agent-/Standardmodells

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung für `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem gewechselten Provider/Modell erneut und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diese Überschreibung des Auth-Profils. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wiederholungen wegen Wechseln bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                       |
| ---------- | ------------------------------------------------------------------ |
| `announce` | Stellt den finalen Text ersatzweise an das Ziel zu, wenn der Agent nichts gesendet hat |
| `webhook`  | POSTet den Payload des abgeschlossenen Ereignisses an eine URL     |
| `none`     | Keine Runner-Ersatzzustellung                                      |

Verwende `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwende `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs ist die Chat-Zustellung gemeinsam. Wenn eine Chat-Route verfügbar ist, kann der Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Ersatzankündigung. Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agent-Zug mit der endgültigen Antwort macht.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` legt einen globalen Standard für Fehlerbenachrichtigungen fest.
- `job.delivery.failureDestination` überschreibt das pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre Zustellmodus ist `webhook`.

## CLI-Beispiele

Einmalige Erinnerung (Hauptsitzung):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

Wiederkehrender isolierter Job mit Zustellung:

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

Isolierter Job mit Überschreibung von Modell und Thinking:

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

Das Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentifizierung

Jede Anfrage muss das Hook-Token per Header enthalten:

- `Authorization: Bearer <token>` (empfohlen)
- `x-openclaw-token: <token>`

Tokens in der Query-String werden abgelehnt.

### POST /hooks/wake

Ein Systemereignis für die Hauptsitzung einreihen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Einen isolierten Agent-Zug ausführen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads per Templates oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halte Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.
- Verwende ein dediziertes Hook-Token; verwende Gateway-Auth-Tokens nicht erneut.
- Halte `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setze `hooks.allowedAgentIds`, um explizites Routing über `agentId` einzuschränken.
- Behalte `hooks.allowRequestSessionKey=false` bei, es sei denn, du brauchst vom Aufrufer ausgewählte Sitzungen.
- Wenn du `hooks.allowRequestSessionKey` aktivierst, setze auch `hooks.allowedSessionKeyPrefixes`, um erlaubte Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinde Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dadurch wird die Konfiguration `hooks.gmail` geschrieben, das Gmail-Preset aktiviert und Tailscale Funnel für den Push-Endpunkt verwendet.

### Automatischer Start des Gateway

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setze `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um darauf zu verzichten.

### Manuelle einmalige Einrichtung

1. Wähle das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Erstelle das Topic und erteile Gmail Zugriff für Push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Starte den Watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail-Modellüberschreibung

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

## Jobs verwalten

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

Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell erlaubt ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht erlaubt ist, gibt Cron eine Warnung aus und greift auf die Agent-/Standardmodellauswahl des Jobs zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Überschreibung mit `--model` ohne explizite Fallback-Liste pro Job fällt nicht mehr auf das Primärmodell des Agenten als stilles zusätzliches Wiederholungsziel zurück.

## Konfiguration

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

Die Laufzeit-Zustands-Sidecar-Datei wird aus `cron.store` abgeleitet: Ein `.json`-Store wie
`~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad
ohne Suffix `.json` `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholung bei Einmal-Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal erneut versucht. Permanente Fehler deaktivieren sofort.

**Wiederholung bei wiederkehrenden Jobs**: Exponentielles Backoff (30 s bis 60 min) zwischen Wiederholungen. Das Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt Einträge isolierter Lauf-Sitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Lauf-Log-Dateien automatisch.

## Fehlerbehebung

### Befehlsleiter

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

### Cron wird nicht ausgelöst

- Prüfe `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
- Stelle sicher, dass das Gateway durchgehend läuft.
- Überprüfe bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
- `reason: not-due` in der Laufausgabe bedeutet, dass ein manueller Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Der Zustellmodus `none` bedeutet, dass keine Ersatzzustellung durch den Runner erwartet wird. Der Agent kann bei verfügbarer Chat-Route trotzdem direkt mit dem Tool `message` senden.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die eingereihte Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
- Wenn der Agent dem Benutzer selbst schreiben soll, prüfe, ob der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Züge der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
