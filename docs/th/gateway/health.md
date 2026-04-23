---
read_when:
    - การวินิจฉัยการเชื่อมต่อของ channel หรือสุขภาพของ Gateway
    - การทำความเข้าใจคำสั่ง CLI และตัวเลือกของการตรวจสอบสถานะสุขภาพ
summary: คำสั่งตรวจสอบสถานะและการเฝ้าติดตามสุขภาพของ Gateway
title: การตรวจสอบสถานะสุขภาพ
x-i18n:
    generated_at: "2026-04-23T05:33:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5ddcbe6fa913c5ba889f78cb417124c96b562cf8939410b1d6f66042dfb51a9f
    source_path: gateway/health.md
    workflow: 15
---

# การตรวจสอบสถานะสุขภาพ (CLI)

คู่มือสั้นๆ สำหรับยืนยันการเชื่อมต่อของ channel โดยไม่ต้องเดาสุ่ม

## การตรวจสอบแบบรวดเร็ว

- `openclaw status` — สรุปภายในเครื่อง: การเข้าถึงได้/โหมดของ gateway, คำแนะนำการอัปเดต, อายุ auth ของ channel ที่เชื่อมโยงไว้, เซสชัน + กิจกรรมล่าสุด
- `openclaw status --all` — การวินิจฉัยภายในเครื่องแบบเต็ม (อ่านอย่างเดียว, มีสี, ปลอดภัยสำหรับคัดลอกไปใช้ดีบัก)
- `openclaw status --deep` — ขอ live health probe จาก gateway ที่กำลังรันอยู่ (`health` พร้อม `probe:true`) รวมถึง per-account channel probes เมื่อรองรับ
- `openclaw health` — ขอ health snapshot จาก gateway ที่กำลังรันอยู่ (WS เท่านั้น; CLI จะไม่เปิด direct channel sockets เอง)
- `openclaw health --verbose` — บังคับให้ทำ live health probe และพิมพ์รายละเอียดการเชื่อมต่อของ gateway
- `openclaw health --json` — เอาต์พุต health snapshot แบบ machine-readable
- ส่ง `/status` เป็นข้อความเดี่ยวใน WhatsApp/WebChat เพื่อรับการตอบกลับสถานะโดยไม่เรียกใช้เอเจนต์
- Logs: tail `/tmp/openclaw/openclaw-*.log` แล้วกรองหา `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`

## การวินิจฉัยเชิงลึก

- ข้อมูลรับรองบนดิสก์: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` ควรเป็นค่าล่าสุด)
- ที่เก็บเซสชัน: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (พาธนี้อาจถูก override ได้ใน config) จำนวนและผู้รับล่าสุดจะแสดงผ่าน `status`
- โฟลว์เชื่อมโยงใหม่: `openclaw channels logout && openclaw channels login --verbose` เมื่อมี status code 409–515 หรือ `loggedOut` ปรากฏใน logs (หมายเหตุ: โฟลว์ล็อกอินด้วย QR จะรีสตาร์ตอัตโนมัติหนึ่งครั้งสำหรับสถานะ 515 หลัง pairing)
- การวินิจฉัยเปิดใช้งานอยู่โดยค่าเริ่มต้น gateway จะบันทึกข้อเท็จจริงด้านการปฏิบัติงาน เว้นแต่จะตั้ง `diagnostics.enabled: false` เหตุการณ์ด้านหน่วยความจำจะบันทึกจำนวนไบต์ของ RSS/heap, threshold pressure และ growth pressure เหตุการณ์ payload ขนาดใหญ่เกินจะบันทึกสิ่งที่ถูกปฏิเสธ ถูกตัดทอน หรือถูกแบ่ง chunk พร้อมขนาดและขีดจำกัดเมื่อมีให้ใช้ โดยจะไม่บันทึกข้อความ, เนื้อหาไฟล์แนบ, webhook body, raw request หรือ response body, tokens, cookies หรือค่าความลับ Heartbeat เดียวกันนี้จะเริ่ม bounded stability recorder ซึ่งเข้าถึงได้ผ่าน `openclaw gateway stability` หรือ Gateway RPC `diagnostics.stability` การออกจาก Gateway แบบ fatal, timeout ตอน shutdown และความล้มเหลวระหว่าง startup หลังรีสตาร์ต จะจัดเก็บ snapshot ล่าสุดของ recorder ไว้ภายใต้ `~/.openclaw/logs/stability/` เมื่อมีเหตุการณ์เกิดขึ้น; ตรวจสอบ bundle ล่าสุดที่บันทึกไว้ด้วย `openclaw gateway stability --bundle latest`
- สำหรับรายงานบั๊ก ให้รัน `openclaw gateway diagnostics export` แล้วแนบ zip ที่สร้างขึ้นมา การ export นี้จะรวมสรุปแบบ Markdown, stability bundle ล่าสุด, ข้อมูลเมตา log ที่ผ่านการทำให้ปลอดภัย, Gateway status/health snapshots ที่ผ่านการทำให้ปลอดภัย และรูปทรงของ config ไว้ด้วย โดยออกแบบมาเพื่อการแชร์: ข้อความแชต, webhook bodies, ผลลัพธ์ของเครื่องมือ, ข้อมูลรับรอง, cookies, ตัวระบุบัญชี/ข้อความ และค่าความลับจะถูกละไว้หรือปกปิด

## การกำหนดค่า health monitor

- `gateway.channelHealthCheckMinutes`: ความถี่ที่ gateway ใช้ตรวจสุขภาพของ channel ค่าเริ่มต้น: `5` ตั้งเป็น `0` เพื่อปิดการรีสตาร์ตจาก health monitor ทั้งระบบ
- `gateway.channelStaleEventThresholdMinutes`: ระยะเวลาที่ channel ที่เชื่อมต่ออยู่สามารถนิ่งอยู่ได้ก่อนที่ health monitor จะมองว่า stale และรีสตาร์ต ค่าเริ่มต้น: `30` ควรกำหนดให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes`
- `gateway.channelMaxRestartsPerHour`: ขีดจำกัดแบบ rolling หนึ่งชั่วโมงสำหรับจำนวนการรีสตาร์ตต่อ channel/account จาก health monitor ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ปิดการรีสตาร์ตจาก health monitor สำหรับ channel เฉพาะ โดยยังคงเปิดการตรวจสอบระดับ global ไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override แบบหลายบัญชีที่มีผลเหนือการตั้งค่าระดับ channel
- overrides ระดับต่อ channel เหล่านี้มีผลกับ built-in channel monitors ที่เปิดให้ใช้ในตอนนี้: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram และ WhatsApp

## เมื่อมีบางอย่างล้มเหลว

- `logged out` หรือสถานะ 409–515 → เชื่อมโยงใหม่ด้วย `openclaw channels logout` แล้ว `openclaw channels login`
- เข้าถึง Gateway ไม่ได้ → เริ่มมันด้วย: `openclaw gateway --port 18789` (ใช้ `--force` หากพอร์ตถูกใช้งานอยู่)
- ไม่มีข้อความขาเข้า → ยืนยันว่าโทรศัพท์ที่เชื่อมโยงออนไลน์อยู่และผู้ส่งได้รับอนุญาต (`channels.whatsapp.allowFrom`); สำหรับแชตกลุ่ม ให้ตรวจสอบว่า allowlist + กฎ mention ตรงกัน (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## คำสั่ง "health" โดยเฉพาะ

`openclaw health` จะขอ health snapshot จาก gateway ที่กำลังรันอยู่ (CLI
จะไม่เปิด direct channel sockets เอง) โดยค่าเริ่มต้นมันสามารถคืนค่า cached gateway snapshot
ที่ยังใหม่ได้; จากนั้น gateway จะรีเฟรช cache นั้นในเบื้องหลัง `openclaw health --verbose` จะบังคับ
ให้ทำ live probe แทน คำสั่งนี้จะรายงาน linked creds/auth age เมื่อมีให้ใช้,
สรุปการ probe ต่อ channel, สรุป session-store และระยะเวลาของ probe คำสั่งจะออกด้วย
สถานะไม่เป็นศูนย์หากเข้าถึง gateway ไม่ได้ หรือ probe ล้มเหลว/หมดเวลา

ตัวเลือก:

- `--json`: เอาต์พุต JSON แบบ machine-readable
- `--timeout <ms>`: override ค่า probe timeout เริ่มต้น 10 วินาที
- `--verbose`: บังคับให้ทำ live probe และพิมพ์รายละเอียดการเชื่อมต่อของ gateway
- `--debug`: alias ของ `--verbose`

health snapshot ประกอบด้วย: `ok` (boolean), `ts` (timestamp), `durationMs` (เวลา probe), สถานะต่อ channel, ความพร้อมใช้งานของเอเจนต์ และสรุป session-store
