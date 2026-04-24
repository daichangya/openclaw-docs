---
read_when:
    - คุณต้องการใช้โมเดล MiniMax ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า MiniMax
summary: ใช้โมเดล MiniMax ใน OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T09:28:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

provider MiniMax ของ OpenClaw ใช้ **MiniMax M2.7** เป็นค่าเริ่มต้น

MiniMax ยังมีสิ่งต่อไปนี้ด้วย:

- การสังเคราะห์เสียงแบบ bundled ผ่าน T2A v2
- การทำความเข้าใจภาพแบบ bundled ผ่าน `MiniMax-VL-01`
- การสร้างเพลงแบบ bundled ผ่าน `music-2.5+`
- `web_search` แบบ bundled ผ่าน MiniMax Coding Plan search API

การแยก provider:

| Provider ID      | Auth    | ความสามารถ                                                     |
| ---------------- | ------- | -------------------------------------------------------------- |
| `minimax`        | คีย์ API | ข้อความ การสร้างภาพ การทำความเข้าใจภาพ เสียงพูด การค้นหาเว็บ     |
| `minimax-portal` | OAuth   | ข้อความ การสร้างภาพ การทำความเข้าใจภาพ                         |

## แค็ตตาล็อกที่มาพร้อมระบบ

| โมเดล                    | ประเภท            | คำอธิบาย                                 |
| ------------------------ | ----------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | แชต (reasoning)   | โมเดล reasoning แบบโฮสต์เริ่มต้น          |
| `MiniMax-M2.7-highspeed` | แชต (reasoning)   | ระดับ reasoning M2.7 ที่เร็วกว่า           |
| `MiniMax-VL-01`          | Vision            | โมเดลทำความเข้าใจภาพ                      |
| `image-01`               | การสร้างภาพ       | การสร้างภาพจากข้อความและการแก้ไขภาพต่อภาพ |
| `music-2.5+`             | การสร้างเพลง      | โมเดลเพลงเริ่มต้น                         |
| `music-2.5`              | การสร้างเพลง      | ระดับการสร้างเพลงรุ่นก่อน                 |
| `music-2.0`              | การสร้างเพลง      | ระดับการสร้างเพลงแบบ legacy               |
| `MiniMax-Hailuo-2.3`     | การสร้างวิดีโอ    | โฟลว์ข้อความสู่วิดีโอและการอ้างอิงภาพ      |

## เริ่มต้นใช้งาน

เลือกวิธี auth ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **เหมาะสำหรับ:** การตั้งค่าอย่างรวดเร็วด้วย MiniMax Coding Plan ผ่าน OAuth โดยไม่ต้องใช้คีย์ API

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="เรียกใช้ onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            การดำเนินการนี้จะยืนยันตัวตนกับ `api.minimax.io`
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
          <Step title="เรียกใช้ onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            การดำเนินการนี้จะยืนยันตัวตนกับ `api.minimaxi.com`
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
    การตั้งค่าแบบ OAuth ใช้ provider id `minimax-portal` โดย model refs มีรูปแบบเป็น `minimax-portal/MiniMax-M2.7`
    </Note>

    <Tip>
    ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="คีย์ API">
    **เหมาะสำหรับ:** MiniMax แบบโฮสต์ที่ใช้ API แบบเข้ากันได้กับ Anthropic

    <Tabs>
      <Tab title="นานาชาติ">
        <Steps>
          <Step title="เรียกใช้ onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimax.io` เป็น base URL
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
          <Step title="เรียกใช้ onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            การดำเนินการนี้จะกำหนดค่า `api.minimaxi.com` เป็น base URL
          </Step>
          <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### ตัวอย่าง config

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
    บนเส้นทาง streaming แบบเข้ากันได้กับ Anthropic OpenClaw จะปิด MiniMax thinking
    โดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน endpoint สำหรับ streaming ของ MiniMax
    ส่ง `reasoning_content` ออกมาในรูปแบบ delta chunks สไตล์ OpenAI แทน native
    thinking blocks ของ Anthropic ซึ่งอาจทำให้ reasoning ภายในรั่วไปยังเอาต์พุตที่มองเห็นได้
    หากปล่อยให้เปิดใช้งานโดยปริยาย
    </Warning>

    <Note>
    การตั้งค่าแบบคีย์ API ใช้ provider id `minimax` โดย model refs มีรูปแบบเป็น `minimax/MiniMax-M2.7`
    </Note>

  </Tab>
</Tabs>

## กำหนดค่าผ่าน `openclaw configure`

ใช้วิซาร์ด config แบบโต้ตอบเพื่อตั้งค่า MiniMax โดยไม่ต้องแก้ไข JSON:

<Steps>
  <Step title="เปิดวิซาร์ด">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="เลือก Model/auth">
    เลือก **Model/auth** จากเมนู
  </Step>
  <Step title="เลือกตัวเลือก auth ของ MiniMax">
    เลือกหนึ่งในตัวเลือก MiniMax ที่มีอยู่:

    | ตัวเลือก auth | คำอธิบาย |
    | --- | --- |
    | `minimax-global-oauth` | OAuth สำหรับต่างประเทศ (Coding Plan) |
    | `minimax-cn-oauth` | OAuth สำหรับจีน (Coding Plan) |
    | `minimax-global-api` | คีย์ API สำหรับต่างประเทศ |
    | `minimax-cn-api` | คีย์ API สำหรับจีน |

  </Step>
  <Step title="เลือกโมเดลเริ่มต้นของคุณ">
    เลือกโมเดลเริ่มต้นของคุณเมื่อระบบถาม
  </Step>
</Steps>

## ความสามารถ

### การสร้างภาพ

plugin MiniMax ลงทะเบียนโมเดล `image-01` สำหรับเครื่องมือ `image_generate` โดยรองรับ:

- **การสร้างภาพจากข้อความ** พร้อมการควบคุมอัตราส่วนภาพ
- **การแก้ไขภาพจากภาพ** (การอ้างอิงวัตถุ) พร้อมการควบคุมอัตราส่วนภาพ
- สูงสุด **9 ภาพผลลัพธ์** ต่อคำขอ
- สูงสุด **1 ภาพอ้างอิง** ต่อคำขอแก้ไข
- อัตราส่วนภาพที่รองรับ: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

หากต้องการใช้ MiniMax สำหรับการสร้างภาพ ให้ตั้งค่าเป็น provider การสร้างภาพ:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

plugin จะใช้ auth แบบ `MINIMAX_API_KEY` หรือ OAuth เดียวกับโมเดลข้อความ โดยไม่ต้องกำหนดค่าเพิ่มเติมหากตั้งค่า MiniMax ไว้แล้ว

ทั้ง `minimax` และ `minimax-portal` จะลงทะเบียน `image_generate` ด้วยโมเดล
`image-01` เดียวกัน การตั้งค่าแบบคีย์ API ใช้ `MINIMAX_API_KEY`; การตั้งค่าแบบ OAuth สามารถใช้
เส้นทาง auth ของ `minimax-portal` ที่มาพร้อมระบบแทนได้

เมื่อ onboarding หรือการตั้งค่าแบบคีย์ API เขียนรายการ `models.providers.minimax`
แบบชัดเจน OpenClaw จะสร้าง `MiniMax-M2.7` และ
`MiniMax-M2.7-highspeed` พร้อม `input: ["text", "image"]`

แค็ตตาล็อกข้อความ MiniMax แบบ bundled ที่มาพร้อมระบบเองจะยังคงเป็น metadata แบบข้อความอย่างเดียว
จนกว่าจะมี provider config แบบชัดเจนนั้น การทำความเข้าใจภาพจะถูกเปิดเผยแยกต่างหาก
ผ่าน media provider `MiniMax-VL-01` ที่ plugin เป็นเจ้าของ

<Note>
ดู [การสร้างภาพ](/th/tools/image-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การสร้างเพลง

plugin `minimax` ที่มาพร้อมระบบยังลงทะเบียนการสร้างเพลงผ่านเครื่องมือ
`music_generate` แบบใช้ร่วมกันด้วย

- โมเดลเพลงเริ่มต้น: `minimax/music-2.5+`
- รองรับ `minimax/music-2.5` และ `minimax/music-2.0` ด้วย
- ตัวควบคุม prompt: `lyrics`, `instrumental`, `durationSeconds`
- รูปแบบผลลัพธ์: `mp3`
- การรันที่อิงกับ session จะแยกออกผ่านโฟลว์ task/status แบบใช้ร่วมกัน รวมถึง `action: "status"`

หากต้องการใช้ MiniMax เป็น provider เพลงเริ่มต้น:

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
ดู [การสร้างเพลง](/th/tools/music-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การสร้างวิดีโอ

plugin `minimax` ที่มาพร้อมระบบยังลงทะเบียนการสร้างวิดีโอผ่านเครื่องมือ
`video_generate` แบบใช้ร่วมกันด้วย

- โมเดลวิดีโอเริ่มต้น: `minimax/MiniMax-Hailuo-2.3`
- โหมด: ข้อความสู่วิดีโอ และโฟลว์อ้างอิงภาพเดี่ยว
- รองรับ `aspectRatio` และ `resolution`

หากต้องการใช้ MiniMax เป็น provider วิดีโอเริ่มต้น:

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
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน การเลือก provider และพฤติกรรม failover
</Note>

### การทำความเข้าใจภาพ

plugin MiniMax ลงทะเบียนการทำความเข้าใจภาพแยกจาก
แค็ตตาล็อกข้อความ:

| Provider ID      | โมเดลภาพเริ่มต้น    |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

นั่นคือเหตุผลที่การกำหนดเส้นทางสื่ออัตโนมัติสามารถใช้การทำความเข้าใจภาพของ MiniMax ได้
แม้ว่าแค็ตตาล็อก text-provider แบบ bundled จะยังแสดง refs แชต M2.7 แบบข้อความอย่างเดียวก็ตาม

### การค้นหาเว็บ

plugin MiniMax ยังลงทะเบียน `web_search` ผ่าน MiniMax Coding Plan
search API ด้วย

- provider id: `minimax`
- ผลลัพธ์แบบมีโครงสร้าง: ชื่อเรื่อง, URLs, snippets, คำค้นที่เกี่ยวข้อง
- env var ที่แนะนำ: `MINIMAX_CODE_PLAN_KEY`
- env alias ที่ยอมรับ: `MINIMAX_CODING_API_KEY`
- fallback เพื่อความเข้ากันได้: `MINIMAX_API_KEY` เมื่อชี้ไปยังโทเค็น coding-plan อยู่แล้ว
- การใช้ region ซ้ำ: `plugins.entries.minimax.config.webSearch.region`, จากนั้น `MINIMAX_API_HOST`, แล้วจึง Base URL ของ provider MiniMax
- การค้นหายังคงอยู่บน provider id `minimax`; การตั้งค่า OAuth แบบ CN/global ยังสามารถกำหนด region ทางอ้อมผ่าน `models.providers.minimax-portal.baseUrl` ได้

config อยู่ภายใต้ `plugins.entries.minimax.config.webSearch.*`

<Note>
ดู [MiniMax Search](/th/tools/minimax-search) สำหรับการตั้งค่าและการใช้งาน web search แบบเต็ม
</Note>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวเลือกการตั้งค่า">
    | ตัวเลือก | คำอธิบาย |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | ควรใช้ `https://api.minimax.io/anthropic` (เข้ากันได้กับ Anthropic); `https://api.minimax.io/v1` เป็นตัวเลือกสำหรับ payloads ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.api` | ควรใช้ `anthropic-messages`; `openai-completions` เป็นตัวเลือกสำหรับ payloads ที่เข้ากันได้กับ OpenAI |
    | `models.providers.minimax.apiKey` | คีย์ API ของ MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | กำหนด `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | ตั้งชื่อแทนให้โมเดลที่คุณต้องการใน allowlist |
    | `models.mode` | คงค่า `merge` ไว้หากคุณต้องการเพิ่ม MiniMax ควบคู่กับรายการที่มาพร้อมระบบ |
  </Accordion>

  <Accordion title="ค่าเริ่มต้นของ thinking">
    บน `api: "anthropic-messages"` OpenClaw จะใส่ `thinking: { type: "disabled" }` ให้โดยอัตโนมัติ เว้นแต่จะมีการตั้งค่า thinking ไว้อย่างชัดเจนแล้วใน params/config

    การทำเช่นนี้ช่วยป้องกันไม่ให้ endpoint สำหรับ streaming ของ MiniMax ส่ง `reasoning_content` ออกมาในรูปแบบ delta chunks สไตล์ OpenAI ซึ่งจะทำให้ reasoning ภายในรั่วไปยังเอาต์พุตที่มองเห็นได้

  </Accordion>

  <Accordion title="โหมดเร็ว">
    `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed` บนเส้นทางสตรีมที่เข้ากันได้กับ Anthropic
  </Accordion>

  <Accordion title="ตัวอย่างการสลับไปใช้รุ่นสำรอง">
    **เหมาะสำหรับ:** ใช้โมเดลรุ่นล่าสุดที่ทรงพลังที่สุดของคุณเป็นตัวหลัก แล้วสลับไปใช้ MiniMax M2.7 หากล้มเหลว ตัวอย่างด้านล่างใช้ Opus เป็นโมเดลหลักแบบตัวอย่างที่ชัดเจน คุณสามารถเปลี่ยนเป็นโมเดลหลักรุ่นล่าสุดที่คุณต้องการได้

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
    - API การใช้งานของ Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (ต้องใช้คีย์ coding plan)
    - OpenClaw จะทำให้ค่าการใช้งาน coding-plan ของ MiniMax เป็นรูปแบบมาตรฐานเดียวกับการแสดง `% ที่เหลือ` ของผู้ให้บริการรายอื่น ฟิลด์ดิบ `usage_percent` / `usagePercent` ของ MiniMax หมายถึงโควตาที่เหลืออยู่ ไม่ใช่โควตาที่ใช้ไปแล้ว ดังนั้น OpenClaw จะกลับค่าดังกล่าว โดยหากมีฟิลด์แบบนับจำนวน ระบบจะให้ความสำคัญกับฟิลด์เหล่านั้นก่อน
    - เมื่อ API ส่งกลับ `model_remains` OpenClaw จะเลือกใช้รายการโมเดลแชตเป็นหลัก อนุมานป้ายหน้าต่างเวลาจาก `start_time` / `end_time` เมื่อต้องใช้ และรวมชื่อโมเดลที่เลือกไว้ในป้ายแผน เพื่อให้แยกแยะหน้าต่าง coding-plan ได้ง่ายขึ้น
    - สแนปช็อตการใช้งานจะถือว่า `minimax`, `minimax-cn` และ `minimax-portal` เป็นพื้นผิวโควตา MiniMax เดียวกัน และจะเลือก MiniMax OAuth ที่เก็บไว้ก่อน แล้วค่อย fallback ไปยัง env vars ของคีย์ Coding Plan
  </Accordion>
</AccordionGroup>

## หมายเหตุ

- Model refs จะขึ้นอยู่กับเส้นทาง auth:
  - การตั้งค่าแบบคีย์ API: `minimax/<model>`
  - การตั้งค่าแบบ OAuth: `minimax-portal/<model>`
- โมเดลแชตเริ่มต้น: `MiniMax-M2.7`
- โมเดลแชตทางเลือก: `MiniMax-M2.7-highspeed`
- Onboarding และการตั้งค่าแบบคีย์ API โดยตรงจะเขียนนิยามโมเดลแบบชัดเจนพร้อม `input: ["text", "image"]` สำหรับ M2.7 ทั้งสองรุ่น
- แค็ตตาล็อก provider แบบ bundled ปัจจุบันเปิดเผย chat refs เป็น metadata แบบข้อความอย่างเดียวจนกว่าจะมี config ของ provider MiniMax แบบชัดเจน
- อัปเดตค่าราคาใน `models.json` หากคุณต้องการการติดตามต้นทุนที่แม่นยำ
- ใช้ `openclaw models list` เพื่อยืนยัน provider id ปัจจุบัน จากนั้นสลับด้วย `openclaw models set minimax/MiniMax-M2.7` หรือ `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
ลิงก์แนะนำสำหรับ MiniMax Coding Plan (ลด 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers) สำหรับกฎของ provider
</Note>

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title='"ไม่รู้จักโมเดล: minimax/MiniMax-M2.7"'>
    โดยทั่วไปหมายความว่า **ยังไม่ได้ตั้งค่า provider ของ MiniMax** (ไม่มีรายการ provider ที่ตรงกัน และไม่พบ auth profile/env key ของ MiniMax ที่ตรงกัน) การแก้ไขสำหรับการตรวจจับนี้อยู่ใน **2026.1.12** โดยแก้ไขได้ดังนี้:

    - อัปเกรดเป็น **2026.1.12** (หรือรันจากซอร์ส `main`) แล้วรีสตาร์ต gateway
    - รัน `openclaw configure` แล้วเลือกตัวเลือก auth ของ **MiniMax** หรือ
    - เพิ่มบล็อก `models.providers.minimax` หรือ `models.providers.minimax-portal` ที่ตรงกันด้วยตนเอง หรือ
    - ตั้งค่า `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax auth profile เพื่อให้สามารถ inject provider ที่ตรงกันได้

    ตรวจสอบให้แน่ใจว่า model id **แยกตัวพิมพ์เล็กใหญ่**:

    - เส้นทางคีย์ API: `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed`
    - เส้นทาง OAuth: `minimax-portal/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7-highspeed`

    จากนั้นตรวจสอบอีกครั้งด้วย:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ไขปัญหา](/th/help/troubleshooting) และ [คำถามที่พบบ่อย](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก providers, model refs และพฤติกรรม failover
  </Card>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    พารามิเตอร์ของเครื่องมือภาพแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    พารามิเตอร์ของเครื่องมือเพลงแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือวิดีโอแบบใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="MiniMax Search" href="/th/tools/minimax-search" icon="magnifying-glass">
    การตั้งค่า web search ผ่าน MiniMax Coding Plan
  </Card>
  <Card title="การแก้ไขปัญหา" href="/th/help/troubleshooting" icon="wrench">
    การแก้ไขปัญหาทั่วไปและคำถามที่พบบ่อย
  </Card>
</CardGroup>
