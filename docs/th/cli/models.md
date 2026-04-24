---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของ provider
    - คุณต้องการสแกนโมเดล/ provider ที่ใช้งานได้และแก้ปัญหาโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, alias, fallback, auth)
title: โมเดล
x-i18n:
    generated_at: "2026-04-24T09:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น, fallback, โปรไฟล์การยืนยันตัวตน)

ที่เกี่ยวข้อง:

- Provider + โมเดล: [Models](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดเกี่ยวกับโมเดล](/th/concepts/models)
- การตั้งค่าการยืนยันตัวตนของ provider: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งที่ใช้บ่อย

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` จะแสดงค่า default/fallback ที่ resolve แล้ว พร้อมภาพรวมของการยืนยันตัวตน
เมื่อมี snapshot การใช้งานของ provider พร้อมใช้งาน ส่วนสถานะ OAuth/API-key จะรวม
ช่วงเวลาการใช้งานและ snapshot โควตาของ provider ด้วย
ปัจจุบัน provider ที่มี usage window ได้แก่: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai ข้อมูลยืนยันตัวตนสำหรับ usage มาจาก hook เฉพาะของ provider
เมื่อมี; หากไม่มี OpenClaw จะ fallback ไปจับคู่ข้อมูลรับรอง OAuth/API-key
จาก auth profile, env หรือ config
ในผลลัพธ์ `--json`, `auth.providers` คือภาพรวมของ provider ที่รับรู้ env/config/store
ขณะที่ `auth.oauth` เป็นเฉพาะสุขภาพของโปรไฟล์ใน auth store เท่านั้น
เพิ่ม `--probe` เพื่อรัน auth probe แบบ live กับแต่ละ provider profile ที่กำหนดค่าไว้
probe เป็นคำขอจริง (อาจใช้โทเค็นและกระตุ้น rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะ model/auth ของเอเจนต์ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากมีการตั้งค่าไว้ มิฉะนั้นจะใช้
เอเจนต์เริ่มต้นที่กำหนดค่าไว้
แถวของ probe อาจมาจาก auth profile, ข้อมูลรับรองใน env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รับค่าเป็น `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: มันอ่าน config, auth profile, สถานะแค็ตตาล็อก
  ที่มีอยู่ และแถวแค็ตตาล็อกที่ provider เป็นเจ้าของ แต่จะไม่เขียนทับ
  `models.json`
- `models list --all` จะรวมแถว static catalog ที่ provider เป็นเจ้าของซึ่งมาพร้อมระบบด้วย
  แม้ว่าคุณจะยังไม่ได้ยืนยันตัวตนกับ provider นั้นก็ตาม แถวเหล่านั้นยังคงแสดง
  ว่าใช้งานไม่ได้จนกว่าจะมีการกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list --provider <id>` ใช้กรองตาม provider id เช่น `moonshot` หรือ
  `openai-codex` โดยไม่รับ label ที่ใช้แสดงผลจากตัวเลือก provider แบบโต้ตอบ
  เช่น `Moonshot AI`
- การ parse model ref จะทำโดยแยกที่ `/` **ตัวแรก** หาก model ID มี `/` อยู่ด้วย (แบบ OpenRouter) ให้ใส่ provider prefix ด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณไม่ระบุ provider OpenClaw จะ resolve ข้อมูลนำเข้าดังกล่าวเป็น alias ก่อน จากนั้น
  เป็นการจับคู่แบบไม่กำกวมกับ provider ที่กำหนดค่าไว้สำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นเท่านั้นจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือนว่าเลิกใช้แล้ว
  หาก provider นั้นไม่ได้เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยัง provider/model รายการแรกที่กำหนดค่าไว้ แทนการแสดงค่าเริ่มต้นของ provider เก่าที่ถูกลบไปแล้ว
- `models status` อาจแสดง `marker(<value>)` ในผลลัพธ์ auth สำหรับ placeholder ที่ไม่ใช่ความลับ (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็นความลับ

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ไม่มี, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบ live ของ auth profile ที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe provider เดียว)
- `--probe-profile <id>` (ใช้ซ้ำได้หรือคั่นด้วย comma สำหรับหลาย profile id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id ของเอเจนต์ที่กำหนดค่าไว้; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

กลุ่มสถานะของ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณี detail/reason-code ของ probe ที่ควรคาดว่าจะพบ:

- `excluded_by_auth_order`: มี stored profile อยู่ แต่ `auth.order.<provider>` แบบ explicit
  ไม่ได้รวมมันไว้ ดังนั้น probe จะรายงานการยกเว้นนี้แทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มี profile อยู่ แต่ยังไม่มีคุณสมบัติใช้งานหรือ resolve ไม่ได้
- `no_model`: มีการยืนยันตัวตนของ provider อยู่ แต่ OpenClaw ไม่สามารถ resolve
  candidate โมเดลที่ probe ได้สำหรับ provider นั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profile

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` คือตัวช่วยการยืนยันตัวตนแบบโต้ตอบ มันสามารถเริ่มโฟลว์การยืนยันตัวตนของ provider
(OAuth/API key) หรือแนะนำคุณไปยังการวางโทเค็นด้วยตนเอง ขึ้นอยู่กับ provider
ที่คุณเลือก

`models auth login` จะรันโฟลว์การยืนยันตัวตนของ provider plugin (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่า provider ใดติดตั้งอยู่บ้าง

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่งโทเค็นแบบทั่วไปสำหรับ provider
  ที่เปิดเผยวิธีการยืนยันตัวตนด้วยโทเค็น
- `setup-token` ต้องใช้ TTY แบบโต้ตอบ และจะรันวิธี token-auth ของ provider
  (โดยใช้วิธี `setup-token` ของ provider นั้นเป็นค่าปริยาย เมื่อ provider เปิดเผยวิธีนี้ไว้)
- `paste-token` รับสตริงโทเค็นที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องใช้ `--provider`, จะพรอมป์ให้ใส่ค่าโทเค็น และเขียน
  ไปยัง profile id ค่าปริยาย `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จะจัดเก็บเวลาหมดอายุของโทเค็นแบบสัมบูรณ์จาก
  ระยะเวลาแบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุเกี่ยวกับ Anthropic: พนักงานของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- `setup-token` / `paste-token` ของ Anthropic ยังคงใช้งานได้เป็นเส้นทางโทเค็นที่ OpenClaw รองรับ แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมี

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
