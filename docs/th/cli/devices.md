---
read_when:
    - คุณกำลังอนุมัติคำขอจับคู่อุปกรณ์
    - คุณต้องการหมุนเวียนหรือเพิกถอน token ของอุปกรณ์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw devices` (การจับคู่อุปกรณ์ + การหมุนเวียน/เพิกถอน token)
title: Devices
x-i18n:
    generated_at: "2026-04-24T09:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

จัดการคำขอจับคู่อุปกรณ์และ token ที่มีขอบเขตระดับอุปกรณ์

## คำสั่ง

### `openclaw devices list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการและอุปกรณ์ที่จับคู่แล้ว

```
openclaw devices list
openclaw devices list --json
```

เอาต์พุตของคำขอที่รอดำเนินการจะแสดงสิทธิ์เข้าถึงที่ร้องขอไว้ข้าง ๆ
สิทธิ์เข้าถึงที่ได้รับอนุมัติอยู่แล้วของอุปกรณ์นั้น เมื่ออุปกรณ์ถูกจับคู่อยู่แล้ว
สิ่งนี้ทำให้การอัปเกรด scope/role ชัดเจน แทนที่จะดูเหมือนว่าการจับคู่หายไป

### `openclaw devices remove <deviceId>`

ลบรายการอุปกรณ์ที่จับคู่แล้วหนึ่งรายการ

เมื่อคุณยืนยันตัวตนด้วย token ของอุปกรณ์ที่จับคู่แล้ว ผู้เรียกที่ไม่ใช่แอดมิน
จะลบได้เฉพาะรายการอุปกรณ์ของ **ตนเอง** เท่านั้น การลบอุปกรณ์อื่นต้องใช้
`operator.admin`

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

ล้างอุปกรณ์ที่จับคู่แล้วแบบเป็นกลุ่ม

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการด้วย `requestId` ที่ตรงกันทุกตัวอักษร หากไม่ระบุ `requestId`
หรือส่ง `--latest` OpenClaw จะพิมพ์เฉพาะคำขอที่รอดำเนินการซึ่งถูกเลือก
แล้วออกจากคำสั่ง; ให้รันคำสั่งอนุมัติซ้ำด้วย request ID ที่ตรงกันทุกตัวอักษรหลังจากตรวจสอบ
รายละเอียดแล้ว

หมายเหตุ: หากอุปกรณ์ลองจับคู่ใหม่พร้อมรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public
key) OpenClaw จะทำให้รายการที่รอดำเนินการก่อนหน้าถูกแทนที่และออก
`requestId` ใหม่ ให้รัน `openclaw devices list` ทันทีก่อนอนุมัติเพื่อใช้
ID ปัจจุบัน

หากอุปกรณ์ถูกจับคู่อยู่แล้วและร้องขอ scopes ที่กว้างขึ้นหรือ role ที่กว้างขึ้น
OpenClaw จะคงการอนุมัติเดิมไว้และสร้างคำขออัปเกรดใหม่ที่รอดำเนินการ
ให้ตรวจสอบคอลัมน์ `Requested` เทียบกับ `Approved` ใน `openclaw devices list`
หรือใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างการอัปเกรดที่แน่นอนก่อน
อนุมัติ

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

ปฏิเสธคำขอจับคู่อุปกรณ์ที่รอดำเนินการ

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

หมุนเวียน token ของอุปกรณ์สำหรับ role ที่ระบุ (พร้อมอัปเดต scopes ได้ตามตัวเลือก)
role เป้าหมายต้องมีอยู่แล้วในสัญญาการจับคู่ที่ได้รับอนุมัติของอุปกรณ์นั้น
การหมุนเวียนไม่สามารถสร้าง role ใหม่ที่ยังไม่ได้รับอนุมัติได้
หากคุณไม่ระบุ `--scope` การเชื่อมต่อใหม่ในภายหลังด้วย token ที่หมุนเวียนและเก็บไว้
จะนำ scopes ที่ได้รับอนุมัติซึ่งแคชไว้ของ token นั้นกลับมาใช้ซ้ำ หากคุณส่งค่า `--scope`
อย่างชัดเจน ค่าเหล่านั้นจะกลายเป็นชุด scope ที่ถูกเก็บไว้สำหรับการเชื่อมต่อใหม่ด้วย cached-token ในอนาคต
ผู้เรียกที่เป็น paired-device และไม่ใช่แอดมิน สามารถหมุนเวียนได้เฉพาะ token อุปกรณ์ของ **ตนเอง**
เท่านั้น นอกจากนี้ ค่า `--scope` ที่ระบุอย่างชัดเจนทั้งหมดต้องอยู่ภายใน
operator scopes ของเซสชันผู้เรียกเอง; การหมุนเวียนไม่สามารถสร้าง operator token
ที่กว้างกว่าสิทธิ์ที่ผู้เรียกมีอยู่แล้วได้

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ส่งกลับ payload token ใหม่เป็น JSON

### `openclaw devices revoke --device <id> --role <role>`

เพิกถอน token ของอุปกรณ์สำหรับ role ที่ระบุ

ผู้เรียกที่เป็น paired-device และไม่ใช่แอดมิน สามารถเพิกถอนได้เฉพาะ token อุปกรณ์ของ **ตนเอง**
เท่านั้น การเพิกถอน token ของอุปกรณ์อื่นต้องใช้ `operator.admin`

```
openclaw devices revoke --device <deviceId> --role node
```

ส่งกลับผลการเพิกถอนเป็น JSON

## ตัวเลือกทั่วไป

- `--url <url>`: Gateway WebSocket URL (ค่าเริ่มต้นใช้ `gateway.remote.url` เมื่อมีการกำหนดค่า)
- `--token <token>`: token ของ Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่านของ Gateway (การยืนยันตัวตนด้วยรหัสผ่าน)
- `--timeout <ms>`: ระยะหมดเวลาของ RPC
- `--json`: เอาต์พุตแบบ JSON (แนะนำสำหรับการทำสคริปต์)

หมายเหตุ: เมื่อคุณตั้งค่า `--url`, CLI จะไม่ fallback ไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุชัดเจนถือเป็นข้อผิดพลาด

## หมายเหตุ

- การหมุนเวียน token จะส่งกลับ token ใหม่ (มีความอ่อนไหว) ให้ปฏิบัติต่อมันเป็นความลับ
- คำสั่งเหล่านี้ต้องใช้ scope `operator.pairing` (หรือ `operator.admin`)
- การหมุนเวียน token จะอยู่ภายในชุด role ที่ได้รับอนุมัติในการจับคู่และค่า baseline ของ scope
  ที่ได้รับอนุมัติสำหรับอุปกรณ์นั้น รายการ cached token ที่หลงเหลืออยู่จะไม่ให้สิทธิ์
  เป้าหมายการหมุนเวียนใหม่
- สำหรับ paired-device token sessions การจัดการข้ามอุปกรณ์เป็นแบบแอดมินเท่านั้น:
  `remove`, `rotate` และ `revoke` ใช้ได้กับตนเองเท่านั้น เว้นแต่ผู้เรียกจะมี
  `operator.admin`
- `devices clear` ถูกป้องกันด้วย `--yes` โดยตั้งใจ
- หาก pairing scope ไม่พร้อมใช้งานบน local loopback (และไม่ได้ส่ง `--url` อย่างชัดเจน), `list`/`approve` สามารถใช้ local pairing fallback ได้
- `devices approve` ต้องใช้ request ID ที่ระบุชัดเจนก่อนสร้าง token; หากไม่ระบุ `requestId` หรือส่ง `--latest` จะเป็นเพียงการดูตัวอย่างคำขอที่รอดำเนินการล่าสุดเท่านั้น

## เช็กลิสต์การกู้คืนเมื่อ token ไม่ตรงกัน

ใช้สิ่งนี้เมื่อ Control UI หรือ clients อื่นยังคงล้มเหลวด้วย `AUTH_TOKEN_MISMATCH` หรือ `AUTH_DEVICE_TOKEN_MISMATCH`

1. ยืนยันแหล่งที่มาของ token gateway ปัจจุบัน:

```bash
openclaw config get gateway.auth.token
```

2. แสดงรายการอุปกรณ์ที่จับคู่แล้วและระบุ device id ที่มีปัญหา:

```bash
openclaw devices list
```

3. หมุนเวียน operator token สำหรับอุปกรณ์ที่มีปัญหา:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. หากการหมุนเวียนยังไม่พอ ให้ลบ pairing ที่ค้างอยู่และอนุมัติใหม่:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. ลองเชื่อมต่อ client ใหม่ด้วย shared token/password ปัจจุบัน

หมายเหตุ:

- ลำดับความสำคัญการยืนยันตัวตนในการเชื่อมต่อใหม่ปกติคือ shared token/password ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน จากนั้น stored device token แล้วค่อย bootstrap token
- การกู้คืน `AUTH_TOKEN_MISMATCH` แบบเชื่อถือได้สามารถส่งทั้ง shared token และ stored device token ร่วมกันชั่วคราวสำหรับการลองใหม่แบบมีขอบเขตเพียงครั้งเดียว

ที่เกี่ยวข้อง:

- [Dashboard auth troubleshooting](/th/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/th/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Nodes](/th/nodes)
