---
read_when:
    - คุณต้องการเอกสารอ้างอิงการตั้งค่าโมเดลแบบแยกตามผู้ให้บริการ
    - คุณต้องการตัวอย่าง config หรือคำสั่ง CLI สำหรับการเริ่มต้นใช้งานผู้ให้บริการโมเดล
summary: ภาพรวมของผู้ให้บริการโมเดลพร้อมตัวอย่างการกำหนดค่า + โฟลว์ CLI
title: ผู้ให้บริการโมเดล
x-i18n:
    generated_at: "2026-04-23T05:30:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# ผู้ให้บริการโมเดล

หน้านี้ครอบคลุม **ผู้ให้บริการ LLM/โมเดล** (ไม่ใช่ช่องทางแชตอย่าง WhatsApp/Telegram)
สำหรับกฎการเลือกโมเดล ดู [/concepts/models](/th/concepts/models)

## กฎแบบรวดเร็ว

- การอ้างอิงโมเดลใช้รูปแบบ `provider/model` (ตัวอย่าง: `opencode/claude-opus-4-6`)
- หากคุณตั้งค่า `agents.defaults.models` ค่านั้นจะกลายเป็น allowlist
- ตัวช่วย CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`
- กฎรันไทม์สำหรับ fallback, cooldown probes และการคงค่า session-override
  มีเอกสารอยู่ที่ [/concepts/model-failover](/th/concepts/model-failover)
- `models.providers.*.models[].contextWindow` คือข้อมูลเมตาเนทีฟของโมเดล;
  `models.providers.*.models[].contextTokens` คือเพดานรันไทม์ที่มีผลจริง
- Provider plugins สามารถ inject แค็ตตาล็อกโมเดลผ่าน `registerProvider({ catalog })`
  ได้; OpenClaw จะ merge เอาต์พุตนั้นเข้าใน `models.providers` ก่อนเขียน
  `models.json`
- provider manifests สามารถประกาศ `providerAuthEnvVars` และ
  `providerAuthAliases` เพื่อให้การ probe auth แบบอิง env ทั่วไปและ provider variants
  ไม่จำเป็นต้องโหลด runtime ของ Plugin แผนที่ env-var หลักที่เหลืออยู่ตอนนี้
  จึงมีไว้เพียงสำหรับผู้ให้บริการที่เป็น non-plugin/core และบางกรณีของลำดับความสำคัญทั่วไป
  เช่นการเริ่มต้นใช้งาน Anthropic แบบ API-key-first
- Provider plugins ยังสามารถเป็นเจ้าของพฤติกรรม runtime ของผู้ให้บริการผ่าน
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile`, `isBinaryThinking`,
  `supportsXHighThinking`, `resolveDefaultThinkingLevel`,
  `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, และ
  `onModelSelected`
- หมายเหตุ: `capabilities` ของ provider runtime เป็นข้อมูลเมตาของ runner แบบใช้ร่วมกัน (ตระกูลผู้ให้บริการ
  ความเฉพาะของ transcript/tooling คำใบ้ transport/cache) ซึ่งไม่ใช่
  [public capability model](/th/plugins/architecture#public-capability-model)
  แบบเดียวกัน ที่ใช้อธิบายว่า Plugin ลงทะเบียนอะไรไว้บ้าง (text inference, speech ฯลฯ)
- ผู้ให้บริการ `codex` ที่มากับระบบจะจับคู่กับ Codex agent harness ที่มากับระบบ
  ใช้ `codex/gpt-*` เมื่อต้องการการล็อกอินที่ Codex ดูแล การค้นพบโมเดล
  การ resume thread แบบเนทีฟ และการรันแบบ app-server
  ส่วนการอ้างอิง `openai/gpt-*` แบบปกติจะยังคงใช้ผู้ให้บริการ OpenAI และ provider transport
  แบบปกติของ OpenClaw การติดตั้งที่ใช้ Codex อย่างเดียวสามารถปิด automatic PI fallback ได้ด้วย
  `agents.defaults.embeddedHarness.fallback: "none"`; ดู
  [Codex Harness](/th/plugins/codex-harness)

## พฤติกรรมผู้ให้บริการที่เป็นเจ้าของโดย Plugin

Provider plugins สามารถเป็นเจ้าของตรรกะเฉพาะผู้ให้บริการส่วนใหญ่ได้แล้ว ขณะที่ OpenClaw ยังคงดูแล
generic inference loop

การแบ่งงานโดยทั่วไป:

- `auth[].run` / `auth[].runNonInteractive`: ผู้ให้บริการเป็นเจ้าของโฟลว์ onboarding/login
  สำหรับ `openclaw onboard`, `openclaw models auth` และการตั้งค่าแบบ headless
- `wizard.setup` / `wizard.modelPicker`: ผู้ให้บริการเป็นเจ้าของป้ายชื่อการเลือก auth,
  legacy aliases, คำใบ้ allowlist สำหรับ onboarding และรายการตั้งค่าใน onboarding/model pickers
- `catalog`: ผู้ให้บริการจะปรากฏใน `models.providers`
- `normalizeModelId`: ผู้ให้บริการปรับ model id แบบ legacy/preview ให้เป็นรูปแบบปกติก่อน
  การค้นหาหรือการทำ canonicalization
- `normalizeTransport`: ผู้ให้บริการปรับ `api` / `baseUrl` ของตระกูล transport ให้เป็นรูปแบบปกติ
  ก่อน generic model assembly; OpenClaw จะตรวจสอบผู้ให้บริการที่ตรงกันก่อน แล้วค่อยดู provider plugins
  อื่นที่รองรับ hook จนกว่าจะมีตัวหนึ่งที่เปลี่ยน
  transport จริงๆ
- `normalizeConfig`: ผู้ให้บริการปรับ config `models.providers.<id>` ให้เป็นรูปแบบปกติก่อน
  ที่ runtime จะใช้งาน; OpenClaw จะตรวจสอบผู้ให้บริการที่ตรงกันก่อน แล้วค่อยตรวจผู้ให้บริการอื่น
  ที่รองรับ hook จนกว่าจะมีตัวหนึ่งที่เปลี่ยน config จริงๆ หากไม่มี
  provider hook ใด rewrite config, ตัวช่วย Google-family ที่มากับระบบจะยังคง
  normalize รายการผู้ให้บริการ Google ที่รองรับ
- `applyNativeStreamingUsageCompat`: ผู้ให้บริการใช้การ rewrite ความเข้ากันได้ของ native streaming-usage แบบขับเคลื่อนด้วย endpoint สำหรับ config providers
- `resolveConfigApiKey`: ผู้ให้บริการ resolve auth แบบ env-marker สำหรับ config providers
  โดยไม่บังคับให้โหลด runtime auth แบบเต็ม `amazon-bedrock` ยังมี
  built-in AWS env-marker resolver ตรงนี้ด้วย แม้ว่า runtime auth ของ Bedrock จะใช้
  AWS SDK default chain
- `resolveSyntheticAuth`: ผู้ให้บริการสามารถเปิดเผยความพร้อมของ auth แบบ local/self-hosted
  หรือแบบอิง config อื่นๆ ได้โดยไม่ต้องเก็บ secrets แบบ plaintext
- `shouldDeferSyntheticProfileAuth`: ผู้ให้บริการสามารถทำเครื่องหมายให้ synthetic profile
  placeholders ที่จัดเก็บไว้มีลำดับความสำคัญต่ำกว่า auth ที่มาจาก env/config
- `resolveDynamicModel`: ผู้ให้บริการยอมรับ model ids ที่ยังไม่อยู่ในแค็ตตาล็อกแบบ static
  ในเครื่อง
- `prepareDynamicModel`: ผู้ให้บริการต้องรีเฟรชข้อมูลเมตาก่อนลอง resolve
  แบบไดนามิกใหม่
- `normalizeResolvedModel`: ผู้ให้บริการต้อง rewrite transport หรือ base URL
- `contributeResolvedModelCompat`: ผู้ให้บริการช่วยเติม compat flags สำหรับ
  vendor models ของตัวเอง แม้โมเดลเหล่านั้นจะมาผ่าน compatible transport อื่นก็ตาม
- `capabilities`: ผู้ให้บริการเผยแพร่ความเฉพาะของ transcript/tooling/provider-family
- `normalizeToolSchemas`: ผู้ให้บริการล้าง tool schemas ก่อนที่ embedded
  runner จะเห็น
- `inspectToolSchemas`: ผู้ให้บริการแสดงคำเตือน schema เฉพาะ transport
  หลังจาก normalize แล้ว
- `resolveReasoningOutputMode`: ผู้ให้บริการเลือกสัญญา reasoning-output แบบเนทีฟหรือแบบติดแท็ก
- `prepareExtraParams`: ผู้ให้บริการกำหนดค่าเริ่มต้นหรือ normalize request params รายโมเดล
- `createStreamFn`: ผู้ให้บริการแทนที่เส้นทาง stream ปกติด้วย
  transport แบบกำหนดเองทั้งหมด
- `wrapStreamFn`: ผู้ให้บริการใช้ wrappers สำหรับ request headers/body/model compat
- `resolveTransportTurnState`: ผู้ให้บริการจัดเตรียม headers หรือ metadata ของ native transport รายเทิร์น
- `resolveWebSocketSessionPolicy`: ผู้ให้บริการจัดเตรียม headers ของ native WebSocket session
  หรือนโยบาย session cool-down
- `createEmbeddingProvider`: ผู้ให้บริการเป็นเจ้าของพฤติกรรม memory embedding เมื่อมัน
  ควรอยู่กับ provider plugin แทนที่จะอยู่ใน core embedding switchboard
- `formatApiKey`: ผู้ให้บริการจัดรูปแบบ auth profiles ที่จัดเก็บไว้ให้เป็น
  สตริง `apiKey` ของ runtime ตามที่ transport คาดหวัง
- `refreshOAuth`: ผู้ให้บริการเป็นเจ้าของการรีเฟรช OAuth เมื่อ refreshers
  แบบใช้ร่วมกันของ `pi-ai` ไม่เพียงพอ
- `buildAuthDoctorHint`: ผู้ให้บริการเพิ่มคำแนะนำการซ่อมเมื่อการรีเฟรช OAuth
  ล้มเหลว
- `matchesContextOverflowError`: ผู้ให้บริการรู้จัก
  ข้อผิดพลาด context-window overflow เฉพาะผู้ให้บริการที่ generic heuristics อาจพลาด
- `classifyFailoverReason`: ผู้ให้บริการแมปข้อผิดพลาดดิบจาก transport/API เฉพาะผู้ให้บริการ
  ให้เป็นเหตุผล failover เช่น rate limit หรือ overload
- `isCacheTtlEligible`: ผู้ให้บริการตัดสินว่า upstream model ids ใดรองรับ prompt-cache TTL
- `buildMissingAuthMessage`: ผู้ให้บริการแทนที่ข้อผิดพลาด auth-store แบบทั่วไป
  ด้วยคำแนะนำการกู้คืนเฉพาะผู้ให้บริการ
- `suppressBuiltInModel`: ผู้ให้บริการซ่อนแถว upstream ที่ล้าสมัย และสามารถคืน
  ข้อผิดพลาดที่เป็นของ vendor เองสำหรับกรณี direct resolution failure
- `augmentModelCatalog`: ผู้ให้บริการต่อท้ายแถวแค็ตตาล็อกแบบ synthetic/final
  หลังการค้นพบและการ merge config
- `resolveThinkingProfile`: ผู้ให้บริการเป็นเจ้าของชุดระดับ `/think` ที่แน่นอน,
  ป้ายชื่อแสดงผลแบบตัวเลือก และระดับค่าเริ่มต้นสำหรับโมเดลที่เลือก
- `isBinaryThinking`: hook ความเข้ากันได้สำหรับ UX แบบ thinking เปิด/ปิด
- `supportsXHighThinking`: hook ความเข้ากันได้สำหรับโมเดล `xhigh` ที่เลือก
- `resolveDefaultThinkingLevel`: hook ความเข้ากันได้สำหรับนโยบาย `/think` ค่าเริ่มต้น
- `applyConfigDefaults`: ผู้ให้บริการใช้ค่าเริ่มต้นระดับ global เฉพาะผู้ให้บริการ
  ระหว่างการ materialize config โดยอิงจากโหมด auth, env หรือตระกูลโมเดล
- `isModernModelRef`: ผู้ให้บริการเป็นเจ้าของการจับคู่ preferred-model แบบ live/smoke
- `prepareRuntimeAuth`: ผู้ให้บริการเปลี่ยน credential ที่กำหนดค่าไว้ให้เป็น
  runtime token แบบอายุสั้น
- `resolveUsageAuth`: ผู้ให้บริการ resolve ข้อมูลรับรอง usage/quota สำหรับ `/usage`
  และพื้นผิว status/reporting ที่เกี่ยวข้อง
- `fetchUsageSnapshot`: ผู้ให้บริการเป็นเจ้าของการดึง/แยกวิเคราะห์ endpoint ของ usage ขณะที่
  core ยังคงเป็นเจ้าของ shell สรุปและการจัดรูปแบบ
- `onModelSelected`: ผู้ให้บริการรัน side effects หลังการเลือกโมเดล เช่น
  telemetry หรือ bookkeeping ของ session ที่ผู้ให้บริการเป็นเจ้าของ

ตัวอย่าง bundled ปัจจุบัน:

- `anthropic`: fallback แบบ forward-compat สำหรับ Claude 4.6, คำแนะนำการซ่อม auth, การดึงข้อมูล usage endpoint,
  ข้อมูลเมตา cache-TTL/provider-family และค่าเริ่มต้น config ระดับ global ที่รับรู้สถานะ auth
- `amazon-bedrock`: การจับคู่ context-overflow และการจัดประเภท
  เหตุผล failover สำหรับข้อผิดพลาด throttle/not-ready ที่เป็นเฉพาะของ Bedrock โดยผู้ให้บริการเป็นเจ้าของเอง พร้อมทั้ง
  ตระกูล replay แบบใช้ร่วมกัน `anthropic-by-model` สำหรับตัวป้องกัน replay-policy เฉพาะ Claude
  บนทราฟฟิก Anthropic
- `anthropic-vertex`: ตัวป้องกัน replay-policy เฉพาะ Claude บนทราฟฟิก
  Anthropic-message
- `openrouter`: model ids แบบส่งผ่านตรง, request wrappers, คำใบ้ capability ของผู้ให้บริการ,
  การล้าง thought-signature ของ Gemini บนทราฟฟิก Gemini ที่ผ่าน proxy, การ inject reasoning ของ proxy
  ผ่านตระกูล stream `openrouter-thinking`, การส่งต่อ routing metadata
  และนโยบาย cache-TTL
- `github-copilot`: onboarding/device login, fallback แบบ forward-compat ของโมเดล,
  คำใบ้ transcript สำหรับ Claude-thinking, การแลกเปลี่ยน runtime token และการดึง usage endpoint
- `openai`: fallback แบบ forward-compat สำหรับ GPT-5.4, การ normalize transport ของ OpenAI โดยตรง,
  คำใบ้ missing-auth ที่รับรู้ Codex, การซ่อน Spark, แถวแค็ตตาล็อก OpenAI/Codex แบบ synthetic,
  นโยบาย thinking/live-model, การ normalize usage-token alias
  (`input` / `output` และตระกูล `prompt` / `completion`), ตระกูล stream แบบใช้ร่วมกัน
  `openai-responses-defaults` สำหรับ wrappers แบบเนทีฟของ OpenAI/Codex, ข้อมูลเมตาตระกูลผู้ให้บริการ,
  การลงทะเบียนผู้ให้บริการสร้างภาพแบบ bundled
  สำหรับ `gpt-image-2` และการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับ `sora-2`
- `google` และ `google-gemini-cli`: fallback แบบ forward-compat สำหรับ Gemini 3.1,
  การตรวจสอบ replay ของ Gemini แบบเนทีฟ, การล้าง bootstrap replay, โหมด
  reasoning-output แบบติดแท็ก, การจับคู่ modern-model, การลงทะเบียนผู้ให้บริการสร้างภาพแบบ bundled
  สำหรับโมเดล Gemini image-preview และการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับโมเดล Veo; Gemini CLI OAuth ยังเป็นเจ้าของ
  การจัดรูปแบบโทเค็น auth-profile, การแยกวิเคราะห์ usage-token และการดึง quota endpoint
  สำหรับพื้นผิว usage
- `moonshot`: transport แบบใช้ร่วมกัน, การ normalize payload ของ thinking โดย Plugin เป็นเจ้าของ
- `kilocode`: transport แบบใช้ร่วมกัน, request headers ที่ Plugin เป็นเจ้าของ, reasoning payload
  normalization, การล้าง thought-signature ของ proxy-Gemini และนโยบาย cache-TTL
- `zai`: fallback แบบ forward-compat สำหรับ GLM-5, ค่าเริ่มต้น `tool_stream`, นโยบาย cache-TTL,
  นโยบาย binary-thinking/live-model และ usage auth + การดึง quota;
  `glm-5*` ids ที่ไม่รู้จักจะถูกสังเคราะห์จากเทมเพลต `glm-4.7` ที่มากับระบบ
- `xai`: การ normalize transport แบบเนทีฟของ Responses, การ rewrite alias `/fast` สำหรับ
  Grok รุ่น fast, ค่าเริ่มต้น `tool_stream`, การล้าง tool-schema /
  reasoning-payload เฉพาะ xAI และการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับ `grok-imagine-video`
- `mistral`: ข้อมูลเมตา capability ที่ Plugin เป็นเจ้าของ
- `opencode` และ `opencode-go`: ข้อมูลเมตา capability ที่ Plugin เป็นเจ้าของ พร้อม
  การล้าง thought-signature ของ proxy-Gemini
- `alibaba`: แค็ตตาล็อกการสร้างวิดีโอที่ Plugin เป็นเจ้าของสำหรับการอ้างอิงโมเดล Wan โดยตรง
  เช่น `alibaba/wan2.6-t2v`
- `byteplus`: แค็ตตาล็อกที่ Plugin เป็นเจ้าของ พร้อมการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับโมเดล Seedance text-to-video/image-to-video
- `fal`: การลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled สำหรับผู้ให้บริการภายนอกที่โฮสต์ไว้
  การลงทะเบียนผู้ให้บริการสร้างภาพสำหรับโมเดลภาพ FLUX พร้อมการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับโมเดลวิดีโอภายนอกที่โฮสต์ไว้
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` และ `volcengine`:
  แค็ตตาล็อกที่ Plugin เป็นเจ้าของเท่านั้น
- `qwen`: แค็ตตาล็อกสำหรับโมเดลข้อความที่ Plugin เป็นเจ้าของ พร้อมการลงทะเบียนผู้ให้บริการ
  media-understanding และการสร้างวิดีโอแบบใช้ร่วมกันสำหรับพื้นผิวมัลติโหมดของมัน;
  การสร้างวิดีโอของ Qwen ใช้ Standard DashScope video endpoints พร้อมโมเดล Wan แบบ bundled
  เช่น `wan2.6-t2v` และ `wan2.7-r2v`
- `runway`: การลงทะเบียนผู้ให้บริการสร้างวิดีโอที่ Plugin เป็นเจ้าของสำหรับโมเดล native
  แบบอิง task ของ Runway เช่น `gen4.5`
- `minimax`: แค็ตตาล็อกที่ Plugin เป็นเจ้าของ, การลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับโมเดลวิดีโอ Hailuo, การลงทะเบียนผู้ให้บริการสร้างภาพแบบ bundled
  สำหรับ `image-01`, การเลือก replay-policy แบบผสม Anthropic/OpenAI
  และตรรกะ usage auth/snapshot
- `together`: แค็ตตาล็อกที่ Plugin เป็นเจ้าของ พร้อมการลงทะเบียนผู้ให้บริการสร้างวิดีโอแบบ bundled
  สำหรับโมเดลวิดีโอ Wan
- `xiaomi`: แค็ตตาล็อกที่ Plugin เป็นเจ้าของ พร้อมตรรกะ usage auth/snapshot

Plugin `openai` ที่มากับระบบตอนนี้เป็นเจ้าของ provider id ทั้งสอง: `openai` และ
`openai-codex`

ข้างต้นครอบคลุมผู้ให้บริการที่ยังคงเข้ากับ transports ปกติของ OpenClaw ได้ ผู้ให้บริการ
ที่ต้องใช้ request executor แบบกำหนดเองทั้งหมด จะเป็นพื้นผิวการขยายแยกต่างหากที่ลึกกว่า

## การหมุนเวียน API key

- รองรับการหมุนเวียนผู้ให้บริการแบบทั่วไปสำหรับผู้ให้บริการที่เลือก
- กำหนดค่าหลายคีย์ได้ผ่าน:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (override แบบ live เดี่ยว ลำดับความสำคัญสูงสุด)
  - `<PROVIDER>_API_KEYS` (รายการคั่นด้วย comma หรือ semicolon)
  - `<PROVIDER>_API_KEY` (คีย์หลัก)
  - `<PROVIDER>_API_KEY_*` (รายการแบบมีหมายเลข เช่น `<PROVIDER>_API_KEY_1`)
- สำหรับผู้ให้บริการ Google, `GOOGLE_API_KEY` จะถูกรวมเป็น fallback ด้วย
- ลำดับการเลือกคีย์จะคงลำดับความสำคัญและตัดค่าที่ซ้ำออก
- คำขอจะถูกลองใหม่ด้วยคีย์ถัดไปเฉพาะเมื่อได้รับการตอบกลับแบบ rate-limit เท่านั้น (เช่น
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` หรือข้อความ usage-limit เป็นช่วงๆ)
- ความล้มเหลวที่ไม่ใช่ rate-limit จะล้มเหลวทันที; จะไม่พยายามหมุนเวียนคีย์
- เมื่อคีย์ตัวเลือกทั้งหมดล้มเหลว ข้อผิดพลาดสุดท้ายจากความพยายามครั้งสุดท้ายจะถูกส่งกลับ

## ผู้ให้บริการในตัว (แค็ตตาล็อก pi-ai)

OpenClaw มาพร้อมแค็ตตาล็อก pi‑ai ผู้ให้บริการเหล่านี้ **ไม่**
ต้องมี config `models.providers`; เพียงตั้งค่า auth + เลือกโมเดล

### OpenAI

- ผู้ให้บริการ: `openai`
- Auth: `OPENAI_API_KEY`
- การหมุนเวียนแบบเลือกได้: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, พร้อม `OPENCLAW_LIVE_OPENAI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดลได้ผ่าน `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- การ warm-up ของ OpenAI Responses WebSocket เปิดใช้งานเป็นค่าเริ่มต้นผ่าน `params.openaiWsWarmup` (`true`/`false`)
- การประมวลผลแบบ priority ของ OpenAI สามารถเปิดได้ผ่าน `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` และ `params.fastMode` จะจับคู่คำขอ Responses แบบตรงของ `openai/*` ไปยัง `service_tier=priority` บน `api.openai.com`
- ใช้ `params.serviceTier` เมื่อต้องการระดับที่ระบุชัดเจนแทนการใช้สวิตช์ `/fast` แบบใช้ร่วมกัน
- OpenClaw attribution headers แบบซ่อน (`originator`, `version`,
  `User-Agent`) จะใช้เฉพาะกับทราฟฟิก OpenAI แบบเนทีฟไปยัง `api.openai.com` เท่านั้น ไม่ใช้กับ
  proxy แบบ OpenAI-compatible ทั่วไป
- เส้นทาง OpenAI แบบเนทีฟยังคงเก็บ Responses `store`, prompt-cache hints และ
  การจัดรูป payload แบบ reasoning-compat ของ OpenAI; เส้นทาง proxy ไม่มี
- `openai/gpt-5.3-codex-spark` ถูกซ่อนโดยตั้งใจใน OpenClaw เพราะ OpenAI API แบบสดปฏิเสธมัน; Spark ถูกถือเป็น Codex-only

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- ผู้ให้บริการ: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- การหมุนเวียนแบบเลือกได้: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, พร้อม `OPENCLAW_LIVE_ANTHROPIC_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- คำขอ Anthropic สาธารณะแบบตรงรองรับสวิตช์ `/fast` แบบใช้ร่วมกันและ `params.fastMode` ด้วย รวมถึงทราฟฟิกที่ยืนยันตัวตนด้วย API key และ OAuth ที่ส่งไปยัง `api.anthropic.com`; OpenClaw จะจับคู่นั่นไปเป็น Anthropic `service_tier` (`auto` เทียบกับ `standard_only`)
- หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI มาใช้ซ้ำและการใช้ `claude -p` เป็นสิ่งที่ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- โทเค็น setup-token ของ Anthropic ยังคงใช้ได้ในฐานะเส้นทางโทเค็นที่ OpenClaw รองรับ แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- ผู้ให้บริการ: `openai-codex`
- Auth: OAuth (ChatGPT)
- โมเดลตัวอย่าง: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` หรือ `openclaw models auth login --provider openai-codex`
- transport เริ่มต้นคือ `auto` (WebSocket ก่อน, fallback เป็น SSE)
- override ต่อโมเดลได้ผ่าน `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` หรือ `"auto"`)
- `params.serviceTier` จะถูกส่งต่อบนคำขอ Codex Responses แบบเนทีฟด้วย (`chatgpt.com/backend-api`)
- OpenClaw attribution headers แบบซ่อน (`originator`, `version`,
  `User-Agent`) จะถูกแนบเฉพาะบนทราฟฟิก Codex แบบเนทีฟไปยัง
  `chatgpt.com/backend-api` เท่านั้น ไม่ใช้กับ proxy แบบ OpenAI-compatible ทั่วไป
- ใช้สวิตช์ `/fast` และ config `params.fastMode` ร่วมกับ `openai/*` แบบตรง; OpenClaw จับคู่สิ่งนั้นเป็น `service_tier=priority`
- `openai-codex/gpt-5.3-codex-spark` ยังคงใช้งานได้เมื่อแค็ตตาล็อก Codex OAuth แสดงมัน; ขึ้นอยู่กับ entitlement
- `openai-codex/gpt-5.4` คงค่าเนทีฟ `contextWindow = 1050000` และค่าเริ่มต้นรันไทม์ `contextTokens = 272000`; override เพดานรันไทม์ได้ด้วย `models.providers.openai-codex.models[].contextTokens`
- หมายเหตุนโยบาย: OpenAI Codex OAuth ได้รับการรองรับอย่างชัดเจนสำหรับเครื่องมือ/เวิร์กโฟลว์ภายนอกอย่าง OpenClaw

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### ตัวเลือกโฮสต์แบบสมัครสมาชิกอื่นๆ

- [Qwen Cloud](/th/providers/qwen): พื้นผิวผู้ให้บริการ Qwen Cloud พร้อม Alibaba DashScope และการจับคู่ endpoint ของ Coding Plan
- [MiniMax](/th/providers/minimax): การเข้าถึง MiniMax Coding Plan ผ่าน OAuth หรือ API key
- [GLM Models](/th/providers/glm): Z.AI Coding Plan หรือ general API endpoints

### OpenCode

- Auth: `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`)
- ผู้ให้บริการรันไทม์ Zen: `opencode`
- ผู้ให้บริการรันไทม์ Go: `opencode-go`
- โมเดลตัวอย่าง: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- ผู้ให้บริการ: `google`
- Auth: `GEMINI_API_KEY`
- การหมุนเวียนแบบเลือกได้: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` fallback และ `OPENCLAW_LIVE_GEMINI_KEY` (override เดี่ยว)
- โมเดลตัวอย่าง: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- ความเข้ากันได้: config OpenClaw แบบเก่าที่ใช้ `google/gemini-3.1-flash-preview` จะถูก normalize เป็น `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- การรัน Gemini แบบตรงยังรองรับ `agents.defaults.models["google/<model>"].params.cachedContent`
  (หรือ `cached_content` แบบเก่า) เพื่อส่งต่อ handle แบบเนทีฟของผู้ให้บริการ
  `cachedContents/...`; Gemini cache hit จะแสดงเป็น OpenClaw `cacheRead`

### Google Vertex และ Gemini CLI

- ผู้ให้บริการ: `google-vertex`, `google-gemini-cli`
- Auth: Vertex ใช้ gcloud ADC; Gemini CLI ใช้โฟลว์ OAuth ของตัวเอง
- ข้อควรระวัง: Gemini CLI OAuth ใน OpenClaw เป็นการผสานรวมที่ไม่เป็นทางการ ผู้ใช้บางรายรายงานว่าบัญชี Google ถูกจำกัดหลังใช้ไคลเอนต์ของบุคคลที่สาม โปรดตรวจสอบข้อกำหนดของ Google และใช้บัญชีที่ไม่สำคัญหากคุณเลือกดำเนินการต่อ
- Gemini CLI OAuth ถูกจัดส่งมาเป็นส่วนหนึ่งของ Plugin `google` แบบ bundled
  - ติดตั้ง Gemini CLI ก่อน:
    - `brew install gemini-cli`
    - หรือ `npm install -g @google/gemini-cli`
  - เปิดใช้งาน: `openclaw plugins enable google`
  - ล็อกอิน: `openclaw models auth login --provider google-gemini-cli --set-default`
  - โมเดลเริ่มต้น: `google-gemini-cli/gemini-3-flash-preview`
  - หมายเหตุ: คุณ **ไม่ต้อง** วาง client id หรือ secret ลงใน `openclaw.json` โฟลว์ล็อกอินของ CLI จะจัดเก็บ
    โทเค็นไว้ใน auth profiles บนโฮสต์ gateway
  - หากคำขอล้มเหลวหลังล็อกอิน ให้ตั้ง `GOOGLE_CLOUD_PROJECT` หรือ `GOOGLE_CLOUD_PROJECT_ID` บนโฮสต์ gateway
  - คำตอบ JSON ของ Gemini CLI จะถูกแยกวิเคราะห์จาก `response`; usage จะ fallback ไปที่
    `stats` โดย `stats.cached` จะถูก normalize เป็น OpenClaw `cacheRead`

### Z.AI (GLM)

- ผู้ให้บริการ: `zai`
- Auth: `ZAI_API_KEY`
- โมเดลตัวอย่าง: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - นามแฝง: `z.ai/*` และ `z-ai/*` จะถูก normalize เป็น `zai/*`
  - `zai-api-key` จะตรวจจับ Z.AI endpoint ที่ตรงกันโดยอัตโนมัติ; `zai-coding-global`, `zai-coding-cn`, `zai-global` และ `zai-cn` จะบังคับใช้พื้นผิวเฉพาะ

### Vercel AI Gateway

- ผู้ให้บริการ: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- โมเดลตัวอย่าง: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- ผู้ให้บริการ: `kilocode`
- Auth: `KILOCODE_API_KEY`
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- แค็ตตาล็อก fallback แบบ static มาพร้อม `kilocode/kilo/auto`; การค้นพบแบบสดจาก
  `https://api.kilo.ai/api/gateway/models` สามารถขยายแค็ตตาล็อกรันไทม์
  เพิ่มเติมได้
- การจัดเส้นทาง upstream ที่แน่นอนเบื้องหลัง `kilocode/kilo/auto` เป็นสิ่งที่ Kilo Gateway
  เป็นเจ้าของ ไม่ได้ hard-code ไว้ใน OpenClaw

ดู [/providers/kilocode](/th/providers/kilocode) สำหรับรายละเอียดการตั้งค่า

### Provider plugins แบบ bundled อื่นๆ

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- โมเดลตัวอย่าง: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw จะใช้ app-attribution headers ตามที่ OpenRouter ระบุไว้เฉพาะเมื่อ
  คำขอนั้นมุ่งไปที่ `openrouter.ai` จริงๆ เท่านั้น
- ตัวทำเครื่องหมาย `cache_control` เฉพาะของ Anthropic สำหรับ OpenRouter ก็จะถูกจำกัด
  เฉพาะเส้นทาง OpenRouter ที่ได้รับการยืนยัน ไม่ใช่ URL proxy ใดๆ
- OpenRouter ยังคงอยู่บนเส้นทางแบบ proxy สไตล์ OpenAI-compatible ดังนั้น
  การจัดรูปคำขอที่มีเฉพาะ OpenAI แบบเนทีฟ (`serviceTier`, Responses `store`,
  prompt-cache hints, payload reasoning-compat ของ OpenAI) จะไม่ถูกส่งต่อ
- การอ้างอิง OpenRouter ที่ใช้ Gemini เบื้องหลังจะคงไว้เฉพาะการล้าง thought-signature ของ proxy-Gemini
  เท่านั้น; การตรวจสอบ replay ของ Gemini แบบเนทีฟและ bootstrap rewrites จะยังคงปิดอยู่
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- โมเดลตัวอย่าง: `kilocode/kilo/auto`
- การอ้างอิง Kilo ที่ใช้ Gemini เบื้องหลังจะคงเส้นทางการล้าง thought-signature
  ของ proxy-Gemini แบบเดียวกัน; `kilocode/kilo/auto` และคำใบ้อื่นที่ proxy ไม่รองรับ reasoning
  จะข้ามการ inject proxy reasoning
- MiniMax: `minimax` (API key) และ `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ `MINIMAX_API_KEY` สำหรับ `minimax-portal`
- โมเดลตัวอย่าง: `minimax/MiniMax-M2.7` หรือ `minimax-portal/MiniMax-M2.7`
- การตั้งค่า onboarding/API-key ของ MiniMax จะเขียนนิยามโมเดล M2.7 อย่างชัดเจนพร้อม
  `input: ["text", "image"]`; แค็ตตาล็อกผู้ให้บริการแบบ bundled จะคงการอ้างอิงแชต
  ไว้เป็น text-only จนกว่าจะมีการ materialize config ของผู้ให้บริการนั้น
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` หรือ `KIMICODE_API_KEY`)
- โมเดลตัวอย่าง: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- โมเดลตัวอย่าง: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` หรือ `DASHSCOPE_API_KEY`)
- โมเดลตัวอย่าง: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- โมเดลตัวอย่าง: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- โมเดลตัวอย่าง: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- โมเดลตัวอย่าง: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- โมเดลตัวอย่าง: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` หรือ `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - คำขอ xAI แบบเนทีฟที่มากับระบบใช้เส้นทาง xAI Responses
  - `/fast` หรือ `params.fastMode: true` จะ rewrite `grok-3`, `grok-3-mini`,
    `grok-4` และ `grok-4-0709` ไปเป็นรุ่น `*-fast`
  - `tool_stream` เปิดเป็นค่าเริ่มต้น; ตั้ง
    `agents.defaults.models["xai/<model>"].params.tool_stream` เป็น `false` เพื่อ
    ปิดใช้งาน
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- โมเดลตัวอย่าง: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - โมเดล GLM บน Cerebras ใช้ id `zai-glm-4.7` และ `zai-glm-4.6`
  - OpenAI-compatible base URL: `https://api.cerebras.ai/v1`
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- โมเดลตัวอย่างของ Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key` ดู [Hugging Face (Inference)](/th/providers/huggingface)

## ผู้ให้บริการผ่าน `models.providers` (แบบกำหนดเอง/base URL)

ใช้ `models.providers` (หรือ `models.json`) เพื่อเพิ่มผู้ให้บริการ **แบบกำหนดเอง** หรือ
proxy แบบ OpenAI/Anthropic-compatible

Provider plugins แบบ bundled จำนวนมากด้านล่างนี้เผยแพร่แค็ตตาล็อกค่าเริ่มต้นอยู่แล้ว
ให้ใช้ entries `models.providers.<id>` แบบ explicit เฉพาะเมื่อคุณต้องการ override
base URL, headers หรือรายการโมเดลค่าเริ่มต้น

### Moonshot AI (Kimi)

Moonshot มาเป็น bundled provider plugin ใช้ผู้ให้บริการในตัว
เป็นค่าเริ่มต้น และเพิ่ม entry `models.providers.moonshot` แบบ explicit เฉพาะเมื่อคุณ
ต้องการ override base URL หรือข้อมูลเมตาของโมเดล:

- ผู้ให้บริการ: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- โมเดลตัวอย่าง: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

model IDs ของ Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding ใช้ endpoint แบบ Anthropic-compatible ของ Moonshot AI:

- ผู้ให้บริการ: `kimi`
- Auth: `KIMI_API_KEY`
- โมเดลตัวอย่าง: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` แบบเก่ายังคงยอมรับได้ในฐานะ model id เพื่อความเข้ากันได้

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) ให้การเข้าถึง Doubao และโมเดลอื่นๆ ในจีน

- ผู้ให้บริการ: `volcengine` (coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- โมเดลตัวอย่าง: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

ในการเริ่มต้นใช้งาน ระบบจะใช้พื้นผิวสำหรับงานเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `volcengine/*`
จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ Volcengine จะให้ความสำคัญกับทั้ง
แถว `volcengine/*` และ `volcengine-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด
OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่ผ่านการกรองแทนที่จะแสดง
ตัวเลือกที่กำหนดขอบเขตตามผู้ให้บริการซึ่งว่างเปล่า

โมเดลที่มีให้ใช้:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

โมเดลสำหรับงานเขียนโค้ด (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (ระหว่างประเทศ)

BytePlus ARK ให้การเข้าถึงโมเดลชุดเดียวกับ Volcano Engine สำหรับผู้ใช้ต่างประเทศ

- ผู้ให้บริการ: `byteplus` (coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- โมเดลตัวอย่าง: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

ในการเริ่มต้นใช้งาน ระบบจะใช้พื้นผิวสำหรับงานเขียนโค้ดเป็นค่าเริ่มต้น แต่แค็ตตาล็อกทั่วไป `byteplus/*`
จะถูกลงทะเบียนพร้อมกันด้วย

ในตัวเลือกโมเดลของ onboarding/configure ตัวเลือก auth ของ BytePlus จะให้ความสำคัญกับทั้ง
แถว `byteplus/*` และ `byteplus-plan/*` หากโมเดลเหล่านั้นยังไม่ถูกโหลด
OpenClaw จะ fallback ไปยังแค็ตตาล็อกที่ไม่ผ่านการกรองแทนที่จะแสดง
ตัวเลือกที่กำหนดขอบเขตตามผู้ให้บริการซึ่งว่างเปล่า

โมเดลที่มีให้ใช้:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

โมเดลสำหรับงานเขียนโค้ด (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic ให้โมเดลแบบ Anthropic-compatible ภายใต้ผู้ให้บริการ `synthetic`:

- ผู้ให้บริการ: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- โมเดลตัวอย่าง: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax ถูกกำหนดค่าผ่าน `models.providers` เพราะใช้ endpoints แบบกำหนดเอง:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API key (Global): `--auth-choice minimax-global-api`
- MiniMax API key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` สำหรับ `minimax`; `MINIMAX_OAUTH_TOKEN` หรือ
  `MINIMAX_API_KEY` สำหรับ `minimax-portal`

ดู [/providers/minimax](/th/providers/minimax) สำหรับรายละเอียดการตั้งค่า ตัวเลือกโมเดล และตัวอย่าง config

บนเส้นทางสตรีมแบบ Anthropic-compatible ของ MiniMax OpenClaw จะปิด thinking
เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าอย่างชัดเจน และ `/fast on` จะ rewrite
`MiniMax-M2.7` เป็น `MiniMax-M2.7-highspeed`

การแบ่ง capability ที่ Plugin เป็นเจ้าของ:

- ค่าเริ่มต้นของข้อความ/แชตยังคงอยู่ที่ `minimax/MiniMax-M2.7`
- การสร้างภาพคือ `minimax/image-01` หรือ `minimax-portal/image-01`
- การทำความเข้าใจภาพเป็น `MiniMax-VL-01` ที่ Plugin เป็นเจ้าของบนทั้งสองเส้นทาง auth ของ MiniMax
- การค้นหาเว็บยังคงใช้ provider id `minimax`

### LM Studio

LM Studio มาเป็น bundled provider plugin ที่ใช้ API แบบเนทีฟ:

- ผู้ให้บริการ: `lmstudio`
- Auth: `LM_API_TOKEN`
- base URL เริ่มต้นสำหรับ inference: `http://localhost:1234/v1`

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน IDs ที่ได้จาก `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw ใช้ `/api/v1/models` และ `/api/v1/models/load` แบบเนทีฟของ LM Studio สำหรับการค้นหา + การโหลดอัตโนมัติ โดยใช้ `/v1/chat/completions` สำหรับ inference เป็นค่าเริ่มต้น
ดู [/providers/lmstudio](/th/providers/lmstudio) สำหรับการตั้งค่าและการแก้ปัญหา

### Ollama

Ollama มาเป็น bundled provider plugin และใช้ API แบบเนทีฟของ Ollama:

- ผู้ให้บริการ: `ollama`
- Auth: ไม่ต้องใช้ (เซิร์ฟเวอร์ในเครื่อง)
- โมเดลตัวอย่าง: `ollama/llama3.3`
- การติดตั้ง: [https://ollama.com/download](https://ollama.com/download)

```bash
# ติดตั้ง Ollama แล้วดึงโมเดล:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

ระบบจะตรวจพบ Ollama ในเครื่องที่ `http://127.0.0.1:11434` เมื่อคุณเลือกใช้งานด้วย
`OLLAMA_API_KEY` และ bundled provider plugin จะเพิ่ม Ollama เข้าไปใน
`openclaw onboard` และตัวเลือกโมเดลโดยตรง ดู [/providers/ollama](/th/providers/ollama)
สำหรับ onboarding, โหมด cloud/local และการกำหนดค่าแบบกำหนดเอง

### vLLM

vLLM มาเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ OpenAI-compatible
แบบ local/self-hosted:

- ผู้ให้บริการ: `vllm`
- Auth: เป็นตัวเลือก (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:8000/v1`

หากต้องการเลือกใช้ auto-discovery ในเครื่อง (ใส่ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่บังคับ auth):

```bash
export VLLM_API_KEY="vllm-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน IDs ที่ได้จาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

ดู [/providers/vllm](/th/providers/vllm) สำหรับรายละเอียด

### SGLang

SGLang มาเป็น bundled provider plugin สำหรับเซิร์ฟเวอร์ OpenAI-compatible
แบบ self-hosted ที่รวดเร็ว:

- ผู้ให้บริการ: `sglang`
- Auth: เป็นตัวเลือก (ขึ้นอยู่กับเซิร์ฟเวอร์ของคุณ)
- base URL เริ่มต้น: `http://127.0.0.1:30000/v1`

หากต้องการเลือกใช้ auto-discovery ในเครื่อง (ใส่ค่าใดก็ได้หากเซิร์ฟเวอร์ของคุณไม่ได้
บังคับ auth):

```bash
export SGLANG_API_KEY="sglang-local"
```

จากนั้นตั้งค่าโมเดล (แทนที่ด้วยหนึ่งใน IDs ที่ได้จาก `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

ดู [/providers/sglang](/th/providers/sglang) สำหรับรายละเอียด

### Proxy ในเครื่อง (LM Studio, vLLM, LiteLLM ฯลฯ)

ตัวอย่าง (OpenAI-compatible):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

หมายเหตุ:

- สำหรับผู้ให้บริการแบบกำหนดเอง `reasoning`, `input`, `cost`, `contextWindow` และ `maxTokens` เป็นตัวเลือก
  หากไม่ระบุ OpenClaw จะใช้ค่าเริ่มต้นดังนี้:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- คำแนะนำ: ควรกำหนดค่าอย่างชัดเจนให้ตรงกับข้อจำกัดของ proxy/โมเดลของคุณ
- สำหรับ `api: "openai-completions"` บน endpoint ที่ไม่ใช่แบบเนทีฟ (คือ `baseUrl` ที่ไม่ว่างใดๆ ซึ่ง host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับ `compat.supportsDeveloperRole: false` เพื่อหลีกเลี่ยงข้อผิดพลาด 400 จากผู้ให้บริการที่ไม่รองรับบทบาท `developer`
- เส้นทางแบบ proxy สไตล์ OpenAI-compatible จะข้ามการจัดรูปคำขอเฉพาะ OpenAI แบบเนทีฟด้วย:
  ไม่มี `service_tier`, ไม่มี Responses `store`, ไม่มี prompt-cache hints, ไม่มี
  การจัดรูป payload reasoning-compat ของ OpenAI และไม่มี OpenClaw attribution
  headers แบบซ่อน
- หาก `baseUrl` ว่างหรือไม่ระบุ OpenClaw จะคงพฤติกรรม OpenAI เริ่มต้นไว้ (ซึ่ง resolve ไปยัง `api.openai.com`)
- เพื่อความปลอดภัย แม้ระบุ `compat.supportsDeveloperRole: true` อย่างชัดเจน ก็ยังถูก override บน endpoint `openai-completions` ที่ไม่ใช่แบบเนทีฟ

## ตัวอย่าง CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

ดูเพิ่มเติม: [/gateway/configuration](/th/gateway/configuration) สำหรับตัวอย่างการกำหนดค่าแบบเต็ม

## ที่เกี่ยวข้อง

- [Models](/th/concepts/models) — การกำหนดค่าโมเดลและ aliases
- [Model Failover](/th/concepts/model-failover) — fallback chains และพฤติกรรมการลองใหม่
- [Configuration Reference](/th/gateway/configuration-reference#agent-defaults) — คีย์ config ของโมเดล
- [Providers](/th/providers) — คู่มือการตั้งค่าแบบแยกตามผู้ให้บริการ
