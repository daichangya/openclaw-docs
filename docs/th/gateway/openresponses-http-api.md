---
read_when:
    - กำลังเชื่อมต่อไคลเอนต์ที่ใช้ OpenResponses API
    - คุณต้องการอินพุตแบบอิงรายการ การเรียกใช้เครื่องมือฝั่งไคลเอนต์ หรือ SSE events
summary: เปิดเผย HTTP endpoint `/v1/responses` ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-23T05:34:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

Gateway ของ OpenClaw สามารถให้บริการ endpoint `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

endpoint นี้ **ปิดใช้งานโดยค่าเริ่มต้น** ต้องเปิดใช้งานในคอนฟิกก่อน

- `POST /v1/responses`
- ใช้พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

ภายใน คำขอจะถูกรันเป็นการทำงานของเอเจนต์ Gateway ตามปกติ (ใช้ codepath เดียวกับ
`openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/คอนฟิกจึงสอดคล้องกับ Gateway ของคุณ

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

พฤติกรรมการปฏิบัติงานสอดคล้องกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- ใช้เส้นทาง auth ของ Gateway HTTP ที่ตรงกัน:
  - auth แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - auth แบบ trusted-proxy (`gateway.auth.mode="trusted-proxy"`): ส่วนหัว proxy ที่รับรู้ตัวตนจากแหล่ง trusted proxy แบบ non-loopback ที่กำหนดค่าไว้
  - auth แบบ open สำหรับ private-ingress (`gateway.auth.mode="none"`): ไม่ต้องมี auth header
- ให้ถือว่า endpoint นี้มีสิทธิ์เข้าถึงระดับ operator เต็มรูปแบบสำหรับอินสแตนซ์ Gateway นั้น
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) ให้ละเลยค่า `x-openclaw-scopes` แบบ bearer-declared ที่แคบกว่า และคืนค่าขอบเขต operator เต็มรูปแบบปกติ
- สำหรับโหมด HTTP ที่เชื่อถือได้และมีการระบุตัวตน (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) ให้ใช้ `x-openclaw-scopes` เมื่อมี และหากไม่มีให้ fallback ไปยังชุดขอบเขตเริ่มต้นของ operator ตามปกติ
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อคุณต้องการแทนที่ backend model ของเอเจนต์ที่เลือก
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทาง session แบบ explicit
- ใช้ `x-openclaw-message-channel` เมื่อคุณต้องการบริบท synthetic ingress channel ที่ไม่ใช่ค่าเริ่มต้น

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ละเลย `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุดขอบเขต operator เริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บน endpoint นี้เป็น owner-sender turns
- โหมด HTTP ที่เชื่อถือได้และมีการระบุตัวตน (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ใช้ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุดขอบเขตเริ่มต้นของ operator ตามปกติเมื่อไม่มี header นี้
  - จะสูญเสีย owner semantics ก็ต่อเมื่อผู้เรียกจำกัดขอบเขตอย่าง explicit และละ `operator.admin` ไว้เท่านั้น

เปิดหรือปิด endpoint นี้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้นี้ยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายแบบ canonical ว่าโมเดลแบบ agent-target, `openclaw/default`, การส่ง embeddings ผ่านตรง และการแทนที่ backend model ทำงานร่วมกันอย่างไร ดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract) และ [รายการโมเดลและการกำหนดเส้นทางเอเจนต์](/th/gateway/openai-http-api#model-list-and-agent-routing)

## พฤติกรรมของ Session

โดยค่าเริ่มต้น endpoint นี้เป็นแบบ **stateless ต่อคำขอ** (จะสร้าง session key ใหม่ในแต่ละการเรียก)

หากคำขอมีสตริง `user` แบบ OpenResponses Gateway จะ derive session key ที่คงที่
จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้ session ของเอเจนต์ร่วมกันได้

## รูปร่างคำขอ (ที่รองรับ)

คำขอนี้เป็นไปตาม OpenResponses API โดยใช้อินพุตแบบอิงรายการ สิ่งที่รองรับในปัจจุบัน:

- `input`: สตริงหรืออาร์เรย์ของ item objects
- `instructions`: รวมเข้าไปใน system prompt
- `tools`: คำจำกัดความของเครื่องมือฝั่งไคลเอนต์ (function tools)
- `tool_choice`: กรองหรือบังคับใช้เครื่องมือฝั่งไคลเอนต์
- `stream`: เปิดใช้ SSE streaming
- `max_output_tokens`: ขีดจำกัดเอาต์พุตแบบ best-effort (ขึ้นอยู่กับผู้ให้บริการ)
- `user`: การกำหนดเส้นทาง session แบบคงที่

ยอมรับได้แต่ **ปัจจุบันยังถูกละเลย**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw จะใช้ session ของการตอบกลับก่อนหน้าอีกครั้งเมื่อคำขอยังคงอยู่ภายในขอบเขต agent/user/requested-session เดียวกัน

## Items (input)

### `message`

Roles: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อเข้าไปใน system prompt
- item แบบ `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น “ข้อความปัจจุบัน”
- ข้อความ user/assistant ก่อนหน้าจะถูกรวมเป็นประวัติสำหรับบริบท

### `function_call_output` (เครื่องมือแบบ turn-based)

ส่งผลลัพธ์ของเครื่องมือกลับไปยังโมเดล:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` และ `item_reference`

ยอมรับเพื่อความเข้ากันได้ของสคีมา แต่จะถูกละเลยเมื่อสร้าง prompt

## Tools (function tools ฝั่งไคลเอนต์)

ระบุเครื่องมือด้วย `tools: [{ type: "function", function: { name, description?, parameters? } }]`

หากเอเจนต์ตัดสินใจเรียกใช้เครื่องมือ การตอบกลับจะส่งคืน item เอาต์พุตแบบ `function_call`
จากนั้นคุณจึงส่งคำขอติดตามผลพร้อม `function_call_output` เพื่อดำเนิน turn ต่อ

## รูปภาพ (`input_image`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

MIME types ที่อนุญาต (ปัจจุบัน): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
ขนาดสูงสุด (ปัจจุบัน): 10MB

## ไฟล์ (`input_file`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

MIME types ที่อนุญาต (ปัจจุบัน): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

ขนาดสูงสุด (ปัจจุบัน): 5MB

พฤติกรรมปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มลงใน **system prompt** ไม่ใช่ข้อความของผู้ใช้
  ดังนั้นจึงคงสภาพเป็นชั่วคราว (ไม่ถูกเก็บไว้ใน session history)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนถูกเพิ่มเข้าไป
  ดังนั้นไบต์ของไฟล์จึงถูกมองเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- บล็อกที่ถูกแทรกใช้ boundary markers แบบชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และรวมบรรทัดเมทาดาทา
  `Source: External`
- เส้นทาง input file นี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาว
  เพื่อประหยัดงบประมาณ prompt; boundary markers และเมทาดาทาจะยังคงอยู่
- ระบบจะแยกข้อความจาก PDF ก่อน หากพบข้อความน้อย หน้าแรกๆ จะถูก
  rasterize เป็นรูปภาพและส่งต่อให้โมเดล และบล็อกไฟล์ที่แทรกจะใช้
  placeholder `[PDF content rendered to images]`

การแยก PDF ใช้ build แบบ legacy ของ `pdfjs-dist` ที่เป็นมิตรกับ Node (ไม่ใช้ worker) โดย build
PDF.js แบบสมัยใหม่คาดหวัง browser workers/DOM globals จึงไม่ถูกใช้ใน Gateway

ค่าเริ่มต้นของการดึง URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนรวมของ parts แบบ `input_file` + `input_image` ที่อิง URL ต่อคำขอ)
- คำขอถูกป้องกันไว้ (DNS resolution, การบล็อก private IP, จำนวน redirect สูงสุด, timeouts)
- รองรับ allowlist ของ hostname แบบไม่บังคับแยกตามชนิดอินพุต (`files.urlAllowlist`, `images.urlAllowlist`)
  - โฮสต์แบบตรงตัว: `"cdn.example.com"`
  - wildcard subdomains: `"*.assets.example.com"` (ไม่ตรงกับ apex)
  - allowlist ที่ว่างหรือไม่ระบุ หมายถึงไม่มีข้อจำกัด allowlist ของ hostname
- หากต้องการปิดการดึงข้อมูลแบบอิง URL ทั้งหมด ให้ตั้ง `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ขีดจำกัดของไฟล์ + รูปภาพ (คอนฟิก)

สามารถปรับค่าเริ่มต้นได้ภายใต้ `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

ค่าเริ่มต้นเมื่อไม่ระบุ:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- แหล่ง `input_image` แบบ HEIC/HEIF จะถูกรับเข้าและ normalize เป็น JPEG ก่อนส่งให้ผู้ให้บริการ

หมายเหตุด้านความปลอดภัย:

- allowlist ของ URL ถูกบังคับใช้ก่อนการดึงข้อมูลและในทุก redirect hop
- การอนุญาต hostname ไม่ได้ข้ามการบล็อก private/internal IP
- สำหรับ Gateway ที่เปิดออกสู่อินเทอร์เน็ต ให้ใช้การควบคุม network egress เพิ่มเติมนอกเหนือจากตัวป้องกันระดับแอป
  ดู [Security](/th/gateway/security)

## Streaming (SSE)

ตั้ง `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัด event จะเป็น `event: <type>` และ `data: <json>`
- สตรีมจบด้วย `data: [DONE]`

ชนิด event ที่ปล่อยในปัจจุบัน:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (เมื่อเกิดข้อผิดพลาด)

## Usage

`usage` จะถูกเติมเมื่อผู้ให้บริการพื้นฐานรายงานจำนวนโทเค็น
OpenClaw จะ normalize aliases แบบ OpenAI ทั่วไปก่อนที่ตัวนับเหล่านั้นจะไปถึง
พื้นผิวสถานะ/session ปลายทาง รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้ JSON object แบบนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีที่พบบ่อย:

- `401` ไม่มี auth หรือ auth ไม่ถูกต้อง
- `400` request body ไม่ถูกต้อง
- `405` ใช้ method ไม่ถูกต้อง

## ตัวอย่าง

แบบไม่สตรีม:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

แบบสตรีม:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
