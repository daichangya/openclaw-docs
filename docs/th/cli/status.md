---
read_when:
    - คุณต้องการการวินิจฉัยอย่างรวดเร็วเกี่ยวกับสุขภาพของ channel + ผู้รับของเซสชันล่าสุด
    - คุณต้องการสถานะ “all” ที่นำไปวางต่อได้สำหรับการแก้จุดบกพร่อง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw status` (การวินิจฉัย, probes, snapshots การใช้งาน)
title: สถานะ
x-i18n:
    generated_at: "2026-04-24T09:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

การวินิจฉัยสำหรับ channels + sessions

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

หมายเหตุ:

- `--deep` จะรัน live probes (WhatsApp Web + Telegram + Discord + Slack + Signal)
- `--usage` จะแสดงหน้าต่างการใช้งานของ provider ที่ทำให้เป็นมาตรฐานแล้วในรูปแบบ `X% left`
- เอาต์พุตสถานะเซสชันตอนนี้แยก `Runtime:` ออกจาก `Runner:` แล้ว `Runtime` คือเส้นทางการทำงานและสถานะ sandbox (`direct`, `docker/*`) ส่วน `Runner` บอกคุณว่าเซสชันกำลังใช้ Pi แบบฝังตัว, provider ที่อิง CLI หรือ backend ของ ACP harness เช่น `codex (acp/acpx)`
- ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax เป็นโควตาที่เหลืออยู่ ดังนั้น OpenClaw จะกลับค่าเหล่านี้ก่อนแสดงผล; ฟิลด์แบบนับจำนวนจะมีความสำคัญกว่าเมื่อมีอยู่ การตอบกลับ `model_remains` จะเลือก entry ของ chat-model เป็นหลัก, สร้างป้ายหน้าต่างจาก timestamps เมื่อจำเป็น และรวมชื่อ model ไว้ในป้ายแผน
- เมื่อ snapshot ของเซสชันปัจจุบันมีข้อมูลน้อย `/status` สามารถเติมตัวนับ token และแคชจาก usage log ของ transcript ล่าสุดได้ ค่าที่ไม่เป็นศูนย์จากสถานะสดที่มีอยู่จะยังมีความสำคัญกว่าค่าจาก transcript fallback
- transcript fallback ยังสามารถกู้คืนป้าย model runtime ที่กำลังใช้งานอยู่ได้ด้วย เมื่อไม่มีอยู่ใน entry ของเซสชันสด หาก model จาก transcript นั้นต่างจาก model ที่เลือกไว้ status จะ resolve context window เทียบกับ model runtime ที่กู้คืนได้ แทน model ที่เลือก
- สำหรับการคำนวณขนาด prompt transcript fallback จะเลือกค่ารวมที่เกี่ยวกับ prompt ซึ่งมีขนาดใหญ่กว่า เมื่อ metadata ของเซสชันไม่มีหรือมีค่าน้อยกว่า เพื่อไม่ให้เซสชัน custom-provider แสดง token เป็น `0`
- เอาต์พุตมี session stores แยกตามเอเจนต์เมื่อมีการกำหนดค่าหลายเอเจนต์
- ภาพรวมมีสถานะการติดตั้ง/การทำงานของบริการ Gateway + โฮสต์ node เมื่อมี
- ภาพรวมมี update channel + git SHA (สำหรับ source checkouts)
- ข้อมูลการอัปเดตจะแสดงในภาพรวม; หากมีการอัปเดต status จะแสดงคำแนะนำให้รัน `openclaw update` (ดู [Updating](/th/install/updating))
- พื้นผิวสถานะแบบอ่านอย่างเดียว (`status`, `status --json`, `status --all`) จะ resolve SecretRefs ที่รองรับสำหรับ targeted config paths เมื่อทำได้
- หากมีการกำหนดค่า SecretRef ของ channel ที่รองรับไว้ แต่ไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน status จะยังคงเป็นแบบอ่านอย่างเดียวและรายงานเอาต์พุตแบบ degraded แทนที่จะล้มเหลว เอาต์พุตสำหรับมนุษย์จะแสดงคำเตือน เช่น “configured token unavailable in this command path” และเอาต์พุต JSON จะรวม `secretDiagnostics`
- เมื่อการ resolve SecretRef ในระดับคำสั่งสำเร็จ status จะเลือกใช้ snapshot ที่ resolve แล้ว และล้างตัวทำเครื่องหมาย channel “secret unavailable” แบบชั่วคราวออกจากเอาต์พุตสุดท้าย
- `status --all` มีแถวภาพรวม Secrets และส่วนการวินิจฉัยที่สรุป secret diagnostics (ตัดทอนเพื่อให้อ่านง่าย) โดยไม่หยุดการสร้างรายงาน

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Doctor](/th/gateway/doctor)
