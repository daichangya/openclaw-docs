---
read_when:
    - You need a beginner-friendly overview of logging
    - คุณต้องการกำหนดค่าระดับหรือรูปแบบของ log
    - คุณกำลังแก้ไขปัญหาและต้องการค้นหา log อย่างรวดเร็ว
summary: 'ภาพรวม Logging: ไฟล์ log เอาต์พุตคอนโซล การ tail ผ่าน CLI และ Control UI'
title: ภาพรวม Logging
x-i18n:
    generated_at: "2026-04-24T09:19:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw มีพื้นผิว log หลักอยู่สองแบบ:

- **ไฟล์ log** (JSON lines) ที่เขียนโดย Gateway
- **เอาต์พุตคอนโซล** ที่แสดงในเทอร์มินัลและ Gateway Debug UI

แท็บ **Logs** ใน Control UI จะ tail ไฟล์ log ของ gateway หน้านี้อธิบายว่า
log อยู่ที่ไหน วิธีอ่าน และวิธีกำหนดค่าระดับและรูปแบบของ log

## ตำแหน่งของ log

โดยค่าเริ่มต้น Gateway จะเขียนไฟล์ log แบบหมุนเวียนไว้ที่:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

วันที่จะใช้เขตเวลาท้องถิ่นของโฮสต์ gateway

คุณสามารถ override ได้ใน `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## วิธีอ่าน log

### CLI: tail แบบสด (แนะนำ)

ใช้ CLI เพื่อ tail ไฟล์ log ของ gateway ผ่าน RPC:

```bash
openclaw logs --follow
```

ตัวเลือกที่มีประโยชน์ในปัจจุบัน:

- `--local-time`: แสดง timestamp ในเขตเวลาท้องถิ่นของคุณ
- `--url <url>` / `--token <token>` / `--timeout <ms>`: แฟล็ก Gateway RPC มาตรฐาน
- `--expect-final`: แฟล็กรอ final-response สำหรับ RPC ที่ขับเคลื่อนโดยเอเจนต์ (ยอมรับที่นี่ผ่าน shared client layer)

โหมดเอาต์พุต:

- **เซสชัน TTY**: บรรทัด log แบบ pretty มีสี และมีโครงสร้าง
- **เซสชันที่ไม่ใช่ TTY**: ข้อความธรรมดา
- `--json`: JSON แบบคั่นทีละบรรทัด (หนึ่ง log event ต่อบรรทัด)
- `--plain`: บังคับใช้ข้อความธรรมดาในเซสชัน TTY
- `--no-color`: ปิด ANSI colors

เมื่อคุณส่ง `--url` แบบชัดเจน CLI จะไม่ใช้ข้อมูลรับรองจาก config หรือ
environment โดยอัตโนมัติ ให้ใส่ `--token` เองหาก Gateway ปลายทาง
ต้องใช้ auth

ในโหมด JSON CLI จะปล่อยออบเจ็กต์ที่มีแท็ก `type`:

- `meta`: เมทาดาทาของสตรีม (file, cursor, size)
- `log`: รายการ log ที่ parse แล้ว
- `notice`: คำใบ้เรื่อง truncation / rotation
- `raw`: บรรทัด log ที่ยังไม่ parse

หาก Gateway บน local loopback ขอการจับคู่ `openclaw logs` จะ fallback ไปยัง
ไฟล์ log ในเครื่องที่กำหนดค่าไว้โดยอัตโนมัติ เป้าหมาย `--url` แบบชัดเจนจะไม่ใช้ fallback นี้

หาก Gateway เข้าถึงไม่ได้ CLI จะพิมพ์คำแนะนำสั้น ๆ ให้รัน:

```bash
openclaw doctor
```

### Control UI (เว็บ)

แท็บ **Logs** ของ Control UI จะ tail ไฟล์เดียวกันโดยใช้ `logs.tail`
ดู [/web/control-ui](/th/web/control-ui) สำหรับวิธีเปิดใช้งาน

### log เฉพาะช่องทาง

หากต้องการกรองกิจกรรมของช่องทาง (WhatsApp/Telegram/ฯลฯ) ให้ใช้:

```bash
openclaw channels logs --channel whatsapp
```

## รูปแบบ log

### ไฟล์ log (JSONL)

แต่ละบรรทัดในไฟล์ log เป็นออบเจ็กต์ JSON CLI และ Control UI จะ parse
รายการเหล่านี้เพื่อแสดงผลแบบมีโครงสร้าง (เวลา ระดับ ระบบย่อย ข้อความ)

### เอาต์พุตคอนโซล

log คอนโซลเป็นแบบ **รับรู้ TTY** และจัดรูปแบบเพื่อให้อ่านง่าย:

- คำนำหน้าระบบย่อย (เช่น `gateway/channels/whatsapp`)
- การใช้สีตามระดับ (info/warn/error)
- โหมด compact หรือ JSON แบบไม่บังคับ

การจัดรูปแบบคอนโซลควบคุมโดย `logging.consoleStyle`

### log WebSocket ของ Gateway

`openclaw gateway` ยังมีการ logging ระดับโปรโตคอล WebSocket สำหรับทราฟฟิก RPC:

- โหมดปกติ: แสดงเฉพาะผลลัพธ์ที่น่าสนใจ (errors, parse errors, slow calls)
- `--verbose`: แสดงทราฟฟิก request/response ทั้งหมด
- `--ws-log auto|compact|full`: เลือกรูปแบบการแสดงผลในโหมด verbose
- `--compact`: ชื่อเรียกแทนของ `--ws-log compact`

ตัวอย่าง:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## การกำหนดค่า logging

การกำหนดค่า logging ทั้งหมดอยู่ภายใต้ `logging` ใน `~/.openclaw/openclaw.json`

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### ระดับ log

- `logging.level`: ระดับของ **ไฟล์ log** (JSONL)
- `logging.consoleLevel`: ระดับความละเอียดของ **คอนโซล**

คุณสามารถ override ทั้งสองค่าผ่านตัวแปร environment **`OPENCLAW_LOG_LEVEL`** (เช่น `OPENCLAW_LOG_LEVEL=debug`) ตัวแปร env นี้มีลำดับความสำคัญเหนือไฟล์ config ดังนั้นคุณจึงเพิ่มความละเอียดสำหรับการรันครั้งเดียวได้โดยไม่ต้องแก้ `openclaw.json` คุณยังสามารถส่งตัวเลือก CLI แบบโกลบอล **`--log-level <level>`** ได้ (เช่น `openclaw --log-level debug gateway run`) ซึ่งจะ override ตัวแปร environment สำหรับคำสั่งนั้น

`--verbose` มีผลเฉพาะกับเอาต์พุตคอนโซลและความละเอียดของ WS log; มันไม่เปลี่ยน
ระดับของไฟล์ log

### รูปแบบคอนโซล

`logging.consoleStyle`:

- `pretty`: เป็นมิตรกับมนุษย์ มีสี และมี timestamp
- `compact`: เอาต์พุตกระชับกว่า (เหมาะที่สุดสำหรับเซสชันยาว)
- `json`: JSON ต่อบรรทัด (สำหรับตัวประมวลผล log)

### การปกปิดข้อมูล

สรุปของเครื่องมือสามารถปกปิดโทเค็นที่ละเอียดอ่อนได้ก่อนจะไปถึงคอนโซล:

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: รายการของสตริง regex เพื่อ override ชุดค่าเริ่มต้น

การปกปิดข้อมูลมีผลเฉพาะกับ **เอาต์พุตคอนโซล** และไม่เปลี่ยนแปลงไฟล์ log

## Diagnostics + OpenTelemetry

Diagnostics คืออีเวนต์แบบมีโครงสร้างที่เครื่องอ่านได้สำหรับการรันโมเดล **และ**
telemetry ของการไหลของข้อความ (webhooks, queueing, สถานะเซสชัน) มัน **ไม่ได้**
มาแทนที่ log; มันมีไว้เพื่อป้อนข้อมูลให้ metrics, traces และ exporters อื่น ๆ

อีเวนต์ diagnostics จะถูกปล่อยในโปรเซส แต่ exporters จะถูกแนบก็ต่อเมื่อ
เปิดใช้ diagnostics + exporter plugin แล้วเท่านั้น

### OpenTelemetry กับ OTLP

- **OpenTelemetry (OTel)**: data model + SDKs สำหรับ traces, metrics และ logs
- **OTLP**: wire protocol ที่ใช้ส่งออกข้อมูล OTel ไปยัง collector/backend
- ปัจจุบัน OpenClaw ส่งออกผ่าน **OTLP/HTTP (protobuf)**

### สัญญาณที่ส่งออก

- **Metrics**: counters + histograms (การใช้โทเค็น การไหลของข้อความ queueing)
- **Traces**: spans สำหรับการใช้โมเดล + การประมวลผล webhook/message
- **Logs**: ส่งออกผ่าน OTLP เมื่อเปิดใช้ `diagnostics.otel.logs` ปริมาณ log
  อาจสูง; ให้คำนึงถึง `logging.level` และตัวกรองของ exporter

### แค็ตตาล็อกอีเวนต์ diagnostics

การใช้โมเดล:

- `model.usage`: โทเค็น ค่าใช้จ่าย ระยะเวลา บริบท provider/model/channel session ids

การไหลของข้อความ:

- `webhook.received`: webhook ingress ต่อช่องทาง
- `webhook.processed`: webhook ที่ถูกจัดการ + ระยะเวลา
- `webhook.error`: ข้อผิดพลาดของตัวจัดการ webhook
- `message.queued`: ข้อความถูกใส่คิวสำหรับการประมวลผล
- `message.processed`: ผลลัพธ์ + ระยะเวลา + ข้อผิดพลาดแบบไม่บังคับ

คิว + เซสชัน:

- `queue.lane.enqueue`: enqueue ใน lane ของ command queue + depth
- `queue.lane.dequeue`: dequeue ใน lane ของ command queue + เวลารอ
- `session.state`: การเปลี่ยนสถานะเซสชัน + เหตุผล
- `session.stuck`: คำเตือนว่าเซสชันค้าง + อายุ
- `run.attempt`: เมทาดาทาของการลองใหม่/ความพยายาม
- `diagnostic.heartbeat`: ตัวนับรวม (webhooks/queue/session)

### เปิดใช้ diagnostics (ไม่มี exporter)

ใช้สิ่งนี้หากคุณต้องการให้อีเวนต์ diagnostics พร้อมใช้งานสำหรับ plugins หรือ sinks แบบกำหนดเอง:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### แฟล็ก diagnostics (log แบบเจาะจง)

ใช้แฟล็กเพื่อเปิด log ดีบักเพิ่มเติมแบบเจาะจงโดยไม่ต้องเพิ่ม `logging.level`
แฟล็กไม่สนตัวพิมพ์เล็กใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ `*`)

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Env override (ใช้ครั้งเดียว):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

หมายเหตุ:

- log จากแฟล็กจะไปยังไฟล์ log มาตรฐาน (ไฟล์เดียวกับ `logging.file`)
- เอาต์พุตยังคงถูกปกปิดข้อมูลตาม `logging.redactSensitive`
- คู่มือฉบับเต็ม: [/diagnostics/flags](/th/diagnostics/flags)

### ส่งออกไปยัง OpenTelemetry

Diagnostics สามารถส่งออกผ่าน plugin `diagnostics-otel` (OTLP/HTTP) ได้ ซึ่ง
ทำงานกับ OpenTelemetry collector/backend ใดก็ได้ที่รองรับ OTLP/HTTP

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

หมายเหตุ:

- คุณสามารถเปิดใช้ plugin นี้ได้ด้วย `openclaw plugins enable diagnostics-otel`
- ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น `grpc` จะถูกเพิกเฉย
- Metrics รวมถึงการใช้โทเค็น ค่าใช้จ่าย ขนาดบริบท ระยะเวลาการรัน และตัวนับ/ฮิสโตแกรมของการไหลของข้อความ (webhooks, queueing, สถานะเซสชัน, queue depth/wait)
- Traces/metrics สามารถเปิดหรือปิดได้ด้วย `traces` / `metrics` (ค่าเริ่มต้น: เปิด) Traces
  รวมถึง spans ของการใช้โมเดลและ spans ของการประมวลผล webhook/message เมื่อเปิดใช้
- ตั้งค่า `headers` เมื่อ collector ของคุณต้องใช้ auth
- ตัวแปร environment ที่รองรับ: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`

### Metrics ที่ส่งออก (ชื่อ + ชนิด)

การใช้โมเดล:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

การไหลของข้อความ:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`)

คิว + เซสชัน:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` หรือ
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### Spans ที่ส่งออก (ชื่อ + key attributes)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flushing

- Trace sampling: `diagnostics.otel.sampleRate` (0.0–1.0, เฉพาะ root spans)
- ช่วงเวลาส่งออก metric: `diagnostics.otel.flushIntervalMs` (ต่ำสุด 1000ms)

### หมายเหตุเกี่ยวกับโปรโตคอล

- สามารถตั้งค่า endpoint ของ OTLP/HTTP ได้ผ่าน `diagnostics.otel.endpoint` หรือ
  `OTEL_EXPORTER_OTLP_ENDPOINT`
- หาก endpoint มี `/v1/traces` หรือ `/v1/metrics` อยู่แล้ว จะใช้ตามนั้น
- หาก endpoint มี `/v1/logs` อยู่แล้ว จะใช้ตามนั้นสำหรับ logs
- `diagnostics.otel.logs` จะเปิดใช้การส่งออก OTLP log สำหรับเอาต์พุตของ logger หลัก

### พฤติกรรมการส่งออก log

- OTLP logs ใช้บันทึกที่มีโครงสร้างเดียวกับที่เขียนลง `logging.file`
- เคารพ `logging.level` (ระดับไฟล์ log) การปกปิดข้อมูลของคอนโซล **ไม่** มีผล
  ต่อ OTLP logs
- การติดตั้งที่มีปริมาณสูงควรใช้ sampling/filtering ที่ collector ของ OTLP

## เคล็ดลับการแก้ไขปัญหา

- **Gateway เข้าถึงไม่ได้หรือ?** รัน `openclaw doctor` ก่อน
- **log ว่างหรือ?** ตรวจสอบว่า Gateway กำลังทำงานและเขียนไปยังพาธไฟล์
  ใน `logging.file`
- **ต้องการรายละเอียดเพิ่มหรือ?** ตั้งค่า `logging.level` เป็น `debug` หรือ `trace` แล้วลองใหม่

## ที่เกี่ยวข้อง

- [รายละเอียดภายในของ Gateway Logging](/th/gateway/logging) — รูปแบบ WS log, คำนำหน้าระบบย่อย และการจับเอาต์พุตคอนโซล
- [Diagnostics](/th/gateway/configuration-reference#diagnostics) — การส่งออก OpenTelemetry และ config ของ cache trace
