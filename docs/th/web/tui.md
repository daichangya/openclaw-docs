---
read_when:
    - คุณต้องการคำแนะนำการใช้งาน TUI แบบเป็นมิตรกับผู้เริ่มต้น
    - คุณต้องการรายการฟีเจอร์ คำสั่ง และคีย์ลัดทั้งหมดของ TUI อย่างครบถ้วน
summary: 'UI บนเทอร์มินัล (TUI): เชื่อมต่อกับ Gateway หรือรันในเครื่องในโหมดฝังตัว'
title: TUI
x-i18n:
    generated_at: "2026-04-23T06:20:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: df3ddbe41cb7d92b9cde09a4d1443d26579b4e1cfc92dce6bbc37eed4d8af8fa
    source_path: web/tui.md
    workflow: 15
---

# TUI (UI บนเทอร์มินัล)

## เริ่มต้นอย่างรวดเร็ว

### โหมด Gateway

1. เริ่มต้น Gateway

```bash
openclaw gateway
```

2. เปิด TUI

```bash
openclaw tui
```

3. พิมพ์ข้อความแล้วกด Enter

Remote Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

ใช้ `--password` หาก Gateway ของคุณใช้ password auth

### โหมดในเครื่อง

รัน TUI โดยไม่ใช้ Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

หมายเหตุ:

- `openclaw chat` และ `openclaw terminal` เป็นนามแฝงของ `openclaw tui --local`
- `--local` ไม่สามารถใช้ร่วมกับ `--url`, `--token` หรือ `--password`
- โหมดในเครื่องใช้รันไทม์ agent แบบฝังโดยตรง เครื่องมือในเครื่องส่วนใหญ่ใช้งานได้ แต่ฟีเจอร์ที่มีเฉพาะ Gateway จะไม่พร้อมใช้งาน

## สิ่งที่คุณจะเห็น

- ส่วนหัว: URL การเชื่อมต่อ, agent ปัจจุบัน, session ปัจจุบัน
- บันทึกแชต: ข้อความของผู้ใช้, คำตอบของผู้ช่วย, ประกาศของระบบ, การ์ดเครื่องมือ
- บรรทัดสถานะ: สถานะการเชื่อมต่อ/การรัน (connecting, running, streaming, idle, error)
- ส่วนท้าย: สถานะการเชื่อมต่อ + agent + session + model + think/fast/verbose/trace/reasoning + จำนวน token + deliver
- อินพุต: ตัวแก้ไขข้อความพร้อม autocomplete

## แนวคิดหลัก: agents + sessions

- Agents คือ slug ที่ไม่ซ้ำกัน (เช่น `main`, `research`) Gateway จะแสดงรายการเหล่านี้
- Sessions เป็นของ agent ปัจจุบัน
- คีย์ session จะถูกเก็บในรูปแบบ `agent:<agentId>:<sessionKey>`
  - หากคุณพิมพ์ `/session main` TUI จะขยายเป็น `agent:<currentAgent>:main`
  - หากคุณพิมพ์ `/session agent:other:main` คุณจะสลับไปยัง session ของ agent นั้นโดยตรง
- ขอบเขตของ session:
  - `per-sender` (ค่าเริ่มต้น): แต่ละ agent มีได้หลาย session
  - `global`: TUI จะใช้ session `global` เสมอ (ตัวเลือกอาจว่างเปล่า)
- agent + session ปัจจุบันจะแสดงอยู่เสมอในส่วนท้าย

## การส่ง + การส่งต่อ

- ข้อความจะถูกส่งไปยัง Gateway; การส่งต่อไปยัง providers ปิดอยู่โดยค่าเริ่มต้น
- เปิดการส่งต่อได้โดย:
  - `/deliver on`
  - หรือในแผง Settings
  - หรือเริ่มด้วย `openclaw tui --deliver`

## ตัวเลือก + โอเวอร์เลย์

- ตัวเลือก Model: แสดงรายการ models ที่ใช้ได้และตั้งค่าการแทนที่สำหรับ session
- ตัวเลือก Agent: เลือก agent อื่น
- ตัวเลือก Session: แสดงเฉพาะ sessions สำหรับ agent ปัจจุบัน
- Settings: สลับการส่งต่อ การขยายเอาต์พุตเครื่องมือ และการแสดงผลความคิด

## คีย์ลัด

- Enter: ส่งข้อความ
- Esc: ยกเลิกการรันที่กำลังทำงานอยู่
- Ctrl+C: ล้างอินพุต (กดสองครั้งเพื่อออก)
- Ctrl+D: ออก
- Ctrl+L: ตัวเลือก model
- Ctrl+G: ตัวเลือก agent
- Ctrl+P: ตัวเลือก session
- Ctrl+O: สลับการขยายเอาต์พุตเครื่องมือ
- Ctrl+T: สลับการแสดงผลความคิด (จะโหลดประวัติใหม่)

## คำสั่งแบบสแลช

หลัก:

- `/help`
- `/status`
- `/agent <id>` (หรือ `/agents`)
- `/session <key>` (หรือ `/sessions`)
- `/model <provider/model>` (หรือ `/models`)

การควบคุม session:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (นามแฝง: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

วงจรชีวิตของ session:

- `/new` หรือ `/reset` (รีเซ็ต session)
- `/abort` (ยกเลิกการรันที่กำลังทำงานอยู่)
- `/settings`
- `/exit`

เฉพาะโหมดในเครื่อง:

- `/auth [provider]` เปิดขั้นตอน auth/login ของ provider ภายใน TUI

คำสั่งสแลชอื่น ๆ ของ Gateway (ตัวอย่างเช่น `/context`) จะถูกส่งต่อไปยัง Gateway และแสดงเป็นเอาต์พุตของระบบ ดู [Slash commands](/th/tools/slash-commands)

## คำสั่ง shell ภายในเครื่อง

- เติม `!` นำหน้าบรรทัดเพื่อรันคำสั่ง shell ภายในเครื่องบนโฮสต์ของ TUI
- TUI จะถามครั้งเดียวต่อ session เพื่ออนุญาตการรันในเครื่อง; หากปฏิเสธ `!` จะถูกปิดใช้งานสำหรับ session นั้น
- คำสั่งจะรันใน shell ใหม่แบบไม่โต้ตอบภายในไดเรกทอรีทำงานของ TUI (`cd`/env จะไม่คงอยู่ต่อเนื่อง)
- คำสั่ง shell ภายในเครื่องจะได้รับ `OPENCLAW_SHELL=tui-local` ใน environment
- `!` เพียงตัวเดียวจะถูกส่งเป็นข้อความปกติ; การเว้นวรรคด้านหน้าจะไม่ทริกเกอร์การรันในเครื่อง

## ซ่อมแซม configs จาก TUI ในเครื่อง

ใช้โหมดในเครื่องเมื่อ config ปัจจุบันผ่านการตรวจสอบอยู่แล้ว และคุณต้องการให้
agent แบบฝังตรวจสอบบนเครื่องเดียวกัน เปรียบเทียบกับเอกสาร
และช่วยซ่อมความคลาดเคลื่อนโดยไม่ต้องพึ่ง Gateway ที่กำลังรันอยู่

หาก `openclaw config validate` ล้มเหลวอยู่แล้ว ให้เริ่มด้วย `openclaw configure`
หรือ `openclaw doctor --fix` ก่อน `openclaw chat` จะไม่ข้ามตัวป้องกัน
config ไม่ถูกต้อง

ลูปการทำงานทั่วไป:

1. เริ่มโหมดในเครื่อง:

```bash
openclaw chat
```

2. ถาม agent ว่าคุณต้องการให้ตรวจสอบอะไร ตัวอย่างเช่น:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. ใช้คำสั่ง shell ภายในเครื่องเพื่อดูหลักฐานที่ชัดเจนและตรวจสอบความถูกต้อง:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. ใช้ `openclaw config set` หรือ `openclaw configure` เพื่อเปลี่ยนแปลงแบบเจาะจง แล้วรัน `!openclaw config validate` อีกครั้ง
5. หาก Doctor แนะนำการย้ายหรือซ่อมแซมแบบอัตโนมัติ ให้ตรวจสอบก่อนแล้วรัน `!openclaw doctor --fix`

เคล็ดลับ:

- ควรใช้ `openclaw config set` หรือ `openclaw configure` แทนการแก้ไข `openclaw.json` ด้วยมือ
- `openclaw docs "<query>"` จะค้นหาดัชนีเอกสารสดจากเครื่องเดียวกัน
- `openclaw config validate --json` มีประโยชน์เมื่อคุณต้องการข้อผิดพลาดของ schema และ SecretRef/resolvability แบบมีโครงสร้าง

## เอาต์พุตเครื่องมือ

- การเรียกเครื่องมือจะแสดงเป็นการ์ดพร้อม args + results
- Ctrl+O ใช้สลับระหว่างมุมมองแบบย่อ/แบบขยาย
- ระหว่างที่เครื่องมือกำลังทำงาน การอัปเดตบางส่วนจะสตรีมเข้าไปในการ์ดใบเดิม

## สีของเทอร์มินัล

- TUI จะคงข้อความเนื้อหาของผู้ช่วยไว้ในสี foreground เริ่มต้นของเทอร์มินัล เพื่อให้ทั้งเทอร์มินัลธีมมืดและธีมสว่างยังอ่านได้ง่าย
- หากเทอร์มินัลของคุณใช้พื้นหลังสว่างและการตรวจจับอัตโนมัติผิดพลาด ให้ตั้งค่า `OPENCLAW_THEME=light` ก่อนเปิด `openclaw tui`
- หากต้องการบังคับใช้พาเลตต์มืดแบบเดิมแทน ให้ตั้งค่า `OPENCLAW_THEME=dark`

## ประวัติ + การสตรีม

- เมื่อเชื่อมต่อ TUI จะโหลดประวัติล่าสุด (ค่าเริ่มต้น 200 ข้อความ)
- คำตอบแบบสตรีมจะอัปเดตในตำแหน่งเดิมจนกว่าจะเสร็จสมบูรณ์
- TUI ยังฟัง agent tool events เพื่อแสดงการ์ดเครื่องมือที่สมบูรณ์ยิ่งขึ้น

## รายละเอียดการเชื่อมต่อ

- TUI ลงทะเบียนกับ Gateway เป็น `mode: "tui"`
- เมื่อเชื่อมต่อใหม่จะมีข้อความของระบบแสดงขึ้น; ช่องว่างของ event จะถูกแสดงในบันทึก

## ตัวเลือก

- `--local`: รันกับรันไทม์ agent แบบฝังในเครื่อง
- `--url <url>`: URL WebSocket ของ Gateway (ค่าเริ่มต้นมาจาก config หรือ `ws://127.0.0.1:<port>`)
- `--token <token>`: token ของ Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่านของ Gateway (หากจำเป็น)
- `--session <key>`: คีย์ session (ค่าเริ่มต้น: `main` หรือ `global` เมื่อขอบเขตเป็น global)
- `--deliver`: ส่งต่อคำตอบของผู้ช่วยไปยัง provider (ค่าเริ่มต้นปิดอยู่)
- `--thinking <level>`: แทนที่ระดับความคิดสำหรับการส่ง
- `--message <text>`: ส่งข้อความเริ่มต้นหลังจากเชื่อมต่อ
- `--timeout-ms <ms>`: timeout ของ agent หน่วยเป็นมิลลิวินาที (ค่าเริ่มต้นมาจาก `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: จำนวนรายการประวัติที่จะโหลด (ค่าเริ่มต้น `200`)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` แล้ว TUI จะไม่ถอยกลับไปใช้ credentials จาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials แบบชัดเจนถือเป็นข้อผิดพลาด
ในโหมดในเครื่อง ห้ามส่ง `--url`, `--token` หรือ `--password`

## การแก้ปัญหา

ไม่มีเอาต์พุตหลังส่งข้อความ:

- รัน `/status` ใน TUI เพื่อยืนยันว่า Gateway เชื่อมต่ออยู่และอยู่ในสถานะ idle/busy
- ตรวจสอบบันทึกของ Gateway: `openclaw logs --follow`
- ยืนยันว่า agent สามารถรันได้: `openclaw status` และ `openclaw models status`
- หากคุณคาดว่าจะมีข้อความในช่องทางแชต ให้เปิดการส่งต่อ (`/deliver on` หรือ `--deliver`)

## การแก้ปัญหาการเชื่อมต่อ

- `disconnected`: ตรวจสอบให้แน่ใจว่า Gateway กำลังรันอยู่ และ `--url/--token/--password` ของคุณถูกต้อง
- ไม่มี agents ในตัวเลือก: ตรวจสอบ `openclaw agents list` และการกำหนดค่า routing ของคุณ
- ตัวเลือก session ว่างเปล่า: คุณอาจอยู่ในขอบเขต global หรือยังไม่มี sessions

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui) — อินเทอร์เฟซควบคุมแบบเว็บ
- [Config](/th/cli/config) — ตรวจสอบ ตรวจสอบความถูกต้อง และแก้ไข `openclaw.json`
- [Doctor](/th/cli/doctor) — การตรวจสอบการซ่อมแซมและการย้ายแบบมีคำแนะนำ
- [CLI Reference](/th/cli) — เอกสารอ้างอิงคำสั่ง CLI แบบเต็ม
