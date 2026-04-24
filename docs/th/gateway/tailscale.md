---
read_when:
    - การเปิดเผย Gateway Control UI ออกนอก localhost
    - การทำให้การเข้าถึงแดชบอร์ดผ่าน tailnet หรือสาธารณะเป็นอัตโนมัติ
summary: การผสานรวม Tailscale Serve/Funnel สำหรับแดชบอร์ด Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T09:13:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (แดชบอร์ด Gateway)

OpenClaw สามารถกำหนดค่า Tailscale **Serve** (tailnet) หรือ **Funnel** (สาธารณะ) โดยอัตโนมัติสำหรับ
แดชบอร์ด Gateway และพอร์ต WebSocket วิธีนี้ช่วยให้ Gateway ยังคง bind อยู่กับ loopback ขณะที่
Tailscale จัดการ HTTPS, routing และ (สำหรับ Serve) identity headers

## โหมด

- `serve`: Serve แบบจำกัดใน tailnet ผ่าน `tailscale serve` gateway จะยังคงอยู่บน `127.0.0.1`
- `funnel`: HTTPS แบบสาธารณะผ่าน `tailscale funnel` OpenClaw ต้องใช้รหัสผ่านที่ใช้ร่วมกัน
- `off`: ค่าเริ่มต้น (ไม่มีการทำงานอัตโนมัติของ Tailscale)

## Auth

ตั้งค่า `gateway.auth.mode` เพื่อควบคุม handshake:

- `none` (ใช้กับ ingress แบบ private เท่านั้น)
- `token` (ค่าเริ่มต้นเมื่อมีการตั้ง `OPENCLAW_GATEWAY_TOKEN`)
- `password` (shared secret ผ่าน `OPENCLAW_GATEWAY_PASSWORD` หรือ config)
- `trusted-proxy` (reverse proxy แบบรับรู้ตัวตน; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth))

เมื่อ `tailscale.mode = "serve"` และ `gateway.auth.allowTailscale` เป็น `true`,
auth ของ Control UI/WebSocket สามารถใช้ Tailscale identity headers
(`tailscale-user-login`) ได้โดยไม่ต้องส่ง token/password OpenClaw จะตรวจสอบ
ตัวตนโดย resolve ที่อยู่ `x-forwarded-for` ผ่าน local Tailscale
daemon (`tailscale whois`) แล้วจับคู่กับ header ก่อนยอมรับ OpenClaw จะถือว่า
คำขอนั้นมาจาก Serve ก็ต่อเมื่อมาถึงจาก loopback พร้อม headers ของ Tailscale คือ
`x-forwarded-for`, `x-forwarded-proto` และ `x-forwarded-host`
HTTP API endpoints (เช่น `/v1/*`, `/tools/invoke` และ `/api/channels/*`)
**ไม่** ใช้ auth แบบ Tailscale identity-header ยังคงเป็นไปตาม
โหมด HTTP auth ปกติของ gateway: shared-secret auth เป็นค่าเริ่มต้น หรือใช้
trusted-proxy / private-ingress `none` ที่ตั้งใจตั้งค่าไว้โดยเฉพาะ
โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ของ gateway เชื่อถือได้ หากมีโค้ดภายในเครื่องที่ไม่น่าเชื่อถือ
อาจทำงานบนโฮสต์เดียวกัน ให้ปิด `gateway.auth.allowTailscale` และบังคับ
ใช้ token/password auth แทน
หากต้องการบังคับให้ใช้ข้อมูลรับรองแบบ shared-secret อย่างชัดเจน ให้ตั้ง `gateway.auth.allowTailscale: false`
และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

## ตัวอย่าง config

### เฉพาะ tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

เปิดได้ที่: `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณกำหนดไว้)

### เฉพาะ tailnet (bind ไปยัง Tailnet IP)

ใช้วิธีนี้เมื่อคุณต้องการให้ Gateway ฟังบน Tailnet IP โดยตรง (ไม่ใช้ Serve/Funnel)

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

เชื่อมต่อจากอุปกรณ์อื่นใน Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

หมายเหตุ: loopback (`http://127.0.0.1:18789`) จะ **ใช้ไม่ได้** ในโหมดนี้

### อินเทอร์เน็ตสาธารณะ (Funnel + shared password)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

แนะนำให้ใช้ `OPENCLAW_GATEWAY_PASSWORD` แทนการ commit รหัสผ่านลงดิสก์

## ตัวอย่าง CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## หมายเหตุ

- Tailscale Serve/Funnel ต้องติดตั้งและล็อกอิน `tailscale` CLI แล้ว
- `tailscale.mode: "funnel"` จะปฏิเสธการเริ่มทำงาน เว้นแต่โหมด auth จะเป็น `password` เพื่อหลีกเลี่ยงการเปิดเผยสู่สาธารณะ
- ตั้งค่า `gateway.tailscale.resetOnExit` หากคุณต้องการให้ OpenClaw ยกเลิกการตั้งค่า `tailscale serve`
  หรือ `tailscale funnel` ตอนปิดระบบ
- `gateway.bind: "tailnet"` คือการ bind กับ Tailnet โดยตรง (ไม่มี HTTPS, ไม่มี Serve/Funnel)
- `gateway.bind: "auto"` จะเลือก loopback เป็นหลัก; ใช้ `tailnet` หากคุณต้องการเฉพาะ Tailnet
- Serve/Funnel เปิดเผยเฉพาะ **Gateway control UI + WS** เท่านั้น Nodes จะเชื่อมต่อผ่าน
  Gateway WS endpoint เดียวกัน ดังนั้น Serve สามารถใช้สำหรับการเข้าถึง node ได้

## Browser control (remote Gateway + browser ภายในเครื่อง)

หากคุณรัน Gateway บนเครื่องหนึ่ง แต่ต้องการควบคุม browser บนอีกเครื่องหนึ่ง
ให้รัน **node host** บนเครื่องที่มี browser และให้ทั้งสองเครื่องอยู่ใน tailnet เดียวกัน
Gateway จะพร็อกซีการทำงานของ browser ไปยัง node; ไม่ต้องมี control server หรือ Serve URL แยกต่างหาก

หลีกเลี่ยงการใช้ Funnel สำหรับ browser control; ให้ปฏิบัติต่อ node pairing เหมือนการเข้าถึงระดับ operator

## ข้อกำหนดเบื้องต้นและข้อจำกัดของ Tailscale

- Serve ต้องเปิดใช้ HTTPS สำหรับ tailnet ของคุณ; CLI จะแจ้งให้เปิดหากยังไม่มี
- Serve จะแทรก Tailscale identity headers; Funnel จะไม่แทรก
- Funnel ต้องใช้ Tailscale v1.38.3+, MagicDNS, เปิดใช้ HTTPS และมี funnel node attribute
- Funnel รองรับเฉพาะพอร์ต `443`, `8443` และ `10000` ผ่าน TLS
- Funnel บน macOS ต้องใช้ Tailscale app รุ่นโอเพนซอร์ส

## เรียนรู้เพิ่มเติม

- ภาพรวม Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- คำสั่ง `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- ภาพรวม Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- คำสั่ง `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ที่เกี่ยวข้อง

- [Remote access](/th/gateway/remote)
- [Discovery](/th/gateway/discovery)
- [Authentication](/th/gateway/authentication)
