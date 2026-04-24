---
read_when:
    - คุณต้องติดตั้ง Node.js ก่อนติดตั้ง OpenClaw
    - คุณติดตั้ง OpenClaw แล้ว แต่ไม่พบคำสั่ง `openclaw`
    - '`npm install -g` ล้มเหลวเพราะปัญหาสิทธิ์หรือ PATH'
summary: ติดตั้งและกำหนดค่า Node.js สำหรับ OpenClaw — ข้อกำหนดเวอร์ชัน ตัวเลือกการติดตั้ง และการแก้ไขปัญหา PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T09:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw ต้องใช้ **Node 22.14 หรือใหม่กว่า** โดย **Node 24 คือ runtime ค่าเริ่มต้นและแนะนำ** สำหรับการติดตั้ง, CI และเวิร์กโฟลว์การปล่อย ส่วน Node 22 ยังคงรองรับผ่านสาย LTS ที่ยังใช้งานอยู่ [สคริปต์ตัวติดตั้ง](/th/install#alternative-install-methods) จะตรวจจับและติดตั้ง Node ให้โดยอัตโนมัติ — หน้านี้มีไว้สำหรับกรณีที่คุณต้องการตั้งค่า Node ด้วยตัวเอง และตรวจสอบให้แน่ใจว่าทุกอย่างเชื่อมต่อถูกต้องแล้ว (เวอร์ชัน, PATH, การติดตั้งแบบ global)

## ตรวจสอบเวอร์ชันของคุณ

```bash
node -v
```

หากคำสั่งนี้แสดง `v24.x.x` หรือสูงกว่า แสดงว่าคุณใช้ค่าเริ่มต้นที่แนะนำอยู่ หากแสดง `v22.14.x` หรือสูงกว่า แสดงว่าคุณอยู่บนเส้นทาง Node 22 LTS ที่รองรับ แต่เรายังแนะนำให้อัปเกรดเป็น Node 24 เมื่อสะดวก หากยังไม่ได้ติดตั้ง Node หรือเวอร์ชันเก่าเกินไป ให้เลือกวิธีติดตั้งด้านล่าง

## ติดตั้ง Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (แนะนำ):

    ```bash
    brew install node
    ```

    หรือดาวน์โหลดตัวติดตั้งสำหรับ macOS จาก [nodejs.org](https://nodejs.org/)

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

    หรือใช้ตัวจัดการเวอร์ชัน (ดูด้านล่าง)

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

    หรือดาวน์โหลดตัวติดตั้งสำหรับ Windows จาก [nodejs.org](https://nodejs.org/)

  </Tab>
</Tabs>

<Accordion title="การใช้ตัวจัดการเวอร์ชัน (nvm, fnm, mise, asdf)">
  ตัวจัดการเวอร์ชันช่วยให้คุณสลับระหว่างเวอร์ชันของ Node ได้ง่าย ตัวเลือกยอดนิยม:

- [**fnm**](https://github.com/Schniz/fnm) — เร็ว ใช้ได้ข้ามแพลตฟอร์ม
- [**nvm**](https://github.com/nvm-sh/nvm) — ใช้กันแพร่หลายบน macOS/Linux
- [**mise**](https://mise.jdx.dev/) — รองรับหลายภาษา (Node, Python, Ruby เป็นต้น)

ตัวอย่างกับ fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  ตรวจสอบให้แน่ใจว่าตัวจัดการเวอร์ชันของคุณถูก initialize ในไฟล์เริ่มต้นเชลล์ (`~/.zshrc` หรือ `~/.bashrc`) หากไม่ได้ทำเช่นนั้น `openclaw` อาจไม่ถูกพบในเซสชันเทอร์มินัลใหม่ เพราะ PATH จะไม่รวมไดเรกทอรี bin ของ Node
  </Warning>
</Accordion>

## การแก้ไขปัญหา

### `openclaw: command not found`

เกือบทั้งหมดหมายความว่าไดเรกทอรี npm global bin ของคุณไม่ได้อยู่ใน PATH

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

    มองหา `<npm-prefix>/bin` (macOS/Linux) หรือ `<npm-prefix>` (Windows) ในเอาต์พุต

  </Step>
  <Step title="เพิ่มมันลงในไฟล์เริ่มต้นเชลล์ของคุณ">
    <Tabs>
      <Tab title="macOS / Linux">
        เพิ่มลงใน `~/.zshrc` หรือ `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        จากนั้นเปิดเทอร์มินัลใหม่ (หรือรัน `rehash` ใน zsh / `hash -r` ใน bash)
      </Tab>
      <Tab title="Windows">
        เพิ่มเอาต์พุตจาก `npm prefix -g` ลงใน PATH ของระบบผ่าน Settings → System → Environment Variables
      </Tab>
    </Tabs>

  </Step>
</Steps>

### ข้อผิดพลาดสิทธิ์บน `npm install -g` (Linux)

หากคุณเห็นข้อผิดพลาด `EACCES` ให้สลับ global prefix ของ npm ไปยังไดเรกทอรีที่ผู้ใช้เขียนได้:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

เพิ่มบรรทัด `export PATH=...` ลงใน `~/.bashrc` หรือ `~/.zshrc` เพื่อให้มีผลถาวร

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุด
- [เริ่มต้นใช้งาน](/th/start/getting-started) — ขั้นตอนแรกหลังการติดตั้ง
