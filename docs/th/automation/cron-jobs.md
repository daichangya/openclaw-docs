---
read_when:
    - การตั้งเวลางานเบื้องหลังหรือการปลุกให้ทำงาน
    - การเชื่อมต่อทริกเกอร์ภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานที่ตั้งเวลาไว้
summary: งานที่ตั้งเวลาไว้, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดตารางเวลา Gateway
title: งานที่ตั้งเวลาไว้
x-i18n:
    generated_at: "2026-04-24T08:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# งานที่ตั้งเวลาไว้ (Cron)

Cron คือตัวจัดตารางเวลาที่มีมาในตัวของ Gateway โดยจะเก็บงานแบบถาวร ปลุกเอเจนต์ในเวลาที่ถูกต้อง และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือปลายทาง Webhook ได้

## เริ่มต้นอย่างรวดเร็ว

```bash
# เพิ่มการเตือนแบบครั้งเดียว
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# ตรวจสอบงานของคุณ
openclaw cron list
openclaw cron show <job-id>

# ดูประวัติการรัน
openclaw cron runs --id <job-id>
```

## วิธีการทำงานของ cron

- Cron ทำงาน **ภายใน** โพรเซส Gateway (ไม่ได้ทำงานภายในโมเดล)
- นิยามของงานจะถูกเก็บถาวรไว้ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาหายไป
- สถานะการทำงานขณะรันจะถูกเก็บถาวรไว้ข้างกันใน `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และเพิ่ม `jobs-state.json` ลงใน gitignore
- หลังจากการแยกไฟล์ เวอร์ชัน OpenClaw ที่เก่ากว่ายังสามารถอ่าน `jobs.json` ได้ แต่บางครั้งอาจมองว่างานเป็นงานใหม่ เพราะฟิลด์สถานะขณะรันย้ายไปอยู่ใน `jobs-state.json` แล้ว
- การรัน cron ทั้งหมดจะสร้างเรคคอร์ด [งานเบื้องหลัง](/th/automation/tasks)
- งานแบบครั้งเดียว (`--at`) จะถูกลบอัตโนมัติหลังจากสำเร็จเป็นค่าปริยาย
- การรัน cron แบบ isolated จะพยายามปิดแท็บเบราว์เซอร์/โพรเซสที่ติดตามไว้สำหรับเซสชัน `cron:<jobId>` เมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์ที่แยกทำงานทิ้งโพรเซสกำพร้าไว้
- การรัน cron แบบ isolated ยังป้องกันการตอบยืนยันที่ค้างอยู่ด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความแนวเดียวกัน) และไม่มีการรันของซับเอเจนต์ลูกหลานใดยังรับผิดชอบคำตอบสุดท้ายอยู่ OpenClaw จะ re-prompt อีกครั้งหนึ่งเพื่อขอผลลัพธ์จริงก่อนส่งต่อ

<a id="maintenance"></a>

การกระทบยอดงานสำหรับ cron เป็นความรับผิดชอบของรันไทม์: งาน cron ที่ยังทำงานอยู่จะยังคงมีสถานะใช้งานตราบใดที่รันไทม์ของ cron ยังติดตามว่างานนั้นกำลังรันอยู่ แม้ว่าจะยังมีแถวเซสชันลูกเก่าคงอยู่ก็ตาม เมื่อรันไทม์หยุดเป็นเจ้าของงานแล้วและหน้าต่างผ่อนผัน 5 นาทีหมดลง การบำรุงรักษาสามารถทำเครื่องหมายงานเป็น `lost` ได้

## ประเภทของตารางเวลา

| ประเภท    | แฟล็ก CLI | คำอธิบาย                                                |
| --------- | --------- | ------------------------------------------------------- |
| `at`      | `--at`    | เวลาแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`) |
| `every`   | `--every` | ช่วงเวลาคงที่                                            |
| `cron`    | `--cron`  | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` แบบเลือกได้ |

เวลาที่ระบุโดยไม่มีเขตเวลาจะถือว่าเป็น UTC เพิ่ม `--tz America/New_York` สำหรับการตั้งเวลาตามเวลาท้องถิ่น

นิพจน์แบบวนซ้ำที่ตรงต้นชั่วโมงจะถูกหน่วงเวลาแบบสุ่มโดยอัตโนมัติสูงสุด 5 นาที เพื่อลดสไปก์ของโหลด ใช้ `--exact` เพื่อบังคับเวลาให้ตรงเป๊ะ หรือใช้ `--stagger 30s` เพื่อกำหนดช่วงเวลาชัดเจน

### Day-of-month และ day-of-week ใช้ตรรกะแบบ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์ day-of-month และ day-of-week ไม่ใช่ wildcard, croner จะถือว่าตรงกันเมื่อ **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ทั้งคู่ นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# ตั้งใจ: "9 AM ของวันที่ 15 เฉพาะเมื่อวันนั้นเป็นวันจันทร์"
# ผลจริง: "9 AM ของทุกวันที่ 15 และ 9 AM ของทุกวันจันทร์"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5–6 ครั้งต่อเดือน แทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR แบบค่าปริยายของ Croner ในจุดนี้ หากต้องการให้ทั้งสองเงื่อนไขต้องตรงกัน ให้ใช้ตัวปรับแต่ง day-of-week แบบ `+` ของ Croner (`0 9 15 * +1`) หรือตั้งเวลาตามฟิลด์หนึ่งแล้วตรวจอีกฟิลด์ในพรอมป์หรือตัวคำสั่งของงาน

## รูปแบบการรัน

| รูปแบบ         | ค่า `--session`      | รันใน                     | เหมาะสำหรับ                     |
| -------------- | -------------------- | ------------------------- | ------------------------------ |
| Main session   | `main`               | เทิร์น Heartbeat ถัดไป    | การเตือน, system event         |
| Isolated       | `isolated`           | `cron:<jobId>` เฉพาะ      | รายงาน, งานเบื้องหลัง          |
| Current session| `current`            | ผูกไว้ตอนสร้าง            | งานแบบวนซ้ำที่อิงบริบท         |
| Custom session | `session:custom-id`  | เซสชันแบบมีชื่อถาวร       | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

งาน **Main session** จะเข้าคิว system event และเลือกได้ว่าจะปลุก Heartbeat หรือไม่ (`--wake now` หรือ `--wake next-heartbeat`) งาน **Isolated** จะรันเทิร์นเอเจนต์เฉพาะพร้อมเซสชันใหม่ งาน **Custom sessions** (`session:xxx`) จะเก็บบริบทข้ามการรัน ทำให้รองรับเวิร์กโฟลว์อย่าง daily standup ที่ต่อยอดจากสรุปก่อนหน้าได้

สำหรับงาน isolated การ teardown ของรันไทม์ตอนนี้รวมการล้างข้อมูลเบราว์เซอร์สำหรับเซสชัน cron นั้นแบบ best-effort ด้วย ความล้มเหลวของการล้างข้อมูลจะถูกละเลย เพื่อให้ผลลัพธ์ cron จริงยังเป็นตัวชี้ขาด

การรัน cron แบบ isolated ยัง dispose อินสแตนซ์รันไทม์ MCP แบบ bundled ที่สร้างขึ้นสำหรับงานผ่านเส้นทาง runtime-cleanup ที่ใช้ร่วมกันด้วย ซึ่งสอดคล้องกับวิธี teardown ไคลเอนต์ MCP ของ main-session และ custom-session ดังนั้นงาน cron แบบ isolated จะไม่ทำให้เกิดการรั่วไหลของโพรเซสลูก stdio หรือการเชื่อมต่อ MCP ที่คงอยู่นานข้ามการรัน

เมื่อการรัน cron แบบ isolated ประสานงานซับเอเจนต์ การส่งต่อจะให้ความสำคัญกับผลลัพธ์สุดท้ายของลูกหลานมากกว่าข้อความชั่วคราวเก่าของพาเรนต์ด้วย หากลูกหลานยังรันอยู่ OpenClaw จะระงับการอัปเดตบางส่วนจากพาเรนต์นั้น แทนที่จะประกาศออกไป

### ตัวเลือก payload สำหรับงาน isolated

- `--message`: ข้อความพรอมป์ (จำเป็นสำหรับ isolated)
- `--model` / `--thinking`: override โมเดลและระดับการคิด
- `--light-context`: ข้ามการแทรกไฟล์ bootstrap ของ workspace
- `--tools exec,read`: จำกัดว่าอนุญาตให้งานใช้เครื่องมือใดบ้าง

`--model` จะใช้โมเดลที่ได้รับอนุญาตซึ่งถูกเลือกสำหรับงานนั้น หากโมเดลที่ร้องขอไม่ได้รับอนุญาต cron จะบันทึกคำเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าปริยายของงานแทน ลำดับ fallback ที่กำหนดไว้ยังคงมีผล แต่การ override โมเดลแบบธรรมดาที่ไม่มีรายการ fallback รายงานนั้นอย่างชัดเจนจะไม่ต่อท้ายโมเดลหลักของเอเจนต์เป็นเป้าหมาย retry เพิ่มเติมแบบซ่อนเร้นอีกต่อไป

ลำดับความสำคัญของการเลือกโมเดลสำหรับงาน isolated คือ:

1. การ override โมเดลของ Gmail hook (เมื่อการรันมาจาก Gmail และอนุญาตให้ใช้ override นั้น)
2. `model` ใน payload รายงาน
3. การ override โมเดลของเซสชัน cron ที่จัดเก็บไว้
4. การเลือกโมเดลของเอเจนต์/ค่าปริยาย

Fast mode จะอิงตามการเลือก live ที่ถูก resolve เช่นกัน หากการตั้งค่าโมเดลที่เลือกมี `params.fastMode` การรัน cron แบบ isolated จะใช้ค่านั้นเป็นค่าปริยาย การ override `fastMode` ของเซสชันที่จัดเก็บไว้ยังคงมีความสำคัญเหนือกว่าคอนฟิก ไม่ว่าจะเป็นการเปิดหรือปิด

หากการรัน isolated เจอ live model-switch handoff, cron จะ retry ด้วย provider/โมเดลที่สลับแล้ว และบันทึกการเลือก live นั้นไว้ก่อน retry เมื่อการสลับนั้นมี auth profile ใหม่มาด้วย cron จะบันทึกการ override auth profile นั้นด้วย จำนวนครั้ง retry มีขอบเขต: หลังจากพยายามครั้งแรกบวก retry จากการสลับอีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนไม่รู้จบ

## การส่งต่อและผลลัพธ์

| โหมด      | สิ่งที่เกิดขึ้น                                                     |
| --------- | ------------------------------------------------------------------- |
| `announce`| ส่งข้อความสุดท้ายไปยังเป้าหมายแบบ fallback หากเอเจนต์ไม่ได้ส่งเอง |
| `webhook` | POST payload ของเหตุการณ์ที่เสร็จสิ้นไปยัง URL                    |
| `none`    | ไม่มีการส่งต่อแบบ fallback จาก runner                              |

ใช้ `--announce --channel telegram --to "-1001234567890"` สำหรับการส่งไปยังช่องทาง สำหรับหัวข้อฟอรัมของ Telegram ให้ใช้ `-1001234567890:topic:123` เป้าหมายของ Slack/Discord/Mattermost ควรใช้ prefix แบบชัดเจน (`channel:<id>`, `user:<id>`)

สำหรับงาน isolated การส่งไปยังแชตเป็นแบบใช้ร่วมกัน หากมี chat route พร้อมใช้งาน เอเจนต์สามารถใช้เครื่องมือ `message` ได้แม้งานจะใช้ `--no-deliver` หากเอเจนต์ส่งไปยังเป้าหมายที่กำหนดค่าไว้/เป้าหมายปัจจุบัน OpenClaw จะข้ามการประกาศแบบ fallback มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังเทิร์นของเอเจนต์เท่านั้น

การแจ้งเตือนความล้มเหลวใช้ปลายทางอีกเส้นทางหนึ่งแยกต่างหาก:

- `cron.failureDestination` กำหนดค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` ใช้ override ค่านั้นเป็นรายงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่าง และงานส่งผ่าน `announce` อยู่แล้ว การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมาย announce หลักนั้นโดยอัตโนมัติ
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ว่าโหมดการส่งหลักจะเป็น `webhook`

## ตัวอย่าง CLI

การเตือนแบบครั้งเดียว (main session):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

งาน isolated แบบวนซ้ำพร้อมการส่งต่อ:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

งาน isolated พร้อมการ override โมเดลและระดับการคิด:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับทริกเกอร์ภายนอกได้ เปิดใช้งานในคอนฟิก:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### การยืนยันตัวตน

ทุกคำขอต้องส่ง hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

โทเค็นใน query string จะถูกปฏิเสธ

### POST /hooks/wake

เข้าคิว system event สำหรับ main session:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (จำเป็น): คำอธิบายเหตุการณ์
- `mode` (ไม่บังคับ): `now` (ค่าปริยาย) หรือ `next-heartbeat`

### POST /hooks/agent

รันเทิร์นเอเจนต์แบบ isolated:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`

### Mapped hooks (POST /hooks/\<name\>)

ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ในคอนฟิก Mappings สามารถแปลง payload ตามอำเภอใจให้เป็นแอ็กชัน `wake` หรือ `agent` โดยใช้เทมเพลตหรือโค้ดแปลงข้อมูลได้

### ความปลอดภัย

- ควรให้ปลายทาง hook อยู่หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้
- ใช้ hook token แยกเฉพาะ; อย่านำโทเค็นยืนยันตัวตนของ gateway มาใช้ซ้ำ
- ให้ `hooks.path` อยู่บน subpath เฉพาะ; ระบบจะปฏิเสธ `/`
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการ route ไปยัง `agentId` แบบระบุชัด
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณจำเป็นต้องให้ผู้เรียกเลือกเซสชันเอง
- หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้ง `hooks.allowedSessionKeyPrefixes` เพิ่มด้วย เพื่อจำกัดรูปแบบ session key ที่อนุญาต
- โดยค่าปริยาย payload ของ hook จะถูกห่อหุ้มด้วยขอบเขตความปลอดภัย

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

**ข้อกำหนดเบื้องต้น**: CLI `gcloud`, `gog` (gogcli), เปิดใช้งาน OpenClaw hooks แล้ว และใช้ Tailscale สำหรับปลายทาง HTTPS สาธารณะ

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียนคอนฟิก `hooks.gmail`, เปิดใช้งาน Gmail preset และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่ม Gateway อัตโนมัติ

เมื่อ `hooks.enabled=true` และตั้งค่า `hooks.gmail.account` ไว้ Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch ให้อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` หากต้องการปิดพฤติกรรมนี้

### การตั้งค่าด้วยตนเองแบบครั้งเดียว

1. เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ซึ่ง `gog` ใช้งาน:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. สร้าง topic และให้สิทธิ์ Gmail สำหรับ push:

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. เริ่ม watch:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### การ override โมเดลสำหรับ Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## การจัดการงาน

```bash
# แสดงรายการงานทั้งหมด
openclaw cron list

# แสดงงานหนึ่งรายการ รวมถึงเส้นทางการส่งที่ resolve แล้ว
openclaw cron show <jobId>

# แก้ไขงาน
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# บังคับรันงานทันที
openclaw cron run <jobId>

# รันเฉพาะเมื่อถึงกำหนด
openclaw cron run <jobId> --due

# ดูประวัติการรัน
openclaw cron runs --id <jobId> --limit 50

# ลบงาน
openclaw cron remove <jobId>

# การเลือกเอเจนต์ (สำหรับการตั้งค่าหลายเอเจนต์)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

หมายเหตุเกี่ยวกับการ override โมเดล:

- `openclaw cron add|edit --model ...` จะเปลี่ยนโมเดลที่เลือกของงาน
- หากโมเดลนั้นได้รับอนุญาต provider/model ที่ระบุตรงนั้นจะถูกส่งไปยังการรันเอเจนต์แบบ isolated โดยตรง
- หากไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าปริยายของงาน
- ลำดับ fallback ที่กำหนดไว้ยังคงมีผล แต่การ override แบบ `--model` ธรรมดาที่ไม่มีรายการ fallback ต่อ-job อย่างชัดเจน จะไม่ fallback ต่อไปยังโมเดลหลักของเอเจนต์ในฐานะเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ อีกต่อไป

## การกำหนดค่า

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

ไฟล์ sidecar สำหรับสถานะรันไทม์จะอิงจาก `cron.store`: ที่เก็บแบบ `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ขณะที่พาธที่เก็บซึ่งไม่มีนามสกุล `.json` จะเติม `-state.json` ต่อท้าย

ปิดใช้งาน cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

**การ retry สำหรับงานครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry ได้สูงสุด 3 ครั้งด้วย exponential backoff ส่วนข้อผิดพลาดถาวรจะถูกปิดใช้งานทันที

**การ retry สำหรับงานแบบวนซ้ำ**: ใช้ exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการ retry และ backoff จะถูกรีเซ็ตหลังการรันครั้งถัดไปที่สำเร็จ

**การบำรุงรักษา**: `cron.sessionRetention` (ค่าปริยาย `24h`) จะลบรายการ run-session ของงาน isolated ที่หมดอายุ `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะตัดแต่งไฟล์ run-log อัตโนมัติ

## การแก้ปัญหา

### ลำดับคำสั่งตรวจสอบ

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron ไม่ทำงานตามเวลา

- ตรวจสอบ `cron.enabled` และตัวแปรแวดล้อม `OPENCLAW_SKIP_CRON`
- ยืนยันว่า Gateway ทำงานต่อเนื่องอยู่
- สำหรับตารางเวลา `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
- `reason: not-due` ในผลลัพธ์การรันหมายความว่ามีการตรวจสอบการรันด้วยตนเองโดยใช้ `openclaw cron run <jobId> --due` และงานนั้นยังไม่ถึงกำหนด

### Cron ทำงานแล้วแต่ไม่มีการส่งต่อ

- โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งแบบ fallback จาก runner เอเจนต์ยังสามารถส่งโดยตรงผ่านเครื่องมือ `message` ได้ หากมี chat route ที่ใช้งานได้
- หากไม่มีหรือระบุเป้าหมายการส่งไม่ถูกต้อง (`channel`/`to`) ระบบจะข้ามการส่งออก
- ข้อผิดพลาดด้านการยืนยันตัวตนของช่องทาง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลรับรอง
- หากการรันแบบ isolated ส่งกลับมาเพียงโทเค็นแบบเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับการส่งออกโดยตรง และยังระงับเส้นทางสรุปแบบเข้าคิวที่เป็น fallback ด้วย ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต
- หากเอเจนต์ควรส่งข้อความถึงผู้ใช้ด้วยตัวเอง ให้ตรวจสอบว่างานนั้นมี route ที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือระบุ channel/target อย่างชัดเจน)

### ข้อควรระวังเรื่องเขตเวลา

- Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ Gateway
- ตารางเวลา `at` ที่ไม่มีเขตเวลาจะถือว่าเป็น UTC
- `activeHours` ของ Heartbeat ใช้การ resolve เขตเวลาตามที่กำหนดค่าไว้

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีรายการงานสำหรับการรัน cron
- [Heartbeat](/th/gateway/heartbeat) — เทิร์นแบบวนซ้ำของ main session
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
