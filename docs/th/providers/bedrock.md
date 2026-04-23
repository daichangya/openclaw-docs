---
read_when:
    - คุณต้องการใช้โมเดล Amazon Bedrock กับ OpenClaw
    - คุณต้องการการตั้งค่า credential/region ของ AWS สำหรับการเรียกใช้โมเดล
summary: ใช้โมเดล Amazon Bedrock (Converse API) กับ OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-23T05:50:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw สามารถใช้โมเดล **Amazon Bedrock** ผ่าน provider แบบสตรีมมิง **Bedrock Converse**
ของ pi-ai ได้ การยืนยันตัวตนของ Bedrock ใช้ **AWS SDK default credential chain**
ไม่ใช่ API key

| คุณสมบัติ | ค่า                                                          |
| --------- | ------------------------------------------------------------ |
| Provider  | `amazon-bedrock`                                             |
| API       | `bedrock-converse-stream`                                    |
| Auth      | ข้อมูลรับรอง AWS (env var, shared config หรือ instance role) |
| Region    | `AWS_REGION` หรือ `AWS_DEFAULT_REGION` (ค่าเริ่มต้น: `us-east-1`) |

## เริ่มต้นใช้งาน

เลือกวิธียืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Access keys / env vars">
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
      <Step title="เพิ่ม provider และโมเดลของ Bedrock ลงใน config">
        ไม่จำเป็นต้องมี `apiKey` ให้กำหนดค่า provider ด้วย `auth: "aws-sdk"`:

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
    เมื่อใช้ auth แบบ env-marker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` หรือ `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw จะเปิดใช้ implicit Bedrock provider โดยอัตโนมัติสำหรับการค้นพบโมเดลโดยไม่ต้องมี config เพิ่มเติม
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **เหมาะที่สุดสำหรับ:** EC2 instance ที่แนบ IAM role ไว้แล้ว โดยใช้ instance metadata service สำหรับการยืนยันตัวตน

    <Steps>
      <Step title="เปิดใช้การค้นพบอย่างชัดเจน">
        เมื่อใช้ IMDS, OpenClaw จะไม่สามารถตรวจจับ AWS auth จาก env marker เพียงอย่างเดียวได้ ดังนั้นคุณต้องเลือกเปิดใช้เอง:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="เพิ่ม env marker แบบไม่บังคับสำหรับโหมดอัตโนมัติ">
        หากคุณต้องการให้พาธ auto-detection แบบ env-marker ทำงานด้วยเช่นกัน (เช่น สำหรับพื้นผิว `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        คุณ **ไม่** จำเป็นต้องมี API key ปลอม
      </Step>
      <Step title="ตรวจสอบว่ามีการค้นพบโมเดลแล้ว">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    IAM role ที่แนบกับ EC2 instance ของคุณต้องมีสิทธิ์ต่อไปนี้:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (สำหรับการค้นพบอัตโนมัติ)
    - `bedrock:ListInferenceProfiles` (สำหรับการค้นพบ inference profile)

    หรือแนบ managed policy `AmazonBedrockFullAccess`
    </Warning>

    <Note>
    คุณต้องใช้ `AWS_PROFILE=default` เฉพาะเมื่อคุณต้องการ env marker สำหรับโหมดอัตโนมัติหรือพื้นผิวสถานะโดยเฉพาะ พาธ auth ขณะรันไทม์จริงของ Bedrock ใช้ AWS SDK default chain ดังนั้น auth ผ่าน IMDS instance-role จึงทำงานได้แม้ไม่มี env marker
    </Note>

  </Tab>
</Tabs>

## การค้นพบโมเดลอัตโนมัติ

OpenClaw สามารถค้นพบโมเดล Bedrock ที่รองรับ **streaming**
และ **text output** ได้โดยอัตโนมัติ การค้นพบใช้ `bedrock:ListFoundationModels` และ
`bedrock:ListInferenceProfiles` และผลลัพธ์จะถูกแคชไว้ (ค่าเริ่มต้น: 1 ชั่วโมง)

วิธีที่ implicit provider ถูกเปิดใช้:

- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` เป็น `true`,
  OpenClaw จะพยายามค้นพบแม้จะไม่มี AWS env marker อยู่ก็ตาม
- หาก `plugins.entries.amazon-bedrock.config.discovery.enabled` ยังไม่ได้ตั้งค่า,
  OpenClaw จะเพิ่ม implicit Bedrock provider
  โดยอัตโนมัติก็ต่อเมื่อเห็นหนึ่งใน AWS auth marker เหล่านี้:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` หรือ `AWS_PROFILE`
- พาธ auth ขณะรันไทม์จริงของ Bedrock ยังคงใช้ AWS SDK default chain ดังนั้น
  shared config, SSO และ IMDS instance-role auth จึงทำงานได้ แม้การค้นพบ
  จะต้องใช้ `enabled: true` เพื่อเลือกเปิดใช้

<Note>
สำหรับรายการ `models.providers["amazon-bedrock"]` แบบชัดเจน OpenClaw ยังสามารถ resolve auth แบบ env-marker ของ Bedrock ได้ตั้งแต่ต้นจาก AWS env marker เช่น `AWS_BEARER_TOKEN_BEDROCK` โดยไม่ต้องบังคับให้โหลด auth ของ runtime เต็ม พาธ auth ของการเรียกโมเดลจริงยังคงใช้ AWS SDK default chain
</Note>

<AccordionGroup>
  <Accordion title="ตัวเลือก config ของการค้นพบ">
    ตัวเลือก config อยู่ใต้ `plugins.entries.amazon-bedrock.config.discovery`:

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
    | -------- | ----------- | -------- |
    | `enabled` | auto | ในโหมด auto OpenClaw จะเปิดใช้ implicit Bedrock provider ก็ต่อเมื่อพบ AWS env marker ที่รองรับ ตั้งค่าเป็น `true` เพื่อบังคับให้ค้นพบ |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | region ของ AWS ที่ใช้สำหรับการเรียก discovery API |
    | `providerFilter` | (ทั้งหมด) | จับคู่ชื่อ provider ของ Bedrock (เช่น `anthropic`, `amazon`) |
    | `refreshInterval` | `3600` | ระยะเวลาแคชเป็นวินาที ตั้งเป็น `0` เพื่อปิดการแคช |
    | `defaultContextWindow` | `32000` | context window ที่ใช้สำหรับโมเดลที่ค้นพบ (override ได้หากคุณทราบขีดจำกัดของโมเดล) |
    | `defaultMaxTokens` | `4096` | โทเค็นเอาต์พุตสูงสุดที่ใช้สำหรับโมเดลที่ค้นพบ (override ได้หากคุณทราบขีดจำกัดของโมเดล) |

  </Accordion>
</AccordionGroup>

## การตั้งค่าแบบรวดเร็ว (พาธ AWS)

ตัวอย่างนี้จะสร้าง IAM role, แนบสิทธิ์ของ Bedrock, เชื่อมโยง
instance profile และเปิดใช้การค้นพบของ OpenClaw บนโฮสต์ EC2

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

# 2. แนบเข้ากับ EC2 instance ของคุณ
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. บน EC2 instance ให้เปิดใช้การค้นพบอย่างชัดเจน
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. ไม่บังคับ: เพิ่ม env marker หากคุณต้องการโหมดอัตโนมัติโดยไม่ต้องเปิดใช้แบบ explicit
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. ตรวจสอบว่ามีการค้นพบโมเดลแล้ว
openclaw models list
```

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw ค้นพบ **inference profile ระดับ region และระดับ global** ควบคู่ไปกับ
    foundation model เมื่อ profile แมปไปยัง foundation model ที่รู้จัก
    profile นั้นจะสืบทอดความสามารถของโมเดลนั้น (context window, max tokens,
    reasoning, vision) และ region ของคำขอ Bedrock ที่ถูกต้องจะถูกฉีด
    ให้โดยอัตโนมัติ ซึ่งหมายความว่า profile Claude แบบ cross-region จะทำงานได้โดยไม่ต้อง override provider เอง

    รหัส inference profile จะมีลักษณะเช่น `us.anthropic.claude-opus-4-6-v1:0` (ระดับ region)
    หรือ `anthropic.claude-opus-4-6-v1:0` (ระดับ global) หากพบโมเดลต้นทางอยู่แล้ว
    ในผลการค้นพบ profile จะสืบทอดชุดความสามารถทั้งหมดของมัน;
    มิฉะนั้นจะใช้ค่าเริ่มต้นที่ปลอดภัย

    ไม่ต้องมีการกำหนดค่าเพิ่มเติม ตราบใดที่เปิดใช้การค้นพบและ IAM
    principal มี `bedrock:ListInferenceProfiles`, profile จะปรากฏควบคู่กับ
    foundation model ใน `openclaw models list`

  </Accordion>

  <Accordion title="Guardrails">
    คุณสามารถใช้ [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    กับการเรียกโมเดล Bedrock ทั้งหมดได้โดยเพิ่มอ็อบเจ็กต์ `guardrail` ลงใน
    config ของ Plugin `amazon-bedrock` Guardrails ช่วยให้คุณบังคับใช้การกรองเนื้อหา,
    การปฏิเสธหัวข้อ, การกรองคำ, การกรองข้อมูลอ่อนไหว และการตรวจสอบ
    contextual grounding ได้

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // รหัส guardrail หรือ ARN เต็ม
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

    | ตัวเลือก | จำเป็นหรือไม่ | คำอธิบาย |
    | -------- | ------------- | -------- |
    | `guardrailIdentifier` | ใช่ | รหัส Guardrail (เช่น `abc123`) หรือ ARN เต็ม (เช่น `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`) |
    | `guardrailVersion` | ใช่ | หมายเลขเวอร์ชันที่เผยแพร่แล้ว หรือ `"DRAFT"` สำหรับ working draft |
    | `streamProcessingMode` | ไม่ | `"sync"` หรือ `"async"` สำหรับการประเมิน guardrail ระหว่างการสตรีม หากไม่ระบุ Bedrock จะใช้ค่าเริ่มต้นของตัวเอง |
    | `trace` | ไม่ | `"enabled"` หรือ `"enabled_full"` สำหรับการดีบัก; ให้ละไว้หรือตั้งเป็น `"disabled"` สำหรับ production |

    <Warning>
    IAM principal ที่ gateway ใช้ต้องมีสิทธิ์ `bedrock:ApplyGuardrail` เพิ่มเติมจากสิทธิ์ invoke มาตรฐาน
    </Warning>

  </Accordion>

  <Accordion title="Embeddings สำหรับ memory search">
    Bedrock ยังสามารถทำหน้าที่เป็น provider ของ embedding สำหรับ
    [memory search](/th/concepts/memory-search) ได้ การตั้งค่านี้แยกจาก
    inference provider -- ให้ตั้ง `agents.defaults.memorySearch.provider` เป็น `"bedrock"`:

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

    embedding ของ Bedrock ใช้ AWS SDK credential chain เดียวกับ inference (instance
    role, SSO, access key, shared config และ web identity) ไม่ต้องใช้ API key
    เมื่อ `provider` เป็น `"auto"`, Bedrock จะถูกตรวจจับอัตโนมัติหาก
    credential chain นั้น resolve ได้สำเร็จ

    รองรับโมเดล embedding ได้แก่ Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) และ TwelveLabs Marengo ดู
    [Memory configuration reference -- Bedrock](/th/reference/memory-config#bedrock-embedding-config)
    สำหรับรายการโมเดลทั้งหมดและตัวเลือก dimension

  </Accordion>

  <Accordion title="หมายเหตุและข้อควรระวัง">
    - Bedrock ต้องเปิดใช้ **model access** ในบัญชี/region ของ AWS ของคุณ
    - การค้นพบอัตโนมัติต้องใช้สิทธิ์ `bedrock:ListFoundationModels` และ
      `bedrock:ListInferenceProfiles`
    - หากคุณใช้โหมดอัตโนมัติ ให้ตั้งหนึ่งใน AWS auth env marker ที่รองรับบน
      โฮสต์ gateway หากคุณต้องการใช้ IMDS/shared-config auth โดยไม่มี env marker ให้ตั้ง
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`
    - OpenClaw แสดงแหล่งที่มาของข้อมูลรับรองตามลำดับนี้: `AWS_BEARER_TOKEN_BEDROCK`,
      จากนั้น `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, จากนั้น `AWS_PROFILE`, แล้วจึงเป็น
      default AWS SDK chain
    - การรองรับ reasoning ขึ้นอยู่กับโมเดล; ตรวจสอบ Bedrock model card สำหรับ
      ความสามารถปัจจุบัน
    - หากคุณต้องการโฟลว์แบบ managed key คุณยังสามารถวาง proxy แบบ OpenAI-compatible
      ไว้หน้า Bedrock แล้วกำหนดค่าเป็น OpenAI provider แทนได้
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Memory search" href="/th/concepts/memory-search" icon="magnifying-glass">
    การกำหนดค่า embedding ของ Bedrock สำหรับ memory search
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า memory" href="/th/reference/memory-config#bedrock-embedding-config" icon="database">
    รายการโมเดล embedding ของ Bedrock แบบเต็มและตัวเลือก dimension
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
