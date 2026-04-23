---
read_when:
    - การติดตั้งใช้งานหรือเปลี่ยนแปลงการค้นหา/การประกาศผ่าน Bonjour
    - การปรับโหมดการเชื่อมต่อระยะไกล (ตรงเทียบกับ SSH)
    - การออกแบบการค้นหา Node + การจับคู่สำหรับ Node ระยะไกล
summary: การค้นพบ Node และระบบขนส่ง (Bonjour, Tailscale, SSH) สำหรับการค้นหา Gateway
title: การค้นพบและระบบขนส่ง
x-i18n:
    generated_at: "2026-04-23T05:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# การค้นพบและระบบขนส่ง

OpenClaw มีปัญหาอยู่ 2 แบบที่ดูคล้ายกันจากภายนอก:

1. **การควบคุมระยะไกลของผู้ปฏิบัติงาน**: แอปบนแถบเมนูของ macOS ควบคุม Gateway ที่รันอยู่ที่อื่น
2. **การจับคู่ Node**: iOS/Android (และ Node อื่นในอนาคต) ค้นหา Gateway และจับคู่กันอย่างปลอดภัย

เป้าหมายของการออกแบบคือเก็บการค้นพบ/การประกาศเครือข่ายทั้งหมดไว้ใน **Node Gateway** (`openclaw gateway`) และให้ไคลเอนต์ (แอป Mac, iOS) เป็นเพียงผู้ใช้งานข้อมูลเหล่านั้น

## คำศัพท์

- **Gateway**: โปรเซส Gateway ตัวเดียวที่ทำงานระยะยาว เป็นเจ้าของ state (เซสชัน, การจับคู่, registry ของ Node) และรันช่องทางต่าง ๆ โดยการติดตั้งส่วนใหญ่จะใช้หนึ่งตัวต่อหนึ่งโฮสต์; ชุดติดตั้งแบบหลาย Gateway ที่แยกขาดกันก็ทำได้
- **Gateway WS (control plane)**: endpoint ของ WebSocket บน `127.0.0.1:18789` โดยค่าเริ่มต้น; สามารถ bind ไปยัง LAN/tailnet ได้ผ่าน `gateway.bind`
- **Direct WS transport**: endpoint ของ Gateway WS ที่หันออกสู่ LAN/tailnet (ไม่มี SSH)
- **SSH transport (fallback)**: การควบคุมระยะไกลโดยส่งต่อ `127.0.0.1:18789` ผ่าน SSH
- **Legacy TCP bridge (removed)**: ระบบขนส่งของ Node แบบเก่า (ดู
  [Bridge protocol](/th/gateway/bridge-protocol)); ไม่ถูกประกาศเพื่อการค้นพบอีกต่อไป
  และไม่เป็นส่วนหนึ่งของ build ปัจจุบันแล้ว

รายละเอียดของโปรโตคอล:

- [Gateway protocol](/th/gateway/protocol)
- [Bridge protocol (legacy)](/th/gateway/bridge-protocol)

## ทำไมเรายังมีทั้ง “direct” และ SSH

- **Direct WS** ให้ UX ที่ดีที่สุดบนเครือข่ายเดียวกันและภายใน tailnet:
  - ค้นหาอัตโนมัติบน LAN ผ่าน Bonjour
  - token สำหรับการจับคู่ + ACL เป็นของ Gateway
  - ไม่ต้องมี shell access; พื้นผิวของโปรโตคอลสามารถคงความกระชับและตรวจสอบได้
- **SSH** ยังคงเป็น fallback ที่ใช้ได้ทั่วไป:
  - ใช้ได้ทุกที่ที่คุณมีสิทธิ์เข้าถึง SSH (แม้จะอยู่ข้ามเครือข่ายที่ไม่เกี่ยวข้องกัน)
  - ทนต่อปัญหา multicast/mDNS
  - ไม่ต้องเปิดพอร์ตขาเข้าใหม่เพิ่มเติมนอกจาก SSH

## อินพุตของการค้นพบ (ไคลเอนต์รู้ได้อย่างไรว่า Gateway อยู่ที่ไหน)

### 1) การค้นพบผ่าน Bonjour / DNS-SD

Bonjour แบบ multicast เป็นแบบ best-effort และไม่ข้ามเครือข่าย OpenClaw ยังสามารถ browse
beacon ของ Gateway เดียวกันผ่านโดเมน DNS-SD แบบ wide-area ที่ตั้งค่าไว้ได้ ดังนั้นการค้นพบจึงครอบคลุมได้ทั้ง:

- `local.` บน LAN เดียวกัน
- โดเมน DNS-SD แบบ unicast ที่ตั้งค่าไว้สำหรับการค้นพบข้ามเครือข่าย

ทิศทางเป้าหมาย:

- **Gateway** ประกาศ endpoint WS ของตัวเองผ่าน Bonjour
- ไคลเอนต์จะ browse และแสดงรายการ “เลือก Gateway” จากนั้นเก็บ endpoint ที่เลือกไว้

รายละเอียด beacon และการแก้ไขปัญหา: [Bonjour](/th/gateway/bonjour)

#### รายละเอียดของ service beacon

- ประเภท service:
  - `_openclaw-gw._tcp` (beacon ของระบบขนส่ง Gateway)
- คีย์ TXT (ไม่เป็นความลับ):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (ชื่อที่ผู้ปฏิบัติงานตั้งไว้)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
  - `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
  - `canvasPort=<port>` (พอร์ตของ canvas host; ปัจจุบันจะเป็นพอร์ตเดียวกับ `gatewayPort` เมื่อเปิด canvas host)
  - `tailnetDns=<magicdns>` (hint แบบไม่บังคับ; ตรวจจับอัตโนมัติเมื่อมี Tailscale)
  - `sshPort=<port>` (เฉพาะโหมด mDNS เต็มรูปแบบ; wide-area DNS-SD อาจละไว้ ซึ่งในกรณีนั้น SSH จะใช้ค่าเริ่มต้นที่ `22`)
  - `cliPath=<path>` (เฉพาะโหมด mDNS เต็มรูปแบบ; wide-area DNS-SD ยังคงเขียนไว้เป็น hint สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS **ไม่ผ่านการยืนยันตัวตน** ไคลเอนต์ต้องถือว่าค่า TXT เป็นเพียง hint สำหรับ UX เท่านั้น
- การกำหนดเส้นทาง (host/port) ควรเลือกใช้ **resolved service endpoint** (SRV + A/AAAA) มากกว่า `lanHost`, `tailnetDns` หรือ `gatewayPort` ที่ส่งผ่าน TXT
- TLS pinning ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ประกาศมาทับ pin ที่เก็บไว้ก่อนหน้านี้
- Node บน iOS/Android ควรกำหนดให้มีการยืนยัน “เชื่อถือ fingerprint นี้” อย่างชัดเจนก่อนเก็บ pin ครั้งแรก (การยืนยันนอกแบนด์) ทุกครั้งที่เส้นทางที่เลือกเป็นแบบ secure/TLS

ปิด/override ได้ด้วย:

- `OPENCLAW_DISABLE_BONJOUR=1` ปิดการประกาศ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมด bind ของ Gateway
- `OPENCLAW_SSH_PORT` override พอร์ต SSH ที่ประกาศเมื่อมีการส่ง `sshPort`
- `OPENCLAW_TAILNET_DNS` เผยแพร่ hint `tailnetDns` (MagicDNS)
- `OPENCLAW_CLI_PATH` override พาธ CLI ที่ประกาศ

### 2) Tailnet (ข้ามเครือข่าย)

สำหรับชุดติดตั้งแบบสไตล์ London/Vienna นั้น Bonjour จะไม่ช่วย เป้าหมาย “direct” ที่แนะนำคือ:

- ชื่อ Tailscale MagicDNS (แนะนำ) หรือ IP ของ tailnet ที่คงที่

หาก Gateway ตรวจพบได้ว่ากำลังรันอยู่ภายใต้ Tailscale มันจะเผยแพร่ `tailnetDns` เป็น hint แบบไม่บังคับสำหรับไคลเอนต์ (รวมถึง beacon แบบ wide-area)

ตอนนี้แอป macOS จะเลือกชื่อ MagicDNS มากกว่า IP ของ Tailscale แบบดิบสำหรับการค้นพบ Gateway วิธีนี้ช่วยเพิ่มความเชื่อถือได้เมื่อ IP ของ tailnet เปลี่ยน (เช่น หลัง Node รีสตาร์ต หรือมีการกำหนด CGNAT ใหม่) เพราะชื่อ MagicDNS จะ resolve ไปยัง IP ปัจจุบันโดยอัตโนมัติ

สำหรับการจับคู่ Node บนมือถือ hint จากการค้นพบจะไม่ทำให้ความปลอดภัยของระบบขนส่งลดลงบนเส้นทาง tailnet/สาธารณะ:

- iOS/Android ยังคงต้องใช้เส้นทางเชื่อมต่อครั้งแรกที่ปลอดภัยบน tailnet/สาธารณะ (`wss://` หรือ Tailscale Serve/Funnel)
- IP ของ tailnet แบบดิบที่ค้นพบได้เป็นเพียง hint สำหรับการกำหนดเส้นทาง ไม่ใช่การอนุญาตให้ใช้ `ws://` ระยะไกลแบบ plaintext
- การเชื่อมต่อโดยตรงผ่าน LAN ส่วนตัวด้วย `ws://` ยังคงรองรับ
- หากคุณต้องการเส้นทาง Tailscale ที่ง่ายที่สุดสำหรับ Node บนมือถือ ให้ใช้ Tailscale Serve เพื่อให้ทั้งการค้นพบและ setup code resolve ไปยัง endpoint MagicDNS แบบปลอดภัยเดียวกัน

### 3) เป้าหมายแบบกำหนดเอง / SSH

เมื่อไม่มีเส้นทาง direct (หรือปิด direct ไว้) ไคลเอนต์ยังคงเชื่อมต่อผ่าน SSH ได้เสมอ โดยส่งต่อพอร์ต loopback ของ Gateway

ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

## การเลือกระบบขนส่ง (นโยบายฝั่งไคลเอนต์)

พฤติกรรมของไคลเอนต์ที่แนะนำ:

1. หากมีการตั้งค่า direct endpoint ที่จับคู่แล้วและเข้าถึงได้ ให้ใช้มัน
2. มิฉะนั้น หากการค้นพบพบ Gateway บน `local.` หรือโดเมน wide-area ที่ตั้งค่าไว้ ให้เสนอทางเลือก “ใช้ Gateway นี้” แบบแตะครั้งเดียว และบันทึกเป็น direct endpoint
3. มิฉะนั้น หากมีการตั้งค่า tailnet DNS/IP ให้ลอง direct
   สำหรับ Node บนมือถือที่อยู่บนเส้นทาง tailnet/สาธารณะ direct หมายถึง endpoint ที่ปลอดภัย ไม่ใช่ `ws://` ระยะไกลแบบ plaintext
4. มิฉะนั้น ให้ fallback ไปใช้ SSH

## การจับคู่ + การยืนยันตัวตน (direct transport)

Gateway คือแหล่งข้อมูลจริงสำหรับการอนุญาต Node/ไคลเอนต์

- คำขอจับคู่จะถูกสร้าง/อนุมัติ/ปฏิเสธที่ Gateway (ดู [Gateway pairing](/th/gateway/pairing))
- Gateway เป็นผู้บังคับใช้:
  - การยืนยันตัวตน (token / keypair)
  - scope/ACL (Gateway ไม่ใช่ raw proxy ไปยังทุกเมธอด)
  - rate limit

## หน้าที่ของแต่ละองค์ประกอบ

- **Gateway**: ประกาศ discovery beacon, เป็นเจ้าของการตัดสินใจเรื่องการจับคู่ และโฮสต์ endpoint WS
- **แอป macOS**: ช่วยให้คุณเลือก Gateway, แสดง prompt สำหรับการจับคู่ และใช้ SSH เฉพาะเป็น fallback
- **Node บน iOS/Android**: browse Bonjour เพื่อความสะดวก และเชื่อมต่อไปยัง Gateway WS ที่จับคู่แล้ว
