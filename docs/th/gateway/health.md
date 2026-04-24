---
read_when:
    - การวินิจฉัยการเชื่อมต่อของช่องทางหรือสถานะสุขภาพของ gateway
    - การทำความเข้าใจคำสั่งและตัวเลือก CLI สำหรับการตรวจสอบสถานะสุขภาพ
summary: คำสั่งตรวจสอบสถานะสุขภาพและการเฝ้าติดตามสุขภาพของ gateway
title: การตรวจสอบสถานะสุขภาพ
x-i18n:
    generated_at: "2026-04-24T09:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08278ff0079102459c4d9141dc2e8d89e731de1fc84487f6baa620aaf7c119b4
    source_path: gateway/health.md
    workflow: 15
---

# การตรวจสอบสถานะสุขภาพ (CLI)

คู่มือสั้นสำหรับตรวจสอบการเชื่อมต่อของช่องทางโดยไม่ต้องเดา

## การตรวจสอบแบบรวดเร็ว

- `openclaw status` — สรุปในเครื่อง: การเข้าถึงได้/โหมดของ gateway, คำแนะนำการอัปเดต, อายุ auth ของช่องทางที่ลิงก์ไว้, เซสชัน + กิจกรรมล่าสุด
- `openclaw status --all` — การวินิจฉัยในเครื่องแบบเต็ม (อ่านอย่างเดียว, มีสี, ปลอดภัยที่จะนำไปวางเพื่อการดีบัก)
- `openclaw status --deep` — ขอ live health probe จาก gateway ที่กำลังรันอยู่ (`health` พร้อม `probe:true`) รวมถึง per-account channel probes เมื่อรองรับ
- `openclaw health` — ขอ health snapshot จาก gateway ที่กำลังรันอยู่ (เฉพาะ WS; CLI จะไม่เปิด channel socket โดยตรง)
- `openclaw health --verbose` — บังคับ live health probe และพิมพ์รายละเอียดการเชื่อมต่อของ gateway
- `openclaw health --json` — เอาต์พุต health snapshot แบบที่เครื่องอ่านได้
- ส่ง `/status` เป็นข้อความเดี่ยวใน WhatsApp/WebChat เพื่อรับคำตอบสถานะโดยไม่เรียกเอเจนต์
- Log: tail `/tmp/openclaw/openclaw-*.log` แล้วกรองหา `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`

## การวินิจฉัยเชิงลึก

- ข้อมูลรับรองบนดิสก์: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime` ควรเป็นเวลาล่าสุด)
- ที่เก็บเซสชัน: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (พาธสามารถ override ได้ใน config) จำนวนและผู้รับล่าสุดจะแสดงผ่าน `status`
- โฟลว์การลิงก์ใหม่: `openclaw channels logout && openclaw channels login --verbose` เมื่อมีรหัสสถานะ 409–515 หรือ `loggedOut` ปรากฏใน log (หมายเหตุ: โฟลว์ login แบบ QR จะรีสตาร์ทอัตโนมัติหนึ่งครั้งสำหรับสถานะ 515 หลังการจับคู่)
- Diagnostics เปิดใช้อยู่โดยค่าเริ่มต้น gateway จะบันทึกข้อเท็จจริงด้านการปฏิบัติการ เว้นแต่จะตั้งค่า `diagnostics.enabled: false` อีเวนต์ของ Memory จะบันทึกจำนวนไบต์ของ RSS/heap, แรงกดดันตาม threshold และแรงกดดันจากการเติบโต อีเวนต์ของ payload ขนาดเกินจะบันทึกสิ่งที่ถูกปฏิเสธ ถูกตัดทอน หรือถูกแบ่ง พร้อมขนาดและข้อจำกัดเมื่อมีให้ใช้ โดยจะไม่บันทึกข้อความของข้อความ เนื้อหาไฟล์แนบ เนื้อหา Webhook เนื้อหา request หรือ response แบบดิบ โทเค็น คุกกี้ หรือค่าความลับ Heartbeat เดียวกันนี้จะเริ่ม bounded stability recorder ซึ่งใช้งานได้ผ่าน `openclaw gateway stability` หรือ Gateway RPC `diagnostics.stability` การออกจาก Gateway แบบร้ายแรง การหมดเวลาระหว่างปิดระบบ และความล้มเหลวในการเริ่มต้นใหม่ จะคง snapshot ล่าสุดของ recorder ไว้ใต้ `~/.openclaw/logs/stability/` เมื่อมีอีเวนต์; ตรวจสอบ bundle ที่บันทึกล่าสุดได้ด้วย `openclaw gateway stability --bundle latest`
- สำหรับรายงานบั๊ก ให้รัน `openclaw gateway diagnostics export` แล้วแนบไฟล์ zip ที่สร้างขึ้น การ export จะรวมสรุป Markdown, stability bundle ล่าสุด, เมทาดาทา log ที่ผ่านการทำให้ปลอดภัย, snapshot ของสถานะ/สุขภาพ Gateway ที่ผ่านการทำให้ปลอดภัย และรูปทรงของ config โดยมีจุดประสงค์เพื่อให้แชร์ได้: ข้อความแชต, เนื้อหา Webhook, เอาต์พุตของเครื่องมือ, ข้อมูลรับรอง, คุกกี้, ตัวระบุบัญชี/ข้อความ และค่าความลับ จะถูกละเว้นหรือปกปิด ดู [Diagnostics Export](/th/gateway/diagnostics)

## config ของ health monitor

- `gateway.channelHealthCheckMinutes`: ความถี่ที่ gateway ตรวจสอบสุขภาพของช่องทาง ค่าเริ่มต้น: `5` ตั้งค่าเป็น `0` เพื่อปิด health-monitor restarts แบบโกลบอล
- `gateway.channelStaleEventThresholdMinutes`: ระยะเวลาที่ช่องทางที่เชื่อมต่ออยู่สามารถว่างงานได้ก่อนที่ health monitor จะมองว่า stale และรีสตาร์ท ค่าเริ่มต้น: `30` ควรตั้งให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes`
- `gateway.channelMaxRestartsPerHour`: ขีดจำกัดแบบ rolling หนึ่งชั่วโมงสำหรับการรีสตาร์ทโดย health-monitor ต่อช่องทาง/บัญชี ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: ปิด health-monitor restarts สำหรับช่องทางเฉพาะ โดยยังคงเปิดการเฝ้าติดตามแบบโกลบอลไว้
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override แบบหลายบัญชี ซึ่งมีลำดับความสำคัญเหนือการตั้งค่าระดับช่องทาง
- override ต่อช่องทางเหล่านี้ใช้กับ built-in channel monitors ที่เปิดเผยความสามารถนี้อยู่ในปัจจุบัน: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram และ WhatsApp

## เมื่อมีบางอย่างล้มเหลว

- `logged out` หรือสถานะ 409–515 → ลิงก์ใหม่ด้วย `openclaw channels logout` แล้ว `openclaw channels login`
- Gateway เข้าถึงไม่ได้ → เริ่มมันด้วย: `openclaw gateway --port 18789` (ใช้ `--force` หากพอร์ตไม่ว่าง)
- ไม่มีข้อความขาเข้า → ยืนยันว่าโทรศัพท์ที่ลิงก์ไว้ยังออนไลน์ และผู้ส่งได้รับอนุญาต (`channels.whatsapp.allowFrom`); สำหรับแชตกลุ่ม ให้ตรวจสอบว่า allowlist + กฎการกล่าวถึงตรงกัน (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`)

## คำสั่ง "health" โดยเฉพาะ

`openclaw health` จะขอ health snapshot จาก gateway ที่กำลังรันอยู่ (CLI จะไม่เปิด channel
socket โดยตรง) โดยค่าเริ่มต้นมันสามารถส่งกลับ snapshot ของ gateway ที่แคชไว้และยังใหม่ได้; จากนั้น
gateway จะรีเฟรชแคชนั้นในเบื้องหลัง `openclaw health --verbose` จะบังคับ
ให้ probe แบบ live แทน คำสั่งนี้จะรายงานอายุ creds/auth ที่ลิงก์ไว้เมื่อมีให้ใช้
สรุป probe ต่อช่องทาง สรุปที่เก็บเซสชัน และระยะเวลาการ probe โดยจะออกด้วย
สถานะไม่เป็นศูนย์หาก gateway เข้าถึงไม่ได้ หรือ probe ล้มเหลว/หมดเวลา

ตัวเลือก:

- `--json`: เอาต์พุต JSON แบบที่เครื่องอ่านได้
- `--timeout <ms>`: override ระยะหมดเวลาเริ่มต้นของ probe ที่ 10 วินาที
- `--verbose`: บังคับ live probe และพิมพ์รายละเอียดการเชื่อมต่อของ gateway
- `--debug`: ชื่อเรียกแทนของ `--verbose`

health snapshot ประกอบด้วย: `ok` (boolean), `ts` (timestamp), `durationMs` (เวลา probe), สถานะต่อช่องทาง ความพร้อมใช้งานของเอเจนต์ และสรุปที่เก็บเซสชัน

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
- [การ export diagnostics](/th/gateway/diagnostics)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
