---
read_when:
    - 多くのLLMに対して単一のAPIキーを使いたい場合
    - Baidu Qianfanのセットアップガイダンスが必要な場合
summary: OpenClawでQianfanの統合APIを使って多数のモデルにアクセスする
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T12:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfanプロバイダーガイド

QianfanはBaiduのMaaSプラットフォームであり、単一の
エンドポイントとAPIキーの背後で多くのモデルにリクエストをルーティングする**統合API**を提供します。これはOpenAI互換なので、ほとんどのOpenAI SDKはbase URLを切り替えるだけで動作します。

## 前提条件

1. Qianfan APIアクセスを持つBaidu Cloudアカウント
2. QianfanコンソールのAPIキー
3. システムにインストールされたOpenClaw

## APIキーの取得

1. [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) にアクセスします
2. 新しいアプリケーションを作成するか、既存のものを選択します
3. APIキー（形式: `bce-v3/ALTAK-...`）を生成します
4. OpenClawで使用するためにAPIキーをコピーします

## CLIセットアップ

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 設定スニペット

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

## 注記

- デフォルトの同梱モデル参照: `qianfan/deepseek-v3.2`
- デフォルトbase URL: `https://qianfan.baidubce.com/v2`
- 現在の同梱catalogには `deepseek-v3.2` と `ernie-5.0-thinking-preview` が含まれます
- カスタムbase URLまたはモデルメタデータが必要な場合にのみ `models.providers.qianfan` を追加または上書きしてください
- Qianfanは、ネイティブOpenAIリクエスト整形ではなく、OpenAI互換トランスポート経路で動作します

## 関連ドキュメント

- [OpenClaw Configuration](/gateway/configuration)
- [Model Providers](/concepts/model-providers)
- [Agent Setup](/concepts/agent)
- [Qianfan API Documentation](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
