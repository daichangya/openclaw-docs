---
read_when:
    - การเปลี่ยนโหมดการยืนยันตัวตนหรือการเปิดเผยของแดชบอร์ด
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-04-24T09:39:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

แดชบอร์ด Gateway คือ Control UI บนเบราว์เซอร์ที่ให้บริการที่ `/` โดยค่าเริ่มต้น
(override ได้ด้วย `gateway.controlUi.basePath`)

เปิดอย่างรวดเร็ว (local Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

เอกสารอ้างอิงหลัก:

- [Control UI](/th/web/control-ui) สำหรับการใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับระบบอัตโนมัติของ Serve/Funnel
- [Web surfaces](/th/web) สำหรับโหมด bind และหมายเหตุด้านความปลอดภัย

การยืนยันตัวตนถูกบังคับใช้ที่ขั้นตอน WebSocket handshake ผ่านเส้นทาง auth
ของ gateway ที่กำหนดไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวตัวตนจาก Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวตัวตนจาก trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [Gateway configuration](/th/gateway/configuration)

หมายเหตุด้านความปลอดภัย: Control UI เป็น **พื้นผิวระดับผู้ดูแลระบบ** (แชต, config, exec approvals)
อย่าเปิดเผยต่อสาธารณะ UI จะเก็บโทเค็น URL ของแดชบอร์ดไว้ใน sessionStorage
สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก และจะลบมันออกจาก URL หลังโหลด
ควรใช้ localhost, Tailscale Serve หรือ SSH tunnel

## เส้นทางด่วน (แนะนำ)

- หลัง onboarding แล้ว CLI จะเปิดแดชบอร์ดให้อัตโนมัติและพิมพ์ลิงก์แบบสะอาด (ไม่มี token)
- เปิดใหม่ได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์, เปิดเบราว์เซอร์หากทำได้, แสดงคำใบ้ SSH หากเป็นระบบ headless)
- หาก UI ขอการยืนยันตัวตนแบบ shared-secret ให้วาง token หรือ
  password ที่ตั้งค่าไว้ลงใน Control UI settings

## พื้นฐานการยืนยันตัวตน (local เทียบกับ remote)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **แหล่งโทเค็นแบบ shared-secret**: `gateway.auth.token` (หรือ
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` สามารถส่งมันผ่าน URL fragment
  สำหรับการ bootstrap แบบครั้งเดียว และ Control UI จะเก็บมันไว้ใน sessionStorage สำหรับ
  เซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL ของ gateway ที่เลือก แทนที่จะใช้ localStorage
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef `openclaw dashboard`
  จะพิมพ์/คัดลอก/เปิด URL แบบไม่มี token โดยตั้งใจ วิธีนี้ช่วยหลีกเลี่ยงการเปิดเผย
  token ที่ถูกจัดการจากภายนอกใน shell logs, ประวัติ clipboard หรือ browser-launch
  arguments
- หาก `gateway.auth.token` ถูกกำหนดค่าเป็น SecretRef และยัง resolve ไม่ได้ใน
  shell ปัจจุบันของคุณ `openclaw dashboard` ก็ยังจะพิมพ์ URL แบบไม่มี token พร้อม
  คำแนะนำการตั้งค่า auth ที่นำไปปฏิบัติได้
- **รหัสผ่านแบบ shared-secret**: ใช้ `gateway.auth.password` ที่กำหนดไว้ (หรือ
  `OPENCLAW_GATEWAY_PASSWORD`) แดชบอร์ดจะไม่เก็บรหัสผ่านไว้ข้ามการ reload
- **โหมดที่มีตัวตน**: Tailscale Serve สามารถตอบสนอง auth ของ Control UI/WebSocket
  ผ่านส่วนหัวตัวตนเมื่อ `gateway.auth.allowTailscale: true` และ
  reverse proxy แบบรับรู้ตัวตนที่ไม่ใช่ loopback สามารถตอบสนอง
  `gateway.auth.mode: "trusted-proxy"` ได้ ในโหมดเหล่านั้นแดชบอร์ด
  ไม่จำเป็นต้องวาง shared secret สำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, bind แบบ shared-secret ที่ไม่ใช่ loopback,
  reverse proxy แบบรับรู้ตัวตนที่ไม่ใช่ loopback พร้อม
  `gateway.auth.mode: "trusted-proxy"` หรือ SSH tunnel HTTP APIs ยังคงใช้
  shared-secret auth เว้นแต่คุณจะตั้งใจรันแบบ private-ingress ด้วย
  `gateway.auth.mode: "none"` หรือ trusted-proxy HTTP auth ดู
  [Web surfaces](/th/web)

<a id="if-you-see-unauthorized-1008"></a>

## หากคุณเห็น "unauthorized" / 1008

- ตรวจสอบให้แน่ใจว่า gateway เข้าถึงได้ (ในเครื่อง: `openclaw status`; ระยะไกล: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`)
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจทำ trusted retry หนึ่งครั้งด้วย device token ที่แคชไว้ เมื่อ gateway คืน retry hints การ retry ด้วย cached-token นั้นจะใช้ approved scopes ที่แคชไว้ของโทเค็นนั้น; ส่วนผู้เรียกที่ระบุ `deviceToken` / `scopes` แบบ explicit จะยังคงใช้ชุด scope ที่ร้องขอไว้ หาก auth ยังล้มเหลวหลัง retry นั้น ให้แก้ token drift ด้วยตนเอง
- นอกเหนือจากเส้นทาง retry นั้น ลำดับความสำคัญของ connect auth คือ shared token/password แบบ explicit ก่อน จากนั้น `deviceToken` แบบ explicit ตามด้วย stored device token แล้วจึงเป็น bootstrap token
- บนเส้นทาง Control UI ของ Tailscale Serve แบบ async ความพยายามที่ล้มเหลวสำหรับ
  `{scope, ip}` เดียวกันจะถูก serialize ก่อนที่ failed-auth limiter จะบันทึกมัน ดังนั้น bad retry พร้อมกันครั้งที่สองอาจแสดง `retry later` ได้อยู่แล้ว
- สำหรับขั้นตอนการซ่อม token drift ให้ทำตาม [Token drift recovery checklist](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุ shared secret จากโฮสต์ gateway:
  - โทเค็น: `openclaw config get gateway.auth.token`
  - รหัสผ่าน: resolve `gateway.auth.password` ที่กำหนดค่าไว้ หรือ
    `OPENCLAW_GATEWAY_PASSWORD`
  - โทเค็นที่จัดการด้วย SecretRef: resolve ผู้ให้บริการ secret ภายนอก หรือ export
    `OPENCLAW_GATEWAY_TOKEN` ใน shell นี้ แล้วรัน `openclaw dashboard` ใหม่
  - ไม่มี shared secret ที่กำหนดค่าไว้: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่าแดชบอร์ด ให้วาง token หรือ password ลงในช่อง auth
  จากนั้นเชื่อมต่อ
- ตัวเลือกภาษาของ UI อยู่ที่ **Overview -> Gateway Access -> Language**
  ซึ่งเป็นส่วนหนึ่งของ access card ไม่ใช่ส่วน Appearance

## ที่เกี่ยวข้อง

- [Control UI](/th/web/control-ui)
- [WebChat](/th/web/webchat)
