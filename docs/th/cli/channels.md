---
read_when:
    - คุณต้องการเพิ่ม/ลบบัญชีช่องทาง (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix)
    - คุณต้องการตรวจสอบสถานะช่องทางหรือดูบันทึกช่องทางแบบต่อท้าย
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw channels` (บัญชี, สถานะ, เข้าสู่ระบบ/ออกจากระบบ, บันทึก)
title: ช่องทาง
x-i18n:
    generated_at: "2026-04-26T12:24:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

จัดการบัญชีช่องทางแชตและสถานะรันไทม์ของช่องทางเหล่านั้นบน Gateway

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

## สถานะ / ความสามารถ / แก้ชื่อเป็น ID / บันทึก

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (ใช้ได้เฉพาะเมื่อมี `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` คือเส้นทางแบบสด: บน gateway ที่เข้าถึงได้ คำสั่งนี้จะเรียกใช้
`probeAccount` และการตรวจสอบ `auditAccount` ที่เป็นตัวเลือกสำหรับแต่ละบัญชี ดังนั้นผลลัพธ์อาจมี
สถานะของ transport พร้อมผลการตรวจสอบ เช่น `works`, `probe failed`, `audit ok` หรือ `audit failed`
หาก gateway ไม่สามารถเข้าถึงได้ `channels status` จะย้อนกลับไปใช้สรุปตาม config เท่านั้น
แทนผลลัพธ์จากการตรวจสอบแบบสด

## เพิ่ม / ลบบัญชี

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

เคล็ดลับ: `openclaw channels add --help` จะแสดงแฟล็กเฉพาะของแต่ละช่องทาง (token, private key, app token, signal-cli paths เป็นต้น)

พื้นผิวการเพิ่มแบบไม่โต้ตอบที่พบบ่อยประกอบด้วย:

- ช่องทางแบบ bot-token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- ฟิลด์ transport ของ Signal/iMessage: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- ฟิลด์ของ Google Chat: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- ฟิลด์ของ Matrix: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- ฟิลด์ของ Nostr: `--private-key`, `--relay-urls`
- ฟิลด์ของ Tlon: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` สำหรับการยืนยันตัวตนบัญชีเริ่มต้นที่อิง env ในกรณีที่รองรับ

หาก Plugin ของช่องทางต้องได้รับการติดตั้งระหว่างคำสั่งเพิ่มที่ขับเคลื่อนด้วยแฟล็ก OpenClaw จะใช้แหล่งติดตั้งเริ่มต้นของช่องทางนั้นโดยไม่เปิดพรอมป์ต์ติดตั้ง Plugin แบบโต้ตอบ

เมื่อคุณเรียกใช้ `openclaw channels add` โดยไม่ใส่แฟล็ก วิซาร์ดแบบโต้ตอบอาจถามข้อมูลต่อไปนี้:

- ID บัญชีสำหรับแต่ละช่องทางที่เลือก
- ชื่อที่ใช้แสดงผลซึ่งเป็นตัวเลือกสำหรับบัญชีเหล่านั้น
- `Bind configured channel accounts to agents now?`

หากคุณยืนยันที่จะ bind ทันที วิซาร์ดจะถามว่า agent ใดควรเป็นเจ้าของบัญชีช่องทางที่กำหนดค่าไว้แต่ละบัญชี และจะเขียนการ bind เส้นทางแบบกำหนดขอบเขตต่อบัญชี

คุณยังสามารถจัดการกฎการกำหนดเส้นทางเดียวกันนี้ในภายหลังได้ด้วย `openclaw agents bindings`, `openclaw agents bind` และ `openclaw agents unbind` (ดู [agents](/th/cli/agents))

เมื่อคุณเพิ่มบัญชีที่ไม่ใช่บัญชีเริ่มต้นให้กับช่องทางที่ยังใช้การตั้งค่าระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าระดับบนสุดที่กำหนดขอบเขตต่อบัญชีไปไว้ในแผนที่บัญชีของช่องทางนั้นก่อนเขียนบัญชีใหม่ สำหรับช่องทางส่วนใหญ่ ค่าเหล่านั้นจะอยู่ใน `channels.<channel>.accounts.default` แต่ช่องทางที่มาพร้อมระบบสามารถคงบัญชีที่ถูกยกระดับซึ่งตรงกันและมีอยู่เดิมไว้ได้แทน Matrix เป็นตัวอย่างปัจจุบัน: หากมีบัญชีที่มีชื่ออยู่แล้วหนึ่งบัญชี หรือ `defaultAccount` ชี้ไปยังบัญชีที่มีชื่อซึ่งมีอยู่แล้ว การยกระดับจะคงบัญชีนั้นไว้แทนการสร้าง `accounts.default` ใหม่

พฤติกรรมการกำหนดเส้นทางยังคงสอดคล้องกัน:

- การ bind แบบอิงช่องทางอย่างเดียวที่มีอยู่เดิม (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น
- `channels add` จะไม่สร้างหรือเขียนทับการ bind โดยอัตโนมัติในโหมดไม่โต้ตอบ
- การตั้งค่าแบบโต้ตอบสามารถเพิ่มการ bind แบบกำหนดขอบเขตต่อบัญชีได้ตามต้องการ

หาก config ของคุณอยู่ในสถานะผสมอยู่แล้ว (มีบัญชีที่ตั้งชื่อไว้ และยังมีค่าระดับบนสุดแบบบัญชีเดียวถูกตั้งค่าอยู่) ให้รัน `openclaw doctor --fix` เพื่อย้ายค่าที่กำหนดขอบเขตต่อบัญชีไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น สำหรับช่องทางส่วนใหญ่จะยกระดับไปยัง `accounts.default`; ส่วน Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่มีอยู่เดิมไว้ได้แทน

## เข้าสู่ระบบ / ออกจากระบบ (แบบโต้ตอบ)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

หมายเหตุ:

- `channels login` รองรับ `--verbose`
- `channels login` / `logout` สามารถอนุมานช่องทางได้เมื่อมีการกำหนดค่าเป้าหมายการเข้าสู่ระบบที่รองรับไว้เพียงรายการเดียว

## การแก้ปัญหา

- รัน `openclaw status --deep` เพื่อทำการตรวจสอบแบบครอบคลุม
- ใช้ `openclaw doctor` สำหรับการแก้ไขแบบมีคำแนะนำ
- `openclaw channels list` แสดง `Claude: HTTP 403 ... user:profile` → สแนปช็อตการใช้งานต้องใช้ scope `user:profile` ใช้ `--no-usage` หรือระบุคีย์เซสชัน claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) หรือยืนยันตัวตนใหม่ผ่าน Claude CLI
- `openclaw channels status` จะย้อนกลับไปใช้สรุปตาม config เท่านั้นเมื่อ gateway ไม่สามารถเข้าถึงได้ หากมีการกำหนดค่าข้อมูลรับรองของช่องทางที่รองรับผ่าน SecretRef แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน ระบบจะรายงานบัญชีนั้นว่าได้รับการกำหนดค่าแล้วพร้อมหมายเหตุสถานะลดทอน แทนการแสดงว่าไม่ได้กำหนดค่า

## การตรวจสอบความสามารถ

ดึงคำใบ้ความสามารถของผู้ให้บริการ (intents/scopes หากมี) พร้อมการรองรับฟีเจอร์แบบคงที่:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

หมายเหตุ:

- `--channel` เป็นตัวเลือก; ไม่ต้องระบุหากต้องการแสดงทุกช่องทาง (รวมถึงส่วนขยาย)
- `--account` ใช้ได้เฉพาะเมื่อมี `--channel`
- `--target` รับ `channel:<id>` หรือ ID ช่องทางแบบตัวเลขล้วน และใช้ได้กับ Discord เท่านั้น
- การตรวจสอบขึ้นอยู่กับผู้ให้บริการ: Discord intents + สิทธิ์ของช่องทางแบบตัวเลือก; Slack bot + user scopes; Telegram bot flags + webhook; Signal daemon version; Microsoft Teams app token + Graph roles/scopes (มีคำอธิบายกำกับในกรณีที่ทราบ) ช่องทางที่ไม่มีการตรวจสอบจะแสดง `Probe: unavailable`

## แก้ชื่อเป็น ID

แปลงชื่อช่องทาง/ผู้ใช้เป็น ID โดยใช้ไดเรกทอรีของผู้ให้บริการ:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

หมายเหตุ:

- ใช้ `--kind user|group|auto` เพื่อบังคับชนิดของเป้าหมาย
- การแปลงจะให้ความสำคัญกับรายการที่ยังใช้งานอยู่เมื่อมีหลายรายการใช้ชื่อเดียวกัน
- `channels resolve` เป็นแบบอ่านอย่างเดียว หากบัญชีที่เลือกถูกกำหนดค่าผ่าน SecretRef แต่ข้อมูลรับรองนั้นไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน คำสั่งจะส่งคืนผลลัพธ์ที่ไม่สามารถแปลงได้แบบลดทอนพร้อมหมายเหตุ แทนการยกเลิกทั้งการทำงาน

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [ภาพรวม Channels](/th/channels)
