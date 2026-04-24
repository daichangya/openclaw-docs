---
read_when:
    - คุณต้องการทำความเข้าใจ `openclaw.ai/install.sh`
    - คุณต้องการทำให้การติดตั้งเป็นอัตโนมัติ (CI / headless)
    - คุณต้องการติดตั้งจาก GitHub checkout
summary: วิธีการทำงานของสคริปต์ติดตั้ง (install.sh, install-cli.sh, install.ps1), flags และการทำงานอัตโนมัติ
title: ภายในของตัวติดตั้ง
x-i18n:
    generated_at: "2026-04-24T09:18:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClaw มาพร้อมสคริปต์ติดตั้ง 3 ตัว ซึ่งให้บริการจาก `openclaw.ai`

| สคริปต์                             | แพลตฟอร์ม            | สิ่งที่ทำ                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถรัน onboarding ได้          |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | ติดตั้ง Node + OpenClaw ลงใน local prefix (`~/.openclaw`) ด้วยโหมด npm หรือ git checkout ไม่ต้องใช้ root     |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | ติดตั้ง Node หากจำเป็น ติดตั้ง OpenClaw ผ่าน npm (ค่าเริ่มต้น) หรือ git และสามารถรัน onboarding ได้          |

## คำสั่งแบบรวดเร็ว

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
หากติดตั้งสำเร็จแล้วแต่ไม่พบ `openclaw` ในเทอร์มินัลใหม่ ให้ดู [Node.js troubleshooting](/th/install/node#troubleshooting)
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
แนะนำสำหรับการติดตั้งแบบโต้ตอบส่วนใหญ่บน macOS/Linux/WSL
</Tip>

### โฟลว์ (install.sh)

<Steps>
  <Step title="ตรวจจับระบบปฏิบัติการ">
    รองรับ macOS และ Linux (รวมถึง WSL) หากตรวจพบว่าเป็น macOS จะติดตั้ง Homebrew หากยังไม่มี
  </Step>
  <Step title="ตรวจให้มี Node.js 24 เป็นค่าเริ่มต้น">
    ตรวจสอบเวอร์ชัน Node และติดตั้ง Node 24 หากจำเป็น (Homebrew บน macOS, NodeSource setup scripts บน Linux apt/dnf/yum) OpenClaw ยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` เพื่อความเข้ากันได้
  </Step>
  <Step title="ตรวจให้มี Git">
    ติดตั้ง Git หากยังไม่มี
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global
    - วิธี `git`: clone/update repo, ติดตั้ง dependencies ด้วย pnpm, build แล้วติดตั้ง wrapper ที่ `~/.local/bin/openclaw`
  </Step>
  <Step title="งานหลังติดตั้ง">
    - รีเฟรช loaded gateway service แบบ best-effort (`openclaw gateway install --force` แล้วจึง restart)
    - รัน `openclaw doctor --non-interactive` สำหรับการอัปเกรดและ git installs (best effort)
    - พยายามทำ onboarding เมื่อเหมาะสม (มี TTY, ไม่ได้ปิด onboarding และผ่านการตรวจ bootstrap/config)
    - ตั้งค่าเริ่มต้น `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### การตรวจจับ source checkout

หากรันภายใน OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) สคริปต์จะเสนอให้:

- ใช้ checkout (`git`) หรือ
- ใช้ global install (`npm`)

หากไม่มี TTY และไม่ได้กำหนดวิธีติดตั้งไว้ ระบบจะใช้ `npm` เป็นค่าเริ่มต้นและแสดงคำเตือน

สคริปต์จะออกด้วยโค้ด `2` เมื่อเลือกวิธีไม่ถูกต้องหรือใช้ค่า `--install-method` ไม่ถูกต้อง

### ตัวอย่าง (install.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="ข้าม onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main ผ่าน npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="เอกสารอ้างอิง flags">

| Flag                                  | คำอธิบาย                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| `--install-method npm\|git`           | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method` |
| `--npm`                               | ทางลัดสำหรับวิธี npm                                      |
| `--git`                               | ทางลัดสำหรับวิธี git Alias: `--github`                   |
| `--version <version\|dist-tag\|spec>` | เวอร์ชัน npm, dist-tag หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `--beta`                              | ใช้ beta dist-tag หากมี มิฉะนั้น fallback ไปยัง `latest` |
| `--git-dir <path>`                    | ไดเรกทอรี checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir` |
| `--no-git-update`                     | ข้าม `git pull` สำหรับ checkout ที่มีอยู่แล้ว            |
| `--no-prompt`                         | ปิด prompts                                               |
| `--no-onboard`                        | ข้าม onboarding                                           |
| `--onboard`                           | เปิดใช้งาน onboarding                                     |
| `--dry-run`                           | แสดงการกระทำโดยไม่ทำการเปลี่ยนแปลงจริง                  |
| `--verbose`                           | เปิด debug output (`set -x`, npm logs ระดับ notice)      |
| `--help`                              | แสดงวิธีใช้ (`-h`)                                        |

  </Accordion>

  <Accordion title="เอกสารอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                                  | คำอธิบาย                                  |
| ------------------------------------------------------- | ----------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | วิธีติดตั้ง                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | เวอร์ชัน npm, dist-tag หรือ package spec  |
| `OPENCLAW_BETA=0\|1`                                    | ใช้ beta หากมี                            |
| `OPENCLAW_GIT_DIR=<path>`                               | ไดเรกทอรี checkout                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | เปิด/ปิด git updates                      |
| `OPENCLAW_NO_PROMPT=1`                                  | ปิด prompts                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | ข้าม onboarding                           |
| `OPENCLAW_DRY_RUN=1`                                    | โหมด dry run                              |
| `OPENCLAW_VERBOSE=1`                                    | โหมด debug                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | ระดับ log ของ npm                         |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | ควบคุมพฤติกรรม sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
ออกแบบมาสำหรับสภาพแวดล้อมที่คุณต้องการให้ทุกอย่างอยู่ภายใต้ local prefix
(ค่าเริ่มต้น `~/.openclaw`) และไม่พึ่ง Node ของระบบ รองรับการติดตั้งแบบ npm
เป็นค่าเริ่มต้น และรองรับการติดตั้งแบบ git-checkout ภายใต้โฟลว์ prefix เดียวกัน
</Info>

### โฟลว์ (install-cli.sh)

<Steps>
  <Step title="ติดตั้ง local Node runtime">
    ดาวน์โหลด Node LTS tarball เวอร์ชันที่รองรับแบบปักหมุด (เวอร์ชันถูกฝังอยู่ในสคริปต์และอัปเดตแยกต่างหาก) ไปที่ `<prefix>/tools/node-v<version>` และตรวจสอบ SHA-256
  </Step>
  <Step title="ตรวจให้มี Git">
    หากไม่มี Git จะพยายามติดตั้งผ่าน apt/dnf/yum บน Linux หรือ Homebrew บน macOS
  </Step>
  <Step title="ติดตั้ง OpenClaw ภายใต้ prefix">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้งใต้ prefix ด้วย npm แล้วเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
    - วิธี `git`: clone/update checkout (ค่าเริ่มต้น `~/openclaw`) และยังเขียน wrapper ไปที่ `<prefix>/bin/openclaw`
  </Step>
  <Step title="รีเฟรช loaded gateway service">
    หากมี gateway service ที่โหลดอยู่แล้วจาก prefix เดียวกัน สคริปต์จะรัน
    `openclaw gateway install --force`, จากนั้น `openclaw gateway restart` และ
    probe สุขภาพของ gateway แบบ best-effort
  </Step>
</Steps>

### ตัวอย่าง (install-cli.sh)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="กำหนด prefix + version เอง">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="เอาต์พุต JSON สำหรับ automation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="รัน onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="เอกสารอ้างอิง flags">

| Flag                        | คำอธิบาย                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`           | prefix สำหรับติดตั้ง (ค่าเริ่มต้น: `~/.openclaw`)                               |
| `--install-method npm\|git` | เลือกวิธีติดตั้ง (ค่าเริ่มต้น: `npm`) Alias: `--method`                         |
| `--npm`                     | ทางลัดสำหรับวิธี npm                                                            |
| `--git`, `--github`         | ทางลัดสำหรับวิธี git                                                            |
| `--git-dir <path>`          | ไดเรกทอรี git checkout (ค่าเริ่มต้น: `~/openclaw`) Alias: `--dir`               |
| `--version <ver>`           | เวอร์ชันหรือ dist-tag ของ OpenClaw (ค่าเริ่มต้น: `latest`)                      |
| `--node-version <ver>`      | เวอร์ชัน Node (ค่าเริ่มต้น: `22.22.0`)                                          |
| `--json`                    | ส่ง NDJSON events ออกมา                                                         |
| `--onboard`                 | รัน `openclaw onboard` หลังติดตั้ง                                               |
| `--no-onboard`              | ข้าม onboarding (ค่าเริ่มต้น)                                                   |
| `--set-npm-prefix`          | บน Linux ให้บังคับ npm prefix เป็น `~/.npm-global` หาก prefix ปัจจุบันเขียนไม่ได้ |
| `--help`                    | แสดงวิธีใช้ (`-h`)                                                              |

  </Accordion>

  <Accordion title="เอกสารอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                                    | คำอธิบาย                                   |
| ----------------------------------------- | ------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                  | prefix สำหรับติดตั้ง                        |
| `OPENCLAW_INSTALL_METHOD=git\|npm`        | วิธีติดตั้ง                                 |
| `OPENCLAW_VERSION=<ver>`                  | เวอร์ชันหรือ dist-tag ของ OpenClaw         |
| `OPENCLAW_NODE_VERSION=<ver>`             | เวอร์ชัน Node                               |
| `OPENCLAW_GIT_DIR=<path>`                 | ไดเรกทอรี Git checkout สำหรับ git installs |
| `OPENCLAW_GIT_UPDATE=0\|1`                | เปิด/ปิด git updates สำหรับ checkouts ที่มีอยู่แล้ว |
| `OPENCLAW_NO_ONBOARD=1`                   | ข้าม onboarding                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | ระดับ log ของ npm                        |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`        | ควบคุมพฤติกรรม sharp/libvips (ค่าเริ่มต้น: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### โฟลว์ (install.ps1)

<Steps>
  <Step title="ตรวจให้มี PowerShell + สภาพแวดล้อม Windows">
    ต้องใช้ PowerShell 5+
  </Step>
  <Step title="ตรวจให้มี Node.js 24 เป็นค่าเริ่มต้น">
    หากยังไม่มี จะพยายามติดตั้งผ่าน winget จากนั้น Chocolatey แล้วจึง Scoop โดยยังคงรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` เพื่อความเข้ากันได้
  </Step>
  <Step title="ติดตั้ง OpenClaw">
    - วิธี `npm` (ค่าเริ่มต้น): ติดตั้ง npm แบบ global โดยใช้ `-Tag` ที่เลือก
    - วิธี `git`: clone/update repo, ติดตั้ง/build ด้วย pnpm และติดตั้ง wrapper ที่ `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="งานหลังติดตั้ง">
    - เพิ่มไดเรกทอรี bin ที่จำเป็นลงใน PATH ของผู้ใช้เมื่อทำได้
    - รีเฟรช loaded gateway service แบบ best-effort (`openclaw gateway install --force` แล้วจึง restart)
    - รัน `openclaw doctor --non-interactive` สำหรับการอัปเกรดและ git installs (best effort)
  </Step>
</Steps>

### ตัวอย่าง (install.ps1)

<Tabs>
  <Tab title="ค่าเริ่มต้น">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="ติดตั้งแบบ Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main ผ่าน npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="กำหนดไดเรกทอรี git เอง">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 ยังไม่มี -Verbose โดยเฉพาะ
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="เอกสารอ้างอิง flags">

| Flag                        | คำอธิบาย                                                  |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | วิธีติดตั้ง (ค่าเริ่มต้น: `npm`)                          |
| `-Tag <tag\|version\|spec>` | npm dist-tag, เวอร์ชัน หรือ package spec (ค่าเริ่มต้น: `latest`) |
| `-GitDir <path>`            | ไดเรกทอรี checkout (ค่าเริ่มต้น: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | ข้าม onboarding                                           |
| `-NoGitUpdate`              | ข้าม `git pull`                                           |
| `-DryRun`                   | แสดงการกระทำเท่านั้น                                     |

  </Accordion>

  <Accordion title="เอกสารอ้างอิงตัวแปรสภาพแวดล้อม">

| ตัวแปร                           | คำอธิบาย         |
| -------------------------------- | ---------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | วิธีติดตั้ง     |
| `OPENCLAW_GIT_DIR=<path>`        | ไดเรกทอรี checkout |
| `OPENCLAW_NO_ONBOARD=1`          | ข้าม onboarding  |
| `OPENCLAW_GIT_UPDATE=0`          | ปิด git pull     |
| `OPENCLAW_DRY_RUN=1`             | โหมด dry run     |

  </Accordion>
</AccordionGroup>

<Note>
หากใช้ `-InstallMethod git` และไม่มี Git สคริปต์จะออกและแสดงลิงก์ Git for Windows
</Note>

---

## CI และการทำงานอัตโนมัติ

ใช้ flags/env vars แบบ non-interactive เพื่อให้การรันคาดเดาได้แน่นอน

<Tabs>
  <Tab title="install.sh (npm แบบ non-interactive)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git แบบ non-interactive)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ข้าม onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ทำไมต้องใช้ Git">
    Git จำเป็นสำหรับวิธีติดตั้งแบบ `git` สำหรับการติดตั้งแบบ `npm` ก็ยังมีการตรวจสอบ/ติดตั้ง Git เพื่อหลีกเลี่ยงความล้มเหลวแบบ `spawn git ENOENT` เมื่อ dependencies ใช้ git URLs
  </Accordion>

  <Accordion title="ทำไม npm ถึงเจอ EACCES บน Linux">
    การตั้งค่า Linux บางแบบชี้ npm global prefix ไปยังพาธที่เป็นของ root `install.sh` สามารถสลับ prefix ไปเป็น `~/.npm-global` และเพิ่ม PATH exports ลงในไฟล์ shell rc ได้ (เมื่อไฟล์เหล่านั้นมีอยู่)
  </Accordion>

  <Accordion title="ปัญหา sharp/libvips">
    สคริปต์จะตั้งค่าเริ่มต้น `SHARP_IGNORE_GLOBAL_LIBVIPS=1` เพื่อหลีกเลี่ยงไม่ให้ sharp build กับ system libvips หากต้องการแทนที่:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ติดตั้ง Git for Windows, เปิด PowerShell ใหม่ แล้วรัน installer อีกครั้ง
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    รัน `npm config get prefix` แล้วเพิ่มไดเรกทอรีนั้นลงใน PATH ของผู้ใช้ (ไม่ต้องมี suffix `\bin` บน Windows) จากนั้นเปิด PowerShell ใหม่
  </Accordion>

  <Accordion title="Windows: วิธีดูเอาต์พุต installer แบบละเอียด">
    ปัจจุบัน `install.ps1` ยังไม่มีสวิตช์ `-Verbose`
    ให้ใช้ PowerShell tracing สำหรับการวินิจฉัยระดับสคริปต์:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="ไม่พบ openclaw หลังติดตั้ง">
    โดยทั่วไปเป็นปัญหาเรื่อง PATH ดู [Node.js troubleshooting](/th/install/node#troubleshooting)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Install overview](/th/install)
- [Updating](/th/install/updating)
- [Uninstall](/th/install/uninstall)
