---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ WeChat หรือ Weixin
    - คุณกำลังติดตั้งหรือแก้ไขปัญหา plugin แชนเนล openclaw-weixin
    - คุณต้องเข้าใจว่า plugin แชนเนลภายนอกทำงานควบคู่กับ Gateway อย่างไร
summary: การตั้งค่าแชนเนล WeChat ผ่าน plugin ภายนอก openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-23T05:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw เชื่อมต่อกับ WeChat ผ่าน plugin แชนเนลภายนอกของ Tencent ชื่อ
`@tencent-weixin/openclaw-weixin`

สถานะ: plugin ภายนอก รองรับแชตส่วนตัวและสื่อ ปัจจุบันความสามารถของ plugin metadata
ยังไม่ได้ระบุว่ารองรับแชตกลุ่ม

## การตั้งชื่อ

- **WeChat** คือชื่อที่ใช้แสดงต่อผู้ใช้ในเอกสารนี้
- **Weixin** คือชื่อที่ใช้โดยแพ็กเกจของ Tencent และโดย plugin id
- `openclaw-weixin` คือ channel id ของ OpenClaw
- `@tencent-weixin/openclaw-weixin` คือแพ็กเกจ npm

ใช้ `openclaw-weixin` ในคำสั่ง CLI และพาธ config

## วิธีการทำงาน

โค้ด WeChat ไม่ได้อยู่ใน core repo ของ OpenClaw OpenClaw ให้สัญญา plugin แชนเนลแบบทั่วไป และ plugin ภายนอกเป็นผู้ให้ runtime ที่เฉพาะกับ WeChat:

1. `openclaw plugins install` ติดตั้ง `@tencent-weixin/openclaw-weixin`
2. Gateway ค้นพบ plugin manifest และโหลด entrypoint ของ plugin
3. plugin ลงทะเบียน channel id `openclaw-weixin`
4. `openclaw channels login --channel openclaw-weixin` เริ่มการล็อกอินด้วย QR
5. plugin จัดเก็บข้อมูลรับรองบัญชีไว้ภายใต้ไดเรกทอรีสถานะของ OpenClaw
6. เมื่อ Gateway เริ่มทำงาน plugin จะเริ่มตัว monitor ของ Weixin สำหรับแต่ละ
   บัญชีที่กำหนดค่าไว้
7. ข้อความ WeChat ขาเข้าจะถูกทำให้เป็นมาตรฐานผ่านสัญญาแชนเนล ถูกกำหนดเส้นทางไปยัง
   เอเจนต์ OpenClaw ที่เลือก และส่งกลับผ่านเส้นทางขาออกของ plugin

การแยกส่วนนี้สำคัญ: core ของ OpenClaw ควรคงความไม่ขึ้นกับแชนเนล การล็อกอิน WeChat,
การเรียก Tencent iLink API, การอัปโหลด/ดาวน์โหลดสื่อ, context token และการเฝ้าติดตามบัญชี
เป็นความรับผิดชอบของ plugin ภายนอก

## ติดตั้ง

ติดตั้งอย่างรวดเร็ว:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

ติดตั้งด้วยตนเอง:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

รีสตาร์ต Gateway หลังการติดตั้ง:

```bash
openclaw gateway restart
```

## ล็อกอิน

รันการล็อกอินด้วย QR บนเครื่องเดียวกับที่รัน Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

สแกน QR code ด้วย WeChat บนโทรศัพท์ของคุณและยืนยันการล็อกอิน plugin จะบันทึก
โทเค็นของบัญชีไว้ในเครื่องหลังจากสแกนสำเร็จ

หากต้องการเพิ่มบัญชี WeChat อีกบัญชี ให้รันคำสั่งล็อกอินเดิมอีกครั้ง สำหรับหลายบัญชี
ให้แยกเซสชันข้อความส่วนตัวตามบัญชี แชนเนล และผู้ส่ง:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## การควบคุมการเข้าถึง

ข้อความส่วนตัวใช้โมเดล pairing และ allowlist มาตรฐานของ OpenClaw สำหรับ channel
plugin

อนุมัติผู้ส่งใหม่:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

สำหรับโมเดลการควบคุมการเข้าถึงแบบเต็ม ดู [Pairing](/th/channels/pairing)

## ความเข้ากันได้

plugin จะตรวจสอบเวอร์ชันของ OpenClaw บนโฮสต์เมื่อเริ่มทำงาน

| สาย plugin | เวอร์ชัน OpenClaw        | npm tag  |
| ---------- | ------------------------ | -------- |
| `2.x`      | `>=2026.3.22`            | `latest` |
| `1.x`      | `>=2026.1.0 <2026.3.22`  | `legacy` |

หาก plugin รายงานว่าเวอร์ชัน OpenClaw ของคุณเก่าเกินไป ให้เลือกอัปเดต
OpenClaw หรือติดตั้งสาย plugin แบบ legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## โปรเซส sidecar

plugin WeChat สามารถรันงานช่วยเหลือควบคู่กับ Gateway ขณะเฝ้าติดตาม
Tencent iLink API ได้ ใน issue #68451 เส้นทางตัวช่วยนี้เผยให้เห็นบั๊กใน
การล้าง Gateway เก่าทั่วไปของ OpenClaw: โปรเซสลูกอาจพยายามล้างโปรเซส Gateway แม่
ทำให้เกิดลูปรีสตาร์ตภายใต้ตัวจัดการโปรเซส เช่น systemd

ปัจจุบันการล้างระหว่างเริ่มต้นของ OpenClaw จะยกเว้นโปรเซสปัจจุบันและโปรเซสบรรพบุรุษ
ดังนั้นตัวช่วยของแชนเนลจึงต้องไม่ kill Gateway ที่เป็นผู้เปิดมัน การแก้ไขนี้เป็นแบบทั่วไป;
ไม่ใช่เส้นทางเฉพาะ WeChat ใน core

## การแก้ไขปัญหา

ตรวจสอบการติดตั้งและสถานะ:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

หากแชนเนลแสดงว่าติดตั้งแล้วแต่ไม่เชื่อมต่อ ให้ยืนยันว่า plugin ถูก
เปิดใช้งานแล้วและรีสตาร์ต:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

หาก Gateway รีสตาร์ตซ้ำหลังจากเปิดใช้ WeChat ให้อัปเดตทั้ง OpenClaw และ
plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

ปิดใช้งานชั่วคราว:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## เอกสารที่เกี่ยวข้อง

- ภาพรวมแชนเนล: [แชนเนลแชต](/th/channels)
- Pairing: [Pairing](/th/channels/pairing)
- การกำหนดเส้นทางแชนเนล: [การกำหนดเส้นทางแชนเนล](/th/channels/channel-routing)
- สถาปัตยกรรม Plugin: [สถาปัตยกรรม Plugin](/th/plugins/architecture)
- SDK ของ channel plugin: [Channel Plugin SDK](/th/plugins/sdk-channel-plugins)
- แพ็กเกจภายนอก: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
