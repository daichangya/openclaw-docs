---
read_when:
    - คุณต้องการ shell completion สำหรับ zsh/bash/fish/PowerShell
    - คุณต้องการแคชสคริปต์ completion ไว้ภายใต้สถานะของ OpenClaw
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw completion` (สร้าง/ติดตั้งสคริปต์ shell completion)
title: completion
x-i18n:
    generated_at: "2026-04-23T06:17:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

สร้างสคริปต์ shell completion และเลือกติดตั้งลงในโปรไฟล์เชลล์ของคุณได้

## การใช้งาน

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## ตัวเลือก

- `-s, --shell <shell>`: shell เป้าหมาย (`zsh`, `bash`, `powershell`, `fish`; ค่าเริ่มต้น: `zsh`)
- `-i, --install`: ติดตั้ง completion โดยเพิ่มบรรทัด source ลงในโปรไฟล์เชลล์ของคุณ
- `--write-state`: เขียนสคริปต์ completion ไปที่ `$OPENCLAW_STATE_DIR/completions` โดยไม่พิมพ์ไปยัง stdout
- `-y, --yes`: ข้ามพรอมต์ยืนยันการติดตั้ง

## หมายเหตุ

- `--install` จะเขียนบล็อก "OpenClaw Completion" ขนาดเล็กลงในโปรไฟล์เชลล์ของคุณ และชี้ไปยังสคริปต์ที่แคชไว้
- หากไม่ใช้ `--install` หรือ `--write-state` คำสั่งจะพิมพ์สคริปต์ไปยัง stdout
- การสร้าง completion จะโหลดโครงสร้างคำสั่งทั้งหมดล่วงหน้า เพื่อให้รวมคำสั่งย่อยที่ซ้อนกันอยู่ด้วย
