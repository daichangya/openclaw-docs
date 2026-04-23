---
read_when:
    - การเก็บ log บน macOS หรือการตรวจสอบการบันทึกข้อมูลส่วนตัวลง log
    - การดีบักปัญหาวงจรชีวิตของ voice wake/เซสชัน
summary: 'Logging ของ OpenClaw: log ไฟล์การวินิจฉัยแบบหมุนเวียน + แฟล็กความเป็นส่วนตัวของ log แบบรวมศูนย์'
title: Logging บน macOS
x-i18n:
    generated_at: "2026-04-23T05:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b
    source_path: platforms/mac/logging.md
    workflow: 15
---

# Logging (macOS)

## log ไฟล์การวินิจฉัยแบบหมุนเวียน (แผง Debug)

OpenClaw ส่ง log ของแอป macOS ผ่าน swift-log (ใช้ unified logging เป็นค่าเริ่มต้น) และสามารถเขียน log file แบบหมุนเวียนในเครื่องลงดิสก์ได้เมื่อคุณต้องการการเก็บบันทึกแบบคงอยู่

- ระดับความละเอียด: **Debug pane → Logs → App logging → Verbosity**
- เปิดใช้: **Debug pane → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- ตำแหน่ง: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (หมุนเวียนอัตโนมัติ; ไฟล์เก่าจะมี suffix เป็น `.1`, `.2`, …)
- ล้าง: **Debug pane → Logs → App logging → “Clear”**

หมายเหตุ:

- สิ่งนี้ **ปิดอยู่เป็นค่าเริ่มต้น** ให้เปิดเฉพาะขณะกำลังดีบักอย่างจริงจัง
- ให้ถือว่าไฟล์นี้มีความอ่อนไหว; อย่าแชร์โดยไม่ตรวจทานก่อน

## ข้อมูลส่วนตัวใน unified logging บน macOS

Unified logging จะปกปิด payload ส่วนใหญ่ เว้นแต่ subsystem จะเลือกใช้ `privacy -off` ตามบทความของ Peter เกี่ยวกับ macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) สิ่งนี้ถูกควบคุมด้วย plist ใน `/Library/Preferences/Logging/Subsystems/` โดยใช้ชื่อ subsystem เป็นคีย์ เฉพาะ log entry ใหม่เท่านั้นที่จะรับแฟล็กนี้ ดังนั้นให้เปิดใช้ก่อนทำการ reproduce ปัญหา

## เปิดใช้สำหรับ OpenClaw (`ai.openclaw`)

- เขียน plist ลงไฟล์ชั่วคราวก่อน จากนั้นติดตั้งแบบ atomic ด้วยสิทธิ์ root:

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

- ไม่ต้องรีบูต; logd จะสังเกตเห็นไฟล์นี้ได้อย่างรวดเร็ว แต่เฉพาะบรรทัด log ใหม่เท่านั้นที่จะมี payload ส่วนตัวรวมอยู่ด้วย
- ดูเอาต์พุตที่ละเอียดขึ้นด้วยตัวช่วยที่มีอยู่ เช่น `./scripts/clawlog.sh --category WebChat --last 5m`

## ปิดหลังดีบักเสร็จ

- ลบ override: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
- คุณสามารถรัน `sudo log config --reload` เพิ่มเติมเพื่อบังคับให้ logd ปลด override ทันที
- อย่าลืมว่าพื้นผิวนี้อาจรวมหมายเลขโทรศัพท์และเนื้อหาข้อความ; ควรเก็บ plist นี้ไว้เฉพาะช่วงที่คุณต้องการรายละเอียดเพิ่มเติมจริง ๆ เท่านั้น
