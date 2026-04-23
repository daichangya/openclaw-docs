---
read_when:
    - تريد اختيار مزوّد نماذج
    - تريد أمثلة إعداد سريعة لمصادقة LLM + اختيار النموذج
summary: مزوّدو النماذج (LLMs) المدعومون في OpenClaw
title: دليل البدء السريع لمزوّد النماذج
x-i18n:
    generated_at: "2026-04-23T07:31:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# مزوّدو النماذج

يمكن لـ OpenClaw استخدام العديد من مزوّدي LLM. اختر واحدًا، ثم نفّذ المصادقة،
ثم اضبط النموذج الافتراضي بصيغة `provider/model`.

## البدء السريع (خطوتان)

1. نفّذ المصادقة مع المزوّد (عادةً عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## المزوّدون المدعومون (مجموعة البداية)

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic ‏(API + Claude CLI)](/ar/providers/anthropic)
- [BytePlus ‏(International)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [ComfyUI](/ar/providers/comfy)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [نماذج GLM](/ar/providers/glm)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI ‏(Kimi + Kimi Coding)](/ar/providers/moonshot)
- [OpenAI ‏(API + Codex)](/ar/providers/openai)
- [OpenCode ‏(Zen + Go)](/ar/providers/opencode)
- [OpenRouter](/ar/providers/openrouter)
- [Qianfan](/ar/providers/qianfan)
- [Qwen](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [Venice ‏(Venice AI)](/ar/providers/venice)
- [xAI](/ar/providers/xai)
- [Z.AI](/ar/providers/zai)

## متغيرات المزوّدين المضمّنة الإضافية

- `anthropic-vertex` - دعم Anthropic الضمني على Google Vertex عندما تكون بيانات اعتماد Vertex متاحة؛ ولا يوجد خيار مصادقة منفصل في الإعداد الأوّلي
- `copilot-proxy` - جسر محلي لـ VS Code Copilot Proxy؛ استخدم `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - تدفق OAuth غير رسمي لـ Gemini CLI؛ ويتطلب تثبيت `gemini` محليًا (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`)؛ والنموذج الافتراضي هو `google-gemini-cli/gemini-3-flash-preview`؛ استخدم `openclaw onboard --auth-choice google-gemini-cli` أو `openclaw models auth login --provider google-gemini-cli --set-default`

للاطلاع على كتالوج المزوّدين الكامل (xAI وGroq وMistral وغيرها) والإعداد المتقدم،
راجع [مزوّدو النماذج](/ar/concepts/model-providers).
