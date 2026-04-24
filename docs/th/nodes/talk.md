---
read_when:
    - การใช้งาน Talk mode บน macOS/iOS/Android
    - การเปลี่ยนพฤติกรรมของเสียง/TTS/interrupt
summary: 'Talk mode: การสนทนาด้วยเสียงต่อเนื่องพร้อม ElevenLabs TTS'
title: Talk mode
x-i18n:
    generated_at: "2026-04-24T09:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Talk mode คือวงจรการสนทนาด้วยเสียงแบบต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่ง transcript ไปยังโมเดล (main session, `chat.send`)
3. รอคำตอบ
4. พูดคำตอบนั้นผ่าน Talk provider ที่กำหนดไว้ (`talk.speak`)

## พฤติกรรม (macOS)

- มี **overlay แบบเปิดตลอด** ขณะเปิดใช้ Talk mode
- การเปลี่ยนเฟส **Listening → Thinking → Speaking**
- เมื่อเกิด **การหยุดสั้น ๆ** (ช่วงเงียบ) transcript ปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนลงใน WebChat** (เหมือนกับการพิมพ์)
- **Interrupt เมื่อมีเสียงพูด** (เปิดเป็นค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะ assistant กำลังพูด เราจะหยุดการเล่นและจด timestamp ของการขัดจังหวะไว้สำหรับ prompt ถัดไป

## คำสั่งเสียงในคำตอบ

assistant สามารถใส่ **บรรทัด JSON เดียว** นำหน้าคำตอบเพื่อควบคุมเสียงได้:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- ใช้เฉพาะบรรทัดแรกที่ไม่ว่างเท่านั้น
- คีย์ที่ไม่รู้จักจะถูกละเว้น
- `once: true` ใช้กับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once`, เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่ของ Talk mode
- บรรทัด JSON จะถูกลบออกก่อนเล่น TTS

คีย์ที่รองรับ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

ค่าเริ่มต้น:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: หากไม่ได้ตั้งค่า Talk จะใช้ช่วงเวลาหยุดก่อนส่ง transcript ตามค่าเริ่มต้นของแพลตฟอร์ม (`700 ms` บน macOS และ Android, `900 ms` บน iOS)
- `voiceId`: fallback ไปที่ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (หรือใช้เสียง ElevenLabs ตัวแรกเมื่อมี API key)
- `modelId`: ค่าเริ่มต้นเป็น `eleven_v3` หากไม่ได้ตั้งค่า
- `apiKey`: fallback ไปที่ `ELEVENLABS_API_KEY` (หรือ gateway shell profile หากมี)
- `outputFormat`: ค่าเริ่มต้นเป็น `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้ง `mp3_*` เพื่อบังคับให้สตรีมเป็น MP3)

## UI บน macOS

- สลับจากแถบเมนู: **Talk**
- แท็บ Config: กลุ่ม **Talk Mode** (voice id + interrupt toggle)
- Overlay:
  - **Listening**: กลุ่มเมฆเต้นตามระดับไมค์
  - **Thinking**: แอนิเมชันยุบตัว
  - **Speaking**: วงแห่กระจายออก
  - คลิกกลุ่มเมฆ: หยุดการพูด
  - คลิก X: ออกจาก Talk mode

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- ใช้ `chat.send` กับ session key `main`
- gateway จะ resolve การเล่น Talk ผ่าน `talk.speak` โดยใช้ Talk provider ที่กำลังใช้งาน Android จะ fallback ไปใช้ local system TTS ก็ต่อเมื่อ RPC นี้ไม่พร้อมใช้งาน
- `stability` สำหรับ `eleven_v3` จะถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; โมเดลอื่นรองรับ `0..1`
- `latency_tier` จะถูกตรวจสอบให้อยู่ในช่วง `0..4` เมื่อมีการตั้งค่า
- Android รองรับ output formats แบบ `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack แบบ low-latency

## ที่เกี่ยวข้อง

- [Voice wake](/th/nodes/voicewake)
- [Audio and voice notes](/th/nodes/audio)
- [Media understanding](/th/nodes/media-understanding)
