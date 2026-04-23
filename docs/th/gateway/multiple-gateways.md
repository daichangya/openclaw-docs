---
read_when:
    - การรัน Gateway มากกว่าหนึ่งตัวบนเครื่องเดียวกัน
    - คุณต้องการแยก config/สถานะ/พอร์ตต่อ Gateway แต่ละตัว
summary: รัน OpenClaw Gateway หลายตัวบนโฮสต์เดียว (การแยก การใช้พอร์ต และโปรไฟล์)
title: หลาย Gateway
x-i18n:
    generated_at: "2026-04-23T05:34:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# หลาย Gateway (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรใช้ Gateway เพียงตัวเดียว เพราะ Gateway ตัวเดียวสามารถจัดการการเชื่อมต่อการส่งข้อความและเอเจนต์หลายตัวได้ หากคุณต้องการการแยกที่เข้มงวดกว่าหรือความซ้ำซ้อน (เช่น rescue bot) ให้รัน Gateway แยกโดยใช้โปรไฟล์/พอร์ตที่แยกจากกัน

## การตั้งค่าที่แนะนำที่สุด

สำหรับผู้ใช้ส่วนใหญ่ การตั้งค่า rescue bot ที่ง่ายที่สุดคือ:

- ให้บอทหลักอยู่บนโปรไฟล์ค่าเริ่มต้น
- รัน rescue bot บน `--profile rescue`
- ใช้บอท Telegram ที่แยกจากกันโดยสมบูรณ์สำหรับบัญชี rescue
- ให้ rescue bot ใช้ base port คนละตัว เช่น `19789`

วิธีนี้จะทำให้ rescue bot แยกจากบอทหลัก เพื่อให้มันสามารถดีบักหรือปรับใช้
การเปลี่ยนแปลง config ได้หากบอทหลักล่ม เว้นระยะอย่างน้อย 20 พอร์ตระหว่าง
base ports เพื่อไม่ให้ browser/canvas/CDP ports ที่คำนวณต่อจากมันชนกัน

## Rescue-Bot Quickstart

ใช้แนวทางนี้เป็นค่าเริ่มต้น เว้นแต่คุณจะมีเหตุผลที่หนักแน่นให้ทำอย่างอื่น:

```bash
# Rescue bot (บอท Telegram แยก โปรไฟล์แยก พอร์ต 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

หากบอทหลักของคุณกำลังรันอยู่แล้ว โดยมากก็เพียงพอเท่านี้

ระหว่าง `openclaw --profile rescue onboard`:

- ใช้ bot token ของ Telegram ที่แยกต่างหาก
- คงโปรไฟล์ `rescue` ไว้
- ใช้ base port ที่สูงกว่าบอทหลักอย่างน้อย 20
- ยอมรับ workspace ค่าเริ่มต้นของ rescue เว้นแต่คุณจะจัดการเองอยู่แล้ว

หาก onboarding ได้ติดตั้งบริการของ rescue ให้คุณแล้ว คำสั่ง
`gateway install` สุดท้ายก็ไม่จำเป็น

## ทำไมวิธีนี้จึงใช้ได้ผล

rescue bot ยังคงเป็นอิสระเพราะมันมีสิ่งต่อไปนี้เป็นของตัวเอง:

- โปรไฟล์/config
- ไดเรกทอรีสถานะ
- workspace
- base port (รวมถึง ports ที่คำนวณต่อจากมัน)
- Telegram bot token

สำหรับการติดตั้งส่วนใหญ่ ให้ใช้บอท Telegram ที่แยกต่างหากโดยสมบูรณ์สำหรับโปรไฟล์ rescue:

- ควบคุมให้เป็นเฉพาะผู้ปฏิบัติการได้ง่าย
- มี bot token และตัวตนแยกจากกัน
- เป็นอิสระจากการติดตั้ง channel/app ของบอทหลัก
- เป็นเส้นทางกู้คืนผ่าน DM ที่เรียบง่ายเมื่อบอทหลักมีปัญหา

## `--profile rescue onboard` เปลี่ยนอะไรบ้าง

`openclaw --profile rescue onboard` ใช้โฟลว์ onboarding ปกติ แต่จะ
เขียนทุกอย่างลงในโปรไฟล์แยกต่างหาก

ในทางปฏิบัติ หมายความว่า rescue bot จะมีสิ่งเหล่านี้เป็นของตัวเอง:

- ไฟล์ config
- ไดเรกทอรีสถานะ
- workspace (ค่าเริ่มต้นคือ `~/.openclaw/workspace-rescue`)
- ชื่อ managed service

นอกจากนั้น prompts จะเหมือนกับ onboarding ปกติ

## การตั้งค่าแบบหลาย Gateway ทั่วไป

เลย์เอาต์ rescue bot ด้านบนเป็นค่าเริ่มต้นที่ง่ายที่สุด แต่รูปแบบการแยกเดียวกันนี้
ใช้ได้กับ Gateway คู่ใดๆ หรือหลายตัวบนโฮสต์เดียวกัน

สำหรับการตั้งค่าทั่วไปมากขึ้น ให้แต่ละ Gateway เพิ่มเติมมีโปรไฟล์แบบตั้งชื่อของตัวเอง และมี
base port ของตัวเอง:

```bash
# main (โปรไฟล์ค่าเริ่มต้น)
openclaw setup
openclaw gateway --port 18789

# gateway เพิ่มเติม
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

หากคุณต้องการให้ Gateway ทั้งสองใช้โปรไฟล์แบบตั้งชื่อ ก็ทำได้เช่นกัน:

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

ใช้ rescue-bot quickstart เมื่อต้องการ fallback operator lane ใช้
รูปแบบโปรไฟล์ทั่วไปเมื่อต้องการหลาย Gateway แบบระยะยาวสำหรับ
channels, tenants, workspaces หรือบทบาทการปฏิบัติงานที่ต่างกัน

## รายการตรวจสอบการแยก

ให้สิ่งเหล่านี้ไม่ซ้ำกันต่อ Gateway แต่ละอินสแตนซ์:

- `OPENCLAW_CONFIG_PATH` — ไฟล์ config ต่ออินสแตนซ์
- `OPENCLAW_STATE_DIR` — เซสชัน, creds, caches ต่ออินสแตนซ์
- `agents.defaults.workspace` — ราก workspace ต่ออินสแตนซ์
- `gateway.port` (หรือ `--port`) — ต้องไม่ซ้ำกันต่ออินสแตนซ์
- browser/canvas/CDP ports ที่คำนวณต่อจากมัน

หากสิ่งเหล่านี้ใช้ร่วมกัน คุณจะเจอทั้ง config races และ port conflicts

## การแมปพอร์ต (แบบคำนวณต่อ)

Base port = `gateway.port` (หรือ `OPENCLAW_GATEWAY_PORT` / `--port`)

- พอร์ต browser control service = base + 2 (loopback เท่านั้น)
- canvas host ให้บริการบนเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`)
- Browser profile CDP ports จะจัดสรรอัตโนมัติจาก `browser.controlPort + 9 .. + 108`

หากคุณ override สิ่งใดในนี้ผ่าน config หรือ env คุณต้องทำให้ไม่ซ้ำกันต่ออินสแตนซ์

## หมายเหตุเกี่ยวกับ Browser/CDP (จุดพลาดที่พบบ่อย)

- **อย่า** pin `browser.cdpUrl` ไปเป็นค่าเดียวกันบนหลายอินสแตนซ์
- แต่ละอินสแตนซ์ต้องมี browser control port และช่วง CDP ของตัวเอง (คำนวณจาก gateway port ของมัน)
- หากต้องการ CDP ports แบบ explicit ให้ตั้ง `browser.profiles.<name>.cdpPort` ต่ออินสแตนซ์
- Remote Chrome: ใช้ `browser.profiles.<name>.cdpUrl` (ต่อโปรไฟล์ ต่ออินสแตนซ์)

## ตัวอย่าง env แบบกำหนดเอง

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## การตรวจสอบแบบรวดเร็ว

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
- ข้อความเตือนของ `gateway probe` เช่น `multiple reachable gateways detected` ถือว่าเป็นเรื่องปกติเฉพาะเมื่อคุณตั้งใจรัน gateway ที่แยกจากกันมากกว่าหนึ่งตัว
