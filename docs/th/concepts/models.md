---
read_when:
    - การเพิ่มหรือแก้ไข CLI ของโมเดล (models list/set/scan/aliases/fallbacks)
    - การเปลี่ยนพฤติกรรม fallback ของโมเดลหรือ UX การเลือกโมเดล
    - การอัปเดต probe การสแกนโมเดล (tools/images)
summary: 'CLI ของโมเดล: แสดงรายการ ตั้งค่า aliases fallback สแกน สถานะ'
title: CLI ของโมเดล
x-i18n:
    generated_at: "2026-04-23T05:30:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18d915f3f761aaff5efc3bf752f5abddeb625e1a386ab3d701f46fd92244f20e
    source_path: concepts/models.md
    workflow: 15
---

# CLI ของโมเดล

ดู [/concepts/model-failover](/th/concepts/model-failover) สำหรับการหมุนเวียน auth profile, cooldown และการทำงานร่วมกับ fallback
ภาพรวมผู้ให้บริการแบบย่อพร้อมตัวอย่าง: [/concepts/model-providers](/th/concepts/model-providers)

## วิธีการทำงานของการเลือกโมเดล

OpenClaw เลือกโมเดลตามลำดับนี้:

1. โมเดล **Primary** (`agents.defaults.model.primary` หรือ `agents.defaults.model`)
2. **Fallback** ใน `agents.defaults.model.fallbacks` (ตามลำดับ)
3. **Provider auth failover** จะเกิดขึ้นภายในผู้ให้บริการก่อนย้ายไปยังโมเดลถัดไป

ที่เกี่ยวข้อง:

- `agents.defaults.models` คือ allowlist/catalog ของโมเดลที่ OpenClaw ใช้ได้ (รวม aliases)
- `agents.defaults.imageModel` จะใช้ **เฉพาะเมื่อ** โมเดล primary ไม่สามารถรับภาพได้
- `agents.defaults.pdfModel` ใช้โดยเครื่องมือ `pdf` หากไม่ได้ระบุไว้ เครื่องมือจะ fallback ไปยัง `agents.defaults.imageModel` แล้วตามด้วยโมเดล session/default ที่ resolve แล้ว
- `agents.defaults.imageGenerationModel` ใช้โดยความสามารถสร้างภาพที่ใช้ร่วมกัน หากไม่ได้ระบุ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงตามด้วยผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.musicGenerationModel` ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน หากไม่ได้ระบุ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงตามด้วยผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นด้วย
- `agents.defaults.videoGenerationModel` ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน หากไม่ได้ระบุ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มี auth รองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงตามด้วยผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id หากคุณตั้งผู้ให้บริการ/โมเดลแบบเฉพาะเจาะจง ให้กำหนดค่า auth/API key ของผู้ให้บริการนั้นด้วย
- ค่าเริ่มต้นรายเอเจนต์สามารถ override `agents.defaults.model` ได้ผ่าน `agents.list[].model` ร่วมกับ bindings (ดู [/concepts/multi-agent](/th/concepts/multi-agent))

## นโยบายโมเดลแบบย่อ

- ตั้ง primary ของคุณเป็นโมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดเท่าที่คุณเข้าถึงได้
- ใช้ fallback สำหรับงานที่ไวต่อค่าใช้จ่าย/latency และแชตที่มีความสำคัญต่ำกว่า
- สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรืออินพุตที่ไม่น่าเชื่อถือ ให้หลีกเลี่ยงโมเดลรุ่นเก่าหรืออ่อนกว่า

## การเริ่มต้นใช้งาน (แนะนำ)

หากคุณไม่ต้องการแก้ไข config ด้วยมือ ให้รัน onboarding:

```bash
openclaw onboard
```

คำสั่งนี้สามารถตั้งค่าโมเดล + auth สำหรับผู้ให้บริการทั่วไปได้ รวมถึง **OpenAI Code (Codex) subscription** (OAuth) และ **Anthropic** (API key หรือ Claude CLI)

## คีย์ config (ภาพรวม)

- `agents.defaults.model.primary` และ `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` และ `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` และ `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` และ `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` และ `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + provider params)
- `models.providers` (ผู้ให้บริการแบบกำหนดเองที่เขียนลงใน `models.json`)

model ref จะถูก normalize เป็นตัวพิมพ์เล็ก alias ของผู้ให้บริการ เช่น `z.ai/*` จะถูก normalize เป็น `zai/*`

ตัวอย่างการกำหนดค่าผู้ให้บริการ (รวมถึง OpenCode) อยู่ที่
[/providers/opencode](/th/providers/opencode)

### การแก้ไข allowlist อย่างปลอดภัย

ใช้การเขียนแบบ additive เมื่ออัปเดต `agents.defaults.models` ด้วยมือ:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` ป้องกันไม่ให้เกิดการเขียนทับ map ของ model/provider โดยไม่ตั้งใจ การกำหนด object ตรง ๆ ให้กับ `agents.defaults.models`, `models.providers` หรือ `models.providers.<id>.models` จะถูกปฏิเสธหากทำให้รายการเดิมหายไป ใช้ `--merge` สำหรับการเปลี่ยนแปลงแบบ additive; ใช้ `--replace` เฉพาะเมื่อค่าที่ให้มาควรกลายเป็นค่าปลายทางทั้งหมด

การตั้งค่าผู้ให้บริการแบบโต้ตอบและ `openclaw configure --section model` จะ merge รายการที่เลือกในขอบเขตของผู้ให้บริการเข้ากับ allowlist ที่มีอยู่ด้วย ดังนั้นการเพิ่ม Codex, Ollama หรือผู้ให้บริการอื่นจะไม่ทำให้รายการโมเดลที่ไม่เกี่ยวข้องหายไป

## "Model is not allowed" (และเหตุใดคำตอบจึงหยุด)

หากมีการตั้งค่า `agents.defaults.models` ไว้ มันจะกลายเป็น **allowlist** สำหรับ `/model` และสำหรับ session override เมื่อผู้ใช้เลือกโมเดลที่ไม่ได้อยู่ใน allowlist นั้น OpenClaw จะตอบกลับว่า:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

สิ่งนี้เกิดขึ้น **ก่อน** จะมีการสร้างคำตอบปกติ ดังนั้นข้อความอาจให้ความรู้สึกเหมือน “ไม่ตอบกลับ” วิธีแก้คือทำอย่างใดอย่างหนึ่งต่อไปนี้:

- เพิ่มโมเดลนั้นลงใน `agents.defaults.models`, หรือ
- ล้าง allowlist (ลบ `agents.defaults.models`), หรือ
- เลือกโมเดลจาก `/model list`

ตัวอย่าง config ของ allowlist:

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

- `/model` (และ `/model list`) เป็นตัวเลือกแบบย่อที่มีหมายเลขกำกับ (ตระกูลโมเดล + ผู้ให้บริการที่ใช้ได้)
- บน Discord, `/model` และ `/models` จะเปิดตัวเลือกแบบโต้ตอบพร้อม dropdown ของผู้ให้บริการและโมเดล รวมถึงขั้นตอน Submit
- `/models add` เปิดใช้งานเป็นค่าเริ่มต้นและสามารถปิดได้ด้วย `commands.modelsWrite=false`
- เมื่อเปิดใช้แล้ว `/models add <provider> <modelId>` เป็นเส้นทางที่เร็วที่สุด; `/models add` แบบไม่มีอาร์กิวเมนต์จะเริ่มโฟลว์แบบมีคำแนะนำที่ให้เลือกผู้ให้บริการก่อนในกรณีที่รองรับ
- หลังจาก `/models add` โมเดลใหม่จะพร้อมใช้งานใน `/models` และ `/model` โดยไม่ต้องรีสตาร์ต gateway
- `/model <#>` ใช้เลือกจากตัวเลือกนั้น
- `/model` จะบันทึกการเลือกเซสชันใหม่ทันที
- หากเอเจนต์ว่างอยู่ การรันถัดไปจะใช้โมเดลใหม่ทันที
- หากมีการรันที่กำลังทำงานอยู่แล้ว OpenClaw จะทำเครื่องหมายว่าการสลับ live กำลังรอดำเนินการ และจะรีสตาร์ตไปยังโมเดลใหม่เฉพาะที่จุด retry ที่สะอาด
- หากกิจกรรมของเครื่องมือหรือผลลัพธ์คำตอบเริ่มต้นแล้ว การสลับที่รอดำเนินการอาจยังค้างอยู่จนกว่าจะมีโอกาส retry ในภายหลังหรือถึงเทิร์นผู้ใช้ถัดไป
- `/model status` คือมุมมองแบบละเอียด (auth candidate และเมื่อมีการกำหนดค่าไว้ จะรวม provider endpoint `baseUrl` + โหมด `api`)
- model ref จะถูก parse โดยแยกที่ `/` **ตัวแรก** ใช้รูปแบบ `provider/model` เมื่อพิมพ์ `/model <ref>`
- หาก model ID เองมี `/` อยู่ด้วย (สไตล์ OpenRouter) คุณต้องใส่ provider prefix ด้วย (ตัวอย่าง: `/model openrouter/moonshotai/kimi-k2`)
- หากคุณละ provider ไว้ OpenClaw จะ resolve อินพุตตามลำดับนี้:
  1. ตรงกับ alias
  2. ตรงกับ configured-provider ที่ไม่กำกวมสำหรับ unprefixed model id ตรงตัวนั้น
  3. fallback แบบ deprecated ไปยัง configured default provider
     หากผู้ให้บริการนั้นไม่เปิดให้ใช้ configured default model อีกต่อไป OpenClaw
     จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้แทน เพื่อหลีกเลี่ยง
     การแสดงค่าเริ่มต้นจากผู้ให้บริการที่ถูกลบออกไปแล้วแต่ยังค้างอยู่

พฤติกรรม/การกำหนดค่าของคำสั่งแบบเต็ม: [Slash commands](/th/tools/slash-commands)

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

จะแสดงโมเดลที่กำหนดค่าไว้เป็นค่าเริ่มต้น แฟลกที่มีประโยชน์:

- `--all`: catalog แบบเต็ม
- `--local`: เฉพาะผู้ให้บริการภายในเครื่อง
- `--provider <name>`: กรองตามผู้ให้บริการ
- `--plain`: หนึ่งโมเดลต่อหนึ่งบรรทัด
- `--json`: เอาต์พุตแบบ machine‑readable

`--all` จะรวมแถว catalog แบบ static ที่ผู้ให้บริการเป็นเจ้าของและมาพร้อมระบบก่อนที่จะมีการกำหนดค่า auth ดังนั้นมุมมองแบบ discovery-only จึงสามารถแสดงโมเดลที่ยังใช้งานไม่ได้จนกว่าคุณจะเพิ่มข้อมูลรับรองของผู้ให้บริการที่ตรงกัน

### `models status`

แสดงโมเดล primary ที่ resolve แล้ว, fallback, image model และภาพรวม auth ของผู้ให้บริการที่กำหนดค่าไว้ นอกจากนี้ยังแสดงสถานะการหมดอายุของ OAuth สำหรับ profile ที่พบใน auth store (เตือนล่วงหน้าโดยค่าเริ่มต้นภายใน 24 ชม.) `--plain` จะพิมพ์เฉพาะโมเดล primary ที่ resolve แล้ว
สถานะ OAuth จะแสดงเสมอ (และรวมอยู่ในเอาต์พุต `--json`) หากผู้ให้บริการที่กำหนดค่าไว้ไม่มีข้อมูลรับรอง `models status` จะแสดงส่วน **Missing auth**
JSON จะรวม `auth.oauth` (ช่วงเวลาเตือน + profiles) และ `auth.providers` (auth ที่มีผลจริงต่อผู้ให้บริการแต่ละราย รวมถึงข้อมูลรับรองจาก env) `auth.oauth` แสดงเฉพาะสุขภาพของ profile ใน auth-store; ผู้ให้บริการที่ใช้ env-only จะไม่ปรากฏในส่วนนั้น
ใช้ `--check` สำหรับงานอัตโนมัติ (exit `1` เมื่อไม่มี/หมดอายุ, `2` เมื่อใกล้หมดอายุ)
ใช้ `--probe` สำหรับตรวจสอบ auth แบบ live; แถว probe อาจมาจาก auth profile, ข้อมูลรับรองจาก env หรือ `models.json`
หาก `auth.order.<provider>` แบบ explicit ละ profile ที่เก็บไว้ตัวหนึ่งออกไป probe จะรายงาน
`excluded_by_auth_order` แทนการลองใช้ profile นั้น หากมี auth แต่ไม่สามารถ resolve โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น probe จะรายงาน `status: no_model`

การเลือก auth ขึ้นกับผู้ให้บริการ/บัญชี สำหรับโฮสต์ gateway ที่ทำงานตลอดเวลา API key มักคาดเดาได้มากที่สุด; รองรับการใช้ Claude CLI ซ้ำและ Anthropic OAuth/token profile ที่มีอยู่ด้วย

ตัวอย่าง (Claude CLI):

```bash
claude auth login
openclaw models status
```

## การสแกน (โมเดลฟรีของ OpenRouter)

`openclaw models scan` จะตรวจสอบ **catalog โมเดลฟรี** ของ OpenRouter และสามารถ probe โมเดลเพิ่มเติมเพื่อดูการรองรับ tools และภาพได้

แฟลกหลัก:

- `--no-probe`: ข้ามการ probe แบบ live (เอาเฉพาะ metadata)
- `--min-params <b>`: ขนาดพารามิเตอร์ขั้นต่ำ (พันล้าน)
- `--max-age-days <days>`: ข้ามโมเดลที่เก่ากว่า
- `--provider <name>`: กรองตาม provider prefix
- `--max-candidates <n>`: ขนาดรายการ fallback
- `--set-default`: ตั้ง `agents.defaults.model.primary` เป็นรายการที่เลือกตัวแรก
- `--set-image`: ตั้ง `agents.defaults.imageModel.primary` เป็นรายการภาพตัวแรกที่เลือก

การ probe ต้องใช้ OpenRouter API key (จาก auth profile หรือ
`OPENROUTER_API_KEY`) หากไม่มีคีย์ ให้ใช้ `--no-probe` เพื่อแสดงเฉพาะ candidate

ผลลัพธ์การสแกนจะถูกจัดอันดับตาม:

1. การรองรับภาพ
2. latency ของเครื่องมือ
3. ขนาด context
4. จำนวนพารามิเตอร์

อินพุต

- รายการ `/models` ของ OpenRouter (กรอง `:free`)
- ต้องมี OpenRouter API key จาก auth profile หรือ `OPENROUTER_API_KEY` (ดู [/environment](/th/help/environment))
- ตัวกรองเพิ่มเติมที่เป็นตัวเลือก: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- ตัวควบคุมการ probe: `--timeout`, `--concurrency`

เมื่อรันใน TTY คุณสามารถเลือก fallback แบบโต้ตอบได้ ในโหมดไม่โต้ตอบ ให้ส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น

## registry ของโมเดล (`models.json`)

ผู้ให้บริการแบบกำหนดเองใน `models.providers` จะถูกเขียนลงใน `models.json` ภายใต้ไดเรกทอรีของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/agents/<agentId>/agent/models.json`) ไฟล์นี้จะถูก merge โดยค่าเริ่มต้น เว้นแต่ `models.mode` จะถูกตั้งเป็น `replace`

ลำดับความสำคัญของโหมด merge สำหรับ provider ID ที่ตรงกัน:

- `baseUrl` ที่ไม่ว่างและมีอยู่แล้วใน `models.json` ของเอเจนต์จะมีความสำคัญกว่า
- `apiKey` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะมีความสำคัญกว่าเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
- ค่า `apiKey` ของผู้ให้บริการที่ถูกจัดการด้วย SecretRef จะถูกรีเฟรชจาก source marker (`ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref) แทนการบันทึก secret ที่ resolve แล้ว
- ค่าของ header ของผู้ให้บริการที่ถูกจัดการด้วย SecretRef จะถูกรีเฟรชจาก source marker (`secretref-env:ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref)
- `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีจะ fallback ไปยัง config `models.providers`
- ฟิลด์อื่น ๆ ของผู้ให้บริการจะถูกรีเฟรชจาก config และข้อมูล catalog ที่ผ่าน normalization แล้ว

การบันทึก marker จะยึด source เป็นแหล่งอ้างอิงหลัก: OpenClaw จะเขียน marker จากสแนปช็อต config ของ source ที่กำลังใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่า secret ของรันไทม์ที่ resolve แล้ว
สิ่งนี้ใช้ทุกครั้งที่ OpenClaw สร้าง `models.json` ใหม่ รวมถึงเส้นทางที่ขับเคลื่อนด้วยคำสั่ง เช่น `openclaw agent`

## ที่เกี่ยวข้อง

- [ผู้ให้บริการโมเดล](/th/concepts/model-providers) — การกำหนดเส้นทางและ auth ของผู้ให้บริการ
- [Model Failover](/th/concepts/model-failover) — ห่วงโซ่ fallback
- [การสร้างภาพ](/th/tools/image-generation) — การกำหนดค่าโมเดลภาพ
- [การสร้างเพลง](/th/tools/music-generation) — การกำหนดค่าโมเดลเพลง
- [การสร้างวิดีโอ](/th/tools/video-generation) — การกำหนดค่าโมเดลวิดีโอ
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#agent-defaults) — คีย์ config ของค่าเริ่มต้นเอเจนต์
