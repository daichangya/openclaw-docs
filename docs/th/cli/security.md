---
read_when:
    - คุณต้องการรันการตรวจสอบความปลอดภัยอย่างรวดเร็วกับ config/สถานะ
    - คุณต้องการปรับใช้คำแนะนำ “แก้ไข” ที่ปลอดภัย (สิทธิ์, ทำให้ค่าเริ่มต้นเข้มงวดยิ่งขึ้น)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขข้อผิดพลาดด้านความปลอดภัยที่พบบ่อย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-04-23T06:19:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

เครื่องมือด้านความปลอดภัย (ตรวจสอบ + แก้ไขเพิ่มเติมตามตัวเลือก)

ที่เกี่ยวข้อง:

- คู่มือความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## การตรวจสอบ

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

การตรวจสอบจะเตือนเมื่อมีผู้ส่ง DM หลายรายใช้เซสชันหลักร่วมกัน และแนะนำให้ใช้ **โหมด DM ที่ปลอดภัย**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับช่องทางหลายบัญชี) สำหรับกล่องข้อความที่ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเสริมความปลอดภัยให้กับกล่องข้อความแบบร่วมมือกัน/ใช้ร่วมกัน การใช้ Gateway เดียวร่วมกันโดยผู้ปฏิบัติงานหลายคนที่ไม่ไว้วางใจกันหรือเป็นปฏิปักษ์กันไม่ใช่การตั้งค่าที่แนะนำ; ควรแยกขอบเขตความไว้วางใจด้วย gateway แยกกัน (หรือแยกผู้ใช้ระบบปฏิบัติการ/โฮสต์กัน)
นอกจากนี้ยังแสดง `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ว่ามี ingress แบบผู้ใช้ร่วมกันที่น่าจะเป็นไปได้ (เช่น นโยบาย DM/กลุ่มแบบเปิด เป้าหมายกลุ่มที่กำหนดค่าไว้ หรือกฎผู้ส่งแบบ wildcard) และเตือนว่าโดยค่าเริ่มต้น OpenClaw ใช้โมเดลความไว้วางใจแบบผู้ช่วยส่วนบุคคล
สำหรับการตั้งค่าแบบผู้ใช้ร่วมกันที่ตั้งใจไว้ แนวทางจากการตรวจสอบคือให้ sandbox ทุกเซสชัน จำกัดการเข้าถึงระบบไฟล์ให้อยู่ในขอบเขตเวิร์กสเปซ และอย่าเก็บตัวตนหรือข้อมูลรับรองส่วนตัว/ส่วนบุคคลไว้ในรันไทม์นั้น
นอกจากนี้ยังเตือนเมื่อมีการใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandbox และเปิดใช้เครื่องมือเว็บ/เบราว์เซอร์อยู่
สำหรับ webhook ingress จะเตือนเมื่อ `hooks.token` ใช้ซ้ำกับ Gateway token, เมื่อ `hooks.token` สั้น, เมื่อ `hooks.path="/"`, เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey`, เมื่อ `hooks.allowedAgentIds` ไม่ได้จำกัด, เมื่อเปิดใช้การ override `sessionKey` ของคำขอ, และเมื่อเปิดใช้ override โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อมีการกำหนดค่า sandbox Docker ขณะที่โหมด sandbox ปิดอยู่, เมื่อ `gateway.nodes.denyCommands` ใช้รายการแบบคล้ายแพตเทิร์น/ไม่รู้จักที่ไม่มีผล (จับคู่เฉพาะชื่อคำสั่งของ Node แบบตรงตัวเท่านั้น ไม่ใช่การกรองข้อความเชลล์), เมื่อ `gateway.nodes.allowCommands` เปิดใช้คำสั่ง Node ที่อันตรายอย่างชัดเจน, เมื่อ `tools.profile="minimal"` แบบ global ถูก override โดยโปรไฟล์เครื่องมือของเอเจนต์, เมื่อกลุ่มแบบเปิดเปิดเผยเครื่องมือรันไทม์/ระบบไฟล์โดยไม่มีตัวป้องกัน sandbox/เวิร์กสเปซ, และเมื่อเครื่องมือ Plugin ส่วนขยายที่ติดตั้งไว้สามารถเข้าถึงได้ภายใต้นโยบายเครื่องมือแบบผ่อนปรน
นอกจากนี้ยังแจ้งเตือน `gateway.allowRealIpFallback=true` (ความเสี่ยงจากการปลอมแปลง header หากกำหนดค่า proxy ผิด) และ `discovery.mdns.mode="full"` (การรั่วไหลของข้อมูลเมตาผ่านระเบียน mDNS TXT)
นอกจากนี้ยังเตือนเมื่อเบราว์เซอร์ sandbox ใช้เครือข่าย Docker แบบ `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
นอกจากนี้ยังแจ้งเตือนโหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการเข้าร่วม namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อคอนเทนเนอร์ Docker ของเบราว์เซอร์ sandbox ที่มีอยู่มีป้ายกำกับแฮชหายไป/ล้าสมัย (เช่น คอนเทนเนอร์ก่อนการย้ายข้อมูลที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำให้ใช้ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อบันทึกการติดตั้ง Plugin/hook แบบอิง npm ไม่ได้ pin เวอร์ชัน ไม่มีข้อมูลเมตา integrity หรือคลาดเคลื่อนจากเวอร์ชันแพ็กเกจที่ติดตั้งอยู่ในปัจจุบัน
จะเตือนเมื่อ allowlist ของช่องทางอาศัยชื่อ/อีเมล/แท็กที่เปลี่ยนแปลงได้แทน ID แบบคงที่ (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, ขอบเขต IRC ตามที่ใช้ได้)
จะเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ API HTTP ของ Gateway เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึงปลายทาง `/v1/*` ใดๆ ที่เปิดใช้งาน)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` เป็นการ override แบบ break-glass ที่ผู้ปฏิบัติงานเปิดใช้โดยชัดแจ้ง; การเปิดใช้สิ่งเหล่านี้เพียงอย่างเดียวไม่ถือเป็นรายงานช่องโหว่ด้านความปลอดภัย
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด โปรดดูส่วน "Insecure or dangerous flags summary" ใน [ความปลอดภัย](/th/gateway/security)

พฤติกรรมของ SecretRef:

- `security audit` จะ resolve SecretRef ที่รองรับในโหมดอ่านอย่างเดียวสำหรับพาธเป้าหมายของมัน
- หาก SecretRef ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน การตรวจสอบจะดำเนินต่อไปและรายงาน `secretDiagnostics` (แทนที่จะล่ม)
- `--token` และ `--password` จะ override การยืนยันตัวตนสำหรับ deep-probe เฉพาะการเรียกคำสั่งครั้งนั้นเท่านั้น; จะไม่เขียนทับ config หรือการแมป SecretRef

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบ CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` ร่วมกับ `--json` เอาต์พุตจะรวมทั้งการดำเนินการแก้ไขและรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยนแปลง

`--fix` จะปรับใช้การแก้ไขที่ปลอดภัยและกำหนดผลลัพธ์ได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ทั่วไปให้เป็น `groupPolicy="allowlist"` (รวมถึงรูปแบบตามบัญชีในช่องทางที่รองรับ)
- เมื่อ WhatsApp เปลี่ยนนโยบายกลุ่มเป็น `allowlist` จะ seed `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่จัดเก็บไว้เมื่อมีรายการนั้นอยู่ และ config ยังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- ทำให้สิทธิ์ของ state/config และไฟล์สำคัญทั่วไปเข้มงวดยิ่งขึ้น
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- รวมถึงทำให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` เข้มงวดยิ่งขึ้นด้วย
- ใช้ `chmod` บนโฮสต์ POSIX และใช้การรีเซ็ต `icacls` บน Windows

สิ่งที่ `--fix` **ไม่** ทำ:

- หมุนเวียน token/password/API key
- ปิดใช้งานเครื่องมือ (`gateway`, `cron`, `exec` เป็นต้น)
- เปลี่ยนตัวเลือกการ bind/auth/network exposure ของ gateway
- ลบหรือเขียนทับ Plugins/Skills
