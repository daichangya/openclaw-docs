---
read_when:
    - คุณกำลังอนุมัติคำขอจับคู่อุปกรณ์
    - คุณต้องหมุนเวียนหรือเพิกถอนโทเค็นอุปกรณ์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw devices` (การจับคู่อุปกรณ์ + การหมุนเวียน/เพิกถอนโทเค็น)
title: devices
x-i18n:
    generated_at: "2026-04-23T06:17:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

จัดการคำขอจับคู่อุปกรณ์และโทเค็นที่มีขอบเขตระดับอุปกรณ์

## คำสั่ง

### `openclaw devices list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการและอุปกรณ์ที่จับคู่แล้ว

```
openclaw devices list
openclaw devices list --json
```

ผลลัพธ์ของคำขอที่รอดำเนินการจะแสดงสิทธิ์การเข้าถึงที่ร้องขอถัดจากสิทธิ์การเข้าถึงปัจจุบันที่อนุมัติแล้วของอุปกรณ์ เมื่ออุปกรณ์นั้นถูกจับคู่อยู่แล้ว ซึ่งทำให้การอัปเกรด scope/role ชัดเจน แทนที่จะดูเหมือนว่าการจับคู่หายไป

### `openclaw devices remove <deviceId>`

ลบรายการอุปกรณ์ที่จับคู่แล้วหนึ่งรายการ

เมื่อคุณยืนยันตัวตนด้วยโทเค็นอุปกรณ์ที่จับคู่แล้ว ผู้เรียกที่ไม่ใช่แอดมินจะลบได้เฉพาะรายการอุปกรณ์ของ **ตนเอง** เท่านั้น การลบอุปกรณ์อื่นต้องใช้ `operator.admin`

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

อนุมัติคำขอจับคู่อุปกรณ์ที่รอดำเนินการด้วย `requestId` ที่ตรงกันแบบเป๊ะ หากละเว้น `requestId` หรือส่ง `--latest`, OpenClaw จะพิมพ์เฉพาะคำขอที่รอดำเนินการซึ่งถูกเลือกแล้วออกมาและออกจากโปรแกรม; ให้รันคำสั่งอนุมัติอีกครั้งด้วย request ID ที่ถูกต้องหลังจากตรวจสอบรายละเอียดแล้ว

หมายเหตุ: หากอุปกรณ์ลองจับคู่อีกครั้งโดยมีรายละเอียดการยืนยันตัวตนที่เปลี่ยนไป (role/scopes/public key), OpenClaw จะใช้รายการที่รอดำเนินการใหม่แทนรายการก่อนหน้าและออก `requestId` ใหม่ ให้รัน `openclaw devices list` ทันทีก่อนอนุมัติเพื่อใช้ ID ปัจจุบัน

หากอุปกรณ์ถูกจับคู่อยู่แล้วและขอ scopes ที่กว้างขึ้นหรือ role ที่กว้างขึ้น OpenClaw จะคงการอนุมัติเดิมไว้และสร้างคำขออัปเกรดที่รอดำเนินการใหม่ ให้ตรวจสอบคอลัมน์ `Requested` เทียบกับ `Approved` ใน `openclaw devices list` หรือใช้ `openclaw devices approve --latest` เพื่อดูตัวอย่างการอัปเกรดที่แน่นอนก่อนอนุมัติ

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

หมุนเวียนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ (พร้อมอัปเดต scopes ได้หากต้องการ)
role เป้าหมายต้องมีอยู่แล้วในสัญญาการจับคู่ที่อนุมัติของอุปกรณ์นั้น; การหมุนเวียนไม่สามารถสร้าง role ใหม่ที่ยังไม่ได้รับการอนุมัติได้
หากคุณละเว้น `--scope`, การเชื่อมต่อใหม่ภายหลังด้วยโทเค็นที่หมุนเวียนและจัดเก็บไว้นั้นจะใช้ scopes ที่อนุมัติแล้วที่แคชไว้ของโทเค็นนั้นซ้ำ หากคุณส่งค่า `--scope` แบบชัดเจน ค่าเหล่านั้นจะกลายเป็นชุด scope ที่จัดเก็บไว้สำหรับการเชื่อมต่อใหม่ด้วยโทเค็นที่แคชไว้ในอนาคต
ผู้เรียกจาก paired-device ที่ไม่ใช่แอดมินสามารถหมุนเวียนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
นอกจากนี้ ค่า `--scope` แบบชัดเจนใดๆ ต้องอยู่ภายใน operator scopes ของเซสชันผู้เรียกเองด้วย; การหมุนเวียนไม่สามารถสร้างโทเค็น operator ที่กว้างกว่าที่ผู้เรียกมีอยู่แล้วได้

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

ส่งคืน payload ของโทเค็นใหม่ในรูปแบบ JSON

### `openclaw devices revoke --device <id> --role <role>`

เพิกถอนโทเค็นอุปกรณ์สำหรับ role ที่ระบุ

ผู้เรียกจาก paired-device ที่ไม่ใช่แอดมินสามารถเพิกถอนได้เฉพาะโทเค็นอุปกรณ์ของ **ตนเอง** เท่านั้น
การเพิกถอนโทเค็นของอุปกรณ์อื่นต้องใช้ `operator.admin`

```
openclaw devices revoke --device <deviceId> --role node
```

ส่งคืนผลลัพธ์การเพิกถอนในรูปแบบ JSON

## ตัวเลือกที่ใช้ร่วมกัน

- `--url <url>`: URL ของ Gateway WebSocket (ค่าเริ่มต้นคือ `gateway.remote.url` เมื่อตั้งค่าไว้)
- `--token <token>`: โทเค็น Gateway (หากจำเป็น)
- `--password <password>`: รหัสผ่าน Gateway (การยืนยันตัวตนด้วยรหัสผ่าน)
- `--timeout <ms>`: หมดเวลา RPC
- `--json`: เอาต์พุต JSON (แนะนำสำหรับการทำสคริปต์)

หมายเหตุ: เมื่อคุณตั้งค่า `--url`, CLI จะไม่ย้อนกลับไปใช้ข้อมูลรับรองจาก config หรือ environment
ให้ส่ง `--token` หรือ `--password` อย่างชัดเจน การไม่มีข้อมูลรับรองที่ระบุอย่างชัดเจนถือเป็นข้อผิดพลาด

## หมายเหตุ

- การหมุนเวียนโทเค็นจะส่งคืนโทเค็นใหม่ (เป็นข้อมูลสำคัญ) ให้ปฏิบัติต่อมันเสมือนเป็นความลับ
- คำสั่งเหล่านี้ต้องใช้ scope `operator.pairing` (หรือ `operator.admin`)
- การหมุนเวียนโทเค็นจะอยู่ภายในชุด role ที่ได้รับอนุมัติจากการจับคู่และค่าพื้นฐาน scope ที่ได้รับอนุมัติสำหรับอุปกรณ์นั้น รายการโทเค็นที่แคชไว้ที่หลงเหลืออยู่จะไม่ให้สิทธิ์เป้าหมายการหมุนเวียนใหม่
- สำหรับเซสชันโทเค็นของ paired-device การจัดการข้ามอุปกรณ์เป็นแอดมินเท่านั้น: `remove`, `rotate`, และ `revoke` ใช้ได้กับตัวเองเท่านั้น เว้นแต่ผู้เรียกจะมี `operator.admin`
- `devices clear` ถูกป้องกันไว้โดยเจตนาด้วย `--yes`
- หาก scope การจับคู่ไม่พร้อมใช้งานบน local loopback (และไม่มีการส่ง `--url` แบบชัดเจน), list/approve สามารถใช้ fallback การจับคู่แบบ local ได้
- `devices approve` ต้องใช้ request ID แบบชัดเจนก่อนสร้างโทเค็น; การละเว้น `requestId` หรือส่ง `--latest` จะเป็นเพียงการแสดงตัวอย่างคำขอที่รอดำเนินการล่าสุดเท่านั้น

## เช็กลิสต์การกู้คืนเมื่อโทเค็นไม่ตรงกัน

ใช้ส่วนนี้เมื่อ Control UI หรือไคลเอนต์อื่นๆ ยังคงล้มเหลวด้วย `AUTH_TOKEN_MISMATCH` หรือ `AUTH_DEVICE_TOKEN_MISMATCH`

1. ยืนยันแหล่งที่มาของโทเค็น gateway ปัจจุบัน:

```bash
openclaw config get gateway.auth.token
```

2. แสดงรายการอุปกรณ์ที่จับคู่แล้วและระบุ device id ที่ได้รับผลกระทบ:

```bash
openclaw devices list
```

3. หมุนเวียนโทเค็น operator สำหรับอุปกรณ์ที่ได้รับผลกระทบ:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. หากการหมุนเวียนยังไม่เพียงพอ ให้ลบการจับคู่เก่าที่ค้างอยู่แล้วอนุมัติอีกครั้ง:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. ลองเชื่อมต่อไคลเอนต์อีกครั้งด้วย shared token/password ปัจจุบัน

หมายเหตุ:

- ลำดับความสำคัญของการยืนยันตัวตนในการเชื่อมต่อใหม่ตามปกติคือ shared token/password ที่ระบุอย่างชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุอย่างชัดเจน จากนั้นโทเค็นอุปกรณ์ที่จัดเก็บไว้ แล้วจึงเป็น bootstrap token
- การกู้คืน `AUTH_TOKEN_MISMATCH` ที่เชื่อถือได้สามารถส่งทั้ง shared token และโทเค็นอุปกรณ์ที่จัดเก็บไว้พร้อมกันได้ชั่วคราวสำหรับการลองใหม่แบบมีขอบเขตเพียงครั้งเดียว

ที่เกี่ยวข้อง:

- [การแก้ปัญหาการยืนยันตัวตนของแดชบอร์ด](/th/web/dashboard#if-you-see-unauthorized-1008)
- [การแก้ปัญหา Gateway](/th/gateway/troubleshooting#dashboard-control-ui-connectivity)
