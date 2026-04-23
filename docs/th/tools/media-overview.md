---
read_when:
    - กำลังมองหาภาพรวมของความสามารถด้านสื่อ
    - กำลังตัดสินใจว่าจะกำหนดค่าผู้ให้บริการสื่อรายใด Аԥсanalysis to=functions.read 】【。】【”】【commentary to=functions.read  全民彩票json 娱乐平台开户{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}ացինuser to=functions.read commentary ՞նչjson ാരാഷ്ട്രcasino{"path":"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md","offset":1,"limit":20}"}
    - กำลังทำความเข้าใจว่าการสร้างสื่อแบบ async ทำงานอย่างไร
summary: หน้าเริ่มต้นแบบรวมสำหรับความสามารถด้านการสร้างสื่อ การทำความเข้าใจสื่อ และคำพูด
title: ภาพรวมสื่อ
x-i18n:
    generated_at: "2026-04-23T06:02:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 999ed1c58a6d80c4bd6deef6e2dbf55b253c0dee3eb974ed212ca2fa91ec445e
    source_path: tools/media-overview.md
    workflow: 15
---

# การสร้างและการทำความเข้าใจสื่อ

OpenClaw สร้างภาพ วิดีโอ และดนตรี ทำความเข้าใจสื่อขาเข้า (ภาพ เสียง วิดีโอ) และพูดคำตอบออกเสียงด้วย text-to-speech ความสามารถด้านสื่อทั้งหมดขับเคลื่อนด้วยเครื่องมือ: เอเจนต์จะตัดสินใจว่าจะใช้เมื่อใดตามบทสนทนา และแต่ละเครื่องมือจะปรากฏเฉพาะเมื่อมีการกำหนดค่าผู้ให้บริการที่รองรับอย่างน้อยหนึ่งราย

## ภาพรวมความสามารถ

| ความสามารถ           | เครื่องมือ             | ผู้ให้บริการ                                                                                    | สิ่งที่ทำ                                            |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| การสร้างภาพ     | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | สร้างหรือแก้ไขภาพจากข้อความ prompt หรือภาพอ้างอิง |
| การสร้างวิดีโอ     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | สร้างวิดีโอจากข้อความ ภาพ หรือวิดีโอที่มีอยู่    |
| การสร้างดนตรี     | `music_generate` | ComfyUI, Google, MiniMax                                                                     | สร้างดนตรีหรือแทร็กเสียงจากข้อความ prompt         |
| Text-to-speech (TTS) | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | แปลงคำตอบขาออกเป็นเสียงพูด               |
| การทำความเข้าใจสื่อ  | (อัตโนมัติ)      | ผู้ให้บริการโมเดลที่รองรับ vision/audio ใดก็ได้ รวมถึง CLI fallbacks                                  | สรุปภาพ เสียง และวิดีโอขาเข้า             |

## เมทริกซ์ความสามารถของผู้ให้บริการ

ตารางนี้แสดงว่าผู้ให้บริการรายใดรองรับความสามารถด้านสื่อใดบ้างในทั้งแพลตฟอร์ม

| ผู้ให้บริการ   | ภาพ | วิดีโอ | ดนตรี | TTS | STT / การถอดเสียง | การทำความเข้าใจสื่อ |
| ---------- | ----- | ----- | ----- | --- | ------------------- | ------------------- |
| Alibaba    |       | Yes   |       |     |                     |                     |
| BytePlus   |       | Yes   |       |     |                     |                     |
| ComfyUI    | Yes   | Yes   | Yes   |     |                     |                     |
| Deepgram   |       |       |       |     | Yes                 |                     |
| ElevenLabs |       |       |       | Yes | Yes                 |                     |
| fal        | Yes   | Yes   |       |     |                     |                     |
| Google     | Yes   | Yes   | Yes   |     |                     | Yes                 |
| Microsoft  |       |       |       | Yes |                     |                     |
| MiniMax    | Yes   | Yes   | Yes   | Yes |                     |                     |
| Mistral    |       |       |       |     | Yes                 |                     |
| OpenAI     | Yes   | Yes   |       | Yes | Yes                 | Yes                 |
| Qwen       |       | Yes   |       |     |                     |                     |
| Runway     |       | Yes   |       |     |                     |                     |
| Together   |       | Yes   |       |     |                     |                     |
| Vydra      | Yes   | Yes   |       |     |                     |                     |
| xAI        | Yes   | Yes   |       | Yes | Yes                 | Yes                 |

<Note>
การทำความเข้าใจสื่อใช้โมเดลใดก็ได้ที่รองรับ vision หรือ audio ซึ่งลงทะเบียนไว้ในการกำหนดค่าผู้ให้บริการของคุณ ตารางด้านบนเน้นผู้ให้บริการที่รองรับการทำความเข้าใจสื่อแบบเฉพาะทาง; ผู้ให้บริการ LLM ส่วนใหญ่ที่มีโมเดลหลายรูปแบบ (Anthropic, Google, OpenAI ฯลฯ) ก็สามารถทำความเข้าใจสื่อขาเข้าได้เช่นกัน เมื่อมีการกำหนดค่าให้เป็นโมเดลตอบกลับที่กำลังใช้งานอยู่
</Note>

## วิธีที่การสร้างแบบ async ทำงาน

การสร้างวิดีโอและดนตรีทำงานเป็นงานเบื้องหลัง เพราะการประมวลผลของผู้ให้บริการมักใช้เวลาตั้งแต่ 30 วินาทีจนถึงหลายนาที เมื่อเอเจนต์เรียก `video_generate` หรือ `music_generate` OpenClaw จะส่งคำขอไปยังผู้ให้บริการ คืน task ID กลับมาทันที และติดตามงานใน task ledger เอเจนต์จะตอบข้อความอื่นต่อได้ในขณะที่งานกำลังรัน เมื่อผู้ให้บริการทำงานเสร็จ OpenClaw จะปลุกเอเจนต์เพื่อให้มันโพสต์สื่อที่เสร็จแล้วกลับไปยังช่องทางเดิม การสร้างภาพและ TTS เป็นแบบ synchronous และเสร็จภายในคำตอบเดียวกัน

Deepgram, ElevenLabs, Mistral, OpenAI และ xAI ทั้งหมดสามารถถอดเสียง
เสียงขาเข้าผ่านเส้นทาง `tools.media.audio` แบบ batch เมื่อมีการกำหนดค่าไว้ Deepgram,
ElevenLabs, Mistral, OpenAI และ xAI ยังลงทะเบียนผู้ให้บริการ STT แบบสตรีมสำหรับ Voice Call ด้วย ดังนั้นเสียงโทรศัพท์แบบสดจึงสามารถส่งต่อไปยังผู้ให้บริการที่เลือกได้
โดยไม่ต้องรอให้การบันทึกเสร็จสิ้นก่อน

OpenAI ถูกแมปไปยังพื้นผิว image, video, batch TTS, batch STT, Voice Call
streaming STT, realtime voice และ memory embedding ของ OpenClaw ปัจจุบัน xAI
ถูกแมปไปยังพื้นผิว image, video, search, code-execution, batch TTS, batch STT
และ Voice Call streaming STT ของ OpenClaw xAI Realtime voice เป็นความสามารถของต้นทาง
แต่ยังไม่ถูกลงทะเบียนใน OpenClaw จนกว่าสัญญา realtime
voice แบบใช้ร่วมกันจะสามารถแสดงมันได้

## ลิงก์ด่วน

- [การสร้างภาพ](/th/tools/image-generation) -- การสร้างและแก้ไขภาพ
- [การสร้างวิดีโอ](/th/tools/video-generation) -- text-to-video, image-to-video และ video-to-video
- [การสร้างดนตรี](/th/tools/music-generation) -- การสร้างดนตรีและแทร็กเสียง
- [Text-to-Speech](/th/tools/tts) -- การแปลงคำตอบเป็นเสียงพูด
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding) -- การทำความเข้าใจภาพ เสียง และวิดีโอขาเข้า
