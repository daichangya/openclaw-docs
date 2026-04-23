---
read_when:
    - Node เชื่อมต่ออยู่ แต่เครื่องมือ camera/canvas/screen/exec ล้มเหลว
    - คุณต้องการโมเดลความเข้าใจเรื่อง node pairing เทียบกับ approvals
summary: แก้ไขปัญหาการจับคู่ Node ข้อกำหนดเรื่อง foreground สิทธิ์ และความล้มเหลวของเครื่องมือ
title: การแก้ไขปัญหา Node
x-i18n:
    generated_at: "2026-04-23T05:43:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหา Node

ใช้หน้านี้เมื่อมองเห็น node ใน status แต่เครื่องมือของ node ล้มเหลว

## ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นรันการตรวจสอบเฉพาะสำหรับ node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

สัญญาณที่ถือว่าปกติ:

- Node เชื่อมต่อและจับคู่แล้วสำหรับ role `node`
- `nodes describe` มี capability ที่คุณกำลังเรียกใช้
- Exec approvals แสดง mode/allowlist ตามที่คาดไว้

## ข้อกำหนดเรื่อง foreground

`canvas.*`, `camera.*` และ `screen.*` ใช้ได้เฉพาะ foreground บน node ของ iOS/Android

ตรวจสอบและแก้ไขแบบเร็ว:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

หากคุณเห็น `NODE_BACKGROUND_UNAVAILABLE` ให้นำแอป node ขึ้นมาด้านหน้าแล้วลองใหม่

## เมทริกซ์สิทธิ์

| Capability                   | iOS                                     | Android                                      | แอป node บน macOS                | รหัสข้อผิดพลาดที่พบบ่อย           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | กล้อง (+ ไมค์สำหรับเสียงในคลิป)           | กล้อง (+ ไมค์สำหรับเสียงในคลิป)                | กล้อง (+ ไมค์สำหรับเสียงในคลิป) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording (+ ไมค์แบบไม่บังคับ)       | prompt สำหรับการจับหน้าจอ (+ ไมค์แบบไม่บังคับ)       | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using หรือ Always (ขึ้นอยู่กับโหมด) | ตำแหน่งแบบ Foreground/Background ตามโหมด | สิทธิ์ตำแหน่ง           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (เส้นทางโฮสต์ของ node)                    | n/a (เส้นทางโฮสต์ของ node)                         | ต้องใช้ exec approvals       | `SYSTEM_RUN_DENIED`            |

## Pairing เทียบกับ approvals

สิ่งเหล่านี้เป็นด่านคนละชั้นกัน:

1. **Device pairing**: node นี้สามารถเชื่อมต่อกับ gateway ได้หรือไม่?
2. **นโยบายคำสั่ง node ของ Gateway**: RPC command ID นี้ได้รับอนุญาตโดย `gateway.nodes.allowCommands` / `denyCommands` และค่าเริ่มต้นของแพลตฟอร์มหรือไม่?
3. **Exec approvals**: node นี้สามารถรัน shell command ใดคำสั่งหนึ่งในเครื่องได้หรือไม่?

การตรวจสอบแบบเร็ว:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

หากไม่มี pairing ให้อนุมัติอุปกรณ์ของ node ก่อน
หาก `nodes describe` ไม่มีคำสั่งที่ควรมี ให้ตรวจสอบนโยบายคำสั่ง node ของ gateway และตรวจสอบว่า node ได้ประกาศคำสั่งนั้นตอนเชื่อมต่อจริงหรือไม่
หาก pairing ปกติแต่ `system.run` ล้มเหลว ให้แก้ exec approvals/allowlist บน node นั้น

Node pairing เป็นด่านด้านตัวตน/ความเชื่อถือ ไม่ใช่พื้นผิวสำหรับอนุมัติรายคำสั่ง สำหรับ `system.run`, นโยบายแบบราย node อยู่ในไฟล์ exec approvals ของ node นั้น (`openclaw approvals get --node ...`) ไม่ได้อยู่ใน pairing record ของ gateway

สำหรับการรัน `host=node` ที่อิง approval, gateway จะผูกการรันเข้ากับ
`systemRunPlan` แบบ canonical ที่เตรียมไว้ด้วย หากผู้เรียกภายหลังแก้ไข
command/cwd หรือ metadata ของ session ก่อนที่การรันที่อนุมัติแล้วจะถูกส่งต่อ gateway จะปฏิเสธ
การรันนั้นว่าเป็น approval mismatch แทนที่จะเชื่อถือ payload ที่ถูกแก้ไข

## รหัสข้อผิดพลาดของ node ที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง; นำขึ้นมาด้านหน้า
- `CAMERA_DISABLED` → ปิดสวิตช์กล้องใน settings ของ node
- `*_PERMISSION_REQUIRED` → ไม่มีสิทธิ์ของระบบปฏิบัติการหรือถูกปฏิเสธ
- `LOCATION_DISABLED` → ปิดโหมดตำแหน่งอยู่
- `LOCATION_PERMISSION_REQUIRED` → โหมดตำแหน่งที่ร้องขอไม่ได้รับอนุญาต
- `LOCATION_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง แต่มีเพียงสิทธิ์ While Using
- `SYSTEM_RUN_DENIED: approval required` → คำขอ exec ต้องได้รับการอนุมัติแบบ explicit
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยโหมด allowlist
  บนโฮสต์ node ของ Windows รูปแบบ shell-wrapper เช่น `cmd.exe /c ...` จะถูกนับเป็น allowlist miss ใน
  โหมด allowlist เว้นแต่จะได้รับอนุมัติผ่าน flow การถาม

## วงจรกู้คืนแบบเร็ว

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

หากยังติดปัญหาอยู่:

- อนุมัติ device pairing ใหม่
- เปิดแอป node ใหม่ (ให้อยู่ foreground)
- ให้สิทธิ์ของระบบปฏิบัติการใหม่
- สร้างใหม่/ปรับนโยบาย exec approval

ที่เกี่ยวข้อง:

- [/nodes/index](/th/nodes/index)
- [/nodes/camera](/th/nodes/camera)
- [/nodes/location-command](/th/nodes/location-command)
- [/tools/exec-approvals](/th/tools/exec-approvals)
- [/gateway/pairing](/th/gateway/pairing)
