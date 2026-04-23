---
read_when:
    - การทำงานกับโค้ดหรือการทดสอบสำหรับการผสานรวม Pi
    - การรัน lint, typecheck และโฟลว์การทดสอบแบบ live เฉพาะของ Pi
summary: 'เวิร์กโฟลว์สำหรับนักพัฒนาสำหรับการผสานรวม Pi: build, test และการตรวจสอบแบบ live'
title: เวิร์กโฟลว์การพัฒนา Pi
x-i18n:
    generated_at: "2026-04-23T05:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# เวิร์กโฟลว์การพัฒนา Pi

คู่มือนี้สรุปเวิร์กโฟลว์ที่เหมาะสมสำหรับการทำงานกับการผสานรวม Pi ใน OpenClaw

## การตรวจชนิดและ Linting

- gate ในเครื่องเริ่มต้น: `pnpm check`
- gate สำหรับ build: `pnpm build` เมื่อการเปลี่ยนแปลงอาจมีผลต่อเอาต์พุตของ build, การแพ็กเกจ หรือขอบเขตของ lazy-loading/module
- gate เต็มรูปแบบก่อนนำขึ้นสำหรับการเปลี่ยนแปลงที่เกี่ยวกับ Pi มาก: `pnpm check && pnpm test`

## การรันการทดสอบของ Pi

รันชุดการทดสอบที่โฟกัส Pi โดยตรงด้วย Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

หากต้องการรวมการทดสอบผู้ให้บริการแบบ live:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

สิ่งนี้ครอบคลุมชุด unit ของ Pi หลัก:

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
- เรียกเอเจนต์โดยตรง:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- ใช้ TUI สำหรับการดีบักแบบโต้ตอบ:
  - `pnpm tui`

สำหรับพฤติกรรมของการเรียก tool ให้พรอมป์การกระทำ `read` หรือ `exec` เพื่อให้คุณเห็นการสตรีมของ tool และการจัดการ payload

## การรีเซ็ตให้สะอาดหมดจด

สถานะจะอยู่ใต้ไดเรกทอรี state ของ OpenClaw ค่าเริ่มต้นคือ `~/.openclaw` หากมีการตั้งค่า `OPENCLAW_STATE_DIR` ให้ใช้ไดเรกทอรีนั้นแทน

หากต้องการรีเซ็ตทุกอย่าง:

- `openclaw.json` สำหรับ config
- `agents/<agentId>/agent/auth-profiles.json` สำหรับโปรไฟล์ auth ของโมเดล (API keys + OAuth)
- `credentials/` สำหรับสถานะของผู้ให้บริการ/ช่องทางที่ยังคงอยู่นอกร้านเก็บ auth profile
- `agents/<agentId>/sessions/` สำหรับประวัติเซสชันของเอเจนต์
- `agents/<agentId>/sessions/sessions.json` สำหรับดัชนีเซสชัน
- `sessions/` หากยังมีพาธแบบเดิมอยู่
- `workspace/` หากคุณต้องการ workspace ว่างเปล่า

หากคุณต้องการรีเซ็ตเฉพาะเซสชัน ให้ลบ `agents/<agentId>/sessions/` สำหรับเอเจนต์นั้น หากคุณต้องการเก็บ auth ไว้ ให้คง `agents/<agentId>/agent/auth-profiles.json` และสถานะของผู้ให้บริการภายใต้ `credentials/` ไว้ตามเดิม

## แหล่งอ้างอิง

- [Testing](/th/help/testing)
- [Getting Started](/th/start/getting-started)
