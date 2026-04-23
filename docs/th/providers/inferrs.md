---
read_when:
    - You want to run OpenClaw against a local inferrs server
    - คุณกำลังให้บริการ Gemma หรือโมเดลอื่นผ่าน inferrs
    - คุณต้องการแฟล็ก compat ของ OpenClaw สำหรับ inferrs แบบตรงตัว
summary: รัน OpenClaw ผ่าน inferrs (เซิร์ฟเวอร์ local ที่เข้ากันได้กับ OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-23T05:51:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) สามารถให้บริการโมเดลในเครื่องผ่าน
API `/v1` ที่เข้ากันได้กับ OpenAI OpenClaw ทำงานร่วมกับ `inferrs` ผ่านเส้นทาง
`openai-completions` แบบทั่วไป

ปัจจุบัน `inferrs` ควรถูกมองเป็น backend แบบ self-hosted ที่เข้ากันได้กับ OpenAI
แบบกำหนดเอง มากกว่าจะเป็น provider plugin เฉพาะของ OpenClaw

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
  <Step title="ตรวจสอบว่าเซิร์ฟเวอร์เข้าถึงได้">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="เพิ่ม provider entry ของ OpenClaw">
    เพิ่ม provider entry แบบ explicit แล้วชี้โมเดลเริ่มต้นของคุณไปที่มัน ดูตัวอย่างคอนฟิกแบบเต็มด้านล่าง
  </Step>
</Steps>

## ตัวอย่างคอนฟิกแบบเต็ม

ตัวอย่างนี้ใช้ Gemma 4 บนเซิร์ฟเวอร์ `inferrs` ในเครื่อง

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

## ขั้นสูง

<AccordionGroup>
  <Accordion title="ทำไม requiresStringContent จึงสำคัญ">
    เส้นทาง Chat Completions บางแบบของ `inferrs` ยอมรับเฉพาะ
    `messages[].content` ที่เป็นสตริงเท่านั้น ไม่รองรับอาร์เรย์ของ structured content parts

    <Warning>
    หากการรันของ OpenClaw ล้มเหลวพร้อมข้อผิดพลาดลักษณะนี้:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    ให้ตั้ง `compat.requiresStringContent: true` ใน model entry ของคุณ
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw จะ flatten pure text content parts ให้เป็นสตริงธรรมดาก่อนส่ง
    คำขอ

  </Accordion>

  <Accordion title="ข้อควรระวังเรื่อง Gemma และ tool-schema">
    บางชุดผสม `inferrs` + Gemma ในปัจจุบันยอมรับคำขอ
    `/v1/chat/completions` แบบเล็กโดยตรงได้ แต่ยังคงล้มเหลวเมื่อเป็น full OpenClaw agent-runtime
    turns

    หากเป็นเช่นนั้น ให้ลองสิ่งนี้ก่อน:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    การตั้งค่านี้จะปิดพื้นผิว tool schema ของ OpenClaw สำหรับโมเดลนั้น และช่วยลดแรงกดดันของ prompt
    บน local backends ที่เข้มงวดกว่า

    หากคำขอโดยตรงขนาดเล็กยังทำงานได้ แต่เทิร์นของเอเจนต์ OpenClaw ตามปกติยังคง
    crash ภายใน `inferrs` ปัญหาที่เหลือมักเป็นพฤติกรรมของโมเดล/เซิร์ฟเวอร์ต้นทาง
    มากกว่าชั้น transport ของ OpenClaw

  </Accordion>

  <Accordion title="การทดสอบ smoke แบบ manual">
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

    หากคำสั่งแรกทำงานแต่คำสั่งที่สองล้มเหลว ให้ดูส่วนการแก้ไขปัญหาด้านล่าง

  </Accordion>

  <Accordion title="พฤติกรรมแบบ proxy">
    `inferrs` ถูกมองเป็น backend `/v1` ที่เข้ากันได้กับ OpenAI แบบ proxy-style ไม่ใช่
    endpoint OpenAI แบบเนทีฟ

    - การจัดรูปคำขอแบบเฉพาะ OpenAI แบบเนทีฟจะไม่ใช้ที่นี่
    - ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี prompt-cache hints และไม่มี
      การจัดรูป payload ให้เข้ากันกับ OpenAI reasoning
    - hidden headers สำหรับ attribution ของ OpenClaw (`originator`, `version`, `User-Agent`)
      จะไม่ถูก inject ลงใน `inferrs` base URLs แบบกำหนดเอง

  </Accordion>
</AccordionGroup>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="curl /v1/models ล้มเหลว">
    `inferrs` ไม่ได้รันอยู่ เข้าถึงไม่ได้ หรือไม่ได้ bind กับ
    host/port ตามที่คาดไว้ ตรวจสอบให้แน่ใจว่าเซิร์ฟเวอร์ถูกเริ่มแล้วและกำลังฟังอยู่บน address ที่คุณ
    กำหนดค่าไว้
  </Accordion>

  <Accordion title="messages[].content คาดว่าจะเป็นสตริง">
    ตั้ง `compat.requiresStringContent: true` ใน model entry ดู
    ส่วน `requiresStringContent` ด้านบนสำหรับรายละเอียด
  </Accordion>

  <Accordion title="คำสั่ง /v1/chat/completions โดยตรงผ่าน แต่ openclaw infer model run ล้มเหลว">
    ลองตั้ง `compat.supportsTools: false` เพื่อปิดพื้นผิว tool schema
    ดูข้อควรระวังเรื่อง Gemma tool-schema ด้านบน
  </Accordion>

  <Accordion title="inferrs ยัง crash กับ agent turns ที่ใหญ่กว่า">
    หาก OpenClaw ไม่ได้รับ schema errors แล้ว แต่ `inferrs` ยัง crash กับ
    agent turns ที่ใหญ่กว่า ให้ถือว่าเป็นข้อจำกัดของ `inferrs` หรือโมเดลต้นทาง ลด
    แรงกดดันของ prompt หรือเปลี่ยนไปใช้ local backend หรือโมเดลอื่น
  </Accordion>
</AccordionGroup>

<Tip>
สำหรับความช่วยเหลือทั่วไป ดู [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Tip>

## ดูเพิ่มเติม

<CardGroup cols={2}>
  <Card title="โมเดลในเครื่อง" href="/th/gateway/local-models" icon="server">
    การรัน OpenClaw กับเซิร์ฟเวอร์โมเดลในเครื่อง
  </Card>
  <Card title="การแก้ไขปัญหา Gateway" href="/th/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    การดีบัก local backends ที่เข้ากันได้กับ OpenAI ซึ่งผ่าน probes แต่ล้มเหลวเมื่อรันเอเจนต์
  </Card>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด model refs และพฤติกรรม failover
  </Card>
</CardGroup>
