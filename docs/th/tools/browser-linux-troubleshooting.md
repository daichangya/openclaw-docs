---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ไขปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-23T05:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# การแก้ไขปัญหาเบราว์เซอร์ (Linux)

## ปัญหา: "Failed to start Chrome CDP on port 18800"

เซิร์ฟเวอร์ควบคุมเบราว์เซอร์ของ OpenClaw ไม่สามารถเปิด Chrome/Brave/Edge/Chromium ได้ โดยมีข้อผิดพลาด:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### สาเหตุหลัก

บน Ubuntu (และ Linux distros หลายตัว) การติดตั้ง Chromium เริ่มต้นจะเป็น **แพ็กเกจ snap**
การจำกัดสิทธิ์ของ AppArmor ใน snap จะรบกวนวิธีที่ OpenClaw ใช้ spawn และติดตามโปรเซสของเบราว์เซอร์

คำสั่ง `apt install chromium` จะติดตั้งแพ็กเกจตัวคั่นที่เปลี่ยนเส้นทางไปยัง snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

นี่ **ไม่ใช่** เบราว์เซอร์จริง — มันเป็นเพียง wrapper

### วิธีแก้ 1: ติดตั้ง Google Chrome (แนะนำ)

ติดตั้งแพ็กเกจ `.deb` อย่างเป็นทางการของ Google Chrome ซึ่งไม่ถูก sandbox ด้วย snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # หากมีข้อผิดพลาดเรื่อง dependencies
```

จากนั้นอัปเดตคอนฟิก OpenClaw ของคุณ (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### วิธีแก้ 2: ใช้ Snap Chromium ร่วมกับโหมด Attach-Only

หากคุณจำเป็นต้องใช้ snap Chromium ให้กำหนดค่า OpenClaw เพื่อ attach ไปยังเบราว์เซอร์ที่เริ่มด้วยตนเอง:

1. อัปเดตคอนฟิก:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. เริ่ม Chromium ด้วยตนเอง:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. หากต้องการ สามารถสร้าง systemd user service เพื่อเริ่ม Chrome อัตโนมัติ:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

เปิดใช้งานด้วย: `systemctl --user enable --now openclaw-browser.service`

### การตรวจสอบว่าเบราว์เซอร์ทำงานได้

ตรวจสอบสถานะ:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ทดสอบการท่องเว็บ:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### เอกสารอ้างอิงคอนฟิก

| ตัวเลือก                   | คำอธิบาย                                                          | ค่าเริ่มต้น                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | เปิดใช้งานการควบคุมเบราว์เซอร์                                               | `true`                                                      |
| `browser.executablePath` | พาธไปยังไบนารีของเบราว์เซอร์ที่อิง Chromium (Chrome/Brave/Edge/Chromium) | ตรวจจับอัตโนมัติ (ให้ความสำคัญกับเบราว์เซอร์เริ่มต้นเมื่อเป็นแบบ Chromium-based) |
| `browser.headless`       | รันโดยไม่แสดง GUI                                                      | `false`                                                     |
| `browser.noSandbox`      | เพิ่มแฟล็ก `--no-sandbox` (จำเป็นสำหรับการตั้งค่าบางแบบบน Linux)               | `false`                                                     |
| `browser.attachOnly`     | ไม่เปิดเบราว์เซอร์เอง ให้ attach กับที่มีอยู่เท่านั้น                        | `false`                                                     |
| `browser.cdpPort`        | พอร์ตของ Chrome DevTools Protocol                                        | `18800`                                                     |

### ปัญหา: "No Chrome tabs found for profile=\"user\""

คุณกำลังใช้โปรไฟล์ `existing-session` / Chrome MCP OpenClaw มองเห็น Chrome ในเครื่องได้
แต่ไม่มีแท็บที่เปิดอยู่ให้ attach เข้าไปได้

ตัวเลือกในการแก้ไข:

1. **ใช้ managed browser:** `openclaw browser start --browser-profile openclaw`
   (หรือกำหนด `browser.defaultProfile: "openclaw"`)
2. **ใช้ Chrome MCP:** ตรวจสอบให้แน่ใจว่า Chrome ในเครื่องกำลังทำงานอยู่และมีอย่างน้อยหนึ่งแท็บเปิดอยู่ จากนั้นลองใหม่ด้วย `--browser-profile user`

หมายเหตุ:

- `user` ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับเซิร์ฟเวอร์ Linux, คอนเทนเนอร์ หรือโฮสต์ระยะไกล ให้เลือกใช้โปรไฟล์ CDP
- โปรไฟล์ `user` / โปรไฟล์ `existing-session` อื่นๆ ยังคงมีข้อจำกัดปัจจุบันของ Chrome MCP:
  การกระทำแบบอิง ref, hooks สำหรับอัปโหลดไฟล์ได้ครั้งละหนึ่งไฟล์, ไม่มี dialog timeout overrides และไม่มี
  `wait --load networkidle`, `responsebody`, การ export PDF, การดักจับ download
  หรือ batch actions
- โปรไฟล์ `openclaw` แบบ local จะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ; ควรกำหนดค่านี้เฉพาะสำหรับ remote CDP
- โปรไฟล์ remote CDP รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นพบผ่าน `/json/version` หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์ของคุณ
  ให้ URL ของ DevTools socket มาโดยตรง
