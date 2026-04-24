---
read_when:
    - การรัน Gateway มากกว่าหนึ่งตัวบนเครื่องเดียวกัน
    - คุณต้องการ config/สถานะ/พอร์ตที่แยกจากกันต่อ Gateway
summary: เรียกใช้ OpenClaw Gateways หลายตัวบนโฮสต์เดียว (การแยก พอร์ต และโปรไฟล์)
title: หลาย Gateway
x-i18n:
    generated_at: "2026-04-24T09:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# หลาย Gateway (โฮสต์เดียวกัน)

โดยส่วนใหญ่ควรใช้ Gateway เดียว เพราะ Gateway หนึ่งตัวสามารถจัดการการเชื่อมต่อการส่งข้อความและ agents หลายตัวได้ หากคุณต้องการการแยกที่เข้มงวดขึ้นหรือความซ้ำซ้อน (เช่น rescue bot) ให้รัน Gateway แยกกันโดยใช้ profiles/ports ที่แยกอิสระ

## รูปแบบการตั้งค่าที่แนะนำที่สุด

สำหรับผู้ใช้ส่วนใหญ่ การตั้งค่า rescue-bot ที่ง่ายที่สุดคือ:

- ให้บอตหลักอยู่บนโปรไฟล์ค่าเริ่มต้น
- รัน rescue bot บน `--profile rescue`
- ใช้ Telegram bot แยกคนละตัวโดยสมบูรณ์สำหรับบัญชี rescue
- ให้ rescue bot ใช้ base port อื่น เช่น `19789`

วิธีนี้ทำให้ rescue bot แยกจากบอตหลัก จึงสามารถดีบักหรือแก้ไข
config ได้หากบอตหลักล่ม เว้นระยะอย่างน้อย 20 พอร์ตระหว่าง
base ports เพื่อให้พอร์ต browser/canvas/CDP ที่อนุมานได้ไม่ชนกัน

## Rescue-Bot Quickstart

ใช้วิธีนี้เป็นเส้นทางเริ่มต้น เว้นแต่คุณมีเหตุผลหนักแน่นที่จะทำอย่างอื่น:

```bash
# Rescue bot (Telegram bot แยก โปรไฟล์แยก พอร์ต 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

หากบอตหลักของคุณกำลังทำงานอยู่แล้ว โดยทั่วไปนี่คือทั้งหมดที่คุณต้องทำ

ระหว่าง `openclaw --profile rescue onboard`:

- ใช้ Telegram bot token แยกต่างหาก
- คงโปรไฟล์ `rescue` ไว้
- ใช้ base port ที่สูงกว่าบอตหลักอย่างน้อย 20
- ยอมรับ rescue workspace ค่าเริ่มต้น เว้นแต่คุณจัดการของตัวเองอยู่แล้ว

หาก onboarding ได้ติดตั้งบริการ rescue ให้คุณแล้ว `gateway install`
คำสั่งสุดท้ายก็ไม่จำเป็น

## ทำไมวิธีนี้จึงใช้ได้ผล

rescue bot ยังคงเป็นอิสระเพราะมีสิ่งเหล่านี้เป็นของตัวเอง:

- profile/config
- ไดเรกทอรีสถานะ
- workspace
- base port (รวมถึงพอร์ตที่อนุมานจากมัน)
- Telegram bot token

สำหรับการตั้งค่าส่วนใหญ่ ให้ใช้ Telegram bot แยกต่างหากโดยสมบูรณ์สำหรับโปรไฟล์ rescue:

- จัดให้อยู่ในขอบเขตเฉพาะผู้ปฏิบัติงานได้ง่าย
- มี bot token และ identity แยกจากกัน
- เป็นอิสระจากการติดตั้ง channel/app ของบอตหลัก
- มีเส้นทางกู้คืนแบบใช้ DM ที่ง่ายเมื่อบอตหลักเสีย

## สิ่งที่ `--profile rescue onboard` เปลี่ยนแปลง

`openclaw --profile rescue onboard` ใช้โฟลว์ onboarding ปกติ แต่
เขียนทุกอย่างลงในโปรไฟล์แยกต่างหาก

ในทางปฏิบัติ หมายความว่า rescue bot จะมีของตัวเอง:

- ไฟล์ config
- ไดเรกทอรีสถานะ
- workspace (ค่าเริ่มต้นคือ `~/.openclaw/workspace-rescue`)
- ชื่อบริการที่ระบบจัดการให้

ส่วน prompts อื่น ๆ จะเหมือนกับ onboarding ปกติ

## การตั้งค่า Multi-Gateway ทั่วไป

รูปแบบ rescue-bot ข้างต้นเป็นค่าเริ่มต้นที่ง่ายที่สุด แต่รูปแบบการแยกแบบเดียวกันนี้
ใช้ได้กับ Gateway ทุกคู่หรือทุกกลุ่มบนโฮสต์เดียวกัน

สำหรับการตั้งค่าทั่วไปมากขึ้น ให้แต่ละ Gateway เพิ่มเติมมี named profile ของตัวเองและ
base port ของตัวเอง:

```bash
# main (โปรไฟล์ค่าเริ่มต้น)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

หากคุณต้องการให้ทั้งสอง Gateway ใช้ named profiles ก็ทำได้เช่นกัน:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

บริการก็ใช้รูปแบบเดียวกัน:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

ใช้ rescue-bot quickstart เมื่อคุณต้องการ fallback operator lane ใช้
รูปแบบโปรไฟล์ทั่วไปเมื่อคุณต้องการ Gateway ระยะยาวหลายตัวสำหรับ
แชนแนล ผู้เช่า workspaces หรือบทบาทการปฏิบัติการที่แตกต่างกัน

## เช็กลิสต์การแยก

เก็บสิ่งเหล่านี้ให้ไม่ซ้ำกันในแต่ละ Gateway instance:

- `OPENCLAW_CONFIG_PATH` — ไฟล์ config แยกต่อ instance
- `OPENCLAW_STATE_DIR` — sessions, creds, caches แยกต่อ instance
- `agents.defaults.workspace` — ราก workspace แยกต่อ instance
- `gateway.port` (หรือ `--port`) — ต้องไม่ซ้ำกันในแต่ละ instance
- พอร์ต browser/canvas/CDP ที่อนุมานได้

หากมีการแชร์กัน คุณจะเจอ config races และ port conflicts

## การแมปพอร์ต (อนุมาน)

Base port = `gateway.port` (หรือ `OPENCLAW_GATEWAY_PORT` / `--port`)

- พอร์ต browser control service = base + 2 (loopback only)
- canvas host ให้บริการบน Gateway HTTP server (พอร์ตเดียวกับ `gateway.port`)
- Browser profile CDP ports จะจัดสรรอัตโนมัติจาก `browser.controlPort + 9 .. + 108`

หากคุณแทนที่ค่าใด ๆ เหล่านี้ใน config หรือ env คุณต้องทำให้แต่ละ instance ใช้ค่าไม่ซ้ำกัน

## หมายเหตุเรื่อง Browser/CDP (จุดพลาดที่พบบ่อย)

- **อย่า** ตรึง `browser.cdpUrl` ไว้ที่ค่าเดียวกันบนหลาย instances
- แต่ละ instance ต้องมี browser control port และ CDP range ของตัวเอง (อนุมานจาก gateway port)
- หากคุณต้องการ CDP ports แบบระบุชัด ให้ตั้งค่า `browser.profiles.<name>.cdpPort` แยกต่อ instance
- Remote Chrome: ใช้ `browser.profiles.<name>.cdpUrl` (แยกตาม profile และตาม instance)

## ตัวอย่าง env แบบกำหนดเอง

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## การตรวจสอบอย่างรวดเร็ว

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

การตีความ:

- `gateway status --deep` ช่วยจับบริการ launchd/systemd/schtasks ที่ค้างจากการติดตั้งเก่าได้
- ข้อความเตือนของ `gateway probe` เช่น `multiple reachable gateways detected` ถือว่าปกติเฉพาะเมื่อคุณตั้งใจรัน isolated gateways มากกว่าหนึ่งตัว

## ที่เกี่ยวข้อง

- [Gateway runbook](/th/gateway)
- [Gateway lock](/th/gateway/gateway-lock)
- [Configuration](/th/gateway/configuration)
