---
read_when:
    - |-
      คุณต้องการเข้าใจ OAuth ของ OpenClaw แบบครบวงจร	RTLUanalysis to=commentary.read  天天中彩票怎么买json
      {"path":"/home/runner/work/docs/docs/source/.i18n/glossary.th.json","offset":1,"limit":200}
    - คุณพบปัญหาโทเค็นถูกทำให้ใช้งานไม่ได้ / ถูกออกจากระบบ
    - คุณต้องการโฟลว์ auth ของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการ route ตามโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T09:07:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw รองรับ “subscription auth” ผ่าน OAuth สำหรับ provider ที่มีให้ใช้
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic ตอนนี้การแบ่งการใช้งาน
ในทางปฏิบัติคือ:

- **Anthropic API key**: การคิดค่าบริการแบบ Anthropic API ปกติ
- **Anthropic Claude CLI / subscription auth ภายใน OpenClaw**: ทีมงาน Anthropic
  แจ้งกับเราว่าการใช้งานลักษณะนี้ได้รับอนุญาตอีกครั้งแล้ว

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานในเครื่องมือภายนอก เช่น
OpenClaw หน้านี้อธิบายเรื่องต่อไปนี้:

สำหรับ Anthropic ในการใช้งานจริง การยืนยันตัวตนด้วย API key ยังคงเป็นแนวทางที่ปลอดภัยกว่าและแนะนำมากกว่า

- การทำงานของ **token exchange** ใน OAuth (PKCE)
- **จัดเก็บโทเค็น** ไว้ที่ใด (และเพราะเหตุใด)
- วิธีจัดการ **หลายบัญชี** (profiles + การ override ต่อเซสชัน)

OpenClaw ยังรองรับ **provider plugins** ที่มาพร้อมโฟลว์ OAuth หรือ API‑key
ของตนเองด้วย ให้รันผ่าน:

```bash
openclaw models auth login --provider <id>
```

## token sink (เหตุผลที่มีสิ่งนี้)

provider OAuth มักจะออก **refresh token ใหม่** ระหว่างขั้นตอน login/refresh provider บางราย (หรือ OAuth clients บางตัว) อาจทำให้ refresh tokens รุ่นเก่าใช้ไม่ได้เมื่อมีการออกตัวใหม่สำหรับผู้ใช้/แอปเดียวกัน

อาการที่พบได้จริง:

- คุณล็อกอินผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → ภายหลังจะมีตัวใดตัวหนึ่งโดน “ออกจากระบบ” แบบสุ่ม

เพื่อลดปัญหานั้น OpenClaw จึงมอง `auth-profiles.json` เป็น **token sink**:

- runtime จะอ่าน credentials จาก **ที่เดียว**
- เราสามารถเก็บหลาย profiles และ route การใช้งานได้อย่างกำหนดแน่นอน
- เมื่อมีการนำ credentials จาก CLI ภายนอกอย่าง Codex CLI มาใช้ซ้ำ OpenClaw
  จะ mirror ข้อมูลเหล่านั้นพร้อม provenance และอ่านจากแหล่งภายนอกนั้นใหม่ แทนที่จะ
  หมุน refresh token เอง

## การจัดเก็บ (โทเค็นอยู่ที่ไหน)

secrets จะถูกเก็บ **แยกตามเอเจนต์**:

- Auth profiles (OAuth + API keys + value-level refs แบบไม่บังคับ): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ compatibility แบบ legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` แบบคงที่จะถูก scrub เมื่อพบ)

ไฟล์ legacy สำหรับนำเข้าเท่านั้น (ยังรองรับอยู่ แต่ไม่ใช่ที่จัดเก็บหลัก):

- `~/.openclaw/credentials/oauth.json` (จะถูกนำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

ทั้งหมดข้างต้นยังรองรับ `$OPENCLAW_STATE_DIR` ด้วย (override state dir) ข้อมูลอ้างอิงแบบเต็ม: [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ static secret refs และพฤติกรรมการเปิดใช้งาน runtime snapshot โปรดดู [Secrets Management](/th/gateway/secrets)

## ความเข้ากันได้กับโทเค็น Anthropic แบบ legacy

<Warning>
เอกสาร Claude Code สาธารณะของ Anthropic ระบุว่าการใช้ Claude Code โดยตรงยังคงอยู่ภายใน
ขีดจำกัดของแพ็กเกจ Claude subscription และทีมงาน Anthropic ได้แจ้งกับเราว่าการใช้ Claude
CLI ในลักษณะ OpenClaw ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและ
การใช้ `claude -p` เป็นสิ่งที่ได้รับอนุญาตสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแพ็กเกจ direct-Claude-Code ปัจจุบันของ Anthropic ดูได้ที่ [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบ subscription อื่นๆ ใน OpenClaw โปรดดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/glm)
</Warning>

OpenClaw ยังเปิดให้ใช้ Anthropic setup-token เป็นเส้นทาง token-auth ที่รองรับด้วย แต่ตอนนี้จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

## การย้ายไปใช้ Anthropic Claude CLI

OpenClaw รองรับการใช้ Anthropic Claude CLI ซ้ำอีกครั้งแล้ว หากคุณมี
Claude login อยู่ในโฮสต์อยู่แล้ว onboarding/configure สามารถนำมาใช้ซ้ำได้โดยตรง

## OAuth exchange (การล็อกอินทำงานอย่างไร)

โฟลว์ interactive login ของ OpenClaw ถูก implement อยู่ใน `@mariozechner/pi-ai` และเชื่อมเข้ากับ wizards/commands

### Anthropic setup-token

ลักษณะของโฟลว์:

1. เริ่ม Anthropic setup-token หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บ Anthropic credential ที่ได้ไว้ใน auth profile
3. การเลือก model ยังคงอยู่บน `anthropic/...`
4. auth profiles ของ Anthropic ที่มีอยู่เดิมยังคงพร้อมให้ใช้งานสำหรับ rollback/ควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานนอก Codex CLI รวมถึงเวิร์กโฟลว์ของ OpenClaw

ลักษณะของโฟลว์ (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามรับ callback ที่ `http://127.0.0.1:1455/auth/callback`
4. หาก bind callback ไม่ได้ (หรือคุณใช้งานแบบ remote/headless) ให้วาง redirect URL/code
5. แลกเปลี่ยนที่ `https://auth.openai.com/oauth/token`
6. ดึง `accountId` จาก access token แล้วจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทางใน wizard คือ `openclaw onboard` → ตัวเลือก auth `openai-codex`

## การรีเฟรช + การหมดอายุ

profiles จะเก็บ timestamp ของ `expires`

ขณะ runtime:

- หาก `expires` ยังอยู่ในอนาคต → ใช้ access token ที่เก็บไว้
- หากหมดอายุแล้ว → รีเฟรช (ภายใต้ file lock) และเขียนทับ credentials ที่เก็บไว้
- ข้อยกเว้น: credentials จาก CLI ภายนอกที่นำมาใช้ซ้ำจะยังคงถูกจัดการจากภายนอก; OpenClaw
  จะอ่านที่เก็บ auth ของ CLI ใหม่และจะไม่ใช้ refresh token ที่คัดลอกมาด้วยตนเอง

โฟลว์การรีเฟรชเป็นแบบอัตโนมัติ โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นเอง

## หลายบัญชี (profiles) + การ route

มี 2 รูปแบบ:

### 1) แนะนำ: แยกเอเจนต์

หากคุณต้องการให้ “personal” และ “work” ไม่เกี่ยวข้องกันเลย ให้ใช้เอเจนต์ที่แยกออกจากกัน (แยกเซสชัน + credentials + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth แยกตามเอเจนต์ (wizard) และ route แชตไปยังเอเจนต์ที่ถูกต้อง

### 2) ขั้นสูง: หลาย profiles ภายในเอเจนต์เดียว

`auth-profiles.json` รองรับหลาย profile IDs สำหรับ provider เดียวกัน

เลือก profile ที่จะใช้ได้โดย:

- แบบ global ผ่านลำดับใน config (`auth.order`)
- แบบต่อเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (override ต่อเซสชัน):

- `/model Opus@anthropic:work`

วิธีดูว่ามี profile IDs อะไรอยู่บ้าง:

- `openclaw channels list --json` (แสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [/concepts/model-failover](/th/concepts/model-failover) (กฎการหมุนเวียน + cooldown)
- [/tools/slash-commands](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [Authentication](/th/gateway/authentication) — ภาพรวม auth ของ model provider
- [Secrets](/th/gateway/secrets) — การจัดเก็บ credentials และ SecretRef
- [Configuration Reference](/th/gateway/configuration-reference#auth-storage) — คีย์ config สำหรับ auth
