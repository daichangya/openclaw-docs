---
read_when:
    - OpenClaw で Cloudflare AI Gateway を使いたい
    - account ID、gateway ID、または API key の env var が必要
summary: Cloudflare AI Gateway のセットアップ（auth + model 選択）
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:53:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway は provider API の前段に配置され、分析、キャッシュ、制御を追加できます。Anthropic については、OpenClaw はあなたの Gateway endpoint を通じて Anthropic Messages API を使用します。

- Provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- デフォルトモデル: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API key: `CLOUDFLARE_AI_GATEWAY_API_KEY`（Gateway 経由のリクエストに使う provider API key）

Anthropic モデルでは、Anthropic API key を使用してください。

## クイックスタート

1. provider API key と Gateway の詳細を設定します:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## 非対話の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 認証付き Gateway

Cloudflare で Gateway 認証を有効にしている場合は、`cf-aig-authorization` ヘッダーを追加してください（これは provider API key に加えて必要です）。

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## 環境に関する注意

Gateway が daemon（launchd / systemd）として実行される場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。
