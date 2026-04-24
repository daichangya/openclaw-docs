---
read_when:
    - การเก็บ macOS logs หรือการตรวจสอบการบันทึกข้อมูลส่วนตัว
    - การดีบักปัญหา voice wake/วงจรชีวิตของเซสชัน
summary: 'การบันทึกของ OpenClaw: rolling diagnostics file log + unified log privacy flags'
title: การบันทึกบน macOS
x-i18n:
    generated_at: "2026-04-24T09:21:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# การบันทึก (macOS)

## ไฟล์บันทึกวินิจฉัยแบบหมุนเวียน (Debug pane)

OpenClaw ส่งเส้นทาง logs ของแอป macOS ผ่าน swift-log (ใช้ unified logging เป็นค่าเริ่มต้น) และสามารถเขียน file log แบบหมุนเวียนในเครื่องลงดิสก์ได้ เมื่อคุณต้องการการเก็บบันทึกแบบคงอยู่

- ระดับความละเอียด: **Debug pane → Logs → App logging → Verbosity**
- เปิดใช้: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- ตำแหน่ง: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (หมุนเวียนอัตโนมัติ; ไฟล์เก่าจะมี suffix เป็น `.1`, `.2`, …)
- ล้าง: **Debug pane → Logs → App logging → “Clear”**

หมายเหตุ:

- ค่านี้ **ปิดอยู่เป็นค่าเริ่มต้น** เปิดใช้เฉพาะขณะกำลังดีบักเท่านั้น
- ให้ถือว่าไฟล์นี้เป็นข้อมูลอ่อนไหว; อย่าแชร์โดยไม่ตรวจทานก่อน

## ข้อมูลส่วนตัวใน unified logging บน macOS

Unified logging จะ redacted payloads ส่วนใหญ่ออก เว้นแต่ subsystem จะเลือกใช้ `privacy -off` ตามบทความของ Peter เรื่อง macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) สิ่งนี้ควบคุมด้วย plist ใน `/Library/Preferences/Logging/Subsystems/` ซึ่งอิงตามชื่อ subsystem มีเพียง log entries ใหม่เท่านั้นที่จะรับ flag นี้ ดังนั้นให้เปิดใช้ก่อนทำซ้ำปัญหา

## เปิดใช้สำหรับ OpenClaw (`ai.openclaw`)

- เขียน plist ลงไฟล์ชั่วคราวก่อน แล้วจึงติดตั้งแบบ atomic ด้วยสิทธิ์ root:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- ไม่จำเป็นต้องรีบูต; `logd` จะสังเกตเห็นไฟล์อย่างรวดเร็ว แต่จะมีเพียงบรรทัด log ใหม่เท่านั้นที่รวม private payloads
- ดูเอาต์พุตที่ละเอียดขึ้นด้วย helper ที่มีอยู่แล้ว เช่น `./scripts/clawlog.sh --category WebChat --last 5m`

## ปิดหลังดีบักเสร็จ

- ลบ override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
- ตามตัวเลือกสามารถรัน `sudo log config --reload` เพื่อบังคับให้ `logd` เลิกใช้ override ทันที
- โปรดจำไว้ว่าพื้นผิวนี้อาจมีหมายเลขโทรศัพท์และเนื้อหาข้อความ; ควรเก็บ plist นี้ไว้เฉพาะขณะที่คุณยังต้องการรายละเอียดเพิ่มเติมจริง ๆ เท่านั้น

## ที่เกี่ยวข้อง

- [macOS app](/th/platforms/macos)
- [Gateway logging](/th/gateway/logging)
