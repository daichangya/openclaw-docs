---
read_when:
    - Sie möchten OpenAI-Modelle in OpenClaw verwenden
    - Sie möchten Codex-Abonnement-Authentifizierung statt API-Keys verwenden
    - Sie benötigen strengeres Ausführungsverhalten für GPT-5-Agenten
summary: OpenAI über API-Keys oder Codex-Abonnement in OpenClaw verwenden
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T06:55:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI bietet Entwickler-APIs für GPT-Modelle. OpenClaw unterstützt drei Routen der OpenAI-Familie. Das Modellpräfix wählt die Route aus:

- **API-Key** — direkter Zugriff auf die OpenAI Platform mit nutzungsbasierter Abrechnung (`openai/*`-Modelle)
- **Codex-Abonnement über PI** — ChatGPT-/Codex-Anmeldung mit Abonnementzugriff (`openai-codex/*`-Modelle)
- **Codex-App-Server-Harness** — native Ausführung über den Codex-App-Server (`openai/*`-Modelle plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI unterstützt ausdrücklich die Nutzung von Abonnement-OAuth in externen Tools und Workflows wie OpenClaw.

<Note>
GPT-5.5 ist derzeit in OpenClaw über Abonnement-/OAuth-Routen verfügbar:
`openai-codex/gpt-5.5` mit dem PI-Runner oder `openai/gpt-5.5` mit dem
Codex-App-Server-Harness. Direkter Zugriff per API-Key für `openai/gpt-5.5` wird
unterstützt, sobald OpenAI GPT-5.5 in der öffentlichen API aktiviert; bis dahin verwenden Sie ein
API-fähiges Modell wie `openai/gpt-5.4` für Setups mit `OPENAI_API_KEY`.
</Note>

<Note>
Das Aktivieren des OpenAI-Plugins oder das Auswählen eines `openai-codex/*`-Modells aktiviert
nicht das gebündelte Codex-App-Server-Plugin. OpenClaw aktiviert dieses Plugin nur,
wenn Sie explizit das native Codex-Harness mit
`embeddedHarness.runtime: "codex"` auswählen oder eine veraltete Modellreferenz `codex/*` verwenden.
</Note>

## Funktionsabdeckung in OpenClaw

| OpenAI-Fähigkeit         | OpenClaw-Oberfläche                                      | Status                                                     |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------- |
| Chat / Responses         | Modell-Provider `openai/<model>`                         | Ja                                                         |
| Codex-Abonnementmodelle  | `openai-codex/<model>` mit `openai-codex` OAuth          | Ja                                                         |
| Codex-App-Server-Harness | `openai/<model>` mit `embeddedHarness.runtime: codex`    | Ja                                                         |
| Serverseitige Websuche   | Natives OpenAI-Responses-Tool                            | Ja, wenn Websuche aktiviert ist und kein Provider fixiert wurde |
| Bilder                   | `image_generate`                                         | Ja                                                         |
| Videos                   | `video_generate`                                         | Ja                                                         |
| Text-to-Speech           | `messages.tts.provider: "openai"` / `tts`                | Ja                                                         |
| Batch-Speech-to-Text     | `tools.media.audio` / Medienverständnis                  | Ja                                                         |
| Streaming-Speech-to-Text | Voice Call `streaming.provider: "openai"`                | Ja                                                         |
| Realtime-Sprache         | Voice Call `realtime.provider: "openai"` / Control UI Talk | Ja                                                       |
| Embeddings               | Memory-Embedding-Provider                                | Ja                                                         |

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="API-Key (OpenAI Platform)">
    **Am besten geeignet für:** direkten API-Zugriff und nutzungsbasierte Abrechnung.

    <Steps>
      <Step title="API-Key holen">
        Erstellen oder kopieren Sie einen API-Key aus dem [OpenAI-Platform-Dashboard](https://platform.openai.com/api-keys).
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

    ### Zusammenfassung der Route

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Direkte OpenAI-Platform-API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Zukünftige direkte API-Route, sobald OpenAI GPT-5.5 in der API aktiviert | `OPENAI_API_KEY` |

    <Note>
    `openai/*` ist die direkte OpenAI-API-Key-Route, sofern Sie nicht ausdrücklich
    das Codex-App-Server-Harness erzwingen. GPT-5.5 selbst ist derzeit nur über Abonnement/OAuth
    verfügbar; verwenden Sie `openai-codex/*` für Codex OAuth über den Standard-PI-Runner.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw stellt `openai/gpt-5.3-codex-spark` **nicht** bereit. Live-OpenAI-API-Requests lehnen dieses Modell ab, und auch der aktuelle Codex-Katalog stellt es nicht bereit.
    </Warning>

  </Tab>

  <Tab title="Codex-Abonnement">
    **Am besten geeignet für:** Nutzung Ihres ChatGPT-/Codex-Abonnements statt eines separaten API-Keys. Codex Cloud erfordert eine ChatGPT-Anmeldung.

    <Steps>
      <Step title="Codex OAuth ausführen">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oder OAuth direkt ausführen:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Für headless oder callback-feindliche Setups fügen Sie `--device-code` hinzu, um sich mit einem ChatGPT-Device-Code-Flow statt mit dem localhost-Browser-Callback anzumelden:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Das Standardmodell setzen">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Zusammenfassung der Route

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT-/Codex-OAuth über PI | Codex-Anmeldung |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness | Codex-App-Server-Auth |

    <Note>
    Verwenden Sie weiterhin die Provider-ID `openai-codex` für Auth-/Profilbefehle. Das
    Modellpräfix `openai-codex/*` ist auch die explizite PI-Route für Codex OAuth.
    Es wählt nicht das gebündelte Codex-App-Server-Harness aus und aktiviert es auch nicht automatisch.
    </Note>

    ### Konfigurationsbeispiel

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding importiert kein OAuth-Material mehr aus `~/.codex`. Melden Sie sich mit Browser-OAuth (Standard) oder dem oben beschriebenen Device-Code-Flow an — OpenClaw verwaltet die daraus resultierenden Credentials in seinem eigenen Auth-Store pro Agent.
    </Note>

    ### Statusindikator

    Chat `/status` zeigt an, welches eingebettete Harness für die aktuelle
    Sitzung aktiv ist. Das Standard-PI-Harness erscheint als `Runner: pi (embedded)` und
    fügt kein separates Badge hinzu. Wenn das gebündelte Codex-App-Server-Harness
    ausgewählt ist, hängt `/status` die Nicht-PI-Harness-ID an `Fast` an, zum Beispiel
    `Fast · codex`. Bestehende Sitzungen behalten ihre aufgezeichnete Harness-ID bei, daher verwenden Sie
    `/new` oder `/reset` nach dem Ändern von `embeddedHarness`, wenn `/status` eine neue PI-/Codex-Auswahl widerspiegeln soll.

    ### Obergrenze des Kontextfensters

    OpenClaw behandelt Modellmetadaten und die Runtime-Kontextobergrenze als getrennte Werte.

    Für `openai-codex/gpt-5.5` über Codex OAuth:

    - Natives `contextWindow`: `1000000`
    - Standardmäßige Runtime-Obergrenze `contextTokens`: `272000`

    Die kleinere Standardobergrenze hat in der Praxis bessere Latenz- und Qualitätsmerkmale. Überschreiben Sie sie mit `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Verwenden Sie `contextWindow`, um native Modellmetadaten zu deklarieren. Verwenden Sie `contextTokens`, um das Runtime-Kontextbudget zu begrenzen.
    </Note>

  </Tab>
</Tabs>

## Bilderzeugung

Das gebündelte Plugin `openai` registriert Bilderzeugung über das Tool `image_generate`.
Es unterstützt sowohl Bilderzeugung mit OpenAI-API-Key als auch Bilderzeugung mit Codex OAuth
über dieselbe Modellreferenz `openai/gpt-image-2`.

| Fähigkeit                | OpenAI-API-Key                     | Codex OAuth                           |
| ------------------------ | ---------------------------------- | ------------------------------------- |
| Modellreferenz           | `openai/gpt-image-2`               | `openai/gpt-image-2`                  |
| Auth                     | `OPENAI_API_KEY`                   | OpenAI-Codex-OAuth-Anmeldung          |
| Transport                | OpenAI Images API                  | Codex Responses Backend               |
| Max. Bilder pro Request  | 4                                  | 4                                     |
| Bearbeitungsmodus        | Aktiviert (bis zu 5 Referenzbilder) | Aktiviert (bis zu 5 Referenzbilder)  |
| Größenüberschreibungen   | Unterstützt, einschließlich 2K-/4K-Größen | Unterstützt, einschließlich 2K-/4K-Größen |
| Seitenverhältnis / Auflösung | Nicht an die OpenAI Images API weitergegeben | Wird bei sicherer Möglichkeit auf eine unterstützte Größe abgebildet |

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
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

`gpt-image-2` ist der Standard sowohl für OpenAI-Text-zu-Bild-Generierung als auch für Bild-
Bearbeitung. `gpt-image-1` bleibt als explizites Modell-Override nutzbar, aber neue
OpenAI-Bild-Workflows sollten `openai/gpt-image-2` verwenden.

Für Codex-OAuth-Installationen verwenden Sie dieselbe Referenz `openai/gpt-image-2`. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, löst OpenClaw das gespeicherte OAuth-
Access-Token auf und sendet Bild-Requests über das Codex-Responses-Backend. Es
versucht dafür nicht zuerst `OPENAI_API_KEY` und fällt für diesen
Request auch nicht stillschweigend auf einen API-Key zurück. Konfigurieren Sie `models.providers.openai` explizit mit einem API-Key,
einer benutzerdefinierten Basis-URL oder einem Azure-Endpoint, wenn Sie die direkte OpenAI-Images-API-
Route verwenden möchten.
Wenn sich dieser benutzerdefinierte Bild-Endpoint in einem vertrauenswürdigen LAN/auf einer privaten Adresse befindet, setzen Sie zusätzlich
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw hält
private/interne OpenAI-kompatible Bild-Endpoints blockiert, sofern dieses Opt-in nicht
vorhanden ist.

Generieren:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Bearbeiten:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Videoerzeugung

Das gebündelte Plugin `openai` registriert Videoerzeugung über das Tool `video_generate`.

| Fähigkeit        | Wert                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| Standardmodell   | `openai/sora-2`                                                                   |
| Modi             | Text-zu-Video, Bild-zu-Video, Bearbeitung eines einzelnen Videos                  |
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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## GPT-5-Prompt-Beitrag

OpenClaw fügt einen gemeinsamen GPT-5-Prompt-Beitrag für Läufe der GPT-5-Familie über Provider hinweg hinzu. Er wird anhand der Modell-ID angewendet, sodass `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` und andere kompatible GPT-5-Referenzen denselben Overlay erhalten. Ältere GPT-4.x-Modelle tun dies nicht.

Das gebündelte native Codex-Harness verwendet dasselbe GPT-5-Verhalten und denselben Heartbeat-Overlay über Developer-Anweisungen des Codex-App-Servers, sodass über `embeddedHarness.runtime: "codex"` erzwungene Sitzungen mit `openai/gpt-5.x` dasselbe Follow-through und dieselben proaktiven Heartbeat-Hinweise behalten, obwohl Codex den Rest des Harness-Prompts verwaltet.

Der GPT-5-Beitrag fügt einen markierten Verhaltensvertrag für Persona-Persistenz, Ausführungssicherheit, Tool-Disziplin, Ausgabestruktur, Abschlussprüfungen und Verifizierung hinzu. Kanalspezifisches Antwort- und Silent-Message-Verhalten bleibt im gemeinsamen OpenClaw-System-Prompt und in der Richtlinie für ausgehende Zustellung. Die GPT-5-Leitlinien sind für passende Modelle immer aktiviert. Die Ebene für einen freundlichen Interaktionsstil ist separat und konfigurierbar.

| Value                  | Effekt                                       |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (Standard) | Ebene für freundlichen Interaktionsstil aktivieren |
| `"on"`                 | Alias für `"friendly"`                       |
| `"off"`                | Nur die Ebene für freundlichen Stil deaktivieren |

<Tabs>
  <Tab title="Konfiguration">
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
Werte sind zur Laufzeit nicht case-sensitiv, daher deaktivieren sowohl `"Off"` als auch `"off"` die Ebene für den freundlichen Stil.
</Tip>

<Note>
Das veraltete `plugins.entries.openai.config.personality` wird weiterhin als Kompatibilitäts-Fallback gelesen, wenn die gemeinsame Einstellung `agents.defaults.promptOverlays.gpt5.personality` nicht gesetzt ist.
</Note>

## Sprache und Speech

<AccordionGroup>
  <Accordion title="Sprachsynthese (TTS)">
    Das gebündelte Plugin `openai` registriert Sprachsynthese für die Oberfläche `messages.tts`.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Stimme | `messages.tts.providers.openai.voice` | `coral` |
    | Geschwindigkeit | `messages.tts.providers.openai.speed` | (nicht gesetzt) |
    | Anweisungen | `messages.tts.providers.openai.instructions` | (nicht gesetzt, nur `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` für Sprachnotizen, `mp3` für Dateien |
    | API-Key | `messages.tts.providers.openai.apiKey` | Fällt zurück auf `OPENAI_API_KEY` |
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
    Setzen Sie `OPENAI_TTS_BASE_URL`, um die TTS-Basis-URL zu überschreiben, ohne den Chat-API-Endpoint zu beeinflussen.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-Text">
    Das gebündelte Plugin `openai` registriert Batch-Speech-to-Text über
    die gemeinsame Transkriptionsoberfläche für Medienverständnis von OpenClaw.

    - Standardmodell: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Eingabepfad: Multipart-Audio-Datei-Upload
    - Unterstützt überall dort in OpenClaw, wo eingehende Audio-Transkription
      `tools.media.audio` verwendet, einschließlich Discord-
      Voice-Channel-Segmenten und Audioanhängen von Kanälen

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

    Sprach- und Prompt-Hinweise werden an OpenAI weitergeleitet, wenn sie durch die
    gemeinsame Audio-Medienkonfiguration oder den Transkriptions-Request pro Aufruf bereitgestellt werden.

  </Accordion>

  <Accordion title="Realtime-Transkription">
    Das gebündelte Plugin `openai` registriert Realtime-Transkription für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Sprache | `...openai.language` | (nicht gesetzt) |
    | Prompt | `...openai.prompt` | (nicht gesetzt) |
    | Stilledauer | `...openai.silenceDurationMs` | `800` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | API-Key | `...openai.apiKey` | Fällt zurück auf `OPENAI_API_KEY` |

    <Note>
    Verwendet eine WebSocket-Verbindung zu `wss://api.openai.com/v1/realtime` mit G.711-u-law- (`g711_ulaw` / `audio/pcmu`) Audio. Dieser Streaming-Provider ist für den Realtime-Transkriptionspfad von Voice Call gedacht; Discord-Voice zeichnet derzeit kurze Segmente auf und verwendet stattdessen den Batch-Transkriptionspfad `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime-Sprache">
    Das gebündelte Plugin `openai` registriert Realtime-Sprache für das Voice-Call-Plugin.

    | Einstellung | Konfigurationspfad | Standard |
    |---------|------------|---------|
    | Modell | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Stimme | `...openai.voice` | `alloy` |
    | Temperatur | `...openai.temperature` | `0.8` |
    | VAD-Schwelle | `...openai.vadThreshold` | `0.5` |
    | Stilledauer | `...openai.silenceDurationMs` | `500` |
    | API-Key | `...openai.apiKey` | Fällt zurück auf `OPENAI_API_KEY` |

    <Note>
    Unterstützt Azure OpenAI über die Konfigurationsschlüssel `azureEndpoint` und `azureDeployment`. Unterstützt bidirektionales Tool-Calling. Verwendet das Audioformat G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure-OpenAI-Endpoints

Der gebündelte Provider `openai` kann für Bild-
Generierung auf eine Azure-OpenAI-Ressource zielen, indem die Basis-URL überschrieben wird. Auf dem Pfad der Bildgenerierung erkennt OpenClaw
Azure-Hostnamen in `models.providers.openai.baseUrl` und schaltet
automatisch auf die Request-Form von Azure um.

<Note>
Realtime-Sprache verwendet einen separaten Konfigurationspfad
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
und wird nicht von `models.providers.openai.baseUrl` beeinflusst. Siehe das Akkordeon **Realtime
voice** unter [Voice and speech](#voice-and-speech) für dessen Azure-
Einstellungen.
</Note>

Verwenden Sie Azure OpenAI, wenn:

- Sie bereits ein Azure-OpenAI-Abonnement, Kontingent oder Enterprise Agreement haben
- Sie regionale Datenresidenz oder Compliance-Kontrollen benötigen, die Azure bereitstellt
- Sie den Datenverkehr innerhalb eines bestehenden Azure-Tenants halten möchten

### Konfiguration

Für Azure-Bildgenerierung über den gebündelten Provider `openai` zeigen Sie mit
`models.providers.openai.baseUrl` auf Ihre Azure-Ressource und setzen `apiKey` auf
den Azure-OpenAI-Key (nicht auf einen OpenAI-Platform-Key):

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

OpenClaw erkennt diese Azure-Host-Suffixe für die Azure-Bildgenerierungs-
Route:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Für Bildgenerierungs-Requests auf einem erkannten Azure-Host sendet OpenClaw:

- den Header `api-key` statt `Authorization: Bearer`
- deploymentbezogene Pfade (`/openai/deployments/{deployment}/...`)
- `?api-version=...` an jeden Request angehängt

Andere Basis-URLs (öffentliches OpenAI, OpenAI-kompatible Proxys) behalten die standardmäßige
OpenAI-Request-Form für Bilder bei.

<Note>
Azure-Routing für den Bildgenerierungspfad des Providers `openai` erfordert
OpenClaw 2026.4.22 oder neuer. Frühere Versionen behandeln jede benutzerdefinierte
`openai.baseUrl` wie den öffentlichen OpenAI-Endpoint und schlagen bei Azure-
Bild-Deployments fehl.
</Note>

### API-Version

Setzen Sie `AZURE_OPENAI_API_VERSION`, um eine bestimmte Azure-Preview- oder GA-Version
für den Azure-Bildgenerierungspfad festzulegen:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Der Standard ist `2024-12-01-preview`, wenn die Variable nicht gesetzt ist.

### Modellnamen sind Deployment-Namen

Azure OpenAI bindet Modelle an Deployments. Für Azure-Bildgenerierungs-Requests,
die über den gebündelten Provider `openai` geroutet werden, muss das Feld `model` in OpenClaw der **Azure-Deployment-Name** sein, den Sie im Azure-Portal konfiguriert haben, nicht
die öffentliche OpenAI-Modell-ID.

Wenn Sie ein Deployment namens `gpt-image-2-prod` erstellen, das `gpt-image-2` bereitstellt:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Dieselbe Regel für Deployment-Namen gilt für Bildgenerierungsaufrufe, die über
den gebündelten Provider `openai` geroutet werden.

### Regionale Verfügbarkeit

Azure-Bildgenerierung ist derzeit nur in einer Teilmenge von Regionen
verfügbar (zum Beispiel `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Prüfen Sie Microsofts aktuelle Regionenliste, bevor Sie ein
Deployment erstellen, und bestätigen Sie, dass das konkrete Modell in Ihrer Region angeboten wird.

### Parameterunterschiede

Azure OpenAI und öffentliches OpenAI akzeptieren nicht immer dieselben Bildparameter.
Azure kann Optionen ablehnen, die das öffentliche OpenAI zulässt (zum Beispiel bestimmte
`background`-Werte bei `gpt-image-2`) oder sie nur auf bestimmten Modellversionen bereitstellen. Diese Unterschiede stammen von Azure und dem zugrunde liegenden Modell, nicht von
OpenClaw. Wenn ein Azure-Request mit einem Validierungsfehler fehlschlägt, prüfen Sie den
von Ihrem konkreten Deployment und Ihrer API-Version unterstützten Parametersatz im
Azure-Portal.

<Note>
Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält jedoch
nicht die verborgenen Attributions-Header von OpenClaw — siehe das Akkordeon **Native vs OpenAI-compatible
routes** unter [Erweiterte Konfiguration](#advanced-configuration).

Für Chat- oder Responses-Datenverkehr auf Azure (jenseits der Bildgenerierung) verwenden Sie den
Onboarding-Flow oder eine dedizierte Azure-Provider-Konfiguration — `openai.baseUrl` allein
übernimmt nicht automatisch die Azure-API-/Auth-Form. Es existiert ein separater
Provider `azure-openai-responses/*`; siehe
das Akkordeon zur serverseitigen Compaction unten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw verwendet standardmäßig zuerst WebSocket mit SSE-Fallback (`"auto"`) sowohl für `openai/*` als auch für `openai-codex/*`.

    Im Modus `"auto"` gilt in OpenClaw:
    - Ein früher WebSocket-Fehler wird einmal erneut versucht, bevor auf SSE zurückgefallen wird
    - Nach einem Fehler wird WebSocket für ca. 60 Sekunden als degradiert markiert und während der Cool-down-Zeit wird SSE verwendet
    - Stabile Sitzungs- und Turn-Identitäts-Header werden für Wiederholungen und Reconnects angehängt
    - Nutzungszähler (`input_tokens` / `prompt_tokens`) werden über Transportvarianten hinweg normalisiert

    | Value | Verhalten |
    |-------|----------|
    | `"auto"` (Standard) | WebSocket zuerst, SSE-Fallback |
    | `"sse"` | Nur SSE erzwingen |
    | `"websocket"` | Nur WebSocket erzwingen |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Verwandte OpenAI-Dokumentation:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket-Warm-up">
    OpenClaw aktiviert WebSocket-Warm-up standardmäßig für `openai/*` und `openai-codex/*`, um die Latenz des ersten Turns zu verringern.

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

  <Accordion title="Fast-Modus">
    OpenClaw stellt einen gemeinsamen Fast-Modus-Schalter für `openai/*` und `openai-codex/*` bereit:

    - **Chat/UI:** `/fast status|on|off`
    - **Konfiguration:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Wenn aktiviert, bildet OpenClaw den Fast-Modus auf OpenAI-Priority-Processing (`service_tier = "priority"`) ab. Bestehende Werte für `service_tier` bleiben erhalten, und der Fast-Modus schreibt `reasoning` oder `text.verbosity` nicht um.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sitzungsüberschreibungen haben Vorrang vor der Konfiguration. Wenn Sie die Sitzungsüberschreibung in der Sessions-UI löschen, kehrt die Sitzung zum konfigurierten Standard zurück.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    Die API von OpenAI stellt Priority Processing über `service_tier` bereit. Setzen Sie es pro Modell in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Unterstützte Werte: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` wird nur an native OpenAI-Endpoints (`api.openai.com`) und native Codex-Endpoints (`chatgpt.com/backend-api`) weitergereicht. Wenn Sie einen der beiden Provider über einen Proxy routen, lässt OpenClaw `service_tier` unberührt.
    </Warning>

  </Accordion>

  <Accordion title="Serverseitige Compaction (Responses API)">
    Für direkte OpenAI-Responses-Modelle (`openai/*` auf `api.openai.com`) aktiviert der Pi-Harness-Stream-Wrapper des OpenAI-Plugins serverseitige Compaction automatisch:

    - Erzwingt `store: true` (sofern die Modell-Kompatibilität nicht `supportsStore: false` setzt)
    - Injiziert `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Standardwert für `compact_threshold`: 70 % von `contextWindow` (oder `80000`, wenn nicht verfügbar)

    Dies gilt für den integrierten Pi-Harness-Pfad sowie für OpenAI-Provider-Hooks, die von eingebetteten Runs verwendet werden. Das native Codex-App-Server-Harness verwaltet seinen eigenen Kontext über Codex und wird separat mit `agents.defaults.embeddedHarness.runtime` konfiguriert.

    <Tabs>
      <Tab title="Explizit aktivieren">
        Nützlich für kompatible Endpoints wie Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    `responsesServerCompaction` steuert nur die Injektion von `context_management`. Direkte OpenAI-Responses-Modelle erzwingen weiterhin `store: true`, sofern die Kompatibilität nicht `supportsStore: false` setzt.
    </Note>

  </Accordion>

  <Accordion title="Strikter agentischer GPT-Modus">
    Für Läufe der GPT-5-Familie auf `openai/*` kann OpenClaw einen strengeren eingebetteten Ausführungsvertrag verwenden:

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
    - Ein reiner Planungs-Turn wird nicht mehr als erfolgreicher Fortschritt behandelt, wenn eine Tool-Aktion verfügbar ist
    - Der Turn wird mit einem „act-now“-Steer erneut versucht
    - `update_plan` wird für umfangreiche Arbeit automatisch aktiviert
    - Ein expliziter blockierter Zustand wird sichtbar gemacht, wenn das Modell weiter plant, ohne zu handeln

    <Note>
    Nur auf OpenAI- und Codex-GPT-5-Familienläufe begrenzt. Andere Provider und ältere Modellfamilien behalten das Standardverhalten bei.
    </Note>

  </Accordion>

  <Accordion title="Native vs. OpenAI-kompatible Routen">
    OpenClaw behandelt direkte OpenAI-, Codex- und Azure-OpenAI-Endpoints anders als generische OpenAI-kompatible `/v1`-Proxys:

    **Native Routen** (`openai/*`, Azure OpenAI):
    - Behalten `reasoning: { effort: "none" }` nur für Modelle bei, die den OpenAI-Wert `none` für Effort unterstützen
    - Lassen deaktiviertes Reasoning für Modelle oder Proxys weg, die `reasoning.effort: "none"` ablehnen
    - Stellen Tool-Schemas standardmäßig auf Strict-Modus
    - Hängen verborgene Attributions-Header nur auf verifizierten nativen Hosts an
    - Behalten OpenAI-exklusive Request-Formung bei (`service_tier`, `store`, Reasoning-Kompatibilität, Prompt-Cache-Hinweise)

    **Proxy-/kompatible Routen:**
    - Verwenden lockereres Kompatibilitätsverhalten
    - Erzwingen keine strikten Tool-Schemas oder nativen Header

    Azure OpenAI verwendet natives Transport- und Kompatibilitätsverhalten, erhält aber nicht die verborgenen Attributions-Header.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bilderzeugung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videoerzeugung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Credentials.
  </Card>
</CardGroup>
