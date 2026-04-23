---
read_when:
    - การเริ่มเซสชันเอเจนต์ OpenClaw ใหม่
    - การเปิดใช้หรือตรวจสอบ Skills เริ่มต้น
summary: คำสั่งเอเจนต์เริ่มต้นของ OpenClaw และรายการ Skills สำหรับการตั้งค่าผู้ช่วยส่วนตัว
title: AGENTS.md เริ่มต้น
x-i18n:
    generated_at: "2026-04-23T05:54:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45990bc4e6fa2e3d80e76207e62ec312c64134bee3bc832a5cae32ca2eda3b61
    source_path: reference/AGENTS.default.md
    workflow: 15
---

# AGENTS.md - ผู้ช่วยส่วนตัว OpenClaw (ค่าเริ่มต้น)

## การรันครั้งแรก (แนะนำ)

OpenClaw ใช้ไดเรกทอรี workspace แยกสำหรับเอเจนต์ ค่าเริ่มต้นคือ `~/.openclaw/workspace` (กำหนดค่าได้ผ่าน `agents.defaults.workspace`)

1. สร้าง workspace (หากยังไม่มี):

```bash
mkdir -p ~/.openclaw/workspace
```

2. คัดลอก template ของ workspace เริ่มต้นเข้าไปใน workspace:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. ทางเลือก: หากคุณต้องการรายการ Skills สำหรับผู้ช่วยส่วนตัว ให้แทนที่ AGENTS.md ด้วยไฟล์นี้:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. ทางเลือก: เลือก workspace อื่นโดยตั้งค่า `agents.defaults.workspace` (รองรับ `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## ค่าเริ่มต้นด้านความปลอดภัย

- อย่าทุ่มรายการไดเรกทอรีหรือความลับลงในแชต
- อย่ารันคำสั่งที่ทำลายข้อมูล เว้นแต่จะถูกขออย่างชัดเจน
- อย่าส่งคำตอบแบบ partial/streaming ไปยังพื้นผิวข้อความภายนอก (ส่งเฉพาะคำตอบสุดท้าย)

## การเริ่มต้นเซสชัน (จำเป็น)

- อ่าน `SOUL.md`, `USER.md` และไฟล์ของวันนี้+เมื่อวานใน `memory/`
- อ่าน `MEMORY.md` เมื่อมีอยู่; fallback ไปใช้ `memory.md` ตัวพิมพ์เล็กเฉพาะเมื่อไม่มี `MEMORY.md`
- ทำสิ่งนี้ก่อนตอบกลับ

## Soul (จำเป็น)

- `SOUL.md` กำหนดตัวตน โทน และขอบเขต ควรรักษาให้เป็นปัจจุบัน
- หากคุณเปลี่ยน `SOUL.md` ให้บอกผู้ใช้
- คุณคืออินสแตนซ์ใหม่ในแต่ละเซสชัน; ความต่อเนื่องอยู่ในไฟล์เหล่านี้

## พื้นที่ที่ใช้ร่วมกัน (แนะนำ)

- คุณไม่ใช่เสียงของผู้ใช้; ต้องระมัดระวังในแชตกลุ่มหรือแชนเนลสาธารณะ
- อย่าแชร์ข้อมูลส่วนตัว ข้อมูลติดต่อ หรือบันทึกภายใน

## ระบบ memory (แนะนำ)

- บันทึกรายวัน: `memory/YYYY-MM-DD.md` (สร้าง `memory/` หากจำเป็น)
- memory ระยะยาว: `MEMORY.md` สำหรับข้อเท็จจริง ความชอบ และการตัดสินใจที่คงอยู่
- `memory.md` ตัวพิมพ์เล็กเป็นเพียง fallback แบบเดิม; อย่าตั้งใจเก็บทั้งสองไฟล์ root พร้อมกัน
- เมื่อเริ่มเซสชัน ให้อ่านวันนี้ + เมื่อวาน + `MEMORY.md` หากมี มิฉะนั้นใช้ `memory.md`
- สิ่งที่ควรบันทึก: การตัดสินใจ ความชอบ ข้อจำกัด วงงานที่ยังไม่ปิด
- หลีกเลี่ยงการบันทึกความลับ เว้นแต่จะถูกร้องขออย่างชัดเจน

## Tools & Skills

- Tools อยู่ใน Skills; ทำตาม `SKILL.md` ของแต่ละ skill เมื่อคุณต้องใช้มัน
- เก็บบันทึกเฉพาะสภาพแวดล้อมไว้ใน `TOOLS.md` (Notes for Skills)

## เคล็ดลับเรื่องการสำรองข้อมูล (แนะนำ)

หากคุณถือว่า workspace นี้เป็น “memory” ของ Clawd ให้ทำมันเป็น git repo (ควรเป็น private) เพื่อให้ `AGENTS.md` และไฟล์ memory ของคุณถูกสำรองไว้

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# ทางเลือก: เพิ่ม private remote + push
```

## สิ่งที่ OpenClaw ทำ

- รัน WhatsApp gateway + Pi coding agent เพื่อให้ผู้ช่วยสามารถอ่าน/เขียนแชต ดึงบริบท และรัน Skills ผ่าน Mac โฮสต์ได้
- แอป macOS จัดการสิทธิ์ (screen recording, notifications, microphone) และเปิดเผย CLI `openclaw` ผ่านไบนารีที่ bundle มา
- แชตตรงจะถูกรวมเข้าเซสชัน `main` ของเอเจนต์เป็นค่าเริ่มต้น ส่วนกลุ่มจะถูกแยกเป็น `agent:<agentId>:<channel>:group:<id>` (ห้อง/แชนเนล: `agent:<agentId>:<channel>:channel:<id>`); Heartbeat ช่วยให้แบ็กกราวด์ทาสก์ยังคงทำงานอยู่

## Skills หลัก (เปิดใช้ใน Settings → Skills)

- **mcporter** — runtime/CLI ของ tool server สำหรับจัดการ backend ของ skill ภายนอก
- **Peekaboo** — จับภาพหน้าจอ macOS อย่างรวดเร็ว พร้อมตัวเลือกวิเคราะห์ภาพด้วย AI
- **camsnap** — จับเฟรม คลิป หรือการแจ้งเตือนการเคลื่อนไหวจากกล้องรักษาความปลอดภัย RTSP/ONVIF
- **oracle** — agent CLI ที่พร้อมใช้กับ OpenAI พร้อม session replay และการควบคุมเบราว์เซอร์
- **eightctl** — ควบคุมการนอนของคุณจากเทอร์มินัล
- **imsg** — ส่ง อ่าน และสตรีม iMessage & SMS
- **wacli** — WhatsApp CLI: sync, search, send
- **discord** — action ของ Discord: react, stickers, polls ใช้ target แบบ `user:<id>` หรือ `channel:<id>` (id แบบตัวเลขล้วนกำกวม)
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts
- **spotify-player** — ไคลเอนต์ Spotify บนเทอร์มินัลสำหรับค้นหา/เข้าคิว/ควบคุมการเล่น
- **sag** — เสียงพูดของ ElevenLabs พร้อม UX แบบ say บน Mac; สตรีมออกลำโพงเป็นค่าเริ่มต้น
- **Sonos CLI** — ควบคุมลำโพง Sonos (discover/status/playback/volume/grouping) จากสคริปต์
- **blucli** — เล่น จัดกลุ่ม และทำระบบอัตโนมัติให้ BluOS player จากสคริปต์
- **OpenHue CLI** — ควบคุมแสง Philips Hue สำหรับฉากและระบบอัตโนมัติ
- **OpenAI Whisper** — speech-to-text ในเครื่องสำหรับการจดคำบอกและถอดข้อความเสียงอย่างรวดเร็ว
- **Gemini CLI** — โมเดล Google Gemini จากเทอร์มินัลสำหรับ Q&A อย่างรวดเร็ว
- **agent-tools** — ชุดเครื่องมือยูทิลิตีสำหรับระบบอัตโนมัติและสคริปต์ช่วยเหลือ

## หมายเหตุการใช้งาน

- ควรใช้ `openclaw` CLI สำหรับงานสคริปต์; แอป mac จัดการสิทธิ์ให้
- รันการติดตั้งจากแท็บ Skills; ระบบจะซ่อนปุ่มหากมีไบนารีอยู่แล้ว
- ควรเปิด Heartbeat ไว้เพื่อให้ผู้ช่วยสามารถตั้งการเตือน เฝ้าติดตาม inbox และทริกเกอร์การจับภาพจากกล้องได้
- Canvas UI รันแบบเต็มหน้าจอพร้อมโอเวอร์เลย์แบบเนทีฟ หลีกเลี่ยงการวางตัวควบคุมสำคัญไว้ที่มุมบนซ้าย/บนขวา/ขอบล่าง; ควรเพิ่ม gutter อย่างชัดเจนในเลย์เอาต์ และอย่าพึ่ง safe-area inset
- สำหรับการตรวจสอบที่ขับเคลื่อนด้วยเบราว์เซอร์ ให้ใช้ `openclaw browser` (tabs/status/screenshot) กับ Chrome profile ที่ OpenClaw จัดการไว้
- สำหรับการตรวจสอบ DOM ให้ใช้ `openclaw browser eval|query|dom|snapshot` (และ `--json`/`--out` เมื่อคุณต้องการเอาต์พุตสำหรับเครื่อง)
- สำหรับการโต้ตอบ ให้ใช้ `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type ต้องใช้ snapshot ref; ใช้ `evaluate` สำหรับ CSS selector)
