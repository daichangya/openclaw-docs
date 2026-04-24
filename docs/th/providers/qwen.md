---
read_when:
    - คุณต้องการใช้ Qwen กับ OpenClaw
    - คุณเคยใช้ Qwen OAuth มาก่อน
summary: ใช้ Qwen Cloud ผ่าน qwen provider แบบ bundled ของ OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T09:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth ถูกนำออกแล้ว** การผสานรวม OAuth แบบฟรี
(`qwen-portal`) ที่ใช้ endpoint ของ `portal.qwen.ai` ไม่พร้อมใช้งานอีกต่อไป
ดู [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) สำหรับ
ข้อมูลเบื้องหลัง

</Warning>

ตอนนี้ OpenClaw ถือว่า Qwen เป็น provider แบบ bundled ชั้นหนึ่งด้วย canonical id
`qwen` provider แบบ bundled นี้กำหนดเป้าหมายไปที่ endpoint ของ Qwen Cloud / Alibaba DashScope และ
Coding Plan และยังคงให้ `modelstudio` id แบบ legacy ใช้งานได้ในฐานะ
alias เพื่อความเข้ากันได้

- Provider: `qwen`
- ตัวแปร env ที่แนะนำ: `QWEN_API_KEY`
- รองรับด้วยเพื่อความเข้ากันได้: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- รูปแบบ API: เข้ากันได้กับ OpenAI

<Tip>
หากคุณต้องการ `qwen3.6-plus` ให้เลือกใช้ endpoint แบบ **Standard (pay-as-you-go)**
เนื่องจากการรองรับ Coding Plan อาจตามหลังแค็ตตาล็อกสาธารณะ
</Tip>

## เริ่มต้นใช้งาน

เลือกรูปแบบแพ็กเกจของคุณแล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Coding Plan (การสมัครใช้งาน)">
    **เหมาะสำหรับ:** การเข้าถึงแบบสมัครสมาชิกผ่าน Qwen Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="เรียกใช้ onboarding">
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
    `modelstudio-*` auth-choice id และ `modelstudio/...` model ref แบบ legacy ยังคง
    ใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรเลือกใช้
    `qwen-*` auth-choice id และ `qwen/...` model ref แบบ canonical
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **เหมาะสำหรับ:** การเข้าถึงแบบจ่ายตามการใช้งานผ่าน Standard Model Studio endpoint รวมถึงโมเดลอย่าง `qwen3.6-plus` ที่อาจไม่มีใน Coding Plan

    <Steps>
      <Step title="รับ API key ของคุณ">
        สร้างหรือคัดลอก API key จาก [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
      </Step>
      <Step title="เรียกใช้ onboarding">
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
    `modelstudio-*` auth-choice id และ `modelstudio/...` model ref แบบ legacy ยังคง
    ใช้งานได้ในฐานะ alias เพื่อความเข้ากันได้ แต่โฟลว์การตั้งค่าใหม่ควรเลือกใช้
    `qwen-*` auth-choice id และ `qwen/...` model ref แบบ canonical
    </Note>

  </Tab>
</Tabs>

## ประเภทแพ็กเกจและ endpoint

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

provider จะเลือก endpoint โดยอัตโนมัติตาม auth choice ของคุณ ตัวเลือกแบบ canonical
ใช้ตระกูล `qwen-*`; ส่วน `modelstudio-*` คงไว้เพื่อความเข้ากันได้เท่านั้น
คุณสามารถ override ได้ด้วย `baseUrl` แบบกำหนดเองในคอนฟิก

<Tip>
**จัดการ key:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**เอกสาร:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## แค็ตตาล็อกในตัว

ขณะนี้ OpenClaw มาพร้อมกับแค็ตตาล็อก Qwen แบบ bundled ดังต่อไปนี้ แค็ตตาล็อกที่กำหนดค่าไว้
รับรู้ endpoint: การกำหนดค่า Coding Plan จะละเว้นโมเดลที่ทราบว่าใช้ได้
เฉพาะบน Standard endpoint

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | โมเดลเริ่มต้น                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | ควรใช้ Standard endpoint เมื่อคุณต้องการโมเดลนี้    |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | สายผลิตภัณฑ์ Qwen Max                             |
| `qwen/qwen3-coder-next`     | text        | 262,144   | สำหรับโค้ด                                         |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | สำหรับโค้ด                                         |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | เปิดใช้ reasoning                                  |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI ผ่าน Alibaba                           |

<Note>
ความพร้อมใช้งานยังอาจแตกต่างกันตาม endpoint และแพ็กเกจการเรียกเก็บเงิน แม้ว่าโมเดลนั้น
จะมีอยู่ในแค็ตตาล็อกแบบ bundled ก็ตาม
</Note>

## ส่วนเสริมแบบหลายสื่อ

plugin `qwen` ยังเปิดเผยความสามารถแบบหลายสื่อบน endpoint DashScope แบบ **Standard**
(ไม่ใช่ endpoint ของ Coding Plan):

- **ความเข้าใจวิดีโอ** ผ่าน `qwen-vl-max-latest`
- **การสร้างวิดีโอ Wan** ผ่าน `wan2.6-t2v` (ค่าเริ่มต้น), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

หากต้องการใช้ Qwen เป็น provider วิดีโอเริ่มต้น:

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ความเข้าใจภาพและวิดีโอ">
    bundled Qwen plugin จะลงทะเบียนความเข้าใจสื่อสำหรับภาพและวิดีโอ
    บน endpoint DashScope แบบ **Standard** (ไม่ใช่ endpoint ของ Coding Plan)

    | Property      | Value                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | อินพุตที่รองรับ | Images, video       |

    ความเข้าใจสื่อจะ resolve อัตโนมัติจาก auth Qwen ที่กำหนดค่าไว้ — ไม่
    ต้องมีคอนฟิกเพิ่มเติม โปรดตรวจสอบให้แน่ใจว่าคุณใช้
    endpoint แบบ Standard (pay-as-you-go) เพื่อรองรับ media understanding

  </Accordion>

  <Accordion title="ความพร้อมใช้งานของ Qwen 3.6 Plus">
    `qwen3.6-plus` พร้อมใช้งานบน endpoint Model Studio แบบ Standard (pay-as-you-go):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    หาก endpoint ของ Coding Plan ส่งคืนข้อผิดพลาด "unsupported model" สำหรับ
    `qwen3.6-plus` ให้สลับไปใช้ Standard (pay-as-you-go) แทนคู่
    endpoint/key ของ Coding Plan

  </Accordion>

  <Accordion title="แผนความสามารถ">
    plugin `qwen` กำลังถูกวางตำแหน่งให้เป็นที่รวมของผู้จำหน่ายสำหรับพื้นผิว Qwen
    Cloud แบบเต็ม ไม่ใช่เฉพาะโมเดลสำหรับโค้ด/ข้อความเท่านั้น

    - **โมเดลข้อความ/แชต:** bundled แล้วตอนนี้
    - **การเรียกเครื่องมือ, structured output, thinking:** รับสืบทอดจาก transport ที่เข้ากันได้กับ OpenAI
    - **การสร้างภาพ:** วางแผนไว้ที่ชั้น provider-plugin
    - **ความเข้าใจภาพ/วิดีโอ:** bundled แล้วตอนนี้บน Standard endpoint
    - **เสียงพูด/เสียง:** วางแผนไว้ที่ชั้น provider-plugin
    - **Memory embeddings/reranking:** วางแผนผ่านพื้นผิว embedding adapter
    - **การสร้างวิดีโอ:** bundled แล้วตอนนี้ผ่านความสามารถ video-generation ที่ใช้ร่วมกัน

  </Accordion>

  <Accordion title="รายละเอียดการสร้างวิดีโอ">
    สำหรับการสร้างวิดีโอ OpenClaw จะแมปภูมิภาค Qwen ที่กำหนดค่าไว้ไปยังโฮสต์
    DashScope AIGC ที่ตรงกันก่อนส่งงาน:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    ซึ่งหมายความว่า `models.providers.qwen.baseUrl` ปกติที่ชี้ไปยังโฮสต์ Qwen
    แบบ Coding Plan หรือ Standard ก็ยังคงทำให้การสร้างวิดีโอใช้ endpoint วิดีโอ DashScope ตามภูมิภาค
    ที่ถูกต้องได้

    ข้อจำกัดการสร้างวิดีโอของ Qwen แบบ bundled ในปัจจุบัน:

    - ได้สูงสุด **1** วิดีโอผลลัพธ์ต่อคำขอ
    - ได้สูงสุด **1** ภาพอินพุต
    - ได้สูงสุด **4** วิดีโออินพุต
    - ระยะเวลาได้สูงสุด **10 วินาที**
    - รองรับ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
    - โหมดภาพ/วิดีโออ้างอิงในปัจจุบันต้องใช้ **URL แบบ remote http(s)** เท่านั้น
      ระบบจะปฏิเสธพาธไฟล์ในเครื่องล่วงหน้า เนื่องจาก endpoint วิดีโอของ DashScope ไม่
      รองรับการอัปโหลด local buffer สำหรับข้อมูลอ้างอิงเหล่านั้น

  </Accordion>

  <Accordion title="ความเข้ากันได้ของการใช้งานแบบสตรีมมิง">
    endpoint Model Studio แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานสตรีมมิงบน
    transport `openai-completions` ที่ใช้ร่วมกัน ตอนนี้ OpenClaw พิจารณาจาก
    ความสามารถของ endpoint ดังนั้น custom provider id ที่เข้ากันได้กับ DashScope และชี้ไปยัง
    โฮสต์เนทีฟเดียวกันจะรับพฤติกรรม streaming-usage แบบเดียวกัน แทนที่จะ
    ต้องใช้ provider id `qwen` แบบในตัวโดยเฉพาะ

    ความเข้ากันได้ของ native-streaming usage ใช้กับทั้งโฮสต์ Coding Plan และ
    โฮสต์ Standard แบบเข้ากันได้กับ DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ภูมิภาคของ endpoint แบบหลายสื่อ">
    พื้นผิวแบบหลายสื่อ (ความเข้าใจวิดีโอและการสร้างวิดีโอ Wan) ใช้
    endpoint DashScope แบบ **Standard** ไม่ใช่ endpoint ของ Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="การตั้งค่า environment และ daemon">
    หาก Gateway ทำงานเป็น daemon (launchd/systemd) โปรดตรวจสอบให้แน่ใจว่า `QWEN_API_KEY` ถูก
    ส่งให้ process นั้นด้วย (เช่น ใน `~/.openclaw/.env` หรือผ่าน
    `env.shellEnv`)
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/th/providers/alibaba" icon="cloud">
    provider ModelStudio แบบ legacy และหมายเหตุการย้ายระบบ
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
