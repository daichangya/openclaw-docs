---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการภาพรวมอย่างรวดเร็วของแบ็กเอนด์ LLM ที่รองรับ
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: สารบัญผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-23T05:51:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: bcef929e6757f18aad19b810426c49bdb273a9c65781bb3a21cc50d6d17014b5
    source_path: providers/index.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกผู้ให้บริการ ยืนยันตัวตน แล้วตั้ง
โมเดลเริ่มต้นเป็น `provider/model`

กำลังมองหาเอกสารของช่องแชต (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/อื่น ๆ) อยู่หรือไม่? ดู [Channels](/th/channels)

## เริ่มต้นอย่างรวดเร็ว

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยทั่วไปผ่าน `openclaw onboard`)
2. ตั้งโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## เอกสารของผู้ให้บริการ

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [Arcee AI (โมเดล Trinity)](/th/providers/arcee)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [โมเดล GLM](/th/providers/glm)
- [Google (Gemini)](/th/providers/google)
- [Groq (LPU inference)](/th/providers/groq)
- [Hugging Face (Inference)](/th/providers/huggingface)
- [inferrs (โมเดลภายในเครื่อง)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (unified gateway)](/th/providers/litellm)
- [LM Studio (โมเดลภายในเครื่อง)](/th/providers/lmstudio)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (โมเดลคลาวด์ + ภายในเครื่อง)](/th/providers/ollama)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (การค้นหาเว็บ)](/th/providers/perplexity-provider)
- [Qianfan](/th/providers/qianfan)
- [Qwen Cloud](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [SGLang (โมเดลภายในเครื่อง)](/th/providers/sglang)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Together AI](/th/providers/together)
- [Venice (Venice AI, เน้นความเป็นส่วนตัว)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [vLLM (โมเดลภายในเครื่อง)](/th/providers/vllm)
- [Volcengine (Doubao)](/th/providers/volcengine)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Xiaomi](/th/providers/xiaomi)
- [Z.AI](/th/providers/zai)

## หน้าภาพรวมแบบใช้ร่วมกัน

- [ตัวแปร bundled เพิ่มเติม](/th/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [การสร้างภาพ](/th/tools/image-generation) - เครื่องมือ `image_generate` ที่ใช้ร่วมกัน, การเลือก provider และ failover
- [การสร้างเพลง](/th/tools/music-generation) - เครื่องมือ `music_generate` ที่ใช้ร่วมกัน, การเลือก provider และ failover
- [การสร้างวิดีโอ](/th/tools/video-generation) - เครื่องมือ `video_generate` ที่ใช้ร่วมกัน, การเลือก provider และ failover

## ผู้ให้บริการถอดเสียง

- [Deepgram (การถอดเสียงจากเสียง)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai#speech-to-text)
- [xAI](/th/providers/xai#speech-to-text)

## เครื่องมือจากชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีจากชุมชนสำหรับข้อมูลรับรอง Claude subscription (โปรดตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้งาน)

สำหรับ catalog ของ provider แบบเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
