---
read_when:
    - การวินิจฉัยการสลับโปรไฟล์การยืนยันตัวตน ช่วงคูลดาวน์ หรือพฤติกรรมการย้อนกลับของโมเดล
    - การอัปเดตกฎการสลับสำรองสำหรับโปรไฟล์การยืนยันตัวตนหรือโมเดล
    - การทำความเข้าใจว่าการกำหนดแทนโมเดลของเซสชันทำงานร่วมกับการลองซ้ำแบบย้อนกลับอย่างไร
summary: วิธีที่ OpenClaw สลับโปรไฟล์การยืนยันตัวตนและย้อนกลับข้ามโมเดลต่าง ๆ
title: การสลับสำรองของโมเดล
x-i18n:
    generated_at: "2026-04-24T09:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw จัดการความล้มเหลวเป็น 2 ขั้นตอน:

1. **การสลับโปรไฟล์การยืนยันตัวตน** ภายใน provider ปัจจุบัน
2. **การย้อนกลับของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

เอกสารนี้อธิบายกฎของ runtime และข้อมูลที่ใช้รองรับการทำงานดังกล่าว

## โฟลว์ขณะรัน

สำหรับการรันข้อความปกติ OpenClaw จะประเมิน candidates ตามลำดับนี้:

1. โมเดลของเซสชันที่ถูกเลือกอยู่ในปัจจุบัน
2. `agents.defaults.model.fallbacks` ที่กำหนดค่าไว้ตามลำดับ
3. โมเดลหลักที่กำหนดค่าไว้ในตอนท้าย หากการรันเริ่มต้นจาก override

ภายใน candidate แต่ละตัว OpenClaw จะลองทำ auth-profile failover ก่อนที่จะไปยัง
model candidate ถัดไป

ลำดับขั้นตอนระดับสูง:

1. resolve โมเดลของเซสชันที่ใช้งานอยู่และค่าที่ต้องการของ auth profile
2. สร้างห่วงโซ่ model candidate
3. ลอง provider ปัจจุบันด้วยกฎการสลับ/cooldown ของ auth profile
4. หาก provider นั้นหมดทางเลือกด้วยข้อผิดพลาดที่ควรทำ failover ให้ย้ายไปยัง
   model candidate ถัดไป
5. บันทึก fallback override ที่เลือกไว้ก่อนเริ่ม retry เพื่อให้ผู้อ่านเซสชันอื่นเห็น provider/model เดียวกันกับที่ runner กำลังจะใช้
6. หาก fallback candidate ล้มเหลว ให้ย้อนกลับเฉพาะฟิลด์ session override ที่ fallback เป็นเจ้าของ เมื่อฟิลด์เหล่านั้นยังคงตรงกับ candidate ที่ล้มเหลวนั้น
7. หากทุก candidate ล้มเหลว ให้โยน `FallbackSummaryError` พร้อมรายละเอียดรายครั้งที่พยายาม และเวลาหมดอายุ cooldown ที่ใกล้ที่สุดเมื่อทราบ

สิ่งนี้ตั้งใจให้แคบกว่าการ "บันทึกและกู้คืนทั้งเซสชัน" ตัว
reply runner จะบันทึกเฉพาะฟิลด์การเลือกโมเดลที่มันเป็นเจ้าของสำหรับ fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

นั่นช่วยป้องกันไม่ให้การ retry ของ fallback ที่ล้มเหลวไปเขียนทับการเปลี่ยนแปลงอื่นในเซสชันที่ใหม่กว่า เช่นการเปลี่ยน `/model` ด้วยตนเองหรือการอัปเดต session rotation ที่เกิดขึ้นระหว่างที่ความพยายามนั้นกำลังรัน

## ที่เก็บข้อมูลการยืนยันตัวตน (keys + OAuth)

OpenClaw ใช้ **auth profiles** สำหรับทั้ง API keys และ OAuth tokens

- Secrets อยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (แบบเดิม: `~/.openclaw/agent/auth-profiles.json`)
- สถานะ auth-routing ระหว่างรันอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- Config `auth.profiles` / `auth.order` เป็นเพียง **metadata + routing เท่านั้น** (ไม่มี secrets)
- ไฟล์ OAuth แบบเดิมที่ใช้สำหรับนำเข้าเท่านั้น: `~/.openclaw/credentials/oauth.json` (จะถูกนำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)

ประเภทข้อมูลรับรอง:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` สำหรับบาง provider)

## Profile IDs

การล็อกอิน OAuth จะสร้าง profiles แยกกันเพื่อให้หลายบัญชีอยู่ร่วมกันได้

- ค่าเริ่มต้น: `provider:default` เมื่อไม่มี email ให้ใช้
- OAuth ที่มี email: `provider:<email>` (ตัวอย่างเช่น `google-antigravity:user@gmail.com`)

Profiles จะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ภายใต้ `profiles`

## ลำดับการสลับ

เมื่อ provider มีหลาย profiles OpenClaw จะเลือกลำดับดังนี้:

1. **Config แบบชัดเจน**: `auth.order[provider]` (หากตั้งไว้)
2. **Profiles ที่กำหนดค่าไว้**: `auth.profiles` ที่กรองตาม provider
3. **Profiles ที่จัดเก็บไว้**: entries ใน `auth-profiles.json` สำหรับ provider นั้น

หากไม่มีการกำหนดลำดับแบบชัดเจน OpenClaw จะใช้ลำดับแบบ round‑robin:

- **คีย์หลัก:** ประเภท profile (**OAuth มาก่อน API keys**)
- **คีย์รอง:** `usageStats.lastUsed` (เก่าสุดก่อน ภายในแต่ละประเภท)
- **Profiles ที่อยู่ใน cooldown/disabled** จะถูกย้ายไปไว้ท้ายสุด โดยเรียงตามเวลาหมดอายุที่ใกล้ที่สุด

### Session stickiness (เป็นมิตรกับแคช)

OpenClaw จะ **ตรึง auth profile ที่เลือกไว้ต่อเซสชัน** เพื่อให้แคชของ provider อุ่นอยู่
โดยจะ **ไม่** สลับในทุกคำขอ profile ที่ตรึงไว้จะถูกใช้ซ้ำจนกว่า:

- เซสชันจะถูกรีเซ็ต (`/new` / `/reset`)
- มีการทำ compaction เสร็จสิ้น (จำนวน compaction เพิ่มขึ้น)
- profile นั้นอยู่ใน cooldown/disabled

การเลือกด้วยตนเองผ่าน `/model …@<profileId>` จะตั้งค่า **user override** สำหรับเซสชันนั้น
และจะไม่ถูกสลับอัตโนมัติจนกว่าเซสชันใหม่จะเริ่มขึ้น

profiles ที่ถูกตรึงอัตโนมัติ (เลือกโดย session router) จะถือเป็น **ค่าที่ต้องการ**:
ระบบจะลอง profile นั้นก่อน แต่ OpenClaw อาจสลับไปยัง profile อื่นเมื่อเจอ rate limits/timeouts
ส่วน profiles ที่ผู้ใช้ตรึงไว้จะถูกล็อกไว้กับ profile นั้น; หากล้มเหลวและมีการกำหนด
model fallbacks ไว้ OpenClaw จะย้ายไปยังโมเดลถัดไปแทนการสลับ profiles

### เหตุใด OAuth จึงอาจ "ดูเหมือนหายไป"

หากคุณมีทั้ง OAuth profile และ API key profile สำหรับ provider เดียวกัน round‑robin อาจสลับระหว่างสองอย่างนี้ข้ามข้อความต่าง ๆ ได้ เว้นแต่จะมีการตรึงไว้ หากต้องการบังคับให้ใช้ profile เดียว:

- ตรึงด้วย `auth.order[provider] = ["provider:profileId"]`, หรือ
- ใช้ override ระดับเซสชันผ่าน `/model …` พร้อม profile override (เมื่อ UI/พื้นผิวแชตของคุณรองรับ)

## Cooldowns

เมื่อ profile ล้มเหลวจากข้อผิดพลาดด้าน auth/rate‑limit (หรือ timeout ที่ดูเหมือน
เป็น rate limiting) OpenClaw จะทำเครื่องหมายว่าอยู่ใน cooldown แล้วไปยัง profile ถัดไป
กลุ่ม rate-limit นั้นกว้างกว่าแค่ `429`: ยังรวมข้อความจาก provider
เช่น `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` และข้อจำกัดเป็นช่วงเวลา เช่น
`weekly/monthly limit reached`
ข้อผิดพลาดด้านรูปแบบ/คำขอไม่ถูกต้อง (เช่นความล้มเหลวในการตรวจสอบ tool call ID
ของ Cloud Code Assist) จะถือว่าสมควรทำ failover และใช้ cooldown แบบเดียวกัน
ข้อผิดพลาด stop-reason แบบ OpenAI-compatible เช่น `Unhandled stop reason: error`,
`stop reason: error` และ `reason: error` จะถูกจัดเป็นสัญญาณ timeout/failover
ข้อความ server ทั่วไปที่อยู่ในขอบเขต provider ก็อาจถูกจัดอยู่ในกลุ่ม timeout เช่นกัน เมื่อ
แหล่งที่มาตรงกับรูปแบบชั่วคราวที่รู้จัก ตัวอย่างเช่น Anthropic แบบข้อความล้วน
`An unknown error occurred` และ payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
เช่น `internal server error`, `unknown error, 520`, `upstream error`,
หรือ `backend error` จะถูกถือว่าสมควรทำ failover แบบ timeout ข้อความต้นน้ำทั่วไปเฉพาะของ OpenRouter เช่น `Provider returned error` จะถูกมองว่าเป็น
timeout ก็ต่อเมื่อบริบท provider เป็น OpenRouter จริง ๆ เท่านั้น ข้อความ fallback ภายในทั่วไป เช่น `LLM request failed with an unknown error.` จะยังคง
ใช้แนวทางอนุรักษ์นิยมและจะไม่กระตุ้น failover ด้วยตัวเอง

SDK ของ provider บางตัวอาจหน่วงรอนานตามหน้าต่าง `Retry-After` ก่อนจะ
คืนการควบคุมกลับให้ OpenClaw สำหรับ SDK ที่อิง Stainless เช่น Anthropic และ
OpenAI, OpenClaw จะจำกัดการรอภายใน SDK ของ `retry-after-ms` / `retry-after` ไว้ที่ 60
วินาทีโดยค่าเริ่มต้น และจะส่งผ่านการตอบกลับที่ retry ได้ซึ่งยาวกว่านั้นทันที เพื่อให้เส้นทาง
failover นี้ทำงานได้ ปรับแต่งหรือปิดเพดานนี้ได้ด้วย
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; ดู [/concepts/retry](/th/concepts/retry)

rate-limit cooldowns ยังสามารถกำหนดขอบเขตตามโมเดลได้ด้วย:

- OpenClaw จะบันทึก `cooldownModel` สำหรับความล้มเหลวจาก rate-limit เมื่อรู้ model id
  ที่ล้มเหลว
- sibling model บน provider เดียวกันยังคงสามารถถูกลองได้เมื่อ cooldown
  มีขอบเขตอยู่ที่โมเดลอื่น
- ช่วงเวลาที่ถูกบล็อกจากการเรียกเก็บเงิน/disabled ยังคงบล็อกทั้ง profile ข้ามทุกโมเดล

Cooldowns ใช้ exponential backoff:

- 1 นาที
- 5 นาที
- 25 นาที
- 1 ชั่วโมง (เพดาน)

สถานะจะถูกเก็บใน `auth-state.json` ภายใต้ `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## การปิดใช้งานจากการเรียกเก็บเงิน

ความล้มเหลวจากการเรียกเก็บเงิน/เครดิต (เช่น “insufficient credits” / “credit balance too low”) จะถือว่าสมควรทำ failover แต่โดยทั่วไปไม่ใช่ปัญหาชั่วคราว แทนที่จะใช้ cooldown ระยะสั้น OpenClaw จะทำเครื่องหมาย profile นั้นเป็น **disabled** (พร้อม backoff ที่นานกว่า) แล้วสลับไปยัง profile/provider ถัดไป

ไม่ใช่ทุกการตอบกลับที่มีลักษณะเหมือนปัญหาการเรียกเก็บเงินจะเป็น `402` และไม่ใช่ทุก HTTP `402` จะถูกจัดอยู่ในกรณีนี้ OpenClaw จะคงข้อความการเรียกเก็บเงินที่ชัดเจนไว้ในเส้นทาง billing แม้ provider จะคืน `401` หรือ `403` มาแทน แต่ตัวจับคู่เฉพาะ provider จะยังคงจำกัดอยู่กับ provider เจ้าของเท่านั้น (เช่น OpenRouter `403 Key limit exceeded`) ขณะเดียวกัน ข้อผิดพลาด `402` ชั่วคราวเกี่ยวกับหน้าต่างการใช้งานและขีดจำกัดการใช้จ่ายขององค์กร/workspace จะถูกจัดเป็น `rate_limit` เมื่อข้อความดูเหมือน retry ได้ (เช่น `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` หรือ `organization spending limit exceeded`) ข้อผิดพลาดเหล่านี้จะยังคงอยู่บนเส้นทาง cooldown/failover แบบสั้น แทนที่จะไปอยู่บนเส้นทาง billing-disable แบบยาว

สถานะจะถูกเก็บใน `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

ค่าเริ่มต้น:

- backoff สำหรับ billing เริ่มที่ **5 ชั่วโมง**, เพิ่มเป็นสองเท่าทุกครั้งที่เกิด billing failure และจำกัดสูงสุดที่ **24 ชั่วโมง**
- ตัวนับ backoff จะรีเซ็ตหาก profile ไม่ล้มเหลวเป็นเวลา **24 ชั่วโมง** (ปรับแต่งได้)
- overloaded retries อนุญาตให้มี **การสลับ profile ภายใน provider เดียวกัน 1 ครั้ง** ก่อน model fallback
- overloaded retries ใช้ backoff **0 ms** โดยค่าเริ่มต้น

## Model fallback

หากทุก profiles สำหรับ provider หนึ่งล้มเหลว OpenClaw จะย้ายไปยังโมเดลถัดไปใน
`agents.defaults.model.fallbacks` สิ่งนี้ใช้กับความล้มเหลวด้าน auth, rate limits และ
timeouts ที่ใช้การสลับ profile จนหมดแล้ว (ข้อผิดพลาดประเภทอื่นจะไม่ทำให้ fallback เดินหน้าต่อ)

ข้อผิดพลาดแบบ overloaded และ rate-limit จะถูกจัดการเชิงรุกกว่าการ cooldown
จาก billing โดยค่าเริ่มต้น OpenClaw จะอนุญาตให้มี auth-profile retry ภายใน provider เดียวกันหนึ่งครั้ง
จากนั้นจะสลับไปยัง model fallback ถัดไปที่กำหนดค่าไว้โดยไม่ต้องรอ
สัญญาณ provider-busy เช่น `ModelNotReadyException` จะอยู่ในกลุ่ม overloaded ดังกล่าว
ปรับแต่งได้ด้วย `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` และ
`auth.cooldowns.rateLimitedProfileRotations`

เมื่อการรันเริ่มต้นด้วย model override (hooks หรือ CLI), fallbacks ก็ยังคงลงท้ายที่
`agents.defaults.model.primary` หลังจากลอง fallbacks ที่กำหนดค่าไว้แล้ว

### กฎของ candidate chain

OpenClaw สร้างรายการ candidate จาก `provider/model` ที่ร้องขอในปัจจุบัน
บวกกับ fallbacks ที่กำหนดค่าไว้

กฎ:

- โมเดลที่ร้องขอจะอยู่เป็นอันดับแรกเสมอ
- fallbacks ที่กำหนดค่าไว้อย่างชัดเจนจะถูกลบรายการซ้ำ แต่จะไม่ถูกกรองด้วย model
  allowlist โดยถือว่าเป็นเจตนาของผู้ปฏิบัติงานที่ระบุชัดเจน
- หากการรันปัจจุบันอยู่บน configured fallback ในตระกูล provider เดียวกันอยู่แล้ว
  OpenClaw จะยังคงใช้ห่วงโซ่ที่กำหนดค่าไว้ทั้งหมดต่อไป
- หากการรันปัจจุบันอยู่บน provider ที่ต่างจาก config และ current
  model นั้นไม่ได้เป็นส่วนหนึ่งของ configured fallback chain อยู่แล้ว OpenClaw จะไม่
  ต่อ fallbacks อื่นที่ไม่เกี่ยวข้องจาก provider อื่นตาม config
- เมื่อการรันเริ่มจาก override configured primary จะถูกต่อท้ายในตอนจบ เพื่อให้ห่วงโซ่สามารถกลับไปลงที่ค่าเริ่มต้นปกติได้เมื่อ candidates ก่อนหน้าหมด

### ข้อผิดพลาดใดที่ทำให้ fallback เดินหน้าต่อ

Model fallback จะเดินหน้าต่อเมื่อเจอ:

- ความล้มเหลวด้าน auth
- rate limits และ cooldown exhaustion
- ข้อผิดพลาด overloaded/provider-busy
- ข้อผิดพลาดลักษณะ timeout ที่สมควรทำ failover
- billing disables
- `LiveSessionModelSwitchError` ซึ่งจะถูกทำให้เป็นเส้นทาง failover เพื่อไม่ให้
  persisted model ที่ล้าสมัยสร้าง outer retry loop
- ข้อผิดพลาดอื่นที่ไม่รู้จักเมื่อยังมี candidates เหลืออยู่

Model fallback จะไม่เดินหน้าต่อเมื่อเจอ:

- การยกเลิกโดยชัดเจนที่ไม่ใช่ลักษณะ timeout/failover
- ข้อผิดพลาด context overflow ที่ควรอยู่ภายในตรรกะ compaction/retry
  (เช่น `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` หรือ `ollama error: context
length exceeded`)
- ข้อผิดพลาดที่ไม่รู้จักรายการสุดท้ายเมื่อไม่มี candidates เหลือแล้ว

### พฤติกรรมข้าม cooldown เทียบกับ probe

เมื่อ auth profiles ทุกตัวสำหรับ provider หนึ่งอยู่ใน cooldown อยู่แล้ว OpenClaw จะ
ไม่ข้าม provider นั้นตลอดไปโดยอัตโนมัติ แต่จะตัดสินใจเป็นราย candidate:

- ความล้มเหลวด้าน auth แบบถาวรจะข้ามทั้ง provider ทันที
- การปิดใช้งานจากการเรียกเก็บเงินมักจะถูกข้าม แต่ primary candidate ยังสามารถถูก probe ได้
  แบบ throttle เพื่อให้กู้คืนได้โดยไม่ต้องรีสตาร์ต
- primary candidate อาจถูก probe เมื่อใกล้หมดอายุ cooldown พร้อม throttle ราย provider
- fallback siblings ภายใน provider เดียวกันยังคงสามารถถูกลองได้แม้อยู่ใน cooldown เมื่อ
  ความล้มเหลวดูกำลังเป็นปัญหาชั่วคราว (`rate_limit`, `overloaded` หรือไม่ทราบสาเหตุ) เรื่องนี้
  มีความสำคัญเป็นพิเศษเมื่อ rate limit มีขอบเขตตามโมเดลและ sibling model อาจ
  ฟื้นตัวได้ทันที
- การ probe cooldown แบบชั่วคราวจะถูกจำกัดไว้ที่หนึ่งครั้งต่อ provider ต่อหนึ่ง fallback run เพื่อไม่ให้ provider เดียวทำให้ cross-provider fallback ชะงัก

## Session overrides และการสลับโมเดลแบบสด

การเปลี่ยนโมเดลของเซสชันเป็นสถานะที่ใช้ร่วมกัน ทั้ง active runner, คำสั่ง `/model`,
การอัปเดต compaction/session และการกระทบยอด live-session ต่างก็อ่านหรือเขียน
บางส่วนของ session entry เดียวกัน

นั่นหมายความว่า fallback retries ต้องประสานงานกับการสลับโมเดลแบบสด:

- เฉพาะการเปลี่ยนโมเดลที่ผู้ใช้สั่งอย่างชัดเจนเท่านั้นที่จะทำเครื่องหมาย pending live switch ซึ่งรวมถึง
  `/model`, `session_status(model=...)` และ `sessions.patch`
- การเปลี่ยนโมเดลที่ขับเคลื่อนโดยระบบ เช่น fallback rotation, Heartbeat overrides
  หรือ compaction จะไม่ทำเครื่องหมาย pending live switch ด้วยตัวเอง
- ก่อนที่ fallback retry จะเริ่ม reply runner จะบันทึก
  ฟิลด์ fallback override ที่เลือกไว้ลงใน session entry
- การกระทบยอด live-session จะให้ความสำคัญกับ persisted session overrides มากกว่า
  runtime model fields ที่ล้าสมัย
- หากความพยายามของ fallback ล้มเหลว runner จะย้อนกลับเฉพาะฟิลด์ override
  ที่มันเขียน และจะย้อนกลับก็ต่อเมื่อฟิลด์เหล่านั้นยังคงตรงกับ candidate ที่ล้มเหลวนั้น

สิ่งนี้ป้องกัน race แบบคลาสสิก:

1. primary ล้มเหลว
2. fallback candidate ถูกเลือกในหน่วยความจำ
3. session store ยังคงบอกว่าเป็น primary ตัวเก่า
4. การกระทบยอด live-session อ่านสถานะเซสชันที่ล้าสมัยนั้น
5. retry ถูกดึงกลับไปยังโมเดลเก่าก่อนที่ความพยายามของ fallback
   จะเริ่ม

persisted fallback override จะปิดช่องว่างนั้น และการย้อนกลับแบบแคบ
จะคงการเปลี่ยนแปลงเซสชันแบบ manual หรือ runtime ที่ใหม่กว่าไว้ครบถ้วน

## การสังเกตการณ์และสรุปความล้มเหลว

`runWithModelFallback(...)` จะบันทึกรายละเอียดรายครั้งที่พยายาม ซึ่งใช้สำหรับ logs และ
ข้อความ cooldown ที่แสดงต่อผู้ใช้:

- provider/model ที่พยายาม
- เหตุผล (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` และ
  เหตุผล failover ที่คล้ายกัน)
- status/code แบบไม่บังคับ
- สรุปข้อผิดพลาดที่มนุษย์อ่านเข้าใจได้

เมื่อทุก candidate ล้มเหลว OpenClaw จะโยน `FallbackSummaryError` ตัว
reply runner ชั้นนอกสามารถใช้สิ่งนี้เพื่อสร้างข้อความที่เฉพาะเจาะจงมากขึ้น เช่น "ทุกโมเดล
ถูกจำกัดอัตราชั่วคราว" และรวมเวลาหมดอายุ cooldown ที่ใกล้ที่สุดเมื่อทราบ

สรุป cooldown นี้รับรู้ระดับโมเดล:

- rate limits ที่มีขอบเขตระดับโมเดลซึ่งไม่เกี่ยวข้องจะถูกละเว้นสำหรับห่วงโซ่
  provider/model ที่พยายามนั้น
- หากสิ่งที่ยังคงบล็อกอยู่เป็น rate limit แบบมีขอบเขตระดับโมเดลที่ตรงกัน OpenClaw
  จะรายงานเวลาหมดอายุที่ตรงกันล่าสุดซึ่งยังคงบล็อกโมเดลนั้นอยู่

## Config ที่เกี่ยวข้อง

ดู [การกำหนดค่า Gateway](/th/gateway/configuration) สำหรับ:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

ดู [Models](/th/concepts/models) สำหรับภาพรวมที่กว้างขึ้นของการเลือกโมเดลและ fallback
