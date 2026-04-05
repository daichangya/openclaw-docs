---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung von AWS-Anmeldedaten/Region für Modellaufrufe
summary: Verwenden Sie Amazon-Bedrock-Modelle (Converse API) mit OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-05T12:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a751824b679a9340db714ee5227e8d153f38f6c199ca900458a4ec092b4efe54
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw kann **Amazon Bedrock**-Modelle über pi-ais Streaming-Provider **Bedrock Converse**
verwenden. Bedrock-Authentifizierung verwendet die **AWS SDK default credential chain**,
nicht einen API-Schlüssel.

## Was pi-ai unterstützt

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: AWS-Anmeldedaten (Umgebungsvariablen, gemeinsame Konfiguration oder Instanzrolle)
- Region: `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`)

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle, die **Streaming**
und **Textausgabe** unterstützen, automatisch erkennen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und die Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` gesetzt ist,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Umgebungsmarker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Authentifizierungsmarker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Bedrock-Runtime-Authentifizierungspfad verwendet weiterhin die AWS SDK default chain, sodass
  gemeinsame Konfiguration, SSO und IMDS-Authentifizierung per Instanzrolle funktionieren können, auch wenn für die Erkennung
  `enabled: true` zur Aktivierung erforderlich war.

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

Hinweise:

- `enabled` verwendet standardmäßig den Auto-Modus. Im Auto-Modus aktiviert OpenClaw den
  impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Umgebungsmarker erkannt wird.
- `region` verwendet standardmäßig `AWS_REGION` oder `AWS_DEFAULT_REGION`, dann `us-east-1`.
- `providerFilter` gleicht Bedrock-Providernamen ab (zum Beispiel `anthropic`).
- `refreshInterval` ist in Sekunden angegeben; setzen Sie den Wert auf `0`, um das Caching zu deaktivieren.
- `defaultContextWindow` (Standard: `32000`) und `defaultMaxTokens` (Standard: `4096`)
  werden für erkannte Modelle verwendet (überschreiben Sie diese Werte, wenn Sie die Modellgrenzen kennen).
- Für explizite Einträge unter `models.providers["amazon-bedrock"]` kann OpenClaw
  Bedrock-Authentifizierung über Umgebungsmarker weiterhin früh aus AWS-Umgebungsmarkern wie
  `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Runtime-Authentifizierung zu erzwingen. Der
  tatsächliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die AWS SDK default chain.

## Onboarding

1. Stellen Sie sicher, dass AWS-Anmeldedaten auf dem **Gateway-Host** verfügbar sind:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Fügen Sie Ihrer Konfiguration einen Bedrock-Provider und ein Modell hinzu (kein `apiKey` erforderlich):

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

## EC2-Instanzrollen

Wenn OpenClaw auf einer EC2-Instanz mit angehängter IAM-Rolle ausgeführt wird, kann das AWS SDK
den Instanzmetadatendienst (IMDS) zur Authentifizierung verwenden. Für die Bedrock-
Modellerkennung aktiviert OpenClaw den impliziten Provider aus AWS-Umgebungsmarkern nur automatisch,
wenn Sie nicht explizit
`plugins.entries.amazon-bedrock.config.discovery.enabled: true` setzen.

Empfohlene Einrichtung für IMDS-gestützte Hosts:

- Setzen Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true`.
- Setzen Sie `plugins.entries.amazon-bedrock.config.discovery.region` (oder exportieren Sie `AWS_REGION`).
- Sie benötigen **keinen** falschen API-Schlüssel.
- Sie benötigen `AWS_PROFILE=default` nur, wenn Sie speziell einen Umgebungsmarker
  für den Auto-Modus oder Statusoberflächen möchten.

```bash
# Empfohlen: Erkennung explizit aktivieren + Region setzen
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: Umgebungsmarker hinzufügen, wenn Sie den Auto-Modus ohne explizite Aktivierung möchten
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Erforderliche IAM-Berechtigungen** für die EC2-Instanzrolle:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (für automatische Erkennung)
- `bedrock:ListInferenceProfiles` (für die Erkennung von Inferenzprofilen)

Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.

## Schnelleinrichtung (AWS-Pfad)

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

# 2. Ihrer EC2-Instanz zuordnen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Auf der EC2-Instanz die Erkennung explizit aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: Umgebungsmarker hinzufügen, wenn Sie den Auto-Modus ohne explizite Aktivierung möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Überprüfen, ob Modelle erkannt werden
openclaw models list
```

## Inferenzprofile

OpenClaw erkennt **regionale und globale Inferenzprofile** zusammen mit
Foundation-Modellen. Wenn ein Profil einem bekannten Foundation-Modell zugeordnet ist, übernimmt das
Profil dessen Fähigkeiten (Kontextfenster, maximale Token, Denken,
Vision), und die korrekte Bedrock-Request-Region wird automatisch
eingefügt. Das bedeutet, dass regionübergreifende Claude-Profile ohne manuelle
Provider-Überschreibungen funktionieren.

IDs für Inferenzprofile sehen so aus: `us.anthropic.claude-opus-4-6-v1:0` (regional)
oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
in den Erkennungsergebnissen enthalten ist, übernimmt das Profil dessen vollständigen Fähigkeitssatz;
andernfalls werden sichere Standardwerte verwendet.

Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und die IAM-
Identität über `bedrock:ListInferenceProfiles` verfügt, erscheinen Profile zusammen mit
Foundation-Modellen in `openclaw models list`.

## Hinweise

- Bedrock erfordert aktivierten **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region.
- Die automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
  `bedrock:ListInferenceProfiles`.
- Wenn Sie den Auto-Modus verwenden, setzen Sie einen der unterstützten AWS-Authentifizierungs-Umgebungsmarker auf dem
  Gateway-Host. Wenn Sie IMDS-/Shared-Config-Authentifizierung ohne Umgebungsmarker bevorzugen, setzen Sie
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw zeigt die Quelle der Anmeldedaten in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
  dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
  Standardkette des AWS SDK.
- Unterstützung für Reasoning hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte für
  aktuelle Fähigkeiten.
- Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, können Sie auch einen OpenAI-kompatiblen
  Proxy vor Bedrock setzen und ihn stattdessen als OpenAI-Provider konfigurieren.

## Guardrails

Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
auf alle Bedrock-Modellaufrufe anwenden, indem Sie der
`amazon-bedrock`-Plugin-Konfiguration ein Objekt `guardrail` hinzufügen. Guardrails ermöglichen die Durchsetzung von Inhaltsfilterung,
Themenblockierung, Wortfiltern, Filtern für sensible Informationen und Prüfungen zur kontextuellen
Verankerung.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // guardrail ID or full ARN
            guardrailVersion: "1", // version number or "DRAFT"
            streamProcessingMode: "sync", // optional: "sync" or "async"
            trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (erforderlich) akzeptiert eine Guardrail-ID (z. B. `abc123`) oder eine
  vollständige ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (erforderlich) gibt an, welche veröffentlichte Version verwendet werden soll, oder
  `"DRAFT"` für den Arbeitsentwurf.
- `streamProcessingMode` (optional) steuert, ob die Guardrail-Auswertung
  synchron (`"sync"`) oder asynchron (`"async"`) während des Streamings ausgeführt wird. Wenn
  weggelassen, verwendet Bedrock sein Standardverhalten.
- `trace` (optional) aktiviert die Ausgabe von Guardrail-Trace in der API-Antwort. Setzen Sie dies für Debugging auf
  `"enabled"` oder `"enabled_full"`; lassen Sie es für
  Produktion weg oder setzen Sie `"disabled"`.

Die vom Gateway verwendete IAM-Identität muss zusätzlich zu den Standard-
Invoke-Berechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
