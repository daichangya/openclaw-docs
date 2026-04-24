---
read_when:
    - การเพิ่มหรือแก้ไขคำสั่ง `openclaw infer`
    - การออกแบบระบบอัตโนมัติของ capability แบบ headless ที่เสถียร
summary: CLI แบบ infer-first สำหรับเวิร์กโฟลว์ model, image, audio, TTS, video, web และ embedding ที่ขับเคลื่อนด้วยผู้ให้บริการ
title: CLI การอนุมาน
x-i18n:
    generated_at: "2026-04-24T09:02:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` คือพื้นผิวแบบ headless มาตรฐานสำหรับเวิร์กโฟลว์การอนุมานที่ขับเคลื่อนด้วยผู้ให้บริการ

มันตั้งใจเปิดเผยเป็นตระกูล capability ไม่ใช่ชื่อ Gateway RPC ดิบ และไม่ใช่ ID ของเครื่องมือเอเจนต์แบบดิบ

## เปลี่ยน infer ให้เป็น Skill

คัดลอกและวางสิ่งนี้ให้เอเจนต์:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Skill แบบ infer ที่ดีควร:

- แมปเจตนาของผู้ใช้ที่พบบ่อยไปยัง infer subcommand ที่ถูกต้อง
- ใส่ตัวอย่าง infer มาตรฐานไม่กี่ตัวอย่างสำหรับเวิร์กโฟลว์ที่ครอบคลุม
- ใช้ `openclaw infer ...` เป็นหลักในตัวอย่างและคำแนะนำ
- หลีกเลี่ยงการเขียนเอกสารพื้นผิว infer ทั้งหมดซ้ำภายในเนื้อหา Skill

ขอบเขตของ Skill ที่เน้น infer โดยทั่วไป:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## ทำไมต้องใช้ infer

`openclaw infer` มอบ CLI แบบสอดคล้องกันเพียงชุดเดียวสำหรับงานการอนุมานที่ขับเคลื่อนด้วยผู้ให้บริการภายใน OpenClaw

ข้อดี:

- ใช้ผู้ให้บริการและ model ที่กำหนดค่าไว้แล้วใน OpenClaw แทนการต่อ wrapper เฉพาะกิจแยกสำหรับแต่ละ backend
- เก็บเวิร์กโฟลว์ model, image, audio transcription, TTS, video, web และ embedding ไว้ภายใต้ต้นคำสั่งเดียว
- ใช้รูปแบบเอาต์พุต `--json` ที่เสถียรสำหรับสคริปต์ Automation และเวิร์กโฟลว์ที่ขับเคลื่อนโดยเอเจนต์
- เลือกใช้พื้นผิว OpenClaw แบบ first-party เมื่อภารกิจโดยพื้นฐานคือ “รันการอนุมาน”
- ใช้เส้นทาง local ปกติโดยไม่ต้องพึ่ง Gateway สำหรับคำสั่ง infer ส่วนใหญ่

## โครงสร้างคำสั่ง

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

ตารางนี้แมปงานการอนุมานที่พบบ่อยไปยังคำสั่ง infer ที่สอดคล้องกัน

| งาน | คำสั่ง | หมายเหตุ |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| รันพรอมป์ข้อความ/model | `openclaw infer model run --prompt "..." --json`                       | ใช้เส้นทาง local ปกติโดยค่าเริ่มต้น |
| สร้างรูปภาพ | `openclaw infer image generate --prompt "..." --json`                  | ใช้ `image edit` เมื่อต้องเริ่มจากไฟล์ที่มีอยู่ |
| อธิบายไฟล์รูปภาพ | `openclaw infer image describe --file ./image.png --json`              | `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ |
| ถอดเสียงไฟล์เสียง | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` ต้องเป็น `<provider/model>` |
| สังเคราะห์เสียงพูด | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` มุ่งเน้นที่ Gateway |
| สร้างวิดีโอ | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| อธิบายไฟล์วิดีโอ | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` ต้องเป็น `<provider/model>` |
| ค้นหาเว็บ | `openclaw infer web search --query "..." --json`                       |                                                       |
| ดึงหน้าเว็บ | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| สร้าง embeddings | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## พฤติกรรม

- `openclaw infer ...` คือพื้นผิว CLI หลักสำหรับเวิร์กโฟลว์เหล่านี้
- ใช้ `--json` เมื่อเอาต์พุตจะถูกใช้งานโดยคำสั่งหรือสคริปต์อื่น
- ใช้ `--provider` หรือ `--model provider/model` เมื่อต้องการ backend ที่เฉพาะเจาะจง
- สำหรับ `image describe`, `audio transcribe` และ `video describe`, `--model` ต้องอยู่ในรูปแบบ `<provider/model>`
- สำหรับ `image describe`, `--model` แบบ explicit จะรัน provider/model นั้นโดยตรง model ต้องรองรับรูปภาพใน model catalog หรือ config ของผู้ให้บริการ `codex/<model>` จะรัน image-understanding turn ของ Codex app-server แบบ bounded; `openai-codex/<model>` ใช้เส้นทางผู้ให้บริการ OpenAI Codex OAuth
- คำสั่งรันแบบ stateless จะใช้ local เป็นค่าเริ่มต้น
- คำสั่งสถานะที่จัดการโดย Gateway จะใช้ Gateway เป็นค่าเริ่มต้น
- เส้นทาง local ปกติไม่ต้องการให้ Gateway กำลังทำงาน

## Model

ใช้ `model` สำหรับการอนุมานข้อความที่ขับเคลื่อนด้วยผู้ให้บริการ และการตรวจสอบ model/ผู้ให้บริการ

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

หมายเหตุ:

- `model run` ใช้ runtime ของเอเจนต์ซ้ำ ดังนั้น provider/model override จะทำงานเหมือนกับการทำงานของเอเจนต์ตามปกติ
- `model auth login`, `model auth logout` และ `model auth status` ใช้จัดการสถานะการยืนยันตัวตนของผู้ให้บริการที่บันทึกไว้

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
- สำหรับ `image describe`, `--model` ต้องเป็น `<provider/model>` ที่รองรับรูปภาพ
- สำหรับ model vision แบบ local ของ Ollama ให้ pull model ก่อน และตั้ง `OLLAMA_API_KEY` เป็นค่า placeholder ใดก็ได้ เช่น `ollama-local` ดู [Ollama](/th/providers/ollama#vision-and-image-description)

## Audio

ใช้ `audio` สำหรับการถอดเสียงไฟล์

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

หมายเหตุ:

- `audio transcribe` ใช้สำหรับการถอดเสียงไฟล์ ไม่ใช่การจัดการเซสชันแบบเรียลไทม์
- `--model` ต้องเป็น `<provider/model>`

## TTS

ใช้ `tts` สำหรับการสังเคราะห์เสียงพูดและสถานะผู้ให้บริการ TTS

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

หมายเหตุ:

- `tts status` ใช้ Gateway เป็นค่าเริ่มต้น เพราะสะท้อนสถานะ TTS ที่จัดการโดย Gateway
- ใช้ `tts providers`, `tts voices` และ `tts set-provider` เพื่อตรวจสอบและกำหนดค่าพฤติกรรม TTS

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

- ใช้ `web providers` เพื่อตรวจสอบผู้ให้บริการที่พร้อมใช้งาน กำหนดค่าไว้แล้ว และถูกเลือกอยู่

## Embedding

ใช้ `embedding` สำหรับการสร้างเวกเตอร์และการตรวจสอบผู้ให้บริการ embedding

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## เอาต์พุต JSON

คำสั่ง infer จะ normalize เอาต์พุต JSON ภายใต้ envelope ร่วม:

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

ฟิลด์ระดับบนสุดที่เสถียร:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## ข้อผิดพลาดที่พบบ่อย

```bash
# ไม่ดี
openclaw infer media image generate --prompt "friendly lobster"

# ดี
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# ไม่ดี
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# ดี
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## หมายเหตุ

- `openclaw capability ...` เป็น alias ของ `openclaw infer ...`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Models](/th/concepts/models)
