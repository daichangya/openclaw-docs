---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden.
    - Sie möchten statt API-Schlüsseln die Codex-Abonnement-Authentifizierung verwenden.
    - Sie benötigen strengeres Agent-Ausführungsverhalten für GPT-5.
summary: OpenAI über API-Schlüssel oder Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI stellt Entwickler-APIs für GPT-Modelle bereit. OpenClaw unterstützt zwei Authentifizierungswege:

  - **API-Schlüssel** — direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
  - **Codex-Abonnement** — ChatGPT/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)

  OpenAI unterstützt ausdrücklich die Verwendung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

  ## OpenClaw-Funktionsabdeckung

  | OpenAI-Fähigkeit            | OpenClaw-Oberfläche                         | Status                                                    |
  | --------------------------- | ------------------------------------------- | --------------------------------------------------------- |
  | Chat / Responses            | `openai/<model>`-Modell-Provider            | Ja                                                        |
  | Codex-Abonnement-Modelle    | `openai-codex/<model>`-Modell-Provider      | Ja                                                        |
  | Serverseitige Websuche      | Natives OpenAI-Responses-Tool               | Ja, wenn Websuche aktiviert ist und kein Provider festgelegt ist |
  | Bilder                      | `image_generate`                            | Ja                                                        |
  | Videos                      | `video_generate`                            | Ja                                                        |
  | Text-to-Speech              | `messages.tts.provider: "openai"` / `tts`   | Ja                                                        |
  | Batch-Speech-to-Text        | `tools.media.audio` / Medienverständnis     | Ja                                                        |
  | Streaming-Speech-to-Text    | Voice Call `streaming.provider: "openai"`   | Ja                                                        |
  | Realtime-Voice              | Voice Call `realtime.provider: "openai"`    | Ja                                                        |
  | Embeddings                  | Embedding-Provider für Memory               | Ja                                                        |

  ## Erste Schritte

  Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel im [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |

    <Note>
    Die ChatGPT/Codex-Anmeldung wird über `openai-codex/*` geleitet, nicht über `openai/*`.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** auf dem direkten API-Pfad bereit. Live-Anfragen an die OpenAI-API lehnen dieses Modell ab. Spark ist nur für Codex.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Am besten geeignet für:** die Verwendung Ihres ChatGPT/Codex-Abonnements statt eines separaten API-Schlüssels. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für headless-Setups oder Setups, in denen Callback-Hosts problematisch sind, fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Ablauf statt mit dem localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex-OAuth | Codex-Anmeldung |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex-OAuth | Codex-Anmeldung (abhängig von Berechtigung) |

    <Note>
    Diese Route ist absichtlich von `openai/gpt-5.4` getrennt. Verwenden Sie `openai/*` mit einem API-Schlüssel für direkten Platform-Zugriff und `openai-codex/*` für Codex-Abonnementzugriff.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Das Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben beschriebenen Device-Code-Ablauf an — OpenClaw verwaltet die resultierenden Zugangsdaten in seinem eigenen Auth-Speicher für Agenten.
    </Note>

    ### Begrenzung des Kontextfensters

    OpenClaw behandelt Modellmetadaten und die Laufzeitbegrenzung des Kontexts als getrennte Werte.

    Für `openai-codex/gpt-5.4`:

    - Native `contextWindow`: `1050000`
    - Standardmäßige Laufzeitbegrenzung `contextTokens`: `272000`

    Die kleinere Standardbegrenzung hat in der Praxis bessere Latenz- und Qualitätseigenschaften. Überschreiben Sie sie mit `contextTokens`:

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

Das gebündelte Plugin `openai` registriert Bildgenerierung über das Tool `image_generate`.

| Fähigkeit                 | Wert                               |
| ------------------------- | ---------------------------------- |
| Standardmodell            | `openai/gpt-image-2`               |
| Maximale Bilder pro Anfrage | 4                                |
| Bearbeitungsmodus         | Aktiviert (bis zu 5 Referenzbilder) |
| Größenüberschreibungen    | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Wird nicht an die OpenAI-Images-API weitergeleitet |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bildbearbeitung. `gpt-image-1` bleibt als explizite Modellüberschreibung nutzbar, aber neue OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videogenerierung

Das gebündelte Plugin `openai` registriert Videogenerierung über das Tool `video_generate`.

| Fähigkeit       | Wert                                                                                |
| ---------------- | ---------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                    |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung einzelner Videos                         |
| Referenzeingaben | 1 Bild oder 1 Video                                                                |
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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt für GPT-5-Familien-Läufe providerübergreifend einen gemeinsamen GPT-5-Prompt-Beitrag hinzu. Er gilt nach Modell-ID, sodass `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` und andere kompatible GPT-5-Referenzen dasselbe Overlay erhalten. Ältere GPT-4.x-Modelle erhalten es nicht.

Der gebündelte native Codex-Harness-Provider (`codex/*`) verwendet dasselbe GPT-5-Verhalten und dasselbe Heartbeat-Overlay über Entwickleranweisungen des Codex-App-Servers, sodass `codex/gpt-5.x`-Sitzungen dieselbe Folgsamkeit und proaktive Heartbeat-Anleitung beibehalten, auch wenn Codex den restlichen Harness-Prompt besitzt.

Der GPT-5-Beitrag fügt einen markierten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabeform, Abschlussprüfungen und Verifizierung hinzu. Kanalbezogenes Antwort- und Silent-Message-Verhalten bleibt im gemeinsamen OpenClaw-System-Prompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Anleitung ist für passende Modelle immer aktiviert. Die Ebene für den freundlichen Interaktionsstil ist getrennt und konfigurierbar.

| Wert                   | Effekt                                         |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (Standard) | Die Ebene für den freundlichen Interaktionsstil aktivieren |
| `"on"`                 | Alias für `"friendly"`                         |
| `"off"`                | Nur die Ebene für den freundlichen Stil deaktivieren |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Werte werden zur Laufzeit ohne Beachtung der Groß-/Kleinschreibung behandelt, sodass `"Off"` und `"off"` beide die Ebene für den freundlichen Stil deaktivieren.
</Tip>

<Note>
Legacy-`plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Stimme und Sprache

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte Plugin `openai` registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnachrichten, `mp3` für Dateien |
    | API-Schlüssel | `messages.tts.providers.openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |
    | Base-URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Base-URL zu überschreiben, ohne den Endpunkt der Chat-API zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Das gebündelte Plugin `openai` registriert Batch-Speech-to-Text über
    die Transkriptionsoberfläche für Medienverständnis von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpunkt: OpenAI-REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Upload einer Audiodatei
    - Wird überall in OpenClaw unterstützt, wo eingehende Audio-Transkription
      `tools.media.audio` verwendet, einschließlich Discord-Sprachkanal-Segmenten und Kanal-
      Audio-Anhängen

    Um OpenAI für eingehende Audio-Transkription zu erzwingen:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie von der
    gemeinsamen Audio-Medienkonfiguration oder pro Transkriptionsanfrage bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte Plugin `openai` registriert Realtime-Transkription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stille-Dauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711-u-law-Audio (`g711_ulaw` / `audio/pcmu`). Dieser Streaming-Provider ist für den Realtime-Transkriptionspfad von Voice Call gedacht; Discord Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Voice">
    Das gebündelte Plugin `openai` registriert Realtime-Voice für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwellenwert | `...openai.vadThreshold` | `0.5` |
    | Stille-Dauer | `...openai.silenceDurationMs` | `500` |
    | API-Schlüssel | `...openai.apiKey` | Fällt auf `OPENAI_API_KEY` zurück |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpunkte

Der gebündelte Provider `openai` kann für die Bildgenerierung eine Azure-OpenAI-Ressource ansprechen,
indem die Base-URL überschrieben wird. Auf dem Pfad für Bildgenerierung erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und wechselt automatisch zur
Anfrageform von Azure.

<Note>
Realtime-Voice verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Accordion **Realtime-
voice** unter [Stimme und Sprache](#voice-and-speech) für dessen Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure-OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie Datenverkehr innerhalb einer bestehenden Azure-Tenancy halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten Provider `openai` setzen Sie
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und `apiKey` auf
den Azure-OpenAI-Schlüssel (nicht auf einen Schlüssel der OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw erkennt diese Azure-Host-Suffixe für den Azure-Pfad der Bildgenerierung:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungsanfragen an einen erkannten Azure-Host führt OpenClaw Folgendes aus:

- Es sendet den Header `api-key` statt `Authorization: Bearer`
- Es verwendet deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- Es hängt `?api-version=...` an jede Anfrage an

Andere Base-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die Standard-
Anfrageform für OpenAI-Bilder bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des Providers `openai` erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpunkt und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungsanfragen,
die über den gebündelten Provider `openai` geleitet werden, muss das Feld `model` in OpenClaw
der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment mit dem Namen `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt auch für Bildgenerierungsaufrufe, die über
den gebündelten Provider `openai` geleitet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen verfügbar
(zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionenliste, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das konkrete Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die öffentliches OpenAI zulässt (zum Beispiel bestimmte
Werte für `background` bei `gpt-image-2`) oder diese nur in bestimmten Modell-
Versionen verfügbar machen. Diese Unterschiede kommen von Azure und dem zugrunde liegenden Modell, nicht
von OpenClaw. Wenn eine Azure-Anfrage mit einem Validierungsfehler fehlschlägt, prüfen Sie die
von Ihrem konkreten Deployment und Ihrer API-Version im
Azure-Portal unterstützte Parametermenge.

<Note>
Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht
die versteckten Attributions-Header von OpenClaw. Siehe das Accordion **Native vs OpenAI-compatible
routes** unter [Erweiterte Konfiguration](#advanced-configuration)
für Details.
</Note>

<Tip>
Für einen separaten Azure-OpenAI-Responses-Provider (getrennt vom Provider `openai`)
siehe die Modell-Referenzen `azure-openai-responses/*` im Accordion
[Server-side compaction](#server-side-compaction-responses-api).
</Tip>

<Note>
Azure-Chat- und Responses-Datenverkehr benötigt Azure-spezifische Provider-/API-Konfiguration zusätzlich zu einer Überschreibung der Base-URL. Wenn Sie Azure-Modellaufrufe über die Bildgenerierung hinaus möchten, verwenden Sie den Onboarding-Ablauf oder eine Provider-Konfiguration, die die passende Azure-API-/Authentifizierungsform setzt, statt anzunehmen, dass `openai.baseUrl` allein ausreicht.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet für `openai/*` und `openai-codex/*` zuerst WebSocket mit SSE-Fallback (`"auto"`).

    Im Modus `"auto"` gilt in OpenClaw:
    - Ein früher WebSocket-Fehler wird einmal erneut versucht, bevor auf SSE zurückgefallen wird
    - Nach einem Fehler markiert OpenClaw WebSocket für etwa 60 Sekunden als degradiert und verwendet während der Cool-down-Phase SSE
    - Für Wiederholungen und Reconnects werden stabile Header für Sitzungs- und Turn-Identität angehängt
    - Nutzungszähler (`input_tokens` / `prompt_tokens`) werden über Transportvarianten hinweg normalisiert

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
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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

<a id="openai-fast-mode"></a>

  <Accordion title="Schnellmodus">
    OpenClaw stellt einen gemeinsamen Schnellmodus-Schalter sowohl für `openai/*` als auch für `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, bildet OpenClaw den Schnellmodus auf OpenAI-Priority-Processing ab (`service_tier = "priority"`). Bestehende Werte für `service_tier` bleiben erhalten, und der Schnellmodus schreibt `reasoning` oder `text.verbosity` nicht um.

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
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sessions-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Priority Processing (service_tier)">
    OpenAIs API stellt Priority Processing über `service_tier` bereit. Setzen Sie es pro Modell in OpenClaw:

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

  <Accordion title="Server-side compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert OpenClaw automatisch Server-side Compaction:

    - Erzwingt `store: true` (es sei denn, die Modellkompatibilität setzt `supportsStore: false`)
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
    `responsesServerCompaction` steuert nur die Einfügung von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für GPT-5-Familien-Läufe auf `openai/*` und `openai-codex/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

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
    - Der Turn wird mit einer Aufforderung zum sofortigen Handeln erneut versucht
    - `update_plan` wird für umfangreiche Arbeit automatisch aktiviert
    - Ein expliziter blockierter Zustand wird angezeigt, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Gilt nur für OpenAI- und Codex-GPT-5-Familien-Läufe. Andere Provider und ältere Modellfamilien behalten das Standardverhalten.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpunkte anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle, die das OpenAI-`none`-Effort unterstützen
    - Lassen deaktiviertes Reasoning bei Modellen oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Setzen Tool-Schemas standardmäßig auf strikten Modus
    - Hängen versteckte Attributions-Header nur an verifizierten nativen Hosts an
    - Behalten ausschließlich für OpenAI geltende Anfrageformung (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine strikten Tool-Schemas oder nur-native Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht die versteckten Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
</CardGroup>
