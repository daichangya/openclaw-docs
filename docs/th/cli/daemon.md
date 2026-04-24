---
read_when:
    - คุณยังคงใช้ `openclaw daemon ...` ในสคริปต์
    - คุณต้องใช้คำสั่งวงจรชีวิตของบริการ (install/start/stop/restart/status)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw daemon` (ชื่อเรียกแทนแบบเดิมสำหรับการจัดการบริการ gateway)
title: ดีมอน
x-i18n:
    generated_at: "2026-04-24T09:02:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

ชื่อเรียกแทนแบบเดิมสำหรับคำสั่งจัดการบริการ Gateway

`openclaw daemon ...` จะถูกแมปไปยังพื้นผิวการควบคุมบริการเดียวกันกับคำสั่งบริการ `openclaw gateway ...`

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

- `status`: แสดงสถานะการติดตั้งบริการและ probe สุขภาพของ Gateway
- `install`: ติดตั้งบริการ (`launchd`/`systemd`/`schtasks`)
- `uninstall`: ลบบริการ
- `start`: เริ่มบริการ
- `stop`: หยุดบริการ
- `restart`: เริ่มบริการใหม่

## ตัวเลือกที่ใช้บ่อย

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- วงจรชีวิต (`uninstall|start|stop|restart`): `--json`

หมายเหตุ:

- `status` จะ resolve SecretRef สำหรับ auth ที่กำหนดค่าไว้เพื่อใช้กับการยืนยันตัวตนของ probe เมื่อทำได้
- หาก SecretRef สำหรับ auth ที่จำเป็นยัง resolve ไม่ได้ในเส้นทางคำสั่งนี้ `daemon status --json` จะรายงาน `rpc.authWarning` เมื่อการเชื่อมต่อ/auth ของ probe ล้มเหลว; ให้ส่ง `--token`/`--password` โดยตรงหรือ resolve แหล่งที่มาของ secret ก่อน
- หาก probe สำเร็จ คำเตือนเกี่ยวกับ auth-ref ที่ยัง resolve ไม่ได้จะถูกระงับเพื่อหลีกเลี่ยง false positive
- `status --deep` จะเพิ่มการสแกนบริการระดับระบบแบบ best-effort เมื่อพบบริการลักษณะคล้าย gateway อื่น ๆ เอาต์พุตสำหรับมนุษย์จะพิมพ์คำแนะนำการ cleanup และเตือนว่าการมี gateway หนึ่งตัวต่อเครื่องยังคงเป็นคำแนะนำตามปกติ
- สำหรับการติดตั้ง Linux systemd การตรวจสอบ token-drift ของ `status` จะรวมทั้งแหล่ง unit `Environment=` และ `EnvironmentFile=`
- การตรวจสอบ drift จะ resolve SecretRef ของ `gateway.auth.token` โดยใช้ environment ของรันไทม์ที่รวมแล้ว (environment ของคำสั่งบริการก่อน จากนั้น fallback ไปยัง environment ของโปรเซส)
- หาก token auth ไม่ได้เปิดใช้งานอย่างมีผลจริง (มี `gateway.auth.mode` แบบชัดเจนเป็น `password`/`none`/`trusted-proxy` หรือไม่ได้ตั้งค่า mode ซึ่ง password อาจชนะได้และไม่มี candidate ของ token ที่ชนะได้) การตรวจสอบ token-drift จะข้ามการ resolve token จาก config
- หาก token auth ต้องใช้ token และ `gateway.auth.token` ถูกจัดการด้วย SecretRef คำสั่ง `install` จะตรวจสอบว่า SecretRef นั้น resolve ได้ แต่จะไม่คง token ที่ resolve แล้วไว้ในเมทาดาทา environment ของบริการ
- หาก token auth ต้องใช้ token และ SecretRef ของ token ที่กำหนดค่าไว้ยัง resolve ไม่ได้ การติดตั้งจะล้มเหลวแบบ fail-closed
- หากกำหนดค่าทั้ง `gateway.auth.token` และ `gateway.auth.password` และไม่ได้ตั้งค่า `gateway.auth.mode` ไว้ การติดตั้งจะถูกบล็อกจนกว่าจะตั้งค่า mode อย่างชัดเจน
- หากคุณตั้งใจรันหลาย gateway บนโฮสต์เดียว ให้แยกพอร์ต, config/state และ workspace; ดู [/gateway#multiple-gateways-same-host](/th/gateway#multiple-gateways-same-host)

## ควรใช้

ใช้ [`openclaw gateway`](/th/cli/gateway) สำหรับเอกสารและตัวอย่างปัจจุบัน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [คู่มือปฏิบัติงาน Gateway](/th/gateway)
