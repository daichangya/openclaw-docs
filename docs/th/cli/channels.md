---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทาง หรือดูบันทึกช่องทางแบบต่อเนื่อง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-04-23T06:17:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์ของบัญชีเหล่านั้นบน Gateway

เอกสารที่เกี่ยวข้อง:

- คู่มือช่องทาง: [Channels](/th/channels/index)
- การกำหนดค่า Gateway: [Configuration](/th/gateway/configuration)

## คำสั่งที่ใช้บ่อย

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## สถานะ / ความสามารถ / การแก้ชื่อเป็นรหัส / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะกับ `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` เป็นเส้นทางแบบสด: เมื่อเข้าถึง gateway ได้ คำสั่งนี้จะรันการตรวจสอบ `probeAccount` และ `auditAccount` แบบไม่บังคับสำหรับแต่ละบัญชี ดังนั้นผลลัพธ์อาจมีทั้งสถานะของการขนส่งข้อมูลและผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หากไม่สามารถเข้าถึง gateway ได้ `channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้น แทนการแสดงผลการตรวจสอบแบบสด

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

เคล็ดลับ: `openclaw channels add --help` จะแสดงแฟล็กเฉพาะของแต่ละช่องทาง (token, private key, app token, signal-cli paths ฯลฯ)

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อยประกอบด้วย:

- ช่องทาง bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์การขนส่งของ Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ของ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ของ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ของ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ของ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนแบบอิง env ของบัญชีเริ่มต้นในกรณีที่รองรับ

เมื่อคุณรัน `openclaw channels add` โดยไม่ระบุแฟล็ก วิซาร์ดแบบโต้ตอบอาจถามเกี่ยวกับ:

- รหัสบัญชีสำหรับแต่ละช่องทางที่เลือก
- ชื่อที่แสดงผลแบบไม่บังคับสำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

หากคุณยืนยันให้ bind ทันที วิซาร์ดจะถามว่า agent ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าไว้แต่ละบัญชี และจะเขียนการ bind เส้นทางแบบกำหนดขอบเขตตามบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันนี้ภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่บัญชีเริ่มต้นให้กับช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนสุดที่กำหนดขอบเขตตามบัญชีเข้าไปในแผนที่บัญชีของช่องทางนั้นก่อน แล้วจึงเขียนบัญชีใหม่ ช่องทางส่วนใหญ่จะวางค่าเหล่านั้นไว้ใน `channels.<channel>.accounts.default` แต่ช่องทางที่มากับระบบสามารถคงบัญชีที่เลื่อนขึ้นมาซึ่งตรงกันและมีอยู่แล้วไว้แทนได้ Matrix เป็นตัวอย่างในปัจจุบัน: หากมีบัญชีที่มีชื่ออยู่แล้วหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังบัญชีที่มีชื่ออยู่แล้ว การเลื่อนค่าขึ้นจะคงบัญชีนั้นไว้แทนที่จะสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้องกัน:

- การ bind แบบอิงเฉพาะช่องทางที่มีอยู่เดิม (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนทับการ bind โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการ bind แบบกำหนดขอบเขตตามบัญชีได้ตามตัวเลือก

หากการกำหนดค่าของคุณอยู่ในสถานะแบบผสมอยู่แล้ว (มีบัญชีที่มีชื่ออยู่ และยังตั้งค่าระดับบนสุดแบบบัญชีเดียวไว้อยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าที่กำหนดขอบเขตตามบัญชีไปยังบัญชีที่ถูกเลื่อนขึ้นซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่จะเลื่อนเข้าไปใน `accounts.default`; Matrix อาจคงเป้าหมายที่มีชื่ออยู่แล้ว/ค่าเริ่มต้นไว้แทน

## เข้าสู่ระบบ / ออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

หมายเหตุ:

- `channels login` รองรับ `--verbose`
- `channels login` / `logout` สามารถอนุมานช่องทางได้เมื่อมีการกำหนดค่าเป้าหมายการเข้าสู่ระบบที่รองรับไว้เพียงรายการเดียว

## การแก้ปัญหา

- รัน `openclaw status --deep` เพื่อทำการตรวจสอบแบบกว้าง
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` แสดง `Claude: HTTP 403 ... user:profile` → สแนปช็อตการใช้งานต้องการ scope `user:profile` ใช้ `--no-usage` หรือระบุคีย์เซสชัน claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` จะถอยกลับไปใช้สรุปจากการกำหนดค่าเท่านั้นเมื่อไม่สามารถเข้าถึง gateway ได้ หากมีการกำหนดค่าข้อมูลรับรองของช่องทางที่รองรับผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน ระบบจะรายงานบัญชีนั้นว่าได้รับการกำหนดค่าแล้วพร้อมหมายเหตุเกี่ยวกับสภาวะ degraded แทนที่จะแสดงว่าไม่ได้กำหนดค่า

## การตรวจสอบความสามารถ

ดึงคำใบ้เกี่ยวกับความสามารถของผู้ให้บริการ (intents/scopes หากมี) พร้อมกับการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือกเสริม; หากไม่ระบุ ระบบจะแสดงทุกช่องทาง (รวมถึง extensions)
- `--account` ใช้ได้เฉพาะร่วมกับ `--channel`
- `--target` รับค่าเป็น `channel:<id>` หรือรหัส channel แบบตัวเลขล้วน และใช้ได้กับ Discord เท่านั้น
- การตรวจสอบขึ้นอยู่กับผู้ให้บริการ: Discord intents + สิทธิ์ของช่องทางแบบไม่บังคับ; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + Graph roles/scopes (มีคำอธิบายประกอบเมื่อทราบข้อมูล) ช่องทางที่ไม่มีการตรวจสอบจะแสดง `Probe: unavailable`

## แก้ชื่อเป็นรหัส ID

แก้ชื่อช่องทาง/ผู้ใช้ให้เป็นรหัส ID โดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดของเป้าหมาย
- การแก้ชื่อจะให้ความสำคัญกับรายการที่ใช้งานอยู่เมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกได้รับการกำหนดค่าผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะส่งคืนผลลัพธ์ที่ยังแก้ชื่อไม่ได้แบบ degraded พร้อมหมายเหตุ แทนที่จะยกเลิกการทำงานทั้งหมด
