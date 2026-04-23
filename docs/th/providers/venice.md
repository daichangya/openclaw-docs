---
read_when:
    - คุณต้องการการอนุมานที่เน้นความเป็นส่วนตัวใน OpenClaw
    - คุณต้องการคำแนะนำการตั้งค่า Venice AI
summary: ใช้โมเดลที่เน้นความเป็นส่วนตัวของ Venice AI ใน OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-23T05:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f8005edb1d7781316ce8b5432bf4f9375c16113594a2a588912dce82234a9e5
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI

Venice AI ให้บริการ **การอนุมาน AI ที่เน้นความเป็นส่วนตัว** พร้อมรองรับทั้งโมเดลแบบ uncensored และการเข้าถึงโมเดล proprietary ชั้นนำผ่านพร็อกซีแบบไม่ระบุตัวตนของ Venice การอนุมานทั้งหมดเป็นแบบส่วนตัวตามค่าเริ่มต้น — ไม่มีการนำข้อมูลของคุณไปฝึกต่อ ไม่มีการบันทึก log

## ทำไมจึงใช้ Venice ใน OpenClaw

- **การอนุมานแบบส่วนตัว** สำหรับโมเดลโอเพนซอร์ส (ไม่มีการบันทึก log)
- **โมเดลแบบ uncensored** เมื่อคุณต้องการ
- **การเข้าถึงแบบไม่ระบุตัวตน** ไปยังโมเดล proprietary (Opus/GPT/Gemini) เมื่อคุณภาพสำคัญ
- endpoints แบบ OpenAI-compatible `/v1`

## โหมดความเป็นส่วนตัว

Venice มีระดับความเป็นส่วนตัวสองแบบ — การเข้าใจเรื่องนี้สำคัญต่อการเลือกโมเดล:

| โหมด           | คำอธิบาย                                                                                                                             | โมเดล                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | ส่วนตัวเต็มรูปแบบ Prompts/responses จะ **ไม่ถูกเก็บหรือบันทึก log** เลย ชั่วคราวเท่านั้น                                             | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored ฯลฯ  |
| **Anonymized** | พร็อกซีผ่าน Venice โดยตัดข้อมูลเมตาออก ผู้ให้บริการต้นทาง (OpenAI, Anthropic, Google, xAI) จะเห็นคำขอแบบไม่ระบุตัวตน                | Claude, GPT, Gemini, Grok                                     |

<Warning>
โมเดลแบบ anonymized **ไม่ใช่** ความเป็นส่วนตัวเต็มรูปแบบ Venice จะตัดข้อมูลเมตาก่อนส่งต่อ แต่ผู้ให้บริการต้นทาง (OpenAI, Anthropic, Google, xAI) ยังคงประมวลผลคำขออยู่ เลือกโมเดล **Private** เมื่อจำเป็นต้องใช้ความเป็นส่วนตัวเต็มรูปแบบ
</Warning>

## คุณสมบัติ

- **เน้นความเป็นส่วนตัว**: เลือกได้ระหว่างโหมด "private" (ส่วนตัวเต็มรูปแบบ) และ "anonymized" (ผ่านพร็อกซี)
- **โมเดลแบบ uncensored**: เข้าถึงโมเดลที่ไม่มีข้อจำกัดด้านเนื้อหา
- **เข้าถึงโมเดลหลัก**: ใช้ Claude, GPT, Gemini และ Grok ผ่านพร็อกซีแบบไม่ระบุตัวตนของ Venice
- **OpenAI-compatible API**: endpoints `/v1` มาตรฐานเพื่อการผสานรวมที่ง่าย
- **Streaming**: รองรับในทุกโมเดล
- **Function calling**: รองรับในบางโมเดล (ตรวจสอบ capabilities ของโมเดล)
- **Vision**: รองรับในโมเดลที่มี vision capability
- **ไม่มี hard rate limits**: อาจมี fair-use throttling สำหรับการใช้งานหนักมาก

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
      <Tab title="Interactive (แนะนำ)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        ขั้นตอนนี้จะ:
        1. ขอ API key ของคุณ (หรือใช้ `VENICE_API_KEY` ที่มีอยู่)
        2. แสดงโมเดล Venice ที่มีให้ใช้ทั้งหมด
        3. ให้คุณเลือกโมเดลเริ่มต้น
        4. กำหนดค่าผู้ให้บริการให้อัตโนมัติ
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
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

หลังการตั้งค่า OpenClaw จะแสดงโมเดล Venice ที่มีให้ใช้ทั้งหมด ให้เลือกตามความต้องการของคุณ:

- **โมเดลเริ่มต้น**: `venice/kimi-k2-5` สำหรับ reasoning แบบ private ที่แข็งแกร่งพร้อม vision
- **ตัวเลือกความสามารถสูง**: `venice/claude-opus-4-6` สำหรับเส้นทาง Venice แบบ anonymized ที่ทรงพลังที่สุด
- **ความเป็นส่วนตัว**: เลือกโมเดล "private" สำหรับการอนุมานแบบส่วนตัวเต็มรูปแบบ
- **ความสามารถ**: เลือกโมเดล "anonymized" เพื่อเข้าถึง Claude, GPT, Gemini ผ่านพร็อกซีของ Venice

เปลี่ยนโมเดลเริ่มต้นได้ทุกเมื่อ:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

แสดงรายการโมเดลทั้งหมดที่มี:

```bash
openclaw models list | grep venice
```

คุณยังสามารถรัน `openclaw configure`, เลือก **Model/auth** แล้วเลือก **Venice AI**

<Tip>
ใช้ตารางด้านล่างเพื่อเลือกโมเดลที่เหมาะกับกรณีใช้งานของคุณ

| กรณีใช้งาน                    | โมเดลที่แนะนำ                     | เหตุผล                                         |
| ----------------------------- | --------------------------------- | ---------------------------------------------- |
| **แชตทั่วไป (ค่าเริ่มต้น)**   | `kimi-k2-5`                       | reasoning แบบ private ที่แข็งแกร่งพร้อม vision |
| **คุณภาพโดยรวมดีที่สุด**      | `claude-opus-4-6`                 | ตัวเลือก Venice แบบ anonymized ที่ดีที่สุด      |
| **ความเป็นส่วนตัว + การเขียนโค้ด** | `qwen3-coder-480b-a35b-instruct` | โมเดลเขียนโค้ดแบบ private พร้อม context ใหญ่   |
| **Private vision**            | `kimi-k2-5`                       | รองรับ vision โดยไม่ออกจากโหมด private         |
| **เร็ว + ถูก**                | `qwen3-4b`                        | โมเดล reasoning แบบ lightweight                |
| **งาน private ที่ซับซ้อน**    | `deepseek-v3.2`                   | reasoning แข็งแกร่ง แต่ไม่มี Venice tool support |
| **Uncensored**                | `venice-uncensored`               | ไม่มีข้อจำกัดด้านเนื้อหา                        |

</Tip>

## โมเดลที่มีให้ใช้ (รวม 41 รุ่น)

<AccordionGroup>
  <Accordion title="โมเดล Private (26) — private เต็มรูปแบบ ไม่มีการบันทึก log">
    | Model ID                               | ชื่อ                                 | Context | คุณสมบัติ                    |
    | -------------------------------------- | ------------------------------------ | ------- | ---------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                            | 256k    | ค่าเริ่มต้น, reasoning, vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                     | 256k    | Reasoning                    |
    | `llama-3.3-70b`                        | Llama 3.3 70B                        | 128k    | ทั่วไป                       |
    | `llama-3.2-3b`                         | Llama 3.2 3B                         | 128k    | ทั่วไป                       |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | ทั่วไป, ปิดเครื่องมือ        |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Reasoning                    |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | ทั่วไป                       |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | การเขียนโค้ด                 |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | การเขียนโค้ด                 |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Reasoning, vision            |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | ทั่วไป                       |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                       |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | เร็ว, reasoning              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Reasoning, ปิดเครื่องมือ     |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Uncensored, ปิดเครื่องมือ    |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                | 128k    | ทั่วไป                       |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | ทั่วไป                       |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Reasoning                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | ทั่วไป                       |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Reasoning                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Reasoning                    |
    | `zai-org-glm-5`                        | GLM 5                               | 198k    | Reasoning                    |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k    | Reasoning                    |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k    | Reasoning                    |
  </Accordion>

  <Accordion title="โมเดล Anonymized (15) — ผ่านพร็อกซีของ Venice">
    | Model ID                        | ชื่อ                            | Context | คุณสมบัติ                   |
    | ------------------------------- | ------------------------------- | ------- | --------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (ผ่าน Venice)   | 1M      | Reasoning, vision           |
    | `claude-opus-4-5`               | Claude Opus 4.5 (ผ่าน Venice)   | 198k    | Reasoning, vision           |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (ผ่าน Venice) | 1M      | Reasoning, vision           |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (ผ่าน Venice) | 198k    | Reasoning, vision           |
    | `openai-gpt-54`                 | GPT-5.4 (ผ่าน Venice)           | 1M      | Reasoning, vision           |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (ผ่าน Venice)     | 400k    | Reasoning, vision, coding   |
    | `openai-gpt-52`                 | GPT-5.2 (ผ่าน Venice)           | 256k    | Reasoning                   |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (ผ่าน Venice)     | 256k    | Reasoning, vision, coding   |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (ผ่าน Venice)            | 128k    | Vision                      |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (ผ่าน Venice)       | 128k    | Vision                      |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (ผ่าน Venice)    | 1M      | Reasoning, vision           |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (ผ่าน Venice)      | 198k    | Reasoning, vision           |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (ผ่าน Venice)    | 256k    | Reasoning, vision           |
    | `grok-41-fast`                  | Grok 4.1 Fast (ผ่าน Venice)     | 1M      | Reasoning, vision           |
    | `grok-code-fast-1`              | Grok Code Fast 1 (ผ่าน Venice)  | 256k    | Reasoning, coding           |
  </Accordion>
</AccordionGroup>

## การค้นหาโมเดล

OpenClaw จะค้นหาโมเดลจาก Venice API โดยอัตโนมัติเมื่อมีการตั้ง `VENICE_API_KEY` หาก API เข้าถึงไม่ได้ ระบบจะ fallback ไปยังแค็ตตาล็อกแบบ static

endpoint `/models` เป็นสาธารณะ (ไม่ต้องใช้ auth สำหรับการดูรายการ) แต่การอนุมานต้องใช้ API key ที่ถูกต้อง

## การรองรับ streaming และเครื่องมือ

| คุณสมบัติ             | การรองรับ                                                |
| --------------------- | ------------------------------------------------------- |
| **Streaming**         | ทุกโมเดล                                                |
| **Function calling**  | โมเดลส่วนใหญ่ (ตรวจ `supportsFunctionCalling` ใน API)   |
| **Vision/Images**     | โมเดลที่มีคุณสมบัติ "Vision"                            |
| **JSON mode**         | รองรับผ่าน `response_format`                            |

## ราคา

Venice ใช้ระบบแบบคิดตามเครดิต ดู [venice.ai/pricing](https://venice.ai/pricing) สำหรับอัตราปัจจุบัน:

- **โมเดล Private**: โดยทั่วไปมีต้นทุนต่ำกว่า
- **โมเดล Anonymized**: ใกล้เคียงกับการเรียก API โดยตรง + ค่าบริการ Venice เพิ่มเล็กน้อย

### Venice (anonymized) เทียบกับ direct API

| แง่มุม         | Venice (Anonymized)              | Direct API              |
| -------------- | -------------------------------- | ----------------------- |
| **ความเป็นส่วนตัว** | ตัดข้อมูลเมตาออก, ไม่ระบุตัวตน   | เชื่อมโยงกับบัญชีของคุณ   |
| **Latency**    | +10-50ms (พร็อกซี)               | โดยตรง                  |
| **ฟีเจอร์**    | รองรับฟีเจอร์ส่วนใหญ่            | ฟีเจอร์ครบถ้วน          |
| **การคิดค่าใช้จ่าย** | เครดิตของ Venice                 | การคิดค่าบริการของผู้ให้บริการ |

## ตัวอย่างการใช้งาน

```bash
# ใช้โมเดล private เริ่มต้น
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# ใช้ Claude Opus ผ่าน Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# ใช้โมเดล uncensored
openclaw agent --model venice/venice-uncensored --message "Draft options"

# ใช้โมเดล vision กับรูปภาพ
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# ใช้โมเดลสำหรับเขียนโค้ด
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="API key ไม่ถูกรู้จัก">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    ตรวจสอบว่าคีย์ขึ้นต้นด้วย `vapi_`

  </Accordion>

  <Accordion title="ไม่มีโมเดลให้ใช้">
    แค็ตตาล็อกโมเดลของ Venice อัปเดตแบบไดนามิก ให้รัน `openclaw models list` เพื่อดูโมเดลที่พร้อมใช้งานในปัจจุบัน บางโมเดลอาจออฟไลน์ชั่วคราว
  </Accordion>

  <Accordion title="ปัญหาการเชื่อมต่อ">
    Venice API อยู่ที่ `https://api.venice.ai/api/v1` ตรวจสอบว่าเครือข่ายของคุณอนุญาตการเชื่อมต่อ HTTPS
  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [Troubleshooting](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="ตัวอย่างไฟล์ config">
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
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ, model refs และพฤติกรรม failover
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    หน้าแรก Venice AI และการสมัครบัญชี
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    เอกสารอ้างอิง Venice API และเอกสารสำหรับนักพัฒนา
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    อัตราเครดิตและแผนปัจจุบันของ Venice
  </Card>
</CardGroup>
