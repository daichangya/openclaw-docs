---
read_when:
    - คุณต้องติดตั้ง Node.js ก่อนติดตั้ง OpenClaw
    - คุณติดตั้ง OpenClaw แล้ว แต่ `openclaw` ไม่พบคำสั่ง
    - '`npm install -g` ล้มเหลวเพราะปัญหาสิทธิ์หรือ PATH'
summary: ติดตั้งและกำหนดค่า Node.js สำหรับ OpenClaw — ข้อกำหนดเวอร์ชัน ตัวเลือกการติดตั้ง และการแก้ไขปัญหา PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-23T05:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw ต้องใช้ **Node 22.14 หรือใหม่กว่า** โดย **Node 24 เป็น runtime ค่าเริ่มต้นและเป็นตัวเลือกที่แนะนำ** สำหรับการติดตั้ง, CI และ workflow สำหรับการออกรีลีส Node 22 ยังรองรับผ่านสาย LTS ที่ยังใช้งานอยู่ [installer script](/th/install#alternative-install-methods) จะตรวจจับและติดตั้ง Node ให้อัตโนมัติ — หน้านี้มีไว้สำหรับกรณีที่คุณต้องการตั้งค่า Node ด้วยตัวเอง และตรวจสอบให้แน่ใจว่าทุกอย่างเชื่อมต่อกันถูกต้อง (เวอร์ชัน, PATH, global installs)

## ตรวจสอบเวอร์ชันของคุณ

```bash
node -v
```

หากผลลัพธ์เป็น `v24.x.x` หรือสูงกว่า แปลว่าคุณใช้ค่าเริ่มต้นที่แนะนำอยู่แล้ว หากผลลัพธ์เป็น `v22.14.x` หรือสูงกว่า แปลว่าคุณอยู่บนเส้นทาง Node 22 LTS ที่ยังรองรับ แต่เรายังคงแนะนำให้อัปเกรดเป็น Node 24 เมื่อสะดวก หากยังไม่ได้ติดตั้ง Node หรือเวอร์ชันเก่าเกินไป ให้เลือกวิธีติดตั้งจากด้านล่าง

## ติดตั้ง Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (แนะนำ):

    ```bash
    brew install node
    ```

    หรือดาวน์โหลดตัวติดตั้ง macOS จาก [nodejs.org](https://nodejs.org/)

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    หรือใช้ version manager (ดูด้านล่าง)

  </Tab>
  <Tab title="Windows">
    **winget** (แนะนำ):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    หรือดาวน์โหลดตัวติดตั้ง Windows จาก [nodejs.org](https://nodejs.org/)

  </Tab>
</Tabs>

<Accordion title="การใช้ version manager (nvm, fnm, mise, asdf)">
  version manager ช่วยให้คุณสลับเวอร์ชัน Node ได้ง่าย ตัวเลือกยอดนิยม:

- [**fnm**](https://github.com/Schniz/fnm) — เร็ว, ใช้ได้ข้ามแพลตฟอร์ม
- [**nvm**](https://github.com/nvm-sh/nvm) — ใช้กันอย่างแพร่หลายบน macOS/Linux
- [**mise**](https://mise.jdx.dev/) — รองรับหลายภาษา (Node, Python, Ruby ฯลฯ)

ตัวอย่างเมื่อใช้ fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  ตรวจสอบให้แน่ใจว่า version manager ของคุณถูก initialize ในไฟล์เริ่มต้น shell (`~/.zshrc` หรือ `~/.bashrc`) หากไม่ได้ทำเช่นนั้น `openclaw` อาจไม่ถูกพบในเซสชันเทอร์มินัลใหม่ เพราะ PATH จะไม่มีไดเรกทอรี bin ของ Node
  </Warning>
</Accordion>

## การแก้ไขปัญหา

### `openclaw: command not found`

ปัญหานี้แทบทั้งหมดหมายความว่าไดเรกทอรี global bin ของ npm ไม่ได้อยู่ใน PATH ของคุณ

<Steps>
  <Step title="ค้นหา global npm prefix ของคุณ">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="ตรวจสอบว่ามันอยู่ใน PATH หรือไม่">
    ```bash
    echo "$PATH"
    ```

    มองหา `<npm-prefix>/bin` (macOS/Linux) หรือ `<npm-prefix>` (Windows) ในผลลัพธ์

  </Step>
  <Step title="เพิ่มลงในไฟล์เริ่มต้น shell ของคุณ">
    <Tabs>
      <Tab title="macOS / Linux">
        เพิ่มลงใน `~/.zshrc` หรือ `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        จากนั้นเปิดเทอร์มินัลใหม่ (หรือรัน `rehash` ใน zsh / `hash -r` ใน bash)
      </Tab>
      <Tab title="Windows">
        เพิ่มผลลัพธ์ของ `npm prefix -g` ลงใน system PATH ผ่าน Settings → System → Environment Variables
      </Tab>
    </Tabs>

  </Step>
</Steps>

### ปัญหาสิทธิ์บน `npm install -g` (Linux)

หากคุณเห็นข้อผิดพลาด `EACCES` ให้เปลี่ยน global prefix ของ npm ไปยังไดเรกทอรีที่ผู้ใช้เขียนได้:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

เพิ่มบรรทัด `export PATH=...` ลงใน `~/.bashrc` หรือ `~/.zshrc` เพื่อให้มีผลถาวร

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw ทันสมัยอยู่เสมอ
- [เริ่มต้นใช้งาน](/th/start/getting-started) — ขั้นตอนแรกหลังการติดตั้ง
