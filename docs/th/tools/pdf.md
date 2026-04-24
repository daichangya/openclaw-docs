---
read_when:
    - คุณต้องการวิเคราะห์ PDFs จาก agents
    - คุณต้องการพารามิเตอร์และข้อจำกัดของเครื่องมือ pdf แบบละเอียด exact You are ChatGPT, a large language model trained by
    - คุณกำลังดีบักโหมด PDF แบบเนทีฟเทียบกับ fallback สำหรับการดึงข้อมูล
summary: วิเคราะห์เอกสาร PDF หนึ่งฉบับหรือหลายฉบับด้วยการรองรับจาก provider แบบเนทีฟและ fallback สำหรับการดึงข้อมูล
title: เครื่องมือ PDF
x-i18n:
    generated_at: "2026-04-24T09:38:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

`pdf` ใช้วิเคราะห์เอกสาร PDF หนึ่งฉบับหรือหลายฉบับและส่งกลับเป็นข้อความ

พฤติกรรมโดยย่อ:

- โหมด provider แบบเนทีฟสำหรับ model providers ของ Anthropic และ Google
- โหมด extraction fallback สำหรับ providers อื่น ๆ (ดึงข้อความก่อน แล้วใช้ภาพของหน้าเมื่อจำเป็น)
- รองรับอินพุตแบบเดี่ยว (`pdf`) หรือหลายรายการ (`pdfs`) สูงสุด 10 PDF ต่อการเรียกหนึ่งครั้ง

## ความพร้อมใช้งาน

เครื่องมือนี้จะถูกลงทะเบียนก็ต่อเมื่อ OpenClaw สามารถ resolve config ของโมเดลที่รองรับ PDF สำหรับ agent ได้:

1. `agents.defaults.pdfModel`
2. fallback ไปที่ `agents.defaults.imageModel`
3. fallback ไปที่โมเดล session/default ที่ resolve แล้วของ agent
4. หาก native-PDF providers ใช้ auth เป็นฐาน ให้เลือกพวกนั้นก่อน generic image fallback candidates

หากไม่สามารถ resolve โมเดลที่ใช้งานได้ เครื่องมือ `pdf` จะไม่ถูกเปิดเผย

หมายเหตุด้านความพร้อมใช้งาน:

- ลำดับ fallback รับรู้เรื่อง auth `provider/model` ที่กำหนดไว้จะนับก็ต่อเมื่อ
  OpenClaw สามารถยืนยันตัวตนกับ provider นั้นสำหรับ agent ได้จริง
- ปัจจุบัน native PDF providers คือ **Anthropic** และ **Google**
- หาก provider ของ session/default ที่ resolve แล้วมีการกำหนดค่า vision/PDF
  model อยู่แล้ว เครื่องมือ PDF จะใช้สิ่งนั้นซ้ำก่อน fallback ไปยัง auth-backed
  providers อื่น

## เอกสารอ้างอิงอินพุต

<ParamField path="pdf" type="string">
หนึ่งพาธหรือ URL ของ PDF
</ParamField>

<ParamField path="pdfs" type="string[]">
หลายพาธหรือ URL ของ PDF สูงสุดรวม 10 รายการ
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
พรอมป์สำหรับการวิเคราะห์
</ParamField>

<ParamField path="pages" type="string">
ตัวกรองหน้า เช่น `1-5` หรือ `1,3,7-9`
</ParamField>

<ParamField path="model" type="string">
override โมเดลแบบไม่บังคับในรูปแบบ `provider/model`
</ParamField>

<ParamField path="maxBytesMb" type="number">
ขีดจำกัดขนาดต่อ PDF เป็น MB ค่าเริ่มต้นคือ `agents.defaults.pdfMaxBytesMb` หรือ `10`
</ParamField>

หมายเหตุเกี่ยวกับอินพุต:

- `pdf` และ `pdfs` จะถูกรวมและลบรายการซ้ำก่อนโหลด
- หากไม่มีอินพุต PDF เครื่องมือจะส่งข้อผิดพลาด
- `pages` จะถูก parse เป็นหมายเลขหน้าแบบเริ่มนับจาก 1 ลบรายการซ้ำ เรียงลำดับ และจำกัดไม่ให้เกินจำนวนหน้าสูงสุดที่กำหนดไว้
- `maxBytesMb` ใช้ค่าเริ่มต้นจาก `agents.defaults.pdfMaxBytesMb` หรือ `10`

## การอ้างอิง PDF ที่รองรับ

- พาธไฟล์ในเครื่อง (รวมถึงการขยาย `~`)
- URL แบบ `file://`
- URL แบบ `http://` และ `https://`

หมายเหตุเกี่ยวกับการอ้างอิง:

- URI schemes อื่น ๆ (เช่น `ftp://`) จะถูกปฏิเสธด้วย `unsupported_pdf_reference`
- ในโหมด sandbox URL แบบ remote `http(s)` จะถูกปฏิเสธ
- เมื่อเปิดใช้นโยบายไฟล์แบบ workspace-only พาธไฟล์ในเครื่องที่อยู่นอกรากที่อนุญาตจะถูกปฏิเสธ

## โหมดการทำงาน

### โหมด provider แบบเนทีฟ

โหมดเนทีฟจะใช้กับ provider `anthropic` และ `google`
เครื่องมือจะส่งไบต์ PDF ดิบไปยัง API ของ provider โดยตรง

ข้อจำกัดของโหมดเนทีฟ:

- ไม่รองรับ `pages` หากมีการตั้งค่าไว้ เครื่องมือจะส่งข้อผิดพลาดกลับ
- รองรับอินพุตหลาย PDF; แต่ละ PDF จะถูกส่งเป็น native document block /
  inline PDF part ก่อนพรอมป์

### โหมด extraction fallback

โหมด fallback จะใช้กับ providers ที่ไม่ใช่แบบเนทีฟ

ลำดับการทำงาน:

1. ดึงข้อความจากหน้าที่เลือก (สูงสุด `agents.defaults.pdfMaxPages`, ค่าเริ่มต้น `20`)
2. หากความยาวข้อความที่ดึงได้ต่ำกว่า `200` อักขระ ให้เรนเดอร์หน้าที่เลือกเป็นภาพ PNG และแนบไปด้วย
3. ส่งเนื้อหาที่ดึงได้พร้อมพรอมป์ไปยังโมเดลที่เลือก

รายละเอียดของ fallback:

- การดึงภาพของหน้าใช้ pixel budget เท่ากับ `4,000,000`
- หากโมเดลเป้าหมายไม่รองรับอินพุตภาพและไม่มีข้อความที่ดึงได้ เครื่องมือจะส่งข้อผิดพลาด
- หากการดึงข้อความสำเร็จ แต่การดึงภาพต้องใช้ vision กับ
  text-only model OpenClaw จะทิ้งภาพที่เรนเดอร์แล้วและทำต่อด้วย
  ข้อความที่ดึงได้
- extraction fallback ต้องใช้ `pdfjs-dist` (และ `@napi-rs/canvas` สำหรับการเรนเดอร์ภาพ)

## Config

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

ดู [เอกสารอ้างอิงการตั้งค่า](/th/gateway/configuration-reference) สำหรับรายละเอียดฟิลด์แบบเต็ม

## รายละเอียดของเอาต์พุต

เครื่องมือจะส่งกลับข้อความใน `content[0].text` และ metadata แบบมีโครงสร้างใน `details`

ฟิลด์ `details` ทั่วไป:

- `model`: model ref ที่ resolve แล้ว (`provider/model`)
- `native`: `true` สำหรับโหมด provider แบบเนทีฟ, `false` สำหรับ fallback
- `attempts`: fallback attempts ที่ล้มเหลวก่อนจะสำเร็จ

ฟิลด์พาธ:

- อินพุต PDF เดี่ยว: `details.pdf`
- อินพุตหลาย PDF: `details.pdfs[]` พร้อมรายการ `pdf`
- metadata ของการเขียนพาธ sandbox ใหม่ (เมื่อมี): `rewrittenFrom`

## พฤติกรรมข้อผิดพลาด

- ไม่มีอินพุต PDF: โยน `pdf required: provide a path or URL to a PDF document`
- มี PDF มากเกินไป: ส่งข้อผิดพลาดแบบมีโครงสร้างใน `details.error = "too_many_pdfs"`
- scheme ของการอ้างอิงไม่รองรับ: ส่ง `details.error = "unsupported_pdf_reference"`
- โหมดเนทีฟกับ `pages`: โยนข้อผิดพลาดชัดเจน `pages is not supported with native PDF providers`

## ตัวอย่าง

PDF เดี่ยว:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

หลาย PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

โมเดล fallback แบบกรองหน้า:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## ที่เกี่ยวข้อง

- [ภาพรวมเครื่องมือ](/th/tools) — เครื่องมือ agent ทั้งหมดที่ใช้งานได้
- [เอกสารอ้างอิงการตั้งค่า](/th/gateway/config-agents#agent-defaults) — config `pdfMaxBytesMb` และ `pdfMaxPages`
