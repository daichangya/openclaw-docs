---
read_when:
    - คุณต้องการใช้ Hugging Face Inference กับ OpenClaw
    - คุณต้องการ env var ของ HF token หรือตัวเลือก auth ใน CLI
summary: การตั้งค่า Hugging Face Inference (auth + การเลือกโมเดล)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-23T05:51:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7787fce1acfe81adb5380ab1c7441d661d03c574da07149c037d3b6ba3c8e52a
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) ให้บริการ chat completions แบบ OpenAI-compatible ผ่าน router API เดียว คุณจะเข้าถึงโมเดลได้หลายตัว (DeepSeek, Llama และอื่นๆ) ด้วยโทเค็นเดียว โดย OpenClaw ใช้ **OpenAI-compatible endpoint** (เฉพาะ chat completions เท่านั้น); สำหรับ text-to-image, embeddings หรือ speech ให้ใช้ [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) โดยตรง

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` (fine-grained token พร้อมสิทธิ์ **Make calls to Inference Providers**)
- API: OpenAI-compatible (`https://router.huggingface.co/v1`)
- Billing: ใช้ HF token เดียว; [pricing](https://huggingface.co/docs/inference-providers/pricing) เป็นไปตามอัตราของ provider พร้อม free tier

## เริ่มต้นใช้งาน

<Steps>
  <Step title="สร้าง fine-grained token">
    ไปที่ [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) แล้วสร้าง fine-grained token ใหม่

    <Warning>
    token ต้องเปิดสิทธิ์ **Make calls to Inference Providers** ไม่เช่นนั้นคำขอ API จะถูกปฏิเสธ
    </Warning>

  </Step>
  <Step title="รัน onboarding">
    เลือก **Hugging Face** ใน dropdown ของ provider จากนั้นกรอก API key เมื่อระบบถาม:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="เลือกโมเดลเริ่มต้น">
    ใน dropdown **Default Hugging Face model** ให้เลือกโมเดลที่คุณต้องการ รายการนี้จะถูกโหลดจาก Inference API เมื่อคุณมี token ที่ถูกต้อง; มิฉะนั้นจะแสดงรายการที่มีมาในตัว ตัวเลือกของคุณจะถูกบันทึกเป็นโมเดลเริ่มต้น

    คุณสามารถตั้งหรือเปลี่ยนโมเดลเริ่มต้นภายหลังใน config ได้เช่นกัน:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### การตั้งค่าแบบไม่โต้ตอบ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

คำสั่งนี้จะตั้ง `huggingface/deepseek-ai/DeepSeek-R1` เป็นโมเดลเริ่มต้น

## Model IDs

model refs ใช้รูปแบบ `huggingface/<org>/<model>` (Hub-style IDs) รายการด้านล่างมาจาก **GET** `https://router.huggingface.co/v1/models`; แค็ตตาล็อกของคุณอาจมีมากกว่านี้

| โมเดล                 | Ref (เติม `huggingface/` นำหน้า)       |
| --------------------- | --------------------------------------- |
| DeepSeek R1           | `deepseek-ai/DeepSeek-R1`               |
| DeepSeek V3.2         | `deepseek-ai/DeepSeek-V3.2`             |
| Qwen3 8B              | `Qwen/Qwen3-8B`                         |
| Qwen2.5 7B Instruct   | `Qwen/Qwen2.5-7B-Instruct`              |
| Qwen3 32B             | `Qwen/Qwen3-32B`                        |
| Llama 3.3 70B Instruct| `meta-llama/Llama-3.3-70B-Instruct`     |
| Llama 3.1 8B Instruct | `meta-llama/Llama-3.1-8B-Instruct`      |
| GPT-OSS 120B          | `openai/gpt-oss-120b`                   |
| GLM 4.7               | `zai-org/GLM-4.7`                       |
| Kimi K2.5             | `moonshotai/Kimi-K2.5`                  |

<Tip>
คุณสามารถต่อท้าย `:fastest` หรือ `:cheapest` กับ model id ใดก็ได้ ตั้งลำดับค่าเริ่มต้นของคุณได้ใน [Inference Provider settings](https://hf.co/settings/inference-providers); ดู [Inference Providers](https://huggingface.co/docs/inference-providers) และ **GET** `https://router.huggingface.co/v1/models` สำหรับรายการทั้งหมด
</Tip>

## รายละเอียดขั้นสูง

<AccordionGroup>
  <Accordion title="การค้นพบโมเดลและ dropdown ใน onboarding">
    OpenClaw ค้นพบโมเดลโดยเรียก **Inference endpoint โดยตรง**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (ไม่บังคับ: ส่ง `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` หรือ `$HF_TOKEN` เพื่อดูรายการแบบเต็ม; บาง endpoints จะคืนเพียงบางส่วนหากไม่มี auth) การตอบกลับเป็นสไตล์ OpenAI แบบ `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`

    เมื่อคุณตั้งค่า Hugging Face API key (ผ่าน onboarding, `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`) OpenClaw จะใช้ GET นี้เพื่อค้นหาโมเดล chat-completion ที่พร้อมใช้งาน ระหว่าง **interactive setup** หลังจากคุณกรอก token แล้ว คุณจะเห็น dropdown **Default Hugging Face model** ที่ถูกเติมข้อมูลจากรายการนั้น (หรือจากแค็ตตาล็อกที่มีมาในตัวหากคำขอล้มเหลว) ในรันไทม์ (เช่นตอน Gateway เริ่มต้น) เมื่อมี key อยู่ OpenClaw จะเรียก **GET** `https://router.huggingface.co/v1/models` อีกครั้งเพื่อรีเฟรชแค็ตตาล็อก รายการนี้จะถูก merge เข้ากับแค็ตตาล็อกที่มีมาในตัว (สำหรับ metadata เช่น context window และ cost) หากคำขอล้มเหลวหรือไม่มีการตั้งค่า key จะใช้เฉพาะแค็ตตาล็อกที่มีมาในตัว

  </Accordion>

  <Accordion title="ชื่อโมเดล, aliases และ policy suffixes">
    - **ชื่อจาก API:** ชื่อที่ใช้แสดงของโมเดลจะถูก **hydrate จาก GET /v1/models** เมื่อ API คืนค่า `name`, `title` หรือ `display_name`; มิฉะนั้นระบบจะอนุมานจาก model id (เช่น `deepseek-ai/DeepSeek-R1` จะกลายเป็น "DeepSeek R1")
    - **Override ชื่อที่แสดง:** คุณสามารถตั้ง label แบบกำหนดเองรายโมเดลใน config เพื่อให้มันแสดงในรูปแบบที่คุณต้องการใน CLI และ UI:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Policy suffixes:** เอกสารและ helpers ของ Hugging Face แบบ bundled ใน OpenClaw ปัจจุบันถือว่าสอง suffix นี้เป็น built-in policy variants:
      - **`:fastest`** — throughput สูงสุด
      - **`:cheapest`** — ต้นทุนต่อ output token ต่ำที่สุด

      คุณสามารถเพิ่มสิ่งเหล่านี้เป็นรายการแยกใน `models.providers.huggingface.models` หรือกำหนด `model.primary` พร้อม suffix ได้ คุณยังสามารถตั้งลำดับ provider เริ่มต้นของคุณได้ใน [Inference Provider settings](https://hf.co/settings/inference-providers) (ไม่มี suffix = ใช้ลำดับนั้น)

    - **Config merge:** รายการเดิมใน `models.providers.huggingface.models` (เช่น ใน `models.json`) จะยังคงถูกเก็บไว้เมื่อมีการ merge config ดังนั้น `name`, `alias` หรือ model options แบบกำหนดเองที่คุณตั้งไว้ที่นั่นจะยังคงอยู่

  </Accordion>

  <Accordion title="Environment และการตั้งค่า daemon">
    หาก Gateway รันเป็น daemon (launchd/systemd) ให้แน่ใจว่า `HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN` พร้อมใช้งานสำหรับโปรเซสนั้น (ตัวอย่างเช่น ใน `~/.openclaw/.env` หรือผ่าน `env.shellEnv`)

    <Note>
    OpenClaw ยอมรับทั้ง `HUGGINGFACE_HUB_TOKEN` และ `HF_TOKEN` เป็น aliases ของ env var โดยใช้ตัวใดก็ได้; หากตั้งไว้ทั้งคู่ `HUGGINGFACE_HUB_TOKEN` จะมีความสำคัญก่อน
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 พร้อม fallback ไปยัง Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Qwen พร้อม variants แบบ cheapest และ fastest">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS พร้อม aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: Qwen และ DeepSeek หลายตัวพร้อม policy suffixes">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model providers" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของ providers ทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและตั้งค่าโมเดล
  </Card>
  <Card title="เอกสาร Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    เอกสารอย่างเป็นทางการของ Hugging Face Inference Providers
  </Card>
  <Card title="Configuration" href="/th/gateway/configuration" icon="gear">
    เอกสารอ้างอิง config แบบเต็ม
  </Card>
</CardGroup>
