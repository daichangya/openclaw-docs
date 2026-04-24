---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-04-24T09:35:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## ปัญหา: "Failed to start Chrome CDP on port 18800"

เซิร์ฟเวอร์ควบคุมเบราว์เซอร์ของ OpenClaw ไม่สามารถเปิด Chrome/Brave/Edge/Chromium ได้ โดยขึ้นข้อผิดพลาด:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### สาเหตุหลัก

บน Ubuntu (และ Linux distro หลายตัว) การติดตั้ง Chromium ค่าปริยายเป็น **แพ็กเกจแบบ snap** การจำกัดของ AppArmor ใน snap จะรบกวนวิธีที่ OpenClaw ใช้เปิดและตรวจสอบโพรเซสของเบราว์เซอร์

คำสั่ง `apt install chromium` จะติดตั้งแพ็กเกจตัวหลอกที่เปลี่ยนเส้นทางไปยัง snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

นี่ไม่ใช่เบราว์เซอร์จริง — เป็นเพียงตัว wrapper

### วิธีแก้ 1: ติดตั้ง Google Chrome (แนะนำ)

ติดตั้งแพ็กเกจ `.deb` อย่างเป็นทางการของ Google Chrome ซึ่งไม่ถูก sandbox ด้วย snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
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

### วิธีแก้ 2: ใช้ Snap Chromium กับโหมด Attach-Only

หากคุณจำเป็นต้องใช้ snap Chromium ให้กำหนดค่า OpenClaw ให้ attach กับเบราว์เซอร์ที่เริ่มเองด้วยตนเอง:

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

3. จะสร้าง systemd user service สำหรับเริ่ม Chrome อัตโนมัติก็ได้:

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

### ตรวจสอบว่าเบราว์เซอร์ทำงานได้

ตรวจสอบสถานะ:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

ทดสอบการใช้งานเบราว์เซอร์:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### ข้อมูลอ้างอิงคอนฟิก

| ตัวเลือก                 | คำอธิบาย                                                              | ค่าปริยาย                                                      |
| ------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `browser.enabled`        | เปิดใช้การควบคุมเบราว์เซอร์                                           | `true`                                                          |
| `browser.executablePath` | พาธไปยังไบนารีของเบราว์เซอร์ที่อิง Chromium (Chrome/Brave/Edge/Chromium) | ตรวจจับอัตโนมัติ (ให้ความสำคัญกับเบราว์เซอร์ค่าปริยายหากอิง Chromium) |
| `browser.headless`       | รันโดยไม่มี GUI                                                       | `false`                                                         |
| `browser.noSandbox`      | เพิ่มแฟล็ก `--no-sandbox` (จำเป็นสำหรับการตั้งค่า Linux บางแบบ)       | `false`                                                         |
| `browser.attachOnly`     | ไม่เปิดเบราว์เซอร์เอง แต่ attach กับตัวที่มีอยู่แล้วเท่านั้น          | `false`                                                         |
| `browser.cdpPort`        | พอร์ตของ Chrome DevTools Protocol                                    | `18800`                                                         |

### ปัญหา: "No Chrome tabs found for profile=\"user\""

คุณกำลังใช้โปรไฟล์ `existing-session` / Chrome MCP OpenClaw มองเห็น Chrome ในเครื่อง
แต่ไม่มีแท็บที่เปิดอยู่ให้ attach ได้

ตัวเลือกในการแก้:

1. **ใช้เบราว์เซอร์ที่ระบบจัดการให้:** `openclaw browser start --browser-profile openclaw`
   (หรือตั้ง `browser.defaultProfile: "openclaw"`).
2. **ใช้ Chrome MCP:** ตรวจสอบว่า Chrome ในเครื่องกำลังทำงานอยู่และมีแท็บเปิดอย่างน้อยหนึ่งแท็บ แล้วลองใหม่ด้วย `--browser-profile user`

หมายเหตุ:

- `user` ใช้ได้เฉพาะบนโฮสต์เท่านั้น สำหรับเซิร์ฟเวอร์ Linux, container หรือโฮสต์ระยะไกล ควรใช้ CDP profile
- โปรไฟล์ `user` / โปรไฟล์ `existing-session` อื่น ๆ ยังคงมีข้อจำกัดปัจจุบันของ Chrome MCP:
  แอ็กชันแบบอิง ref, hook สำหรับอัปโหลดไฟล์ครั้งละหนึ่งไฟล์, ไม่มี dialog timeout override, ไม่มี
  `wait --load networkidle`, และไม่มี `responsebody`, การ export PDF, download
  interception หรือ batch action
- โปรไฟล์ `openclaw` ในเครื่องจะกำหนด `cdpPort`/`cdpUrl` ให้อัตโนมัติ; ควรตั้งค่าสองตัวนี้เองเฉพาะสำหรับ remote CDP
- remote CDP profile รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นพบ `/json/version`, หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์ของคุณ
  ให้ URL ของ DevTools socket มาโดยตรง

## ที่เกี่ยวข้อง

- [Browser](/th/tools/browser)
- [Browser login](/th/tools/browser-login)
- [การแก้ปัญหา Browser บน WSL2 Windows remote CDP](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
