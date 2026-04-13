---
read_when:
    - 自分のGPUマシンからモデルを提供したい場合
    - LM StudioまたはOpenAI互換プロキシを接続している場合
    - 最も安全なローカルモデルのガイダンスが必要な場合
summary: ローカルLLM（LM Studio、vLLM、LiteLLM、カスタムOpenAIエンドポイント）でOpenClawを実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-13T08:50:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecb61b3e6e34d3666f9b688cd694d92c5fb211cf8c420fa876f7ccf5789154a
    source_path: gateway/local-models.md
    workflow: 15
---

# ローカルモデル

ローカルでも利用できますが、OpenClawは大きなコンテキストと、プロンプトインジェクションに対する強力な防御を前提としています。小規模なGPUではコンテキストが切り詰められ、安全性も損なわれます。目安としては、**最大構成のMac Studioを2台以上、または同等のGPUリグ（約3万ドル以上）** を推奨します。単一の**24 GB** GPUでも、より軽いプロンプトなら動作しますが、レイテンシは高くなります。実行可能な中で**最大 / フルサイズのモデルバリアント**を使ってください。強く量子化されたチェックポイントや「small」モデルは、プロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security)を参照）。

最も手間の少ないローカル構成を望むなら、まずは [LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。このページは、より高性能なローカルスタックと、カスタムのOpenAI互換ローカルサーバー向けの実践的ガイドです。

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカル構成です。LM Studioで大規模モデル（たとえば、フルサイズのQwen、DeepSeek、またはLlamaビルド）を読み込み、ローカルサーバー（デフォルトは `http://127.0.0.1:1234`）を有効にして、Responses APIを使い、推論を最終テキストから分離してください。

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
- LM Studioで、利用可能な中で**最大のモデルビルド**をダウンロードし（「small」や強く量子化されたバリアントは避けてください）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` に一覧表示されることを確認します。
- `my-local-model` を、LM Studioに表示される実際のモデルIDに置き換えます。
- モデルを読み込んだままにしてください。コールドロードは起動時レイテンシを追加します。
- LM Studioのビルドに応じて `contextWindow` / `maxTokens` を調整します。
- WhatsAppでは、最終テキストだけが送信されるよう、Responses APIを使ってください。

ローカルで実行する場合でも、ホスト型モデルは設定したままにしてください。フォールバックを利用できるように、`models.mode: "merge"` を使います。

### ハイブリッド構成: ホスト型をプライマリ、ローカルをフォールバック

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

### ローカル優先 + ホスト型の安全網

プライマリとフォールバックの順序を入れ替えてください。ローカル環境が停止したときにSonnetやOpusへフォールバックできるよう、同じprovidersブロックと `models.mode: "merge"` を維持します。

### リージョナルホスティング / データルーティング

- ホスト型のMiniMax / Kimi / GLMバリアントは、リージョン固定エンドポイント（例: USホスト）付きでOpenRouter上でも利用できます。そこではリージョナルバリアントを選ぶことで、`models.mode: "merge"` を使ってAnthropic/OpenAIのフォールバックを維持しつつ、トラフィックを選択した法域内に留められます。
- ローカル専用構成が、プライバシーの面では最も強力です。ホスト型のリージョナルルーティングは、プロバイダー機能が必要だがデータフローも制御したい場合の中間案です。

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

ホスト型モデルをフォールバックとして利用できるよう、`models.mode: "merge"` を維持してください。

ローカル / プロキシ `/v1` バックエンドに関する動作メモ:

- OpenClawはこれらを、ネイティブなOpenAIエンドポイントではなく、プロキシ形式のOpenAI互換ルートとして扱います
- そのため、OpenAIネイティブ専用のリクエスト整形はここでは適用されません: `service_tier` なし、Responsesの `store` なし、OpenAIのreasoning互換ペイロード整形なし、プロンプトキャッシュヒントなし
- 非表示のOpenClaw属性ヘッダー（`originator`, `version`, `User-Agent`）は、これらのカスタムプロキシURLには挿入されません

より厳格なOpenAI互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completionsで構造化されたcontent-part配列ではなく、文字列の `messages[].content` のみを受け付けます。そのようなエンドポイントでは、`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- より小規模または厳格なローカルバックエンドの中には、特にツールスキーマが含まれる場合、OpenClawの完全なagent-runtimeプロンプト形状で不安定になるものがあります。小さな直接 `/v1/chat/completions` 呼び出しでは動作しても、通常のOpenClaw agentターンでは失敗する場合は、まず `models.providers.<provider>.models[].compat.supportsTools: false` を試してください。
- それでも大きなOpenClaw実行時にのみバックエンドが失敗する場合、残っている問題は通常、OpenClawのトランスポート層ではなく、上流のモデル / サーバー容量、またはバックエンドのバグです。

## トラブルシューティング

- Gatewayはプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`
- LM Studioのモデルはアンロードされていませんか？ 再読み込みしてください。コールドスタートは「固まって見える」一般的な原因です。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー側の上限を引き上げてください。
- OpenAI互換サーバーが `messages[].content ... expected a string` を返しますか？ そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 直接の小さな `/v1/chat/completions` 呼び出しは動作するのに、`openclaw infer model run` がGemmaや他のローカルモデルで失敗しますか？ まず `compat.supportsTools: false` でツールスキーマを無効化し、その後で再テストしてください。それでも大きなOpenClawプロンプトでのみサーバーがクラッシュするなら、上流のサーバー / モデルの制限として扱ってください。
- 安全性: ローカルモデルではプロバイダー側のフィルターが適用されません。プロンプトインジェクションの影響範囲を抑えるため、agentは限定的に保ち、Compactionを有効にしてください。
