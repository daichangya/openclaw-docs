---
read_when:
    - 自分のGPUマシンからモデルを提供したい場合
    - LM StudioまたはOpenAI互換プロキシを設定している場合
    - 最も安全なローカルモデルのガイダンスが必要な場合
summary: OpenClawをローカルLLM（LM Studio、vLLM、LiteLLM、カスタムOpenAIエンドポイント）で実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-14T13:04:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1544c522357ba4b18dfa6d05ea8d60c7c6262281b53863d9aee7002464703ca7
    source_path: gateway/local-models.md
    workflow: 15
---

# ローカルモデル

ローカル運用は可能ですが、OpenClawは大きなコンテキストと強力なプロンプトインジェクション耐性を前提としています。小規模なカードではコンテキストが切り詰められ、安全性も低下します。目標は高く設定してください: **最大構成のMac Studioを2台以上、または同等のGPUリグ（約$30k以上）**。単一の**24 GB** GPUで動かせるのは、より軽いプロンプトに限られ、レイテンシも高くなります。実行可能な中で**最大 / フルサイズのモデルバリアント**を使ってください。強く量子化された、または「small」なチェックポイントは、プロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security)を参照）。

最も手間の少ないローカルセットアップを望むなら、[LM Studio](/ja-JP/providers/lmstudio)または[Ollama](/ja-JP/providers/ollama)から始めて、`openclaw onboard`を実行してください。このページは、より高性能なローカルスタックやカスタムのOpenAI互換ローカルサーバー向けの、方針を明確にしたガイドです。

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最適なローカルスタックです。LM Studioに大規模モデル（たとえばフルサイズのQwen、DeepSeek、Llamaビルド）を読み込み、ローカルサーバー（デフォルトは`http://127.0.0.1:1234`）を有効にし、推論を最終テキストから分離するためにResponses APIを使用します。

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
- LM Studioで、**利用可能な中で最大のモデルビルド**をダウンロードし（「small」や強い量子化バリアントは避ける）、サーバーを起動して、`http://127.0.0.1:1234/v1/models`に一覧表示されることを確認します。
- `my-local-model`を、LM Studioに表示されている実際のモデルIDに置き換えます。
- モデルは読み込んだままにしてください。コールドロードは起動レイテンシを増やします。
- LM Studioのビルドに応じて`contextWindow`と`maxTokens`を調整します。
- WhatsAppでは、最終テキストだけが送信されるよう、Responses APIを使ってください。

ローカル運用時でもホスト型モデルは設定しておいてください。`models.mode: "merge"`を使えば、フォールバックを利用可能なままにできます。

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

### ローカル優先、ホスト型をセーフティネットにする構成

プライマリとフォールバックの順序を入れ替えてください。`providers`ブロックと`models.mode: "merge"`はそのまま維持し、ローカルマシンが停止しているときにSonnetやOpusへフォールバックできるようにします。

### リージョナルホスティング / データルーティング

- ホスト型のMiniMax/Kimi/GLMバリアントは、リージョン固定エンドポイント（例: USホスト）付きでOpenRouter上にも存在します。そこでリージョナルバリアントを選べば、`models.mode: "merge"`を使ったAnthropic/OpenAIフォールバックを維持しながら、トラフィックを選択した法域内にとどめられます。
- ローカル専用は依然として最も強いプライバシー手段です。ホスト型のリージョナルルーティングは、プロバイダー機能が必要だがデータフローも制御したい場合の中間的な選択肢です。

## その他のOpenAI互換ローカルプロキシ

vLLM、LiteLLM、OAI-proxy、またはカスタムGatewayでも、OpenAI形式の`/v1`エンドポイントを公開していれば動作します。上記のプロバイダーブロックを、利用するエンドポイントとモデルIDに置き換えてください。

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

ホスト型モデルをフォールバックとして引き続き使えるように、`models.mode: "merge"`を維持してください。

ローカル / プロキシされた`/v1`バックエンドの動作に関する注意:

- OpenClawはこれらを、ネイティブなOpenAIエンドポイントではなく、プロキシ型のOpenAI互換ルートとして扱います
- ここではOpenAIネイティブ専用のリクエスト整形は適用されません: `service_tier`、Responsesの`store`、OpenAI reasoning互換ペイロード整形、プロンプトキャッシュヒントは使われません
- 隠しOpenClaw属性ヘッダー（`originator`、`version`、`User-Agent`）は、これらのカスタムプロキシURLには挿入されません

より厳格なOpenAI互換バックエンド向けの互換性に関する注意:

- 一部のサーバーは、Chat Completionsで構造化コンテンツパート配列ではなく、文字列の`messages[].content`しか受け付けません。そのようなエンドポイントでは、`models.providers.<provider>.models[].compat.requiresStringContent: true`を設定してください。
- 一部の小規模または厳格なローカルバックエンドは、特にツールスキーマが含まれる場合、OpenClawの完全なエージェントランタイム用プロンプト形状では不安定です。バックエンドが小さな直接`/v1/chat/completions`呼び出しでは動作しても、通常のOpenClawエージェントターンで失敗する場合は、まず`models.providers.<provider>.models[].compat.supportsTools: false`を試してください。
- それでも大きめのOpenClaw実行時にのみバックエンドが失敗する場合、残る問題は通常、OpenClawのトランスポート層ではなく、上流のモデル / サーバー容量またはバックエンドのバグです。

## トラブルシューティング

- Gatewayはプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`
- LM Studioのモデルがアンロードされていますか？ 再読み込みしてください。コールドスタートは「ハングしている」ように見える一般的な原因です。
- 検出されたコンテキストウィンドウが**32k**未満の場合、OpenClawは警告を出し、**16k**未満ではブロックします。その事前チェックに引っかかった場合は、サーバー / モデルのコンテキスト上限を引き上げるか、より大きなモデルを選んでください。
- コンテキストエラーですか？ `contextWindow`を下げるか、サーバー上限を引き上げてください。
- OpenAI互換サーバーが`messages[].content ... expected a string`を返しますか？ そのモデルエントリーに`compat.requiresStringContent: true`を追加してください。
- 小さな直接`/v1/chat/completions`呼び出しは動作するのに、`openclaw infer model run`がGemmaや他のローカルモデルで失敗しますか？ まず`compat.supportsTools: false`でツールスキーマを無効にしてから再テストしてください。それでも大きめのOpenClawプロンプトでのみサーバーがクラッシュする場合は、上流のサーバー / モデルの制限として扱ってください。
- 安全性: ローカルモデルはプロバイダー側フィルターを通りません。プロンプトインジェクションの影響範囲を制限するため、エージェントは用途を絞り、Compactionを有効にしてください。
