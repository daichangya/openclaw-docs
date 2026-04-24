---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอ Wan ของ Alibaba ใน OpenClaw
    - คุณต้องการตั้งค่า API key ของ Model Studio หรือ DashScope สำหรับการสร้างวิดีโอ
summary: การสร้างวิดีโอ Wan ของ Alibaba Model Studio ใน OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T09:26:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw มาพร้อมผู้ให้บริการการสร้างวิดีโอ `alibaba` แบบ bundled สำหรับโมเดล Wan บน
Alibaba Model Studio / DashScope

- ผู้ให้บริการ: `alibaba`
- วิธี auth ที่แนะนำ: `MODELSTUDIO_API_KEY`
- คีย์ที่รองรับเช่นกัน: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: การสร้างวิดีโอแบบ async ของ DashScope / Model Studio

## เริ่มต้นใช้งาน

<Steps>
  <Step title="ตั้งค่า API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="ตั้งค่าโมเดลวิดีโอเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="ตรวจสอบว่าผู้ให้บริการพร้อมใช้งาน">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
คีย์ auth ที่รองรับตัวใดก็ได้ (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) ใช้งานได้ทั้งหมด ตัวเลือก onboarding `qwen-standard-api-key` จะกำหนดค่าข้อมูลรับรอง DashScope ที่ใช้ร่วมกัน
</Note>

## โมเดล Wan ที่มีมาให้

ขณะนี้ผู้ให้บริการ `alibaba` แบบ bundled ลงทะเบียนไว้ดังนี้:

| Model ref                  | โหมด                       |
| -------------------------- | -------------------------- |
| `alibaba/wan2.6-t2v`       | ข้อความเป็นวิดีโอ          |
| `alibaba/wan2.6-i2v`       | ภาพเป็นวิดีโอ              |
| `alibaba/wan2.6-r2v`       | ข้อมูลอ้างอิงเป็นวิดีโอ    |
| `alibaba/wan2.6-r2v-flash` | ข้อมูลอ้างอิงเป็นวิดีโอ (เร็ว) |
| `alibaba/wan2.7-r2v`       | ข้อมูลอ้างอิงเป็นวิดีโอ    |

## ข้อจำกัดปัจจุบัน

| พารามิเตอร์           | ข้อจำกัด                                                  |
| --------------------- | --------------------------------------------------------- |
| วิดีโอผลลัพธ์         | สูงสุด **1** ต่อคำขอ                                      |
| ภาพนำเข้า             | สูงสุด **1**                                               |
| วิดีโอนำเข้า          | สูงสุด **4**                                               |
| ระยะเวลา              | สูงสุด **10 วินาที**                                      |
| ตัวควบคุมที่รองรับ    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| ภาพ/วิดีโออ้างอิง     | รองรับเฉพาะ URL `http(s)` ระยะไกล                         |

<Warning>
โหมดภาพ/วิดีโออ้างอิงในขณะนี้ต้องใช้ **URL `http(s)` ระยะไกล** เท่านั้น ยังไม่รองรับพาธไฟล์ภายในเครื่องสำหรับอินพุตอ้างอิง
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ความสัมพันธ์กับ Qwen">
    ผู้ให้บริการ `qwen` แบบ bundled ก็ใช้ปลายทาง DashScope ที่โฮสต์โดย Alibaba สำหรับ
    การสร้างวิดีโอ Wan เช่นกัน ให้ใช้:

    - `qwen/...` เมื่อคุณต้องการ surface ของผู้ให้บริการ Qwen แบบมาตรฐาน
    - `alibaba/...` เมื่อคุณต้องการ surface วิดีโอ Wan โดยตรงของผู้ให้บริการเจ้าของแพลตฟอร์ม

    ดูรายละเอียดเพิ่มเติมได้ที่ [เอกสารของผู้ให้บริการ Qwen](/th/providers/qwen)

  </Accordion>

  <Accordion title="ลำดับความสำคัญของ auth key">
    OpenClaw จะตรวจสอบ auth key ตามลำดับนี้:

    1. `MODELSTUDIO_API_KEY` (แนะนำ)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    คีย์ใดก็ได้เหล่านี้สามารถใช้ยืนยันตัวตนกับผู้ให้บริการ `alibaba` ได้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Video generation" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Qwen" href="/th/providers/qwen" icon="microchip">
    การตั้งค่าผู้ให้บริการ Qwen และการผสานรวมกับ DashScope
  </Card>
  <Card title="Configuration reference" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
