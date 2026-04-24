---
read_when:
    - Sie möchten Open Models in OpenClaw kostenlos verwenden
    - Sie benötigen die Einrichtung von NVIDIA_API_KEY
summary: NVIDIAs OpenAI-kompatible API in OpenClaw verwenden
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T06:54:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA bietet unter `https://integrate.api.nvidia.com/v1` eine OpenAI-kompatible API für
Open Models kostenlos an. Authentifizieren Sie sich mit einem API-Schlüssel von
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Erste Schritte

<Steps>
  <Step title="Ihren API-Schlüssel holen">
    Erstellen Sie einen API-Schlüssel unter [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Den Schlüssel exportieren und Onboarding ausführen">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Ein NVIDIA-Modell setzen">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Wenn Sie statt der Umgebungsvariable `--token` übergeben, landet der Wert im Shell-Verlauf und in der
`ps`-Ausgabe. Bevorzugen Sie möglichst die Umgebungsvariable `NVIDIA_API_KEY`.
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

| Modell-Ref                                 | Name                         | Kontext | Max. Ausgabe |
| ------------------------------------------ | ---------------------------- | ------- | ------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192        |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192        |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192        |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192        |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten bei automatischer Aktivierung">
    Der Provider wird automatisch aktiviert, wenn die Umgebungsvariable `NVIDIA_API_KEY` gesetzt ist.
    Über den Schlüssel hinaus ist keine explizite Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Katalog und Preise">
    Der gebündelte Katalog ist statisch. Die Kosten sind in der Quelle standardmäßig `0`, da NVIDIA
    derzeit kostenlosen API-Zugriff für die aufgeführten Modelle anbietet.
  </Accordion>

  <Accordion title="OpenAI-kompatibler Endpunkt">
    NVIDIA verwendet den Standard-Endpunkt `/v1` für Completions. Jedes OpenAI-kompatible
    Tooling sollte mit der NVIDIA-Base-URL sofort funktionieren.
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA-Modelle sind derzeit kostenlos nutzbar. Prüfen Sie
[build.nvidia.com](https://build.nvidia.com/) auf den neuesten Stand zu Verfügbarkeit und
Rate-Limit-Details.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
