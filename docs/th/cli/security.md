---
read_when:
    - คุณต้องการรันการตรวจสอบความปลอดภัยอย่างรวดเร็วบน config/สถานะ
    - คุณต้องการใช้คำแนะนำ “fix” ที่ปลอดภัย (สิทธิ์ไฟล์, ทำค่าเริ่มต้นให้เข้มงวดขึ้น)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw security` (ตรวจสอบและแก้ไขจุดพลาดด้านความปลอดภัยที่พบบ่อย)
title: ความปลอดภัย
x-i18n:
    generated_at: "2026-04-24T09:04:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

เครื่องมือด้านความปลอดภัย (audit + fixes แบบไม่บังคับ)

ที่เกี่ยวข้อง:

- คู่มือด้านความปลอดภัย: [Security](/th/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

การ audit จะเตือนเมื่อมีผู้ส่ง DM หลายคนใช้ main session ร่วมกัน และแนะนำให้ใช้ **secure DM mode**: `session.dmScope="per-channel-peer"` (หรือ `per-account-channel-peer` สำหรับแชนแนลแบบหลายบัญชี) สำหรับ inbox ที่มีผู้ใช้ร่วมกัน
สิ่งนี้มีไว้เพื่อเสริมความปลอดภัยของ inbox แบบทำงานร่วมกัน/ใช้ร่วมกัน การใช้ Gateway เดียวร่วมกันโดยผู้ปฏิบัติงานที่ไม่ไว้ใจกันหรือมีลักษณะเป็นปฏิปักษ์กันไม่ใช่รูปแบบที่แนะนำ; ให้แยกขอบเขตความไว้วางใจด้วย gateways แยกกัน (หรือแยก OS users/hosts)
นอกจากนี้ยังส่ง `security.trust_model.multi_user_heuristic` เมื่อ config บ่งชี้ถึง ingress แบบหลายผู้ใช้ที่น่าจะเป็นไปได้ (เช่น DM/group policy แบบ open, group targets ที่กำหนดไว้ หรือกฎ wildcard sender) และเตือนว่า OpenClaw ใช้โมเดลความไว้วางใจแบบผู้ช่วยส่วนตัวเป็นค่าเริ่มต้น
สำหรับการตั้งค่าหลายผู้ใช้ที่ตั้งใจใช้งานจริง คำแนะนำจาก audit คือ sandbox ทุกเซสชัน จำกัดการเข้าถึง filesystem ให้อยู่ภายใน workspace และแยก identities หรือ credentials ส่วนตัว/ที่เป็นความลับออกจาก runtime นั้น
นอกจากนี้ยังเตือนเมื่อใช้โมเดลขนาดเล็ก (`<=300B`) โดยไม่มี sandbox และเปิดใช้งาน web/browser tools
สำหรับ webhook ingress จะเตือนเมื่อ `hooks.token` ใช้ token เดียวกับ Gateway, เมื่อ `hooks.token` สั้น, เมื่อ `hooks.path="/"`, เมื่อไม่ได้ตั้งค่า `hooks.defaultSessionKey`, เมื่อ `hooks.allowedAgentIds` ไม่ถูกจำกัด, เมื่อเปิดใช้ request `sessionKey` overrides และเมื่อเปิดใช้ overrides โดยไม่มี `hooks.allowedSessionKeyPrefixes`
นอกจากนี้ยังเตือนเมื่อมีการกำหนดค่า sandbox Docker ไว้ในขณะที่ปิด sandbox mode อยู่, เมื่อ `gateway.nodes.denyCommands` ใช้รายการแบบ pattern-like/unknown ที่ไม่มีผล (รองรับเฉพาะการจับคู่ exact node command-name ไม่ใช่การกรอง shell text), เมื่อ `gateway.nodes.allowCommands` เปิดใช้ node commands ที่อันตรายอย่างชัดเจน, เมื่อ `tools.profile="minimal"` ระดับโกลบอลถูกแทนที่โดย agent tool profiles, เมื่อ open groups เปิดเผย runtime/filesystem tools โดยไม่มี sandbox/workspace guards และเมื่อ tools จาก Plugins ที่ติดตั้งไว้สามารถเข้าถึงได้ภายใต้นโยบาย tool ที่ผ่อนปรน
นอกจากนี้ยังแจ้งเตือน `gateway.allowRealIpFallback=true` (มีความเสี่ยงจากการ spoof headers หาก proxies ถูกกำหนดค่าผิด) และ `discovery.mdns.mode="full"` (ข้อมูล metadata รั่วไหลผ่าน mDNS TXT records)
นอกจากนี้ยังเตือนเมื่อ sandbox browser ใช้ Docker network แบบ `bridge` โดยไม่มี `sandbox.browser.cdpSourceRange`
และยังแจ้งเตือนโหมดเครือข่าย Docker ของ sandbox ที่อันตราย (รวมถึง `host` และการเข้าร่วม namespace แบบ `container:*`)
นอกจากนี้ยังเตือนเมื่อ Docker containers ของ sandbox browser ที่มีอยู่มี hash labels ที่หายไป/ล้าสมัย (เช่น containers ก่อนการย้ายที่ไม่มี `openclaw.browserConfigEpoch`) และแนะนำให้ใช้ `openclaw sandbox recreate --browser --all`
นอกจากนี้ยังเตือนเมื่อระเบียนการติดตั้ง Plugin/hook แบบ npm ไม่มีการ pin, ไม่มี metadata ด้าน integrity หรือไม่ตรงกับเวอร์ชันแพ็กเกจที่ติดตั้งอยู่ในปัจจุบัน
นอกจากนี้ยังเตือนเมื่อ allowlists ของแชนแนลอาศัยชื่อ/อีเมล/แท็กที่เปลี่ยนแปลงได้แทน stable IDs (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC scopes ที่เกี่ยวข้อง)
นอกจากนี้ยังเตือนเมื่อ `gateway.auth.mode="none"` ทำให้ Gateway HTTP APIs เข้าถึงได้โดยไม่มี shared secret (`/tools/invoke` รวมถึง `/v1/*` endpoint ใด ๆ ที่เปิดใช้งาน)
การตั้งค่าที่ขึ้นต้นด้วย `dangerous`/`dangerously` เป็นการแทนที่โดยผู้ปฏิบัติงานแบบ break-glass อย่างชัดเจน; การเปิดใช้เพียงอย่างเดียวไม่ถือเป็นรายงานช่องโหว่ด้านความปลอดภัย
สำหรับรายการพารามิเตอร์อันตรายทั้งหมด ดูหัวข้อ "Insecure or dangerous flags summary" ใน [Security](/th/gateway/security)

พฤติกรรมของ SecretRef:

- `security audit` จะ resolve SecretRefs ที่รองรับในโหมดอ่านอย่างเดียวสำหรับ paths เป้าหมายของมัน
- หาก SecretRef ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน audit จะทำงานต่อและรายงาน `secretDiagnostics` (แทนที่จะล้มเหลว)
- `--token` และ `--password` จะ override เฉพาะการยืนยันตัวตนสำหรับ deep-probe ของคำสั่งที่เรียกครั้งนั้นเท่านั้น; จะไม่เขียนทับ config หรือการแมป SecretRef

## เอาต์พุต JSON

ใช้ `--json` สำหรับการตรวจสอบใน CI/นโยบาย:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

หากใช้ `--fix` และ `--json` ร่วมกัน เอาต์พุตจะรวมทั้งการกระทำของ fix และรายงานสุดท้าย:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## สิ่งที่ `--fix` เปลี่ยนแปลง

`--fix` ใช้การแก้ไขที่ปลอดภัยและกำหนดผลลัพธ์ได้แน่นอน:

- เปลี่ยน `groupPolicy="open"` ที่พบบ่อยเป็น `groupPolicy="allowlist"` (รวมถึงรูปแบบต่อบัญชีในแชนแนลที่รองรับ)
- เมื่อ group policy ของ WhatsApp ถูกเปลี่ยนเป็น `allowlist` จะ seed ค่า `groupAllowFrom` จาก
  ไฟล์ `allowFrom` ที่เก็บไว้เมื่อมีรายการนั้นอยู่และใน config ยังไม่ได้
  กำหนด `allowFrom`
- ตั้งค่า `logging.redactSensitive` จาก `"off"` เป็น `"tools"`
- ทำสิทธิ์ของ state/config และไฟล์สำคัญที่อ่อนไหวทั่วไปให้เข้มงวดยิ่งขึ้น
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- รวมถึงทำให้ไฟล์ include ของ config ที่อ้างอิงจาก `openclaw.json` เข้มงวดยิ่งขึ้นด้วย
- ใช้ `chmod` บนโฮสต์แบบ POSIX และรีเซ็ต `icacls` บน Windows

`--fix` จะ **ไม่**:

- หมุนเวียน tokens/passwords/API keys
- ปิดใช้งาน tools (`gateway`, `cron`, `exec` เป็นต้น)
- เปลี่ยนตัวเลือก bind/auth/network exposure ของ gateway
- ลบหรือเขียนทับ Plugins/Skills

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Security audit](/th/gateway/security)
