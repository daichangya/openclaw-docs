---
read_when:
    - คุณต้องการให้ OpenClaw รับ DM ผ่าน Nostr
    - คุณกำลังกำหนดค่าระบบส่งข้อความแบบกระจายศูนย์
summary: แชนเนล DM ของ Nostr ผ่านข้อความเข้ารหัส NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-23T05:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**สถานะ:** plugin ที่มาพร้อมระบบแบบทางเลือก (ปิดใช้งานเป็นค่าเริ่มต้นจนกว่าจะกำหนดค่า)

Nostr เป็นโปรโตคอลแบบกระจายศูนย์สำหรับโซเชียลเน็ตเวิร์ก แชนเนลนี้ทำให้ OpenClaw สามารถรับและตอบกลับข้อความส่วนตัว (DM) ที่เข้ารหัสผ่าน NIP-04 ได้

## plugin ที่มาพร้อมระบบ

OpenClaw รุ่นปัจจุบันมาพร้อม Nostr เป็น plugin ที่รวมอยู่ในระบบ ดังนั้น build แบบแพ็กเกจตามปกติจึงไม่ต้องติดตั้งแยก

### การติดตั้งรุ่นเก่า/แบบกำหนดเอง

- Onboarding (`openclaw onboard`) และ `openclaw channels add` ยังคงแสดง
  Nostr จากแค็ตตาล็อกแชนเนลที่ใช้ร่วมกัน
- หาก build ของคุณไม่ได้รวม Nostr ที่มาพร้อมระบบ ให้ติดตั้งด้วยตนเอง

```bash
openclaw plugins install @openclaw/nostr
```

ใช้ local checkout (เวิร์กโฟลว์สำหรับการพัฒนา):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

รีสตาร์ต Gateway หลังจากติดตั้งหรือเปิดใช้งาน plugin

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

ใช้ `--use-env` เพื่อเก็บ `NOSTR_PRIVATE_KEY` ไว้ใน environment แทนการบันทึกคีย์ลงใน config

## การตั้งค่าอย่างรวดเร็ว

1. สร้างคู่กุญแจ Nostr (หากจำเป็น):

```bash
# ใช้ nak
nak key generate
```

2. เพิ่มลงใน config:

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

4. รีสตาร์ต Gateway

## เอกสารอ้างอิงการกำหนดค่า

| คีย์         | ประเภท   | ค่าเริ่มต้น                                | คำอธิบาย                            |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | required                                    | private key ในรูปแบบ `nsec` หรือ hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL ของ relay (WebSocket)           |
| `dmPolicy`   | string   | `pairing`                                   | นโยบายการเข้าถึง DM                 |
| `allowFrom`  | string[] | `[]`                                        | pubkey ของผู้ส่งที่ได้รับอนุญาต     |
| `enabled`    | boolean  | `true`                                      | เปิด/ปิดใช้งานแชนเนล                |
| `name`       | string   | -                                           | ชื่อที่แสดง                         |
| `profile`    | object   | -                                           | เมทาดาทาโปรไฟล์ NIP-01             |

## เมทาดาทาโปรไฟล์

ข้อมูลโปรไฟล์จะถูกเผยแพร่เป็น event NIP-01 `kind:0` คุณสามารถจัดการได้จาก Control UI (Channels -> Nostr -> Profile) หรือตั้งค่าโดยตรงใน config

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
- การนำเข้าจาก relay จะรวมฟิลด์เข้าด้วยกันและคงค่าการแทนที่ในเครื่องไว้

## การควบคุมการเข้าถึง

### นโยบาย DM

- **pairing** (ค่าเริ่มต้น): ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing
- **allowlist**: เฉพาะ pubkey ใน `allowFrom` เท่านั้นที่ส่ง DM ได้
- **open**: เปิดรับ DM ขาเข้าสาธารณะ (ต้องใช้ `allowFrom: ["*"]`)
- **disabled**: เพิกเฉยต่อ DM ขาเข้า

หมายเหตุด้านการบังคับใช้:

- ลายเซ็นของ event ขาเข้าจะถูกตรวจสอบก่อนนโยบายผู้ส่งและการถอดรหัส NIP-04 ดังนั้น event ปลอมจะถูกปฏิเสธตั้งแต่ต้น
- การตอบกลับ pairing จะถูกส่งโดยไม่ประมวลผลเนื้อหา DM เดิม
- DM ขาเข้ามีการจำกัดอัตรา และ payload ที่มีขนาดใหญ่เกินไปจะถูกทิ้งก่อนถอดรหัส

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

รูปแบบที่รองรับ:

- **Private key:** `nsec...` หรือ hex 64 อักขระ
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

- ใช้ relay 2-3 ตัวเพื่อความซ้ำซ้อน
- หลีกเลี่ยงการใช้ relay มากเกินไป (ความหน่วง, ข้อมูลซ้ำ)
- relay แบบเสียเงินอาจช่วยเพิ่มความน่าเชื่อถือ
- relay ภายในเครื่องใช้ได้สำหรับการทดสอบ (`ws://localhost:7777`)

## การรองรับโปรโตคอล

| NIP    | สถานะ     | คำอธิบาย                              |
| ------ | --------- | ------------------------------------- |
| NIP-01 | รองรับ    | รูปแบบ event พื้นฐาน + เมทาดาทาโปรไฟล์ |
| NIP-04 | รองรับ    | DM ที่เข้ารหัส (`kind:4`)             |
| NIP-17 | วางแผนไว้ | DM แบบ gift-wrapped                   |
| NIP-44 | วางแผนไว้ | การเข้ารหัสแบบมีเวอร์ชัน              |

## การทดสอบ

### relay ภายในเครื่อง

```bash
# เริ่ม strfry
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

1. จด pubkey (npub) ของบอตจาก log
2. เปิดไคลเอนต์ Nostr (Damus, Amethyst ฯลฯ)
3. ส่ง DM ไปยัง pubkey ของบอต
4. ตรวจสอบการตอบกลับ

## การแก้ไขปัญหา

### ไม่ได้รับข้อความ

- ตรวจสอบว่า private key ถูกต้อง
- ตรวจสอบว่า URL ของ relay เข้าถึงได้และใช้ `wss://` (หรือ `ws://` สำหรับในเครื่อง)
- ยืนยันว่า `enabled` ไม่ได้เป็น `false`
- ตรวจสอบ log ของ Gateway สำหรับข้อผิดพลาดการเชื่อมต่อ relay

### ไม่ส่งการตอบกลับ

- ตรวจสอบว่า relay ยอมรับการเขียน
- ตรวจสอบการเชื่อมต่อขาออก
- เฝ้าดูการจำกัดอัตราของ relay

### การตอบกลับซ้ำ

- เป็นพฤติกรรมที่คาดไว้เมื่อใช้หลาย relay
- ข้อความจะถูกกำจัดความซ้ำตาม event ID; มีเพียงการส่งครั้งแรกเท่านั้นที่กระตุ้นการตอบกลับ

## ความปลอดภัย

- อย่าคอมมิต private key เด็ดขาด
- ใช้ตัวแปร environment สำหรับคีย์
- พิจารณาใช้ `allowlist` สำหรับบอตที่ใช้งานจริง
- ลายเซ็นจะถูกตรวจสอบก่อนนโยบายผู้ส่ง และนโยบายผู้ส่งจะถูกบังคับใช้ก่อนถอดรหัส ดังนั้น event ปลอมจะถูกปฏิเสธตั้งแต่ต้น และผู้ส่งที่ไม่รู้จักไม่สามารถบังคับให้เกิดงานเข้ารหัสเต็มรูปแบบได้

## ข้อจำกัด (MVP)

- รองรับเฉพาะข้อความส่วนตัว (ไม่มีแชตกลุ่ม)
- ไม่มีไฟล์แนบสื่อ
- รองรับเฉพาะ NIP-04 (NIP-17 gift-wrap วางแผนไว้)

## ที่เกี่ยวข้อง

- [ภาพรวมแชนเนล](/th/channels) — แชนเนลที่รองรับทั้งหมด
- [Pairing](/th/channels/pairing) — การยืนยันตัวตนผ่าน DM และโฟลว์ pairing
- [กลุ่ม](/th/channels/groups) — พฤติกรรมของแชตกลุ่มและการควบคุมด้วยการ mention
- [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing) — การกำหนดเส้นทางเซสชันสำหรับข้อความ
- [ความปลอดภัย](/th/gateway/security) — โมเดลการเข้าถึงและการเสริมความแข็งแกร่งด้านความปลอดภัย
