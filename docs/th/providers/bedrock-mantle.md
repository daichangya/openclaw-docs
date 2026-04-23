---
read_when:
    - คุณต้องการใช้โมเดล OSS ที่โฮสต์บน Bedrock Mantle กับ OpenClaw
    - คุณต้องการ endpoint แบบเข้ากันได้กับ OpenAI ของ Mantle สำหรับ GPT-OSS, Qwen, Kimi หรือ GLM
summary: ใช้โมเดล Amazon Bedrock Mantle (ที่เข้ากันได้กับ OpenAI) กับ OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-23T05:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27e602b6f6a3ae92427de135cb9df6356e0daaea6b6fe54723a7542dd0d5d21e
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw มี provider **Amazon Bedrock Mantle** ที่มาพร้อมในชุด ซึ่งเชื่อมต่อไปยัง
endpoint แบบเข้ากันได้กับ OpenAI ของ Mantle Mantle โฮสต์โมเดลโอเพนซอร์สและ
โมเดลจากภายนอก (GPT-OSS, Qwen, Kimi, GLM และอื่น ๆ ที่คล้ายกัน) ผ่านพื้นผิวมาตรฐาน
`/v1/chat/completions` ที่ทำงานบนโครงสร้างพื้นฐานของ Bedrock

| คุณสมบัติ      | ค่า                                                                                  |
| -------------- | ------------------------------------------------------------------------------------ |
| Provider ID    | `amazon-bedrock-mantle`                                                              |
| API            | `openai-completions` (เข้ากันได้กับ OpenAI)                                          |
| Auth           | `AWS_BEARER_TOKEN_BEDROCK` แบบ explicit หรือการสร้าง bearer token จาก IAM credential chain |
| region เริ่มต้น | `us-east-1` (override ได้ด้วย `AWS_REGION` หรือ `AWS_DEFAULT_REGION`)                |

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Explicit bearer token">
    **เหมาะที่สุดสำหรับ:** สภาพแวดล้อมที่คุณมี Mantle bearer token อยู่แล้ว

    <Steps>
      <Step title="ตั้ง bearer token บนโฮสต์ gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        จะตั้ง region ด้วยก็ได้ (ค่าเริ่มต้นคือ `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="ตรวจสอบว่ามีการค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```

        โมเดลที่ค้นพบจะปรากฏภายใต้ provider `amazon-bedrock-mantle` โดยไม่ต้องมี
        config เพิ่มเติม เว้นแต่คุณต้องการ override ค่าเริ่มต้น
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **เหมาะที่สุดสำหรับ:** การใช้ข้อมูลรับรองที่เข้ากันได้กับ AWS SDK (shared config, SSO, web identity, instance หรือ task role)

    <Steps>
      <Step title="กำหนดค่า AWS credentials บนโฮสต์ gateway">
        แหล่ง auth ที่เข้ากันได้กับ AWS SDK ใช้ได้ทั้งหมด:

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
    เมื่อไม่ได้ตั้ง `AWS_BEARER_TOKEN_BEDROCK` ไว้ OpenClaw จะ mint bearer token ให้คุณจาก AWS default credential chain รวมถึง shared credentials/config profile, SSO, web identity และ instance หรือ task role
    </Tip>

  </Tab>
</Tabs>

## การค้นพบโมเดลอัตโนมัติ

เมื่อมีการตั้ง `AWS_BEARER_TOKEN_BEDROCK` ไว้ OpenClaw จะใช้งานมันโดยตรง มิฉะนั้น
OpenClaw จะพยายามสร้าง Mantle bearer token จาก AWS default
credential chain จากนั้นมันจะค้นหาโมเดล Mantle ที่พร้อมใช้งานโดย query ไปยัง
endpoint `/v1/models` ของ region นั้น

| พฤติกรรม           | รายละเอียด                 |
| ------------------ | -------------------------- |
| แคชการค้นพบ        | แคชผลลัพธ์ไว้ 1 ชั่วโมง    |
| การรีเฟรช IAM token | ทุกชั่วโมง                 |

<Note>
bearer token นี้คือตัวเดียวกับ `AWS_BEARER_TOKEN_BEDROCK` ที่ใช้โดย provider [Amazon Bedrock](/th/providers/bedrock) มาตรฐาน
</Note>

### region ที่รองรับ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`

## การกำหนดค่าด้วยตนเอง

หากคุณต้องการใช้ config แบบ explicit แทน auto-discovery:

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

## หมายเหตุขั้นสูง

<AccordionGroup>
  <Accordion title="รองรับ reasoning">
    การรองรับ reasoning จะถูกอนุมานจาก model ID ที่มีรูปแบบอย่าง
    `thinking`, `reasoner` หรือ `gpt-oss-120b` OpenClaw จะตั้ง `reasoning: true`
    ให้อัตโนมัติสำหรับโมเดลที่ตรงเงื่อนไขระหว่างการค้นพบ
  </Accordion>

  <Accordion title="endpoint ไม่พร้อมใช้งาน">
    หาก endpoint ของ Mantle ใช้งานไม่ได้หรือไม่คืนโมเดลใดมา provider นี้จะถูก
    ข้ามไปแบบเงียบ ๆ OpenClaw จะไม่ error; provider อื่นที่กำหนดค่าไว้
    จะยังทำงานต่อได้ตามปกติ
  </Accordion>

  <Accordion title="ความสัมพันธ์กับ provider Amazon Bedrock">
    Bedrock Mantle เป็น provider แยกจาก provider [Amazon Bedrock](/th/providers/bedrock)
    มาตรฐาน Mantle ใช้พื้นผิว `/v1` แบบเข้ากันได้กับ OpenAI ขณะที่ provider Bedrock มาตรฐานใช้
    native Bedrock API

    ทั้งสอง provider ใช้ข้อมูลรับรอง `AWS_BEARER_TOKEN_BEDROCK` ร่วมกันได้เมื่อ
    มีการกำหนดค่าไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/th/providers/bedrock" icon="cloud">
    provider Bedrock แบบเนทีฟสำหรับ Anthropic Claude, Titan และโมเดลอื่น ๆ
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="OAuth และ auth" href="/th/gateway/authentication" icon="key">
    รายละเอียดด้าน auth และกฎการใช้ข้อมูลรับรองซ้ำ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    ปัญหาที่พบบ่อยและวิธีแก้ไข
  </Card>
</CardGroup>
