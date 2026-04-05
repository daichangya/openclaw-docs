---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs
    - Sie benötigen eine Einrichtungsanleitung für Baidu Qianfan
summary: Die einheitliche API von Qianfan verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T12:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan-Provider-Anleitung

Qianfan ist die MaaS-Plattform von Baidu und bietet eine **einheitliche API**, die Anfragen über einen einzelnen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI-SDKs durch Umstellen der Base URL funktionieren.

## Voraussetzungen

1. Ein Baidu-Cloud-Konto mit Qianfan-API-Zugriff
2. Ein API-Schlüssel aus der Qianfan-Konsole
3. Auf Ihrem System installiertes OpenClaw

## Ihren API-Schlüssel erhalten

1. Öffnen Sie die [Qianfan-Konsole](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Erstellen Sie eine neue Anwendung oder wählen Sie eine vorhandene aus
3. Generieren Sie einen API-Schlüssel (Format: `bce-v3/ALTAK-...`)
4. Kopieren Sie den API-Schlüssel zur Verwendung mit OpenClaw

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Konfigurations-Snippet

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Hinweise

- Standardmäßig gebündelte Modellreferenz: `qianfan/deepseek-v3.2`
- Standard-Base-URL: `https://qianfan.baidubce.com/v2`
- Der gebündelte Katalog enthält derzeit `deepseek-v3.2` und `ernie-5.0-thinking-preview`
- Fügen Sie `models.providers.qianfan` nur hinzu oder überschreiben Sie es nur dann, wenn Sie eine benutzerdefinierte Base URL oder benutzerdefinierte Modellmetadaten benötigen
- Qianfan läuft über den OpenAI-kompatiblen Transportpfad, nicht über natives nur-für-OpenAI Request-Shaping

## Verwandte Dokumentation

- [OpenClaw-Konfiguration](/de/gateway/configuration)
- [Modell-Provider](/de/concepts/model-providers)
- [Agent-Einrichtung](/de/concepts/agent)
- [Qianfan-API-Dokumentation](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
