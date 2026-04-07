---
read_when:
    - Musik oder Audio über den Agenten generieren
    - Provider und Modelle für die Musikgenerierung konfigurieren
    - Die Parameter des Tools music_generate verstehen
summary: Musik mit gemeinsam genutzten Providern generieren, einschließlich workflowgestützter Plugins
title: Musikgenerierung
x-i18n:
    generated_at: "2026-04-07T06:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8da8dfc188efe8593ca5cbec0927dd1d18d2861a1a828df89c8541ccf1cb25
    source_path: tools/music-generation.md
    workflow: 15
---

# Musikgenerierung

Das Tool `music_generate` ermöglicht es dem Agenten, Musik oder Audio über die
gemeinsam genutzte Fähigkeit zur Musikgenerierung mit konfigurierten Providern wie Google,
MiniMax und workflowkonfiguriertem ComfyUI zu erstellen.

Für agentengestützte Sitzungen mit gemeinsam genutzten Providern startet OpenClaw die Musikgenerierung als
Hintergrundaufgabe, verfolgt sie im Aufgabenprotokoll und weckt den Agenten dann erneut,
wenn der Track bereit ist, damit der Agent das fertige Audio wieder im
ursprünglichen Kanal posten kann.

<Note>
Das eingebaute gemeinsame Tool erscheint nur, wenn mindestens ein Provider für Musikgenerierung verfügbar ist. Wenn Sie `music_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.musicGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

### Gemeinsam genutzte providergestützte Generierung

1. Setzen Sie einen API-Schlüssel für mindestens einen Provider, zum Beispiel `GEMINI_API_KEY` oder
   `MINIMAX_API_KEY`.
2. Optional können Sie Ihr bevorzugtes Modell festlegen:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Fragen Sie den Agenten: _„Erzeuge einen mitreißenden Synthpop-Track über eine nächtliche Fahrt
   durch eine Neonstadt.“_

Der Agent ruft `music_generate` automatisch auf. Kein Allowlisting für Tools erforderlich.

Für direkte synchrone Kontexte ohne agentengestützten Lauf mit Sitzung
greift das eingebaute Tool weiterhin auf Inline-Generierung zurück und gibt den finalen Medienpfad im
Tool-Ergebnis zurück.

Beispiel-Prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Workflowgesteuerte Comfy-Generierung

Das gebündelte Plugin `comfy` wird über
die Provider-Registry für Musikgenerierung in das gemeinsame Tool `music_generate` eingebunden.

1. Konfigurieren Sie `models.providers.comfy.music` mit einem Workflow-JSON und
   Prompt-/Ausgabeknoten.
2. Wenn Sie Comfy Cloud verwenden, setzen Sie `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY`.
3. Bitten Sie den Agenten um Musik oder rufen Sie das Tool direkt auf.

Beispiel:

```text
/tool music_generate prompt="Warme Ambient-Synth-Schleife mit weicher Bandtextur"
```

## Unterstützung durch gemeinsam genutzte gebündelte Provider

| Provider | Standardmodell        | Referenzeingaben | Unterstützte Steuerungen                               | API-Schlüssel                          |
| -------- | --------------------- | ---------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI  | `workflow`            | Bis zu 1 Bild    | Workflowdefinierte Musik oder Audio                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`          | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                   |

### Deklarierte Fähigkeitsmatrix

Dies ist der explizite Modusvertrag, der von `music_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `edit` | Edit-Limit | Gemeinsame Live-Lanes                                                    |
| -------- | ---------- | ------ | ---------- | ------------------------------------------------------------------------ |
| ComfyUI  | Ja         | Ja     | 1 Bild     | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   | Ja         | Ja     | 10 Bilder  | `generate`, `edit`                                                       |
| MiniMax  | Ja         | Nein   | Keine      | `generate`                                                               |

Verwenden Sie `action: "list"`, um verfügbare gemeinsam genutzte Provider und Modelle
zur Laufzeit anzuzeigen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsgestützte Musikaufgabe zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Verträumter Lo-fi-Hip-Hop mit Vinyltextur und sanftem Regen" instrumental=true
```

## Parameter des eingebauten Tools

| Parameter         | Typ      | Beschreibung                                                                                   |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt für die Musikgenerierung (erforderlich für `action: "generate"`)                       |
| `action`          | string   | `"generate"` (Standard), `"status"` für die aktuelle Sitzungsaufgabe oder `"list"` zur Provider-Inspektion |
| `model`           | string   | Override für Provider/Modell, z. B. `google/lyria-3-pro-preview` oder `comfy/workflow`       |
| `lyrics`          | string   | Optionale Liedtexte, wenn der Provider explizite Texteingaben unterstützt                      |
| `instrumental`    | boolean  | Nur instrumentale Ausgabe anfordern, wenn der Provider dies unterstützt                        |
| `image`           | string   | Pfad oder URL zu einem einzelnen Referenzbild                                                  |
| `images`          | string[] | Mehrere Referenzbilder (bis zu 10)                                                             |
| `durationSeconds` | number   | Zieldauer in Sekunden, wenn der Provider Dauerhinweise unterstützt                             |
| `format`          | string   | Hinweis zum Ausgabeformat (`mp3` oder `wav`), wenn der Provider dies unterstützt              |
| `filename`        | string   | Hinweis auf den Ausgabedateinamen                                                              |

Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert dennoch harte Limits
wie Eingabeanzahlen vor der Übermittlung. Wenn ein Provider Dauer unterstützt, aber
ein kürzeres Maximum als den angeforderten Wert verwendet, begrenzt OpenClaw automatisch
auf die nächstunterstützte Dauer. Wirklich nicht unterstützte optionale Hinweise werden
mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das Modell sie nicht berücksichtigen kann.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw die Dauer während eines Provider-Fallbacks begrenzt, spiegelt `durationSeconds` im Rückgabewert den übermittelten Wert wider und `details.normalization.durationSeconds` zeigt die Zuordnung von angefordert zu angewendet.

## Asynchrones Verhalten für den gemeinsam genutzten providergestützten Pfad

- Agentenläufe mit Sitzung: `music_generate` erstellt eine Hintergrundaufgabe, gibt sofort eine Antwort vom Typ gestartet/Aufgabe zurück und postet den fertigen Track später in einer nachfolgenden Agentennachricht.
- Verhinderung von Duplikaten: Solange diese Hintergrundaufgabe noch `queued` oder `running` ist, geben spätere Aufrufe von `music_generate` in derselben Sitzung den Aufgabenstatus zurück, statt eine weitere Generierung zu starten.
- Statusabfrage: Verwenden Sie `action: "status"`, um die aktive sitzungsgestützte Musikaufgabe zu prüfen, ohne eine neue zu starten.
- Aufgabenverfolgung: Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Status `queued`, `running` und Endstatus der Generierung zu prüfen.
- Wecken bei Abschluss: OpenClaw injiziert ein internes Abschlussereignis zurück in dieselbe Sitzung, damit das Modell selbst die nutzerseitige Folgemeldung schreiben kann.
- Prompt-Hinweis: Spätere Nutzer-/manuelle Turns in derselben Sitzung erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe läuft, damit das Modell nicht blind erneut `music_generate` aufruft.
- Fallback ohne Sitzung: Direkte/lokale Kontexte ohne echte Agentensitzung laufen weiterhin inline und geben das finale Audioergebnis im selben Turn zurück.

### Aufgabenlebenszyklus

Jede Anfrage `music_generate` durchläuft vier Zustände:

1. **queued** -- Aufgabe erstellt, wartet darauf, dass der Provider sie annimmt.
2. **running** -- Provider verarbeitet die Aufgabe (typischerweise 30 Sekunden bis 3 Minuten, abhängig von Provider und Dauer).
3. **succeeded** -- Track bereit; der Agent wird geweckt und postet ihn in die Unterhaltung.
4. **failed** -- Providerfehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Verhinderung von Duplikaten: Wenn für die aktuelle Sitzung bereits eine Musikaufgabe `queued` oder `running` ist, gibt `music_generate` den Status der vorhandenen Aufgabe zurück, statt eine neue zu starten. Verwenden Sie `action: "status"`, um dies explizit zu prüfen, ohne eine neue Generierung auszulösen.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Bei der Musikgenerierung probiert OpenClaw Provider in dieser Reihenfolge aus:

1. Parameter `model` aus dem Tool-Aufruf, falls der Agent einen angibt
2. `musicGenerationModel.primary` aus der Konfiguration
3. `musicGenerationModel.fallbacks` in Reihenfolge
4. Automatische Erkennung nur mit auth-gestützten Provider-Standards:
   - zuerst aktueller Standardprovider
   - verbleibende registrierte Provider für Musikgenerierung in Reihenfolge der Provider-IDs

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der
Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn die
Musikgenerierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
verwenden soll.

## Hinweise zu Providern

- Google verwendet die Batch-Generierung von Lyria 3. Der aktuelle gebündelte Ablauf unterstützt
  Prompt, optionalen Liedtext und optionale Referenzbilder.
- MiniMax verwendet den Batch-Endpunkt `music_generation`. Der aktuelle gebündelte Ablauf
  unterstützt Prompt, optionale Liedtexte, instrumentalen Modus, Dauersteuerung und
  MP3-Ausgabe.
- Die Unterstützung für ComfyUI ist workflowgesteuert und hängt vom konfigurierten Graphen sowie
  der Knotenzuordnung für Prompt-/Ausgabefelder ab.

## Fähigkeitsmodi von Providern

Der gemeinsame Vertrag für Musikgenerierung unterstützt jetzt explizite Modusdeklarationen:

- `generate` für promptbasierte Generierung
- `edit`, wenn die Anfrage ein oder mehrere Referenzbilder enthält

Neue Provider-Implementierungen sollten explizite Modusblöcke bevorzugen:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Veraltete flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen nicht aus, um Edit-Unterstützung anzukündigen. Provider sollten
`generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests und
das gemeinsame Tool `music_generate` die Modusunterstützung deterministisch validieren können.

## Den richtigen Pfad wählen

- Verwenden Sie den gemeinsam genutzten providergestützten Pfad, wenn Sie Modellauswahl, Provider-Failover und den eingebauten asynchronen Aufgaben-/Status-Flow möchten.
- Verwenden Sie einen Plugin-Pfad wie ComfyUI, wenn Sie einen benutzerdefinierten Workflow-Graphen oder einen Provider benötigen, der nicht Teil der gemeinsam genutzten gebündelten Fähigkeit zur Musikgenerierung ist.
- Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe [ComfyUI](/de/providers/comfy). Wenn Sie gemeinsam genutztes Providerverhalten debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder [MiniMax](/de/providers/minimax).

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsam genutzten gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Env-Variablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen und führt sowohl
`generate` als auch deklarierte `edit`-Abdeckung aus, wenn der Provider den Edit-Modus aktiviert.

Derzeit bedeutet das:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Comfy-Live-Abdeckung, nicht der gemeinsame Provider-Sweep

Opt-in-Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Comfy-Live-Datei deckt auch Comfy-Bild- und Video-Workflows ab, wenn diese
Bereiche konfiguriert sind.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) - Aufgabenverfolgung für entkoppelte Läufe von `music_generate`
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults) - Konfiguration von `musicGenerationModel`
- [ComfyUI](/de/providers/comfy)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Models](/de/concepts/models) - Modellkonfiguration und Failover
- [Tool-Übersicht](/de/tools)
