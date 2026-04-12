---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten die Authentifizierung über ein Codex-Abonnement statt über API-Schlüssel verwenden
    - Sie benötigen ein strengeres Ausführungsverhalten des GPT-5-Agenten
summary: Verwenden Sie OpenAI in OpenClaw über API-Schlüssel oder ein Codex-Abonnement
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T23:32:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aeb756618c5611fed56e4bf89015a2304ff2e21596104b470ec6e7cb459d1c9
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI bietet Entwickler-APIs für GPT-Modelle. OpenClaw unterstützt zwei Auth-Wege:

- **API-Schlüssel** — direkter Zugriff auf die OpenAI-Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement** — ChatGPT-/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)

OpenAI unterstützt ausdrücklich die Nutzung von Subscription-OAuth in externen Tools und Workflows wie OpenClaw.

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Schlüssel (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="Ihren API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel aus dem [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oder übergeben Sie den Schlüssel direkt:

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

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |

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
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten API-Pfad bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab. Spark ist nur für Codex verfügbar.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** die Nutzung Ihres ChatGPT-/Codex-Abonnements anstelle eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Das Standardmodell festlegen">
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

    | Modell-Ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT-/Codex-OAuth | Codex-Anmeldung |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT-/Codex-OAuth | Codex-Anmeldung (abhängig von der Berechtigung) |

    <Note>
    Diese Route ist absichtlich von `openai/gpt-5.4` getrennt. Verwenden Sie `openai/*` mit einem API-Schlüssel für den direkten Platform-Zugriff und `openai-codex/*` für den Zugriff über das Codex-Abonnement.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Wenn das Onboarding eine vorhandene Codex-CLI-Anmeldung wiederverwendet, bleiben diese Zugangsdaten von der Codex CLI verwaltet. Nach Ablauf liest OpenClaw zuerst erneut aus der externen Codex-Quelle und schreibt die aktualisierten Zugangsdaten zurück in den Codex-Speicher.
    </Tip>

    ### Begrenzung des Kontextfensters

    OpenClaw behandelt Modellmetadaten und die Laufzeitbegrenzung des Kontexts als getrennte Werte.

    Für `openai-codex/gpt-5.4`:

    - Natives `contextWindow`: `1050000`
    - Standardmäßige Laufzeitgrenze für `contextTokens`: `272000`

    Die kleinere Standardgrenze hat in der Praxis bessere Latenz- und Qualitätseigenschaften. Überschreiben Sie sie mit `contextTokens`:

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
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Laufzeitbudget für den Kontext zu begrenzen.
    </Note>

  </Tab>
</Tabs>

## Bildgenerierung

Das gebündelte `openai` Plugin registriert die Bildgenerierung über das Tool `image_generate`.

| Capability                | Wert                                 |
| ------------------------- | ------------------------------------ |
| Standardmodell            | `openai/gpt-image-1`                 |
| Maximale Bilder pro Anfrage | 4                                  |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder)  |
| Größenüberschreibungen    | Unterstützt                          |
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

Das gebündelte `openai` Plugin registriert die Videogenerierung über das Tool `video_generate`.

| Capability       | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
| Referenzeingaben | 1 Bild oder 1 Video                                                               |
| Größenüberschreibungen | Unterstützt                                                                 |
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

## Persönlichkeits-Overlay

OpenClaw fügt für Ausführungen mit `openai/*` und `openai-codex/*` ein kleines OpenAI-spezifisches Prompt-Overlay hinzu. Das Overlay hält den Assistenten warm, kooperativ, prägnant und etwas emotional ausdrucksstärker, ohne den grundlegenden System-Prompt zu ersetzen.

| Wert                   | Wirkung                               |
| ---------------------- | ------------------------------------- |
| `"friendly"` (Standard) | Aktiviert das OpenAI-spezifische Overlay |
| `"on"`                 | Alias für `"friendly"`                |
| `"off"`                | Nur den grundlegenden OpenClaw-Prompt verwenden |

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
Werte werden zur Laufzeit ohne Beachtung der Groß-/Kleinschreibung behandelt, daher deaktivieren sowohl `"Off"` als auch `"off"` das Overlay.
</Tip>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte `openai` Plugin registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnotizen, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Base-URL zu überschreiben, ohne den Chat-API-Endpunkt zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Echtzeit-Transkription">
    Das gebündelte `openai` Plugin registriert Echtzeit-Transkription für das Voice Call Plugin.

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

  <Accordion title="Echtzeit-Stimme">
    Das gebündelte `openai` Plugin registriert Echtzeit-Stimme für das Voice Call Plugin.

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
    OpenClaw verwendet für `openai/*` und `openai-codex/*` standardmäßig WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` führt OpenClaw Folgendes aus:
    - Wiederholt einen frühen WebSocket-Fehler einmal, bevor auf SSE zurückgefallen wird
    - Markiert WebSocket nach einem Fehler für etwa 60 Sekunden als degradiert und verwendet während der Abklingzeit SSE
    - Hängt stabile Session- und Turn-Identitäts-Header für Wiederholungen und Neuverbindungen an
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

    Zugehörige OpenAI-Dokumentation:
    - [Realtime API mit WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming-API-Antworten (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert standardmäßig WebSocket-Warm-up für `openai/*`, um die Latenz des ersten Turns zu verringern.

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
    OpenClaw stellt einen gemeinsamen Schalter für den Schnellmodus sowohl für `openai/*` als auch für `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, ordnet OpenClaw den Schnellmodus dem OpenAI-Prioritäts-Processing zu (`service_tier = "priority"`). Vorhandene `service_tier`-Werte bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um.

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
    Session-Überschreibungen haben Vorrang vor der Konfiguration. Wenn die Session-Überschreibung in der Sessions-UI gelöscht wird, kehrt die Session zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Prioritäts-Processing (`service_tier`)">
    OpenAIs API stellt Prioritäts-Processing über `service_tier` bereit. Setzen Sie es in OpenClaw pro Modell:

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
    `serviceTier` wird nur an native OpenAI-Endpunkte (`api.openai.com`) und native Codex-Endpunkte (`chatgpt.com/backend-api`) weitergeleitet. Wenn Sie einen der beiden Provider über einen Proxy routen, lässt OpenClaw `service_tier` unverändert.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert OpenClaw automatisch serverseitige Compaction:

    - Erzwingt `store: true` (es sei denn, die Modellkompatibilität setzt `supportsStore: false`)
    - Fügt `context_management: [{ type: "compaction", compact_threshold: ... }]` ein
    - Standard für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

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
    `responsesServerCompaction` steuert nur das Einfügen von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, es sei denn, die Kompatibilität setzt `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strenger agentischer GPT-Modus">
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
    - Ein Turn nur mit Plan wird nicht mehr als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Turn wird mit einer Jetzt-handeln-Steuerung erneut versucht
    - `update_plan` wird für umfangreichere Arbeit automatisch aktiviert
    - Ein expliziter blockierter Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur für GPT-5-Familien-Läufe von OpenAI und Codex. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` unverändert bei, wenn Reasoning explizit deaktiviert ist
    - Verwenden standardmäßig den strikten Modus für Tool-Schemas
    - Hängen versteckte Attributions-Header nur an verifizierte native Hosts an
    - Behalten OpenAI-spezifisches Request-Shaping bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine strikten Tool-Schemas oder nur für native Routen bestimmte Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht die versteckten Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Providerauswahl.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zu Auth und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
