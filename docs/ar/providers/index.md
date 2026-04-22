---
read_when:
    - أنت تريد اختيار مزوّد نموذج
    - أنت بحاجة إلى نظرة عامة سريعة على الواجهات الخلفية المدعومة لـ LLM
summary: مزوّدو النماذج (LLMs) الذين يدعمهم OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-04-22T04:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# مزوّدو النماذج

يمكن لـ OpenClaw استخدام العديد من مزوّدي LLM. اختر مزوّدًا، وقم بالمصادقة، ثم اضبط
النموذج الافتراضي على الشكل `provider/model`.

هل تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/إلخ)؟ راجع [القنوات](/ar/channels).

## بداية سريعة

1. قم بالمصادقة مع المزوّد (عادةً عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## وثائق المزوّدين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI (نماذج Trinity)](/ar/providers/arcee)
- [BytePlus (دولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
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
- [Perplexity (بحث الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [SGLang (نماذج محلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
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

- [المتغيرات المضمّنة الإضافية](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex وCopilot Proxy وGemini CLI OAuth
- [توليد الصور](/ar/tools/image-generation) - أداة `image_generate` المشتركة، واختيار المزوّد، وfailover
- [توليد الموسيقى](/ar/tools/music-generation) - أداة `music_generate` المشتركة، واختيار المزوّد، وfailover
- [توليد الفيديو](/ar/tools/video-generation) - أداة `video_generate` المشتركة، واختيار المزوّد، وfailover

## مزوّدو النسخ

- [Deepgram (نسخ الصوت)](/ar/providers/deepgram)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - proxy مجتمعي لبيانات اعتماد اشتراك Claude ‏(تحقق من سياسة/شروط Anthropic قبل الاستخدام)

للاطلاع على فهرس المزوّدين الكامل (xAI وGroq وMistral وغيرها) والإعدادات المتقدمة،
راجع [مزوّدو النماذج](/ar/concepts/model-providers).
