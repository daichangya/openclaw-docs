---
read_when:
    - คุณต้องการใช้โมเดลเปิดใน OpenClaw ได้ฟรี
    - คุณต้องตั้งค่า `NVIDIA_API_KEY`
summary: ใช้ API ที่เข้ากันได้กับ OpenAI ของ NVIDIA ใน OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T09:28:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA มี API ที่เข้ากันได้กับ OpenAI ที่ `https://integrate.api.nvidia.com/v1` สำหรับ
โมเดลเปิดให้ใช้ฟรี ยืนยันตัวตนด้วย API key จาก
[build.nvidia.com](https://build.nvidia.com/settings/api-keys)

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    สร้าง API key ที่ [build.nvidia.com](https://build.nvidia.com/settings/api-keys)
  </Step>
  <Step title="export key และเรียกใช้ onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="ตั้งค่าโมเดล NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
หากคุณส่ง `--token` แทนการใช้ตัวแปร env ค่านั้นจะไปอยู่ใน shell history และ
เอาต์พุตของ `ps` ควรใช้ตัวแปร environment `NVIDIA_API_KEY` เมื่อเป็นไปได้
</Warning>

## ตัวอย่างคอนฟิก

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

## แค็ตตาล็อกในตัว

| Model ref                                  | Name                         | Context | Max output |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="พฤติกรรมการเปิดใช้งานอัตโนมัติ">
    provider จะเปิดใช้งานอัตโนมัติเมื่อตั้งค่าตัวแปร environment `NVIDIA_API_KEY`
    โดยไม่ต้องมีคอนฟิก provider แบบชัดเจนเพิ่มเติมนอกเหนือจาก key
  </Accordion>

  <Accordion title="แค็ตตาล็อกและราคา">
    แค็ตตาล็อกแบบ bundled เป็นแบบคงที่ ค่าใช้จ่ายเริ่มต้นในซอร์สเป็น `0` เนื่องจาก NVIDIA
    เปิดให้เข้าถึง API ฟรีสำหรับโมเดลที่ระบุอยู่ในปัจจุบัน
  </Accordion>

  <Accordion title="endpoint ที่เข้ากันได้กับ OpenAI">
    NVIDIA ใช้ endpoint completions มาตรฐาน `/v1` เครื่องมือใด ๆ ที่เข้ากันได้กับ OpenAI
    ควรใช้งานได้ทันทีเมื่อใช้ base URL ของ NVIDIA
  </Accordion>
</AccordionGroup>

<Tip>
ปัจจุบันโมเดลของ NVIDIA ใช้งานได้ฟรี ตรวจสอบ
[build.nvidia.com](https://build.nvidia.com/) สำหรับข้อมูลความพร้อมใช้งานล่าสุดและ
รายละเอียด rate limit
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    ข้อมูลอ้างอิงคอนฟิกแบบเต็มสำหรับ agents, models และ providers
  </Card>
</CardGroup>
