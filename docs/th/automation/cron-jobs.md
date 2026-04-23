---
read_when:
    - การจัดตารางเวลางานเบื้องหลังหรือการปลุกระบบ
    - การเชื่อมต่อตัวกระตุ้นภายนอก (Webhook, Gmail) เข้ากับ OpenClaw
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
summary: งานตามกำหนดเวลา, Webhook และทริกเกอร์ Gmail PubSub สำหรับตัวจัดตารางเวลา Gateway
title: งานตามกำหนดเวลา
x-i18n:
    generated_at: "2026-04-23T05:24:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# งานตามกำหนดเวลา (Cron)

Cron คือตัวจัดตารางเวลาที่มีมาในตัวของ Gateway โดยจะบันทึกงานไว้ ปลุกเอเจนต์ในเวลาที่เหมาะสม และสามารถส่งผลลัพธ์กลับไปยังช่องแชตหรือปลายทาง Webhook ได้

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

- Cron ทำงาน **ภายใน** กระบวนการ Gateway (ไม่ได้ทำงานภายในโมเดล)
- นิยามงานจะถูกบันทึกไว้ที่ `~/.openclaw/cron/jobs.json` ดังนั้นการรีสตาร์ตจะไม่ทำให้ตารางเวลาหายไป
- สถานะการทำงานขณะรันจะถูกบันทึกไว้ข้างกันที่ `~/.openclaw/cron/jobs-state.json` หากคุณติดตามนิยาม cron ใน git ให้ติดตาม `jobs.json` และใส่ `jobs-state.json` ไว้ใน gitignore
- หลังจากแยกไฟล์ เวอร์ชัน OpenClaw ที่เก่ากว่ายังอ่าน `jobs.json` ได้ แต่ก็อาจมองว่างานเป็นงานใหม่ เพราะฟิลด์สถานะรันไทม์ตอนนี้ย้ายไปอยู่ใน `jobs-state.json`
- การรัน cron ทั้งหมดจะสร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
- งานแบบครั้งเดียว (`--at`) จะลบตัวเองอัตโนมัติหลังสำเร็จตามค่าเริ่มต้น
- การรัน cron แบบ isolated จะพยายามปิดแท็บ/โปรเซสของเบราว์เซอร์ที่ถูกติดตามไว้สำหรับเซสชัน `cron:<jobId>` ของงานนั้นเมื่อการรันเสร็จสิ้น เพื่อไม่ให้ระบบอัตโนมัติของเบราว์เซอร์ที่แยกออกมาทิ้งโปรเซสค้างไว้
- การรัน cron แบบ isolated ยังป้องกันการตอบรับที่ค้างเก่าอีกด้วย หากผลลัพธ์แรกเป็นเพียงการอัปเดตสถานะชั่วคราว (`on it`, `pulling everything together` และข้อความทำนองเดียวกัน) และยังไม่มีการรัน subagent ลูกตัวใดที่ยังรับผิดชอบคำตอบสุดท้าย OpenClaw จะส่งพรอมป์ซ้ำอีกหนึ่งครั้งเพื่อขอผลลัพธ์จริงก่อนส่งต่อ

<a id="maintenance"></a>

การกระทบยอดงานสำหรับ cron เป็นสิ่งที่รันไทม์เป็นเจ้าของ: งาน cron ที่ยังใช้งานอยู่จะยังคงมีสถานะ live ตราบใดที่รันไทม์ของ cron ยังติดตามว่างานนั้นกำลังทำงานอยู่ แม้ว่าจะยังมีแถวเซสชันลูกเก่าหลงเหลืออยู่ก็ตาม เมื่อรันไทม์ไม่ได้เป็นเจ้าของงานนั้นอีกต่อไปและหน้าต่างผ่อนผัน 5 นาทีหมดลงแล้ว maintenance จึงสามารถทำเครื่องหมายงานเป็น `lost` ได้

## ประเภทตารางเวลา

| ชนิด    | แฟลก CLI | คำอธิบาย                                                      |
| ------- | -------- | ------------------------------------------------------------- |
| `at`    | `--at`   | เวลาประทับแบบครั้งเดียว (ISO 8601 หรือแบบสัมพัทธ์ เช่น `20m`) |
| `every` | `--every`| ช่วงเวลาคงที่                                                  |
| `cron`  | `--cron` | นิพจน์ cron แบบ 5 ฟิลด์หรือ 6 ฟิลด์ พร้อม `--tz` ที่เป็นตัวเลือก |

เวลาประทับที่ไม่มีเขตเวลาจะถือว่าเป็น UTC ใช้ `--tz America/New_York` เพื่อจัดตารางตามเวลาท้องถิ่นแบบ wall-clock

นิพจน์แบบเกิดซ้ำทุกต้นชั่วโมงจะถูกสลับเวลาโดยอัตโนมัติได้สูงสุด 5 นาทีเพื่อลดภาระที่พุ่งขึ้นพร้อมกัน ใช้ `--exact` เพื่อบังคับเวลาให้ตรงเป๊ะ หรือ `--stagger 30s` เพื่อกำหนดช่วงสลับเวลาอย่างชัดเจน

### วันของเดือนและวันของสัปดาห์ใช้ตรรกะแบบ OR

นิพจน์ Cron ถูกแยกวิเคราะห์โดย [croner](https://github.com/Hexagon/croner) เมื่อทั้งฟิลด์วันของเดือนและวันของสัปดาห์ไม่ได้เป็น wildcard, croner จะจับคู่เมื่อมี **ฟิลด์ใดฟิลด์หนึ่ง** ตรงกัน — ไม่ใช่ทั้งสองฟิลด์พร้อมกัน นี่คือพฤติกรรมมาตรฐานของ Vixie cron

```
# ตั้งใจ: "9 โมงเช้าของวันที่ 15 เฉพาะเมื่อวันนั้นเป็นวันจันทร์"
# ผลลัพธ์จริง: "9 โมงเช้าของทุกวันที่ 15 และ 9 โมงเช้าของทุกวันจันทร์"
0 9 15 * 1
```

สิ่งนี้จะทำงานประมาณ 5–6 ครั้งต่อเดือน แทนที่จะเป็น 0–1 ครั้งต่อเดือน OpenClaw ใช้พฤติกรรม OR เริ่มต้นของ Croner ในกรณีนี้ หากต้องการให้ทั้งสองเงื่อนไขตรงกัน ให้ใช้ตัวปรับแต่งวันของสัปดาห์ `+` ของ Croner (`0 9 15 * +1`) หรือจัดตารางจากฟิลด์หนึ่ง แล้วตรวจอีกฟิลด์หนึ่งในพรอมป์หรืิอคำสั่งของงานคุณเอง

## รูปแบบการทำงาน

| รูปแบบ         | ค่า `--session`      | ทำงานใน                    | เหมาะสำหรับ                    |
| -------------- | -------------------- | -------------------------- | ------------------------------ |
| เซสชันหลัก     | `main`               | รอบ Heartbeat ถัดไป        | การเตือน, system event         |
| Isolated       | `isolated`           | `cron:<jobId>` โดยเฉพาะ    | รายงาน, งานเบื้องหลัง         |
| เซสชันปัจจุบัน | `current`            | ผูกไว้ตั้งแต่เวลาสร้าง     | งานวนซ้ำที่อิงบริบท           |
| เซสชันกำหนดเอง | `session:custom-id`  | เซสชันแบบมีชื่อถาวร        | เวิร์กโฟลว์ที่ต่อยอดจากประวัติ |

งาน **เซสชันหลัก** จะนำ system event เข้าคิวและสามารถปลุก Heartbeat ได้ตามตัวเลือก (`--wake now` หรือ `--wake next-heartbeat`) งาน **Isolated** จะรันเอเจนต์แบบแยกเฉพาะด้วยเซสชันใหม่ **เซสชันกำหนดเอง** (`session:xxx`) จะคงบริบทข้ามการรันแต่ละครั้งไว้ ทำให้รองรับเวิร์กโฟลว์อย่างการสรุปประจำวันซึ่งต่อยอดจากสรุปก่อนหน้าได้

สำหรับงานแบบ isolated การ teardown ของรันไทม์ตอนนี้รวมถึงการล้างเบราว์เซอร์สำหรับเซสชัน cron นั้นแบบ best-effort ด้วย ความล้มเหลวของการล้างจะถูกละเลย เพื่อให้ผลลัพธ์ cron จริงยังคงมีความสำคัญสูงสุด

เมื่อการรัน cron แบบ isolated ทำ orchestration ของ subagent การส่งต่อผลลัพธ์ก็จะให้ความสำคัญกับผลลัพธ์สุดท้ายจาก descendant มากกว่าข้อความชั่วคราวจาก parent ที่ค้างเก่า หาก descendant ยังทำงานอยู่ OpenClaw จะไม่ประกาศการอัปเดตบางส่วนจาก parent นั้น

### ตัวเลือก payload สำหรับงานแบบ isolated

- `--message`: ข้อความพรอมป์ (จำเป็นสำหรับ isolated)
- `--model` / `--thinking`: การ override โมเดลและระดับการคิด
- `--light-context`: ข้ามการ inject ไฟล์ bootstrap ของ workspace
- `--tools exec,read`: จำกัดว่าอนุญาตให้งานใช้เครื่องมือใดได้บ้าง

`--model` จะใช้โมเดลที่อนุญาตซึ่งถูกเลือกสำหรับงานนั้น หากโมเดลที่ร้องขอไม่ได้รับอนุญาต cron จะบันทึกคำเตือนและ fallback กลับไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงานแทน ห่วงโซ่ fallback ที่กำหนดไว้ยังคงมีผล แต่การ override โมเดลแบบธรรมดาที่ไม่มีรายการ fallback รายงานเฉพาะงานอย่างชัดเจน จะไม่เพิ่มโมเดลหลักของเอเจนต์เป็นเป้าหมาย retry พิเศษแบบซ่อนอีกต่อไป

ลำดับความสำคัญของการเลือกโมเดลสำหรับงานแบบ isolated คือ:

1. การ override โมเดลจาก Gmail hook (เมื่อการรันมาจาก Gmail และอนุญาตให้ใช้ override นั้น)
2. `model` ใน payload ระดับงาน
3. การ override โมเดลของเซสชัน cron ที่เก็บไว้
4. การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้น

Fast mode จะอิงตามตัวเลือก live ที่ถูก resolve แล้วด้วย หากคอนฟิกโมเดลที่เลือกมี `params.fastMode` งาน cron แบบ isolated จะใช้ค่านั้นเป็นค่าเริ่มต้น การ override `fastMode` ของเซสชันที่เก็บไว้ยังคงมีความสำคัญสูงกว่า config ไม่ว่าจะ override ไปในทิศทางใด

หากการรันแบบ isolated เจอการส่งต่อแบบ live model-switch cron จะ retry ด้วยผู้ให้บริการ/โมเดลที่ถูกสลับไป และจะบันทึกตัวเลือก live นั้นก่อน retry ด้วย หากการสลับนั้นมี auth profile ใหม่มาด้วย cron ก็จะบันทึกการ override auth profile นั้นด้วย การ retry มีขอบเขตจำกัด: หลังจากพยายามครั้งแรกและ retry จากการสลับอีก 2 ครั้ง cron จะยกเลิกแทนที่จะวนซ้ำไม่รู้จบ

## การส่งมอบและผลลัพธ์

| โหมด       | สิ่งที่จะเกิดขึ้น                                                |
| ---------- | ----------------------------------------------------------------- |
| `announce` | ส่งข้อความสุดท้ายไปยังปลายทางแบบ fallback หากเอเจนต์ไม่ได้ส่งเอง |
| `webhook`  | ส่ง payload ของเหตุการณ์ที่เสร็จสิ้นแล้วด้วย POST ไปยัง URL      |
| `none`     | ไม่มีการส่งแบบ fallback โดย runner                              |

ใช้ `--announce --channel telegram --to "-1001234567890"` เพื่อส่งไปยังช่อง สำหรับหัวข้อฟอรัมของ Telegram ให้ใช้ `-1001234567890:topic:123` เป้าหมายของ Slack/Discord/Mattermost ควรใช้คำนำหน้าที่ชัดเจน (`channel:<id>`, `user:<id>`)

สำหรับงานแบบ isolated การส่งเข้าแชตจะใช้ร่วมกัน หากมีเส้นทางแชตพร้อมใช้งาน เอเจนต์สามารถใช้เครื่องมือ `message` ได้ แม้ว่างานนั้นจะใช้ `--no-deliver` ก็ตาม หากเอเจนต์ส่งไปยังปลายทางที่กำหนดไว้/ปลายทางปัจจุบัน OpenClaw จะข้ามการประกาศแบบ fallback มิฉะนั้น `announce`, `webhook` และ `none` จะควบคุมเฉพาะสิ่งที่ runner ทำกับคำตอบสุดท้ายหลังจากรอบการทำงานของเอเจนต์เท่านั้น

การแจ้งเตือนความล้มเหลวจะใช้เส้นทางปลายทางแยกต่างหาก:

- `cron.failureDestination` ตั้งค่าเริ่มต้นส่วนกลางสำหรับการแจ้งเตือนความล้มเหลว
- `job.delivery.failureDestination` ใช้ override รายงานงาน
- หากไม่ได้ตั้งค่าทั้งสองอย่างไว้ และงานนั้นส่งผ่าน `announce` อยู่แล้ว การแจ้งเตือนความล้มเหลวจะ fallback ไปยังเป้าหมาย announce หลักนั้นโดยอัตโนมัติ
- `delivery.failureDestination` รองรับเฉพาะงานที่มี `sessionTarget="isolated"` เว้นแต่โหมดการส่งหลักจะเป็น `webhook`

## ตัวอย่าง CLI

การเตือนแบบครั้งเดียว (เซสชันหลัก):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

งานแบบ isolated ที่เกิดซ้ำพร้อมการส่งมอบ:

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

งานแบบ isolated พร้อมการ override โมเดลและระดับการคิด:

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

Gateway สามารถเปิดเผยปลายทาง HTTP Webhook สำหรับตัวกระตุ้นภายนอกได้ เปิดใช้งานในคอนฟิกดังนี้:

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

ทุกคำขอต้องรวม hook token ผ่าน header:

- `Authorization: Bearer <token>` (แนะนำ)
- `x-openclaw-token: <token>`

token ใน query string จะถูกปฏิเสธ

### POST /hooks/wake

นำ system event เข้าคิวสำหรับเซสชันหลัก:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (จำเป็น): คำอธิบายเหตุการณ์
- `mode` (ไม่บังคับ): `now` (ค่าเริ่มต้น) หรือ `next-heartbeat`

### POST /hooks/agent

รันเอเจนต์แบบ isolated หนึ่งรอบ:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

ฟิลด์: `message` (จำเป็น), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`

### Mapped hook (POST /hooks/\<name\>)

ชื่อ hook แบบกำหนดเองจะถูก resolve ผ่าน `hooks.mappings` ในคอนฟิก โดย mapping สามารถแปลง payload แบบกำหนดเองให้เป็นแอ็กชัน `wake` หรือ `agent` ได้ด้วย template หรือ code transform

### ความปลอดภัย

- เก็บปลายทาง hook ไว้หลัง loopback, tailnet หรือ reverse proxy ที่เชื่อถือได้
- ใช้ hook token เฉพาะ อย่านำ token ยืนยันตัวตนของ gateway กลับมาใช้ซ้ำ
- ให้ `hooks.path` อยู่บน subpath เฉพาะ โดย `/` จะถูกปฏิเสธ
- ตั้งค่า `hooks.allowedAgentIds` เพื่อจำกัดการกำหนดเส้นทาง `agentId` แบบชัดเจน
- คงค่า `hooks.allowRequestSessionKey=false` ไว้ เว้นแต่คุณจำเป็นต้องให้ผู้เรียกเลือกเซสชันเอง
- หากคุณเปิด `hooks.allowRequestSessionKey` ให้ตั้งค่า `hooks.allowedSessionKeyPrefixes` ด้วยเพื่อจำกัดรูปแบบ session key ที่อนุญาต
- โดยค่าเริ่มต้น payload ของ hook จะถูกห่อด้วยขอบเขตความปลอดภัย

## การผสานรวม Gmail PubSub

เชื่อมทริกเกอร์กล่องจดหมาย Gmail เข้ากับ OpenClaw ผ่าน Google PubSub

**ข้อกำหนดเบื้องต้น**: CLI `gcloud`, `gog` (gogcli), เปิดใช้งาน OpenClaw hooks แล้ว, และใช้ Tailscale สำหรับปลายทาง HTTPS สาธารณะ

### การตั้งค่าด้วยวิซาร์ด (แนะนำ)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

คำสั่งนี้จะเขียนคอนฟิก `hooks.gmail`, เปิดใช้งาน Gmail preset และใช้ Tailscale Funnel สำหรับปลายทาง push

### การเริ่มทำงานอัตโนมัติของ Gateway

เมื่อ `hooks.enabled=true` และมีการตั้งค่า `hooks.gmail.account` ไว้ Gateway จะเริ่ม `gog gmail watch serve` ตอนบูตและต่ออายุ watch ให้อัตโนมัติ ตั้งค่า `OPENCLAW_SKIP_GMAIL_WATCHER=1` หากต้องการปิดการทำงานนี้

### การตั้งค่าแบบทำเองครั้งเดียว

1. เลือกโปรเจกต์ GCP ที่เป็นเจ้าของ OAuth client ที่ `gog` ใช้งาน:

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. สร้าง topic และให้สิทธิ์ Gmail ในการ push:

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

# บังคับรันงานตอนนี้
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
- หากโมเดลนั้นได้รับอนุญาต ผู้ให้บริการ/โมเดลที่ระบุแบบตรงตัวนั้นจะถูกส่งไปยังการรันเอเจนต์แบบ isolated
- หากไม่ได้รับอนุญาต cron จะเตือนและ fallback ไปใช้การเลือกโมเดลของเอเจนต์/ค่าเริ่มต้นของงาน
- ห่วงโซ่ fallback ที่กำหนดไว้ยังคงมีผล แต่การ override ด้วย `--model` แบบธรรมดาที่ไม่มีรายการ fallback ระดับงานอย่างชัดเจน จะไม่ fallback ต่อไปยังโมเดลหลักของเอเจนต์ในฐานะเป้าหมาย retry เพิ่มเติมแบบเงียบ ๆ อีกต่อไป

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

ไฟล์สถานะ sidecar ของรันไทม์จะถูกอนุมานจาก `cron.store`: store แบบ `.json` เช่น `~/clawd/cron/jobs.json` จะใช้ `~/clawd/cron/jobs-state.json` ส่วนพาธ store ที่ไม่มีนามสกุล `.json` จะเติม `-state.json` ต่อท้าย

ปิดใช้งาน cron: `cron.enabled: false` หรือ `OPENCLAW_SKIP_CRON=1`

**การ retry สำหรับงานครั้งเดียว**: ข้อผิดพลาดชั่วคราว (rate limit, overload, network, server error) จะ retry ได้สูงสุด 3 ครั้งด้วย exponential backoff ข้อผิดพลาดถาวรจะถูกปิดใช้งานทันที

**การ retry สำหรับงานแบบเกิดซ้ำ**: ใช้ exponential backoff (30 วินาทีถึง 60 นาที) ระหว่างการ retry แต่ละครั้ง โดย backoff จะรีเซ็ตหลังจากการรันครั้งถัดไปที่สำเร็จ

**Maintenance**: `cron.sessionRetention` (ค่าเริ่มต้น `24h`) จะล้างรายการ run-session ของงานแบบ isolated ส่วน `cron.runLog.maxBytes` / `cron.runLog.keepLines` จะล้างไฟล์บันทึกการรันโดยอัตโนมัติ

## การแก้ไขปัญหา

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

### Cron ไม่ทำงานตามกำหนด

- ตรวจสอบ `cron.enabled` และตัวแปรแวดล้อม `OPENCLAW_SKIP_CRON`
- ยืนยันว่า Gateway กำลังทำงานต่อเนื่อง
- สำหรับตารางเวลาแบบ `cron` ให้ตรวจสอบเขตเวลา (`--tz`) เทียบกับเขตเวลาของโฮสต์
- `reason: not-due` ในผลลัพธ์การรันหมายความว่ามีการตรวจการรันด้วยตนเองผ่าน `openclaw cron run <jobId> --due` และงานยังไม่ถึงกำหนด

### Cron ทำงานแล้วแต่ไม่มีการส่งมอบ

- โหมดการส่ง `none` หมายความว่าไม่คาดว่าจะมีการส่งแบบ fallback โดย runner เอเจนต์ยังคงส่งโดยตรงได้ด้วยเครื่องมือ `message` เมื่อมีเส้นทางแชตพร้อมใช้งาน
- หากไม่มี/ไม่ถูกต้องของปลายทางการส่ง (`channel`/`to`) การส่งออกจะถูกข้าม
- ข้อผิดพลาดการยืนยันตัวตนของช่อง (`unauthorized`, `Forbidden`) หมายความว่าการส่งถูกบล็อกโดยข้อมูลรับรอง
- หากการรันแบบ isolated ส่งกลับมาเพียงโทเค็นเงียบ (`NO_REPLY` / `no_reply`) OpenClaw จะระงับทั้งการส่งออกโดยตรงและเส้นทางสรุปแบบเข้าคิวที่เป็น fallback ดังนั้นจะไม่มีการโพสต์อะไรกลับไปยังแชต
- หากเอเจนต์ควรส่งข้อความถึงผู้ใช้ด้วยตัวเอง ให้ตรวจสอบว่างานนั้นมีเส้นทางที่ใช้งานได้ (`channel: "last"` พร้อมแชตก่อนหน้า หรือมีการระบุ channel/target อย่างชัดเจน)

### ข้อควรระวังเรื่องเขตเวลา

- Cron ที่ไม่มี `--tz` จะใช้เขตเวลาของโฮสต์ที่รัน gateway
- ตารางเวลา `at` ที่ไม่มีเขตเวลาจะถือเป็น UTC
- `activeHours` ของ Heartbeat จะใช้การ resolve เขตเวลาตามที่กำหนดค่าไว้

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — บัญชีรายการงานสำหรับการรัน cron
- [Heartbeat](/th/gateway/heartbeat) — รอบการทำงานของเซสชันหลักแบบเป็นระยะ
- [เขตเวลา](/th/concepts/timezone) — การกำหนดค่าเขตเวลา
