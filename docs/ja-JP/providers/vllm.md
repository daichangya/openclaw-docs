---
read_when:
    - ローカルの vLLM サーバーに対して OpenClaw を実行したい場合
    - 自分のモデルで OpenAI 互換の `/v1` endpoint を使いたい場合
summary: vLLM（OpenAI 互換ローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-04-05T12:54:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

title: "vLLM"
summary: "vLLM（OpenAI 互換ローカルサーバー）で OpenClaw を実行する"
read_when:

- ローカルの vLLM サーバーに対して OpenClaw を実行したい場合
- 自分のモデルで OpenAI 互換の `/v1` endpoint を使いたい場合

# vLLM

vLLM は、**OpenAI 互換** の HTTP API を通じて、オープンソース（および一部のカスタム）モデルを提供できます。OpenClaw は、`openai-completions` API を使用して vLLM に接続できます。

OpenClaw は、`VLLM_API_KEY` を指定してオプトインし、かつ明示的な `models.providers.vllm` エントリーを定義していない場合、vLLM から利用可能なモデルを **自動検出** することもできます（サーバーで auth を強制していなければ任意の値で動作します）。

## クイックスタート

1. OpenAI 互換サーバーで vLLM を起動します。

base URL では `/v1` endpoint（例: `/v1/models`, `/v1/chat/completions`）が公開されている必要があります。vLLM は一般に次で実行されます:

- `http://127.0.0.1:8000/v1`

2. オプトインします（auth が設定されていなければ任意の値で動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

3. モデルを選択します（あなたの vLLM モデル ID の 1 つに置き換えてください）:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## モデル検出（暗黙的 provider）

`VLLM_API_KEY` が設定されている（または auth profile が存在する）状態で、**`models.providers.vllm` を定義していない** 場合、OpenClaw は次を問い合わせます:

- `GET http://127.0.0.1:8000/v1/models`

…そして返された ID をモデルエントリーに変換します。

`models.providers.vllm` を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。

## 明示的な設定（手動モデル）

明示的な config を使うのは次のような場合です:

- vLLM が別の host/port で動作している
- `contextWindow` / `maxTokens` の値を固定したい
- サーバーが実際の API キーを必要とする（または header を制御したい）

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

- サーバーに到達できることを確認します:

```bash
curl http://127.0.0.1:8000/v1/models
```

- auth エラーでリクエストが失敗する場合は、サーバー設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` 配下で provider を明示的に設定してください。

## proxy スタイルの動作

vLLM は、ネイティブな OpenAI endpoint ではなく、proxy スタイルの OpenAI 互換 `/v1` backend として扱われます。

- ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません
- `service_tier`、Responses の `store`、prompt cache ヒント、OpenAI reasoning 互換ペイロード整形はありません
- 非公開の OpenClaw attribution header（`originator`, `version`, `User-Agent`）は、カスタム vLLM base URL には注入されません
