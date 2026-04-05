---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) oder Kimi Coding einrichten
    - Sie müssen separate Endpunkte, Schlüssel und Model-Referenzen verstehen
    - Sie möchten eine Copy-and-paste-Konfiguration für einen der beiden Provider
summary: Moonshot K2 vs. Kimi Coding konfigurieren (separate Provider + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T12:53:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot stellt die Kimi-API mit OpenAI-kompatiblen Endpunkten bereit. Konfigurieren Sie den
Provider und setzen Sie das Standard-Model auf `moonshot/kimi-k2.5`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-code`.

Aktuelle Kimi-K2-Model-IDs:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# oder
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Hinweis: Moonshot und Kimi Coding sind separate Provider. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich, und Model-Referenzen unterscheiden sich ebenfalls (Moonshot verwendet `moonshot/...`, Kimi Coding verwendet `kimi/...`).

Die Kimi-Websuche verwendet ebenfalls das Moonshot-Plugin:

```bash
openclaw configure --section web
```

Wählen Sie im Abschnitt zur Websuche **Kimi** aus, um
`plugins.entries.moonshot.config.webSearch.*` zu speichern.

## Konfigurationsausschnitt (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
          {
            id: "kimi-k2-turbo",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 16384,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: {
        "kimi/kimi-code": { alias: "Kimi" },
      },
    },
  },
}
```

## Kimi-Websuche

OpenClaw liefert **Kimi** auch als `web_search`-Provider aus, unterstützt durch die Moonshot-Websuche.

Beim interaktiven Setup kann abgefragt werden:

- die Moonshot-API-Region:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- das Standard-Model für die Kimi-Websuche (Standard ist `kimi-k2.5`)

Die Konfiguration liegt unter `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oder KIMI_API_KEY / MOONSHOT_API_KEY verwenden
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Hinweise

- Moonshot-Model-Referenzen verwenden `moonshot/<modelId>`. Kimi-Coding-Model-Referenzen verwenden `kimi/<modelId>`.
- Die aktuelle Standard-Model-Referenz für Kimi Coding ist `kimi/kimi-code`. Das veraltete `kimi/k2p5` wird weiterhin als kompatible Model-ID akzeptiert.
- Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und verwendet standardmäßig `https://api.moonshot.ai/v1` mit dem Model `kimi-k2.5`.
- Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
  `https://api.moonshot.cn/v1`) deklarieren Kompatibilität mit Streaming-Usage auf dem
  gemeinsamen Transport `openai-completions`. OpenClaw richtet dies jetzt nach den Endpunkt-
  Fähigkeiten aus, sodass kompatible benutzerdefinierte Provider-IDs, die dieselben nativen
  Moonshot-Hosts ansprechen, dasselbe Streaming-Usage-Verhalten übernehmen.
- Überschreiben Sie Preis- und Kontextmetadaten in `models.providers`, falls erforderlich.
- Wenn Moonshot für ein Model andere Kontextgrenzen veröffentlicht, passen Sie
  `contextWindow` entsprechend an.
- Verwenden Sie `https://api.moonshot.ai/v1` für den internationalen Endpunkt und `https://api.moonshot.cn/v1` für den Endpunkt in China.
- Onboarding-Optionen:
  - `moonshot-api-key` für `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` für `https://api.moonshot.cn/v1`

## Nativer Thinking-Modus (Moonshot)

Moonshot Kimi unterstützt binäres natives Thinking:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Konfigurieren Sie dies pro Model über `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw bildet für Moonshot auch Runtime-`/think`-Level ab:

- `/think off` -> `thinking.type=disabled`
- jedes Thinking-Level ungleich off -> `thinking.type=enabled`

Wenn Moonshot-Thinking aktiviert ist, muss `tool_choice` `auto` oder `none` sein. OpenClaw normalisiert aus Kompatibilitätsgründen inkompatible `tool_choice`-Werte zu `auto`.
