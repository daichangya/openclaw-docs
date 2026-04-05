---
read_when:
    - Bedrock MantleがホストするOSSモデルをOpenClawで使いたい場合
    - GPT-OSS、Qwen、Kimi、またはGLM向けにMantleのOpenAI互換エンドポイントが必要な場合
summary: OpenClawでAmazon Bedrock Mantle（OpenAI互換）モデルを使用する
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T12:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClawには、MantleのOpenAI互換エンドポイントへ接続する、バンドル済みの**Amazon Bedrock Mantle**プロバイダーが含まれています。Mantleは、Bedrockインフラを基盤とする標準的な`/v1/chat/completions`サーフェスを通じて、オープンソースおよびサードパーティモデル（GPT-OSS、Qwen、Kimi、GLMなど）をホストします。

## OpenClawがサポートする内容

- プロバイダー: `amazon-bedrock-mantle`
- API: `openai-completions`（OpenAI互換）
- 認証: `AWS_BEARER_TOKEN_BEDROCK`によるbearer token
- リージョン: `AWS_REGION`または`AWS_DEFAULT_REGION`（デフォルト: `us-east-1`）

## 自動モデル検出

`AWS_BEARER_TOKEN_BEDROCK`が設定されている場合、OpenClawは、そのリージョンの`/v1/models`エンドポイントへクエリを送ることで、利用可能なMantleモデルを自動検出します。検出結果は1時間キャッシュされます。

サポートされるリージョン: `us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## オンボーディング

1. **gateway host**上でbearer tokenを設定します:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# 任意（デフォルトはus-east-1）:
export AWS_REGION="us-west-2"
```

2. モデルが検出されることを確認します:

```bash
openclaw models list
```

検出されたモデルは`amazon-bedrock-mantle`プロバイダー配下に表示されます。デフォルトを上書きしたい場合を除き、追加設定は不要です。

## 手動設定

自動検出ではなく明示的な設定を使いたい場合:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 注記

- Mantleは現時点でbearer tokenを必要とします。トークンなしの通常のIAM認証情報（instance roles、SSO、access keys）だけでは不十分です。
- このbearer tokenは、標準の[Amazon Bedrock](/providers/bedrock)プロバイダーで使用する`AWS_BEARER_TOKEN_BEDROCK`と同じです。
- reasoningサポートは、`thinking`、`reasoner`、`gpt-oss-120b`のようなパターンを含むモデルIDから推測されます。
- Mantleエンドポイントが利用できない場合、またはモデルを返さない場合、そのプロバイダーは黙ってスキップされます。
