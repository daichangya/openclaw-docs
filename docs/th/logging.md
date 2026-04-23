---
read_when:
    - คุณต้องการภาพรวมของ logging ที่เป็นมิตรกับผู้เริ่มต้น
    - คุณต้องการกำหนดค่าระดับหรือรูปแบบของ log
    - คุณกำลังแก้ไขปัญหาและต้องการหา log ให้เจออย่างรวดเร็ว
summary: 'ภาพรวมของ Logging: log ไฟล์ เอาต์พุตคอนโซล การ tail ผ่าน CLI และ Control UI'
title: ภาพรวม Logging
x-i18n:
    generated_at: "2026-04-23T05:42:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw มีพื้นผิว log หลักสองแบบ:

- **log ไฟล์** (JSON lines) ที่เขียนโดย Gateway
- **เอาต์พุตคอนโซล** ที่แสดงในเทอร์มินัลและ Gateway Debug UI

แท็บ **Logs** ใน Control UI จะ tail log ไฟล์ของ gateway หน้านี้อธิบายว่า
log อยู่ที่ไหน อ่านอย่างไร และกำหนดค่าระดับกับรูปแบบของ log อย่างไร

## ตำแหน่งที่เก็บ log

โดยค่าเริ่มต้น Gateway จะเขียน rolling log file ไว้ที่:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

วันที่จะใช้ timezone ท้องถิ่นของโฮสต์ gateway

คุณสามารถแทนที่ค่านี้ได้ใน `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## วิธีอ่าน log

### CLI: tail แบบสด (แนะนำ)

ใช้ CLI เพื่อ tail log file ของ gateway ผ่าน RPC:

```bash
openclaw logs --follow
```

ตัวเลือกที่มีประโยชน์ในปัจจุบัน:

- `--local-time`: แสดง timestamp ใน timezone ท้องถิ่นของคุณ
- `--url <url>` / `--token <token>` / `--timeout <ms>`: แฟล็ก Gateway RPC มาตรฐาน
- `--expect-final`: แฟล็กรอการตอบกลับสุดท้ายของ RPC แบบใช้ agent (รองรับที่นี่ผ่าน shared client layer)

โหมดเอาต์พุต:

- **เซสชัน TTY**: บรรทัด log แบบสวย มีสี และมีโครงสร้าง
- **เซสชัน non-TTY**: ข้อความธรรมดา
- `--json`: JSON แบบแยกบรรทัด (หนึ่ง log event ต่อหนึ่งบรรทัด)
- `--plain`: บังคับใช้ข้อความธรรมดาในเซสชัน TTY
- `--no-color`: ปิด ANSI colors

เมื่อคุณส่ง `--url` แบบ explicit, CLI จะไม่ใช้ข้อมูลรับรองจาก config หรือ
environment โดยอัตโนมัติ; ให้ใส่ `--token` เองหาก Gateway เป้าหมาย
ต้องใช้ auth

ในโหมด JSON, CLI จะส่งออกออบเจ็กต์ที่ติดแท็ก `type`:

- `meta`: metadata ของสตรีม (ไฟล์, cursor, ขนาด)
- `log`: รายการ log ที่ parse แล้ว
- `notice`: คำแนะนำเรื่อง truncation / rotation
- `raw`: บรรทัด log ที่ยังไม่ได้ parse

หาก Gateway loopback ในเครื่องขอ pairing, `openclaw logs` จะ fallback ไปใช้
log file ในเครื่องที่กำหนดค่าไว้โดยอัตโนมัติ แต่เป้าหมาย `--url` แบบ explicit จะไม่ใช้ fallback นี้

หากเข้าถึง Gateway ไม่ได้ CLI จะแสดงคำแนะนำสั้น ๆ ให้รัน:

```bash
openclaw doctor
```

### Control UI (เว็บ)

แท็บ **Logs** ของ Control UI จะ tail ไฟล์เดียวกันผ่าน `logs.tail`
ดู [/web/control-ui](/web/control-ui) สำหรับวิธีเปิดใช้งาน

### log เฉพาะแชนเนล

หากต้องการกรองกิจกรรมของแชนเนล (WhatsApp/Telegram/etc) ให้ใช้:

```bash
openclaw channels logs --channel whatsapp
```

## รูปแบบของ log

### log ไฟล์ (JSONL)

แต่ละบรรทัดใน log file เป็นออบเจ็กต์ JSON โดย CLI และ Control UI จะ parse
รายการเหล่านี้เพื่อแสดงเอาต์พุตแบบมีโครงสร้าง (เวลา, ระดับ, subsystem, ข้อความ)

### เอาต์พุตคอนโซล

log คอนโซล **รับรู้ TTY** และจัดรูปแบบเพื่อให้อ่านง่าย:

- คำนำหน้า subsystem (เช่น `gateway/channels/whatsapp`)
- การลงสีตามระดับ (info/warn/error)
- โหมด compact หรือ JSON แบบทางเลือก

การจัดรูปแบบคอนโซลควบคุมโดย `logging.consoleStyle`

### log ของ Gateway WebSocket

`openclaw gateway` ยังมีการทำ log ของโปรโตคอล WebSocket สำหรับทราฟฟิก RPC:

- โหมดปกติ: แสดงเฉพาะผลลัพธ์ที่น่าสนใจ (ข้อผิดพลาด, parse error, คอลที่ช้า)
- `--verbose`: ทราฟฟิก request/response ทั้งหมด
- `--ws-log auto|compact|full`: เลือกรูปแบบการแสดงผลแบบ verbose
- `--compact`: alias ของ `--ws-log compact`

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

### ระดับของ log

- `logging.level`: ระดับของ **log ไฟล์** (JSONL)
- `logging.consoleLevel`: ระดับความละเอียดของ **คอนโซล**

คุณสามารถแทนที่ทั้งสองค่าได้ผ่านตัวแปร environment **`OPENCLAW_LOG_LEVEL`** (เช่น `OPENCLAW_LOG_LEVEL=debug`) ตัวแปร env นี้มีลำดับความสำคัญเหนือ config file ดังนั้นคุณจึงเพิ่ม verbosity สำหรับการรันครั้งเดียวได้โดยไม่ต้องแก้ `openclaw.json` คุณยังสามารถส่ง global CLI option **`--log-level <level>`** ได้ด้วย (เช่น `openclaw --log-level debug gateway run`) ซึ่งจะมีสิทธิ์เหนือกว่าตัวแปร environment สำหรับคำสั่งนั้น

`--verbose` มีผลเฉพาะกับเอาต์พุตคอนโซลและความละเอียดของ WS log; มันไม่ได้เปลี่ยน
ระดับของ file log

### สไตล์ของคอนโซล

`logging.consoleStyle`:

- `pretty`: อ่านง่ายสำหรับมนุษย์ มีสี และมี timestamp
- `compact`: เอาต์พุตกระชับกว่า (เหมาะกับเซสชันยาว)
- `json`: JSON ต่อบรรทัด (สำหรับตัวประมวลผล log)

### การปกปิดข้อมูล

สรุปของ tool สามารถปกปิด token ที่มีความละเอียดอ่อนได้ก่อนขึ้นคอนโซล:

- `logging.redactSensitive`: `off` | `tools` (ค่าเริ่มต้น: `tools`)
- `logging.redactPatterns`: รายการสตริง regex เพื่อแทนที่ชุดค่าเริ่มต้น

การปกปิดข้อมูลมีผลกับ **เอาต์พุตคอนโซลเท่านั้น** และไม่เปลี่ยนแปลง file log

## Diagnostics + OpenTelemetry

Diagnostics คือ event แบบมีโครงสร้างที่เครื่องอ่านได้สำหรับการรันโมเดล **และ**
telemetry ของ message-flow (webhooks, queueing, สถานะเซสชัน) มัน **ไม่ได้**
มาแทนที่ log; มันมีไว้เพื่อป้อน metrics, traces และ exporter อื่น ๆ

Diagnostics event จะถูกปล่อยจากในโปรเซส แต่ exporter จะถูกผูกเข้ามาเฉพาะเมื่อ
เปิดใช้งาน diagnostics + exporter plugin แล้วเท่านั้น

### OpenTelemetry เทียบกับ OTLP

- **OpenTelemetry (OTel)**: data model + SDK สำหรับ traces, metrics และ logs
- **OTLP**: wire protocol ที่ใช้ส่งออกข้อมูล OTel ไปยัง collector/backend
- ปัจจุบัน OpenClaw ส่งออกผ่าน **OTLP/HTTP (protobuf)**

### สัญญาณที่ส่งออก

- **Metrics**: counters + histograms (การใช้โทเค็น, message flow, queueing)
- **Traces**: spans สำหรับการใช้งานโมเดล + การประมวลผล webhook/message
- **Logs**: ส่งออกผ่าน OTLP เมื่อเปิด `diagnostics.otel.logs` ปริมาณ log
  อาจสูง; ควรคำนึงถึง `logging.level` และตัวกรองของ exporter

### แค็ตตาล็อกของ diagnostic event

การใช้งานโมเดล:

- `model.usage`: โทเค็น, ค่าใช้จ่าย, ระยะเวลา, context, provider/model/channel, session ids

Message flow:

- `webhook.received`: webhook ingress ต่อแชนเนล
- `webhook.processed`: webhook ถูกจัดการ + ระยะเวลา
- `webhook.error`: ข้อผิดพลาดของตัวจัดการ webhook
- `message.queued`: ข้อความถูกเข้าคิวเพื่อประมวลผล
- `message.processed`: ผลลัพธ์ + ระยะเวลา + ข้อผิดพลาดแบบทางเลือก

Queue + session:

- `queue.lane.enqueue`: enqueue ของ command queue lane + ความลึก
- `queue.lane.dequeue`: dequeue ของ command queue lane + เวลารอ
- `session.state`: การเปลี่ยนสถานะของเซสชัน + เหตุผล
- `session.stuck`: คำเตือนว่าเซสชันค้าง + อายุ
- `run.attempt`: metadata ของการ retry/attempt
- `diagnostic.heartbeat`: ตัวนับรวม (webhooks/queue/session)

### เปิดใช้ diagnostics (ไม่มี exporter)

ใช้วิธีนี้หากคุณต้องการให้ diagnostics event พร้อมใช้งานสำหรับ plugin หรือ sink แบบกำหนดเอง:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### แฟล็กของ Diagnostics (log แบบเจาะจง)

ใช้แฟล็กเพื่อเปิด log debug แบบเจาะจงเพิ่มเติมโดยไม่ต้องเพิ่ม `logging.level`
แฟล็กไม่สนตัวพิมพ์เล็ก-ใหญ่และรองรับ wildcard (เช่น `telegram.*` หรือ `*`)

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

แทนที่ผ่าน env (ใช้ครั้งเดียว):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

หมายเหตุ:

- flag log จะไปยัง log file มาตรฐาน (ตัวเดียวกับ `logging.file`)
- เอาต์พุตยังคงถูกปกปิดตาม `logging.redactSensitive`
- คู่มือแบบเต็ม: [/diagnostics/flags](/th/diagnostics/flags)

### ส่งออกไปยัง OpenTelemetry

สามารถส่งออก diagnostics ผ่าน plugin `diagnostics-otel` (OTLP/HTTP) ได้ วิธีนี้
ทำงานกับ OpenTelemetry collector/backend ใดก็ได้ที่รับ OTLP/HTTP

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

- คุณยังสามารถเปิดใช้ plugin ด้วย `openclaw plugins enable diagnostics-otel`
- ปัจจุบัน `protocol` รองรับเฉพาะ `http/protobuf` เท่านั้น ส่วน `grpc` จะถูกละเว้น
- metrics รวมถึงการใช้โทเค็น, ค่าใช้จ่าย, ขนาด context, ระยะเวลาการรัน และ
  counters/histograms ของ message-flow (webhooks, queueing, สถานะเซสชัน, ความลึก/เวลารอของคิว)
- traces/metrics สามารถเปิดหรือปิดได้ด้วย `traces` / `metrics` (ค่าเริ่มต้น: เปิด) โดย traces
  จะรวม span ของการใช้งานโมเดล และ span ของการประมวลผล webhook/message เมื่อเปิดใช้งาน
- ตั้ง `headers` เมื่อ collector ของคุณต้องใช้ auth
- ตัวแปร environment ที่รองรับ: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`

### Metrics ที่ส่งออก (ชื่อ + ประเภท)

การใช้งานโมเดล:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Message flow:

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

Queues + sessions:

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

- Trace sampling: `diagnostics.otel.sampleRate` (0.0–1.0, เฉพาะ root span)
- Metric export interval: `diagnostics.otel.flushIntervalMs` (ขั้นต่ำ 1000ms)

### หมายเหตุเกี่ยวกับโปรโตคอล

- endpoint แบบ OTLP/HTTP สามารถตั้งได้ผ่าน `diagnostics.otel.endpoint` หรือ
  `OTEL_EXPORTER_OTLP_ENDPOINT`
- หาก endpoint มี `/v1/traces` หรือ `/v1/metrics` อยู่แล้ว จะใช้งานตามนั้น
- หาก endpoint มี `/v1/logs` อยู่แล้ว จะใช้งานตามนั้นสำหรับ logs
- `diagnostics.otel.logs` เปิดใช้การส่งออก OTLP log สำหรับเอาต์พุตของ main logger

### พฤติกรรมการส่งออก log

- OTLP logs ใช้ record แบบมีโครงสร้างเดียวกับที่เขียนลง `logging.file`
- เคารพ `logging.level` (ระดับของ file log) การปกปิดข้อมูลบนคอนโซลจะ **ไม่มีผล**
  กับ OTLP logs
- การติดตั้งที่มีปริมาณสูงควรใช้ sampling/filtering ที่ collector ฝั่ง OTLP

## เคล็ดลับการแก้ไขปัญหา

- **เข้าถึง Gateway ไม่ได้?** ให้รัน `openclaw doctor` ก่อน
- **log ว่างเปล่า?** ตรวจสอบว่า Gateway กำลังทำงานและเขียนไปยังพาธไฟล์
  ใน `logging.file`
- **ต้องการรายละเอียดมากขึ้น?** ตั้ง `logging.level` เป็น `debug` หรือ `trace` แล้วลองใหม่

## ที่เกี่ยวข้อง

- [Gateway Logging Internals](/th/gateway/logging) — สไตล์ WS log, คำนำหน้า subsystem และการจับคอนโซล
- [Diagnostics](/th/gateway/configuration-reference#diagnostics) — การส่งออก OpenTelemetry และ config ของ cache trace
