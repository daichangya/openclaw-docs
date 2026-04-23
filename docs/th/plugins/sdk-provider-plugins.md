---
read_when:
    - คุณกำลังสร้าง model provider Plugin ใหม่
    - คุณต้องการเพิ่ม OpenAI-compatible proxy หรือ LLM แบบกำหนดเองให้กับ OpenClaw
    - คุณต้องการทำความเข้าใจเรื่อง auth, catalogs และ runtime hooks ของ provider
sidebarTitle: Provider Plugins
summary: คู่มือทีละขั้นตอนสำหรับการสร้าง model provider Plugin สำหรับ OpenClaw
title: การสร้าง Provider Plugins
x-i18n:
    generated_at: "2026-04-23T05:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# การสร้าง Provider Plugins

คู่มือนี้จะพาคุณสร้าง provider Plugin ที่เพิ่ม model provider
(LLM) ให้กับ OpenClaw เมื่อจบแล้วคุณจะมี provider ที่มี model catalog,
API key auth และ dynamic model resolution

<Info>
  หากคุณยังไม่เคยสร้าง Plugin ของ OpenClaw มาก่อน โปรดอ่าน
  [Getting Started](/th/plugins/building-plugins) ก่อนสำหรับโครงสร้างแพ็กเกจพื้นฐาน
  และการตั้งค่า manifest
</Info>

<Tip>
  Provider plugins จะเพิ่มโมเดลเข้าไปใน inference loop ปกติของ OpenClaw หากโมเดลนั้น
  ต้องรันผ่าน native agent daemon ที่เป็นเจ้าของ threads, Compaction หรือ tool
  events ให้จับคู่ provider เข้ากับ [agent harness](/th/plugins/sdk-agent-harness)
  แทนการใส่รายละเอียด protocol ของ daemon ลงใน core
</Tip>

## คำแนะนำแบบทีละขั้น

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="แพ็กเกจและ manifest">
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
    credentials ได้โดยไม่ต้องโหลดรันไทม์ของ Plugin ให้เพิ่ม `providerAuthAliases`
    เมื่อ variant ของ provider ควรใช้ auth ของ provider id อื่นร่วมกัน `modelSupport`
    เป็นแบบไม่บังคับและช่วยให้ OpenClaw โหลด provider Plugin ของคุณอัตโนมัติจาก
    shorthand model ids เช่น `acme-large` ก่อนที่จะมี runtime hooks ถ้าคุณเผยแพร่
    provider บน ClawHub ฟิลด์ `openclaw.compat` และ `openclaw.build` เหล่านั้น
    จำเป็นต้องมีใน `package.json`

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

    นี่คือ provider ที่ใช้งานได้จริง ตอนนี้ผู้ใช้สามารถ
    `openclaw onboard --acme-ai-api-key <key>` แล้วเลือก
    `acme-ai/acme-large` เป็นโมเดลได้แล้ว

    หาก upstream provider ใช้ control tokens ที่ต่างจาก OpenClaw ให้เพิ่ม
    bidirectional text transform ขนาดเล็กแทนการแทนที่ stream path ทั้งหมด:

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

    `input` จะเขียน system prompt สุดท้ายและเนื้อหาข้อความก่อน
    transport ใหม่ ส่วน `output` จะเขียน assistant text deltas และ final text ใหม่ก่อนที่
    OpenClaw จะ parse control markers ของตัวเองหรือส่งผ่านช่องทาง

    สำหรับ bundled providers ที่ลงทะเบียนเพียง text provider เดียวพร้อม API-key
    auth และ runtime แบบมี catalog ตัวเดียว ให้เลือกใช้ตัวช่วยที่แคบกว่า
    `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` คือเส้นทาง live catalog ที่ใช้เมื่อ OpenClaw สามารถ resolve
    provider auth จริงได้ มันอาจทำ provider-specific discovery ได้ ส่วน
    `buildStaticProvider` ใช้เฉพาะกับ offline rows ที่ปลอดภัยจะแสดงได้ก่อนที่ auth
    จะถูกตั้งค่า; มันต้องไม่ต้องใช้ credentials หรือทำ network requests
    ปัจจุบันการแสดงผล `models list --all` ของ OpenClaw
    จะรัน static catalogs เฉพาะสำหรับ bundled provider plugins โดยใช้ config ว่าง, env ว่าง และไม่มี
    agent/workspace paths

    หาก auth flow ของคุณยังต้องแพตช์ `models.providers.*`, aliases และ
    default model ของเอเจนต์ระหว่าง onboarding ด้วย ให้ใช้ preset helpers จาก
    `openclaw/plugin-sdk/provider-onboard` โดย helpers ที่แคบที่สุดคือ
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` และ
    `createModelCatalogPresetAppliers(...)`

    เมื่อ native endpoint ของ provider รองรับ streamed usage blocks บน
    transport แบบ `openai-completions` ปกติ ให้เลือกใช้ shared catalog helpers ใน
    `openclaw/plugin-sdk/provider-catalog-shared` แทนการ hardcode การตรวจสอบ provider-id โดยตรง `supportsNativeStreamingUsageCompat(...)` และ
    `applyProviderNativeStreamingUsageCompat(...)` จะตรวจจับการรองรับจาก endpoint capability map ดังนั้น endpoints แบบ native ของ Moonshot/DashScope ก็ยัง opt in ได้แม้ Plugin จะใช้ custom provider id

  </Step>

  <Step title="เพิ่ม dynamic model resolution">
    หาก provider ของคุณรับ model IDs แบบกำหนดเองได้ (เช่น proxy หรือ router)
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
    warm-up — `resolveDynamicModel` จะรันอีกครั้งหลังจากมันเสร็จสิ้น

  </Step>

  <Step title="เพิ่ม runtime hooks (ตามความจำเป็น)">
    providers ส่วนใหญ่ต้องการเพียง `catalog` + `resolveDynamicModel` ให้เพิ่ม hooks
    ทีละน้อยตามที่ provider ของคุณต้องการ

    ตอนนี้ shared helper builders ครอบคลุม replay/tool-compat
    families ที่พบบ่อยที่สุดแล้ว ดังนั้นโดยปกติ plugins จึงไม่จำเป็นต้อง wire แต่ละ hook เองทีละตัว:

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

    replay families ที่มีอยู่ในตอนนี้:

    | Family | สิ่งที่มัน wire เข้ามา |
    | --- | --- |
    | `openai-compatible` | นโยบาย replay แบบ OpenAI ร่วมกันสำหรับ OpenAI-compatible transports รวมถึงการ sanitize tool-call-id, การแก้ไขลำดับ assistant-first และการตรวจสอบ Gemini-turn แบบทั่วไปเมื่อ transport ต้องการ |
    | `anthropic-by-model` | นโยบาย replay ที่รับรู้ Claude และเลือกตาม `modelId` ดังนั้น transports แบบ Anthropic-message จะได้รับ cleanup ของ thinking-block ที่เฉพาะกับ Claude ก็ต่อเมื่อโมเดลที่ resolve แล้วเป็น Claude id จริงๆ |
    | `google-gemini` | นโยบาย replay แบบ Gemini native พร้อม bootstrap replay sanitation และโหมด tagged reasoning-output |
    | `passthrough-gemini` | การ sanitize Gemini thought-signature สำหรับโมเดล Gemini ที่รันผ่าน proxy transports แบบ OpenAI-compatible; ไม่ได้เปิดใช้ native Gemini replay validation หรือ bootstrap rewrites |
    | `hybrid-anthropic-openai` | นโยบายแบบ hybrid สำหรับ providers ที่ผสมทั้งพื้นผิวโมเดลแบบ Anthropic-message และ OpenAI-compatible ใน Plugin เดียว; การทิ้ง thinking-block แบบ Claude-only ที่เป็นตัวเลือกจะยังคงถูกจำกัดอยู่ฝั่ง Anthropic |

    ตัวอย่าง bundled จริง:

    - `google` และ `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` และ `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` และ `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` และ `zai`: `openai-compatible`

    stream families ที่มีอยู่ในตอนนี้:

    | Family | สิ่งที่มัน wire เข้ามา |
    | --- | --- |
    | `google-thinking` | การ normalize Gemini thinking payload บน shared stream path |
    | `kilocode-thinking` | Kilo reasoning wrapper บน shared proxy stream path โดย `kilo/auto` และ reasoning ids ของ proxy ที่ไม่รองรับจะข้าม injected thinking |
    | `moonshot-thinking` | การแมป Moonshot binary native-thinking payload จาก config + ระดับ `/think` |
    | `minimax-fast-mode` | การเขียนโมเดลใหม่สำหรับ MiniMax fast-mode บน shared stream path |
    | `openai-responses-defaults` | shared native OpenAI/Codex Responses wrappers: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, reasoning-compat payload shaping และการจัดการบริบทของ Responses |
    | `openrouter-thinking` | OpenRouter reasoning wrapper สำหรับ proxy routes โดยจัดการการข้าม unsupported-model/`auto` แบบรวมศูนย์ |
    | `tool-stream-default-on` | wrapper แบบ default-on สำหรับ `tool_stream` สำหรับ providers อย่าง Z.AI ที่ต้องการ tool streaming เว้นแต่จะถูกปิดอย่างชัดเจน |

    ตัวอย่าง bundled จริง:

    - `google` และ `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` และ `minimax-portal`: `minimax-fast-mode`
    - `openai` และ `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` ยังส่งออก replay-family
    enum รวมถึง shared helpers ที่ families เหล่านั้นสร้างมาจากมันด้วย โดย public
    exports ที่ใช้บ่อย ได้แก่:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - shared replay builders เช่น `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` และ
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini replay helpers เช่น `sanitizeGoogleGeminiReplayHistory(...)`
      และ `resolveTaggedReasoningOutputMode()`
    - endpoint/model helpers เช่น `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` และ
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` เปิดเผยทั้ง family builder และ
    public wrapper helpers ที่ families เหล่านั้นนำกลับมาใช้ด้วย โดย public exports ที่ใช้บ่อย
    ได้แก่:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - shared OpenAI/Codex wrappers เช่น
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` และ
      `createCodexNativeWebSearchWrapper(...)`
    - shared proxy/provider wrappers เช่น `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` และ `createMinimaxFastModeWrapper(...)`

    ตัวช่วย stream บางตัวถูกเก็บไว้เป็น local ต่อ provider โดยตั้งใจ ตัวอย่าง
    bundled ปัจจุบัน: `@openclaw/anthropic-provider` ส่งออก
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` และ
    lower-level Anthropic wrapper builders จาก seam แบบ public ใน `api.ts` /
    `contract-api.ts` โดย helpers เหล่านั้นยังคงเป็น Anthropic-specific เพราะ
    มันยังเข้ารหัสการจัดการ Claude OAuth beta และการเกต `context1m` ด้วย

    bundled providers อื่นก็ยังเก็บ transport-specific wrappers ไว้เป็น local เช่นกันเมื่อ
    พฤติกรรมไม่สามารถแชร์ร่วมกันข้าม families ได้อย่างสะอาด ตัวอย่างปัจจุบัน: bundled xAI Plugin จะเก็บ native xAI Responses shaping ไว้ใน
    `wrapStreamFn` ของตัวเอง รวมถึงการเขียน aliases ของ `/fast` ใหม่, `tool_stream`
    แบบค่าเริ่มต้น, การ cleanup ของ strict-tool ที่ไม่รองรับ และการลบ reasoning-payload
    ที่เฉพาะกับ xAI

    ปัจจุบัน `openclaw/plugin-sdk/provider-tools` เปิดเผยหนึ่ง shared
    tool-schema family พร้อม schema/compat helpers ที่ใช้ร่วมกัน:

    - `ProviderToolCompatFamily` อธิบาย shared family inventory ที่มีอยู่ในตอนนี้
    - `buildProviderToolCompatFamilyHooks("gemini")` จะ wire การ cleanup + diagnostics ของ schema สำหรับ providers ที่ต้องการ tool schemas ที่ปลอดภัยกับ Gemini
    - `normalizeGeminiToolSchemas(...)` และ `inspectGeminiToolSchemas(...)`
      คือ public Gemini schema helpers พื้นฐานที่อยู่เบื้องหลัง
    - `resolveXaiModelCompatPatch()` จะคืน bundled xAI compat patch:
      `toolSchemaProfile: "xai"`, unsupported schema keywords, native
      `web_search` support และการถอดรหัส tool-call arguments ที่เป็น HTML-entity
    - `applyXaiModelCompat(model)` จะใช้ xAI compat patch ตัวเดิมนั้นกับ
      resolved model ก่อนที่จะไปถึง runner

    ตัวอย่าง bundled จริง: xAI Plugin ใช้ `normalizeResolvedModel` พร้อม
    `contributeResolvedModelCompat` เพื่อให้ compat metadata นั้นยังเป็นของ provider
    แทนที่จะ hardcode กฎของ xAI ไว้ใน core

    รูปแบบ package-root เดียวกันนี้ยังรองรับ bundled providers อื่นด้วย:

    - `@openclaw/openai-provider`: `api.ts` ส่งออก provider builders,
      default-model helpers และ realtime provider builders
    - `@openclaw/openrouter-provider`: `api.ts` ส่งออก provider builder
      พร้อม onboarding/config helpers

    <Tabs>
      <Tab title="การแลกเปลี่ยนโทเค็น">
        สำหรับ providers ที่ต้องแลกเปลี่ยนโทเค็นก่อนการเรียก inference แต่ละครั้ง:

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
        สำหรับ providers ที่ต้องใช้ request headers แบบกำหนดเอง หรือแก้ไข body ของคำขอ:

        ```typescript
        // wrapStreamFn จะคืน StreamFn ที่แตกมาจาก ctx.streamFn
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
      <Tab title="อัตลักษณ์ของ native transport">
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
      <Tab title="Usage และ billing">
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

    <Accordion title="provider hooks ทั้งหมดที่ใช้ได้">
      OpenClaw จะเรียก hooks ตามลำดับนี้ โดย providers ส่วนใหญ่ใช้เพียง 2-3 ตัว:

      | # | Hook | ใช้เมื่อใด |
      | --- | --- | --- |
      | 1 | `catalog` | model catalog หรือ base URL defaults |
      | 2 | `applyConfigDefaults` | ค่าเริ่มต้นระดับโกลบอลที่ provider เป็นเจ้าของ ระหว่าง config materialization |
      | 3 | `normalizeModelId` | cleanup ของ legacy/preview model-id alias ก่อน lookup |
      | 4 | `normalizeTransport` | cleanup ของ `api` / `baseUrl` สำหรับ provider-family ก่อนประกอบ generic model |
      | 5 | `normalizeConfig` | normalize config ของ `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | rewrites สำหรับ native streaming-usage compat ของ config providers |
      | 7 | `resolveConfigApiKey` | การ resolve auth ของ env-marker ที่ provider เป็นเจ้าของ |
      | 8 | `resolveSyntheticAuth` | synthetic auth แบบ local/self-hosted หรือ config-backed |
      | 9 | `shouldDeferSyntheticProfileAuth` | ลดลำดับ placeholder ของ stored-profile แบบ synthetic ให้อยู่หลัง env/config auth |
      | 10 | `resolveDynamicModel` | ยอมรับ upstream model IDs แบบกำหนดเองได้ |
      | 11 | `prepareDynamicModel` | ดึง metadata แบบ async ก่อน resolve |
      | 12 | `normalizeResolvedModel` | transport rewrites ก่อนเข้า runner |

    Runtime fallback notes:

    - `normalizeConfig` จะตรวจสอบ matched provider ก่อน จากนั้นจึงตรวจสอบ
      hook-capable provider plugins อื่นจนกว่าจะมีตัวหนึ่งเปลี่ยน config จริง
      หากไม่มี provider hook ตัวใด rewrite รายการ config แบบ Google-family ที่รองรับ ตัว
      normalizer ของ Google ที่ bundled มาก็ยังคงถูกนำมาใช้
    - `resolveConfigApiKey` จะใช้ provider hook เมื่อมีการเปิดเผยไว้ ส่วนเส้นทาง `amazon-bedrock` ที่ bundled มาก็ยังมี built-in AWS env-marker resolver ตรงนี้ด้วย
      แม้ว่า Bedrock runtime auth เองยังคงใช้ AWS SDK default
      chain อยู่
      | 13 | `contributeResolvedModelCompat` | compat flags สำหรับ vendor models ที่อยู่หลัง compatible transport อื่น |
      | 14 | `capabilities` | static capability bag แบบเดิม; ใช้เพื่อ compatibility เท่านั้น |
      | 15 | `normalizeToolSchemas` | cleanup ของ tool-schema ที่ provider เป็นเจ้าของก่อนการลงทะเบียน |
      | 16 | `inspectToolSchemas` | diagnostics ของ tool-schema ที่ provider เป็นเจ้าของ |
      | 17 | `resolveReasoningOutputMode` | สัญญา tagged เทียบกับ native reasoning-output |
      | 18 | `prepareExtraParams` | default request params |
      | 19 | `createStreamFn` | StreamFn transport แบบกำหนดเองทั้งหมด |
      | 20 | `wrapStreamFn` | wrappers สำหรับ headers/body แบบกำหนดเองบน stream path ปกติ |
      | 21 | `resolveTransportTurnState` | native per-turn headers/metadata |
      | 22 | `resolveWebSocketSessionPolicy` | native WS session headers/cool-down |
      | 23 | `formatApiKey` | รูปแบบ runtime token แบบกำหนดเอง |
      | 24 | `refreshOAuth` | OAuth refresh แบบกำหนดเอง |
      | 25 | `buildAuthDoctorHint` | คำแนะนำสำหรับซ่อมแซม auth |
      | 26 | `matchesContextOverflowError` | การตรวจจับ overflow ที่ provider เป็นเจ้าของ |
      | 27 | `classifyFailoverReason` | การจัดประเภท rate-limit/overload ที่ provider เป็นเจ้าของ |
      | 28 | `isCacheTtlEligible` | การเกต prompt cache TTL |
      | 29 | `buildMissingAuthMessage` | คำใบ้ missing-auth แบบกำหนดเอง |
      | 30 | `suppressBuiltInModel` | ซ่อน upstream rows ที่ stale |
      | 31 | `augmentModelCatalog` | synthetic forward-compat rows |
      | 32 | `resolveThinkingProfile` | ชุดตัวเลือก `/think` ที่เฉพาะกับโมเดล |
      | 33 | `isBinaryThinking` | compatibility ของ thinking แบบเปิด/ปิด |
      | 34 | `supportsXHighThinking` | compatibility ของการรองรับ reasoning แบบ `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | compatibility ของนโยบาย `/think` แบบค่าเริ่มต้น |
      | 36 | `isModernModelRef` | การจับคู่โมเดลสำหรับ live/smoke |
      | 37 | `prepareRuntimeAuth` | การแลกเปลี่ยนโทเค็นก่อน inference |
      | 38 | `resolveUsageAuth` | การ parse usage credential แบบกำหนดเอง |
      | 39 | `fetchUsageSnapshot` | usage endpoint แบบกำหนดเอง |
      | 40 | `createEmbeddingProvider` | embedding adapter ที่ provider เป็นเจ้าของสำหรับ memory/search |
      | 41 | `buildReplayPolicy` | นโยบาย replay/Compaction ของทรานสคริปต์แบบกำหนดเอง |
      | 42 | `sanitizeReplayHistory` | replay rewrites เฉพาะ provider หลัง generic cleanup |
      | 43 | `validateReplayTurns` | การตรวจสอบ replay-turn แบบเข้มงวดก่อน embedded runner |
      | 44 | `onModelSelected` | callback หลังการเลือก (เช่น telemetry) |

      หมายเหตุเรื่องการปรับแต่งพรอมป์ต์:

      - `resolveSystemPromptContribution` ช่วยให้ provider inject
        คำแนะนำของ system prompt แบบรับรู้ cache สำหรับ model family หนึ่งๆ ได้ ควรใช้มันแทน
        `before_prompt_build` เมื่อพฤติกรรมนั้นเป็นของ provider/model
        family เดียว และควรรักษาการแยก stable/dynamic cache เอาไว้

      สำหรับคำอธิบายแบบละเอียดและตัวอย่างจากการใช้งานจริง โปรดดู
      [Internals: Provider Runtime Hooks](/th/plugins/architecture#provider-runtime-hooks)
    </Accordion>

  </Step>

  <Step title="เพิ่มความสามารถเพิ่มเติม (ไม่บังคับ)">
    <a id="step-5-add-extra-capabilities"></a>
    provider Plugin สามารถลงทะเบียน speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    และ web search ควบคู่ไปกับ text inference ได้:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw จะจัดประเภทสิ่งนี้เป็น Plugin แบบ **hybrid-capability** ซึ่งเป็น
    รูปแบบที่แนะนำสำหรับ company plugins (หนึ่ง Plugin ต่อหนึ่ง vendor)
    ดู [Internals: Capability Ownership](/th/plugins/architecture#capability-ownership-model)

    สำหรับการสร้างวิดีโอ ควรใช้รูปแบบความสามารถที่รับรู้โหมดตามที่แสดงด้านบน:
    `generate`, `imageToVideo` และ `videoToVideo` โดยฟิลด์แบบรวมแบนๆ เช่น
    `maxInputImages`, `maxInputVideos` และ `maxDurationSeconds` เพียงอย่างเดียว
    ไม่เพียงพอที่จะประกาศการรองรับ transform-mode หรือโหมดที่ถูกปิดได้อย่างสะอาด

    ควรเลือกใช้ shared WebSocket helper สำหรับ STT providers แบบสตรีม มันช่วยให้
    proxy capture, reconnect backoff, close flushing, ready handshakes, audio
    queueing และ close-event diagnostics มีความสม่ำเสมอข้าม providers ขณะเดียวกันก็ปล่อยให้โค้ดของ provider รับผิดชอบเพียงการแมป upstream events

    STT providers แบบแบตช์ที่ POST เสียงแบบ multipart ควรใช้
    `buildAudioTranscriptionFormData(...)` จาก
    `openclaw/plugin-sdk/provider-http` ร่วมกับ provider HTTP request
    helpers โดย form helper จะ normalize ชื่อไฟล์อัปโหลด รวมถึงไฟล์ AAC ที่ต้องใช้ชื่อไฟล์สไตล์ M4A เพื่อให้เข้ากันได้กับ transcription APIs

    Music-generation providers ควรใช้รูปแบบเดียวกัน:
    `generate` สำหรับการสร้างจากพรอมป์ต์ล้วน และ `edit` สำหรับการสร้างจากภาพอ้างอิง
    ฟิลด์แบบรวมแบนๆ เช่น `maxInputImages`,
    `supportsLyrics` และ `supportsFormat` ไม่เพียงพอที่จะประกาศการรองรับ edit; บล็อก `generate` / `edit` แบบ explicit คือสัญญาที่คาดหวัง

  </Step>

  <Step title="ทดสอบ">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // ส่งออกออบเจ็กต์ config ของ provider ของคุณจาก index.ts หรือไฟล์เฉพาะ
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

provider plugins เผยแพร่แบบเดียวกับ code plugin ภายนอกทั่วไป:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

อย่าใช้ alias การเผยแพร่แบบเดิมที่มีไว้สำหรับ skill-only ที่นี่; แพ็กเกจ Plugin ควรใช้
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

## เอกสารอ้างอิงลำดับของแค็ตตาล็อก

`catalog.order` ควบคุมว่าแค็ตตาล็อกของคุณจะถูก merge เมื่อใดเมื่อเทียบกับ
providers ที่มีมาในตัว:

| Order     | เมื่อใด        | กรณีใช้งาน                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | รอบแรก         | providers แบบ API-key ธรรมดา                     |
| `profile` | หลัง simple    | providers ที่ถูกเกตด้วย auth profiles            |
| `paired`  | หลัง profile   | สังเคราะห์หลายรายการที่เกี่ยวข้องกัน             |
| `late`    | รอบสุดท้าย     | override providers ที่มีอยู่แล้ว (ชนะเมื่อชนกัน) |

## ขั้นตอนถัดไป

- [Channel Plugins](/th/plugins/sdk-channel-plugins) — หาก Plugin ของคุณมีช่องทางด้วย
- [SDK Runtime](/th/plugins/sdk-runtime) — ตัวช่วย `api.runtime` (TTS, search, subagent)
- [SDK Overview](/th/plugins/sdk-overview) — เอกสารอ้างอิง subpath import แบบเต็ม
- [Plugin Internals](/th/plugins/architecture#provider-runtime-hooks) — รายละเอียด hooks และตัวอย่าง bundled
