---
read_when:
    - คุณกำลังย้าย OpenClaw ไปยังแล็ปท็อป/เซิร์ฟเวอร์เครื่องใหม่
    - คุณต้องการเก็บเซสชัน auth และการล็อกอินของช่องทางต่าง ๆ (WhatsApp เป็นต้น) ไว้ครบถ้วน
summary: ย้าย (migrate) การติดตั้ง OpenClaw จากเครื่องหนึ่งไปยังอีกเครื่องหนึ่ง
title: คู่มือการย้ายระบบ
x-i18n:
    generated_at: "2026-04-24T09:18:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c14be563d1eb052726324678cf2784efffc2341aa17f662587fdabe1d8ec1e2
    source_path: install/migrating.md
    workflow: 15
---

# การย้าย OpenClaw ไปยังเครื่องใหม่

คู่มือนี้ใช้สำหรับย้าย OpenClaw gateway ไปยังเครื่องใหม่โดยไม่ต้องทำ onboarding ใหม่

## สิ่งที่จะถูกย้าย

เมื่อคุณคัดลอก **state directory** (`~/.openclaw/` เป็นค่าปริยาย) และ **workspace** ของคุณ คุณจะเก็บสิ่งต่อไปนี้ไว้ได้:

- **คอนฟิก** -- `openclaw.json` และการตั้งค่าของ gateway ทั้งหมด
- **Auth** -- `auth-profiles.json` รายเอเจนต์ (API key + OAuth) รวมถึงสถานะของช่องทาง/provider ใด ๆ ภายใต้ `credentials/`
- **เซสชัน** -- ประวัติการสนทนาและสถานะของเอเจนต์
- **สถานะของช่องทาง** -- การล็อกอิน WhatsApp, เซสชัน Telegram ฯลฯ
- **ไฟล์ใน workspace** -- `MEMORY.md`, `USER.md`, Skills และพรอมป์

<Tip>
รัน `openclaw status` บนเครื่องเก่าเพื่อยืนยันพาธของ state directory ของคุณ
โปรไฟล์แบบกำหนดเองจะใช้ `~/.openclaw-<profile>/` หรือพาธที่ตั้งผ่าน `OPENCLAW_STATE_DIR`
</Tip>

## ขั้นตอนการย้าย

<Steps>
  <Step title="หยุด gateway และสำรองข้อมูล">
    บนเครื่อง **เก่า** ให้หยุด gateway เพื่อไม่ให้ไฟล์เปลี่ยนระหว่างการคัดลอก จากนั้นจึง archive:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    หากคุณใช้หลายโปรไฟล์ (เช่น `~/.openclaw-work`) ให้ archive แต่ละรายการแยกกัน

  </Step>

  <Step title="ติดตั้ง OpenClaw บนเครื่องใหม่">
    [ติดตั้ง](/th/install) CLI (และ Node หากจำเป็น) บนเครื่องใหม่
    ไม่เป็นไรหาก onboarding สร้าง `~/.openclaw/` ใหม่ขึ้นมา -- คุณจะเขียนทับมันในขั้นตอนถัดไป
  </Step>

  <Step title="คัดลอก state directory และ workspace">
    โอน archive ผ่าน `scp`, `rsync -a` หรือ external drive จากนั้นแตกไฟล์:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    ตรวจสอบว่าได้รวม hidden directory มาด้วย และ ownership ของไฟล์ตรงกับผู้ใช้ที่จะใช้รัน gateway

  </Step>

  <Step title="รัน doctor และตรวจสอบ">
    บนเครื่องใหม่ ให้รัน [Doctor](/th/gateway/doctor) เพื่อใช้ config migration และซ่อมแซม service:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## ข้อผิดพลาดที่พบบ่อย

<AccordionGroup>
  <Accordion title="โปรไฟล์หรือ state-dir ไม่ตรงกัน">
    หาก gateway เครื่องเก่าใช้ `--profile` หรือ `OPENCLAW_STATE_DIR` แต่เครื่องใหม่ไม่ได้ใช้
    ช่องทางต่าง ๆ จะดูเหมือนถูกล็อกเอาต์ และเซสชันจะว่างเปล่า
    ให้เริ่ม gateway ด้วยโปรไฟล์หรือ state-dir **เดียวกัน** กับที่คุณย้ายมา แล้วรัน `openclaw doctor` ใหม่
  </Accordion>

  <Accordion title="คัดลอกเฉพาะ openclaw.json">
    ไฟล์คอนฟิกอย่างเดียวไม่เพียงพอ profile ของ model auth อยู่ภายใต้
    `agents/<agentId>/agent/auth-profiles.json` และสถานะของ channel/provider ก็ยัง
    อยู่ภายใต้ `credentials/` ดังนั้นควรย้าย **ทั้ง** state directory เสมอ
  </Accordion>

  <Accordion title="สิทธิ์และ ownership">
    หากคุณคัดลอกในฐานะ root หรือสลับผู้ใช้ gateway อาจอ่านข้อมูลรับรองไม่ได้
    ตรวจสอบให้แน่ใจว่า state directory และ workspace เป็นของผู้ใช้ที่รัน gateway
  </Accordion>

  <Accordion title="โหมด remote">
    หาก UI ของคุณชี้ไปยัง gateway แบบ **remote** โฮสต์ระยะไกลจะเป็นเจ้าของเซสชันและ workspace
    ให้ย้ายตัวโฮสต์ของ gateway เอง ไม่ใช่แล็ปท็อปในเครื่องของคุณ ดู [FAQ](/th/help/faq#where-things-live-on-disk)
  </Accordion>

  <Accordion title="Secrets ในไฟล์สำรอง">
    state directory มี auth profile, ข้อมูลรับรองของช่องทาง และสถานะ
    ของ provider อื่น ๆ
    ควรเก็บไฟล์สำรองแบบเข้ารหัส หลีกเลี่ยงช่องทางการโอนที่ไม่ปลอดภัย และหมุนคีย์หากคุณสงสัยว่ามีการเปิดเผยข้อมูล
  </Accordion>
</AccordionGroup>

## เช็กลิสต์การตรวจสอบ

บนเครื่องใหม่ ให้ยืนยันว่า:

- [ ] `openclaw status` แสดงว่า gateway กำลังทำงาน
- [ ] ช่องทางต่าง ๆ ยังเชื่อมต่ออยู่ (ไม่ต้องจับคู่ใหม่)
- [ ] แดชบอร์ดเปิดได้และแสดงเซสชันเดิม
- [ ] ไฟล์ใน workspace (memory, config) ยังอยู่ครบ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [การย้าย Matrix](/th/install/migrating-matrix)
- [ถอนการติดตั้ง](/th/install/uninstall)
