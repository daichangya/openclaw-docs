---
read_when:
    - การเชื่อมต่อเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดเผยปลายทาง HTTP /v1/chat/completions ที่เข้ากันได้กับ OpenAI จาก Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-24T09:11:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway ของ OpenClaw สามารถให้บริการปลายทาง Chat Completions ที่เข้ากันได้กับ OpenAI แบบขนาดเล็กได้

ปลายทางนี้ **ปิดใช้งานตามค่าเริ่มต้น** ต้องเปิดใช้งานใน config ก่อน

- `POST /v1/chat/completions`
- ใช้พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้พื้นผิว HTTP แบบ OpenAI-compatible ของ Gateway แล้ว ระบบจะให้บริการ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

ภายใน คำขอจะถูกรันเป็น agent run ปกติของ Gateway (ใช้โค้ดเส้นทางเดียวกับ `openclaw agent`) ดังนั้น routing/permissions/config จะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้การกำหนดค่า auth ของ Gateway

เส้นทาง auth ของ HTTP ที่พบบ่อย:

- auth แบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP แบบ trusted ที่มีตัวตน (`gateway.auth.mode="trusted-proxy"`):
  กำหนดเส้นทางผ่าน proxy ที่รับรู้ตัวตนซึ่งกำหนดค่าไว้ และให้ proxy ฉีด
  identity headers ที่จำเป็น
- auth แบบ open บน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy แบบ non-loopback ที่กำหนดค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกัน
  จะไม่ผ่านโหมดนี้
- หากกำหนดค่า `gateway.auth.rateLimit` ไว้และมีความล้มเหลวด้าน auth มากเกินไป ปลายทางจะคืน `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่าปลายทางนี้เป็นพื้นผิว **การเข้าถึงของผู้ปฏิบัติงานแบบเต็มรูปแบบ** สำหรับอินสแตนซ์ gateway นี้

- HTTP bearer auth ที่นี่ไม่ใช่โมเดลขอบเขตแคบแบบต่อผู้ใช้
- token/password ของ Gateway ที่ใช้ได้กับปลายทางนี้ ควรถูกถือเสมือนเป็นข้อมูลรับรองระดับเจ้าของ/ผู้ปฏิบัติงาน
- คำขอจะวิ่งผ่านเส้นทางเอเจนต์ของ control-plane แบบเดียวกับการกระทำของผู้ปฏิบัติงานที่เชื่อถือได้
- ไม่มีขอบเขตเครื่องมือแบบแยก non-owner/per-user บนปลายทางนี้; เมื่อผู้เรียกผ่าน Gateway auth ที่นี่ OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ gateway นี้
- สำหรับโหมด auth แบบ shared-secret (`token` และ `password`) ปลายทางจะคืนค่าเริ่มต้นแบบเต็มของผู้ปฏิบัติงานตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่ามาด้วยก็ตาม
- โหมด HTTP แบบ trusted ที่มีตัวตน (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมี header นี้ และหากไม่มีจะย้อนกลับไปใช้ชุด scope เริ่มต้นของผู้ปฏิบัติงานตามปกติ
- หากนโยบายของเอเจนต์เป้าหมายอนุญาตเครื่องมือที่อ่อนไหว ปลายทางนี้ก็สามารถใช้เครื่องมือเหล่านั้นได้
- ควรเก็บปลายทางนี้ไว้บน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดออกสู่อินเทอร์เน็ตสาธารณะโดยตรง

ตาราง auth:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - ไม่สนใจ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope เริ่มต้นแบบเต็มของผู้ปฏิบัติงาน:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า chat turns บนปลายทางนี้เป็น owner-sender turns
- โหมด HTTP แบบ trusted ที่มีตัวตน (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตนจากขอบเขตการ deploy หรือขอบเขตที่เชื่อถือได้ภายนอกบางอย่าง
  - เคารพ `x-openclaw-scopes` เมื่อมี header นี้
  - ย้อนกลับไปใช้ชุด scope เริ่มต้นของผู้ปฏิบัติงานตามปกติเมื่อไม่มี header นี้
  - จะสูญเสียความหมายแบบ owner ก็ต่อเมื่อผู้เรียกจำกัด scopes อย่างชัดเจนและละ `operator.admin` ออก

ดู [Security](/th/gateway/security) และ [Remote access](/th/gateway/remote)

## สัญญา model แบบ agent-first

OpenClaw ปฏิบัติต่อฟิลด์ `model` ของ OpenAI ว่าเป็น **เป้าหมายของเอเจนต์** ไม่ใช่ raw provider model id

- `model: "openclaw"` จะกำหนดเส้นทางไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้
- `model: "openclaw/default"` ก็จะกำหนดเส้นทางไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` จะกำหนดเส้นทางไปยังเอเจนต์เฉพาะตัว

request headers แบบไม่บังคับ:

- `x-openclaw-model: <provider/model-or-bare-id>` ใช้ override backend model สำหรับเอเจนต์ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับเป็น compatibility override
- `x-openclaw-session-key: <sessionKey>` ใช้ควบคุมการกำหนดเส้นทางของ session อย่างสมบูรณ์
- `x-openclaw-message-channel: <channel>` ใช้ตั้ง synthetic ingress channel context สำหรับ prompts และนโยบายที่รับรู้ช่องทาง

compatibility aliases ที่ยังยอมรับ:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้งานปลายทาง

ตั้ง `gateway.http.endpoints.chatCompletions.enabled` เป็น `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## การปิดใช้งานปลายทาง

ตั้ง `gateway.http.endpoints.chatCompletions.enabled` เป็น `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## ลักษณะการทำงานของ session

ตามค่าเริ่มต้น ปลายทางนี้เป็นแบบ **stateless ต่อคำขอ** (แต่ละคำสั่งเรียกจะสร้าง session key ใหม่)

หากคำขอมีสตริง OpenAI `user` รวมอยู่ Gateway จะ derive session key ที่คงที่จากค่านั้น เพื่อให้การเรียกซ้ำสามารถแชร์ agent session เดียวกันได้

## เหตุใดพื้นผิวนี้จึงสำคัญ

นี่คือชุดความเข้ากันได้ที่มีประโยชน์สูงสุดสำหรับ frontend และเครื่องมือแบบ self-hosted:

- การตั้งค่าส่วนใหญ่ของ Open WebUI, LobeChat และ LibreChat คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แชตแบบ OpenAI ที่มีอยู่เดิมมักเริ่มต้นได้ด้วย `/v1/chat/completions`
- ไคลเอนต์ที่เป็น agent-native มากขึ้นเรื่อย ๆ นิยม `/v1/responses`

## รายการ model และการกำหนดเส้นทางของเอเจนต์

<AccordionGroup>
  <Accordion title="`/v1/models` คืนค่าอะไร?">
    รายการเป้าหมายของเอเจนต์ OpenClaw

    IDs ที่คืนมาคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
    ใช้ค่าเหล่านี้โดยตรงเป็นค่า `model` ของ OpenAI ได้เลย

  </Accordion>
  <Accordion title="`/v1/models` แสดง agents หรือ sub-agents?">
    ระบบจะแสดงเป้าหมายเอเจนต์ระดับบนสุด ไม่ใช่ backend provider models และไม่ใช่ sub-agents

    Sub-agents ยังคงเป็นโครงสร้างการทำงานภายใน และจะไม่ปรากฏเป็น pseudo-models

  </Accordion>
  <Accordion title="เหตุใดจึงมี `openclaw/default` รวมอยู่ด้วย?">
    `openclaw/default` คือ alias ที่คงที่สำหรับเอเจนต์เริ่มต้นที่กำหนดค่าไว้

    นั่นหมายความว่าไคลเอนต์สามารถใช้ id ที่คาดเดาได้ตัวเดียวต่อไป แม้ real default agent id จะเปลี่ยนไปตามแต่ละสภาพแวดล้อม

  </Accordion>
  <Accordion title="จะ override backend model ได้อย่างไร?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    หากไม่ใส่ header นี้ เอเจนต์ที่เลือกจะรันด้วยโมเดลที่กำหนดค่าไว้ตามปกติ

  </Accordion>
  <Accordion title="embeddings เข้ากับสัญญานี้อย่างไร?">
    `/v1/embeddings` ใช้ `model` ids แบบเป้าหมายเอเจนต์เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการ embedding model เฉพาะ ให้ส่งใน `x-openclaw-model`
    หากไม่มี header นี้ คำขอจะผ่านไปยังการตั้งค่า embedding ปกติของเอเจนต์ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้ง `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของ event จะเป็น `data: <json>`
- สตรีมจะจบด้วย `data: [DONE]`

## การตั้งค่า Open WebUI แบบรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI แบบพื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL สำหรับ Docker บน macOS: `http://host.docker.internal:18789/v1`
- API key: Gateway bearer token ของคุณ
- Model: `openclaw/default`

ลักษณะการทำงานที่คาดหวัง:

- `GET /v1/models` ควรแสดง `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น chat model id
- หากคุณต้องการ backend provider/model เฉพาะสำหรับเอเจนต์นั้น ให้ตั้งค่าโมเดลเริ่มต้นปกติของเอเจนต์ หรือส่ง `x-openclaw-model`

การทดสอบแบบรวดเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากคำสั่งนี้คืนค่า `openclaw/default` การตั้งค่า Open WebUI ส่วนใหญ่จะเชื่อมต่อได้ด้วย base URL และ token เดียวกัน

## ตัวอย่าง

แบบไม่สตรีม:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

แบบสตรีม:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

แสดงรายการ models:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

ดึง model หนึ่งรายการ:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

สร้าง embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

หมายเหตุ:

- `/v1/models` คืนค่าเป้าหมายเอเจนต์ของ OpenClaw ไม่ใช่แค็ตตาล็อก provider แบบดิบ
- `openclaw/default` มีอยู่เสมอ เพื่อให้ id ที่คงที่หนึ่งตัวใช้ได้ข้ามสภาพแวดล้อม
- การ override backend provider/model ควรอยู่ใน `x-openclaw-model` ไม่ใช่ฟิลด์ `model` ของ OpenAI
- `/v1/embeddings` รองรับ `input` ทั้งแบบสตริงเดียวหรืออาร์เรย์ของสตริง

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [OpenAI](/th/providers/openai)
