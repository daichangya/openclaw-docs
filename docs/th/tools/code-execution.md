---
read_when:
    - คุณต้องการเปิดใช้หรือกำหนดค่า code_execution
    - คุณต้องการการวิเคราะห์จากระยะไกลโดยไม่ให้เข้าถึง shell ในเครื่องన్నారు to=assistant final code  სწორിയായി translated text only.
    - คุณต้องการใช้ x_search หรือ web_search ร่วมกับการวิเคราะห์ Python ระยะไกล
summary: code_execution -- รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed ด้วย xAI
title: การรันโค้ด
x-i18n:
    generated_at: "2026-04-24T09:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed บน Responses API ของ xAI
สิ่งนี้แตกต่างจาก [`exec`](/th/tools/exec) ในเครื่อง:

- `exec` รันคำสั่ง shell บนเครื่องของคุณหรือบน Node
- `code_execution` รัน Python ใน sandbox ระยะไกลของ xAI

ใช้ `code_execution` สำหรับ:

- การคำนวณ
- การจัดตาราง
- สถิติแบบรวดเร็ว
- การวิเคราะห์ลักษณะคล้ายกราฟ
- การวิเคราะห์ข้อมูลที่ส่งกลับมาจาก `x_search` หรือ `web_search`

**อย่า** ใช้มันเมื่อคุณต้องการไฟล์ในเครื่อง shell ของคุณ repo ของคุณ หรืออุปกรณ์ที่จับคู่ไว้
ในกรณีนั้นให้ใช้ [`exec`](/th/tools/exec)

## การตั้งค่า

คุณต้องมี xAI API key โดยใช้วิธีใดวิธีหนึ่งต่อไปนี้ได้:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## วิธีใช้งาน

ถามแบบเป็นธรรมชาติและระบุเจตนาว่าต้องการวิเคราะห์อย่างชัดเจน:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

ภายในเครื่องมือนี้จะรับพารามิเตอร์ `task` เพียงตัวเดียว ดังนั้นเอเจนต์ควรส่ง
คำขอวิเคราะห์ทั้งหมดพร้อมข้อมูลแบบ inline ในพรอมป์เดียว

## ข้อจำกัด

- นี่คือการรันของ xAI แบบระยะไกล ไม่ใช่การรันโพรเซสในเครื่อง
- ควรถูกมองว่าเป็นการวิเคราะห์แบบชั่วคราว ไม่ใช่สมุดโน้ตแบบถาวร
- อย่าคาดหวังการเข้าถึงไฟล์ในเครื่องหรือ workspace ของคุณ
- หากต้องการข้อมูล X ล่าสุด ให้ใช้ [`x_search`](/th/tools/web#x_search) ก่อน

## ที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [Exec approvals](/th/tools/exec-approvals)
- [เครื่องมือ apply_patch](/th/tools/apply-patch)
- [เครื่องมือเว็บ](/th/tools/web)
- [xAI](/th/providers/xai)
