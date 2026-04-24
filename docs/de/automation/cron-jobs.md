---
read_when:
    - Planen von Hintergrundjobs oder Aufweckvorgängen
    - Externe Trigger (Webhooks, Gmail) in OpenClaw einbinden
    - Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
summary: Geplante Jobs, Webhooks und Gmail-PubSub-Trigger für den Gateway-Scheduler
title: Geplante Aufgaben
x-i18n:
    generated_at: "2026-04-24T06:26:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# Geplante Aufgaben (Cron)

Cron ist der integrierte Scheduler des Gateway. Er speichert Jobs dauerhaft, weckt den Agenten zum richtigen Zeitpunkt und kann Ausgaben an einen Chat-Kanal oder einen Webhook-Endpunkt zurückliefern.

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
openclaw cron show <job-id>

# Ausführungsverlauf anzeigen
openclaw cron runs --id <job-id>
```

## Wie Cron funktioniert

- Cron läuft **innerhalb des Gateway**-Prozesses (nicht innerhalb des Modells).
- Job-Definitionen werden unter `~/.openclaw/cron/jobs.json` dauerhaft gespeichert, damit Neustarts keine Zeitpläne verlieren.
- Der Laufzeit-Ausführungsstatus wird daneben in `~/.openclaw/cron/jobs-state.json` gespeichert. Wenn Sie Cron-Definitionen in Git nachverfolgen, versionieren Sie `jobs.json` und fügen Sie `jobs-state.json` zu `.gitignore` hinzu.
- Nach der Aufteilung können ältere OpenClaw-Versionen `jobs.json` lesen, Jobs aber möglicherweise als neu behandeln, da Laufzeitfelder jetzt in `jobs-state.json` liegen.
- Alle Cron-Ausführungen erstellen Datensätze für [background task](/de/automation/tasks).
- Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig automatisch gelöscht.
- Isolierte Cron-Läufe schließen nach bestem Bemühen verfolgte Browser-Tabs/Prozesse für ihre `cron:<jobId>`-Sitzung, wenn der Lauf abgeschlossen ist, sodass abgekoppelte Browser-Automatisierung keine verwaisten Prozesse hinterlässt.
- Isolierte Cron-Läufe schützen außerdem vor veralteten Bestätigungsantworten. Wenn das
  erste Ergebnis nur ein vorläufiges Status-Update ist (`on it`, `pulling everything
together` und ähnliche Hinweise) und kein nachgelagerter Subagent-Lauf mehr
  für die endgültige Antwort verantwortlich ist, fordert OpenClaw vor der
  Zustellung einmalig das tatsächliche Ergebnis nach.

<a id="maintenance"></a>

Die Aufgabenabstimmung für Cron ist laufzeitgesteuert: Eine aktive Cron-Aufgabe bleibt aktiv, solange die
Cron-Laufzeit diesen Job noch als laufend verfolgt, selbst wenn noch eine alte untergeordnete Sitzungszeile existiert.
Sobald die Laufzeit den Job nicht mehr besitzt und das 5-Minuten-Gnadenfenster abgelaufen ist, kann die Wartung
die Aufgabe als `lost` markieren.

## Zeitplantypen

| Typ     | CLI-Flag | Beschreibung                                                  |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | Einmaliger Zeitstempel (ISO 8601 oder relativ wie `20m`)      |
| `every` | `--every`| Fester Intervall                                              |
| `cron`  | `--cron` | 5-Feld- oder 6-Feld-Cron-Ausdruck mit optionalem `--tz`       |

Zeitstempel ohne Zeitzone werden als UTC behandelt. Fügen Sie `--tz America/New_York` für lokale Uhrzeitplanung hinzu.

Wiederkehrende Ausdrücke zur vollen Stunde werden automatisch um bis zu 5 Minuten gestaffelt, um Lastspitzen zu reduzieren. Verwenden Sie `--exact`, um exaktes Timing zu erzwingen, oder `--stagger 30s` für ein explizites Fenster.

### Tag-des-Monats und Wochentag verwenden ODER-Logik

Cron-Ausdrücke werden von [croner](https://github.com/Hexagon/croner) geparst. Wenn sowohl die Felder für Tag des Monats als auch Wochentag kein Wildcard sind, trifft croner zu, wenn **eines** der Felder passt — nicht beide. Das ist das Standardverhalten von Vixie cron.

```
# Beabsichtigt: "9 Uhr am 15., aber nur wenn es ein Montag ist"
# Tatsächlich:  "9 Uhr an jedem 15., UND 9 Uhr an jedem Montag"
0 9 15 * 1
```

Das wird etwa 5–6 Mal pro Monat ausgelöst statt 0–1 Mal pro Monat. OpenClaw verwendet hier das standardmäßige ODER-Verhalten von Croner. Um beide Bedingungen zu erzwingen, verwenden Sie den `+`-Wochentag-Modifikator von Croner (`0 9 15 * +1`) oder planen Sie nach einem Feld und prüfen Sie das andere im Prompt oder Befehl Ihres Jobs.

## Ausführungsstile

| Stil            | Wert für `--session` | Läuft in                 | Am besten geeignet für           |
| --------------- | -------------------- | ------------------------ | -------------------------------- |
| Hauptsitzung    | `main`               | Nächster Heartbeat-Turn  | Erinnerungen, Systemereignisse   |
| Isoliert        | `isolated`           | Dediziertes `cron:<jobId>` | Berichte, Hintergrundaufgaben  |
| Aktuelle Sitzung| `current`            | Bei Erstellung gebunden  | Kontextabhängige wiederkehrende Arbeit |
| Benutzerdefinierte Sitzung | `session:custom-id` | Dauerhafte benannte Sitzung | Workflows, die auf Verlauf aufbauen |

Jobs in der **Hauptsitzung** stellen ein Systemereignis in die Warteschlange und wecken optional den Heartbeat (`--wake now` oder `--wake next-heartbeat`). **Isolierte** Jobs führen einen dedizierten Agenten-Turn mit einer frischen Sitzung aus. **Benutzerdefinierte Sitzungen** (`session:xxx`) behalten Kontext über mehrere Läufe hinweg bei und ermöglichen so Workflows wie tägliche Standups, die auf vorherigen Zusammenfassungen aufbauen.

Bei isolierten Jobs umfasst das Laufzeit-Teardown jetzt auch die Browser-Bereinigung nach bestem Bemühen für diese Cron-Sitzung. Bereinigungsfehler werden ignoriert, damit das tatsächliche Cron-Ergebnis weiterhin Vorrang hat.

Isolierte Cron-Läufe geben außerdem alle gebündelten MCP-Laufzeitinstanzen frei, die für den Job über den gemeinsamen Laufzeit-Bereinigungspfad erstellt wurden. Das entspricht dem Abbau von MCP-Clients in Hauptsitzungen und benutzerdefinierten Sitzungen, sodass isolierte Cron-Jobs keine `stdio`-Kindprozesse oder langlebigen MCP-Verbindungen über mehrere Läufe hinweg durchsickern lassen.

Wenn isolierte Cron-Läufe Subagenten orchestrieren, bevorzugt die Zustellung außerdem die endgültige
Ausgabe des letzten Nachfahren gegenüber veraltetem vorläufigem Text des Elternprozesses. Wenn Nachfahren noch
laufen, unterdrückt OpenClaw dieses teilweise Eltern-Update, statt es anzukündigen.

### Payload-Optionen für isolierte Jobs

- `--message`: Prompt-Text (für isolierte Jobs erforderlich)
- `--model` / `--thinking`: Überschreibungen für Modell und Denkstufe
- `--light-context`: Workspace-Bootstrap-Dateiinjektion überspringen
- `--tools exec,read`: einschränken, welche Tools der Job verwenden darf

`--model` verwendet das für diesen Job ausgewählte zulässige Modell. Wenn das angeforderte Modell
nicht zulässig ist, protokolliert Cron eine Warnung und greift stattdessen auf die Modellwahl des
Agenten/Standardmodells für den Job zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine reine
Modellüberschreibung ohne explizite jobbezogene Fallback-Liste hängt das Primärmodell des Agenten nicht mehr als
verstecktes zusätzliches Wiederholungsziel an.

Die Prioritätsreihenfolge der Modellauswahl für isolierte Jobs ist:

1. Modellüberschreibung durch Gmail-Hook (wenn der Lauf von Gmail kam und diese Überschreibung zulässig ist)
2. Jobbezogene Payload `model`
3. Gespeicherte Modellüberschreibung der Cron-Sitzung
4. Modellwahl des Agenten/Standardmodells

Der schnelle Modus folgt ebenfalls der aufgelösten Live-Auswahl. Wenn die ausgewählte Modellkonfiguration
`params.fastMode` hat, verwenden isolierte Cron-Läufe dies standardmäßig. Eine gespeicherte Sitzungsüberschreibung
für `fastMode` hat weiterhin in beide Richtungen Vorrang vor der Konfiguration.

Wenn ein isolierter Lauf auf eine Live-Modellwechsel-Übergabe trifft, versucht Cron es mit dem
gewechselten Provider/Modell erneut und speichert diese Live-Auswahl vor dem erneuten Versuch. Wenn
der Wechsel auch ein neues Auth-Profil mitbringt, speichert Cron auch diese Überschreibung des Auth-Profils.
Wiederholungen sind begrenzt: Nach dem ersten Versuch plus 2 Wechsel-Wiederholungen bricht Cron ab, statt endlos zu schleifen.

## Zustellung und Ausgabe

| Modus      | Was passiert                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Stellt den endgültigen Text als Fallback an das Ziel zu, wenn der Agent nicht gesendet hat |
| `webhook`  | Sendet die Payload des abgeschlossenen Ereignisses per POST an eine URL |
| `none`     | Keine Fallback-Zustellung durch den Runner                          |

Verwenden Sie `--announce --channel telegram --to "-1001234567890"` für die Zustellung an einen Kanal. Für Telegram-Forenthemen verwenden Sie `-1001234567890:topic:123`. Ziele in Slack/Discord/Mattermost sollten explizite Präfixe verwenden (`channel:<id>`, `user:<id>`).

Bei isolierten Jobs wird die Chat-Zustellung gemeinsam genutzt. Wenn eine Chat-Route verfügbar ist, kann der
Agent das Tool `message` auch dann verwenden, wenn der Job `--no-deliver` nutzt. Wenn der
Agent an das konfigurierte/aktuelle Ziel sendet, überspringt OpenClaw die Fallback-Ankündigung.
Andernfalls steuern `announce`, `webhook` und `none` nur, was der Runner nach dem Agenten-Turn
mit der endgültigen Antwort macht.

Fehlerbenachrichtigungen folgen einem separaten Zielpfad:

- `cron.failureDestination` setzt einen globalen Standard für Fehlerbenachrichtigungen.
- `job.delivery.failureDestination` überschreibt dies pro Job.
- Wenn keines von beiden gesetzt ist und der Job bereits über `announce` zustellt, greifen Fehlerbenachrichtigungen jetzt auf dieses primäre Ankündigungsziel zurück.
- `delivery.failureDestination` wird nur bei Jobs mit `sessionTarget="isolated"` unterstützt, außer wenn der primäre Zustellmodus `webhook` ist.

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

Isolierter Job mit Modell- und Denkstufen-Überschreibung:

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

Das Gateway kann HTTP-Webhooks-Endpunkte für externe Trigger bereitstellen. In der Konfiguration aktivieren:

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

Stellt ein Systemereignis für die Hauptsitzung in die Warteschlange:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (erforderlich): Ereignisbeschreibung
- `mode` (optional): `now` (Standard) oder `next-heartbeat`

### POST /hooks/agent

Führt einen isolierten Agenten-Turn aus:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

Felder: `message` (erforderlich), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

### Zugeordnete Hooks (POST /hooks/\<name\>)

Benutzerdefinierte Hook-Namen werden über `hooks.mappings` in der Konfiguration aufgelöst. Zuordnungen können beliebige Payloads per Templates oder Code-Transformationen in `wake`- oder `agent`-Aktionen umwandeln.

### Sicherheit

- Halten Sie Hook-Endpunkte hinter Loopback, Tailnet oder einem vertrauenswürdigen Reverse Proxy.
- Verwenden Sie ein dediziertes Hook-Token; verwenden Sie keine Gateway-Auth-Tokens erneut.
- Halten Sie `hooks.path` auf einem dedizierten Unterpfad; `/` wird abgelehnt.
- Setzen Sie `hooks.allowedAgentIds`, um explizites Routing über `agentId` einzuschränken.
- Lassen Sie `hooks.allowRequestSessionKey=false`, es sei denn, Sie benötigen vom Aufrufer ausgewählte Sitzungen.
- Wenn Sie `hooks.allowRequestSessionKey` aktivieren, setzen Sie zusätzlich `hooks.allowedSessionKeyPrefixes`, um zulässige Formen von Sitzungsschlüsseln einzuschränken.
- Hook-Payloads werden standardmäßig mit Sicherheitsgrenzen umhüllt.

## Gmail-PubSub-Integration

Binden Sie Gmail-Postfach-Trigger über Google PubSub an OpenClaw an.

**Voraussetzungen**: `gcloud` CLI, `gog` (gogcli), aktivierte OpenClaw-Hooks, Tailscale für den öffentlichen HTTPS-Endpunkt.

### Assistentengestützte Einrichtung (empfohlen)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Dies schreibt die Konfiguration `hooks.gmail`, aktiviert das Gmail-Preset und verwendet Tailscale Funnel für den Push-Endpunkt.

### Gateway-Autostart

Wenn `hooks.enabled=true` und `hooks.gmail.account` gesetzt ist, startet das Gateway beim Booten `gog gmail watch serve` und erneuert den Watch automatisch. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.

### Manuelle einmalige Einrichtung

1. Wählen Sie das GCP-Projekt aus, dem der von `gog` verwendete OAuth-Client gehört:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Erstellen Sie das Topic und gewähren Sie Gmail Zugriff für Push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Starten Sie den Watch:

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

# Einen Job anzeigen, einschließlich aufgelöster Zustellroute
openclaw cron show <jobId>

# Einen Job bearbeiten
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Einen Job jetzt zwangsweise ausführen
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
- Wenn das Modell zulässig ist, erreicht genau dieser Provider/dieses Modell den isolierten Agentenlauf.
- Wenn es nicht zulässig ist, gibt Cron eine Warnung aus und greift auf die Modellwahl des Agenten/Standardmodells des Jobs zurück.
- Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache Überschreibung mit `--model` ohne explizite jobbezogene Fallback-Liste fällt nicht mehr stillschweigend auf das Primärmodell des Agenten als zusätzliches Wiederholungsziel zurück.

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

Der Laufzeitstatus-Sidecar wird aus `cron.store` abgeleitet: Ein `.json`-Store wie
`~/clawd/cron/jobs.json` verwendet `~/clawd/cron/jobs-state.json`, während ein Store-Pfad
ohne `.json`-Suffix `-state.json` anhängt.

Cron deaktivieren: `cron.enabled: false` oder `OPENCLAW_SKIP_CRON=1`.

**Wiederholung einmaliger Jobs**: Vorübergehende Fehler (Rate-Limit, Überlastung, Netzwerk, Serverfehler) werden mit exponentiellem Backoff bis zu 3 Mal wiederholt. Permanente Fehler werden sofort deaktiviert.

**Wiederholung wiederkehrender Jobs**: Exponentieller Backoff (30 s bis 60 min) zwischen Wiederholungen. Der Backoff wird nach dem nächsten erfolgreichen Lauf zurückgesetzt.

**Wartung**: `cron.sessionRetention` (Standard `24h`) bereinigt isolierte Lauf-Sitzungseinträge. `cron.runLog.maxBytes` / `cron.runLog.keepLines` bereinigen Run-Log-Dateien automatisch.

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
- Bestätigen Sie, dass das Gateway durchgehend läuft.
- Prüfen Sie bei `cron`-Zeitplänen die Zeitzone (`--tz`) im Vergleich zur Host-Zeitzone.
- `reason: not-due` in der Laufausgabe bedeutet, dass der manuelle Lauf mit `openclaw cron run <jobId> --due` geprüft wurde und der Job noch nicht fällig war.

### Cron wurde ausgelöst, aber keine Zustellung

- Der Zustellmodus `none` bedeutet, dass keine Fallback-Zustellung durch den Runner erwartet wird. Der Agent kann bei verfügbarer Chat-Route dennoch direkt mit dem Tool `message` senden.
- Fehlendes/ungültiges Zustellziel (`channel`/`to`) bedeutet, dass ausgehende Zustellung übersprungen wurde.
- Kanal-Authentifizierungsfehler (`unauthorized`, `Forbidden`) bedeuten, dass die Zustellung durch Anmeldedaten blockiert wurde.
- Wenn der isolierte Lauf nur das stumme Token (`NO_REPLY` / `no_reply`) zurückgibt, unterdrückt OpenClaw die direkte ausgehende Zustellung und auch den Fallback-Pfad für die Zusammenfassung in der Warteschlange, sodass nichts in den Chat zurückgesendet wird.
- Wenn der Agent dem Benutzer selbst eine Nachricht senden soll, prüfen Sie, dass der Job eine nutzbare Route hat (`channel: "last"` mit einem vorherigen Chat oder einen expliziten Kanal/ein explizites Ziel).

### Fallstricke bei Zeitzonen

- Cron ohne `--tz` verwendet die Zeitzone des Gateway-Hosts.
- `at`-Zeitpläne ohne Zeitzone werden als UTC behandelt.
- Heartbeat `activeHours` verwendet die konfigurierte Zeitzonenauflösung.

## Verwandt

- [Automatisierung & Aufgaben](/de/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/de/automation/tasks) — Aufgabenprotokoll für Cron-Ausführungen
- [Heartbeat](/de/gateway/heartbeat) — regelmäßige Hauptsitzungs-Turns
- [Zeitzone](/de/concepts/timezone) — Zeitzonenkonfiguration
