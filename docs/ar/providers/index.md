---
read_when:
    - تريد اختيار مزوّد نموذج
    - تحتاج إلى نظرة عامة سريعة على خلفيات LLM المدعومة
summary: مزوّدو النماذج (LLMs) المدعومون في OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-04-23T07:31:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# مزوّدو النماذج

يمكن لـ OpenClaw استخدام العديد من مزوّدي LLM. اختر مزوّدًا، ثم صادِق،
ثم اضبط النموذج الافتراضي بصيغة `provider/model`.

هل تبحث عن مستندات قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/إلخ)؟ راجع [القنوات](/ar/channels).

## البدء السريع

1. صادِق مع المزوّد (عادة عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## مستندات المزوّدين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Amazon Bedrock Mantle](/ar/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI (نماذج Trinity)](/ar/providers/arcee)
- [BytePlus (دولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [نماذج GLM](/ar/providers/glm)
- [Google (Gemini)](/ar/providers/google)
- [Groq (استدلال LPU)](/ar/providers/groq)
- [Hugging Face (Inference)](/ar/providers/huggingface)
- [inferrs (نماذج محلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM (بوابة موحّدة)](/ar/providers/litellm)
- [LM Studio (نماذج محلية)](/ar/providers/lmstudio)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
- [NVIDIA](/ar/providers/nvidia)
- [Ollama (نماذج سحابية + محلية)](/ar/providers/ollama)
- [OpenAI (API + Codex)](/ar/providers/openai)
- [OpenCode](/ar/providers/opencode)
- [OpenCode Go](/ar/providers/opencode-go)
- [OpenRouter](/ar/providers/openrouter)
- [Perplexity (البحث على الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [SGLang (نماذج محلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ar/providers/tencent)
- [Together AI](/ar/providers/together)
- [Venice (Venice AI، مع التركيز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM (نماذج محلية)](/ar/providers/vllm)
- [Volcengine (Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI](/ar/providers/zai)

## صفحات النظرة العامة المشتركة

- [الأنواع المضمّنة الإضافية](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex وCopilot Proxy وGemini CLI OAuth
- [توليد الصور](/ar/tools/image-generation) - الأداة المشتركة `image_generate`، واختيار المزوّد، والرجوع الاحتياطي
- [توليد الموسيقى](/ar/tools/music-generation) - الأداة المشتركة `music_generate`، واختيار المزوّد، والرجوع الاحتياطي
- [توليد الفيديو](/ar/tools/video-generation) - الأداة المشتركة `video_generate`، واختيار المزوّد، والرجوع الاحتياطي

## مزوّدو النسخ

- [Deepgram (نسخ الصوت)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai#speech-to-text)
- [xAI](/ar/providers/xai#speech-to-text)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - وكيل مجتمعي لبيانات اعتماد اشتراك Claude (تحقق من سياسة/شروط Anthropic قبل الاستخدام)

للاطلاع على فهرس المزوّدين الكامل (xAI وGroq وMistral وغيرها) والإعدادات المتقدمة،
راجع [مزوّدو النماذج](/ar/concepts/model-providers).
