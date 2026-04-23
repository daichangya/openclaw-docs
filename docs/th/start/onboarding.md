---
read_when:
    - กำลังออกแบบตัวช่วย onboarding บน macOS
    - กำลัง implement การตั้งค่า auth หรือ identity
sidebarTitle: 'Onboarding: macOS App'
summary: ขั้นตอนการตั้งค่าครั้งแรกสำหรับ OpenClaw (แอป macOS)
title: Onboarding (แอป macOS)
x-i18n:
    generated_at: "2026-04-23T05:57:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c5f313a8e5c3a2e68a9488f07c40fcdf75b170dc868c7614565ad9f67755d6
    source_path: start/onboarding.md
    workflow: 15
---

# Onboarding (แอป macOS)

เอกสารนี้อธิบายขั้นตอนการตั้งค่าครั้งแรกแบบ **ปัจจุบัน** เป้าหมายคือ
ประสบการณ์ “วันแรก” ที่ลื่นไหล: เลือกตำแหน่งที่ Gateway จะรัน เชื่อมต่อ auth รัน
wizard แล้วปล่อยให้เอเจนต์ bootstrap ตัวเอง
สำหรับภาพรวมทั่วไปของเส้นทาง onboarding ดู [ภาพรวม Onboarding](/th/start/onboarding-overview)

<Steps>
<Step title="อนุมัติคำเตือนของ macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="อนุมัติการค้นหาเครือข่ายในเครื่อง">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="หน้าต้อนรับและประกาศด้านความปลอดภัย">
<Frame caption="อ่านประกาศด้านความปลอดภัยที่แสดงแล้วตัดสินใจตามนั้น">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

โมเดลความเชื่อถือด้านความปลอดภัย:

- โดยค่าเริ่มต้น OpenClaw เป็นเอเจนต์ส่วนบุคคล: มีขอบเขต operator ที่เชื่อถือได้เพียงหนึ่งเดียว
- การตั้งค่าแบบใช้ร่วมกัน/หลายผู้ใช้ต้องล็อกให้แน่น (แยกขอบเขตความเชื่อถือ ลดการเข้าถึงเครื่องมือให้เหลือน้อยที่สุด และปฏิบัติตาม [Security](/th/gateway/security))
- การทำ onboarding แบบ local ตอนนี้จะตั้งค่า configs ใหม่ให้ใช้ `tools.profile: "coding"` โดยค่าเริ่มต้น เพื่อให้การตั้งค่า local แบบใหม่ยังคงมีเครื่องมือ filesystem/runtime โดยไม่ต้องบังคับใช้โปรไฟล์ `full` ที่ไม่จำกัด
- หากมีการเปิดใช้ hooks/webhooks หรือแหล่งป้อนเนื้อหาที่ไม่น่าเชื่อถืออื่นๆ ให้ใช้โมเดลระดับสูงที่แข็งแรงและรักษา tool policy/sandboxing แบบเข้มงวดไว้

</Step>
<Step title="Local เทียบกับ Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** รันที่ไหน?

- **Mac เครื่องนี้ (Local only):** onboarding สามารถกำหนดค่า auth และเขียน credentials
  ลงในเครื่องได้
- **Remote (ผ่าน SSH/Tailnet):** onboarding จะ **ไม่** กำหนดค่า auth ในเครื่อง;
  credentials ต้องมีอยู่บนโฮสต์ของ gateway
- **กำหนดค่าทีหลัง:** ข้ามการตั้งค่าและปล่อยให้แอปยังไม่ถูกกำหนดค่า

<Tip>
**เคล็ดลับเรื่อง Gateway auth:**

- ตอนนี้ wizard จะสร้าง **token** แม้แต่สำหรับ loopback ดังนั้น WS clients แบบ local ก็ต้องยืนยันตัวตน
- หากคุณปิด auth โปรเซสใดๆ ในเครื่องก็สามารถเชื่อมต่อได้; ใช้สิ่งนี้เฉพาะบนเครื่องที่เชื่อถือได้ทั้งหมดเท่านั้น
- ใช้ **token** สำหรับการเข้าถึงหลายเครื่องหรือการ bind แบบ non-loopback

</Tip>
</Step>
<Step title="Permissions">
<Frame caption="เลือกว่าคุณต้องการให้สิทธิ์อะไรกับ OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

Onboarding จะขอ TCC permissions ที่จำเป็นสำหรับ:

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>ขั้นตอนนี้เป็นตัวเลือก</Info>
  แอปสามารถติดตั้ง CLI แบบ global ของ `openclaw` ผ่าน npm, pnpm หรือ bun ได้
  โดยจะเลือก npm ก่อน จากนั้น pnpm แล้วจึง bun หากตรวจพบเพียง package manager ตัวนั้น
  สำหรับ Gateway runtime, Node ยังคงเป็นเส้นทางที่แนะนำ
</Step>
<Step title="Onboarding Chat (เซสชันเฉพาะ)">
  หลังการตั้งค่า แอปจะเปิดเซสชันแชต onboarding โดยเฉพาะ เพื่อให้เอเจนต์สามารถ
  แนะนำตัวเองและบอกขั้นตอนถัดไปได้ สิ่งนี้ช่วยแยกคำแนะนำสำหรับการเริ่มต้นใช้งานครั้งแรก
  ออกจากการสนทนาปกติของคุณ ดู [Bootstrapping](/th/start/bootstrapping) สำหรับ
  สิ่งที่จะเกิดขึ้นบนโฮสต์ของ gateway ระหว่างการรันเอเจนต์ครั้งแรก
</Step>
</Steps>
