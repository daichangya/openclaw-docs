---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: xAI-Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-04-24T06:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw enthält ein gebündeltes Provider-Plugin `xai` für Grok-Modelle.

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel in der [xAI-Konsole](https://console.x.ai/).
  </Step>
  <Step title="Ihren API-Schlüssel setzen">
    Setzen Sie `XAI_API_KEY` oder führen Sie aus:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Ein Modell auswählen">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw verwendet die xAI-Responses-API als gebündelten xAI-Transport. Derselbe
`XAI_API_KEY` kann auch Grok-gestützte `web_search`, erstklassiges `x_search`
und remote `code_execution` versorgen.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey`
speichern, verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Die Abstimmung von `code_execution` befindet sich unter `plugins.entries.xai.config.codeExecution`.
</Note>

## Integrierter Katalog

OpenClaw enthält diese xAI-Modellfamilien standardmäßig:

| Familie        | Modell-IDs                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Das Plugin löst außerdem neuere IDs `grok-4*` und `grok-code-fast*` weiter auf, wenn
sie derselben API-Form folgen.

<Tip>
`grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*` sind die
aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
</Tip>

## OpenClaw-Funktionsabdeckung

Das gebündelte Plugin bildet die aktuelle öffentliche API-Oberfläche von xAI auf die gemeinsamen
Provider- und Tool-Verträge von OpenClaw ab. Fähigkeiten, die nicht in den gemeinsamen Vertrag passen
(zum Beispiel Streaming-TTS und Realtime Voice), werden nicht bereitgestellt — siehe die Tabelle
unten.

| xAI-Fähigkeit               | OpenClaw-Oberfläche                      | Status                                                              |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses            | Modell-Provider `xai/<model>`            | Ja                                                                  |
| Serverseitige Websuche      | `web_search`-Provider `grok`             | Ja                                                                  |
| Serverseitige X-Suche       | Tool `x_search`                          | Ja                                                                  |
| Serverseitige Codeausführung | Tool `code_execution`                   | Ja                                                                  |
| Bilder                      | `image_generate`                         | Ja                                                                  |
| Videos                      | `video_generate`                         | Ja                                                                  |
| Batch-Text-to-Speech        | `messages.tts.provider: "xai"` / `tts`   | Ja                                                                  |
| Streaming-TTS               | —                                        | Nicht bereitgestellt; der TTS-Vertrag von OpenClaw gibt vollständige Audiopuffer zurück |
| Batch-Speech-to-Text        | `tools.media.audio` / Media Understanding | Ja                                                                 |
| Streaming-Speech-to-Text    | Voice Call `streaming.provider: "xai"`   | Ja                                                                  |
| Realtime Voice              | —                                        | Noch nicht bereitgestellt; anderer Sitzungs-/WebSocket-Vertrag      |
| Dateien / Batches           | Nur generische Modell-API-Kompatibilität | Kein erstklassiges OpenClaw-Tool                                    |

<Note>
OpenClaw verwendet die REST-APIs von xAI für Bild/Video/TTS/STT für Mediengenerierung,
Sprache und Batch-Transkription, den Streaming-STT-WebSocket von xAI für Live-
Voice-Call-Transkription und die Responses-API für Modell-, Such- und
Codeausführungstools. Funktionen, die andere OpenClaw-Verträge benötigen, wie
Realtime-Voice-Sitzungen, werden hier als Upstream-Fähigkeiten dokumentiert statt als
verborgenes Plugin-Verhalten.
</Note>

### Fast-Mode-Zuordnungen

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt native xAI-Anfragen wie folgt um:

| Quellmodell   | Fast-Mode-Ziel    |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### Veraltete Kompatibilitätsaliase

Veraltete Aliase werden weiterhin auf die kanonischen gebündelten IDs normalisiert:

| Veralteter Alias            | Kanonische ID                         |
| --------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`     | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`   | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`       | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`   | `grok-4.20-beta-latest-non-reasoning` |

## Funktionen

<AccordionGroup>
  <Accordion title="Websuche">
    Der gebündelte Websuch-Provider `grok` verwendet ebenfalls `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Videogenerierung">
    Das gebündelte Plugin `xai` registriert Videogenerierung über das gemeinsame
    Tool `video_generate`.

    - Standard-Videomodell: `xai/grok-imagine-video`
    - Modi: Text-zu-Video, Bild-zu-Video, Remote-Videobearbeitung und Remote-Video-
      Erweiterung
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Auflösungen: `480P`, `720P`
    - Dauer: 1–15 Sekunden für Generierung/Bild-zu-Video, 2–10 Sekunden für
      Erweiterung

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie Remote-`http(s)`-URLs für
    Eingaben zur Videobearbeitung/-erweiterung. Bild-zu-Video akzeptiert lokale Bildpuffer, weil
    OpenClaw diese für xAI als Data-URLs kodieren kann.
    </Warning>

    So verwenden Sie xAI als Standard-Video-Provider:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter,
    Providerauswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Bildgenerierung">
    Das gebündelte Plugin `xai` registriert Bildgenerierung über das gemeinsame
    Tool `image_generate`.

    - Standard-Bildmodell: `xai/grok-imagine-image`
    - Zusätzliches Modell: `xai/grok-imagine-image-pro`
    - Modi: Text-zu-Bild und Bearbeitung mit Referenzbild
    - Referenzeingaben: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Anzahl: bis zu 4 Bilder

    OpenClaw fordert bei xAI Bildantworten als `b64_json` an, damit generierte Medien
    über den normalen Kanal für Anhänge gespeichert und zugestellt werden können. Lokale
    Referenzbilder werden in Data-URLs umgewandelt; Remote-Referenzen mit `http(s)` werden
    durchgereicht.

    So verwenden Sie xAI als Standard-Provider für Bilder:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI dokumentiert auch `quality`, `mask`, `user` und zusätzliche native Seitenverhältnisse
    wie `1:2`, `2:1`, `9:20` und `20:9`. OpenClaw leitet derzeit nur die
    gemeinsamen providerübergreifenden Steuerungen für Bilder weiter; nicht unterstützte
    native-only-Parameter werden absichtlich nicht über `image_generate` bereitgestellt.
    </Note>

  </Accordion>

  <Accordion title="Text-to-Speech">
    Das gebündelte Plugin `xai` registriert Text-to-Speech über die gemeinsame
    Provider-Oberfläche `tts`.

    - Stimmen: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Standardstimme: `eve`
    - Formate: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Sprache: BCP-47-Code oder `auto`
    - Geschwindigkeit: providernative Überschreibung der Geschwindigkeit
    - Das native Opus-Sprachnachrichtenformat wird nicht unterstützt

    So verwenden Sie xAI als Standard-Provider für TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw verwendet den Batch-Endpunkt `/v1/tts` von xAI. xAI bietet auch Streaming-TTS
    über WebSocket an, aber der Sprach-Provider-Vertrag von OpenClaw erwartet derzeit
    einen vollständigen Audiopuffer vor der Zustellung der Antwort.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-Text">
    Das gebündelte Plugin `xai` registriert Batch-Speech-to-Text über die
    Transkriptionsoberfläche von Media Understanding in OpenClaw.

    - Standardmodell: `grok-stt`
    - Endpunkt: xAI REST `/v1/stt`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Unterstützt von OpenClaw überall dort, wo eingehende Audiotranskription
      `tools.media.audio` verwendet, einschließlich Discord-Voice-Channel-Segmenten und
      Audioanhängen von Kanälen

    So erzwingen Sie xAI für eingehende Audiotranskription:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    Die Sprache kann über die gemeinsame Konfiguration für Audiomedien oder pro Aufruf
    der Transkriptionsanfrage angegeben werden. Prompt-Hinweise werden von der gemeinsamen OpenClaw-
    Oberfläche akzeptiert, aber die xAI-REST-STT-Integration leitet nur Datei, Modell und
    Sprache weiter, weil diese sauber auf den aktuellen öffentlichen Endpunkt von xAI abgebildet werden.

  </Accordion>

  <Accordion title="Streaming-Speech-to-Text">
    Das gebündelte Plugin `xai` registriert außerdem einen Provider für Echtzeit-Transkription
    für Live-Audio in Voice Calls.

    - Endpunkt: xAI-WebSocket `wss://api.x.ai/v1/stt`
    - Standard-Encoding: `mulaw`
    - Standard-Sample-Rate: `8000`
    - Standard-Endpointing: `800ms`
    - Zwischentranskripte: standardmäßig aktiviert

    Der Twilio-Medienstream von Voice Call sendet G.711-µ-law-Audioframes, daher kann der
    xAI-Provider diese Frames direkt ohne Transkodierung weiterleiten:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Provider-eigene Konfiguration befindet sich unter
    `plugins.entries.voice-call.config.streaming.providers.xai`. Unterstützte
    Schlüssel sind `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` oder
    `alaw`), `interimResults`, `endpointingMs` und `language`.

    <Note>
    Dieser Streaming-Provider ist für den Echtzeit-Transkriptionspfad von Voice Call.
    Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-
    Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Konfiguration von x_search">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool für die Suche
    in X-Inhalten (ehemals Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel         | Typ     | Standard           | Beschreibung                         |
    | ----------------- | ------- | ------------------ | ------------------------------------ |
    | `enabled`         | boolean | —                  | `x_search` aktivieren oder deaktivieren |
    | `model`           | string  | `grok-4-1-fast`    | Modell, das für `x_search`-Anfragen verwendet wird |
    | `inlineCitations` | boolean | —                  | Inline-Zitationen in Ergebnissen einfügen |
    | `maxTurns`        | number  | —                  | Maximale Anzahl von Gesprächs-Turns  |
    | `timeoutSeconds`  | number  | —                  | Anfrage-Timeout in Sekunden          |
    | `cacheTtlMinutes` | number  | —                  | Cache-Time-to-live in Minuten        |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguration der Codeausführung">
    Das gebündelte xAI-Plugin stellt `code_execution` als OpenClaw-Tool für
    Remote-Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel        | Typ     | Standard                  | Beschreibung                              |
    | ---------------- | ------- | ------------------------- | ----------------------------------------- |
    | `enabled`        | boolean | `true` (wenn Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`          | string  | `grok-4-1-fast`           | Modell, das für Codeausführungsanfragen verwendet wird |
    | `maxTurns`       | number  | —                         | Maximale Anzahl von Gesprächs-Turns       |
    | `timeoutSeconds` | number  | —                         | Anfrage-Timeout in Sekunden               |

    <Note>
    Dies ist Remote-Sandbox-Ausführung von xAI, nicht lokales [`exec`](/de/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bekannte Grenzen">
    - Authentifizierung ist derzeit nur per API-Schlüssel möglich. Es gibt in
      OpenClaw noch keinen xAI-OAuth- oder Device-Code-Ablauf.
    - `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem
      normalen xAI-Providerpfad nicht unterstützt, weil es eine andere Upstream-API-
      Oberfläche als der Standard-xAI-Transport von OpenClaw erfordert.
    - xAI Realtime Voice ist noch nicht als OpenClaw-Provider registriert. Es
      benötigt einen anderen bidirektionalen Voice-Session-Vertrag als Batch-STT oder
      Streaming-Transkription.
    - Die xAI-Bildparameter `quality`, `mask` und zusätzliche native-only-Seitenverhältnisse
      werden erst dann bereitgestellt, wenn das gemeinsame Tool `image_generate` entsprechende
      providerübergreifende Steuerungen hat.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Korrekturen für Tool-Schema und Tool-Call-Kompatibilität
      automatisch auf dem gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
      Payload-Schlüssel für Reasoning, bevor native xAI-Anfragen gesendet werden.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-
      Tools bereitgestellt. OpenClaw aktiviert das jeweils benötigte integrierte xAI-Feature innerhalb jeder Tool-
      Anfrage, statt alle nativen Tools an jeden Chat-Turnus anzuhängen.
    - `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin und sind
      nicht fest in die Core-Modell-Laufzeit eingebaut.
    - `code_execution` ist Remote-Sandbox-Ausführung von xAI, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Live-Tests

Die Medienpfade von xAI sind durch Unit-Tests und opt-in Live-Suites abgedeckt. Die Live-
Befehle laden Secrets aus Ihrer Login-Shell, einschließlich `~/.profile`, bevor
`XAI_API_KEY` geprüft wird.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Die providerspezifische Live-Datei synthetisiert normales TTS, telefonietaugliches PCM-
TTS, transkribiert Audio über xAI-Batch-STT, streamt dasselbe PCM über xAI-
Realtime-STT, erzeugt Text-zu-Bild-Ausgaben und bearbeitet ein Referenzbild. Die
gemeinsame Live-Datei für Bilder verifiziert denselben xAI-Provider über die
Laufzeitauswahl, Fallback, Normalisierung und den Medienanhangspfad von OpenClaw.

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Der umfassendere Überblick über Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Lösungen.
  </Card>
</CardGroup>
