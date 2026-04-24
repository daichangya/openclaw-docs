---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung von AWS-Credentials/-Region für Modellaufrufe
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T06:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw kann **Amazon Bedrock**-Modelle über den **Bedrock Converse**-
Streaming-Provider von pi-ai verwenden. Die Bedrock-Authentifizierung nutzt die **Standard-Credential-Chain des AWS SDK**,
nicht einen API-Schlüssel.

| Eigenschaft | Wert                                                        |
| ----------- | ----------------------------------------------------------- |
| Provider    | `amazon-bedrock`                                            |
| API         | `bedrock-converse-stream`                                   |
| Auth        | AWS-Credentials (Env-Variablen, Shared Config oder Instanzrolle) |
| Region      | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Setup-Schritten.

<Tabs>
  <Tab title="Access Keys / Env-Variablen">
    **Am besten geeignet für:** Entwicklerrechner, CI oder Hosts, auf denen Sie AWS-Credentials direkt verwalten.

    <Steps>
      <Step title="AWS-Credentials auf dem Gateway-Host setzen">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock-API-Schlüssel/Bearer-Token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Einen Bedrock-Provider und ein Modell zur Konfiguration hinzufügen">
        Kein `apiKey` erforderlich. Konfigurieren Sie den Provider mit `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Mit Env-Marker-Authentifizierung (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw den impliziten Bedrock-Provider für Modell-Discovery automatisch ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instanzrollen (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit angehängter IAM-Rolle, die den Instance Metadata Service zur Authentifizierung verwenden.

    <Steps>
      <Step title="Discovery explizit aktivieren">
        Wenn Sie IMDS verwenden, kann OpenClaw AWS-Authentifizierung nicht allein anhand von Env-Markern erkennen, daher müssen Sie sich explizit dafür entscheiden:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Env-Marker für den Auto-Modus hinzufügen">
        Wenn Sie außerdem möchten, dass der Auto-Detection-Pfad mit Env-Markern funktioniert (zum Beispiel für Oberflächen wie `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** gefälschten API-Schlüssel.
      </Step>
      <Step title="Prüfen, ob Modelle entdeckt werden">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Die an Ihre EC2-Instanz angehängte IAM-Rolle muss die folgenden Berechtigungen haben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für automatische Discovery)
    - `bedrock:ListInferenceProfiles` (für Discovery von Inference-Profilen)

    Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur dann, wenn Sie explizit einen Env-Marker für Auto-Modus oder Statusoberflächen möchten. Der eigentliche Bedrock-Auth-Pfad zur Laufzeit verwendet die Standard-Chain des AWS SDK, sodass IMDS-Authentifizierung über Instanzrollen auch ohne Env-Marker funktioniert.
    </Note>

  </Tab>
</Tabs>

## Automatische Modell-Discovery

OpenClaw kann automatisch Bedrock-Modelle erkennen, die **Streaming**
und **Textausgabe** unterstützen. Die Discovery verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und die Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

Wie der implizite Provider aktiviert wird:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true`
  gesetzt ist, versucht OpenClaw Discovery auch dann, wenn kein AWS-Env-Marker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den impliziten Bedrock-Provider nur dann automatisch hinzu,
  wenn es einen dieser AWS-Auth-Marker sieht:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der eigentliche Bedrock-Auth-Pfad zur Laufzeit verwendet weiterhin die Standard-Chain des AWS SDK, sodass
  Shared Config, SSO und IMDS-Authentifizierung über Instanzrollen funktionieren können, selbst wenn für die Discovery
  `enabled: true` zum Opt-in gesetzt werden musste.

<Note>
Für explizite Einträge unter `models.providers["amazon-bedrock"]` kann OpenClaw weiterhin Bedrock-Authentifizierung über Env-Marker früh aus AWS-Env-Markern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne vollständiges Laufzeitladen der Authentifizierung zu erzwingen. Der eigentliche Auth-Pfad für Modellaufrufe verwendet weiterhin die Standard-Chain des AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen für Discovery">
    Konfigurationsoptionen liegen unter `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Option | Standard | Beschreibung |
    | ------ | -------- | ------------ |
    | `enabled` | auto | Im Auto-Modus aktiviert OpenClaw den impliziten Bedrock-Provider nur dann, wenn ein unterstützter AWS-Env-Marker sichtbar ist. Setzen Sie `true`, um Discovery zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region, die für Discovery-API-Aufrufe verwendet wird. |
    | `providerFilter` | (alle) | Entspricht Namen von Bedrock-Providern (zum Beispiel `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie `0`, um Caching zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Kontextfenster, das für entdeckte Modelle verwendet wird (überschreiben, wenn Sie Ihre Modelllimits kennen). |
    | `defaultMaxTokens` | `4096` | Maximale Ausgabetokens, die für entdeckte Modelle verwendet werden (überschreiben, wenn Sie Ihre Modelllimits kennen). |

  </Accordion>
</AccordionGroup>

## Schnelles Setup (AWS-Pfad)

Diese Anleitung erstellt eine IAM-Rolle, hängt Bedrock-Berechtigungen an, verknüpft
das Instanzprofil und aktiviert OpenClaw-Discovery auf dem EC2-Host.

```bash
# 1. IAM-Rolle und Instanzprofil erstellen
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Mit Ihrer EC2-Instanz verknüpfen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Discovery auf der EC2-Instanz explizit aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: einen Env-Marker hinzufügen, wenn Sie den Auto-Modus ohne explizites Enable möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Prüfen, ob Modelle entdeckt werden
openclaw models list
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Inference-Profile">
    OpenClaw entdeckt **regionale und globale Inference-Profile** zusammen mit
    Foundation-Modellen. Wenn ein Profil einem bekannten Foundation-Modell zugeordnet ist, übernimmt das
    Profil die Capabilities dieses Modells (Kontextfenster, maximale Tokens,
    Reasoning, Vision), und die korrekte Bedrock-Request-Region wird automatisch
    injiziert. Das bedeutet, dass Claude-Profile über Regionen hinweg ohne manuelle
    Provider-Overrides funktionieren.

    IDs von Inference-Profilen sehen etwa so aus: `us.anthropic.claude-opus-4-6-v1:0` (regional)
    oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
    in den Discovery-Ergebnissen enthalten ist, übernimmt das Profil dessen vollständige Capability-Menge;
    andernfalls werden sichere Standardwerte angewendet.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange Discovery aktiviert ist und das IAM-
    Principal `bedrock:ListInferenceProfiles` besitzt, erscheinen Profile zusammen mit
    Foundation-Modellen in `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Modellaufrufe über Bedrock anwenden, indem Sie ein Objekt `guardrail` zur
    Konfiguration des Plugins `amazon-bedrock` hinzufügen. Guardrails ermöglichen es Ihnen, Inhaltsfilterung,
    Themenverweigerung, Wortfilter, Filter für sensible Informationen und Prüfungen auf kontextuelle
    Fundierung durchzusetzen.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // Guardrail-ID oder vollständige ARN
                guardrailVersion: "1", // Versionsnummer oder "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" oder "async"
                trace: "enabled", // optional: "enabled", "disabled" oder "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Erforderlich | Beschreibung |
    | ------ | ------------ | ------------ |
    | `guardrailIdentifier` | Ja | Guardrail-ID (z. B. `abc123`) oder vollständige ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ja | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | Nein | `"sync"` oder `"async"` für Guardrail-Auswertung während des Streamings. Wenn weggelassen, verwendet Bedrock den Standardwert. |
    | `trace` | Nein | `"enabled"` oder `"enabled_full"` für Debugging; für Produktion weglassen oder `"disabled"` setzen. |

    <Warning>
    Das vom Gateway verwendete IAM-Principal muss zusätzlich zu den Standardberechtigungen für Aufrufe auch die Berechtigung `bedrock:ApplyGuardrail` haben.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings für Memory-Suche">
    Bedrock kann auch als Embedding-Provider für die
    [Memory-Suche](/de/concepts/memory-search) dienen. Dies wird getrennt vom
    Inference-Provider konfiguriert -- setzen Sie `agents.defaults.memorySearch.provider` auf `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // Standard
          },
        },
      },
    }
    ```

    Bedrock-Embeddings verwenden dieselbe AWS-SDK-Credential-Chain wie Inferenz (Instanz-
    Rollen, SSO, Access Keys, Shared Config und Web Identity). Es wird kein API-Schlüssel
    benötigt. Wenn `provider` auf `"auto"` gesetzt ist, wird Bedrock automatisch erkannt, wenn diese
    Credential-Chain erfolgreich aufgelöst wird.

    Zu den unterstützten Embedding-Modellen gehören Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
    [Memory-Konfigurationsreferenz -- Bedrock](/de/reference/memory-config#bedrock-embedding-config)
    für die vollständige Modellliste und Dimensionsoptionen.

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert aktivierten **Modellzugriff** in Ihrem AWS-Konto/Ihrer Region.
    - Für automatische Discovery werden die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles` benötigt.
    - Wenn Sie sich auf den Auto-Modus verlassen, setzen Sie einen der unterstützten AWS-Auth-Env-Marker auf dem
      Gateway-Host. Wenn Sie IMDS-/Shared-Config-Authentifizierung ohne Env-Marker bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Quelle der Credentials in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
      Standard-Chain des AWS SDK.
    - Unterstützung für Reasoning hängt vom Modell ab; prüfen Sie die Modellkarte von Bedrock auf
      die aktuellen Capabilities.
    - Wenn Sie einen verwalteten Schlüssel-Flow bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock schalten und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Memory-Suche" href="/de/concepts/memory-search" icon="magnifying-glass">
    Konfiguration von Bedrock-Embeddings für die Memory-Suche.
  </Card>
  <Card title="Memory-Konfigurationsreferenz" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Liste der Bedrock-Embedding-Modelle und Dimensionsoptionen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
