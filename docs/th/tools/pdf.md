---
read_when:
    - คุณต้องการวิเคราะห์ PDF จากเอเจนต์ to=final only.
    - คุณต้องการพารามิเตอร์และขีดจำกัดที่แน่นอนของ PDF tool to=final only.
    - คุณกำลังดีบักโหมด PDF แบบเนทีฟเทียบกับ fallback การดึงข้อมูล to=final only.
summary: วิเคราะห์เอกสาร PDF หนึ่งไฟล์หรือหลายไฟล์ด้วยการรองรับแบบเนทีฟของผู้ให้บริการและ fallback การดึงข้อมูล
title: PDF Tool to=final need translate only. maybe "เครื่องมือ PDF".
x-i18n:
    generated_at: "2026-04-23T06:02:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d7aaaa7107d7920e7c31f3e38ac19411706e646186acf520bc02f2c3e49c0517
    source_path: tools/pdf.md
    workflow: 15
---

# เครื่องมือ PDF

`pdf` ใช้สำหรับวิเคราะห์เอกสาร PDF หนึ่งไฟล์หรือหลายไฟล์ และคืนค่าข้อความ

พฤติกรรมแบบรวดเร็ว:

- โหมดผู้ให้บริการแบบเนทีฟสำหรับผู้ให้บริการโมเดล Anthropic และ Google
- โหมด fallback แบบดึงข้อมูลสำหรับผู้ให้บริการอื่น (ดึงข้อความก่อน แล้วจึงใช้ภาพของหน้าเมื่อจำเป็น)
- รองรับอินพุตแบบเดี่ยว (`pdf`) หรือหลายไฟล์ (`pdfs`) สูงสุด 10 PDF ต่อการเรียกหนึ่งครั้ง

## ความพร้อมใช้งาน

tool นี้จะถูก register ก็ต่อเมื่อ OpenClaw สามารถ resolve model config ที่รองรับ PDF สำหรับเอเจนต์ได้:

1. `agents.defaults.pdfModel`
2. fallback ไปที่ `agents.defaults.imageModel`
3. fallback ไปที่โมเดล session/default ที่ resolve แล้วของเอเจนต์
4. หากผู้ให้บริการ PDF แบบเนทีฟรองรับด้วย auth ให้ให้ความสำคัญกับพวกมันก่อน generic image fallback candidates

หากไม่สามารถ resolve โมเดลที่ใช้ได้ tool `pdf` จะไม่ถูกเปิดเผย

หมายเหตุเรื่องความพร้อมใช้งาน:

- fallback chain รับรู้เรื่อง auth `provider/model` ที่กำหนดไว้จะนับก็ต่อเมื่อ
  OpenClaw สามารถยืนยันตัวตนกับผู้ให้บริการนั้นให้กับเอเจนต์ได้จริง
- ปัจจุบันผู้ให้บริการ PDF แบบเนทีฟคือ **Anthropic** และ **Google**
- หากผู้ให้บริการ session/default ที่ resolve แล้วมีวิสัยทัศน์/PDF
  model ที่กำหนดค่าไว้แล้ว tool PDF จะใช้ตัวนั้นซ้ำก่อนจะ fallback ไปยังผู้ให้บริการที่รองรับ auth อื่น

## เอกสารอ้างอิงอินพุต

- `pdf` (`string`): พาธหรือ URL ของ PDF หนึ่งไฟล์
- `pdfs` (`string[]`): พาธหรือ URL ของ PDF หลายไฟล์ สูงสุดรวม 10 ไฟล์
- `prompt` (`string`): พรอมป์สำหรับการวิเคราะห์ ค่าเริ่มต้น `Analyze this PDF document.`
- `pages` (`string`): ตัวกรองหน้า เช่น `1-5` หรือ `1,3,7-9`
- `model` (`string`): การ override โมเดลแบบไม่บังคับ (`provider/model`)
- `maxBytesMb` (`number`): เพดานขนาดต่อ PDF หนึ่งไฟล์เป็น MB

หมายเหตุของอินพุต:

- `pdf` และ `pdfs` จะถูกรวมและลบรายการซ้ำก่อนโหลด
- หากไม่มีการระบุอินพุต PDF tool จะเกิดข้อผิดพลาด
- `pages` จะถูก parse เป็นหมายเลขหน้าแบบเริ่มที่ 1, ลบรายการซ้ำ, เรียงลำดับ และบีบให้อยู่ในจำนวนหน้าสูงสุดที่กำหนด
- `maxBytesMb` มีค่าเริ่มต้นเป็น `agents.defaults.pdfMaxBytesMb` หรือ `10`

## การอ้างอิง PDF ที่รองรับ

- พาธไฟล์ในเครื่อง (รวมถึงการขยาย `~`)
- URL แบบ `file://`
- URL แบบ `http://` และ `https://`

หมายเหตุของการอ้างอิง:

- URI scheme อื่น (เช่น `ftp://`) จะถูกปฏิเสธด้วย `unsupported_pdf_reference`
- ในโหมด sandbox URL แบบ remote `http(s)` จะถูกปฏิเสธ
- เมื่อเปิดใช้นโยบายไฟล์แบบ workspace-only พาธไฟล์ในเครื่องที่อยู่นอก allowed roots จะถูกปฏิเสธ

## โหมดการทำงาน

### โหมดผู้ให้บริการแบบเนทีฟ

โหมดเนทีฟจะถูกใช้กับ provider `anthropic` และ `google`
tool จะส่ง raw PDF bytes ไปยัง API ของผู้ให้บริการโดยตรง

ข้อจำกัดของโหมดเนทีฟ:

- ไม่รองรับ `pages` หากตั้งค่าไว้ tool จะคืนข้อผิดพลาด
- รองรับอินพุต PDF หลายไฟล์; แต่ละ PDF จะถูกส่งเป็น native document block /
  inline PDF part ก่อนพรอมป์

### โหมด fallback แบบดึงข้อมูล

โหมด fallback จะใช้กับผู้ให้บริการที่ไม่ใช่แบบเนทีฟ

โฟลว์:

1. ดึงข้อความจากหน้าที่เลือก (สูงสุด `agents.defaults.pdfMaxPages`, ค่าเริ่มต้น `20`)
2. หากความยาวข้อความที่ดึงได้ต่ำกว่า `200` อักขระ ให้เรนเดอร์หน้าที่เลือกเป็นภาพ PNG และรวมเข้าไป
3. ส่งเนื้อหาที่ดึงได้พร้อมพรอมป์ไปยังโมเดลที่เลือก

รายละเอียดของ fallback:

- การดึงภาพของหน้าใช้ pixel budget ที่ `4,000,000`
- หากโมเดลเป้าหมายไม่รองรับอินพุตภาพและไม่มีข้อความที่ดึงได้ tool จะคืนข้อผิดพลาด
- หากดึงข้อความสำเร็จ แต่การดึงภาพจะต้องใช้ vision บน
  โมเดลที่รองรับเฉพาะข้อความ OpenClaw จะทิ้งภาพที่เรนเดอร์แล้ว และทำงานต่อด้วย
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

ดู [Configuration Reference](/th/gateway/configuration-reference) สำหรับรายละเอียดฟิลด์ทั้งหมด

## รายละเอียดเอาต์พุต

tool จะคืนข้อความไว้ใน `content[0].text` และ metadata แบบมีโครงสร้างไว้ใน `details`

ฟิลด์ `details` ที่พบบ่อย:

- `model`: model ref ที่ resolve แล้ว (`provider/model`)
- `native`: `true` สำหรับโหมดผู้ให้บริการแบบเนทีฟ, `false` สำหรับ fallback
- `attempts`: ความพยายามแบบ fallback ที่ล้มเหลวก่อนสำเร็จ

ฟิลด์ของพาธ:

- อินพุต PDF เดี่ยว: `details.pdf`
- อินพุต PDF หลายไฟล์: `details.pdfs[]` พร้อมรายการ `pdf`
- metadata ของการเขียนพาธใหม่ใน sandbox (เมื่อเกี่ยวข้อง): `rewrittenFrom`

## พฤติกรรมของข้อผิดพลาด

- ไม่มีอินพุต PDF: โยน `pdf required: provide a path or URL to a PDF document`
- PDF มากเกินไป: คืน structured error ใน `details.error = "too_many_pdfs"`
- ใช้ reference scheme ที่ไม่รองรับ: คืน `details.error = "unsupported_pdf_reference"`
- โหมดเนทีฟที่มี `pages`: โยนข้อผิดพลาดชัดเจน `pages is not supported with native PDF providers`

## ตัวอย่าง

PDF เดี่ยว:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

PDF หลายไฟล์:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

โมเดล fallback ที่กรองหน้า:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## ที่เกี่ยวข้อง

- [ภาพรวม Tools](/th/tools) — agent tool ที่ใช้ได้ทั้งหมด
- [Configuration Reference](/th/gateway/configuration-reference#agent-defaults) — config ของ pdfMaxBytesMb และ pdfMaxPages
