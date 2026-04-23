---
read_when:
    - การปรับจังหวะหรือข้อความของ Heartbeat
    - การตัดสินใจเลือกระหว่าง Heartbeat และ Cron สำหรับงานตามกำหนดเวลา
summary: ข้อความ polling ของ Heartbeat และกฎการแจ้งเตือน
title: Heartbeat
x-i18n:
    generated_at: "2026-04-23T05:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13004e4e20b02b08aaf16f22cdf664d0b59da69446ecb30453db51ffdfd1d267
    source_path: gateway/heartbeat.md
    workflow: 15
---

# Heartbeat (Gateway)

> **Heartbeat หรือ Cron?** ดู [ระบบอัตโนมัติและงาน](/th/automation) สำหรับแนวทางการเลือกใช้แต่ละแบบ

Heartbeat จะรัน **เทิร์นของเอเจนต์แบบเป็นระยะ** ในเซสชันหลัก เพื่อให้โมเดลสามารถแจ้งสิ่งที่ต้องให้ความสนใจได้โดยไม่สแปมคุณ

Heartbeat คือเทิร์นของเซสชันหลักที่ถูกจัดตารางเวลาไว้ — มัน **ไม่** สร้างระเบียน [งานเบื้องหลัง](/th/automation/tasks)
ระเบียนงานมีไว้สำหรับงานที่แยกออกไปทำต่างหาก (การรัน ACP, subagent, งาน cron แบบ isolated)

การแก้ไขปัญหา: [งานตามกำหนดเวลา](/th/automation/cron-jobs#troubleshooting)

## เริ่มต้นอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ปล่อยให้เปิดใช้ heartbeat ไว้ (ค่าเริ่มต้นคือ `30m` หรือ `1h` สำหรับ auth แบบ Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) หรือตั้งจังหวะของคุณเอง
2. สร้างเช็กลิสต์ `HEARTBEAT.md` ขนาดเล็กหรือบล็อก `tasks:` ใน workspace ของเอเจนต์ (ไม่บังคับแต่แนะนำ)
3. ตัดสินใจว่าข้อความ heartbeat ควรถูกส่งไปที่ใด (`target: "none"` เป็นค่าเริ่มต้น; ตั้ง `target: "last"` เพื่อส่งไปยังผู้ติดต่อคนล่าสุด)
4. ไม่บังคับ: เปิดใช้การส่ง reasoning ของ heartbeat เพื่อความโปร่งใส
5. ไม่บังคับ: ใช้ bootstrap context แบบเบา หาก heartbeat ต้องใช้เพียง `HEARTBEAT.md`
6. ไม่บังคับ: เปิดใช้ isolated session เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมดทุก heartbeat
7. ไม่บังคับ: จำกัด heartbeat ให้อยู่ในช่วงเวลาที่ใช้งานอยู่ (เวลาท้องถิ่น)

ตัวอย่างคอนฟิก:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งแบบชัดเจนไปยังผู้ติดต่อคนล่าสุด (ค่าเริ่มต้นคือ "none")
        directPolicy: "allow", // ค่าเริ่มต้น: อนุญาตเป้าหมายแบบ direct/DM; ตั้ง "block" เพื่อระงับ
        lightContext: true, // ไม่บังคับ: inject เฉพาะ HEARTBEAT.md จากไฟล์ bootstrap
        isolatedSession: true, // ไม่บังคับ: ใช้เซสชันใหม่ทุกครั้งที่รัน (ไม่มีประวัติการสนทนา)
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // ไม่บังคับ: ส่งข้อความ `Reasoning:` แยกด้วย
      },
    },
  },
}
```

## ค่าเริ่มต้น

- ช่วงเวลา: `30m` (หรือ `1h` เมื่อตรวจพบว่า auth mode เป็น Anthropic OAuth/token รวมถึงการใช้ Claude CLI ซ้ำ) ตั้งค่า `agents.defaults.heartbeat.every` หรือ `agents.list[].heartbeat.every`; ใช้ `0m` เพื่อปิดใช้งาน
- เนื้อหา prompt (กำหนดค่าได้ผ่าน `agents.defaults.heartbeat.prompt`):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- prompt ของ heartbeat จะถูกส่ง **แบบตรงตัว** เป็นข้อความผู้ใช้ system
  prompt จะมีส่วน “Heartbeat” เฉพาะเมื่อเปิดใช้ heartbeat สำหรับ
  เอเจนต์ค่าเริ่มต้น และการรันนั้นถูกทำเครื่องหมายภายในไว้
- เมื่อปิด heartbeat ด้วย `0m`, การรันปกติจะละ `HEARTBEAT.md`
  ออกจาก bootstrap context ด้วย เพื่อไม่ให้โมเดลเห็นคำสั่งที่มีไว้เฉพาะ heartbeat
- ชั่วโมงที่ใช้งาน (`heartbeat.activeHours`) จะถูกตรวจสอบในเขตเวลาที่กำหนดค่าไว้
  นอกช่วงหน้าต่างนี้ heartbeat จะถูกข้ามไปจนกว่าจะถึง tick ถัดไปที่อยู่ในช่วง

## prompt ของ heartbeat มีไว้เพื่ออะไร

prompt เริ่มต้นตั้งใจให้กว้าง:

- **งานเบื้องหลัง**: “Consider outstanding tasks” กระตุ้นให้เอเจนต์ทบทวน
  งานติดค้าง (กล่องจดหมาย ปฏิทิน การเตือน งานที่เข้าคิวไว้) และแจ้งสิ่งเร่งด่วน
- **การเช็กอินกับมนุษย์**: “Checkup sometimes on your human during day time” กระตุ้นให้มี
  ข้อความเบา ๆ เป็นครั้งคราว เช่น “มีอะไรให้ช่วยไหม?” แต่หลีกเลี่ยงการรบกวนตอนกลางคืน
  โดยใช้เขตเวลาท้องถิ่นที่คุณกำหนดไว้ (ดู [/concepts/timezone](/th/concepts/timezone))

Heartbeat สามารถตอบสนองต่องาน [งานเบื้องหลัง](/th/automation/tasks) ที่เสร็จสิ้นแล้วได้ แต่การรัน heartbeat เองจะไม่สร้างระเบียนงาน

หากคุณต้องการให้ heartbeat ทำสิ่งที่เฉพาะเจาะจงมาก (เช่น “ตรวจสถิติ Gmail PubSub”
หรือ “ตรวจสุขภาพ gateway”) ให้ตั้ง `agents.defaults.heartbeat.prompt` (หรือ
`agents.list[].heartbeat.prompt`) เป็นเนื้อหาแบบกำหนดเอง (ส่งแบบตรงตัว)

## สัญญาการตอบกลับ

- หากไม่มีอะไรต้องให้ความสนใจ ให้ตอบด้วย **`HEARTBEAT_OK`**
- ระหว่างการรัน heartbeat OpenClaw จะถือว่า `HEARTBEAT_OK` เป็น ack เมื่อมันปรากฏ
  ที่ **ต้นหรือท้าย** ของคำตอบ token นี้จะถูกตัดออก และคำตอบจะถูกทิ้งหาก
  เนื้อหาที่เหลือมีขนาด **≤ `ackMaxChars`** (ค่าเริ่มต้น: 300)
- หาก `HEARTBEAT_OK` ปรากฏอยู่ **กลาง** คำตอบ จะไม่ถูกปฏิบัติเป็นกรณีพิเศษ
- สำหรับการแจ้งเตือน **อย่า** ใส่ `HEARTBEAT_OK`; ให้ส่งเฉพาะข้อความแจ้งเตือนเท่านั้น

นอก heartbeat, `HEARTBEAT_OK` ที่หลงมาอยู่ต้น/ท้ายข้อความจะถูกตัดออก
และบันทึกไว้; หากข้อความมีเพียง `HEARTBEAT_OK` อย่างเดียวจะถูกทิ้ง

## คอนฟิก

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // ค่าเริ่มต้น: 30m (0m คือปิดใช้งาน)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // ค่าเริ่มต้น: false (ส่งข้อความ Reasoning: แยกเมื่อมี)
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ใน workspace
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรันแต่ละ heartbeat ในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        target: "last", // ค่าเริ่มต้น: none | ตัวเลือก: last | none | <channel id> (core หรือ Plugin เช่น "bluebubbles")
        to: "+15551234567", // ไม่บังคับ: override เฉพาะช่อง
        accountId: "ops-bot", // ไม่บังคับ: channel id แบบหลายบัญชี
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // จำนวนอักขระสูงสุดที่อนุญาตหลัง HEARTBEAT_OK
      },
    },
  },
}
```

### ขอบเขตและลำดับความสำคัญ

- `agents.defaults.heartbeat` ตั้งค่าพฤติกรรม heartbeat แบบส่วนกลาง
- `agents.list[].heartbeat` จะ merge ทับด้านบน; หากเอเจนต์ใดมีบล็อก `heartbeat` จะมี **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่รัน heartbeat
- `channels.defaults.heartbeat` ตั้งค่าการมองเห็นเริ่มต้นสำหรับทุกช่อง
- `channels.<channel>.heartbeat` ใช้ override ค่าเริ่มต้นของช่อง
- `channels.<channel>.accounts.<id>.heartbeat` (ช่องแบบหลายบัญชี) ใช้ override รายช่อง

### heartbeat รายเอเจนต์

หากมีรายการ `agents.list[]` ใดรวมบล็อก `heartbeat` ไว้ จะมี **เฉพาะเอเจนต์เหล่านั้น**
ที่รัน heartbeat บล็อกต่อเอเจนต์จะ merge ทับ `agents.defaults.heartbeat`
(ดังนั้นคุณสามารถตั้งค่าร่วมเพียงครั้งเดียวแล้ว override แยกรายเอเจนต์ได้)

ตัวอย่าง: มีสองเอเจนต์ แต่มีเพียงเอเจนต์ตัวที่สองที่รัน heartbeat

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งแบบชัดเจนไปยังผู้ติดต่อคนล่าสุด (ค่าเริ่มต้นคือ "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### ตัวอย่างช่วงเวลาที่ใช้งานอยู่

จำกัด heartbeat ให้อยู่ในเวลาทำการตามเขตเวลาที่กำหนด:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // ส่งแบบชัดเจนไปยังผู้ติดต่อคนล่าสุด (ค่าเริ่มต้นคือ "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // ไม่บังคับ; ใช้ userTimezone ของคุณหากตั้งไว้ มิฉะนั้นใช้ host tz
        },
      },
    },
  },
}
```

นอกหน้าต่างนี้ (ก่อน 9 โมงเช้าหรือหลัง 4 ทุ่มตามเวลา Eastern) heartbeat จะถูกข้ามไป โดย tick ถัดไปที่อยู่ภายในหน้าต่างจะรันตามปกติ

### การตั้งค่าแบบ 24/7

หากคุณต้องการให้ heartbeat รันได้ทั้งวัน ให้ใช้รูปแบบใดรูปแบบหนึ่งต่อไปนี้:

- ไม่ต้องระบุ `activeHours` เลย (ไม่มีข้อจำกัดหน้าต่างเวลา; นี่คือพฤติกรรมค่าเริ่มต้น)
- ตั้งหน้าต่างเต็มวัน: `activeHours: { start: "00:00", end: "24:00" }`

อย่าตั้ง `start` และ `end` ให้เป็นเวลาเดียวกัน (เช่น `08:00` ถึง `08:00`)
เพราะจะถูกมองว่าเป็นหน้าต่างกว้างศูนย์ ทำให้ heartbeat ถูกข้ามตลอดเวลา

### ตัวอย่างหลายบัญชี

ใช้ `accountId` เพื่อกำหนดเป้าหมายไปยังบัญชีเฉพาะบนช่องแบบหลายบัญชี เช่น Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // ไม่บังคับ: กำหนดเส้นทางไปยัง topic/thread เฉพาะ
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### หมายเหตุของฟิลด์

- `every`: ช่วงเวลา heartbeat (สตริง duration; หน่วยเริ่มต้น = นาที)
- `model`: การ override โมเดลสำหรับการรัน heartbeat แบบไม่บังคับ (`provider/model`)
- `includeReasoning`: เมื่อเปิดใช้ จะส่งข้อความ `Reasoning:` แยกด้วยเมื่อมี (รูปแบบเดียวกับ `/reasoning on`)
- `lightContext`: เมื่อเป็น true การรัน heartbeat จะใช้ bootstrap context แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ใน workspace
- `isolatedSession`: เมื่อเป็น true heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกแบบเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ heartbeat ได้อย่างมาก ใช้ร่วมกับ `lightContext: true` เพื่อประหยัดสูงสุด การกำหนดเส้นทางการส่งมอบยังคงใช้บริบทของเซสชันหลัก
- `session`: session key แบบไม่บังคับสำหรับการรัน heartbeat
  - `main` (ค่าเริ่มต้น): เซสชันหลักของเอเจนต์
  - session key แบบระบุชัดเจน (คัดลอกจาก `openclaw sessions --json` หรือ [CLI ของ sessions](/cli/sessions))
  - รูปแบบ session key: ดู [Sessions](/th/concepts/session) และ [Groups](/th/channels/groups)
- `target`:
  - `last`: ส่งไปยังช่องภายนอกที่ใช้งานล่าสุด
  - ช่องแบบระบุชัดเจน: channel หรือ plugin id ใดก็ได้ที่กำหนดค่าไว้ เช่น `discord`, `matrix`, `telegram` หรือ `whatsapp`
  - `none` (ค่าเริ่มต้น): รัน heartbeat แต่ **ไม่ส่ง** ออกภายนอก
- `directPolicy`: ควบคุมพฤติกรรมการส่งแบบ direct/DM:
  - `allow` (ค่าเริ่มต้น): อนุญาตการส่ง heartbeat แบบ direct/DM
  - `block`: ระงับการส่งแบบ direct/DM (`reason=dm-blocked`)
- `to`: override ผู้รับแบบไม่บังคับ (ID เฉพาะช่อง เช่น E.164 สำหรับ WhatsApp หรือ Telegram chat id) สำหรับ Telegram topic/thread ให้ใช้ `<chatId>:topic:<messageThreadId>`
- `accountId`: account id แบบไม่บังคับสำหรับช่องแบบหลายบัญชี เมื่อ `target: "last"` account id จะใช้กับช่องล่าสุดที่ resolve แล้วหากช่องนั้นรองรับบัญชี; มิฉะนั้นจะถูกละเลย หาก account id ไม่ตรงกับบัญชีที่กำหนดค่าไว้สำหรับช่องที่ resolve แล้ว การส่งจะถูกข้าม
- `prompt`: override เนื้อหา prompt เริ่มต้น (ไม่ merge)
- `ackMaxChars`: จำนวนอักขระสูงสุดที่อนุญาตหลัง `HEARTBEAT_OK` ก่อนจะมีการส่งมอบ
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat
- `activeHours`: จำกัดการรัน heartbeat ให้อยู่ในช่วงเวลา วัตถุนี้มี `start` (HH:MM, รวมขอบเขต; ใช้ `00:00` สำหรับต้นวัน), `end` (HH:MM แบบไม่รวมขอบเขต; อนุญาต `24:00` สำหรับสิ้นวัน) และ `timezone` แบบไม่บังคับ
  - หากละไว้หรือเป็น `"user"`: ใช้ `agents.defaults.userTimezone` ของคุณหากมี มิฉะนั้น fallback ไปยังเขตเวลาของระบบโฮสต์
  - `"local"`: ใช้เขตเวลาของระบบโฮสต์เสมอ
  - IANA identifier ใดก็ได้ (เช่น `America/New_York`): ใช้โดยตรง; หากไม่ถูกต้อง จะ fallback ไปยังพฤติกรรม `"user"` ด้านบน
  - `start` และ `end` ต้องไม่เท่ากันสำหรับหน้าต่างที่ใช้งานอยู่; หากเท่ากันจะถือว่าเป็นหน้าต่างกว้างศูนย์ (อยู่นอกหน้าต่างเสมอ)
  - นอกหน้าต่างที่ใช้งานอยู่ heartbeat จะถูกข้ามไปจนกว่าจะถึง tick ถัดไปที่อยู่ภายในหน้าต่าง

## พฤติกรรมการส่งมอบ

- ตามค่าเริ่มต้น Heartbeat จะรันในเซสชันหลักของเอเจนต์ (`agent:<id>:<mainKey>`),
  หรือ `global` เมื่อ `session.scope = "global"` ตั้งค่า `session` เพื่อ override ไปยัง
  เซสชันของช่องเฉพาะ (Discord/WhatsApp/อื่น ๆ)
- `session` มีผลเฉพาะบริบทการรัน; การส่งมอบถูกควบคุมโดย `target` และ `to`
- หากต้องการส่งไปยังช่อง/ผู้รับเฉพาะ ให้ตั้ง `target` + `to` เมื่อใช้
  `target: "last"` การส่งมอบจะใช้ช่องภายนอกล่าสุดของเซสชันนั้น
- โดยค่าเริ่มต้น การส่งมอบ heartbeat อนุญาตเป้าหมายแบบ direct/DM ตั้ง `directPolicy: "block"` เพื่อระงับการส่งไปยังเป้าหมายแบบ direct ขณะที่ยังคงรัน heartbeat turn อยู่
- หากคิวหลักกำลังไม่ว่าง heartbeat จะถูกข้ามและลองใหม่ในภายหลัง
- หาก `target` resolve แล้วไม่พบปลายทางภายนอก การรันจะยังเกิดขึ้นแต่จะไม่มี
  การส่งข้อความขาออก
- หากปิด `showOk`, `showAlerts` และ `useIndicator` ทั้งหมด การรันจะถูกข้ามตั้งแต่ต้นเป็น `reason=alerts-disabled`
- หากปิดเฉพาะการส่งมอบ alert, OpenClaw ยังสามารถรัน heartbeat, อัปเดตเวลาประทับของ due-task, คืนค่าเวลาประทับ idle ของเซสชัน และระงับ payload alert ที่ส่งออกภายนอกได้
- หากเป้าหมาย heartbeat ที่ resolve แล้วรองรับการพิมพ์ OpenClaw จะแสดงสถานะกำลังพิมพ์ระหว่างที่
  การรัน heartbeat ยังทำงานอยู่ โดยจะใช้เป้าหมายเดียวกับที่ heartbeat
  จะใช้ส่งเอาต์พุตแชต และจะถูกปิดด้วย `typingMode: "never"`
- คำตอบที่เป็น heartbeat-only **จะไม่** ทำให้เซสชันยังคง active; ค่า `updatedAt` ล่าสุด
  จะถูกคืนกลับเพื่อให้การหมดอายุจาก idle ทำงานตามปกติ
- [งานเบื้องหลัง](/th/automation/tasks) แบบ detached สามารถนำ system event เข้าคิวและปลุก heartbeat ได้เมื่อเซสชันหลักควรรับรู้บางอย่างโดยเร็ว การปลุกนั้นไม่ได้ทำให้การรัน heartbeat กลายเป็นงานเบื้องหลัง

## ตัวควบคุมการมองเห็น

โดยค่าเริ่มต้น การตอบรับ `HEARTBEAT_OK` จะถูกระงับ ขณะที่เนื้อหา alert จะถูกส่งมอบ
คุณสามารถปรับสิ่งนี้ได้รายช่องหรือรายบัญชี:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # ซ่อน HEARTBEAT_OK (ค่าเริ่มต้น)
      showAlerts: true # แสดงข้อความ alert (ค่าเริ่มต้น)
      useIndicator: true # ส่งเหตุการณ์ indicator (ค่าเริ่มต้น)
  telegram:
    heartbeat:
      showOk: true # แสดง OK acknowledgment บน Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # ระงับการส่ง alert สำหรับบัญชีนี้
```

ลำดับความสำคัญ: รายบัญชี → รายช่อง → ค่าเริ่มต้นของช่อง → ค่าเริ่มต้นในตัว

### แต่ละแฟลกทำอะไร

- `showOk`: ส่ง acknowledgment `HEARTBEAT_OK` เมื่อโมเดลส่งกลับคำตอบที่เป็น OK-only
- `showAlerts`: ส่งเนื้อหา alert เมื่อโมเดลส่งกลับคำตอบที่ไม่ใช่ OK
- `useIndicator`: ส่งเหตุการณ์ indicator สำหรับพื้นผิวสถานะของ UI

หาก **ทั้งสามค่า** เป็น false OpenClaw จะข้ามการรัน heartbeat ไปทั้งหมด (ไม่มีการเรียกโมเดล)

### ตัวอย่างรายช่องเทียบกับรายบัญชี

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # ทุกบัญชี Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # ระงับ alert เฉพาะบัญชี ops
  telegram:
    heartbeat:
      showOk: true
```

### รูปแบบการใช้งานที่พบบ่อย

| เป้าหมาย                                 | คอนฟิก                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| พฤติกรรมเริ่มต้น (OK เงียบ, alert เปิด) | _(ไม่ต้องตั้งค่า)_                                                                       |
| เงียบทั้งหมด (ไม่มีข้อความ, ไม่มี indicator) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| เฉพาะ indicator (ไม่มีข้อความ)           | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }` |
| แสดง OK ในช่องเดียวเท่านั้น              | `channels.telegram.heartbeat: { showOk: true }`                                         |

## HEARTBEAT.md (ไม่บังคับ)

หากมีไฟล์ `HEARTBEAT.md` อยู่ใน workspace prompt เริ่มต้นจะบอกให้
เอเจนต์อ่านมัน ให้คิดว่ามันเป็น “เช็กลิสต์ heartbeat” ของคุณ: เล็ก เสถียร และ
ปลอดภัยพอที่จะใส่ทุก ๆ 30 นาที

ในการรันปกติ `HEARTBEAT.md` จะถูก inject เฉพาะเมื่อเปิดใช้แนวทาง heartbeat
สำหรับเอเจนต์ค่าเริ่มต้น การปิดจังหวะ heartbeat ด้วย `0m` หรือ
การตั้ง `includeSystemPromptSection: false` จะทำให้มันไม่ถูกใส่ใน bootstrap
context ปกติ

หากมี `HEARTBEAT.md` อยู่แต่แทบจะว่างเปล่า (มีเพียงบรรทัดว่างและ markdown
heading เช่น `# Heading`) OpenClaw จะข้ามการรัน heartbeat เพื่อประหยัด API call
การข้ามนี้จะถูกรายงานเป็น `reason=empty-heartbeat-file`
หากไม่มีไฟล์ heartbeat จะยังคงรัน และให้โมเดลตัดสินใจว่าจะทำอะไร

ให้ไฟล์นี้เล็กเข้าไว้ (เช็กลิสต์สั้น ๆ หรือการเตือนความจำ) เพื่อหลีกเลี่ยง prompt บวม

ตัวอย่าง `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### บล็อก `tasks:`

`HEARTBEAT.md` ยังรองรับบล็อก `tasks:` แบบมีโครงสร้างขนาดเล็กสำหรับการตรวจสอบตามช่วงเวลา
ภายใน heartbeat เอง

ตัวอย่าง:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

พฤติกรรม:

- OpenClaw จะ parse บล็อก `tasks:` และตรวจแต่ละงานเทียบกับ `interval` ของงานนั้นเอง
- จะรวมเฉพาะงานที่ **ถึงกำหนด** ใน prompt ของ heartbeat สำหรับ tick นั้น
- หากไม่มีงานใดถึงกำหนด heartbeat จะถูกข้ามทั้งหมด (`reason=no-tasks-due`) เพื่อหลีกเลี่ยงการเรียกโมเดลโดยเสียเปล่า
- เนื้อหาที่ไม่ใช่งานใน `HEARTBEAT.md` จะถูกรักษาไว้และต่อท้ายเป็นบริบทเพิ่มเติมหลังรายการงานที่ถึงกำหนด
- เวลาประทับการรันล่าสุดของงานจะถูกเก็บไว้ในสถานะของเซสชัน (`heartbeatTaskState`) ดังนั้นช่วงเวลาจะคงอยู่ข้ามการรีสตาร์ตตามปกติ
- เวลาประทับของงานจะถูกเลื่อนไปข้างหน้าเฉพาะหลังจากการรัน heartbeat ผ่านเส้นทางการตอบกลับปกติครบถ้วนแล้วเท่านั้น การรันที่ถูกข้ามแบบ `empty-heartbeat-file` / `no-tasks-due` จะไม่ทำเครื่องหมายว่างานเสร็จแล้ว

โหมดงานมีประโยชน์เมื่อคุณต้องการให้ไฟล์ heartbeat หนึ่งไฟล์เก็บการตรวจสอบเป็นระยะหลายแบบ โดยไม่ต้องจ่ายต้นทุนสำหรับทุกงานในทุก tick

### เอเจนต์สามารถอัปเดต HEARTBEAT.md ได้หรือไม่?

ได้ — หากคุณบอกให้มันทำ

`HEARTBEAT.md` เป็นเพียงไฟล์ปกติใน workspace ของเอเจนต์ ดังนั้นคุณสามารถบอก
เอเจนต์ได้ (ในการแชตปกติ) ประมาณว่า:

- “Update `HEARTBEAT.md` to add a daily calendar check.”
- “Rewrite `HEARTBEAT.md` so it’s shorter and focused on inbox follow-ups.”

หากคุณต้องการให้สิ่งนี้เกิดขึ้นเชิงรุก คุณยังสามารถใส่บรรทัดที่ชัดเจนใน
heartbeat prompt ได้ด้วย เช่น: “If the checklist becomes stale, update HEARTBEAT.md
with a better one.”

หมายเหตุด้านความปลอดภัย: อย่าใส่ความลับ (API key, หมายเลขโทรศัพท์, private token) ลงใน
`HEARTBEAT.md` — เพราะมันจะกลายเป็นส่วนหนึ่งของ prompt context

## การปลุกแบบแมนนวล (ตามต้องการ)

คุณสามารถนำ system event เข้าคิวและ trigger heartbeat ทันทีได้ด้วย:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

หากมีหลายเอเจนต์ที่กำหนดค่า `heartbeat` ไว้ การปลุกแบบแมนนวลจะรัน heartbeat ของเอเจนต์เหล่านั้นทั้งหมดทันที

ใช้ `--mode next-heartbeat` เพื่อรอ tick ตามกำหนดครั้งถัดไป

## การส่งมอบ reasoning (ไม่บังคับ)

โดยค่าเริ่มต้น heartbeat จะส่งมอบเฉพาะ payload “คำตอบ” สุดท้ายเท่านั้น

หากคุณต้องการความโปร่งใส ให้เปิดใช้:

- `agents.defaults.heartbeat.includeReasoning: true`

เมื่อเปิดใช้ heartbeat จะส่งข้อความแยกที่ขึ้นต้นด้วย
`Reasoning:` ด้วย (รูปแบบเดียวกับ `/reasoning on`) สิ่งนี้อาจมีประโยชน์เมื่อเอเจนต์
กำลังจัดการหลายเซสชัน/codexes และคุณต้องการเห็นเหตุผลว่าทำไมมันถึงตัดสินใจ ping
คุณ — แต่มันก็อาจเผยรายละเอียดภายในมากกว่าที่คุณต้องการได้เช่นกัน ควรปิดไว้
ในแชตกลุ่ม

## การตระหนักถึงต้นทุน

Heartbeat จะรัน agent turn แบบเต็ม ช่วงเวลาที่สั้นลงจะใช้ token มากขึ้น เพื่อลดต้นทุน:

- ใช้ `isolatedSession: true` เพื่อหลีกเลี่ยงการส่งประวัติการสนทนาทั้งหมด (~100K token ลดลงเหลือ ~2-5K ต่อการรัน)
- ใช้ `lightContext: true` เพื่อจำกัดไฟล์ bootstrap ให้เหลือเพียง `HEARTBEAT.md`
- ตั้ง `model` ที่ถูกกว่า (เช่น `ollama/llama3.2:1b`)
- ทำ `HEARTBEAT.md` ให้เล็ก
- ใช้ `target: "none"` หากคุณต้องการเพียงอัปเดตสถานะภายใน

## ที่เกี่ยวข้อง

- [ระบบอัตโนมัติและงาน](/th/automation) — ภาพรวมของกลไกระบบอัตโนมัติทั้งหมด
- [งานเบื้องหลัง](/th/automation/tasks) — วิธีติดตามงานแบบ detached
- [เขตเวลา](/th/concepts/timezone) — เขตเวลาส่งผลต่อการจัดตาราง heartbeat อย่างไร
- [การแก้ไขปัญหา](/th/automation/cron-jobs#troubleshooting) — การดีบักปัญหาระบบอัตโนมัติ
