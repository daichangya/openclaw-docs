---
read_when:
    - การเชื่อมต่อไคลเอนต์ที่ใช้ OpenResponses API
    - คุณต้องการอินพุตแบบ item-based การเรียกใช้เครื่องมือจากไคลเอนต์ หรืออีเวนต์ SSE
summary: เปิดเผย endpoint HTTP `/v1/responses` ที่เข้ากันได้กับ OpenResponses จาก Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-24T09:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

Gateway ของ OpenClaw สามารถให้บริการ endpoint `POST /v1/responses` ที่เข้ากันได้กับ OpenResponses

endpoint นี้ **ปิดไว้โดยค่าเริ่มต้น** ต้องเปิดใช้ใน config ก่อน

- `POST /v1/responses`
- ใช้พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

ภายใต้การทำงานจริง คำขอจะถูกดำเนินการเป็นการรันเอเจนต์ของ Gateway ตามปกติ (ใช้ codepath เดียวกับ
`openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/การกำหนดค่าจะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน ความปลอดภัย และการกำหนดเส้นทาง

พฤติกรรมการปฏิบัติการตรงกับ [OpenAI Chat Completions](/th/gateway/openai-http-api):

- ใช้เส้นทาง auth HTTP ของ Gateway ที่ตรงกัน:
  - auth แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`): `Authorization: Bearer <token-or-password>`
  - auth แบบ trusted-proxy (`gateway.auth.mode="trusted-proxy"`): ส่วนหัว proxy ที่รับรู้ตัวตนจากแหล่ง trusted proxy ที่ไม่ใช่ loopback ซึ่งกำหนดค่าไว้
  - auth แบบ private-ingress เปิดโล่ง (`gateway.auth.mode="none"`): ไม่มี auth header
- ให้ถือว่า endpoint นี้เป็นการเข้าถึงระดับผู้ปฏิบัติงานแบบเต็มสำหรับอินสแตนซ์ gateway
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) ให้เพิกเฉยต่อค่า `x-openclaw-scopes` ที่แคบกว่าซึ่งประกาศใน bearer และคืนค่าปริยายผู้ปฏิบัติงานแบบเต็มตามปกติ
- สำหรับโหมด HTTP ที่มีตัวตนที่เชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) ให้ใช้ `x-openclaw-scopes` เมื่อมี และหากไม่มีให้ fallback ไปยังชุดขอบเขตเริ่มต้นของผู้ปฏิบัติงานตามปกติ
- เลือกเอเจนต์ด้วย `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` หรือ `x-openclaw-agent-id`
- ใช้ `x-openclaw-model` เมื่อต้องการ override backend model ของเอเจนต์ที่เลือกไว้
- ใช้ `x-openclaw-session-key` สำหรับการกำหนดเส้นทางเซสชันแบบชัดเจน
- ใช้ `x-openclaw-message-channel` เมื่อต้องการบริบท synthetic ingress channel ที่ไม่ใช่ค่าเริ่มต้น

เมทริกซ์ auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - เพิกเฉยต่อ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุดขอบเขตผู้ปฏิบัติงานเริ่มต้นแบบเต็ม:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ปฏิบัติต่อรอบแชตบน endpoint นี้เป็นรอบของผู้ส่งเจ้าของ
- โหมด HTTP ที่มีตัวตนเชื่อถือได้ (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ใช้ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุดขอบเขตเริ่มต้นของผู้ปฏิบัติงานตามปกติเมื่อไม่มี header
  - จะเสียความหมายของ owner ก็ต่อเมื่อผู้เรียกจงใจทำขอบเขตให้แคบลงและละเว้น `operator.admin`

เปิดหรือปิด endpoint นี้ได้ด้วย `gateway.http.endpoints.responses.enabled`

พื้นผิวความเข้ากันได้เดียวกันนี้ยังรวมถึง:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

สำหรับคำอธิบายแบบ canonical เกี่ยวกับวิธีที่โมเดลเป้าหมายของเอเจนต์, `openclaw/default`, การส่ง embeddings แบบ pass-through และการ override backend model ทำงานร่วมกัน ดู [OpenAI Chat Completions](/th/gateway/openai-http-api#agent-first-model-contract) และ [รายการโมเดลและการกำหนดเส้นทางเอเจนต์](/th/gateway/openai-http-api#model-list-and-agent-routing)

## พฤติกรรมของเซสชัน

โดยค่าเริ่มต้น endpoint นี้เป็นแบบ **stateless ต่อคำขอ** (ระบบจะสร้าง session key ใหม่ในทุกครั้งที่เรียก)

หากคำขอมีสตริง OpenResponses `user` Gateway จะ derive session key ที่คงที่
จากมัน เพื่อให้การเรียกซ้ำใช้เซสชันเอเจนต์เดียวกันได้

## รูปร่างของคำขอ (ที่รองรับ)

คำขอเป็นไปตาม OpenResponses API พร้อมอินพุตแบบ item-based ปัจจุบันรองรับ:

- `input`: สตริงหรืออาร์เรย์ของ item object
- `instructions`: ถูกรวมเข้าไปใน system prompt
- `tools`: คำจำกัดความของเครื่องมือจากไคลเอนต์ (function tools)
- `tool_choice`: กรองหรือบังคับใช้เครื่องมือของไคลเอนต์
- `stream`: เปิดใช้การสตรีมแบบ SSE
- `max_output_tokens`: ขีดจำกัดเอาต์พุตแบบ best-effort (ขึ้นอยู่กับผู้ให้บริการ)
- `user`: การกำหนดเส้นทางเซสชันแบบคงที่

ยอมรับได้แต่ **ปัจจุบันถูกเพิกเฉย**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

รองรับ:

- `previous_response_id`: OpenClaw จะใช้เซสชันของคำตอบก่อนหน้าอีกครั้งเมื่อคำขอยังคงอยู่ภายในขอบเขต agent/user/requested-session เดียวกัน

## Items (input)

### `message`

roles: `system`, `developer`, `user`, `assistant`

- `system` และ `developer` จะถูกต่อท้ายเข้าไปใน system prompt
- item `user` หรือ `function_call_output` ล่าสุดจะกลายเป็น “ข้อความปัจจุบัน”
- ข้อความ user/assistant ก่อนหน้านั้นจะถูกรวมเป็นประวัติสำหรับบริบท

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

ยอมรับเพื่อความเข้ากันได้ของ schema แต่จะถูกเพิกเฉยเมื่อสร้าง prompt

## Tools (function tools ฝั่งไคลเอนต์)

ให้เครื่องมือผ่าน `tools: [{ type: "function", function: { name, description?, parameters? } }]`

หากเอเจนต์ตัดสินใจเรียกใช้เครื่องมือ คำตอบจะส่งคืน output item แบบ `function_call`
จากนั้นคุณส่งคำขอต่อเนื่องพร้อม `function_call_output` เพื่อทำรอบนั้นต่อ

## รูปภาพ (`input_image`)

รองรับแหล่งข้อมูลแบบ base64 หรือ URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

MIME type ที่อนุญาต (ปัจจุบัน): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
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

MIME type ที่อนุญาต (ปัจจุบัน): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`

ขนาดสูงสุด (ปัจจุบัน): 5MB

พฤติกรรมปัจจุบัน:

- เนื้อหาไฟล์จะถูกถอดรหัสและเพิ่มเข้าไปใน **system prompt** ไม่ใช่ข้อความของผู้ใช้
  ดังนั้นจึงคงเป็นข้อมูลชั่วคราว (ไม่ถูกเก็บถาวรในประวัติเซสชัน)
- ข้อความไฟล์ที่ถอดรหัสแล้วจะถูกห่อเป็น **เนื้อหาภายนอกที่ไม่น่าเชื่อถือ** ก่อนจะถูกเพิ่มเข้าไป
  ดังนั้นไบต์ของไฟล์จะถูกปฏิบัติเป็นข้อมูล ไม่ใช่คำสั่งที่เชื่อถือได้
- บล็อกที่ถูก inject จะใช้ตัวทำเครื่องหมายขอบเขตแบบชัดเจน เช่น
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` และมีบรรทัดเมทาดาทา
  `Source: External`
- เส้นทาง input ของไฟล์นี้ตั้งใจละเว้นแบนเนอร์ `SECURITY NOTICE:` แบบยาว
  เพื่อรักษางบประมาณ prompt; ตัวทำเครื่องหมายขอบเขตและเมทาดาทายังคงอยู่
- PDF จะถูก parse เอาข้อความก่อน หากพบข้อความน้อย ระบบจะ rasterize หน้าแรก ๆ
  เป็นรูปภาพแล้วส่งต่อให้โมเดล และบล็อกไฟล์ที่ inject จะใช้
  placeholder `[PDF content rendered to images]`

การ parse PDF ใช้บิลด์ legacy ของ `pdfjs-dist` ที่เป็นมิตรกับ Node (ไม่มี worker) บิลด์
สมัยใหม่ของ PDF.js คาดหวัง browser workers/DOM globals ดังนั้นจึงไม่ถูกใช้ใน Gateway

ค่าเริ่มต้นของการดึงจาก URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (จำนวนรวมของ `input_file` + `input_image` ที่อิง URL ต่อคำขอ)
- คำขอถูกป้องกันไว้ (การ resolve DNS, การบล็อก private IP, จำนวน redirect สูงสุด, timeout)
- รองรับ allowlist ของ hostname แบบไม่บังคับแยกตามชนิดอินพุต (`files.urlAllowlist`, `images.urlAllowlist`)
  - host แบบตรง: `"cdn.example.com"`
  - subdomain แบบ wildcard: `"*.assets.example.com"` (ไม่ตรงกับ apex)
  - allowlist ที่ว่างหรือไม่ระบุ หมายถึงไม่มีข้อจำกัด allowlist ของ hostname
- หากต้องการปิดการดึงแบบอิง URL ทั้งหมด ให้ตั้งค่า `files.allowUrl: false` และ/หรือ `images.allowUrl: false`

## ข้อจำกัดของไฟล์ + รูปภาพ (config)

สามารถปรับค่าปริยายได้ภายใต้ `gateway.http.endpoints.responses`:

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

ค่าปริยายเมื่อไม่ระบุ:

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
- แหล่ง `input_image` แบบ HEIC/HEIF จะถูกยอมรับและ normalize เป็น JPEG ก่อนส่งต่อให้ผู้ให้บริการ

หมายเหตุด้านความปลอดภัย:

- allowlist ของ URL จะถูกบังคับใช้ก่อนการดึงและในทุก redirect hop
- การ allowlist hostname ไม่ได้ข้ามการบล็อก private/internal IP
- สำหรับ gateway ที่เปิดสู่อินเทอร์เน็ต ให้ใช้การควบคุม network egress เพิ่มเติมนอกเหนือจากการป้องกันระดับแอป
  ดู [ความปลอดภัย](/th/gateway/security)

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของ event คือ `event: <type>` และ `data: <json>`
- สตรีมจบด้วย `data: [DONE]`

ชนิดของ event ที่ปล่อยออกมาในปัจจุบัน:

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

## การใช้งาน

`usage` จะถูกเติมเมื่อผู้ให้บริการเบื้องหลังรายงานจำนวนโทเค็น
OpenClaw จะ normalize alias แบบ OpenAI ทั่วไปก่อนที่ตัวนับเหล่านั้นจะไปถึง
พื้นผิวสถานะ/เซสชันปลายทาง รวมถึง `input_tokens` / `output_tokens`
และ `prompt_tokens` / `completion_tokens`

## ข้อผิดพลาด

ข้อผิดพลาดใช้ JSON object รูปแบบนี้:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

กรณีที่พบบ่อย:

- `401` ไม่มี auth/ auth ไม่ถูกต้อง
- `400` request body ไม่ถูกต้อง
- `405` method ไม่ถูกต้อง

## ตัวอย่าง

ไม่สตรีม:

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

สตรีม:

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

## ที่เกี่ยวข้อง

- [OpenAI chat completions](/th/gateway/openai-http-api)
- [OpenAI](/th/providers/openai)
