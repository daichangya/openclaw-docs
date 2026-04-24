---
read_when:
    - Fehlerbehebung, warum ein Agent auf eine bestimmte Weise geantwortet hat, fehlgeschlagen ist oder Tools aufgerufen hat.
    - Ein Support-Bundle für eine OpenClaw-Sitzung exportieren.
    - Prompt-Kontext, Tool-Aufrufe, Laufzeitfehler oder Nutzungsmetadaten untersuchen.
    - Trajectory-Erfassung deaktivieren oder an einen anderen Ort verschieben.
summary: Geschwärzte Trajectory-Bundles zur Fehlerbehebung einer OpenClaw-Agent-Sitzung exportieren
title: Trajectory-Bundles
x-i18n:
    generated_at: "2026-04-24T07:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

Trajectory-Erfassung ist der Flight Recorder von OpenClaw pro Sitzung. Sie zeichnet eine
strukturierte Zeitachse für jeden Agent-Lauf auf, und dann bündelt `/export-trajectory` die
aktuelle Sitzung in ein geschwärztes Support-Bundle.

Verwenden Sie dies, wenn Sie Fragen beantworten müssen wie:

- Welcher Prompt, System-Prompt und welche Tools wurden an das Modell gesendet?
- Welche Transcript-Nachrichten und Tool-Aufrufe führten zu dieser Antwort?
- Ist der Lauf wegen Timeout fehlgeschlagen, abgebrochen worden, kompaktiert worden oder auf einen Provider-Fehler gestoßen?
- Welche Modelle, Plugins, Skills und Runtime-Einstellungen waren aktiv?
- Welche Nutzungs- und Prompt-Cache-Metadaten hat der Provider zurückgegeben?

## Schnellstart

Senden Sie dies in der aktiven Sitzung:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw schreibt das Bundle unter dem Workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Sie können einen relativen Namen für das Ausgabeverzeichnis wählen:

```text
/export-trajectory bug-1234
```

Der benutzerdefinierte Pfad wird innerhalb von `.openclaw/trajectory-exports/` aufgelöst. Absolute
Pfade und `~`-Pfade werden abgelehnt.

## Zugriff

Der Trajectory-Export ist ein Owner-Befehl. Der Absender muss die normalen Prüfungen
für die Befehlsautorisierung und Owner-Prüfungen für den Kanal bestehen.

## Was aufgezeichnet wird

Die Trajectory-Erfassung ist für OpenClaw-Agent-Läufe standardmäßig aktiviert.

Runtime-Events umfassen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript-Events werden ebenfalls aus dem aktiven Sitzungszweig rekonstruiert:

- Benutzernachrichten
- Assistant-Nachrichten
- Tool-Aufrufe
- Tool-Ergebnisse
- Compactions
- Modelländerungen
- Labels und benutzerdefinierte Sitzungseinträge

Events werden als JSON Lines mit diesem Schema-Marker geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundle-Dateien

Ein exportiertes Bundle kann Folgendes enthalten:

| Datei                 | Inhalt                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundle-Schema, Quelldateien, Event-Anzahlen und Liste der generierten Dateien                  |
| `events.jsonl`        | Geordnete Runtime- und Transcript-Zeitachse                                                    |
| `session-branch.json` | Geschwärzter aktiver Transcript-Zweig und Sitzungs-Header                                      |
| `metadata.json`       | OpenClaw-Version, OS/Runtime, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Nutzung, Prompt-Cache, Compaction-Anzahl, Assistant-Text und Tool-Metadaten |
| `prompts.json`        | Übermittelte Prompts und ausgewählte Details zum Prompt-Building                               |
| `system-prompt.txt`   | Zuletzt kompilierter System-Prompt, falls erfasst                                              |
| `tools.json`          | An das Modell gesendete Tool-Definitionen, falls erfasst                                       |

`manifest.json` listet die in diesem Bundle vorhandenen Dateien auf. Einige Dateien werden ausgelassen,
wenn die Sitzung die entsprechenden Runtime-Daten nicht erfasst hat.

## Speicherort der Erfassung

Standardmäßig werden Runtime-Trajectory-Events neben der Sitzungsdatei geschrieben:

```text
<session>.trajectory.jsonl
```

OpenClaw schreibt außerdem eine Best-Effort-Zeigerdatei neben die Sitzung:

```text
<session>.trajectory-path.json
```

Setzen Sie `OPENCLAW_TRAJECTORY_DIR`, um Runtime-Trajectory-Sidecars in einem
dedizierten Verzeichnis zu speichern:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Wenn diese Variable gesetzt ist, schreibt OpenClaw in diesem
Verzeichnis eine JSONL-Datei pro Sitzungs-ID.

## Erfassung deaktivieren

Setzen Sie `OPENCLAW_TRAJECTORY=0`, bevor Sie OpenClaw starten:

```bash
export OPENCLAW_TRAJECTORY=0
```

Dadurch wird die Runtime-Trajectory-Erfassung deaktiviert. `/export-trajectory` kann weiterhin
den Transcript-Zweig exportieren, aber Dateien nur für die Runtime wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten können fehlen.

## Datenschutz und Limits

Trajectory-Bundles sind für Support und Debugging gedacht, nicht für öffentliche Veröffentlichung.
OpenClaw schwärzt sensible Werte, bevor Exportdateien geschrieben werden:

- Zugangsdaten und bekannte secret-ähnliche Payload-Felder
- Bilddaten
- lokale Statuspfade
- Workspace-Pfade, ersetzt durch `$WORKSPACE_DIR`
- Home-Verzeichnispfade, sofern erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Runtime-Sidecar-Dateien: 50 MiB
- Sitzungsdateien: 50 MiB
- Runtime-Events: 200.000
- insgesamt exportierte Events: 250.000
- einzelne Runtime-Event-Zeilen werden oberhalb von 256 KiB gekürzt

Prüfen Sie Bundles, bevor Sie sie außerhalb Ihres Teams teilen. Die Schwärzung erfolgt nach Best-Effort
und kann nicht jedes anwendungsspezifische Geheimnis kennen.

## Fehlerbehebung

Wenn der Export keine Runtime-Events enthält:

- bestätigen Sie, dass OpenClaw ohne `OPENCLAW_TRAJECTORY=0` gestartet wurde
- prüfen Sie, ob `OPENCLAW_TRAJECTORY_DIR` auf ein beschreibbares Verzeichnis zeigt
- führen Sie eine weitere Nachricht in der Sitzung aus und exportieren Sie dann erneut
- prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- verwenden Sie einen relativen Namen wie `bug-1234`
- übergeben Sie nicht `/tmp/...` oder `~/...`
- behalten Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder das Sidecar die
Sicherheitslimits für den Export überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere Reproduktion.

## Verwandt

- [Diffs](/de/tools/diffs)
- [Sitzungsverwaltung](/de/concepts/session)
- [Exec-Tool](/de/tools/exec)
