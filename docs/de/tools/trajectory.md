---
read_when:
    - Debuggen, warum ein Agent auf eine bestimmte Weise geantwortet, versagt oder Tools aufgerufen hat
    - Ein Support-Bundle für eine OpenClaw-Sitzung exportieren
    - Prompt-Kontext, Tool-Aufrufe, Laufzeitfehler oder Nutzungsmetadaten untersuchen
    - Trajectory-Erfassung deaktivieren oder verlagern
summary: Redigierte Trajectory-Bundles zum Debuggen einer OpenClaw-Agentensitzung exportieren
title: Trajectory-Bundles
x-i18n:
    generated_at: "2026-04-23T14:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Trajectory-Bundles

Trajectory-Erfassung ist der sitzungsbezogene Flugschreiber von OpenClaw. Sie zeichnet
für jeden Agent-Lauf eine strukturierte Zeitachse auf, und dann verpackt `/export-trajectory` die
aktuelle Sitzung in ein redigiertes Support-Bundle.

Verwenden Sie dies, wenn Sie Fragen beantworten müssen wie:

- Welcher Prompt, System-Prompt und welche Tools wurden an das Modell gesendet?
- Welche Transcript-Nachrichten und Tool-Aufrufe haben zu dieser Antwort geführt?
- Wurde der Lauf wegen Timeout, Abbruch, Compaction oder eines Provider-Fehlers beendet?
- Welche Modelle, Plugins, Skills und Laufzeiteinstellungen waren aktiv?
- Welche Usage- und Prompt-Cache-Metadaten hat der Provider zurückgegeben?

## Schnellstart

Senden Sie dies in der aktiven Sitzung:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw schreibt das Bundle unter den Workspace:

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

Trajectory-Export ist ein Eigentümer-Befehl. Der Absender muss die normalen Prüfungen für
Befehlsautorisierung und Eigentümerprüfung für den Kanal bestehen.

## Was aufgezeichnet wird

Trajectory-Erfassung ist standardmäßig für OpenClaw-Agent-Läufe aktiviert.

Laufzeitereignisse umfassen:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript-Ereignisse werden außerdem aus dem aktiven Sitzungszweig rekonstruiert:

- Benutzernachrichten
- Assistentennachrichten
- Tool-Aufrufe
- Tool-Ergebnisse
- Compactions
- Modellwechsel
- Labels und benutzerdefinierte Sitzungseinträge

Ereignisse werden als JSON Lines mit diesem Schemamarker geschrieben:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Bundle-Dateien

Ein exportiertes Bundle kann Folgendes enthalten:

| Datei                 | Inhalt                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundle-Schema, Quelldateien, Ereigniszahlen und Liste der generierten Dateien                  |
| `events.jsonl`        | Geordnete Zeitachse von Laufzeit- und Transcript-Ereignissen                                   |
| `session-branch.json` | Redigierter aktiver Transcript-Zweig und Sitzungs-Header                                       |
| `metadata.json`       | OpenClaw-Version, OS/Laufzeit, Modell, Konfigurations-Snapshot, Plugins, Skills und Prompt-Metadaten |
| `artifacts.json`      | Endstatus, Fehler, Usage, Prompt-Cache, Anzahl der Compactions, Assistententext und Tool-Metadaten |
| `prompts.json`        | Übermittelte Prompts und ausgewählte Details der Prompt-Erstellung                             |
| `system-prompt.txt`   | Neuester kompilierter System-Prompt, falls aufgezeichnet                                       |
| `tools.json`          | Tool-Definitionen, die an das Modell gesendet wurden, falls aufgezeichnet                      |

`manifest.json` listet die in diesem Bundle vorhandenen Dateien auf. Einige Dateien werden ausgelassen,
wenn die Sitzung die entsprechenden Laufzeitdaten nicht aufgezeichnet hat.

## Speicherort der Erfassung

Standardmäßig werden Laufzeit-Trajectory-Ereignisse neben der Sitzungsdatei geschrieben:

```text
<session>.trajectory.jsonl
```

OpenClaw schreibt außerdem eine Best-Effort-Zeigerdatei neben die Sitzung:

```text
<session>.trajectory-path.json
```

Setzen Sie `OPENCLAW_TRAJECTORY_DIR`, um Laufzeit-Trajectory-Sidecars in einem
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

Dadurch wird die Laufzeit-Trajectory-Erfassung deaktiviert. `/export-trajectory` kann weiterhin
den Transcript-Zweig exportieren, aber reine Laufzeitdateien wie kompilierter Kontext,
Provider-Artefakte und Prompt-Metadaten können fehlen.

## Datenschutz und Limits

Trajectory-Bundles sind für Support und Debugging gedacht, nicht zur öffentlichen Veröffentlichung.
OpenClaw redigiert sensitive Werte, bevor Exportdateien geschrieben werden:

- Zugangsdaten und bekannte sekretähnliche Payload-Felder
- Bilddaten
- lokale State-Pfade
- Workspace-Pfade, ersetzt durch `$WORKSPACE_DIR`
- Pfade des Home-Verzeichnisses, wo erkannt

Der Exporter begrenzt außerdem die Eingabegröße:

- Laufzeit-Sidecar-Dateien: 50 MiB
- Sitzungsdateien: 50 MiB
- Laufzeitereignisse: 200.000
- insgesamt exportierte Ereignisse: 250.000
- einzelne Zeilen von Laufzeitereignissen werden oberhalb von 256 KiB abgeschnitten

Prüfen Sie Bundles vor dem Teilen außerhalb Ihres Teams. Die Redaktion arbeitet nach Best-Effort
und kann nicht jedes anwendungsspezifische Geheimnis kennen.

## Fehlerbehebung

Wenn der Export keine Laufzeitereignisse enthält:

- bestätigen Sie, dass OpenClaw nicht mit `OPENCLAW_TRAJECTORY=0` gestartet wurde
- prüfen Sie, ob `OPENCLAW_TRAJECTORY_DIR` auf ein beschreibbares Verzeichnis zeigt
- senden Sie eine weitere Nachricht in der Sitzung und exportieren Sie dann erneut
- prüfen Sie `manifest.json` auf `runtimeEventCount`

Wenn der Befehl den Ausgabepfad ablehnt:

- verwenden Sie einen relativen Namen wie `bug-1234`
- übergeben Sie nicht `/tmp/...` oder `~/...`
- halten Sie den Export innerhalb von `.openclaw/trajectory-exports/`

Wenn der Export mit einem Größenfehler fehlschlägt, hat die Sitzung oder das Sidecar die
Sicherheitslimits des Exports überschritten. Starten Sie eine neue Sitzung oder exportieren Sie eine kleinere Reproduktion.
