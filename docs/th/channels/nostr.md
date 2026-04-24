---
read_when:
    - คุณต้องการให้ OpenClaw รับ DM ผ่าน Nostr
    - คุณกำลังตั้งค่าระบบส่งข้อความแบบกระจายศูนย์
summary: ช่องทาง DM ของ Nostr ผ่านข้อความเข้ารหัส NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T08:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**สถานะ:** Bundled Plugin แบบเลือกใช้ (ปิดไว้โดยค่าเริ่มต้นจนกว่าจะกำหนดค่า)

Nostr เป็นโปรโตคอลแบบกระจายศูนย์สำหรับโซเชียลเน็ตเวิร์ก ช่องทางนี้ทำให้ OpenClaw สามารถรับและตอบกลับข้อความส่วนตัว (DM) ที่เข้ารหัสผ่าน NIP-04 ได้

## Bundled Plugin

OpenClaw รุ่นปัจจุบันมาพร้อม Nostr เป็น Bundled Plugin ดังนั้นบิลด์แพ็กเกจปกติจึงไม่ต้องติดตั้งแยก

### การติดตั้งแบบเก่า/กำหนดเอง

- Onboarding (`openclaw onboard`) และ `openclaw channels add` ยังคงแสดง
  Nostr จากแค็ตตาล็อกช่องทางที่ใช้ร่วมกัน
- หากบิลด์ของคุณไม่ได้รวม Bundled Nostr ให้ติดตั้งด้วยตนเอง

```bash
openclaw plugins install @openclaw/nostr
```

ใช้ checkout ในเครื่อง (เวิร์กโฟลว์สำหรับพัฒนา):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

รีสตาร์ท Gateway หลังจากติดตั้งหรือเปิดใช้ plugins

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

ใช้ `--use-env` เพื่อเก็บ `NOSTR_PRIVATE_KEY` ไว้ใน environment แทนการจัดเก็บคีย์ไว้ในการกำหนดค่า

## การตั้งค่าแบบรวดเร็ว

1. สร้างคู่กุญแจ Nostr (หากจำเป็น):

```bash
# Using nak
nak key generate
```

2. เพิ่มลงในการกำหนดค่า:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. export คีย์:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. รีสตาร์ท Gateway

## ข้อมูลอ้างอิงการกำหนดค่า

| Key          | Type     | Default                                     | Description                              |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------- |
| `privateKey` | string   | required                                    | คีย์ส่วนตัวในรูปแบบ `nsec` หรือ hex      |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL ของ relay (WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                   | นโยบายการเข้าถึง DM                      |
| `allowFrom`  | string[] | `[]`                                        | pubkey ของผู้ส่งที่อนุญาต                 |
| `enabled`    | boolean  | `true`                                      | เปิด/ปิดช่องทาง                          |
| `name`       | string   | -                                           | ชื่อที่ใช้แสดง                           |
| `profile`    | object   | -                                           | เมทาดาทาโปรไฟล์ NIP-01                   |

## เมทาดาทาโปรไฟล์

ข้อมูลโปรไฟล์จะถูกเผยแพร่เป็น event NIP-01 `kind:0` คุณสามารถจัดการได้จาก Control UI (Channels -> Nostr -> Profile) หรือตั้งค่าโดยตรงในการกำหนดค่า

ตัวอย่าง:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "บอต DM ผู้ช่วยส่วนตัว",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

หมายเหตุ:

- URL ของโปรไฟล์ต้องใช้ `https://`
- การนำเข้าจาก relay จะรวมฟิลด์ต่าง ๆ และคงค่าที่ override ไว้ในเครื่อง

## การควบคุมการเข้าถึง

### นโยบาย DM

- **pairing** (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่
- **allowlist**: เฉพาะ pubkey ใน `allowFrom` เท่านั้นที่ส่ง DM ได้
- **open**: DM ขาเข้าแบบสาธารณะ (ต้องใช้ `allowFrom: ["*"]`)
- **disabled**: เพิกเฉยต่อ DM ขาเข้า

หมายเหตุการบังคับใช้:

- ลายเซ็นของ event ขาเข้าจะถูกตรวจสอบก่อนนโยบายผู้ส่งและการถอดรหัส NIP-04 ดังนั้น event ปลอมจะถูกปฏิเสธตั้งแต่ต้น
- การตอบกลับการจับคู่จะถูกส่งโดยไม่ประมวลผลเนื้อหา DM ต้นฉบับ
- DM ขาเข้าจะถูกจำกัดอัตรา และ payload ที่มีขนาดใหญ่เกินไปจะถูกทิ้งก่อนถอดรหัส

### ตัวอย่าง allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## รูปแบบคีย์

รูปแบบที่ยอมรับ:

- **คีย์ส่วนตัว:** `nsec...` หรือ hex 64 ตัวอักษร
- **Pubkey (`allowFrom`):** `npub...` หรือ hex

## Relay

ค่าเริ่มต้น: `relay.damus.io` และ `nos.lol`

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

เคล็ดลับ:

- ใช้ relay 2-3 ตัวเพื่อความทนทาน
- หลีกเลี่ยงการใช้ relay มากเกินไป (ความหน่วง, การซ้ำซ้อน)
- relay แบบเสียเงินอาจช่วยเพิ่มความน่าเชื่อถือ
- relay ในเครื่องใช้ได้ดีสำหรับการทดสอบ (`ws://localhost:7777`)

## การรองรับโปรโตคอล

| NIP    | Status     | Description                        |
| ------ | ---------- | ---------------------------------- |
| NIP-01 | รองรับ     | รูปแบบ event พื้นฐาน + เมทาดาทาโปรไฟล์ |
| NIP-04 | รองรับ     | DM ที่เข้ารหัส (`kind:4`)          |
| NIP-17 | วางแผนไว้  | DM แบบห่อของขวัญ                  |
| NIP-44 | วางแผนไว้  | การเข้ารหัสแบบมีเวอร์ชัน          |

## การทดสอบ

### Relay ในเครื่อง

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### การทดสอบด้วยตนเอง

1. ดู pubkey (npub) ของบอตจาก log
2. เปิด Nostr client (Damus, Amethyst เป็นต้น)
3. ส่ง DM ไปยัง pubkey ของบอต
4. ตรวจสอบการตอบกลับ

## การแก้ไขปัญหา

### ไม่ได้รับข้อความ

- ตรวจสอบว่าคีย์ส่วนตัวถูกต้อง
- ตรวจสอบว่า URL ของ relay เข้าถึงได้และใช้ `wss://` (หรือ `ws://` สำหรับในเครื่อง)
- ยืนยันว่า `enabled` ไม่ได้เป็น `false`
- ตรวจสอบ log ของ Gateway เพื่อหาข้อผิดพลาดการเชื่อมต่อ relay

### ไม่ส่งการตอบกลับ

- ตรวจสอบว่า relay ยอมรับการเขียน
- ตรวจสอบการเชื่อมต่อขาออก
- เฝ้าดูข้อจำกัดอัตราของ relay

### มีการตอบกลับซ้ำ

- เป็นพฤติกรรมที่คาดไว้เมื่อใช้หลาย relay
- ข้อความจะถูกตัดซ้ำตาม event ID โดยมีเพียงการส่งครั้งแรกเท่านั้นที่ทำให้เกิดการตอบกลับ

## ความปลอดภัย

- ห้าม commit คีย์ส่วนตัว
- ใช้ตัวแปร environment สำหรับคีย์
- พิจารณาใช้ `allowlist` สำหรับบอตใน production
- ลายเซ็นจะถูกตรวจสอบก่อนนโยบายผู้ส่ง และนโยบายผู้ส่งจะถูกบังคับใช้ก่อนถอดรหัส ดังนั้น event ปลอมจะถูกปฏิเสธตั้งแต่ต้น และผู้ส่งที่ไม่รู้จักไม่สามารถบังคับให้เกิดงานเข้ารหัสเต็มรูปแบบได้

## ข้อจำกัด (MVP)

- รองรับเฉพาะข้อความส่วนตัว (ไม่มีแชตกลุ่ม)
- ไม่มีไฟล์แนบสื่อ
- รองรับเฉพาะ NIP-04 (มีแผนสำหรับ NIP-17 gift-wrap)

## ที่เกี่ยวข้อง

- [ภาพรวมช่องทาง](/th/channels) — ช่องทางทั้งหมดที่รองรับ
- [การจับคู่](/th/channels/pairing) — การยืนยันตัวตน DM และโฟลว์การจับคู่
- [กลุ่ม](/th/channels/groups) — พฤติกรรมแชตกลุ่มและการกั้นด้วยการกล่าวถึง
- [การกำหนดเส้นทางช่องทาง](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการทำให้แข็งแกร่ง
