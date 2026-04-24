---
read_when:
    - การตั้งค่าหรือแก้ไขปัญหาการควบคุม Mac แบบ remote
summary: โฟลว์ของแอป macOS สำหรับควบคุม Gateway ของ OpenClaw แบบ remote ผ่าน SSH
title: การควบคุมระยะไกล
x-i18n:
    generated_at: "2026-04-24T09:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw แบบ remote (macOS ⇄ โฮสต์ระยะไกล)

โฟลว์นี้ทำให้แอป macOS ทำหน้าที่เป็นรีโมตคอนโทรลเต็มรูปแบบสำหรับ OpenClaw gateway ที่รันอยู่บนโฮสต์อื่น (เดสก์ท็อป/เซิร์ฟเวอร์) มันคือฟีเจอร์ **Remote over SSH** (remote run) ของแอป ฟีเจอร์ทั้งหมด—health check, การส่งต่อ Voice Wake และ Web Chat—ใช้การกำหนดค่า SSH ระยะไกลชุดเดียวกันจาก _Settings → General_

## โหมด

- **Local (Mac เครื่องนี้)**: ทุกอย่างรันบนแล็ปท็อป ไม่มี SSH เกี่ยวข้อง
- **Remote over SSH (ค่าเริ่มต้น)**: คำสั่งของ OpenClaw จะถูกเรียกใช้งานบนโฮสต์ระยะไกล แอป mac จะเปิดการเชื่อมต่อ SSH ด้วย `-o BatchMode` พร้อม identity/key ที่คุณเลือกและ local port-forward
- **Remote direct (ws/wss)**: ไม่มี SSH tunnel แอป mac จะเชื่อมต่อกับ URL ของ gateway โดยตรง (เช่น ผ่าน Tailscale Serve หรือ public HTTPS reverse proxy)

## transport แบบ remote

โหมด remote รองรับ transport สองแบบ:

- **SSH tunnel** (ค่าเริ่มต้น): ใช้ `ssh -N -L ...` เพื่อ forward พอร์ตของ gateway มาที่ localhost gateway จะเห็น IP ของ node เป็น `127.0.0.1` เพราะ tunnel เป็น loopback
- **Direct (ws/wss)**: เชื่อมต่อไปยัง URL ของ gateway โดยตรง gateway จะเห็น IP จริงของไคลเอนต์

## สิ่งที่ต้องมีบนโฮสต์ระยะไกล

1. ติดตั้ง Node + pnpm และ build/install OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`)
2. ตรวจสอบให้แน่ใจว่า `openclaw` อยู่ใน PATH สำหรับ non-interactive shell (symlink ไปยัง `/usr/local/bin` หรือ `/opt/homebrew/bin` หากจำเป็น)
3. เปิด SSH พร้อม key auth เราแนะนำให้ใช้ IP ของ **Tailscale** เพื่อการเข้าถึงที่เสถียรนอก LAN

## การตั้งค่าแอป macOS

1. เปิด _Settings → General_
2. ภายใต้ **OpenClaw runs** ให้เลือก **Remote over SSH** แล้วตั้งค่า:
   - **Transport**: **SSH tunnel** หรือ **Direct (ws/wss)**
   - **SSH target**: `user@host` (เลือกใส่ `:port` ได้)
     - หาก gateway อยู่บน LAN เดียวกันและประกาศผ่าน Bonjour คุณสามารถเลือกจากรายการที่ค้นพบเพื่อกรอกช่องนี้อัตโนมัติได้
   - **Gateway URL** (เฉพาะ Direct): `wss://gateway.example.ts.net` (หรือ `ws://...` สำหรับ local/LAN)
   - **Identity file** (ขั้นสูง): พาธไปยังคีย์ของคุณ
   - **Project root** (ขั้นสูง): พาธของ checkout บน remote ที่ใช้สำหรับคำสั่ง
   - **CLI path** (ขั้นสูง): พาธไปยัง entrypoint/binary `openclaw` ที่รันได้ (เติมอัตโนมัติเมื่อมีการประกาศ)
3. กด **Test remote** หากสำเร็จ แปลว่า `openclaw status --json` บน remote รันได้ถูกต้อง ความล้มเหลวมักหมายถึงปัญหา PATH/CLI; exit 127 หมายถึงไม่พบ CLI บน remote
4. ตอนนี้ health check และ Web Chat จะรันผ่าน SSH tunnel นี้โดยอัตโนมัติ

## Web Chat

- **SSH tunnel**: Web Chat จะเชื่อมต่อกับ gateway ผ่าน WebSocket control port ที่ถูก forward มา (ค่าเริ่มต้น 18789)
- **Direct (ws/wss)**: Web Chat จะเชื่อมต่อไปยัง URL ของ gateway ที่กำหนดไว้โดยตรง
- ตอนนี้ไม่มี WebChat HTTP server แยกแล้ว

## สิทธิ์

- โฮสต์ระยะไกลต้องการการอนุมัติ TCC แบบเดียวกับ local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications) ให้รัน onboarding บนเครื่องนั้นเพื่ออนุมัติครั้งเดียว
- Node จะประกาศสถานะสิทธิ์ของตนผ่าน `node.list` / `node.describe` เพื่อให้เอเจนต์รู้ว่ามีอะไรใช้งานได้บ้าง

## หมายเหตุด้านความปลอดภัย

- ควรใช้การ bind แบบ loopback บนโฮสต์ระยะไกล และเชื่อมต่อผ่าน SSH หรือ Tailscale
- SSH tunneling ใช้ strict host-key checking; ควรเชื่อถือ host key ก่อนเพื่อให้มันอยู่ใน `~/.ssh/known_hosts`
- หากคุณ bind Gateway กับอินเทอร์เฟซที่ไม่ใช่ loopback ให้บังคับใช้ Gateway auth ที่ถูกต้อง: token, password หรือ identity-aware reverse proxy ที่ใช้ `gateway.auth.mode: "trusted-proxy"`
- ดู [Security](/th/gateway/security) และ [Tailscale](/th/gateway/tailscale)

## โฟลว์การล็อกอิน WhatsApp (remote)

- รัน `openclaw channels login --verbose` **บนโฮสต์ระยะไกล** สแกน QR ด้วย WhatsApp บนโทรศัพท์ของคุณ
- รันล็อกอินใหม่บนโฮสต์นั้นหาก auth หมดอายุ health check จะแสดงปัญหาการเชื่อมโยง

## การแก้ไขปัญหา

- **exit 127 / not found**: `openclaw` ไม่อยู่ใน PATH สำหรับ non-login shell ให้เพิ่มมันลงใน `/etc/paths`, shell rc ของคุณ หรือ symlink ไปยัง `/usr/local/bin`/`/opt/homebrew/bin`
- **Health probe failed**: ตรวจสอบการเข้าถึง SSH, PATH และให้แน่ใจว่า Baileys ล็อกอินอยู่ (`openclaw status --json`)
- **Web Chat ค้าง**: ยืนยันว่า gateway กำลังรันบนโฮสต์ระยะไกล และพอร์ตที่ forward มาตรงกับพอร์ต WS ของ gateway; UI ต้องการการเชื่อมต่อ WS ที่ healthy
- **Node IP แสดงเป็น 127.0.0.1**: เป็นสิ่งที่คาดไว้เมื่อใช้ SSH tunnel ให้สลับ **Transport** เป็น **Direct (ws/wss)** หากคุณต้องการให้ gateway เห็น IP จริงของไคลเอนต์
- **Voice Wake**: trigger phrase จะถูกส่งต่อโดยอัตโนมัติในโหมด remote; ไม่ต้องมี forwarder แยกต่างหาก

## เสียงการแจ้งเตือน

เลือกเสียงต่อการแจ้งเตือนหนึ่งครั้งจากสคริปต์ด้วย `openclaw` และ `node.invoke` เช่น:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

ตอนนี้ไม่มีสวิตช์ “default sound” แบบส่วนกลางในแอปแล้ว; ผู้เรียกจะเลือกเสียง (หรือไม่ใช้เลย) ต่อคำขอแต่ละครั้ง

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [การเข้าถึงแบบ remote](/th/gateway/remote)
