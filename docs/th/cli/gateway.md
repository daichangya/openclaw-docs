---
read_when:
    - การรัน Gateway จาก CLI (สำหรับการพัฒนาหรือเซิร์ฟเวอร์)
    - การดีบักการยืนยันตัวตนของ Gateway โหมด bind และการเชื่อมต่อ
    - การค้นหา gateway ผ่าน Bonjour (ภายในเครื่อง + DNS-SD แบบวงกว้าง)
summary: CLI ของ OpenClaw Gateway (`openclaw gateway`) — รัน สืบค้น และค้นหา gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-23T06:17:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60706df4d3c49271c4b53029eaae16672dde534c7f6f4ce68e04b58fb0cfa467
    source_path: cli/gateway.md
    workflow: 15
---

# CLI ของ Gateway

Gateway คือเซิร์ฟเวอร์ WebSocket ของ OpenClaw (channels, nodes, sessions, hooks)

คำสั่งย่อยในหน้านี้อยู่ภายใต้ `openclaw gateway …`

เอกสารที่เกี่ยวข้อง:

- [/gateway/bonjour](/th/gateway/bonjour)
- [/gateway/discovery](/th/gateway/discovery)
- [/gateway/configuration](/th/gateway/configuration)

## รัน Gateway

รัน process ของ Gateway ในเครื่อง:

```bash
openclaw gateway
```

นามแฝงสำหรับรันแบบ foreground:

```bash
openclaw gateway run
```

หมายเหตุ:

- โดยค่าเริ่มต้น Gateway จะปฏิเสธการเริ่มทำงาน เว้นแต่จะตั้งค่า `gateway.mode=local` ไว้ใน `~/.openclaw/openclaw.json` ใช้ `--allow-unconfigured` สำหรับการรันแบบเฉพาะกิจ/เพื่อการพัฒนา
- `openclaw onboard --mode local` และ `openclaw setup` ควรเป็นผู้เขียน `gateway.mode=local` หากไฟล์มีอยู่แต่ไม่มี `gateway.mode` ให้ถือว่านี่คือการกำหนดค่าที่เสียหายหรือถูกเขียนทับ และซ่อมแซมแทนที่จะสมมติว่าเป็น local mode โดยปริยาย
- หากไฟล์มีอยู่และไม่มี `gateway.mode` Gateway จะถือว่านี่เป็นความเสียหายของการกำหนดค่าที่น่าสงสัย และจะปฏิเสธที่จะ “เดา local” ให้คุณ
- ระบบจะบล็อกการ bind นอกเหนือจาก loopback โดยไม่มี auth (ราวป้องกันด้านความปลอดภัย)
- `SIGUSR1` จะทริกเกอร์การรีสตาร์ตภายใน process เมื่อได้รับอนุญาต (`commands.restart` เปิดใช้งานโดยค่าเริ่มต้น; ตั้งค่า `commands.restart: false` เพื่อบล็อกการรีสตาร์ตด้วยตนเอง แต่ยังอนุญาตให้ใช้เครื่องมือ/config ของ gateway เพื่อ apply/update ได้)
- ตัวจัดการ `SIGINT`/`SIGTERM` จะหยุด process ของ gateway แต่จะไม่กู้คืนสถานะ terminal แบบกำหนดเองใด ๆ หากคุณครอบ CLI ด้วย TUI หรืออินพุตแบบ raw-mode ให้กู้คืน terminal ก่อนออก

### ตัวเลือก

- `--port <port>`: พอร์ต WebSocket (ค่าเริ่มต้นมาจาก config/env; โดยปกติคือ `18789`)
- `--bind <loopback|lan|tailnet|auto|custom>`: โหมด bind ของ listener
- `--auth <token|password>`: แทนที่โหมด auth
- `--token <token>`: แทนที่ token (และตั้งค่า `OPENCLAW_GATEWAY_TOKEN` สำหรับ process ด้วย)
- `--password <password>`: แทนที่รหัสผ่าน คำเตือน: รหัสผ่านที่ใส่ไว้ตรง ๆ อาจถูกเปิดเผยในรายการ process ภายในเครื่อง
- `--password-file <path>`: อ่านรหัสผ่าน gateway จากไฟล์
- `--tailscale <off|serve|funnel>`: เปิดเผย Gateway ผ่าน Tailscale
- `--tailscale-reset-on-exit`: รีเซ็ตการกำหนดค่า Tailscale serve/funnel เมื่อปิดการทำงาน
- `--allow-unconfigured`: อนุญาตให้เริ่ม gateway โดยไม่มี `gateway.mode=local` ใน config ตัวเลือกนี้ข้ามราวป้องกันตอนเริ่มต้นสำหรับการบูตสแตรปแบบเฉพาะกิจ/เพื่อการพัฒนาเท่านั้น และจะไม่เขียนหรือซ่อมแซมไฟล์ config
- `--dev`: สร้าง config + workspace สำหรับการพัฒนาหากยังไม่มี (ข้าม BOOTSTRAP.md)
- `--reset`: รีเซ็ต config + credentials + sessions + workspace สำหรับการพัฒนา (ต้องใช้ร่วมกับ `--dev`)
- `--force`: ฆ่า listener ที่มีอยู่บนพอร์ตที่เลือกก่อนเริ่มทำงาน
- `--verbose`: บันทึกแบบละเอียด
- `--cli-backend-logs`: แสดงเฉพาะบันทึก backend ของ CLI ในคอนโซล (และเปิดใช้งาน stdout/stderr)
- `--ws-log <auto|full|compact>`: รูปแบบบันทึก websocket (ค่าเริ่มต้นคือ `auto`)
- `--compact`: นามแฝงของ `--ws-log compact`
- `--raw-stream`: บันทึก event ของ model stream แบบดิบลงใน jsonl
- `--raw-stream-path <path>`: พาธ jsonl ของ raw stream

การทำโปรไฟล์ตอนเริ่มต้น:

- ตั้งค่า `OPENCLAW_GATEWAY_STARTUP_TRACE=1` เพื่อบันทึกเวลาในแต่ละช่วงระหว่างการเริ่มต้น Gateway
- รัน `pnpm test:startup:gateway -- --runs 5 --warmup 1` เพื่อวัดประสิทธิภาพการเริ่มต้น Gateway การวัดจะบันทึกเอาต์พุตแรกของ process, `/healthz`, `/readyz` และเวลา startup trace

## สืบค้น Gateway ที่กำลังรันอยู่

คำสั่งสืบค้นทั้งหมดใช้ WebSocket RPC

โหมดเอาต์พุต:

- ค่าเริ่มต้น: อ่านได้โดยมนุษย์ (มีสีใน TTY)
- `--json`: JSON ที่เครื่องอ่านได้ (ไม่มีการจัดรูปแบบ/spinner)
- `--no-color` (หรือ `NO_COLOR=1`): ปิด ANSI แต่คงเลย์เอาต์แบบมนุษย์อ่านได้

ตัวเลือกร่วม (ในคำสั่งที่รองรับ):

- `--url <url>`: URL WebSocket ของ Gateway
- `--token <token>`: token ของ Gateway
- `--password <password>`: รหัสผ่านของ Gateway
- `--timeout <ms>`: timeout/budget (แตกต่างกันไปตามคำสั่ง)
- `--expect-final`: รอการตอบกลับแบบ “final” (การเรียก agent)

หมายเหตุ: เมื่อคุณตั้งค่า `--url` แล้ว CLI จะไม่ถอยกลับไปใช้ credentials จาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มี credentials แบบชัดเจนถือเป็นข้อผิดพลาด

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

endpoint HTTP `/healthz` เป็น liveness probe: จะตอบกลับเมื่อเซิร์ฟเวอร์สามารถตอบ HTTP ได้ ส่วน endpoint HTTP `/readyz` เข้มงวดกว่า และจะยังคงเป็นสีแดงในขณะที่ sidecars, channels หรือ hooks ที่กำหนดค่าไว้ระหว่างการเริ่มต้นยังคงอยู่ระหว่างการตั้งตัว

### `gateway usage-cost`

ดึงสรุป usage-cost จากบันทึกเซสชัน

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

ตัวเลือก:

- `--days <days>`: จำนวนวันที่จะรวม (ค่าเริ่มต้น `30`)

### `gateway stability`

ดึงตัวบันทึกเสถียรภาพสำหรับการวินิจฉัยล่าสุดจาก Gateway ที่กำลังรันอยู่

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

ตัวเลือก:

- `--limit <limit>`: จำนวน event ล่าสุดสูงสุดที่จะรวม (ค่าเริ่มต้น `25`, สูงสุด `1000`)
- `--type <type>`: กรองตามชนิด event สำหรับการวินิจฉัย เช่น `payload.large` หรือ `diagnostic.memory.pressure`
- `--since-seq <seq>`: รวมเฉพาะ event หลังหมายเลขลำดับการวินิจฉัยนี้
- `--bundle [path]`: อ่าน stability bundle ที่บันทึกไว้ แทนการเรียก Gateway ที่กำลังรัน ใช้ `--bundle latest` (หรือเพียง `--bundle`) สำหรับ bundle ล่าสุดใต้ state directory หรือระบุพาธ JSON ของ bundle โดยตรง
- `--export`: เขียนไฟล์ zip การวินิจฉัยเพื่อการสนับสนุนที่สามารถแชร์ได้ แทนการพิมพ์รายละเอียดเสถียรภาพ
- `--output <path>`: พาธเอาต์พุตสำหรับ `--export`

หมายเหตุ:

- ตัวบันทึกทำงานอยู่โดยค่าเริ่มต้น ตั้งค่า `diagnostics.enabled: false` เฉพาะเมื่อคุณจำเป็นต้องปิดการเก็บ diagnostic heartbeat ของ Gateway
- บันทึกจะเก็บ metadata ด้านปฏิบัติการ: ชื่อ event, จำนวนครั้ง, ขนาดไบต์, ค่าหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อ channel/plugin และสรุปเซสชันที่ปกปิดข้อมูลแล้ว จะไม่เก็บข้อความแชต, เนื้อหา webhook, เอาต์พุตเครื่องมือ, เนื้อหา request หรือ response แบบดิบ, tokens, cookies, ค่าความลับ, hostnames หรือ session id แบบดิบ
- เมื่อ Gateway ออกจากการทำงานแบบร้ายแรง, timeout ตอนปิดระบบ และการเริ่มต้นใหม่ล้มเหลว OpenClaw จะเขียนสแนปช็อตการวินิจฉัยเดียวกันไปยัง `~/.openclaw/logs/stability/openclaw-stability-*.json` เมื่อมี event ในตัวบันทึก ตรวจสอบ bundle ล่าสุดได้ด้วย `openclaw gateway stability --bundle latest`; `--limit`, `--type` และ `--since-seq` ใช้กับเอาต์พุตของ bundle ได้เช่นกัน

### `gateway diagnostics export`

เขียนไฟล์ zip การวินิจฉัยในเครื่องที่ออกแบบมาให้แนบไปกับรายงานบั๊ก

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

ตัวเลือก:

- `--output <path>`: พาธ zip ปลายทาง ค่าเริ่มต้นคือ support export ใต้ state directory
- `--log-lines <count>`: จำนวนบรรทัดบันทึกที่ผ่านการทำความสะอาดสูงสุดที่จะรวม (ค่าเริ่มต้น `5000`)
- `--log-bytes <bytes>`: จำนวนไบต์สูงสุดของบันทึกที่จะตรวจสอบ (ค่าเริ่มต้น `1000000`)
- `--url <url>`: URL WebSocket ของ Gateway สำหรับสแนปช็อต health
- `--token <token>`: token ของ Gateway สำหรับสแนปช็อต health
- `--password <password>`: รหัสผ่านของ Gateway สำหรับสแนปช็อต health
- `--timeout <ms>`: timeout ของสแนปช็อต status/health (ค่าเริ่มต้น `3000`)
- `--no-stability-bundle`: ข้ามการค้นหา stability bundle ที่บันทึกไว้
- `--json`: พิมพ์พาธที่เขียนแล้ว ขนาด และ manifest เป็น JSON

ไฟล์ export จะมี manifest, สรุป Markdown, รูปร่างของ config, รายละเอียด config ที่ผ่านการทำความสะอาด, สรุปบันทึกที่ผ่านการทำความสะอาด, สแนปช็อตสถานะ/health ของ Gateway ที่ผ่านการทำความสะอาด และ stability bundle ล่าสุดเมื่อมีอยู่

ไฟล์นี้ออกแบบมาให้แชร์ได้ โดยจะเก็บรายละเอียดด้านปฏิบัติการที่ช่วยในการดีบัก เช่น ฟิลด์บันทึก OpenClaw ที่ปลอดภัย, ชื่อ subsystem, status codes, ระยะเวลา, โหมดที่กำหนดค่าไว้, พอร์ต, plugin ids, provider ids, การตั้งค่าฟีเจอร์ที่ไม่เป็นความลับ และข้อความบันทึกด้านปฏิบัติการที่ปกปิดข้อมูลแล้ว โดยจะละเว้นหรือปกปิดข้อความแชต, เนื้อหา webhook, เอาต์พุตเครื่องมือ, credentials, cookies, ตัวระบุบัญชี/ข้อความ, ข้อความ prompt/instruction, hostnames และค่าความลับ เมื่อข้อความแบบ LogTape ดูเหมือนเป็นข้อความ payload ของผู้ใช้/แชต/เครื่องมือ export จะเก็บเพียงว่ามีข้อความที่ถูกละเว้น พร้อมจำนวนไบต์ของข้อความนั้น

### `gateway status`

`gateway status` แสดงบริการ Gateway (launchd/systemd/schtasks) พร้อมการตรวจสอบการเชื่อมต่อ/ความสามารถด้าน auth แบบไม่บังคับ

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

ตัวเลือก:

- `--url <url>`: เพิ่มเป้าหมาย probe แบบชัดเจน จะยังคง probe ทั้ง remote ที่กำหนดค่าไว้ + localhost
- `--token <token>`: token auth สำหรับ probe
- `--password <password>`: password auth สำหรับ probe
- `--timeout <ms>`: timeout ของ probe (ค่าเริ่มต้น `10000`)
- `--no-probe`: ข้ามการ probe การเชื่อมต่อ (มุมมองเฉพาะบริการ)
- `--deep`: สแกนบริการระดับระบบด้วย
- `--require-rpc`: ยกระดับ probe การเชื่อมต่อค่าเริ่มต้นให้เป็น read probe และคืนค่าออกไม่เป็นศูนย์เมื่อ read probe ล้มเหลว ใช้ร่วมกับ `--no-probe` ไม่ได้

หมายเหตุ:

- `gateway status` ยังใช้งานได้สำหรับการวินิจฉัย แม้ local CLI config จะหายไปหรือไม่ถูกต้อง
- `gateway status` ตามค่าเริ่มต้นพิสูจน์สถานะของบริการ, การเชื่อมต่อ WebSocket และความสามารถด้าน auth ที่มองเห็นได้ในช่วง handshake โดยไม่ได้พิสูจน์การดำเนินการแบบ read/write/admin
- `gateway status` จะแก้ SecretRef ของ auth ที่กำหนดค่าไว้สำหรับ probe auth เมื่อทำได้
- หาก SecretRef ของ auth ที่จำเป็นไม่สามารถแก้ได้ในเส้นทางคำสั่งนี้ `gateway status --json` จะรายงาน `rpc.authWarning` เมื่อ probe การเชื่อมต่อ/auth ล้มเหลว; ให้ส่ง `--token`/`--password` อย่างชัดเจน หรือแก้แหล่ง secret ก่อน
- หาก probe สำเร็จ คำเตือนเกี่ยวกับ auth-ref ที่แก้ไม่ได้จะถูกซ่อนเพื่อหลีกเลี่ยง false positives
- ใช้ `--require-rpc` ในสคริปต์และระบบอัตโนมัติ เมื่อการมีบริการที่รับฟังอยู่ยังไม่เพียงพอ และคุณต้องการให้การเรียก RPC ระดับ read ใช้งานได้ปกติด้วย
- `--deep` จะเพิ่มการสแกนแบบ best-effort สำหรับการติดตั้ง launchd/systemd/schtasks เพิ่มเติม เมื่อพบบริการลักษณะ gateway หลายตัว เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำในการเก็บกวาด และเตือนว่าการตั้งค่าส่วนใหญ่ควรรัน gateway หนึ่งตัวต่อหนึ่งเครื่อง
- เอาต์พุตสำหรับมนุษย์จะรวมพาธบันทึกไฟล์ที่ resolve แล้ว พร้อมสแนปช็อตพาธ config/ความถูกต้องของ CLI เทียบกับบริการ เพื่อช่วยวินิจฉัยความคลาดเคลื่อนของ profile หรือ state-dir
- ในการติดตั้ง Linux systemd การตรวจสอบ auth drift ของบริการจะอ่านค่าทั้ง `Environment=` และ `EnvironmentFile=` จาก unit (รวม `%h`, พาธที่มีเครื่องหมายอัญประกาศ, หลายไฟล์ และไฟล์แบบมี `-` เป็นตัวเลือก)
- การตรวจสอบ drift จะแก้ SecretRefs ของ `gateway.auth.token` โดยใช้ env ของ runtime ที่ผสานกัน (env ของคำสั่งบริการก่อน แล้วจึง fallback ไปยัง env ของ process)
- หาก token auth ไม่ได้มีผลใช้งานจริง (ตั้งค่า `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้งโหมดไว้ในกรณีที่ password อาจชนะและไม่มี candidate ของ token ที่สามารถชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve token จาก config

### `gateway probe`

`gateway probe` คือคำสั่ง “ดีบักทุกอย่าง” โดยจะ probe เสมอ:

- remote gateway ที่คุณกำหนดค่าไว้ (หากมี) และ
- localhost (local loopback) **แม้จะมีการกำหนด remote อยู่แล้วก็ตาม**

หากคุณส่ง `--url` เป้าหมายแบบชัดเจนนั้นจะถูกเพิ่มมาก่อนทั้งสองรายการ เอาต์พุตสำหรับมนุษย์จะติดป้ายกำกับเป้าหมายดังนี้:

- `URL (explicit)`
- `Remote (configured)` หรือ `Remote (configured, inactive)`
- `Local loopback`

หากเข้าถึง gateway ได้หลายตัว ระบบจะแสดงทั้งหมด รองรับหลาย gateway เมื่อคุณใช้ profiles/ports แบบแยกจากกัน (เช่น rescue bot) แต่การติดตั้งส่วนใหญ่ยังคงรัน gateway ตัวเดียว

```bash
openclaw gateway probe
openclaw gateway probe --json
```

การตีความ:

- `Reachable: yes` หมายความว่าอย่างน้อยหนึ่งเป้าหมายยอมรับการเชื่อมต่อ WebSocket
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` รายงานสิ่งที่ probe สามารถพิสูจน์ได้เกี่ยวกับ auth ซึ่งแยกจากการเข้าถึงได้
- `Read probe: ok` หมายความว่าการเรียก RPC รายละเอียดในขอบเขตการอ่าน (`health`/`status`/`system-presence`/`config.get`) ก็สำเร็จด้วย
- `Read probe: limited - missing scope: operator.read` หมายความว่าการเชื่อมต่อสำเร็จ แต่ RPC ในขอบเขตการอ่านถูกจำกัด สถานะนี้จะถูกรายงานเป็นการเข้าถึงได้แบบ **degraded** ไม่ใช่ความล้มเหลวทั้งหมด
- exit code จะไม่เป็นศูนย์ก็ต่อเมื่อไม่มีเป้าหมายใดที่ถูก probe แล้วเข้าถึงได้

หมายเหตุสำหรับ JSON (`--json`):

- ระดับบนสุด:
  - `ok`: มีอย่างน้อยหนึ่งเป้าหมายที่เข้าถึงได้
  - `degraded`: มีอย่างน้อยหนึ่งเป้าหมายที่มี detail RPC ถูกจำกัดด้วย scope
  - `capability`: ความสามารถที่ดีที่สุดที่พบในบรรดาเป้าหมายที่เข้าถึงได้ (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` หรือ `unknown`)
  - `primaryTargetId`: เป้าหมายที่ดีที่สุดที่จะถือเป็นตัวชนะหลักที่กำลังใช้งานอยู่ ตามลำดับนี้: URL แบบชัดเจน, SSH tunnel, remote ที่กำหนดค่าไว้ แล้วจึงเป็น local loopback
  - `warnings[]`: รายการคำเตือนแบบ best-effort ที่มี `code`, `message` และ `targetIds` แบบไม่บังคับ
  - `network`: คำใบ้ URL ของ local loopback/tailnet ที่ได้มาจาก config ปัจจุบันและเครือข่ายของโฮสต์
  - `discovery.timeoutMs` และ `discovery.count`: budget/จำนวนผลลัพธ์ของการค้นหาที่ใช้จริงสำหรับรอบ probe นี้
- ต่อเป้าหมาย (`targets[].connect`):
  - `ok`: ความสามารถในการเข้าถึงหลังจาก connect + การจัดประเภท degraded
  - `rpcOk`: ความสำเร็จเต็มรูปแบบของ detail RPC
  - `scopeLimited`: detail RPC ล้มเหลวเนื่องจากไม่มี operator scope
- ต่อเป้าหมาย (`targets[].auth`):
  - `role`: บทบาท auth ที่รายงานใน `hello-ok` เมื่อมี
  - `scopes`: scopes ที่ได้รับอนุญาตซึ่งรายงานใน `hello-ok` เมื่อมี
  - `capability`: การจัดประเภทความสามารถด้าน auth ที่แสดงออกมาสำหรับเป้าหมายนั้น

รหัสคำเตือนที่พบบ่อย:

- `ssh_tunnel_failed`: การตั้งค่า SSH tunnel ล้มเหลว; คำสั่งจึงถอยกลับไปใช้ direct probes
- `multiple_gateways`: มีเป้าหมายที่เข้าถึงได้มากกว่าหนึ่งรายการ; สถานการณ์นี้ไม่ปกติ เว้นแต่คุณตั้งใจรัน profiles แบบแยก เช่น rescue bot
- `auth_secretref_unresolved`: ไม่สามารถ resolve auth SecretRef ที่กำหนดค่าไว้สำหรับเป้าหมายที่ล้มเหลวได้
- `probe_scope_limited`: การเชื่อมต่อ WebSocket สำเร็จ แต่ read probe ถูกจำกัดเพราะไม่มี `operator.read`

#### Remote ผ่าน SSH (เทียบเท่าแอป Mac)

โหมด “Remote over SSH” ของแอป macOS ใช้การส่งต่อพอร์ตในเครื่องเพื่อให้ remote gateway (ซึ่งอาจ bind อยู่กับ loopback เท่านั้น) สามารถเข้าถึงได้ที่ `ws://127.0.0.1:<port>`

CLI ที่เทียบเท่า:

```bash
openclaw gateway probe --ssh user@gateway-host
```

ตัวเลือก:

- `--ssh <target>`: `user@host` หรือ `user@host:port` (พอร์ตค่าเริ่มต้นคือ `22`)
- `--ssh-identity <path>`: ไฟล์ identity
- `--ssh-auto`: เลือกโฮสต์ gateway ตัวแรกที่ค้นพบเป็นเป้าหมาย SSH จาก endpoint การค้นหาที่ resolve แล้ว (`local.` รวมถึงโดเมนแบบวงกว้างที่กำหนดค่าไว้ หากมี) ระบบจะไม่สนใจคำใบ้ที่มีเฉพาะ TXT

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

- `--params <json>`: สตริง JSON object สำหรับ params (ค่าเริ่มต้น `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

หมายเหตุ:

- `--params` ต้องเป็น JSON ที่ถูกต้อง
- `--expect-final` ใช้หลัก ๆ สำหรับ RPC แบบ agent ที่สตรีม event ขั้นกลางก่อนส่ง payload สุดท้าย

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
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `gateway install` จะตรวจสอบว่า SecretRef นั้น resolve ได้ แต่จะไม่คง token ที่ resolve แล้วไว้ใน metadata ของ environment สำหรับบริการ
- หาก token auth ต้องใช้ token และ token SecretRef ที่กำหนดค่าไว้ไม่สามารถ resolve ได้ การติดตั้งจะล้มเหลวแบบปิดไว้ก่อน แทนที่จะคง fallback plaintext
- สำหรับ password auth บน `gateway run` ให้ใช้ `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` หรือ `gateway.auth.password` ที่อิง SecretRef แทนการใช้ `--password` แบบใส่ตรง ๆ
- ในโหมด auth ที่อนุมานได้ `OPENCLAW_GATEWAY_PASSWORD` ที่มีเฉพาะใน shell จะไม่ผ่อนคลายข้อกำหนด token สำหรับการติดตั้ง; ให้ใช้ config แบบคงทน (`gateway.auth.password` หรือ config `env`) เมื่อติดตั้งบริการที่มีการจัดการ
- หากมีการกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` แต่ไม่ได้ตั้งค่า `gateway.auth.mode` การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่าโหมดอย่างชัดเจน
- คำสั่งวงจรชีวิตรองรับ `--json` สำหรับการเขียนสคริปต์

## ค้นหา gateways (Bonjour)

`gateway discover` สแกนหา beacon ของ Gateway (`_openclaw-gw._tcp`)

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): เลือกโดเมนหนึ่งโดเมน (ตัวอย่าง: `openclaw.internal.`) และตั้งค่า split DNS + เซิร์ฟเวอร์ DNS; ดู [/gateway/bonjour](/th/gateway/bonjour)

มีเฉพาะ gateways ที่เปิดใช้งานการค้นหา Bonjour เท่านั้น (ค่าเริ่มต้นคือเปิด) ที่จะโฆษณา beacon

ระเบียนการค้นหาแบบ Wide-Area ประกอบด้วย (TXT):

- `role` (คำใบ้เกี่ยวกับบทบาทของ gateway)
- `transport` (คำใบ้เกี่ยวกับการขนส่ง เช่น `gateway`)
- `gatewayPort` (พอร์ต WebSocket โดยปกติคือ `18789`)
- `sshPort` (ไม่บังคับ; ไคลเอนต์จะใช้ค่าเริ่มต้นของเป้าหมาย SSH เป็น `22` เมื่อไม่มีค่านี้)
- `tailnetDns` (ชื่อโฮสต์ MagicDNS เมื่อมี)
- `gatewayTls` / `gatewayTlsSha256` (เปิดใช้ TLS + ลายนิ้วมือใบรับรอง)
- `cliPath` (คำใบ้สำหรับการติดตั้งระยะไกลที่เขียนลงในโซนแบบ wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

ตัวเลือก:

- `--timeout <ms>`: timeout ต่อคำสั่ง (browse/resolve); ค่าเริ่มต้น `2000`
- `--json`: เอาต์พุตที่เครื่องอ่านได้ (และปิด styling/spinner ด้วย)

ตัวอย่าง:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

หมายเหตุ:

- CLI จะสแกน `local.` รวมถึงโดเมนแบบวงกว้างที่กำหนดค่าไว้เมื่อมีการเปิดใช้งาน
- `wsUrl` ในเอาต์พุต JSON ได้มาจาก endpoint ของบริการที่ resolve แล้ว ไม่ได้มาจากคำใบ้ที่มีเฉพาะ TXT เช่น `lanHost` หรือ `tailnetDns`
- บน `local.` mDNS, `sshPort` และ `cliPath` จะถูกประกาศเฉพาะเมื่อ `discovery.mdns.mode` เป็น `full` เท่านั้น ส่วน Wide-Area DNS-SD จะยังคงเขียน `cliPath`; และ `sshPort` ก็ยังคงเป็นค่าที่ไม่บังคับเช่นกัน
