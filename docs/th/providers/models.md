---
read_when:
    - คุณต้องการเลือก provider ของ model
    - คุณต้องการตัวอย่างการตั้งค่าแบบรวดเร็วสำหรับการยืนยันตัวตนของ LLM + การเลือก model
summary: provider ของ model (LLM) ที่ OpenClaw รองรับ
title: คู่มือเริ่มต้นอย่างรวดเร็วสำหรับ provider ของ model
x-i18n:
    generated_at: "2026-04-24T09:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# provider ของ model

OpenClaw สามารถใช้ provider ของ LLM ได้หลายราย เลือกหนึ่งราย ยืนยันตัวตน แล้วตั้ง model เริ่มต้นเป็น `provider/model`

## เริ่มต้นอย่างรวดเร็ว (สองขั้นตอน)

1. ยืนยันตัวตนกับ provider (โดยทั่วไปผ่าน `openclaw onboard`)
2. ตั้ง model เริ่มต้น:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## provider ที่รองรับ (ชุดเริ่มต้น)

- [Alibaba Model Studio](/th/providers/alibaba)
- [Amazon Bedrock](/th/providers/bedrock)
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [ComfyUI](/th/providers/comfy)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [model GLM](/th/providers/glm)
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

## ตัวแปรของ provider ที่มาพร้อมกันเพิ่มเติม

- `anthropic-vertex` - รองรับ Anthropic บน Google Vertex แบบ implicit เมื่อมี credential ของ Vertex; ไม่มีตัวเลือก auth สำหรับ onboarding แยกต่างหาก
- `copilot-proxy` - บริดจ์ VS Code Copilot Proxy ในเครื่อง; ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - flow OAuth ของ Gemini CLI แบบไม่เป็นทางการ; ต้องติดตั้ง `gemini` ในเครื่อง (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`); model เริ่มต้นคือ `google-gemini-cli/gemini-3-flash-preview`; ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

สำหรับแคตตาล็อก provider แบบเต็ม (xAI, Groq, Mistral ฯลฯ) และการกำหนดค่าขั้นสูง
ดู [provider ของ model](/th/concepts/model-providers)

## ที่เกี่ยวข้อง

- [การเลือก model](/th/concepts/model-providers)
- [model failover](/th/concepts/model-failover)
- [Models CLI](/th/cli/models)
