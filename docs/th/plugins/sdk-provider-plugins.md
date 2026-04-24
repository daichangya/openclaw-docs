---
read_when:
    - คุณกำลังสร้าง Plugin ผู้ให้บริการโมเดลใหม่
    - คุณต้องการเพิ่มพร็อกซีแบบ OpenAI-compatible หรือ LLM แบบกำหนดเองเข้าใน OpenClaw
    - คุณต้องการทำความเข้าใจ auth, catalogs และ runtime hooks ของ provider
sidebarTitle: Provider plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง Plugin ผู้ให้บริการโมเดลสำหรับ OpenClaw
title: การสร้าง Plugin ผู้ให้บริการోదלებისთვის
x-i18n:
    generated_at: "2026-04-24T09:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

คู่มือนี้จะพาคุณสร้าง provider plugin ที่เพิ่ม model provider
(LLM) ให้กับ OpenClaw เมื่อจบแล้วคุณจะมี provider ที่มี model catalog,
API key auth และ dynamic model resolution

<Info>
  หากคุณยังไม่เคยสร้าง OpenClaw plugin มาก่อน โปรดอ่าน
  [Getting Started](/th/plugins/building-plugins) ก่อน เพื่อดูโครงสร้าง package
  และการตั้งค่า manifest พื้นฐาน
</Info>

<Tip>
  Provider plugins จะเพิ่มโมเดลเข้าไปใน inference loop ปกติของ OpenClaw หากโมเดล
  จำเป็นต้องทำงานผ่าน native agent daemon ที่เป็นเจ้าของ threads, compaction หรือ tool
  events ให้จับคู่ provider กับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการนำรายละเอียด protocol ของ daemon ไปใส่ใน core
</Tip>

## ขั้นตอนแบบทีละขั้น

<Steps>
  <Step title="Package และ manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    manifest จะประกาศ `providerAuthEnvVars` เพื่อให้ OpenClaw สามารถตรวจจับ
    credentials ได้โดยไม่ต้องโหลด runtime ของ plugin ของคุณ เพิ่ม `providerAuthAliases`
    เมื่อ provider variant หนึ่งควรนำ auth ของ provider id อื่นกลับมาใช้ `modelSupport`
    เป็นตัวเลือกเสริม และช่วยให้ OpenClaw โหลด provider plugin ของคุณโดยอัตโนมัติจาก
    shorthand model ids เช่น `acme-large` ได้ก่อนที่ runtime hooks จะมีอยู่ หากคุณเผยแพร่
    provider บน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build`
    เหล่านั้นจำเป็นใน `package.json`

  </Step>

  <Step title="ลงทะเบียน provider">
    provider ขั้นต่ำต้องมี `id`, `label`, `auth` และ `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    นี่คือ provider ที่ใช้งานได้แล้ว ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` และเลือก
    `acme-ai/acme-large` เป็นโมเดลของพวกเขาได้

    หาก upstream provider ใช้ control tokens ที่แตกต่างจาก OpenClaw ให้เพิ่ม
    text transform แบบสองทิศทางขนาดเล็ก แทนการแทนที่ stream path:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` จะเขียน system prompt สุดท้ายและเนื้อหาข้อความใหม่ก่อน
    transport ส่วน `output` จะเขียน assistant text deltas และ final text ใหม่ก่อนที่
    OpenClaw จะ parse control markers ของตัวเองหรือส่งมอบไปยัง channel

    สำหรับ bundled providers ที่ลงทะเบียนเพียง text provider หนึ่งตัวด้วย API-key
    auth พร้อม runtime เดียวที่อิงกับ catalog ให้เลือกใช้
    helper `defineSingleProviderPluginEntry(...)` ที่แคบกว่าตามนี้:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` คือเส้นทาง catalog แบบ live ที่ใช้เมื่อ OpenClaw สามารถ resolve
    provider auth จริงได้ มันสามารถทำ provider-specific discovery ได้ ส่วน
    `buildStaticProvider` ใช้เฉพาะสำหรับ offline rows ที่ปลอดภัยต่อการแสดงก่อนตั้งค่า auth
    โดยมันต้องไม่ต้องใช้ credentials หรือทำ network requests
    ปัจจุบันการแสดงผล `models list --all` ของ OpenClaw จะรัน static catalogs
    เฉพาะสำหรับ bundled provider plugins โดยใช้ config ว่าง env ว่าง และไม่มี
    paths ของ agent/workspace

    หากโฟลว์ auth ของคุณต้อง patch `models.providers.*`, aliases และ
    agent default model ระหว่าง onboarding ด้วย ให้ใช้ preset helpers จาก
    `openclaw/plugin-sdk/provider-onboard` โดย helpers ที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ native endpoint ของ provider รองรับ streamed usage blocks บน
    transport `openai-completions` ปกติ ให้ใช้ shared catalog helpers ใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode การตรวจสอบ provider-id
    `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจจับการรองรับจาก endpoint capability map ดังนั้น endpoints แบบ native Moonshot/DashScope ก็ยังเลือกใช้งานได้แม้ plugin จะใช้ custom provider id

  </Step>

  <Step title="เพิ่ม dynamic model resolution">
    หาก provider ของคุณยอมรับ model IDs แบบ arbitrary (เช่น proxy หรือ router),
    ให้เพิ่ม `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog จากด้านบน

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    หากการ resolve ต้องใช้ network call ให้ใช้ `prepareDynamicModel` สำหรับ async
    warm-up — โดย `resolveDynamicModel` จะถูกรันอีกครั้งหลังจากมันเสร็จสิ้น

  </Step>

  <Step title="เพิ่ม runtime hooks (เมื่อจำเป็น)">
    providers ส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` เท่านั้น เพิ่ม hooks
    แบบค่อยเป็นค่อยไปตามที่ provider ของคุณต้องการ

    ตอนนี้ shared helper builders ครอบคลุม replay/tool-compat
    families ที่พบบ่อยที่สุดแล้ว ดังนั้น plugins โดยทั่วไปจึงไม่จำเป็นต้องผูกแต่ละ hook ด้วยมือทีละตัว:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    replay families ที่มีให้ใช้ในปัจจุบัน:

    | Family | สิ่งที่ผูกเข้ามา | ตัวอย่างที่มาพร้อมกัน |
    | --- | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบใช้ร่วมกันสไตล์ OpenAI สำหรับ transports แบบ OpenAI-compatible รวมถึงการปรับแต่ง tool-call-id, การแก้ไขลำดับ assistant-first และการตรวจสอบ generic Gemini-turn เมื่อ transport ต้องการ | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude โดยเลือกตาม `modelId`, ดังนั้น transports แบบ Anthropic-message จะได้รับการล้าง thinking-block แบบเฉพาะ Claude ก็ต่อเมื่อโมเดลที่ resolve ได้เป็น Claude id จริง | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | นโยบาย replay แบบ Gemini เนทีฟ พร้อม bootstrap replay sanitation และ tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Gemini thought-signature sanitation สำหรับโมเดล Gemini ที่รันผ่าน proxy transports แบบ OpenAI-compatible; จะไม่เปิดใช้ native Gemini replay validation หรือ bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | นโยบายแบบไฮบริดสำหรับ providers ที่ผสมพื้นผิวโมเดลแบบ Anthropic-message และ OpenAI-compatible ไว้ใน plugin เดียว; การทิ้ง thinking-block แบบเลือกเฉพาะ Claude ยังคงจำกัดอยู่ฝั่ง Anthropic | `minimax` |

    stream families ที่มีให้ใช้ในปัจจุบัน:

    | Family | สิ่งที่ผูกเข้ามา | ตัวอย่างที่มาพร้อมกัน |
    | --- | --- | --- |
    | `google-thinking` | การทำ normalization ของ Gemini thinking payload บน shared stream path | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo reasoning wrapper บน shared proxy stream path โดย `kilo/auto` และ reasoning ids ของ proxy ที่ไม่รองรับจะข้าม injected thinking | `kilocode` |
    | `moonshot-thinking` | การแมป Moonshot binary native-thinking payload จาก config + ระดับ `/think` | `moonshot` |
    | `minimax-fast-mode` | การเขียน MiniMax fast-mode model ใหม่บน shared stream path | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | shared native OpenAI/Codex Responses wrappers: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, reasoning-compat payload shaping และ Responses context management | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter reasoning wrapper สำหรับ proxy routes โดยจัดการ unsupported-model/`auto` skips แบบรวมศูนย์ | `openrouter` |
    | `tool-stream-default-on` | `tool_stream` wrapper แบบเปิดใช้เป็นค่าเริ่มต้นสำหรับ providers อย่าง Z.AI ที่ต้องการ tool streaming เว้นแต่จะถูกปิดอย่างชัดเจน | `zai` |

    <Accordion title="SDK seams ที่ขับเคลื่อน family builders">
      family builder แต่ละตัวประกอบขึ้นจาก public helpers ระดับล่างที่ export จากแพ็กเกจเดียวกัน ซึ่งคุณสามารถหยิบไปใช้ได้เมื่อ provider ต้องออกนอกแพตเทิร์นทั่วไป:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` และ raw replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`) นอกจากนี้ยัง export Gemini replay helpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) และ endpoint/model helpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` พร้อมทั้ง shared OpenAI/Codex wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) และ shared proxy/provider wrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, Gemini schema helpers ระดับล่าง (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) และ xAI compat helpers (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`) โดย bundled xAI plugin ใช้ `normalizeResolvedModel` + `contributeResolvedModelCompat` ร่วมกับสิ่งเหล่านี้เพื่อให้กฎของ xAI ยังคงเป็นของ provider

      stream helpers บางตัวตั้งใจคงไว้เฉพาะระดับ provider `@openclaw/anthropic-provider` เก็บ `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และ Anthropic wrapper builders ระดับล่างไว้ใน public seam ของ `api.ts` / `contract-api.ts` ของตัวเอง เพราะมันเข้ารหัสการจัดการ Claude OAuth beta และ `context1m` gating ส่วน xAI plugin ก็เก็บ native xAI Responses shaping ไว้ใน `wrapStreamFn` ของตัวเองเช่นกัน (`/fast` aliases, ค่าเริ่มต้น `tool_stream`, unsupported strict-tool cleanup, การลบ reasoning-payload เฉพาะของ xAI)

      รูปแบบ package-root แบบเดียวกันนี้ยังรองรับ `@openclaw/openai-provider` (provider builders, default-model helpers, realtime provider builders) และ `@openclaw/openrouter-provider` (provider builder พร้อม onboarding/config helpers)
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        สำหรับ providers ที่ต้องทำ token exchange ก่อนทุก inference call:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Custom headers">
        สำหรับ providers ที่ต้องใช้ custom request headers หรือปรับแต่ง request body:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native transport identity">
        สำหรับ providers ที่ต้องใช้ native request/session headers หรือ metadata บน
        generic HTTP หรือ WebSocket transports:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Usage and billing">
        สำหรับ providers ที่เปิดเผยข้อมูล usage/billing:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="provider hooks ทั้งหมดที่มีให้ใช้">
      OpenClaw เรียก hooks ตามลำดับนี้ โดย providers ส่วนใหญ่ใช้เพียง 2-3 รายการ:

      | # | Hook | ใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | model catalog หรือค่าเริ่มต้นของ base URL |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นระดับ global ที่ provider เป็นเจ้าของระหว่างการสร้าง config |
      | 3 | `normalizeModelId` | ล้าง aliases ของ model-id แบบ legacy/preview ก่อน lookup |
      | 4 | `normalizeTransport` | ล้าง `api` / `baseUrl` ของ provider-family ก่อนการประกอบ generic model |
      | 5 | `normalizeConfig` | normalize `models.providers.<id>` config |
      | 6 | `applyNativeStreamingUsageCompat` | native streaming-usage compat rewrites สำหรับ config providers |
      | 7 | `resolveConfigApiKey` | การ resolve auth แบบ env-marker ที่ provider เป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | synthetic auth แบบ local/self-hosted หรือแบบอิง config |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของ stored-profile แบบ synthetic ให้อยู่หลัง env/config auth |
      | 10 | `resolveDynamicModel` | ยอมรับ upstream model IDs แบบ arbitrary |
      | 11 | `prepareDynamicModel` | การดึง metadata แบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | transport rewrites ก่อนถึง runner |
      | 13 | `contributeResolvedModelCompat` | compat flags สำหรับ vendor models ที่อยู่หลัง compatible transport อื่น |
      | 14 | `capabilities` | legacy static capability bag; ใช้เพื่อความเข้ากันได้เท่านั้น |
      | 15 | `normalizeToolSchemas` | tool-schema cleanup ที่ provider เป็นเจ้าของก่อนการลงทะเบียน |
      | 16 | `inspectToolSchemas` | การวินิจฉัย tool-schema ที่ provider เป็นเจ้าของ |
      | 17 | `resolveReasoningOutputMode` | สัญญา reasoning-output แบบ tagged เทียบกับ native |
      | 18 | `prepareExtraParams` | request params เริ่มต้น |
      | 19 | `createStreamFn` | fully custom StreamFn transport |
      | 20 | `wrapStreamFn` | wrappers สำหรับ headers/body แบบกำหนดเองบน stream path ปกติ |
      | 21 | `resolveTransportTurnState` | headers/metadata ต่อเทิร์นแบบเนทีฟ |
      | 22 | `resolveWebSocketSessionPolicy` | headers/cool-down ของ native WS session |
      | 23 | `formatApiKey` | รูปแบบ runtime token แบบกำหนดเอง |
      | 24 | `refreshOAuth` | OAuth refresh แบบกำหนดเอง |
      | 25 | `buildAuthDoctorHint` | คำแนะนำการซ่อมแซม auth |
      | 26 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ provider เป็นเจ้าของ |
      | 27 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ provider เป็นเจ้าของ |
      | 28 | `isCacheTtlEligible` | gating ของ prompt cache TTL |
      | 29 | `buildMissingAuthMessage` | missing-auth hint แบบกำหนดเอง |
      | 30 | `suppressBuiltInModel` | ซ่อน upstream rows ที่ล้าสมัย |
      | 31 | `augmentModelCatalog` | synthetic rows สำหรับ forward-compat |
      | 32 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` เฉพาะโมเดล |
      | 33 | `isBinaryThinking` | ความเข้ากันได้ของ binary thinking เปิด/ปิด |
      | 34 | `supportsXHighThinking` | ความเข้ากันได้ของ `xhigh` reasoning |
      | 35 | `resolveDefaultThinkingLevel` | ความเข้ากันได้ของนโยบาย `/think` เริ่มต้น |
      | 36 | `isModernModelRef` | การจับคู่โมเดลสำหรับ live/smoke |
      | 37 | `prepareRuntimeAuth` | token exchange ก่อน inference |
      | 38 | `resolveUsageAuth` | การ parse ข้อมูลรับรองสำหรับ usage แบบกำหนดเอง |
      | 39 | `fetchUsageSnapshot` | usage endpoint แบบกำหนดเอง |
      | 40 | `createEmbeddingProvider` | embedding adapter สำหรับ memory/search ที่ provider เป็นเจ้าของ |
      | 41 | `buildReplayPolicy` | นโยบาย replay/compaction ของ transcript แบบกำหนดเอง |
      | 42 | `sanitizeReplayHistory` | replay rewrites เฉพาะ provider หลัง generic cleanup |
      | 43 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน embedded runner |
      | 44 | `onModelSelected` | callback หลังการเลือก (เช่น telemetry) |

      หมายเหตุเกี่ยวกับ runtime fallback:

      - `normalizeConfig` จะตรวจ provider ที่ตรงกันก่อน จากนั้นตรวจ provider plugins อื่นที่มี hooks จนกว่าจะมีตัวใดเปลี่ยน config จริง หากไม่มี provider hook ใดเขียน supported Google-family config entry ใหม่ bundled Google config normalizer จะยังถูกใช้
      - `resolveConfigApiKey` จะใช้ provider hook เมื่อมีให้ใช้ โดยเส้นทาง `amazon-bedrock` ที่มาพร้อมกันยังมี built-in AWS env-marker resolver อยู่ตรงนี้ด้วย แม้ตัว runtime auth ของ Bedrock เองยังคงใช้ AWS SDK default chain
      - `resolveSystemPromptContribution` ช่วยให้ provider inject คำแนะนำ system-prompt แบบรับรู้ cache สำหรับ model family ได้ ควรใช้มันแทน `before_prompt_build` เมื่อพฤติกรรมนั้นเป็นของ provider/model family หนึ่ง และควรรักษาการแยก stable/dynamic cache ไว้

      สำหรับคำอธิบายแบบละเอียดและตัวอย่างจากการใช้งานจริง ดู [Internals: Provider Runtime Hooks](/th/plugins/architecture-internals#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่ม capabilities เพิ่มเติม (ไม่บังคับ)">
    provider plugin สามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    และ web search ควบคู่ไปกับ text inference ได้ OpenClaw จัดสิ่งนี้เป็น
    plugin แบบ **hybrid-capability** — ซึ่งเป็นรูปแบบที่แนะนำสำหรับ company plugins
    (หนึ่ง plugin ต่อหนึ่ง vendor) ดู
    [Internals: Capability Ownership](/th/plugins/architecture#capability-ownership-model)

    ลงทะเบียนแต่ละ capability ภายใน `register(api)` ควบคู่ไปกับ `api.registerProvider(...)`
    ที่มีอยู่ของคุณ เลือกเฉพาะแท็บที่คุณต้องการ:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* PCM data */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="Realtime transcription">
        ควรใช้ `createRealtimeTranscriptionWebSocketSession(...)` — shared
        helper นี้จัดการ proxy capture, reconnect backoff, close flushing, ready
        handshakes, audio queueing และการวินิจฉัย close-event ให้แล้ว โดย plugin ของคุณ
        เพียงแมปเหตุการณ์จาก upstream เท่านั้น

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        ผู้ให้บริการ STT แบบ batch ที่ POST เสียงแบบ multipart ควรใช้
        `buildAudioTranscriptionFormData(...)` จาก
        `openclaw/plugin-sdk/provider-http` helper นี้จะ normalize
        ชื่อไฟล์ที่อัปโหลด รวมถึงไฟล์ AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A เพื่อให้เข้ากันได้กับ transcription APIs
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        ความสามารถด้านวิดีโอใช้รูปแบบที่ **รับรู้โหมด**: `generate`,
        `imageToVideo` และ `videoToVideo` โดยฟิลด์ aggregate แบบแบนเช่น
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` เพียงอย่างเดียว
        ไม่เพียงพอสำหรับการประกาศการรองรับ transform-mode หรือการปิดบางโหมดอย่างสะอาด
        ส่วนการสร้างเพลงก็ใช้รูปแบบเดียวกัน โดยมีบล็อก `generate` /
        `edit` แบบชัดเจน

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch และ search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="ทดสอบ">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export provider config object ของคุณจาก index.ts หรือไฟล์เฉพาะ
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## เผยแพร่ไปยัง ClawHub

Provider plugins เผยแพร่แบบเดียวกับ external code plugin อื่น ๆ:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้ alias การเผยแพร่แบบเดิมที่มีไว้เฉพาะ skills ในที่นี้; plugin packages ควรใช้
`clawhub package publish`

## โครงสร้างไฟล์

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata ของ openclaw.providers
├── openclaw.plugin.json      # Manifest พร้อม metadata ของ provider auth
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (ไม่บังคับ)
```

## เอกสารอ้างอิงลำดับของ Catalog

`catalog.order` ควบคุมว่า catalog ของคุณจะถูกรวมเมื่อใดเมื่อเทียบกับ
built-in providers:

| Order     | เมื่อใด        | กรณีใช้งาน                                     |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | รอบแรก        | providers แบบ API-key ตรงไปตรงมา              |
| `profile` | หลัง simple   | providers ที่ผูกกับ auth profiles              |
| `paired`  | หลัง profile  | สร้างหลาย entries ที่เกี่ยวข้องกันแบบสังเคราะห์ |
| `late`    | รอบสุดท้าย    | เขียนทับ providers ที่มีอยู่ (ชนะเมื่อชนกัน)   |

## ขั้นตอนถัดไป

- [Channel Plugins](/th/plugins/sdk-channel-plugins) — หาก plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, search, subagent)
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิง import subpath แบบเต็ม
- [Plugin Internals](/th/plugins/architecture-internals#provider-runtime-hooks) — รายละเอียด hooks และตัวอย่างที่มาพร้อมกัน

## ที่เกี่ยวข้อง

- [การตั้งค่า Plugin SDK](/th/plugins/sdk-setup)
- [การสร้าง plugins](/th/plugins/building-plugins)
- [การสร้าง channel plugins](/th/plugins/sdk-channel-plugins)
