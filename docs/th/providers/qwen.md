---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - ก่อนหน้านี้คุณเคยใช้ Qwen OAuth
summary: ใช้ Qwen Cloud ผ่านผู้ให้บริการ qwen ที่บันเดิลมากับ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-23T05:53:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth ถูกนำออกแล้ว** การเชื่อมต่อ OAuth แบบ free-tier
(`qwen-portal`) ที่ใช้ endpoints ของ `portal.qwen.ai` ไม่สามารถใช้งานได้อีกต่อไป
ดู [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) สำหรับ
ข้อมูลพื้นหลัง

</Warning>

ตอนนี้ OpenClaw มอง Qwen เป็นผู้ให้บริการแบบ first-class ที่บันเดิลมา โดยมี canonical id
เป็น `qwen` ผู้ให้บริการที่บันเดิลมานี้ชี้ไปยัง endpoints ของ Qwen Cloud / Alibaba DashScope และ
Coding Plan และยังคงทำให้ ids แบบเดิมของ `modelstudio` ใช้งานได้ในฐานะ
compatibility alias

- ผู้ให้บริการ: `qwen`
- ตัวแปรสภาพแวดล้อมที่แนะนำ: `QWEN_API_KEY`
- ที่ยอมรับได้เช่นกันเพื่อความเข้ากันได้: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI

<Tip>
หากคุณต้องการ `qwen3.6-plus` ให้เลือก endpoint แบบ **Standard (pay-as-you-go)** มากกว่า
การรองรับ Coding Plan อาจตามหลังแค็ตตาล็อกสาธารณะ
</Tip>

## เริ่มต้นใช้งาน

เลือกประเภทแพ็กเกจของคุณแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบ subscription ผ่าน Qwen Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        สำหรับ endpoint แบบ **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        สำหรับ endpoint แบบ **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    auth-choice ids แบบเดิม `modelstudio-*` และ model refs แบบ `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะ compatibility aliases แต่ flow การตั้งค่าใหม่ควรเลือกใช้
    auth-choice ids แบบ canonical ตระกูล `qwen-*` และ model refs แบบ `qwen/...`
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **เหมาะที่สุดสำหรับ:** การเข้าถึงแบบ pay-as-you-go ผ่าน endpoint ของ Standard Model Studio รวมถึงโมเดลอย่าง `qwen3.6-plus` ที่อาจไม่มีใน Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="รัน onboarding">
        สำหรับ endpoint แบบ **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        สำหรับ endpoint แบบ **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    auth-choice ids แบบเดิม `modelstudio-*` และ model refs แบบ `modelstudio/...` ยังคง
    ใช้งานได้ในฐานะ compatibility aliases แต่ flow การตั้งค่าใหม่ควรเลือกใช้
    auth-choice ids แบบ canonical ตระกูล `qwen-*` และ model refs แบบ `qwen/...`
    </Note>

  </Tab>
</Tabs>

## ประเภทแพ็กเกจและ endpoints

| แพ็กเกจ                       | ภูมิภาค | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

ผู้ให้บริการจะเลือก endpoint อัตโนมัติตาม auth choice ของคุณ ตัวเลือกแบบ canonical
ใช้ตระกูล `qwen-*`; `modelstudio-*` คงไว้เพื่อความเข้ากันได้เท่านั้น
คุณสามารถแทนที่ด้วย `baseUrl` แบบกำหนดเองในคอนฟิกได้

<Tip>
**จัดการคีย์:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกที่มีมาในตัว

ปัจจุบัน OpenClaw มาพร้อมแค็ตตาล็อก Qwen ที่บันเดิลมาดังนี้ แค็ตตาล็อกที่กำหนดค่าจะ
รับรู้ endpoint: คอนฟิกแบบ Coding Plan จะละโมเดลที่ทราบว่าใช้งานได้เฉพาะบน
Standard endpoint ออกไป

| การอ้างอิงโมเดล                   | อินพุต       | บริบท   | หมายเหตุ                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | โมเดลเริ่มต้น                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | ควรใช้ Standard endpoints เมื่อคุณต้องการโมเดลนี้ |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | สาย Qwen Max                                      |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | เปิดใช้ reasoning                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI ผ่าน Alibaba                            |

<Note>
ความพร้อมใช้งานยังอาจแตกต่างกันไปตาม endpoint และแผน billing แม้ว่าโมเดลจะ
มีอยู่ในแค็ตตาล็อกที่บันเดิลมาก็ตาม
</Note>

## ส่วนขยายหลายรูปแบบ

ส่วนขยาย `qwen` ยังเปิดให้ใช้ความสามารถแบบหลายรูปแบบบน endpoints ของ DashScope แบบ **Standard**
(ไม่ใช่ endpoints ของ Coding Plan):

- **การทำความเข้าใจวิดีโอ** ผ่าน `qwen-vl-max-latest`
- **การสร้างวิดีโอด้วย Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

หากต้องการใช้ Qwen เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์เครื่องมือแบบใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

## ขั้นสูง

<AccordionGroup>
  <Accordion title="การทำความเข้าใจภาพและวิดีโอ">
    Plugin Qwen ที่บันเดิลมาจะลงทะเบียน media understanding สำหรับภาพและวิดีโอ
    บน endpoints ของ DashScope แบบ **Standard** (ไม่ใช่ endpoints ของ Coding Plan)

    | คุณสมบัติ      | ค่า                 |
    | ------------- | --------------------- |
    | โมเดล         | `qwen-vl-max-latest`  |
    | อินพุตที่รองรับ | ภาพ, วิดีโอ       |

    media understanding จะถูก resolve อัตโนมัติจาก auth ของ Qwen ที่กำหนดค่าไว้ — ไม่
    ต้องตั้งค่าเพิ่มเติม ตรวจสอบให้แน่ใจว่าคุณกำลังใช้ Standard endpoint (pay-as-you-go)
    เพื่อรองรับ media understanding

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 Plus">
    `qwen3.6-plus` พร้อมใช้งานบน endpoints ของ Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    หาก endpoints ของ Coding Plan คืนข้อผิดพลาด "unsupported model" สำหรับ
    `qwen3.6-plus` ให้เปลี่ยนไปใช้ Standard (pay-as-you-go) แทน Coding Plan
    endpoint/key pair

  </Accordion>

  <Accordion title="แผนด้านความสามารถ">
    ส่วนขยาย `qwen` กำลังถูกวางตำแหน่งให้เป็นบ้านของผู้จำหน่ายสำหรับพื้นผิว Qwen
    Cloud แบบเต็ม ไม่ใช่แค่โมเดล coding/text

    - **โมเดลข้อความ/แชต:** บันเดิลมาแล้ว
    - **Tool calling, structured output, thinking:** สืบทอดจาก transport ที่เข้ากันได้กับ OpenAI
    - **การสร้างภาพ:** วางแผนไว้ในชั้น provider-plugin
    - **การทำความเข้าใจภาพ/วิดีโอ:** บันเดิลมาแล้วบน Standard endpoint
    - **Speech/audio:** วางแผนไว้ในชั้น provider-plugin
    - **Memory embeddings/reranking:** วางแผนไว้ผ่านพื้นผิว embedding adapter
    - **การสร้างวิดีโอ:** บันเดิลมาแล้วผ่านความสามารถการสร้างวิดีโอแบบใช้ร่วมกัน

  </Accordion>

  <Accordion title="รายละเอียดการสร้างวิดีโอ">
    สำหรับการสร้างวิดีโอ OpenClaw จะแมปภูมิภาค Qwen ที่กำหนดค่าไว้ไปยัง
    DashScope AIGC host ที่ตรงกันก่อนส่งงาน:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    นั่นหมายความว่า `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยัง
    โฮสต์ของ Coding Plan หรือ Standard Qwen ก็ยังคงทำให้การสร้างวิดีโอไปยัง
    regional DashScope video endpoint ที่ถูกต้อง

    ข้อจำกัดปัจจุบันของการสร้างวิดีโอ Qwen ที่บันเดิลมา:

    - สูงสุด **1** วิดีโอเอาต์พุตต่อคำขอ
    - สูงสุด **1** ภาพอินพุต
    - สูงสุด **4** วิดีโออินพุต
    - ความยาวสูงสุด **10 วินาที**
    - รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
    - โหมดภาพ/วิดีโออ้างอิงในปัจจุบันต้องใช้ **URL แบบ remote http(s)** พาธไฟล์ในเครื่อง
      จะถูกปฏิเสธตั้งแต่ต้น เพราะ DashScope video endpoint ไม่
      รับ uploaded local buffers สำหรับข้อมูลอ้างอิงเหล่านั้น

  </Accordion>

  <Accordion title="ความเข้ากันได้ของ streaming usage">
    endpoints ของ Native Model Studio ประกาศความเข้ากันได้ของ streaming usage บน
    transport `openai-completions` แบบใช้ร่วมกัน ตอนนี้ OpenClaw ผูกสิ่งนั้นกับ
    ความสามารถของ endpoint ดังนั้น custom provider ids ที่เข้ากันได้กับ DashScope และชี้ไปยัง
    native hosts เดียวกันจะสืบทอดพฤติกรรม streaming-usage แบบเดียวกัน แทนที่จะ
    ต้องใช้ built-in `qwen` provider id โดยเฉพาะ

    ความเข้ากันได้ของ native-streaming usage ใช้ได้ทั้งกับโฮสต์ของ Coding Plan และ
    โฮสต์แบบ Standard DashScope-compatible:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ภูมิภาคของ multimodal endpoint">
    พื้นผิวแบบหลายรูปแบบ (การทำความเข้าใจวิดีโอและการสร้างวิดีโอ Wan) ใช้
    endpoints ของ DashScope แบบ **Standard** ไม่ใช่ endpoints ของ Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="การตั้งค่าสภาพแวดล้อมและ daemon">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า `QWEN_API_KEY` พร้อมใช้งาน
    สำหรับโปรเซสนั้น (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์เครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือกผู้ให้บริการ
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/th/providers/alibaba" icon="cloud">
    ผู้ให้บริการ ModelStudio แบบเดิมและหมายเหตุการย้ายระบบ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
