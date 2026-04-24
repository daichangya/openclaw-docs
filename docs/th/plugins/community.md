---
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากบุคคลที่สาม
    - คุณต้องการเผยแพร่หรือลงรายการ Plugin ของคุณเอง
summary: 'Plugin ของ OpenClaw ที่ชุมชนดูแลร่วมกัน: เรียกดู ติดตั้ง และส่งของคุณเอง'
title: Plugin ของชุมชน
x-i18n:
    generated_at: "2026-04-24T09:23:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Plugin ของชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยายความสามารถของ OpenClaw ด้วย channel, tool, provider หรือความสามารถอื่น ๆ ใหม่ ๆ โดยสร้างและดูแลโดยชุมชน เผยแพร่บน [ClawHub](/th/tools/clawhub) หรือ npm และติดตั้งได้ด้วยคำสั่งเดียว

ClawHub คือพื้นผิวการค้นหาอย่างเป็นทางการสำหรับ Plugin ของชุมชน อย่าเปิด PR ที่แก้เฉพาะเอกสารเพียงเพื่อเพิ่ม Plugin ของคุณที่นี่เพื่อการค้นหาเจอ; ให้เผยแพร่บน ClawHub แทน

```bash
openclaw plugins install <package-name>
```

OpenClaw จะตรวจสอบ ClawHub ก่อน และ fallback ไปที่ npm โดยอัตโนมัติ

## Plugin ที่ลงรายการไว้

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วยตัวดึงข้อมูลสำเร็จรูปกว่า 20,000 รายการ ให้ agent ของคุณดึงข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google Search, เว็บไซต์ e-commerce และอื่น ๆ ได้เพียงแค่สั่ง

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

bridge อิสระของ OpenClaw สำหรับการสนทนาใน Codex App Server ผูกแชตเข้ากับ thread ของ Codex สนทนาด้วยข้อความธรรมดา และควบคุมด้วยคำสั่งแบบ native ของแชตสำหรับการ resume, planning, review, การเลือก model, Compaction และอื่น ๆ

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

การผสานรวม enterprise robot โดยใช้โหมด Stream รองรับข้อความ ข้อความรูปภาพ และข้อความไฟล์ผ่าน client DingTalk ใดก็ได้

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin การจัดการคอนเท็กซ์แบบไม่สูญเสียสำหรับ OpenClaw การสรุปบทสนทนาแบบอิง DAG พร้อม Compaction แบบ incremental — รักษาความครบถ้วนของคอนเท็กซ์ทั้งหมดไว้ ขณะลดการใช้โทเคน

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin อย่างเป็นทางการที่ส่งออก trace ของ agent ไปยัง Opik ติดตามพฤติกรรม agent, ค่าใช้จ่าย, โทเคน, ข้อผิดพลาด และอื่น ๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

มอบ avatar แบบ Live2D ให้ agent OpenClaw ของคุณ พร้อม lip-sync แบบเรียลไทม์ การแสดงอารมณ์ และ text-to-speech รวมเครื่องมือสำหรับครีเอเตอร์เพื่อสร้าง asset ด้วย AI และการ deploy ไปยัง Prometheus Marketplace ได้ในคลิกเดียว ขณะนี้อยู่ในสถานะ alpha

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

เชื่อมต่อ OpenClaw เข้ากับ QQ ผ่าน QQ Bot API รองรับแชตส่วนตัว การ mention ในกลุ่ม ข้อความใน channel และ rich media รวมถึงเสียง รูปภาพ วิดีโอ และไฟล์

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin channel WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วยการเชื่อมต่อถาวรผ่าน WebSocket ของ WeCom Bot รองรับข้อความโดยตรงและแชตกลุ่ม การตอบกลับแบบสตรีม การส่งข้อความเชิงรุก การประมวลผลรูปภาพ/ไฟล์ การจัดรูปแบบ Markdown การควบคุมการเข้าถึงในตัว และ Skills สำหรับเอกสาร การประชุม และการส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## ส่ง Plugin ของคุณ

เรายินดีต้อนรับ Plugin ของชุมชนที่มีประโยชน์ มีเอกสารประกอบ และปลอดภัยต่อการใช้งาน

<Steps>
  <Step title="เผยแพร่บน ClawHub หรือ npm">
    Plugin ของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`.
    เผยแพร่บน [ClawHub](/th/tools/clawhub) (แนะนำ) หรือ npm
    ดู [Building Plugins](/th/plugins/building-plugins) สำหรับคู่มือฉบับเต็ม

  </Step>

  <Step title="โฮสต์บน GitHub">
    ซอร์สโค้ดต้องอยู่ใน repository สาธารณะ พร้อมเอกสารการตั้งค่าและ issue
    tracker

  </Step>

  <Step title="ใช้ docs PR เฉพาะเมื่อมีการเปลี่ยนแปลงเอกสารต้นทาง">
    คุณไม่จำเป็นต้องมี docs PR เพียงเพื่อให้ Plugin ของคุณถูกค้นหาเจอ ให้เผยแพร่
    บน ClawHub แทน

    เปิด docs PR เฉพาะเมื่อเอกสารต้นทางของ OpenClaw จำเป็นต้องมีการเปลี่ยนแปลงเนื้อหาจริง
    เช่น การแก้ไขคำแนะนำการติดตั้ง หรือการเพิ่มเอกสารข้าม repo
    ที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## เกณฑ์คุณภาพ

| ข้อกำหนด                    | เหตุผล                                         |
| --------------------------- | ---------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องสามารถใช้ `openclaw plugins install` ได้ |
| GitHub repo สาธารณะ        | เพื่อการตรวจสอบซอร์ส การติดตาม issue และความโปร่งใส |
| เอกสารการตั้งค่าและการใช้งาน | ผู้ใช้ต้องรู้วิธีกำหนดค่า                        |
| มีการดูแลอย่างต่อเนื่อง      | มีการอัปเดตล่าสุดหรือมีการตอบสนองต่อ issue       |

wrapper ที่ทำแบบลวก ๆ ความเป็นเจ้าของที่ไม่ชัดเจน หรือแพ็กเกจที่ไม่มีการดูแล อาจไม่ได้รับการยอมรับ

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugin](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [Building Plugins](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — schema ของ manifest
