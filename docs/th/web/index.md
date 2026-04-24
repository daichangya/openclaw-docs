---
read_when:
    - คุณต้องการเข้าถึง Gateway ผ่าน Tailscale
    - คุณต้องการ Control UI บนเบราว์เซอร์และการแก้ไข config
summary: 'พื้นผิวเว็บของ Gateway: Control UI, โหมดการ bind และความปลอดภัย'
title: เว็บ
x-i18n:
    generated_at: "2026-04-24T09:40:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway ให้บริการ **Control UI บนเบราว์เซอร์** ขนาดเล็ก (Vite + Lit) จากพอร์ตเดียวกับ Gateway WebSocket:

- ค่าเริ่มต้น: `http://<host>:18789/`
- พาธนำหน้าแบบทางเลือก: ตั้งค่า `gateway.controlUi.basePath` (เช่น `/openclaw`)

ความสามารถต่าง ๆ อยู่ที่ [Control UI](/th/web/control-ui)
หน้านี้เน้นที่โหมดการ bind, ความปลอดภัย และพื้นผิวที่เข้าถึงผ่านเว็บ

## Webhooks

เมื่อ `hooks.enabled=true`, Gateway จะเปิดเผย endpoint สำหรับ Webhook ขนาดเล็กบน HTTP server เดียวกันด้วย
ดู [การกำหนดค่า Gateway](/th/gateway/configuration) → `hooks` สำหรับ auth + payloads

## การกำหนดค่า (เปิดโดยค่าเริ่มต้น)

Control UI จะ **เปิดใช้งานโดยค่าเริ่มต้น** เมื่อมี assets อยู่ (`dist/control-ui`)
คุณสามารถควบคุมได้ผ่าน config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath เป็นทางเลือก
  },
}
```

## การเข้าถึงผ่าน Tailscale

### Integrated Serve (แนะนำ)

ให้ Gateway อยู่บน loopback และให้ Tailscale Serve ทำหน้าที่ proxy ให้:

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

เปิดที่:

- `https://<magicdns>/` (หรือ `gateway.controlUi.basePath` ที่คุณตั้งค่าไว้)

### Bind กับ tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

จากนั้นเริ่ม gateway (ตัวอย่างที่ไม่ใช่ loopback นี้ใช้ token auth
แบบ shared-secret):

```bash
openclaw gateway
```

เปิดที่:

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

- การยืนยันตัวตนของ Gateway จำเป็นโดยค่าเริ่มต้น (token, password, trusted-proxy หรือ Tailscale Serve identity headers เมื่อเปิดใช้งาน)
- การ bind แบบ non-loopback ยังคง **ต้อง** ใช้การยืนยันตัวตนของ gateway ในทางปฏิบัติหมายถึง token/password auth หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"`
- wizard จะสร้าง shared-secret auth โดยค่าเริ่มต้น และโดยปกติจะสร้าง
  gateway token ให้ด้วย (แม้บน loopback)
- ในโหมด shared-secret UI จะส่ง `connect.params.auth.token` หรือ
  `connect.params.auth.password`
- ในโหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve หรือ `trusted-proxy`
  การตรวจสอบ WebSocket auth จะผ่านจาก request headers แทน
- สำหรับการปรับใช้ Control UI แบบ non-loopback ให้ตั้ง `gateway.controlUi.allowedOrigins`
  อย่างชัดเจน (origin แบบเต็ม) หากไม่ตั้งค่าไว้ การเริ่มต้น gateway จะถูกปฏิเสธโดยค่าเริ่มต้น
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` เปิดใช้
  โหมด fallback ของ origin จาก Host header แต่เป็นการลดระดับความปลอดภัยที่มีความเสี่ยง
- เมื่อใช้ Serve, Tailscale identity headers สามารถทำให้ Control UI/WebSocket auth
  ผ่านได้เมื่อ `gateway.auth.allowTailscale` เป็น `true` (ไม่ต้องใช้ token/password)
  ส่วน HTTP API endpoints จะไม่ใช้ Tailscale identity headers เหล่านั้น; แต่จะทำตาม
  โหมด HTTP auth ปกติของ gateway แทน ตั้งค่า
  `gateway.auth.allowTailscale: false` หากต้องการให้ต้องใช้ credentials อย่างชัดเจน ดู
  [Tailscale](/th/gateway/tailscale) และ [ความปลอดภัย](/th/gateway/security) โฟลว์
  แบบไม่ใช้โทเค็นนี้ถือว่าโฮสต์ของ gateway เป็นโฮสต์ที่เชื่อถือได้
- `gateway.tailscale.mode: "funnel"` ต้องใช้ `gateway.auth.mode: "password"` (รหัสผ่านที่ใช้ร่วมกัน)

## การ build UI

Gateway ให้บริการไฟล์สแตติกจาก `dist/control-ui` build ได้ด้วย:

```bash
pnpm ui:build
```
