---
read_when:
    - คุณต้องการใช้ Chutes กับ OpenClaw
    - "คุณต้องการเส้นทางการตั้งค่าแบบ OAuth หรือ API key +#+#+#+#+#+analysis to=functions.read 】【。】【”】【commentary to=functions.read 娱乐开号json 市场部联系{\"path\":\"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md\",\"offset\":1,\"limit\":20}\U0004E886user to=functions.read commentary  天天中彩票不json  六和彩{\"path\":\"/home/runner/work/docs/docs/source/.agents/skills/openclaw-pr-maintainer/SKILL.md\",\"offset\":1,\"limit\":20}\"}"
    - คุณต้องการทราบโมเดลเริ่มต้น aliases หรือพฤติกรรมการค้นหา მოდელები
summary: การตั้งค่า Chutes (OAuth หรือ API key, การค้นหาโมเดล, aliases)
title: Chutes
x-i18n:
    generated_at: "2026-04-23T05:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) เปิดให้ใช้งานแค็ตตาล็อกโมเดลโอเพนซอร์สผ่าน
API ที่เข้ากันได้กับ OpenAI OpenClaw รองรับทั้ง browser OAuth และการยืนยันตัวตน
ด้วย API key โดยตรงสำหรับผู้ให้บริการ `chutes` ที่บันเดิลมา

| คุณสมบัติ | ค่า                        |
| -------- | ---------------------------- |
| ผู้ให้บริการ | `chutes`                     |
| API      | เข้ากันได้กับ OpenAI            |
| Base URL | `https://llm.chutes.ai/v1`   |
| Auth     | OAuth หรือ API key (ดูด้านล่าง) |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="รัน flow สำหรับ onboarding แบบ OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw จะเปิด browser flow ในเครื่อง หรือแสดง flow แบบ URL + วาง redirect
        สำหรับโฮสต์แบบ remote/headless OAuth tokens จะรีเฟรชอัตโนมัติผ่าน OpenClaw auth
        profiles
      </Step>
      <Step title="ตรวจสอบโมเดลเริ่มต้น">
        หลังจาก onboarding โมเดลเริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และแค็ตตาล็อก Chutes ที่บันเดิลมาจะถูก
        ลงทะเบียน
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="รับ API key">
        สร้างคีย์ได้ที่
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
      </Step>
      <Step title="รัน flow onboarding แบบ API key">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="ตรวจสอบโมเดลเริ่มต้น">
        หลังจาก onboarding โมเดลเริ่มต้นจะถูกตั้งเป็น
        `chutes/zai-org/GLM-4.7-TEE` และแค็ตตาล็อก Chutes ที่บันเดิลมาจะถูก
        ลงทะเบียน
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
ทั้งสองเส้นทางการยืนยันตัวตนจะลงทะเบียนแค็ตตาล็อก Chutes ที่บันเดิลมา และตั้งโมเดลเริ่มต้นเป็น
`chutes/zai-org/GLM-4.7-TEE` ตัวแปรสภาพแวดล้อมของ runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`
</Note>

## พฤติกรรมการค้นหา

เมื่อมี auth ของ Chutes พร้อมใช้งาน OpenClaw จะ query แค็ตตาล็อกของ Chutes ด้วย
credential นั้นและใช้โมเดลที่ค้นพบได้ หากการค้นหาล้มเหลว OpenClaw จะ
fallback ไปใช้แค็ตตาล็อกแบบคงที่ที่บันเดิลมา เพื่อให้ onboarding และ startup
ยังคงทำงานได้

## aliases เริ่มต้น

OpenClaw ลงทะเบียน convenience aliases สามรายการสำหรับแค็ตตาล็อก Chutes ที่บันเดิลมา:

| Alias           | โมเดลเป้าหมาย                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## แค็ตตาล็อกเริ่มต้นที่มีมาในตัว

แค็ตตาล็อก fallback ที่บันเดิลมารวม refs ของ Chutes ปัจจุบัน:

| การอ้างอิงโมเดล                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## ตัวอย่างคอนฟิก

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การแทนที่ OAuth">
    คุณสามารถปรับแต่ง flow ของ OAuth ด้วยตัวแปรสภาพแวดล้อมแบบไม่บังคับ:

    | ตัวแปร | วัตถุประสงค์ |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth client ID แบบกำหนดเอง |
    | `CHUTES_CLIENT_SECRET` | OAuth client secret แบบกำหนดเอง |
    | `CHUTES_OAUTH_REDIRECT_URI` | redirect URI แบบกำหนดเอง |
    | `CHUTES_OAUTH_SCOPES` | OAuth scopes แบบกำหนดเอง |

    ดู [เอกสาร OAuth ของ Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    สำหรับข้อกำหนดของ redirect app และข้อมูลช่วยเหลือ

  </Accordion>

  <Accordion title="หมายเหตุ">
    - การค้นหาทั้งแบบ API key และ OAuth ใช้ provider id `chutes` เดียวกัน
    - โมเดลของ Chutes จะถูกลงทะเบียนเป็น `chutes/<model-id>`
    - หากการค้นหาล้มเหลวตอน startup ระบบจะใช้แค็ตตาล็อกแบบคงที่ที่บันเดิลมาโดยอัตโนมัติ
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาคอนฟิกเต็ม รวมถึงการตั้งค่าของผู้ให้บริการ
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    แดชบอร์ด Chutes และเอกสาร API
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    สร้างและจัดการ Chutes API keys
  </Card>
</CardGroup>
