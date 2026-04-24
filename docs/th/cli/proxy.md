---
read_when:
    - คุณต้องการจับทราฟฟิกการขนส่งของ OpenClaw ในเครื่องเพื่อการดีบัก
    - คุณต้องการตรวจสอบเซสชันพร็อกซีดีบัก, blobs หรือ query presets ที่มีมาในตัว
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw proxy` ซึ่งเป็นพร็อกซีดีบักภายในเครื่องและตัวตรวจสอบการจับข้อมูล
title: พร็อกซี
x-i18n:
    generated_at: "2026-04-24T09:04:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

รันพร็อกซีดีบักแบบ explicit ภายในเครื่อง และตรวจสอบทราฟฟิกที่จับไว้

นี่คือคำสั่งสำหรับการดีบักระดับการขนส่ง สามารถใช้เริ่มพร็อกซีภายในเครื่อง
รันคำสั่งลูกพร้อมเปิดการจับข้อมูล แสดงรายการเซสชันการจับข้อมูล
ค้นหารูปแบบทราฟฟิกทั่วไป อ่าน blobs ที่จับไว้ และล้างข้อมูลการจับข้อมูลในเครื่อง

## คำสั่ง

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Query presets

`openclaw proxy query --preset <name>` รองรับ:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## หมายเหตุ

- `start` ใช้ค่าเริ่มต้นเป็น `127.0.0.1` เว้นแต่จะตั้ง `--host`
- `run` จะเริ่มพร็อกซีดีบักในเครื่อง แล้วจึงรันคำสั่งหลัง `--`
- ข้อมูลที่จับไว้เป็นข้อมูลดีบักในเครื่อง; ใช้ `openclaw proxy purge` เมื่องานเสร็จแล้ว

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การยืนยันตัวตนพร็อกซีที่เชื่อถือได้](/th/gateway/trusted-proxy-auth)
