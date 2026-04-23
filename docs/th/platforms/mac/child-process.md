---
read_when:
    - การเชื่อมแอป Mac เข้ากับวงจรชีวิตของ Gateway
summary: วงจรชีวิตของ Gateway บน macOS (launchd)
title: วงจรชีวิตของ Gateway
x-i18n:
    generated_at: "2026-04-23T05:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# วงจรชีวิตของ Gateway บน macOS

โดยค่าเริ่มต้น แอป macOS **จัดการ Gateway ผ่าน launchd** และจะไม่ spawn
Gateway เป็น child process ก่อนอื่นมันจะพยายาม attach กับ Gateway ที่กำลังรันอยู่แล้วบนพอร์ตที่ตั้งค่าไว้; หากเข้าถึงไม่ได้ มันจะเปิดใช้ launchd
service ผ่าน CLI ภายนอก `openclaw` (ไม่มี embedded runtime) สิ่งนี้ทำให้คุณได้
การเริ่มอัตโนมัติที่เชื่อถือได้เมื่อเข้าสู่ระบบ และการรีสตาร์ตเมื่อแครช

โหมด child-process (ที่ Gateway ถูก spawn โดยตรงจากแอป) **ไม่ได้ใช้งานอยู่** ในตอนนี้
หากคุณต้องการการเชื่อมโยงกับ UI ที่แน่นแฟ้นกว่า ให้รัน Gateway ด้วยตนเองในเทอร์มินัล

## พฤติกรรมค่าเริ่มต้น (launchd)

- แอปจะติดตั้ง LaunchAgent แบบต่อผู้ใช้ชื่อ `ai.openclaw.gateway`
  (หรือ `ai.openclaw.<profile>` เมื่อใช้ `--profile`/`OPENCLAW_PROFILE`; ระบบยังรองรับ `com.openclaw.*` แบบเดิม)
- เมื่อเปิดใช้โหมด Local แอปจะตรวจสอบให้แน่ใจว่า LaunchAgent ถูกโหลดแล้ว และ
  เริ่ม Gateway หากจำเป็น
- logs จะถูกเขียนไปยังพาธล็อกของ launchd gateway (ดูได้ใน Debug Settings)

คำสั่งที่ใช้บ่อย:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

ให้แทนที่ label ด้วย `ai.openclaw.<profile>` เมื่อรัน named profile

## Unsigned dev builds

`scripts/restart-mac.sh --no-sign` มีไว้สำหรับ build ในเครื่องแบบรวดเร็วเมื่อคุณไม่มี
signing keys เพื่อป้องกันไม่ให้ launchd ชี้ไปยัง relay binary ที่ไม่ได้เซ็น มันจะ:

- เขียน `~/.openclaw/disable-launchagent`

การรัน `scripts/restart-mac.sh` แบบ signed จะล้าง override นี้ หากมี marker อยู่
หากต้องการรีเซ็ตด้วยตนเอง:

```bash
rm ~/.openclaw/disable-launchagent
```

## โหมด attach-only

หากต้องการบังคับให้แอป macOS **ไม่ติดตั้งหรือจัดการ launchd เลย** ให้เปิดแอปด้วย
`--attach-only` (หรือ `--no-launchd`) สิ่งนี้จะตั้งค่า `~/.openclaw/disable-launchagent`
ดังนั้นแอปจะเพียง attach ไปยัง Gateway ที่กำลังรันอยู่แล้วเท่านั้น คุณสามารถสลับพฤติกรรมเดียวกันนี้ได้ใน Debug Settings

## โหมด Remote

โหมด Remote จะไม่เริ่ม local Gateway แอปจะใช้ SSH tunnel ไปยัง
remote host และเชื่อมต่อผ่าน tunnel นั้น

## ทำไมเราจึงเลือก launchd

- เริ่มอัตโนมัติเมื่อเข้าสู่ระบบ
- มี semantics สำหรับ restart/KeepAlive ในตัว
- logs และการกำกับดูแลที่คาดการณ์ได้

หากในอนาคตจำเป็นต้องมีโหมด child-process จริงๆ อีกครั้ง ก็ควรถูกบันทึกไว้เป็น
โหมดแยกต่างหากที่ชัดเจนและใช้เพื่อการพัฒนาเท่านั้น
