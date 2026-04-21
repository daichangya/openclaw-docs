---
read_when:
    - Planen von Hintergrundjobs oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw integrieren
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-21T06:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e25f4dc8ee7b8f88e22d5cbc86e4527a9f5ac0ab4921e7874f76b186054682a3
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt auf und kann Ausgaben an einen Chat-Kanal oder einen Webhook-Endpunkt zurückliefern.

## Schnellstart

```bash
# Eine einmalige Erinnerung hinzufügen
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Ihre Jobs prüfen
openclaw cron list

# Ausführungsverlauf anzeigen
openclaw cron runs --id <job-id>
```

## So funktioniert Cron

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, damit Zeitpläne bei Neustarts nicht verloren gehen.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, verfolgen Sie `jobs.json` und setzen Sie `jobs-state.json` in `.gitignore`.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, weil Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen nach Abschluss des Laufs verfolgte Browser-Tabs/Prozesse für ihre Sitzung `cron:<jobId>`, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything together` und ähnliche Hinweise) und kein untergeordneter Subagent-Lauf mehr für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung einmalig erneut das eigentliche Ergebnis an.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron ist laufzeitgesteuert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr verwaltet und das 5-Minuten-Toleranzfenster abgelaufen ist, kann die Wartung die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                           |
| ------- | -------- | ------------------------------------------------------ |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`) |
| `every` | `--every` | Festes Intervall                                      |
| `cron`  | `--cron` | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz` |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` hinzu, um nach lokaler Uhrzeit zu planen.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu verringern. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag-des-Monats als auch für Wochentag keine Wildcards sind, trifft croner zu, wenn **eines** der beiden Felder passt — nicht beide. Das ist das Standardverhalten von Vixie-Cron.

```
# Beabsichtigt: "9 Uhr am 15., aber nur wenn es ein Montag ist"
# Tatsächlich:  "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Dies wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Wenn beide Bedingungen erforderlich sein sollen, verwenden Sie den `+`-Wochentagsmodifikator von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert für `--session` | Läuft in                 | Am besten geeignet für         |
| --------------- | -------------------- | ------------------------ | ------------------------------ |
| Hauptsitzung    | `main`               | Nächste Heartbeat-Runde  | Erinnerungen, Systemereignisse |
| Isoliert        | `isolated`           | Dedizierte `cron:<jobId>` | Berichte, Hintergrundaufgaben  |
| Aktuelle Sitzung | `current`           | Beim Erstellen gebunden  | Wiederkehrende kontextbezogene Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsitzung** reihen ein Systemereignis ein und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen eine dedizierte Agent-Runde mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Läufe hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst der Laufzeitabbau jetzt auch das nach bestem Bemühen ausgeführte Browser-Cleanup für diese Cron-Sitzung. Fehler beim Cleanup werden ignoriert, damit das eigentliche Cron-Ergebnis weiterhin Vorrang hat.

Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige Ausgabe des Nachfahren gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachfahren noch laufen, unterdrückt OpenClaw dieses teilweise Eltern-Update, statt es anzukündigen.

### Nutzlastoptionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Denkstufe
- `--light-context`: Überspringt die Injektion der Bootstrap-Datei für den Workspace
- `--tools exec,read`: Schränkt ein, welche Tools der Job verwenden darf

`--model` verwendet das für diesen Job ausgewählte zulässige Modell. Wenn das angeforderte Modell nicht zulässig ist, protokolliert Cron eine Warnung und fällt stattdessen auf die Modellwahl des Agenten/Standards für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt den primären Agenten nicht mehr als verstecktes zusätzliches Retry-Ziel an.

Die Reihenfolge der Modellwahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn der Lauf von Gmail kam und diese Überschreibung zulässig ist)
2. `model` in der Nutzlast pro Job
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellwahl des Agenten/Standards

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration `params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung `fastMode` hat in beide Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe stößt, versucht Cron es mit dem umgeschalteten Provider/Modell erneut und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diese Auth-Profil-Überschreibung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                |
| ---------- | ----------------------------------------------------------- |
| `announce` | Zustellung der Zusammenfassung an den Zielkanal (Standard für isolierte Jobs) |
| `webhook`  | Sendet die Nutzlast des abgeschlossenen Ereignisses per POST an eine URL |
| `none`     | Nur intern, keine Zustellung                                |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs in Besitz von Cron verwaltet der Runner den endgültigen Zustellpfad. Der Agent wird aufgefordert, eine Klartext-Zusammenfassung zurückzugeben, und diese Zusammenfassung wird dann über `announce` oder `webhook` gesendet oder bei `none` intern behalten. `--no-deliver` gibt die Zustellung nicht an den Agenten zurück; der Lauf bleibt intern.

Wenn in der ursprünglichen Aufgabe ausdrücklich steht, dass ein externer Empfänger benachrichtigt werden soll, sollte der Agent in seiner Ausgabe vermerken, wer/wo benachrichtigt werden soll, statt zu versuchen, direkt zu senden.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
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

Isolierter Job mit Überschreibung von Modell und Denkstufe:

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

Reiht ein Systemereignis für die Hauptsitzung ein:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Führt eine isolierte Agent-Runde aus:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Nutzlasten mit Vorlagen oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie Gateway-Auth-Tokens nicht erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing einzuschränken.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie zusätzlich `hooks.allowedSessionKeyPrefixes`, um zulässige Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Nutzlasten werden standardmäßig mit Sicherheitsgrenzen umschlossen.

## Gmail-PubSub-Integration

Verbinden Sie Gmail-Posteingangs-Trigger über Google PubSub mit OpenClaw.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Einrichtung per Assistent (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert die Gmail-Voreinstellung und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert die Überwachung automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Erstellen Sie ein Topic und gewähren Sie Gmail Zugriff für Push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Starten Sie die Überwachung:

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
# Alle Jobs auflisten
openclaw cron list

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job jetzt sofort ausführen
openclaw cron run <jobId>

# Nur ausführen, wenn fällig
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Einen Job löschen
openclaw cron remove <jobId>

# Agent-Auswahl (Multi-Agent-Setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell den isolierten Agent-Lauf.
- Wenn es nicht zulässig ist, gibt Cron eine Warnung aus und fällt auf die Modellwahl des Agenten/Standards für den Job zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache `--model`-Überschreibung ohne explizite Fallback-Liste pro Job fällt nicht mehr auf den primären Agenten als stilles zusätzliches Retry-Ziel zurück.

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

Die Sidecar-Datei für den Laufzeitzustand wird aus `cron.store` abgeleitet: Ein `.json`-Store wie
`~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad
ohne Suffix `.json` `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholung bei einmaligen Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal wiederholt. Permanente Fehler deaktivieren den Job sofort.

**Wiederholung bei wiederkehrenden Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt Einträge isolierter Lauf-Sitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` kürzen Run-Log-Dateien automatisch.

## Fehlerbehebung

### Befehlsreihenfolge

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

- Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
- Stellen Sie sicher, dass das Gateway kontinuierlich läuft.
- Verifizieren Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
- `reason: not-due` in der Ausführungsausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Der Zustellmodus `none` bedeutet, dass keine externe Nachricht erwartet wird.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn der isolierte Lauf nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad mit der eingereihten Zusammenfassung, sodass nichts zurück in den Chat gepostet wird.
- Erwarten Sie bei isolierten Jobs in Besitz von Cron nicht, dass der Agent das Nachrichtentool als Fallback verwendet. Der Runner verwaltet die endgültige Zustellung; `--no-deliver` hält sie intern, statt ein direktes Senden zu erlauben.

### Zeitzonen-Fallstricke

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — periodische Runden der Hauptsitzung
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
