---
read_when:
    - 새 모델 provider Plugin을 구축하고 있습니다
    - OpenClaw에 OpenAI 호환 프록시 또는 사용자 정의 LLM을 추가하고 싶습니다
    - provider 인증, 카탈로그 및 런타임 Hook를 이해해야 합니다
sidebarTitle: Provider Plugins
summary: OpenClaw용 모델 provider Plugin 구축 단계별 가이드
title: Provider Plugin 구축하기
x-i18n:
    generated_at: "2026-04-23T06:05:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider Plugin 구축하기

이 가이드는 OpenClaw에 모델 provider
(LLM)를 추가하는 provider Plugin 구축 과정을 안내합니다. 이 가이드를 마치면 모델 카탈로그,
API 키 인증, 동적 모델 확인 기능을 갖춘 provider를 얻게 됩니다.

<Info>
  아직 OpenClaw Plugin을 한 번도 만들어본 적이 없다면, 먼저 기본 패키지
  구조와 manifest 설정을 위해
  [Getting Started](/ko/plugins/building-plugins)를 읽으세요.
</Info>

<Tip>
  Provider Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이
  스레드, Compaction 또는 도구
  이벤트를 소유하는 네이티브 에이전트 데몬을 통해 실행되어야 한다면, 데몬 프로토콜 세부 정보를 core에 넣는 대신
  [agent harness](/ko/plugins/sdk-agent-harness)와 provider를 함께 사용하세요.
</Tip>

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 manifest">
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

    manifest는 OpenClaw가 Plugin 런타임을 로드하지 않고도
    자격 증명을 감지할 수 있도록 `providerAuthEnvVars`를 선언합니다. provider 변형이 다른 provider id의 인증을 재사용해야 할 때는
    `providerAuthAliases`를 추가하세요. `modelSupport`
    는 선택 사항이며, 런타임 Hook가 존재하기 전에 OpenClaw가 `acme-large` 같은 단축
    모델 id에서 provider Plugin을 자동 로드할 수 있게 해줍니다. provider를 ClawHub에 게시하는 경우
    `package.json`의 `openclaw.compat` 및 `openclaw.build` 필드는
    필수입니다.

  </Step>

  <Step title="provider 등록">
    최소 provider에는 `id`, `label`, `auth`, `catalog`가 필요합니다:

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

    이것으로 동작하는 provider가 완성됩니다. 이제 사용자는
    `openclaw onboard --acme-ai-api-key <key>`를 실행하고
    `acme-ai/acme-large`를 모델로 선택할 수 있습니다.

    업스트림 provider가 OpenClaw와 다른 제어 토큰을 사용한다면, 스트림 경로를 대체하는 대신
    작은 양방향 텍스트 변환을 추가하세요:

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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 내용을 다시 씁니다.
    `output`은 OpenClaw가 자체 제어 마커나 channel 전달을 파싱하기 전에
    assistant 텍스트 델타와 최종 텍스트를 다시 씁니다.

    API 키 인증이 있는 하나의 텍스트 provider와 단일 catalog 기반 런타임만 등록하는 번들 provider의 경우,
    더 좁은
    `defineSingleProviderPluginEntry(...)` 도우미를 우선 사용하세요:

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

    `buildProvider`는 OpenClaw가 실제
    provider 인증을 확인할 수 있을 때 사용하는 라이브 카탈로그 경로입니다.
    provider별 탐색을 수행할 수 있습니다.
    `buildStaticProvider`는 인증이 구성되기 전에 표시해도 안전한 오프라인 행에만 사용하세요.
    자격 증명을 요구하거나 네트워크 요청을 수행해서는 안 됩니다.
    OpenClaw의 `models list --all` 표시는 현재 번들 provider Plugin에 대해서만
    정적 카탈로그를 실행하며, 빈 config, 빈 env, agent/workspace 경로 없음 상태로 실행합니다.

    인증 흐름에서 온보딩 중 `models.providers.*`, 별칭, 에이전트 기본 모델도 패치해야 한다면
    `openclaw/plugin-sdk/provider-onboard`의 프리셋 도우미를 사용하세요.
    가장 범위가 좁은 도우미는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`,
    `createModelCatalogPresetAppliers(...)`입니다.

    provider의 네이티브 엔드포인트가 일반적인
    `openai-completions` 전송 계층에서 스트리밍 usage 블록을 지원한다면, provider-id 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공유 카탈로그 도우미를 우선 사용하세요.
    `supportsNativeStreamingUsageCompat(...)`와
    `applyProviderNativeStreamingUsageCompat(...)`는
    엔드포인트 기능 맵에서 지원 여부를 감지하므로, Plugin이 사용자 정의 provider id를 사용 중인 경우에도
    네이티브 Moonshot/DashScope 스타일 엔드포인트가 opt-in할 수 있습니다.

  </Step>

  <Step title="동적 모델 확인 추가">
    provider가 임의 모델 ID(프록시나 라우터 같은)를 허용한다면,
    `resolveDynamicModel`을 추가하세요:

    ```typescript
    api.registerProvider({
      // ... 위의 id, label, auth, catalog

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

    확인에 네트워크 호출이 필요하다면 비동기
    준비를 위해 `prepareDynamicModel`을 사용하세요 — `resolveDynamicModel`은 완료 후 다시 실행됩니다.

  </Step>

  <Step title="런타임 Hook 추가(필요한 경우)">
    대부분의 provider는 `catalog` + `resolveDynamicModel`만 필요합니다. provider에 필요해지는 만큼
    Hook를 점진적으로 추가하세요.

    이제 공유 도우미 빌더가 가장 일반적인 replay/tool-compat
    계열을 지원하므로, 보통 Plugin이 각 Hook를 하나씩 직접 연결할 필요는 없습니다:

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

    현재 사용 가능한 replay 계열:

    | 계열 | 연결되는 내용 |
    | --- | --- |
    | `openai-compatible` | 도구 호출 id 정리, assistant 우선 순서 수정, 전송 계층이 필요로 하는 일반적인 Gemini 턴 검증을 포함한 공유 OpenAI 스타일 replay 정책 |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인식 replay 정책. 따라서 Anthropic 메시지 전송 계층은 확인된 모델이 실제 Claude id일 때만 Claude 전용 thinking 블록 정리를 적용합니다 |
    | `google-gemini` | 네이티브 Gemini replay 정책과 bootstrap replay 정리 및 태그된 추론 출력 모드 |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송 계층을 통해 실행되는 Gemini 모델용 Gemini thought-signature 정리. 네이티브 Gemini replay 검증이나 bootstrap 재작성은 활성화하지 않습니다 |
    | `hybrid-anthropic-openai` | 하나의 Plugin에서 Anthropic 메시지와 OpenAI 호환 모델 표면을 혼합하는 provider용 하이브리드 정책. 선택적인 Claude 전용 thinking 블록 제거는 계속 Anthropic 측에만 범위가 제한됩니다 |

    실제 번들 예시:

    - `google` 및 `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` 및 `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, `zai`: `openai-compatible`

    현재 사용 가능한 stream 계열:

    | 계열 | 연결되는 내용 |
    | --- | --- |
    | `google-thinking` | 공유 stream 경로에서 Gemini thinking payload 정규화 |
    | `kilocode-thinking` | 공유 프록시 stream 경로에서 Kilo 추론 래퍼. `kilo/auto` 및 지원되지 않는 프록시 추론 id는 주입된 thinking을 건너뜁니다 |
    | `moonshot-thinking` | config + `/think` 수준에서 Moonshot 바이너리 네이티브 thinking payload 매핑 |
    | `minimax-fast-mode` | 공유 stream 경로에서 MiniMax fast-mode 모델 재작성 |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: attribution 헤더, `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex 웹 검색, reasoning 호환 payload shaping, Responses 컨텍스트 관리 |
    | `openrouter-thinking` | 프록시 라우트를 위한 OpenRouter 추론 래퍼이며, 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리됩니다 |
    | `tool-stream-default-on` | 명시적으로 비활성화하지 않는 한 도구 스트리밍을 원하는 Z.AI 같은 provider를 위한 기본 활성 `tool_stream` 래퍼 |

    실제 번들 예시:

    - `google` 및 `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` 및 `minimax-portal`: `minimax-fast-mode`
    - `openai` 및 `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`는 replay-family
    enum과 해당 계열이 기반으로 하는 공유 도우미도 export합니다. 일반적인 공개
    export는 다음과 같습니다:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`,
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` 같은 공유 replay 빌더
    - `sanitizeGoogleGeminiReplayHistory(...)`
      및 `resolveTaggedReasoningOutputMode()` 같은 Gemini replay 도우미
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`,
      `normalizeNativeXaiModelId(...)` 같은 엔드포인트/모델 도우미

    `openclaw/plugin-sdk/provider-stream`은 계열 빌더와
    해당 계열이 재사용하는 공개 래퍼 도우미를 모두 노출합니다. 일반적인 공개 export는
    다음과 같습니다:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`,
      `createCodexNativeWebSearchWrapper(...)` 같은 공유 OpenAI/Codex 래퍼
    - `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, `createMinimaxFastModeWrapper(...)` 같은 공유 프록시/provider 래퍼

    일부 stream 도우미는 의도적으로 provider 로컬에 남아 있습니다. 현재 번들
    예시: `@openclaw/anthropic-provider`는
    공개 `api.ts` /
    `contract-api.ts` 경계를 통해 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 그리고
    더 저수준의 Anthropic 래퍼 빌더를 export합니다. 이러한 도우미는
    Claude OAuth 베타 처리와 `context1m` 게이팅도 인코딩하기 때문에
    Anthropic 전용으로 유지됩니다.

    다른 번들 provider도 동작이 계열 전반에 걸쳐 깔끔하게 공유되지 않을 때
    전송 계층 전용 래퍼를 로컬에 유지합니다. 현재 예시: 번들 xAI Plugin은
    자체 `wrapStreamFn`에 네이티브 xAI Responses shaping을 유지하며,
    여기에는 `/fast` 별칭 재작성, 기본 `tool_stream`,
    지원되지 않는 strict-tool 정리, xAI 전용 reasoning payload
    제거가 포함됩니다.

    `openclaw/plugin-sdk/provider-tools`는 현재 하나의 공유
    tool-schema 계열과 공유 스키마/호환 도우미를 노출합니다:

    - `ProviderToolCompatFamily`는 현재 공유 계열 인벤토리를 문서화합니다.
    - `buildProviderToolCompatFamilyHooks("gemini")`는 Gemini 안전 도구 스키마가 필요한 provider를 위해
      Gemini 스키마 정리 + 진단을 연결합니다.
    - `normalizeGeminiToolSchemas(...)` 및 `inspectGeminiToolSchemas(...)`
      는 기반이 되는 공개 Gemini 스키마 도우미입니다.
    - `resolveXaiModelCompatPatch()`는 번들 xAI 호환 패치를 반환합니다:
      `toolSchemaProfile: "xai"`, 지원되지 않는 스키마 키워드, 네이티브
      `web_search` 지원, HTML 엔터티 도구 호출 인수 디코딩.
    - `applyXaiModelCompat(model)`은 동일한 xAI 호환 패치를
      실행기로 전달되기 전에 확인된 모델에 적용합니다.

    실제 번들 예시: xAI Plugin은
    core에 xAI 규칙을 하드코딩하는 대신 해당 호환 메타데이터의 소유권을 provider에 유지하기 위해
    `normalizeResolvedModel`과
    `contributeResolvedModelCompat`를 사용합니다.

    동일한 패키지 루트 패턴은 다른 번들 provider도 지원합니다:

    - `@openclaw/openai-provider`: `api.ts`는 provider 빌더,
      기본 모델 도우미, realtime provider 빌더를 export합니다
    - `@openclaw/openrouter-provider`: `api.ts`는 provider 빌더와
      온보딩/config 도우미를 export합니다

    <Tabs>
      <Tab title="토큰 교환">
        각 추론 호출 전에 토큰 교환이 필요한 provider의 경우:

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
      <Tab title="사용자 정의 헤더">
        사용자 정의 요청 헤더 또는 본문 수정이 필요한 provider의 경우:

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
      <Tab title="네이티브 전송 ID">
        일반적인 HTTP 또는 WebSocket 전송에서 네이티브 요청/세션 헤더나 메타데이터가 필요한
        provider의 경우:

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
      <Tab title="사용량 및 과금">
        사용량/과금 데이터를 노출하는 provider의 경우:

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

    <Accordion title="사용 가능한 모든 provider Hook">
      OpenClaw는 이 순서로 Hook를 호출합니다. 대부분의 provider는 2~3개만 사용합니다:

      | # | Hook | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 카탈로그 또는 기본 base URL |
      | 2 | `applyConfigDefaults` | 구성 구체화 중 provider 소유 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 레거시/preview 모델 id 별칭 정리 |
      | 4 | `normalizeTransport` | 일반 모델 조립 전 provider 계열 `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` config 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider용 네이티브 스트리밍 usage 호환 재작성 |
      | 7 | `resolveConfigApiKey` | provider 소유 env-marker 인증 확인 |
      | 8 | `resolveSyntheticAuth` | 로컬/셀프 호스팅 또는 config 기반 합성 인증 |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic 저장 프로필 placeholder를 env/config 인증 뒤로 낮춤 |
      | 10 | `resolveDynamicModel` | 임의 업스트림 모델 ID 허용 |
      | 11 | `prepareDynamicModel` | 확인 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | 실행기 전 transport 재작성 |

    런타임 폴백 참고:

    - `normalizeConfig`는 먼저 일치하는 provider를 확인한 다음,
      실제로 config를 변경할 때까지 다른
      Hook 가능 provider Plugin을 확인합니다.
      provider Hook가 지원되는 Google 계열 config 항목을 재작성하지 않으면,
      번들 Google config 정규화가 여전히 적용됩니다.
    - `resolveConfigApiKey`는 노출된 경우 provider Hook를 사용합니다. 번들
      `amazon-bedrock` 경로는 여기서 내장 AWS env-marker 확인자도 갖고 있지만,
      Bedrock 런타임 인증 자체는 여전히 AWS SDK 기본
      체인을 사용합니다.
      | 13 | `contributeResolvedModelCompat` | 다른 호환 transport 뒤에 있는 벤더 모델용 호환 플래그 |
      | 14 | `capabilities` | 레거시 정적 기능 집합. 호환성 전용 |
      | 15 | `normalizeToolSchemas` | 등록 전 provider 소유 도구 스키마 정리 |
      | 16 | `inspectToolSchemas` | provider 소유 도구 스키마 진단 |
      | 17 | `resolveReasoningOutputMode` | 태그 기반 대 네이티브 추론 출력 계약 |
      | 18 | `prepareExtraParams` | 기본 요청 params |
      | 19 | `createStreamFn` | 완전 사용자 정의 StreamFn 전송 |
      | 20 | `wrapStreamFn` | 일반 stream 경로의 사용자 정의 헤더/본문 래퍼 |
      | 21 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 22 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/쿨다운 |
      | 23 | `formatApiKey` | 사용자 정의 런타임 토큰 형태 |
      | 24 | `refreshOAuth` | 사용자 정의 OAuth 갱신 |
      | 25 | `buildAuthDoctorHint` | 인증 복구 안내 |
      | 26 | `matchesContextOverflowError` | provider 소유 오버플로 감지 |
      | 27 | `classifyFailoverReason` | provider 소유 rate-limit/overload 분류 |
      | 28 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 29 | `buildMissingAuthMessage` | 사용자 정의 누락 인증 힌트 |
      | 30 | `suppressBuiltInModel` | 오래된 업스트림 행 숨기기 |
      | 31 | `augmentModelCatalog` | 합성 forward-compat 행 |
      | 32 | `resolveThinkingProfile` | 모델별 `/think` 옵션 집합 |
      | 33 | `isBinaryThinking` | 바이너리 thinking 켜기/끄기 호환성 |
      | 34 | `supportsXHighThinking` | `xhigh` 추론 지원 호환성 |
      | 35 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성 |
      | 36 | `isModernModelRef` | 라이브/스모크 모델 일치 |
      | 37 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 38 | `resolveUsageAuth` | 사용자 정의 사용량 자격 증명 파싱 |
      | 39 | `fetchUsageSnapshot` | 사용자 정의 사용량 엔드포인트 |
      | 40 | `createEmbeddingProvider` | 메모리/검색용 provider 소유 임베딩 어댑터 |
      | 41 | `buildReplayPolicy` | 사용자 정의 트랜스크립트 replay/Compaction 정책 |
      | 42 | `sanitizeReplayHistory` | 일반 정리 후 provider 전용 replay 재작성 |
      | 43 | `validateReplayTurns` | 내장 실행기 전 엄격한 replay 턴 검증 |
      | 44 | `onModelSelected` | 선택 후 콜백(예: 텔레메트리) |

      프롬프트 튜닝 참고:

      - `resolveSystemPromptContribution`를 사용하면 provider가 모델 계열에 대해 캐시를 인식하는
        시스템 프롬프트 지침을 주입할 수 있습니다. 동작이 하나의 provider/모델
        계열에 속하고 안정적/동적 캐시 분할을 유지해야 한다면
        `before_prompt_build`보다 이를 우선 사용하세요.

      자세한 설명과 실제 예시는
      [Internals: Provider Runtime Hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    <a id="step-5-add-extra-capabilities"></a>
    provider Plugin은 텍스트 추론과 함께 음성, 실시간 전사, 실시간
    음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기,
    웹 검색도 등록할 수 있습니다:

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

    OpenClaw는 이를 **하이브리드 기능** Plugin으로 분류합니다. 이는
    회사 Plugin(벤더당 하나의 Plugin)에 권장되는 패턴입니다. 자세한 내용은
    [Internals: Capability Ownership](/ko/plugins/architecture#capability-ownership-model)를 참조하세요.

    비디오 생성의 경우 위에 표시된 모드 인식 기능 형태를 우선 사용하세요:
    `generate`, `imageToVideo`, `videoToVideo`. `maxInputImages`, `maxInputVideos`,
    `maxDurationSeconds` 같은 평면 집계 필드만으로는
    변환 모드 지원이나 비활성화된 모드를 깔끔하게 알리기에 충분하지 않습니다.

    스트리밍 STT provider에는 공유 WebSocket 도우미를 우선 사용하세요. 이 도우미는
    프록시 캡처, 재연결 백오프, 종료 플러시, 준비 핸드셰이크, 오디오
    대기열 처리, 종료 이벤트 진단을 provider 간에 일관되게 유지하면서,
    provider 코드는 업스트림 이벤트 매핑만 담당하도록 남겨둡니다.

    multipart 오디오를 POST하는 배치 STT provider는
    `openclaw/plugin-sdk/provider-http`의
    `buildAudioTranscriptionFormData(...)`를 provider HTTP 요청
    도우미와 함께 사용해야 합니다. form 도우미는 업로드 파일 이름을 정규화하며,
    여기에는 호환되는 전사 API를 위해 M4A 스타일 파일 이름이 필요한 AAC 업로드도 포함됩니다.

    음악 생성 provider도 동일한 패턴을 따라야 합니다:
    프롬프트 전용 생성에는 `generate`, 참조 이미지 기반
    생성에는 `edit`를 사용합니다. `maxInputImages`,
    `supportsLyrics`, `supportsFormat` 같은 평면 집계 필드만으로는 edit
    지원을 알리기에 충분하지 않으며, 명시적인 `generate` / `edit` 블록이
    기대되는 계약입니다.

  </Step>

  <Step title="테스트">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
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

## ClawHub에 게시

Provider Plugin은 다른 외부 코드 Plugin과 동일한 방식으로 게시됩니다:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

여기서는 레거시 skill 전용 게시 별칭을 사용하지 마세요. Plugin 패키지는
`clawhub package publish`를 사용해야 합니다.

## 파일 구조

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # provider auth metadata가 있는 Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 테스트
    └── usage.ts              # 사용량 엔드포인트(선택 사항)
```

## 카탈로그 순서 참조

`catalog.order`는 내장
provider와 비교해 카탈로그가 병합되는 시점을 제어합니다:

| 순서      | 시점          | 사용 사례                                      |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | 첫 번째 패스  | 일반 API 키 provider                          |
| `profile` | simple 이후   | 인증 프로필에 의해 게이트되는 provider         |
| `paired`  | profile 이후  | 여러 관련 항목을 합성                          |
| `late`    | 마지막 패스   | 기존 provider 재정의(충돌 시 우선)             |

## 다음 단계

- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — Plugin이 channel도 제공하는 경우
- [SDK Runtime](/ko/plugins/sdk-runtime) — `api.runtime` 도우미(TTS, 검색, 하위 에이전트)
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [Plugin Internals](/ko/plugins/architecture#provider-runtime-hooks) — Hook 세부 정보와 번들 예시
