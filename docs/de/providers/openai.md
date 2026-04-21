---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Authentifizierung über ein Codex-Abonnement statt über API-Schlüssel verwenden
    - Sie benötigen strengeres Agent-Ausführungsverhalten für GPT-5
summary: Verwenden Sie OpenAI über API-Schlüssel oder ein Codex-Abonnement in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T06:30:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI bietet Entwickler-APIs für GPT-Modelle. OpenClaw unterstützt zwei Authentifizierungswege:

- **API-Schlüssel** — direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement** — ChatGPT-/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)

OpenAI unterstützt die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw ausdrücklich.

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel im [OpenAI Platform-Dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz | Route | Authentifizierung |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Direkte OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    Die Anmeldung über ChatGPT/Codex wird über `openai-codex/*` geroutet, nicht über `openai/*`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten API-Pfad bereit. Live-Anfragen an die OpenAI API lehnen dieses Modell ab. Spark ist nur für Codex.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements anstelle eines separaten API-Schlüssels. Codex cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex-OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Routenübersicht

    | Modellreferenz | Route | Authentifizierung |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT-/Codex-OAuth | Codex-Anmeldung |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT-/Codex-OAuth | Codex-Anmeldung (abhängig von Berechtigung) |

    <Note>
    Dieser Pfad ist absichtlich von `openai/gpt-5.4` getrennt. Verwenden Sie `openai/*` mit einem API-Schlüssel für direkten Platform-Zugriff und `openai-codex/*` für Zugriff über das Codex-Abonnement.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Wenn beim Onboarding eine bestehende Codex-CLI-Anmeldung wiederverwendet wird, bleiben diese Zugangsdaten durch die Codex CLI verwaltet. Nach Ablauf liest OpenClaw zuerst erneut die externe Codex-Quelle und schreibt die aktualisierten Zugangsdaten zurück in den Codex-Speicher.
    </Tip>

    ### Obergrenze für das Kontextfenster

    OpenClaw behandelt Modellmetadaten und die Kontextobergrenze zur Laufzeit als getrennte Werte.

    Für `openai-codex/gpt-5.4`:

    - Natives `contextWindow`: `1050000`
    - Standardmäßige Laufzeitobergrenze für `contextTokens`: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Eigenschaften bei Latenz und Qualität. Überschreiben Sie sie mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Kontextbudget zur Laufzeit zu begrenzen.
    </Note>

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte `openai`-Plugin registriert Bildgenerierung über das Tool `image_generate`.

| Fähigkeit                | Wert                               |
| ------------------------ | ---------------------------------- |
| Standardmodell           | `openai/gpt-image-1`               |
| Max. Bilder pro Anfrage  | 4                                  |
| Bearbeitungsmodus        | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen   | Unterstützt                        |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergeleitet |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte `openai`-Plugin registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit        | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung einzelner Videos                        |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt                                                                  |
| Andere Überschreibungen | `aspectRatio`, `resolution`, `audio`, `watermark` werden mit einer Tool-Warnung ignoriert |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen OpenAI-spezifischen GPT-5-Prompt-Beitrag für GPT-5-Läufe der Familien `openai/*` und `openai-codex/*` hinzu. Er befindet sich im gebündelten OpenAI-Plugin, gilt für Modell-IDs wie `gpt-5`, `gpt-5.2`, `gpt-5.4` und `gpt-5.4-mini` und gilt nicht für ältere GPT-4.x-Modelle.

Der GPT-5-Beitrag fügt einen getaggten Verhaltensvertrag für Persona-Konsistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabestruktur, Abschlussprüfungen und Verifikation hinzu. Kanalspezifisches Antwortverhalten und Verhalten bei stillen Nachrichten bleiben im gemeinsamen OpenClaw-System-Prompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Hinweise sind für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist davon getrennt und konfigurierbar.

| Wert                   | Effekt                                          |
| ---------------------- | ----------------------------------------------- |
| `"friendly"` (Standard) | Aktiviert die Ebene für den freundlichen Interaktionsstil |
| `"on"`                 | Alias für `"friendly"`                          |
| `"off"`                | Deaktiviert nur die Ebene für den freundlichen Stil |

<Tabs>
  <Tab title="Konfiguration">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Werte sind zur Laufzeit nicht case-sensitiv, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil.
</Tip>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai`-Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Basis-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Verfügbare Modelle: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Verfügbare Stimmen: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Endpunkt der Chat-API zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte `openai`-Plugin registriert Realtime-Transkription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711-u-law-Audio.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Stimme">
    Das gebündelte `openai`-Plugin registriert Realtime-Stimme für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Dauer der Stille | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool-Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet zuerst WebSocket mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch für `openai-codex/*`.

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als degradiert und verwendet während der Abkühlphase SSE
    - Hängt stabile Header für Sitzungs- und Turn-Identität für Wiederholungen und Reconnects an
    - Normalisiert Nutzungszähler (`input_tokens` / `prompt_tokens`) über Transportvarianten hinweg

    | Wert | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | Zuerst WebSocket, SSE-Fallback |
    | `"sse"` | Nur SSE erzwingen |
    | `"websocket"` | Nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Verwandte OpenAI-Dokumentation:
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*`, um die Latenz beim ersten Turn zu verringern.

    ```json5
    // Warm-up deaktivieren
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Umschalter für den Schnellmodus sowohl für `openai/*` als auch für `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus der Prioritätsverarbeitung von OpenAI zu (`service_tier = "priority"`). Bestehende Werte für `service_tier` bleiben erhalten, und der Schnellmodus überschreibt weder `reasoning` noch `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Überschreibungen pro Sitzung haben Vorrang vor der Konfiguration. Wenn die Überschreibung der Sitzung in der Sitzungs-UI gelöscht wird, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritätsverarbeitung (service_tier)">
    Die API von OpenAI stellt Prioritätsverarbeitung über `service_tier` bereit. Setzen Sie dies pro Modell in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Unterstützte Werte: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert OpenClaw automatisch serverseitige Compaction:

    - Erzwingt `store: true` (außer die Modellkompatibilität setzt `supportsStore: false`)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    <Tabs>
      <Tab title="Explizit aktivieren">
        Nützlich für kompatible Endpunkte wie Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Benutzerdefinierter Schwellenwert">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Deaktivieren">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` steuert nur das Einfügen von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, außer die Kompatibilität setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Läufe der GPT-5-Familie auf `openai/*` und `openai-codex/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Mit `strict-agentic` gilt in OpenClaw:
    - Ein Zug mit nur einem Plan wird nicht länger als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Zug wird mit einer „jetzt handeln“-Steuerung erneut versucht
    - `update_plan` wird für umfangreiche Arbeit automatisch aktiviert
    - Ein expliziter blockierter Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Gilt nur für Läufe der GPT-5-Familie von OpenAI und Codex. Andere Provider und ältere Modellfamilien behalten das Standardverhalten.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Wert `none` für effort unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Verwenden standardmäßig strikte Tool-Schemas
    - Hängen versteckte Attribution-Header nur an verifizierten nativen Hosts an
    - Behalten OpenAI-spezifische Formung von Anfragen (`service_tier`, `store`, Reasoning-Kompatibilität, Hinweise für Prompt-Cache) bei

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine strikten Tool-Schemas oder nur für native Routen bestimmte Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber keine versteckten Attribution-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
