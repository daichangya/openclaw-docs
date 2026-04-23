---
read_when:
    - คุณต้องการใช้เวิร์กโฟลว์ ComfyUI ภายในเครื่องกับ OpenClaw
    - คุณต้องการใช้ Comfy Cloud กับเวิร์กโฟลว์ภาพ วิดีโอ หรือเพลง
    - คุณต้องการคีย์คอนฟิกของ Plugin comfy ที่มาพร้อมในชุด
summary: การตั้งค่าเวิร์กโฟลว์ ComfyUI สำหรับการสร้างภาพ วิดีโอ และเพลงใน OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-23T05:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85db395b171f37f80b34b22f3e7707bffc1fd9138e7d10687eef13eaaa55cf24
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw มาพร้อม Plugin `comfy` ที่รวมอยู่ในชุด สำหรับการรัน ComfyUI แบบขับเคลื่อนด้วยเวิร์กโฟลว์ ตัว Plugin ขับเคลื่อนด้วยเวิร์กโฟลว์ทั้งหมด ดังนั้น OpenClaw จะไม่พยายามแมปตัวควบคุมทั่วไปอย่าง `size`, `aspectRatio`, `resolution`, `durationSeconds` หรือการควบคุมสไตล์ TTS ลงบนกราฟของคุณ

| คุณสมบัติ       | รายละเอียด                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Provider        | `comfy`                                                                           |
| Models          | `comfy/workflow`                                                                  |
| พื้นผิวที่ใช้ร่วมกัน | `image_generate`, `video_generate`, `music_generate`                              |
| Auth            | ไม่ต้องใช้สำหรับ ComfyUI ภายในเครื่อง; ใช้ `COMFY_API_KEY` หรือ `COMFY_CLOUD_API_KEY` สำหรับ Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` และ Comfy Cloud `/api/*`                 |

## สิ่งที่รองรับ

- การสร้างภาพจาก workflow JSON
- การแก้ไขภาพด้วยภาพอ้างอิงที่อัปโหลด 1 ภาพ
- การสร้างวิดีโอจาก workflow JSON
- การสร้างวิดีโอด้วยภาพอ้างอิงที่อัปโหลด 1 ภาพ
- การสร้างเพลงหรือเสียงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน
- การดาวน์โหลดผลลัพธ์จาก node ที่กำหนดไว้ หรือจาก output node ที่ตรงกันทั้งหมด

## เริ่มต้นใช้งาน

เลือกระหว่างการรัน ComfyUI บนเครื่องของคุณเองหรือใช้ Comfy Cloud

<Tabs>
  <Tab title="Local">
    **เหมาะที่สุดสำหรับ:** การรัน ComfyUI ของคุณเองบนเครื่องหรือใน LAN

    <Steps>
      <Step title="เริ่ม ComfyUI ภายในเครื่อง">
        ตรวจสอบให้แน่ใจว่าอินสแตนซ์ ComfyUI ภายในเครื่องของคุณกำลังทำงานอยู่ (ค่าเริ่มต้นคือ `http://127.0.0.1:8188`)
      </Step>
      <Step title="เตรียม workflow JSON ของคุณ">
        export หรือสร้างไฟล์ workflow JSON ของ ComfyUI จด node ID สำหรับ prompt input node และ output node ที่คุณต้องการให้ OpenClaw อ่านผลลัพธ์จากมัน
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้ง `mode: "local"` และชี้ไปยังไฟล์ workflow ของคุณ นี่คือตัวอย่างภาพขั้นต่ำ:

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
      <Step title="ตั้งโมเดลเริ่มต้น">
        ชี้ OpenClaw ไปที่โมเดล `comfy/workflow` สำหรับความสามารถที่คุณกำหนดค่าไว้:

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
    **เหมาะที่สุดสำหรับ:** การรันเวิร์กโฟลว์บน Comfy Cloud โดยไม่ต้องดูแลทรัพยากร GPU ภายในเครื่อง

    <Steps>
      <Step title="รับ API key">
        สมัครที่ [comfy.org](https://comfy.org) และสร้าง API key จาก dashboard บัญชีของคุณ
      </Step>
      <Step title="ตั้งค่า API key">
        จัดเตรียมคีย์ของคุณผ่านวิธีใดวิธีหนึ่งต่อไปนี้:

        ```bash
        # Environment variable (แนะนำ)
        export COMFY_API_KEY="your-key"

        # Environment variable ทางเลือก
        export COMFY_CLOUD_API_KEY="your-key"

        # หรือใส่ไว้ตรง ๆ ใน config
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="เตรียม workflow JSON ของคุณ">
        export หรือสร้างไฟล์ workflow JSON ของ ComfyUI จด node ID สำหรับ prompt input node และ output node
      </Step>
      <Step title="กำหนดค่า provider">
        ตั้ง `mode: "cloud"` และชี้ไปยังไฟล์ workflow ของคุณ:

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
        ในโหมด cloud ค่าเริ่มต้นของ `baseUrl` คือ `https://cloud.comfy.org` คุณจำเป็นต้องตั้ง `baseUrl` เฉพาะเมื่อใช้ cloud endpoint แบบกำหนดเอง
        </Tip>
      </Step>
      <Step title="ตั้งโมเดลเริ่มต้น">
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

Comfy รองรับการตั้งค่าการเชื่อมต่อระดับบนสุดแบบใช้ร่วมกัน พร้อมกับส่วนเวิร์กโฟลว์ต่อความสามารถ (`image`, `video`, `music`):

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

| คีย์                  | ชนิด                  | คำอธิบาย                                                                             |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` or `"cloud"` | โหมดการเชื่อมต่อ                                                                      |
| `baseUrl`             | string                | ค่าเริ่มต้นคือ `http://127.0.0.1:8188` สำหรับ local หรือ `https://cloud.comfy.org` สำหรับ cloud |
| `apiKey`              | string                | คีย์แบบ inline ที่เป็นตัวเลือก แทน `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` env var ได้ |
| `allowPrivateNetwork` | boolean               | อนุญาต `baseUrl` แบบ private/LAN ในโหมด cloud                                        |

### คีย์ต่อความสามารถ

คีย์เหล่านี้ใช้ภายในส่วน `image`, `video` หรือ `music`:

| คีย์                         | จำเป็น | ค่าเริ่มต้น | คำอธิบาย                                                                  |
| --------------------------- | ------ | ----------- | ------------------------------------------------------------------------- |
| `workflow` หรือ `workflowPath` | ใช่    | --          | พาธไปยังไฟล์ workflow JSON ของ ComfyUI                                    |
| `promptNodeId`              | ใช่    | --          | Node ID ที่รับ text prompt                                                |
| `promptInputName`           | ไม่    | `"text"`    | ชื่อ input บน prompt node                                                 |
| `outputNodeId`              | ไม่    | --          | Node ID ที่ใช้อ่านผลลัพธ์ หากไม่ระบุ จะใช้ output node ที่ตรงกันทั้งหมด    |
| `pollIntervalMs`            | ไม่    | --          | ช่วงเวลา polling เป็นมิลลิวินาทีสำหรับการรอให้งานเสร็จ                    |
| `timeoutMs`                 | ไม่    | --          | timeout เป็นมิลลิวินาทีสำหรับการรัน workflow                              |

ส่วน `image` และ `video` ยังรองรับ:

| คีย์                   | จำเป็น                              | ค่าเริ่มต้น | คำอธิบาย                                         |
| --------------------- | ----------------------------------- | ----------- | ------------------------------------------------ |
| `inputImageNodeId`    | ใช่ (เมื่อส่งภาพอ้างอิง)            | --          | Node ID ที่รับภาพอ้างอิงที่อัปโหลด              |
| `inputImageInputName` | ไม่                                 | `"image"`   | ชื่อ input บน image node                         |

## รายละเอียดของเวิร์กโฟลว์

<AccordionGroup>
  <Accordion title="เวิร์กโฟลว์ภาพ">
    ตั้งโมเดลภาพเริ่มต้นเป็น `comfy/workflow`:

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

    หากต้องการเปิดใช้การแก้ไขภาพด้วยภาพอ้างอิงที่อัปโหลด ให้เพิ่ม `inputImageNodeId` ลงใน config ของภาพ:

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

  <Accordion title="เวิร์กโฟลว์วิดีโอ">
    ตั้งโมเดลวิดีโอเริ่มต้นเป็น `comfy/workflow`:

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

    เวิร์กโฟลว์วิดีโอของ Comfy รองรับทั้ง text-to-video และ image-to-video ผ่านกราฟที่กำหนดค่าไว้

    <Note>
    OpenClaw จะไม่ส่งวิดีโอขาเข้าเข้าไปในเวิร์กโฟลว์ของ Comfy รองรับเฉพาะ text prompt และภาพอ้างอิงเดี่ยวเป็นอินพุตเท่านั้น
    </Note>

  </Accordion>

  <Accordion title="เวิร์กโฟลว์เพลง">
    Plugin ที่มาพร้อมในชุดจะลงทะเบียน provider สำหรับการสร้างเพลง ซึ่งรองรับผลลัพธ์แบบเสียงหรือเพลงที่นิยามผ่านเวิร์กโฟลว์ โดยแสดงผ่านเครื่องมือ `music_generate` ที่ใช้ร่วมกัน:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    ใช้ส่วน config `music` เพื่อชี้ไปยัง workflow JSON ด้านเสียงของคุณและ output node

  </Accordion>

  <Accordion title="ความเข้ากันได้ย้อนหลัง">
    config ภาพระดับบนสุดแบบเดิม (ที่ไม่มีส่วน `image` ซ้อนอยู่) ยังคงใช้ได้:

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

    OpenClaw จะถือว่าโครงสร้างแบบ legacy นี้เป็น config ของเวิร์กโฟลว์ภาพ คุณไม่จำเป็นต้องย้ายทันที แต่แนะนำให้ใช้ส่วน `image` / `video` / `music` แบบซ้อนสำหรับการตั้งค่าใหม่

    <Tip>
    หากคุณใช้เฉพาะการสร้างภาพ flat config แบบ legacy และส่วน `image` แบบซ้อนใหม่จะเทียบเท่ากันในเชิงการทำงาน
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    มี live coverage แบบ opt-in สำหรับ Plugin ที่มาพร้อมในชุด:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    live test จะข้ามเคสภาพ วิดีโอ หรือเพลงแต่ละรายการ หากยังไม่ได้กำหนดค่าส่วนเวิร์กโฟลว์ Comfy ที่ตรงกัน

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
    การตั้งค่าเครื่องมือสร้างเพลงและเสียง
  </Card>
  <Card title="สารบัญผู้ให้บริการ" href="/th/providers/index" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมดและ model ref
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference#agent-defaults" icon="gear">
    เอกสารอ้างอิงคอนฟิกแบบเต็ม รวมถึงค่าเริ่มต้นของเอเจนต์
  </Card>
</CardGroup>
