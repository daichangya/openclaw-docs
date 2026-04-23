---
read_when:
    - คุณต้องการค้นหา Plugin ของ OpenClaw จากผู้พัฒนาภายนอก
    - คุณต้องการเผยแพร่หรือเพิ่ม Plugin ของคุณเองลงในรายการ
summary: 'Plugin ของ OpenClaw ที่ดูแลโดยชุมชน: เรียกดู ติดตั้ง และส่ง Plugin ของคุณเอง'
title: Plugin ของชุมชน
x-i18n:
    generated_at: "2026-04-23T05:46:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugin ของชุมชน

Plugin ของชุมชนคือแพ็กเกจจากบุคคลที่สามที่ขยาย OpenClaw ด้วย
ช่องทาง เครื่องมือ ผู้ให้บริการ หรือความสามารถอื่นๆ ใหม่ๆ โดยถูกสร้างและดูแล
โดยชุมชน เผยแพร่บน [ClawHub](/th/tools/clawhub) หรือ npm และ
ติดตั้งได้ด้วยคำสั่งเดียว

ClawHub คือพื้นผิวการค้นพบแบบ canonical สำหรับ Plugin ของชุมชน อย่าเปิด
PR ที่แก้เฉพาะเอกสารเพียงเพื่อเพิ่ม Plugin ของคุณที่นี่เพื่อให้ค้นหาเจอ; ให้เผยแพร่บน
ClawHub แทน

```bash
openclaw plugins install <package-name>
```

OpenClaw จะตรวจสอบ ClawHub ก่อน แล้ว fallback ไปยัง npm โดยอัตโนมัติ

## Plugin ที่อยู่ในรายการ

### Apify

ดึงข้อมูลจากเว็บไซต์ใดก็ได้ด้วย scraper สำเร็จรูปกว่า 20,000 ตัว ให้เอเจนต์ของคุณ
แยกข้อมูลจาก Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, เว็บไซต์อีคอมเมิร์ซ และอื่นๆ ได้ เพียงแค่สั่ง

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

สะพานเชื่อม OpenClaw แบบอิสระสำหรับบทสนทนาใน Codex App Server ผูกแชตเข้ากับ
เธรด Codex สนทนาด้วยข้อความธรรมดา และควบคุมด้วยคำสั่งแบบเนทีฟของแชตสำหรับ
resume, planning, review, การเลือกโมเดล, Compaction และอื่นๆ

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

การเชื่อมต่อ enterprise robot โดยใช้โหมด Stream รองรับข้อความตัวอักษร รูปภาพ และ
ข้อความไฟล์ผ่านไคลเอนต์ DingTalk ใดก็ได้

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin สำหรับการจัดการบริบทแบบไม่สูญเสียสำหรับ OpenClaw การสรุปบทสนทนาแบบ
อิง DAG พร้อม Compaction แบบ incremental — รักษาความครบถ้วนของบริบททั้งหมด
ขณะลดการใช้โทเค็น

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin อย่างเป็นทางการที่ส่งออก traces ของเอเจนต์ไปยัง Opik ติดตามพฤติกรรมของเอเจนต์
ค่าใช้จ่าย โทเค็น ข้อผิดพลาด และอื่นๆ

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

มอบ avatar แบบ Live2D ให้เอเจนต์ OpenClaw ของคุณ พร้อม lip-sync แบบเรียลไทม์
การแสดงอารมณ์ และ text-to-speech รวม creator tools สำหรับการสร้าง asset ด้วย AI
และการ deploy แบบคลิกเดียวไปยัง Prometheus Marketplace ปัจจุบันอยู่ในช่วง alpha

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

เชื่อมต่อ OpenClaw เข้ากับ QQ ผ่าน QQ Bot API รองรับแชตส่วนตัว การ mention ในกลุ่ม
ข้อความในแชนเนล และ rich media เช่น เสียง รูปภาพ วิดีโอ
และไฟล์

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin ช่องทาง WeCom สำหรับ OpenClaw โดยทีม Tencent WeCom ขับเคลื่อนด้วย
การเชื่อมต่อถาวรแบบ WeCom Bot WebSocket รองรับ direct messages และ group
chats, การตอบกลับแบบสตรีม, การส่งข้อความเชิงรุก, การประมวลผลรูปภาพ/ไฟล์, การจัดรูปแบบ Markdown
การควบคุมการเข้าถึงในตัว และ Skills สำหรับเอกสาร/การประชุม/การส่งข้อความ

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## ส่ง Plugin ของคุณ

เรายินดีต้อนรับ Plugin ของชุมชนที่มีประโยชน์ มีเอกสาร และใช้งานได้อย่างปลอดภัย

<Steps>
  <Step title="เผยแพร่บน ClawHub หรือ npm">
    Plugin ของคุณต้องติดตั้งได้ผ่าน `openclaw plugins install \<package-name\>`
    เผยแพร่บน [ClawHub](/th/tools/clawhub) (แนะนำ) หรือ npm
    ดู [การสร้าง Plugins](/th/plugins/building-plugins) สำหรับคู่มือฉบับเต็ม

  </Step>

  <Step title="โฮสต์บน GitHub">
    ซอร์สโค้ดต้องอยู่ใน public repository พร้อมเอกสารการตั้งค่าและ issue
    tracker

  </Step>

  <Step title="ใช้ docs PR เฉพาะเมื่อมีการเปลี่ยนแปลงใน source-doc">
    คุณไม่จำเป็นต้องมี docs PR เพียงเพื่อให้ Plugin ของคุณค้นหาเจอ ให้เผยแพร่มัน
    บน ClawHub แทน

    เปิด docs PR เฉพาะเมื่อเอกสารต้นทางของ OpenClaw ต้องมีการเปลี่ยนแปลงเนื้อหาจริง
    เช่น การแก้คำแนะนำการติดตั้ง หรือการเพิ่มเอกสารข้าม repo
    ที่ควรอยู่ในชุดเอกสารหลัก

  </Step>
</Steps>

## เกณฑ์คุณภาพ

| ข้อกำหนด                 | เหตุผล                                           |
| --------------------------- | --------------------------------------------- |
| เผยแพร่บน ClawHub หรือ npm | ผู้ใช้ต้องใช้ `openclaw plugins install` ได้จริง |
| public GitHub repo          | เพื่อการตรวจสอบซอร์ส การติดตาม issue และความโปร่งใส   |
| เอกสารการตั้งค่าและการใช้งาน        | ผู้ใช้ต้องรู้วิธีกำหนดค่า        |
| มีการดูแลอย่างต่อเนื่อง          | มีการอัปเดตล่าสุดหรือมีการตอบสนองต่อ issue   |

wrapper แบบทำลวกๆ ความเป็นเจ้าของไม่ชัดเจน หรือแพ็กเกจที่ไม่มีการดูแล อาจถูกปฏิเสธ

## ที่เกี่ยวข้อง

- [ติดตั้งและกำหนดค่า Plugins](/th/tools/plugin) — วิธีติดตั้ง Plugin ใดก็ได้
- [การสร้าง Plugins](/th/plugins/building-plugins) — สร้างของคุณเอง
- [Plugin Manifest](/th/plugins/manifest) — สคีมา manifest
