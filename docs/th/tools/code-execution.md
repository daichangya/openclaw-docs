---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า `code_execution`
    - คุณต้องการการวิเคราะห์ระยะไกลโดยไม่ต้องเข้าถึง shell ในเครื่อง
    - คุณต้องการใช้ `x_search` หรือ `web_search` ร่วมกับการวิเคราะห์ Python ระยะไกล
summary: code_execution -- รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed ด้วย xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-23T05:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` ใช้รันการวิเคราะห์ Python ระยะไกลแบบ sandboxed บน Responses API ของ xAI
สิ่งนี้ต่างจาก [`exec`](/th/tools/exec) แบบ local:

- `exec` รัน shell commands บนเครื่องของคุณหรือบน node
- `code_execution` รัน Python ใน sandbox ระยะไกลของ xAI

ใช้ `code_execution` สำหรับ:

- การคำนวณ
- การทำตาราง
- สถิติแบบรวดเร็ว
- การวิเคราะห์สไตล์กราฟ
- การวิเคราะห์ข้อมูลที่ได้จาก `x_search` หรือ `web_search`

อย่าใช้มันเมื่อคุณต้องการไฟล์ในเครื่อง shell ของคุณ repo ของคุณ หรือ paired
devices ในกรณีนั้นให้ใช้ [`exec`](/th/tools/exec)

## การตั้งค่า

คุณต้องมี xAI API key โดยคีย์ต่อไปนี้ใช้ได้ทั้งหมด:

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

ถามแบบธรรมชาติและระบุเจตนาในการวิเคราะห์ให้ชัดเจน:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

ภายในเครื่องมือนี้รับพารามิเตอร์ `task` เพียงตัวเดียว ดังนั้นเอเจนต์ควรส่ง
คำขอวิเคราะห์ทั้งหมดและข้อมูลแบบ inline ที่เกี่ยวข้องในพรอมป์ต์เดียว

## ข้อจำกัด

- นี่คือการรันระยะไกลของ xAI ไม่ใช่การรันโปรเซสในเครื่อง
- ควรมองว่าเป็นการวิเคราะห์ชั่วคราว ไม่ใช่ notebook แบบคงอยู่
- อย่าคาดหวังการเข้าถึงไฟล์ในเครื่องหรือ workspace ของคุณ
- หากต้องการข้อมูล X ล่าสุด ให้ใช้ [`x_search`](/th/tools/web#x_search) ก่อน

## ดูเพิ่มเติม

- [Web tools](/th/tools/web)
- [Exec](/th/tools/exec)
- [xAI](/th/providers/xai)
