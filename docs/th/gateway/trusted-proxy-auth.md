---
read_when:
    - การรัน OpenClaw หลัง identity-aware proxy
    - การตั้งค่า Pomerium, Caddy หรือ nginx พร้อม OAuth ไว้หน้า OpenClaw
    - การแก้ไขข้อผิดพลาด WebSocket 1008 unauthorized ในการตั้งค่า reverse proxy
    - การตัดสินใจว่าจะตั้งค่า HSTS และ HTTP hardening headers อื่น ๆ ที่จุดใด
summary: มอบหมายการยืนยันตัวตนของ gateway ให้กับ reverse proxy ที่เชื่อถือได้ (Pomerium, Caddy, nginx + OAuth)
title: Trusted proxy auth
x-i18n:
    generated_at: "2026-04-24T09:13:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **ฟีเจอร์ที่ไวต่อความปลอดภัย** โหมดนี้มอบหมายการยืนยันตัวตนทั้งหมดให้กับ reverse proxy ของคุณ การกำหนดค่าที่ผิดพลาดอาจทำให้ Gateway ของคุณเปิดให้เข้าถึงโดยไม่ได้รับอนุญาต โปรดอ่านหน้านี้อย่างละเอียดก่อนเปิดใช้งาน

## ควรใช้เมื่อใด

ใช้โหมด auth แบบ `trusted-proxy` เมื่อ:

- คุณรัน OpenClaw อยู่หลัง **identity-aware proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- proxy ของคุณจัดการการยืนยันตัวตนทั้งหมด และส่งตัวตนของผู้ใช้ผ่าน headers
- คุณอยู่ในสภาพแวดล้อม Kubernetes หรือคอนเทนเนอร์ที่ proxy เป็นเส้นทางเดียวไปยัง Gateway
- คุณพบข้อผิดพลาด WebSocket `1008 unauthorized` เพราะเบราว์เซอร์ไม่สามารถส่ง tokens ใน WS payloads ได้

## ไม่ควรใช้เมื่อใด

- หาก proxy ของคุณไม่ได้ยืนยันตัวตนผู้ใช้ (เป็นเพียง TLS terminator หรือ load balancer)
- หากมีเส้นทางใดก็ตามไปยัง Gateway ที่ข้าม proxy ได้ (ช่องโหว่ไฟร์วอลล์ การเข้าถึงเครือข่ายภายใน)
- หากคุณไม่แน่ใจว่า proxy ของคุณลบ/เขียนทับ forwarded headers ได้ถูกต้องหรือไม่
- หากคุณต้องการเพียงการเข้าถึงส่วนตัวแบบผู้ใช้คนเดียว (พิจารณา Tailscale Serve + loopback เพื่อการตั้งค่าที่ง่ายกว่า)

## การทำงานของมัน

1. reverse proxy ของคุณยืนยันตัวตนผู้ใช้ (OAuth, OIDC, SAML เป็นต้น)
2. Proxy เพิ่ม header ที่มีตัวตนของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว (เช่น `x-forwarded-user: nick@example.com`)
3. OpenClaw ตรวจสอบว่าคำขอนั้นมาจาก **IP ของ proxy ที่เชื่อถือได้** (กำหนดไว้ใน `gateway.trustedProxies`)
4. OpenClaw ดึงตัวตนของผู้ใช้ออกจาก header ที่กำหนดค่าไว้
5. หากทุกอย่างถูกต้อง คำขอนั้นจะได้รับอนุญาต

## พฤติกรรมการจับคู่ของ Control UI

เมื่อ `gateway.auth.mode = "trusted-proxy"` ทำงานอยู่ และคำขอผ่าน
การตรวจสอบ trusted-proxy แล้ว เซสชัน WebSocket ของ Control UI จะสามารถเชื่อมต่อได้โดยไม่ต้องมี
ตัวตนจาก device pairing

ผลที่ตามมา:

- Pairing จะไม่ใช่เกตหลักสำหรับการเข้าถึง Control UI ในโหมดนี้อีกต่อไป
- นโยบาย auth ของ reverse proxy ของคุณและ `allowUsers` จะกลายเป็นตัวควบคุมการเข้าถึงที่มีผลจริง
- ให้ล็อก ingress ของ gateway ไว้เฉพาะ IP ของ trusted proxy เท่านั้น (`gateway.trustedProxies` + firewall)

## การกำหนดค่า

```json5
{
  gateway: {
    // trusted-proxy auth คาดหวังคำขอจากแหล่ง trusted proxy ที่ไม่ใช่ loopback
    bind: "lan",

    // สำคัญมาก: เพิ่มเฉพาะ IP ของ proxy ของคุณที่นี่เท่านั้น
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header ที่มีตัวตนของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว (จำเป็น)
        userHeader: "x-forwarded-user",

        // ไม่บังคับ: headers ที่ต้องมีอยู่เสมอ (การยืนยัน proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // ไม่บังคับ: จำกัดเฉพาะผู้ใช้บางราย (ว่าง = อนุญาตทั้งหมด)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

กฎ runtime ที่สำคัญ:

- trusted-proxy auth จะปฏิเสธคำขอจากแหล่ง loopback (`127.0.0.1`, `::1`, loopback CIDRs)
- reverse proxy แบบ loopback บนโฮสต์เดียวกัน **ไม่** ผ่านเงื่อนไขของ trusted-proxy auth
- สำหรับการตั้งค่า proxy แบบ loopback บนโฮสต์เดียวกัน ให้ใช้ token/password auth แทน หรือกำหนดเส้นทางผ่านที่อยู่ trusted proxy ที่ไม่ใช่ loopback ซึ่ง OpenClaw สามารถตรวจสอบได้
- การ deploy Control UI ที่ไม่ใช่ loopback ยังต้องใช้ `gateway.controlUi.allowedOrigins` แบบ explicit
- **หลักฐานจาก forwarded-header จะ override ความเป็น loopback** หากคำขอมาถึงบน loopback แต่มี headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ที่ชี้ไปยังต้นทางที่ไม่ใช่ local หลักฐานนั้นจะทำให้ข้ออ้างเรื่อง loopback locality ใช้ไม่ได้ คำขอนั้นจะถูกปฏิบัติเป็น remote สำหรับ pairing, trusted-proxy auth และการควบคุมตัวตนอุปกรณ์ของ Control UI สิ่งนี้ช่วยป้องกันไม่ให้ proxy แบบ loopback บนโฮสต์เดียวกันฟอก forwarded-header identity เข้าสู่ trusted-proxy auth

### เอกสารอ้างอิงการกำหนดค่า

| ฟิลด์                                      | จำเป็น | คำอธิบาย                                                                  |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                   | ใช่    | อาร์เรย์ของ IP address ของ proxy ที่เชื่อถือได้ คำขอจาก IP อื่นจะถูกปฏิเสธ |
| `gateway.auth.mode`                        | ใช่    | ต้องเป็น `"trusted-proxy"`                                                |
| `gateway.auth.trustedProxy.userHeader`     | ใช่    | ชื่อ header ที่มีตัวตนของผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว                  |
| `gateway.auth.trustedProxy.requiredHeaders`| ไม่    | headers เพิ่มเติมที่ต้องมีอยู่เพื่อให้คำขอนั้นเชื่อถือได้                 |
| `gateway.auth.trustedProxy.allowUsers`     | ไม่    | allowlist ของตัวตนผู้ใช้ ค่าว่างหมายถึงอนุญาตผู้ใช้ที่ผ่านการยืนยันตัวตนทั้งหมด |

## TLS termination และ HSTS

ใช้จุด TLS termination เพียงจุดเดียว และตั้งค่า HSTS ที่จุดนั้น

### รูปแบบที่แนะนำ: proxy เป็นผู้ทำ TLS termination

เมื่อ reverse proxy ของคุณจัดการ HTTPS ให้กับ `https://control.example.com` ให้ตั้ง
`Strict-Transport-Security` ที่ proxy สำหรับโดเมนนั้น

- เหมาะกับการ deploy ที่เปิดสู่อินเทอร์เน็ต
- ทำให้ certificate + นโยบาย HTTP hardening อยู่รวมกันในที่เดียว
- OpenClaw สามารถอยู่บน loopback HTTP หลัง proxy ได้

ตัวอย่างค่า header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway เป็นผู้ทำ TLS termination

หาก OpenClaw ให้บริการ HTTPS โดยตรง (ไม่มี proxy ที่ทำ TLS termination) ให้ตั้งค่า:

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

`strictTransportSecurity` รับค่าเป็นสตริงของ header หรือ `false` เพื่อปิดใช้งานอย่างชัดเจน

### แนวทางการทยอยใช้งาน

- เริ่มด้วย max age ที่สั้นก่อน (เช่น `max-age=300`) ขณะตรวจสอบทราฟฟิก
- เพิ่มเป็นค่าระยะยาว (เช่น `max-age=31536000`) เมื่อมั่นใจแล้วเท่านั้น
- เพิ่ม `includeSubDomains` ก็ต่อเมื่อทุก subdomain พร้อมใช้ HTTPS
- ใช้ preload ก็ต่อเมื่อคุณตั้งใจทำให้ตรงตามข้อกำหนด preload สำหรับชุดโดเมนทั้งหมดของคุณ
- การพัฒนาแบบ local ที่มีเพียง loopback ไม่ได้ประโยชน์จาก HSTS

## ตัวอย่างการตั้งค่า Proxy

### Pomerium

Pomerium ส่งตัวตนผ่าน `x-pomerium-claim-email` (หรือ claim headers อื่น) และ JWT ผ่าน `x-pomerium-jwt-assertion`

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

Caddy ที่ใช้ Plugin `caddy-security` สามารถยืนยันตัวตนผู้ใช้และส่ง identity headers ได้

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

oauth2-proxy ยืนยันตัวตนผู้ใช้และส่งตัวตนผ่าน `x-auth-request-email`

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

OpenClaw จะปฏิเสธการกำหนดค่าที่กำกวมซึ่งมีทั้ง `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`) และโหมด `trusted-proxy` ทำงานพร้อมกัน การกำหนดค่า token แบบผสมอาจทำให้คำขอ loopback ถูกยืนยันตัวตนอย่างเงียบ ๆ ผ่านเส้นทาง auth ที่ผิด

หากคุณเห็นข้อผิดพลาด `mixed_trusted_proxy_token` ตอนเริ่มต้นระบบ:

- ลบ shared token ออกเมื่อใช้โหมด trusted-proxy หรือ
- สลับ `gateway.auth.mode` เป็น `"token"` หากคุณตั้งใจใช้ token-based auth

trusted-proxy auth สำหรับ loopback ยังล้มเหลวแบบปิดด้วย: ผู้เรียกบนโฮสต์เดียวกันต้องส่ง identity headers ที่กำหนดค่าผ่าน trusted proxy แทนการถูกยืนยันตัวตนอย่างเงียบ ๆ

## Operator scopes header

trusted-proxy auth เป็นโหมด HTTP แบบ **มีตัวตนกำกับ** ดังนั้นผู้เรียก
สามารถประกาศ operator scopes ผ่าน `x-openclaw-scopes` ได้ตามตัวเลือก

ตัวอย่าง:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

พฤติกรรม:

- เมื่อมี header นี้ OpenClaw จะยึดตามชุด scopes ที่ประกาศไว้
- เมื่อมี header นี้แต่ค่าว่าง คำขอนั้นจะประกาศว่า **ไม่มี** operator scopes
- เมื่อไม่มี header นี้ HTTP APIs แบบมีตัวตนกำกับจะ fallback ไปใช้ชุด scope ค่าเริ่มต้นมาตรฐานของ operator
- เส้นทาง **plugin HTTP** ที่ใช้ gateway-auth จะแคบกว่าโดยค่าเริ่มต้น: เมื่อไม่มี `x-openclaw-scopes` runtime scope ของพวกมันจะ fallback ไปเป็น `operator.write`
- คำขอ HTTP ที่มีต้นทางจากเบราว์เซอร์ยังต้องผ่าน `gateway.controlUi.allowedOrigins` (หรือโหมด Host-header fallback ที่ตั้งใจเปิดไว้) แม้ trusted-proxy auth จะสำเร็จแล้วก็ตาม

กฎเชิงปฏิบัติ:

- ส่ง `x-openclaw-scopes` อย่างชัดเจนเมื่อคุณต้องการให้คำขอ trusted-proxy
  มีขอบเขตแคบกว่าค่าเริ่มต้น หรือเมื่อเส้นทาง gateway-auth plugin route ต้องการ
  สิทธิ์ที่แรงกว่า write scope

## เช็กลิสต์ด้านความปลอดภัย

ก่อนเปิดใช้ trusted-proxy auth ให้ตรวจสอบว่า:

- [ ] **Proxy เป็นเส้นทางเดียว**: พอร์ต Gateway ถูกไฟร์วอลล์ป้องกันจากทุกอย่าง ยกเว้น proxy ของคุณ
- [ ] **trustedProxies มีขอบเขตแคบที่สุด**: ใส่เฉพาะ IP ของ proxy จริง ไม่ใช่ทั้ง subnet
- [ ] **ไม่มีแหล่ง proxy แบบ loopback**: trusted-proxy auth จะล้มเหลวแบบปิดสำหรับคำขอจากแหล่ง loopback
- [ ] **Proxy ลบ headers**: proxy ของคุณเขียนทับ (ไม่ใช่ต่อท้าย) `x-forwarded-*` headers จาก clients
- [ ] **TLS termination**: proxy ของคุณจัดการ TLS; ผู้ใช้เชื่อมต่อผ่าน HTTPS
- [ ] **allowedOrigins เป็นแบบ explicit**: Control UI ที่ไม่ใช่ loopback ใช้ `gateway.controlUi.allowedOrigins` แบบ explicit
- [ ] **ตั้งค่า allowUsers แล้ว** (แนะนำ): จำกัดเฉพาะผู้ใช้ที่รู้จัก แทนที่จะอนุญาตทุกคนที่ยืนยันตัวตนผ่านแล้ว
- [ ] **ไม่มีการตั้งค่า token แบบผสม**: อย่าตั้งทั้ง `gateway.auth.token` และ `gateway.auth.mode: "trusted-proxy"`

## การตรวจสอบความปลอดภัย

`openclaw security audit` จะทำเครื่องหมาย trusted-proxy auth เป็น finding ระดับ **critical** ซึ่งเป็นความตั้งใจ — เพื่อเตือนว่าคุณกำลังมอบหมายความปลอดภัยให้กับการตั้งค่า proxy ของคุณ

การ audit จะตรวจสอบสิ่งต่อไปนี้:

- คำเตือน/คำเตือนวิกฤตพื้นฐาน `gateway.trusted_proxy_auth`
- ไม่มีการกำหนดค่า `trustedProxies`
- ไม่มีการกำหนดค่า `userHeader`
- `allowUsers` ว่าง (อนุญาตผู้ใช้ที่ผ่านการยืนยันตัวตนแล้วทุกคน)
- นโยบาย browser-origin บนพื้นผิว Control UI ที่เปิดเผยมี wildcard หรือหายไป

## การแก้ไขปัญหา

### "trusted_proxy_untrusted_source"

คำขอไม่ได้มาจาก IP ใน `gateway.trustedProxies` ตรวจสอบ:

- IP ของ proxy ถูกต้องหรือไม่ (IP ของคอนเทนเนอร์ Docker อาจเปลี่ยนได้)
- มี load balancer อยู่หน้า proxy ของคุณหรือไม่
- ใช้ `docker inspect` หรือ `kubectl get pods -o wide` เพื่อหา IP จริง

### "trusted_proxy_loopback_source"

OpenClaw ปฏิเสธคำขอ trusted-proxy ที่มาจากแหล่ง loopback

ตรวจสอบ:

- proxy เชื่อมต่อมาจาก `127.0.0.1` / `::1` หรือไม่
- คุณกำลังพยายามใช้ trusted-proxy auth กับ reverse proxy แบบ loopback บนโฮสต์เดียวกันหรือไม่

วิธีแก้ไข:

- ใช้ token/password auth สำหรับการตั้งค่า proxy แบบ loopback บนโฮสต์เดียวกัน หรือ
- กำหนดเส้นทางผ่าน trusted proxy address ที่ไม่ใช่ loopback และคง IP นั้นไว้ใน `gateway.trustedProxies`

### "trusted_proxy_user_missing"

user header ว่างหรือหายไป ตรวจสอบ:

- proxy ของคุณถูกกำหนดค่าให้ส่ง identity headers หรือไม่
- ชื่อ header ถูกต้องหรือไม่ (ไม่สนตัวพิมพ์เล็กใหญ่ แต่การสะกดต้องถูก)
- ผู้ใช้ยืนยันตัวตนที่ proxy แล้วจริงหรือไม่

### "trusted*proxy_missing_header*\*"

required header ไม่มีอยู่ ตรวจสอบ:

- การกำหนดค่า proxy ของคุณสำหรับ headers เหล่านั้นโดยเฉพาะ
- headers ถูกลบออกที่จุดใดในสายโซ่หรือไม่

### "trusted_proxy_user_not_allowed"

ผู้ใช้ยืนยันตัวตนแล้ว แต่ไม่อยู่ใน `allowUsers` ให้เพิ่มผู้ใช้นั้น หรือเอา allowlist ออก

### "trusted_proxy_origin_not_allowed"

trusted-proxy auth สำเร็จแล้ว แต่ browser `Origin` header ไม่ผ่านการตรวจสอบ origin ของ Control UI

ตรวจสอบ:

- `gateway.controlUi.allowedOrigins` มี browser origin ที่ตรงกันทุกตัวอักษรอยู่แล้ว
- คุณไม่ได้พึ่ง wildcard origins เว้นแต่ตั้งใจจะให้พฤติกรรมอนุญาตทั้งหมด
- หากคุณตั้งใจใช้โหมด Host-header fallback, ได้ตั้ง `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ไว้อย่างตั้งใจแล้ว

### WebSocket ยังล้มเหลวอยู่

ตรวจสอบให้แน่ใจว่า proxy ของคุณ:

- รองรับ WebSocket upgrades (`Upgrade: websocket`, `Connection: upgrade`)
- ส่ง identity headers ไปกับคำขอ WebSocket upgrade ด้วย (ไม่ใช่เฉพาะ HTTP)
- ไม่มีเส้นทาง auth แยกต่างหากสำหรับการเชื่อมต่อ WebSocket

## การย้ายจาก Token Auth

หากคุณกำลังย้ายจาก token auth ไปยัง trusted-proxy:

1. กำหนดค่า proxy ของคุณให้ยืนยันตัวตนผู้ใช้และส่ง headers
2. ทดสอบการตั้งค่า proxy แยกต่างหาก (curl พร้อม headers)
3. อัปเดต config ของ OpenClaw ให้ใช้ trusted-proxy auth
4. รีสตาร์ต Gateway
5. ทดสอบการเชื่อมต่อ WebSocket จาก Control UI
6. รัน `openclaw security audit` และตรวจทาน findings

## ที่เกี่ยวข้อง

- [Security](/th/gateway/security) — คู่มือความปลอดภัยฉบับเต็ม
- [Configuration](/th/gateway/configuration) — เอกสารอ้างอิง config
- [Remote Access](/th/gateway/remote) — รูปแบบการเข้าถึงระยะไกลอื่น ๆ
- [Tailscale](/th/gateway/tailscale) — ทางเลือกที่ง่ายกว่าสำหรับการเข้าถึงเฉพาะ tailnet
