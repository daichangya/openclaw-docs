---
read_when:
    - OpenClaw で Vercel AI Gateway を使いたい
    - API key の env var または CLI auth choice が必要
summary: Vercel AI Gateway のセットアップ（auth + model 選択）
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:54:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一の endpoint を通じて数百のモデルにアクセスするための統一 API を提供します。

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- API: Anthropic Messages 互換
- OpenClaw は Gateway の `/v1/models` カタログを自動検出するため、`/models vercel-ai-gateway`
  には `vercel-ai-gateway/openai/gpt-5.4` のような現在の model ref が含まれます。

## クイックスタート

1. API key を設定します（推奨: Gateway 用に保存する）:

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. デフォルトモデルを設定します:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## 非対話の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 環境に関する注意

Gateway が daemon（launchd / systemd）として実行される場合は、`AI_GATEWAY_API_KEY`
がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
`env.shellEnv` 経由）。

## Model ID の短縮記法

OpenClaw は Vercel Claude の短縮 model ref を受け付け、ランタイム時に正規化します。

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
