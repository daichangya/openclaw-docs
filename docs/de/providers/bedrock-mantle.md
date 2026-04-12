---
read_when:
    - Sie möchten auf Bedrock Mantle gehostete OSS-Modelle mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon-Bedrock-Mantle-Modelle (OpenAI-kompatibel) mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-12T23:29:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw enthält einen gebündelten Provider für **Amazon Bedrock Mantle**, der
eine Verbindung zum OpenAI-kompatiblen Mantle-Endpunkt herstellt. Mantle hostet
Open-Source- und Drittanbieter-Modelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche)
über eine standardisierte Oberfläche auf Basis von `/v1/chat/completions`, die
von der Bedrock-Infrastruktur unterstützt wird.

| Eigenschaft    | Wert                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| Provider-ID    | `amazon-bedrock-mantle`                                                             |
| API            | `openai-completions` (OpenAI-kompatibel)                                            |
| Auth           | Explizites `AWS_BEARER_TOKEN_BEDROCK` oder Bearer-Token-Generierung über IAM-Credential-Chain |
| Standardregion | `us-east-1` (mit `AWS_REGION` oder `AWS_DEFAULT_REGION` überschreiben)              |

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Explizites Bearer-Token">
    **Am besten geeignet für:** Umgebungen, in denen Sie bereits ein Mantle-Bearer-Token haben.

    <Steps>
      <Step title="Bearer-Token auf dem Gateway-Host setzen">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Optional können Sie eine Region festlegen (Standard ist `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        Erkannte Modelle erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist keine
        zusätzliche Konfiguration erforderlich, sofern Sie die Standardwerte nicht überschreiben möchten.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-Zugangsdaten">
    **Am besten geeignet für:** die Verwendung von AWS-SDK-kompatiblen Zugangsdaten (gemeinsame Konfiguration, SSO, Web-Identität, Instanz- oder Task-Rollen).

    <Steps>
      <Step title="AWS-Zugangsdaten auf dem Gateway-Host konfigurieren">
        Jede AWS-SDK-kompatible Auth-Quelle funktioniert:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        OpenClaw generiert automatisch ein Mantle-Bearer-Token aus der Credential-Chain.
      </Step>
    </Steps>

    <Tip>
    Wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist, prägt OpenClaw das Bearer-Token für Sie aus der AWS-Standard-Credential-Chain, einschließlich gemeinsamer Credentials-/Konfigurationsprofile, SSO, Web-Identität sowie Instanz- oder Task-Rollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische Modellerkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls
versucht OpenClaw, aus der AWS-Standard-Credential-Chain ein Mantle-Bearer-Token zu generieren.
Danach erkennt es verfügbare Mantle-Modelle, indem es den Endpunkt `/v1/models`
der Region abfragt.

| Verhalten             | Detail                     |
| --------------------- | -------------------------- |
| Discovery-Cache       | Ergebnisse 1 Stunde gecacht |
| IAM-Token-Aktualisierung | Stündlich                |

<Note>
Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das vom standardmäßigen Provider [Amazon Bedrock](/de/providers/bedrock) verwendet wird.
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
    Die Reasoning-Unterstützung wird aus Modell-IDs mit Mustern wie
    `thinking`, `reasoner` oder `gpt-oss-120b` abgeleitet. OpenClaw setzt
    `reasoning: true` während der Erkennung automatisch für passende Modelle.
  </Accordion>

  <Accordion title="Endpunkt nicht verfügbar">
    Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider
    stillschweigend übersprungen. OpenClaw gibt keinen Fehler aus; andere konfigurierte Provider
    funktionieren normal weiter.
  </Accordion>

  <Accordion title="Beziehung zum Amazon-Bedrock-Provider">
    Bedrock Mantle ist ein separater Provider vom standardmäßigen
    Provider [Amazon Bedrock](/de/providers/bedrock). Mantle verwendet eine
    OpenAI-kompatible `/v1`-Oberfläche, während der standardmäßige Bedrock-Provider
    die native Bedrock-API verwendet.

    Beide Provider verwenden dieselbe Credential `AWS_BEARER_TOKEN_BEDROCK`, wenn
    sie vorhanden ist.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/de/providers/bedrock" icon="cloud">
    Nativer Bedrock-Provider für Anthropic Claude, Titan und andere Modelle.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Zugangsdaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie gelöst werden.
  </Card>
</CardGroup>
