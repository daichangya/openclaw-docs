---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการภาพรวมแบบรวดเร็วของแบ็กเอนด์ LLM ที่รองรับ
summary: ผู้ให้บริการโมเดล (LLMs) ที่ OpenClaw รองรับ
title: ไดเรกทอรีผู้ให้บริการ
x-i18n:
    generated_at: "2026-04-24T09:28:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e76c2688398e12a4467327505bf5fe8b40cf66c74a66dd586c0ccadd50e6705
    source_path: providers/index.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกผู้ให้บริการ ยืนยันตัวตน แล้วตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

กำลังมองหาเอกสารของช่องทางแชต (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/อื่น ๆ) อยู่ใช่ไหม? ดู [Channels](/th/channels)

## เริ่มต้นอย่างรวดเร็ว

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยปกติผ่าน `openclaw onboard`)
2. ตั้งค่าโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## เอกสารของผู้ให้บริการ

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Amazon Bedrock Mantle](/th/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [Arcee AI (Trinity models)](/th/providers/arcee)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [ComfyUI](/th/providers/comfy)
- [DeepSeek](/th/providers/deepseek)
- [ElevenLabs](/th/providers/elevenlabs)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GitHub Copilot](/th/providers/github-copilot)
- [GLM models](/th/providers/glm)
- [Google (Gemini)](/th/providers/google)
- [Groq (LPU inference)](/th/providers/groq)
- [Hugging Face (Inference)](/th/providers/huggingface)
- [inferrs (local models)](/th/providers/inferrs)
- [Kilocode](/th/providers/kilocode)
- [LiteLLM (unified gateway)](/th/providers/litellm)
- [LM Studio (local models)](/th/providers/lmstudio)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [NVIDIA](/th/providers/nvidia)
- [Ollama (cloud + local models)](/th/providers/ollama)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode](/th/providers/opencode)
- [OpenCode Go](/th/providers/opencode-go)
- [OpenRouter](/th/providers/openrouter)
- [Perplexity (web search)](/th/providers/perplexity-provider)
- [Qianfan](/th/providers/qianfan)
- [Qwen Cloud](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [SGLang (local models)](/th/providers/sglang)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Tencent Cloud (TokenHub)](/th/providers/tencent)
- [Together AI](/th/providers/together)
- [Venice (Venice AI, เน้นความเป็นส่วนตัว)](/th/providers/venice)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [vLLM (local models)](/th/providers/vllm)
- [Volcengine (Doubao)](/th/providers/volcengine)
- [Vydra](/th/providers/vydra)
- [xAI](/th/providers/xai)
- [Xiaomi](/th/providers/xiaomi)
- [Z.AI](/th/providers/zai)

## หน้าภาพรวมแบบใช้ร่วมกัน

- [Additional bundled variants](/th/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy และ Gemini CLI OAuth
- [Image Generation](/th/tools/image-generation) - เครื่องมือ `image_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover
- [Music Generation](/th/tools/music-generation) - เครื่องมือ `music_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover
- [Video Generation](/th/tools/video-generation) - เครื่องมือ `video_generate` แบบใช้ร่วมกัน, การเลือกผู้ให้บริการ และ failover

## ผู้ให้บริการสำหรับการถอดเสียง

- [Deepgram (การถอดเสียงจาก audio)](/th/providers/deepgram)
- [ElevenLabs](/th/providers/elevenlabs#speech-to-text)
- [Mistral](/th/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/th/providers/openai#speech-to-text)
- [xAI](/th/providers/xai#speech-to-text)

## เครื่องมือจากชุมชน

- [Claude Max API Proxy](/th/providers/claude-max-api-proxy) - พร็อกซีจากชุมชนสำหรับข้อมูลรับรอง subscription ของ Claude (ควรตรวจสอบนโยบาย/ข้อกำหนดของ Anthropic ก่อนใช้งาน)

สำหรับแค็ตตาล็อกผู้ให้บริการแบบเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
