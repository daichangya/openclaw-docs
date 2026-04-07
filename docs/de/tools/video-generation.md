---
read_when:
    - Videos über den Agenten generieren
    - Provider und Modelle für die Videogenerierung konfigurieren
    - Die Parameter des Tools `video_generate` verstehen
summary: Generieren Sie Videos aus Text, Bildern oder vorhandenen Videos mit 12 Provider-Backends
title: Videogenerierung
x-i18n:
    generated_at: "2026-04-07T06:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf1224c59a5f1217f56cf2001870aca710a09268677dcd12aad2efbe476e47b7
    source_path: tools/video-generation.md
    workflow: 15
---

# Videogenerierung

OpenClaw-Agenten können Videos aus Text-Prompts, Referenzbildern oder vorhandenen Videos generieren. Zwölf Provider-Backends werden unterstützt, jeweils mit unterschiedlichen Modelloptionen, Eingabemodi und Funktionsumfängen. Der Agent wählt anhand Ihrer Konfiguration und der verfügbaren API-Schlüssel automatisch den passenden Provider aus.

<Note>
Das Tool `video_generate` erscheint nur, wenn mindestens ein Provider für Videogenerierung verfügbar ist. Wenn Sie es nicht in Ihren Agent-Tools sehen, setzen Sie einen API-Schlüssel für einen Provider oder konfigurieren Sie `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw behandelt Videogenerierung als drei Laufzeitmodi:

- `generate` für Text-zu-Video-Anfragen ohne Referenzmedien
- `imageToVideo`, wenn die Anfrage ein oder mehrere Referenzbilder enthält
- `videoToVideo`, wenn die Anfrage ein oder mehrere Referenzvideos enthält

Provider können jede Teilmenge dieser Modi unterstützen. Das Tool validiert den aktiven
Modus vor dem Absenden und meldet unterstützte Modi in `action=list`.

## Schnellstart

1. Setzen Sie einen API-Schlüssel für einen beliebigen unterstützten Provider:

```bash
export GEMINI_API_KEY="your-key"
```

2. Optional ein Standardmodell festlegen:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Fragen Sie den Agenten:

> Erzeuge ein 5-sekündiges cineastisches Video eines freundlichen Hummers, der bei Sonnenuntergang surft.

Der Agent ruft `video_generate` automatisch auf. Kein Allowlisting für Tools erforderlich.

## Was passiert, wenn Sie ein Video generieren

Videogenerierung ist asynchron. Wenn der Agent `video_generate` in einer Sitzung aufruft:

1. OpenClaw sendet die Anfrage an den Provider und gibt sofort eine Task-ID zurück.
2. Der Provider verarbeitet den Job im Hintergrund (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. Wenn das Video bereit ist, weckt OpenClaw dieselbe Sitzung mit einem internen Abschlussereignis auf.
4. Der Agent postet das fertige Video zurück in die ursprüngliche Unterhaltung.

Während ein Job läuft, geben doppelte `video_generate`-Aufrufe in derselben Sitzung den aktuellen Task-Status zurück, statt eine weitere Generierung zu starten. Verwenden Sie `openclaw tasks list` oder `openclaw tasks show <taskId>`, um den Fortschritt über die CLI zu prüfen.

Außerhalb von sitzungsgestützten Agent-Läufen (zum Beispiel bei direkten Tool-Aufrufen) fällt das Tool auf Inline-Generierung zurück und gibt den finalen Medienpfad im selben Turn zurück.

### Task-Lifecycle

Jede `video_generate`-Anfrage durchläuft vier Zustände:

1. **queued** -- Task erstellt, wartet darauf, dass der Provider sie annimmt.
2. **running** -- Provider verarbeitet die Anfrage (typischerweise 30 Sekunden bis 5 Minuten, abhängig von Provider und Auflösung).
3. **succeeded** -- Video ist bereit; der Agent wird aufgeweckt und postet es in die Unterhaltung.
4. **failed** -- Provider-Fehler oder Timeout; der Agent wird mit Fehlerdetails aufgeweckt.

Status über die CLI prüfen:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Verhinderung von Duplikaten: Wenn für die aktuelle Sitzung bereits ein Video-Task im Zustand `queued` oder `running` existiert, gibt `video_generate` den bestehenden Task-Status zurück, statt einen neuen zu starten. Verwenden Sie `action: "status"`, um dies explizit zu prüfen, ohne eine neue Generierung auszulösen.

## Unterstützte Provider

| Provider | Standardmodell                | Text | Bildreferenz      | Videoreferenz    | API-Schlüssel                             |
| -------- | ----------------------------- | ---- | ----------------- | ---------------- | ----------------------------------------- |
| Alibaba  | `wan2.6-t2v`                  | Ja   | Ja (Remote-URL)   | Ja (Remote-URL)  | `MODELSTUDIO_API_KEY`                     |
| BytePlus | `seedance-1-0-lite-t2v-250428`| Ja   | 1 Bild            | Nein             | `BYTEPLUS_API_KEY`                        |
| ComfyUI  | `workflow`                    | Ja   | 1 Bild            | Nein             | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`| Ja   | 1 Bild            | Nein             | `FAL_KEY`                                 |
| Google   | `veo-3.1-fast-generate-preview` | Ja | 1 Bild            | 1 Video          | `GEMINI_API_KEY`                          |
| MiniMax  | `MiniMax-Hailuo-2.3`          | Ja   | 1 Bild            | Nein             | `MINIMAX_API_KEY`                         |
| OpenAI   | `sora-2`                      | Ja   | 1 Bild            | 1 Video          | `OPENAI_API_KEY`                          |
| Qwen     | `wan2.6-t2v`                  | Ja   | Ja (Remote-URL)   | Ja (Remote-URL)  | `QWEN_API_KEY`                            |
| Runway   | `gen4.5`                      | Ja   | 1 Bild            | 1 Video          | `RUNWAYML_API_SECRET`                     |
| Together | `Wan-AI/Wan2.2-T2V-A14B`      | Ja   | 1 Bild            | Nein             | `TOGETHER_API_KEY`                        |
| Vydra    | `veo3`                        | Ja   | 1 Bild (`kling`)  | Nein             | `VYDRA_API_KEY`                           |
| xAI      | `grok-imagine-video`          | Ja   | 1 Bild            | 1 Video          | `XAI_API_KEY`                             |

Einige Provider akzeptieren zusätzliche oder alternative API-Key-Umgebungsvariablen. Details finden Sie auf den jeweiligen [Provider-Seiten](#related).

Führen Sie `video_generate action=list` aus, um verfügbare Provider, Modelle und
Laufzeitmodi zur Laufzeit zu prüfen.

### Deklarierte Fähigkeitsmatrix

Dies ist der explizite Modusvertrag, der von `video_generate`, Vertragstests
und dem gemeinsamen Live-Sweep verwendet wird.

| Provider | `generate` | `imageToVideo` | `videoToVideo` | Gemeinsame Live-Lanes heute                                                                                                                |
| -------- | ---------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                     |
| BytePlus | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                                 |
| ComfyUI  | Ja         | Ja             | Nein           | Nicht im gemeinsamen Sweep; workflowspezifische Abdeckung lebt bei den Comfy-Tests                                                        |
| fal      | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                                 |
| Google   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da der aktuelle buffer-gestützte Gemini/Veo-Sweep diese Eingabe nicht akzeptiert |
| MiniMax  | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                                 |
| OpenAI   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; gemeinsames `videoToVideo` wird übersprungen, da dieser Org-/Eingabepfad derzeit providerseitigen Inpaint-/Remix-Zugriff benötigt |
| Qwen     | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider Remote-`http(s)`-Video-URLs benötigt                     |
| Runway   | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` läuft nur, wenn das ausgewählte Modell `runway/gen4_aleph` ist                                 |
| Together | Ja         | Ja             | Nein           | `generate`, `imageToVideo`                                                                                                                 |
| Vydra    | Ja         | Ja             | Nein           | `generate`; gemeinsames `imageToVideo` wird übersprungen, da gebündeltes `veo3` nur Text unterstützt und gebündeltes `kling` eine Remote-Bild-URL benötigt |
| xAI      | Ja         | Ja             | Ja             | `generate`, `imageToVideo`; `videoToVideo` wird übersprungen, da dieser Provider derzeit eine Remote-MP4-URL benötigt                     |

## Tool-Parameter

### Erforderlich

| Parameter | Typ    | Beschreibung                                                                  |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | Textbeschreibung des zu generierenden Videos (erforderlich für `action: "generate"`) |

### Inhaltseingaben

| Parameter | Typ      | Beschreibung                           |
| --------- | -------- | -------------------------------------- |
| `image`   | string   | Einzelnes Referenzbild (Pfad oder URL) |
| `images`  | string[] | Mehrere Referenzbilder (bis zu 5)      |
| `video`   | string   | Einzelnes Referenzvideo (Pfad oder URL) |
| `videos`  | string[] | Mehrere Referenzvideos (bis zu 4)      |

### Stilsteuerung

| Parameter         | Typ     | Beschreibung                                                             |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `aspectRatio`     | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`      | string  | `480P`, `720P`, `768P` oder `1080P`                                      |
| `durationSeconds` | number  | Zieldauer in Sekunden (wird auf den nächstgelegenen vom Provider unterstützten Wert gerundet) |
| `size`            | string  | Größenhinweis, wenn der Provider dies unterstützt                        |
| `audio`           | boolean | Generiertes Audio aktivieren, wenn unterstützt                           |
| `watermark`       | boolean | Watermarking des Providers ein- oder ausschalten, wenn unterstützt       |

### Erweitert

| Parameter  | Typ    | Beschreibung                                      |
| ---------- | ------ | ------------------------------------------------- |
| `action`   | string | `"generate"` (Standard), `"status"` oder `"list"` |
| `model`    | string | Provider-/Modell-Override (z. B. `runway/gen4.5`) |
| `filename` | string | Hinweis für den Ausgabedateinamen                 |

Nicht alle Provider unterstützen alle Parameter. OpenClaw normalisiert die Dauer bereits auf den nächstgelegenen vom Provider unterstützten Wert und ordnet auch übersetzte Geometriehinweise wie Größe-zu-Seitenverhältnis neu zu, wenn ein Fallback-Provider eine andere Steuerungsoberfläche bereitstellt. Wirklich nicht unterstützte Overrides werden nach Best Effort ignoriert und als Warnungen im Tool-Ergebnis gemeldet. Harte Fähigkeitsgrenzen (wie zu viele Referenzeingaben) führen vor dem Absenden zu einem Fehler.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw Dauer oder Geometrie während eines Provider-Fallbacks neu zuordnet, spiegeln die zurückgegebenen Werte für `durationSeconds`, `size`, `aspectRatio` und `resolution` wider, was tatsächlich abgesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

Referenzeingaben wählen auch den Laufzeitmodus aus:

- Keine Referenzmedien: `generate`
- Beliebige Bildreferenz: `imageToVideo`
- Beliebige Videoreferenz: `videoToVideo`

Gemischte Bild- und Videoreferenzen sind keine stabile gemeinsame Fähigkeitsoberfläche.
Verwenden Sie bevorzugt pro Anfrage nur einen Referenztyp.

## Aktionen

- **generate** (Standard) -- ein Video aus dem angegebenen Prompt und optionalen Referenzeingaben erstellen.
- **status** -- den Status des laufenden Video-Tasks für die aktuelle Sitzung prüfen, ohne eine weitere Generierung zu starten.
- **list** -- verfügbare Provider, Modelle und deren Fähigkeiten anzeigen.

## Modellauswahl

Beim Generieren eines Videos löst OpenClaw das Modell in dieser Reihenfolge auf:

1. **Tool-Parameter `model`** -- wenn der Agent beim Aufruf einen angibt.
2. **`videoGenerationModel.primary`** -- aus der Konfiguration.
3. **`videoGenerationModel.fallbacks`** -- werden in dieser Reihenfolge versucht.
4. **Auto-Erkennung** -- verwendet Provider mit gültiger Authentifizierung, beginnend mit dem aktuellen Standard-Provider, danach die übrigen Provider in alphabetischer Reihenfolge.

Wenn ein Provider fehlschlägt, wird automatisch der nächste Kandidat versucht. Wenn alle Kandidaten fehlschlagen, enthält der Fehler Details zu jedem Versuch.

Setzen Sie `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn Sie möchten,
dass die Videogenerierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
verwendet.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Hinweise zu Providern

| Provider | Hinweise                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba  | Verwendet den asynchronen DashScope-/Model-Studio-Endpunkt. Referenzbilder und -videos müssen Remote-`http(s)`-URLs sein.                                 |
| BytePlus | Nur eine einzelne Bildreferenz.                                                                                                                             |
| ComfyUI  | Workflow-gesteuerte lokale oder Cloud-Ausführung. Unterstützt Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.                           |
| fal      | Verwendet einen queue-gestützten Ablauf für lang laufende Jobs. Nur eine einzelne Bildreferenz.                                                            |
| Google   | Verwendet Gemini/Veo. Unterstützt ein Bild oder ein Video als Referenz.                                                                                    |
| MiniMax  | Nur eine einzelne Bildreferenz.                                                                                                                             |
| OpenAI   | Es wird nur der Override `size` weitergegeben. Andere Stil-Overrides (`aspectRatio`, `resolution`, `audio`, `watermark`) werden mit einer Warnung ignoriert. |
| Qwen     | Dasselbe DashScope-Backend wie Alibaba. Referenzeingaben müssen Remote-`http(s)`-URLs sein; lokale Dateien werden sofort abgelehnt.                        |
| Runway   | Unterstützt lokale Dateien über Data-URIs. Video-zu-Video erfordert `runway/gen4_aleph`. Rein textbasierte Läufe unterstützen die Seitenverhältnisse `16:9` und `9:16`. |
| Together | Nur eine einzelne Bildreferenz.                                                                                                                             |
| Vydra    | Verwendet `https://www.vydra.ai/api/v1` direkt, um Redirects zu vermeiden, bei denen die Authentifizierung verloren geht. `veo3` ist gebündelt nur als Text-zu-Video; `kling` erfordert eine Remote-Bild-URL. |
| xAI      | Unterstützt Text-zu-Video, Bild-zu-Video und Remote-Abläufe für Bearbeiten/Erweitern von Videos.                                                           |

## Provider-Fähigkeitsmodi

Der gemeinsame Vertrag für Videogenerierung erlaubt Providern jetzt, modusspezifische
Fähigkeiten zu deklarieren, statt nur flache aggregierte Grenzwerte. Neue Provider-
Implementierungen sollten explizite Modusblöcke bevorzugen:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Flache aggregierte Felder wie `maxInputImages` und `maxInputVideos` reichen
nicht aus, um Unterstützung für Transformationsmodi anzugeben. Provider sollten
`generate`, `imageToVideo` und `videoToVideo` explizit deklarieren, damit Live-Tests,
Vertragstests und das gemeinsame Tool `video_generate` die Modusunterstützung
deterministisch validieren können.

## Live-Tests

Opt-in-Live-Abdeckung für die gemeinsamen gebündelten Provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Repo-Wrapper:

```bash
pnpm test:live:media video
```

Diese Live-Datei lädt fehlende Provider-Umgebungsvariablen aus `~/.profile`, bevorzugt
standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen und führt die
deklarierten Modi aus, die sie sicher mit lokalen Medien nutzen kann:

- `generate` für jeden Provider im Sweep
- `imageToVideo`, wenn `capabilities.imageToVideo.enabled`
- `videoToVideo`, wenn `capabilities.videoToVideo.enabled` und Provider/Modell
  im gemeinsamen Sweep buffer-gestützte lokale Videoeingaben akzeptieren

Heute deckt die gemeinsame Live-Lane für `videoToVideo` ab:

- `runway` nur, wenn Sie `runway/gen4_aleph` auswählen

## Konfiguration

Setzen Sie das Standardmodell für Videogenerierung in Ihrer OpenClaw-Konfiguration:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Oder über die CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Verwandt

- [Tools Overview](/de/tools)
- [Background Tasks](/de/automation/tasks) -- Task-Verfolgung für asynchrone Videogenerierung
- [Alibaba Model Studio](/de/providers/alibaba)
- [BytePlus](/de/concepts/model-providers#byteplus-international)
- [ComfyUI](/de/providers/comfy)
- [fal](/de/providers/fal)
- [Google (Gemini)](/de/providers/google)
- [MiniMax](/de/providers/minimax)
- [OpenAI](/de/providers/openai)
- [Qwen](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [Together AI](/de/providers/together)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults)
- [Models](/de/concepts/models)
