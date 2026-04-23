---
read_when:
    - คุณต้องการใช้การสร้างวิดีโอด้วย Alibaba Wan ใน OpenClaw
    - คุณต้องตั้งค่า API key ของ Model Studio หรือ DashScope สำหรับการสร้างวิดีโอ
summary: การสร้างวิดีโอด้วย Alibaba Model Studio Wan ใน OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-23T05:50:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw มาพร้อมผู้ให้บริการการสร้างวิดีโอ `alibaba` ที่บันเดิลมา สำหรับโมเดล Wan บน
Alibaba Model Studio / DashScope

- ผู้ให้บริการ: `alibaba`
- auth ที่แนะนำ: `MODELSTUDIO_API_KEY`
- คีย์ที่ยอมรับได้เช่นกัน: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
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
คีย์ auth ที่ยอมรับได้ตัวใดก็ได้ (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) ใช้งานได้ทั้งหมด ตัวเลือก onboarding แบบ `qwen-standard-api-key` จะกำหนดค่า credential DashScope ที่ใช้ร่วมกัน
</Note>

## โมเดล Wan ที่มีมาในตัว

ปัจจุบันผู้ให้บริการ `alibaba` ที่บันเดิลมาจะลงทะเบียน:

| การอ้างอิงโมเดล                  | โหมด                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Text-to-video             |
| `alibaba/wan2.6-i2v`       | Image-to-video            |
| `alibaba/wan2.6-r2v`       | Reference-to-video        |
| `alibaba/wan2.6-r2v-flash` | Reference-to-video (เร็ว) |
| `alibaba/wan2.7-r2v`       | Reference-to-video        |

## ข้อจำกัดปัจจุบัน

| พารามิเตอร์             | ข้อจำกัด                                                     |
| --------------------- | --------------------------------------------------------- |
| วิดีโอเอาต์พุต         | สูงสุด **1** ต่อคำขอ                                   |
| ภาพอินพุต          | สูงสุด **1**                                               |
| วิดีโออินพุต          | สูงสุด **4**                                               |
| ความยาว              | สูงสุด **10 วินาที**                                      |
| ตัวควบคุมที่รองรับ    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| ภาพ/วิดีโออ้างอิง | รองรับเฉพาะ URL แบบ `http(s)` ระยะไกล                                |

<Warning>
โหมดภาพ/วิดีโออ้างอิงในปัจจุบันต้องใช้ **URL แบบ remote http(s)** เท่านั้น ไม่รองรับพาธไฟล์ในเครื่องสำหรับอินพุตอ้างอิง
</Warning>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ความสัมพันธ์กับ Qwen">
    ผู้ให้บริการ `qwen` ที่บันเดิลมาก็ใช้ DashScope endpoints ที่โฮสต์โดย Alibaba เช่นกันสำหรับ
    การสร้างวิดีโอ Wan ให้ใช้:

    - `qwen/...` เมื่อคุณต้องการพื้นผิวผู้ให้บริการ Qwen แบบ canonical
    - `alibaba/...` เมื่อคุณต้องการพื้นผิวการสร้างวิดีโอ Wan โดยตรงจากผู้จำหน่าย

    ดู [เอกสารผู้ให้บริการ Qwen](/th/providers/qwen) สำหรับรายละเอียดเพิ่มเติม

  </Accordion>

  <Accordion title="ลำดับความสำคัญของ auth key">
    OpenClaw จะตรวจสอบ auth keys ตามลำดับนี้:

    1. `MODELSTUDIO_API_KEY` (แนะนำ)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    คีย์ใดก็ได้ในนี้สามารถใช้ยืนยันตัวตนกับผู้ให้บริการ `alibaba`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Qwen" href="/th/providers/qwen" icon="microchip">
    การตั้งค่าผู้ให้บริการ Qwen และการเชื่อมต่อ DashScope
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference#agent-defaults" icon="gear">
    ค่าเริ่มต้นของเอเจนต์และการกำหนดค่าโมเดล
  </Card>
</CardGroup>
