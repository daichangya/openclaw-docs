---
read_when:
    - คุณต้องการทำความเข้าใจ OAuth ของ OpenClaw แบบครบวงจร end-to-end
    - คุณพบปัญหาโทเค็นไม่ถูกต้อง / การออกจากระบบ
    - คุณต้องการโฟลว์การยืนยันตัวตนของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการกำหนดเส้นทางตามโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-04-23T05:31:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4117fee70e3e64fd3a762403454ac2b78de695d2b85a7146750c6de615921e02
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw รองรับ “subscription auth” ผ่าน OAuth สำหรับผู้ให้บริการที่รองรับ
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic การแบ่งใช้งานในทางปฏิบัติ
ตอนนี้คือ:

- **Anthropic API key**: การคิดค่าบริการแบบ Anthropic API ปกติ
- **Anthropic Claude CLI / subscription auth ภายใน OpenClaw**: เจ้าหน้าที่ Anthropic
  แจ้งเราว่าการใช้งานลักษณะนี้ได้รับอนุญาตอีกครั้งแล้ว

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานในเครื่องมือภายนอกอย่าง
OpenClaw หน้านี้อธิบาย:

สำหรับ Anthropic ในสภาพแวดล้อม production แนวทางที่ปลอดภัยกว่าซึ่งแนะนำคือการใช้ API key auth

- วิธีการทำงานของ **การแลกเปลี่ยนโทเค็น** ของ OAuth (PKCE)
- ที่ที่ **จัดเก็บ** โทเค็น (และเหตุผล)
- วิธีจัดการ **หลายบัญชี** (profiles + การแทนที่รายเซสชัน)

OpenClaw ยังรองรับ **provider plugin** ที่มาพร้อมโฟลว์ OAuth หรือ API key
ของตัวเองด้วย ให้รันผ่าน:

```bash
openclaw models auth login --provider <id>
```

## token sink (เหตุผลที่มีสิ่งนี้)

ผู้ให้บริการ OAuth มักออก **refresh token ใหม่** ระหว่างโฟลว์ login/refresh ผู้ให้บริการบางราย (หรือ OAuth client บางตัว) อาจทำให้ refresh token เก่าใช้งานไม่ได้เมื่อมีการออกตัวใหม่สำหรับผู้ใช้/แอปเดียวกัน

อาการที่พบได้จริง:

- คุณล็อกอินผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → หลังจากนั้นตัวใดตัวหนึ่งอาจ “หลุดออกจากระบบ” แบบสุ่ม

เพื่อลดปัญหานี้ OpenClaw ปฏิบัติต่อ `auth-profiles.json` เสมือนเป็น **token sink**:

- runtime อ่านข้อมูลรับรองจาก **ที่เดียว**
- เราสามารถเก็บหลาย profile และกำหนดเส้นทางได้อย่างแน่นอน
- เมื่อมีการนำข้อมูลรับรองจาก CLI ภายนอกอย่าง Codex CLI มาใช้ซ้ำ OpenClaw
  จะทำมิเรอร์ข้อมูลพร้อมข้อมูลแหล่งที่มา และอ่านแหล่งภายนอกนั้นซ้ำแทน
  การหมุน refresh token ด้วยตัวเอง

## การจัดเก็บ (เก็บโทเค็นไว้ที่ใด)

ความลับจะถูกจัดเก็บ **แยกตามเอเจนต์**:

- โปรไฟล์ auth (OAuth + API keys + optional value-level refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ compatibility แบบเดิม: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (รายการ `api_key` แบบคงที่จะถูกล้างออกเมื่อพบ)

ไฟล์นำเข้าแบบเดิมที่ใช้เฉพาะนำเข้าเท่านั้น (ยังรองรับอยู่ แต่ไม่ใช่ที่เก็บหลัก):

- `~/.openclaw/credentials/oauth.json` (จะถูกนำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

ทั้งหมดข้างต้นยังรองรับ `$OPENCLAW_STATE_DIR` ด้วย (การแทนที่ state dir) ดูเอกสารอ้างอิงแบบเต็มได้ที่ [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ static secret refs และพฤติกรรมการเปิดใช้งาน runtime snapshot ดู [การจัดการ Secrets](/th/gateway/secrets)

## ความเข้ากันได้กับโทเค็นแบบเดิมของ Anthropic

<Warning>
เอกสารสาธารณะของ Claude Code จาก Anthropic ระบุว่าการใช้ Claude Code โดยตรงยังคงอยู่ภายในขีดจำกัดของการสมัครใช้งาน Claude และเจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้ Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้งแล้ว ดังนั้น OpenClaw
จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแผน Claude Code โดยตรงปัจจุบันของ Anthropic ดู [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบ subscription อื่นใน OpenClaw ดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/glm)
</Warning>

OpenClaw ยังเปิดให้ Anthropic setup-token เป็นเส้นทาง token-auth ที่รองรับ แต่ตอนนี้จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

## การย้ายมาใช้ Anthropic Claude CLI

OpenClaw รองรับการใช้ Anthropic Claude CLI ซ้ำอีกครั้ง หากคุณมี
Claude login ในเครื่องอยู่แล้วบนโฮสต์ onboarding/configure สามารถนำมาใช้ซ้ำได้โดยตรง

## การแลกเปลี่ยน OAuth (กระบวนการ login ทำงานอย่างไร)

โฟลว์ login แบบโต้ตอบของ OpenClaw ถูก implement ไว้ใน `@mariozechner/pi-ai` และเชื่อมเข้ากับ wizard/commands

### Anthropic setup-token

รูปแบบโฟลว์:

1. เริ่ม Anthropic setup-token หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บข้อมูลรับรอง Anthropic ที่ได้ไว้ใน auth profile
3. การเลือกโมเดลยังคงอยู่บน `anthropic/...`
4. โปรไฟล์ auth ของ Anthropic ที่มีอยู่แล้วยังคงพร้อมใช้งานสำหรับการย้อนกลับ/ควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานนอก Codex CLI รวมถึงเวิร์กโฟลว์ของ OpenClaw

รูปแบบโฟลว์ (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามรับ callback บน `http://127.0.0.1:1455/auth/callback`
4. หากไม่สามารถ bind callback ได้ (หรือคุณทำงานแบบ remote/headless) ให้ paste redirect URL/code
5. แลกเปลี่ยนที่ `https://auth.openai.com/oauth/token`
6. แยก `accountId` จาก access token และจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทาง wizard คือ `openclaw onboard` → ตัวเลือก auth `openai-codex`

## การรีเฟรช + การหมดอายุ

โปรไฟล์จะเก็บ timestamp ของ `expires`

ใน runtime:

- หาก `expires` ยังอยู่ในอนาคต → ใช้ access token ที่จัดเก็บไว้
- หากหมดอายุ → รีเฟรช (ภายใต้ file lock) และเขียนทับข้อมูลรับรองที่จัดเก็บไว้
- ข้อยกเว้น: ข้อมูลรับรองจาก CLI ภายนอกที่นำมาใช้ซ้ำยังคงถูกจัดการจากภายนอก; OpenClaw
  จะอ่าน auth store ของ CLI ซ้ำและจะไม่ใช้ refresh token ที่คัดลอกมาด้วยตัวเอง

โฟลว์การรีเฟรชเป็นแบบอัตโนมัติ; โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง

## หลายบัญชี (profiles) + การกำหนดเส้นทาง

มีสองรูปแบบ:

### 1) แบบที่แนะนำ: เอเจนต์แยกกัน

หากคุณต้องการให้ “ส่วนตัว” และ “ที่ทำงาน” ไม่ปะปนกันเลย ให้ใช้เอเจนต์แยกกัน (เซสชัน + ข้อมูลรับรอง + workspace แยกกัน):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth แยกตามเอเจนต์ (ผ่าน wizard) และกำหนดเส้นทางแชตไปยังเอเจนต์ที่ถูกต้อง

### 2) ขั้นสูง: หลาย profile ในหนึ่งเอเจนต์

`auth-profiles.json` รองรับ profile ID หลายตัวสำหรับผู้ให้บริการเดียวกัน

เลือกว่าจะใช้ profile ใดโดย:

- แบบส่วนกลางผ่านลำดับใน config (`auth.order`)
- รายเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (การแทนที่รายเซสชัน):

- `/model Opus@anthropic:work`

วิธีดูว่ามี profile ID อะไรอยู่บ้าง:

- `openclaw channels list --json` (จะแสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [/concepts/model-failover](/th/concepts/model-failover) (กฎการสลับหมุนเวียน + cooldown)
- [/tools/slash-commands](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [Authentication](/th/gateway/authentication) — ภาพรวมการยืนยันตัวตนของผู้ให้บริการโมเดล
- [Secrets](/th/gateway/secrets) — การจัดเก็บข้อมูลรับรองและ SecretRef
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#auth-storage) — คีย์ config ด้าน auth
