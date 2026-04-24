---
read_when:
    - คุณต้องการใช้ Tencent Hy3 preview กับ OpenClaw
    - คุณต้องการการตั้งค่า API key ของ TokenHub
summary: การตั้งค่า Tencent Cloud TokenHub สำหรับ Hy3 preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T09:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud มาพร้อมกับ **ปลั๊กอินผู้ให้บริการแบบ bundled** ใน OpenClaw โดยให้การเข้าถึง Tencent Hy3 preview ผ่าน endpoint ของ TokenHub (`tencent-tokenhub`)

ผู้ให้บริการนี้ใช้ API ที่เข้ากันได้กับ OpenAI

| คุณสมบัติ | ค่า |
| ------------- | ------------------------------------------ |
| ผู้ให้บริการ | `tencent-tokenhub` |
| โมเดลเริ่มต้น | `tencent-tokenhub/hy3-preview` |
| การยืนยันตัวตน | `TOKENHUB_API_KEY` |
| API | chat completions ที่เข้ากันได้กับ OpenAI |
| Base URL | `https://tokenhub.tencentmaas.com/v1` |
| Global URL | `https://tokenhub-intl.tencentmaas.com/v1` |

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="สร้าง API key ของ TokenHub">
    สร้าง API key ใน Tencent Cloud TokenHub หากคุณเลือกขอบเขตการเข้าถึงแบบจำกัดสำหรับคีย์ ให้รวม **Hy3 preview** ไว้ในรายการโมเดลที่อนุญาตด้วย
  </Step>
  <Step title="รันการตั้งค่าเริ่มต้น">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="ตรวจสอบโมเดล">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## แค็ตตาล็อกในตัว

| Model ref | ชื่อ | อินพุต | Context | เอาต์พุตสูงสุด | หมายเหตุ |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text | 256,000 | 64,000 | ค่าเริ่มต้น; เปิดใช้ reasoning |

Hy3 preview คือโมเดลภาษาขนาดใหญ่แบบ MoE ของ Tencent Hunyuan สำหรับการให้เหตุผล การทำตามคำสั่งในบริบทยาว โค้ด และเวิร์กโฟลว์ของเอเจนต์ ตัวอย่างแบบเข้ากันได้กับ OpenAI ของ Tencent ใช้ `hy3-preview` เป็น model id และรองรับการเรียกใช้เครื่องมือแบบ chat-completions มาตรฐาน พร้อมทั้ง `reasoning_effort`

<Tip>
model id คือ `hy3-preview` อย่าสับสนกับโมเดล `HY-3D-*` ของ Tencent ซึ่งเป็น API สำหรับการสร้าง 3D และไม่ใช่โมเดลแชตของ OpenClaw ที่กำหนดค่าโดยผู้ให้บริการนี้
</Tip>

## การ override endpoint

โดยค่าเริ่มต้น OpenClaw ใช้ endpoint `https://tokenhub.tencentmaas.com/v1` ของ Tencent Cloud ทั้งนี้ Tencent ยังมีเอกสารสำหรับ endpoint TokenHub ระดับสากลด้วย:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

ให้ override endpoint เฉพาะเมื่อบัญชี TokenHub หรือภูมิภาคของคุณจำเป็นต้องใช้เท่านั้น

## หมายเหตุ

- Model ref ของ TokenHub ใช้ `tencent-tokenhub/<modelId>`
- ปัจจุบันแค็ตตาล็อกแบบ bundled รวม `hy3-preview`
- ปลั๊กอินทำเครื่องหมาย Hy3 preview ว่ารองรับ reasoning และรองรับ streaming-usage
- ปลั๊กอินมาพร้อมข้อมูลเมตาราคาของ Hy3 แบบแบ่งระดับ ดังนั้นจึงมีการเติมค่าประมาณต้นทุนให้โดยไม่ต้อง override ราคาเอง
- ให้ override ราคา, context หรือข้อมูลเมตา endpoint ใน `models.providers` เฉพาะเมื่อจำเป็น

## หมายเหตุด้านสภาพแวดล้อม

หาก Gateway ทำงานเป็นเดมอน (launchd/systemd) โปรดตรวจสอบว่า `TOKENHUB_API_KEY`
พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน
`env.shellEnv`)

## เอกสารที่เกี่ยวข้อง

- [การกำหนดค่า OpenClaw](/th/gateway/configuration)
- [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
- [หน้าผลิตภัณฑ์ Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [การสร้างข้อความด้วย Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [การตั้งค่า Tencent TokenHub Cline สำหรับ Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [การ์ดโมเดล Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
