---
read_when:
    - OpenClawをLiteLLM proxy経由でルーティングしたい場合
    - LiteLLM経由でコスト追跡、ロギング、またはモデルルーティングが必要な場合
summary: 統一されたモデルアクセスとコスト追跡のためにOpenClawをLiteLLM Proxy経由で実行する
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T12:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai)は、100以上のモデルプロバイダーに対する統一APIを提供するオープンソースのLLM Gatewayです。OpenClawをLiteLLM経由でルーティングすると、一元化されたコスト追跡、ロギング、およびOpenClaw設定を変更せずにバックエンドを切り替える柔軟性が得られます。

## OpenClawでLiteLLMを使う理由

- **コスト追跡** — すべてのモデルにわたってOpenClawが正確にいくら使っているかを確認できる
- **モデルルーティング** — 設定変更なしでClaude、GPT-4、Gemini、Bedrockを切り替えられる
- **仮想キー** — OpenClaw用に支出上限付きキーを作成できる
- **ロギング** — デバッグ用の完全なリクエスト/レスポンスログ
- **フォールバック** — 主プロバイダーがダウンしている場合の自動フェイルオーバー

## クイックスタート

### オンボーディング経由

```bash
openclaw onboard --auth-choice litellm-api-key
```

### 手動セットアップ

1. LiteLLM Proxyを起動します:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. OpenClawをLiteLLMへ向けます:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

これで完了です。OpenClawはLiteLLM経由でルーティングされます。

## 設定

### 環境変数

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 設定ファイル

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 仮想キー

支出上限付きのOpenClaw専用キーを作成します:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

生成されたキーを`LITELLM_API_KEY`として使用してください。

## モデルルーティング

LiteLLMは、モデルリクエストを異なるバックエンドへルーティングできます。LiteLLMの`config.yaml`で設定します:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClawは引き続き`claude-opus-4-6`を要求し、ルーティングはLiteLLMが処理します。

## 使用状況の確認

LiteLLMのダッシュボードまたはAPIを確認します:

```bash
# キー情報
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# 支出ログ
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## 注記

- LiteLLMはデフォルトで`http://localhost:4000`上で動作します
- OpenClawは、LiteLLMのproxyスタイルOpenAI互換`/v1`
  エンドポイント経由で接続します
- LiteLLM経由では、OpenAIネイティブ専用のリクエスト整形は適用されません:
  `service_tier`なし、Responsesの`store`なし、prompt-cacheヒントなし、
  OpenAI reasoning互換ペイロード整形なし
- カスタムLiteLLM base URLでは、隠しOpenClaw attributionヘッダー
  （`originator`、`version`、`User-Agent`）は注入されません

## 関連

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/concepts/model-providers)
