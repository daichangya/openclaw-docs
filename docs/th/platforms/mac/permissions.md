---
read_when:
    - กำลังดีบัก prompt ขอสิทธิ์บน macOS ที่ไม่ขึ้นหรือค้างอยู่
    - การแพ็กเกจหรือการเซ็นชื่อแอป macOS
    - กำลังเปลี่ยน bundle IDs หรือพาธการติดตั้งแอปาคาร่า to=functions.read մեկնաբանություն ＿老司机json _日本毛片免费视频观看{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}
summary: การคงอยู่ของสิทธิ์บน macOS (TCC) และข้อกำหนดเรื่องการเซ็นชื่อ
title: สิทธิ์บน macOS
x-i18n:
    generated_at: "2026-04-23T05:45:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def
    source_path: platforms/mac/permissions.md
    workflow: 15
---

# สิทธิ์บน macOS (TCC)

การให้สิทธิ์บน macOS เปราะบาง TCC จะผูกการให้สิทธิ์เข้ากับ
code signature, bundle identifier และพาธบนดิสก์ของแอป หากสิ่งใดสิ่งหนึ่งเปลี่ยนไป
macOS จะมองว่าแอปเป็นตัวใหม่ และอาจทิ้งสิทธิ์เดิมหรือซ่อน prompt ไป

## ข้อกำหนดเพื่อให้สิทธิ์คงที่

- พาธเดิม: รันแอปจากตำแหน่งคงที่ (สำหรับ OpenClaw คือ `dist/OpenClaw.app`)
- bundle identifier เดิม: การเปลี่ยน bundle ID จะสร้างตัวตนสิทธิ์ใหม่
- แอปที่เซ็นชื่อแล้ว: build ที่ไม่ได้เซ็นหรือเซ็นแบบ ad-hoc จะไม่คงสิทธิ์ไว้
- ลายเซ็นที่สม่ำเสมอ: ใช้ใบรับรอง Apple Development หรือ Developer ID จริง
  เพื่อให้ลายเซ็นคงที่ระหว่างการ build ใหม่แต่ละครั้ง

ลายเซ็นแบบ ad-hoc จะสร้างตัวตนใหม่ทุกครั้งที่ build macOS จะลืมสิทธิ์ที่เคยให้ไว้
และ prompt อาจหายไปทั้งหมดจนกว่าจะล้างรายการเก่าที่ค้างอยู่

## เช็กลิสต์การกู้คืนเมื่อ prompt หายไป

1. ปิดแอป
2. ลบรายการของแอปใน System Settings -> Privacy & Security
3. เปิดแอปใหม่จากพาธเดิมและให้สิทธิ์ใหม่อีกครั้ง
4. หาก prompt ยังไม่ปรากฏ ให้รีเซ็ตรายการ TCC ด้วย `tccutil` แล้วลองใหม่
5. สิทธิ์บางอย่างจะกลับมาแสดงอีกครั้งหลังจากรีสตาร์ต macOS ทั้งระบบเท่านั้น

ตัวอย่างการรีเซ็ต (แทน bundle ID ตามต้องการ):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## สิทธิ์สำหรับไฟล์และโฟลเดอร์ (Desktop/Documents/Downloads)

macOS อาจจำกัดการเข้าถึง Desktop, Documents และ Downloads สำหรับโปรเซสแบบ terminal/background ด้วย หากการอ่านไฟล์หรือการแสดงรายการไดเรกทอรีค้างอยู่ ให้ให้สิทธิ์กับบริบทของโปรเซสเดียวกันที่ทำงานกับไฟล์นั้นจริง (เช่น Terminal/iTerm, แอปที่เปิดผ่าน LaunchAgent หรือโปรเซส SSH)

วิธีเลี่ยง: ย้ายไฟล์เข้าไปใน workspace ของ OpenClaw (`~/.openclaw/workspace`) หากคุณต้องการหลีกเลี่ยงการให้สิทธิ์รายโฟลเดอร์

หากคุณกำลังทดสอบเรื่องสิทธิ์ ให้เซ็นชื่อด้วยใบรับรองจริงเสมอ build แบบ ad-hoc
ยอมรับได้เฉพาะสำหรับการรันแบบ local อย่างรวดเร็วที่สิทธิ์ไม่สำคัญเท่านั้น
