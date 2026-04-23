---
read_when:
    - การเปลี่ยนโหมดการยืนยันตัวตนหรือการเปิดเผยการเข้าถึงของแดชบอร์ด
summary: การเข้าถึงและการยืนยันตัวตนของแดชบอร์ด Gateway (Control UI)
title: แดชบอร์ด
x-i18n:
    generated_at: "2026-04-23T06:20:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# แดชบอร์ด (Control UI)

แดชบอร์ด Gateway คือ Control UI บนเบราว์เซอร์ที่ให้บริการที่ `/` โดยค่าเริ่มต้น
(เปลี่ยนได้ด้วย `gateway.controlUi.basePath`)

เปิดอย่างรวดเร็ว (Gateway ในเครื่อง):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (หรือ [http://localhost:18789/](http://localhost:18789/))

ข้อมูลอ้างอิงสำคัญ:

- [Control UI](/th/web/control-ui) สำหรับการใช้งานและความสามารถของ UI
- [Tailscale](/th/gateway/tailscale) สำหรับระบบอัตโนมัติของ Serve/Funnel
- [พื้นผิวเว็บ](/th/web) สำหรับโหมด bind และหมายเหตุด้านความปลอดภัย

การยืนยันตัวตนถูกบังคับใช้ที่ขั้นตอน WebSocket handshake ผ่านเส้นทางการยืนยันตัวตน
ของ gateway ที่กำหนดค่าไว้:

- `connect.params.auth.token`
- `connect.params.auth.password`
- ส่วนหัวตัวตนของ Tailscale Serve เมื่อ `gateway.auth.allowTailscale: true`
- ส่วนหัวตัวตนของ trusted-proxy เมื่อ `gateway.auth.mode: "trusted-proxy"`

ดู `gateway.auth` ใน [การกำหนดค่า Gateway](/th/gateway/configuration)

หมายเหตุด้านความปลอดภัย: Control UI เป็น **พื้นผิวสำหรับผู้ดูแลระบบ** (แชต, config, การอนุมัติ exec)
อย่าเปิดให้เข้าถึงแบบสาธารณะ UI จะเก็บโทเค็น URL ของแดชบอร์ดไว้ใน sessionStorage
สำหรับเซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก และจะลบโทเค็นเหล่านั้นออกจาก URL หลังโหลดเสร็จ
ควรใช้ localhost, Tailscale Serve หรือ SSH tunnel

## เส้นทางลัด (แนะนำ)

- หลังการตั้งค่าเริ่มต้น CLI จะเปิดแดชบอร์ดอัตโนมัติและพิมพ์ลิงก์แบบสะอาด (ไม่มีโทเค็น)
- เปิดอีกครั้งได้ทุกเมื่อ: `openclaw dashboard` (คัดลอกลิงก์, เปิดเบราว์เซอร์หากทำได้, แสดงคำแนะนำ SSH หากเป็นแบบ headless)
- หาก UI ขอการยืนยันตัวตนด้วย shared secret ให้วางโทเค็นหรือ
  รหัสผ่านที่กำหนดค่าไว้ลงในการตั้งค่า Control UI

## พื้นฐานการยืนยันตัวตน (ในเครื่องเทียบกับระยะไกล)

- **Localhost**: เปิด `http://127.0.0.1:18789/`
- **แหล่งที่มาของโทเค็น shared secret**: `gateway.auth.token` (หรือ
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` สามารถส่งผ่าน fragment ของ URL
  สำหรับการบูตสแตรปครั้งเดียว และ Control UI จะเก็บไว้ใน sessionStorage สำหรับ
  เซสชันแท็บเบราว์เซอร์ปัจจุบันและ URL gateway ที่เลือก แทน localStorage
- หาก `gateway.auth.token` ถูกจัดการด้วย SecretRef, `openclaw dashboard`
  จะพิมพ์/คัดลอก/เปิด URL ที่ไม่มีโทเค็นตามการออกแบบ วิธีนี้ช่วยหลีกเลี่ยงการเปิดเผย
  โทเค็นที่จัดการจากภายนอกในบันทึกเชลล์ ประวัติคลิปบอร์ด หรืออาร์กิวเมนต์
  ที่ใช้เปิดเบราว์เซอร์
- หาก `gateway.auth.token` ถูกกำหนดค่าเป็น SecretRef และยัง resolve ไม่ได้ใน
  เชลล์ปัจจุบันของคุณ `openclaw dashboard` ก็ยังจะพิมพ์ URL ที่ไม่มีโทเค็นพร้อม
  คำแนะนำการตั้งค่าการยืนยันตัวตนที่นำไปใช้ได้จริง
- **รหัสผ่าน shared secret**: ใช้ `gateway.auth.password` ที่กำหนดค่าไว้ (หรือ
  `OPENCLAW_GATEWAY_PASSWORD`) แดชบอร์ดจะไม่เก็บรหัสผ่านไว้ข้ามการรีโหลด
- **โหมดที่มีตัวตนกำกับ**: Tailscale Serve สามารถทำให้การยืนยันตัวตนของ Control UI/WebSocket ผ่านได้
  ด้วยส่วนหัวตัวตนเมื่อ `gateway.auth.allowTailscale: true` และ reverse proxy
  แบบรับรู้ตัวตนที่ไม่ใช่ loopback สามารถทำให้ผ่านได้ด้วย
  `gateway.auth.mode: "trusted-proxy"` ในโหมดเหล่านั้น แดชบอร์ด
  ไม่จำเป็นต้องวาง shared secret สำหรับ WebSocket
- **ไม่ใช่ localhost**: ใช้ Tailscale Serve, bind แบบ shared secret ที่ไม่ใช่ loopback, 
  reverse proxy แบบรับรู้ตัวตนที่ไม่ใช่ loopback พร้อม
  `gateway.auth.mode: "trusted-proxy"` หรือ SSH tunnel ส่วน HTTP API ยังคงใช้
  การยืนยันตัวตนแบบ shared secret เว้นแต่คุณจะตั้งใจใช้ private-ingress
  `gateway.auth.mode: "none"` หรือการยืนยันตัวตน HTTP แบบ trusted-proxy ดู
  [พื้นผิวเว็บ](/th/web)

<a id="if-you-see-unauthorized-1008"></a>

## หากคุณเห็น "unauthorized" / 1008

- ตรวจสอบให้แน่ใจว่าสามารถเข้าถึง gateway ได้ (ในเครื่อง: `openclaw status`; ระยะไกล: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` แล้วเปิด `http://127.0.0.1:18789/`)
- สำหรับ `AUTH_TOKEN_MISMATCH` ไคลเอนต์อาจลองใหม่แบบเชื่อถือได้หนึ่งครั้งด้วยโทเค็นอุปกรณ์ที่แคชไว้เมื่อ gateway ส่งคำแนะนำสำหรับการลองใหม่กลับมา การลองใหม่ด้วยโทเค็นที่แคชไว้นั้นจะใช้ขอบเขตที่อนุมัติไว้ในแคชของโทเค็นนั้นซ้ำ; ผู้เรียกที่ใช้ `deviceToken` แบบชัดเจน / `scopes` แบบชัดเจนจะคงชุดขอบเขตที่ร้องขอไว้ หากการยืนยันตัวตนยังล้มเหลวหลังจากลองใหม่นั้น ให้แก้ปัญหา token drift ด้วยตนเอง
- นอกเหนือจากเส้นทางการลองใหม่นั้น ลำดับความสำคัญของการยืนยันตัวตนสำหรับการเชื่อมต่อคือ shared token/password แบบชัดเจนก่อน จากนั้น `deviceToken` แบบชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ แล้วค่อยเป็น bootstrap token
- บนเส้นทาง Control UI แบบ async ของ Tailscale Serve ความพยายามที่ล้มเหลวสำหรับ
  `{scope, ip}` เดียวกันจะถูกทำให้เป็นลำดับก่อนที่ตัวจำกัดการยืนยันตัวตนล้มเหลวจะบันทึกไว้ ดังนั้น
  การลองใหม่ที่ไม่ถูกต้องพร้อมกันครั้งที่สองอาจแสดง `retry later` ได้แล้ว
- สำหรับขั้นตอนการซ่อมแซม token drift ให้ทำตาม [รายการตรวจสอบการกู้คืน token drift](/th/cli/devices#token-drift-recovery-checklist)
- ดึงหรือระบุ shared secret จากโฮสต์ gateway:
  - โทเค็น: `openclaw config get gateway.auth.token`
  - รหัสผ่าน: resolve `gateway.auth.password` ที่กำหนดค่าไว้ หรือ
    `OPENCLAW_GATEWAY_PASSWORD`
  - โทเค็นที่จัดการด้วย SecretRef: resolve ผู้ให้บริการ secret ภายนอก หรือ export
    `OPENCLAW_GATEWAY_TOKEN` ในเชลล์นี้ แล้วรัน `openclaw dashboard` ใหม่
  - ไม่มีการกำหนดค่า shared secret: `openclaw doctor --generate-gateway-token`
- ในการตั้งค่าแดชบอร์ด ให้วางโทเค็นหรือรหัสผ่านลงในช่องการยืนยันตัวตน
  จากนั้นเชื่อมต่อ
- ตัวเลือกภาษาของ UI อยู่ที่ **Overview -> Gateway Access -> Language**
  เป็นส่วนหนึ่งของการ์ดการเข้าถึง ไม่ใช่ส่วน Appearance
