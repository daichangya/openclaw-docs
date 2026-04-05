---
read_when:
    - ローカルのSGLang serverに対してOpenClawを実行したいとき
    - 自分のmodelでOpenAI互換の `/v1` endpointを使いたいとき
summary: SGLang（OpenAI互換のセルフホストserver）でOpenClawを実行する
title: SGLang
x-i18n:
    generated_at: "2026-04-05T12:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLangは、**OpenAI互換** HTTP API経由でオープンソースmodelを提供できます。
OpenClawは `openai-completions` APIを使ってSGLangへ接続できます。

またOpenClawは、`SGLANG_API_KEY` でオプトインし、
明示的な `models.providers.sglang` 項目を定義していない場合、
SGLangから利用可能なmodelを**自動検出**できます（serverがauthを強制しないなら任意の値で動作します）。

## クイックスタート

1. OpenAI互換server付きでSGLangを起動します。

base URLは `/v1` endpoint（たとえば `/v1/models`,
`/v1/chat/completions`）を公開している必要があります。SGLangは一般に次で動作します:

- `http://127.0.0.1:30000/v1`

2. オプトインします（authが設定されていない場合は任意の値で動作）:

```bash
export SGLANG_API_KEY="sglang-local"
```

3. オンボーディングを実行して `SGLang` を選ぶか、直接modelを設定します:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Model discovery（暗黙provider）

`SGLANG_API_KEY` が設定されている（またはauth profileが存在する）状態で、
`models.providers.sglang` を**定義していない**場合、OpenClawは次を問い合わせます:

- `GET http://127.0.0.1:30000/v1/models`

そして返されたIDをmodel項目へ変換します。

`models.providers.sglang` を明示的に設定した場合、自動検出はスキップされ、
modelを手動で定義する必要があります。

## 明示的設定（手動model）

次の場合は明示的configを使ってください:

- SGLangが別のhost/portで動作している。
- `contextWindow`/`maxTokens` の値を固定したい。
- serverが実際のAPI keyを必要とする（またはheaderを制御したい）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## トラブルシューティング

- serverへ到達できるか確認します:

```bash
curl http://127.0.0.1:30000/v1/models
```

- auth errorでリクエストが失敗する場合は、server設定に一致する実際の `SGLANG_API_KEY` を設定するか、
  `models.providers.sglang` 配下でproviderを明示的に設定してください。

## Proxy-style動作

SGLangは、ネイティブなOpenAI endpointではなく、
proxy-styleのOpenAI互換 `/v1` backendとして扱われます。

- OpenAIネイティブ専用のrequest shapingはここでは適用されません
- `service_tier`、Responses `store`、prompt-cache hint、OpenAI reasoning互換payload shapingはありません
- 非表示のOpenClaw attribution header（`originator`, `version`, `User-Agent`）はcustom SGLang base URLには注入されません
