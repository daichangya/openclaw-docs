---
read_when:
    - Node เชื่อมต่อแล้ว แต่เครื่องมือ camera/canvas/screen/exec ล้มเหลว
    - คุณต้องการโมเดลความเข้าใจเรื่องการจับคู่ Node เทียบกับ approvals
summary: การแก้ปัญหาการจับคู่ Node, ข้อกำหนดการทำงานเบื้องหน้า, สิทธิ์ และความล้มเหลวของเครื่องมือ
title: การแก้ปัญหา Node
x-i18n:
    generated_at: "2026-04-24T09:20:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

ใช้หน้านี้เมื่อมองเห็น Node ในสถานะแล้ว แต่เครื่องมือของ Node ล้มเหลว

## ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นรันการตรวจสอบเฉพาะของ Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

สัญญาณที่ดี:

- Node เชื่อมต่ออยู่และจับคู่แล้วสำหรับ role `node`
- `nodes describe` มี capability ที่คุณกำลังเรียกใช้
- Exec approval แสดงโหมด/allowlist ตามที่คาดไว้

## ข้อกำหนดการทำงานเบื้องหน้า

`canvas.*`, `camera.*` และ `screen.*` ใช้งานได้เฉพาะเมื่ออยู่เบื้องหน้าบน Node ของ iOS/Android

ตรวจแบบเร็วและแก้ไข:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

หากคุณเห็น `NODE_BACKGROUND_UNAVAILABLE` ให้นำแอป Node ขึ้นมาไว้เบื้องหน้าแล้วลองใหม่

## เมทริกซ์สิทธิ์

| Capability                   | iOS                                     | Android                                      | แอป Node บน macOS             | โค้ดข้อผิดพลาดที่พบบ่อย        |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | กล้อง (+ ไมค์สำหรับเสียงใน clip)        | กล้อง (+ ไมค์สำหรับเสียงใน clip)             | กล้อง (+ ไมค์สำหรับเสียงใน clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | การบันทึกหน้าจอ (+ ไมค์แบบไม่บังคับ)    | พรอมป์จับภาพหน้าจอ (+ ไมค์แบบไม่บังคับ)     | การบันทึกหน้าจอ                | `*_PERMISSION_REQUIRED`        |
| `location.get`               | ขณะใช้งานหรือตลอดเวลา (ขึ้นกับโหมด)     | ตำแหน่งแบบ Foreground/Background ตามโหมด     | สิทธิ์ตำแหน่ง                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (เส้นทาง node host)                 | n/a (เส้นทาง node host)                      | ต้องใช้ exec approval         | `SYSTEM_RUN_DENIED`            |

## การจับคู่เทียบกับ approvals

สิ่งเหล่านี้เป็นเกตคนละชั้นกัน:

1. **การจับคู่อุปกรณ์**: Node นี้เชื่อมต่อกับ gateway ได้หรือไม่?
2. **นโยบายคำสั่ง Node ของ Gateway**: อนุญาต command ID ของ RPC หรือไม่ตาม `gateway.nodes.allowCommands` / `denyCommands` และค่าเริ่มต้นของแพลตฟอร์ม?
3. **Exec approvals**: Node นี้สามารถรันคำสั่ง shell เฉพาะรายการหนึ่งในเครื่องได้หรือไม่?

ตรวจแบบเร็ว:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

หากยังไม่ได้จับคู่ ให้อนุมัติอุปกรณ์ Node ก่อน
หาก `nodes describe` ไม่มีคำสั่งนั้น ให้ตรวจนโยบายคำสั่ง Node ของ gateway และตรวจว่า Node ประกาศคำสั่งนั้นตอนเชื่อมต่อจริงหรือไม่
หากการจับคู่ปกติแต่ `system.run` ล้มเหลว ให้แก้ exec approval/allowlist บน Node นั้น

การจับคู่ Node เป็นเกตด้านตัวตน/ความเชื่อถือ ไม่ใช่พื้นผิวการอนุมัติรายคำสั่ง สำหรับ `system.run` นโยบายราย Node จะอยู่ในไฟล์ exec approval ของ Node นั้น (`openclaw approvals get --node ...`) ไม่ได้อยู่ในระเบียนการจับคู่ของ gateway

สำหรับการรัน `host=node` ที่อาศัย approval, gateway ยังผูกการรันเข้ากับ
`systemRunPlan` แบบ canonical ที่เตรียมไว้ด้วย หากผู้เรียกในภายหลังแก้ command/cwd หรือ
metadata ของเซสชันก่อนส่งต่อการรันที่ได้รับอนุมัติ gateway จะปฏิเสธ
การรันนั้นในฐานะ approval mismatch แทนที่จะเชื่อใจ payload ที่ถูกแก้ไขแล้ว

## โค้ดข้อผิดพลาดของ Node ที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง; ให้นำขึ้นมาไว้เบื้องหน้า
- `CAMERA_DISABLED` → ปิด toggle ของกล้องใน settings ของ Node
- `*_PERMISSION_REQUIRED` → ไม่มี/ถูกปฏิเสธสิทธิ์ของ OS
- `LOCATION_DISABLED` → ปิดโหมดตำแหน่งอยู่
- `LOCATION_PERMISSION_REQUIRED` → ยังไม่ได้สิทธิ์สำหรับโหมดตำแหน่งที่ร้องขอ
- `LOCATION_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง แต่มีเพียงสิทธิ์แบบ While Using
- `SYSTEM_RUN_DENIED: approval required` → คำขอ exec ต้องได้รับการอนุมัติอย่างชัดเจน
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยโหมด allowlist
  บน Windows node host รูปแบบ shell-wrapper เช่น `cmd.exe /c ...` จะถูกมองเป็น allowlist miss ใน
  โหมด allowlist เว้นแต่จะได้รับการอนุมัติผ่าน ask flow

## ลูปกู้คืนแบบเร็ว

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

หากยังติดอยู่:

- อนุมัติการจับคู่อุปกรณ์ใหม่อีกครั้ง
- เปิดแอป Node ใหม่ (ให้อยู่เบื้องหน้า)
- ให้สิทธิ์ของ OS ใหม่
- สร้าง/ปรับนโยบาย exec approval ใหม่

ที่เกี่ยวข้อง:

- [/nodes/index](/th/nodes/index)
- [/nodes/camera](/th/nodes/camera)
- [/nodes/location-command](/th/nodes/location-command)
- [/tools/exec-approvals](/th/tools/exec-approvals)
- [/gateway/pairing](/th/gateway/pairing)

## ที่เกี่ยวข้อง

- [ภาพรวมของ Node](/th/nodes)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting)
- [การแก้ปัญหาช่องทาง](/th/channels/troubleshooting)
