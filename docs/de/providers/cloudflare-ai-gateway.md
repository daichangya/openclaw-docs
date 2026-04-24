---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden.
    - Sie benötigen die Account-ID, die Gateway-ID oder die API-Key-Umgebungsvariable.
summary: Einrichtung von Cloudflare AI Gateway (Authentifizierung + Modellauswahl)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-24T06:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb10ef4bd92db88b2b3dac1773439ab2ba37916a72d1925995d74ef787fa1c8b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

Cloudflare AI Gateway sitzt vor Provider-APIs und ermöglicht Ihnen, Analysen, Caching und Steuerungen hinzuzufügen. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

| Eigenschaft   | Wert                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| Provider      | `cloudflare-ai-gateway`                                                                  |
| Base URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| Standardmodell | `cloudflare-ai-gateway/claude-sonnet-4-6`                                               |
| API-Key       | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Key für Anfragen über das Gateway)     |

<Note>
Für Anthropic-Modelle, die über Cloudflare AI Gateway geroutet werden, verwenden Sie Ihren **Anthropic-API-Key** als Provider-Schlüssel.
</Note>

## Erste Schritte

<Steps>
  <Step title="Den Provider-API-Key und die Gateway-Details setzen">
    Führen Sie das Onboarding aus und wählen Sie die Auth-Option für Cloudflare AI Gateway:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Dabei werden Sie nach Ihrer Account-ID, Gateway-ID und Ihrem API-Key gefragt.

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell zu Ihrer OpenClaw-Konfiguration hinzu:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
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

Für skriptbasierte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

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
    Wenn Sie Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu. Dies erfolgt **zusätzlich zu** Ihrem Provider-API-Key.

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
    Der Header `cf-aig-authorization` authentifiziert gegenüber dem Cloudflare Gateway selbst, während der Provider-API-Key (zum Beispiel Ihr Anthropic-Key) gegenüber dem Upstream-Provider authentifiziert.
    </Tip>

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem launchd/systemd-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird. Setzen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
