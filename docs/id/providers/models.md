---
read_when:
    - Anda ingin memilih provider model
    - Anda menginginkan contoh penyiapan cepat untuk auth LLM + pemilihan model
summary: Provider model (LLM) yang didukung oleh OpenClaw
title: Mulai cepat Provider Model
x-i18n:
    generated_at: "2026-04-23T09:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# Provider Model

OpenClaw dapat menggunakan banyak provider LLM. Pilih satu, lakukan autentikasi, lalu setel
model default sebagai `provider/model`.

## Mulai cepat (dua langkah)

1. Lakukan autentikasi dengan provider (biasanya melalui `openclaw onboard`).
2. Setel model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider yang didukung (set awal)

- [Alibaba Model Studio](/id/providers/alibaba)
- [Amazon Bedrock](/id/providers/bedrock)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
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

- `anthropic-vertex` - dukungan Anthropic implisit di Google Vertex saat kredensial Vertex tersedia; tidak ada pilihan auth onboarding terpisah
- `copilot-proxy` - bridge Copilot Proxy VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi `gemini` lokal (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3-flash-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Provider model](/id/concepts/model-providers).
