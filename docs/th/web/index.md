---
read_when:
    - คุณต้องการเข้าถึง Gateway ผ่าน Tailscale
    - คุณต้องการ Control UI บนเบราว์เซอร์และการแก้ไข config
summary: 'พื้นผิวเว็บของ Gateway: Control UI, โหมด bind และความปลอดภัย'
title: เว็บ
x-i18n:
    generated_at: "2026-04-23T06:20:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# เว็บ (Gateway)

Gateway ให้บริการ **Control UI บนเบราว์เซอร์** ขนาดเล็ก (Vite + Lit) จากพอร์ตเดียวกันกับ Gateway WebSocket:

- ค่าเริ่มต้น: `http://<host>:18789/`
- คำนำหน้าแบบไม่บังคับ: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

ความสามารถต่าง ๆ อยู่ใน [Control UI](/th/web/control-ui)
หน้านี้เน้นที่โหมด bind, ความปลอดภัย และพื้นผิวที่เปิดออกสู่เว็บ

## Webhooks

เมื่อ `hooks.enabled=true` Gateway จะเปิดเผย endpoint ของ Webhook ขนาดเล็กบนเซิร์ฟเวอร์ HTTP เดียวกันด้วย
ดู [การกำหนดค่า Gateway](/th/gateway/configuration) → `hooks` สำหรับ auth + payloads

## Config (เปิดใช้โดยค่าเริ่มต้น)

Control UI จะ **เปิดใช้โดยค่าเริ่มต้น** เมื่อมี assets อยู่ (`dist/control-ui`)
คุณสามารถควบคุมได้ผ่าน config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath เป็นตัวเลือก
  },
}
```

## การเข้าถึงผ่าน Tailscale

### Serve แบบผสานรวม (แนะนำ)

ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำหน้าที่ proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

จากนั้นเริ่ม gateway:

```bash
openclaw gateway
```

เปิด:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งค่าไว้)

### bind กับ tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

จากนั้นเริ่ม gateway (ตัวอย่างแบบ non-loopback นี้ใช้ token auth
แบบ shared-secret):

```bash
openclaw gateway
```

เปิด:

- `http://<tailscale-ip>:18789/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งค่าไว้)

### อินเทอร์เน็ตสาธารณะ (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // หรือ OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## หมายเหตุด้านความปลอดภัย

- โดยค่าเริ่มต้น จำเป็นต้องมี gateway auth (token, password, trusted-proxy หรือ headers ระบุตัวตนจาก Tailscale Serve เมื่อเปิดใช้งาน)
- bind แบบ non-loopback ยังคง **ต้องใช้** gateway auth ในทางปฏิบัติหมายถึง token/password auth หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- wizard จะสร้าง auth แบบ shared-secret โดยค่าเริ่มต้น และมักจะสร้าง
  gateway token ให้ด้วย (แม้จะเป็น loopback)
- ในโหมด shared-secret UI จะส่ง `connect.params.auth.token` หรือ
  `connect.params.auth.password`
- ในโหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve หรือ `trusted-proxy` การตรวจสอบ auth
  ของ WebSocket จะผ่านจาก request headers แทน
- สำหรับการปรับใช้ Control UI แบบ non-loopback ให้ตั้งค่า `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (origin แบบเต็ม) หากไม่ตั้งค่า การเริ่มต้น gateway จะถูกปฏิเสธโดยค่าเริ่มต้น
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` จะเปิดใช้
  โหมด Host-header origin fallback แต่เป็นการลดระดับความปลอดภัยที่อันตราย
- เมื่อใช้ Serve, headers ระบุตัวตนของ Tailscale สามารถทำให้ Control UI/WebSocket
  ผ่าน auth ได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ไม่ต้องใช้ token/password)
  ส่วน endpoints ของ HTTP API จะไม่ใช้ headers ระบุตัวตนของ Tailscale เหล่านั้น แต่จะทำตาม
  โหมด HTTP auth ปกติของ gateway แทน ตั้งค่า
  `gateway.auth.allowTailscale: false` หากต้องการบังคับใช้ credentials แบบชัดเจน ดู
  [Tailscale](/th/gateway/tailscale) และ [ความปลอดภัย](/th/gateway/security)
  โฟลว์แบบไม่ใช้ token นี้ตั้งอยู่บนสมมติฐานว่าโฮสต์ gateway เป็นโฮสต์ที่เชื่อถือได้
- `gateway.tailscale.mode: "funnel"` ต้องใช้ `gateway.auth.mode: "password"` (shared password)

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` ให้ build ได้ด้วย:

```bash
pnpm ui:build
```
