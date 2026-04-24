---
read_when:
    - การผสานรวมแอป mac กับวงจรชีวิตของ gateway
summary: วงจรชีวิตของ Gateway บน macOS (launchd)
title: วงจรชีวิตของ Gateway
x-i18n:
    generated_at: "2026-04-24T09:21:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# วงจรชีวิตของ Gateway บน macOS

แอป macOS **จัดการ Gateway ผ่าน launchd** เป็นค่าเริ่มต้น และจะไม่ spawn
Gateway เป็น child process แอปจะพยายามเชื่อมต่อกับ Gateway ที่กำลังรันอยู่แล้ว
บนพอร์ตที่กำหนดค่าไว้ก่อน; หากเข้าถึงไม่ได้ แอปจะเปิดใช้ launchd
service ผ่าน CLI ภายนอก `openclaw` (ไม่มี embedded runtime) วิธีนี้ทำให้คุณได้
การ auto-start ตอนล็อกอินและการรีสตาร์ตเมื่อเกิด crash ที่เชื่อถือได้

โหมด child-process (ให้แอป spawn Gateway โดยตรง) **ไม่ได้ถูกใช้งาน** ในปัจจุบัน
หากคุณต้องการการผูกกับ UI ที่แน่นกว่านี้ ให้รัน Gateway ด้วยตนเองในเทอร์มินัล

## พฤติกรรมเริ่มต้น (launchd)

- แอปจะติดตั้ง LaunchAgent แบบต่อผู้ใช้โดยใช้ label `ai.openclaw.gateway`
  (หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; รองรับ legacy `com.openclaw.*`)
- เมื่อเปิดใช้โหมด Local แอปจะตรวจสอบให้แน่ใจว่า LaunchAgent ถูกโหลดแล้ว และ
  จะเริ่ม Gateway หากจำเป็น
- logs จะถูกเขียนไปยังพาธ log ของ launchd gateway (มองเห็นได้ใน Debug Settings)

คำสั่งทั่วไป:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

แทนที่ label ด้วย `ai.openclaw.<profile>` เมื่อรัน named profile

## บิลด์พัฒนาแบบ unsigned

`scripts/restart-mac.sh --no-sign` มีไว้สำหรับบิลด์ภายในเครื่องอย่างรวดเร็วเมื่อคุณไม่มี
signing keys เพื่อป้องกันไม่ให้ launchd ชี้ไปยัง relay binary ที่ unsigned มันจะ:

- เขียน `~/.openclaw/disable-launchagent`

การรัน `scripts/restart-mac.sh` แบบ signed จะล้าง override นี้หากมี marker
อยู่ หากต้องการรีเซ็ตด้วยตนเอง:

```bash
rm ~/.openclaw/disable-launchagent
```

## โหมด Attach-only

หากต้องการบังคับให้แอป macOS **ไม่ติดตั้งหรือจัดการ launchd** ให้เปิดแอปด้วย
`--attach-only` (หรือ `--no-launchd`) ซึ่งจะตั้งค่า `~/.openclaw/disable-launchagent`
เพื่อให้แอปเชื่อมต่อกับ Gateway ที่กำลังรันอยู่แล้วเท่านั้น คุณสามารถสลับพฤติกรรมเดียวกันนี้
ได้ใน Debug Settings

## Remote mode

Remote mode จะไม่เริ่ม local Gateway แอปจะใช้ SSH tunnel ไปยัง
โฮสต์ระยะไกลและเชื่อมต่อผ่าน tunnel นั้น

## เหตุผลที่เราเลือก launchd

- เริ่มอัตโนมัติเมื่อเข้าสู่ระบบ
- มี semantics ของ restart/KeepAlive ในตัว
- logs และการกำกับดูแลคาดเดาได้

หากวันหนึ่งจำเป็นต้องมีโหมด child-process จริงอีกครั้ง ก็ควรถูกบันทึกไว้เป็น
โหมดแยกต่างหากที่ชัดเจนและใช้สำหรับ dev เท่านั้น

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
