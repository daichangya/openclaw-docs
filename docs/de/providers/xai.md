---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: xAI-Grok-Modelle in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw enthält ein gebündeltes Provider-Plugin `xai` für Grok-Modelle.

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel in der [xAI-Konsole](https://console.x.ai/).
  </Step>
  <Step title="Ihren API-Schlüssel setzen">
    Setzen Sie `XAI_API_KEY` oder führen Sie Folgendes aus:

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
und entferntes `code_execution` versorgen.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey`
speichern, verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel ebenfalls als Fallback.
Die Feinabstimmung für `code_execution` liegt unter `plugins.entries.xai.config.codeExecution`.
</Note>

## Gebündelter Modellkatalog

OpenClaw enthält sofort einsatzbereit diese xAI-Modellfamilien:

| Familie         | Modell-IDs                                                               |
| --------------- | ------------------------------------------------------------------------ |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4          | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code       | `grok-code-fast-1`                                                       |

Das Plugin löst außerdem neuere IDs `grok-4*` und `grok-code-fast*` vorwärts auf, wenn
sie derselben API-Form folgen.

<Tip>
`grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*` sind die
aktuellen bildfähigen Grok-Refs im gebündelten Katalog.
</Tip>

### Fast-Mode-Zuordnungen

`/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
schreibt native xAI-Anfragen wie folgt um:

| Quellmodell   | Fast-Mode-Ziel    |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### Legacy-Kompatibilitätsaliasse

Legacy-Aliasse werden weiterhin auf die kanonischen gebündelten IDs normalisiert:

| Legacy-Alias             | Kanonische ID                          |
| ------------------------ | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

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
    - Modi: Text-zu-Video, Bild-zu-Video und entfernte Video-Bearbeitungs-/Erweiterungsabläufe
    - Unterstützt `aspectRatio` und `resolution`

    <Warning>
    Lokale Videopuffer werden nicht akzeptiert. Verwenden Sie entfernte `http(s)`-URLs für
    Video-Referenz- und Bearbeitungseingaben.
    </Warning>

    Um xAI als Standardprovider für Video zu verwenden:

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
    Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter,
    Providerauswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="x_search-Konfiguration">
    Das gebündelte xAI-Plugin stellt `x_search` als OpenClaw-Tool für die Suche
    in X-Inhalten (früher Twitter) über Grok bereit.

    Konfigurationspfad: `plugins.entries.xai.config.xSearch`

    | Schlüssel         | Typ     | Standard         | Beschreibung                        |
    | ----------------- | ------- | ---------------- | ----------------------------------- |
    | `enabled`         | boolean | —                | `x_search` aktivieren oder deaktivieren |
    | `model`           | string  | `grok-4-1-fast`  | Für `x_search`-Anfragen verwendetes Modell |
    | `inlineCitations` | boolean | —                | Inline-Zitate in Ergebnisse aufnehmen |
    | `maxTurns`        | number  | —                | Maximale Anzahl an Konversations-Turns |
    | `timeoutSeconds`  | number  | —                | Anfrage-Timeout in Sekunden         |
    | `cacheTtlMinutes` | number  | —                | Cache-Time-to-Live in Minuten       |

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

  <Accordion title="Konfiguration für Codeausführung">
    Das gebündelte xAI-Plugin stellt `code_execution` als OpenClaw-Tool für
    entfernte Codeausführung in der Sandbox-Umgebung von xAI bereit.

    Konfigurationspfad: `plugins.entries.xai.config.codeExecution`

    | Schlüssel        | Typ     | Standard                   | Beschreibung                              |
    | ---------------- | ------- | -------------------------- | ----------------------------------------- |
    | `enabled`        | boolean | `true` (wenn Schlüssel verfügbar) | Codeausführung aktivieren oder deaktivieren |
    | `model`          | string  | `grok-4-1-fast`           | Für Codeausführungsanfragen verwendetes Modell |
    | `maxTurns`       | number  | —                         | Maximale Anzahl an Konversations-Turns    |
    | `timeoutSeconds` | number  | —                         | Anfrage-Timeout in Sekunden               |

    <Note>
    Dies ist entfernte xAI-Sandbox-Ausführung, nicht lokales [`exec`](/de/tools/exec).
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

  <Accordion title="Bekannte Einschränkungen">
    - Auth ist derzeit nur per API-Schlüssel verfügbar. Es gibt in OpenClaw noch keinen xAI-OAuth- oder Device-Code-Ablauf.
    - `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem normalen xAI-Provider-Pfad nicht unterstützt,
      weil es eine andere Upstream-API-Oberfläche als der standardmäßige xAI-Transport von OpenClaw erfordert.
  </Accordion>

  <Accordion title="Erweiterte Hinweise">
    - OpenClaw wendet xAI-spezifische Tool-Schema- und Tool-Call-Kompatibilitätskorrekturen
      automatisch auf dem gemeinsamen Runner-Pfad an.
    - Native xAI-Anfragen verwenden standardmäßig `tool_stream: true`. Setzen Sie
      `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
      dies zu deaktivieren.
    - Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
      Reasoning-Payload-Schlüssel, bevor native xAI-Anfragen gesendet werden.
    - `web_search`, `x_search` und `code_execution` werden als OpenClaw-Tools
      bereitgestellt. OpenClaw aktiviert das jeweils benötigte xAI-Built-in innerhalb jeder Tool-
      Anfrage, anstatt alle nativen Tools an jeden Chat-Turn anzuhängen.
    - `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin, statt
      fest in die Kern-Modelllaufzeit kodiert zu sein.
    - `code_execution` ist entfernte xAI-Sandbox-Ausführung, nicht lokales
      [`exec`](/de/tools/exec).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Videotool-Parameter und Providerauswahl.
  </Card>
  <Card title="Alle Provider" href="/de/providers/index" icon="grid-2">
    Der umfassendere Provider-Überblick.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Korrekturen.
  </Card>
</CardGroup>
