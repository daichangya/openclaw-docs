---
read_when:
    - กำลังทำงานกับฟีเจอร์ของช่องทาง Nextcloud Talk
summary: สถานะการรองรับ ความสามารถ และการกำหนดค่าสำหรับ Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T08:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

สถานะ: Plugin ที่มาพร้อมในชุด (Webhook bot) รองรับข้อความโดยตรง ห้อง การรีแอ็กชัน และข้อความ Markdown

## Plugin ที่มาพร้อมในชุด

Nextcloud Talk มาพร้อมเป็น Plugin ใน OpenClaw รุ่นปัจจุบัน ดังนั้นบิลด์แบบแพ็กเกจปกติไม่จำเป็นต้องติดตั้งแยกต่างหาก

หากคุณใช้บิลด์รุ่นเก่าหรือการติดตั้งแบบกำหนดเองที่ไม่ได้รวม Nextcloud Talk ให้ติดตั้งด้วยตนเอง:

ติดตั้งผ่าน CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

เช็กเอาต์ในเครื่อง (เมื่อรันจาก git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

รายละเอียด: [Plugins](/th/tools/plugin)

## การตั้งค่าอย่างรวดเร็ว (สำหรับผู้เริ่มต้น)

1. ตรวจสอบให้แน่ใจว่า Nextcloud Talk Plugin พร้อมใช้งาน
   - OpenClaw รุ่นแพ็กเกจปัจจุบันรวมมาให้แล้ว
   - การติดตั้งแบบเก่าหรือแบบกำหนดเองสามารถเพิ่มได้ด้วยตนเองโดยใช้คำสั่งด้านบน
2. บนเซิร์ฟเวอร์ Nextcloud ของคุณ ให้สร้างบอต:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. เปิดใช้งานบอตในการตั้งค่าห้องเป้าหมาย
4. กำหนดค่า OpenClaw:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - หรือ env: `NEXTCLOUD_TALK_BOT_SECRET` (บัญชีค่าเริ่มต้นเท่านั้น)

   การตั้งค่าผ่าน CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   ฟิลด์แบบ explicit ที่เทียบเท่ากัน:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   secret แบบอิงไฟล์:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. รีสตาร์ต Gateway (หรือทำการตั้งค่าให้เสร็จสิ้น)

config ขั้นต่ำ:

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
- URL ของ Webhook ต้องเข้าถึงได้โดย Gateway; ตั้ง `webhookPublicUrl` หากอยู่หลัง proxy
- bot API ไม่รองรับการอัปโหลดสื่อ; สื่อจะถูกส่งเป็น URL
- payload ของ Webhook ไม่ได้แยกความแตกต่างระหว่าง DM กับห้อง; ตั้ง `apiUser` + `apiPassword` เพื่อเปิดใช้งานการค้นหาประเภทห้อง (มิฉะนั้น DM จะถูกมองว่าเป็นห้อง)

## การควบคุมการเข้าถึง (DM)

- ค่าเริ่มต้น: `channels.nextcloud-talk.dmPolicy = "pairing"` ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing
- อนุมัติผ่าน:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM สาธารณะ: `channels.nextcloud-talk.dmPolicy="open"` ร่วมกับ `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom` จับคู่เฉพาะ Nextcloud user ID; ระบบจะไม่สนใจชื่อที่แสดง

## ห้อง (กลุ่ม)

- ค่าเริ่มต้น: `channels.nextcloud-talk.groupPolicy = "allowlist"` (กำหนดการทริกเกอร์ด้วยการกล่าวถึง)
- ทำ allowlist ของห้องด้วย `channels.nextcloud-talk.rooms`:

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

- หากไม่ต้องการอนุญาตห้องใดเลย ให้คง allowlist ว่างไว้หรือตั้ง `channels.nextcloud-talk.groupPolicy="disabled"`

## ความสามารถ

| ฟีเจอร์ | สถานะ |
| --------------- | ------------- |
| ข้อความโดยตรง | รองรับ |
| ห้อง | รองรับ |
| เธรด | ไม่รองรับ |
| สื่อ | URL เท่านั้น |
| การรีแอ็กชัน | รองรับ |
| คำสั่งแบบเนทีฟ | ไม่รองรับ |

## เอกสารอ้างอิงการกำหนดค่า (Nextcloud Talk)

การกำหนดค่าแบบเต็ม: [Configuration](/th/gateway/configuration)

ตัวเลือกของผู้ให้บริการ:

- `channels.nextcloud-talk.enabled`: เปิด/ปิดการเริ่มต้นช่องทาง
- `channels.nextcloud-talk.baseUrl`: URL ของอินสแตนซ์ Nextcloud
- `channels.nextcloud-talk.botSecret`: shared secret ของบอต
- `channels.nextcloud-talk.botSecretFile`: พาธ secret แบบไฟล์ปกติ Symlink จะถูกปฏิเสธ
- `channels.nextcloud-talk.apiUser`: ผู้ใช้ API สำหรับการค้นหาห้อง (การตรวจจับ DM)
- `channels.nextcloud-talk.apiPassword`: รหัสผ่าน API/app สำหรับการค้นหาห้อง
- `channels.nextcloud-talk.apiPasswordFile`: พาธไฟล์รหัสผ่าน API
- `channels.nextcloud-talk.webhookPort`: พอร์ตตัวรับฟัง Webhook (ค่าเริ่มต้น: 8788)
- `channels.nextcloud-talk.webhookHost`: โฮสต์ของ Webhook (ค่าเริ่มต้น: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: พาธของ Webhook (ค่าเริ่มต้น: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: URL ของ Webhook ที่เข้าถึงได้จากภายนอก
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: allowlist ของ DM (user ID) การใช้ `open` ต้องมี `"*"`
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: allowlist ของกลุ่ม (user ID)
- `channels.nextcloud-talk.rooms`: การตั้งค่าและ allowlist รายห้อง
- `channels.nextcloud-talk.historyLimit`: ขีดจำกัดประวัติกลุ่ม (0 คือปิดใช้งาน)
- `channels.nextcloud-talk.dmHistoryLimit`: ขีดจำกัดประวัติ DM (0 คือปิดใช้งาน)
- `channels.nextcloud-talk.dms`: override ราย DM (`historyLimit`)
- `channels.nextcloud-talk.textChunkLimit`: ขนาดช่วงข้อความขาออก (อักขระ)
- `channels.nextcloud-talk.chunkMode`: `length` (ค่าเริ่มต้น) หรือ `newline` เพื่อแยกที่บรรทัดว่าง (ขอบเขตย่อหน้า) ก่อนแบ่งตามความยาว
- `channels.nextcloud-talk.blockStreaming`: ปิดใช้งาน block streaming สำหรับช่องทางนี้
- `channels.nextcloud-talk.blockStreamingCoalesce`: การปรับแต่งการรวมของ block streaming
- `channels.nextcloud-talk.mediaMaxMb`: ขีดจำกัดสื่อขาเข้า (MB)

## ที่เกี่ยวข้อง

- [ภาพรวม Channels](/th/channels) — ช่องทางที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์ pairing
- [Groups](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกำหนดการทริกเกอร์ด้วยการกล่าวถึง
- [Channel Routing](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [Security](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแรงขึ้น
