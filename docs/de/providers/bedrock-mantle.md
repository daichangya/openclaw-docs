---
read_when:
    - Sie möchten mit Bedrock Mantle gehostete OSS-models mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon Bedrock Mantle (OpenAI-kompatible) models mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T14:04:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a20e0abcd140b3c7115a9b0bbdf924e15962e0452ded676df252c753610e03ed
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw enthält einen gebündelten Provider **Amazon Bedrock Mantle**, der sich mit
dem OpenAI-kompatiblen Mantle-Endpunkt verbindet. Mantle hostet Open-Source- und
Drittanbieter-models (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardmäßige
`/v1/chat/completions`-Oberfläche auf Bedrock-Infrastruktur.

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-kompatibel) oder `anthropic-messages` (Anthropic-Messages-Route) |
| Auth           | Explizites `AWS_BEARER_TOKEN_BEDROCK` oder Bearer-Token-Generierung über die IAM-Credential-Chain |
| Default region | `us-east-1` (überschreiben mit `AWS_REGION` oder `AWS_DEFAULT_REGION`)                      |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und befolgen Sie die Einrichtungsschritte.

<Tabs>
  <Tab title="Explizites Bearer-Token">
    **Am besten geeignet für:** Umgebungen, in denen Sie bereits ein Mantle-Bearer-Token haben.

    <Steps>
      <Step title="Bearer-Token auf dem Gateway-Host setzen">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Optional eine Region setzen (Standard ist `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Prüfen, ob models erkannt werden">
        ```bash
        openclaw models list
        ```

        Erkannte models erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist
        keine zusätzliche Konfiguration erforderlich, außer Sie möchten Standardwerte überschreiben.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-Anmeldedaten">
    **Am besten geeignet für:** die Verwendung von AWS-SDK-kompatiblen Anmeldedaten (gemeinsam genutzte Konfiguration, SSO, Web Identity, Instance- oder Task-Rollen).

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host konfigurieren">
        Jede AWS-SDK-kompatible Authentifizierungsquelle funktioniert:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Prüfen, ob models erkannt werden">
        ```bash
        openclaw models list
        ```

        OpenClaw generiert automatisch ein Mantle-Bearer-Token aus der Credential-Chain.
      </Step>
    </Steps>

    <Tip>
    Wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist, erzeugt OpenClaw das Bearer-Token für Sie aus der AWS-Standard-Credential-Chain, einschließlich gemeinsam genutzter Credentials-/Config-Profile, SSO, Web Identity sowie Instance- oder Task-Rollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische Model-Erkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls
versucht OpenClaw, ein Mantle-Bearer-Token aus der AWS-Standard-
Credential-Chain zu generieren. Anschließend erkennt es verfügbare Mantle-models durch Abfrage des
`/v1/models`-Endpunkts der Region.

| Behavior          | Detail                        |
| ----------------- | ----------------------------- |
| Discovery cache   | Ergebnisse werden 1 Stunde lang zwischengespeichert |
| IAM token refresh | Stündlich                     |

<Note>
Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das vom Standard-Provider [Amazon Bedrock](/de/providers/bedrock) verwendet wird.
</Note>

### Unterstützte Regionen

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Manuelle Konfiguration

Wenn Sie statt der automatischen Erkennung eine explizite Konfiguration bevorzugen:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Reasoning-Unterstützung">
    Die Reasoning-Unterstützung wird aus Modell-IDs abgeleitet, die Muster wie
    `thinking`, `reasoner` oder `gpt-oss-120b` enthalten. OpenClaw setzt `reasoning: true`
    bei der Erkennung automatisch für passende models.
  </Accordion>

  <Accordion title="Nichtverfügbarkeit des Endpunkts">
    Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine models zurückgibt, wird der Provider
    stillschweigend übersprungen. OpenClaw gibt keinen Fehler aus; andere konfigurierte Provider
    funktionieren weiterhin normal.
  </Accordion>

  <Accordion title="Claude Opus 4.7 über die Anthropic-Messages-Route">
    Mantle stellt außerdem eine Anthropic-Messages-Route bereit, die Claude-models über denselben bearer-authentifizierten Streaming-Pfad überträgt. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kann über diese Route mit Provider-eigenem Streaming aufgerufen werden, sodass AWS-Bearer-Tokens nicht wie Anthropic-API-Keys behandelt werden.

    Wenn Sie ein Anthropic-Messages-Modell auf dem Mantle-Provider anheften, verwendet OpenClaw für dieses Modell die API-Oberfläche `anthropic-messages` statt `openai-completions`. Die Authentifizierung kommt weiterhin von `AWS_BEARER_TOKEN_BEDROCK` (oder dem erzeugten IAM-Bearer-Token).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Beziehung zum Amazon-Bedrock-Provider">
    Bedrock Mantle ist ein separater Provider vom Standard-
    [Amazon Bedrock](/de/providers/bedrock)-Provider. Mantle verwendet eine
    OpenAI-kompatible `/v1`-Oberfläche, während der Standard-Bedrock-Provider
    die native Bedrock-API verwendet.

    Beide Provider teilen sich dieselben `AWS_BEARER_TOKEN_BEDROCK`-Anmeldedaten, wenn
    sie vorhanden sind.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/de/providers/bedrock" icon="cloud">
    Nativer Bedrock-Provider für Anthropic Claude, Titan und andere models.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Model-Refs und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie behoben werden.
  </Card>
</CardGroup>
