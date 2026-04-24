---
read_when:
    - คุณต้องการคำแนะนำแบบเป็นมิตรกับผู้เริ่มต้นสำหรับ TUI
    - คุณต้องการรายการฟีเจอร์ คำสั่ง และคีย์ลัดของ TUI แบบครบถ้วน
summary: 'ส่วนติดต่อผู้ใช้แบบเทอร์มินัล (TUI): เชื่อมต่อกับ Gateway หรือรันแบบ local ในโหมดฝังตัว'
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:40:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## เริ่มต้นอย่างรวดเร็ว

### โหมด Gateway

1. เริ่ม Gateway

```bash
openclaw gateway
```

2. เปิด TUI

```bash
openclaw tui
```

3. พิมพ์ข้อความแล้วกด Enter

Gateway ระยะไกล:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

ใช้ `--password` หาก Gateway ของคุณใช้การยืนยันตัวตนแบบรหัสผ่าน

### โหมด local

รัน TUI โดยไม่ใช้ Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

หมายเหตุ:

- `openclaw chat` และ `openclaw terminal` เป็น alias ของ `openclaw tui --local`
- `--local` ใช้ร่วมกับ `--url`, `--token` หรือ `--password` ไม่ได้
- โหมด local ใช้รันไทม์เอเจนต์แบบฝังตัวโดยตรง เครื่องมือ local ส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน

## สิ่งที่คุณจะเห็น

- ส่วนหัว: URL การเชื่อมต่อ เอเจนต์ปัจจุบัน เซสชันปัจจุบัน
- บันทึกแชต: ข้อความผู้ใช้ คำตอบของผู้ช่วย ประกาศของระบบ การ์ดเครื่องมือ
- บรรทัดสถานะ: สถานะการเชื่อมต่อ/การรัน (กำลังเชื่อมต่อ กำลังรัน กำลังสตรีม ว่าง เกิดข้อผิดพลาด)
- ส่วนท้าย: สถานะการเชื่อมต่อ + เอเจนต์ + เซสชัน + โมเดล + think/fast/verbose/trace/reasoning + จำนวนโทเค็น + deliver
- ช่องป้อนข้อมูล: ตัวแก้ไขข้อความพร้อม autocomplete

## โมเดลความเข้าใจ: เอเจนต์ + เซสชัน

- เอเจนต์เป็น slug ที่ไม่ซ้ำกัน (เช่น `main`, `research`) Gateway จะแสดงรายการเหล่านี้
- เซสชันเป็นของเอเจนต์ปัจจุบัน
- คีย์เซสชันถูกเก็บในรูป `agent:<agentId>:<sessionKey>`
  - หากคุณพิมพ์ `/session main` TUI จะขยายเป็น `agent:<currentAgent>:main`
  - หากคุณพิมพ์ `/session agent:other:main` คุณจะสลับไปยังเซสชันของเอเจนต์นั้นโดยชัดเจน
- ขอบเขตของเซสชัน:
  - `per-sender` (ค่าเริ่มต้น): แต่ละเอเจนต์มีหลายเซสชัน
  - `global`: TUI จะใช้เซสชัน `global` เสมอ (ตัวเลือกอาจว่างเปล่า)
- เอเจนต์ + เซสชันปัจจุบันจะแสดงอยู่ในส่วนท้ายเสมอ

## การส่ง + การส่งต่อ

- ข้อความจะถูกส่งไปยัง Gateway; การส่งต่อไปยัง providers ปิดไว้โดยค่าเริ่มต้น
- เปิดการส่งต่อได้ด้วย:
  - `/deliver on`
  - หรือแผง Settings
  - หรือเริ่มด้วย `openclaw tui --deliver`

## ตัวเลือก + หน้าต่างซ้อน

- ตัวเลือกโมเดล: แสดงรายการโมเดลที่ใช้งานได้และตั้งค่า override ของเซสชัน
- ตัวเลือกเอเจนต์: เลือกเอเจนต์อื่น
- ตัวเลือกเซสชัน: แสดงเฉพาะเซสชันของเอเจนต์ปัจจุบัน
- Settings: สลับ deliver การขยายผลลัพธ์เครื่องมือ และการแสดงผล thinking

## คีย์ลัด

- Enter: ส่งข้อความ
- Esc: ยกเลิกการรันที่กำลังทำงาน
- Ctrl+C: ล้างช่องป้อนข้อมูล (กดสองครั้งเพื่อออก)
- Ctrl+D: ออก
- Ctrl+L: ตัวเลือกโมเดล
- Ctrl+G: ตัวเลือกเอเจนต์
- Ctrl+P: ตัวเลือกเซสชัน
- Ctrl+O: สลับการขยายผลลัพธ์เครื่องมือ
- Ctrl+T: สลับการแสดงผล thinking (จะโหลดประวัติใหม่)

## คำสั่งแบบสแลช

คำสั่งหลัก:

- `/help`
- `/status`
- `/agent <id>` (หรือ `/agents`)
- `/session <key>` (หรือ `/sessions`)
- `/model <provider/model>` (หรือ `/models`)

การควบคุมเซสชัน:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

วงจรชีวิตของเซสชัน:

- `/new` หรือ `/reset` (รีเซ็ตเซสชัน)
- `/abort` (ยกเลิกการรันที่กำลังทำงาน)
- `/settings`
- `/exit`

เฉพาะโหมด local:

- `/auth [provider]` เปิดโฟลว์ auth/login ของ provider ภายใน TUI

คำสั่งแบบสแลชอื่นของ Gateway (เช่น `/context`) จะถูกส่งต่อไปยัง Gateway และแสดงเป็นเอาต์พุตของระบบ ดู [Slash commands](/th/tools/slash-commands)

## คำสั่ง shell ในเครื่อง

- นำหน้าบรรทัดด้วย `!` เพื่อรันคำสั่ง shell ในเครื่องบนโฮสต์ที่รัน TUI
- TUI จะถามหนึ่งครั้งต่อเซสชันเพื่ออนุญาตการรันในเครื่อง; หากปฏิเสธ `!` จะถูกปิดใช้สำหรับเซสชันนั้น
- คำสั่งจะรันใน shell ใหม่แบบไม่โต้ตอบในไดเรกทอรีทำงานของ TUI (`cd`/env ไม่คงอยู่)
- คำสั่ง shell ในเครื่องจะได้รับ `OPENCLAW_SHELL=tui-local` ใน environment
- `!` เดี่ยวๆ จะถูกส่งเป็นข้อความปกติ; การมีช่องว่างนำหน้าจะไม่ทริกเกอร์การรันในเครื่อง

## ซ่อมแซม config จาก local TUI

ใช้โหมด local เมื่อ config ปัจจุบันยังผ่านการตรวจสอบอยู่แล้ว และคุณต้องการให้
รันไทม์เอเจนต์แบบฝังตัวตรวจสอบบนเครื่องเดียวกัน เปรียบเทียบกับเอกสาร
และช่วยซ่อมแซมความคลาดเคลื่อนโดยไม่ต้องพึ่ง Gateway ที่กำลังรันอยู่

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้เริ่มจาก `openclaw configure`
หรือ `openclaw doctor --fix` ก่อน `openclaw chat` ไม่ได้ข้ามการป้องกัน
config ที่ไม่ถูกต้อง

ลูปการทำงานทั่วไป:

1. เริ่มโหมด local:

```bash
openclaw chat
```

2. ถามเอเจนต์ในสิ่งที่คุณต้องการให้ตรวจสอบ เช่น:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. ใช้คำสั่ง shell ในเครื่องเพื่อดูหลักฐานและการตรวจสอบที่แม่นยำ:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. ใช้การเปลี่ยนแปลงแบบแคบด้วย `openclaw config set` หรือ `openclaw configure` แล้วรัน `!openclaw config validate` อีกครั้ง
5. หาก Doctor แนะนำการย้ายหรือซ่อมแซมอัตโนมัติ ให้ตรวจสอบแล้วรัน `!openclaw doctor --fix`

เคล็ดลับ:

- ควรใช้ `openclaw config set` หรือ `openclaw configure` มากกว่าการแก้ไข `openclaw.json` ด้วยมือ
- `openclaw docs "<query>"` ค้นหาดัชนีเอกสาร live จากเครื่องเดียวกัน
- `openclaw config validate --json` มีประโยชน์เมื่อคุณต้องการข้อผิดพลาดแบบมีโครงสร้างของ schema และ SecretRef/resolvability

## ผลลัพธ์ของเครื่องมือ

- การเรียกใช้เครื่องมือจะแสดงเป็นการ์ดพร้อม args + results
- Ctrl+O ใช้สลับระหว่างมุมมองย่อ/ขยาย
- ระหว่างที่เครื่องมือกำลังรัน การอัปเดตบางส่วนจะสตรีมเข้าไปในการ์ดเดียวกัน

## สีของเทอร์มินัล

- TUI จะคงข้อความเนื้อหาของผู้ช่วยไว้เป็นสี foreground เริ่มต้นของเทอร์มินัลคุณ เพื่อให้ทั้งเทอร์มินัลธีมมืดและสว่างยังอ่านได้ชัด
- หากเทอร์มินัลของคุณใช้พื้นหลังสว่างและการตรวจจับอัตโนมัติผิด ให้ตั้ง `OPENCLAW_THEME=light` ก่อนเปิด `openclaw tui`
- หากต้องการบังคับใช้พาเลตต์มืดแบบเดิม ให้ตั้ง `OPENCLAW_THEME=dark`

## ประวัติ + การสตรีม

- เมื่อเชื่อมต่อ TUI จะโหลดประวัติล่าสุด (ค่าเริ่มต้น 200 ข้อความ)
- คำตอบแบบสตรีมจะอัปเดตในตำแหน่งเดิมจนกว่าจะสิ้นสุด
- TUI ยังรับฟังเหตุการณ์เครื่องมือของเอเจนต์เพื่อแสดงการ์ดเครื่องมือที่สมบูรณ์ขึ้น

## รายละเอียดการเชื่อมต่อ

- TUI ลงทะเบียนกับ Gateway ในฐานะ `mode: "tui"`
- การเชื่อมต่อใหม่จะแสดงเป็นข้อความของระบบ; ช่องว่างของเหตุการณ์จะแสดงในบันทึก

## ตัวเลือก

- `--local`: รันกับรันไทม์เอเจนต์แบบฝังตัวในเครื่อง
- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นจาก config หรือ `ws://127.0.0.1:<port>`)
- `--token <token>`: โทเค็นของ Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่านของ Gateway (หากจำเป็น)
- `--session <key>`: คีย์เซสชัน (ค่าเริ่มต้น: `main` หรือ `global` เมื่อขอบเขตเป็น global)
- `--deliver`: ส่งต่อคำตอบของผู้ช่วยไปยัง provider (ค่าเริ่มต้นปิด)
- `--thinking <level>`: override ระดับ thinking สำหรับการส่ง
- `--message <text>`: ส่งข้อความเริ่มต้นหลังจากเชื่อมต่อ
- `--timeout-ms <ms>`: timeout ของเอเจนต์ในหน่วยมิลลิวินาที (ค่าเริ่มต้นจาก `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: จำนวนรายการประวัติที่จะโหลด (ค่าเริ่มต้น `200`)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` แล้ว TUI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุไว้โดยชัดเจนถือเป็นข้อผิดพลาด
ในโหมด local อย่าส่ง `--url`, `--token` หรือ `--password`

## การแก้ปัญหา

ไม่มีเอาต์พุตหลังส่งข้อความ:

- รัน `/status` ใน TUI เพื่อยืนยันว่า Gateway เชื่อมต่ออยู่และอยู่ในสถานะว่าง/ไม่ว่าง
- ตรวจสอบบันทึกของ Gateway: `openclaw logs --follow`
- ยืนยันว่าเอเจนต์สามารถรันได้: `openclaw status` และ `openclaw models status`
- หากคุณคาดหวังให้มีข้อความในแชต channel ให้เปิดการส่งต่อ (`/deliver on` หรือ `--deliver`)

## การแก้ปัญหาการเชื่อมต่อ

- `disconnected`: ตรวจสอบว่า Gateway กำลังรันอยู่ และ `--url/--token/--password` ของคุณถูกต้อง
- ไม่มีเอเจนต์ในตัวเลือก: ตรวจสอบ `openclaw agents list` และ config การกำหนดเส้นทางของคุณ
- ตัวเลือกเซสชันว่างเปล่า: คุณอาจอยู่ในขอบเขต global หรือยังไม่มีเซสชัน

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui) — อินเทอร์เฟซควบคุมแบบเว็บ
- [Config](/th/cli/config) — ตรวจสอบ ตรวจทาน และแก้ไข `openclaw.json`
- [Doctor](/th/cli/doctor) — การซ่อมแซมแบบมีคำแนะนำและการตรวจสอบการย้าย
- [CLI Reference](/th/cli) — เอกสารอ้างอิงคำสั่ง CLI แบบเต็ม
