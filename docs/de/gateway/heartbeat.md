---
read_when:
    - Beim Anpassen von Heartbeat-Kadenz oder Messaging
    - Beim Entscheiden zwischen Heartbeat und Cron für geplante Aufgaben
summary: Heartbeat-Polling-Nachrichten und Benachrichtigungsregeln
title: Heartbeat
x-i18n:
    generated_at: "2026-04-05T12:43:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f417b0d4453bed9022144d364521a59dec919d44cca8f00f0def005cd38b146f
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat oder Cron?** Siehe [Automatisierung & Aufgaben](/automation) für Hinweise dazu, wann welches verwendet werden sollte.

Heartbeat führt **periodische Agent-Turns** in der Hauptsitzung aus, damit das Modell
alles hervorheben kann, was Aufmerksamkeit braucht, ohne Sie zuzuspammen.

Heartbeat ist ein geplanter Turn in der Hauptsitzung — er erstellt **keine** Datensätze für [Hintergrundaufgaben](/automation/tasks).
Aufgabendatensätze sind für entkoppelte Arbeit gedacht (ACP-Ausführungen, Subagents, isolierte Cron-Jobs).

Fehlerbehebung: [Geplante Aufgaben](/automation/cron-jobs#troubleshooting)

## Schnellstart (für Einsteiger)

1. Lassen Sie Heartbeats aktiviert (Standard ist `30m`, oder `1h` für Anthropic-OAuth-/Token-Authentifizierung, einschließlich Wiederverwendung der Claude CLI) oder legen Sie Ihre eigene Kadenz fest.
2. Erstellen Sie eine kleine Checkliste `HEARTBEAT.md` oder einen `tasks:`-Block im Agent-Workspace (optional, aber empfohlen).
3. Entscheiden Sie, wohin Heartbeat-Nachrichten gehen sollen (`target: "none"` ist der Standard; setzen Sie `target: "last"`, um zum letzten Kontakt zu routen).
4. Optional: Aktivieren Sie die Zustellung von Heartbeat-Reasoning für mehr Transparenz.
5. Optional: Verwenden Sie leichtgewichtigen Bootstrap-Kontext, wenn Heartbeat-Ausführungen nur `HEARTBEAT.md` benötigen.
6. Optional: Aktivieren Sie isolierte Sitzungen, um zu vermeiden, dass bei jedem Heartbeat der vollständige Gesprächsverlauf gesendet wird.
7. Optional: Beschränken Sie Heartbeats auf aktive Stunden (Ortszeit).

Beispielkonfiguration:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        directPolicy: "allow", // Standard: direkte/DM-Ziele erlauben; auf "block" setzen, um sie zu unterdrücken
        lightContext: true, // optional: nur HEARTBEAT.md aus den Bootstrap-Dateien injizieren
        isolatedSession: true, // optional: frische Sitzung pro Ausführung (kein Gesprächsverlauf)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: separate `Reasoning:`-Nachricht ebenfalls senden
      },
    },
  },
}
```

## Standards

- Intervall: `30m` (oder `1h`, wenn Anthropic-OAuth-/Token-Authentifizierung als Auth-Modus erkannt wird, einschließlich Wiederverwendung der Claude CLI). Setzen Sie `agents.defaults.heartbeat.every` oder pro Agent `agents.list[].heartbeat.every`; verwenden Sie `0m`, um zu deaktivieren.
- Prompt-Body (konfigurierbar über `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Der Heartbeat-Prompt wird **wörtlich** als Benutzernachricht gesendet. Der System-
  Prompt enthält einen Abschnitt „Heartbeat“, und die Ausführung wird intern markiert.
- Aktive Stunden (`heartbeat.activeHours`) werden in der konfigurierten Zeitzone geprüft.
  Außerhalb des Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Wofür der Heartbeat-Prompt gedacht ist

Der Standard-Prompt ist absichtlich breit gehalten:

- **Hintergrundaufgaben**: „Consider outstanding tasks“ veranlasst den Agenten, offene
  Nachverfolgungen (Posteingang, Kalender, Erinnerungen, eingereihte Arbeit) zu prüfen und alles Dringende hervorzuheben.
- **Check-in beim Menschen**: „Checkup sometimes on your human during day time“ veranlasst gelegentliche
  leichte Nachrichten wie „brauchst du etwas?“, vermeidet aber nächtlichen Spam
  durch Verwendung Ihrer konfigurierten lokalen Zeitzone (siehe [/concepts/timezone](/concepts/timezone)).

Heartbeat kann auf abgeschlossene [Hintergrundaufgaben](/automation/tasks) reagieren, aber ein Heartbeat-Lauf selbst erstellt keinen Aufgabendatensatz.

Wenn ein Heartbeat etwas sehr Spezifisches tun soll (z. B. „Gmail-PubSub-
Statistiken prüfen“ oder „Gateway-Zustand verifizieren“), setzen Sie `agents.defaults.heartbeat.prompt` (oder
`agents.list[].heartbeat.prompt`) auf einen benutzerdefinierten Body (wird wörtlich gesendet).

## Antwortvertrag

- Wenn nichts Aufmerksamkeit braucht, antworten Sie mit **`HEARTBEAT_OK`**.
- Während Heartbeat-Ausführungen behandelt OpenClaw `HEARTBEAT_OK` als Bestätigung, wenn es
  am **Anfang oder Ende** der Antwort erscheint. Das Token wird entfernt und die Antwort wird
  verworfen, wenn der verbleibende Inhalt **≤ `ackMaxChars`** ist (Standard: 300).
- Wenn `HEARTBEAT_OK` in der **Mitte** einer Antwort erscheint, wird es nicht speziell behandelt.
- Bei Warnungen **kein** `HEARTBEAT_OK` einschließen; geben Sie nur den Warntext zurück.

Außerhalb von Heartbeats wird ein vereinzeltes `HEARTBEAT_OK` am Anfang/Ende einer Nachricht entfernt
und protokolliert; eine Nachricht, die nur aus `HEARTBEAT_OK` besteht, wird verworfen.

## Konfiguration

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // Standard: 30m (0m deaktiviert)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // Standard: false (separate `Reasoning:`-Nachricht senden, wenn verfügbar)
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        target: "last", // Standard: none | Optionen: last | none | <channel id> (Core oder Plugin, z. B. "bluebubbles")
        to: "+15551234567", // optionale kanalspezifische Überschreibung
        accountId: "ops-bot", // optionale Kanal-ID für Multi-Account
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max. erlaubte Zeichen nach HEARTBEAT_OK
      },
    },
  },
}
```

### Umfang und Priorität

- `agents.defaults.heartbeat` setzt globales Heartbeat-Verhalten.
- `agents.list[].heartbeat` wird darüber zusammengeführt; wenn irgendein Agent einen `heartbeat`-Block hat, führen **nur diese Agents** Heartbeats aus.
- `channels.defaults.heartbeat` setzt Standardwerte für Sichtbarkeit auf allen Kanälen.
- `channels.<channel>.heartbeat` überschreibt die Kanalstandards.
- `channels.<channel>.accounts.<id>.heartbeat` (Multi-Account-Kanäle) überschreibt pro Kanal-Account.

### Heartbeats pro Agent

Wenn irgendein Eintrag in `agents.list[]` einen `heartbeat`-Block enthält, führen **nur diese Agents**
Heartbeats aus. Der Block pro Agent wird über `agents.defaults.heartbeat`
zusammengeführt (Sie können also gemeinsame Standards einmal setzen und pro Agent überschreiben).

Beispiel: zwei Agents, nur der zweite Agent führt Heartbeats aus.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Beispiel für aktive Stunden

Heartbeats auf Geschäftszeiten in einer bestimmten Zeitzone beschränken:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explizite Zustellung an den letzten Kontakt (Standard ist "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; verwendet Ihre userTimezone, falls gesetzt, sonst die Host-Zeitzone
        },
      },
    },
  },
}
```

Außerhalb dieses Fensters (vor 9 Uhr oder nach 22 Uhr Eastern) werden Heartbeats übersprungen. Der nächste geplante Tick innerhalb des Fensters läuft normal.

### 24/7-Setup

Wenn Heartbeats den ganzen Tag laufen sollen, verwenden Sie eines dieser Muster:

- `activeHours` ganz weglassen (keine Einschränkung auf ein Zeitfenster; dies ist das Standardverhalten).
- Ein ganztägiges Fenster setzen: `activeHours: { start: "00:00", end: "24:00" }`.

Setzen Sie nicht dieselbe `start`- und `end`-Zeit (zum Beispiel `08:00` bis `08:00`).
Das wird als Fenster mit Nullbreite behandelt, sodass Heartbeats immer übersprungen werden.

### Multi-Account-Beispiel

Verwenden Sie `accountId`, um einen bestimmten Account auf Multi-Account-Kanälen wie Telegram anzusprechen:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: an ein bestimmtes Topic/Thread routen
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Hinweise zu den Feldern

- `every`: Heartbeat-Intervall (Duration-String; Standardeinheit = Minuten).
- `model`: optionale Modellüberschreibung für Heartbeat-Ausführungen (`provider/model`).
- `includeReasoning`: wenn aktiviert, wird zusätzlich die separate Nachricht `Reasoning:` zugestellt, sofern verfügbar (gleiche Form wie `/reasoning on`).
- `lightContext`: wenn true, verwenden Heartbeat-Ausführungen leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
- `isolatedSession`: wenn true, läuft jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf. Verwendet dasselbe Isolationsmuster wie Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat drastisch. Kombinieren Sie dies mit `lightContext: true` für maximale Einsparungen. Das Zustellungsrouting verwendet weiterhin den Kontext der Hauptsitzung.
- `session`: optionaler Sitzungsschlüssel für Heartbeat-Ausführungen.
  - `main` (Standard): Hauptsitzung des Agenten.
  - Expliziter Sitzungsschlüssel (kopieren aus `openclaw sessions --json` oder der [sessions CLI](/cli/sessions)).
  - Formate von Sitzungsschlüsseln: siehe [Sessions](/concepts/session) und [Groups](/channels/groups).
- `target`:
  - `last`: an den zuletzt verwendeten externen Kanal zustellen.
  - expliziter Kanal: jede konfigurierte Kanal- oder Plugin-ID, zum Beispiel `discord`, `matrix`, `telegram` oder `whatsapp`.
  - `none` (Standard): den Heartbeat ausführen, aber **nicht extern zustellen**.
- `directPolicy`: steuert das direkte/DM-Zustellungsverhalten:
  - `allow` (Standard): direkte/DM-Heartbeat-Zustellung erlauben.
  - `block`: direkte/DM-Zustellung unterdrücken (`reason=dm-blocked`).
- `to`: optionale Empfängerüberschreibung (kanalspezifische ID, z. B. E.164 für WhatsApp oder eine Telegram-Chat-ID). Für Telegram-Topics/Threads verwenden Sie `<chatId>:topic:<messageThreadId>`.
- `accountId`: optionale Account-ID für Multi-Account-Kanäle. Bei `target: "last"` gilt die Account-ID für den aufgelösten letzten Kanal, sofern dieser Accounts unterstützt; andernfalls wird sie ignoriert. Wenn die Account-ID nicht zu einem konfigurierten Account für den aufgelösten Kanal passt, wird die Zustellung übersprungen.
- `prompt`: überschreibt den Standard-Prompt-Body (wird nicht zusammengeführt).
- `ackMaxChars`: max. zulässige Zeichen nach `HEARTBEAT_OK` vor der Zustellung.
- `suppressToolErrorWarnings`: wenn true, werden Payloads mit Tool-Fehlerwarnungen während Heartbeat-Ausführungen unterdrückt.
- `activeHours`: beschränkt Heartbeat-Ausführungen auf ein Zeitfenster. Objekt mit `start` (HH:MM, inklusiv; verwenden Sie `00:00` für Tagesanfang), `end` (HH:MM exklusiv; `24:00` ist für Tagesende erlaubt) und optional `timezone`.
  - Weggelassen oder `"user"`: verwendet Ihre `agents.defaults.userTimezone`, falls gesetzt, andernfalls die Host-Systemzeitzone.
  - `"local"`: verwendet immer die Host-Systemzeitzone.
  - Jede IANA-Kennung (z. B. `America/New_York`): wird direkt verwendet; falls ungültig, wird auf das obige `"user"`-Verhalten zurückgegriffen.
  - `start` und `end` dürfen für ein aktives Fenster nicht gleich sein; gleiche Werte werden als Nullbreite behandelt (immer außerhalb des Fensters).
  - Außerhalb des aktiven Fensters werden Heartbeats bis zum nächsten Tick innerhalb des Fensters übersprungen.

## Zustellungsverhalten

- Heartbeats laufen standardmäßig in der Hauptsitzung des Agenten (`agent:<id>:<mainKey>`),
  oder in `global`, wenn `session.scope = "global"` ist. Setzen Sie `session`, um auf eine
  bestimmte Kanalsitzung (Discord/WhatsApp/usw.) zu überschreiben.
- `session` beeinflusst nur den Ausführungskontext; die Zustellung wird durch `target` und `to` gesteuert.
- Um an einen bestimmten Kanal/Empfänger zuzustellen, setzen Sie `target` + `to`. Mit
  `target: "last"` verwendet die Zustellung den letzten externen Kanal für diese Sitzung.
- Heartbeat-Zustellungen erlauben standardmäßig direkte/DM-Ziele. Setzen Sie `directPolicy: "block"`, um direkte Zielsendungen zu unterdrücken, während der Heartbeat-Turn dennoch läuft.
- Wenn die Hauptwarteschlange beschäftigt ist, wird der Heartbeat übersprungen und später erneut versucht.
- Wenn `target` zu keinem externen Ziel aufgelöst wird, findet die Ausführung trotzdem statt, aber es wird
  keine ausgehende Nachricht gesendet.
- Wenn `showOk`, `showAlerts` und `useIndicator` alle deaktiviert sind, wird die Ausführung vorab als `reason=alerts-disabled` übersprungen.
- Wenn nur die Alarmzustellung deaktiviert ist, kann OpenClaw den Heartbeat dennoch ausführen, Zeitstempel fälliger Aufgaben aktualisieren, den Idle-Zeitstempel der Sitzung wiederherstellen und die nach außen gerichtete Alarm-Payload unterdrücken.
- Nur-Heartbeat-Antworten halten die Sitzung **nicht** aktiv; das letzte `updatedAt`
  wird wiederhergestellt, sodass der Idle-Ablauf normal funktioniert.
- Entkoppelte [Hintergrundaufgaben](/automation/tasks) können ein Systemereignis in die Warteschlange stellen und Heartbeat wecken, wenn die Hauptsitzung etwas schnell bemerken soll. Dieses Wecken macht die Heartbeat-Ausführung nicht zu einer Hintergrundaufgabe.

## Sichtbarkeitssteuerung

Standardmäßig werden Bestätigungen mit `HEARTBEAT_OK` unterdrückt, während Alarm-Inhalt
zugestellt wird. Sie können dies pro Kanal oder pro Account anpassen:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK ausblenden (Standard)
      showAlerts: true # Alarmmeldungen anzeigen (Standard)
      useIndicator: true # Indikator-Ereignisse ausgeben (Standard)
  telegram:
    heartbeat:
      showOk: true # OK-Bestätigungen auf Telegram anzeigen
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Alarmzustellung für diesen Account unterdrücken
```

Priorität: pro Account → pro Kanal → Kanalstandards → eingebaute Standards.

### Was jede Flagge macht

- `showOk`: sendet eine `HEARTBEAT_OK`-Bestätigung, wenn das Modell eine reine OK-Antwort zurückgibt.
- `showAlerts`: sendet den Alarm-Inhalt, wenn das Modell eine Nicht-OK-Antwort zurückgibt.
- `useIndicator`: gibt Indikator-Ereignisse für UI-Statusoberflächen aus.

Wenn **alle drei** false sind, überspringt OpenClaw die Heartbeat-Ausführung vollständig (kein Modellaufruf).

### Beispiele pro Kanal vs. pro Account

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # alle Slack-Accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # Alarme nur für den ops-Account unterdrücken
  telegram:
    heartbeat:
      showOk: true
```

### Häufige Muster

| Ziel                                     | Konfiguration                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Standardverhalten (stille OKs, Alarme an) | _(keine Konfiguration nötig)_                                                             |
| Vollständig still (keine Nachrichten, kein Indikator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Nur Indikator (keine Nachrichten)        | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OKs nur in einem Kanal                   | `channels.telegram.heartbeat: { showOk: true }`                                           |

## HEARTBEAT.md (optional)

Wenn im Workspace eine Datei `HEARTBEAT.md` vorhanden ist, weist der Standard-Prompt den
Agenten an, sie zu lesen. Betrachten Sie sie als Ihre „Heartbeat-Checkliste“: klein, stabil und
sicher genug, um sie alle 30 Minuten einzubeziehen.

Wenn `HEARTBEAT.md` existiert, aber faktisch leer ist (nur Leerzeilen und Markdown-
Überschriften wie `# Heading`), überspringt OpenClaw die Heartbeat-Ausführung, um API-Aufrufe zu sparen.
Dieser Skip wird als `reason=empty-heartbeat-file` gemeldet.
Wenn die Datei fehlt, läuft der Heartbeat trotzdem, und das Modell entscheidet, was zu tun ist.

Halten Sie sie klein (kurze Checkliste oder Erinnerungen), um Prompt-Aufblähung zu vermeiden.

Beispiel für `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:`-Blöcke

`HEARTBEAT.md` unterstützt außerdem einen kleinen strukturierten `tasks:`-Block für intervallbasierte
Prüfungen innerhalb des Heartbeats selbst.

Beispiel:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

Verhalten:

- OpenClaw parst den `tasks:`-Block und prüft jede Aufgabe gegen ihr eigenes `interval`.
- Nur **fällige** Aufgaben werden für diesen Tick in den Heartbeat-Prompt aufgenommen.
- Wenn keine Aufgaben fällig sind, wird der Heartbeat vollständig übersprungen (`reason=no-tasks-due`), um einen vergeudeten Modellaufruf zu vermeiden.
- Nicht-Aufgaben-Inhalt in `HEARTBEAT.md` bleibt erhalten und wird nach der Liste fälliger Aufgaben als zusätzlicher Kontext angehängt.
- Zeitstempel der letzten Ausführung pro Aufgabe werden im Sitzungsstatus (`heartbeatTaskState`) gespeichert, sodass Intervalle normale Neustarts überstehen.
- Aufgabenzeitstempel werden erst fortgeschrieben, nachdem eine Heartbeat-Ausführung ihren normalen Antwortpfad abgeschlossen hat. Übersprungene Ausführungen `empty-heartbeat-file` / `no-tasks-due` markieren Aufgaben nicht als abgeschlossen.

Der Aufgabenmodus ist nützlich, wenn Sie in einer Heartbeat-Datei mehrere periodische Prüfungen halten möchten, ohne bei jedem Tick für alle zu bezahlen.

### Kann der Agent `HEARTBEAT.md` aktualisieren?

Ja — wenn Sie ihn dazu auffordern.

`HEARTBEAT.md` ist einfach eine normale Datei im Agent-Workspace, daher können Sie dem
Agenten (in einem normalen Chat) etwa Folgendes sagen:

- „Aktualisiere `HEARTBEAT.md`, um eine tägliche Kalenderprüfung hinzuzufügen.“
- „Schreibe `HEARTBEAT.md` so um, dass sie kürzer ist und sich auf Nachverfolgungen im Posteingang konzentriert.“

Wenn dies proaktiv geschehen soll, können Sie auch eine explizite Zeile in
Ihren Heartbeat-Prompt aufnehmen, etwa: „If the checklist becomes stale, update HEARTBEAT.md
with a better one.“

Sicherheitshinweis: Legen Sie keine Secrets (API-Schlüssel, Telefonnummern, private Token) in
`HEARTBEAT.md` ab — sie wird Teil des Prompt-Kontexts.

## Manuelles Wecken (on-demand)

Sie können ein Systemereignis in die Warteschlange stellen und mit Folgendem einen sofortigen Heartbeat auslösen:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Wenn mehrere Agents `heartbeat` konfiguriert haben, führt ein manuelles Wecken die
Heartbeats jedes dieser Agents sofort aus.

Verwenden Sie `--mode next-heartbeat`, um bis zum nächsten geplanten Tick zu warten.

## Zustellung von Reasoning (optional)

Standardmäßig stellen Heartbeats nur die finale „Antwort“-Payload zu.

Wenn Sie Transparenz möchten, aktivieren Sie:

- `agents.defaults.heartbeat.includeReasoning: true`

Wenn aktiviert, stellen Heartbeats zusätzlich eine separate Nachricht mit dem Präfix
`Reasoning:` zu (gleiche Form wie `/reasoning on`). Das kann nützlich sein, wenn der Agent
mehrere Sitzungen/Codexes verwaltet und Sie sehen möchten, warum er entschieden hat, Sie anzupingen
— es kann aber auch mehr interne Details preisgeben, als Sie möchten. Lassen Sie es
in Gruppenchats besser deaktiviert.

## Kostenbewusstsein

Heartbeats führen vollständige Agent-Turns aus. Kürzere Intervalle verbrauchen mehr Tokens. Um Kosten zu senken:

- Verwenden Sie `isolatedSession: true`, um zu vermeiden, dass der vollständige Gesprächsverlauf gesendet wird (~100K Tokens auf ~2-5K pro Lauf).
- Verwenden Sie `lightContext: true`, um die Bootstrap-Dateien auf nur `HEARTBEAT.md` zu begrenzen.
- Setzen Sie ein günstigeres `model` (z. B. `ollama/llama3.2:1b`).
- Halten Sie `HEARTBEAT.md` klein.
- Verwenden Sie `target: "none"`, wenn Sie nur interne Statusaktualisierungen möchten.

## Verwandt

- [Automatisierung & Aufgaben](/automation) — alle Automatisierungsmechanismen auf einen Blick
- [Hintergrundaufgaben](/automation/tasks) — wie entkoppelte Arbeit nachverfolgt wird
- [Timezone](/concepts/timezone) — wie die Zeitzone die Heartbeat-Planung beeinflusst
- [Fehlerbehebung](/automation/cron-jobs#troubleshooting) — Debugging von Automatisierungsproblemen
