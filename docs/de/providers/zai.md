---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden.
    - Sie benötigen eine einfache Einrichtung von `ZAI_API_KEY`.
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: |-
    Z.AI】【：】【“】【analysis to=final code  omitted reasoning  天天中奖彩票ങ്ങി
    Z.AI
x-i18n:
    generated_at: "2026-04-12T23:33:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 972b467dab141c8c5126ac776b7cb6b21815c27da511b3f34e12bd9e9ac953b7
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und verwendet API-Schlüssel
zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole. OpenClaw verwendet den Provider `zai`
mit einem Z.AI-API-Schlüssel.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-Authentifizierung)

## Erste Schritte

<Tabs>
  <Tab title="Endpunkt automatisch erkennen">
    **Am besten geeignet für:** die meisten Benutzer. OpenClaw erkennt den passenden Z.AI-Endpunkt anhand des Schlüssels und setzt automatisch die richtige Base-URL.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliziter regionaler Endpunkt">
    **Am besten geeignet für:** Benutzer, die gezielt eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Die richtige Onboarding-Auswahl treffen">
        ```bash
        # Coding Plan Global (empfohlen für Coding-Plan-Benutzer)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China-Region)
        openclaw onboard --auth-choice zai-coding-cn

        # Allgemeine API
        openclaw onboard --auth-choice zai-global

        # Allgemeine API CN (China-Region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Gebündelter GLM-Katalog

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit:

| Modell-Ref          | Hinweise      |
| ------------------- | ------------- |
| `zai/glm-5.1`       | Standardmodell |
| `zai/glm-5`         |               |
| `zai/glm-5-turbo`   |               |
| `zai/glm-5v-turbo`  |               |
| `zai/glm-4.7`       |               |
| `zai/glm-4.7-flash` |               |
| `zai/glm-4.7-flashx` |              |
| `zai/glm-4.6`       |               |
| `zai/glm-4.6v`      |               |
| `zai/glm-4.5`       |               |
| `zai/glm-4.5-air`   |               |
| `zai/glm-4.5-flash` |               |
| `zai/glm-4.5v`      |               |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`). Die standardmäßig gebündelte Modell-Ref ist `zai/glm-5.1`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Vorwärtsauflösung unbekannter GLM-5-Modelle">
    Unbekannte `glm-5*`-IDs werden auf dem Pfad des gebündelten Providers weiterhin vorwärts aufgelöst, indem
    provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Streaming von Tool-Aufrufen">
    `tool_stream` ist standardmäßig für das Streaming von Tool-Aufrufen mit Z.AI aktiviert. Zum Deaktivieren:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bildverständnis">
    Das gebündelte Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft | Wert        |
    | ----------- | ----------- |
    | Modell      | `glm-4.6v`  |

    Bildverständnis wird automatisch anhand der konfigurierten Z.AI-Authentifizierung aufgelöst — es ist
    keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch am Schlüsselpräfix.
    - Verwenden Sie die expliziten regionalen Auswahlen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie gezielt eine bestimmte API-Oberfläche erzwingen möchten.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="GLM-Modellfamilie" href="/de/providers/glm" icon="microchip">
    Überblick über die GLM-Modellfamilie.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
</CardGroup>
