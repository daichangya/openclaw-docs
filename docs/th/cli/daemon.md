---
read_when:
    - คุณยังคงใช้ `openclaw daemon ...` ในสคริปต์อยู่
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw daemon` (ชื่อเรียกแทนแบบดั้งเดิมสำหรับการจัดการบริการ Gateway)
title: ดีมอน
x-i18n:
    generated_at: "2026-04-23T06:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

ชื่อเรียกแทนแบบดั้งเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` จะจับคู่ไปยังพื้นผิวการควบคุมบริการเดียวกันกับคำสั่งบริการ `openclaw gateway ...`

## การใช้งาน

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## คำสั่งย่อย

- `status`: แสดงสถานะการติดตั้งบริการและตรวจสอบสถานะสุขภาพของ Gateway
- `install`: ติดตั้งบริการ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: ลบบริการ
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: เริ่มบริการใหม่

## ตัวเลือกทั่วไป

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- วงจรชีวิต (`uninstall|start|stop|restart`): `--json`

หมายเหตุ:

- `status` จะ resolve auth SecretRefs ที่ตั้งค่าไว้สำหรับการยืนยันตัวตนของ probe เมื่อทำได้
- หาก SecretRef สำหรับการยืนยันตัวตนที่จำเป็นยังไม่ถูก resolve ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อ probe เชื่อมต่อไม่ได้หรือการยืนยันตัวตนล้มเหลว ให้ส่ง `--token`/`--password` โดยตรงหรือ resolve แหล่งที่มาของ secret ก่อน
- หาก probe สำเร็จ คำเตือน unresolved auth-ref จะถูกระงับเพื่อหลีกเลี่ยง false positives
- `status --deep` จะเพิ่มการสแกนบริการระดับระบบแบบ best-effort เมื่อพบบริการอื่นที่คล้าย gateway เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำในการ cleanup และเตือนว่าการมี gateway หนึ่งตัวต่อเครื่องยังคงเป็นคำแนะนำตามปกติ
- ในการติดตั้ง Linux systemd การตรวจสอบ token drift ของ `status` จะรวมทั้งแหล่ง unit แบบ `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะ resolve SecretRefs ของ `gateway.auth.token` โดยใช้ merged runtime env (env ของคำสั่งบริการก่อน แล้วจึง fallback ไปยัง process env)
- หาก token auth ไม่ได้เปิดใช้งานอย่างมีผลจริง (มีการตั้งค่า `gateway.auth.mode` เป็น `password`/`none`/`trusted-proxy` อย่างชัดเจน หรือไม่ได้ตั้งค่า mode ไว้ในกรณีที่ password อาจมีผล และไม่มี token candidate ที่ใช้ได้) การตรวจสอบ token drift จะข้ามการ resolve token จาก config
- เมื่อ token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef, `install` จะตรวจสอบว่า SecretRef สามารถ resolve ได้ แต่จะไม่บันทึก token ที่ resolve แล้วลงใน metadata ของ environment ของบริการ
- หาก token auth ต้องใช้ token และ token SecretRef ที่ตั้งค่าไว้ยังไม่สามารถ resolve ได้ การติดตั้งจะล้มเหลวแบบ fail closed
- หากมีการตั้งค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` ไว้ `install` จะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- หากคุณตั้งใจรันหลาย gateway บนโฮสต์เดียวกัน ให้แยกพอร์ต, config/state และ workspaces ออกจากกัน ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

## ควรใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน
