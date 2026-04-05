---
read_when:
    - OpenClawでプライバシー重視の推論を使いたい場合
    - Venice AIのセットアップガイダンスが欲しい場合
summary: OpenClawでVenice AIのプライバシー重視モデルを使う
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T12:55:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI（Veniceハイライト）

**Venice** は、独自モデルへの匿名化アクセスをオプションで備えた、プライバシーファースト推論向けの注目のVeniceセットアップです。

Venice AIは、検閲のないモデルのサポートと、匿名化プロキシ経由で主要な独自モデルへアクセスできる、プライバシー重視のAI推論を提供します。すべての推論はデフォルトで非公開です。あなたのデータで学習せず、ログも残しません。

## OpenClawでVeniceを使う理由

- オープンソースモデル向けの**プライベート推論**（ログなし）。
- 必要なときに使える**検閲なしモデル**。
- 品質が重要なときの、独自モデル（Opus/GPT/Gemini）への**匿名化アクセス**。
- OpenAI互換の `/v1` エンドポイント。

## プライバシーモード

Veniceは2つのプライバシーレベルを提供しています。どのモデルを選ぶかを決めるうえで、これを理解することが重要です。

| Mode           | Description                                                                                                                       | Models                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | 完全に非公開です。プロンプト/レスポンスは**保存もログ記録もされません**。エフェメラルです。                                         | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensoredなど   |
| **Anonymized** | Venice経由でプロキシされ、メタデータが除去されます。基盤のprovider（OpenAI、Anthropic、Google、xAI）は匿名化されたリクエストを受け取ります。 | Claude、GPT、Gemini、Grok                                     |

## 機能

- **プライバシー重視**: 「private」（完全非公開）と「anonymized」（プロキシ経由）から選択できます
- **検閲なしモデル**: コンテンツ制限のないモデルにアクセスできます
- **主要モデルへのアクセス**: Veniceの匿名化プロキシ経由でClaude、GPT、Gemini、Grokを利用できます
- **OpenAI互換API**: 簡単に統合できる標準の `/v1` エンドポイント
- **ストリーミング**: ✅ すべてのモデルでサポート
- **Function calling**: ✅ 一部のモデルでサポート（モデルのcapabilityを確認してください）
- **Vision**: ✅ Vision capabilityを持つモデルでサポート
- **厳格なレート制限なし**: 極端な利用ではfair-use throttlingが適用される場合があります

## セットアップ

### 1. API Keyを取得する

1. [venice.ai](https://venice.ai) で登録します
2. **Settings → API Keys → Create new key** に進みます
3. API keyをコピーします（形式: `vapi_xxxxxxxxxxxx`）

### 2. OpenClawを設定する

**オプションA: 環境変数**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**オプションB: 対話型セットアップ（推奨）**

```bash
openclaw onboard --auth-choice venice-api-key
```

これにより、次が行われます。

1. API keyの入力を求められます（または既存の `VENICE_API_KEY` を使用します）
2. 利用可能なVeniceモデルがすべて表示されます
3. デフォルトモデルを選べます
4. providerが自動で設定されます

**オプションC: 非対話型**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. セットアップを確認する

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## モデル選択

セットアップ後、OpenClawは利用可能なVeniceモデルをすべて表示します。用途に応じて選んでください。

- **デフォルトモデル**: 強力なプライベート推論とvisionを備えた `venice/kimi-k2-5`
- **高性能オプション**: 最も強力な匿名化Venice経路である `venice/claude-opus-4-6`
- **プライバシー**: 完全に非公開の推論には「private」モデルを選びます
- **機能性**: Veniceのプロキシ経由でClaude、GPT、Geminiにアクセスするには「anonymized」モデルを選びます

デフォルトモデルはいつでも変更できます。

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

利用可能なモデルを一覧表示するには:

```bash
openclaw models list | grep venice
```

## `openclaw configure` で設定する

1. `openclaw configure` を実行します
2. **Model/auth** を選択します
3. **Venice AI** を選択します

## どのモデルを使うべきか

| Use Case                   | Recommended Model                | Why                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **General chat (default)** | `kimi-k2-5`                      | 強力なプライベート推論とvisionを両立         |
| **Best overall quality**   | `claude-opus-4-6`                | 最も強力な匿名化Veniceオプション             |
| **Privacy + coding**       | `qwen3-coder-480b-a35b-instruct` | 大きなコンテキストを持つプライベートなcodingモデル |
| **Private vision**         | `kimi-k2-5`                      | private modeのままvisionを使える             |
| **Fast + cheap**           | `qwen3-4b`                       | 軽量なreasoningモデル                        |
| **Complex private tasks**  | `deepseek-v3.2`                  | 強力なreasoning。ただしVenice toolサポートなし |
| **Uncensored**             | `venice-uncensored`              | コンテンツ制限なし                           |

## 利用可能なモデル（合計41）

### Private Models（26）- 完全非公開、ログなし

| Model ID                               | Name                                | Context | Features                   |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k    | デフォルト、reasoning、vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | General                    |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | General                    |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | General、tools無効         |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | General                    |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning、vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | General                    |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | 高速、reasoning            |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning、tools無効       |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 検閲なし、tools無効        |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | General                    |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | General                    |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | General                    |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                  |

### Anonymized Models（15）- Veniceプロキシ経由

| Model ID                        | Name                           | Context | Features                  |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Reasoning、vision         |
| `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Reasoning、vision         |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Reasoning、vision         |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Reasoning、vision         |
| `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Reasoning、vision         |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Reasoning、vision、coding |
| `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Reasoning                 |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Reasoning、vision、coding |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Reasoning、vision         |
| `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Reasoning、vision         |
| `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Reasoning、vision         |
| `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Reasoning、vision         |
| `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Reasoning、coding         |

## モデルdiscovery

`VENICE_API_KEY` が設定されていると、OpenClawはVenice APIから自動的にモデルを検出します。APIへ到達できない場合は、静的catalogへフォールバックします。

`/models` エンドポイントは公開されています（一覧取得にauth不要）が、推論には有効なAPI keyが必要です。

## ストリーミングとtoolサポート

| Feature              | Support                                                  |
| -------------------- | -------------------------------------------------------- |
| **Streaming**        | ✅ すべてのモデル                                        |
| **Function calling** | ✅ ほとんどのモデル（API内の `supportsFunctionCalling` を確認） |
| **Vision/Images**    | ✅ 「Vision」featureが付いたモデル                       |
| **JSON mode**        | ✅ `response_format` 経由でサポート                      |

## 料金

Veniceはクレジットベースのシステムを使います。現在の料金は [venice.ai/pricing](https://venice.ai/pricing) を確認してください。

- **Private models**: 一般に低コスト
- **Anonymized models**: 直接API料金に近く、そこに少額のVenice料金が加わる

## 比較: Venice vs Direct API

| Aspect       | Venice (Anonymized)          | Direct API             |
| ------------ | ---------------------------- | ---------------------- |
| **Privacy**  | メタデータ除去、匿名化       | あなたのアカウントに紐付く |
| **Latency**  | +10-50ms（プロキシ）         | 直接                   |
| **Features** | ほとんどの機能をサポート     | 完全な機能             |
| **Billing**  | Venice credits               | Provider billing       |

## 使用例

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

### API keyが認識されない

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

keyが `vapi_` で始まっていることを確認してください。

### モデルが利用できない

Veniceのmodel catalogは動的に更新されます。現在利用可能なモデルを確認するには `openclaw models list` を実行してください。一部のモデルは一時的にオフラインの場合があります。

### 接続の問題

Venice APIは `https://api.venice.ai/api/v1` にあります。ネットワークがHTTPS接続を許可していることを確認してください。

## 設定ファイル例

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## リンク

- [Venice AI](https://venice.ai)
- [API Documentation](https://docs.venice.ai)
- [Pricing](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
