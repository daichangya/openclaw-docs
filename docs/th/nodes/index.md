---
read_when:
    - การจับคู่ Node iOS/Android กับ gateway
    - การใช้ canvas/camera ของ Node สำหรับบริบทของเอเจนต์
    - กำลังเพิ่มคำสั่ง Node ใหม่หรือตัวช่วย CLI บาคาร่assistant to=functions.read commentary  彩神争霸怎么样্জনৰjson  天天中彩票彩金_path":"src/gateway/AGENTS.md","offset":1,"limit":200} code
summary: 'Node: การจับคู่ ความสามารถ สิทธิ์ และตัวช่วย CLI สำหรับ canvas/camera/screen/device/notifications/system'
title: Node
x-i18n:
    generated_at: "2026-04-23T05:43:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Node

**Node** คืออุปกรณ์คู่หู (macOS/iOS/Android/headless) ที่เชื่อมต่อกับ Gateway **WebSocket** (พอร์ตเดียวกับผู้ปฏิบัติงาน) ด้วย `role: "node"` และเปิดเผยพื้นผิวคำสั่ง (เช่น `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) ผ่าน `node.invoke` รายละเอียดโปรโตคอล: [Gateway protocol](/th/gateway/protocol)

ทรานสปอร์ตแบบเดิม: [Bridge protocol](/th/gateway/bridge-protocol) (TCP JSONL;
มีไว้เชิงประวัติศาสตร์เท่านั้นสำหรับ node ปัจจุบัน)

macOS ยังสามารถรันใน **โหมด node** ได้: แอป menubar จะเชื่อมต่อกับ WS server ของ Gateway และเปิดเผยคำสั่ง canvas/camera ในเครื่องของมันเป็น node (ดังนั้น `openclaw nodes …` จะทำงานกับ Mac เครื่องนี้ได้)

หมายเหตุ:

- Node คือ **อุปกรณ์ต่อพ่วง** ไม่ใช่ gateway มันไม่ได้รัน gateway service
- ข้อความ Telegram/WhatsApp/ฯลฯ จะมาถึงที่ **gateway** ไม่ใช่ที่ node
- คู่มือการแก้ไขปัญหา: [/nodes/troubleshooting](/th/nodes/troubleshooting)

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

หาก node ลองใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป (role/scopes/public key), คำขอที่
รอดำเนินการก่อนหน้าจะถูกแทนที่ และจะมีการสร้าง `requestId` ใหม่ ให้รัน
`openclaw devices list` ใหม่อีกครั้งก่อนอนุมัติ

หมายเหตุ:

- `nodes status` จะทำเครื่องหมาย node ว่า **paired** เมื่อ role ใน device pairing ของมันมี `node`
- เรคคอร์ด device pairing คือสัญญาเรื่อง role ที่ได้รับอนุมัติแบบถาวร การ
  หมุนโทเค็นยังคงอยู่ภายในสัญญานั้น; มันไม่สามารถอัปเกรด node ที่จับคู่แล้วไปเป็น
  role อื่นที่การอนุมัติการจับคู่ไม่เคยอนุญาตได้
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) เป็น store การจับคู่
  node ที่ gateway เป็นเจ้าของแยกต่างหาก; มัน **ไม่ได้** ควบคุม WS `connect` handshake
- ขอบเขตการอนุมัติเป็นไปตามคำสั่งที่คำขอที่รอดำเนินการประกาศไว้:
  - คำขอที่ไม่มีคำสั่ง: `operator.pairing`
  - คำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## โฮสต์ node ระยะไกล (`system.run`)

ใช้ **โฮสต์ node** เมื่อ Gateway ของคุณรันอยู่บนเครื่องหนึ่ง และคุณต้องการให้คำสั่ง
ถูกดำเนินการบนอีกเครื่องหนึ่ง โมเดลยังคงคุยกับ **gateway**; gateway
จะส่งต่อการเรียก `exec` ไปยัง **โฮสต์ node** เมื่อเลือก `host=node`

### อะไรรันที่ไหน

- **โฮสต์ Gateway**: รับข้อความ รันโมเดล กำหนดเส้นทางการเรียกเครื่องมือ
- **โฮสต์ Node**: ดำเนินการ `system.run`/`system.which` บนเครื่องของ node
- **การอนุมัติ**: บังคับใช้บนโฮสต์ node ผ่าน `~/.openclaw/exec-approvals.json`

หมายเหตุเรื่องการอนุมัติ:

- การรัน node ที่อาศัย approval จะ bind กับบริบทของคำขอที่ตรงกันอย่างแน่นอน
- สำหรับการรันไฟล์ shell/runtime โดยตรง OpenClaw ยัง bind กับ
  file operand ในเครื่องที่เป็นรูปธรรมหนึ่งรายการแบบ best-effort และปฏิเสธการรันหากไฟล์นั้นเปลี่ยนไปก่อนการดำเนินการ
- หาก OpenClaw ไม่สามารถระบุไฟล์ในเครื่องที่เป็นรูปธรรมได้อย่างแน่นอนเพียงหนึ่งรายการสำหรับคำสั่ง interpreter/runtime,
  การดำเนินการที่อาศัย approval จะถูกปฏิเสธ แทนที่จะเสแสร้งว่าครอบคลุม runtime ทั้งหมด ใช้ sandboxing,
  โฮสต์แยกต่างหาก หรือเวิร์กโฟลว์ allowlist/full แบบเชื่อถือได้อย่างชัดเจน สำหรับ semantics ของ interpreter ที่กว้างกว่า

### เริ่มโฮสต์ node (foreground)

บนเครื่อง node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### gateway ระยะไกลผ่าน SSH tunnel (loopback bind)

หาก Gateway bind กับ loopback (`gateway.bind=loopback`, ค่าเริ่มต้นในโหมด local),
โฮสต์ node ระยะไกลจะไม่สามารถเชื่อมต่อได้โดยตรง ให้สร้าง SSH tunnel และชี้
โฮสต์ node ไปที่ปลาย local ของ tunnel

ตัวอย่าง (โฮสต์ node -> โฮสต์ gateway):

```bash
# Terminal A (เปิดค้างไว้): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export gateway token และเชื่อมต่อผ่าน tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

หมายเหตุ:

- `openclaw node run` รองรับทั้ง token auth และ password auth
- ควรใช้ env var: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`
- config fallback คือ `gateway.auth.token` / `gateway.auth.password`
- ในโหมด local, โฮสต์ node จะตั้งใจไม่ใช้ `gateway.remote.token` / `gateway.remote.password`
- ในโหมด remote, `gateway.remote.token` / `gateway.remote.password` ใช้ได้ตามกฎลำดับความสำคัญของ remote
- หากมีการกำหนดค่า SecretRef ของ `gateway.auth.*` แบบ local ที่ใช้งานอยู่แต่ resolve ไม่ได้, auth ของโฮสต์ node จะล้มเหลวแบบ fail closed
- การ resolve auth ของโฮสต์ node จะยอมรับเฉพาะ env var `OPENCLAW_GATEWAY_*`

### เริ่มโฮสต์ node (service)

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

หาก node ลองใหม่พร้อมรายละเอียด auth ที่เปลี่ยนไป ให้รัน `openclaw devices list`
ใหม่และอนุมัติ `requestId` ปัจจุบัน

ตัวเลือกการตั้งชื่อ:

- `--display-name` บน `openclaw node run` / `openclaw node install` (จะคงไว้ใน `~/.openclaw/node.json` บน node)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override ฝั่ง gateway)

### ใส่คำสั่งลงใน allowlist

การอนุมัติ exec เป็นแบบ **ต่อโฮสต์ node** เพิ่มรายการ allowlist จาก gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

การอนุมัติจะอยู่บนโฮสต์ node ที่ `~/.openclaw/exec-approvals.json`

### ชี้ exec ไปที่ node

กำหนดค่าเริ่มต้น (config ของ gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

หรือรายเซสชัน:

```
/exec host=node security=allowlist node=<id-or-name>
```

เมื่อตั้งค่าแล้ว การเรียก `exec` ใด ๆ ที่มี `host=node` จะรันบนโฮสต์ node (ภายใต้
allowlist/approval ของ node)

`host=auto` จะไม่เลือก node โดยปริยายด้วยตัวเอง แต่คำขอ `host=node` แบบ explicit ต่อครั้งยังคงอนุญาตได้จาก `auto` หากคุณต้องการให้ node exec เป็นค่าเริ่มต้นของเซสชัน ให้ตั้ง `tools.exec.host=node` หรือ `/exec host=node ...` อย่างชัดเจน

ที่เกี่ยวข้อง:

- [Node host CLI](/cli/node)
- [Exec tool](/th/tools/exec)
- [Exec approvals](/th/tools/exec-approvals)

## การเรียกใช้คำสั่ง

ระดับต่ำ (raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

มีตัวช่วยระดับสูงกว่าสำหรับเวิร์กโฟลว์ทั่วไปแบบ “ให้ MEDIA attachment กับเอเจนต์”

## ภาพหน้าจอ (snapshot ของ canvas)

หาก node กำลังแสดง Canvas (WebView), `canvas.snapshot` จะคืน `{ format, base64 }`

ตัวช่วย CLI (เขียนไปยังไฟล์ temp และพิมพ์ `MEDIA:<path>`):

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

- `canvas present` รับทั้ง URL หรือพาธไฟล์ภายในเครื่อง (`--target`) พร้อมตัวเลือก `--x/--y/--width/--height` สำหรับการจัดตำแหน่ง
- `canvas eval` รับ JS แบบอินไลน์ (`--js`) หรือเป็น positional arg

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

หมายเหตุ:

- รองรับเฉพาะ A2UI v0.8 JSONL (v0.9/createSurface จะถูกปฏิเสธ)

## ภาพถ่าย + วิดีโอ (กล้องของ node)

ภาพถ่าย (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # ค่าเริ่มต้น: ทั้งสองด้าน (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

คลิปวิดีโอ (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

หมายเหตุ:

- node ต้องอยู่ใน **foreground** สำหรับ `canvas.*` และ `camera.*` (การเรียกในพื้นหลังจะคืน `NODE_BACKGROUND_UNAVAILABLE`)
- ระยะเวลาคลิปจะถูก clamp (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยง payload base64 ที่มีขนาดใหญ่เกินไป
- Android จะถามสิทธิ์ `CAMERA`/`RECORD_AUDIO` เมื่อทำได้; หากปฏิเสธสิทธิ์จะล้มเหลวด้วย `*_PERMISSION_REQUIRED`

## การบันทึกหน้าจอ (node)

node ที่รองรับจะเปิดเผย `screen.record` (`mp4`) ตัวอย่าง:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

หมายเหตุ:

- ความพร้อมใช้ของ `screen.record` ขึ้นอยู่กับแพลตฟอร์มของ node
- การบันทึกหน้าจอจะถูก clamp ที่ `<= 60s`
- `--no-audio` จะปิดการจับเสียงไมโครโฟนบนแพลตฟอร์มที่รองรับ
- ใช้ `--screen <index>` เพื่อเลือกจอแสดงผลเมื่อมีหลายจอ

## ตำแหน่ง (node)

node จะเปิดเผย `location.get` เมื่อเปิดใช้งาน Location ในการตั้งค่า

ตัวช่วย CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

หมายเหตุ:

- Location จะ **ปิดไว้โดยค่าเริ่มต้น**
- “Always” ต้องใช้สิทธิ์ของระบบ; การดึงข้อมูลในพื้นหลังเป็นแบบ best-effort
- การตอบกลับจะมี lat/lon, accuracy (เมตร) และ timestamp

## SMS (Android node)

Android node สามารถเปิดเผย `sms.send` เมื่อผู้ใช้ให้สิทธิ์ **SMS** และอุปกรณ์รองรับการโทรศัพท์

invoke ระดับต่ำ:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

หมายเหตุ:

- ต้องยอมรับพรอมป์ขอสิทธิ์บนอุปกรณ์ Android ก่อน จึงจะมีการโฆษณาความสามารถนี้
- อุปกรณ์ Wi‑Fi-only ที่ไม่มีฟังก์ชันโทรศัพท์จะไม่โฆษณา `sms.send`

## คำสั่ง Android device + ข้อมูลส่วนบุคคล

Android node สามารถโฆษณาตระกูลคำสั่งเพิ่มเติมได้เมื่อเปิดใช้ความสามารถที่เกี่ยวข้อง

ตระกูลที่ใช้ได้:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

ตัวอย่าง invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

หมายเหตุ:

- คำสั่ง motion จะถูกควบคุมด้วย capability ตามเซ็นเซอร์ที่มีอยู่

## คำสั่งระบบ (โฮสต์ node / mac node)

macOS node เปิดเผย `system.run`, `system.notify`, และ `system.execApprovals.get/set`
ส่วนโฮสต์ node แบบ headless เปิดเผย `system.run`, `system.which`, และ `system.execApprovals.get/set`

ตัวอย่าง:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

หมายเหตุ:

- `system.run` จะคืน stdout/stderr/exit code ใน payload
- ขณะนี้การรัน shell จะผ่านเครื่องมือ `exec` ด้วย `host=node`; `nodes` ยังคงเป็นพื้นผิว direct-RPC สำหรับคำสั่ง node แบบชัดเจน
- `nodes invoke` จะไม่เปิดเผย `system.run` หรือ `system.run.prepare`; สิ่งเหล่านี้จะอยู่บนพาธ exec เท่านั้น
- พาธ exec จะเตรียม `systemRunPlan` แบบ canonical ก่อนการอนุมัติ เมื่อมี
  การอนุมัติแล้ว gateway จะส่งต่อแผนที่จัดเก็บไว้นั้น ไม่ใช่
  command/cwd/session field ที่ผู้เรียกแก้ไขภายหลัง
- `system.notify` จะเคารพสถานะสิทธิ์การแจ้งเตือนบนแอป macOS
- metadata ของ node `platform` / `deviceFamily` ที่ไม่รู้จักจะใช้ allowlist เริ่มต้นแบบอนุรักษ์นิยมซึ่งไม่รวม `system.run` และ `system.which` หากคุณตั้งใจต้องใช้คำสั่งเหล่านั้นสำหรับแพลตฟอร์มที่ไม่รู้จัก ให้เพิ่มอย่างชัดเจนผ่าน `gateway.nodes.allowCommands`
- `system.run` รองรับ `--cwd`, `--env KEY=VAL`, `--command-timeout`, และ `--needs-screen-recording`
- สำหรับ shell wrapper (`bash|sh|zsh ... -c/-lc`), ค่า `--env` ที่มีขอบเขตต่อคำขอจะถูกลดให้เหลือ allowlist แบบชัดเจน (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)
- สำหรับการตัดสินใจ allow-always ในโหมด allowlist, dispatch wrapper ที่รู้จัก (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) จะคงพาธของ executable ด้านในไว้แทนพาธของ wrapper หากแกะ wrapper อย่างปลอดภัยไม่ได้ จะไม่มีการคงรายการ allowlist ใด ๆ โดยอัตโนมัติ
- บนโฮสต์ node ของ Windows ในโหมด allowlist การรัน shell-wrapper ผ่าน `cmd.exe /c` ต้องได้รับการอนุมัติ (รายการ allowlist เพียงอย่างเดียวจะไม่ auto-allow รูปแบบ wrapper นี้)
- `system.notify` รองรับ `--priority <passive|active|timeSensitive>` และ `--delivery <system|overlay|auto>`
- โฮสต์ node จะเพิกเฉยต่อการ override `PATH` และลบ startup/shell key ที่อันตราย (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) หากคุณต้องการรายการ PATH เพิ่มเติม ให้กำหนดค่าที่สภาพแวดล้อมของ service ของโฮสต์ node (หรือติดตั้งเครื่องมือไว้ในตำแหน่งมาตรฐาน) แทนการส่ง `PATH` ผ่าน `--env`
- ในโหมด macOS node, `system.run` ถูกควบคุมโดยการอนุมัติ exec ในแอป macOS (Settings → Exec approvals)
  Ask/allowlist/full มีพฤติกรรมเหมือนกับโฮสต์ node แบบ headless; พรอมป์ที่ถูกปฏิเสธจะคืน `SYSTEM_RUN_DENIED`
- บนโฮสต์ node แบบ headless, `system.run` ถูกควบคุมโดยการอนุมัติ exec (`~/.openclaw/exec-approvals.json`)

## การ bind exec กับ node

เมื่อมีหลาย node ให้ใช้งาน คุณสามารถ bind exec ไปยัง node ที่ระบุได้
การตั้งค่านี้จะกำหนด node เริ่มต้นสำหรับ `exec host=node` (และสามารถ override ต่อ agent ได้)

ค่าเริ่มต้นแบบ global:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

override ต่อ agent:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

ยกเลิกการตั้งค่าเพื่ออนุญาตให้ใช้ node ใดก็ได้:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## แผนผังสิทธิ์

Node อาจรวม `permissions` map ไว้ใน `node.list` / `node.describe` โดยใช้ชื่อสิทธิ์เป็นคีย์ (เช่น `screenRecording`, `accessibility`) และค่า boolean (`true` = ได้รับสิทธิ์)

## โฮสต์ node แบบ headless (ข้ามแพลตฟอร์ม)

OpenClaw สามารถรัน **โฮสต์ node แบบ headless** (ไม่มี UI) ที่เชื่อมต่อกับ Gateway
WebSocket และเปิดเผย `system.run` / `system.which` สิ่งนี้มีประโยชน์บน Linux/Windows
หรือสำหรับการรัน node แบบมินิมอลข้างเซิร์ฟเวอร์

เริ่มต้นได้ด้วย:

```bash
openclaw node run --host <gateway-host> --port 18789
```

หมายเหตุ:

- ยังคงต้องมีการจับคู่ (Gateway จะแสดงพรอมป์การจับคู่อุปกรณ์)
- โฮสต์ node จะจัดเก็บ node id, token, display name และข้อมูลการเชื่อมต่อกับ gateway ไว้ใน `~/.openclaw/node.json`
- การอนุมัติ exec จะถูกบังคับใช้ในเครื่องผ่าน `~/.openclaw/exec-approvals.json`
  (ดู [Exec approvals](/th/tools/exec-approvals))
- บน macOS โฮสต์ node แบบ headless จะดำเนินการ `system.run` ภายในเครื่องโดยค่าเริ่มต้น ตั้ง
  `OPENCLAW_NODE_EXEC_HOST=app` เพื่อกำหนดเส้นทาง `system.run` ผ่านโฮสต์ exec ของแอปคู่หู; เพิ่ม
  `OPENCLAW_NODE_EXEC_FALLBACK=0` เพื่อบังคับใช้โฮสต์แอปและ fail closed หากใช้งานไม่ได้
- เพิ่ม `--tls` / `--tls-fingerprint` เมื่อ Gateway WS ใช้ TLS

## โหมด mac node

- แอป menubar ของ macOS จะเชื่อมต่อกับ Gateway WS server เป็น node (ดังนั้น `openclaw nodes …` จะทำงานกับ Mac เครื่องนี้ได้)
- ในโหมด remote แอปจะเปิด SSH tunnel สำหรับพอร์ตของ Gateway และเชื่อมต่อกับ `localhost`
