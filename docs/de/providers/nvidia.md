---
read_when:
    - Sie möchten offene Modelle in OpenClaw kostenlos verwenden
    - Sie benötigen die Einrichtung von `NVIDIA_API_KEY`
summary: NVIDIAs OpenAI-kompatible API in OpenClaw verwenden
title: NVIDIA
x-i18n:
    generated_at: "2026-04-12T23:32:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA bietet unter `https://integrate.api.nvidia.com/v1` eine OpenAI-kompatible API für
offene Modelle kostenlos an. Die Authentifizierung erfolgt mit einem API key von
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Erste Schritte

<Steps>
  <Step title="Get your API key">
    Erstellen Sie einen API-Schlüssel unter [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Wenn Sie statt der Umgebungsvariable `--token` übergeben, landet der Wert im Shell-Verlauf und in der
`ps`-Ausgabe. Verwenden Sie nach Möglichkeit die Umgebungsvariable `NVIDIA_API_KEY`.
</Warning>

## Konfigurationsbeispiel

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Integrierter Katalog

| Modell-Ref                                 | Name                         | Kontext | Maximale Ausgabe |
| ------------------------------------------ | ---------------------------- | ------- | ---------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192            |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192            |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192            |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192            |

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Aktivierung">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY` gesetzt ist.
    Über den Schlüssel hinaus ist keine explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    Der gebündelte Katalog ist statisch. Die Kosten sind im Quellcode standardmäßig `0`, da NVIDIA
    derzeit kostenlosen API-Zugriff für die aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpunkt">
    NVIDIA verwendet den standardmäßigen `/v1`-Completions-Endpunkt. Jedes OpenAI-kompatible
    Tooling sollte mit der NVIDIA-Basis-URL sofort funktionieren.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-Modelle können derzeit kostenlos verwendet werden. Prüfen Sie
[build.nvidia.com](https://build.nvidia.com/) für die neuesten Verfügbarkeits- und
Rate-Limit-Details.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
