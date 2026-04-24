---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden.
    - Sie benötigen ein einfaches Setup mit `ZAI_API_KEY`.
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T06:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie bietet REST-APIs für GLM und verwendet API-Keys
zur Authentifizierung. Erstellen Sie Ihren API-Key in der Z.AI-Konsole. OpenClaw verwendet den Provider `zai`
mit einem Z.AI-API-Key.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-Authentifizierung)

## Erste Schritte

<Tabs>
  <Tab title="Endpunkt automatisch erkennen">
    **Am besten für:** die meisten Benutzer. OpenClaw erkennt den passenden Z.AI-Endpunkt anhand des Schlüssels und wendet die korrekte Base URL automatisch an.

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
    **Am besten für:** Benutzer, die gezielt eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Die richtige Onboarding-Auswahl wählen">
        ```bash
        # Coding Plan Global (empfohlen für Benutzer des Coding Plan)
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

## Eingebauter Katalog

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit:

| Modellreferenz      | Hinweise        |
| ------------------- | --------------- |
| `zai/glm-5.1`       | Standardmodell  |
| `zai/glm-5`         |                 |
| `zai/glm-5-turbo`   |                 |
| `zai/glm-5v-turbo`  |                 |
| `zai/glm-4.7`       |                 |
| `zai/glm-4.7-flash` |                 |
| `zai/glm-4.7-flashx` |                |
| `zai/glm-4.6`       |                 |
| `zai/glm-4.6v`      |                 |
| `zai/glm-4.5`       |                 |
| `zai/glm-4.5-air`   |                 |
| `zai/glm-4.5-flash` |                 |
| `zai/glm-4.5v`      |                 |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`). Die standardmäßig gebündelte Modellreferenz ist `zai/glm-5.1`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Vorwärtsauflösung unbekannter GLM-5-Modelle">
    Unbekannte IDs `glm-5*` werden auf dem gebündelten Providerpfad weiterhin vorwärts aufgelöst, indem
    providereigene Metadaten aus dem Template `glm-4.7` synthetisiert werden, wenn die ID
    zur aktuellen Form der GLM-5-Familie passt.
  </Accordion>

  <Accordion title="Streaming von Tool-Aufrufen">
    `tool_stream` ist standardmäßig für das Streaming von Tool-Aufrufen bei Z.AI aktiviert. So deaktivieren Sie es:

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

    Bildverständnis wird automatisch aus der konfigurierten Z.AI-Authentifizierung aufgelöst — es
    ist keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Auth-Details">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Key.
    - Die Onboarding-Auswahl `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch anhand des Schlüsselpräfixes.
    - Verwenden Sie die expliziten regionalen Auswahlen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="GLM-Modellfamilie" href="/de/providers/glm" icon="microchip">
    Überblick über die Modellfamilie GLM.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
