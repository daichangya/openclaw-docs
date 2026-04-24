---
read_when:
    - คุณต้องการเชื่อมต่อ OpenClaw กับ WeChat หรือ Weixin
    - คุณกำลังติดตั้งหรือแก้ปัญหา Plugin ช่องทาง openclaw-weixin
    - คุณต้องเข้าใจว่า Plugin ช่องทางภายนอกทำงานข้าง Gateway อย่างไร
summary: การตั้งค่าช่องทาง WeChat ผ่าน Plugin ภายนอก openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-24T09:00:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw เชื่อมต่อกับ WeChat ผ่าน Plugin ช่องทางภายนอกของ Tencent
`@tencent-weixin/openclaw-weixin`

สถานะ: Plugin ภายนอก รองรับแชตส่วนตัวและสื่อ ปัจจุบันยังไม่มีการประกาศการรองรับ
แชตกลุ่มใน capability metadata ของ Plugin

## การตั้งชื่อ

- **WeChat** คือชื่อที่ใช้แสดงต่อผู้ใช้ในเอกสารนี้
- **Weixin** คือชื่อที่ใช้ในแพ็กเกจของ Tencent และใช้เป็น id ของ Plugin
- `openclaw-weixin` คือ channel id ของ OpenClaw
- `@tencent-weixin/openclaw-weixin` คือแพ็กเกจ npm

ใช้ `openclaw-weixin` ในคำสั่ง CLI และพาธคอนฟิก

## วิธีการทำงาน

โค้ด WeChat ไม่ได้อยู่ใน repo core ของ OpenClaw OpenClaw จัดเตรียม
สัญญา Plugin ช่องทางแบบทั่วไป และ Plugin ภายนอกจะจัดเตรียมรันไทม์
เฉพาะของ WeChat:

1. `openclaw plugins install` จะติดตั้ง `@tencent-weixin/openclaw-weixin`
2. Gateway จะค้นหา manifest ของ Plugin และโหลด entrypoint ของ Plugin
3. Plugin จะลงทะเบียน channel id `openclaw-weixin`
4. `openclaw channels login --channel openclaw-weixin` จะเริ่มการล็อกอินด้วย QR
5. Plugin จะจัดเก็บข้อมูลรับรองบัญชีไว้ใต้ไดเรกทอรีสถานะของ OpenClaw
6. เมื่อ Gateway เริ่มทำงาน Plugin จะเริ่มตัวตรวจติดตาม Weixin สำหรับแต่ละ
   บัญชีที่กำหนดค่าไว้
7. ข้อความ WeChat ขาเข้าจะถูก normalize ผ่านสัญญาช่องทาง, route ไปยัง
   เอเจนต์ OpenClaw ที่เลือก และส่งกลับผ่านเส้นทางขาออกของ Plugin

การแยกส่วนนี้มีความสำคัญ: core ของ OpenClaw ควรคงความไม่ผูกกับช่องทาง การล็อกอิน WeChat,
การเรียก Tencent iLink API, การอัปโหลด/ดาวน์โหลดสื่อ, context token และการตรวจติดตามบัญชี
เป็นความรับผิดชอบของ Plugin ภายนอก

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

สแกน QR code ด้วย WeChat บนโทรศัพท์ของคุณและยืนยันการล็อกอิน หลังจากสแกนสำเร็จ Plugin
จะบันทึกโทเค็นบัญชีไว้ในเครื่อง

หากต้องการเพิ่มบัญชี WeChat อีกบัญชีหนึ่ง ให้รันคำสั่งล็อกอินเดิมอีกครั้ง สำหรับหลาย
บัญชี ให้แยกเซสชัน direct-message ตามบัญชี ช่องทาง และผู้ส่ง:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## การควบคุมการเข้าถึง

ข้อความส่วนตัวใช้โมเดลการจับคู่และ allowlist แบบปกติของ OpenClaw สำหรับ Plugin
ช่องทาง

อนุมัติผู้ส่งใหม่:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

สำหรับโมเดลการควบคุมการเข้าถึงแบบเต็ม โปรดดู [Pairing](/th/channels/pairing)

## ความเข้ากันได้

Plugin จะตรวจสอบเวอร์ชันของโฮสต์ OpenClaw ตอนเริ่มต้น

| สาย Plugin | เวอร์ชัน OpenClaw         | แท็ก npm |
| ----------- | ------------------------- | -------- |
| `2.x`       | `>=2026.3.22`             | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`   | `legacy` |

หาก Plugin รายงานว่าเวอร์ชัน OpenClaw ของคุณเก่าเกินไป ให้ทำการอัปเดต
OpenClaw หรือติดตั้งสาย Plugin แบบ legacy:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## โพรเซส sidecar

Plugin WeChat สามารถรันงานช่วยเหลือข้าง Gateway ขณะที่ตรวจติดตาม
Tencent iLink API ใน issue #68451 เส้นทางตัวช่วยนี้เผยให้เห็นบั๊กใน
การล้าง Gateway ค้างแบบทั่วไปของ OpenClaw: โพรเซสลูกอาจพยายามล้างโพรเซส
Gateway แม่ ทำให้เกิดลูปการรีสตาร์ตภายใต้ตัวจัดการโพรเซส เช่น systemd

ปัจจุบัน การล้างตอนเริ่มต้นของ OpenClaw จะยกเว้นโพรเซสปัจจุบันและโพรเซสบรรพบุรุษของมัน
ดังนั้นตัวช่วยช่องทางต้องไม่ kill Gateway ที่เป็นผู้เปิดมัน การแก้ไขนี้เป็นแบบทั่วไป
ไม่ใช่เส้นทางเฉพาะของ WeChat ใน core

## การแก้ปัญหา

ตรวจสอบการติดตั้งและสถานะ:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

หากช่องทางแสดงว่าติดตั้งแล้วแต่ไม่เชื่อมต่อ ให้ยืนยันว่า Plugin
เปิดใช้งานอยู่และรีสตาร์ต:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

หาก Gateway รีสตาร์ตซ้ำหลังจากเปิดใช้งาน WeChat ให้อัปเดตทั้ง OpenClaw และ
Plugin:

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

- ภาพรวมช่องทาง: [ช่องทางแชต](/th/channels)
- การจับคู่: [Pairing](/th/channels/pairing)
- การ route ช่องทาง: [Channel Routing](/th/channels/channel-routing)
- สถาปัตยกรรม Plugin: [Plugin Architecture](/th/plugins/architecture)
- SDK สำหรับ Plugin ช่องทาง: [Channel Plugin SDK](/th/plugins/sdk-channel-plugins)
- แพ็กเกจภายนอก: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
