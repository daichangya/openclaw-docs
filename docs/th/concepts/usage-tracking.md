---
read_when:
    - คุณกำลังเชื่อมต่อพื้นผิวการใช้งาน/โควตาของผู้ให้บริการ
    - คุณต้องอธิบายพฤติกรรมการติดตามการใช้งานหรือข้อกำหนดด้านการยืนยันตัวตน
summary: พื้นผิวการติดตามการใช้งานและข้อกำหนดด้านข้อมูลรับรอง
title: การติดตามการใช้งาน
x-i18n:
    generated_at: "2026-04-24T09:08:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## มันคืออะไร

- ดึงข้อมูลการใช้งาน/โควตาของผู้ให้บริการโดยตรงจาก usage endpoint ของผู้ให้บริการเหล่านั้น
- ไม่มีค่าใช้จ่ายโดยประมาณ; ใช้เฉพาะช่วงเวลาที่ผู้ให้บริการรายงานเท่านั้น
- เอาต์พุตสถานะแบบอ่านง่ายจะถูก normalize เป็น `X% left` เสมอ แม้ API ต้นทางจะรายงานเป็นโควตาที่ใช้ไป โควตาที่เหลืออยู่ หรือมีเพียงจำนวนดิบเท่านั้น
- `/status` และ `session_status` ระดับเซสชันสามารถ fallback ไปยังรายการการใช้งานล่าสุดใน transcript ได้เมื่อ live session snapshot มีข้อมูลน้อย fallback นั้นจะเติมตัวนับ token/cache ที่ขาดหายไป สามารถกู้ป้ายชื่อ runtime model ที่กำลังใช้งานอยู่ และจะเลือกยอดรวมที่เน้น prompt ซึ่งมากกว่าเมื่อ metadata ของเซสชันหายไปหรือมีค่าน้อยกว่า อย่างไรก็ตามค่าจริงแบบ live ที่ไม่เป็นศูนย์ซึ่งมีอยู่แล้วจะยังคงมีลำดับความสำคัญสูงกว่า

## มันแสดงที่ไหนบ้าง

- `/status` ในแชต: การ์ดสถานะที่มีอีโมจิจัดเต็ม พร้อม session token + ค่าใช้จ่ายโดยประมาณ (เฉพาะ API key) การใช้งานของผู้ให้บริการจะแสดงสำหรับ **ผู้ให้บริการ model ปัจจุบัน** เมื่อมีข้อมูล ในรูปแบบหน้าต่าง `X% left` ที่ normalize แล้ว
- `/usage off|tokens|full` ในแชต: ส่วนท้ายการใช้งานต่อการตอบกลับหนึ่งครั้ง (OAuth จะแสดงเฉพาะโทเค็น)
- `/usage cost` ในแชต: สรุปค่าใช้จ่ายแบบ local ที่รวมจากบันทึกเซสชันของ OpenClaw
- CLI: `openclaw status --usage` จะแสดงการแจกแจงแบบเต็มแยกตามผู้ให้บริการ
- CLI: `openclaw channels list` จะแสดง snapshot การใช้งานแบบเดียวกันควบคู่ไปกับ config ของผู้ให้บริการ (ใช้ `--no-usage` เพื่อข้าม)
- แถบเมนู macOS: ส่วน “Usage” ภายใต้ Context (เฉพาะเมื่อมีให้ใช้)

## ผู้ให้บริการ + ข้อมูลรับรอง

- **Anthropic (Claude)**: OAuth token ใน auth profile
- **GitHub Copilot**: OAuth token ใน auth profile
- **Gemini CLI**: OAuth token ใน auth profile
  - การใช้งานแบบ JSON จะ fallback ไปใช้ `stats`; `stats.cached` จะถูก normalize เป็น
    `cacheRead`
- **OpenAI Codex**: OAuth token ใน auth profile (ใช้ accountId เมื่อมี)
- **MiniMax**: API key หรือ auth profile แบบ MiniMax OAuth OpenClaw จะถือว่า
  `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน
  โดยจะให้ความสำคัญกับ MiniMax OAuth ที่จัดเก็บไว้ก่อนเมื่อมี และมิฉะนั้นจะ fallback
  ไปใช้ `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` หรือ `MINIMAX_API_KEY`
  ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่ **เหลืออยู่**
  ดังนั้น OpenClaw จะกลับค่ามันก่อนแสดงผล โดยฟิลด์แบบนับจำนวนจะมีลำดับความสำคัญเมื่อมี
  - ป้ายหน้าต่างของ coding-plan มาจากฟิลด์ hours/minutes ของผู้ให้บริการเมื่อมี จากนั้นจึง fallback ไปใช้ช่วง `start_time` / `end_time`
  - หาก endpoint ของ coding-plan คืนค่า `model_remains`, OpenClaw จะให้ความสำคัญกับรายการ chat-model, สร้างป้ายหน้าต่างจาก timestamp เมื่อไม่มีฟิลด์ `window_hours` / `window_minutes` แบบ explicit และรวมชื่อ model ไว้ในป้าย plan
- **Xiaomi MiMo**: API key ผ่าน env/config/auth store (`XIAOMI_API_KEY`)
- **z.ai**: API key ผ่าน env/config/auth store

การใช้งานจะถูกซ่อนเมื่อไม่สามารถ resolve auth สำหรับการใช้งานของผู้ให้บริการที่ใช้งานได้ ผู้ให้บริการสามารถมีตรรกะ auth สำหรับการใช้งานแบบเฉพาะ Plugin ได้; มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลรับรองแบบ OAuth/API-key จาก auth profile, ตัวแปรสภาพแวดล้อม หรือ config

## ที่เกี่ยวข้อง

- [การใช้โทเค็นและค่าใช้จ่าย](/th/reference/token-use)
- [การใช้งาน API และค่าใช้จ่าย](/th/reference/api-usage-costs)
- [Prompt caching](/th/reference/prompt-caching)
