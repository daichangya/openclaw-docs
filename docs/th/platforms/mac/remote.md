---
read_when:
    - การตั้งค่าหรือดีบักการควบคุม mac ระยะไกล
summary: โฟลว์ของแอป macOS สำหรับควบคุม OpenClaw gateway ระยะไกลผ่าน SSH
title: การควบคุมระยะไกล
x-i18n:
    generated_at: "2026-04-23T05:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw ระยะไกล (macOS ⇄ โฮสต์ระยะไกล)

โฟลว์นี้ทำให้แอป macOS สามารถทำหน้าที่เป็นรีโมตคอนโทรลเต็มรูปแบบให้กับ OpenClaw gateway ที่รันอยู่บนโฮสต์อีกเครื่องหนึ่ง (เดสก์ท็อป/เซิร์ฟเวอร์) นี่คือฟีเจอร์ **Remote over SSH** (การรันแบบระยะไกล) ของแอป ฟีเจอร์ทั้งหมด—health checks, การส่งต่อ Voice Wake และ Web Chat—จะใช้การกำหนดค่า SSH ระยะไกลเดียวกันจาก _Settings → General_

## โหมด

- **Local (Mac เครื่องนี้)**: ทุกอย่างรันบนแล็ปท็อป ไม่มี SSH เข้ามาเกี่ยวข้อง
- **Remote over SSH (ค่าเริ่มต้น)**: คำสั่ง OpenClaw จะถูกรันบนโฮสต์ระยะไกล แอป mac จะเปิดการเชื่อมต่อ SSH ด้วย `-o BatchMode` ร่วมกับ identity/key ที่คุณเลือก และ local port-forward
- **Remote direct (ws/wss)**: ไม่มี SSH tunnel แอป mac จะเชื่อมต่อกับ URL ของ gateway โดยตรง (เช่น ผ่าน Tailscale Serve หรือ public HTTPS reverse proxy)

## การรับส่งข้อมูลแบบระยะไกล

โหมดระยะไกลรองรับสอง transport:

- **SSH tunnel** (ค่าเริ่มต้น): ใช้ `ssh -N -L ...` เพื่อ forward พอร์ตของ gateway มายัง localhost gateway จะเห็น IP ของ node เป็น `127.0.0.1` เพราะ tunnel เป็น loopback
- **Direct (ws/wss)**: เชื่อมต่อไปยัง URL ของ gateway โดยตรง gateway จะเห็น IP จริงของไคลเอนต์

## ข้อกำหนดเบื้องต้นบนโฮสต์ระยะไกล

1. ติดตั้ง Node + pnpm และ build/install OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)
2. ตรวจสอบให้แน่ใจว่า `openclaw` อยู่ใน PATH สำหรับ non-interactive shells (symlink ไปยัง `/usr/local/bin` หรือ `/opt/homebrew/bin` หากจำเป็น)
3. เปิด SSH พร้อม key auth เราแนะนำให้ใช้ IP ของ **Tailscale** เพื่อการเข้าถึงที่เสถียรเมื่ออยู่นอก LAN

## การตั้งค่าแอป macOS

1. เปิด _Settings → General_
2. ใต้ **OpenClaw runs** ให้เลือก **Remote over SSH** แล้วตั้งค่า:
   - **Transport**: **SSH tunnel** หรือ **Direct (ws/wss)**
   - **SSH target**: `user@host` (อาจมี `:port` ต่อท้าย)
     - หาก gateway อยู่ใน LAN เดียวกันและประกาศตัวผ่าน Bonjour ให้เลือกจากรายการที่ค้นพบเพื่อเติมช่องนี้อัตโนมัติ
   - **Gateway URL** (เฉพาะ Direct): `wss://gateway.example.ts.net` (หรือ `ws://...` สำหรับ local/LAN)
   - **Identity file** (ขั้นสูง): พาธไปยัง key ของคุณ
   - **Project root** (ขั้นสูง): พาธ checkout บนเครื่องระยะไกลที่ใช้สำหรับคำสั่ง
   - **CLI path** (ขั้นสูง): พาธแบบเลือกได้ไปยัง entrypoint/binary ของ `openclaw` ที่รันได้ (จะเติมอัตโนมัติเมื่อมีการประกาศไว้)
3. กด **Test remote** หากสำเร็จ แสดงว่าการรัน `openclaw status --json` บนเครื่องระยะไกลทำงานถูกต้อง ความล้มเหลวโดยมากหมายถึงปัญหา PATH/CLI; exit 127 หมายถึงไม่พบ CLI บนเครื่องระยะไกล
4. จากนี้ health checks และ Web Chat จะทำงานผ่าน SSH tunnel นี้โดยอัตโนมัติ

## Web Chat

- **SSH tunnel**: Web Chat จะเชื่อมต่อกับ gateway ผ่าน WebSocket control port ที่ถูก forward มา (ค่าเริ่มต้น 18789)
- **Direct (ws/wss)**: Web Chat จะเชื่อมต่อโดยตรงไปยัง URL ของ gateway ที่กำหนดไว้
- ตอนนี้ไม่มี WebChat HTTP server แยกต่างหากอีกแล้ว

## สิทธิ์

- โฮสต์ระยะไกลต้องมีการอนุมัติ TCC แบบเดียวกับ local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications) ให้รัน onboarding บนเครื่องนั้นเพื่ออนุมัติครั้งเดียว
- Nodes จะประกาศสถานะสิทธิ์ของตัวเองผ่าน `node.list` / `node.describe` เพื่อให้เอเจนต์รู้ว่ามีอะไรใช้งานได้บ้าง

## หมายเหตุด้านความปลอดภัย

- ควรใช้การ bind แบบ loopback บนโฮสต์ระยะไกล และเชื่อมต่อผ่าน SSH หรือ Tailscale
- SSH tunneling ใช้การตรวจสอบ host-key แบบเข้มงวด; ให้เชื่อถือ host key ก่อนเพื่อให้มันมีอยู่ใน `~/.ssh/known_hosts`
- หากคุณ bind Gateway กับ non-loopback interface ให้บังคับใช้ Gateway auth ที่ถูกต้อง: token, password หรือ identity-aware reverse proxy พร้อม `gateway.auth.mode: "trusted-proxy"`
- ดู [Security](/th/gateway/security) และ [Tailscale](/th/gateway/tailscale)

## โฟลว์การล็อกอิน WhatsApp (ระยะไกล)

- รัน `openclaw channels login --verbose` **บนโฮสต์ระยะไกล** สแกน QR ด้วย WhatsApp บนโทรศัพท์ของคุณ
- รัน login ใหม่บนโฮสต์นั้นหาก auth หมดอายุ health check จะแสดงปัญหาการเชื่อมโยง

## การแก้ปัญหา

- **exit 127 / not found**: `openclaw` ไม่ได้อยู่ใน PATH สำหรับ non-login shells เพิ่มลงใน `/etc/paths`, shell rc ของคุณ หรือ symlink ไปยัง `/usr/local/bin`/`/opt/homebrew/bin`
- **Health probe failed**: ตรวจสอบการเข้าถึง SSH, PATH และว่า Baileys ล็อกอินอยู่หรือไม่ (`openclaw status --json`)
- **Web Chat ค้าง**: ยืนยันว่า gateway กำลังรันอยู่บนโฮสต์ระยะไกล และพอร์ตที่ forward ตรงกับพอร์ต WS ของ gateway; UI ต้องการการเชื่อมต่อ WS ที่สมบูรณ์
- **Node IP แสดงเป็น 127.0.0.1**: เป็นเรื่องปกติเมื่อใช้ SSH tunnel ให้สลับ **Transport** เป็น **Direct (ws/wss)** หากคุณต้องการให้ gateway เห็น IP จริงของไคลเอนต์
- **Voice Wake**: trigger phrases จะถูกส่งต่อโดยอัตโนมัติในโหมดระยะไกล; ไม่จำเป็นต้องมี forwarder แยก

## เสียงแจ้งเตือน

เลือกเสียงราย notification ได้จากสคริปต์ด้วย `openclaw` และ `node.invoke` เช่น:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ตอนนี้ไม่มีสวิตช์ “default sound” แบบ global ในแอปแล้ว; ผู้เรียกจะเลือกเสียง (หรือไม่เลือก) เป็นรายคำขอ
