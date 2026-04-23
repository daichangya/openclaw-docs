---
read_when:
    - การวินิจฉัยการหมุนเวียน auth profiles, cooldowns หรือพฤติกรรม fallback ของโมเดล
    - การอัปเดตกฎ failover สำหรับ auth profiles หรือโมเดล
    - การทำความเข้าใจว่าการ override โมเดลของ session ทำงานร่วมกับการลองใหม่แบบ fallback อย่างไร
summary: วิธีที่ OpenClaw หมุนเวียน auth profiles และ fallback ข้ามโมเดล სხვადასხვაตัว
title: การทำ Failover ของโมเดล
x-i18n:
    generated_at: "2026-04-23T05:30:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# การทำ Failover ของโมเดล

OpenClaw จัดการความล้มเหลวเป็นสองขั้นตอน:

1. **การหมุนเวียน auth profile** ภายใน provider ปัจจุบัน
2. **การ fallback ของโมเดล** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

เอกสารนี้อธิบายกฎของรันไทม์และข้อมูลที่รองรับพฤติกรรมเหล่านั้น

## ลำดับการทำงานของรันไทม์

สำหรับการรันข้อความปกติ OpenClaw จะประเมินตัวเลือกตามลำดับนี้:

1. โมเดลของ session ที่ถูกเลือกอยู่ในปัจจุบัน
2. `agents.defaults.model.fallbacks` ที่ตั้งค่าไว้ตามลำดับ
3. โมเดล primary ที่ตั้งค่าไว้ในตอนท้าย เมื่อการรันเริ่มต้นจาก override

ภายในแต่ละตัวเลือก OpenClaw จะลองทำ auth-profile failover ก่อนจะขยับไปยัง
ตัวเลือกโมเดลถัดไป

ลำดับระดับสูง:

1. resolve โมเดลของ session ที่กำลังใช้งานและการตั้งค่า auth-profile ที่ต้องการ
2. สร้างสายโซ่ของตัวเลือกโมเดล
3. ลอง provider ปัจจุบันด้วยกฎการหมุนเวียน/cooldown ของ auth profile
4. หาก provider นั้นหมดทางเลือกด้วยข้อผิดพลาดที่ควรทำ failover ให้ย้ายไปยัง
   ตัวเลือกโมเดลถัดไป
5. เก็บ fallback override ที่เลือกไว้ก่อนเริ่ม retry เพื่อให้ผู้อ่าน session อื่นๆ เห็น provider/model เดียวกันกับที่ตัวรันกำลังจะใช้
6. หากตัวเลือก fallback ล้มเหลว ให้ rollback เฉพาะฟิลด์ override ของ session ที่ fallback เป็นเจ้าของ เมื่อฟิลด์เหล่านั้นยังคงตรงกับตัวเลือกที่ล้มเหลวนั้น
7. หากทุกตัวเลือกล้มเหลว ให้ throw `FallbackSummaryError` พร้อมรายละเอียดรายความพยายาม
   และเวลาหมด cooldown ที่ใกล้ที่สุดเมื่อทราบค่า

สิ่งนี้แคบกว่าแนวคิด “บันทึกและกู้คืนทั้ง session” โดยตั้งใจ ตัวรันการตอบกลับจะเก็บถาวรเฉพาะฟิลด์การเลือกโมเดลที่มันเป็นเจ้าของสำหรับ fallback:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

สิ่งนี้ป้องกันไม่ให้ retry ของ fallback ที่ล้มเหลวไปเขียนทับการเปลี่ยนแปลงอื่นที่ใหม่กว่าใน session เช่นการเปลี่ยน `/model` ด้วยตนเอง หรือการอัปเดตการหมุนเวียน session ที่เกิดขึ้นระหว่างที่ความพยายามนั้นกำลังทำงาน

## การเก็บข้อมูล auth (คีย์ + OAuth)

OpenClaw ใช้ **auth profiles** สำหรับทั้ง API keys และ OAuth tokens

- ความลับจะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (แบบเดิม: `~/.openclaw/agent/auth-profiles.json`)
- สถานะการกำหนดเส้นทาง auth ของรันไทม์จะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-state.json`
- Config `auth.profiles` / `auth.order` เป็น **metadata + routing เท่านั้น** (ไม่มีความลับ)
- ไฟล์ OAuth แบบเดิมสำหรับนำเข้าอย่างเดียว: `~/.openclaw/credentials/oauth.json` (จะถูกนำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

รายละเอียดเพิ่มเติม: [/concepts/oauth](/th/concepts/oauth)

ประเภทของ credentials:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` สำหรับบาง provider)

## IDs ของ profile

การล็อกอินด้วย OAuth จะสร้าง profiles แยกกัน เพื่อให้หลายบัญชีอยู่ร่วมกันได้

- ค่าเริ่มต้น: `provider:default` เมื่อไม่มีอีเมล
- OAuth ที่มีอีเมล: `provider:<email>` (ตัวอย่างเช่น `google-antigravity:user@gmail.com`)

Profiles จะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ภายใต้ `profiles`

## ลำดับการหมุนเวียน

เมื่อ provider หนึ่งมีหลาย profiles OpenClaw จะเลือกลำดับประมาณนี้:

1. **Config แบบชัดเจน**: `auth.order[provider]` (ถ้ามี)
2. **profiles ที่ตั้งค่าไว้**: `auth.profiles` ที่กรองตาม provider
3. **profiles ที่เก็บไว้**: รายการใน `auth-profiles.json` สำหรับ provider นั้น

หากไม่มีการตั้งค่าลำดับแบบชัดเจน OpenClaw จะใช้ลำดับแบบ round‑robin:

- **คีย์หลัก:** ประเภทของ profile (**OAuth มาก่อน API keys**)
- **คีย์รอง:** `usageStats.lastUsed` (เก่าสุดก่อน ภายในแต่ละประเภท)
- **profiles ที่อยู่ใน cooldown/disabled** จะถูกย้ายไปไว้ท้ายสุด โดยเรียงตามเวลาหมดอายุที่ใกล้ที่สุด

### ความเหนียวแน่นระดับ session (เป็นมิตรกับ cache)

OpenClaw จะ **ปักหมุด auth profile ที่เลือกไว้ต่อ session** เพื่อรักษา cache ของ provider ให้อุ่น
มันจะ **ไม่** หมุนเวียนทุกคำขอ profile ที่ถูกปักหมุดจะถูกใช้ซ้ำจนกว่า:

- session จะถูกรีเซ็ต (`/new` / `/reset`)
- มี Compaction เสร็จสิ้น (จำนวน compaction เพิ่มขึ้น)
- profile นั้นอยู่ใน cooldown/disabled

การเลือกด้วยตนเองผ่าน `/model …@<profileId>` จะตั้ง **user override** สำหรับ session นั้น
และจะไม่ถูกหมุนเวียนอัตโนมัติจนกว่าจะเริ่ม session ใหม่

profiles ที่ถูกปักหมุดอัตโนมัติ (เลือกโดย session router) จะถูกมองว่าเป็น **ค่าที่ต้องการ**:
ระบบจะลองใช้ก่อน แต่ OpenClaw อาจหมุนไปยัง profile อื่นเมื่อเจอ rate limits/timeouts
profiles ที่ผู้ใช้ปักหมุดจะยังคงล็อกอยู่กับ profile นั้น; หากมันล้มเหลวและมีการตั้งค่า model fallbacks
OpenClaw จะย้ายไปยังโมเดลถัดไปแทนการสลับ profile

### ทำไม OAuth อาจ “ดูเหมือนหายไป”

หากคุณมีทั้ง OAuth profile และ API key profile สำหรับ provider เดียวกัน round‑robin อาจสลับไปมาระหว่างสองอย่างนี้ข้ามหลายข้อความ เว้นแต่จะถูกปักหมุด หากต้องการบังคับให้ใช้ profile เดียว:

- ปักหมุดด้วย `auth.order[provider] = ["provider:profileId"]` หรือ
- ใช้ override ต่อ session ผ่าน `/model …` พร้อม profile override (เมื่อ UI/พื้นผิวแชตของคุณรองรับ)

## Cooldowns

เมื่อ profile หนึ่งล้มเหลวเพราะข้อผิดพลาดด้าน auth/rate-limit (หรือ timeout ที่ดู
เหมือนการถูก rate limiting) OpenClaw จะทำเครื่องหมายให้ profile นั้นอยู่ใน cooldown และย้ายไปยัง profile ถัดไป
บัคเก็ต rate-limit นี้ครอบคลุมกว้างกว่า `429` ปกติ: มันยังรวมข้อความจาก provider
เช่น `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` และข้อจำกัดการใช้งานแบบเป็นรอบเวลา เช่น
`weekly/monthly limit reached`
ข้อผิดพลาดด้านรูปแบบ/คำขอไม่ถูกต้อง (ตัวอย่างเช่นความล้มเหลวในการตรวจสอบ tool call ID
ของ Cloud Code Assist) จะถือว่าเหมาะแก่การ failover และใช้ cooldowns แบบเดียวกัน
ข้อผิดพลาดแบบ stop-reason ของ OpenAI-compatible เช่น `Unhandled stop reason: error`,
`stop reason: error` และ `reason: error` จะถูกจัดเป็นสัญญาณ
timeout/failover
ข้อความเซิร์ฟเวอร์ทั่วไปที่ขอบเขตอยู่ที่ provider ก็อาจตกเข้าไปในบัคเก็ต timeout นั้นได้เมื่อ
แหล่งที่มาตรงกับแพตเทิร์นชั่วคราวที่รู้จัก เช่น ข้อความเปล่าของ Anthropic แบบ
`An unknown error occurred` และเพย์โหลด JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
เช่น `internal server error`, `unknown error, 520`, `upstream error`
หรือ `backend error` จะถือว่าเหมาะแก่การ failover แบบ timeout ข้อความ upstream ทั่วไปเฉพาะของ OpenRouter
เช่น `Provider returned error` แบบเปล่า ก็จะถูกมองเป็น
timeout เฉพาะเมื่อบริบทของ provider เป็น OpenRouter จริงๆ เท่านั้น ข้อความ fallback ภายในทั่วไป
เช่น `LLM request failed with an unknown error.` จะยังคงระมัดระวัง
และจะไม่กระตุ้น failover ด้วยตัวมันเอง

provider SDK บางตัวอาจ sleep เป็นเวลานานตามหน้าต่าง `Retry-After` ก่อน
จะคืนการควบคุมให้ OpenClaw สำหรับ Stainless-based SDKs เช่น Anthropic และ
OpenAI นั้น OpenClaw จะจำกัดการรอ `retry-after-ms` / `retry-after` ภายใน SDK ไว้ที่ 60
วินาทีโดยค่าเริ่มต้น และจะแสดงผลการตอบกลับที่ retry ได้แต่ใช้เวลานานทันที เพื่อให้เส้นทาง failover นี้ทำงาน ปรับแต่งหรือปิดข้อจำกัดนี้ได้ด้วย
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; ดู [/concepts/retry](/th/concepts/retry)

rate-limit cooldowns ยังสามารถผูกกับโมเดลได้ด้วย:

- OpenClaw จะบันทึก `cooldownModel` สำหรับความล้มเหลวแบบ rate-limit เมื่อทราบ
  model id ที่ล้มเหลว
- โมเดลพี่น้องบน provider เดียวกันยังคงสามารถลองใช้ได้ เมื่อ cooldown
  ผูกอยู่กับโมเดลคนละตัว
- หน้าต่าง billing/disabled ยังคงบล็อกทั้ง profile ข้ามทุกโมเดล

cooldowns ใช้ exponential backoff:

- 1 นาที
- 5 นาที
- 25 นาที
- 1 ชั่วโมง (ค่าสูงสุด)

สถานะถูกเก็บใน `auth-state.json` ภายใต้ `usageStats`:

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

## การปิดใช้งานเพราะ billing

ความล้มเหลวด้าน billing/credit (ตัวอย่างเช่น “insufficient credits” / “credit balance too low”) จะถือว่าเหมาะแก่การ failover แต่โดยทั่วไปไม่ใช่แบบชั่วคราว แทนที่จะใช้ cooldown สั้นๆ OpenClaw จะทำเครื่องหมาย profile นั้นเป็น **disabled** (พร้อม backoff ที่ยาวกว่า) และหมุนไปยัง profile/provider ถัดไป

ไม่ใช่ทุกการตอบกลับที่มีลักษณะคล้าย billing จะเป็น `402` และไม่ใช่ทุก HTTP `402` จะมาตก
ในกลุ่มนี้ OpenClaw จะเก็บข้อความ billing แบบชัดเจนไว้ในสาย billing แม้ว่า
provider จะส่ง `401` หรือ `403` กลับมาแทน แต่ตัวจับคู่เฉพาะ provider จะยังคงถูกจำกัด
อยู่ที่ provider เจ้าของมันเท่านั้น (เช่น OpenRouter `403 Key limit
exceeded`) ขณะเดียวกัน ข้อผิดพลาด `402` แบบชั่วคราวจากหน้าต่างการใช้งานและ
ข้อผิดพลาด spend-limit ของ organization/workspace จะถูกจัดเป็น `rate_limit` เมื่อ
ข้อความดูเหมือนสามารถลองใหม่ได้ (เช่น `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` หรือ `organization spending limit exceeded`)
สิ่งเหล่านี้จะยังอยู่ในเส้นทาง cooldown/failover แบบสั้น แทนที่จะไปอยู่ในเส้นทาง
billing-disable แบบยาว

สถานะถูกเก็บไว้ใน `auth-state.json`:

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

- backoff ด้าน billing เริ่มที่ **5 ชั่วโมง**, เพิ่มเป็นสองเท่าต่อความล้มเหลวด้าน billing แต่ละครั้ง และมีค่าสูงสุดที่ **24 ชั่วโมง**
- ตัวนับ backoff จะถูกรีเซ็ตหาก profile ไม่ได้ล้มเหลวมาเป็นเวลา **24 ชั่วโมง** (ตั้งค่าได้)
- overloaded retries อนุญาตให้มี **การหมุนเวียน profile ใน provider เดียวกัน 1 ครั้ง** ก่อน model fallback
- overloaded retries ใช้ backoff **0 ms** โดยค่าเริ่มต้น

## Model fallback

หากทุก profiles สำหรับ provider หนึ่งล้มเหลว OpenClaw จะย้ายไปยังโมเดลถัดไปใน
`agents.defaults.model.fallbacks` สิ่งนี้ใช้กับความล้มเหลวด้าน auth, rate limits และ
timeouts ที่ใช้การหมุนเวียน profile จนหมดแล้ว (ข้อผิดพลาดชนิดอื่นจะไม่ทำให้ fallback ขยับไปข้างหน้า)

ข้อผิดพลาดแบบ overloaded และ rate-limit ถูกจัดการอย่างจริงจังกว่า cooldown ด้าน billing
โดยค่าเริ่มต้น OpenClaw อนุญาตให้ลอง auth-profile ซ้ำภายใน provider เดียวกันหนึ่งครั้ง
จากนั้นจะสลับไปยัง model fallback ถัดไปที่ตั้งค่าไว้โดยไม่ต้องรอ
สัญญาณว่า provider กำลังยุ่ง เช่น `ModelNotReadyException` จะถูกจัดให้อยู่ในบัคเก็ต overloaded นี้
ปรับแต่งได้ด้วย `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` และ
`auth.cooldowns.rateLimitedProfileRotations`

เมื่อการรันเริ่มจาก model override (hooks หรือ CLI) fallbacks ก็ยังจะจบที่
`agents.defaults.model.primary` หลังจากลอง fallbacks ที่ตั้งค่าไว้แล้ว

### กฎของสายโซ่ตัวเลือก

OpenClaw สร้างรายการตัวเลือกจาก `provider/model` ที่ร้องขออยู่ในปัจจุบัน
รวมกับ fallbacks ที่ตั้งค่าไว้

กฎ:

- โมเดลที่ร้องขอจะอยู่ลำดับแรกเสมอ
- fallbacks ที่ตั้งค่าไว้อย่างชัดเจนจะถูกลบรายการซ้ำ แต่จะไม่ถูกกรองโดย model
  allowlist เพราะถือว่าเป็นเจตนาของผู้ดูแลระบบที่ระบุไว้อย่างชัดเจน
- หากการรันปัจจุบันอยู่บน fallback ที่ตั้งค่าไว้แล้วในตระกูล provider เดียวกัน
  OpenClaw จะยังคงใช้สายโซ่ที่ตั้งค่าไว้เต็มรูปแบบ
- หากการรันปัจจุบันอยู่บน provider ที่ต่างจาก config และโมเดลปัจจุบันนั้นยังไม่เป็นส่วนหนึ่ง
  ของสายโซ่ fallback ที่ตั้งค่าไว้ OpenClaw จะไม่ต่อท้าย fallbacks ที่ไม่เกี่ยวข้องจาก provider อื่น
- เมื่อการรันเริ่มจาก override primary ที่ตั้งค่าไว้จะถูกต่อท้ายที่
  ตอนจบ เพื่อให้สายโซ่สามารถกลับมาตั้งหลักบนค่าเริ่มต้นปกติได้เมื่อ
  ตัวเลือกก่อนหน้าถูกใช้จนหมด

### ข้อผิดพลาดใดทำให้ fallback เดินหน้าต่อ

model fallback จะเดินหน้าต่อเมื่อเจอ:

- ความล้มเหลวด้าน auth
- rate limits และการหมดสิทธิ์หลัง cooldown
- ข้อผิดพลาด overloaded/provider-busy
- ข้อผิดพลาดแบบ timeout ที่เหมาะแก่การ failover
- การปิดใช้งานเพราะ billing
- `LiveSessionModelSwitchError` ซึ่งจะถูก normalize ให้เป็นเส้นทาง failover เพื่อไม่ให้
  โมเดลถาวรที่ stale สร้างลูป retry ชั้นนอก
- ข้อผิดพลาดอื่นที่ไม่รู้จักเมื่อยังมีตัวเลือกเหลืออยู่

model fallback จะไม่เดินหน้าต่อเมื่อเจอ:

- การ abort แบบชัดเจนที่ไม่ใช่ลักษณะ timeout/failover
- ข้อผิดพลาด context overflow ที่ควรอยู่ภายในตรรกะ Compaction/retry
  (เช่น `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` หรือ `ollama error: context
length exceeded`)
- ข้อผิดพลาดไม่ทราบสาเหตุครั้งสุดท้ายเมื่อไม่เหลือตัวเลือกแล้ว

### พฤติกรรมการข้ามเพราะ cooldown เทียบกับการ probe

เมื่อ auth profile ทุกตัวสำหรับ provider หนึ่งอยู่ใน cooldown แล้ว OpenClaw จะ
ไม่ข้าม provider นั้นโดยอัตโนมัติตลอดไป มันจะตัดสินใจเป็นรายตัวเลือก:

- ความล้มเหลวด้าน auth แบบถาวรจะข้ามทั้ง provider ทันที
- การปิดใช้งานเพราะ billing มักจะถูกข้าม แต่ตัวเลือก primary ยังอาจถูก probe ได้
  ตาม throttle เพื่อให้กู้คืนได้โดยไม่ต้องรีสตาร์ต
- ตัวเลือก primary อาจถูก probe เมื่อใกล้หมดช่วง cooldown โดยใช้ throttle
  แยกตาม provider
- โมเดลพี่น้อง fallback ภายใน provider เดียวกันอาจยังถูกลองได้แม้อยู่ใน cooldown เมื่อ
  ความล้มเหลวดูลักษณะชั่วคราว (`rate_limit`, `overloaded` หรือไม่ทราบสาเหตุ) เรื่องนี้สำคัญเป็นพิเศษเมื่อ rate limit ผูกกับโมเดล และโมเดลพี่น้องอาจ
  ฟื้นตัวได้ทันที
- transient cooldown probes จะถูกจำกัดไว้ที่หนึ่งครั้งต่อ provider ต่อหนึ่ง fallback run เพื่อไม่ให้ provider เดียวไปถ่วงการ fallback ข้าม provider

## Session overrides และการสลับโมเดลใน session แบบสด

การเปลี่ยนโมเดลของ session เป็นสถานะที่ใช้ร่วมกัน ทั้งตัวรันที่กำลังทำงาน, คำสั่ง `/model`,
การอัปเดต Compaction/session และ live-session reconciliation ต่างก็อ่านหรือเขียนบางส่วนของรายการ session เดียวกัน

นั่นหมายความว่า fallback retries ต้องประสานงานกับการสลับโมเดลใน session แบบสด:

- เฉพาะการเปลี่ยนโมเดลที่ผู้ใช้สั่งอย่างชัดเจนเท่านั้นที่จะทำเครื่องหมายเป็น pending live switch ซึ่งรวมถึง `/model`, `session_status(model=...)` และ `sessions.patch`
- การเปลี่ยนโมเดลที่ขับเคลื่อนโดยระบบ เช่น fallback rotation, overrides ของ Heartbeat
  หรือ Compaction จะไม่ทำเครื่องหมาย pending live switch ด้วยตัวเอง
- ก่อนเริ่ม fallback retry ตัวรันการตอบกลับจะเก็บ fallback override fields ที่เลือก
  ไว้ในรายการ session
- live-session reconciliation จะให้ความสำคัญกับ session overrides ที่เก็บไว้ถาวร มากกว่าฟิลด์โมเดลของรันไทม์ที่ stale
- หากความพยายาม fallback ล้มเหลว ตัวรันจะ rollback เฉพาะฟิลด์ override ที่มันเขียนไว้
  และเฉพาะเมื่อฟิลด์เหล่านั้นยังคงตรงกับตัวเลือกที่ล้มเหลวนั้น

สิ่งนี้ป้องกัน race แบบคลาสสิก:

1. primary ล้มเหลว
2. เลือกตัวเลือก fallback ไว้ในหน่วยความจำ
3. session store ยังระบุ primary ตัวเก่าอยู่
4. live-session reconciliation อ่านสถานะ session ที่ stale
5. retry ถูกดีดกลับไปใช้โมเดลเก่าก่อนที่ความพยายาม fallback
   จะเริ่มต้น

fallback override ที่เก็บไว้ถาวรจะปิดช่องว่างนั้น และ rollback แบบแคบ
จะรักษาการเปลี่ยนแปลง session ใหม่กว่าจากผู้ใช้หรือรันไทม์ไว้

## การสังเกตการณ์และสรุปความล้มเหลว

`runWithModelFallback(...)` จะบันทึกรายละเอียดรายความพยายามซึ่งใช้สำหรับล็อกและ
ข้อความ cooldown ที่ผู้ใช้มองเห็นได้:

- provider/model ที่พยายามใช้
- เหตุผล (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` และ
  เหตุผลการ failover ที่คล้ายกัน)
- status/code แบบไม่บังคับ
- สรุปข้อผิดพลาดที่อ่านเข้าใจได้

เมื่อทุกตัวเลือกล้มเหลว OpenClaw จะ throw `FallbackSummaryError` ตัวรันการตอบกลับชั้นนอก
สามารถใช้สิ่งนี้เพื่อสร้างข้อความที่เฉพาะเจาะจงมากขึ้น เช่น "โมเดลทั้งหมด
ถูก rate-limit ชั่วคราว" และรวมเวลาหมด cooldown ที่ใกล้ที่สุดเมื่อทราบค่า

สรุป cooldown นั้นรับรู้ระดับโมเดลด้วย:

- rate limits แบบผูกกับโมเดลที่ไม่เกี่ยวข้องจะถูกละเลยสำหรับสายโซ่
  provider/model ที่พยายามใช้
- หากสิ่งที่ยังบล็อกอยู่เป็น rate limit แบบผูกกับโมเดลที่ตรงกัน OpenClaw
  จะรายงานเวลาหมดอายุล่าสุดที่ตรงกันซึ่งยังคงบล็อกโมเดลนั้นอยู่

## Config ที่เกี่ยวข้อง

ดู [Gateway configuration](/th/gateway/configuration) สำหรับ:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

ดู [Models](/th/concepts/models) สำหรับภาพรวมที่กว้างขึ้นของการเลือกโมเดลและ fallback
