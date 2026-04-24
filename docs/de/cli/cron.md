---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen Cron-Ausführung und Logs
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: Cron
x-i18n:
    generated_at: "2026-04-24T06:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Cron-Jobs für den Gateway-Scheduler verwalten.

Verwandt:

- Cron-Jobs: [Cron jobs](/de/automation/cron-jobs)

Tipp: Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen.

Hinweis: `openclaw cron list` und `openclaw cron show <job-id>` zeigen eine Vorschau der
aufgelösten Zustellroute. Für `channel: "last"` zeigt die Vorschau, ob die
Route aus der Hauptsitzung/aktuellen Sitzung aufgelöst wurde oder geschlossen fehlschlägt.

Hinweis: Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung per `--announce`. Verwenden Sie `--no-deliver`, um
die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` erhalten.

Hinweis: Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam genutzt. `--announce` ist die Fallback-
Zustellung des Runners für die endgültige Antwort; `--no-deliver` deaktiviert diesen Fallback, entfernt aber
nicht das `message`-Tool des Agenten, wenn eine Chat-Route verfügbar ist.

Hinweis: Einmalige Jobs (`--at`) werden nach erfolgreicher Ausführung standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie zu behalten.

Hinweis: `--session` unterstützt `main`, `isolated`, `current` und `session:<id>`.
Verwenden Sie `current`, um beim Erstellen an die aktive Sitzung zu binden, oder `session:<id>` für
einen expliziten persistenten Sitzungsschlüssel.

Hinweis: Bei einmaligen CLI-Jobs werden Datums-/Zeitangaben mit `--at` ohne Offset als UTC behandelt, sofern Sie nicht zusätzlich
`--tz <iana>` übergeben, was diese lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

Hinweis: Wiederkehrende Jobs verwenden jetzt exponentiellen Wiederholungs-Backoff nach aufeinanderfolgenden Fehlern (30 s → 1 min → 5 min → 15 min → 60 min) und kehren dann nach dem nächsten erfolgreichen Lauf zum normalen Zeitplan zurück.

Hinweis: `openclaw cron run` gibt jetzt zurück, sobald der manuelle Lauf zur Ausführung eingereiht wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`; verwenden Sie `openclaw cron runs --id <job-id>`, um dem späteren Ergebnis zu folgen.

Hinweis: `openclaw cron run <job-id>` erzwingt standardmäßig eine Ausführung. Verwenden Sie `--due`, um das
ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.

Hinweis: Isolierte Cron-Turns unterdrücken veraltete Antworten, die nur aus Bestätigungen bestehen. Wenn das
erste Ergebnis nur ein vorläufiges Status-Update ist und kein nachgelagerter Subagent-Lauf
für die spätere Antwort verantwortlich ist, fragt Cron vor der Zustellung einmalig nach dem echten Ergebnis.

Hinweis: Wenn ein isolierter Cron-Lauf nur das stille Token (`NO_REPLY` /
`no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-
Zusammenfassungspfad in der Warteschlange, sodass nichts in den Chat zurückgesendet wird.

Hinweis: `cron add|edit --model ...` verwendet dieses ausgewählte zulässige Modell für den Job.
Wenn das Modell nicht zulässig ist, gibt Cron eine Warnung aus und greift stattdessen auf die Modellwahl
des Agenten/Standardmodells des Jobs zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache
Modellüberschreibung ohne explizite jobbezogene Fallback-Liste hängt das Primärmodell des Agenten nicht mehr als verstecktes zusätzliches Wiederholungsziel an.

Hinweis: Bei isoliertem Cron hat die Modellpriorität zuerst die Überschreibung durch den Gmail-Hook, dann jobbezogen
`--model`, dann jede gespeicherte Modellüberschreibung der Cron-Sitzung und dann die normale
Agenten-/Standardauswahl.

Hinweis: Der schnelle Modus für isolierten Cron folgt der aufgelösten Live-Modellauswahl. Die Modell-
Konfiguration `params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung für `fastMode`
hat weiterhin Vorrang vor der Konfiguration.

Hinweis: Wenn ein isolierter Lauf `LiveSessionModelSwitchError` auslöst, speichert Cron das
gewechselte Provider/Modell (und die gewechselte Auth-Profil-Überschreibung, sofern vorhanden), bevor
erneut versucht wird. Die äußere Wiederholungsschleife ist nach 2 Wechsel-Wiederholungen nach dem ersten
Versuch begrenzt und bricht dann ab, statt endlos zu schleifen.

Hinweis: Fehlerbenachrichtigungen verwenden zuerst `delivery.failureDestination`, dann
global `cron.failureDestination` und greifen schließlich auf das primäre
Ankündigungsziel des Jobs zurück, wenn kein explizites Fehlerziel konfiguriert ist.

Hinweis: Aufbewahrung/Bereinigung wird in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Lauf-Sitzungen.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

Upgrade-Hinweis: Wenn Sie ältere Cron-Jobs aus der Zeit vor dem aktuellen Zustell-/Speicherformat haben, führen Sie
`openclaw doctor --fix` aus. Doctor normalisiert jetzt Legacy-Cron-Felder (`jobId`, `schedule.cron`,
Zustellfelder auf oberster Ebene einschließlich Legacy-`threadId`, Zustell-Aliase für Payload-`provider`) und migriert einfache
Webhook-Fallback-Jobs mit `notify: true` zu expliziter Webhook-Zustellung, wenn `cron.webhook`
konfiguriert ist.

## Häufige Bearbeitungen

Zustelleinstellungen aktualisieren, ohne die Nachricht zu ändern:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Zustellung für einen isolierten Job deaktivieren:

```bash
openclaw cron edit <job-id> --no-deliver
```

Leichtgewichtigen Bootstrap-Kontext für einen isolierten Job aktivieren:

```bash
openclaw cron edit <job-id> --light-context
```

An einen bestimmten Kanal ankündigen:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Einen isolierten Job mit leichtgewichtigem Bootstrap-Kontext erstellen:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agenten-Turn-Jobs. Für Cron-Läufe hält der
leichtgewichtige Modus den Bootstrap-Kontext leer, statt den vollständigen Bootstrap-Satz des Workspace zu injizieren.

Hinweis zur Zustellverantwortung:

- Die Chat-Zustellung für isolierte Cron-Jobs ist gemeinsam genutzt. Der Agent kann direkt mit dem
  `message`-Tool senden, wenn eine Chat-Route verfügbar ist.
- `announce` stellt die endgültige Antwort nur dann per Fallback zu, wenn der Agent nicht direkt
  an das aufgelöste Ziel gesendet hat. `webhook` sendet die fertige Payload per POST an eine URL.
  `none` deaktiviert die Fallback-Zustellung durch den Runner.

## Häufige Admin-Befehle

Manueller Lauf:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Einträge in `cron runs` enthalten Zustelldiagnosen mit dem beabsichtigten Cron-Ziel,
dem aufgelösten Ziel, Sends per Message-Tool, Fallback-Nutzung und Zustellstatus.

Agenten-/Sitzungs-Umleitung:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Anpassungen der Zustellung:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Hinweis zur Fehlerzustellung:

- `delivery.failureDestination` wird für isolierte Jobs unterstützt.
- Jobs in der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre
  Zustellmodus `webhook` ist.
- Wenn Sie kein Fehlerziel festlegen und der Job bereits an einen
  Kanal ankündigt, verwenden Fehlerbenachrichtigungen dasselbe Ankündigungsziel erneut.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Geplante Aufgaben](/de/automation/cron-jobs)
