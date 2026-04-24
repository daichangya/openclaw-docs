---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องการตั้งค่าข้อมูลรับรอง AWS/ภูมิภาคสำหรับการเรียกโมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T09:27:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่านผู้ให้บริการสตรีมมิง **Bedrock Converse**
ของ pi-ai ได้ การยืนยันตัวตนของ Bedrock ใช้ **AWS SDK default credential chain**
ไม่ใช่ API key

| คุณสมบัติ | ค่า |
| -------- | ----------------------------------------------------------- |
| ผู้ให้บริการ | `amazon-bedrock` |
| API | `bedrock-converse-stream` |
| การยืนยันตัวตน | ข้อมูลรับรอง AWS (ตัวแปรสภาพแวดล้อม, shared config หรือ instance role) |
| ภูมิภาค | `AWS_REGION` หรือ `AWS_DEFAULT_REGION` (ค่าเริ่มต้น: `us-east-1`) |

## เริ่มต้นใช้งาน

เลือกวิธีการยืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Access keys / ตัวแปรสภาพแวดล้อม">
    **เหมาะที่สุดสำหรับ:** เครื่องนักพัฒนา, CI หรือโฮสต์ที่คุณจัดการข้อมูลรับรอง AWS โดยตรง

    <Steps>
      <Step title="ตั้งค่าข้อมูลรับรอง AWS บนโฮสต์ gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # ไม่บังคับ:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # ไม่บังคับ (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="เพิ่มผู้ให้บริการ Bedrock และโมเดลลงใน config ของคุณ">
        ไม่ต้องใช้ `apiKey` ให้ตั้งค่าผู้ให้บริการด้วย `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    เมื่อใช้การยืนยันตัวตนแบบ env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`) OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock แบบ implicit โดยอัตโนมัติสำหรับการค้นหาโมเดลโดยไม่ต้องมี config เพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **เหมาะที่สุดสำหรับ:** อินสแตนซ์ EC2 ที่มี IAM role แนบอยู่ และใช้ instance metadata service สำหรับการยืนยันตัวตน

    <Steps>
      <Step title="เปิดใช้การค้นหาโดยระบุอย่างชัดเจน">
        เมื่อใช้ IMDS นั้น OpenClaw ไม่สามารถตรวจจับการยืนยันตัวตน AWS ได้จาก env marker เพียงอย่างเดียว ดังนั้นคุณต้องเลือกเปิดใช้เอง:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="เลือกเพิ่ม env marker สำหรับโหมดอัตโนมัติ">
        หากคุณต้องการให้เส้นทางการตรวจจับอัตโนมัติแบบ env-marker ทำงานด้วยเช่นกัน (ตัวอย่างเช่น สำหรับพื้นผิว `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        คุณ **ไม่** จำเป็นต้องใช้ API key ปลอม
      </Step>
      <Step title="ตรวจสอบว่าโมเดลถูกค้นพบแล้ว">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    IAM role ที่แนบกับอินสแตนซ์ EC2 ของคุณต้องมีสิทธิ์ดังต่อไปนี้:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (สำหรับการค้นหาอัตโนมัติ)
    - `bedrock:ListInferenceProfiles` (สำหรับการค้นหา inference profile)

    หรือแนบนโยบายแบบจัดการ `AmazonBedrockFullAccess`
    </Warning>

    <Note>
    คุณต้องใช้ `AWS_PROFILE=default` ก็ต่อเมื่อคุณต้องการ env marker สำหรับโหมดอัตโนมัติหรือพื้นผิวสถานะโดยเฉพาะเท่านั้น เส้นทางการยืนยันตัวตนของ Bedrock runtime จริงใช้ AWS SDK default chain ดังนั้นการยืนยันตัวตนด้วย instance-role ผ่าน IMDS จึงทำงานได้แม้ไม่มี env marker
    </Note>

  </Tab>
</Tabs>

## การค้นหาโมเดลอัตโนมัติ

OpenClaw สามารถค้นหาโมเดล Bedrock ที่รองรับ **การสตรีม**
และ **ผลลัพธ์ข้อความ** ได้โดยอัตโนมัติ การค้นหาใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และผลลัพธ์จะถูกแคชไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีเปิดใช้ผู้ให้บริการแบบ implicit:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`
  OpenClaw จะพยายามค้นหาแม้ไม่มี AWS env marker อยู่
- หากไม่ได้ตั้งค่า `plugins.entries.amazon-bedrock.config.discovery.enabled`
  OpenClaw จะเพิ่มผู้ให้บริการ Bedrock แบบ implicit
  โดยอัตโนมัติเฉพาะเมื่อพบหนึ่งในตัวบ่งชี้การยืนยันตัวตน AWS เหล่านี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- เส้นทางการยืนยันตัวตนของ Bedrock runtime จริงยังคงใช้ AWS SDK default chain ดังนั้น
  shared config, SSO และการยืนยันตัวตนด้วย IMDS instance-role จึงอาจทำงานได้แม้การค้นหาจะ
  ต้องใช้ `enabled: true` เพื่อเลือกเปิดใช้

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` ที่ระบุชัดเจน OpenClaw ยังสามารถ resolve การยืนยันตัวตนแบบ Bedrock env-marker ได้ตั้งแต่เนิ่นๆ จาก AWS env marker เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่บังคับให้ต้องโหลดการยืนยันตัวตน runtime เต็มรูปแบบ อย่างไรก็ตาม เส้นทางการยืนยันตัวตนของการเรียกโมเดลจริงยังคงใช้ AWS SDK default chain
</Note>

<AccordionGroup>
  <Accordion title="ตัวเลือก config ของการค้นหา">
    ตัวเลือก config อยู่ภายใต้ `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | ตัวเลือก | ค่าเริ่มต้น | คำอธิบาย |
    | ------ | ------- | ----------- |
    | `enabled` | auto | ในโหมดอัตโนมัติ OpenClaw จะเปิดใช้ผู้ให้บริการ Bedrock แบบ implicit เฉพาะเมื่อพบ AWS env marker ที่รองรับ ให้ตั้งเป็น `true` เพื่อบังคับเปิดใช้การค้นหา |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS region ที่ใช้สำหรับการเรียก API เพื่อค้นหา |
    | `providerFilter` | (ทั้งหมด) | จับคู่กับชื่อผู้ให้บริการของ Bedrock (เช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ให้ตั้งเป็น `0` เพื่อปิดการแคช |
    | `defaultContextWindow` | `32000` | context window ที่ใช้สำหรับโมเดลที่ค้นพบ (override ได้หากคุณทราบขีดจำกัดของโมเดล) |
    | `defaultMaxTokens` | `4096` | จำนวนโทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบ (override ได้หากคุณทราบขีดจำกัดของโมเดล) |

  </Accordion>
</AccordionGroup>

## การตั้งค่าแบบรวดเร็ว (เส้นทาง AWS)

ตัวอย่างนี้จะสร้าง IAM role, แนบสิทธิ์ของ Bedrock, เชื่อมโยง instance profile
และเปิดใช้การค้นหาของ OpenClaw บนโฮสต์ EC2

```bash
# 1. สร้าง IAM role และ instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. แนบเข้ากับอินสแตนซ์ EC2 ของคุณ
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. บนอินสแตนซ์ EC2 ให้เปิดใช้การค้นหาโดยระบุอย่างชัดเจน
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. ไม่บังคับ: เพิ่ม env marker หากคุณต้องการโหมดอัตโนมัติโดยไม่ต้องเปิดใช้แบบ explicit
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. ตรวจสอบว่าโมเดลถูกค้นพบแล้ว
openclaw models list
```

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw จะค้นหา **inference profiles แบบ regional และ global** ควบคู่ไปกับ
    foundation models เมื่อ profile หนึ่งแมปกับ foundation model ที่รู้จัก
    profile นั้นจะสืบทอดความสามารถของโมเดลดังกล่าว (context window, max tokens,
    reasoning, vision) และ region สำหรับคำขอ Bedrock ที่ถูกต้องจะถูกใส่ให้โดยอัตโนมัติ
    ซึ่งหมายความว่า Claude profile แบบข้าม region จะทำงานได้โดยไม่ต้อง override ผู้ให้บริการด้วยตนเอง

    ID ของ inference profile มีลักษณะเช่น `us.anthropic.claude-opus-4-6-v1:0` (regional)
    หรือ `anthropic.claude-opus-4-6-v1:0` (global) หากโมเดลต้นทางอยู่แล้ว
    ในผลลัพธ์การค้นหา profile จะสืบทอดชุดความสามารถทั้งหมดของมัน;
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่จำเป็นต้องมีการตั้งค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นหาและ IAM
    principal มี `bedrock:ListInferenceProfiles` profiles จะปรากฏควบคู่กับ
    foundation models ใน `openclaw models list`

  </Accordion>

  <Accordion title="Guardrails">
    คุณสามารถใช้ [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกโมเดล Bedrock ทั้งหมดได้ โดยเพิ่มอ็อบเจ็กต์ `guardrail` ลงใน
    config ของปลั๊กอิน `amazon-bedrock` Guardrails ช่วยให้คุณบังคับใช้นโยบายการกรองเนื้อหา
    การปฏิเสธหัวข้อ ตัวกรองคำ ตัวกรองข้อมูลอ่อนไหว และการตรวจสอบ contextual grounding

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID หรือ ARN แบบเต็ม
                guardrailVersion: "1", // หมายเลขเวอร์ชัน หรือ "DRAFT"
                streamProcessingMode: "sync", // ไม่บังคับ: "sync" หรือ "async"
                trace: "enabled", // ไม่บังคับ: "enabled", "disabled" หรือ "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | ตัวเลือก | จำเป็น | คำอธิบาย |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | ใช่ | Guardrail ID (เช่น `abc123`) หรือ ARN แบบเต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | ใช่ | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับฉบับร่างที่กำลังทำงาน |
    | `streamProcessingMode` | ไม่ | `"sync"` หรือ `"async"` สำหรับการประเมิน guardrail ระหว่างการสตรีม หากไม่ระบุ Bedrock จะใช้ค่าเริ่มต้นของตัวเอง |
    | `trace` | ไม่ | `"enabled"` หรือ `"enabled_full"` สำหรับการดีบัก; ไม่ต้องระบุหรือตั้งเป็น `"disabled"` สำหรับ production |

    <Warning>
    IAM principal ที่ gateway ใช้งานต้องมีสิทธิ์ `bedrock:ApplyGuardrail` เพิ่มเติมจากสิทธิ์ invoke มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Embeddings สำหรับการค้นหาหน่วยความจำ">
    Bedrock ยังสามารถทำหน้าที่เป็นผู้ให้บริการ embedding สำหรับ
    [การค้นหาหน่วยความจำ](/th/concepts/memory-search) ได้ด้วย โดยตั้งค่าแยกจาก
    ผู้ให้บริการ inference -- ให้ตั้ง `agents.defaults.memorySearch.provider` เป็น `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // ค่าเริ่มต้น
          },
        },
      },
    }
    ```

    embeddings ของ Bedrock ใช้ AWS SDK credential chain เดียวกันกับ inference (instance
    roles, SSO, access keys, shared config และ web identity) โดยไม่ต้องใช้ API key
    เมื่อ `provider` เป็น `"auto"` ระบบจะตรวจจับ Bedrock อัตโนมัติหาก
    credential chain ดังกล่าว resolve ได้สำเร็จ

    โมเดล embedding ที่รองรับ ได้แก่ Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo ดู
    [เอกสารอ้างอิงการตั้งค่าหน่วยความจำ -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือกของมิติ

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรทราบ">
    - Bedrock ต้องเปิดใช้ **model access** ในบัญชี/ภูมิภาค AWS ของคุณ
    - การค้นหาอัตโนมัติต้องใช้สิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากคุณพึ่งพาโหมดอัตโนมัติ ให้ตั้งค่า AWS auth env marker ที่รองรับตัวใดตัวหนึ่งบน
      โฮสต์ gateway หากคุณต้องการใช้การยืนยันตัวตนแบบ IMDS/shared-config โดยไม่มี env markers ให้ตั้ง
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw จะแสดงแหล่งที่มาของข้อมูลรับรองตามลำดับนี้: `AWS_BEARER_TOKEN_BEDROCK`,
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, จากนั้น `AWS_PROFILE`, แล้วจึงเป็น
      AWS SDK chain ค่าเริ่มต้น
    - การรองรับ reasoning ขึ้นอยู่กับโมเดล; โปรดตรวจสอบการ์ดโมเดลของ Bedrock สำหรับ
      ความสามารถล่าสุด
    - หากคุณต้องการโฟลว์คีย์แบบมีการจัดการ คุณสามารถวางพร็อกซีที่เข้ากันได้กับ OpenAI
      ไว้หน้า Bedrock แล้วตั้งค่าเป็นผู้ให้บริการ OpenAI แทนได้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="การค้นหาหน่วยความจำ" href="/th/concepts/memory-search" icon="magnifying-glass">
    การตั้งค่า embeddings ของ Bedrock สำหรับการค้นหาหน่วยความจำ
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่าหน่วยความจำ" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดล embedding ของ Bedrock แบบเต็มและตัวเลือกของมิติ
  </Card>
  <Card title="การแก้ปัญหา" href="/th/help/troubleshooting" icon="wrench">
    คำถามที่พบบ่อยและการแก้ปัญหาทั่วไป
  </Card>
</CardGroup>
