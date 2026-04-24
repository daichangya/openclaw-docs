---
read_when:
    - คุณต้องการใช้โมเดล OSS ที่โฮสต์ด้วย Bedrock Mantle กับ OpenClaw
    - คุณต้องการปลายทาง OpenAI-compatible ของ Mantle สำหรับ GPT-OSS, Qwen, Kimi หรือ GLM
summary: ใช้โมเดล Amazon Bedrock Mantle (OpenAI-compatible) กับ OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-24T09:27:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

OpenClaw มี provider **Amazon Bedrock Mantle** ที่มาพร้อมกัน ซึ่งเชื่อมต่อกับ
ปลายทาง Mantle แบบ OpenAI-compatible โดย Mantle โฮสต์โมเดลโอเพนซอร์สและ
โมเดลจากผู้ให้บริการภายนอก (GPT-OSS, Qwen, Kimi, GLM และอื่น ๆ ที่คล้ายกัน) ผ่านพื้นผิว
`/v1/chat/completions` มาตรฐานที่ทำงานบนโครงสร้างพื้นฐานของ Bedrock

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-compatible) หรือ `anthropic-messages` (เส้นทาง Anthropic Messages) |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` แบบชัดเจน หรือการสร้าง bearer token จาก IAM credential chain    |
| Region เริ่มต้น | `us-east-1` (กำหนดแทนด้วย `AWS_REGION` หรือ `AWS_DEFAULT_REGION`)                            |

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Bearer token แบบชัดเจน">
    **เหมาะที่สุดสำหรับ:** สภาพแวดล้อมที่คุณมี Mantle bearer token อยู่แล้ว

    <Steps>
      <Step title="ตั้ง bearer token บนโฮสต์ gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        สามารถตั้ง region แบบไม่บังคับได้ (ค่าเริ่มต้นคือ `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีการค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        โมเดลที่ถูกค้นพบจะปรากฏภายใต้ provider `amazon-bedrock-mantle` โดยไม่
        ต้องมี config เพิ่มเติม เว้นแต่คุณต้องการกำหนดแทนค่าเริ่มต้น
      </Step>
    </Steps>

  </Tab>

  <Tab title="ข้อมูลรับรอง IAM">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลรับรองที่เข้ากันได้กับ AWS SDK (shared config, SSO, web identity, instance หรือ task roles)

    <Steps>
      <Step title="กำหนดค่า AWS credentials บนโฮสต์ gateway">
        แหล่ง auth ที่เข้ากันได้กับ AWS SDK ใด ๆ ก็ใช้ได้:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีการค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        OpenClaw จะสร้าง Mantle bearer token จาก credential chain ให้อัตโนมัติ
      </Step>
    </Steps>

    <Tip>
    เมื่อไม่ได้ตั้ง `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw จะสร้าง bearer token ให้คุณจาก AWS default credential chain รวมถึง shared credentials/config profiles, SSO, web identity และ instance หรือ task roles
    </Tip>

  </Tab>
</Tabs>

## การค้นหาโมเดลอัตโนมัติ

เมื่อมีการตั้ง `AWS_BEARER_TOKEN_BEDROCK`, OpenClaw จะใช้ค่านั้นโดยตรง หากไม่มี
OpenClaw จะพยายามสร้าง Mantle bearer token จาก AWS default
credential chain จากนั้นจึงค้นหาโมเดล Mantle ที่พร้อมใช้งานโดย query ไปยัง
ปลายทาง `/v1/models` ของ region นั้น

| พฤติกรรม          | รายละเอียด                 |
| ----------------- | ------------------------- |
| แคชการค้นหา       | แคชผลลัพธ์ไว้ 1 ชั่วโมง     |
| การรีเฟรช IAM token | ทุกชั่วโมง                 |

<Note>
bearer token นี้คือ `AWS_BEARER_TOKEN_BEDROCK` ตัวเดียวกับที่ provider [Amazon Bedrock](/th/providers/bedrock) มาตรฐานใช้
</Note>

### Regions ที่รองรับ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`

## การกำหนดค่าด้วยตนเอง

หากคุณต้องการใช้ config แบบชัดเจนแทน auto-discovery:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การรองรับ reasoning">
    การรองรับ reasoning จะถูกอนุมานจาก model IDs ที่มีรูปแบบอย่าง
    `thinking`, `reasoner` หรือ `gpt-oss-120b` โดย OpenClaw จะตั้ง `reasoning: true`
    ให้อัตโนมัติสำหรับโมเดลที่ตรงเงื่อนไขระหว่างการค้นหา
  </Accordion>

  <Accordion title="ปลายทางไม่พร้อมใช้งาน">
    หากปลายทาง Mantle ไม่พร้อมใช้งานหรือไม่ส่งคืนโมเดลใดเลย provider นี้
    จะถูกข้ามแบบเงียบ ๆ OpenClaw จะไม่แสดงข้อผิดพลาด; providers อื่นที่กำหนดค่า
    ไว้จะยังคงทำงานต่อไปตามปกติ
  </Accordion>

  <Accordion title="Claude Opus 4.7 ผ่านเส้นทาง Anthropic Messages">
    Mantle ยังเปิดเผยเส้นทาง Anthropic Messages ที่พาโมเดล Claude ผ่านเส้นทางสตรีมแบบ bearer-authenticated เดียวกัน Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) สามารถเรียกผ่านเส้นทางนี้ได้พร้อม provider-owned streaming ดังนั้น AWS bearer tokens จึงไม่ถูกมองเหมือน Anthropic API keys

    เมื่อคุณตรึงโมเดล Anthropic Messages บน provider Mantle, OpenClaw จะใช้พื้นผิว API แบบ `anthropic-messages` แทน `openai-completions` สำหรับโมเดลนั้น auth ยังคงมาจาก `AWS_BEARER_TOKEN_BEDROCK` (หรือ IAM bearer token ที่สร้างขึ้น)

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ความสัมพันธ์กับ provider Amazon Bedrock">
    Bedrock Mantle เป็น provider แยกจาก provider
    [Amazon Bedrock](/th/providers/bedrock) มาตรฐาน โดย Mantle ใช้พื้นผิว
    `/v1` แบบ OpenAI-compatible ส่วน provider Bedrock มาตรฐานใช้
    Bedrock API แบบเนทีฟ

    ทั้งสอง providers ใช้ข้อมูลรับรอง `AWS_BEARER_TOKEN_BEDROCK` ตัวเดียวกันร่วมกัน
    เมื่อมีการตั้งค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/th/providers/bedrock" icon="cloud">
    provider Bedrock แบบเนทีฟสำหรับ Anthropic Claude, Titan และโมเดลอื่น ๆ
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียด auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
