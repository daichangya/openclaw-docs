---
read_when:
    - คุณต้องการการค้นพบในเครือข่ายวงกว้าง (DNS-SD) ผ่าน Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw dns` (ตัวช่วยสำหรับการค้นพบในเครือข่ายวงกว้าง)
title: DNS
x-i18n:
    generated_at: "2026-04-24T09:02:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

ตัวช่วย DNS สำหรับการค้นพบในเครือข่ายวงกว้าง (Tailscale + CoreDNS) ปัจจุบันเน้นที่ macOS + Homebrew CoreDNS

ที่เกี่ยวข้อง:

- การค้นพบ Gateway: [Discovery](/th/gateway/discovery)
- การกำหนดค่าการค้นพบในเครือข่ายวงกว้าง: [Configuration](/th/gateway/configuration)

## การตั้งค่า

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

วางแผนหรือปรับใช้การตั้งค่า CoreDNS สำหรับการค้นพบ unicast DNS-SD

ตัวเลือก:

- `--domain <domain>`: โดเมนสำหรับการค้นพบในเครือข่ายวงกว้าง (เช่น `openclaw.internal`)
- `--apply`: ติดตั้งหรืออัปเดต config ของ CoreDNS และรีสตาร์ตบริการ (ต้องใช้ sudo; macOS เท่านั้น)

สิ่งที่จะแสดง:

- โดเมนการค้นพบที่ resolve แล้ว
- พาธไฟล์ zone
- Tailscale IPs ปัจจุบัน
- config การค้นพบที่แนะนำสำหรับ `openclaw.json`
- ค่า nameserver/domain ของ Tailscale Split DNS ที่ต้องตั้งค่า

หมายเหตุ:

- หากไม่ใช้ `--apply` คำสั่งนี้จะเป็นเพียงตัวช่วยวางแผนและพิมพ์การตั้งค่าที่แนะนำ
- หากไม่ระบุ `--domain` OpenClaw จะใช้ `discovery.wideArea.domain` จาก config
- ปัจจุบัน `--apply` รองรับเฉพาะ macOS และคาดว่าจะใช้ Homebrew CoreDNS
- `--apply` จะ bootstrap ไฟล์ zone หากจำเป็น ตรวจสอบให้แน่ใจว่ามี CoreDNS import stanza อยู่ และรีสตาร์ตบริการ `coredns` ของ brew

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Discovery](/th/gateway/discovery)
