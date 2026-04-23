---
read_when:
    - คุณต้องการการค้นหาในวงกว้าง (DNS-SD) ผ่าน Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw dns` (ตัวช่วยการค้นหาในวงกว้าง)
title: DNS
x-i18n:
    generated_at: "2026-04-23T06:17:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

ตัวช่วย DNS สำหรับการค้นหาในวงกว้าง (Tailscale + CoreDNS) ปัจจุบันมุ่งเน้นที่ macOS + Homebrew CoreDNS

ที่เกี่ยวข้อง:

- การค้นหา Gateway: [Discovery](/th/gateway/discovery)
- การกำหนดค่าการค้นหาในวงกว้าง: [Configuration](/th/gateway/configuration)

## การตั้งค่า

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

วางแผนหรือนำการตั้งค่า CoreDNS ไปใช้สำหรับการค้นหา unicast DNS-SD

ตัวเลือก:

- `--domain <domain>`: โดเมนการค้นหาในวงกว้าง (ตัวอย่างเช่น `openclaw.internal`)
- `--apply`: ติดตั้งหรืออัปเดตการกำหนดค่า CoreDNS และรีสตาร์ตบริการ (ต้องใช้ sudo; macOS เท่านั้น)

สิ่งที่จะแสดง:

- โดเมนการค้นหาที่ resolve แล้ว
- พาธไฟล์โซน
- IP tailnet ปัจจุบัน
- การกำหนดค่า `openclaw.json` ที่แนะนำสำหรับการค้นหา
- ค่า nameserver/domain ของ Tailscale Split DNS ที่ต้องตั้งค่า

หมายเหตุ:

- หากไม่ระบุ `--apply` คำสั่งนี้จะเป็นเพียงตัวช่วยสำหรับการวางแผนและพิมพ์การตั้งค่าที่แนะนำ
- หากไม่ระบุ `--domain` OpenClaw จะใช้ `discovery.wideArea.domain` จากการกำหนดค่า
- ปัจจุบัน `--apply` รองรับเฉพาะ macOS และคาดว่าจะใช้ Homebrew CoreDNS
- `--apply` จะบูตสแตรปไฟล์โซนหากจำเป็น ตรวจสอบให้แน่ใจว่ามี CoreDNS import stanza อยู่ และรีสตาร์ตบริการ brew `coredns`
