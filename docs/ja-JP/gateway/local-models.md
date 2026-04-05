---
read_when:
    - 自分のGPUマシンからモデルを提供したい場合
    - LM StudioやOpenAI互換プロキシを接続している場合
    - 最も安全なローカルモデル運用ガイダンスが必要な場合
summary: ローカルLLMでOpenClawを動かす方法（LM Studio、vLLM、LiteLLM、カスタムOpenAI互換エンドポイント）
title: Local Models
x-i18n:
    generated_at: "2026-04-05T12:44:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Local Models

ローカル運用は可能ですが、OpenClawは大きなコンテキストと、プロンプトインジェクションに対する強力な防御を前提としています。小規模なGPUではコンテキストが切り詰められ、安全性が損なわれます。高い水準を目指してください: **最大構成のMac Studio 2台以上、または同等のGPUリグ（約$30k以上）**。単体の**24 GB** GPUで動かせるのは、より軽いプロンプトを高いレイテンシで扱う場合に限られます。実行可能な範囲で**最大 / フルサイズのモデルバリアント**を使ってください。強い量子化を施した、または「small」なチェックポイントは、プロンプトインジェクションのリスクを高めます（[Security](/gateway/security) を参照）。

最も手間の少ないローカル構成を望むなら、まず [Ollama](/providers/ollama) と `openclaw onboard` から始めてください。このページは、より上位のローカルスタックとカスタムOpenAI互換ローカルサーバー向けの、方針を明確にしたガイドです。

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカルスタックです。LM Studioで大規模モデル（たとえばフルサイズのQwen、DeepSeek、またはLlamaビルド）を読み込み、ローカルサーバー（デフォルトは `http://127.0.0.1:1234`）を有効にし、推論を最終テキストから分離するためにResponses APIを使ってください。

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**セットアップチェックリスト**

- LM Studioをインストール: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studioで、**利用可能な中で最大のモデルビルド**をダウンロードし（「small」や強く量子化されたバリアントは避けてください）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` にそれが表示されることを確認します。
- `my-local-model` を、LM Studioに表示される実際のモデルIDに置き換えます。
- モデルは読み込んだままにしてください。コールドロードは起動レイテンシを増やします。
- LM Studioのビルドが異なる場合は、`contextWindow` と `maxTokens` を調整します。
- WhatsAppでは、最終テキストだけが送信されるようにResponses APIを使ってください。

ローカル運用中でもホスト型モデルは設定したままにしてください。`models.mode: "merge"` を使うと、フォールバックを利用可能なままにできます。

### ハイブリッド構成: ホスト型を主要、ローカルをフォールバック

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### ローカル優先で、ホスト型を安全網にする

主要とフォールバックの順序を入れ替えてください。SonnetやOpusへフォールバックできるよう、同じprovidersブロックと `models.mode: "merge"` を維持します。これにより、ローカルマシンが停止していても対応できます。

### リージョン別ホスティング / データルーティング

- ホスト型のMiniMax/Kimi/GLMバリアントは、リージョン固定エンドポイント（例: USホスト）付きでOpenRouter上にも存在します。そこではリージョン別バリアントを選ぶことで、`models.mode: "merge"` を維持しつつAnthropic/OpenAIフォールバックも使いながら、トラフィックを選択した法域内に留められます。
- プライバシー面ではローカル専用が最も強力です。ホスト型のリージョンルーティングは、プロバイダー機能が必要だがデータフローを制御したい場合の中間案です。

## その他のOpenAI互換ローカルプロキシ

vLLM、LiteLLM、OAI-proxy、またはカスタムGatewayは、OpenAI形式の `/v1` エンドポイントを公開していれば動作します。上記のproviderブロックを、自分のエンドポイントとモデルIDに置き換えてください。

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

ホスト型モデルをフォールバックとして利用可能なままにするため、`models.mode: "merge"` を維持してください。

ローカル / プロキシの `/v1` バックエンドに関する挙動メモ:

- OpenClawは、これらをネイティブな
  OpenAIエンドポイントではなく、プロキシ形式のOpenAI互換ルートとして扱います
- ここではOpenAI専用のネイティブなリクエスト整形は適用されません: `service_tier` なし、Responsesの `store` なし、OpenAI推論互換のpayload整形なし、プロンプトキャッシュヒントなし
- カスタムプロキシURLには、隠しのOpenClaw attributionヘッダー（`originator`, `version`, `User-Agent`）は注入されません

## トラブルシューティング

- Gatewayからそのプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`
- LM Studioのモデルがアンロードされていませんか？ 再読み込みしてください。コールドスタートは「応答が止まっている」ように見える一般的な原因です。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー側の上限を引き上げてください。
- 安全性: ローカルモデルはプロバイダー側フィルターを通りません。プロンプトインジェクションの影響範囲を抑えるため、エージェントの役割は狭く保ち、compactionは有効にしておいてください。
