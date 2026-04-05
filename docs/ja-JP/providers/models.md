---
read_when:
    - モデルプロバイダーを選びたい場合
    - LLM の auth + モデル選択のクイックセットアップ例が欲しい場合
summary: OpenClaw がサポートするモデルプロバイダー（LLM）
title: Model Provider Quickstart
x-i18n:
    generated_at: "2026-04-05T12:53:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Model Providers

OpenClaw は多くの LLM provider を使用できます。1 つ選び、認証し、その後
デフォルトモデルを `provider/model` として設定してください。

## クイックスタート（2 ステップ）

1. provider で認証する（通常は `openclaw onboard` 経由）。
2. デフォルトモデルを設定する:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされている provider（スターターセット）

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (International)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## 追加の bundled provider バリアント

- `anthropic-vertex` - Vertex 認証情報が利用可能な場合の、Google Vertex 上の暗黙的 Anthropic サポート。個別の onboarding auth choice はありません
- `copilot-proxy` - ローカルの VS Code Copilot Proxy bridge。`openclaw onboard --auth-choice copilot-proxy` を使用
- `google-gemini-cli` - 非公式の Gemini CLI OAuth フロー。ローカルの `gemini` インストールが必要です（`brew install gemini-cli` または `npm install -g @google/gemini-cli`）。デフォルトモデルは `google-gemini-cli/gemini-3.1-pro-preview`。`openclaw onboard --auth-choice google-gemini-cli` または `openclaw models auth login --provider google-gemini-cli --set-default` を使用します

完全な provider カタログ（xAI、Groq、Mistral など）と高度な設定については、
[Model providers](/concepts/model-providers) を参照してください。
