---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen eine Einrichtungsanleitung für MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-12T23:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- Gebündelte Sprachsynthese über T2A v2
- Gebündeltes Bildverständnis über `MiniMax-VL-01`
- Gebündelte Musikgenerierung über `music-2.5+`
- Gebündeltes `web_search` über die MiniMax-Coding-Plan-Such-API

Provider-Aufteilung:

| Provider-ID     | Auth    | Fähigkeiten                                                     |
| --------------- | ------- | --------------------------------------------------------------- |
| `minimax`       | API-Schlüssel | Text, Bildgenerierung, Bildverständnis, Sprache, Websuche |
| `minimax-portal` | OAuth   | Text, Bildgenerierung, Bildverständnis                          |

## Modellübersicht

| Modell                   | Typ              | Beschreibung                             |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (Reasoning) | Standardmäßig gehostetes Reasoning-Modell |
| `MiniMax-M2.7-highspeed` | Chat (Reasoning) | Schnellere M2.7-Reasoning-Stufe          |
| `MiniMax-VL-01`          | Vision           | Modell für Bildverständnis               |
| `image-01`               | Bildgenerierung  | Text-zu-Bild und Bild-zu-Bild-Bearbeitung |
| `music-2.5+`             | Musikgenerierung | Standard-Musikmodell                     |
| `music-2.5`              | Musikgenerierung | Vorherige Stufe der Musikgenerierung     |
| `music-2.0`              | Musikgenerierung | Legacy-Stufe der Musikgenerierung        |
| `MiniMax-Hailuo-2.3`     | Videogenerierung | Text-zu-Video- und Bildreferenz-Abläufe  |

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Am besten geeignet für:** schnelle Einrichtung mit dem MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Dadurch wird die Authentifizierung gegen `api.minimax.io` durchgeführt.
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

            Dadurch wird die Authentifizierung gegen `api.minimaxi.com` durchgeführt.
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
    OAuth-Setups verwenden die Provider-ID `minimax-portal`. Modell-Refs folgen dem Format `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API-Schlüssel">
    **Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Onboarding ausführen">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Dadurch wird `api.minimax.io` als Base-URL konfiguriert.
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

            Dadurch wird `api.minimaxi.com` als Base-URL konfiguriert.
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
    Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking standardmäßig, sofern Sie `thinking` nicht selbst explizit setzen. Der Streaming-Endpunkt von MiniMax sendet `reasoning_content` in Delta-Chunks im OpenAI-Stil statt in nativen Anthropic-Thinking-Blöcken, wodurch internes Reasoning bei impliziter Aktivierung in sichtbare Ausgaben geraten kann.
    </Warning>

    <Note>
    Setups mit API-Schlüssel verwenden die Provider-ID `minimax`. Modell-Refs folgen dem Format `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax ohne Bearbeiten von JSON einzurichten:

<Steps>
  <Step title="Assistenten starten">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth auswählen">
    Wählen Sie im Menü **Model/auth**.
  </Step>
  <Step title="Eine MiniMax-Auth-Option wählen">
    Wählen Sie eine der verfügbaren MiniMax-Optionen:

    | Auth-Option | Beschreibung |
    | --- | --- |
    | `minimax-global-oauth` | Internationales OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth für China (Coding Plan) |
    | `minimax-global-api` | Internationaler API-Schlüssel |
    | `minimax-cn-api` | API-Schlüssel für China |

  </Step>
  <Step title="Ihr Standardmodell auswählen">
    Wählen Sie Ihr Standardmodell aus, wenn Sie dazu aufgefordert werden.
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

Um MiniMax für die Bildgenerierung zu verwenden, setzen Sie es als Provider für die Bildgenerierung:

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
Modell `image-01`. Setups mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Setups können
stattdessen den gebündelten Auth-Pfad `minimax-portal` verwenden.

Wenn Onboarding oder die API-Schlüssel-Einrichtung explizite Einträge unter `models.providers.minimax`
schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` mit `input: ["text", "image"]`.

Der integrierte gebündelte MiniMax-Textkatalog selbst bleibt Metadaten nur für Text,
bis diese explizite Provider-Konfiguration existiert. Bildverständnis wird separat
über den Plugin-eigenen Medien-Provider `MiniMax-VL-01` bereitgestellt.

<Note>
Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Musikgenerierung

Das gebündelte Plugin `minimax` registriert außerdem Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `minimax/music-2.5+`
- Unterstützt außerdem `minimax/music-2.5` und `minimax/music-2.0`
- Prompt-Steuerelemente: `lyrics`, `instrumental`, `durationSeconds`
- Ausgabeformat: `mp3`
- Sitzungsgebundene Läufe werden über den gemeinsamen Aufgaben-/Statusfluss abgetrennt, einschließlich `action: "status"`

Um MiniMax als Standardprovider für Musik zu verwenden:

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
Siehe [Musikgenerierung](/de/tools/music-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Videogenerierung

Das gebündelte Plugin `minimax` registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `minimax/MiniMax-Hailuo-2.3`
- Modi: Text-zu-Video und Abläufe mit einzelner Bildreferenz
- Unterstützt `aspectRatio` und `resolution`

Um MiniMax als Standardprovider für Video zu verwenden:

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
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

### Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

| Provider-ID     | Standard-Bildmodell |
| --------------- | ------------------- |
| `minimax`       | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`    |

Deshalb kann automatisches Medienrouting das MiniMax-Bildverständnis verwenden, selbst
wenn der gebündelte Text-Provider-Katalog weiterhin nur Text-Refs für M2.7-Chat zeigt.

### Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die Such-API des MiniMax Coding Plan.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Env-Variable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Env-Alias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn es bereits auf ein Coding-Plan-Token verweist
- Regionswiederverwendung: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Base-URLs
- Die Suche bleibt auf Provider-ID `minimax`; OAuth-CN-/globales Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration liegt unter `plugins.entries.minimax.config.webSearch.*`.

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
    | `models.providers.minimax.apiKey` | MiniMax-API-Schlüssel (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` definieren |
    | `agents.defaults.models` | Modellaliasse definieren, die Sie in der Allowlist haben möchten |
    | `models.mode` | `merge` beibehalten, wenn Sie MiniMax zusätzlich zu integrierten Providern hinzufügen möchten |
  </Accordion>

  <Accordion title="Thinking-Standardeinstellungen">
    Bei `api: "anthropic-messages"` fügt OpenClaw `thinking: { type: "disabled" }` ein, sofern Thinking nicht bereits explizit in Parametern/Konfiguration gesetzt ist.

    Dadurch wird verhindert, dass der Streaming-Endpunkt von MiniMax `reasoning_content` in Delta-Chunks im OpenAI-Stil ausgibt, was internes Reasoning in sichtbare Ausgaben leiten würde.

  </Accordion>

  <Accordion title="Fast-Modus">
    `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` auf dem Anthropic-kompatiblen Streaming-Pfad zu `MiniMax-M2.7-highspeed` um.
  </Accordion>

  <Accordion title="Failover-Beispiel">
    **Am besten geeignet für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell beibehalten und bei Bedarf auf MiniMax M2.7 zurückfallen. Das folgende Beispiel verwendet Opus als konkretes primäres Modell; ersetzen Sie es durch Ihr bevorzugtes primäres Modell der neuesten Generation.

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

  <Accordion title="Nutzungsdetails des Coding Plan">
    - Coding-Plan-Nutzungs-API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
    - OpenClaw normalisiert die MiniMax-Coding-Plan-Nutzung auf dieselbe Anzeige „% left“ wie bei anderen Providern. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax sind verbleibendes Kontingent, nicht verbrauchtes Kontingent, daher invertiert OpenClaw sie. Zählbasierte Felder haben Vorrang, wenn sie vorhanden sind.
    - Wenn die API `model_remains` zurückgibt, bevorzugt OpenClaw den Chat-Modelleintrag, leitet bei Bedarf die Fensterbezeichnung aus `start_time` / `end_time` ab und schließt den ausgewählten Modellnamen in die Planbezeichnung ein, damit Coding-Plan-Fenster leichter zu unterscheiden sind.
    - Nutzungs-Snapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax-OAuth, bevor auf Env-Variablen für Coding-Plan-Schlüssel zurückgegriffen wird.
  </Accordion>
</AccordionGroup>

## Hinweise

- Modell-Refs folgen dem Auth-Pfad:
  - API-Schlüssel-Setup: `minimax/<model>`
  - OAuth-Setup: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M2.7`
- Alternatives Chatmodell: `MiniMax-M2.7-highspeed`
- Onboarding und direkte API-Schlüssel-Einrichtung schreiben explizite Modelldefinitionen mit `input: ["text", "image"]` für beide M2.7-Varianten
- Der gebündelte Provider-Katalog stellt die Chat-Refs derzeit als Metadaten nur für Text bereit, bis eine explizite MiniMax-Provider-Konfiguration existiert
- Aktualisieren Sie die Preiswerte in `models.json`, wenn Sie eine genaue Kostenverfolgung benötigen
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit `openclaw models set minimax/MiniMax-M2.7` oder `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Empfehlungslink für den MiniMax Coding Plan (10 % Rabatt): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Siehe [Modell-Provider](/de/concepts/model-providers) für Provider-Regeln.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title='"Unbekanntes Modell: minimax/MiniMax-M2.7"'>
    Das bedeutet in der Regel, dass der **MiniMax-Provider nicht konfiguriert** ist (kein passender Providereintrag und kein MiniMax-Auth-Profil/Env-Schlüssel gefunden). Eine Korrektur für diese Erkennung ist in **2026.1.12** enthalten. Beheben Sie das Problem durch:

    - Upgrade auf **2026.1.12** (oder aus dem Quellcode `main` ausführen), dann das Gateway neu starten.
    - `openclaw configure` ausführen und eine **MiniMax**-Auth-Option auswählen, oder
    - den passenden Block `models.providers.minimax` oder `models.providers.minimax-portal` manuell hinzufügen, oder
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Auth-Profil setzen, damit der passende Provider eingefügt werden kann.

    Stellen Sie sicher, dass die Modell-ID **groß-/kleinschreibungssensitiv** ist:

    - API-Schlüssel-Pfad: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
    - OAuth-Pfad: `minimax-portal/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7-highspeed`

    Dann erneut prüfen mit:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bildtool-Parameter und Providerauswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Musiktool-Parameter und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Providerauswahl.
  </Card>
  <Card title="MiniMax Search" href="/de/tools/minimax-search" icon="magnifying-glass">
    Websuchkonfiguration über den MiniMax Coding Plan.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
