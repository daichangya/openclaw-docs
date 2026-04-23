---
read_when:
    - การเปิดเผย Gateway Control UI ออกนอก localhost
    - การทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือสาธารณะเป็นอัตโนมัติ
summary: Tailscale Serve/Funnel แบบผสานรวมสำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-23T05:35:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (แดชบอร์ด Gateway)

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) แบบอัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket วิธีนี้ทำให้ Gateway ยังคง bind อยู่กับ loopback ขณะที่
Tailscale เป็นผู้ให้ HTTPS, การกำหนดเส้นทาง และ (สำหรับ Serve) identity headers

## โหมด

- `serve`: Serve แบบเฉพาะ tailnet ผ่าน `tailscale serve` โดย gateway ยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS แบบสาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านที่ใช้ร่วมกัน
- `off`: ค่าเริ่มต้น (ไม่มีระบบอัตโนมัติของ Tailscale)

## การยืนยันตัวตน

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (ingress แบบ private เท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้งค่า `OPENCLAW_GATEWAY_TOKEN`)
- `password` (shared secret ผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (reverse proxy ที่รับรู้อัตลักษณ์; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`,
การยืนยันตัวตนของ Control UI/WebSocket สามารถใช้ Tailscale identity headers
(`tailscale-user-login`) โดยไม่ต้องส่ง token/password OpenClaw จะตรวจสอบ
อัตลักษณ์โดย resolve ที่อยู่ `x-forwarded-for` ผ่าน local Tailscale
daemon (`tailscale whois`) แล้วจับคู่กับ header ก่อนยอมรับ
OpenClaw จะถือว่าคำขอนั้นเป็น Serve ก็ต่อเมื่อมันมาจาก loopback พร้อม header
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host` ของ Tailscale
HTTP API endpoint (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้การยืนยันตัวตนด้วย identity-header ของ Tailscale แต่ยังคงเป็นไปตาม
โหมด HTTP auth ปกติของ gateway: shared-secret auth โดยค่าเริ่มต้น หรือ
การตั้งค่า `trusted-proxy` / private-ingress `none` ที่ตั้งใจไว้เท่านั้น
โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้ หากมีโค้ด local ที่ไม่น่าเชื่อถือ
อาจรันอยู่บนโฮสต์เดียวกัน ให้ปิด `gateway.auth.allowTailscale` และบังคับใช้
การยืนยันตัวตนแบบ token/password แทน
หากต้องการบังคับให้ใช้ข้อมูลรับรอง shared-secret แบบชัดเจน ให้ตั้ง `gateway.auth.allowTailscale: false`
แล้วใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่าง config

### เฉพาะ Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิดที่: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### เฉพาะ Tailnet (bind กับ Tailnet IP)

ใช้รูปแบบนี้เมื่อคุณต้องการให้ Gateway ฟังบน Tailnet IP โดยตรง (ไม่ใช้ Serve/Funnel)

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์ Tailnet เครื่องอื่น:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

หมายเหตุ: loopback (`http://127.0.0.1:18789`) จะ **ไม่** ทำงานในโหมดนี้

### อินเทอร์เน็ตสาธารณะ (Funnel + รหัสผ่านที่ใช้ร่วมกัน)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

ควรใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการ commit รหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้ง CLI `tailscale` และล็อกอินไว้แล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงาน เว้นแต่โหมด auth จะเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ย้อนคืนการกำหนดค่า `tailscale serve`
  หรือ `tailscale funnel` เมื่อปิดระบบ
- `gateway.bind: "tailnet"` คือการ bind กับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback ก่อน; ใช้ `tailnet` หากคุณต้องการแบบ Tailnet-only
- Serve/Funnel จะเปิดเผยเฉพาะ **Gateway control UI + WS** เท่านั้น Node จะเชื่อมต่อผ่าน
  Gateway WS endpoint เดียวกัน ดังนั้น Serve จึงใช้กับการเข้าถึง node ได้ด้วย

## การควบคุมเบราว์เซอร์ (Gateway ระยะไกล + เบราว์เซอร์ในเครื่อง)

หากคุณรัน Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุมเบราว์เซอร์บนอีกเครื่องหนึ่ง
ให้รัน **node host** บนเครื่องที่มีเบราว์เซอร์ และให้ทั้งสองเครื่องอยู่ใน tailnet เดียวกัน
Gateway จะ proxy การกระทำของเบราว์เซอร์ไปยัง node; ไม่ต้องมีเซิร์ฟเวอร์ควบคุมแยกต่างหากหรือ URL ของ Serve

หลีกเลี่ยงการใช้ Funnel สำหรับการควบคุมเบราว์เซอร์; ให้ถือว่าการจับคู่ node มีระดับความสำคัญเช่นเดียวกับการเข้าถึงของ operator

## ข้อกำหนดเบื้องต้น + ข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะพรอมป์หากยังไม่มี
- Serve จะฉีด Tailscale identity headers; Funnel จะไม่ทำ
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และมี funnel node attribute
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้แอป Tailscale แบบโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
