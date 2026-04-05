---
read_when:
    - Planung von Hintergrundjobs oder Aufweckvorgängen
    - Einbindung externer Trigger (Webhooks, Gmail) in OpenClaw
    - Entscheidung zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-05T12:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43b906914461aba9af327e7e8c22aa856f65802ec2da37ed0c4f872d229cfde6
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben zurück an einen Chat-Kanal oder einen Webhook-Endpunkt liefern.

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
- Jobs werden unter `~/.openclaw/cron/jobs.json` gespeichert, damit Neustarts keine Zeitpläne verlieren.
- Alle Cron-Ausführungen erstellen Einträge für [Hintergrundaufgaben](/automation/tasks).
- Einmalige Jobs (`--at`) werden standardmäßig nach erfolgreicher Ausführung automatisch gelöscht.
- Isolierte Cron-Ausführungen schließen nach bestem Bemühen nachverfolgte Browser-Tabs/Prozesse für ihre `cron:<jobId>`-Sitzung, wenn die Ausführung abgeschlossen ist, damit abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Ausführungen schützen außerdem vor veralteten Bestätigungsantworten. Wenn das
  erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything
together` und ähnliche Hinweise) und keine untergeordnete Subagent-Ausführung mehr
  für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der Zustellung
  noch einmal das tatsächliche Ergebnis an.

Die Aufgabenabstimmung für Cron gehört zur Laufzeit: Eine aktive Cron-Aufgabe bleibt aktiv, solange die
Cron-Laufzeit diesen Job noch als laufend verfolgt, auch wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr besitzt und das Kulanzfenster von 5 Minuten abgelaufen ist, kann die Wartung
die Aufgabe als `lost` markieren.

## Zeitplantypen

| Art     | CLI-Flag | Beschreibung                                                  |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)      |
| `every` | `--every`| Fester Intervall                                              |
| `cron`  | `--cron` | Cron-Ausdruck mit 5 oder 6 Feldern mit optionalem `--tz`      |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Uhrzeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um präzises Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

## Ausführungsstile

| Stil            | Wert von `--session` | Läuft in                 | Am besten geeignet für           |
| --------------- | -------------------- | ------------------------ | -------------------------------- |
| Hauptsitzung    | `main`               | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse   |
| Isoliert        | `isolated`           | Dedizierte `cron:<jobId>`| Berichte, Hintergrundaufgaben    |
| Aktuelle Sitzung| `current`            | Bei Erstellung gebunden  | Kontextbewusste wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhaft benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agenten-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Ausführungen hinweg bei und ermöglichen Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst der Laufzeit-Abbau jetzt auch Browser-Bereinigung nach bestem Bemühen für diese Cron-Sitzung. Fehler bei der Bereinigung werden ignoriert, damit das eigentliche Cron-Ergebnis trotzdem Vorrang hat.

Wenn isolierte Cron-Ausführungen Subagenten orchestrieren, bevorzugt die Zustellung außerdem
die endgültige Ausgabe des Nachkommens gegenüber veraltetem vorläufigem Text des Elternteils. Wenn Nachkommen noch laufen,
unterdrückt OpenClaw dieses teilweise Update des Elternteils, statt es anzukündigen.

### Payload-Optionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Thinking-Stufe
- `--light-context`: Einfügen der Workspace-Bootstrap-Datei überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden kann

`--model` verwendet das für diesen Job ausgewählte zulässige Modell. Wenn das angeforderte Modell
nicht zulässig ist, protokolliert Cron eine Warnung und greift stattdessen auf die Modellauswahl
des Agenten/Standards für diesen Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache
Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das Primärmodell des Agenten nicht mehr
als verborgenes zusätzliches Wiederholungsziel an.

Die Prioritätsreihenfolge der Modellauswahl für isolierte Jobs ist:

1. Gmail-Hook-Modellüberschreibung (wenn die Ausführung von Gmail kam und diese Überschreibung zulässig ist)
2. `model` in der Payload pro Job
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellauswahl des Agenten/Standards

Der Schnellmodus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration
`params.fastMode` hat, verwendet isoliertes Cron dies standardmäßig. Eine gespeicherte
Sitzungsüberschreibung für `fastMode` hat in beiden Richtungen weiterhin Vorrang vor der Konfiguration.

Wenn eine isolierte Ausführung auf eine Live-Übergabe bei Modellwechsel trifft, versucht Cron es erneut mit dem
gewechselten Provider/Modell und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn der
Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diese Auth-Profil-
Überschreibung. Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-
Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                |
| ---------- | ----------------------------------------------------------- |
| `announce` | Zusammenfassung an Zielkanal zustellen (Standard für isoliert) |
| `webhook`  | Abgeschlossene Ereignis-Payload per POST an eine URL senden |
| `none`     | Nur intern, keine Zustellung                                |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Slack-/Discord-/Mattermost-Ziele sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs, die Cron gehören, besitzt der Runner den endgültigen Zustellungspfad. Der
Agent wird aufgefordert, eine Klartext-Zusammenfassung zurückzugeben, und diese Zusammenfassung wird dann
über `announce`, `webhook` gesendet oder bei `none` intern behalten. `--no-deliver`
gibt die Zustellung nicht an den Agenten zurück; die Ausführung bleibt intern.

Wenn die ursprüngliche Aufgabe ausdrücklich sagt, dass ein externer Empfänger benachrichtigt werden soll,
sollte der Agent in seiner Ausgabe vermerken, wer/wo diese Nachricht hingehen soll, statt
zu versuchen, sie direkt zu senden.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn beides nicht gesetzt ist und der Job bereits über `announce` zustellt, fallen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, sofern der primäre Zustellmodus nicht `webhook` ist.

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

Isolierter Job mit Überschreibung für Modell und Thinking:

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

Gateway kann HTTP-Webhook-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

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

Token in Query-Strings werden abgelehnt.

### POST /hooks/wake

Ein Systemereignis für die Hauptsitzung in die Warteschlange stellen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Einen isolierten Agenten-Turn ausführen:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads mit Vorlagen oder Code-Transformationen in Aktionen vom Typ `wake` oder `agent` umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter loopback, tailnet oder einem vertrauenswürdigen Reverse-Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites `agentId`-Routing zu begrenzen.
- Belassen Sie `hooks.allowRequestSessionKey=false`, sofern Sie keine vom Aufrufer ausgewählten Sitzungen benötigen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie auch `hooks.allowedSessionKeyPrefixes`, um zulässige Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umhüllt.

## Gmail-PubSub-Integration

Binden Sie Gmail-Posteingangs-Trigger über Google PubSub an OpenClaw an.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Assistenten-Setup (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Automatischer Gateway-Start

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert die Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelles einmaliges Setup

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Thema erstellen und Gmail Push-Zugriff gewähren:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Die Watch starten:

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

# Einen Job jetzt erzwingen
openclaw cron run <jobId>

# Nur ausführen, wenn fällig
openclaw cron run <jobId> --due

# Ausführungsverlauf anzeigen
openclaw cron runs --id <jobId> --limit 50

# Einen Job löschen
openclaw cron remove <jobId>

# Agentenauswahl (Setups mit mehreren Agenten)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

Hinweis zur Modellüberschreibung:

- `openclaw cron add|edit --model ...` ändert das ausgewählte Modell des Jobs.
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell die isolierte Agenten-
  Ausführung.
- Wenn es nicht zulässig ist, warnt Cron und greift auf die Modellauswahl
  des Agenten/Standards für den Job zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache `--model`-Überschreibung mit
  keiner expliziten Fallback-Liste pro Job fällt nicht mehr auf das Primärmodell des Agenten
  als stilles zusätzliches Wiederholungsziel zurück.

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

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholung für Einmaljobs**: Vorübergehende Fehler (Ratenbegrenzung, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3-mal erneut versucht. Permanente Fehler werden sofort deaktiviert.

**Wiederholung für wiederkehrende Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach der nächsten erfolgreichen Ausführung zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Einträge für Ausführungs-Sitzungen. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Ausführungsprotokolldateien automatisch.

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

- Prüfen Sie `cron.enabled` und die Umgebungsvariable `OPENCLAW_SKIP_CRON`.
- Bestätigen Sie, dass das Gateway dauerhaft läuft.
- Prüfen Sie bei Zeitplänen vom Typ `cron` die Zeitzone (`--tz`) im Vergleich zur Zeitzone des Hosts.
- `reason: not-due` in der Ausführungsausgabe bedeutet, dass eine manuelle Ausführung mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Zustellmodus `none` bedeutet, dass keine externe Nachricht erwartet wird.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Auth-Fehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn die isolierte Ausführung nur das stille Token (`NO_REPLY` / `no_reply`) zurückgibt,
  unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-
  Zusammenfassungspfad in der Warteschlange, sodass nichts zurück in den Chat gepostet wird.
- Erwarten Sie bei isolierten Jobs, die Cron gehören, nicht, dass der Agent das message-Tool
  als Fallback verwendet. Der Runner besitzt die endgültige Zustellung; `--no-deliver` hält sie
  intern, statt eine direkte Sendung zu erlauben.

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- Zeitpläne vom Typ `at` ohne Zeitzone werden als UTC behandelt.
- Heartbeat-`activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/gateway/heartbeat) — periodische Turns der Hauptsitzung
- [Zeitzone](/concepts/timezone) — Zeitzonenkonfiguration
