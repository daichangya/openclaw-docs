---
read_when:
    - การรัน OpenClaw หลัง identity-aware proxy
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้หน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 unauthorized ในการตั้งค่า reverse proxy
    - การตัดสินใจว่าควรตั้งค่า HSTS และ header เสริมความปลอดภัย HTTP อื่น ๆ ที่ใด
summary: มอบหมายการยืนยันตัวตนของ Gateway ให้กับ reverse proxy ที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-23T05:36:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **ฟีเจอร์ที่ไวต่อความปลอดภัย** โหมดนี้มอบหมายการยืนยันตัวตนทั้งหมดให้กับ reverse proxy ของคุณ การกำหนดค่าที่ผิดพลาดอาจเปิดให้มีการเข้าถึง Gateway โดยไม่ได้รับอนุญาต โปรดอ่านหน้านี้อย่างละเอียดก่อนเปิดใช้งาน

## ใช้เมื่อใด

ใช้โหมด auth แบบ `trusted-proxy` เมื่อ:

- คุณรัน OpenClaw หลัง **identity-aware proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- พร็อกซีของคุณจัดการการยืนยันตัวตนทั้งหมดและส่งต่อข้อมูลตัวตนผู้ใช้ผ่าน header
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือคอนเทนเนอร์ที่พร็อกซีเป็นเส้นทางเดียวไปยัง Gateway
- คุณเจอข้อผิดพลาด WebSocket `1008 unauthorized` เพราะเบราว์เซอร์ไม่สามารถส่ง token ใน WS payload ได้

## ไม่ควรใช้เมื่อใด

- หากพร็อกซีของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นเพียงตัวจบ TLS หรือ load balancer)
- หากมีเส้นทางใดก็ตามไปยัง Gateway ที่ข้ามพร็อกซีได้ (ช่องโหว่ไฟร์วอลล์, การเข้าถึงผ่านเครือข่ายภายใน)
- หากคุณไม่แน่ใจว่าพร็อกซีของคุณลบ/เขียนทับ forwarded header ได้อย่างถูกต้องหรือไม่
- หากคุณต้องการเพียงการเข้าถึงส่วนตัวสำหรับผู้ใช้คนเดียว (พิจารณา Tailscale Serve + loopback เพื่อการตั้งค่าที่ง่ายกว่า)

## วิธีการทำงาน

1. reverse proxy ของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML ฯลฯ)
2. พร็อกซีเพิ่ม header ที่มีข้อมูลตัวตนของผู้ใช้ที่ยืนยันแล้ว (เช่น `x-forwarded-user: nick@example.com`)
3. OpenClaw ตรวจสอบว่าคำขอมาจาก **IP ของ trusted proxy** (กำหนดไว้ใน `gateway.trustedProxies`)
4. OpenClaw ดึงข้อมูลตัวตนผู้ใช้จาก header ที่กำหนดไว้
5. หากทุกอย่างถูกต้อง คำขอนั้นจะได้รับอนุญาต

## พฤติกรรมการ pairing ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` เปิดใช้งานอยู่ และคำขอผ่าน
การตรวจสอบ trusted-proxy แล้ว เซสชัน WebSocket ของ Control UI สามารถเชื่อมต่อได้โดยไม่ต้องมี
ตัวตนจากการ pairing ของอุปกรณ์

ผลที่ตามมา:

- Pairing จะไม่ใช่ด่านหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบาย auth ของ reverse proxy และ `allowUsers` ของคุณจะกลายเป็นตัวควบคุมการเข้าถึงที่มีผลจริง
- ควรล็อก ingress ของ gateway ให้รับเฉพาะจาก IP ของ trusted proxy เท่านั้น (`gateway.trustedProxies` + ไฟร์วอลล์)

## การกำหนดค่า

```json5
{
  gateway: {
    // trusted-proxy auth คาดหวังคำขอจากแหล่ง trusted proxy ที่ไม่ใช่ loopback
    bind: "lan",

    // สำคัญมาก: ใส่เฉพาะ IP ของพร็อกซีของคุณที่นี่
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // header ที่มีข้อมูลตัวตนของผู้ใช้ที่ยืนยันแล้ว (จำเป็น)
        userHeader: "x-forwarded-user",

        // ไม่บังคับ: header ที่ต้องมีเสมอ (ใช้ยืนยันพร็อกซี)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // ไม่บังคับ: จำกัดเฉพาะผู้ใช้บางราย (ว่าง = อนุญาตทุกคน)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

กฎ runtime ที่สำคัญ:

- trusted-proxy auth จะปฏิเสธคำขอจากแหล่ง loopback (`127.0.0.1`, `::1`, loopback CIDRs)
- reverse proxy แบบ loopback บนโฮสต์เดียวกัน **ไม่** ผ่านเงื่อนไข trusted-proxy auth
- สำหรับการตั้งค่า loopback proxy บนโฮสต์เดียวกัน ให้ใช้ token/password auth แทน หรือกำหนดเส้นทางผ่านที่อยู่ trusted proxy แบบไม่ใช่ loopback ที่ OpenClaw สามารถตรวจสอบได้
- การติดตั้ง Control UI แบบไม่ใช่ loopback ยังคงต้องมี `gateway.controlUi.allowedOrigins` อย่างชัดเจน

### เอกสารอ้างอิงการกำหนดค่า

| ฟิลด์                                      | จำเป็น | คำอธิบาย                                                                    |
| ------------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `gateway.trustedProxies`                   | ใช่    | อาร์เรย์ของ IP พร็อกซีที่เชื่อถือได้ คำขอจาก IP อื่นจะถูกปฏิเสธ               |
| `gateway.auth.mode`                        | ใช่    | ต้องเป็น `"trusted-proxy"`                                                  |
| `gateway.auth.trustedProxy.userHeader`     | ใช่    | ชื่อ header ที่มีข้อมูลตัวตนของผู้ใช้ที่ยืนยันแล้ว                           |
| `gateway.auth.trustedProxy.requiredHeaders`| ไม่    | header เพิ่มเติมที่ต้องมีเพื่อให้คำขอถูกนับว่าเชื่อถือได้                    |
| `gateway.auth.trustedProxy.allowUsers`     | ไม่    | allowlist ของข้อมูลตัวตนผู้ใช้ ว่างหมายถึงอนุญาตทุกผู้ใช้ที่ยืนยันตัวตนแล้ว |

## TLS termination และ HSTS

ใช้จุดจบ TLS เพียงจุดเดียวและใช้ HSTS ที่จุดนั้น

### รูปแบบที่แนะนำ: proxy TLS termination

เมื่อ reverse proxy ของคุณจัดการ HTTPS ให้ `https://control.example.com` ให้ตั้ง
`Strict-Transport-Security` ที่พร็อกซีสำหรับโดเมนนั้น

- เหมาะกับการติดตั้งที่เปิดออกสู่อินเทอร์เน็ต
- ทำให้นโยบาย certificate + การเสริมความแข็งแกร่งของ HTTP อยู่ในที่เดียว
- OpenClaw สามารถคงเป็น loopback HTTP หลังพร็อกซีได้

ตัวอย่างค่า header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS termination

หาก OpenClaw ให้บริการ HTTPS โดยตรง (ไม่มีพร็อกซีที่จบ TLS) ให้ตั้งค่า:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` รับค่าเป็นสตริงของ header หรือ `false` เพื่อปิดอย่างชัดเจน

### แนวทางการทยอยใช้งาน

- เริ่มด้วย max age ที่สั้นก่อน (เช่น `max-age=300`) ระหว่างตรวจสอบทราฟฟิก
- เพิ่มไปเป็นค่าระยะยาว (เช่น `max-age=31536000`) เมื่อมีความมั่นใจสูงแล้วเท่านั้น
- เพิ่ม `includeSubDomains` เฉพาะเมื่อทุก subdomain พร้อมใช้ HTTPS
- ใช้ preload เฉพาะเมื่อคุณตั้งใจทำตามข้อกำหนด preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาในเครื่องแบบ loopback-only ไม่ได้ประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่าพร็อกซี

### Pomerium

Pomerium ส่งข้อมูลตัวตนผ่าน `x-pomerium-claim-email` (หรือ claim header อื่น) และ JWT ผ่าน `x-pomerium-jwt-assertion`

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP ของ Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

ตัวอย่าง config ของ Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy พร้อม OAuth

Caddy ที่ใช้ plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่ง header ระบุตัวตนได้

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP ของ Caddy/sidecar proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

ตัวอย่าง Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy ยืนยันตัวตนผู้ใช้และส่งข้อมูลตัวตนผ่าน `x-auth-request-email`

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP ของ nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

ตัวอย่าง config ของ nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik พร้อม Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP ของคอนเทนเนอร์ Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## การกำหนดค่า token แบบผสม

OpenClaw จะปฏิเสธการกำหนดค่าที่กำกวม ซึ่งมีทั้ง `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) และโหมด `trusted-proxy` ทำงานอยู่ในเวลาเดียวกัน การกำหนดค่า token แบบผสมอาจทำให้คำขอ loopback ถูกยืนยันตัวตนอย่างเงียบ ๆ ผ่านเส้นทาง auth ที่ผิด

หากคุณพบข้อผิดพลาด `mixed_trusted_proxy_token` ตอนเริ่มต้น:

- ให้ลบ shared token เมื่อใช้โหมด trusted-proxy หรือ
- เปลี่ยน `gateway.auth.mode` เป็น `"token"` หากคุณตั้งใจใช้ auth แบบ token

trusted-proxy auth แบบ loopback ยังล้มเหลวแบบ fail closed ด้วย: ผู้เรียกบนโฮสต์เดียวกันต้องส่ง header ระบุตัวตนที่กำหนดผ่าน trusted proxy แทนการถูกยืนยันตัวตนแบบเงียบ ๆ

## header ของ operator scopes

trusted-proxy auth เป็นโหมด HTTP แบบ **มีข้อมูลตัวตน** ดังนั้นผู้เรียก
อาจประกาศ operator scope ผ่าน `x-openclaw-scopes` ได้ตามตัวเลือก

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมี header นี้ OpenClaw จะเคารพชุด scope ที่ประกาศไว้
- เมื่อมี header นี้แต่ค่าว่าง คำขอนั้นจะประกาศว่า **ไม่มี** operator scope
- เมื่อไม่มี header นี้ HTTP API แบบมีข้อมูลตัวตนปกติจะ fallback ไปใช้ชุด scope เริ่มต้นมาตรฐานของ operator
- **plugin HTTP routes** ที่ใช้ gateway-auth จะแคบกว่าโดยค่าเริ่มต้น: เมื่อไม่มี `x-openclaw-scopes` scope ขณะรันของมันจะ fallback เป็น `operator.write`
- คำขอ HTTP จากเบราว์เซอร์ยังต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมด deliberate Host-header fallback) แม้ trusted-proxy auth จะสำเร็จแล้วก็ตาม

กฎเชิงปฏิบัติ:

- ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอ trusted-proxy
  แคบกว่าค่าเริ่มต้น หรือเมื่อเส้นทาง gateway-auth plugin route ต้องการ
  สิทธิ์ที่แรงกว่า write scope

## เช็กลิสต์ด้านความปลอดภัย

ก่อนเปิดใช้ trusted-proxy auth ให้ตรวจสอบว่า:

- [ ] **พร็อกซีเป็นเส้นทางเดียว**: พอร์ตของ Gateway ถูกไฟร์วอลล์ป้องกันจากทุกอย่างยกเว้นพร็อกซีของคุณ
- [ ] **trustedProxies แคบที่สุด**: มีเฉพาะ IP ของพร็อกซีจริงของคุณ ไม่ใช่ทั้ง subnet
- [ ] **ไม่มีแหล่งพร็อกซีแบบ loopback**: trusted-proxy auth จะ fail closed สำหรับคำขอจากแหล่ง loopback
- [ ] **พร็อกซีลบ header เอง**: พร็อกซีของคุณเขียนทับ (ไม่ใช่ต่อท้าย) `x-forwarded-*` header จากไคลเอนต์
- [ ] **TLS termination**: พร็อกซีของคุณจัดการ TLS; ผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **allowedOrigins ระบุชัดเจน**: Control UI ที่ไม่ใช่ loopback ใช้ `gateway.controlUi.allowedOrigins` แบบ explicit
- [ ] **ตั้งค่า allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนที่จะอนุญาตทุกคนที่ยืนยันตัวตนแล้ว
- [ ] **ไม่มีการกำหนดค่า token แบบผสม**: อย่าตั้งทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"`

## การตรวจสอบความปลอดภัย

`openclaw security audit` จะทำเครื่องหมาย trusted-proxy auth เป็นข้อค้นพบระดับ **critical** ซึ่งเป็นความตั้งใจ — เพื่อเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้กับการตั้งค่าพร็อกซีของคุณ

การตรวจสอบจะเช็ก:

- คำเตือน/ตัวเตือนระดับ critical พื้นฐาน `gateway.trusted_proxy_auth`
- การไม่มี config `trustedProxies`
- การไม่มี config `userHeader`
- `allowUsers` ว่าง (อนุญาตผู้ใช้ที่ยืนยันตัวตนแล้วทุกคน)
- นโยบาย browser-origin แบบ wildcard หรือหายไปบนพื้นผิว Control UI ที่เปิดเผยออกไป

## การแก้ไขปัญหา

### "trusted_proxy_untrusted_source"

คำขอไม่ได้มาจาก IP ใน `gateway.trustedProxies` ตรวจสอบ:

- IP ของพร็อกซีถูกต้องหรือไม่? (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนได้)
- มี load balancer อยู่หน้าพร็อกซีของคุณหรือไม่?
- ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อหาค่า IP จริง

### "trusted_proxy_loopback_source"

OpenClaw ปฏิเสธคำขอ trusted-proxy จากแหล่ง loopback

ตรวจสอบ:

- พร็อกซีกำลังเชื่อมต่อมาจาก `127.0.0.1` / `::1` หรือไม่?
- คุณกำลังพยายามใช้ trusted-proxy auth กับ reverse proxy แบบ loopback บนโฮสต์เดียวกันหรือไม่?

วิธีแก้ไข:

- ใช้ token/password auth สำหรับการตั้งค่า loopback proxy บนโฮสต์เดียวกัน หรือ
- กำหนดเส้นทางผ่านที่อยู่ trusted proxy แบบไม่ใช่ loopback และคง IP นั้นไว้ใน `gateway.trustedProxies`

### "trusted_proxy_user_missing"

header ผู้ใช้ว่างเปล่าหรือไม่มีอยู่ ตรวจสอบ:

- พร็อกซีของคุณถูกตั้งค่าให้ส่ง header ระบุตัวตนหรือไม่?
- ชื่อ header ถูกต้องหรือไม่? (ไม่สนตัวพิมพ์เล็ก-ใหญ่ แต่การสะกดสำคัญ)
- ผู้ใช้ได้ยืนยันตัวตนที่พร็อกซีจริงหรือไม่?

### "trusted*proxy_missing_header*\*"

ไม่มี required header ที่กำหนดไว้ ตรวจสอบ:

- การกำหนดค่าพร็อกซีของคุณสำหรับ header เหล่านั้นโดยเฉพาะ
- มีการลบ header ทิ้งที่ใดที่หนึ่งใน chain หรือไม่

### "trusted_proxy_user_not_allowed"

ผู้ใช้ยืนยันตัวตนแล้ว แต่ไม่ได้อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้นั้น หรือเอา allowlist ออก

### "trusted_proxy_origin_not_allowed"

trusted-proxy auth สำเร็จแล้ว แต่ header `Origin` ของเบราว์เซอร์ไม่ผ่านการตรวจสอบ origin ของ Control UI

ตรวจสอบ:

- `gateway.controlUi.allowedOrigins` มี browser origin ที่ตรงกันแบบพอดี
- คุณไม่ได้พึ่ง wildcard origin เว้นแต่ตั้งใจต้องการพฤติกรรมอนุญาตทั้งหมด
- หากคุณตั้งใจใช้โหมด fallback แบบ Host-header ให้ตั้ง `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` อย่างตั้งใจ

### WebSocket ยังล้มเหลวอยู่

ตรวจสอบให้แน่ใจว่าพร็อกซีของคุณ:

- รองรับการอัปเกรด WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- ส่งต่อ header ระบุตัวตนบนคำขออัปเกรด WebSocket ด้วย (ไม่ใช่เฉพาะ HTTP)
- ไม่มีเส้นทาง auth แยกต่างหากสำหรับการเชื่อมต่อ WebSocket

## การย้ายจาก token auth

หากคุณกำลังย้ายจาก token auth ไปเป็น trusted-proxy:

1. กำหนดค่าพร็อกซีของคุณให้ยืนยันตัวตนผู้ใช้และส่ง header ต่อ
2. ทดสอบการตั้งค่าพร็อกซีแยกต่างหากก่อน (curl พร้อม header)
3. อัปเดต config ของ OpenClaw ด้วย trusted-proxy auth
4. รีสตาร์ต Gateway
5. ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
6. รัน `openclaw security audit` และตรวจสอบผลที่พบ

## ที่เกี่ยวข้อง

- [ความปลอดภัย](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Configuration](/th/gateway/configuration) — เอกสารอ้างอิง config
- [การเข้าถึงระยะไกล](/th/gateway/remote) — รูปแบบการเข้าถึงระยะไกลอื่น ๆ
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงแบบ tailnet-only
