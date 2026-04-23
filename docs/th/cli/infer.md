---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติด้านความสามารถแบบ headless ที่เสถียร
summary: CLI แบบ infer-first สำหรับเวิร์กโฟลว์ model, image, audio, TTS, video, web และ embedding ที่ขับเคลื่อนด้วย provider
title: Inference CLI
x-i18n:
    generated_at: "2026-04-23T06:18:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# Inference CLI

`openclaw infer` คือพื้นผิวแบบ headless มาตรฐานสำหรับเวิร์กโฟลว์ inference ที่ขับเคลื่อนด้วย provider

โดยเจตนาแล้ว คำสั่งนี้จะเปิดเผยเป็นตระกูลความสามารถ ไม่ใช่ชื่อ gateway RPC แบบดิบ และไม่ใช่ raw agent tool ids

## เปลี่ยน infer ให้เป็น skill

คัดลอกและวางสิ่งนี้ให้กับ agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

skill ที่อิง infer ที่ดีควร:

- แมปเจตนาทั่วไปของผู้ใช้ไปยังคำสั่งย่อย infer ที่ถูกต้อง
- มีตัวอย่าง infer มาตรฐานไม่กี่ตัวอย่างสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- ใช้ `openclaw infer ...` ในตัวอย่างและคำแนะนำเป็นหลัก
- หลีกเลี่ยงการทำเอกสารพื้นผิว infer ทั้งหมดซ้ำอีกครั้งภายในเนื้อหา skill

ขอบเขตของ skill ที่มุ่งเน้น infer โดยทั่วไป:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## เหตุผลที่ควรใช้ infer

`openclaw infer` มอบ CLI แบบสอดคล้องกันหนึ่งเดียวสำหรับงาน inference ที่ขับเคลื่อนด้วย provider ภายใน OpenClaw

ข้อดี:

- ใช้ providers และ models ที่ตั้งค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper แบบใช้ครั้งเดียวสำหรับแต่ละ backend
- จัดเวิร์กโฟลว์ model, image, audio transcription, TTS, video, web และ embedding ไว้ภายใต้โครงคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ ระบบอัตโนมัติ และเวิร์กโฟลว์ที่ขับเคลื่อนด้วย agent
- ใช้พื้นผิวของ OpenClaw ที่เป็น first-party เมื่อภารกิจนั้นโดยพื้นฐานคือ "รัน inference"
- ใช้เส้นทาง local ตามปกติได้โดยไม่ต้องใช้ Gateway สำหรับคำสั่ง infer ส่วนใหญ่

## โครงคำสั่ง

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## งานที่พบบ่อย

ตารางนี้แมปงาน inference ที่พบบ่อยไปยังคำสั่ง infer ที่เกี่ยวข้อง

| งาน | คำสั่ง | หมายเหตุ |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| รันพรอมป์ต์ข้อความ/โมเดล | `openclaw infer model run --prompt "..." --json`                       | ใช้เส้นทาง local ตามปกติโดยค่าเริ่มต้น |
| สร้างภาพ | `openclaw infer image generate --prompt "..." --json`                  | ใช้ `image edit` เมื่อต้องเริ่มจากไฟล์ที่มีอยู่ |
| อธิบายไฟล์ภาพ | `openclaw infer image describe --file ./image.png --json`              | `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ |
| ถอดเสียงเสียง | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` ต้องเป็น `<provider/model>` |
| สังเคราะห์เสียงพูด | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` มุ่งเน้นไปที่ gateway |
| สร้างวิดีโอ | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| อธิบายไฟล์วิดีโอ | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` ต้องเป็น `<provider/model>` |
| ค้นหาเว็บ | `openclaw infer web search --query "..." --json`                       |                                                       |
| ดึงหน้าเว็บ | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| สร้าง embeddings | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## พฤติกรรม

- `openclaw infer ...` เป็นพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกนำไปใช้โดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องใช้ backend เฉพาะ
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องอยู่ในรูปแบบ `<provider/model>`
- สำหรับ `image describe`, การระบุ `--model` อย่างชัดเจนจะรัน provider/model นั้นโดยตรง โมเดลต้องรองรับภาพใน model catalog หรือ config ของ provider
- คำสั่ง execution แบบไร้ state ใช้ local โดยค่าเริ่มต้น
- คำสั่ง state ที่จัดการโดย Gateway ใช้ gateway โดยค่าเริ่มต้น
- เส้นทาง local ตามปกติไม่จำเป็นต้องให้ gateway กำลังรันอยู่

## Model

ใช้ `model` สำหรับ text inference ที่ขับเคลื่อนด้วย provider และการตรวจสอบ model/provider

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

หมายเหตุ:

- `model run` ใช้ runtime ของ agent ซ้ำ ดังนั้นการ override provider/model จะทำงานเหมือนการรัน agent ตามปกติ
- `model auth login`, `model auth logout` และ `model auth status` ใช้จัดการสถานะ auth ของ provider ที่บันทึกไว้

## Image

ใช้ `image` สำหรับการสร้าง การแก้ไข และการอธิบาย

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

หมายเหตุ:

- ใช้ `image edit` เมื่อต้องเริ่มจากไฟล์อินพุตที่มีอยู่
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับภาพ
- สำหรับโมเดล vision ของ Ollama แบบ local ให้ดึงโมเดลก่อน แล้วตั้งค่า `OLLAMA_API_KEY` เป็นค่า placeholder ใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## Audio

ใช้ `audio` สำหรับการถอดเสียงจากไฟล์

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

หมายเหตุ:

- `audio transcribe` ใช้สำหรับการถอดเสียงจากไฟล์ ไม่ใช่การจัดการเซสชันแบบเรียลไทม์
- `--model` ต้องเป็น `<provider/model>`

## TTS

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะ provider ของ TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` ใช้ gateway โดยค่าเริ่มต้น เพราะสะท้อนสถานะ TTS ที่จัดการโดย gateway
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรมของ TTS

## Video

ใช้ `video` สำหรับการสร้างและการอธิบาย

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

หมายเหตุ:

- `--model` ต้องเป็น `<provider/model>` สำหรับ `video describe`

## Web

ใช้ `web` สำหรับเวิร์กโฟลว์การค้นหาและการดึงข้อมูล

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

หมายเหตุ:

- ใช้ `web providers` เพื่อตรวจสอบ providers ที่พร้อมใช้งาน ที่ตั้งค่าไว้ และที่ถูกเลือก

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบ embedding provider

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer จะปรับเอาต์พุต JSON ให้อยู่ภายใต้ envelope ที่ใช้ร่วมกัน:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

ฟิลด์ระดับบนสุดมีความเสถียร:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## จุดพลาดที่พบบ่อย

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## หมายเหตุ

- `openclaw capability ...` เป็นชื่อเรียกแทนของ `openclaw infer ...`
