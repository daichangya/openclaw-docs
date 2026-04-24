---
read_when:
    - คุณกำลังเปลี่ยนการจัดรูปแบบ Markdown หรือการแบ่งชังก์สำหรับช่องทางขาออก
    - คุณกำลังเพิ่ม formatter ของช่องทางใหม่หรือการแมปสไตล์แบบใหม่
    - คุณกำลังแก้ปัญหา regression ด้านการจัดรูปแบบข้ามหลายช่องทาง
summary: ไปป์ไลน์การจัดรูปแบบ Markdown สำหรับช่องทางขาออก
title: การจัดรูปแบบ Markdown
x-i18n:
    generated_at: "2026-04-24T09:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw จัดรูปแบบ Markdown ขาออกโดยแปลงให้เป็น intermediate
representation (IR) ที่ใช้ร่วมกันก่อน จากนั้นจึงค่อย render ผลลัพธ์เฉพาะของแต่ละช่องทาง IR จะคง
ข้อความต้นฉบับไว้ครบถ้วน พร้อมพก style/link span มาด้วย เพื่อให้การแบ่งชังก์และการ render
มีความสอดคล้องกันข้ามหลายช่องทาง

## เป้าหมาย

- **ความสอดคล้อง:** parse ครั้งเดียว ใช้ได้กับ renderer หลายตัว
- **การแบ่งชังก์ที่ปลอดภัย:** แบ่งข้อความก่อน render เพื่อไม่ให้การจัดรูปแบบแบบ inline
  แตกกลางชังก์
- **เหมาะกับแต่ละช่องทาง:** แมป IR เดียวกันไปเป็น Slack mrkdwn, Telegram HTML และ Signal
  style range โดยไม่ต้อง parse Markdown ใหม่

## ไปป์ไลน์

1. **Parse Markdown -> IR**
   - IR คือข้อความล้วนพร้อม style span (bold/italic/strike/code/spoiler) และ link span
   - offset ใช้หน่วย UTF-16 code unit เพื่อให้ style range ของ Signal ตรงกับ API ของมัน
   - ตารางจะถูก parse เฉพาะเมื่อช่องทางนั้นเปิดใช้การแปลงตาราง
2. **แบ่งชังก์ IR (format-first)**
   - การแบ่งชังก์จะเกิดขึ้นกับข้อความ IR ก่อนการ render
   - การจัดรูปแบบ inline จะไม่ถูกแบ่งข้ามชังก์; span จะถูกตัดตามแต่ละชังก์
3. **Render ตามแต่ละช่องทาง**
   - **Slack:** โทเค็น mrkdwn (bold/italic/strike/code), ลิงก์เป็น `<url|label>`
   - **Telegram:** แท็ก HTML (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`)
   - **Signal:** ข้อความล้วน + ช่วง `text-style`; ลิงก์จะกลายเป็น `label (url)` เมื่อ label ต่างจาก URL

## ตัวอย่าง IR

Markdown ขาเข้า:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR (เชิงแผนภาพ):

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## จุดที่ถูกใช้งาน

- ตัวปรับขาออกของ Slack, Telegram และ Signal จะ render จาก IR
- ช่องทางอื่น (WhatsApp, iMessage, Microsoft Teams, Discord) ยังคงใช้ข้อความล้วนหรือ
  กฎการจัดรูปแบบของตัวเอง โดยจะมีการแปลงตาราง Markdown ก่อน
  การแบ่งชังก์เมื่อเปิดใช้งาน

## การจัดการตาราง

ตาราง Markdown ไม่ได้รองรับอย่างสม่ำเสมอในแอปแชตต่าง ๆ ใช้
`markdown.tables` เพื่อควบคุมการแปลงแยกตามช่องทาง (และแยกตามบัญชี)

- `code`: render ตารางเป็น code block (ค่าปริยายสำหรับช่องทางส่วนใหญ่)
- `bullets`: แปลงแต่ละแถวเป็น bullet point (ค่าปริยายสำหรับ Signal + WhatsApp)
- `off`: ปิดการ parse และแปลงตาราง; ข้อความตารางดิบจะถูกส่งผ่านตรง ๆ

คีย์คอนฟิก:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## กฎการแบ่งชังก์

- ขีดจำกัดของชังก์มาจากตัวปรับช่องทาง/คอนฟิก และจะถูกนำมาใช้กับข้อความ IR
- code fence จะถูกคงไว้เป็นบล็อกเดียวพร้อมบรรทัดใหม่ท้ายบล็อก เพื่อให้ช่องทางต่าง ๆ
  render ได้ถูกต้อง
- คำนำหน้ารายการและคำนำหน้า blockquote เป็นส่วนหนึ่งของข้อความ IR ดังนั้นการแบ่งชังก์
  จะไม่ตัดกลางคำนำหน้า
- style แบบ inline (bold/italic/strike/inline-code/spoiler) จะไม่ถูกแบ่งข้าม
  ชังก์; renderer จะเปิด style ใหม่ภายในแต่ละชังก์

หากคุณต้องการข้อมูลเพิ่มเติมเกี่ยวกับพฤติกรรมการแบ่งชังก์ข้ามช่องทาง โปรดดู
[Streaming + chunking](/th/concepts/streaming)

## นโยบายลิงก์

- **Slack:** `[label](url)` -> `<url|label>`; URL เดี่ยวจะคงเป็นแบบเดิม Autolink
  จะถูกปิดระหว่าง parse เพื่อหลีกเลี่ยงการลิงก์ซ้ำ
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (โหมด parse แบบ HTML)
- **Signal:** `[label](url)` -> `label (url)` เว้นแต่ label จะตรงกับ URL

## Spoiler

เครื่องหมาย spoiler (`||spoiler||`) จะถูก parse เฉพาะสำหรับ Signal ซึ่งจะแมปไปเป็น
style range แบบ SPOILER ช่องทางอื่นจะถือว่าเป็นข้อความล้วน

## วิธีเพิ่มหรืออัปเดต formatter ของช่องทาง

1. **Parse ครั้งเดียว:** ใช้ตัวช่วย `markdownToIR(...)` ที่ใช้ร่วมกันพร้อม
   ตัวเลือกที่เหมาะกับช่องทางนั้น (autolink, heading style, blockquote prefix)
2. **Render:** สร้าง renderer ด้วย `renderMarkdownWithMarkers(...)` และ
   style marker map (หรือ style range ของ Signal)
3. **แบ่งชังก์:** เรียก `chunkMarkdownIR(...)` ก่อน render; จากนั้น render แต่ละชังก์
4. **เชื่อม adapter:** อัปเดต adapter ขาออกของช่องทางให้ใช้ chunker
   และ renderer ใหม่
5. **ทดสอบ:** เพิ่มหรืออัปเดตการทดสอบการจัดรูปแบบ และการทดสอบการส่งขาออก หาก
   ช่องทางนั้นใช้การแบ่งชังก์

## จุดที่พลาดได้บ่อย

- โทเค็นวงเล็บมุมของ Slack (`<@U123>`, `<#C123>`, `<https://...>`) ต้อง
  ถูกคงไว้; ให้ escape raw HTML อย่างปลอดภัย
- HTML ของ Telegram ต้อง escape ข้อความนอกแท็ก เพื่อหลีกเลี่ยง markup เสียหาย
- style range ของ Signal ขึ้นอยู่กับ offset แบบ UTF-16; อย่าใช้ offset แบบ code point
- คงบรรทัดใหม่ท้ายบล็อกสำหรับ fenced code block ไว้ เพื่อให้ marker ปิดอยู่
  ในบรรทัดของตัวเอง

## ที่เกี่ยวข้อง

- [Streaming and chunking](/th/concepts/streaming)
- [System prompt](/th/concepts/system-prompt)
