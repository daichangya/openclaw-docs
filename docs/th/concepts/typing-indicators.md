---
read_when:
    - การเปลี่ยนพฤติกรรมหรือค่าเริ่มต้นของตัวบ่งชี้การพิมพ์
summary: เมื่อ OpenClaw แสดงตัวบ่งชี้การพิมพ์ และวิธีปรับแต่งมัน
title: ตัวบ่งชี้การพิมพ์
x-i18n:
    generated_at: "2026-04-23T05:32:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e7e8ca448b6706b6f53fcb6a582be6d4a84715c82dfde3d53abe4268af3ae0d
    source_path: concepts/typing-indicators.md
    workflow: 15
---

# ตัวบ่งชี้การพิมพ์

ตัวบ่งชี้การพิมพ์จะถูกส่งไปยังช่องแชตขณะที่การรันยังทำงานอยู่ ใช้
`agents.defaults.typingMode` เพื่อควบคุมว่า **การพิมพ์เริ่มเมื่อใด** และใช้ `typingIntervalSeconds`
เพื่อควบคุมว่า **รีเฟรชบ่อยแค่ไหน**

## ค่าเริ่มต้น

เมื่อ `agents.defaults.typingMode` **ไม่ได้ถูกตั้งค่า** OpenClaw จะคงพฤติกรรมเดิมไว้:

- **แชตโดยตรง**: การพิมพ์จะเริ่มทันทีเมื่อ model loop เริ่มต้น
- **แชตกลุ่มที่มีการ mention**: การพิมพ์จะเริ่มทันที
- **แชตกลุ่มที่ไม่มีการ mention**: การพิมพ์จะเริ่มก็ต่อเมื่อข้อความเริ่มสตรีม
- **การรัน Heartbeat**: การพิมพ์จะเริ่มเมื่อการรัน Heartbeat เริ่มต้น หาก
  เป้าหมาย Heartbeat ที่ resolve ได้เป็นแชตที่รองรับการพิมพ์ และไม่ได้ปิดการพิมพ์ไว้

## โหมด

ตั้งค่า `agents.defaults.typingMode` เป็นค่าใดค่าหนึ่งต่อไปนี้:

- `never` — ไม่มีตัวบ่งชี้การพิมพ์ ไม่ว่าเมื่อใด
- `instant` — เริ่มพิมพ์ **ทันทีที่ model loop เริ่มต้น** แม้ว่าภายหลังการรัน
  จะคืนมาเพียง silent reply token เท่านั้น
- `thinking` — เริ่มพิมพ์เมื่อมี **reasoning delta แรก** (ต้องใช้
  `reasoningLevel: "stream"` สำหรับการรันนั้น)
- `message` — เริ่มพิมพ์เมื่อมี **text delta ตัวแรกที่ไม่ใช่แบบเงียบ** (ละเว้น
  silent token `NO_REPLY`)

ลำดับของ “เริ่มเร็วแค่ไหน”:
`never` → `message` → `thinking` → `instant`

## การกำหนดค่า

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

คุณสามารถ override โหมดหรือรอบเวลาได้ต่อเซสชัน:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## หมายเหตุ

- โหมด `message` จะไม่แสดงการพิมพ์สำหรับคำตอบที่เงียบอย่างเดียวเมื่อ
  payload ทั้งหมดเป็น silent token ที่ตรงกันพอดี (เช่น `NO_REPLY` / `no_reply`,
  จับคู่โดยไม่สนใจตัวพิมพ์เล็กใหญ่)
- `thinking` จะทำงานก็ต่อเมื่อการรันสตรีม reasoning (`reasoningLevel: "stream"`)
  หากโมเดลไม่ปล่อย reasoning delta การพิมพ์จะไม่เริ่ม
- การพิมพ์ของ Heartbeat เป็นสัญญาณบอกการมีชีวิตของเป้าหมายการส่งที่ resolve ได้ มัน
  เริ่มตั้งแต่เริ่มการรัน Heartbeat แทนที่จะทำตามจังหวะสตรีมของ `message` หรือ `thinking`
  ตั้งค่า `typingMode: "never"` เพื่อปิดใช้งาน
- Heartbeat จะไม่แสดงการพิมพ์เมื่อ `target: "none"` เมื่อไม่สามารถ
  resolve เป้าหมายได้ เมื่อปิดการส่งแชตสำหรับ Heartbeat หรือเมื่อ
  ช่องทางไม่รองรับการพิมพ์
- `typingIntervalSeconds` ควบคุม **รอบการรีเฟรช** ไม่ใช่เวลาเริ่มต้น
  ค่าเริ่มต้นคือ 6 วินาที
