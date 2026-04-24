---
read_when:
    - คุณต้องการลูปการพัฒนาในเครื่องที่เร็วที่สุด (bun + watch)
    - คุณพบปัญหา Bun ในเรื่อง install/patch/lifecycle script
summary: 'เวิร์กโฟลว์ Bun (ทดลอง): การติดตั้งและข้อควรระวังเมื่อเทียบกับ pnpm'
title: Bun (ทดลอง)
x-i18n:
    generated_at: "2026-04-24T09:16:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
ไม่แนะนำให้ใช้ Bun กับ runtime ของ Gateway **ไม่แนะนำสำหรับ runtime ของ Gateway** (มีปัญหาที่ทราบกับ WhatsApp และ Telegram) ให้ใช้ Node สำหรับ production
</Warning>

Bun เป็น runtime ในเครื่องแบบเลือกได้สำหรับรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) ตัวจัดการแพ็กเกจค่าเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับเต็มรูปแบบและถูกใช้โดย tooling ของ docs ส่วน Bun ไม่สามารถใช้ `pnpm-lock.yaml` และจะเพิกเฉยมัน

## การติดตั้ง

<Steps>
  <Step title="ติดตั้ง dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูกใส่ไว้ใน gitignore ดังนั้นจะไม่ทำให้ repo เปลี่ยนแปลง หากต้องการข้ามการเขียน lockfile โดยสิ้นเชิง:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build และทดสอบ">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle Scripts

Bun จะบล็อก lifecycle script ของ dependency เว้นแต่จะเชื่อถืออย่างชัดเจน สำหรับ repo นี้ script ที่มักถูกบล็อกไม่ใช่สิ่งจำเป็น:

- `@whiskeysockets/baileys` `preinstall` -- ตรวจสอบว่า Node major >= 20 (OpenClaw ใช้ Node 24 เป็นค่าเริ่มต้นและยังรองรับ Node 22 LTS อยู่ ปัจจุบันคือ `22.14+`)
- `protobufjs` `postinstall` -- ปล่อยคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่ไม่เข้ากัน (ไม่มี build artifact)

หากคุณพบปัญหาขณะรันที่ต้องใช้ script เหล่านี้ ให้เชื่อถือมันอย่างชัดเจน:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## ข้อควรระวัง

บางสคริปต์ยังคง hardcode pnpm อยู่ (เช่น `docs:build`, `ui:*`, `protocol:check`) ให้รันสคริปต์เหล่านั้นผ่าน pnpm ไปก่อนในตอนนี้

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Node.js](/th/install/node)
- [การอัปเดต](/th/install/updating)
