---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden.
    - Sie benötigen die Einrichtung von AWS-Anmeldedaten und einer Region für Modellaufrufe.
summary: Verwenden Sie Amazon-Bedrock-Modelle (Converse API) mit OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:30:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw kann **Amazon Bedrock**-Modelle über den **Bedrock-Converse**-Streaming-Provider
von pi-ai verwenden. Die Bedrock-Authentifizierung nutzt die **AWS-SDK-Standard-Credential-Chain**,
nicht einen API-Schlüssel.

| Eigenschaft | Wert                                                        |
| ----------- | ----------------------------------------------------------- |
| Provider    | `amazon-bedrock`                                            |
| API         | `bedrock-converse-stream`                                   |
| Auth        | AWS-Anmeldedaten (Umgebungsvariablen, Shared Config oder Instance Role) |
| Region      | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Access Keys / Umgebungsvariablen">
    **Am besten geeignet für:** Entwicklerrechner, CI oder Hosts, auf denen Sie AWS-Anmeldedaten direkt verwalten.

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host setzen">
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
      <Step title="Einen Bedrock-Provider und ein Modell zu Ihrer Konfiguration hinzufügen">
        Es ist kein `apiKey` erforderlich. Konfigurieren Sie den Provider mit `auth: "aws-sdk"`:

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
    Bei Authentifizierung über Umgebungsmarker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw den impliziten Bedrock-Provider für die Modellermittlung automatisch, ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instance-Roles (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit angehängter IAM-Rolle, die den Instance Metadata Service zur Authentifizierung verwenden.

    <Steps>
      <Step title="Ermittlung explizit aktivieren">
        Wenn IMDS verwendet wird, kann OpenClaw AWS-Authentifizierung nicht allein anhand von Umgebungsmarkern erkennen, daher müssen Sie sie explizit aktivieren:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Umgebungsmarker für den Auto-Modus hinzufügen">
        Wenn Sie außerdem möchten, dass der Auto-Erkennungspfad über Umgebungsmarker funktioniert (zum Beispiel für Oberflächen wie `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** gefälschten API-Schlüssel.
      </Step>
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Die an Ihre EC2-Instanz angehängte IAM-Rolle muss über folgende Berechtigungen verfügen:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für die automatische Ermittlung)
    - `bedrock:ListInferenceProfiles` (für die Ermittlung von Inference Profiles)

    Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur dann, wenn Sie ausdrücklich einen Umgebungsmarker für den Auto-Modus oder für Statusoberflächen möchten. Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet die AWS-SDK-Standardkette, daher funktioniert die Authentifizierung über IMDS-Instance-Roles auch ohne Umgebungsmarker.
    </Note>

  </Tab>
</Tabs>

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle, die **Streaming**
und **Textausgabe** unterstützen, automatisch erkennen. Die Ermittlung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und die Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` gesetzt ist,
  versucht OpenClaw die Ermittlung auch dann, wenn kein AWS-Umgebungsmarker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Authentifizierungsmarker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet weiterhin die AWS-SDK-Standardkette, daher
  können Shared Config, SSO und IMDS-Instance-Role-Authentifizierung auch dann funktionieren, wenn für die Ermittlung
  `enabled: true` explizit gesetzt werden musste.

<Note>
Für explizite `models.providers["amazon-bedrock"]`-Einträge kann OpenClaw die Bedrock-Authentifizierung über Umgebungsmarker weiterhin früh aus AWS-Umgebungsmarkern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Laufzeit-Authentifizierung zu erzwingen. Der tatsächliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die AWS-SDK-Standardkette.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen für die Ermittlung">
    Konfigurationsoptionen befinden sich unter `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | auto | Im Auto-Modus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Umgebungsmarker erkannt wird. Setzen Sie `true`, um die Ermittlung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region, die für API-Aufrufe zur Ermittlung verwendet wird. |
    | `providerFilter` | (alle) | Entspricht Bedrock-Providernamen (zum Beispiel `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie `0`, um den Cache zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Kontextfenster, das für erkannte Modelle verwendet wird (überschreiben Sie es, wenn Sie die Modelllimits kennen). |
    | `defaultMaxTokens` | `4096` | Maximale Ausgabetokens, die für erkannte Modelle verwendet werden (überschreiben Sie es, wenn Sie die Modelllimits kennen). |

  </Accordion>
</AccordionGroup>

## Schnelleinrichtung (AWS-Pfad)

Diese Anleitung erstellt eine IAM-Rolle, hängt Bedrock-Berechtigungen an, ordnet
das Instance Profile zu und aktiviert die OpenClaw-Ermittlung auf dem EC2-Host.

```bash
# 1. IAM-Rolle und Instance Profile erstellen
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

# 2. Ihrer EC2-Instanz zuordnen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Auf der EC2-Instanz die Ermittlung explizit aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: einen Umgebungsmarker hinzufügen, wenn Sie den Auto-Modus ohne explizite Aktivierung möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Prüfen, ob Modelle erkannt werden
openclaw models list
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Inference Profiles">
    OpenClaw erkennt **regionale und globale Inference Profiles** zusammen mit
    Foundation-Modellen. Wenn ein Profil einem bekannten Foundation-Modell zugeordnet ist, übernimmt das
    Profil dessen Fähigkeiten (Kontextfenster, maximale Tokens, Reasoning, Vision), und die korrekte
    Bedrock-Anfrageregion wird automatisch injiziert. Dadurch funktionieren regionenübergreifende Claude-Profile ohne manuelle
    Provider-Overrides.

    Inference-Profile-IDs sehen beispielsweise so aus: `us.anthropic.claude-opus-4-6-v1:0` (regional)
    oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
    in den Ermittlungsergebnissen vorhanden ist, übernimmt das Profil dessen vollständigen Fähigkeitssatz;
    andernfalls werden sichere Standardwerte angewendet.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Ermittlung aktiviert ist und der IAM-
    Principal über `bedrock:ListInferenceProfiles` verfügt, erscheinen Profile zusammen mit
    Foundation-Modellen in `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Bedrock-Modellaufrufe anwenden, indem Sie der
    `amazon-bedrock`-Plugin-Konfiguration ein `guardrail`-Objekt hinzufügen. Guardrails ermöglichen die Durchsetzung von Inhaltsfiltern,
    Themenablehnung, Wortfiltern, Filtern für sensible Informationen und
    Prüfungen zur kontextuellen Verankerung.

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
    | `streamProcessingMode` | Nein | `"sync"` oder `"async"` für die Guardrail-Auswertung während des Streamings. Wenn weggelassen, verwendet Bedrock den Standardwert. |
    | `trace` | Nein | `"enabled"` oder `"enabled_full"` zum Debuggen; für Produktion weglassen oder auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Principal muss zusätzlich zu den normalen Aufrufberechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings für memory_search">
    Bedrock kann auch als Embedding-Provider für
    [memory_search](/de/concepts/memory-search) dienen. Dies wird getrennt vom
    Inferenz-Provider konfiguriert – setzen Sie `agents.defaults.memorySearch.provider` auf `"bedrock"`:

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

    Bedrock-Embeddings verwenden dieselbe AWS-SDK-Credential-Chain wie die Inferenz (Instance
    Roles, SSO, Access Keys, Shared Config und Web Identity). Es ist kein API-Schlüssel
    erforderlich. Wenn `provider` auf `"auto"` gesetzt ist, wird Bedrock automatisch erkannt, wenn diese
    Credential-Chain erfolgreich aufgelöst wird.

    Unterstützte Embedding-Modelle umfassen Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
    [Konfigurationsreferenz für Memory -- Bedrock](/de/reference/memory-config#bedrock-embedding-config)
    für die vollständige Modellliste und Dimensionsoptionen.

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert, dass **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region aktiviert ist.
    - Die automatische Ermittlung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles`.
    - Wenn Sie sich auf den Auto-Modus verlassen, setzen Sie einen der unterstützten AWS-Authentifizierungs-Umgebungsmarker auf dem
      Gateway-Host. Wenn Sie IMDS-/Shared-Config-Authentifizierung ohne Umgebungsmarker bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Quelle der Anmeldedaten in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
      standardmäßige AWS-SDK-Kette.
    - Die Unterstützung für Reasoning hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte auf
      aktuelle Fähigkeiten.
    - Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock schalten und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="memory_search" href="/de/concepts/memory-search" icon="magnifying-glass">
    Konfiguration von Bedrock-Embeddings für memory_search.
  </Card>
  <Card title="Memory-Konfigurationsreferenz" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Bedrock-Embedding-Modellliste und Dimensionsoptionen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
