---
read_when:
    - provider별 모델 설정 참조가 필요합니다
    - 모델 provider용 예시 구성이나 CLI 온보딩 명령이 필요합니다
summary: 모델 provider 개요와 예시 구성 + CLI 흐름
title: 모델 Providers
x-i18n:
    generated_at: "2026-04-22T04:21:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c195cf5eafe277212aefb82483fe5daa6705a7e6534cf3612e7b5b20ac67adb7
    source_path: concepts/model-providers.md
    workflow: 15
---

# 모델 providers

이 페이지는 **LLM/모델 providers**를 다룹니다(WhatsApp/Telegram 같은 채팅 채널이 아님).
모델 선택 규칙은 [/concepts/models](/ko/concepts/models)를 참고하세요.

## 빠른 규칙

- 모델 ref는 `provider/model` 형식을 사용합니다(예: `opencode/claude-opus-4-6`).
- `agents.defaults.models`를 설정하면 허용 목록이 됩니다.
- CLI 도우미: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- 대체 런타임 규칙, 쿨다운 프로브, 세션 재정의 영속성은
  [/concepts/model-failover](/ko/concepts/model-failover)에 문서화되어 있습니다.
- `models.providers.*.models[].contextWindow`는 네이티브 모델 메타데이터입니다.
  `models.providers.*.models[].contextTokens`는 유효 런타임 상한입니다.
- provider plugins는 `registerProvider({ catalog })`를 통해 모델 카탈로그를 주입할 수 있습니다.
  OpenClaw는 `models.json`을 쓰기 전에 그 출력을 `models.providers`에 병합합니다.
- provider manifest는 `providerAuthEnvVars`와
  `providerAuthAliases`를 선언할 수 있으므로, 일반적인 env 기반 인증 프로브와 provider 변형은
  plugin 런타임을 로드할 필요가 없습니다. 남아 있는 코어 env-var 맵은 이제
  비-plugin/코어 providers와 Anthropic API-key-first 온보딩 같은 일부 일반 우선순위 사례에만
  사용됩니다.
- provider plugins는 다음을 통해 provider 런타임 동작도 소유할 수 있습니다.
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, 그리고
  `onModelSelected`.
- 참고: provider 런타임 `capabilities`는 공유 runner 메타데이터입니다(provider
  계열, transcript/tooling 특이점, transport/cache 힌트). 이것은
  plugin이 무엇을 등록하는지 설명하는 [public capability model](/ko/plugins/architecture#public-capability-model)과
  동일하지 않습니다(텍스트 추론, 음성 등).
- 번들 `codex` provider는 번들 Codex 에이전트 하네스와 짝을 이룹니다.
  Codex 소유 로그인, 모델 검색, 네이티브 스레드 재개, 앱 서버 실행을 원할 때는
  `codex/gpt-*`를 사용하세요. 일반 `openai/gpt-*` ref는 계속 OpenAI provider와
  일반 OpenClaw provider transport를 사용합니다.
  Codex 전용 배포는
  `agents.defaults.embeddedHarness.fallback: "none"`으로 자동 PI 대체를 비활성화할 수 있습니다.
  자세한 내용은 [Codex Harness](/ko/plugins/codex-harness)를 참고하세요.

## Plugin 소유 provider 동작

provider plugins는 이제 대부분의 provider별 로직을 소유할 수 있고, OpenClaw는
일반 추론 루프를 유지합니다.

일반적인 분담:

- `auth[].run` / `auth[].runNonInteractive`: provider는 `openclaw onboard`, `openclaw models auth`, 헤드리스 설정을 위한 온보딩/로그인 흐름을 소유
- `wizard.setup` / `wizard.modelPicker`: provider는 인증 선택 라벨,
  레거시 별칭, 온보딩 허용 목록 힌트, 온보딩/모델 선택기의 설정 항목을 소유
- `catalog`: provider가 `models.providers`에 표시됨
- `normalizeModelId`: provider가 조회 또는 정규화 전에
  레거시/프리뷰 모델 ID를 정규화
- `normalizeTransport`: provider가 일반 모델 조립 전에 transport 계열의 `api` / `baseUrl`을 정규화합니다. OpenClaw는 먼저 일치하는 provider를 확인한 다음,
  transport를 실제로 변경하는 provider가 나올 때까지 다른 hook 지원 provider plugins를 확인합니다.
- `normalizeConfig`: provider가 런타임 사용 전에 `models.providers.<id>` 구성을 정규화합니다. OpenClaw는 먼저 일치하는 provider를 확인한 다음,
  구성을 실제로 변경하는 provider가 나올 때까지 다른 hook 지원 provider plugins를 확인합니다. 어떤
  provider hook도 구성을 다시 쓰지 않으면, 번들 Google 계열 도우미가 여전히 지원되는 Google provider 항목을 정규화합니다.
- `applyNativeStreamingUsageCompat`: provider가 구성 providers에 대해 엔드포인트 기반 네이티브 streaming-usage 호환성 재작성을 적용
- `resolveConfigApiKey`: provider가 전체 런타임 인증 로드를 강제하지 않고
  구성 providers의 env-marker 인증을 확인
  `amazon-bedrock`도 여기에 내장 AWS env-marker 확인기를 가지지만, Bedrock 런타임 인증은
  AWS SDK 기본 체인을 사용합니다.
- `resolveSyntheticAuth`: provider가 일반 텍스트 시크릿을 영속화하지 않고도
  로컬/셀프호스팅 또는 기타 구성 기반 인증 가용성을 노출할 수 있음
- `shouldDeferSyntheticProfileAuth`: provider가 저장된 synthetic profile
  플레이스홀더를 env/config 기반 인증보다 낮은 우선순위로 표시할 수 있음
- `resolveDynamicModel`: provider가 아직 로컬 정적 카탈로그에 없는 모델 ID를 수용
- `prepareDynamicModel`: provider가 동적 확인을 다시 시도하기 전에 메타데이터 새로 고침이 필요함
- `normalizeResolvedModel`: provider가 transport 또는 base URL 재작성이 필요함
- `contributeResolvedModelCompat`: provider가
  다른 호환 transport를 통해 도착하더라도 해당 vendor 모델에 대한 compat 플래그를 제공
- `capabilities`: provider가 transcript/tooling/provider-family 특이점을 게시
- `normalizeToolSchemas`: provider가 임베디드 runner가 보기 전에 도구 스키마를 정리
- `inspectToolSchemas`: provider가 정규화 후
  transport별 스키마 경고를 노출
- `resolveReasoningOutputMode`: provider가 네이티브 vs 태그 기반
  reasoning-output 계약을 선택
- `prepareExtraParams`: provider가 모델별 요청 매개변수를 기본 설정하거나 정규화
- `createStreamFn`: provider가 일반 스트림 경로를 완전히
  사용자 지정 transport로 대체
- `wrapStreamFn`: provider가 요청 헤더/본문/모델 compat 래퍼를 적용
- `resolveTransportTurnState`: provider가 턴별 네이티브 transport
  헤더 또는 메타데이터를 제공
- `resolveWebSocketSessionPolicy`: provider가 네이티브 WebSocket 세션
  헤더 또는 세션 쿨다운 정책을 제공
- `createEmbeddingProvider`: provider가
  코어 임베딩 스위치보드가 아니라 provider plugin에 속해야 하는 메모리 임베딩 동작을 소유
- `formatApiKey`: provider가 저장된 인증 프로필을 transport가 기대하는
  런타임 `apiKey` 문자열로 형식화
- `refreshOAuth`: 공유 `pi-ai`
  새로 고침 도구만으로 충분하지 않을 때 provider가 OAuth 새로 고침을 소유
- `buildAuthDoctorHint`: OAuth 새로 고침이 실패할 때 provider가 복구 지침을 추가
- `matchesContextOverflowError`: provider가 일반 휴리스틱으로 놓칠 수 있는
  provider별 context-window 초과 오류를 인식
- `classifyFailoverReason`: provider가 provider별 원시 transport/API
  오류를 rate limit 또는 overload 같은 대체 사유로 매핑
- `isCacheTtlEligible`: provider가 어떤 업스트림 모델 ID가 prompt-cache TTL을 지원하는지 결정
- `buildMissingAuthMessage`: provider가 일반 auth-store 오류를
  provider별 복구 힌트로 대체
- `suppressBuiltInModel`: provider가 오래된 업스트림 행을 숨기고 직접 확인 실패 시
  vendor 소유 오류를 반환할 수 있음
- `augmentModelCatalog`: provider가 검색 및 구성 병합 후
  synthetic/final 카탈로그 행을 추가
- `resolveThinkingProfile`: provider가 선택된 모델에 대한 정확한 `/think` 수준 집합,
  선택적 표시 라벨, 기본 수준을 소유
- `isBinaryThinking`: 이진 on/off thinking UX용 호환성 hook
- `supportsXHighThinking`: 선택된 `xhigh` 모델용 호환성 hook
- `resolveDefaultThinkingLevel`: 기본 `/think` 정책용 호환성 hook
- `applyConfigDefaults`: provider가 인증 모드, env 또는 모델 계열에 따라
  구성 구체화 중 provider별 전역 기본값을 적용
- `isModernModelRef`: provider가 라이브/스모크 선호 모델 매칭을 소유
- `prepareRuntimeAuth`: provider가 구성된 자격 증명을 수명이 짧은
  런타임 토큰으로 변환
- `resolveUsageAuth`: provider가 `/usage` 및 관련 상태/리포팅 표면에 대한
  사용량/할당량 자격 증명을 확인
- `fetchUsageSnapshot`: provider가 사용량 엔드포인트의 가져오기/파싱을 소유하고,
  코어는 여전히 요약 셸과 형식을 소유
- `onModelSelected`: provider가 텔레메트리나 provider 소유 세션 bookkeeping 같은
  선택 후 부수 효과를 실행

현재 번들 예시:

- `anthropic`: Claude 4.6 순방향 호환 대체, 인증 복구 힌트, 사용량
  엔드포인트 가져오기, cache-TTL/provider-family 메타데이터, 인증 인지 전역
  구성 기본값
- `amazon-bedrock`: Bedrock별 스로틀/준비 안 됨 오류에 대한 provider 소유
  context-overflow 매칭 및 대체 사유 분류, 그리고
  Anthropic 트래픽에서 Claude 전용 replay-policy
  가드를 위한 공유 `anthropic-by-model` 재생 계열
- `anthropic-vertex`: Anthropic-message
  트래픽에서 Claude 전용 replay-policy 가드
- `openrouter`: 통과형 모델 ID, 요청 래퍼, provider capability
  힌트, 프록시 Gemini 트래픽에서 Gemini thought-signature 정리, `openrouter-thinking` 스트림 계열을 통한 프록시
  reasoning 주입, 라우팅 메타데이터 전달, cache-TTL 정책
- `github-copilot`: 온보딩/디바이스 로그인, 순방향 호환 모델 대체,
  Claude-thinking transcript 힌트, 런타임 토큰 교환, 사용량 엔드포인트
  가져오기
- `openai`: GPT-5.4 순방향 호환 대체, 직접 OpenAI transport
  정규화, Codex 인지 missing-auth 힌트, Spark 억제, synthetic
  OpenAI/Codex 카탈로그 행, thinking/live-model 정책, 사용량 토큰 별칭
  정규화(`input` / `output` 및 `prompt` / `completion` 계열), 네이티브 OpenAI/Codex
  래퍼를 위한 공유 `openai-responses-defaults` 스트림 계열, provider-family 메타데이터,
  `gpt-image-2`용 번들 이미지 생성 provider 등록, 그리고 `sora-2`용 번들
  비디오 생성 provider 등록
- `google` 및 `google-gemini-cli`: Gemini 3.1 순방향 호환 대체,
  네이티브 Gemini 재생 검증, bootstrap 재생 정리, 태그 기반
  reasoning-output 모드, modern-model 매칭, Gemini image-preview 모델용 번들 이미지 생성
  provider 등록, 그리고 Veo 모델용 번들
  비디오 생성 provider 등록; Gemini CLI OAuth는 또한
  사용량 표면을 위한 auth-profile 토큰 형식화, usage-token 파싱, quota 엔드포인트
  가져오기를 소유
- `moonshot`: 공유 transport, plugin 소유 thinking payload 정규화
- `kilocode`: 공유 transport, plugin 소유 요청 헤더, reasoning payload
  정규화, 프록시-Gemini thought-signature 정리, cache-TTL
  정책
- `zai`: GLM-5 순방향 호환 대체, `tool_stream` 기본값, cache-TTL
  정책, 이진 thinking/live-model 정책, 사용량 인증 + quota 가져오기;
  알 수 없는 `glm-5*` ID는 번들 `glm-4.7` 템플릿에서 synthesize됩니다
- `xai`: 네이티브 Responses transport 정규화, Grok fast 변형용 `/fast` 별칭 재작성,
  기본 `tool_stream`, xAI 전용 tool-schema /
  reasoning-payload 정리, 그리고 `grok-imagine-video`용 번들 비디오 생성 provider
  등록
- `mistral`: plugin 소유 capability 메타데이터
- `opencode` 및 `opencode-go`: plugin 소유 capability 메타데이터와
  프록시-Gemini thought-signature 정리
- `alibaba`: `alibaba/wan2.6-t2v` 같은 직접 Wan 모델 ref용
  plugin 소유 비디오 생성 카탈로그
- `byteplus`: plugin 소유 카탈로그와 Seedance text-to-video/image-to-video 모델용
  번들 비디오 생성 provider
  등록
- `fal`: 호스팅된 서드파티용 번들 비디오 생성 provider 등록,
  FLUX 이미지 모델용 이미지 생성 provider 등록, 그리고 호스팅된 서드파티 비디오 모델용
  번들 비디오 생성 provider 등록
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, `volcengine`:
  plugin 소유 카탈로그만 제공
- `qwen`: 텍스트 모델용 plugin 소유 카탈로그와 멀티모달 표면용 공유
  media-understanding 및 비디오 생성 provider 등록;
  Qwen 비디오 생성은 `wan2.6-t2v` 및 `wan2.7-r2v` 같은 번들 Wan 모델과 함께
  표준 DashScope 비디오 엔드포인트를 사용합니다
- `runway`: `gen4.5` 같은 네이티브
  Runway 작업 기반 모델용 plugin 소유 비디오 생성 provider 등록
- `minimax`: plugin 소유 카탈로그, Hailuo 비디오 모델용 번들 비디오 생성 provider
  등록, `image-01`용 번들 이미지 생성 provider
  등록, 하이브리드 Anthropic/OpenAI replay-policy
  선택, 사용량 인증/스냅샷 로직
- `together`: plugin 소유 카탈로그와 Wan 비디오 모델용 번들 비디오 생성 provider
  등록
- `xiaomi`: plugin 소유 카탈로그와 사용량 인증/스냅샷 로직

번들 `openai` Plugin은 이제 두 provider ID를 모두 소유합니다: `openai`와
`openai-codex`.

여기까지는 여전히 OpenClaw의 일반 transport에 맞는 providers입니다. 완전히 사용자 지정된 요청 실행기가 필요한 provider는 별도의, 더 깊은 확장 표면입니다.

## API 키 순환

- 선택된 providers에 대해 일반 provider 순환을 지원합니다.
- 여러 키는 다음을 통해 구성합니다.
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(단일 라이브 재정의, 최고 우선순위)
  - `<PROVIDER>_API_KEYS`(쉼표 또는 세미콜론 목록)
  - `<PROVIDER>_API_KEY`(기본 키)
  - `<PROVIDER>_API_KEY_*`(번호 매겨진 목록, 예: `<PROVIDER>_API_KEY_1`)
- Google providers의 경우 `GOOGLE_API_KEY`도 대체 항목으로 포함됩니다.
- 키 선택 순서는 우선순위를 보존하고 값을 중복 제거합니다.
- 요청은 rate-limit 응답에서만 다음 키로 재시도됩니다(예:
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, 또는 주기적인 사용량 제한 메시지).
- rate-limit가 아닌 실패는 즉시 실패하며, 키 순환은 시도되지 않습니다.
- 모든 후보 키가 실패하면 마지막 시도의 최종 오류가 반환됩니다.

## 내장 providers(pi-ai 카탈로그)

OpenClaw는 pi‑ai 카탈로그와 함께 제공됩니다. 이 providers는
`models.providers` 구성이 **필요 없습니다**. 인증만 설정하고 모델을 선택하면 됩니다.

### OpenAI

- Provider: `openai`
- 인증: `OPENAI_API_KEY`
- 선택적 순환: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, 그리고 `OPENCLAW_LIVE_OPENAI_KEY`(단일 재정의)
- 예시 모델: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE 대체)
- 모델별 재정의: `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- OpenAI Responses WebSocket 워밍업은 `params.openaiWsWarmup` (`true`/`false`)를 통해 기본 활성화됩니다
- OpenAI priority processing은 `agents.defaults.models["openai/<model>"].params.serviceTier`를 통해 활성화할 수 있습니다
- `/fast` 및 `params.fastMode`는 직접 `openai/*` Responses 요청을 `api.openai.com`의 `service_tier=priority`로 매핑합니다
- 공유 `/fast` 토글 대신 명시적 계층을 원하면 `params.serviceTier`를 사용하세요
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`,
  `User-Agent`)는 일반 OpenAI 호환 프록시가 아니라 `api.openai.com`으로 가는 네이티브 OpenAI 트래픽에만 적용됩니다
- 네이티브 OpenAI 경로는 또한 Responses `store`, prompt-cache 힌트, OpenAI reasoning-compat 페이로드 형상을 유지하지만,
  프록시 경로는 그렇지 않습니다
- `openai/gpt-5.3-codex-spark`는 실제 OpenAI API가 이를 거부하므로 OpenClaw에서 의도적으로 숨겨집니다. Spark는 Codex 전용으로 처리됩니다

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- 인증: `ANTHROPIC_API_KEY`
- 선택적 순환: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, 그리고 `OPENCLAW_LIVE_ANTHROPIC_KEY`(단일 재정의)
- 예시 모델: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 직접 공개 Anthropic 요청은 `api.anthropic.com`으로 전송되는 API 키 및 OAuth 인증 트래픽을 포함하여 공유 `/fast` 토글과 `params.fastMode`도 지원합니다. OpenClaw는 이를 Anthropic `service_tier`(`auto` vs `standard_only`)로 매핑합니다
- Anthropic 참고: Anthropic 담당자가 OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려 왔으므로, Anthropic이 새로운 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해 Claude CLI 재사용 및 `claude -p` 사용을 허용된 것으로 간주합니다.
- Anthropic setup-token은 계속 지원되는 OpenClaw 토큰 경로로 제공되지만, OpenClaw는 이제 가능할 때 Claude CLI 재사용과 `claude -p`를 우선합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code(Codex)

- Provider: `openai-codex`
- 인증: OAuth(ChatGPT)
- 예시 모델: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` 또는 `openclaw models auth login --provider openai-codex`
- 기본 transport는 `auto`입니다(WebSocket 우선, SSE 대체)
- 모델별 재정의: `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, 또는 `"auto"`)
- `params.serviceTier`도 네이티브 Codex Responses 요청(`chatgpt.com/backend-api`)에서 전달됩니다
- 숨겨진 OpenClaw attribution 헤더(`originator`, `version`,
  `User-Agent`)는 일반 OpenAI 호환 프록시가 아니라 `chatgpt.com/backend-api`로 가는 네이티브 Codex 트래픽에만 첨부됩니다
- 직접 `openai/*`와 동일한 `/fast` 토글 및 `params.fastMode` 구성을 공유하며, OpenClaw는 이를 `service_tier=priority`로 매핑합니다
- `openai-codex/gpt-5.3-codex-spark`는 Codex OAuth 카탈로그가 이를 노출할 때 계속 사용할 수 있습니다. entitlement에 따라 달라집니다
- `openai-codex/gpt-5.4`는 네이티브 `contextWindow = 1050000`과 기본 런타임 `contextTokens = 272000`을 유지합니다. 런타임 상한은 `models.providers.openai-codex.models[].contextTokens`로 재정의하세요
- 정책 참고: OpenAI Codex OAuth는 OpenClaw 같은 외부 도구/워크플로에 대해 명시적으로 지원됩니다.

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

### 기타 구독형 호스팅 옵션

- [Qwen Cloud](/ko/providers/qwen): Qwen Cloud provider 표면과 Alibaba DashScope 및 Coding Plan 엔드포인트 매핑
- [MiniMax](/ko/providers/minimax): MiniMax Coding Plan OAuth 또는 API 키 액세스
- [GLM Models](/ko/providers/glm): Z.AI Coding Plan 또는 일반 API 엔드포인트

### OpenCode

- 인증: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)
- Zen 런타임 provider: `opencode`
- Go 런타임 provider: `opencode-go`
- 예시 모델: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` 또는 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini(API 키)

- Provider: `google`
- 인증: `GEMINI_API_KEY`
- 선택적 순환: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` 대체, 그리고 `OPENCLAW_LIVE_GEMINI_KEY`(단일 재정의)
- 예시 모델: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 호환성: `google/gemini-3.1-flash-preview`를 사용하는 레거시 OpenClaw 구성은 `google/gemini-3-flash-preview`로 정규화됩니다
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 직접 Gemini 실행은 또한 `agents.defaults.models["google/<model>"].params.cachedContent`
  (또는 레거시 `cached_content`)를 받아 provider 네이티브
  `cachedContents/...` 핸들을 전달합니다. Gemini 캐시 적중은 OpenClaw `cacheRead`로 표시됩니다

### Google Vertex 및 Gemini CLI

- Providers: `google-vertex`, `google-gemini-cli`
- 인증: Vertex는 gcloud ADC를 사용하고, Gemini CLI는 자체 OAuth 흐름을 사용합니다
- 주의: OpenClaw의 Gemini CLI OAuth는 비공식 통합입니다. 일부 사용자는 서드파티 클라이언트 사용 후 Google 계정 제한을 보고했습니다. 진행하기로 선택한 경우 Google 약관을 검토하고 중요하지 않은 계정을 사용하세요.
- Gemini CLI OAuth는 번들 `google` Plugin의 일부로 제공됩니다.
  - 먼저 Gemini CLI를 설치합니다.
    - `brew install gemini-cli`
    - 또는 `npm install -g @google/gemini-cli`
  - 활성화: `openclaw plugins enable google`
  - 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
  - 참고: `openclaw.json`에 client id 또는 secret을 붙여넣지 **않습니다**. CLI 로그인 흐름은
    Gateway 호스트의 인증 프로필에 토큰을 저장합니다.
  - 로그인 후 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는 `GOOGLE_CLOUD_PROJECT_ID`를 설정하세요.
  - Gemini CLI JSON 응답은 `response`에서 파싱되며, 사용량은
    `stats`로 대체되고, `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.

### Z.AI (GLM)

- Provider: `zai`
- 인증: `ZAI_API_KEY`
- 예시 모델: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 별칭: `z.ai/*` 및 `z-ai/*`는 `zai/*`로 정규화됩니다
  - `zai-api-key`는 일치하는 Z.AI 엔드포인트를 자동 감지합니다. `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`은 특정 표면을 강제합니다

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- 예시 모델: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- 인증: `KILOCODE_API_KEY`
- 예시 모델: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- 기본 URL: `https://api.kilo.ai/api/gateway/`
- 정적 대체 카탈로그는 `kilocode/kilo/auto`와 함께 제공되며, 라이브
  `https://api.kilo.ai/api/gateway/models` 검색은 런타임
  카탈로그를 더 확장할 수 있습니다.
- `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 Kilo Gateway가 소유하며,
  OpenClaw에 하드코딩되어 있지 않습니다.

설정 세부 정보는 [/providers/kilocode](/ko/providers/kilocode)를 참고하세요.

### 기타 번들 provider plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- 예시 모델: `openrouter/auto`, `openrouter/moonshotai/kimi-k2.6`
- OpenClaw는 요청이 실제로 `openrouter.ai`를 대상으로 할 때만
  OpenRouter의 문서화된 앱 attribution 헤더를 적용합니다
- OpenRouter 전용 Anthropic `cache_control` 마커도
  임의 프록시 URL이 아니라 검증된 OpenRouter 경로에서만 적용됩니다
- OpenRouter는 프록시 스타일 OpenAI 호환 경로에 머무르므로, 네이티브
  OpenAI 전용 요청 형상화(`serviceTier`, Responses `store`,
  prompt-cache 힌트, OpenAI reasoning-compat 페이로드)는 전달되지 않습니다
- Gemini 기반 OpenRouter ref는 프록시-Gemini thought-signature 정리만 유지하며,
  네이티브 Gemini 재생 검증과 bootstrap 재작성은 비활성 상태로 유지됩니다
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- 예시 모델: `kilocode/kilo/auto`
- Gemini 기반 Kilo ref는 동일한 프록시-Gemini thought-signature
  정리 경로를 유지합니다. `kilocode/kilo/auto` 및 기타 프록시-reasoning-unsupported
  힌트는 프록시 reasoning 주입을 건너뜁니다
- MiniMax: `minimax`(API 키) 및 `minimax-portal`(OAuth)
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는 `MINIMAX_API_KEY`
- 예시 모델: `minimax/MiniMax-M2.7` 또는 `minimax-portal/MiniMax-M2.7`
- MiniMax 온보딩/API 키 설정은
  `input: ["text", "image"]`가 포함된 명시적 M2.7 모델 정의를 작성합니다. 번들 provider 카탈로그는
  해당 provider 구성이 구체화될 때까지 채팅 ref를
  텍스트 전용으로 유지합니다
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- 예시 모델: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` 또는 `KIMICODE_API_KEY`)
- 예시 모델: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- 예시 모델: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY`, 또는 `DASHSCOPE_API_KEY`)
- 예시 모델: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- 예시 모델: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- 예시 모델: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- 예시 모델: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- 예시 모델: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- 예시 모델: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- 예시 모델: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - 네이티브 번들 xAI 요청은 xAI Responses 경로를 사용합니다
  - `/fast` 또는 `params.fastMode: true`는 `grok-3`, `grok-3-mini`,
    `grok-4`, `grok-4-0709`를 해당 `*-fast` 변형으로 재작성합니다
  - `tool_stream`은 기본적으로 켜져 있습니다. 비활성화하려면
    `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로
    설정하세요
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- 예시 모델: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras의 GLM 모델은 `zai-glm-4.7` 및 `zai-glm-4.6` ID를 사용합니다.
  - OpenAI 호환 기본 URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference 예시 모델: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. 자세한 내용은 [Hugging Face (Inference)](/ko/providers/huggingface)를 참고하세요.

## `models.providers`를 통한 providers(사용자 지정/기본 URL)

`models.providers`(또는 `models.json`)를 사용해 **사용자 지정** providers 또는
OpenAI/Anthropic 호환 프록시를 추가합니다.

아래 번들 provider plugins 중 다수는 이미 기본 카탈로그를 게시합니다.
기본 base URL, 헤더 또는 모델 목록을 재정의하려는 경우에만
명시적인 `models.providers.<id>` 항목을 사용하세요.

### Moonshot AI (Kimi)

Moonshot은 번들 provider Plugin으로 제공됩니다. 기본적으로 내장 provider를 사용하고,
base URL 또는 모델 메타데이터를 재정의해야 할 때만 명시적인 `models.providers.moonshot` 항목을 추가하세요.

- Provider: `moonshot`
- 인증: `MOONSHOT_API_KEY`
- 예시 모델: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 모델 ID:

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

Kimi Coding은 Moonshot AI의 Anthropic 호환 엔드포인트를 사용합니다.

- Provider: `kimi`
- 인증: `KIMI_API_KEY`
- 예시 모델: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

기존 `kimi/k2p5`는 계속 호환 모델 ID로 허용됩니다.

### Volcano Engine (Doubao)

Volcano Engine(화산 엔진, 火山引擎)은 중국에서 Doubao 및 기타 모델에 대한 액세스를 제공합니다.

- Provider: `volcengine`(코딩: `volcengine-plan`)
- 인증: `VOLCANO_ENGINE_API_KEY`
- 예시 모델: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `volcengine/*`
카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 Volcengine 인증 선택은 둘 다
`volcengine/*` 및 `volcengine-plan/*` 행을 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 비어 있는 provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

사용 가능한 모델:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

코딩 모델(`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus(국제)

BytePlus ARK는 국제 사용자를 위해 Volcano Engine과 동일한 모델에 대한 액세스를 제공합니다.

- Provider: `byteplus`(코딩: `byteplus-plan`)
- 인증: `BYTEPLUS_API_KEY`
- 예시 모델: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

온보딩은 기본적으로 코딩 표면을 사용하지만, 일반 `byteplus/*`
카탈로그도 동시에 등록됩니다.

온보딩/구성 모델 선택기에서 BytePlus 인증 선택은 둘 다
`byteplus/*` 및 `byteplus-plan/*` 행을 우선합니다. 해당 모델이 아직 로드되지 않은 경우,
OpenClaw는 비어 있는 provider 범위 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

사용 가능한 모델:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

코딩 모델(`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic는 `synthetic` provider 뒤에서 Anthropic 호환 모델을 제공합니다.

- Provider: `synthetic`
- 인증: `SYNTHETIC_API_KEY`
- 예시 모델: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax는 사용자 지정 엔드포인트를 사용하므로 `models.providers`를 통해 구성됩니다.

- MiniMax OAuth(글로벌): `--auth-choice minimax-global-oauth`
- MiniMax OAuth(CN): `--auth-choice minimax-cn-oauth`
- MiniMax API 키(글로벌): `--auth-choice minimax-global-api`
- MiniMax API 키(CN): `--auth-choice minimax-cn-api`
- 인증: `minimax`에는 `MINIMAX_API_KEY`, `minimax-portal`에는 `MINIMAX_OAUTH_TOKEN` 또는
  `MINIMAX_API_KEY`

설정 세부 정보, 모델 옵션, 구성 스니펫은 [/providers/minimax](/ko/providers/minimax)를 참고하세요.

MiniMax의 Anthropic 호환 스트리밍 경로에서 OpenClaw는
명시적으로 설정하지 않는 한 기본적으로 thinking을 비활성화하며, `/fast on`은
`MiniMax-M2.7`을 `MiniMax-M2.7-highspeed`로 재작성합니다.

Plugin 소유 capability 분리:

- 텍스트/채팅 기본값은 `minimax/MiniMax-M2.7`에 유지됩니다
- 이미지 생성은 `minimax/image-01` 또는 `minimax-portal/image-01`입니다
- 이미지 이해는 두 MiniMax 인증 경로 모두에서 plugin 소유 `MiniMax-VL-01`입니다
- 웹 검색은 provider ID `minimax`에 유지됩니다

### LM Studio

LM Studio는 네이티브 API를 사용하는 번들 provider Plugin으로 제공됩니다.

- Provider: `lmstudio`
- 인증: `LM_API_TOKEN`
- 기본 추론 base URL: `http://localhost:1234/v1`

그런 다음 모델을 설정합니다(`http://localhost:1234/api/v1/models`가 반환한 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw는 검색 + 자동 로드를 위해 LM Studio의 네이티브 `/api/v1/models` 및 `/api/v1/models/load`를 사용하고, 기본적으로 추론에는 `/v1/chat/completions`를 사용합니다.
설정 및 문제 해결은 [/providers/lmstudio](/ko/providers/lmstudio)를 참고하세요.

### Ollama

Ollama는 번들 provider Plugin으로 제공되며 Ollama의 네이티브 API를 사용합니다.

- Provider: `ollama`
- 인증: 필요 없음(로컬 서버)
- 예시 모델: `ollama/llama3.3`
- 설치: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama를 설치한 다음 모델을 가져옵니다.
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama는 `OLLAMA_API_KEY`로 opt in하면 로컬의 `http://127.0.0.1:11434`에서 감지되며,
번들 provider Plugin은 Ollama를 `openclaw onboard`와 모델 선택기에 직접 추가합니다. 온보딩, 클라우드/로컬 모드, 사용자 지정 구성은 [/providers/ollama](/ko/providers/ollama)를 참고하세요.

### vLLM

vLLM은 로컬/셀프호스팅 OpenAI 호환
서버용 번들 provider Plugin으로 제공됩니다.

- Provider: `vllm`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:8000/v1`

로컬에서 자동 검색을 사용하려면 opt in합니다(서버가 인증을 강제하지 않으면 아무 값이나 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환한 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/vllm](/ko/providers/vllm)를 참고하세요.

### SGLang

SGLang은 빠른 셀프호스팅용
OpenAI 호환 서버를 위한 번들 provider Plugin으로 제공됩니다.

- Provider: `sglang`
- 인증: 선택 사항(서버에 따라 다름)
- 기본 base URL: `http://127.0.0.1:30000/v1`

로컬에서 자동 검색을 사용하려면 opt in합니다(서버가 인증을
강제하지 않으면 아무 값이나 가능):

```bash
export SGLANG_API_KEY="sglang-local"
```

그런 다음 모델을 설정합니다(`/v1/models`가 반환한 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

자세한 내용은 [/providers/sglang](/ko/providers/sglang)를 참고하세요.

### 로컬 프록시(LM Studio, vLLM, LiteLLM 등)

예시(OpenAI 호환):

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

참고:

- 사용자 지정 providers의 경우 `reasoning`, `input`, `cost`, `contextWindow`, `maxTokens`는 선택 사항입니다.
  생략하면 OpenClaw는 기본적으로 다음 값을 사용합니다.
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 권장: 프록시/모델 제한과 일치하는 명시적 값을 설정하세요.
- 네이티브가 아닌 엔드포인트의 `api: "openai-completions"`(호스트가 `api.openai.com`이 아닌 비어 있지 않은 `baseUrl`)의 경우, OpenClaw는 지원되지 않는 `developer` 역할에 대한 provider 400 오류를 피하기 위해 `compat.supportsDeveloperRole: false`를 강제합니다.
- 프록시 스타일 OpenAI 호환 경로도 네이티브 OpenAI 전용 요청
  형상화를 건너뜁니다. 즉 `service_tier`, Responses `store`, prompt-cache 힌트,
  OpenAI reasoning-compat 페이로드 형상화, 숨겨진 OpenClaw attribution
  헤더가 없습니다.
- `baseUrl`이 비어 있거나 생략되면 OpenClaw는 기본 OpenAI 동작을 유지합니다(`api.openai.com`으로 확인됨).
- 안전을 위해, 비네이티브 `openai-completions` 엔드포인트에서는 명시적인 `compat.supportsDeveloperRole: true`도 여전히 재정의됩니다.

## CLI 예시

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

참고: 전체 구성 예시는 [/gateway/configuration](/ko/gateway/configuration)를 확인하세요.

## 관련

- [Models](/ko/concepts/models) — 모델 구성 및 별칭
- [Model Failover](/ko/concepts/model-failover) — 대체 체인 및 재시도 동작
- [Configuration Reference](/ko/gateway/configuration-reference#agent-defaults) — 모델 구성 키
- [Providers](/ko/providers) — provider별 설정 가이드
