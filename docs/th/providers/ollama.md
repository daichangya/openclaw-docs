---
read_when:
    - คุณต้องการรัน OpenClaw ด้วยโมเดลคลาวด์หรือในเครื่องผ่าน Ollama
    - คุณต้องการคำแนะนำในการตั้งค่าและกำหนดค่า Ollama
    - คุณต้องการใช้โมเดล vision ของ Ollama สำหรับการทำความเข้าใจรูปภาพ
summary: รัน OpenClaw ด้วย Ollama (โมเดลคลาวด์และในเครื่อง)
title: Ollama
x-i18n:
    generated_at: "2026-04-23T05:52:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw เชื่อมต่อกับ native API ของ Ollama (`/api/chat`) สำหรับทั้งโมเดลคลาวด์ที่โฮสต์ไว้และเซิร์ฟเวอร์ Ollama แบบ local/self-hosted คุณสามารถใช้ Ollama ได้สามโหมด: `Cloud + Local` ผ่านโฮสต์ Ollama ที่เข้าถึงได้, `Cloud only` กับ `https://ollama.com` หรือ `Local only` กับโฮสต์ Ollama ที่เข้าถึงได้

<Warning>
**ผู้ใช้ Ollama ระยะไกล**: อย่าใช้ URL แบบ OpenAI-compatible `/v1` (`http://host:11434/v1`) กับ OpenClaw เพราะจะทำให้การเรียกใช้เครื่องมือเสีย และโมเดลอาจส่ง JSON ของเครื่องมือดิบออกมาเป็นข้อความธรรมดา ให้ใช้ URL ของ native Ollama API แทน: `baseUrl: "http://host:11434"` (ไม่มี `/v1`)
</Warning>

## เริ่มต้นใช้งาน

เลือกวิธีและโหมดการตั้งค่าที่คุณต้องการ

<Tabs>
  <Tab title="Onboarding (แนะนำ)">
    **เหมาะที่สุดสำหรับ:** เส้นทางที่เร็วที่สุดเพื่อให้ได้การตั้งค่า Ollama แบบคลาวด์หรือ local ที่ใช้งานได้

    <Steps>
      <Step title="รัน onboarding">
        ```bash
        openclaw onboard
        ```

        เลือก **Ollama** จากรายการผู้ให้บริการ
      </Step>
      <Step title="เลือกโหมดของคุณ">
        - **Cloud + Local** — โฮสต์ Ollama ในเครื่อง พร้อมโมเดลคลาวด์ที่ route ผ่านโฮสต์นั้น
        - **Cloud only** — โมเดล Ollama แบบโฮสต์ผ่าน `https://ollama.com`
        - **Local only** — ใช้เฉพาะโมเดลในเครื่อง
      </Step>
      <Step title="เลือกโมเดล">
        `Cloud only` จะถามหา `OLLAMA_API_KEY` และแนะนำค่าเริ่มต้นของโมเดลคลาวด์ที่โฮสต์ไว้ ส่วน `Cloud + Local` และ `Local only` จะถามหา Ollama base URL, ค้นหาโมเดลที่มีอยู่ และ auto-pull โมเดล local ที่เลือกหากยังไม่มีอยู่ `Cloud + Local` จะตรวจด้วยว่าโฮสต์ Ollama นั้นลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์แล้วหรือยัง
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### โหมด non-interactive

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    จะระบุ custom base URL หรือโมเดลเพิ่มเติมก็ได้:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="การตั้งค่าแบบกำหนดเอง">
    **เหมาะที่สุดสำหรับ:** การควบคุมการตั้งค่าแบบเต็มสำหรับคลาวด์หรือ local

    <Steps>
      <Step title="เลือกคลาวด์หรือ local">
        - **Cloud + Local**: ติดตั้ง Ollama, ลงชื่อเข้าใช้ด้วย `ollama signin` และ route คำขอคลาวด์ผ่านโฮสต์นั้น
        - **Cloud only**: ใช้ `https://ollama.com` พร้อม `OLLAMA_API_KEY`
        - **Local only**: ติดตั้ง Ollama จาก [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="ดึงโมเดล local (เฉพาะ local only)">
        ```bash
        ollama pull gemma4
        # หรือ
        ollama pull gpt-oss:20b
        # หรือ
        ollama pull llama3.3
        ```
      </Step>
      <Step title="เปิดใช้ Ollama สำหรับ OpenClaw">
        สำหรับ `Cloud only` ให้ใช้ `OLLAMA_API_KEY` จริงของคุณ สำหรับการตั้งค่าที่อิงโฮสต์ ค่าหลอกใดๆ ก็ใช้ได้:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # หรือกำหนดค่าในไฟล์ config
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบและตั้งค่าโมเดลของคุณ">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        หรือกำหนดโมเดลเริ่มต้นใน config:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## โมเดลคลาวด์

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` ใช้โฮสต์ Ollama ที่เข้าถึงได้เป็นจุดควบคุมสำหรับทั้งโมเดล local และคลาวด์ นี่คือโฟลว์แบบไฮบริดที่ Ollama แนะนำ

    ใช้ **Cloud + Local** ระหว่างการตั้งค่า OpenClaw จะถามหา Ollama base URL, ค้นหาโมเดล local จากโฮสต์นั้น และตรวจสอบว่าโฮสต์ลงชื่อเข้าใช้สำหรับการเข้าถึงคลาวด์ด้วย `ollama signin` แล้วหรือยัง เมื่อโฮสต์ลงชื่อเข้าใช้แล้ว OpenClaw จะยังแนะนำค่าเริ่มต้นของโมเดลคลาวด์ที่โฮสต์ไว้ เช่น `kimi-k2.5:cloud`, `minimax-m2.7:cloud` และ `glm-5.1:cloud`

    หากโฮสต์ยังไม่ได้ลงชื่อเข้าใช้ OpenClaw จะคงการตั้งค่าไว้เป็น local-only จนกว่าคุณจะรัน `ollama signin`

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` รันกับ API แบบโฮสต์ของ Ollama ที่ `https://ollama.com`

    ใช้ **Cloud only** ระหว่างการตั้งค่า OpenClaw จะถามหา `OLLAMA_API_KEY`, ตั้ง `baseUrl: "https://ollama.com"` และเติมรายการโมเดลคลาวด์แบบโฮสต์ไว้ เส้นทางนี้ **ไม่** ต้องใช้เซิร์ฟเวอร์ Ollama ในเครื่องหรือ `ollama signin`

    รายการโมเดลคลาวด์ที่แสดงระหว่าง `openclaw onboard` จะถูกเติมแบบสดจาก `https://ollama.com/api/tags` จำกัดไว้ที่ 500 รายการ ดังนั้นตัวเลือกจะสะท้อนแค็ตตาล็อกที่โฮสต์อยู่จริงในปัจจุบันแทนที่จะเป็นรายการแบบ static หาก `ollama.com` เข้าถึงไม่ได้หรือไม่ส่งคืนโมเดลในช่วงตั้งค่า OpenClaw จะ fallback ไปใช้คำแนะนำแบบ hardcoded เดิมเพื่อให้ onboarding เสร็จสมบูรณ์ได้

  </Tab>

  <Tab title="Local only">
    ในโหมด local-only OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama ที่กำหนดค่าไว้ เส้นทางนี้มีไว้สำหรับเซิร์ฟเวอร์ Ollama แบบ local หรือ self-hosted

    ปัจจุบัน OpenClaw แนะนำ `gemma4` เป็นค่าเริ่มต้นแบบ local

  </Tab>
</Tabs>

## การค้นหาโมเดล (implicit provider)

เมื่อคุณตั้ง `OLLAMA_API_KEY` (หรือ auth profile) และ **ไม่ได้** กำหนด `models.providers.ollama` OpenClaw จะค้นหาโมเดลจากอินสแตนซ์ Ollama ในเครื่องที่ `http://127.0.0.1:11434`

| พฤติกรรม             | รายละเอียด                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การ query แค็ตตาล็อก | query ไปที่ `/api/tags`                                                                                                                                                |
| การตรวจจับ capability | ใช้การค้นหาแบบ best-effort ผ่าน `/api/show` เพื่ออ่าน `contextWindow` และตรวจจับ capabilities (รวมถึง vision)                                                       |
| Vision models        | โมเดลที่มี capability `vision` ที่รายงานโดย `/api/show` จะถูกทำเครื่องหมายว่า image-capable (`input: ["text", "image"]`) ดังนั้น OpenClaw จะ auto-inject รูปภาพเข้า prompt |
| การตรวจจับ reasoning  | ทำเครื่องหมาย `reasoning` ด้วย heuristic ตามชื่อโมเดล (`r1`, `reasoning`, `think`)                                                                                   |
| Token limits         | ตั้ง `maxTokens` เป็นค่าเพดาน max-token เริ่มต้นของ Ollama ที่ OpenClaw ใช้                                                                                           |
| Costs                | ตั้งค่า costs ทั้งหมดเป็น `0`                                                                                                                                          |

วิธีนี้ช่วยหลีกเลี่ยงการกำหนด entries ของโมเดลด้วยตนเอง ขณะเดียวกันก็ทำให้แค็ตตาล็อกสอดคล้องกับอินสแตนซ์ Ollama ในเครื่อง

```bash
# ดูว่ามีโมเดลอะไรบ้าง
ollama list
openclaw models list
```

หากต้องการเพิ่มโมเดลใหม่ เพียงดึงมันด้วย Ollama:

```bash
ollama pull mistral
```

โมเดลใหม่นี้จะถูกค้นหาอัตโนมัติและพร้อมใช้งาน

<Note>
หากคุณตั้ง `models.providers.ollama` แบบ explicit ระบบจะข้าม auto-discovery และคุณต้องกำหนดโมเดลด้วยตนเอง ดูส่วน explicit config ด้านล่าง
</Note>

## Vision และการบรรยายรูปภาพ

bundled Ollama plugin จะลงทะเบียน Ollama เป็น image-capable media-understanding provider วิธีนี้ทำให้ OpenClaw สามารถ route คำขอ image-description แบบ explicit และค่าเริ่มต้นของ image-model ที่กำหนดไว้ผ่านโมเดล vision ของ Ollama ทั้งแบบ local และแบบ hosted

สำหรับ vision แบบ local ให้ดึงโมเดลที่รองรับรูปภาพ:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

จากนั้นตรวจสอบด้วย infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` ต้องเป็น ref แบบเต็ม `<provider/model>` เมื่อมีการตั้งค่าไว้ `openclaw infer image describe` จะรันโมเดลนั้นโดยตรง แทนที่จะข้ามการบรรยายเพราะโมเดลรองรับ vision แบบเนทีฟ

หากต้องการให้ Ollama เป็น image-understanding model เริ่มต้นสำหรับสื่อขาเข้า ให้กำหนดค่า `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

หากคุณกำหนด `models.providers.ollama.models` ด้วยตนเอง ให้ทำเครื่องหมาย vision models ว่ารองรับอินพุตรูปภาพ:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw จะปฏิเสธคำขอ image-description สำหรับโมเดลที่ไม่ได้ถูกทำเครื่องหมายว่ารองรับรูปภาพ เมื่อใช้ implicit discovery OpenClaw จะอ่านข้อมูลนี้จาก Ollama เมื่อ `/api/show` รายงาน capability แบบ vision

## การกำหนดค่า

<Tabs>
  <Tab title="พื้นฐาน (implicit discovery)">
    เส้นทางเปิดใช้แบบ local-only ที่ง่ายที่สุดคือผ่าน environment variable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    หากตั้ง `OLLAMA_API_KEY` ไว้ คุณสามารถละ `apiKey` ใน provider entry ได้ และ OpenClaw จะเติมให้เองสำหรับการตรวจสอบ availability
    </Tip>

  </Tab>

  <Tab title="Explicit (กำหนดโมเดลด้วยตนเอง)">
    ใช้ explicit config เมื่อต้องการตั้งค่าแบบ hosted cloud, เมื่อ Ollama รันบนโฮสต์/พอร์ตอื่น, เมื่อต้องการบังคับ context windows หรือรายการโมเดลแบบเฉพาะ หรือเมื่อต้องการนิยามโมเดลแบบ manual ทั้งหมด

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    หาก Ollama รันบนโฮสต์หรือพอร์ตอื่น (explicit config จะปิด auto-discovery ดังนั้นต้องกำหนดโมเดลด้วยตนเอง):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // ไม่มี /v1 - ใช้ native Ollama API URL
            api: "ollama", // ตั้งอย่างชัดเจนเพื่อรับประกันพฤติกรรม native tool-calling
          },
        },
      },
    }
    ```

    <Warning>
    อย่าเติม `/v1` ต่อท้าย URL พาธ `/v1` ใช้โหมด OpenAI-compatible ซึ่งการเรียกใช้เครื่องมือไม่เสถียร ให้ใช้ base Ollama URL โดยไม่มี path suffix
    </Warning>

  </Tab>
</Tabs>

### การเลือกโมเดล

เมื่อกำหนดค่าแล้ว โมเดล Ollama ทั้งหมดของคุณจะพร้อมใช้งาน:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw รองรับ **Ollama Web Search** เป็นผู้ให้บริการ `web_search` แบบ bundled

| คุณสมบัติ    | รายละเอียด                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| โฮสต์        | ใช้โฮสต์ Ollama ที่กำหนดค่าไว้ (`models.providers.ollama.baseUrl` เมื่อมีการตั้งค่า มิฉะนั้นจะใช้ `http://127.0.0.1:11434`) |
| Auth         | ไม่ต้องใช้คีย์                                                                                                           |
| ข้อกำหนด     | Ollama ต้องกำลังทำงานและลงชื่อเข้าใช้แล้วด้วย `ollama signin`                                                           |

เลือก **Ollama Web Search** ระหว่าง `openclaw onboard` หรือ `openclaw configure --section web` หรือกำหนดค่า:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
สำหรับรายละเอียดการตั้งค่าและพฤติกรรมทั้งหมด ดู [Ollama Web Search](/th/tools/ollama-search)
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="โหมด OpenAI-compatible แบบเดิม">
    <Warning>
    **การเรียกใช้เครื่องมือไม่เสถียรในโหมด OpenAI-compatible** ให้ใช้โหมดนี้เฉพาะเมื่อคุณต้องใช้รูปแบบ OpenAI สำหรับพร็อกซี และไม่พึ่งพาพฤติกรรมการเรียกใช้เครื่องมือแบบเนทีฟ
    </Warning>

    หากคุณจำเป็นต้องใช้ endpoint แบบ OpenAI-compatible แทน (เช่น อยู่หลังพร็อกซีที่รองรับเฉพาะรูปแบบ OpenAI) ให้ตั้ง `api: "openai-completions"` อย่างชัดเจน:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    โหมดนี้อาจไม่รองรับทั้ง streaming และ tool calling พร้อมกัน คุณอาจต้องปิด streaming ด้วย `params: { streaming: false }` ใน model config

    เมื่อใช้ `api: "openai-completions"` กับ Ollama OpenClaw จะ inject `options.num_ctx` ตามค่าเริ่มต้น เพื่อไม่ให้ Ollama fallback แบบเงียบๆ ไปใช้ context window ขนาด 4096 หากพร็อกซี/upstream ของคุณปฏิเสธฟิลด์ `options` ที่ไม่รู้จัก ให้ปิดพฤติกรรมนี้:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context windows">
    สำหรับโมเดลที่ค้นพบอัตโนมัติ OpenClaw จะใช้ context window ที่ Ollama รายงานเมื่อมีข้อมูล มิฉะนั้นจะ fallback ไปยัง context window ค่าเริ่มต้นของ Ollama ที่ OpenClaw ใช้

    คุณสามารถ override `contextWindow` และ `maxTokens` ได้ใน explicit provider config:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw จะถือว่าโมเดลที่มีชื่อเช่น `deepseek-r1`, `reasoning` หรือ `think` รองรับ reasoning โดยค่าเริ่มต้น

    ```bash
    ollama pull deepseek-r1:32b
    ```

    ไม่ต้องมีการกำหนดค่าเพิ่มเติม -- OpenClaw จะทำเครื่องหมายให้อัตโนมัติ

  </Accordion>

  <Accordion title="ค่าใช้จ่ายของโมเดล">
    Ollama ใช้งานฟรีและรันในเครื่อง ดังนั้นค่าใช้จ่ายของโมเดลทั้งหมดจะถูกตั้งเป็น $0 ซึ่งใช้กับทั้งโมเดลที่ค้นพบอัตโนมัติและโมเดลที่กำหนดด้วยตนเอง
  </Accordion>

  <Accordion title="Memory embeddings">
    bundled Ollama plugin จะลงทะเบียน memory embedding provider สำหรับ
    [memory search](/th/concepts/memory) โดยใช้ base URL
    และ API key ของ Ollama ที่กำหนดค่าไว้

    | คุณสมบัติ     | ค่า                  |
    | ------------- | -------------------- |
    | โมเดลเริ่มต้น | `nomic-embed-text`   |
    | Auto-pull     | ใช่ — embedding model จะถูกดึงอัตโนมัติหากยังไม่มีในเครื่อง |

    หากต้องการเลือก Ollama เป็น embedding provider สำหรับ memory search:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="การกำหนดค่า streaming">
    การเชื่อมต่อ Ollama ของ OpenClaw ใช้ **native Ollama API** (`/api/chat`) เป็นค่าเริ่มต้น ซึ่งรองรับทั้ง streaming และ tool calling พร้อมกันอย่างสมบูรณ์ ไม่ต้องตั้งค่าเพิ่มเติมเป็นพิเศษ

    สำหรับคำขอ `/api/chat` แบบเนทีฟ OpenClaw ยังส่งต่อการควบคุม thinking ไปยัง Ollama โดยตรงด้วย: `/think off` และ `openclaw agent --thinking off` จะส่ง `think: false` ระดับบนสุด ส่วนระดับ thinking ที่ไม่ใช่ `off` จะส่ง `think: true`

    <Tip>
    หากคุณจำเป็นต้องใช้ endpoint แบบ OpenAI-compatible ให้ดูส่วน "โหมด OpenAI-compatible แบบเดิม" ด้านบน ในโหมดนั้น streaming และ tool calling อาจไม่ทำงานพร้อมกัน
    </Tip>

  </Accordion>
</AccordionGroup>

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ Ollama">
    ตรวจสอบว่า Ollama กำลังทำงานอยู่ และคุณได้ตั้ง `OLLAMA_API_KEY` (หรือ auth profile) แล้ว และคุณ **ไม่ได้** กำหนด entry `models.providers.ollama` แบบ explicit ไว้:

    ```bash
    ollama serve
    ```

    ตรวจสอบว่า API เข้าถึงได้:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="ไม่มีโมเดลให้ใช้">
    หากไม่มีโมเดลของคุณอยู่ในรายการ ให้ดึงโมเดลนั้นในเครื่อง หรือกำหนดมันอย่างชัดเจนใน `models.providers.ollama`

    ```bash
    ollama list  # ดูว่าติดตั้งอะไรไว้บ้าง
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # หรือโมเดลอื่น
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ตรวจสอบว่า Ollama กำลังทำงานอยู่บนพอร์ตที่ถูกต้อง:

    ```bash
    # ตรวจสอบว่า Ollama กำลังทำงานอยู่หรือไม่
    ps aux | grep ollama

    # หรือรีสตาร์ต Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
ความช่วยเหลือเพิ่มเติม: [Troubleshooting](/th/help/troubleshooting) และ [FAQ](/th/help/faq)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="Model selection" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="Ollama Web Search" href="/th/tools/ollama-search" icon="magnifying-glass">
    รายละเอียดการตั้งค่าและพฤติกรรมทั้งหมดสำหรับการค้นหาเว็บด้วย Ollama
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config แบบเต็ม
  </Card>
</CardGroup>
