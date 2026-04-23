---
read_when:
    - คุณต้องการการติดตั้งที่ทำซ้ำได้และย้อนกลับได้
    - คุณใช้ Nix/NixOS/Home Manager อยู่แล้ว
    - คุณต้องการให้ทุกอย่างถูก pin ไว้และถูกจัดการแบบ declarative
summary: ติดตั้ง OpenClaw แบบ declarative ด้วย Nix
title: Nix
x-i18n:
    generated_at: "2026-04-23T05:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# การติดตั้งด้วย Nix

ติดตั้ง OpenClaw แบบ declarative ด้วย **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** -- โมดูล Home Manager แบบ batteries-included

<Info>
repo [nix-openclaw](https://github.com/openclaw/nix-openclaw) คือแหล่งข้อมูลจริงสำหรับการติดตั้งด้วย Nix หน้านี้เป็นเพียงภาพรวมแบบรวดเร็ว
</Info>

## สิ่งที่คุณจะได้รับ

- Gateway + แอป macOS + tools (whisper, spotify, cameras) -- ทั้งหมดถูก pin ไว้
- บริการ launchd ที่อยู่รอดหลังการรีบูต
- ระบบ Plugin พร้อม config แบบ declarative
- ย้อนกลับได้ทันที: `home-manager switch --rollback`

## เริ่มต้นอย่างรวดเร็ว

<Steps>
  <Step title="ติดตั้ง Determinate Nix">
    หากยังไม่ได้ติดตั้ง Nix ให้ทำตามคำแนะนำของ [ตัวติดตั้ง Determinate Nix](https://github.com/DeterminateSystems/nix-installer)
  </Step>
  <Step title="สร้าง flake ในเครื่อง">
    ใช้เทมเพลตแบบ agent-first จาก repo nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # คัดลอก templates/agent-first/flake.nix จาก repo nix-openclaw
    ```
  </Step>
  <Step title="กำหนดค่าความลับ">
    ตั้งค่า token ของบอตส่งข้อความและ API key ของผู้ให้บริการโมเดลของคุณ ใช้ไฟล์ธรรมดาใน `~/.secrets/` ก็เพียงพอ
  </Step>
  <Step title="เติม placeholder ในเทมเพลตและสลับไปใช้">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="ตรวจสอบ">
    ยืนยันว่าบริการ launchd กำลังทำงานอยู่ และบอตของคุณตอบข้อความได้
  </Step>
</Steps>

ดู [README ของ nix-openclaw](https://github.com/openclaw/nix-openclaw) สำหรับตัวเลือกของโมดูลและตัวอย่างแบบเต็ม

## พฤติกรรมรันไทม์ของ Nix Mode

เมื่อมีการตั้งค่า `OPENCLAW_NIX_MODE=1` (เป็นอัตโนมัติเมื่อใช้ nix-openclaw) OpenClaw จะเข้าสู่โหมดกำหนดแน่นอนที่ปิดการทำงานของ flow การติดตั้งอัตโนมัติ

คุณสามารถตั้งค่าด้วยตนเองได้เช่นกัน:

```bash
export OPENCLAW_NIX_MODE=1
```

บน macOS แอป GUI จะไม่สืบทอดตัวแปรสภาพแวดล้อมของ shell โดยอัตโนมัติ ให้เปิดใช้ Nix mode ผ่าน defaults แทน:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### สิ่งที่เปลี่ยนไปใน Nix mode

- flow การติดตั้งอัตโนมัติและการเปลี่ยนแปลงตัวเองจะถูกปิดใช้งาน
- dependency ที่ขาดหายจะแสดงข้อความแนะนำการแก้ไขแบบเฉพาะ Nix
- UI จะแสดงแบนเนอร์ Nix mode แบบอ่านอย่างเดียว

### พาธของ config และ state

OpenClaw อ่าน config JSON5 จาก `OPENCLAW_CONFIG_PATH` และเก็บข้อมูล mutable ไว้ใน `OPENCLAW_STATE_DIR` เมื่อรันภายใต้ Nix ให้ตั้งค่าสิ่งเหล่านี้อย่างชัดเจนไปยังตำแหน่งที่ Nix จัดการ เพื่อให้ state และ config ของรันไทม์อยู่นอก immutable store

| ตัวแปร               | ค่าเริ่มต้น                              |
| -------------------- | ---------------------------------------- |
| `OPENCLAW_HOME`      | `HOME` / `USERPROFILE` / `os.homedir()`  |
| `OPENCLAW_STATE_DIR` | `~/.openclaw`                            |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

## ที่เกี่ยวข้อง

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- คู่มือการตั้งค่าแบบเต็ม
- [Wizard](/th/start/wizard) -- การตั้งค่า CLI แบบไม่ใช้ Nix
- [Docker](/th/install/docker) -- การตั้งค่าแบบ containerized
