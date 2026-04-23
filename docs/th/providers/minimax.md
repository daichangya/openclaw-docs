---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-23T05:51:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

ผู้ให้บริการ MiniMax ของ OpenClaw ใช้ค่าเริ่มต้นเป็น **MiniMax M2.7**

MiniMax ยังมีสิ่งต่อไปนี้ด้วย:

- การสังเคราะห์เสียงแบบ bundled ผ่าน T2A v2
- การทำความเข้าใจภาพแบบ bundled ผ่าน `MiniMax-VL-01`
- การสร้างเพลงแบบ bundled ผ่าน `music-2.5+`
- `web_search` แบบ bundled ผ่าน MiniMax Coding Plan search API

การแยกผู้ให้บริการ:

| Provider ID      | การยืนยันตัวตน | ความสามารถ                                                      |
| ---------------- | -------------- | ---------------------------------------------------------------- |
| `minimax`        | API key        | ข้อความ, การสร้างภาพ, การทำความเข้าใจภาพ, เสียงพูด, web search |
| `minimax-portal` | OAuth          | ข้อความ, การสร้างภาพ, การทำความเข้าใจภาพ                       |

## รายชื่อโมเดล

| โมเดล                    | ประเภท            | คำอธิบาย                                      |
| ------------------------ | ----------------- | --------------------------------------------- |
| `MiniMax-M2.7`           | แชต (reasoning)   | โมเดล reasoning แบบโฮสต์ที่เป็นค่าเริ่มต้น   |
| `MiniMax-M2.7-highspeed` | แชต (reasoning)   | reasoning tier ของ M2.7 ที่เร็วกว่า           |
| `MiniMax-VL-01`          | Vision            | โมเดลทำความเข้าใจภาพ                          |
| `image-01`               | การสร้างภาพ       | การสร้างภาพจากข้อความและการแก้ไขภาพต่อภาพ    |
| `music-2.5+`             | การสร้างเพลง      | โมเดลเพลงค่าเริ่มต้น                          |
| `music-2.5`              | การสร้างเพลง      | tier ก่อนหน้าสำหรับการสร้างเพลง               |
| `music-2.0`              | การสร้างเพลง      | tier แบบ legacy สำหรับการสร้างเพลง            |
| `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ    | โฟลว์ text-to-video และ image reference       |

## เริ่มต้นใช้งาน

เลือกวิธียืนยันตัวตนที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะที่สุดสำหรับ:** การตั้งค่าอย่างรวดเร็วด้วย MiniMax Coding Plan ผ่าน OAuth โดยไม่ต้องใช้ API key

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="รัน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            วิธีนี้จะยืนยันตัวตนกับ `api.minimax.io`
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="จีน">
        <Steps>
          <Step title="รัน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            วิธีนี้จะยืนยันตัวตนกับ `api.minimaxi.com`
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    ชุดติดตั้งแบบ OAuth ใช้ provider id `minimax-portal` model ref จะอยู่ในรูปแบบ `minimax-portal/MiniMax-M2.7`
    </Note>

    <Tip>
    ลิงก์แนะนำ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **เหมาะที่สุดสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API แบบเข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="รัน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            วิธีนี้จะตั้งค่า `api.minimax.io` เป็น base URL
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="จีน">
        <Steps>
          <Step title="รัน onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            วิธีนี้จะตั้งค่า `api.minimaxi.com` เป็น base URL
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### ตัวอย่างคอนฟิก

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    บนเส้นทางสตรีมแบบเข้ากันได้กับ Anthropic นั้น OpenClaw จะปิด thinking ของ MiniMax โดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน endpoint แบบสตรีมของ MiniMax จะส่ง `reasoning_content` ออกมาเป็น delta chunk สไตล์ OpenAI แทนที่จะเป็นบล็อก thinking แบบ Anthropic โดยตรง ซึ่งอาจทำให้ reasoning ภายในรั่วออกไปยังเอาต์พุตที่มองเห็นได้หากยังเปิดใช้งานโดยปริยาย
    </Warning>

    <Note>
    ชุดติดตั้งแบบ API key ใช้ provider id `minimax` model ref จะอยู่ในรูปแบบ `minimax/MiniMax-M2.7`
    </Note>

  </Tab>
</Tabs>

## ตั้งค่าผ่าน `openclaw configure`

ใช้ wizard คอนฟิกแบบโต้ตอบเพื่อตั้งค่า MiniMax โดยไม่ต้องแก้ JSON เอง:

<Steps>
  <Step title="เปิด wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="เลือก Model/auth">
    เลือก **Model/auth** จากเมนู
  </Step>
  <Step title="เลือกตัวเลือก auth ของ MiniMax">
    เลือกหนึ่งในตัวเลือก MiniMax ที่มี:

    | ตัวเลือก auth | คำอธิบาย |
    | --- | --- |
    | `minimax-global-oauth` | OAuth สำหรับนานาชาติ (Coding Plan) |
    | `minimax-cn-oauth` | OAuth สำหรับจีน (Coding Plan) |
    | `minimax-global-api` | API key สำหรับนานาชาติ |
    | `minimax-cn-api` | API key สำหรับจีน |

  </Step>
  <Step title="เลือกโมเดลเริ่มต้นของคุณ">
    เลือกโมเดลเริ่มต้นเมื่อระบบถาม
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

Plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับ tool `image_generate` โดยรองรับ:

- **การสร้างภาพจากข้อความ** พร้อมการควบคุม aspect ratio
- **การแก้ไขภาพแบบ image-to-image** (subject reference) พร้อมการควบคุม aspect ratio
- ได้สูงสุด **9 ภาพผลลัพธ์** ต่อคำขอ
- ได้สูงสุด **1 ภาพอ้างอิง** ต่อคำขอแก้ไข
- aspect ratio ที่รองรับ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

หากต้องการใช้ MiniMax สำหรับการสร้างภาพ ให้ตั้งเป็นผู้ให้บริการการสร้างภาพ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin นี้ใช้ `MINIMAX_API_KEY` หรือการยืนยันตัวตนแบบ OAuth เดียวกันกับโมเดลข้อความ หากตั้งค่า MiniMax ไว้แล้วก็ไม่ต้องตั้งค่าเพิ่มเติม

ทั้ง `minimax` และ `minimax-portal` จะลงทะเบียน `image_generate` ด้วยโมเดล
`image-01` ตัวเดียวกัน ชุดติดตั้งแบบ API key ใช้ `MINIMAX_API_KEY`; ชุดติดตั้งแบบ OAuth สามารถใช้เส้นทาง auth แบบ bundled ของ `minimax-portal` แทนได้

เมื่อ onboarding หรือการตั้งค่า API key เขียนรายการ `models.providers.minimax`
แบบ explicit, OpenClaw จะ materialize `MiniMax-M2.7` และ
`MiniMax-M2.7-highspeed` พร้อม `input: ["text", "image"]`

ส่วนแค็ตตาล็อกข้อความ MiniMax แบบ bundled ที่มีมาในตัวเอง ยังคงเป็นเมทาดาทาแบบข้อความล้วน
จนกว่าจะมีคอนฟิกผู้ให้บริการแบบ explicit นั้น การทำความเข้าใจภาพจะถูกเปิดเผยแยกต่างหาก
ผ่านผู้ให้บริการสื่อ `MiniMax-VL-01` ที่เป็นของ Plugin

<Note>
ดู [Image Generation](/th/tools/image-generation) สำหรับพารามิเตอร์ของ tool ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การสร้างเพลง

Plugin `minimax` แบบ bundled ยังลงทะเบียนการสร้างเพลงผ่าน tool
`music_generate` ที่ใช้ร่วมกันด้วย

- โมเดลเพลงค่าเริ่มต้น: `minimax/music-2.5+`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- ตัวควบคุม prompt: `lyrics`, `instrumental`, `durationSeconds`
- รูปแบบเอาต์พุต: `mp3`
- การรันที่มี session รองรับจะแยกออกผ่านโฟลว์ task/status ที่ใช้ร่วมกัน รวมถึง `action: "status"`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการเพลงค่าเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
ดู [Music Generation](/th/tools/music-generation) สำหรับพารามิเตอร์ของ tool ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การสร้างวิดีโอ

Plugin `minimax` แบบ bundled ยังลงทะเบียนการสร้างวิดีโอผ่าน tool
`video_generate` ที่ใช้ร่วมกันด้วย

- โมเดลวิดีโอค่าเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โหมด: text-to-video และโฟลว์แบบอ้างอิงภาพเดี่ยว
- รองรับ `aspectRatio` และ `resolution`

หากต้องการใช้ MiniMax เป็นผู้ให้บริการวิดีโอค่าเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
ดู [Video Generation](/th/tools/video-generation) สำหรับพารามิเตอร์ของ tool ที่ใช้ร่วมกัน การเลือกผู้ให้บริการ และพฤติกรรม failover
</Note>

### การทำความเข้าใจภาพ

Plugin MiniMax ลงทะเบียนการทำความเข้าใจภาพแยกจากแค็ตตาล็อกข้อความ:

| Provider ID      | โมเดลภาพเริ่มต้น    |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

นี่คือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้การทำความเข้าใจภาพของ MiniMax ได้ แม้ว่าแค็ตตาล็อกผู้ให้บริการข้อความแบบ bundled จะยังแสดง ref ของแชต M2.7 แบบข้อความล้วนอยู่ก็ตาม

### Web search

Plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน MiniMax Coding Plan
search API ด้วย

- provider id: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URL, snippet, related query
- env var ที่ควรใช้: `MINIMAX_CODE_PLAN_KEY`
- env alias ที่ยอมรับ: `MINIMAX_CODING_API_KEY`
- fallback เพื่อความเข้ากันได้: `MINIMAX_API_KEY` เมื่อมันชี้ไปยัง token แบบ coding-plan อยู่แล้ว
- การใช้ region ซ้ำ: `plugins.entries.minimax.config.webSearch.region`, จากนั้น `MINIMAX_API_HOST`, จากนั้นจึง base URL ของผู้ให้บริการ MiniMax
- search ยังคงอยู่บน provider id `minimax`; การตั้งค่า OAuth แบบ CN/global ก็ยังสามารถชี้นำ region ได้ทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl`

คอนฟิกอยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [MiniMax Search](/th/tools/minimax-search) สำหรับคอนฟิกและการใช้งาน web search แบบเต็ม
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวเลือกการตั้งค่า">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | ควรใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกเสริมสำหรับ payload แบบเข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | ควรใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกเสริมสำหรับ payload แบบเข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | API key ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | ตั้งชื่อแฝงให้โมเดลที่คุณต้องการใส่ใน allowlist |
    | `models.mode` | คงค่าเป็น `merge` หากคุณต้องการเพิ่ม MiniMax ควบคู่กับ built-ins |
  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ thinking">
    บน `api: "anthropic-messages"` OpenClaw จะ inject `thinking: { type: "disabled" }` เว้นแต่จะมีการตั้ง thinking ไว้อย่างชัดเจนใน params/config อยู่แล้ว

    วิธีนี้ป้องกันไม่ให้ endpoint แบบสตรีมของ MiniMax ส่ง `reasoning_content` ออกมาเป็น delta chunk สไตล์ OpenAI ซึ่งจะทำให้ reasoning ภายในรั่วออกไปยังเอาต์พุตที่มองเห็นได้

  </Accordion>

  <Accordion title="โหมดเร็ว">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมแบบเข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="ตัวอย่าง fallback">
    **เหมาะที่สุดสำหรับ:** ใช้โมเดลรุ่นใหม่ล่าสุดที่แข็งแกร่งที่สุดของคุณเป็นตัวหลัก แล้ว fail over ไปที่ MiniMax M2.7 ตัวอย่างด้านล่างใช้ Opus เป็นโมเดลหลักตัวอย่างแบบเจาะจง; คุณสามารถสลับเป็นโมเดลหลักรุ่นใหม่ที่คุณต้องการได้

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="รายละเอียดการใช้งาน Coding Plan">
    - API การใช้งานของ Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (ต้องใช้ coding plan key)
    - OpenClaw จะ normalize การใช้งาน coding-plan ของ MiniMax ให้เป็นการแสดงผลแบบ `% left` เหมือนที่ใช้กับผู้ให้บริการรายอื่น ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่เหลือ ไม่ใช่โควตาที่ใช้ไป ดังนั้น OpenClaw จะกลับค่าของมัน ฟิลด์แบบนับจำนวนจะมีความสำคัญก่อนเมื่อมีอยู่
    - เมื่อ API ส่งกลับ `model_remains` OpenClaw จะเลือกข้อมูลของ chat model ก่อน อนุมานป้ายชื่อหน้าต่างจาก `start_time` / `end_time` เมื่อจำเป็น และรวมชื่อโมเดลที่เลือกไว้ในป้ายชื่อแผน เพื่อให้แยกหน้าต่างของ coding-plan ได้ง่ายขึ้น
    - สแนปชอตการใช้งานถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน และจะเลือก MiniMax OAuth ที่เก็บไว้ก่อน fallback ไปยัง env var ของ Coding Plan key
  </Accordion>
</AccordionGroup>

## หมายเหตุ

- model ref จะเป็นไปตามเส้นทางการยืนยันตัวตน:
  - ชุดติดตั้งแบบ API key: `minimax/<model>`
  - ชุดติดตั้งแบบ OAuth: `minimax-portal/<model>`
- โมเดลแชตค่าเริ่มต้น: `MiniMax-M2.7`
- โมเดลแชตทางเลือก: `MiniMax-M2.7-highspeed`
- onboarding และการตั้งค่า API key แบบตรงจะเขียนนิยามโมเดลแบบ explicit พร้อม `input: ["text", "image"]` สำหรับ M2.7 ทั้งสองรุ่น
- แค็ตตาล็อกผู้ให้บริการแบบ bundled ปัจจุบันเปิดเผย ref ของแชตเป็นเมทาดาทาแบบข้อความล้วน จนกว่าจะมีคอนฟิกผู้ให้บริการ MiniMax แบบ explicit
- อัปเดตราคาค่าใช้จ่ายใน `models.json` หากคุณต้องการการติดตามต้นทุนที่แม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยัน provider id ปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M2.7` หรือ `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
ลิงก์แนะนำ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับกฎของผู้ให้บริการ
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    โดยทั่วไปหมายความว่า **ยังไม่ได้ตั้งค่าผู้ให้บริการ MiniMax** (ไม่มี provider entry ที่ตรงกัน และไม่พบ auth profile/env key ของ MiniMax) การแก้ไขสำหรับการตรวจจับนี้อยู่ใน **2026.1.12** แก้ไขได้โดย:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจาก source `main`) แล้วรีสตาร์ต Gateway
    - รัน `openclaw configure` และเลือกตัวเลือก auth ของ **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือ auth profile ของ MiniMax เพื่อให้สามารถ inject ผู้ให้บริการที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่า model id **แยกตัวพิมพ์เล็กใหญ่**:

    - เส้นทางแบบ API key: `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทางแบบ OAuth: `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

    จากนั้นตรวจสอบอีกครั้งด้วย:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของ image tool ที่ใช้ร่วมกัน และการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์ของ music tool ที่ใช้ร่วมกัน และการเลือกผู้ให้บริการ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของ video tool ที่ใช้ร่วมกัน และการเลือกผู้ให้บริการ
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การตั้งค่า web search ผ่าน MiniMax Coding Plan
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและ FAQ
  </Card>
</CardGroup>
