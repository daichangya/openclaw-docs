---
read_when:
    - การจับคู่ Node iOS/Android กับ Gateway
    - การใช้ canvas/camera ของ Node สำหรับบริบทของเอเจนต์
    - การเพิ่มคำสั่ง Node หรือ CLI helper ใหม่
summary: 'Nodes: การจับคู่ capabilities สิทธิ์ และตัวช่วย CLI สำหรับ canvas/camera/screen/device/notifications/system'
title: Nodes
x-i18n:
    generated_at: "2026-04-24T09:19:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Node คืออุปกรณ์คู่หู (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ Gateway ผ่าน **WebSocket** (พอร์ตเดียวกับ operator) ด้วย `role: "node"` และเปิดเผยพื้นผิวคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [โปรโตคอล Gateway](/th/gateway/protocol)

transport แบบเก่า: [Bridge protocol](/th/gateway/bridge-protocol) (TCP JSONL;
มีไว้เชิงประวัติศาสตร์เท่านั้นสำหรับ Node ปัจจุบัน)

macOS ยังสามารถรันใน **โหมด node** ได้: แอป menubar จะเชื่อมต่อกับเซิร์ฟเวอร์ WS ของ Gateway และเปิดเผยคำสั่ง canvas/camera ในเครื่องของมันเป็น Node (ดังนั้น `openclaw nodes …` จะใช้งานกับ Mac เครื่องนี้ได้)

หมายเหตุ:

- Node เป็น **อุปกรณ์ต่อพ่วง** ไม่ใช่ Gateway มันไม่ได้รันบริการ Gateway
- ข้อความจาก Telegram/WhatsApp/ฯลฯ จะไปลงที่ **gateway** ไม่ใช่ที่ Node
- runbook สำหรับการแก้ไขปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

## การจับคู่ + สถานะ

**WS node ใช้การจับคู่อุปกรณ์** Node จะนำเสนอตัวตนอุปกรณ์ระหว่าง `connect`; Gateway
จะสร้างคำขอจับคู่อุปกรณ์สำหรับ `role: node` อนุมัติผ่าน CLI ของอุปกรณ์ (หรือ UI)

CLI แบบรวดเร็ว:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

หาก Node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key) คำขอที่รอเดิม
จะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ ให้รัน
`openclaw devices list` ใหม่ก่อนอนุมัติ

หมายเหตุ:

- `nodes status` จะทำเครื่องหมาย Node ว่าเป็น **paired** เมื่อ role ในการจับคู่อุปกรณ์รวม `node`
- บันทึกการจับคู่อุปกรณ์คือสัญญา role ที่ได้รับอนุมัติแบบถาวร การหมุน token
  จะอยู่ภายในสัญญานั้น; มันไม่สามารถอัปเกรด Node ที่จับคู่แล้วให้เป็น
  role อื่นที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) เป็นที่เก็บการจับคู่ Node ที่ gateway เป็นเจ้าของแยกต่างหาก
  มัน **ไม่ได้** ใช้กำกับ handshake ของ WS `connect`
- ขอบเขตการอนุมัติจะเป็นไปตามคำสั่งที่ประกาศไว้ในคำขอที่รอ:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ Node แบบ remote (`system.run`)

ใช้ **node host** เมื่อ Gateway ของคุณรันอยู่บนเครื่องหนึ่งและคุณต้องการให้คำสั่ง
ไปทำงานบนอีกเครื่องหนึ่ง โมเดลยังคงคุยกับ **gateway**; gateway จะส่งต่อ
การเรียก `exec` ไปยัง **node host** เมื่อเลือก `host=node`

### อะไรรันที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล กำหนดเส้นทางการเรียกเครื่องมือ
- **โฮสต์ Node**: รัน `system.run`/`system.which` บนเครื่องของ Node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ Node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุเรื่องการอนุมัติ:

- การรันบน Node ที่รองรับการอนุมัติจะผูกกับบริบทคำขอที่ตรงกันทุกประการ
- สำหรับการรันไฟล์ shell/runtime โดยตรง OpenClaw ยังผูก one concrete local
  file operand แบบ best-effort เพิ่มเติม และจะปฏิเสธการรันหากไฟล์นั้นเปลี่ยนก่อนการดำเนินการ
- หาก OpenClaw ไม่สามารถระบุ concrete local file ได้อย่างแน่นอนเพียงหนึ่งไฟล์สำหรับคำสั่ง interpreter/runtime
  การดำเนินการที่รองรับการอนุมัติจะถูกปฏิเสธ แทนที่จะแสร้งทำว่า
  ครอบคลุม runtime ได้ทั้งหมด ใช้ sandboxing,
  แยกโฮสต์ หรือ trusted allowlist/full workflow แบบ explicit สำหรับ semantics ของ interpreter ที่กว้างกว่า

### เริ่ม node host (foreground)

บนเครื่องของ Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway แบบ remote ผ่าน SSH tunnel (bind แบบ loopback)

หาก Gateway bind อยู่กับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นใน local mode),
Node host แบบ remote จะเชื่อมต่อโดยตรงไม่ได้ ให้สร้าง SSH tunnel แล้วชี้
Node host ไปยังปลายฝั่ง local ของ tunnel

ตัวอย่าง (node host -> gateway host):

```bash
# Terminal A (ปล่อยให้รันค้างไว้): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export gateway token และเชื่อมต่อผ่าน tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับ auth แบบ token หรือ password
- ควรใช้ env var: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- config fallback คือ `gateway.auth.token` / `gateway.auth.password`
- ใน local mode, node host จะจงใจไม่สนใจ `gateway.remote.token` / `gateway.remote.password`
- ใน remote mode, `gateway.remote.token` / `gateway.remote.password` สามารถใช้ได้ตามกฎ precedence ของ remote
- หากมีการกำหนด SecretRef ของ `gateway.auth.*` สำหรับ local ที่กำลังใช้งานอยู่แต่ resolve ไม่ได้ auth ของ node-host จะ fail closed
- การ resolve auth ของ node-host จะเชื่อเฉพาะ env var `OPENCLAW_GATEWAY_*`

### เริ่ม node host (service)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### จับคู่ + ตั้งชื่อ

บนโฮสต์ gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

หาก Node ลองใหม่ด้วยรายละเอียด auth ที่เปลี่ยนไป ให้รัน `openclaw devices list`
ใหม่และอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (คงอยู่ใน `~/.openclaw/node.json` บน Node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override จาก gateway)

### ใส่คำสั่งลงใน allowlist

การอนุมัติ exec เป็นแบบ **ต่อ node host** เพิ่มรายการ allowlist จาก gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติจะอยู่บนโฮสต์ Node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ Node

กำหนดค่าเริ่มต้น (config ของ gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือกำหนดต่อเซสชัน:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใด ๆ ที่มี `host=node` จะรันบนโฮสต์ Node (ขึ้นกับ
allowlist/การอนุมัติของ Node)

`host=auto` จะไม่เลือก Node โดยปริยายด้วยตัวเอง แต่คำขอ `host=node` แบบ explicit ต่อครั้งจะได้รับอนุญาตจาก `auto` หากคุณต้องการให้ node exec เป็นค่าเริ่มต้นของเซสชัน ให้ตั้ง `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [CLI ของ Node host](/th/cli/node)
- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับต่ำ (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มี helper ระดับสูงสำหรับเวิร์กโฟลว์ทั่วไปแบบ “ให้เอเจนต์รับไฟล์แนบ MEDIA”

## ภาพหน้าจอ (snapshot ของ canvas)

หาก Node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืนค่า `{ format, base64 }`

CLI helper (เขียนลงไฟล์ชั่วคราวและพิมพ์ `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### ตัวควบคุม Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

หมายเหตุ:

- `canvas present` รับได้ทั้ง URL หรือพาธไฟล์ในเครื่อง (`--target`) พร้อม `--x/--y/--width/--height` แบบไม่บังคับสำหรับการจัดตำแหน่ง
- `canvas eval` รับ JavaScript แบบ inline (`--js`) หรือเป็น positional arg

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- รองรับเฉพาะ A2UI v0.8 JSONL เท่านั้น (`v0.9/createSurface` จะถูกปฏิเสธ)

## รูปภาพ + วิดีโอ (กล้องของ Node)

รูปภาพ (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # ค่าเริ่มต้น: ทั้งสองฝั่งกล้อง (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

คลิปวิดีโอ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

หมายเหตุ:

- Node ต้องอยู่ **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกใน background จะคืนค่า `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปถูกบังคับเพดาน (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่ใหญ่เกินไป
- Android จะขอสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อเป็นไปได้; หากปฏิเสธสิทธิ์จะล้มเหลวพร้อม `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (Nodes)

Node ที่รองรับจะเปิดเผย `screen.record` (`mp4`) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้งานของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ Node
- การบันทึกหน้าจอถูกบังคับเพดานที่ `<= 60s`
- `--no-audio` จะปิดการจับไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอภาพเมื่อมีหลายหน้าจอ

## ตำแหน่ง (Nodes)

Nodes จะเปิดเผย `location.get` เมื่อเปิดใช้งาน Location ในการตั้งค่า

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location ถูก **ปิดโดยค่าเริ่มต้น**
- “Always” ต้องมีสิทธิ์ระดับระบบ; การดึงใน background เป็นแบบ best-effort
- การตอบกลับประกอบด้วย lat/lon, accuracy (เมตร) และ timestamp

## SMS (Android Nodes)

Android Node สามารถเปิดเผย `sms.send` ได้เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับโทรศัพท์มือถือ

การเรียกระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับพรอมป์ขอสิทธิ์บนอุปกรณ์ Android ก่อน จึงจะโฆษณา capability นี้
- อุปกรณ์ที่ใช้ Wi‑Fi เท่านั้นและไม่มีโทรศัพท์มือถือจะไม่โฆษณา `sms.send`

## คำสั่ง Android device + ข้อมูลส่วนบุคคล

Android Node สามารถโฆษณากลุ่มคำสั่งเพิ่มเติมได้เมื่อเปิดใช้งาน capability ที่เกี่ยวข้อง

กลุ่มที่มีให้ใช้:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

ตัวอย่างการเรียก:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- คำสั่ง motion จะถูกกำหนดสิทธิ์โดย capability ตามเซนเซอร์ที่มีอยู่

## คำสั่งระบบ (node host / mac node)

Node บน macOS จะเปิดเผย `system.run`, `system.notify` และ `system.execApprovals.get/set`
ส่วน Node host แบบ headless จะเปิดเผย `system.run`, `system.which` และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` จะคืนค่า stdout/stderr/exit code อยู่ใน payload
- ตอนนี้การรัน shell จะผ่านเครื่องมือ `exec` ด้วย `host=node`; ส่วน `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่ง Node แบบ explicit
- `nodes invoke` ไม่เปิดเผย `system.run` หรือ `system.run.prepare`; สิ่งเหล่านี้ยังคงอยู่บนเส้นทาง exec เท่านั้น
- เส้นทาง exec จะเตรียม `systemRunPlan` แบบ canonical ก่อนการอนุมัติ เมื่อ
  ได้รับการอนุมัติแล้ว gateway จะส่งต่อแผนที่จัดเก็บไว้นั้น ไม่ใช่คำสั่ง/cwd/session field
  ที่ผู้เรียกแก้ไขภายหลัง
- `system.notify` เคารพสถานะสิทธิ์การแจ้งเตือนบนแอป macOS
- metadata `platform` / `deviceFamily` ของ Node ที่ไม่รู้จักจะใช้ allowlist ค่าเริ่มต้นแบบอนุรักษ์นิยมที่ไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องใช้คำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มมันอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout` และ `--needs-screen-recording`
- สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`) ค่า `--env` ที่มีขอบเขตตามคำขอจะถูกลดลงเหลือ allowlist แบบ explicit (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist wrapper สำหรับ dispatch ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธของ executable ด้านในแทนพาธของ wrapper หากการคลี่ wrapper ออกมาไม่ปลอดภัย จะไม่มีการคงรายการ allowlist แบบอัตโนมัติ
- บน Node host ของ Windows ในโหมด allowlist การรัน shell-wrapper ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (รายการ allowlist เพียงอย่างเดียวไม่ได้ทำให้รูปแบบ wrapper นี้ได้รับอนุญาตอัตโนมัติ)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- Node host จะเพิกเฉยต่อการ override `PATH` และลบคีย์ startup/shell ที่อันตราย (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าสภาพแวดล้อมของบริการ Node host (หรือติดตั้งเครื่องมือไว้ในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมด node บน macOS `system.run` ถูกกำหนดสิทธิ์โดยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  ask/allowlist/full ทำงานเหมือนกับ headless node host; พรอมป์ที่ถูกปฏิเสธจะคืนค่า `SYSTEM_RUN_DENIED`
- บน headless node host `system.run` ถูกกำหนดสิทธิ์โดยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การผูก exec กับ Node

เมื่อมีหลาย Node ให้ใช้งาน คุณสามารถผูก exec เข้ากับ Node ที่ระบุได้
สิ่งนี้จะตั้ง Node เริ่มต้นสำหรับ `exec host=node` (และสามารถ override แยกต่อเอเจนต์ได้)

ค่าเริ่มต้นแบบส่วนกลาง:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

override ต่อเอเจนต์:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาตให้ใช้ Node ใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## แผนที่สิทธิ์

Node อาจมีแผนที่ `permissions` อยู่ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) และใช้ค่าบูลีน (`true` = ได้รับสิทธิ์)

## Headless node host (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **headless node host** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` ได้ สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับรัน Node แบบมินิมอลข้างเซิร์ฟเวอร์

เริ่มมัน:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังต้องมีการจับคู่อยู่ (Gateway จะแสดงพรอมป์จับคู่อุปกรณ์)
- Node host จะเก็บ node id, token, display name และข้อมูลการเชื่อมต่อ gateway ไว้ใน `~/.openclaw/node.json`
- การอนุมัติ exec จะถูกบังคับใช้ในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [Exec approvals](/th/tools/exec-approvals))
- บน macOS headless node host จะรัน `system.run` ในเครื่องโดยค่าเริ่มต้น ตั้ง
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อกำหนดเส้นทาง `system.run` ผ่าน companion app exec host; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับให้ใช้ app host และ fail closed หากไม่พร้อมใช้งาน
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมด Mac node

- แอป menubar บน macOS จะเชื่อมต่อกับ Gateway WS server ในฐานะ Node (ดังนั้น `openclaw nodes …` จึงใช้งานกับ Mac เครื่องนี้ได้)
- ในโหมด remote แอปจะเปิด SSH tunnel สำหรับพอร์ต Gateway และเชื่อมต่อกับ `localhost`
