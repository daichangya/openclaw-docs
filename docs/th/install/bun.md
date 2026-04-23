---
read_when:
    - คุณต้องการลูปพัฒนาในเครื่องที่เร็วที่สุด (bun + watch)
    - คุณเจอปัญหา Bun กับการติดตั้ง/patch/lifecycle script【อ่านข้อความเต็มanalysis to=final  天天中奖彩票 ӡомინდა translate only.
summary: 'เวิร์กโฟลว์ของ Bun (experimental): การติดตั้งและข้อควรระวังเทียบกับ pnpm'
title: Bun (Experimental)
x-i18n:
    generated_at: "2026-04-23T05:38:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (Experimental)

<Warning>
ไม่แนะนำให้ใช้ Bun สำหรับรันไทม์ของ Gateway** (มีปัญหาที่ทราบแล้วกับ WhatsApp และ Telegram) ให้ใช้ Node สำหรับงาน production
</Warning>

Bun เป็นรันไทม์ภายในเครื่องแบบไม่บังคับสำหรับการรัน TypeScript โดยตรง (`bun run ...`, `bun --watch ...`) package manager ค่าเริ่มต้นยังคงเป็น `pnpm` ซึ่งรองรับเต็มรูปแบบและใช้โดยเครื่องมือเอกสาร Bun ไม่สามารถใช้ `pnpm-lock.yaml` ได้และจะเพิกเฉยต่อไฟล์นี้

## ติดตั้ง

<Steps>
  <Step title="ติดตั้ง dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` ถูกใส่ไว้ใน gitignore ดังนั้นจะไม่ทำให้รีโปมีการเปลี่ยนแปลงที่ไม่จำเป็น หากต้องการข้ามการเขียน lockfile ไปทั้งหมด:

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

Bun จะบล็อก lifecycle script ของ dependency เว้นแต่จะเชื่อถืออย่างชัดเจน สำหรับรีโปนี้ script ที่มักถูกบล็อกนั้นไม่จำเป็น:

- `@whiskeysockets/baileys` `preinstall` -- ตรวจสอบว่า Node เวอร์ชันหลัก >= 20 (OpenClaw ใช้ Node 24 เป็นค่าเริ่มต้น และยังรองรับ Node 22 LTS ซึ่งปัจจุบันคือ `22.14+`)
- `protobufjs` `postinstall` -- แสดงคำเตือนเกี่ยวกับรูปแบบเวอร์ชันที่เข้ากันไม่ได้ (ไม่มี build artifact)

หากคุณเจอปัญหารันไทม์ที่ต้องใช้ script เหล่านี้ ให้เชื่อถืออย่างชัดเจน:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## ข้อควรระวัง

บางสคริปต์ยังคง hardcode `pnpm` อยู่ (เช่น `docs:build`, `ui:*`, `protocol:check`) ตอนนี้ให้รันสคริปต์เหล่านั้นผ่าน `pnpm` ไปก่อน
