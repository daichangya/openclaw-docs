---
read_when:
    - การดีบักปัญหาการค้นหา Bonjour บน macOS/iOS
    - การเปลี่ยนประเภทบริการ mDNS, ระเบียน TXT หรือ UX ของการค้นหา
summary: การค้นหาและการดีบัก Bonjour/mDNS (beacon ของ Gateway, ไคลเอนต์ และโหมดความล้มเหลวที่พบบ่อย)
title: การค้นหา Bonjour
x-i18n:
    generated_at: "2026-04-23T05:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# การค้นหา Bonjour / mDNS

OpenClaw ใช้ Bonjour (mDNS / DNS‑SD) เพื่อค้นหา Gateway ที่กำลังทำงานอยู่ (ปลายทาง WebSocket)
การ browse แบบ multicast `local.` เป็นเพียง **ความสะดวกบน LAN เท่านั้น** สำหรับการค้นหาข้ามเครือข่าย beacon เดียวกันนี้ยังสามารถเผยแพร่ผ่านโดเมน DNS-SD แบบ wide-area ที่กำหนดค่าไว้ได้ด้วย การค้นหายังคงเป็นแบบ best-effort และ **ไม่ได้** มาแทนที่การเชื่อมต่อผ่าน SSH หรือ Tailnet

## Wide-area Bonjour (Unicast DNS-SD) ผ่าน Tailscale

หาก Node และ Gateway อยู่คนละเครือข่าย multicast mDNS จะข้ามขอบเขตนั้นไม่ได้ คุณยังคงรักษา UX การค้นหาแบบเดิมไว้ได้โดยเปลี่ยนไปใช้ **unicast DNS‑SD**
("Wide‑Area Bonjour") ผ่าน Tailscale

ขั้นตอนระดับสูง:

1. รัน DNS server บนโฮสต์ gateway (ที่เข้าถึงได้ผ่าน Tailnet)
2. เผยแพร่ระเบียน DNS‑SD สำหรับ `_openclaw-gw._tcp` ภายใต้โซนเฉพาะ
   (ตัวอย่าง: `openclaw.internal.`)
3. กำหนดค่า Tailscale **split DNS** เพื่อให้โดเมนที่คุณเลือก resolve ผ่าน
   DNS server นั้นสำหรับไคลเอนต์ (รวมถึง iOS)

OpenClaw รองรับ discovery domain ใดก็ได้; `openclaw.internal.` เป็นเพียงตัวอย่าง
Node บน iOS/Android จะ browse ทั้ง `local.` และ wide‑area domain ที่คุณกำหนดค่าไว้

### คอนฟิก Gateway (แนะนำ)

```json5
{
  gateway: { bind: "tailnet" }, // เฉพาะ tailnet (แนะนำ)
  discovery: { wideArea: { enabled: true } }, // เปิดใช้การเผยแพร่ wide-area DNS-SD
}
```

### การตั้งค่า DNS server ครั้งเดียว (โฮสต์ gateway)

```bash
openclaw dns setup --apply
```

คำสั่งนี้จะติดตั้ง CoreDNS และกำหนดค่าให้:

- ฟังพอร์ต 53 เฉพาะบนอินเทอร์เฟซ Tailscale ของ gateway
- ให้บริการโดเมนที่คุณเลือก (ตัวอย่าง: `openclaw.internal.`) จาก `~/.openclaw/dns/<domain>.db`

ตรวจสอบจากเครื่องที่เชื่อมต่อ tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### การตั้งค่า DNS ของ Tailscale

ในคอนโซลผู้ดูแลของ Tailscale:

- เพิ่ม nameserver ที่ชี้ไปยัง tailnet IP ของ gateway (UDP/TCP 53)
- เพิ่ม split DNS เพื่อให้ discovery domain ของคุณใช้ nameserver นั้น

เมื่อไคลเอนต์ยอมรับ DNS ของ tailnet แล้ว Node บน iOS และการค้นหาจาก CLI จะสามารถ browse
`_openclaw-gw._tcp` ใน discovery domain ของคุณได้โดยไม่ต้องใช้ multicast

### ความปลอดภัยของตัวรับฟัง Gateway (แนะนำ)

พอร์ต WS ของ Gateway (ค่าเริ่มต้น `18789`) จะ bind กับ loopback เป็นค่าเริ่มต้น สำหรับการเข้าถึงผ่าน LAN/tailnet ให้ bind อย่างชัดเจนและคงการยืนยันตัวตนไว้

สำหรับการตั้งค่าแบบ tailnet-only:

- ตั้งค่า `gateway.bind: "tailnet"` ใน `~/.openclaw/openclaw.json`
- รีสตาร์ต Gateway (หรือรีสตาร์ตแอป menubar บน macOS)

## สิ่งที่ทำการประกาศ

มีเพียง Gateway เท่านั้นที่ประกาศ `_openclaw-gw._tcp`

## ประเภทบริการ

- `_openclaw-gw._tcp` — beacon สำหรับการรับส่งของ gateway (ใช้โดย Node บน macOS/iOS/Android)

## คีย์ TXT (คำใบ้ที่ไม่เป็นความลับ)

Gateway จะประกาศคำใบ้เล็ก ๆ ที่ไม่เป็นความลับเพื่อให้โฟลว์ UI ใช้งานสะดวก:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
- `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint พร้อมใช้)
- `canvasPort=<port>` (เฉพาะเมื่อเปิดใช้ canvas host; ปัจจุบันใช้พอร์ตเดียวกับ `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (คำใบ้แบบไม่บังคับเมื่อมี Tailnet)
- `sshPort=<port>` (เฉพาะโหมด mDNS แบบเต็ม; wide-area DNS-SD อาจละค่านี้ได้)
- `cliPath=<path>` (เฉพาะโหมด mDNS แบบเต็ม; wide-area DNS-SD ยังเขียนค่านี้ไว้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่มีการยืนยันตัวตน** ไคลเอนต์ต้องไม่ถือว่า TXT เป็นข้อมูลกำหนดเส้นทางที่เชื่อถือได้โดยเด็ดขาด
- ไคลเอนต์ควรกำหนดเส้นทางโดยใช้ปลายทางบริการที่ resolve แล้ว (SRV + A/AAAA) ให้ถือ `lanHost`, `tailnetDns`, `gatewayPort` และ `gatewayTlsSha256` เป็นเพียงคำใบ้เท่านั้น
- การกำหนดเป้าหมาย SSH อัตโนมัติก็ควรใช้โฮสต์บริการที่ resolve แล้วเช่นกัน ไม่ใช่อาศัยคำใบ้จาก TXT อย่างเดียว
- TLS pinning ต้องไม่อนุญาตให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่เคยจัดเก็บไว้ก่อนหน้านี้
- Node บน iOS/Android ควรมองการเชื่อมต่อโดยตรงที่อาศัยการค้นหาเป็นแบบ **TLS-only** และต้องให้ผู้ใช้ยืนยันอย่างชัดเจนก่อนเชื่อถือ fingerprint ที่พบเป็นครั้งแรก

## การดีบักบน macOS

เครื่องมือที่มีมาในระบบและมีประโยชน์:

- Browse อินสแตนซ์:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Resolve หนึ่งอินสแตนซ์ (แทนที่ `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

หาก browse ได้แต่ resolve ไม่ได้ ปกติแล้วคุณกำลังเจอปัญหานโยบาย LAN หรือปัญหาตัว resolver ของ mDNS

## การดีบักในบันทึกของ Gateway

Gateway จะเขียนไฟล์บันทึกแบบหมุนเวียน (แสดงตอนเริ่มทำงานเป็น
`gateway log file: ...`) ให้มองหาบรรทัด `bonjour:` โดยเฉพาะ:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## การดีบักบน Node ของ iOS

Node บน iOS ใช้ `NWBrowser` เพื่อค้นหา `_openclaw-gw._tcp`

ในการเก็บบันทึก:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → ทำให้เกิดปัญหาอีกครั้ง → **Copy**

บันทึกจะรวมการเปลี่ยนสถานะของ browser และการเปลี่ยนแปลงของชุดผลลัพธ์

## โหมดความล้มเหลวที่พบบ่อย

- **Bonjour ข้ามเครือข่ายไม่ได้**: ใช้ Tailnet หรือ SSH
- **Multicast ถูกบล็อก**: เครือข่าย Wi‑Fi บางแห่งปิด mDNS
- **Sleep / การเปลี่ยนแปลงอินเทอร์เฟซ**: macOS อาจทำให้ผลลัพธ์ mDNS หายไปชั่วคราว; ให้ลองใหม่
- **Browse ได้แต่ resolve ไม่ได้**: ตั้งชื่อเครื่องให้ง่าย (หลีกเลี่ยงอีโมจิหรือ
  เครื่องหมายวรรคตอน) แล้วรีสตาร์ต Gateway ชื่ออินสแตนซ์ของบริการได้มาจาก
  ชื่อโฮสต์ ดังนั้นชื่อที่ซับซ้อนเกินไปอาจทำให้ resolver บางตัวสับสน

## ชื่ออินสแตนซ์ที่ escape แล้ว (`\032`)

Bonjour/DNS‑SD มัก escape ไบต์ในชื่ออินสแตนซ์ของบริการเป็นลำดับ `\DDD`
แบบเลขฐานสิบ (เช่น ช่องว่างจะกลายเป็น `\032`)

- นี่เป็นเรื่องปกติในระดับโปรโตคอล
- UI ควรถอดรหัสเพื่อใช้แสดงผล (iOS ใช้ `BonjourEscapes.decode`)

## การปิดใช้งาน / การกำหนดค่า

- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ (legacy: `OPENCLAW_DISABLE_BONJOUR`)
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมดการ bind ของ Gateway
- `OPENCLAW_SSH_PORT` ใช้ override พอร์ต SSH เมื่อมีการประกาศ `sshPort` (legacy: `OPENCLAW_SSH_PORT`)
- `OPENCLAW_TAILNET_DNS` ใช้เผยแพร่คำใบ้ MagicDNS ใน TXT (legacy: `OPENCLAW_TAILNET_DNS`)
- `OPENCLAW_CLI_PATH` ใช้ override พาธ CLI ที่ประกาศ (legacy: `OPENCLAW_CLI_PATH`)

## เอกสารที่เกี่ยวข้อง

- นโยบายการค้นหาและการเลือกการรับส่ง: [Discovery](/th/gateway/discovery)
- การจับคู่ Node + การอนุมัติ: [Gateway pairing](/th/gateway/pairing)
