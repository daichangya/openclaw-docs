---
read_when:
    - คุณต้องการใช้ Together AI กับ OpenClaw
    - คุณต้องการ env var ของ API key หรือตัวเลือก auth ใน CLI:-------------</analysis to=final code omitted
summary: การตั้งค่า Together AI (auth + การเลือกโมเดล)
title: Together AI
x-i18n:
    generated_at: "2026-04-23T05:53:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) ให้การเข้าถึงโมเดลโอเพนซอร์สชั้นนำ
รวมถึง Llama, DeepSeek, Kimi และอื่น ๆ ผ่าน API แบบรวมศูนย์

| คุณสมบัติ | ค่า                           |
| --------- | ----------------------------- |
| Provider  | `together`                    |
| Auth      | `TOGETHER_API_KEY`            |
| API       | เข้ากันได้กับ OpenAI          |
| Base URL  | `https://api.together.xyz/v1` |

## เริ่มต้นใช้งาน

<Steps>
  <Step title="รับ API key">
    สร้าง API key ได้ที่
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
  </Step>
  <Step title="รัน onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="ตั้งโมเดลเริ่มต้น">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### ตัวอย่างแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
preset ของ onboarding จะตั้ง `together/moonshotai/Kimi-K2.5` เป็น
โมเดลเริ่มต้น
</Note>

## catalog ที่มีมาในตัว

OpenClaw มาพร้อม catalog ของ Together ดังนี้:

| Model ref                                                    | ชื่อ                                   | อินพุต      | Context    | หมายเหตุ                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | โมเดลเริ่มต้น; เปิด reasoning    |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | โมเดลข้อความใช้งานทั่วไป         |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | โมเดล instruction ที่รวดเร็ว     |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | มัลติโหมด                        |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | มัลติโหมด                        |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | โมเดลข้อความใช้งานทั่วไป         |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | โมเดล reasoning                  |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | โมเดลข้อความ Kimi รอง            |

## การสร้างวิดีโอ

Plugin `together` ที่มาพร้อมในชุดยังลงทะเบียนการสร้างวิดีโอผ่าน
เครื่องมือ `video_generate` ที่ใช้ร่วมกันด้วย

| คุณสมบัติ              | ค่า                                  |
| ---------------------- | ------------------------------------ |
| โมเดลวิดีโอเริ่มต้น    | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| โหมด                   | text-to-video, ภาพอ้างอิงเดี่ยว      |
| พารามิเตอร์ที่รองรับ   | `aspectRatio`, `resolution`          |

หากต้องการใช้ Together เป็นผู้ให้บริการวิดีโอเริ่มต้น:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
ดู [การสร้างวิดีโอ](/th/tools/video-generation) สำหรับพารามิเตอร์ของเครื่องมือที่ใช้ร่วมกัน
การเลือก provider และพฤติกรรม failover
</Tip>

<AccordionGroup>
  <Accordion title="หมายเหตุเรื่อง environment">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้ตรวจสอบว่า
    `TOGETHER_API_KEY` พร้อมใช้งานสำหรับโปรเซสนั้น (เช่น อยู่ใน
    `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Warning>
    คีย์ที่ตั้งไว้เฉพาะใน interactive shell ของคุณจะไม่มองเห็นได้ใน
    โปรเซส gateway ที่ถูกจัดการโดย daemon ใช้ `~/.openclaw/.env` หรือ config `env.shellEnv`
    เพื่อให้พร้อมใช้งานอย่างถาวร
    </Warning>

  </Accordion>

  <Accordion title="การแก้ไขปัญหา">
    - ตรวจสอบว่าคีย์ของคุณใช้ได้: `openclaw models list --provider together`
    - หากโมเดลไม่ปรากฏ ให้ยืนยันว่า API key ถูกตั้งไว้ใน
      environment ที่ถูกต้องสำหรับโปรเซส Gateway ของคุณ
    - model ref ใช้รูปแบบ `together/<model-id>`
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    กฎของ provider, model ref และพฤติกรรม failover
  </Card>
  <Card title="การสร้างวิดีโอ" href="/th/tools/video-generation" icon="video">
    พารามิเตอร์ของเครื่องมือสร้างวิดีโอที่ใช้ร่วมกันและการเลือก provider
  </Card>
  <Card title="เอกสารอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็ม รวมถึงการตั้งค่าของ provider
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    dashboard, เอกสาร API และข้อมูลราคา ของ Together AI
  </Card>
</CardGroup>
