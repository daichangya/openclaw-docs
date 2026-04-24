---
read_when:
    - การเลือกหรือสลับโมเดล และการกำหนดค่า aliases
    - การดีบัก model failover / “All models failed”
    - การทำความเข้าใจโปรไฟล์ auth และวิธีจัดการ դրանք
sidebarTitle: Models FAQ
summary: 'คำถามที่พบบ่อย: ค่าเริ่มต้นของโมเดล การเลือก aliases การสลับ failover และโปรไฟล์ auth'
title: 'คำถามที่พบบ่อย: โมเดลและ auth'
x-i18n:
    generated_at: "2026-04-24T09:14:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  คำถามและคำตอบเกี่ยวกับโมเดลและโปรไฟล์ auth สำหรับการตั้งค่า เซสชัน gateway ช่องทาง และ
  การแก้ไขปัญหา ดู [FAQ](/th/help/faq) หลัก

  ## โมเดล: ค่าเริ่มต้น การเลือก aliases การสลับ

  <AccordionGroup>
  <Accordion title='“โมเดลเริ่มต้น” คืออะไร?'>
    โมเดลเริ่มต้นของ OpenClaw คือสิ่งที่คุณตั้งไว้เป็น:

    ```
    agents.defaults.model.primary
    ```

    โมเดลจะถูกอ้างอิงในรูปแบบ `provider/model` (ตัวอย่าง: `openai/gpt-5.4` หรือ `openai-codex/gpt-5.5`) หากคุณละ provider ออก OpenClaw จะลองหา alias ก่อน จากนั้นจึงลองจับคู่ provider ที่กำหนดค่าไว้แบบไม่กำกวมสำหรับ model id ที่ตรงกันแบบ exact และหลังจากนั้นจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้ในฐานะเส้นทางความเข้ากันได้แบบเลิกใช้แล้ว หาก provider นั้นไม่ได้เปิดเผยโมเดลเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้แทนที่จะแสดงค่าเริ่มต้นจาก provider ที่ล้าสมัยและถูกลบไปแล้ว คุณควร **ตั้งค่า `provider/model` แบบชัดเจน** อยู่ดี

  </Accordion>

  <Accordion title="คุณแนะนำโมเดลอะไร?">
    **ค่าเริ่มต้นที่แนะนำ:** ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่ในสแตกผู้ให้บริการของคุณ
    **สำหรับเอเจนต์ที่เปิดใช้เครื่องมือหรือรับอินพุตที่ไม่น่าเชื่อถือ:** ให้ความสำคัญกับความแข็งแกร่งของโมเดลมากกว่าต้นทุน
    **สำหรับการแชตทั่วไป/ความเสี่ยงต่ำ:** ใช้โมเดล fallback ที่ถูกกว่าและกำหนดเส้นทางตามบทบาทของเอเจนต์

    MiniMax มีเอกสารของตัวเอง: [MiniMax](/th/providers/minimax) และ
    [โมเดลในเครื่อง](/th/gateway/local-models)

    หลักการง่าย ๆ: ใช้ **โมเดลที่ดีที่สุดเท่าที่คุณจ่ายไหว** สำหรับงานที่มีความสำคัญสูง และใช้
    โมเดลที่ถูกกว่าสำหรับการแชตทั่วไปหรือการสรุป คุณสามารถกำหนดเส้นทางโมเดลต่อเอเจนต์และใช้ sub-agent เพื่อ
    ทำงานยาวแบบขนานได้ (แต่ละ sub-agent จะใช้โทเค็น) ดู [โมเดล](/th/concepts/models) และ
    [Sub-agents](/th/tools/subagents)

    คำเตือนอย่างหนักแน่น: โมเดลที่อ่อนกว่าหรือถูก quantize มากเกินไปจะเปราะบางต่อ prompt
    injection และพฤติกรรมที่ไม่ปลอดภัยมากกว่า ดู [ความปลอดภัย](/th/gateway/security)

    บริบทเพิ่มเติม: [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลโดยไม่ล้าง config ได้อย่างไร?">
    ใช้ **คำสั่งโมเดล** หรือแก้ไขเฉพาะฟิลด์ **model** หลีกเลี่ยงการแทนที่ config ทั้งหมด

    ตัวเลือกที่ปลอดภัย:

    - `/model` ในแชต (รวดเร็ว ต่อเซสชัน)
    - `openclaw models set ...` (อัปเดตเฉพาะ config ของโมเดล)
    - `openclaw configure --section model` (แบบโต้ตอบ)
    - แก้ไข `agents.defaults.model` ใน `~/.openclaw/openclaw.json`

    หลีกเลี่ยง `config.apply` กับออบเจ็กต์บางส่วน เว้นแต่คุณตั้งใจจะแทนที่ทั้ง config
    สำหรับการแก้ไขผ่าน RPC ให้ตรวจสอบด้วย `config.schema.lookup` ก่อน และควรใช้ `config.patch`
    payload ของ lookup จะให้ path ที่ normalize แล้ว เอกสาร/ข้อจำกัดของ schema แบบตื้น และสรุป child ทันที
    สำหรับการอัปเดตบางส่วน
    หากคุณเผลอเขียนทับ config ให้กู้คืนจาก backup หรือรัน `openclaw doctor` ใหม่เพื่อซ่อมแซม

    เอกสาร: [โมเดล](/th/concepts/models), [Configure](/th/cli/configure), [Config](/th/cli/config), [Doctor](/th/gateway/doctor)

  </Accordion>

  <Accordion title="ฉันใช้โมเดล self-hosted (llama.cpp, vLLM, Ollama) ได้ไหม?">
    ได้ Ollama เป็นเส้นทางที่ง่ายที่สุดสำหรับโมเดลในเครื่อง

    การตั้งค่าที่เร็วที่สุด:

    1. ติดตั้ง Ollama จาก `https://ollama.com/download`
    2. ดึงโมเดลในเครื่อง เช่น `ollama pull gemma4`
    3. หากคุณต้องการโมเดล cloud ด้วย ให้รัน `ollama signin`
    4. รัน `openclaw onboard` แล้วเลือก `Ollama`
    5. เลือก `Local` หรือ `Cloud + Local`

    หมายเหตุ:

    - `Cloud + Local` ให้ทั้งโมเดล cloud และโมเดล Ollama ในเครื่องของคุณ
    - โมเดล cloud เช่น `kimi-k2.5:cloud` ไม่ต้องดึงในเครื่อง
    - หากต้องการสลับด้วยตนเอง ให้ใช้ `openclaw models list` และ `openclaw models set ollama/<model>`

    หมายเหตุด้านความปลอดภัย: โมเดลที่เล็กกว่าหรือถูก quantize อย่างหนักจะเปราะบางต่อ prompt
    injection มากกว่า เราแนะนำอย่างยิ่งให้ใช้ **โมเดลขนาดใหญ่** สำหรับบอตใด ๆ ที่สามารถใช้เครื่องมือได้
    หากคุณยังต้องการใช้โมเดลขนาดเล็ก ให้เปิด sandboxing และ allowlist เครื่องมือแบบเข้มงวด

    เอกสาร: [Ollama](/th/providers/ollama), [โมเดลในเครื่อง](/th/gateway/local-models),
    [ผู้ให้บริการโมเดล](/th/concepts/model-providers), [ความปลอดภัย](/th/gateway/security),
    [Sandboxing](/th/gateway/sandboxing)

  </Accordion>

  <Accordion title="OpenClaw, Flawd และ Krill ใช้อะไรเป็นโมเดล?">
    - deployment เหล่านี้อาจแตกต่างกันและอาจเปลี่ยนไปตามเวลา; ไม่มีคำแนะนำผู้ให้บริการที่ตายตัว
    - ตรวจสอบการตั้งค่ารันไทม์ปัจจุบันบนแต่ละ gateway ด้วย `openclaw models status`
    - สำหรับเอเจนต์ที่ไวต่อความปลอดภัย/เปิดใช้เครื่องมือ ให้ใช้โมเดลรุ่นล่าสุดที่แข็งแกร่งที่สุดที่มีอยู่
  </Accordion>

  <Accordion title="ฉันจะสลับโมเดลแบบทันทีได้อย่างไร (โดยไม่ต้องรีสตาร์ท)?">
    ใช้คำสั่ง `/model` เป็นข้อความเดี่ยว:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    นี่คือ aliases ที่มีมาในตัว สามารถเพิ่ม alias แบบกำหนดเองได้ผ่าน `agents.defaults.models`

    คุณสามารถดูรายการโมเดลที่ใช้ได้ด้วย `/model`, `/model list` หรือ `/model status`

    `/model` (และ `/model list`) จะแสดงตัวเลือกแบบย่อที่มีหมายเลข กดเลือกด้วยหมายเลข:

    ```
    /model 3
    ```

    คุณยังสามารถบังคับใช้โปรไฟล์ auth เฉพาะสำหรับผู้ให้บริการนั้นได้ (ต่อเซสชัน):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    เคล็ดลับ: `/model status` จะแสดงว่าเอเจนต์ใดกำลัง active, ใช้ไฟล์ `auth-profiles.json` ใด และโปรไฟล์ auth ใดจะถูกลองถัดไป
    นอกจากนี้ยังแสดง endpoint ของผู้ให้บริการที่กำหนดค่าไว้ (`baseUrl`) และโหมด API (`api`) เมื่อมี

    **ฉันจะยกเลิกการปักหมุดโปรไฟล์ที่ตั้งด้วย @profile ได้อย่างไร?**

    รัน `/model` ใหม่ **โดยไม่มี** suffix `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    หากคุณต้องการกลับไปใช้ค่าเริ่มต้น ให้เลือกจาก `/model` (หรือส่ง `/model <default provider/model>`)
    ใช้ `/model status` เพื่อยืนยันว่าโปรไฟล์ auth ใดกำลัง active

  </Accordion>

  <Accordion title="ฉันใช้ GPT 5.5 สำหรับงานประจำวัน และ Codex 5.5 สำหรับงานเขียนโค้ดได้ไหม?">
    ได้ ตั้งค่าตัวหนึ่งเป็นค่าเริ่มต้น แล้วสลับตามต้องการ:

    - **สลับเร็ว (ต่อเซสชัน):** `/model openai/gpt-5.4` สำหรับงานปัจจุบันที่ใช้ direct OpenAI API-key หรือ `/model openai-codex/gpt-5.5` สำหรับงาน GPT-5.5 Codex OAuth
    - **ค่าเริ่มต้น:** ตั้ง `agents.defaults.model.primary` เป็น `openai/gpt-5.4` สำหรับการใช้ API-key หรือ `openai-codex/gpt-5.5` สำหรับการใช้ GPT-5.5 Codex OAuth
    - **Sub-agents:** กำหนดเส้นทางงานเขียนโค้ดไปยัง sub-agent ที่มีโมเดลเริ่มต้นต่างออกไป

    การเข้าถึง `openai/gpt-5.5` แบบ direct API-key จะรองรับเมื่อ OpenAI เปิดใช้
    GPT-5.5 บน public API จนกว่าจะถึงตอนนั้น GPT-5.5 จะใช้ได้เฉพาะผ่าน subscription/OAuth

    ดู [โมเดล](/th/concepts/models) และ [Slash commands](/th/tools/slash-commands)

  </Accordion>

  <Accordion title="ฉันจะกำหนดค่า fast mode สำหรับ GPT 5.5 ได้อย่างไร?">
    ใช้ได้ทั้งแบบสลับต่อเซสชันหรือค่าเริ่มต้นใน config:

    - **ต่อเซสชัน:** ส่ง `/fast on` ขณะที่เซสชันกำลังใช้ `openai/gpt-5.4` หรือ `openai-codex/gpt-5.5`
    - **ค่าเริ่มต้นต่อโมเดล:** ตั้ง `agents.defaults.models["openai/gpt-5.4"].params.fastMode` หรือ `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` เป็น `true`

    ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    สำหรับ OpenAI fast mode จะแมปไปยัง `service_tier = "priority"` บนคำขอ native Responses ที่รองรับ การ override ด้วย `/fast` ในเซสชันจะมีลำดับความสำคัญเหนือค่าเริ่มต้นใน config

    ดู [Thinking and fast mode](/th/tools/thinking) และ [OpenAI fast mode](/th/providers/openai#fast-mode)

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Model ... is not allowed" แล้วไม่มีการตอบกลับ?'>
    หากมีการตั้งค่า `agents.defaults.models` มันจะกลายเป็น **allowlist** สำหรับ `/model` และการ
    override ต่อเซสชันทุกแบบ การเลือกโมเดลที่ไม่อยู่ในรายการนั้นจะส่งกลับ:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    ข้อผิดพลาดนี้จะถูกส่งกลับ **แทน** การตอบกลับปกติ วิธีแก้: เพิ่มโมเดลนั้นลงใน
    `agents.defaults.models`, เอา allowlist ออก หรือเลือกโมเดลจาก `/model list`

  </Accordion>

  <Accordion title='ทำไมฉันจึงเห็น "Unknown model: minimax/MiniMax-M2.7"?'>
    นี่หมายความว่า **ผู้ให้บริการยังไม่ได้กำหนดค่า** (ไม่พบ config หรือ auth
    profile ของ MiniMax) ดังนั้นจึงไม่สามารถ resolve โมเดลได้

    เช็กลิสต์การแก้ไข:

    1. อัปเกรดเป็น OpenClaw รุ่นปัจจุบัน (หรือรันจาก source บน `main`) แล้วรีสตาร์ท gateway
    2. ตรวจสอบว่า MiniMax ถูกกำหนดค่าแล้ว (ผ่าน wizard หรือ JSON) หรือมี auth ของ MiniMax
       อยู่ใน env/auth profiles เพื่อให้สามารถ inject provider ที่ตรงกันได้
       (`MINIMAX_API_KEY` สำหรับ `minimax`, `MINIMAX_OAUTH_TOKEN` หรือ MiniMax
       OAuth ที่จัดเก็บไว้สำหรับ `minimax-portal`)
    3. ใช้ model id แบบตรงตัว (ตัวพิมพ์เล็กใหญ่มีผล) ให้ตรงกับเส้นทาง auth ของคุณ:
       `minimax/MiniMax-M2.7` หรือ `minimax/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า API-key
       หรือ `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` สำหรับการตั้งค่า OAuth
    4. รัน:

       ```bash
       openclaw models list
       ```

       แล้วเลือกจากรายการ (หรือ `/model list` ในแชต)

    ดู [MiniMax](/th/providers/minimax) และ [โมเดล](/th/concepts/models)

  </Accordion>

  <Accordion title="ฉันใช้ MiniMax เป็นค่าเริ่มต้นและใช้ OpenAI สำหรับงานซับซ้อนได้ไหม?">
    ได้ ใช้ **MiniMax เป็นค่าเริ่มต้น** และสลับโมเดล **ต่อเซสชัน** เมื่อต้องการ
    Fallback มีไว้สำหรับ **ข้อผิดพลาด** ไม่ใช่ “งานยาก” ดังนั้นให้ใช้ `/model` หรือใช้เอเจนต์แยก

    **ตัวเลือก A: สลับต่อเซสชัน**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    จากนั้น:

    ```
    /model gpt
    ```

    **ตัวเลือก B: แยกเอเจนต์**

    - เอเจนต์ A ค่าเริ่มต้น: MiniMax
    - เอเจนต์ B ค่าเริ่มต้น: OpenAI
    - กำหนดเส้นทางตามเอเจนต์หรือใช้ `/agent` เพื่อสลับ

    เอกสาร: [โมเดล](/th/concepts/models), [การกำหนดเส้นทางหลายเอเจนต์](/th/concepts/multi-agent), [MiniMax](/th/providers/minimax), [OpenAI](/th/providers/openai)

  </Accordion>

  <Accordion title="opus / sonnet / gpt เป็น shortcut ที่มีมาในตัวหรือไม่?">
    ใช่ OpenClaw มาพร้อม shorthand เริ่มต้นบางตัว (จะใช้ก็ต่อเมื่อโมเดลนั้นมีอยู่ใน `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` สำหรับการตั้งค่า API-key หรือ `openai-codex/gpt-5.5` เมื่อกำหนดค่าสำหรับ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    หากคุณตั้ง alias ของตัวเองด้วยชื่อเดียวกัน ค่าของคุณจะชนะ

  </Accordion>

  <Accordion title="ฉันจะกำหนด/override shortcut ของโมเดล (aliases) ได้อย่างไร?">
    Alias มาจาก `agents.defaults.models.<modelId>.alias` ตัวอย่าง:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    จากนั้น `/model sonnet` (หรือ `/<alias>` เมื่อรองรับ) จะ resolve ไปยัง model ID นั้น

  </Accordion>

  <Accordion title="ฉันจะเพิ่มโมเดลจากผู้ให้บริการอื่นอย่าง OpenRouter หรือ Z.AI ได้อย่างไร?">
    OpenRouter (จ่ายตามโทเค็น; มีหลายโมเดล):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (โมเดล GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    หากคุณอ้างอิง `provider/model` แต่ไม่มีคีย์ของผู้ให้บริการที่จำเป็น คุณจะได้รับข้อผิดพลาด auth ระหว่างรันไทม์ (เช่น `No API key found for provider "zai"`)

    **No API key found for provider หลังจากเพิ่มเอเจนต์ใหม่**

    โดยปกติแล้วหมายความว่า **เอเจนต์ใหม่** มีที่เก็บ auth ว่างเปล่า Auth เป็นแบบต่อเอเจนต์และ
    เก็บไว้ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    ตัวเลือกในการแก้ไข:

    - รัน `openclaw agents add <id>` และกำหนดค่า auth ระหว่าง wizard
    - หรือคัดลอก `auth-profiles.json` จาก `agentDir` ของเอเจนต์หลักไปยัง `agentDir` ของเอเจนต์ใหม่

    อย่าใช้ `agentDir` ร่วมกันระหว่างเอเจนต์; มันจะทำให้เกิดการชนกันของ auth/เซสชัน

  </Accordion>
</AccordionGroup>

## Model failover และ "All models failed"

<AccordionGroup>
  <Accordion title="failover ทำงานอย่างไร?">
    Failover เกิดขึ้นสองขั้นตอน:

    1. **การหมุนเวียนโปรไฟล์ auth** ภายในผู้ให้บริการเดียวกัน
    2. **Model fallback** ไปยังโมเดลถัดไปใน `agents.defaults.model.fallbacks`

    Cooldown จะถูกใช้กับโปรไฟล์ที่ล้มเหลว (exponential backoff) ดังนั้น OpenClaw จึงสามารถตอบต่อได้แม้เมื่อผู้ให้บริการถูก rate-limit หรือล้มเหลวชั่วคราว

    บักเก็ต rate-limit มีมากกว่าแค่การตอบกลับ `429` ธรรมดา OpenClaw
    ยังถือว่าข้อความอย่าง `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` และข้อจำกัด
    แบบหน้าต่างการใช้งานตามช่วงเวลา (`weekly/monthly limit reached`) เป็น
    rate limit ที่ควรทำ failover ด้วย

    การตอบกลับที่ดูเหมือนเกี่ยวกับการเรียกเก็บเงินบางอย่างไม่ใช่ `402` เสมอไป และ HTTP `402`
    บางรายการก็ยังอยู่ในบักเก็ตชั่วคราวนั้น หากผู้ให้บริการส่ง
    ข้อความการเรียกเก็บเงินแบบชัดเจนบน `401` หรือ `403` OpenClaw ก็ยังสามารถเก็บมันไว้ใน
    เส้นทาง billing ได้ แต่ text matcher เฉพาะผู้ให้บริการจะยังคงจำกัดขอบเขตอยู่ที่
    ผู้ให้บริการที่เป็นเจ้าของมันเท่านั้น (เช่น OpenRouter `Key limit exceeded`) หากข้อความ `402`
    กลับดูเหมือนข้อจำกัด usage-window ที่ลองใหม่ได้ หรือ
    ข้อจำกัดการใช้จ่ายของ organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) OpenClaw จะถือว่าเป็น
    `rate_limit` ไม่ใช่การปิดใช้งาน billing แบบยาว

    ข้อผิดพลาด context-overflow ต่างออกไป: ลักษณะอย่าง
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` หรือ `ollama error: context length
    exceeded` จะอยู่ในเส้นทาง compaction/retry แทนการขยับ model
    fallback

    ข้อความ server-error ทั่วไปถูกตั้งใจให้แคบกว่า “อะไรก็ได้ที่มี
    unknown/error อยู่ในนั้น” OpenClaw ถือว่ารูปแบบชั่วคราวที่อยู่ในขอบเขตผู้ให้บริการ
    เช่น Anthropic แบบ bare `An unknown error occurred`, OpenRouter แบบ bare
    `Provider returned error`, ข้อผิดพลาด stop-reason อย่าง `Unhandled stop reason:
    error`, payload JSON `api_error` ที่มีข้อความเซิร์ฟเวอร์ชั่วคราว
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) และข้อผิดพลาดแบบผู้ให้บริการยุ่ง เช่น `ModelNotReadyException` เป็นสัญญาณ timeout/overloaded ที่ควรทำ failover เมื่อบริบทผู้ให้บริการตรงกัน
    ข้อความ fallback ภายในแบบทั่วไปอย่าง `LLM request failed with an unknown
    error.` จะคงความระมัดระวังและไม่ทริกเกอร์ model fallback ด้วยตัวเอง

  </Accordion>

  <Accordion title='“No credentials found for profile anthropic:default” หมายความว่าอะไร?'>
    หมายความว่าระบบพยายามใช้ auth profile ID `anthropic:default` แต่ไม่พบข้อมูลรับรองของมันใน auth store ที่คาดไว้

    **เช็กลิสต์การแก้ไข:**

    - **ยืนยันว่า auth profile อยู่ที่ใด** (พาธใหม่เทียบกับพาธเดิม)
      - ปัจจุบัน: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - แบบเดิม: `~/.openclaw/agent/*` (ย้ายโดย `openclaw doctor`)
    - **ยืนยันว่า Gateway โหลด env var ของคุณแล้ว**
      - หากคุณตั้ง `ANTHROPIC_API_KEY` ใน shell แต่รัน Gateway ผ่าน systemd/launchd มันอาจไม่ได้รับค่านั้น ให้ใส่ไว้ใน `~/.openclaw/.env` หรือเปิด `env.shellEnv`
    - **ตรวจสอบให้แน่ใจว่าคุณกำลังแก้ไขเอเจนต์ที่ถูกต้อง**
      - การตั้งค่าแบบหลายเอเจนต์หมายความว่าอาจมีไฟล์ `auth-profiles.json` หลายไฟล์
    - **ตรวจสอบสถานะ model/auth แบบคร่าว ๆ**
      - ใช้ `openclaw models status` เพื่อดูโมเดลที่กำหนดค่าไว้และดูว่าผู้ให้บริการยืนยันตัวตนแล้วหรือไม่

    **เช็กลิสต์การแก้ไขสำหรับ “No credentials found for profile anthropic”**

    หมายความว่าการรันถูกปักหมุดไปยังโปรไฟล์ auth ของ Anthropic แต่ Gateway
    หาไม่เจอใน auth store ของมัน

    - **ใช้ Claude CLI**
      - รัน `openclaw models auth login --provider anthropic --method cli --set-default` บนโฮสต์ gateway
    - **หากคุณต้องการใช้ API key แทน**
      - ใส่ `ANTHROPIC_API_KEY` ลงใน `~/.openclaw/.env` บน **โฮสต์ gateway**
      - ล้างลำดับที่ถูกปักหมุดซึ่งบังคับใช้โปรไฟล์ที่หายไป:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **ยืนยันว่าคุณกำลังรันคำสั่งบนโฮสต์ gateway**
      - ใน remote mode โปรไฟล์ auth จะอยู่บนเครื่อง gateway ไม่ใช่บนแล็ปท็อปของคุณ

  </Accordion>

  <Accordion title="ทำไมมันถึงลอง Google Gemini ด้วยแล้วก็ล้มเหลว?">
    หาก config โมเดลของคุณมี Google Gemini เป็น fallback (หรือคุณสลับไปใช้ shorthand ของ Gemini) OpenClaw จะลองมันระหว่าง model fallback หากคุณยังไม่ได้กำหนดค่าข้อมูลรับรองของ Google คุณจะเห็น `No API key found for provider "google"`

    วิธีแก้: กำหนดค่า auth ของ Google หรือเอาโมเดล Google ออกจาก `agents.defaults.model.fallbacks` / aliases เพื่อไม่ให้ fallback ไปที่นั่น

    **LLM request rejected: thinking signature required (Google Antigravity)**

    สาเหตุ: ประวัติเซสชันมี **บล็อก thinking ที่ไม่มีลายเซ็น** (มักมาจาก
    สตรีมที่ถูกยกเลิก/ไม่สมบูรณ์) Google Antigravity ต้องการลายเซ็นสำหรับบล็อก thinking

    วิธีแก้: ตอนนี้ OpenClaw จะลบบล็อก thinking ที่ไม่มีลายเซ็นสำหรับ Google Antigravity Claude หากยังคงเกิดขึ้น ให้เริ่ม **เซสชันใหม่** หรือตั้ง `/thinking off` สำหรับเอเจนต์นั้น

  </Accordion>
</AccordionGroup>

## โปรไฟล์ auth: คืออะไร และจัดการอย่างไร

ที่เกี่ยวข้อง: [/concepts/oauth](/th/concepts/oauth) (โฟลว์ OAuth, การเก็บโทเค็น, รูปแบบหลายบัญชี)

<AccordionGroup>
  <Accordion title="โปรไฟล์ auth คืออะไร?">
    โปรไฟล์ auth คือบันทึกข้อมูลรับรองแบบมีชื่อ (OAuth หรือ API key) ที่ผูกกับผู้ให้บริการ โปรไฟล์อยู่ที่:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="profile ID โดยทั่วไปมีอะไรบ้าง?">
    OpenClaw ใช้ ID ที่มี prefix ของผู้ให้บริการ เช่น:

    - `anthropic:default` (พบได้บ่อยเมื่อไม่มีตัวตนอีเมล)
    - `anthropic:<email>` สำหรับตัวตนแบบ OAuth
    - ID แบบกำหนดเองที่คุณเลือก (เช่น `anthropic:work`)

  </Accordion>

  <Accordion title="ฉันควบคุมได้ไหมว่าจะลองใช้โปรไฟล์ auth ใดก่อน?">
    ได้ Config รองรับเมทาดาทาแบบไม่บังคับสำหรับโปรไฟล์และลำดับต่อผู้ให้บริการ (`auth.order.<provider>`) สิ่งนี้ **ไม่ได้** เก็บ secrets; มันใช้แมป ID ไปยัง provider/mode และกำหนดลำดับการหมุนเวียน

    OpenClaw อาจข้ามโปรไฟล์ชั่วคราวหากมันอยู่ในช่วง **cooldown** สั้น ๆ (rate limits/timeouts/auth failures) หรืออยู่ในสถานะ **disabled** ที่ยาวกว่า (billing/เครดิตไม่พอ) หากต้องการตรวจสอบ ให้รัน `openclaw models status --json` แล้วดู `auth.unusableProfiles` การปรับแต่ง: `auth.cooldowns.billingBackoffHours*`

    cooldown ของ rate-limit สามารถผูกกับโมเดลได้ โปรไฟล์ที่อยู่ในช่วง cooldown
    สำหรับโมเดลหนึ่งอาจยังใช้งานได้กับโมเดลพี่น้องบนผู้ให้บริการเดียวกัน
    ขณะที่หน้าต่าง billing/disabled จะยังบล็อกทั้งโปรไฟล์

    คุณยังสามารถตั้งค่า **override ลำดับต่อเอเจนต์** (เก็บไว้ใน `auth-state.json` ของเอเจนต์นั้น) ผ่าน CLI ได้:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    หากต้องการกำหนดเป้าหมายเป็นเอเจนต์เฉพาะ:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    หากต้องการยืนยันว่าจะลองอะไรจริง ให้ใช้:

    ```bash
    openclaw models status --probe
    ```

    หากมีโปรไฟล์ที่จัดเก็บไว้แต่ถูกละออกจากลำดับที่ระบุชัดเจน probe จะรายงาน
    `excluded_by_auth_order` สำหรับโปรไฟล์นั้นแทนการลองใช้อย่างเงียบ ๆ

  </Accordion>

  <Accordion title="OAuth กับ API key ต่างกันอย่างไร?">
    OpenClaw รองรับทั้งสองแบบ:

    - **OAuth** มักใช้ประโยชน์จากการเข้าถึงผ่าน subscription (เมื่อมี)
    - **API keys** ใช้การคิดค่าบริการแบบจ่ายตามโทเค็น

    wizard รองรับ Anthropic Claude CLI, OpenAI Codex OAuth และ API keys อย่างชัดเจน

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [FAQ](/th/help/faq) — FAQ หลัก
- [FAQ — quick start และการตั้งค่าครั้งแรก](/th/help/faq-first-run)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
