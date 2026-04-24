---
read_when:
    - การติดตั้งหรือเปลี่ยนการค้นหา/การประกาศ Bonjour
    - การปรับโหมดการเชื่อมต่อระยะไกล (direct เทียบกับ SSH)
    - การออกแบบการค้นหา Node + การจับคู่สำหรับ Nodes ระยะไกล
summary: การค้นหา Node และทรานสปอร์ต (Bonjour, Tailscale, SSH) สำหรับการค้นหา gateway
title: การค้นหาและทรานสปอร์ต
x-i18n:
    generated_at: "2026-04-24T09:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# การค้นหาและทรานสปอร์ต

OpenClaw มีปัญหาอยู่ 2 แบบที่ดูคล้ายกันเมื่อมองผิวเผิน:

1. **การควบคุมระยะไกลสำหรับผู้ปฏิบัติงาน**: แอปเมนูบาร์บน macOS ควบคุม gateway ที่รันอยู่ที่อื่น
2. **การจับคู่ Node**: iOS/Android (และ Nodes ในอนาคต) ค้นหา gateway และจับคู่กันอย่างปลอดภัย

เป้าหมายของการออกแบบคือเก็บงานค้นหา/ประกาศบนเครือข่ายทั้งหมดไว้ใน **Node Gateway** (`openclaw gateway`) และให้ไคลเอนต์ (แอป mac, iOS) เป็นเพียงผู้ใช้งาน

## คำศัพท์

- **Gateway**: โปรเซส gateway แบบ long-running เพียงตัวเดียวที่เป็นเจ้าของสถานะ (sessions, pairing, node registry) และรันช่องทางต่าง ๆ โดยส่วนใหญ่แต่ละโฮสต์จะใช้หนึ่งตัว; สามารถมีการตั้งค่าแบบหลาย gateway ที่แยกกันได้
- **Gateway WS (control plane)**: ปลายทาง WebSocket ที่ `127.0.0.1:18789` ตามค่าเริ่มต้น; สามารถ bind ไปยัง LAN/tailnet ได้ผ่าน `gateway.bind`
- **Direct WS transport**: ปลายทาง Gateway WS ที่เปิดให้เข้าถึงจาก LAN/tailnet (ไม่มี SSH)
- **SSH transport (fallback)**: การควบคุมระยะไกลโดยส่งต่อ `127.0.0.1:18789` ผ่าน SSH
- **Legacy TCP bridge (ถูกถอดออกแล้ว)**: ทรานสปอร์ต Node แบบเก่า (ดู
  [Bridge protocol](/th/gateway/bridge-protocol)); ไม่มีการประกาศสำหรับ
  การค้นหาอีกต่อไป และไม่ใช่ส่วนหนึ่งของบิลด์ปัจจุบันแล้ว

รายละเอียดโปรโตคอล:

- [Gateway protocol](/th/gateway/protocol)
- [Bridge protocol (legacy)](/th/gateway/bridge-protocol)

## เหตุใดเราจึงยังคงมีทั้ง "direct" และ SSH

- **Direct WS** ให้ UX ที่ดีที่สุดบนเครือข่ายเดียวกันและภายใน tailnet:
  - ค้นหาอัตโนมัติบน LAN ผ่าน Bonjour
  - pairing tokens + ACLs อยู่ภายใต้การดูแลของ gateway
  - ไม่ต้องมีสิทธิ์ shell; พื้นผิวของโปรโตคอลจึงกระชับและตรวจสอบได้ง่าย
- **SSH** ยังคงเป็น fallback ที่ใช้ได้ทั่วไป:
  - ใช้ได้ทุกที่ที่คุณมีสิทธิ์ SSH (แม้จะอยู่คนละเครือข่ายที่ไม่เกี่ยวข้องกัน)
  - ทนต่อปัญหา multicast/mDNS
  - ไม่ต้องเปิดพอร์ตขาเข้าใหม่ นอกจาก SSH

## อินพุตของการค้นหา (ไคลเอนต์เรียนรู้ว่า gateway อยู่ที่ไหนได้อย่างไร)

### 1) การค้นหา Bonjour / DNS-SD

Multicast Bonjour เป็นแบบ best-effort และไม่สามารถข้ามเครือข่ายได้ OpenClaw ยังสามารถ browse
บีคอน gateway เดียวกันผ่านโดเมน wide-area DNS-SD ที่กำหนดค่าไว้ได้ ดังนั้นการค้นหาจึงครอบคลุมได้ทั้ง:

- `local.` บน LAN เดียวกัน
- โดเมน unicast DNS-SD ที่กำหนดค่าไว้สำหรับการค้นหาข้ามเครือข่าย

ทิศทางของเป้าหมาย:

- **gateway** จะประกาศปลายทาง WS ของตนผ่าน Bonjour
- ไคลเอนต์จะ browse และแสดงรายการ “เลือก gateway” จากนั้นจัดเก็บปลายทางที่เลือกไว้

รายละเอียดบีคอนและการแก้ไขปัญหา: [Bonjour](/th/gateway/bonjour)

#### รายละเอียดบีคอนของบริการ

- ประเภทบริการ:
  - `_openclaw-gw._tcp` (บีคอนทรานสปอร์ตของ gateway)
- คีย์ TXT (ไม่เป็นความลับ):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (ชื่อแสดงผลที่ผู้ปฏิบัติงานกำหนด)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (เฉพาะเมื่อเปิดใช้ TLS)
  - `gatewayTlsSha256=<sha256>` (เฉพาะเมื่อเปิดใช้ TLS และมี fingerprint)
  - `canvasPort=<port>` (พอร์ตของ canvas host; ปัจจุบันเป็นค่าเดียวกับ `gatewayPort` เมื่อเปิดใช้ canvas host)
  - `tailnetDns=<magicdns>` (คำใบ้แบบไม่บังคับ; ตรวจจับอัตโนมัติเมื่อมี Tailscale)
  - `sshPort=<port>` (เฉพาะโหมดเต็มของ mDNS; wide-area DNS-SD อาจละไว้ ซึ่งในกรณีนั้น SSH จะใช้ค่าเริ่มต้น `22`)
  - `cliPath=<path>` (เฉพาะโหมดเต็มของ mDNS; wide-area DNS-SD ยังคงเขียนค่านี้เป็นคำใบ้สำหรับการติดตั้งระยะไกล)

หมายเหตุด้านความปลอดภัย:

- ระเบียน TXT ของ Bonjour/mDNS เป็นแบบ **ไม่ยืนยันตัวตน** ไคลเอนต์ต้องถือว่าค่า TXT เป็นเพียงคำใบ้ด้าน UX เท่านั้น
- การกำหนดเส้นทาง (host/port) ควรให้ความสำคัญกับ **ปลายทางบริการที่ถูก resolve แล้ว** (SRV + A/AAAA) มากกว่าค่า `lanHost`, `tailnetDns` หรือ `gatewayPort` ที่มาจาก TXT
- TLS pinning ต้องไม่ยอมให้ `gatewayTlsSha256` ที่ประกาศมา override pin ที่จัดเก็บไว้ก่อนหน้า
- iOS/Android nodes ควรต้องมีการยืนยันอย่างชัดเจนว่า “เชื่อถือ fingerprint นี้” ก่อนบันทึก pin ครั้งแรก (การยืนยันนอกแบนด์) ทุกครั้งที่เส้นทางที่เลือกเป็นแบบปลอดภัย/ใช้ TLS

การปิดใช้งาน/override:

- `OPENCLAW_DISABLE_BONJOUR=1` จะปิดการประกาศ
- `gateway.bind` ใน `~/.openclaw/openclaw.json` ควบคุมโหมดการ bind ของ Gateway
- `OPENCLAW_SSH_PORT` ใช้ override พอร์ต SSH ที่ประกาศเมื่อมีการส่ง `sshPort`
- `OPENCLAW_TAILNET_DNS` เผยแพร่คำใบ้ `tailnetDns` (MagicDNS)
- `OPENCLAW_CLI_PATH` ใช้ override path ของ CLI ที่ประกาศ

### 2) Tailnet (ข้ามเครือข่าย)

สำหรับการตั้งค่าแบบ London/Vienna, Bonjour จะไม่ช่วย เส้นทาง “direct” ที่แนะนำคือ:

- ชื่อ Tailscale MagicDNS (แนะนำ) หรือ IP tailnet ที่คงที่

หาก gateway ตรวจพบได้ว่ากำลังรันอยู่ภายใต้ Tailscale มันจะเผยแพร่ `tailnetDns` เป็นคำใบ้แบบไม่บังคับสำหรับไคลเอนต์ (รวมถึง wide-area beacons)

ตอนนี้แอป macOS ให้ความสำคัญกับชื่อ MagicDNS มากกว่า IP Tailscale แบบดิบสำหรับการค้นหา gateway ซึ่งช่วยเพิ่มความน่าเชื่อถือเมื่อ IP ของ tailnet เปลี่ยน (เช่น หลังจาก node รีสตาร์ตหรือมีการกำหนด CGNAT ใหม่) เพราะชื่อ MagicDNS จะ resolve ไปยัง IP ปัจจุบันโดยอัตโนมัติ

สำหรับการจับคู่ mobile node คำใบ้จากการค้นหาไม่ได้ทำให้ความปลอดภัยของทรานสปอร์ตบนเส้นทาง tailnet/public ผ่อนคลายลง:

- iOS/Android ยังคงต้องใช้เส้นทางเชื่อมต่อ tailnet/public ครั้งแรกที่ปลอดภัย (`wss://` หรือ Tailscale Serve/Funnel)
- raw tailnet IP ที่ถูกค้นพบเป็นเพียงคำใบ้ด้านการกำหนดเส้นทาง ไม่ใช่สิทธิ์ให้ใช้ `ws://` ระยะไกลแบบ plaintext
- การเชื่อมต่อโดยตรงแบบ `ws://` บน private LAN ยังคงรองรับ
- หากคุณต้องการเส้นทาง Tailscale ที่ง่ายที่สุดสำหรับ mobile nodes ให้ใช้ Tailscale Serve เพื่อให้ทั้งการค้นหาและโค้ดการตั้งค่า resolve ไปยังปลายทาง MagicDNS แบบปลอดภัยเดียวกัน

### 3) เป้าหมายแบบแมนนวล / SSH

เมื่อไม่มีเส้นทาง direct (หรือปิด direct ไว้) ไคลเอนต์สามารถเชื่อมต่อผ่าน SSH ได้เสมอ โดยส่งต่อพอร์ต gateway แบบ loopback

ดู [การเข้าถึงระยะไกล](/th/gateway/remote)

## การเลือกทรานสปอร์ต (นโยบายของไคลเอนต์)

ลักษณะการทำงานของไคลเอนต์ที่แนะนำ:

1. หากมีการกำหนดค่า paired direct endpoint ไว้และเข้าถึงได้ ให้ใช้ค่านั้น
2. มิฉะนั้น หากการค้นหาพบ gateway บน `local.` หรือโดเมน wide-area ที่กำหนดค่าไว้ ให้เสนอทางเลือก “Use this gateway” แบบแตะครั้งเดียวและบันทึกเป็น direct endpoint
3. มิฉะนั้น หากมีการกำหนดค่า DNS/IP ของ tailnet ไว้ ให้ลอง direct
   สำหรับ mobile nodes บนเส้นทาง tailnet/public คำว่า direct หมายถึงปลายทางที่ปลอดภัย ไม่ใช่ `ws://` ระยะไกลแบบ plaintext
4. มิฉะนั้น ให้ย้อนกลับไปใช้ SSH

## Pairing + auth (direct transport)

gateway คือแหล่งความจริงสำหรับการรับเข้าใช้งานของ node/client

- คำขอ pairing ถูกสร้าง/อนุมัติ/ปฏิเสธใน gateway (ดู [การจับคู่ Gateway](/th/gateway/pairing))
- gateway เป็นผู้บังคับใช้:
  - auth (token / keypair)
  - scopes/ACLs (gateway ไม่ใช่ raw proxy ไปยังทุกเมธอด)
  - rate limits

## หน้าที่รับผิดชอบของแต่ละองค์ประกอบ

- **Gateway**: ประกาศ discovery beacons, เป็นเจ้าของการตัดสินใจเรื่อง pairing และโฮสต์ปลายทาง WS
- **แอป macOS**: ช่วยให้คุณเลือก gateway, แสดง pairing prompts และใช้ SSH เฉพาะเป็น fallback
- **iOS/Android nodes**: browse Bonjour เพื่อความสะดวกและเชื่อมต่อไปยัง Gateway WS ที่จับคู่ไว้

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [Tailscale](/th/gateway/tailscale)
- [การค้นหา Bonjour](/th/gateway/bonjour)
