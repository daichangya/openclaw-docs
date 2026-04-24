---
read_when:
    - กำลังทำงานกับโค้ดหรือการทดสอบการผสานรวม Pi
    - กำลังรัน lint, typecheck และโฟลว์การทดสอบแบบสดที่เฉพาะกับ Pi
summary: 'เวิร์กโฟลว์สำหรับนักพัฒนาสำหรับการผสานรวม Pi: build, test และการตรวจสอบแบบสด'
title: เวิร์กโฟลว์การพัฒนา Pi
x-i18n:
    generated_at: "2026-04-24T09:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

คู่มือนี้สรุปเวิร์กโฟลว์ที่เหมาะสมสำหรับการทำงานกับการผสานรวม Pi ใน OpenClaw

## การตรวจสอบชนิดข้อมูลและ Linting

- local gate เริ่มต้น: `pnpm check`
- build gate: `pnpm build` เมื่อการเปลี่ยนแปลงอาจส่งผลต่อเอาต์พุตของ build, packaging หรือขอบเขต lazy-loading/module
- landing gate แบบเต็มสำหรับการเปลี่ยนแปลงที่เกี่ยวกับ Pi มาก: `pnpm check && pnpm test`

## การรันการทดสอบ Pi

รันชุดการทดสอบที่เน้น Pi โดยตรงด้วย Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

หากต้องการรวมการทดสอบผู้ให้บริการแบบสดด้วย:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

สิ่งนี้ครอบคลุมชุด unit หลักของ Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## การทดสอบด้วยตนเอง

โฟลว์ที่แนะนำ:

- รัน gateway ในโหมด dev:
  - `pnpm gateway:dev`
- ทริกเกอร์เอเจนต์โดยตรง:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- ใช้ TUI สำหรับการดีบักแบบโต้ตอบ:
  - `pnpm tui`

สำหรับพฤติกรรมของ tool call ให้ prompt เพื่อทำ action แบบ `read` หรือ `exec` เพื่อให้คุณเห็นการสตรีมของเครื่องมือและการจัดการ payload

## การรีเซ็ตแบบเริ่มใหม่ทั้งหมด

สถานะจะอยู่ภายใต้ไดเรกทอรีสถานะของ OpenClaw ค่าเริ่มต้นคือ `~/.openclaw` หากตั้งค่า `OPENCLAW_STATE_DIR` ไว้ ให้ใช้ไดเรกทอรีนั้นแทน

หากต้องการรีเซ็ตทุกอย่าง:

- `openclaw.json` สำหรับคอนฟิก
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth profiles ของโมเดล (API keys + OAuth)
- `credentials/` สำหรับสถานะผู้ให้บริการ/ช่องทางที่ยังคงอยู่ภายนอก auth profile store
- `agents/<agentId>/sessions/` สำหรับประวัติเซสชันของเอเจนต์
- `agents/<agentId>/sessions/sessions.json` สำหรับดัชนีเซสชัน
- `sessions/` หากยังมีพาธแบบ legacy อยู่
- `workspace/` หากคุณต้องการ workspace ที่ว่างเปล่า

หากคุณต้องการรีเซ็ตเฉพาะเซสชัน ให้ลบ `agents/<agentId>/sessions/` สำหรับเอเจนต์นั้น หากคุณต้องการเก็บ auth ไว้ ให้คง `agents/<agentId>/agent/auth-profiles.json` และสถานะของผู้ให้บริการใด ๆ ภายใต้ `credentials/` ไว้ตามเดิม

## อ้างอิง

- [การทดสอบ](/th/help/testing)
- [การเริ่มต้นใช้งาน](/th/start/getting-started)

## ที่เกี่ยวข้อง

- [สถาปัตยกรรมการผสานรวม Pi](/th/pi)
