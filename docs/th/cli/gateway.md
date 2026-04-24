---
read_when:
    - การรัน Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การแก้จุดบกพร่อง auth, โหมดการ bind และการเชื่อมต่อของ Gateway
    - การค้นหา gateways ผ่าน Bonjour (DNS-SD แบบในเครื่อง + แบบเครือข่ายวงกว้าง)
summary: OpenClaw Gateway CLI (`openclaw gateway`) — เรียกใช้ สืบค้น และค้นหา gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-24T09:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (channels, nodes, sessions, hooks)

คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

เอกสารที่เกี่ยวข้อง:

- [/gateway/bonjour](/th/gateway/bonjour)
- [/gateway/discovery](/th/gateway/discovery)
- [/gateway/configuration](/th/gateway/configuration)

## เรียกใช้ Gateway

เรียกใช้ process ของ Gateway ในเครื่อง:

```bash
openclaw gateway
```

alias สำหรับรันแบบ foreground:

```bash
openclaw gateway run
```

หมายเหตุ:

- โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบ ad-hoc/สำหรับการพัฒนา
- `openclaw onboard --mode local` และ `openclaw setup` ควรเขียนค่า `gateway.mode=local` หากไฟล์มีอยู่แล้วแต่ไม่มี `gateway.mode` ให้ถือว่า config เสียหายหรือถูกเขียนทับ และซ่อมแซมแทนที่จะสมมติโดยปริยายว่าเป็น local mode
- หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านี่เป็นความเสียหายของ config ที่น่าสงสัย และจะปฏิเสธที่จะ “เดาว่าเป็น local” ให้คุณ
- ระบบจะบล็อกการ bind เกินกว่า local loopback โดยไม่มี auth (ราวกั้นความปลอดภัย)
- `SIGUSR1` จะทริกเกอร์การรีสตาร์ตภายในโปรเซสเมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานเป็นค่าเริ่มต้น; ตั้ง `commands.restart: false` เพื่อบล็อกการรีสตาร์ตด้วยตนเอง ขณะที่เครื่องมือ/config apply/update ของ gateway ยังอนุญาตอยู่)
- ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุด process ของ gateway แต่จะไม่คืนค่าสถานะ terminal แบบกำหนดเอง หากคุณครอบ CLI ด้วย TUI หรืออินพุตแบบ raw mode ให้คืนค่าสถานะ terminal ก่อนออก

### ตัวเลือก

- `--port <port>`: พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยทั่วไปคือ `18789`)
- `--bind <loopback|lan|tailnet|auto|custom>`: โหมดการ bind ของตัวรับฟัง
- `--auth <token|password>`: override โหมด auth
- `--token <token>`: override token (และตั้งค่า `OPENCLAW_GATEWAY_TOKEN` ให้กับโปรเซสด้วย)
- `--password <password>`: override รหัสผ่าน คำเตือน: รหัสผ่านแบบอินไลน์อาจถูกเปิดเผยในรายการโปรเซสในเครื่อง
- `--password-file <path>`: อ่านรหัสผ่านของ gateway จากไฟล์
- `--tailscale <off|serve|funnel>`: เปิดเผย Gateway ผ่าน Tailscale
- `--tailscale-reset-on-exit`: รีเซ็ต config ของ Tailscale serve/funnel เมื่อปิดระบบ
- `--allow-unconfigured`: อนุญาตให้เริ่ม gateway ได้โดยไม่มี `gateway.mode=local` ใน config การทำเช่นนี้จะข้าม startup guard สำหรับการ bootstrap แบบ ad-hoc/สำหรับการพัฒนาเท่านั้น; จะไม่เขียนหรือซ่อมไฟล์ config
- `--dev`: สร้าง config + workspace สำหรับการพัฒนาหากยังไม่มี (ข้าม `BOOTSTRAP.md`)
- `--reset`: รีเซ็ต config + credentials + sessions + workspace สำหรับการพัฒนา (ต้องใช้ร่วมกับ `--dev`)
- `--force`: kill ตัวรับฟังที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่ม
- `--verbose`: logs แบบละเอียด
- `--cli-backend-logs`: แสดงเฉพาะ logs ของ backend CLI ในคอนโซล (และเปิด stdout/stderr)
- `--ws-log <auto|full|compact>`: รูปแบบ log ของ websocket (ค่าเริ่มต้น `auto`)
- `--compact`: alias ของ `--ws-log compact`
- `--raw-stream`: บันทึกเหตุการณ์สตรีมของ model แบบดิบลง jsonl
- `--raw-stream-path <path>`: พาธ jsonl ของ raw stream

การโปรไฟล์ระหว่างเริ่มต้นระบบ:

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาในแต่ละช่วงระหว่างการเริ่มต้น Gateway
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อ benchmark การเริ่มต้น Gateway benchmark นี้จะบันทึกผลลัพธ์แรกของโปรเซส, `/healthz`, `/readyz` และเวลา startup trace

## สืบค้น Gateway ที่กำลังทำงานอยู่

คำสั่งสืบค้นทั้งหมดใช้ WebSocket RPC

โหมดเอาต์พุต:

- ค่าเริ่มต้น: อ่านได้ง่ายสำหรับมนุษย์ (มีสีใน TTY)
- `--json`: JSON ที่อ่านได้โดยเครื่อง (ไม่มี styling/spinner)
- `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI แต่ยังคง layout แบบสำหรับมนุษย์

ตัวเลือกที่ใช้ร่วมกัน (ในคำสั่งที่รองรับ):

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--password <password>`: รหัสผ่านของ Gateway
- `--timeout <ms>`: timeout/budget (แตกต่างกันไปตามคำสั่ง)
- `--expect-final`: รอการตอบกลับแบบ “final” (การเรียกเอเจนต์)

หมายเหตุ: เมื่อคุณตั้ง `--url` CLI จะไม่ fallback ไปใช้ credentials จาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` แบบชัดเจน การไม่มี credentials ที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP endpoint `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้แล้ว ส่วน HTTP endpoint `/readyz` เข้มงวดกว่า และจะยังเป็นสีแดงขณะที่ sidecars ระหว่างเริ่มต้นระบบ, channels หรือ hooks ที่กำหนดค่าไว้ยังคงตั้งหลักไม่เสร็จ

### `gateway usage-cost`

ดึงสรุป usage-cost จาก session logs

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

ตัวเลือก:

- `--days <days>`: จำนวนวันที่จะรวม (ค่าเริ่มต้น `30`)

### `gateway stability`

ดึงตัวบันทึกความเสถียรเพื่อการวินิจฉัยล่าสุดจาก Gateway ที่กำลังทำงานอยู่

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

ตัวเลือก:

- `--limit <limit>`: จำนวนเหตุการณ์ล่าสุดสูงสุดที่จะรวม (ค่าเริ่มต้น `25`, สูงสุด `1000`)
- `--type <type>`: กรองตามประเภทเหตุการณ์วินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
- `--since-seq <seq>`: รวมเฉพาะเหตุการณ์หลังหมายเลขลำดับการวินิจฉัยนี้
- `--bundle [path]`: อ่าน persisted stability bundle แทนการเรียก Gateway ที่กำลังทำงาน ใช้ `--bundle latest` (หรือแค่ `--bundle`) สำหรับ bundle ล่าสุดภายใต้ state directory หรือส่งพาธ JSON ของ bundle โดยตรง
- `--export`: เขียน zip การวินิจฉัยสำหรับซัพพอร์ตที่แชร์ได้ แทนการพิมพ์รายละเอียดความเสถียร
- `--output <path>`: พาธเอาต์พุตสำหรับ `--export`

หมายเหตุ:

- บันทึกจะเก็บ metadata ด้านการปฏิบัติการ: ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ชื่อ channel/plugin และสรุปเซสชันที่มีการปกปิดข้อมูล ไม่เก็บข้อความแชต, เนื้อหา webhook, เอาต์พุตของเครื่องมือ, เนื้อหาคำขอหรือการตอบกลับแบบดิบ, tokens, cookies, ค่าความลับ, hostnames หรือ session ids แบบดิบ ตั้งค่า `diagnostics.enabled: false` เพื่อปิดตัวบันทึกทั้งหมด
- เมื่อ Gateway ปิดตัวลงแบบ fatal, timeout ระหว่างปิดระบบ และความล้มเหลวในการเริ่มต้นหลังรีสตาร์ต OpenClaw จะเขียน diagnostic snapshot เดียวกันลงใน `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อมีเหตุการณ์ในตัวบันทึก ตรวจสอบ bundle ล่าสุดได้ด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ก็ใช้กับเอาต์พุตของ bundle เช่นกัน

### `gateway diagnostics export`

เขียน zip การวินิจฉัยในเครื่องซึ่งออกแบบมาเพื่อแนบกับรายงานบั๊ก
สำหรับโมเดลด้านความเป็นส่วนตัวและเนื้อหาใน bundle โปรดดู [Diagnostics Export](/th/gateway/diagnostics)

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

ตัวเลือก:

- `--output <path>`: พาธ zip เอาต์พุต ค่าเริ่มต้นคือ support export ภายใต้ state directory
- `--log-lines <count>`: จำนวนบรรทัด log ที่ผ่านการ sanitize สูงสุดที่จะรวม (ค่าเริ่มต้น `5000`)
- `--log-bytes <bytes>`: จำนวนไบต์ log สูงสุดที่จะตรวจสอบ (ค่าเริ่มต้น `1000000`)
- `--url <url>`: URL WebSocket ของ Gateway สำหรับ health snapshot
- `--token <token>`: token ของ Gateway สำหรับ health snapshot
- `--password <password>`: รหัสผ่านของ Gateway สำหรับ health snapshot
- `--timeout <ms>`: timeout ของ status/health snapshot (ค่าเริ่มต้น `3000`)
- `--no-stability-bundle`: ข้ามการค้นหา persisted stability bundle
- `--json`: พิมพ์พาธที่เขียนแล้ว ขนาด และ manifest เป็น JSON

export นี้ประกอบด้วย manifest, สรุปแบบ Markdown, รูปร่างของ config, รายละเอียด config ที่ผ่านการ sanitize, สรุป log ที่ผ่านการ sanitize, snapshots ของสถานะ/health ของ Gateway ที่ผ่านการ sanitize และ stability bundle ล่าสุดเมื่อมีอยู่

มีไว้เพื่อการแชร์ โดยจะเก็บรายละเอียดด้านการปฏิบัติการที่ช่วยในการแก้จุดบกพร่อง เช่น ฟิลด์ log ของ OpenClaw ที่ปลอดภัย ชื่อ subsystem รหัสสถานะ ระยะเวลา โหมดที่กำหนดค่าไว้ พอร์ต plugin ids provider ids การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความใน operational log ที่มีการปกปิดข้อมูล จะละเว้นหรือปกปิดข้อความแชต, เนื้อหา webhook, เอาต์พุตของเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostnames และค่าความลับ เมื่อข้อความแบบ LogTape ดูเหมือนเป็นข้อความ payload ของผู้ใช้/แชต/เครื่องมือ export จะเก็บไว้เพียงว่ามีข้อความถูกละไว้พร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อม optional probe ของความสามารถด้านการเชื่อมต่อ/auth

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

ตัวเลือก:

- `--url <url>`: เพิ่มเป้าหมาย probe แบบชัดเจน ยังคง probe ทั้ง remote ที่กำหนดค่าไว้ + localhost
- `--token <token>`: token auth สำหรับ probe
- `--password <password>`: password auth สำหรับ probe
- `--timeout <ms>`: timeout ของ probe (ค่าเริ่มต้น `10000`)
- `--no-probe`: ข้าม connectivity probe (มุมมองเฉพาะบริการ)
- `--deep`: สแกนบริการระดับระบบด้วย
- `--require-rpc`: ยกระดับ connectivity probe เริ่มต้นเป็น read probe และออกด้วยสถานะ non-zero เมื่อ read probe นั้นล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้

หมายเหตุ:

- `gateway status` ยังคงใช้เพื่อการวินิจฉัยได้แม้ config CLI ในเครื่องจะหายไปหรือไม่ถูกต้อง
- `gateway status` เริ่มต้นจะพิสูจน์สถานะบริการ การเชื่อมต่อ WebSocket และความสามารถ auth ที่มองเห็นได้ในเวลาจับมือเชื่อมต่อ ไม่ได้พิสูจน์การทำงานแบบ read/write/admin
- `gateway status` จะ resolve auth SecretRefs ที่กำหนดค่าไว้สำหรับ probe auth เมื่อทำได้
- หาก auth SecretRef ที่จำเป็นยัง resolve ไม่ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อ probe การเชื่อมต่อ/auth ล้มเหลว; ให้ส่ง `--token`/`--password` แบบชัดเจนหรือแก้แหล่ง secret ก่อน
- หาก probe สำเร็จ คำเตือน unresolved auth-ref จะถูกซ่อนเพื่อหลีกเลี่ยง false positives
- ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติเมื่อการมีบริการที่กำลังฟังอยู่ยังไม่พอ และคุณต้องการให้ RPC ระดับ read ใช้งานได้จริงด้วย
- `--deep` จะเพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบหลายบริการคล้าย gateway เอาต์พุตแบบสำหรับมนุษย์จะแสดงคำแนะนำในการทำความสะอาดและเตือนว่าการตั้งค่าส่วนใหญ่ควรมีหนึ่ง gateway ต่อหนึ่งเครื่อง
- เอาต์พุตแบบสำหรับมนุษย์รวมพาธ file log ที่ resolve แล้ว พร้อม snapshot ของพาธ/ความถูกต้องของ config ระหว่าง CLI กับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของ profile หรือ state-dir
- ในการติดตั้ง systemd บน Linux การตรวจสอบ auth drift ของบริการจะอ่านทั้งค่า `Environment=` และ `EnvironmentFile=` จาก unit (รวม `%h`, พาธที่มีเครื่องหมายคำพูด, หลายไฟล์ และไฟล์แบบไม่บังคับที่มี `-`)
- การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ merged runtime env (env ของคำสั่งบริการก่อน แล้วค่อย fallback ไปที่ env ของโปรเซส)
- หาก token auth ไม่ได้ใช้งานจริงอย่างมีผล (เช่น `gateway.auth.mode` ถูกตั้งชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งโหมดไว้ในกรณีที่ password อาจชนะและไม่มี token candidate ใดที่ชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve token จาก config

### `gateway probe`

`gateway probe` คือคำสั่ง “debug ทุกอย่าง” โดยจะ probe เสมอ:

- remote gateway ที่กำหนดค่าไว้ของคุณ (หากมี) และ
- localhost (local loopback) **แม้จะมีการกำหนด remote ไว้ก็ตาม**

หากคุณส่ง `--url` เป้าหมายที่ระบุชัดเจนนั้นจะถูกเพิ่มก่อนทั้งสองรายการ เอาต์พุตแบบสำหรับมนุษย์จะติดป้ายกำกับ
เป้าหมายดังนี้:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

หากเข้าถึงได้หลาย gateway ระบบจะแสดงทั้งหมด รองรับหลาย gateway เมื่อคุณใช้ profiles/ports แยกกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงใช้ gateway เดียว

```bash
openclaw gateway probe
openclaw gateway probe --json
```

การตีความ:

- `Reachable: yes` หมายถึงมีอย่างน้อยหนึ่งเป้าหมายที่ยอมรับการเชื่อมต่อ WebSocket
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe สามารถพิสูจน์ได้เกี่ยวกับ auth ซึ่งแยกจากการเข้าถึงได้
- `Read probe: ok` หมายถึงการเรียก RPC รายละเอียดระดับ read (`health`/`status`/`system-presence`/`config.get`) ก็สำเร็จเช่นกัน
- `Read probe: limited - missing scope: operator.read` หมายถึงเชื่อมต่อสำเร็จ แต่ RPC ระดับ read ถูกจำกัด ซึ่งถูกรายงานเป็นการเข้าถึงได้แบบ **degraded** ไม่ใช่ความล้มเหลวเต็มรูปแบบ
- รหัสทางออกจะเป็น non-zero ก็ต่อเมื่อไม่มีเป้าหมายใดที่ probe แล้วเข้าถึงได้

หมายเหตุสำหรับ JSON (`--json`):

- ระดับบนสุด:
  - `ok`: อย่างน้อยหนึ่งเป้าหมายเข้าถึงได้
  - `degraded`: อย่างน้อยหนึ่งเป้าหมายมี detail RPC ที่ถูกจำกัดขอบเขต
  - `capability`: ความสามารถที่ดีที่สุดที่พบในบรรดาเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
  - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่จะถือเป็นตัวชนะหลักที่กำลังใช้งาน ตามลำดับนี้: URL ที่ระบุชัดเจน, SSH tunnel, remote ที่กำหนดค่าไว้, แล้วจึงเป็น local loopback
  - `warnings[]`: ระเบียนคำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` แบบไม่บังคับ
  - `network`: คำแนะนำ URL ของ local loopback/tailnet ที่ได้จาก config ปัจจุบันและเครือข่ายของโฮสต์
  - `discovery.timeoutMs` และ `discovery.count`: budget/จำนวนผลลัพธ์ของการค้นพบจริงที่ใช้ในการ probe รอบนี้
- ต่อเป้าหมาย (`targets[].connect`):
  - `ok`: การเข้าถึงได้หลังเชื่อมต่อ + การจัดประเภท degraded
  - `rpcOk`: ความสำเร็จของ detail RPC แบบเต็ม
  - `scopeLimited`: detail RPC ล้มเหลวเนื่องจากไม่มี operator scope
- ต่อเป้าหมาย (`targets[].auth`):
  - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
  - `scopes`: scopes ที่ได้รับอนุญาตซึ่งรายงานใน `hello-ok` เมื่อมี
  - `capability`: การจัดประเภทความสามารถ auth ที่แสดงสำหรับเป้าหมายนั้น

รหัสคำเตือนที่พบบ่อย:

- `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่ง fallback ไปใช้ direct probes
- `multiple_gateways`: เข้าถึงได้มากกว่าหนึ่งเป้าหมาย; ถือว่าผิดปกติ เว้นแต่คุณตั้งใจรัน profiles แยกกัน เช่น rescue bot
- `auth_secretref_unresolved`: ไม่สามารถ resolve auth SecretRef ที่กำหนดค่าไว้สำหรับเป้าหมายที่ล้มเหลวได้
- `probe_scope_limited`: เชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเพราะไม่มี `operator.read`

#### Remote ผ่าน SSH (ให้พฤติกรรมเทียบเท่าแอป Mac)

โหมด “Remote over SSH” ของแอป macOS ใช้ local port-forward เพื่อให้ remote gateway (ซึ่งอาจ bind เฉพาะ loopback) เข้าถึงได้ที่ `ws://127.0.0.1:<port>`

คำสั่ง CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

ตัวเลือก:

- `--ssh <target>`: `user@host` หรือ `user@host:port` (พอร์ตค่าเริ่มต้นคือ `22`)
- `--ssh-identity <path>`: ไฟล์ identity
- `--ssh-auto`: เลือกโฮสต์ gateway ตัวแรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นพบที่ resolve แล้ว
  (`local.` บวกโดเมนเครือข่ายวงกว้างที่กำหนดค่าไว้ หากมี) ระบบจะละเลย hints ที่มีแต่ TXT เท่านั้น

Config (ไม่บังคับ ใช้เป็นค่าเริ่มต้น):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

ตัวช่วย RPC ระดับต่ำ

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

ตัวเลือก:

- `--params <json>`: สตริงออบเจ็กต์ JSON สำหรับ params (ค่าเริ่มต้น `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

หมายเหตุ:

- `--params` ต้องเป็น JSON ที่ถูกต้อง
- `--expect-final` มีไว้เป็นหลักสำหรับ RPC แบบเอเจนต์ที่สตรีมเหตุการณ์ระหว่างทางก่อน payload สุดท้าย

## จัดการบริการ Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

ตัวเลือกของคำสั่ง:

- `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart`: `--json`

หมายเหตุ:

- `gateway install` รองรับ `--port`, `--runtime`, `--token`, `--force`, `--json`
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่บันทึก token ที่ resolve แล้วลงใน metadata สภาพแวดล้อมของบริการ
- หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้งจะล้มเหลวแบบปิดตาย แทนการบันทึก fallback plaintext
- สำหรับ password auth บน `gateway run` ควรใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` แบบ SecretRef-backed มากกว่า `--password` แบบอินไลน์
- ในโหมด auth ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนข้อกำหนดเรื่อง token สำหรับการติดตั้ง; ให้ใช้ config ที่คงอยู่ (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งเป็น managed service
- หากกำหนดทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้ง `gateway.auth.mode` ไว้ การติดตั้งจะถูกบล็อกจนกว่าจะตั้งโหมดอย่างชัดเจน
- คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหา Gateway beacons (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [/gateway/bonjour](/th/gateway/bonjour)

มีเพียง gateways ที่เปิดใช้ Bonjour discovery (ค่าเริ่มต้น) เท่านั้นที่ประกาศ beacon

ระเบียนการค้นพบแบบ Wide-Area ประกอบด้วย (TXT):

- `role` (role hint ของ gateway)
- `transport` (transport hint เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยทั่วไปคือ `18789`)
- `sshPort` (ไม่บังคับ; ค่าเริ่มต้นของไคลเอนต์สำหรับเป้าหมาย SSH คือ `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + fingerprint ของใบรับรอง)
- `cliPath` (remote-install hint ที่เขียนลงใน wide-area zone)

### `gateway discover`

```bash
openclaw gateway discover
```

ตัวเลือก:

- `--timeout <ms>`: timeout ต่อคำสั่ง (browse/resolve); ค่าเริ่มต้น `2000`
- `--json`: เอาต์พุตแบบ machine-readable (และปิด styling/spinner ด้วย)

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

หมายเหตุ:

- CLI จะสแกน `local.` บวกโดเมนเครือข่ายวงกว้างที่กำหนดค่าไว้เมื่อมีการเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON จะได้มาจาก endpoint ของบริการที่ resolve แล้ว ไม่ได้มาจาก hints ที่มีแต่ TXT
  เช่น `lanHost` หรือ `tailnetDns`
- บน `local.` mDNS, `sshPort` และ `cliPath` จะถูกประกาศก็ต่อเมื่อ
  `discovery.mdns.mode` เป็น `full` ส่วน Wide-area DNS-SD ยังคงเขียน `cliPath`; `sshPort`
  ก็ยังคงเป็นค่าไม่บังคับเช่นกัน

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Gateway runbook](/th/gateway)
