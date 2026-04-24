---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของ Models (`models list/set/scan/aliases/fallbacks`)
    - การเปลี่ยนพฤติกรรม fallback ของโมเดลหรือ UX การเลือก
    - การอัปเดต probes ของการสแกนโมเดล (tools/images)
summary: 'CLI ของ Models: แสดงรายการ ตั้งค่า aliases fallbacks สแกน สถานะ'
title: CLI ของ Models
x-i18n:
    generated_at: "2026-04-24T09:06:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

ดู [/concepts/model-failover](/th/concepts/model-failover) สำหรับการหมุนเวียน
auth profile, cooldowns และวิธีที่สิ่งเหล่านั้นโต้ตอบกับ fallbacks
ภาพรวมผู้ให้บริการแบบรวดเร็ว + ตัวอย่าง: [/concepts/model-providers](/th/concepts/model-providers)

## การเลือกโมเดลทำงานอย่างไร

OpenClaw เลือกโมเดลตามลำดับนี้:

1. โมเดล **หลัก** (`agents.defaults.model.primary` หรือ `agents.defaults.model`)
2. **Fallbacks** ใน `agents.defaults.model.fallbacks` (ตามลำดับ)
3. **Provider auth failover** จะเกิดขึ้นภายในผู้ให้บริการก่อนจะย้ายไปยัง
   โมเดลถัดไป

ที่เกี่ยวข้อง:

- `agents.defaults.models` คือ allowlist/catalog ของโมเดลที่ OpenClaw ใช้ได้ (รวม aliases)
- `agents.defaults.imageModel` จะใช้ **เฉพาะเมื่อ** โมเดลหลักรับภาพไม่ได้
- `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากไม่ระบุ เครื่องมือ
  จะ fallback ไปยัง `agents.defaults.imageModel` จากนั้นจึงไปยัง
  โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `agents.defaults.imageGenerationModel` ใช้โดยความสามารถในการสร้างภาพแบบใช้ร่วมกัน หากไม่ระบุ `image_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้ง provider/model แบบเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.musicGenerationModel` ใช้โดยความสามารถในการสร้างเพลงแบบใช้ร่วมกัน หากไม่ระบุ `music_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้ง provider/model แบบเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.videoGenerationModel` ใช้โดยความสามารถในการสร้างวิดีโอแบบใช้ร่วมกัน หากไม่ระบุ `video_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้ง provider/model แบบเจาะจง ให้กำหนด auth/API key ของผู้ให้บริการนั้นด้วย
- ค่าเริ่มต้นรายเอเจนต์สามารถ override `agents.defaults.model` ผ่าน `agents.list[].model` ร่วมกับ bindings ได้ (ดู [/concepts/multi-agent](/th/concepts/multi-agent))

## นโยบายโมเดลแบบรวดเร็ว

- ตั้งค่าโมเดลหลักของคุณเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่คุณเข้าถึงได้
- ใช้ fallbacks สำหรับงานที่ไวต่อค่าใช้จ่าย/latency และแชตที่มีความเสี่ยงต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลรุ่นเก่าหรือระดับที่อ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไขคอนฟิกด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

คำสั่งนี้สามารถตั้งค่า model + auth สำหรับผู้ให้บริการทั่วไป รวมถึง **OpenAI Code (Codex)
subscription** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์คอนฟิก (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + provider params)
- `models.providers` (custom providers ที่เขียนลงใน `models.json`)

Model refs จะถูก normalize เป็นตัวพิมพ์เล็ก aliases ของผู้ให้บริการ เช่น `z.ai/*` จะถูก normalize
เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ใน
[/providers/opencode](/th/providers/opencode)

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบเพิ่มเมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` ปกป้อง maps ของ model/provider จากการถูกเขียนทับโดยไม่ตั้งใจ การ
กำหนด object แบบตรง ๆ ให้กับ `agents.defaults.models`, `models.providers` หรือ
`models.providers.<id>.models` จะถูกปฏิเสธหากจะลบรายการเดิมที่มีอยู่
ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบเพิ่มรายการ; ใช้ `--replace` เฉพาะเมื่อ
ค่าที่ระบุมาควรกลายเป็นค่าเป้าหมายทั้งหมดจริง ๆ

การตั้งค่าผู้ให้บริการแบบ interactive และ `openclaw configure --section model` ก็จะ merge
ค่าที่เลือกในขอบเขตผู้ให้บริการเข้ากับ allowlist เดิมด้วย ดังนั้นการเพิ่ม Codex,
Ollama หรือผู้ให้บริการอื่นจะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหายไป

## "Model is not allowed" (และทำไมคำตอบจึงหยุด)

หากมีการตั้งค่า `agents.defaults.models` ค่านี้จะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ
session overrides เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น
OpenClaw จะตอบกลับว่า:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

สิ่งนี้เกิดขึ้น **ก่อน** ที่จะมีการสร้างคำตอบตามปกติ ดังนั้นข้อความอาจให้ความรู้สึก
เหมือน “ไม่ตอบกลับ” วิธีแก้คือ:

- เพิ่มโมเดลนั้นลงใน `agents.defaults.models`, หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`), หรือ
- เลือกโมเดลจาก `/model list`

ตัวอย่างคอนฟิก allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## การสลับโมเดลในแชต (`/model`)

คุณสามารถสลับโมเดลสำหรับเซสชันปัจจุบันได้โดยไม่ต้องรีสตาร์ต:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

หมายเหตุ:

- `/model` (และ `/model list`) เป็นตัวเลือกแบบกะทัดรัดที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อมดรอปดาวน์ผู้ให้บริการและโมเดล รวมทั้งขั้นตอน Submit
- `/models add` เปิดใช้งานตามค่าเริ่มต้น และสามารถปิดได้ด้วย `commands.modelsWrite=false`
- เมื่อเปิดใช้งานแล้ว `/models add <provider> <modelId>` คือเส้นทางที่เร็วที่สุด; `/models add` แบบเปล่าจะเริ่มโฟลว์แนะนำแบบเลือกผู้ให้บริการก่อนในกรณีที่รองรับ
- หลังจาก `/models add` โมเดลใหม่จะพร้อมใช้งานใน `/models` และ `/model` โดยไม่ต้องรีสตาร์ต gateway
- `/model <#>` ใช้เลือกจากตัวเลือกนั้น
- `/model` จะบันทึกการเลือกเซสชันใหม่ทันที
- หากเอเจนต์ว่างอยู่ การรันครั้งถัดไปจะใช้โมเดลใหม่ทันที
- หากมีการรันที่ active อยู่แล้ว OpenClaw จะทำเครื่องหมายว่าการสลับแบบสดกำลังรอดำเนินการ และจะรีสตาร์ตไปยังโมเดลใหม่เฉพาะที่จุด retry ที่สะอาดเท่านั้น
- หากกิจกรรมของเครื่องมือหรือเอาต์พุตคำตอบเริ่มไปแล้ว การสลับที่รอดำเนินการอาจยังค้างอยู่จนกว่าจะมีโอกาส retry ครั้งถัดไปหรือ user turn ถัดไป
- `/model status` คือมุมมองแบบละเอียด (auth candidates และเมื่อมีการกำหนดค่าไว้ จะรวม provider endpoint `baseUrl` + โหมด `api`)
- Model refs จะถูก parse โดยแยกที่ `/` **ตัวแรก** ใช้ `provider/model` เมื่อพิมพ์ `/model <ref>`
- หาก model ID เองมี `/` (แบบ OpenRouter) คุณต้องใส่ provider prefix ด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
- หากคุณละ provider ไว้ OpenClaw จะ resolve อินพุตตามลำดับนี้:
  1. ตรงกับ alias
  2. ตรงกับ configured-provider แบบไม่ซ้ำสำหรับ unprefixed model id ที่ตรงกันนั้น
  3. fallback แบบเลิกใช้แล้วไปยังผู้ให้บริการเริ่มต้นที่กำหนดไว้
     หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw
     จะ fallback ไปยัง provider/model รายการแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยง
     การแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบและล้าสมัย

พฤติกรรม/คอนฟิกของคำสั่งแบบเต็ม: [Slash commands](/th/tools/slash-commands)

ตัวอย่าง:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## คำสั่ง CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (ไม่มี subcommand) เป็นทางลัดของ `models status`

### `models list`

จะแสดงโมเดลที่กำหนดค่าไว้เป็นค่าเริ่มต้น แฟล็กที่มีประโยชน์:

- `--all`: catalog แบบเต็ม
- `--local`: เฉพาะผู้ให้บริการในเครื่อง
- `--provider <id>`: กรองตาม provider id เช่น `moonshot`; ไม่รองรับ
  ป้ายชื่อที่แสดงจาก interactive pickers
- `--plain`: หนึ่งโมเดลต่อหนึ่งบรรทัด
- `--json`: เอาต์พุตแบบอ่านได้ด้วยเครื่อง

`--all` จะรวมแถว catalog แบบ static ที่ผู้ให้บริการเป็นเจ้าของและรวมมากับระบบก่อน
มีการกำหนดค่า auth ดังนั้นมุมมองแบบ discovery-only อาจแสดงโมเดลที่ยังใช้ไม่ได้จนกว่า
คุณจะเพิ่ม credentials ของผู้ให้บริการที่ตรงกัน

### `models status`

แสดงโมเดลหลักที่ resolve แล้ว fallbacks, image model และภาพรวม auth
ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับ profiles ที่พบ
ใน auth store (เตือนภายใน 24 ชม. เป็นค่าเริ่มต้น) `--plain` จะพิมพ์เฉพาะ
โมเดลหลักที่ resolve แล้ว
สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้
ไม่มี credentials, `models status` จะพิมพ์ส่วน **Missing auth**
JSON จะรวม `auth.oauth` (ช่วงเวลาเตือน + profiles) และ `auth.providers`
(auth ที่มีผลจริงต่อผู้ให้บริการ รวมถึง credentials ที่มาจาก env) `auth.oauth`
เป็นข้อมูลสุขภาพของ profile ใน auth store เท่านั้น; ผู้ให้บริการที่ใช้เฉพาะ env จะไม่ปรากฏที่นั่น
ใช้ `--check` สำหรับงานอัตโนมัติ (exit `1` เมื่อขาดหาย/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
ใช้ `--probe` สำหรับการตรวจสอบ auth แบบสด; แถว probe อาจมาจาก auth profiles, env
credentials หรือ `models.json`
หาก `auth.order.<provider>` แบบชัดเจนละเว้น stored profile ไว้
probe จะรายงาน `excluded_by_auth_order` แทนที่จะลองใช้งาน หากมี auth อยู่แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

การเลือก auth ขึ้นอยู่กับผู้ให้บริการ/บัญชี สำหรับโฮสต์ gateway ที่เปิดตลอดเวลา API
keys มักคาดการณ์ได้มากที่สุด; รองรับการใช้ Claude CLI ซ้ำและ Anthropic
OAuth/token profiles ที่มีอยู่แล้วเช่นกัน

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` จะตรวจสอบ **catalog โมเดลฟรี** ของ OpenRouter และสามารถ
probe โมเดลเพิ่มเติมสำหรับการรองรับ tools และ images ได้ตามต้องการ

แฟล็กสำคัญ:

- `--no-probe`: ข้ามการ probe แบบสด (metadata เท่านั้น)
- `--min-params <b>`: ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
- `--max-age-days <days>`: ข้ามโมเดลที่เก่ากว่า
- `--provider <name>`: ตัวกรอง provider prefix
- `--max-candidates <n>`: ขนาดรายการ fallback
- `--set-default`: ตั้ง `agents.defaults.model.primary` เป็นตัวเลือกแรก
- `--set-image`: ตั้ง `agents.defaults.imageModel.primary` เป็นตัวเลือกภาพตัวแรก

การ probe ต้องใช้ OpenRouter API key (จาก auth profiles หรือ
`OPENROUTER_API_KEY`) หากไม่มีคีย์ ให้ใช้ `--no-probe` เพื่อแสดงเฉพาะ candidates

ผลการสแกนจะถูกจัดอันดับตาม:

1. การรองรับภาพ
2. latency ของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต

- รายการ OpenRouter `/models` (กรอง `:free`)
- ต้องใช้ OpenRouter API key จาก auth profiles หรือ `OPENROUTER_API_KEY` (ดู [/environment](/th/help/environment))
- ตัวกรองเพิ่มเติมที่เป็นทางเลือก: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- การควบคุม probe: `--timeout`, `--concurrency`

เมื่อรันใน TTY คุณสามารถเลือก fallbacks แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ
ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น

## รีจิสทรี Models (`models.json`)

custom providers ใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้
ไดเรกทอรี agent (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้
จะถูก merge เป็นค่าเริ่มต้น เว้นแต่ `models.mode` จะถูกตั้งเป็น `replace`

ลำดับความสำคัญของโหมด merge สำหรับ provider IDs ที่ตรงกัน:

- `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของเอเจนต์จะมีสิทธิ์เหนือกว่า
- `apiKey` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะมีสิทธิ์เหนือกว่าเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบทคอนฟิก/auth-profile ปัจจุบัน
- ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการบันทึก secrets ที่ resolve แล้ว
- ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
- `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีอยู่จะ fallback ไปยังคอนฟิก `models.providers`
- ฟิลด์อื่น ๆ ของผู้ให้บริการจะถูกรีเฟรชจากคอนฟิกและข้อมูล catalog ที่ normalize แล้ว

การบันทึก marker อ้างอิงแหล่งที่มาเป็นหลัก: OpenClaw จะเขียน markers จาก snapshot คอนฟิกของแหล่งข้อมูลที่กำลังใช้งาน (ก่อนการ resolve) ไม่ใช่จากค่าความลับ runtime ที่ resolve แล้ว
สิ่งนี้มีผลทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`

## ที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางผู้ให้บริการและ auth
- [Model Failover](/th/concepts/model-failover) — สายโซ่ fallback
- [การสร้างภาพ](/th/tools/image-generation) — การกำหนดค่า image model
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่า music model
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่า video model
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/config-agents#agent-defaults) — คีย์คอนฟิกของ model
