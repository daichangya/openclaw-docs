---
read_when:
    - คุณต้องการเลือกผู้ให้บริการโมเดล
    - คุณต้องการตัวอย่างการตั้งค่าอย่างรวดเร็วสำหรับการยืนยันตัวตน LLM + การเลือกโมเดล
summary: ผู้ให้บริการโมเดล (LLM) ที่ OpenClaw รองรับ
title: เริ่มต้นอย่างรวดเร็วสำหรับผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-23T05:52:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ee4c2f993fe0ae05fe34f52bc6f3e0fc9a76b10760f56b20ad251e25ee9f20
    source_path: providers/models.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

OpenClaw สามารถใช้ผู้ให้บริการ LLM ได้หลายราย เลือกหนึ่งราย ยืนยันตัวตน จากนั้นตั้งค่า
โมเดลเริ่มต้นเป็น `provider/model`

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
- [Anthropic (API + Claude CLI)](/th/providers/anthropic)
- [Amazon Bedrock](/th/providers/bedrock)
- [BytePlus (International)](/th/concepts/model-providers#byteplus-international)
- [Chutes](/th/providers/chutes)
- [ComfyUI](/th/providers/comfy)
- [Cloudflare AI Gateway](/th/providers/cloudflare-ai-gateway)
- [fal](/th/providers/fal)
- [Fireworks](/th/providers/fireworks)
- [GLM models](/th/providers/glm)
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

## ตัวแปรของ bundled provider เพิ่มเติม

- `anthropic-vertex` - การรองรับ Anthropic บน Google Vertex แบบ implicit เมื่อมีข้อมูลรับรองของ Vertex; ไม่มีตัวเลือก onboarding auth แยก
- `copilot-proxy` - สะพาน local VS Code Copilot Proxy; ใช้ `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - โฟลว์ OAuth ของ Gemini CLI แบบไม่เป็นทางการ; ต้องมีการติดตั้ง `gemini` ในเครื่อง (`brew install gemini-cli` หรือ `npm install -g @google/gemini-cli`); โมเดลเริ่มต้นคือ `google-gemini-cli/gemini-3-flash-preview`; ใช้ `openclaw onboard --auth-choice google-gemini-cli` หรือ `openclaw models auth login --provider google-gemini-cli --set-default`

สำหรับแค็ตตาล็อกผู้ให้บริการแบบเต็ม (xAI, Groq, Mistral เป็นต้น) และการกำหนดค่าขั้นสูง
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
