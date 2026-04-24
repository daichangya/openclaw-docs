---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือ tail logs ของช่องทาง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, logs)
title: ช่องทาง
x-i18n:
    generated_at: "2026-04-24T09:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์ของช่องทางเหล่านั้นบน Gateway

เอกสารที่เกี่ยวข้อง:

- คู่มือช่องทาง: [ช่องทาง](/th/channels/index)
- การกำหนดค่า Gateway: [การกำหนดค่า](/th/gateway/configuration)

## คำสั่งที่ใช้บ่อย

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะเมื่อมี `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: เมื่อ gateway เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบ `probeAccount` และ `auditAccount` แบบไม่บังคับในแต่ละบัญชี ดังนั้นเอาต์พุตจึงอาจมีทั้งสถานะทรานสปอร์ตและผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หากเข้าถึง gateway ไม่ได้ `channels status` จะย้อนกลับไปใช้สรุปจาก config อย่างเดียวแทนเอาต์พุตจากการตรวจสอบแบบสด

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

เคล็ดลับ: `openclaw channels add --help` จะแสดงแฟลกเฉพาะแต่ละช่องทาง (token, private key, app token, signal-cli paths เป็นต้น)

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อย ได้แก่:

- ช่องทางแบบ bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์ทรานสปอร์ต Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนที่อิง env ของบัญชีเริ่มต้น เมื่อช่องทางนั้นรองรับ

เมื่อคุณรัน `openclaw channels add` โดยไม่ใส่แฟลก ตัวช่วยแบบโต้ตอบอาจถาม:

- account ids สำหรับแต่ละช่องทางที่เลือก
- display names แบบไม่บังคับสำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

หากคุณยืนยันให้ bind ทันที ตัวช่วยจะถามว่าเอเจนต์ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าแต่ละบัญชี และจะเขียน bindings การกำหนดเส้นทางที่ผูกกับบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันนี้ภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่บัญชีเริ่มต้นให้กับช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าระดับบนสุดที่ผูกกับบัญชีไปไว้ใน account map ของช่องทางนั้นก่อนจะเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านั้นไปไว้ที่ `channels.<channel>.accounts.default` แต่ช่องทางที่มาพร้อมระบบสามารถคงบัญชีที่ถูกยกระดับอยู่แล้วซึ่งตรงกันไว้ได้แทน ตัวอย่างปัจจุบันคือ Matrix: หากมีบัญชีที่ตั้งชื่อไว้หนึ่งบัญชีอยู่แล้ว หรือ `defaultAccount` ชี้ไปยังบัญชีที่ตั้งชื่อไว้ซึ่งมีอยู่ การยกระดับจะคงบัญชีนั้นไว้แทนที่จะสร้าง `accounts.default` ใหม่

ลักษณะการทำงานของการกำหนดเส้นทางยังคงสอดคล้องกัน:

- bindings เดิมที่อิงเฉพาะช่องทาง (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียน bindings ใหม่อัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่ม bindings ที่ผูกกับบัญชีแบบไม่บังคับได้

หาก config ของคุณอยู่ในสถานะแบบผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังมีค่าระดับบนสุดแบบบัญชีเดียวคงอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าที่ผูกกับบัญชีไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะย้ายไปที่ `accounts.default`; Matrix สามารถคงเป้าหมาย named/default ที่มีอยู่ได้แทน

## Login / logout (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

หมายเหตุ:

- `channels login` รองรับ `--verbose`
- `channels login` / `logout` สามารถอนุมานช่องทางได้เมื่อมีการกำหนดค่าเป้าหมาย login ที่รองรับไว้เพียงช่องทางเดียว

## การแก้ไขปัญหา

- รัน `openclaw status --deep` เพื่อการตรวจสอบแบบกว้าง
- ใช้ `openclaw doctor` เพื่อการแก้ไขแบบมีแนวทาง
- `openclaw channels list` แสดง `Claude: HTTP 403 ... user:profile` → snapshot การใช้งานต้องใช้ scope `user:profile` ใช้ `--no-usage` หรือให้คีย์ session ของ claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` จะย้อนกลับไปใช้สรุปจาก config อย่างเดียวเมื่อเข้าถึง gateway ไม่ได้ หากมีข้อมูลรับรองของช่องทางที่รองรับซึ่งกำหนดค่าไว้ผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน ระบบจะรายงานบัญชีนั้นว่าได้รับการกำหนดค่าแล้วพร้อมหมายเหตุ degraded แทนที่จะแสดงว่าไม่ได้กำหนดค่า

## การตรวจสอบ capabilities

ดึงคำแนะนำ capabilities ของ provider (intents/scopes เมื่อมี) พร้อมข้อมูลรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือกเสริม; หากไม่ระบุ ระบบจะแสดงทุกช่องทาง (รวมถึงส่วนขยาย)
- `--account` ใช้ได้เฉพาะร่วมกับ `--channel`
- `--target` รองรับ `channel:<id>` หรือ channel id แบบตัวเลขดิบ และใช้ได้กับ Discord เท่านั้น
- การตรวจสอบเป็นแบบเฉพาะ provider: Discord intents + สิทธิ์ของช่องแบบไม่บังคับ; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + Graph roles/scopes (มีคำอธิบายประกอบเมื่อทราบ) ช่องทางที่ไม่มี probes จะแสดง `Probe: unavailable`

## Resolve ชื่อเป็น IDs

Resolve ชื่อช่อง/ผู้ใช้เป็น IDs โดยใช้ไดเรกทอรีของ provider:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดของเป้าหมาย
- การ resolve จะให้ความสำคัญกับรายการที่ใช้งานอยู่เมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าไว้ผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะคืนผล unresolved แบบ degraded พร้อมหมายเหตุแทนที่จะยกเลิกทั้งการรัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมของช่องทาง](/th/channels)
