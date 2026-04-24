---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T09:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

Venice AI ให้บริการ **การอนุมาน AI ที่เน้นความเป็นส่วนตัว** พร้อมรองรับโมเดลที่ไม่ถูกเซ็นเซอร์ และการเข้าถึงโมเดล proprietary รายใหญ่ผ่าน proxy แบบไม่ระบุตัวตนของ Venice การอนุมานทั้งหมดเป็นแบบ private โดยค่าปริยาย — ไม่มีการฝึกด้วยข้อมูลของคุณ และไม่มีการบันทึก log

## เหตุใดจึงใช้ Venice ใน OpenClaw

- **การอนุมานแบบเป็นส่วนตัว** สำหรับโมเดลโอเพนซอร์ส (ไม่มีการบันทึก log)
- **โมเดลที่ไม่ถูกเซ็นเซอร์** เมื่อคุณต้องการ
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดล proprietary (Opus/GPT/Gemini) เมื่อคุณต้องการคุณภาพสูง
- endpoint `/v1` ที่เข้ากันได้กับ OpenAI

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัว 2 แบบ — การเข้าใจสิ่งนี้เป็นกุญแจสำคัญในการเลือกโมเดลของคุณ:

| โหมด            | คำอธิบาย                                                                                                                     | โมเดล                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**     | เป็นส่วนตัวอย่างสมบูรณ์ พรอมป์/คำตอบจะ **ไม่ถูกจัดเก็บหรือบันทึก log** เลย เป็นแบบ ephemeral                                | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored ฯลฯ |
| **Anonymized**  | ส่งผ่าน proxy ของ Venice พร้อมลบ metadata ออก provider ปลายทาง (OpenAI, Anthropic, Google, xAI) จะเห็นคำขอที่ไม่ระบุตัวตน | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบ anonymized **ไม่ใช่** แบบ private อย่างสมบูรณ์ Venice จะลบ metadata ก่อนส่งต่อ แต่ provider ปลายทาง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขอนั้น เลือกโมเดล **Private** เมื่อคุณต้องการความเป็นส่วนตัวเต็มรูปแบบ
</Warning>

## ฟีเจอร์

- **เน้นความเป็นส่วนตัว**: เลือกได้ระหว่างโหมด "private" (เป็นส่วนตัวเต็มรูปแบบ) และ "anonymized" (ผ่าน proxy)
- **โมเดลไม่ถูกเซ็นเซอร์**: เข้าถึงโมเดลที่ไม่มีข้อจำกัดด้านเนื้อหา
- **เข้าถึงโมเดลหลัก**: ใช้ Claude, GPT, Gemini และ Grok ผ่าน proxy แบบไม่ระบุตัวตนของ Venice
- **API ที่เข้ากันได้กับ OpenAI**: endpoint `/v1` มาตรฐานเพื่อให้ง่ายต่อการเชื่อมต่อ
- **Streaming**: รองรับในทุกโมเดล
- **Function calling**: รองรับในบางโมเดล (ตรวจสอบ capability ของโมเดล)
- **Vision**: รองรับในโมเดลที่มี capability ด้าน vision
- **ไม่มี hard rate limit**: อาจมี fair-use throttling หากใช้งานหนักมากผิดปกติ

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key ของคุณ">
    1. สมัครที่ [venice.ai](https://venice.ai)
    2. ไปที่ **Settings > API Keys > Create new key**
    3. คัดลอก API key ของคุณ (รูปแบบ: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="กำหนดค่า OpenClaw">
    เลือกวิธีการตั้งค่าที่คุณต้องการ:

    <Tabs>
      <Tab title="แบบโต้ตอบ (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        สิ่งนี้จะ:
        1. พรอมป์ขอ API key ของคุณ (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
        2. แสดงโมเดล Venice ทั้งหมดที่ใช้งานได้
        3. ให้คุณเลือกโมเดลเริ่มต้น
        4. กำหนดค่า provider ให้อัตโนมัติ
      </Tab>
      <Tab title="ตัวแปรแวดล้อม">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="แบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="ตรวจสอบการตั้งค่า">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## การเลือกโมเดล

หลังจากตั้งค่าแล้ว OpenClaw จะแสดงโมเดล Venice ทั้งหมดที่ใช้งานได้ ให้เลือกตามความต้องการของคุณ:

- **โมเดลค่าปริยาย**: `venice/kimi-k2-5` สำหรับ reasoning แบบ private ที่แข็งแรงพร้อม vision
- **ตัวเลือกที่มี capability สูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบ anonymized ที่แข็งแรงที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "private" สำหรับการอนุมานที่เป็นส่วนตัวเต็มรูปแบบ
- **Capability**: เลือกโมเดล "anonymized" เพื่อเข้าถึง Claude, GPT, Gemini ผ่าน proxy ของ Venice

เปลี่ยนโมเดลเริ่มต้นได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลทั้งหมดที่ใช้งานได้:

```bash
openclaw models list | grep venice
```

คุณยังสามารถรัน `openclaw configure`, เลือก **Model/auth** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะกับกรณีใช้งานของคุณ

| กรณีใช้งาน                 | โมเดลที่แนะนำ                      | เหตุผล                                           |
| -------------------------- | ---------------------------------- | ------------------------------------------------ |
| **แชตทั่วไป (ค่าปริยาย)**   | `kimi-k2-5`                        | reasoning แบบ private ที่แข็งแรงพร้อม vision    |
| **คุณภาพโดยรวมดีที่สุด**     | `claude-opus-4-6`                  | ตัวเลือก Venice แบบ anonymized ที่แข็งแรงที่สุด |
| **ความเป็นส่วนตัว + การเขียนโค้ด** | `qwen3-coder-480b-a35b-instruct` | โมเดลโค้ดแบบ private พร้อม context ขนาดใหญ่     |
| **Vision แบบ private**     | `kimi-k2-5`                        | รองรับ vision โดยไม่ออกจากโหมด private         |
| **เร็ว + ประหยัด**          | `qwen3-4b`                         | โมเดล reasoning แบบ lightweight                 |
| **งาน private ที่ซับซ้อน**  | `deepseek-v3.2`                    | reasoning แข็งแรง แต่ไม่มี Venice tool support  |
| **ไม่ถูกเซ็นเซอร์**         | `venice-uncensored`                | ไม่มีข้อจำกัดด้านเนื้อหา                         |

</Tip>

## แค็ตตาล็อกที่มาพร้อมระบบ (รวม 41 รายการ)

<AccordionGroup>
  <Accordion title="โมเดล Private (26) — เป็นส่วนตัวเต็มรูปแบบ, ไม่มีการบันทึก log">
    | Model ID                               | ชื่อ                                 | Context | ฟีเจอร์                     |
    | -------------------------------------- | ------------------------------------ | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                            | 256k    | ค่าปริยาย, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                     | 256k    | Reasoning                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                        | 128k    | General                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                         | 128k    | General                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B              | 128k    | General, ปิด tools          |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                  | 128k    | Reasoning                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                  | 128k    | General                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                     | 256k    | Coding                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo               | 256k    | Coding                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                      | 256k    | Reasoning, vision           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                       | 256k    | General                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)               | 256k    | Vision                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)              | 32k     | เร็ว, reasoning             |
    | `deepseek-v3.2`                        | DeepSeek V3.2                        | 160k    | Reasoning, ปิด tools        |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)  | 32k     | ไม่ถูกเซ็นเซอร์, ปิด tools |
    | `mistral-31-24b`                       | Venice Medium (Mistral)              | 128k    | Vision                      |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct          | 198k    | Vision                      |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                  | 128k    | General                     |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B           | 128k    | General                     |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                | 128k    | Reasoning                   |
    | `zai-org-glm-4.6`                      | GLM 4.6                              | 198k    | General                     |
    | `zai-org-glm-4.7`                      | GLM 4.7                              | 198k    | Reasoning                   |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                        | 128k    | Reasoning                   |
    | `zai-org-glm-5`                        | GLM 5                                | 198k    | Reasoning                   |
    | `minimax-m21`                          | MiniMax M2.1                         | 198k    | Reasoning                   |
    | `minimax-m25`                          | MiniMax M2.5                         | 198k    | Reasoning                   |
  </Accordion>

  <Accordion title="โมเดล Anonymized (15) — ผ่าน proxy ของ Venice">
    | Model ID                        | ชื่อ                            | Context | ฟีเจอร์                   |
    | ------------------------------- | ------------------------------- | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)   | 1M      | Reasoning, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (ผ่าน Venice)   | 198k    | Reasoning, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice) | 1M      | Reasoning, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (ผ่าน Venice) | 198k    | Reasoning, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)           | 1M      | Reasoning, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)     | 400k    | Reasoning, vision, coding |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)           | 256k    | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)     | 256k    | Reasoning, vision, coding |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)    | 1M      | Reasoning, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)      | 198k    | Reasoning, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)    | 256k    | Reasoning, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)     | 1M      | Reasoning, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (ผ่าน Venice)  | 256k    | Reasoning, coding         |
  </Accordion>
</AccordionGroup>

## การค้นพบโมเดล

OpenClaw จะค้นหาโมเดลจาก Venice API โดยอัตโนมัติเมื่อมีการตั้งค่า `VENICE_API_KEY` หากเข้าถึง API ไม่ได้ ระบบจะ fallback ไปใช้แค็ตตาล็อกแบบ static

endpoint `/models` เป็นแบบสาธารณะ (ไม่ต้องใช้ auth สำหรับการแสดงรายการ) แต่การอนุมานต้องใช้ API key ที่ถูกต้อง

## การสตรีมและการรองรับเครื่องมือ

| ฟีเจอร์              | การรองรับ                                               |
| -------------------- | ------------------------------------------------------- |
| **Streaming**        | ทุกโมเดล                                                |
| **Function calling** | โมเดลส่วนใหญ่ (ตรวจสอบ `supportsFunctionCalling` ใน API) |
| **Vision/Images**    | โมเดลที่มีฟีเจอร์ "Vision"                              |
| **JSON mode**        | รองรับผ่าน `response_format`                            |

## ราคา

Venice ใช้ระบบคิดค่าบริการแบบเครดิต ตรวจสอบอัตราปัจจุบันได้ที่ [venice.ai/pricing](https://venice.ai/pricing):

- **โมเดล Private**: โดยทั่วไปมีต้นทุนต่ำกว่า
- **โมเดล Anonymized**: ใกล้เคียงกับราคาของ API โดยตรง + ค่าบริการเล็กน้อยของ Venice

### Venice (anonymized) เทียบกับ API โดยตรง

| ด้าน            | Venice (Anonymized)              | API โดยตรง            |
| --------------- | -------------------------------- | --------------------- |
| **ความเป็นส่วนตัว** | metadata ถูกลบออก, ไม่ระบุตัวตน   | ผูกกับบัญชีของคุณ      |
| **Latency**     | +10-50ms (ผ่าน proxy)            | ตรงไปยังปลายทาง        |
| **ฟีเจอร์**     | รองรับฟีเจอร์ส่วนใหญ่             | ฟีเจอร์ครบเต็มรูปแบบ   |
| **การคิดค่าบริการ** | เครดิตของ Venice                 | การเรียกเก็บของ provider |

## ตัวอย่างการใช้งาน

```bash
# ใช้โมเดล private ค่าปริยาย
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# ใช้ Claude Opus ผ่าน Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# ใช้โมเดลไม่ถูกเซ็นเซอร์
openclaw agent --model venice/venice-uncensored --message "Draft options"

# ใช้โมเดล vision พร้อมภาพ
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# ใช้โมเดลสำหรับโค้ด
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่รู้จัก API key">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบให้แน่ใจว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="ไม่มีโมเดลนี้ให้ใช้งาน">
    แค็ตตาล็อกโมเดลของ Venice จะอัปเดตแบบไดนามิก รัน `openclaw models list` เพื่อดูโมเดลที่พร้อมใช้งานในขณะนั้น บางโมเดลอาจออฟไลน์ชั่วคราว
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    API ของ Venice อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบให้แน่ใจว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [การแก้ปัญหา](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวอย่างไฟล์คอนฟิก">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    โฮมเพจของ Venice AI และการสมัครบัญชี
  </Card>
  <Card title="เอกสาร API" href="https://docs.venice.ai" icon="book">
    ข้อมูลอ้างอิง API และเอกสารสำหรับนักพัฒนาของ Venice
  </Card>
  <Card title="ราคา" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนปัจจุบันของ Venice
  </Card>
</CardGroup>
