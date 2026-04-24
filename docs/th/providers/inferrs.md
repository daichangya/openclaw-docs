---
read_when:
    - คุณต้องการรัน OpenClaw กับเซิร์ฟเวอร์ inferrs ภายในเครื่อง
    - คุณกำลังให้บริการ Gemma หรือโมเดลอื่นผ่าน inferrs
    - คุณต้องการแฟล็กความเข้ากันได้ของ OpenClaw สำหรับ inferrs แบบตรงตัว
summary: รัน OpenClaw ผ่าน inferrs (เซิร์ฟเวอร์ภายในเครื่องที่เข้ากันได้กับ OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T09:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) สามารถให้บริการโมเดลภายในเครื่องผ่าน
API `/v1` ที่เข้ากันได้กับ OpenAI OpenClaw ทำงานร่วมกับ `inferrs` ผ่านเส้นทาง
`openai-completions` แบบทั่วไป

ขณะนี้ `inferrs` เหมาะที่จะมองเป็นแบ็กเอนด์ OpenAI-compatible แบบ self-hosted
ที่กำหนดเอง มากกว่าจะเป็น Provider plugin เฉพาะของ OpenClaw

## เริ่มต้นใช้งาน

<Steps>
  <Step title="เริ่ม inferrs พร้อมโมเดล">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="ตรวจสอบว่าเข้าถึงเซิร์ฟเวอร์ได้">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="เพิ่มรายการผู้ให้บริการใน OpenClaw">
    เพิ่มรายการผู้ให้บริการแบบระบุชัดเจน แล้วชี้โมเดลเริ่มต้นของคุณไปที่รายการนั้น ดูตัวอย่างคอนฟิกเต็มด้านล่าง
  </Step>
</Steps>

## ตัวอย่างคอนฟิกแบบเต็ม

ตัวอย่างนี้ใช้ Gemma 4 บนเซิร์ฟเวอร์ `inferrs` ภายในเครื่อง

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="เหตุใด requiresStringContent จึงสำคัญ">
    เส้นทาง Chat Completions บางแบบของ `inferrs` รองรับเฉพาะ
    `messages[].content` ที่เป็นสตริง ไม่ใช่อาร์เรย์ของ content part แบบมีโครงสร้าง

    <Warning>
    หากการรันของ OpenClaw ล้มเหลวด้วยข้อผิดพลาดลักษณะนี้:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ให้ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดลของคุณ
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw จะ flatten content part ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่ง
    คำขอ

  </Accordion>

  <Accordion title="ข้อควรระวังเกี่ยวกับ Gemma และสคีมาเครื่องมือ">
    ชุดค่าผสม `inferrs` + Gemma บางแบบในปัจจุบันอาจรองรับคำขอ
    `/v1/chat/completions` แบบเล็กและตรงไปตรงมาได้ แต่ยังคงล้มเหลวกับเทิร์น agent-runtime
    แบบเต็มของ OpenClaw

    หากเกิดกรณีนั้น ให้ลองตั้งค่านี้ก่อน:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    สิ่งนี้จะปิด surface สคีมาเครื่องมือของ OpenClaw สำหรับโมเดลนั้น และอาจช่วยลดแรงกดดันจาก prompt
    บนแบ็กเอนด์ภายในเครื่องที่เข้มงวดกว่า

    หากคำขอแบบตรงขนาดเล็กยังทำงานได้ แต่เทิร์นเอเจนต์ปกติของ OpenClaw ยังคงพังภายใน
    `inferrs` ปัญหาที่เหลืออยู่มักเป็นพฤติกรรมของโมเดล/เซิร์ฟเวอร์ต้นทาง มากกว่าชั้น transport ของ OpenClaw

  </Accordion>

  <Accordion title="การทดสอบ smoke แบบแมนนวล">
    เมื่อตั้งค่าแล้ว ให้ทดสอบทั้งสองชั้น:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    หากคำสั่งแรกทำงานได้แต่คำสั่งที่สองล้มเหลว ให้ตรวจสอบส่วนการแก้ไขปัญหาด้านล่าง

  </Accordion>

  <Accordion title="พฤติกรรมแบบพร็อกซี">
    `inferrs` ถูกปฏิบัติเป็นแบ็กเอนด์ `/v1` แบบ OpenAI-compatible ลักษณะพร็อกซี
    ไม่ใช่ปลายทาง OpenAI แบบเนทีฟ

    - การปรับแต่งคำขอแบบ native ที่ใช้เฉพาะ OpenAI จะไม่ถูกใช้ที่นี่
    - ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี hint ของ prompt-cache และไม่มี
      การปรับแต่ง payload ด้านความเข้ากันได้ของ reasoning แบบ OpenAI
    - header แสดงที่มาของ OpenClaw ที่ซ่อนไว้ (`originator`, `version`, `User-Agent`)
      จะไม่ถูกฉีดลงใน base URL แบบกำหนดเองของ `inferrs`

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models ล้มเหลว">
    `inferrs` ไม่ได้ทำงาน ไม่สามารถเข้าถึงได้ หรือไม่ได้ bind กับ
    host/port ที่คาดไว้ ตรวจสอบให้แน่ใจว่าเซิร์ฟเวอร์เริ่มทำงานแล้วและกำลังฟังอยู่ที่ที่อยู่
    ที่คุณตั้งค่าไว้
  </Accordion>

  <Accordion title="messages[].content ควรเป็นสตริง">
    ให้ตั้งค่า `compat.requiresStringContent: true` ในรายการโมเดล ดู
    ส่วน `requiresStringContent` ด้านบนสำหรับรายละเอียด
  </Accordion>

  <Accordion title="การเรียก /v1/chat/completions โดยตรงผ่าน แต่ openclaw infer model run ล้มเหลว">
    ลองตั้งค่า `compat.supportsTools: false` เพื่อปิด surface สคีมาเครื่องมือ
    ดูข้อควรระวังเกี่ยวกับสคีมาเครื่องมือของ Gemma ด้านบน
  </Accordion>

  <Accordion title="inferrs ยังคงพังเมื่อเป็นเทิร์นเอเจนต์ที่ใหญ่ขึ้น">
    หาก OpenClaw ไม่ได้รับข้อผิดพลาดด้านสคีมาอีกแล้ว แต่ `inferrs` ยังคงพังเมื่อเป็น
    เทิร์นเอเจนต์ที่ใหญ่ขึ้น ให้ถือว่าเป็นข้อจำกัดของ `inferrs` หรือโมเดลต้นทาง ลด
    แรงกดดันของ prompt หรือเปลี่ยนไปใช้แบ็กเอนด์หรือโมเดลภายในเครื่องตัวอื่น
  </Accordion>
</AccordionGroup>

<Tip>
สำหรับความช่วยเหลือทั่วไป โปรดดู [Troubleshooting](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Tip>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Local models" href="/th/gateway/local-models" icon="server">
    การรัน OpenClaw กับเซิร์ฟเวอร์โมเดลภายในเครื่อง
  </Card>
  <Card title="Gateway troubleshooting" href="/th/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    การดีบักแบ็กเอนด์ OpenAI-compatible ภายในเครื่องที่ผ่านการตรวจสอบเบื้องต้น แต่ล้มเหลวตอนรันเอเจนต์
  </Card>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model ref และพฤติกรรม failover
  </Card>
</CardGroup>
