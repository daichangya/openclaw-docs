---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Konto-ID, die Gateway-ID oder die API-Key-Env-Variable
summary: Einrichtung von Cloudflare AI Gateway (Authentifizierung + Modellauswahl)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway sitzt vor Provider-APIs und ermöglicht es Ihnen, Analysen, Caching und Kontrollen hinzuzufügen. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

| Eigenschaft   | Wert                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Standardmodell | `cloudflare-ai-gateway/claude-sonnet-4-5`                                               |
| API-Schlüssel | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Schlüssel für Anfragen über das Gateway) |

<Note>
Verwenden Sie für Anthropic-Modelle, die über Cloudflare AI Gateway geleitet werden, Ihren **Anthropic-API-Schlüssel** als Provider-Schlüssel.
</Note>

## Erste Schritte

<Steps>
  <Step title="Provider-API-Schlüssel und Gateway-Details festlegen">
    Führen Sie das Onboarding aus und wählen Sie die Auth-Option für Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dabei werden Ihre Konto-ID, Gateway-ID und Ihr API-Schlüssel abgefragt.

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell zu Ihrer OpenClaw-Konfiguration hinzu:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptgesteuerte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Authentifizierte Gateways">
    Wenn Sie die Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu. Dies geschieht **zusätzlich zu** Ihrem Provider-API-Schlüssel.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    Der Header `cf-aig-authorization` authentifiziert gegenüber dem Cloudflare Gateway selbst, während der Provider-API-Schlüssel (zum Beispiel Ihr Anthropic-Schlüssel) gegenüber dem Upstream-Provider authentifiziert.
    </Tip>

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem `launchd`/`systemd`-Daemon nicht, es sei denn, diese Umgebung wird dort ebenfalls importiert. Setzen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
