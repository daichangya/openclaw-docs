---
read_when:
    - คุณต้องการใช้ open models ใน OpenClaw ได้ฟรี
    - คุณต้องการการตั้งค่า `NVIDIA_API_KEY`
summary: ใช้ OpenAI-compatible API ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-23T05:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45048037365138141ee82cefa0c0daaf073a1c2ae3aa7b23815f6ca676fc0d3e
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA ให้ OpenAI-compatible API ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
open models ฟรี โดยยืนยันตัวตนด้วย API key จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
  </Step>
  <Step title="export คีย์และรัน onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลของ NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
หากคุณส่งค่า `--token` แทน env var ค่านั้นจะไปอยู่ใน shell history และ
ผลลัพธ์ของ `ps` ควรเลือกใช้ตัวแปรแวดล้อม `NVIDIA_API_KEY` เมื่อเป็นไปได้
</Warning>

## ตัวอย่าง config

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## แค็ตตาล็อกที่มีมาในตัว

| Model ref                                  | ชื่อ                         | บริบท   | เอาต์พุตสูงสุด |
| ------------------------------------------ | ---------------------------- | ------- | -------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192          |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192          |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192          |

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการเปิดใช้งานอัตโนมัติ">
    provider นี้จะเปิดใช้งานอัตโนมัติเมื่อมีการตั้งค่าตัวแปรแวดล้อม `NVIDIA_API_KEY`
    โดยไม่ต้องมี provider config แบบ explicit เพิ่มเติมนอกเหนือจากคีย์
  </Accordion>

  <Accordion title="แค็ตตาล็อกและราคา">
    แค็ตตาล็อกแบบ bundled เป็นแบบ static โดยค่าใช้จ่ายเริ่มต้นเป็น `0` ในซอร์ส เพราะปัจจุบัน NVIDIA
    ยังให้การเข้าถึง API ฟรีสำหรับโมเดลที่อยู่ในรายการ
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA ใช้ endpoint แบบ `/v1` completions มาตรฐาน ดังนั้นเครื่องมือใดๆ ที่เข้ากันได้กับ OpenAI
    ก็ควรใช้งานได้ทันทีเมื่อใช้ base URL ของ NVIDIA
  </Accordion>
</AccordionGroup>

<Tip>
ปัจจุบันโมเดลของ NVIDIA ใช้งานได้ฟรี โปรดตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) สำหรับข้อมูล availability และ
รายละเอียด rate-limit ล่าสุด
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    เอกสารอ้างอิง config แบบเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
