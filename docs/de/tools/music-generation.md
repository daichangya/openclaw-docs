---
read_when:
    - Musik oder Audio über den Agenten generieren【อ่านข้อความเต็มanalysis to=functions.read commentary  玩大发快三json  ասաց{"path":"docs/tools/music-generation.md","offset":1,"limit":260}
    - Provider und Modelle für Musikgenerierung konfigurieren
    - Die Parameter des Tools `music_generate` verstehen
summary: Musik mit gemeinsamen Providern generieren, einschließlich workflowgestützter Plugins
title: Musikgenerierung
x-i18n:
    generated_at: "2026-04-24T07:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

Das Tool `music_generate` ermöglicht es dem Agenten, Musik oder Audio über die
gemeinsame Capability zur Musikgenerierung mit konfigurierten Providern wie Google,
MiniMax und workflow-konfiguriertem ComfyUI zu erstellen.

Für agentengestützte Sitzungen mit gemeinsamen, providerbasierten Generierungen startet OpenClaw die
Musikgenerierung als Hintergrundaufgabe, verfolgt sie im Task-Ledger und weckt den Agenten
erneut auf, wenn der Track fertig ist, damit der Agent das fertige Audio zurück in den
ursprünglichen Kanal posten kann.

<Note>
Das integrierte gemeinsame Tool erscheint nur, wenn mindestens ein Provider für Musikgenerierung verfügbar ist. Wenn Sie `music_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.musicGenerationModel` oder richten Sie einen API-Schlüssel für einen Provider ein.
</Note>

## Schnellstart

### Gemeinsame providergestützte Generierung

1. Setzen Sie für mindestens einen Provider einen API-Schlüssel, zum Beispiel `GEMINI_API_KEY` oder
   `MINIMAX_API_KEY`.
2. Setzen Sie optional Ihr bevorzugtes Modell:

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

3. Bitten Sie den Agenten: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

Der Agent ruft `music_generate` automatisch auf. Kein Tool-Allowlisting erforderlich.

Für direkte synchrone Kontexte ohne sitzungsgebundenen Agentenlauf fällt das integrierte
Tool weiterhin auf Inline-Generierung zurück und gibt den finalen Medienpfad im
Tool-Ergebnis zurück.

Beispiel-Prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Workflow-gesteuerte Comfy-Generierung

Das gebündelte Plugin `comfy` hängt sich über die Registry für Provider der Musikgenerierung in das gemeinsame Tool `music_generate` ein.

1. Konfigurieren Sie `models.providers.comfy.music` mit einem Workflow-JSON und
   Prompt-/Output-Nodes.
2. Wenn Sie Comfy Cloud verwenden, setzen Sie `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY`.
3. Bitten Sie den Agenten um Musik oder rufen Sie das Tool direkt auf.

Beispiel:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Unterstützung durch gemeinsame gebündelte Provider

| Provider | Standardmodell         | Referenzeingaben | Unterstützte Steuerungen                                   | API-Schlüssel                           |
| -------- | ---------------------- | ---------------- | ---------------------------------------------------------- | --------------------------------------- |
| ComfyUI  | `workflow`             | Bis zu 1 Bild    | Workflow-definierte Musik oder Audio                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google   | `lyria-3-clip-preview` | Bis zu 10 Bilder | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax  | `music-2.5+`           | Keine            | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                       |

### Deklarierte Capability-Matrix

Dies ist der explizite Modusvertrag, der von `music_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `edit` | Edit-Limit | Gemeinsame Live-Lanes                                                      |
| -------- | ---------- | ------ | ---------- | -------------------------------------------------------------------------- |
| ComfyUI  | Ja         | Ja     | 1 Bild     | Nicht im gemeinsamen Sweep; abgedeckt durch `extensions/comfy/comfy.live.test.ts` |
| Google   | Ja         | Ja     | 10 Bilder  | `generate`, `edit`                                                         |
| MiniMax  | Ja         | Nein   | Keine      | `generate`                                                                 |

Verwenden Sie `action: "list"`, um verfügbare gemeinsame Provider und Modelle zur Laufzeit zu prüfen:

```text
/tool music_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive sitzungsgebundene Musikaufgabe zu prüfen:

```text
/tool music_generate action=status
```

Beispiel für direkte Generierung:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parameter des integrierten Tools

| Parameter         | Typ      | Beschreibung                                                                                         |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt für Musikgenerierung (erforderlich für `action: "generate"`)                                 |
| `action`          | string   | `"generate"` (Standard), `"status"` für die aktuelle Sitzungsaufgabe oder `"list"` zum Prüfen von Providern |
| `model`           | string   | Override für Provider/Modell, z. B. `google/lyria-3-pro-preview` oder `comfy/workflow`              |
| `lyrics`          | string   | Optionale Lyrics, wenn der Provider explizite Lyrics-Eingaben unterstützt                            |
| `instrumental`    | boolean  | Nur instrumentale Ausgabe anfordern, wenn der Provider dies unterstützt                              |
| `image`           | string   | Einzelner Referenzbild-Pfad oder URL                                                                 |
| `images`          | string[] | Mehrere Referenzbilder (bis zu 10)                                                                   |
| `durationSeconds` | number   | Zieldauer in Sekunden, wenn der Provider Dauer-Hints unterstützt                                     |
| `timeoutMs`       | number   | Optionales Timeout für Provider-Anfragen in Millisekunden                                            |
| `format`          | string   | Hinweis zum Ausgabeformat (`mp3` oder `wav`), wenn der Provider dies unterstützt                     |
| `filename`        | string   | Hinweis zum Ausgabedateinamen                                                                         |

Nicht alle Provider unterstützen alle Parameter. OpenClaw validiert weiterhin harte Limits
wie die Anzahl der Eingaben vor dem Absenden. Wenn ein Provider Dauer unterstützt, aber
ein kürzeres Maximum als den angeforderten Wert verwendet, begrenzt OpenClaw automatisch
auf die nächstunterstützte Dauer. Wirklich nicht unterstützte optionale Hinweise werden
mit einer Warnung ignoriert, wenn der ausgewählte Provider oder das Modell sie nicht erfüllen kann.

Tool-Ergebnisse melden die angewandten Einstellungen. Wenn OpenClaw die Dauer während des Provider-Fallbacks begrenzt, spiegelt das zurückgegebene `durationSeconds` den tatsächlich übermittelten Wert wider und `details.normalization.durationSeconds` zeigt die Zuordnung von angefordert zu angewandt.

## Asynchrones Verhalten für den gemeinsamen providergestützten Pfad

- Agentenläufe mit Sitzungsbindung: `music_generate` erstellt eine Hintergrundaufgabe, gibt sofort eine Antwort vom Typ gestartet/Aufgabe zurück und postet den fertigen Track später in einer nachfolgenden Agentennachricht.
- Vermeidung von Duplikaten: Solange diese Hintergrundaufgabe im selben Verlauf noch `queued` oder `running` ist, geben spätere Aufrufe von `music_generate` in derselben Sitzung den Aufgabenstatus zurück, statt eine weitere Generierung zu starten.
- Statusabfrage: Verwenden Sie `action: "status"`, um die aktive sitzungsgebundene Musikaufgabe zu prüfen, ohne eine neue Generierung zu starten.
- Aufgabenverfolgung: Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Status `queued`, `running` und terminal für die Generierung zu prüfen.
- Completion-Wake: OpenClaw injiziert ein internes Abschlussereignis zurück in dieselbe Sitzung, damit das Modell das benutzerseitige Follow-up selbst schreiben kann.
- Prompt-Hinweis: Spätere Benutzer-/manuelle Durchläufe in derselben Sitzung erhalten einen kleinen Laufzeithinweis, wenn bereits eine Musikaufgabe läuft, damit das Modell nicht blind `music_generate` erneut aufruft.
- Fallback ohne Sitzung: Direkte/lokale Kontexte ohne echte Agentensitzung laufen weiterhin inline und geben das finale Audioergebnis im selben Durchlauf zurück.

### Aufgabenlebenszyklus

Jede Anfrage an `music_generate` durchläuft vier Zustände:

1. **queued** -- Aufgabe erstellt, wartet darauf, dass der Provider sie akzeptiert.
2. **running** -- Provider verarbeitet sie (typischerweise 30 Sekunden bis 3 Minuten, je nach Provider und Dauer).
3. **succeeded** -- Track ist fertig; der Agent wird geweckt und postet ihn in die Unterhaltung.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails geweckt.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Vermeidung von Duplikaten: Wenn für die aktuelle Sitzung bereits eine Musikaufgabe `queued` oder `running` ist, gibt `music_generate` den Status der bestehenden Aufgabe zurück, statt eine neue zu starten. Verwenden Sie `action: "status"`, um den Status explizit zu prüfen, ohne eine neue Generierung auszulösen.

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

Bei der Generierung von Musik versucht OpenClaw Provider in dieser Reihenfolge:

1. `model`-Parameter aus dem Tool-Aufruf, wenn der Agent einen angibt
2. `musicGenerationModel.primary` aus der Konfiguration
3. `musicGenerationModel.fallbacks` in Reihenfolge
4. Auto-Erkennung unter Verwendung nur auth-gestützter Provider-Standards:
   - aktueller Standardprovider zuerst
   - verbleibende registrierte Provider für Musikgenerierung in Reihenfolge der Provider-ID

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle fehlschlagen, enthält der
Fehler Details aus jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Musikgenerierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
verwenden soll.

## Hinweise zu Providern

- Google verwendet batchbasierte Generierung mit Lyria 3. Der aktuell gebündelte Flow unterstützt
  Prompt, optionalen Lyrics-Text und optionale Referenzbilder.
- MiniMax verwendet den Batch-Endpunkt `music_generation`. Der aktuell gebündelte Flow
  unterstützt Prompt, optionale Lyrics, Instrumentalmodus, Steuerung der Dauer und
  MP3-Ausgabe.
- Die Unterstützung für ComfyUI ist workflowgesteuert und hängt vom konfigurierten Graphen plus
  Node-Mapping für Prompt-/Output-Felder ab.

## Capability-Modi von Providern

Der gemeinsame Vertrag für Musikgenerierung unterstützt jetzt explizite Modusdeklarationen:

- `generate` für Generierung nur per Prompt
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

Legacy-flache Felder wie `maxInputImages`, `supportsLyrics` und
`supportsFormat` reichen nicht aus, um Edit-Unterstützung zu deklarieren. Provider sollten
`generate` und `edit` explizit deklarieren, damit Live-Tests, Vertragstests und
das gemeinsame Tool `music_generate` die Modusunterstützung deterministisch validieren können.

## Den richtigen Pfad wählen

- Verwenden Sie den gemeinsamen providergestützten Pfad, wenn Sie Modellauswahl, Provider-Failover und den integrierten asynchronen Task-/Status-Flow möchten.
- Verwenden Sie einen Plugin-Pfad wie ComfyUI, wenn Sie einen benutzerdefinierten Workflow-Graph oder einen Provider benötigen, der nicht Teil der gemeinsamen gebündelten Musik-Capability ist.
- Wenn Sie ComfyUI-spezifisches Verhalten debuggen, siehe [ComfyUI](/de/providers/comfy). Wenn Sie gemeinsames providerbezogenes Verhalten debuggen, beginnen Sie mit [Google (Gemini)](/de/providers/google) oder [MiniMax](/de/providers/minimax).

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media music
```

Diese Live-Datei lädt fehlende Provider-Env-Variablen aus `~/.profile`, bevorzugt
live/env-API-Schlüssel standardmäßig vor gespeicherten Authentifizierungsprofilen und führt sowohl
`generate`- als auch deklarierte `edit`-Abdeckung aus, wenn der Provider den Edit-Modus aktiviert.

Heute bedeutet das:

- `google`: `generate` plus `edit`
- `minimax`: nur `generate`
- `comfy`: separate Live-Abdeckung für Comfy, nicht der gemeinsame Provider-Sweep

Opt-in-Live-Abdeckung für den gebündelten ComfyUI-Musikpfad:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Die Live-Datei für Comfy deckt auch Bild- und Video-Workflows von Comfy ab, wenn diese
Abschnitte konfiguriert sind.

## Verwandt

- [Hintergrundaufgaben](/de/automation/tasks) - Aufgabenverfolgung für entkoppelte `music_generate`-Läufe
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Konfiguration von `musicGenerationModel`
- [ComfyUI](/de/providers/comfy)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [Modelle](/de/concepts/models) - Modellkonfiguration und Failover
- [Tool-Überblick](/de/tools)
