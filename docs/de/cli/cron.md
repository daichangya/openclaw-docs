---
read_when:
    - Sie möchten geplante Jobs und Aufweckvorgänge
    - Sie debuggen die Cron-Ausführung und Logs
summary: CLI-Referenz für `openclaw cron` (Hintergrundjobs planen und ausführen)
title: cron
x-i18n:
    generated_at: "2026-04-05T12:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Verwalten Sie Cron-Jobs für den Gateway-Scheduler.

Verwandt:

- Cron-Jobs: [Cron-Jobs](/automation/cron-jobs)

Tipp: Führen Sie `openclaw cron --help` aus, um die vollständige Befehlsoberfläche anzuzeigen.

Hinweis: Isolierte `cron add`-Jobs verwenden standardmäßig die Zustellung per `--announce`. Verwenden Sie `--no-deliver`, um
die Ausgabe intern zu halten. `--deliver` bleibt als veralteter Alias für `--announce` bestehen.

Hinweis: Isolierte, Cron-eigene Ausführungen erwarten eine Klartext-Zusammenfassung, und der Runner besitzt
den finalen Sendepfad. `--no-deliver` hält die Ausführung intern; es übergibt die
Zustellung nicht zurück an das `message`-Tool des Agenten.

Hinweis: Einmalige Jobs (`--at`) werden nach Erfolg standardmäßig gelöscht. Verwenden Sie `--keep-after-run`, um sie beizubehalten.

Hinweis: `--session` unterstützt `main`, `isolated`, `current` und `session:<id>`.
Verwenden Sie `current`, um beim Erstellen an die aktive Sitzung zu binden, oder `session:<id>` für
einen expliziten persistenten Sitzungsschlüssel.

Hinweis: Für einmalige CLI-Jobs werden `--at`-Datums-/Zeitangaben ohne Offset als UTC behandelt, sofern Sie nicht zusätzlich
`--tz <iana>` übergeben, was diese lokale Uhrzeit in der angegebenen Zeitzone interpretiert.

Hinweis: Wiederkehrende Jobs verwenden jetzt exponentielles Retry-Backoff nach aufeinanderfolgenden Fehlern (30s → 1m → 5m → 15m → 60m) und kehren dann nach der nächsten erfolgreichen Ausführung zum normalen Zeitplan zurück.

Hinweis: `openclaw cron run` gibt jetzt zurück, sobald die manuelle Ausführung zur Ausführung in die Warteschlange gestellt wurde. Erfolgreiche Antworten enthalten `{ ok: true, enqueued: true, runId }`; verwenden Sie `openclaw cron runs --id <job-id>`, um das spätere Ergebnis zu verfolgen.

Hinweis: `openclaw cron run <job-id>` erzwingt standardmäßig die Ausführung. Verwenden Sie `--due`, um das
ältere Verhalten „nur ausführen, wenn fällig“ beizubehalten.

Hinweis: Isolierte Cron-Durchläufe unterdrücken veraltete Antworten, die nur eine Bestätigung enthalten. Wenn das
erste Ergebnis nur ein vorläufiges Status-Update ist und kein nachgeordneter Subagent-Durchlauf
für die endgültige Antwort verantwortlich ist, fragt Cron vor der Zustellung einmal erneut nach dem echten Ergebnis.

Hinweis: Wenn eine isolierte Cron-Ausführung nur das stille Token (`NO_REPLY` /
`no_reply`) zurückgibt, unterdrückt Cron sowohl die direkte ausgehende Zustellung als auch den Fallback-Pfad mit der
Zusammenfassung in der Warteschlange, sodass nichts in den Chat zurückgepostet wird.

Hinweis: `cron add|edit --model ...` verwendet dieses ausgewählte erlaubte Modell für den Job.
Wenn das Modell nicht erlaubt ist, warnt Cron und fällt stattdessen auf die Modellauswahl des Jobs-Agenten/Standards
zurück. Konfigurierte Fallback-Ketten gelten weiterhin, aber eine einfache
Modellüberschreibung ohne explizite Fallback-Liste pro Job hängt das primäre Agent-Modell nicht mehr als verstecktes zusätzliches Retry-Ziel an.

Hinweis: Die Modellpriorität für isolierte Cron-Jobs ist zuerst Gmail-Hook-Überschreibung, dann `--model` pro Job,
dann eine gespeicherte Modellüberschreibung der Cron-Sitzung und danach die normale
Agent-/Standardauswahl.

Hinweis: Der Schnellmodus für isolierte Cron-Jobs folgt der aufgelösten Live-Modellauswahl. Modellkonfiguration
`params.fastMode` gilt standardmäßig, aber eine gespeicherte Sitzungsüberschreibung `fastMode` hat weiterhin Vorrang vor der Konfiguration.

Hinweis: Wenn eine isolierte Ausführung `LiveSessionModelSwitchError` wirft, speichert Cron den
gewechselten Provider/das gewechselte Modell (und die gewechselte Auth-Profil-Überschreibung, falls vorhanden), bevor erneut versucht wird. Die äußere Retry-Schleife ist nach 2 Wechsel-Retries nach dem ersten
Versuch begrenzt und bricht dann ab, statt endlos zu schleifen.

Hinweis: Fehlerbenachrichtigungen verwenden zuerst `delivery.failureDestination`, dann
global `cron.failureDestination`, und fallen schließlich auf das primäre
Ankündigungsziel des Jobs zurück, wenn kein explizites Fehlerziel konfiguriert ist.

Hinweis: Aufbewahrung/Bereinigung wird in der Konfiguration gesteuert:

- `cron.sessionRetention` (Standard `24h`) bereinigt abgeschlossene isolierte Ausführungssitzungen.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`.

Upgrade-Hinweis: Wenn Sie ältere Cron-Jobs von vor dem aktuellen Zustell-/Speicherformat haben, führen Sie
`openclaw doctor --fix` aus. Doctor normalisiert jetzt Legacy-Cron-Felder (`jobId`, `schedule.cron`,
Top-Level-Zustellfelder einschließlich Legacy-`threadId`, Payload-`provider`-Zustell-Aliasse) und migriert einfache
Webhook-Fallback-Jobs mit `notify: true` zu expliziter Webhook-Zustellung, wenn `cron.webhook` ist
konfiguriert.

## Häufige Änderungen

Zustellungseinstellungen aktualisieren, ohne die Nachricht zu ändern:

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
  --name "Leichtgewichtige Morgenübersicht" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Fasse die nächtlichen Updates zusammen." \
  --light-context \
  --no-deliver
```

`--light-context` gilt nur für isolierte Agent-Turn-Jobs. Bei Cron-Ausführungen hält der Leichtgewichtsmodus den Bootstrap-Kontext leer, anstatt den vollständigen Workspace-Bootstrap-Satz einzufügen.

Hinweis zur Zustellungsverantwortung:

- Isolierte Cron-eigene Jobs leiten die finale benutzersichtbare Zustellung immer über den
  Cron-Runner (`announce`, `webhook` oder nur-internes `none`).
- Wenn die Aufgabe erwähnt, einem externen Empfänger etwas zu senden, sollte der Agent
  das beabsichtigte Ziel in seinem Ergebnis beschreiben, anstatt zu versuchen, es
  direkt zu senden.

## Häufige Admin-Befehle

Manuelle Ausführung:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Agent-/Sitzungs-Neuausrichtung:

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
- Jobs der Hauptsitzung dürfen `delivery.failureDestination` nur verwenden, wenn der primäre
  Zustellmodus `webhook` ist.
- Wenn Sie kein Fehlerziel festlegen und der Job bereits in einen
  Kanal ankündigt, verwenden Fehlerbenachrichtigungen dasselbe Ankündigungsziel erneut.
