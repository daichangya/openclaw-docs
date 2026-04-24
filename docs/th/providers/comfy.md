---
read_when:
    - คุณต้องการใช้ workflow ของ ComfyUI ในเครื่องร่วมกับ OpenClaw
    - คุณต้องการใช้ Comfy Cloud กับ workflow สำหรับภาพ วิดีโอ หรือเพลง
    - คุณต้องการคีย์คอนฟิกของ bundled comfy Plugin
summary: การตั้งค่า ComfyUI workflow สำหรับการสร้างภาพ วิดีโอ และเพลงใน OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T09:27:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8b39c49df3ad23018372b481681ce89deac3271da5dbdf94580712ace7fef7f
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw มาพร้อม Plugin `comfy` แบบ bundled สำหรับรัน ComfyUI แบบขับเคลื่อนด้วย workflow ตัว Plugin ทำงานขับเคลื่อนด้วย workflow ทั้งหมด ดังนั้น OpenClaw จะไม่พยายามแมป `size`, `aspectRatio`, `resolution`, `durationSeconds` หรือการควบคุมสไตล์ TTS แบบทั่วไป ลงไปในกราฟของคุณ

| คุณสมบัติ        | รายละเอียด                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| Provider         | `comfy`                                                                             |
| โมเดล            | `comfy/workflow`                                                                    |
| พื้นผิวที่ใช้ร่วมกัน | `image_generate`, `video_generate`, `music_generate`                                |
| Auth             | ไม่มีสำหรับ ComfyUI ในเครื่อง; ใช้ `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view` และ Comfy Cloud `/api/*`                  |

## สิ่งที่รองรับ

- การสร้างภาพจาก workflow JSON
- การแก้ไขภาพด้วยภาพอ้างอิงที่อัปโหลด 1 ภาพ
- การสร้างวิดีโอจาก workflow JSON
- การสร้างวิดีโอด้วยภาพอ้างอิงที่อัปโหลด 1 ภาพ
- การสร้างเพลงหรือเสียงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน
- การดาวน์โหลดผลลัพธ์จาก node ที่กำหนดไว้ หรือจากทุก output node ที่ตรงกัน

## เริ่มต้นใช้งาน

เลือกว่าจะรัน ComfyUI บนเครื่องของคุณเองหรือใช้ Comfy Cloud

<Tabs>
  <Tab title="ในเครื่อง">
    **เหมาะสำหรับ:** รันอินสแตนซ์ ComfyUI ของคุณเองบนเครื่องหรือใน LAN

    <Steps>
      <Step title="เริ่ม ComfyUI ในเครื่อง">
        ตรวจสอบให้แน่ใจว่าอินสแตนซ์ ComfyUI ในเครื่องของคุณกำลังทำงานอยู่ (ค่าปริยายคือ `http://127.0.0.1:8188`)
      </Step>
      <Step title="เตรียม workflow JSON ของคุณ">
        export หรือสร้างไฟล์ workflow JSON ของ ComfyUI จด node ID สำหรับ node อินพุตของพรอมป์ และ output node ที่คุณต้องการให้ OpenClaw อ่านผลลัพธ์จากมัน
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้งค่า `mode: "local"` และชี้ไปยังไฟล์ workflow ของคุณ นี่คือตัวอย่างขั้นต่ำสำหรับภาพ:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ชี้ OpenClaw ไปยังโมเดล `comfy/workflow` สำหรับ capability ที่คุณกำหนดค่าไว้:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบ">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **เหมาะสำหรับ:** รัน workflow บน Comfy Cloud โดยไม่ต้องจัดการทรัพยากร GPU ในเครื่อง

    <Steps>
      <Step title="รับ API key">
        สมัครที่ [comfy.org](https://comfy.org) และสร้าง API key จากแดชบอร์ดบัญชีของคุณ
      </Step>
      <Step title="ตั้งค่า API key">
        ส่งคีย์ของคุณด้วยวิธีใดวิธีหนึ่งต่อไปนี้:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="เตรียม workflow JSON ของคุณ">
        export หรือสร้างไฟล์ workflow JSON ของ ComfyUI จด node ID สำหรับ node อินพุตของพรอมป์ และ output node
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้งค่า `mode: "cloud"` และชี้ไปยังไฟล์ workflow ของคุณ:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        โหมด cloud จะใช้ `baseUrl` เป็น `https://cloud.comfy.org` โดยค่าปริยาย คุณต้องตั้ง `baseUrl` เองก็ต่อเมื่อใช้ custom cloud endpoint
        </Tip>
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="ตรวจสอบ">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## การกำหนดค่า

Comfy รองรับการตั้งค่าการเชื่อมต่อระดับบนสุดแบบใช้ร่วมกัน และส่วน workflow แยกตาม capability (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### คีย์ที่ใช้ร่วมกัน

| คีย์                  | ประเภท                 | คำอธิบาย                                                                                  |
| --------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `mode`                | `"local"` or `"cloud"` | โหมดการเชื่อมต่อ                                                                          |
| `baseUrl`             | string                 | ค่าปริยายเป็น `http://127.0.0.1:8188` สำหรับ local หรือ `https://cloud.comfy.org` สำหรับ cloud |
| `apiKey`              | string                 | คีย์แบบ inline ที่ไม่บังคับ ใช้แทน env var `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` ได้   |
| `allowPrivateNetwork` | boolean                | อนุญาต `baseUrl` แบบ private/LAN ในโหมด cloud                                             |

### คีย์แยกตาม capability

คีย์เหล่านี้ใช้ภายในส่วน `image`, `video` หรือ `music`:

| คีย์                         | จำเป็น | ค่าปริยาย | คำอธิบาย                                                                  |
| ---------------------------- | ------ | --------- | ------------------------------------------------------------------------- |
| `workflow` or `workflowPath` | ใช่    | --        | พาธไปยังไฟล์ workflow JSON ของ ComfyUI                                    |
| `promptNodeId`               | ใช่    | --        | Node ID ที่รับข้อความพรอมป์                                               |
| `promptInputName`            | ไม่    | `"text"`  | ชื่ออินพุตบน prompt node                                                 |
| `outputNodeId`               | ไม่    | --        | Node ID ที่จะอ่านผลลัพธ์ หากไม่ระบุจะใช้ทุก output node ที่ตรงกัน          |
| `pollIntervalMs`             | ไม่    | --        | ช่วงเวลา polling เป็นมิลลิวินาทีสำหรับการรอให้งานเสร็จ                    |
| `timeoutMs`                  | ไม่    | --        | timeout เป็นมิลลิวินาทีสำหรับการรัน workflow                              |

ส่วน `image` และ `video` ยังรองรับ:

| คีย์                   | จำเป็น                                  | ค่าปริยาย | คำอธิบาย                                        |
| --------------------- | --------------------------------------- | --------- | ----------------------------------------------- |
| `inputImageNodeId`    | ใช่ (เมื่อส่งภาพอ้างอิงเข้าไป)         | --        | Node ID ที่รับภาพอ้างอิงที่อัปโหลด              |
| `inputImageInputName` | ไม่                                      | `"image"` | ชื่ออินพุตบน image node                         |

## รายละเอียดของ workflow

<AccordionGroup>
  <Accordion title="workflow สำหรับภาพ">
    ตั้งค่าโมเดลภาพเริ่มต้นเป็น `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **ตัวอย่างการแก้ไขด้วยภาพอ้างอิง:**

    หากต้องการเปิดใช้การแก้ไขภาพด้วยภาพอ้างอิงที่อัปโหลด ให้เพิ่ม `inputImageNodeId` ลงในคอนฟิกภาพของคุณ:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="workflow สำหรับวิดีโอ">
    ตั้งค่าโมเดลวิดีโอเริ่มต้นเป็น `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    workflow วิดีโอของ Comfy รองรับทั้ง text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้

    <Note>
    OpenClaw จะไม่ส่งวิดีโออินพุตเข้าไปใน Comfy workflow รองรับเฉพาะข้อความพรอมป์และภาพอ้างอิงหนึ่งภาพเป็นอินพุตเท่านั้น
    </Note>

  </Accordion>

  <Accordion title="workflow สำหรับเพลง">
    Plugin แบบ bundled นี้ลงทะเบียน provider สำหรับการสร้างเพลง ซึ่งรองรับเอาต์พุตเสียงหรือเพลงที่นิยามโดย workflow และเปิดให้ใช้ผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    ใช้ส่วนคอนฟิก `music` เพื่อชี้ไปยัง workflow JSON สำหรับเสียงและ output node ของคุณ

  </Accordion>

  <Accordion title="ความเข้ากันได้ย้อนหลัง">
    คอนฟิกภาพแบบ top-level เดิม (โดยไม่มีส่วน `image` แบบ nested) ยังใช้งานได้:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw จะถือว่าโครงสร้างแบบ legacy นี้คือคอนฟิก workflow สำหรับภาพ คุณยังไม่จำเป็นต้อง migrate ทันที แต่แนะนำให้ใช้ส่วน `image` / `video` / `music` แบบ nested สำหรับการตั้งค่าใหม่

    <Tip>
    หากคุณใช้เฉพาะการสร้างภาพ คอนฟิกแบบแบน legacy และส่วน `image` แบบ nested ใหม่จะให้ผลการทำงานเทียบเท่ากัน
    </Tip>

  </Accordion>

  <Accordion title="การทดสอบแบบ live">
    มี live coverage แบบ opt-in สำหรับ Plugin แบบ bundled:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    การทดสอบแบบ live จะข้ามกรณีของภาพ วิดีโอ หรือเพลงแต่ละรายการ เว้นแต่จะมีการกำหนดค่าส่วน workflow ของ Comfy ที่ตรงกันไว้

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การสร้างภาพ" href="/th/tools/image-generation" icon="image">
    การกำหนดค่าและการใช้งานเครื่องมือสร้างภาพ
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    การกำหนดค่าและการใช้งานเครื่องมือสร้างวิดีโอ
  </Card>
  <Card title="การสร้างเพลง" href="/th/tools/music-generation" icon="music">
    การตั้งค่าเครื่องมือสำหรับการสร้างเพลงและเสียง
  </Card>
  <Card title="สารบบ Provider" href="/th/providers/index" icon="layers">
    ภาพรวมของ provider และ model ref ทั้งหมด
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/config-agents#agent-defaults" icon="gear">
    ข้อมูลอ้างอิงคอนฟิกแบบเต็ม รวมถึงค่าเริ่มต้นของเอเจนต์
  </Card>
</CardGroup>
