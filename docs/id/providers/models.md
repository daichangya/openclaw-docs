---
read_when:
    - Anda ingin memilih provider model
    - Anda ingin contoh penyiapan cepat untuk autentikasi LLM + pemilihan model
summary: Provider model (LLM) yang didukung oleh OpenClaw
title: Mulai Cepat Provider Model
x-i18n:
    generated_at: "2026-04-07T09:18:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 500191bfe853241096f97928ced2327a13b6f7f62003cb7452b24886c272e6ba
    source_path: providers/models.md
    workflow: 15
---

# Provider Model

OpenClaw dapat menggunakan banyak provider LLM. Pilih satu, autentikasi, lalu atur
model default sebagai `provider/model`.

## Mulai cepat (dua langkah)

1. Autentikasi dengan provider tersebut (biasanya melalui `openclaw onboard`).
2. Atur model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider yang didukung (set awal)

- [Alibaba Model Studio](/id/providers/alibaba)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [Amazon Bedrock](/id/providers/bedrock)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [ComfyUI](/id/providers/comfy)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [Model GLM](/id/providers/glm)
- [MiniMax](/id/providers/minimax)
- [Mistral](/id/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
- [OpenAI (API + Codex)](/id/providers/openai)
- [OpenCode (Zen + Go)](/id/providers/opencode)
- [OpenRouter](/id/providers/openrouter)
- [Qianfan](/id/providers/qianfan)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/id/providers/venice)
- [xAI](/id/providers/xai)
- [Z.AI](/id/providers/zai)

## Varian provider bawaan tambahan

- `anthropic-vertex` - dukungan Anthropic implisit di Google Vertex saat kredensial Vertex tersedia; tidak ada pilihan autentikasi onboarding terpisah
- `copilot-proxy` - bridge Copilot Proxy VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi `gemini` lokal (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3.1-pro-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Provider model](/id/concepts/model-providers).
