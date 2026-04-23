---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะ auth ของ provider
    - คุณต้องการสแกนโมเดล/provider ที่พร้อมใช้งานและดีบักโปรไฟล์ auth
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, ทางเลือกสำรอง, auth)
title: models
x-i18n:
    generated_at: "2026-04-23T06:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b057688266bcb72fc9719837ae6a026bed9849ff04577949467363d83b6d069
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น ทางเลือกสำรอง โปรไฟล์ auth)

ที่เกี่ยวข้อง:

- Providers + models: [Models](/th/providers/models)
- การตั้งค่า auth ของ provider: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งที่ใช้บ่อย

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่าเริ่มต้น/ทางเลือกสำรองที่ resolve แล้วพร้อมภาพรวม auth
เมื่อมี snapshot การใช้งาน provider พร้อมใช้งาน ส่วนสถานะ OAuth/API key จะรวม
ช่วงหน้าต่างการใช้งานของ provider และ snapshot โควตา
provider ที่รองรับหน้าต่างการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai auth การใช้งานมาจาก hook เฉพาะของ provider
เมื่อมีให้ใช้; มิฉะนั้น OpenClaw จะใช้ทางเลือกสำรองโดยจับคู่ข้อมูลรับรอง OAuth/API-key
จากโปรไฟล์ auth, env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวม provider
ที่รับรู้ env/config/store ขณะที่ `auth.oauth` คือสถานะความสมบูรณ์ของโปรไฟล์ auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรันการ probe auth แบบสดกับแต่ละโปรไฟล์ provider ที่ตั้งค่าไว้
การ probe เป็นคำขอจริง (อาจใช้โทเค็นและทำให้ติด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะ model/auth ของ agent ที่ตั้งค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากมีการตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่ตั้งค่าไว้
แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลรับรอง env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รองรับ `provider/model` หรือ alias
- `models list --all` รวมแถวแค็ตตาล็อกแบบคงที่ที่เป็นของ provider ที่มาพร้อมระบบด้วย แม้ว่า
  คุณจะยังไม่ได้ยืนยันตัวตนกับ provider นั้นก็ตาม แถวเหล่านั้นยังคงแสดง
  ว่าไม่พร้อมใช้งานจนกว่าจะตั้งค่า auth ที่ตรงกัน
- การแยกวิเคราะห์ model ref ทำโดยแบ่งที่ `/` **ตัวแรก** หาก model ID มี `/` อยู่ด้วย (สไตล์ OpenRouter) ให้ใส่คำนำหน้า provider ด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณไม่ระบุ provider, OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นการจับคู่ configured-provider แบบไม่ซ้ำสำหรับ model id ที่ตรงกันแบบเป๊ะ และหลังจากนั้นเท่านั้น
  จึงจะใช้ provider เริ่มต้นที่ตั้งค่าไว้เป็นทางเลือกสำรองพร้อมคำเตือนการเลิกใช้
  หาก provider นั้นไม่ได้เปิดเผยโมเดลเริ่มต้นที่ตั้งค่าไว้อีกต่อไป OpenClaw
  จะใช้ provider/model ตัวแรกที่ตั้งค่าไว้เป็นทางเลือกสำรองแทนที่จะคงค่าเริ่มต้นของ provider ที่ถูกลบออกไปแล้ว
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุต auth สำหรับ placeholder ที่ไม่ใช่ความลับ (ตัวอย่างเช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการปิดบังเป็นข้อมูลลับ

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (รหัสออก 1=หมดอายุ/ไม่มี, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์ auth ที่ตั้งค่าไว้)
- `--probe-provider <name>` (probe หนึ่ง provider)
- `--probe-profile <id>` (ใช้ซ้ำได้หรือคั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID ของ agent ที่ตั้งค่าไว้; แทนที่ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีรายละเอียด/รหัสเหตุผลของ probe ที่ควรคาดว่าจะพบ:

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่
  `auth.order.<provider>` ที่กำหนดอย่างชัดเจนไม่ได้รวมโปรไฟล์นั้นไว้ ดังนั้น probe จึงรายงานการยกเว้นแทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่ แต่ไม่มีสิทธิ์/ไม่สามารถ resolve ได้
- `no_model`: มี auth ของ provider อยู่ แต่ OpenClaw ไม่สามารถ resolve
  ตัวเลือกโมเดลที่ probe ได้สำหรับ provider นั้น

## Alias + ทางเลือกสำรอง

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์ auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` เป็นตัวช่วย auth แบบโต้ตอบ สามารถเปิดโฟลว์ auth ของ provider
(OAuth/API key) หรือแนะนำให้คุณวางโทเค็นด้วยตนเอง ขึ้นอยู่กับ
provider ที่คุณเลือก

`models auth login` รันโฟลว์ auth ของ Plugin provider (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามี provider ใดติดตั้งอยู่บ้าง

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่งโทเค็นทั่วไปสำหรับ provider
  ที่เปิดเผยวิธี auth แบบโทเค็น
- `setup-token` ต้องใช้ TTY แบบโต้ตอบ และจะรันวิธี token-auth ของ provider
  (โดยค่าเริ่มต้นจะใช้เมธอด `setup-token` ของ provider นั้นเมื่อมี
  เมธอดดังกล่าว)
- `paste-token` รับสตริงโทเค็นที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องระบุ `--provider`, จะถามค่าของโทเค็น และเขียน
  ไปยัง ID โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณจะระบุ
  `--profile-id`
- `paste-token --expires-in <duration>` จะจัดเก็บเวลาหมดอายุสัมบูรณ์ของโทเค็นจาก
  ระยะเวลาแบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- `setup-token` / `paste-token` ของ Anthropic ยังคงพร้อมใช้งานในฐานะเส้นทางโทเค็น OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อพร้อมใช้งาน
