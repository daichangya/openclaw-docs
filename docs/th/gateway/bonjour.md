---
read_when:
    - การดีบักปัญหาการค้นหา Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือ UX ของการค้นหา
summary: การค้นหาและการดีบัก Bonjour/mDNS (สัญญาณประกาศของ Gateway, ไคลเอนต์ และโหมดความล้มเหลวที่พบบ่อย)
title: การค้นหา Bonjour
x-i18n:
    generated_at: "2026-04-24T09:08:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# การค้นหา Bonjour / mDNS

OpenClaw ใช้ Bonjour (mDNS / DNS‑SD) เพื่อค้นหา Gateway ที่กำลังทำงานอยู่ (ปลายทาง WebSocket)
การ browse แบบ multicast `local.` เป็นเพียง **ความสะดวกที่ใช้ได้เฉพาะใน LAN** เท่านั้น Plugin
`bonjour` ที่มาพร้อมระบบเป็นผู้ดูแลการประกาศบน LAN และเปิดใช้งานตามค่าเริ่มต้น สำหรับการค้นหาข้ามเครือข่าย
บีคอนตัวเดียวกันนี้ยังสามารถเผยแพร่ผ่านโดเมน wide-area DNS-SD ที่กำหนดค่าไว้ได้ด้วย
การค้นหายังคงเป็นแบบ best-effort และ **ไม่ได้** มาแทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก node และ gateway อยู่คนละเครือข่าย multicast mDNS จะไม่สามารถข้าม
ขอบเขตนั้นได้ คุณยังคงใช้ UX การค้นหาแบบเดิมได้โดยเปลี่ยนไปใช้ **unicast DNS‑SD**
("Wide‑Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รันเซิร์ฟเวอร์ DNS บนโฮสต์ gateway (ที่เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS‑SD สำหรับ `_openclaw-gw._tcp` ภายใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า **split DNS** ของ Tailscale เพื่อให้โดเมนที่คุณเลือกถูก resolve ผ่าน
   เซิร์ฟเวอร์ DNS นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับโดเมนการค้นหาใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่างเท่านั้น
iOS/Android nodes จะ browse ทั้ง `local.` และโดเมน wide‑area ที่คุณกำหนดค่าไว้

### การกำหนดค่า Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### การตั้งค่าเซิร์ฟเวอร์ DNS ครั้งเดียว (โฮสต์ gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้จะติดตั้ง CoreDNS และกำหนดค่าให้:

- ฟังที่พอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway เท่านั้น
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลของ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง IP tailnet ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้โดเมนการค้นหาของคุณใช้ nameserver นี้

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว iOS nodes และการค้นหาผ่าน CLI จะสามารถ browse
`_openclaw-gw._tcp` ในโดเมนการค้นหาของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของตัวฟัง Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback ตามค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet
ให้ bind อย่างชัดเจนและเปิดใช้ auth ไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้ง `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ต Gateway (หรือรีสตาร์ตแอป menubar บน macOS)

## สิ่งที่ประกาศ

มีเพียง Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp` การประกาศ multicast บน LAN
ให้บริการโดย Plugin `bonjour` ที่มาพร้อมระบบ; ส่วนการเผยแพร่ wide-area DNS-SD ยังคง
เป็นหน้าที่ของ Gateway

## ประเภทบริการ

- `_openclaw-gw._tcp` — บีคอนทรานสปอร์ตของ gateway (ใช้โดย macOS/iOS/Android nodes)

## คีย์ TXT (คำใบ้ที่ไม่เป็นความลับ)

Gateway จะประกาศคำใบ้ขนาดเล็กที่ไม่เป็นความลับเพื่อให้ flow ของ UI ใช้งานสะดวก:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้ canvas host; ปัจจุบันเป็นค่าเดียวกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (เฉพาะโหมดเต็มของ mDNS; เป็นคำใบ้แบบไม่บังคับเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมดเต็มของ mDNS; wide-area DNS-SD อาจละไว้)
- `cliPath=<path>` (เฉพาะโหมดเต็มของ mDNS; wide-area DNS-SD ยังคงเขียนค่านี้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS เป็นแบบ **ไม่ยืนยันตัวตน** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นข้อมูลกำหนดเส้นทางที่เชื่อถือได้
- ไคลเอนต์ควรกำหนดเส้นทางโดยใช้ปลายทางบริการที่ถูก resolve แล้ว (SRV + A/AAAA) ให้ถือว่า `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนดเป้าหมาย SSH อัตโนมัติก็ควรใช้โฮสต์บริการที่ถูก resolve แล้วเช่นกัน ไม่ใช่ใช้คำใบ้จาก TXT อย่างเดียว
- TLS pinning ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่จัดเก็บไว้ก่อนหน้านี้
- iOS/Android nodes ควรถือว่าการเชื่อมต่อโดยตรงที่อิงการค้นหาเป็นแบบ **TLS-only** และต้องให้ผู้ใช้ยืนยันอย่างชัดเจนก่อนเชื่อถือ fingerprint ครั้งแรก

## การดีบักบน macOS

เครื่องมือในตัวที่มีประโยชน์:

- Browse อินสแตนซ์:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve อินสแตนซ์หนึ่งรายการ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หาก browse ได้แต่ resolve ไม่ได้ โดยทั่วไปคุณกำลังเจอปัญหานโยบาย LAN หรือ
ปัญหาของตัว resolve mDNS

## การดีบักใน logs ของ Gateway

Gateway จะเขียน rolling log file (พิมพ์ตอนเริ่มต้นเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## การดีบักบน iOS node

iOS node ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

วิธีเก็บ logs:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำให้เกิดปัญหาซ้ำ → **Copy**

log นี้จะรวมการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของชุดผลลัพธ์

## โหมดความล้มเหลวที่พบบ่อย

- **Bonjour ข้ามเครือข่ายไม่ได้**: ใช้ Tailnet หรือ SSH
- **Multicast ถูกบล็อก**: เครือข่าย Wi‑Fi บางแห่งปิดใช้งาน mDNS
- **Sleep / interface churn**: macOS อาจทำให้ผลลัพธ์ mDNS หายไปชั่วคราว; ลองใหม่อีกครั้ง
- **Browse ได้แต่ resolve ไม่ได้**: ใช้ชื่อเครื่องแบบเรียบง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ต Gateway ชื่ออินสแตนซ์ของบริการได้มาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้บางตัว resolve สับสน

## ชื่ออินสแตนซ์ที่ escape (`\032`)

Bonjour/DNS‑SD มัก escape ไบต์ในชื่ออินสแตนซ์บริการเป็นลำดับทศนิยม `\DDD`
(เช่น ช่องว่างจะกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควรถอดรหัสก่อนแสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การปิดใช้งาน / การกำหนดค่า

- `openclaw plugins disable bonjour` ปิดการประกาศ multicast บน LAN โดยปิด Plugin ที่มาพร้อมระบบ
- `openclaw plugins enable bonjour` กู้คืน Plugin การค้นหา LAN เริ่มต้น
- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ multicast บน LAN โดยไม่แก้ config ของ Plugin; ค่าที่ถือว่าเป็นจริงได้แก่ `1`, `true`, `yes` และ `on` (แบบเดิม: `OPENCLAW_DISABLE_BONJOUR`)
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมดการ bind ของ Gateway
- `OPENCLAW_SSH_PORT` ใช้ override พอร์ต SSH เมื่อมีการประกาศ `sshPort` (แบบเดิม: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ MagicDNS ใน TXT เมื่อเปิดใช้โหมดเต็มของ mDNS (แบบเดิม: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` ใช้ override เส้นทาง CLI ที่ประกาศ (แบบเดิม: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือกทรานสปอร์ต: [การค้นหา](/th/gateway/discovery)
- การจับคู่ + การอนุมัติของ Node: [การจับคู่ Gateway](/th/gateway/pairing)
