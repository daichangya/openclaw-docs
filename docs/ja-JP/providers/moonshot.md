---
read_when:
    - Moonshot K2（Moonshot Open Platform）とKimi Codingのセットアップを行いたいとき
    - 別々のendpoint、key、model refを理解する必要があるとき
    - どちらのprovider向けにもコピー&ペースト可能なconfigが欲しいとき
summary: Moonshot K2とKimi Codingを設定する（別々のprovider + keys）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T12:54:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshotは、OpenAI互換endpointを持つKimi APIを提供しています。providerを設定し、
デフォルトmodelを `moonshot/kimi-k2.5` に設定するか、
`kimi/kimi-code` でKimi Codingを使用してください。

現在のKimi K2 model ID:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# または
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

注: MoonshotとKimi Codingは別々のproviderです。keyに互換性はなく、endpointも異なり、model refも異なります（Moonshotは `moonshot/...`、Kimi Codingは `kimi/...` を使用）。

Kimi web searchもMoonshot pluginを使います:

```bash
openclaw configure --section web
```

web-searchセクションで **Kimi** を選択すると、
`plugins.entries.moonshot.config.webSearch.*` が保存されます。

## Config snippet（Moonshot API）

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

## Kimi web search

OpenClawには、Moonshot web
searchをバックエンドとする `web_search` providerとして **Kimi** も同梱されています。

対話型セットアップでは、次を尋ねることがあります:

- Moonshot APIリージョン:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- デフォルトのKimi web-search model（デフォルトは `kimi-k2.5`）

configは `plugins.entries.moonshot.config.webSearch` 配下にあります:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // または KIMI_API_KEY / MOONSHOT_API_KEY を使用
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

## 注

- Moonshotのmodel refは `moonshot/<modelId>` を使用します。Kimi Codingのmodel refは `kimi/<modelId>` を使用します。
- 現在のKimi Codingデフォルトmodel refは `kimi/kimi-code` です。レガシーの `kimi/k2p5` も互換model idとして引き続き受け付けられます。
- Kimi web searchは `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトでは `https://api.moonshot.ai/v1` と model `kimi-k2.5` を使います。
- ネイティブのMoonshot endpoint（`https://api.moonshot.ai/v1` および
  `https://api.moonshot.cn/v1`）は、
  共有 `openai-completions` transport上でstreaming usage compatibilityを公開します。OpenClawは現在これをendpoint capabilityに基づいて判定するため、同じネイティブ
  Moonshot hostを対象とする互換custom provider idも、同じstreaming-usage動作を継承します。
- 必要に応じて、`models.providers` で料金およびcontext metadataを上書きしてください。
- Moonshotがあるmodelに対して異なるcontext limitを公開している場合は、
  `contextWindow` を適宜調整してください。
- 国際endpointには `https://api.moonshot.ai/v1` を、中国endpointには `https://api.moonshot.cn/v1` を使用してください。
- Onboardingの選択肢:
  - `https://api.moonshot.ai/v1` 用の `moonshot-api-key`
  - `https://api.moonshot.cn/v1` 用の `moonshot-api-key-cn`

## Native thinking mode（Moonshot）

Moonshot Kimiはバイナリのnative thinkingをサポートします:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

modelごとに `agents.defaults.models.<provider/model>.params` 経由で設定してください:

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

OpenClawは、Moonshot向けのランタイム `/think` レベルもマッピングします:

- `/think off` -> `thinking.type=disabled`
- off以外の任意のthinking level -> `thinking.type=enabled`

Moonshot thinkingが有効な場合、`tool_choice` は `auto` または `none` である必要があります。OpenClawは、互換性のために非互換な `tool_choice` 値を `auto` に正規化します。
