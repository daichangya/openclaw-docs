---
read_when:
    - Sie möchten auf Bedrock Mantle gehostete OSS-Modelle mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon-Bedrock-Mantle-Modelle (OpenAI-kompatibel) mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T06:53:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw enthält einen gebündelten Provider **Amazon Bedrock Mantle**, der sich mit
dem OpenAI-kompatiblen Mantle-Endpunkt verbindet. Mantle hostet Open-Source- und
Drittanbieter-Modelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardisierte
Oberfläche `/v1/chat/completions`, die von der Bedrock-Infrastruktur unterstützt wird.

| Eigenschaft    | Wert                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------- |
| Provider-ID    | `amazon-bedrock-mantle`                                                                      |
| API            | `openai-completions` (OpenAI-kompatibel) oder `anthropic-messages` (Anthropic-Messages-Route) |
| Auth           | Explizites `AWS_BEARER_TOKEN_BEDROCK` oder Generierung eines Bearer-Tokens aus der IAM-Credential-Chain |
| Standardregion | `us-east-1` (überschreiben mit `AWS_REGION` oder `AWS_DEFAULT_REGION`)                       |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Explizites Bearer-Token">
    **Am besten für:** Umgebungen, in denen Sie bereits ein Mantle-Bearer-Token haben.

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
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        Erkannte Modelle erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist keine
        zusätzliche Konfiguration erforderlich, außer Sie möchten Standardwerte überschreiben.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-Anmeldedaten">
    **Am besten für:** Verwendung von AWS-SDK-kompatiblen Anmeldedaten (Shared Config, SSO, Web Identity, Instanz- oder Task-Rollen).

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host konfigurieren">
        Jede AWS-SDK-kompatible Authentifizierungsquelle funktioniert:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        OpenClaw erzeugt automatisch ein Mantle-Bearer-Token aus der Credential-Chain.
      </Step>
    </Steps>

    <Tip>
    Wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist, erstellt OpenClaw das Bearer-Token für Sie aus der Standard-Credential-Chain von AWS, einschließlich Shared Credentials/Config-Profile, SSO, Web Identity sowie Instanz- oder Task-Rollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische Modellerkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls
versucht OpenClaw, ein Mantle-Bearer-Token aus der Standard-
Credential-Chain von AWS zu erzeugen. Anschließend erkennt es verfügbare Mantle-Modelle, indem der
Endpunkt `/v1/models` der Region abgefragt wird.

| Verhalten            | Detail                    |
| -------------------- | ------------------------- |
| Discovery-Cache      | Ergebnisse 1 Stunde gecacht |
| IAM-Token-Aktualisierung | Stündlich              |

<Note>
Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das auch vom Standard-Provider [Amazon Bedrock](/de/providers/bedrock) verwendet wird.
</Note>

### Unterstützte Regionen

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Manuelle Konfiguration

Wenn Sie explizite Konfiguration statt Auto-Discovery bevorzugen:

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

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Reasoning-Unterstützung">
    Reasoning-Unterstützung wird aus Modell-IDs abgeleitet, die Muster wie
    `thinking`, `reasoner` oder `gpt-oss-120b` enthalten. OpenClaw setzt
    `reasoning: true` während der Discovery automatisch für passende Modelle.
  </Accordion>

  <Accordion title="Nichtverfügbarkeit des Endpunkts">
    Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider
    stillschweigend übersprungen. OpenClaw gibt keinen Fehler aus; andere konfigurierte Provider
    funktionieren normal weiter.
  </Accordion>

  <Accordion title="Claude Opus 4.7 über die Anthropic-Messages-Route">
    Mantle stellt außerdem eine Anthropic-Messages-Route bereit, die Claude-Modelle über denselben bearer-authentifizierten Streaming-Pfad transportiert. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kann über diese Route mit provider-eigenem Streaming aufgerufen werden, sodass AWS-Bearer-Tokens nicht wie Anthropic-API-Schlüssel behandelt werden.

    Wenn Sie ein Anthropic-Messages-Modell auf dem Mantle-Provider fixieren, verwendet OpenClaw für dieses Modell die API-Oberfläche `anthropic-messages` statt `openai-completions`. Die Authentifizierung stammt weiterhin aus `AWS_BEARER_TOKEN_BEDROCK` (oder dem erzeugten IAM-Bearer-Token).

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
    OpenAI-kompatible Oberfläche `/v1`, während der Standard-Bedrock-Provider
    die native Bedrock-API verwendet.

    Beide Provider teilen sich dieselben Anmeldedaten `AWS_BEARER_TOKEN_BEDROCK`, wenn
    vorhanden.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/de/providers/bedrock" icon="cloud">
    Nativer Bedrock-Provider für Anthropic Claude, Titan und andere Modelle.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie Sie sie lösen.
  </Card>
</CardGroup>
