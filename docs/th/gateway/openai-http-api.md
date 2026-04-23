---
read_when:
    - การเชื่อมเครื่องมือที่คาดหวัง OpenAI Chat Completions
summary: เปิดเผย endpoint HTTP `/v1/chat/completions` ที่เข้ากันได้กับ OpenAI จาก Gateway
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-23T05:34:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway ของ OpenClaw สามารถให้บริการ endpoint Chat Completions แบบเข้ากันได้กับ OpenAI ขนาดเล็กได้

endpoint นี้**ปิดอยู่โดยค่าเริ่มต้น** ต้องเปิดใช้งานในคอนฟิกก่อน

- `POST /v1/chat/completions`
- ใช้พอร์ตเดียวกับ Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

เมื่อเปิดใช้งานพื้นผิว HTTP แบบเข้ากันได้กับ OpenAI ของ Gateway แล้ว ระบบจะให้บริการ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

ภายในแล้ว คำขอจะถูกรันเป็นการรันเอเจนต์ของ Gateway ตามปกติ (codepath เดียวกับ `openclaw agent`) ดังนั้นการกำหนดเส้นทาง/สิทธิ์/คอนฟิกจะตรงกับ Gateway ของคุณ

## การยืนยันตัวตน

ใช้คอนฟิกการยืนยันตัวตนของ Gateway

เส้นทางการยืนยันตัวตน HTTP ที่พบบ่อย:

- การยืนยันตัวตนแบบ shared-secret (`gateway.auth.mode="token"` หรือ `"password"`):
  `Authorization: Bearer <token-or-password>`
- การยืนยันตัวตน HTTP แบบ trusted identity-bearing (`gateway.auth.mode="trusted-proxy"`):
  กำหนดเส้นทางผ่าน proxy ที่รับรู้ตัวตนตามที่ตั้งค่าไว้ แล้วปล่อยให้มัน inject
  header แสดงตัวตนที่จำเป็น
- การยืนยันตัวตนแบบเปิดบน private-ingress (`gateway.auth.mode="none"`):
  ไม่ต้องใช้ auth header

หมายเหตุ:

- เมื่อ `gateway.auth.mode="token"` ให้ใช้ `gateway.auth.token` (หรือ `OPENCLAW_GATEWAY_TOKEN`)
- เมื่อ `gateway.auth.mode="password"` ให้ใช้ `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_PASSWORD`)
- เมื่อ `gateway.auth.mode="trusted-proxy"` คำขอ HTTP ต้องมาจาก
  แหล่ง trusted proxy แบบ non-loopback ที่ตั้งค่าไว้; proxy แบบ loopback บนโฮสต์เดียวกัน
  ไม่ผ่านเงื่อนไขของโหมดนี้
- หากตั้งค่า `gateway.auth.rateLimit` ไว้ และเกิดความล้มเหลวในการยืนยันตัวตนมากเกินไป endpoint จะส่งกลับ `429` พร้อม `Retry-After`

## ขอบเขตความปลอดภัย (สำคัญ)

ให้ถือว่า endpoint นี้เป็นพื้นผิว**การเข้าถึงระดับผู้ปฏิบัติงานเต็มรูปแบบ**สำหรับ instance ของ Gateway นี้

- bearer auth ของ HTTP ที่นี่ไม่ใช่โมเดลขอบเขตแคบแบบต่อผู้ใช้
- token/password ของ Gateway ที่ใช้ได้กับ endpoint นี้ควรถูกถือเสมือน credential ระดับเจ้าของ/ผู้ปฏิบัติงาน
- คำขอจะวิ่งผ่านเส้นทางเอเจนต์ของ control plane เดียวกับการกระทำของผู้ปฏิบัติงานที่เชื่อถือได้
- ไม่มีขอบเขตเครื่องมือแยกแบบ non-owner/per-user บน endpoint นี้; เมื่อผู้เรียกผ่านการยืนยันตัวตนของ Gateway ที่นี่ได้ OpenClaw จะถือว่าผู้เรียกนั้นเป็นผู้ปฏิบัติงานที่เชื่อถือได้สำหรับ Gateway นี้
- สำหรับโหมดการยืนยันตัวตนแบบ shared-secret (`token` และ `password`) endpoint จะคืนค่าเริ่มต้นของผู้ปฏิบัติงานแบบเต็มตามปกติ แม้ว่าผู้เรียกจะส่ง header `x-openclaw-scopes` ที่แคบกว่ามาก็ตาม
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"`) จะเคารพ `x-openclaw-scopes` เมื่อมี header นี้ และหากไม่มีจะ fallback ไปใช้ชุด scope ค่าเริ่มต้นปกติของผู้ปฏิบัติงาน
- หากนโยบายของเอเจนต์เป้าหมายอนุญาตเครื่องมือที่ละเอียดอ่อน endpoint นี้ก็สามารถใช้เครื่องมือเหล่านั้นได้
- ควรเก็บ endpoint นี้ไว้เฉพาะบน loopback/tailnet/private ingress เท่านั้น; อย่าเปิดตรงออกสู่อินเทอร์เน็ตสาธารณะ

เมทริกซ์การยืนยันตัวตน:

- `gateway.auth.mode="token"` หรือ `"password"` + `Authorization: Bearer ...`
  - พิสูจน์การครอบครอง shared gateway operator secret
  - เพิกเฉยต่อ `x-openclaw-scopes` ที่แคบกว่า
  - คืนค่าชุด scope ค่าเริ่มต้นแบบเต็มของผู้ปฏิบัติงาน:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - ถือว่า turn ของแชตบน endpoint นี้เป็น turn ของผู้ส่งที่เป็นเจ้าของ
- โหมด HTTP แบบ trusted identity-bearing (เช่น trusted proxy auth หรือ `gateway.auth.mode="none"` บน private ingress)
  - ยืนยันตัวตน trusted identity ภายนอกหรือขอบเขต deployment
  - เคารพ `x-openclaw-scopes` เมื่อมี header นี้
  - fallback ไปยังชุด scope ค่าเริ่มต้นปกติของผู้ปฏิบัติงานเมื่อไม่มี header
  - จะสูญเสียความหมายแบบเจ้าของก็ต่อเมื่อผู้เรียกจำกัด scope ลงอย่างชัดเจนและละ `operator.admin` ออก

ดู [Security](/th/gateway/security) และ [Remote access](/th/gateway/remote)

## สัญญา model แบบ agent-first

OpenClaw ถือว่าฟิลด์ `model` ของ OpenAI เป็น **เป้าหมายของเอเจนต์** ไม่ใช่ raw provider model id

- `model: "openclaw"` จะกำหนดเส้นทางไปยังเอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้
- `model: "openclaw/default"` ก็จะกำหนดเส้นทางไปยังเอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้เช่นกัน
- `model: "openclaw/<agentId>"` จะกำหนดเส้นทางไปยังเอเจนต์ที่ระบุ

header ของคำขอที่เป็นแบบไม่บังคับ:

- `x-openclaw-model: <provider/model-or-bare-id>` ใช้ override โมเดลแบ็กเอนด์สำหรับเอเจนต์ที่เลือก
- `x-openclaw-agent-id: <agentId>` ยังคงรองรับในฐานะ compatibility override
- `x-openclaw-session-key: <sessionKey>` ควบคุมการกำหนดเส้นทางเซสชันโดยสมบูรณ์
- `x-openclaw-message-channel: <channel>` ตั้งค่าบริบทช่องทางขาเข้าแบบสังเคราะห์สำหรับ prompt และนโยบายที่รับรู้ช่องทาง

ยังคงยอมรับชื่อแฝงเพื่อความเข้ากันได้:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## การเปิดใช้งาน endpoint

ตั้งค่า `gateway.http.endpoints.chatCompletions.enabled` เป็น `true`:

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

## การปิดใช้งาน endpoint

ตั้งค่า `gateway.http.endpoints.chatCompletions.enabled` เป็น `false`:

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

## พฤติกรรมของเซสชัน

โดยค่าเริ่มต้น endpoint นี้จะเป็นแบบ **stateless ต่อคำขอ** (ระบบจะสร้าง session key ใหม่ทุกครั้งที่เรียก)

หากคำขอมีสตริง `user` แบบ OpenAI อยู่ด้วย Gateway จะอนุมาน session key ที่คงที่จากค่านั้น เพื่อให้การเรียกซ้ำสามารถใช้เซสชันของเอเจนต์ร่วมกันได้

## ทำไมพื้นผิวนี้จึงสำคัญ

นี่คือชุดความเข้ากันได้ที่ให้ leverage สูงที่สุดสำหรับ frontend และเครื่องมือแบบ self-hosted:

- ชุดติดตั้ง Open WebUI, LobeChat และ LibreChat ส่วนใหญ่คาดหวัง `/v1/models`
- ระบบ RAG จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แชตแบบ OpenAI ที่มีอยู่แล้วมักเริ่มต้นได้ด้วย `/v1/chat/completions`
- ไคลเอนต์ที่มีลักษณะเป็นเอเจนต์มากขึ้นเรื่อย ๆ มักต้องการ `/v1/responses`

## รายการ model และการกำหนดเส้นทางเอเจนต์

<AccordionGroup>
  <Accordion title="`/v1/models` ส่งกลับอะไร?">
    รายการเป้าหมายเอเจนต์ของ OpenClaw

    id ที่ส่งกลับคือรายการ `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
    ให้ใช้ค่าเหล่านี้โดยตรงเป็นค่า `model` แบบ OpenAI

  </Accordion>
  <Accordion title="`/v1/models` แสดงรายการเอเจนต์หรือ sub-agent?">
    มันแสดงรายการเป้าหมายของเอเจนต์ระดับบนสุด ไม่ใช่โมเดลของผู้ให้บริการแบ็กเอนด์ และไม่ใช่ sub-agent

    sub-agent ยังคงเป็น topology การทำงานภายใน จึงไม่ปรากฏเป็น pseudo-model

  </Accordion>
  <Accordion title="ทำไมจึงมี `openclaw/default`?">
    `openclaw/default` คือชื่อแฝงที่คงที่สำหรับเอเจนต์ค่าเริ่มต้นที่ตั้งค่าไว้

    หมายความว่าไคลเอนต์สามารถใช้ id เดียวที่คาดเดาได้ต่อไปได้ แม้ id ของเอเจนต์ค่าเริ่มต้นจริงจะเปลี่ยนไประหว่างสภาพแวดล้อม

  </Accordion>
  <Accordion title="จะ override โมเดลแบ็กเอนด์ได้อย่างไร?">
    ใช้ `x-openclaw-model`

    ตัวอย่าง:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    หากคุณไม่ส่ง header นี้ เอเจนต์ที่เลือกจะรันด้วยตัวเลือกโมเดลตามปกติที่ตั้งค่าไว้

  </Accordion>
  <Accordion title="embeddings เข้ากับสัญญานี้อย่างไร?">
    `/v1/embeddings` ใช้ id `model` แบบเป้าหมายเอเจนต์เดียวกัน

    ใช้ `model: "openclaw/default"` หรือ `model: "openclaw/<agentId>"`
    เมื่อคุณต้องการโมเดล embedding ที่เฉพาะเจาะจง ให้ส่งผ่าน `x-openclaw-model`
    หากไม่มี header นี้ คำขอจะส่งผ่านไปยังการตั้งค่า embedding ปกติของเอเจนต์ที่เลือก

  </Accordion>
</AccordionGroup>

## การสตรีม (SSE)

ตั้งค่า `stream: true` เพื่อรับ Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- แต่ละบรรทัดของ event คือ `data: <json>`
- สตรีมจะจบด้วย `data: [DONE]`

## การตั้งค่า Open WebUI แบบรวดเร็ว

สำหรับการเชื่อมต่อ Open WebUI แบบพื้นฐาน:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL สำหรับ Docker บน macOS: `http://host.docker.internal:18789/v1`
- API key: bearer token ของ Gateway ของคุณ
- Model: `openclaw/default`

พฤติกรรมที่คาดหวัง:

- `GET /v1/models` ควรแสดง `openclaw/default`
- Open WebUI ควรใช้ `openclaw/default` เป็น id ของ chat model
- หากคุณต้องการ provider/model แบ็กเอนด์ที่เฉพาะเจาะจงสำหรับเอเจนต์นั้น ให้ตั้งโมเดลค่าเริ่มต้นปกติของเอเจนต์ หรือส่ง `x-openclaw-model`

การทดสอบแบบรวดเร็ว:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

หากคำสั่งนั้นส่งกลับ `openclaw/default` ชุดติดตั้ง Open WebUI ส่วนใหญ่ก็จะเชื่อมต่อได้ด้วย base URL และ token เดียวกัน

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

แสดงรายการ model:

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

- `/v1/models` ส่งกลับเป้าหมายเอเจนต์ของ OpenClaw ไม่ใช่แค็ตตาล็อกดิบของผู้ให้บริการ
- `openclaw/default` จะมีอยู่เสมอ ดังนั้น id เดียวที่คงที่จึงใช้ได้ข้ามสภาพแวดล้อม
- การ override provider/model แบ็กเอนด์ควรใส่ไว้ใน `x-openclaw-model` ไม่ใช่ฟิลด์ `model` แบบ OpenAI
- `/v1/embeddings` รองรับ `input` ทั้งแบบสตริงเดี่ยวหรืออาร์เรย์ของสตริง
