---
read_when:
    - การติดตั้งใช้งาน Talk Mode บน macOS/iOS/Android
    - การเปลี่ยนพฤติกรรมเสียง/TTS/การขัดจังหวะ
summary: 'Talk mode: การสนทนาด้วยเสียงต่อเนื่องพร้อม ElevenLabs TTS'
title: Talk Mode
x-i18n:
    generated_at: "2026-04-23T05:43:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Talk Mode

Talk Mode คือวงจรการสนทนาด้วยเสียงต่อเนื่อง:

1. ฟังเสียงพูด
2. ส่ง transcript ไปยังโมเดล (เซสชันหลัก, `chat.send`)
3. รอการตอบกลับ
4. พูดคำตอบนั้นผ่านผู้ให้บริการ Talk ที่ตั้งค่าไว้ (`talk.speak`)

## พฤติกรรม (macOS)

- มี **overlay แบบ always-on** ขณะที่เปิดใช้ Talk Mode
- มีการเปลี่ยนสถานะระหว่าง **Listening → Thinking → Speaking**
- เมื่อมี **การหยุดสั้น ๆ** (ช่วงหน้าต่างของความเงียบ) transcript ปัจจุบันจะถูกส่ง
- คำตอบจะถูก **เขียนลงใน WebChat** (เหมือนกับการพิมพ์)
- **ขัดจังหวะเมื่อมีเสียงพูด** (เปิดโดยค่าเริ่มต้น): หากผู้ใช้เริ่มพูดขณะที่ผู้ช่วยกำลังพูดอยู่ เราจะหยุดการเล่น และบันทึก timestamp ของการขัดจังหวะไว้สำหรับ prompt ถัดไป

## คำสั่งเกี่ยวกับเสียงในคำตอบ

ผู้ช่วยสามารถใส่ **JSON หนึ่งบรรทัด** ไว้หน้าคำตอบเพื่อควบคุมเสียงได้:

```json
{ "voice": "<voice-id>", "once": true }
```

กฎ:

- ใช้เฉพาะบรรทัดแรกที่ไม่ว่าง
- คีย์ที่ไม่รู้จักจะถูกเพิกเฉย
- `once: true` มีผลเฉพาะกับคำตอบปัจจุบันเท่านั้น
- หากไม่มี `once` เสียงนั้นจะกลายเป็นค่าเริ่มต้นใหม่ของ Talk Mode
- บรรทัด JSON จะถูกตัดออกก่อนการเล่นผ่าน TTS

คีย์ที่รองรับ:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## คอนฟิก (`~/.openclaw/openclaw.json`)

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
- `silenceTimeoutMs`: หากไม่ได้ตั้งค่า Talk จะใช้หน้าต่างช่วงหยุดตามค่าเริ่มต้นของแพลตฟอร์มก่อนส่ง transcript (`700 ms` บน macOS และ Android, `900 ms` บน iOS)
- `voiceId`: fallback ไปใช้ `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (หรือเสียง ElevenLabs ตัวแรกเมื่อมี API key)
- `modelId`: หากไม่ได้ตั้งค่า จะใช้ค่าเริ่มต้นเป็น `eleven_v3`
- `apiKey`: fallback ไปใช้ `ELEVENLABS_API_KEY` (หรือ shell profile ของ Gateway หากมี)
- `outputFormat`: ค่าเริ่มต้นคือ `pcm_44100` บน macOS/iOS และ `pcm_24000` บน Android (ตั้ง `mp3_*` เพื่อบังคับการสตรีมแบบ MP3)

## UI บน macOS

- สวิตช์บนแถบเมนู: **Talk**
- แท็บคอนฟิก: กลุ่ม **Talk Mode** (voice id + สวิตช์การขัดจังหวะ)
- Overlay:
  - **Listening**: เมฆเต้นเป็นจังหวะตามระดับไมค์
  - **Thinking**: แอนิเมชันยุบตัวลง
  - **Speaking**: วงแหวนแผ่ออก
  - คลิกเมฆ: หยุดการพูด
  - คลิก X: ออกจาก Talk Mode

## หมายเหตุ

- ต้องมีสิทธิ์ Speech + Microphone
- ใช้ `chat.send` กับ session key `main`
- Gateway จะ resolve การเล่นเสียงของ Talk ผ่าน `talk.speak` โดยใช้ผู้ให้บริการ Talk ที่ active อยู่ Android จะ fallback ไปใช้ TTS ของระบบภายในเครื่องเฉพาะเมื่อ RPC นั้นใช้งานไม่ได้
- `stability` สำหรับ `eleven_v3` จะถูกตรวจสอบให้เป็น `0.0`, `0.5` หรือ `1.0`; ส่วนโมเดลอื่นรองรับ `0..1`
- `latency_tier` จะถูกตรวจสอบให้อยู่ในช่วง `0..4` เมื่อมีการตั้งค่า
- Android รองรับรูปแบบเอาต์พุต `pcm_16000`, `pcm_22050`, `pcm_24000` และ `pcm_44100` สำหรับการสตรีม AudioTrack แบบหน่วงต่ำ
