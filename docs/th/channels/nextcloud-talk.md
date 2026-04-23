---
read_when:
    - การทำงานกับฟีเจอร์ของช่อง Nextcloud Talk
summary: สถานะความรองรับ ความสามารถ และการกำหนดค่าของ Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-23T05:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

สถานะ: Plugin ที่มาพร้อมกันในชุด (webhook bot) รองรับข้อความโดยตรง ห้อง ปฏิกิริยา และข้อความแบบ markdown

## Plugin ที่มาพร้อมกันในชุด

Nextcloud Talk มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน ดังนั้น build แบบแพ็กเกจปกติจึงไม่ต้องติดตั้งแยกต่างหาก

หากคุณใช้ build รุ่นเก่ากว่าหรือการติดตั้งแบบกำหนดเองที่ไม่รวม Nextcloud Talk ให้ติดตั้งด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

เช็กเอาต์ภายในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Nextcloud Talk Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันจะรวมมาให้แล้ว
   - การติดตั้งแบบเก่า/กำหนดเองสามารถเพิ่มได้ด้วยตนเองด้วยคำสั่งด้านบน
2. บนเซิร์ฟเวอร์ Nextcloud ของคุณ ให้สร้างบอต:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. เปิดใช้งานบอตในค่าตั้งค่าห้องเป้าหมาย
4. กำหนดค่า OpenClaw:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - หรือ env: `NEXTCLOUD_TALK_BOT_SECRET` (เฉพาะบัญชีค่าเริ่มต้น)
5. รีสตาร์ต gateway (หรือดำเนินการตั้งค่าให้เสร็จ)

คอนฟิกขั้นต่ำ:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## หมายเหตุ

- บอตไม่สามารถเริ่ม DM ได้ ผู้ใช้ต้องส่งข้อความหาบอตก่อน
- URL ของ Webhook ต้องเข้าถึงได้โดย Gateway; ให้ตั้ง `webhookPublicUrl` หากอยู่หลังพร็อกซี
- bot API ไม่รองรับการอัปโหลดสื่อ; สื่อจะถูกส่งเป็น URL
- payload ของ Webhook ไม่ได้แยกความแตกต่างระหว่าง DM กับห้อง; ให้ตั้ง `apiUser` + `apiPassword` เพื่อเปิดใช้การค้นหาประเภทห้อง (มิฉะนั้น DM จะถูกมองเป็นห้อง)

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.nextcloud-talk.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing
- อนุมัติผ่าน:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM สาธารณะ: `channels.nextcloud-talk.dmPolicy="open"` ร่วมกับ `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom` จับคู่เฉพาะ user ID ของ Nextcloud เท่านั้น; ชื่อที่แสดงจะถูกละเว้น

## ห้อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.nextcloud-talk.groupPolicy = "allowlist"` (ควบคุมด้วยการกล่าวถึง)
- อนุญาตห้องผ่าน allowlist ด้วย `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- หากไม่ต้องการอนุญาตห้องใดเลย ให้คง allowlist ว่างไว้ หรือตั้ง `channels.nextcloud-talk.groupPolicy="disabled"`

## ความสามารถ

| ฟีเจอร์           | สถานะ            |
| ----------------- | ---------------- |
| ข้อความโดยตรง     | รองรับ           |
| ห้อง              | รองรับ           |
| เธรด              | ไม่รองรับ        |
| สื่อ              | URL เท่านั้น     |
| ปฏิกิริยา         | รองรับ           |
| คำสั่งแบบเนทีฟ    | ไม่รองรับ        |

## เอกสารอ้างอิงการกำหนดค่า (Nextcloud Talk)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.nextcloud-talk.enabled`: เปิด/ปิดการเริ่มต้นช่อง
- `channels.nextcloud-talk.baseUrl`: URL ของอินสแตนซ์ Nextcloud
- `channels.nextcloud-talk.botSecret`: shared secret ของบอต
- `channels.nextcloud-talk.botSecretFile`: พาธของ secret แบบไฟล์ปกติ ระบบจะปฏิเสธ symlink
- `channels.nextcloud-talk.apiUser`: ผู้ใช้ API สำหรับการค้นหาห้อง (การตรวจจับ DM)
- `channels.nextcloud-talk.apiPassword`: รหัสผ่าน API/app สำหรับการค้นหาห้อง
- `channels.nextcloud-talk.apiPasswordFile`: พาธไฟล์รหัสผ่าน API
- `channels.nextcloud-talk.webhookPort`: พอร์ตของตัวรับฟัง Webhook (ค่าเริ่มต้น: 8788)
- `channels.nextcloud-talk.webhookHost`: โฮสต์ของ Webhook (ค่าเริ่มต้น: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: พาธของ Webhook (ค่าเริ่มต้น: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: URL ของ Webhook ที่เข้าถึงได้จากภายนอก
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: allowlist ของ DM (user ID) ค่า `open` ต้องมี `"*"`
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: allowlist ของกลุ่ม (user ID)
- `channels.nextcloud-talk.rooms`: ค่าตั้งค่ารายห้องและ allowlist
- `channels.nextcloud-talk.historyLimit`: ขีดจำกัดประวัติของกลุ่ม (`0` คือปิดใช้งาน)
- `channels.nextcloud-talk.dmHistoryLimit`: ขีดจำกัดประวัติของ DM (`0` คือปิดใช้งาน)
- `channels.nextcloud-talk.dms`: override ราย DM (`historyLimit`)
- `channels.nextcloud-talk.textChunkLimit`: ขนาดการแบ่งข้อความขาออก (อักขระ)
- `channels.nextcloud-talk.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกตามบรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.nextcloud-talk.blockStreaming`: ปิด block streaming สำหรับช่องนี้
- `channels.nextcloud-talk.blockStreamingCoalesce`: การปรับแต่งการรวม block streaming
- `channels.nextcloud-talk.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า (MB)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการกล่าวถึง
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้ระบบแข็งแกร่งขึ้น
