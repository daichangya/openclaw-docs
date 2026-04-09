---
read_when:
    - ローカルのinferrsサーバーに対してOpenClawを実行したい
    - inferrs経由でGemmaまたは別のモデルを配信している
    - inferrs向けの正確なOpenClaw互換フラグが必要
summary: inferrs（OpenAI互換のローカルサーバー）経由でOpenClawを実行する
title: inferrs
x-i18n:
    generated_at: "2026-04-09T01:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03b9d5a9935c75fd369068bacb7807a5308cd0bd74303b664227fb664c3a2098
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs)は、OpenAI互換の
`/v1` APIの背後でローカルモデルを配信できます。OpenClawは`inferrs`と
汎用の`openai-completions`経路を通じて連携します。

現在の`inferrs`は、専用のOpenClawプロバイダープラグインではなく、
カスタムの自己ホスト型OpenAI互換バックエンドとして扱うのが最適です。

## クイックスタート

1. モデルを指定して`inferrs`を起動します。

例:

```bash
inferrs serve google/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. サーバーに到達できることを確認します。

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. 明示的なOpenClawプロバイダー項目を追加し、デフォルトモデルをそれに向けます。

## 完全な設定例

この例では、ローカルの`inferrs`サーバー上のGemma 4を使用します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## `requiresStringContent`が重要な理由

一部の`inferrs` Chat Completionsルートは、構造化されたcontent-part配列ではなく、
文字列の`messages[].content`だけを受け付けます。

OpenClaw実行時に次のようなエラーが出る場合:

```text
messages[1].content: invalid type: sequence, expected a string
```

次を設定してください:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClawは、リクエスト送信前に、純粋なテキストcontent partを
通常の文字列へフラット化します。

## Gemmaとtool-schemaの注意点

現在の一部の`inferrs` + Gemmaの組み合わせでは、小さな直接
`/v1/chat/completions`リクエストは受け付けても、完全なOpenClaw agent-runtime
ターンでは失敗することがあります。

その場合は、まず次を試してください:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

これにより、そのモデルに対するOpenClawのtool schemaサーフェスが無効になり、
厳しめのローカルバックエンドにかかるプロンプト負荷を減らせることがあります。

小さな直接リクエストが引き続き動作する一方で、通常のOpenClaw agentターンが
`inferrs`内部で引き続きクラッシュする場合、残っている問題は通常、
OpenClawのトランスポート層ではなく上流のモデル/サーバーの動作です。

## 手動スモークテスト

設定後は、両方のレイヤーをテストしてください:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/google/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

最初のコマンドは成功するのに2つ目が失敗する場合は、以下の
トラブルシューティングメモを使用してください。

## トラブルシューティング

- `curl /v1/models`が失敗する: `inferrs`が起動していない、到達できない、または
  想定したhost/portにbindされていません。
- `messages[].content ... expected a string`: 
  `compat.requiresStringContent: true`を設定してください。
- 直接の小さな`/v1/chat/completions`呼び出しは通るが、`openclaw infer model run`
  が失敗する: `compat.supportsTools: false`を試してください。
- OpenClawでschemaエラーは出なくなったが、`inferrs`がより大きい
  agentターンで引き続きクラッシュする: 上流の`inferrs`またはモデルの制限として扱い、
  プロンプト負荷を下げるか、別のローカルバックエンド/モデルに切り替えてください。

## プロキシ風の動作

`inferrs`は、ネイティブのOpenAIエンドポイントではなく、
プロキシ風のOpenAI互換`/v1`バックエンドとして扱われます。

- ネイティブOpenAI専用のリクエスト整形はここでは適用されません
- `service_tier`、Responsesの`store`、prompt-cacheヒント、OpenAIの
  reasoning互換ペイロード整形はありません
- 隠しOpenClaw属性ヘッダー（`originator`、`version`、`User-Agent`）は、
  カスタム`inferrs` base URLには注入されません

## 関連項目

- [Local models](/ja-JP/gateway/local-models)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Model providers](/ja-JP/concepts/model-providers)
