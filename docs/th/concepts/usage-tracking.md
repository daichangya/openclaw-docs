---
read_when:
    - คุณกำลังเชื่อมพื้นผิวการใช้งาน/โควตาของผู้ให้บริการ
    - คุณต้องอธิบายพฤติกรรมการติดตามการใช้งานหรือข้อกำหนดด้านการยืนยันตัวตน
summary: พื้นผิวการติดตามการใช้งานและข้อกำหนดด้าน credentials
title: การติดตามการใช้งาน
x-i18n:
    generated_at: "2026-04-23T05:32:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# การติดตามการใช้งาน

## คืออะไร

- ดึงข้อมูลการใช้งาน/โควตาของผู้ให้บริการโดยตรงจาก endpoint การใช้งานของผู้ให้บริการ
- ไม่มีการประเมินค่าใช้จ่าย มีเฉพาะช่วงข้อมูลที่ผู้ให้บริการรายงานเท่านั้น
- ผลลัพธ์สถานะแบบอ่านง่ายสำหรับมนุษย์จะถูก normalize เป็น `X% left` เสมอ แม้ว่า
  API ต้นทางจะรายงานเป็นโควตาที่ใช้ไป โควตาที่เหลือ หรือมีเพียงจำนวนดิบเท่านั้น
- `/status` ระดับเซสชันและ `session_status` สามารถ fallback ไปใช้
  รายการ usage ล่าสุดใน transcript ได้ เมื่อสแนปชอตเซสชันสดมีข้อมูลบางเกินไป
  fallback นี้จะเติมค่า token/cache counter ที่หายไป สามารถกู้คืนป้ายชื่อโมเดล runtime
  ที่กำลังใช้งาน และจะเลือกค่ารวมที่เน้น prompt ซึ่งมีขนาดมากกว่าเมื่อเมทาดาทาของเซสชันไม่มีหรือมีค่าน้อยกว่า อย่างไรก็ตามค่าที่มีอยู่แล้วแบบ nonzero จากข้อมูลสดจะยังคงชนะ

## แสดงที่ไหนบ้าง

- `/status` ในแชต: การ์ดสถานะพร้อมอีโมจิที่แสดงโทเคนของเซสชัน + ค่าใช้จ่ายโดยประมาณ (เฉพาะ API key) การใช้งานของผู้ให้บริการจะแสดงสำหรับ **ผู้ให้บริการโมเดลปัจจุบัน** เมื่อมี ในรูปแบบหน้าต่าง `X% left` ที่ normalize แล้ว
- `/usage off|tokens|full` ในแชต: footer การใช้งานต่อคำตอบ (OAuth แสดงเฉพาะโทเคน)
- `/usage cost` ในแชต: สรุปค่าใช้จ่ายภายในเครื่องที่รวมจาก log เซสชันของ OpenClaw
- CLI: `openclaw status --usage` พิมพ์รายละเอียดแยกตามผู้ให้บริการแบบเต็ม
- CLI: `openclaw channels list` พิมพ์สแนปชอตการใช้งานเดียวกันควบคู่กับคอนฟิกของผู้ให้บริการ (ใช้ `--no-usage` เพื่อข้าม)
- แถบเมนูของ macOS: ส่วน “Usage” ภายใต้ Context (เฉพาะเมื่อมีข้อมูล)

## ผู้ให้บริการ + credentials

- **Anthropic (Claude)**: OAuth token ใน auth profile
- **GitHub Copilot**: OAuth token ใน auth profile
- **Gemini CLI**: OAuth token ใน auth profile
  - การใช้งานแบบ JSON จะ fallback ไปใช้ `stats`; `stats.cached` จะถูก normalize เป็น
    `cacheRead`
- **OpenAI Codex**: OAuth token ใน auth profile (ใช้ accountId เมื่อมี)
- **MiniMax**: API key หรือ MiniMax OAuth auth profile OpenClaw ถือว่า
  `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน
  โดยจะเลือก MiniMax OAuth ที่เก็บไว้ก่อนเมื่อมี และหากไม่มีจึง fallback
  ไปใช้ `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` หรือ `MINIMAX_API_KEY`
  ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตา**ที่เหลือ**
  ดังนั้น OpenClaw จะกลับค่าก่อนแสดงผล และหากมีฟิลด์แบบนับจำนวน ระบบจะใช้ฟิลด์เหล่านั้นก่อน
  - ป้ายชื่อหน้าต่างของ coding-plan จะมาจากฟิลด์ชั่วโมง/นาทีของผู้ให้บริการเมื่อมี จากนั้นจึง fallback ไปใช้ช่วง `start_time` / `end_time`
  - หาก endpoint ของ coding-plan ส่งกลับ `model_remains` OpenClaw จะเลือก
    รายการของ chat model ก่อน อนุมานป้ายชื่อหน้าต่างจาก timestamp เมื่อไม่มีฟิลด์
    `window_hours` / `window_minutes` แบบ explicit และรวมชื่อโมเดลไว้ในป้ายชื่อแผนด้วย
- **Xiaomi MiMo**: API key ผ่าน env/config/auth store (`XIAOMI_API_KEY`)
- **z.ai**: API key ผ่าน env/config/auth store

ข้อมูลการใช้งานจะถูกซ่อนเมื่อไม่สามารถ resolve ข้อมูลยืนยันตัวตนสำหรับการใช้งานของผู้ให้บริการได้
ผู้ให้บริการสามารถมีตรรกะการยืนยันตัวตนสำหรับการใช้งานแบบเฉพาะของ Plugin ได้; หากไม่มี OpenClaw จะ fallback ไปจับคู่ credentials แบบ OAuth/API key จาก auth profile, ตัวแปรสภาพแวดล้อม หรือคอนฟิก
