---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการตัวอย่างการตั้งค่าอย่างรวดเร็วสำหรับการยืนยันตัวตน LLM + การเลือกโมเดล
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: เริ่มต้นใช้งานอย่างรวดเร็วสำหรับผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-23T06:08:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b002903bd0a1872e77d871f283ae426c74356936c5776c710711d7328427fca
    source_path: providers/models.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกหนึ่งราย ยืนยันตัวตน แล้วตั้งค่าโมเดลเริ่มต้น
เป็น `provider/model`

## เริ่มต้นอย่างรวดเร็ว (สองขั้นตอน)

1. ยืนยันตัวตนกับผู้ให้บริการ (โดยปกติผ่าน `openclaw onboard`)
2. ตั้งค่าโมเดลเริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## ผู้ให้บริการที่รองรับ (ชุดเริ่มต้น)

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [ComfyUI](/th/providers/comfy)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [โมเดล GLM](/th/providers/glm)
- [MiniMax](/th/providers/minimax)
- [Mistral](/th/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/th/providers/moonshot)
- [OpenAI (API + Codex)](/th/providers/openai)
- [OpenCode (Zen + Go)](/th/providers/opencode)
- [OpenRouter](/th/providers/openrouter)
- [Qianfan](/th/providers/qianfan)
- [Qwen](/th/providers/qwen)
- [Runway](/th/providers/runway)
- [StepFun](/th/providers/stepfun)
- [Synthetic](/th/providers/synthetic)
- [Vercel AI Gateway](/th/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/th/providers/venice)
- [xAI](/th/providers/xai)
- [Z.AI](/th/providers/zai)

## ตัวแปรผู้ให้บริการแบบ bundled เพิ่มเติม

- `anthropic-vertex` - รองรับ Anthropic บน Google Vertex โดยอัตโนมัติเมื่อมีข้อมูลรับรอง Vertex อยู่แล้ว; ไม่มีตัวเลือกการยืนยันตัวตนในการเริ่มต้นใช้งานแยกต่างหาก
- `copilot-proxy` - บริดจ์ VS Code Copilot Proxy แบบ local; ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - โฟลว์ OAuth ของ Gemini CLI แบบไม่เป็นทางการ; ต้องมีการติดตั้ง `gemini` แบบ local (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`); โมเดลเริ่มต้นคือ `google-gemini-cli/gemini-3-flash-preview`; ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

สำหรับแค็ตตาล็อกผู้ให้บริการทั้งหมด (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
