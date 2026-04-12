---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Env-Variable für den API-Schlüssel oder die CLI-Auth-Option
summary: Einrichtung von Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:33:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48c206a645d7a62e201a35ae94232323c8570fdae63129231c38d363ea78a60b
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Das [Vercel AI Gateway](https://vercel.com/ai-gateway) bietet eine einheitliche API, um
über einen einzigen Endpunkt auf Hunderte Modelle zuzugreifen.

| Eigenschaft   | Wert                             |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| Auth          | `AI_GATEWAY_API_KEY`             |
| API           | Anthropic-Messages-kompatibel    |
| Modellkatalog | Automatisch erkannt über `/v1/models` |

<Tip>
OpenClaw erkennt den Gateway-Katalog `/v1/models` automatisch, daher enthält
`/models vercel-ai-gateway` aktuelle Modell-Refs wie
`vercel-ai-gateway/openai/gpt-5.4`.
</Tip>

## Erste Schritte

<Steps>
  <Step title="Den API-Schlüssel setzen">
    Führen Sie das Onboarding aus und wählen Sie die Auth-Option für AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Ein Standardmodell festlegen">
    Fügen Sie das Modell zu Ihrer OpenClaw-Konfiguration hinzu:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptgesteuerte oder CI-Setups geben Sie alle Werte in der Befehlszeile an:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Modell-ID-Kurzform

OpenClaw akzeptiert Kurzform-Modell-Refs für Vercel Claude und normalisiert sie zur
Laufzeit:

| Kurzform-Eingabe                    | Normalisierte Modell-Ref                     |
| ----------------------------------- | -------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Sie können in Ihrer Konfiguration entweder die Kurzform oder die vollständig qualifizierte Modell-Ref verwenden. OpenClaw löst die kanonische Form automatisch auf.
</Tip>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Umgebungsvariable für Daemon-Prozesse">
    Wenn das OpenClaw Gateway als Daemon (launchd/systemd) läuft, stellen Sie sicher, dass
    `AI_GATEWAY_API_KEY` für diesen Prozess verfügbar ist.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` gesetzt ist, ist für einen launchd/systemd-
    Daemon nicht sichtbar, sofern diese Umgebung nicht explizit importiert wird. Setzen Sie den Schlüssel in
    `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn
    lesen kann.
    </Warning>

  </Accordion>

  <Accordion title="Provider-Routing">
    Vercel AI Gateway leitet Anfragen anhand des Präfixes der Modell-Ref an den Upstream-Provider
    weiter. Zum Beispiel wird `vercel-ai-gateway/anthropic/claude-opus-4.6` über
    Anthropic geroutet, während `vercel-ai-gateway/openai/gpt-5.4` über
    OpenAI geroutet wird. Ihr einzelner `AI_GATEWAY_API_KEY` übernimmt die Authentifizierung für alle
    Upstream-Provider.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
