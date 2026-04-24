---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T06:54:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverständnis über `MiniMax-VL-01`
- Gebündelte Musikgenerierung über `music-2.5+`
- Gebündeltes `web_search` über die Such-API von MiniMax Coding Plan

Aufteilung der Provider:

| Provider-ID      | Auth    | Fähigkeiten                                                    |
| ---------------- | ------- | -------------------------------------------------------------- |
| `minimax`        | API key | Text, Bildgenerierung, Bildverständnis, Sprache, Websuche      |
| `minimax-portal` | OAuth   | Text, Bildgenerierung, Bildverständnis                         |

## Integrierter Katalog

| Modell                   | Typ               | Beschreibung                               |
| ------------------------ | ----------------- | ------------------------------------------ |
| `MiniMax-M2.7`           | Chat (reasoning)  | Standardmäßig gehostetes Reasoning-Modell  |
| `MiniMax-M2.7-highspeed` | Chat (reasoning)  | Schnellere Reasoning-Stufe für M2.7        |
| `MiniMax-VL-01`          | Vision            | Modell für Bildverständnis                 |
| `image-01`               | Bildgenerierung   | Text-zu-Bild und Bearbeitung Bild-zu-Bild  |
| `music-2.5+`             | Musikgenerierung  | Standard-Musikmodell                       |
| `music-2.5`              | Musikgenerierung  | Vorherige Stufe der Musikgenerierung       |
| `music-2.0`              | Musikgenerierung  | Veraltete Stufe der Musikgenerierung       |
| `MiniMax-Hailuo-2.3`     | Video-Generierung | Text-zu-Video und Bildreferenz-Abläufe     |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten für:** schnelle Einrichtung mit MiniMax Coding Plan über OAuth, kein API key erforderlich.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dies authentifiziert gegen `api.minimax.io`.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Dies authentifiziert gegen `api.minimaxi.com`.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth-Setups verwenden die Provider-ID `minimax-portal`. Modell-Refs folgen der Form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral-Link für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Am besten für:** gehostetes MiniMax mit Anthropic-kompatibler API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dies konfiguriert `api.minimax.io` als Base-URL.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Dies konfiguriert `api.minimaxi.com` als Base-URL.
          </Step>
          <Step title="Prüfen, ob das Modell verfügbar ist">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, sofern Sie `thinking` nicht selbst explizit setzen. Der Streaming-Endpunkt von MiniMax sendet `reasoning_content` in OpenAI-artigen Delta-Chunks statt in nativen Anthropic-Thinking-Blöcken, wodurch internes Reasoning in die sichtbare Ausgabe gelangen kann, wenn es implizit aktiviert bleibt.
    </Warning>

    <Note>
    API-key-Setups verwenden die Provider-ID `minimax`. Modell-Refs folgen der Form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Konfiguration über `openclaw configure`

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne Bearbeitung von JSON einzurichten:

<Steps>
  <Step title="Den Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth auswählen">
    Wählen Sie im Menü **Model/auth**.
  </Step>
  <Step title="Eine MiniMax-Auth-Option auswählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen:

    | Auth-Auswahl | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China-OAuth (Coding Plan) |
    | `minimax-global-api` | Internationaler API key |
    | `minimax-cn-api` | China-API key |

  </Step>
  <Step title="Ihr Standardmodell auswählen">
    Wählen Sie Ihr Standardmodell, wenn Sie dazu aufgefordert werden.
  </Step>
</Steps>

## Fähigkeiten

### Bildgenerierung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses
- **Bild-zu-Bild-Bearbeitung** (Subjektreferenz) mit Steuerung des Seitenverhältnisses
- Bis zu **9 Ausgabebilder** pro Anfrage
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Um MiniMax für die Bildgenerierung zu verwenden, setzen Sie es als Provider für Bildgenerierung:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Das Plugin verwendet dieselbe `MINIMAX_API_KEY`- oder OAuth-Authentifizierung wie die Textmodelle. Es ist keine zusätzliche Konfiguration erforderlich, wenn MiniMax bereits eingerichtet ist.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. Setups mit API key verwenden `MINIMAX_API_KEY`; OAuth-Setups können
stattdessen den gebündelten Auth-Pfad `minimax-portal` verwenden.

Wenn Onboarding oder die Einrichtung mit API key explizite `models.providers.minimax`-
Einträge schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` mit `input: ["text", "image"]`.

Der integrierte gebündelte MiniMax-Textkatalog selbst bleibt text-only-Metadaten, bis diese explizite Provider-Konfiguration existiert. Bildverständnis wird separat über den plugin-eigenen Media-Provider `MiniMax-VL-01` bereitgestellt.

<Note>
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Musikgenerierung

Das gebündelte Plugin `minimax` registriert Musikgenerierung außerdem über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `minimax/music-2.5+`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerungen: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsgebundene Ausführungen werden über den gemeinsamen Aufgaben-/Statusfluss losgelöst, einschließlich `action: "status"`

Um MiniMax als Standard-Provider für Musik zu verwenden:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Siehe [Music Generation](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Video-Generierung

Das gebündelte Plugin `minimax` registriert Video-Generierung außerdem über das gemeinsame
Tool `video_generate`.

- Standard-Video-Modell: `minimax/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Abläufe mit einer einzelnen Bildreferenz
- Unterstützt `aspectRatio` und `resolution`

Um MiniMax als Standard-Provider für Video zu verwenden:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Text-
Katalog:

| Provider-ID      | Standard-Bildmodell |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Deshalb kann automatisches Media-Routing Bildverständnis von MiniMax verwenden,
selbst wenn der gebündelte Text-Provider-Katalog weiterhin nur text-only-M2.7-Chat-Refs anzeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API von MiniMax Coding Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Env-Variable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Env-Alias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn er bereits auf ein Coding-Plan-Token zeigt
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann Base-URLs des MiniMax-Providers
- Die Suche bleibt auf Provider-ID `minimax`; OAuth-CN-/Global-Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.

<Note>
Siehe [MiniMax Search](/de/tools/minimax-search) für die vollständige Konfiguration und Verwendung der Websuche.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen">
    | Option | Beschreibung |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Bevorzugen Sie `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.api` | Bevorzugen Sie `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Payloads |
    | `models.providers.minimax.apiKey` | MiniMax-API key (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` definieren |
    | `agents.defaults.models` | Modelle, die Sie in der Allowlist möchten, aliasieren |
    | `models.mode` | Behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu integrierten Providern hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standards">
    Bei `api: "anthropic-messages"` injiziert OpenClaw `thinking: { type: "disabled" }`, sofern Thinking nicht bereits explizit in Params/Konfiguration gesetzt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von MiniMax `reasoning_content` in Delta-Chunks im Stil von OpenAI ausgibt, was internes Reasoning in sichtbare Ausgaben leaken würde.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Stream-Pfad in `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Fallback-Beispiel">
    **Am besten für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell beibehalten und bei Bedarf auf MiniMax M2.7 zurückfallen. Das folgende Beispiel verwendet Opus als konkretes Primärmodell; tauschen Sie es gegen Ihr bevorzugtes Primärmodell der neuesten Generation aus.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Nutzungsdetails zum Coding Plan">
    - Usage-API für Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - OpenClaw normalisiert die Usage des MiniMax Coding Plan auf dieselbe Anzeige `% left`, die auch von anderen Providern verwendet wird. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax stehen für verbleibende Quote, nicht für verbrauchte Quote, daher invertiert OpenClaw sie. Zählbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des Chat-Modells, leitet bei Bedarf das Fenstertitel aus `start_time` / `end_time` ab und schließt den Namen des ausgewählten Modells in das Plan-Label ein, damit Coding-Plan-Fenster leichter unterschieden werden können.
    - Usage-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Quota-Oberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor sie auf Env-Variablen mit Coding-Plan-Schlüsseln zurückfallen.
  </Accordion>
</AccordionGroup>

## Hinweise

- Modell-Refs folgen dem Auth-Pfad:
  - Setup mit API key: `minimax/<model>`
  - Setup mit OAuth: `minimax-portal/<model>`
- Standard-Chat-Modell: `MiniMax-M2.7`
- Alternatives Chat-Modell: `MiniMax-M2.7-highspeed`
- Onboarding und direkte Einrichtung mit API key schreiben explizite Modelldefinitionen mit `input: ["text", "image"]` für beide M2.7-Varianten
- Der gebündelte Provider-Katalog stellt die Chat-Refs derzeit als text-only-Metadaten bereit, bis explizite MiniMax-Provider-Konfiguration existiert
- Aktualisieren Sie Preiswerte in `models.json`, wenn Sie exakte Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Referral-Link für MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Model providers](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M2.7"'>
    Das bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert** ist (kein passender Provider-Eintrag und kein MiniMax-Auth-Profil/Env-Schlüssel gefunden). Eine Korrektur für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie das durch:

    - Upgrade auf **2026.1.12** (oder aus `main` des Quellcodes ausführen) und anschließend das Gateway neu starten.
    - `openclaw configure` ausführen und eine **MiniMax**-Auth-Option auswählen, oder
    - Den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzufügen, oder
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Auth-Profil setzen, damit der passende Provider injiziert werden kann.

    Stellen Sie sicher, dass die Modell-ID **groß-/kleinschreibungssensitiv** ist:

    - Pfad mit API key: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - Pfad mit OAuth: `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Prüfen Sie dann erneut mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Troubleshooting](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter für Musik-Tools und Provider-Auswahl.
  </Card>
  <Card title="Video-Generierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="MiniMax Search" href="/de/tools/minimax-search" icon="magnifying-glass">
    Konfiguration der Websuche über MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
