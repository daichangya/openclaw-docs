---
read_when:
    - 어느 SDK 하위 경로에서 import해야 하는지 알아야 함
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요함
    - 특정 SDK export를 찾고 있음
sidebarTitle: SDK Overview
summary: import 맵, 등록 API 참조, 그리고 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-21T06:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK 개요

Plugin SDK는 Plugin과 코어 사이의 타입 지정 계약입니다. 이 페이지는
**무엇을 import할지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  **방법 안내를 찾고 있나요?**
  - 첫 Plugin이라면 [Getting Started](/ko/plugins/building-plugins)부터 시작하세요
  - 채널 Plugin이라면 [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참고하세요
  - provider Plugin이라면 [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참고하세요
</Tip>

## import 규칙

항상 특정 하위 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도를 빠르게 유지하고
순환 의존성 문제를 방지할 수 있습니다. 채널별 엔트리/빌드 헬퍼에는
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 넓은 umbrella surface와
`buildChannelConfigSchema` 같은 공유 헬퍼에는 `openclaw/plugin-sdk/core`를 유지하세요.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` 같은
provider 이름 기반 편의 seam이나
채널 브랜드 헬퍼 seam을 추가하거나 이에 의존하지 마세요. 번들 Plugin은
자체 `api.ts` 또는 `runtime-api.ts` barrel 안에서 일반적인
SDK 하위 경로를 조합해야 하며, 코어는 이러한 Plugin 로컬 barrel을 사용하거나
필요가 정말 cross-channel일 때만 좁은 일반 SDK
contract를 추가해야 합니다.

생성된 export 맵에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, 그리고 `plugin-sdk/matrix*` 같은
소수의 번들 Plugin 헬퍼 seam이 포함되어 있습니다. 이러한
하위 경로는 번들 Plugin 유지 관리와 호환성 전용이며, 의도적으로 아래의 일반 표에서는 제외되었고
새로운 서드파티 Plugin에 권장되는 import 경로가 아닙니다.

## 하위 경로 참조

가장 자주 사용되는 하위 경로를 목적별로 그룹화했습니다. 생성된 전체
200개 이상의 하위 경로 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

예약된 번들 Plugin 헬퍼 하위 경로는 여전히 그 생성된 목록에 나타납니다.
문서 페이지에서 공개용으로 명시적으로 권장하지 않는 한, 이를 구현 세부 사항/호환성 surface로 취급하세요.

### Plugin 엔트리

| 하위 경로 | 주요 export |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry` | `definePluginEntry` |
| `plugin-sdk/core` | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |

<AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 setup wizard 헬퍼, allowlist 프롬프트, setup 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 account 구성/action-gate 헬퍼, 기본 account fallback 헬퍼 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 헬퍼 |
    | `plugin-sdk/account-resolution` | account 조회 + 기본 fallback 헬퍼 |
    | `plugin-sdk/account-helpers` | 좁은 범위의 account-list/account-action 헬퍼 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 채널 구성 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 contract fallback이 포함된 Telegram custom-command 정규화/검증 헬퍼 |
    | `plugin-sdk/command-gating` | 좁은 범위의 명령 권한 게이트 헬퍼 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 공유 수신 route + envelope 빌더 헬퍼 |
    | `plugin-sdk/inbound-reply-dispatch` | 공유 수신 기록 및 dispatch 헬퍼 |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 헬퍼 |
    | `plugin-sdk/outbound-media` | 공유 발신 미디어 로딩 헬퍼 |
    | `plugin-sdk/outbound-runtime` | 발신 identity, send delegate, payload 계획 헬퍼 |
    | `plugin-sdk/poll-runtime` | 좁은 범위의 poll 정규화 헬퍼 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 adapter 헬퍼 |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 payload 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 헬퍼 |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 구성 스냅샷 헬퍼 |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 헬퍼 |
    | `plugin-sdk/channel-status` | 공유 채널 상태 스냅샷/요약 헬퍼 |
    | `plugin-sdk/channel-config-primitives` | 좁은 범위의 채널 구성 스키마 기본 요소 |
    | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 권한 부여 헬퍼 |
    | `plugin-sdk/channel-plugin-common` | 공유 채널 Plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist 구성 편집/읽기 헬퍼 |
    | `plugin-sdk/group-access` | 공유 그룹 접근 결정 헬퍼 |
    | `plugin-sdk/direct-dm` | 공유 direct-DM 인증/가드 헬퍼 |
    | `plugin-sdk/interactive-runtime` | 대화형 응답 payload 정규화/축소 헬퍼 |
    | `plugin-sdk/channel-inbound` | 수신 debounce, mention 매칭, mention-policy 헬퍼, envelope 헬퍼용 호환성 barrel |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 수신 런타임 surface 없이 좁은 범위의 mention-policy 헬퍼 |
    | `plugin-sdk/channel-location` | 채널 위치 컨텍스트 및 포맷팅 헬퍼 |
    | `plugin-sdk/channel-logging` | 수신 drop 및 typing/ack 실패용 채널 로깅 헬퍼 |
    | `plugin-sdk/channel-send-result` | 응답 결과 타입 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 헬퍼 |
    | `plugin-sdk/channel-contract` | 채널 contract 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, 그리고 secret 대상 타입 같은 좁은 범위의 secret-contract 헬퍼 |
  </Accordion>

  <Accordion title="provider 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 선별된 로컬/셀프 호스팅 provider setup 헬퍼 |
    | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 셀프 호스팅 provider setup 헬퍼 |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin용 런타임 API 키 해석 헬퍼 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/profile-write 헬퍼 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result 빌더 |
    | `plugin-sdk/provider-auth-login` | provider Plugin용 공유 대화형 로그인 헬퍼 |
    | `plugin-sdk/provider-env-vars` | provider 인증 env-var 조회 헬퍼 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, provider-endpoint 헬퍼, 그리고 `normalizeNativeXaiModelId` 같은 model-id 정규화 헬퍼 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반 provider HTTP/엔드포인트 capability 헬퍼 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`, `WebFetchProviderPlugin` 같은 좁은 범위의 web-fetch 구성/선택 contract 헬퍼 |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 등록/캐시 헬퍼 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 wiring이 필요하지 않은 provider용 좁은 범위의 web-search 구성/자격 증명 헬퍼 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 그리고 범위 지정된 자격 증명 setter/getter 같은 좁은 범위의 web-search 구성/자격 증명 contract 헬퍼 |
    | `plugin-sdk/provider-web-search` | web-search provider 등록/캐시/런타임 헬퍼 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 헬퍼 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 그리고 공유 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 provider 전송 헬퍼 |
    | `plugin-sdk/provider-onboard` | 온보딩 구성 패치 헬퍼 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache 헬퍼 |
  </Accordion>

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 명령 레지스트리 헬퍼, 발신자 권한 부여 헬퍼 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`, `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 동일 채팅 action-auth 헬퍼 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 profile/filter 헬퍼 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 capability/delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 gateway-resolution 헬퍼 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 채널 엔트리포인트용 경량 네이티브 승인 adapter 로딩 헬퍼 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 handler 런타임 헬퍼; 좁은 adapter/gateway seam으로 충분하면 그것을 우선 사용 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + account-binding 헬퍼 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 응답 payload 헬퍼 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증 + 네이티브 session-target 헬퍼 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 헬퍼 |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 surface 헬퍼 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin secret surface용 좁은 범위의 secret-contract 수집 헬퍼 |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/구성 파싱용 좁은 범위의 `coerceSecretRef` 및 SecretRef 타입 헬퍼 |
    | `plugin-sdk/security-runtime` | 공유 trust, DM gating, 외부 콘텐츠, secret 수집 헬퍼 |
    | `plugin-sdk/ssrf-policy` | 호스트 allowlist 및 사설 네트워크 SSRF 정책 헬퍼 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 infra 런타임 surface 없이 좁은 pinned-dispatcher 헬퍼 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF 정책 헬퍼 |
    | `plugin-sdk/secret-input` | secret 입력 파싱 헬퍼 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 헬퍼 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/시간 초과 헬퍼 |
  </Accordion>

  <Accordion title="런타임 및 저장소 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/runtime` | 넓은 범위의 런타임/로깅/백업/Plugin 설치 헬퍼 |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env, 로거, 시간 초과, 재시도, backoff 헬퍼 |
    | `plugin-sdk/channel-runtime-context` | 일반 채널 런타임 컨텍스트 등록 및 조회 헬퍼 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 Plugin 명령/hook/http/대화형 헬퍼 |
    | `plugin-sdk/hook-runtime` | 공유 Webhook/내부 hook 파이프라인 헬퍼 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 import/바인딩 헬퍼 |
    | `plugin-sdk/process-runtime` | 프로세스 exec 헬퍼 |
    | `plugin-sdk/cli-runtime` | CLI 포맷팅, 대기, 버전 헬퍼 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 채널 상태 패치 헬퍼 |
    | `plugin-sdk/config-runtime` | 구성 로드/쓰기 헬퍼 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram contract surface를 사용할 수 없을 때도 Telegram 명령 이름/설명 정규화 및 중복/충돌 점검 |
    | `plugin-sdk/text-autolink-runtime` | 넓은 text-runtime barrel 없이 파일 참조 autolink 감지 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 헬퍼, 승인 capability 빌더, 인증/profile 헬퍼, 네이티브 라우팅/런타임 헬퍼 |
    | `plugin-sdk/reply-runtime` | 공유 수신/응답 런타임 헬퍼, 청킹, dispatch, Heartbeat, 응답 planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 응답 dispatch/finalize 헬퍼 |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공유 단기 창 응답 기록 헬퍼 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 텍스트/Markdown 청킹 헬퍼 |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at 헬퍼 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 헬퍼 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account 바인딩 헬퍼 |
    | `plugin-sdk/status-helpers` | 공유 채널/account 상태 요약 헬퍼, 런타임 상태 기본값, 문제 메타데이터 헬퍼 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 resolver 헬퍼 |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 헬퍼 |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | stdout/stderr 결과를 정규화하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 파라미터 리더 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 payload 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 정식 send 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 헬퍼 |
    | `plugin-sdk/logging-core` | 하위 시스템 로거 및 민감 정보 제거 헬퍼 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 표 모드 헬퍼 |
    | `plugin-sdk/json-store` | 소규모 JSON 상태 읽기/쓰기 헬퍼 |
    | `plugin-sdk/file-lock` | 재진입 가능한 파일 잠금 헬퍼 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 dedupe 캐시 헬퍼 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 reply-dispatch 헬퍼 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 import 없이 읽기 전용 ACP 바인딩 해석 |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 에이전트 런타임 구성 스키마 기본 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 boolean 파라미터 리더 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 헬퍼 |
    | `plugin-sdk/device-bootstrap` | 디바이스 bootstrap 및 페어링 토큰 헬퍼 |
    | `plugin-sdk/extension-shared` | 공유 passive-channel, 상태, ambient proxy 헬퍼 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/provider 응답 헬퍼 |
    | `plugin-sdk/skill-commands-runtime` | Skills 명령 목록 헬퍼 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/build/serialize 헬퍼 |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 하네스용 실험적 trusted-Plugin surface: 하네스 타입, 활성 실행 steer/abort 헬퍼, OpenClaw 도구 브리지 헬퍼, 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 엔드포인트 감지 헬퍼 |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/Heartbeat 헬퍼 |
    | `plugin-sdk/collection-runtime` | 소규모 bounded cache 헬퍼 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 헬퍼 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 포맷팅, 공유 오류 분류 헬퍼, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, pinned lookup 헬퍼 |
    | `plugin-sdk/runtime-fetch` | 프록시/guarded-fetch import 없이 dispatcher 인지형 런타임 fetch |
    | `plugin-sdk/response-limit-runtime` | 넓은 media 런타임 surface 없이 bounded 응답 본문 리더 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 페어링 저장소 없이 현재 대화 바인딩 상태 |
    | `plugin-sdk/session-store-runtime` | 넓은 구성 쓰기/유지 관리 import 없이 세션 저장소 읽기 헬퍼 |
    | `plugin-sdk/context-visibility-runtime` | 넓은 구성/보안 import 없이 컨텍스트 가시성 해석 및 보조 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | Markdown/로깅 import 없이 좁은 범위의 primitive record/string 강제 변환 및 정규화 헬퍼 |
    | `plugin-sdk/host-runtime` | 호스트명 및 SCP 호스트 정규화 헬퍼 |
    | `plugin-sdk/retry-runtime` | 재시도 구성 및 재시도 실행기 헬퍼 |
    | `plugin-sdk/agent-runtime` | 에이전트 디렉터리/identity/워크스페이스 헬퍼 |
    | `plugin-sdk/directory-runtime` | 구성 기반 디렉터리 조회/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="capability 및 테스트 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공유 미디어 fetch/transform/store 헬퍼와 미디어 payload 빌더 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 failover 헬퍼, candidate 선택, 누락된 모델 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 provider 타입과 provider 대상 이미지/오디오 헬퍼 export |
    | `plugin-sdk/text-runtime` | assistant 표시 텍스트 제거, Markdown 렌더링/청킹/표 헬퍼, 민감 정보 제거 헬퍼, directive-tag 헬퍼, safe-text 유틸리티 같은 공유 텍스트/Markdown/로깅 헬퍼 |
    | `plugin-sdk/text-chunking` | 발신 텍스트 청킹 헬퍼 |
    | `plugin-sdk/speech` | 음성 provider 타입과 provider 대상 directive, 레지스트리, 검증 헬퍼 |
    | `plugin-sdk/speech-core` | 공유 음성 provider 타입, 레지스트리, directive, 정규화 헬퍼 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 provider 타입 및 레지스트리 헬퍼 |
    | `plugin-sdk/realtime-voice` | 실시간 음성 provider 타입 및 레지스트리 헬퍼 |
    | `plugin-sdk/image-generation` | 이미지 생성 provider 타입 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, failover, 인증, 레지스트리 헬퍼 |
    | `plugin-sdk/music-generation` | 음악 생성 provider/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 provider/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 비디오 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 route-install 헬퍼 |
    | `plugin-sdk/webhook-path` | Webhook 경로 정규화 헬퍼 |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 헬퍼 |
    | `plugin-sdk/zod` | Plugin SDK 소비자를 위한 재export된 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI 헬퍼를 위한 번들 memory-core 헬퍼 surface |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 contract, 레지스트리 접근, 로컬 provider, 일반 배치/원격 헬퍼 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 export |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 export |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 헬퍼 |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 헬퍼 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 헬퍼에 대한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 헬퍼에 대한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 헬퍼에 대한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin용 공유 managed-Markdown 헬퍼 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근용 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 헬퍼에 대한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 surface |
  </Accordion>

  <Accordion title="예약된 번들 헬퍼 하위 경로">
    | 패밀리 | 현재 하위 경로 | 의도된 용도 |
    | --- | --- | --- |
    | 브라우저 | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 브라우저 Plugin 지원 헬퍼 (`browser-support`는 호환성 barrel로 유지됨) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix 헬퍼/런타임 surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE 헬퍼/런타임 surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC 헬퍼 surface |
    | 채널별 헬퍼 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 채널 호환성/헬퍼 seam |
    | 인증/Plugin별 헬퍼 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/Plugin 헬퍼 seam; 현재 `plugin-sdk/github-copilot-token`은 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export함 |
  </Accordion>
</AccordionGroup>

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### capability 등록

| 메서드 | 등록하는 항목 |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)` | 텍스트 추론(LLM) |
| `api.registerAgentHarness(...)` | 실험적 저수준 에이전트 실행기 |
| `api.registerCliBackend(...)` | 로컬 CLI 추론 백엔드 |
| `api.registerChannel(...)` | 메시징 채널 |
| `api.registerSpeechProvider(...)` | 텍스트 음성 변환 / STT 합성 |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사 |
| `api.registerRealtimeVoiceProvider(...)` | 양방향 실시간 음성 세션 |
| `api.registerMediaUnderstandingProvider(...)` | 이미지/오디오/비디오 분석 |
| `api.registerImageGenerationProvider(...)` | 이미지 생성 |
| `api.registerMusicGenerationProvider(...)` | 음악 생성 |
| `api.registerVideoGenerationProvider(...)` | 비디오 생성 |
| `api.registerWebFetchProvider(...)` | 웹 fetch / 스크레이프 provider |
| `api.registerWebSearchProvider(...)` | 웹 검색 |

### 도구 및 명령

| 메서드 | 등록하는 항목 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | 에이전트 도구(필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)` | custom 명령(LLM 우회) |

### 인프라

| 메서드 | 등록하는 항목 |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)` | 이벤트 hook |
| `api.registerHttpRoute(params)` | Gateway HTTP 엔드포인트 |
| `api.registerGatewayMethod(name, handler)` | Gateway RPC 메서드 |
| `api.registerCli(registrar, opts?)` | CLI 하위 명령 |
| `api.registerService(service)` | 백그라운드 서비스 |
| `api.registerInteractiveHandler(registration)` | 대화형 handler |
| `api.registerMemoryPromptSupplement(builder)` | 추가형 메모리 인접 프롬프트 섹션 |
| `api.registerMemoryCorpusSupplement(adapter)` | 추가형 메모리 검색/읽기 corpus |

예약된 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 Plugin이 더 좁은 Gateway 메서드 범위를 할당하려 해도 항상
`operator.admin`으로 유지됩니다. Plugin 소유 메서드에는
Plugin별 접두사를 사용하는 것이 좋습니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유하는 명시적 명령 루트
- `descriptors`: 루트 CLI 도움말,
  라우팅, 지연 Plugin CLI 등록에 사용되는 파싱 시점 명령 descriptor

Plugin 명령이 일반 루트 CLI 경로에서 지연 로드 상태를 유지하게 하려면,
해당 registrar가 노출하는 모든 최상위 명령 루트를 포괄하는 `descriptors`를 제공하세요.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Matrix account, verification, devices, and profile state 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

지연 루트 CLI 등록이 필요하지 않을 때만 `commands`만 단독으로 사용하세요.
이 eager 호환성 경로는 계속 지원되지만,
파싱 시점 지연 로딩을 위한 descriptor 기반 placeholder는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 `codex-cli` 같은 로컬
AI CLI 백엔드의 기본 구성을 Plugin이 직접 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 모델 ref의 provider 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 구성이 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에
  Plugin 기본값 위에 `agents.defaults.cliBackends.<id>`를 병합합니다.
- 병합 후 백엔드에 호환성 재작성(예: 오래된 플래그 형태 정규화)이 필요하면
  `normalizeConfig`를 사용하세요.

### 배타적 슬롯

| 메서드 | 등록하는 항목 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)` | 컨텍스트 엔진(한 번에 하나만 활성). `assemble()` 콜백은 `availableTools`와 `citationsMode`를 받아 엔진이 프롬프트 추가 내용을 조정할 수 있도록 합니다. |
| `api.registerMemoryCapability(capability)` | 통합 메모리 capability |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더 |
| `api.registerMemoryFlushPlan(resolver)` | 메모리 flush 계획 resolver |
| `api.registerMemoryRuntime(runtime)` | 메모리 런타임 adapter |

### 메모리 임베딩 adapter

| 메서드 | 등록하는 항목 |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 Plugin용 메모리 임베딩 adapter |

- `registerMemoryCapability`가 권장되는 배타적 메모리 Plugin API입니다.
- `registerMemoryCapability`는 companion Plugin이 특정
  메모리 Plugin의 비공개 레이아웃에 직접 접근하지 않고
  `openclaw/plugin-sdk/memory-host-core`를 통해 export된 메모리 아티팩트를 소비할 수 있도록
  `publicArtifacts.listArtifacts(...)`를 노출할 수도 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, 그리고
  `registerMemoryRuntime`은 레거시 호환 배타적 메모리 Plugin API입니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 메모리 Plugin이 하나 이상의
  임베딩 adapter id(예: `openai`, `gemini`, 또는 custom
  Plugin 정의 id)를 등록할 수 있습니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 구성은
  이러한 등록된 adapter id를 기준으로 해석됩니다.

### 이벤트 및 수명 주기

| 메서드 | 수행하는 일 |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)` | 타입 지정 수명 주기 hook |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백 |

### Hook 결정 의미론

- `before_tool_call`: `{ block: true }`를 반환하면 종료형입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음으로 처리됩니다(`block`을 생략한 것과 동일)이며, override가 아닙니다.
- `before_install`: `{ block: true }`를 반환하면 종료형입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음으로 처리됩니다(`block`을 생략한 것과 동일)이며, override가 아닙니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료형입니다. 어떤 handler든 dispatch를 맡으면 더 낮은 우선순위 handler와 기본 모델 dispatch 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료형입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음으로 처리됩니다(`cancel`을 생략한 것과 동일)이며, override가 아닙니다.

### API 객체 필드

| 필드 | 타입 | 설명 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id` | `string` | Plugin id |
| `api.name` | `string` | 표시 이름 |
| `api.version` | `string?` | Plugin 버전(선택 사항) |
| `api.description` | `string?` | Plugin 설명(선택 사항) |
| `api.source` | `string` | Plugin 소스 경로 |
| `api.rootDir` | `string?` | Plugin 루트 디렉터리(선택 사항) |
| `api.config` | `OpenClawConfig` | 현재 구성 스냅샷(사용 가능한 경우 활성 메모리 내 런타임 스냅샷) |
| `api.pluginConfig` | `Record<string, unknown>` | `plugins.entries.<id>.config`의 Plugin별 구성 |
| `api.runtime` | `PluginRuntime` | [런타임 헬퍼](/ko/plugins/sdk-runtime) |
| `api.logger` | `PluginLogger` | 범위 지정 로거(`debug`, `info`, `warn`, `error`) |
| `api.registrationMode` | `PluginRegistrationMode` | 현재 로드 모드; `"setup-runtime"`은 가벼운 전체 엔트리 이전 시작/setup 구간 |
| `api.resolvePath(input)` | `(string) => string` | Plugin 루트를 기준으로 경로 해석 |

## 내부 모듈 규칙

Plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 export
  runtime-api.ts    # 내부 전용 런타임 export
  index.ts          # Plugin 엔트리 포인트
  setup-entry.ts    # 경량 setup 전용 엔트리(선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해 자신의 Plugin을 절대 import하지 마세요.
  내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 처리하세요. SDK 경로는 외부 contract 전용입니다.
</Warning>

파사드 로드 방식의 번들 Plugin 공개 surface(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, 그리고 유사한 공개 엔트리 파일)는 이제
OpenClaw가 이미 실행 중이면 활성 런타임 구성 스냅샷을 우선 사용합니다.
아직 런타임 스냅샷이 없으면 디스크에서 해석된 구성 파일로 fallback합니다.

provider Plugin은 헬퍼가 의도적으로 provider 전용이고 아직 일반 SDK
하위 경로에 속하지 않을 때 좁은 범위의 Plugin 로컬 contract barrel을 노출할 수도 있습니다.
현재 번들 예시: Anthropic provider는 Claude
스트림 헬퍼를 일반적인
`plugin-sdk/*` contract로 승격하지 않고 자체 공개 `api.ts` / `contract-api.ts` seam에 유지합니다.

다른 현재 번들 예시:

- `@openclaw/openai-provider`: `api.ts`는 provider 빌더,
  기본 모델 헬퍼, 그리고 실시간 provider 빌더를 export합니다
- `@openclaw/openrouter-provider`: `api.ts`는 provider 빌더와
  온보딩/구성 헬퍼를 export합니다

<Warning>
  extension 프로덕션 코드는 또한 `openclaw/plugin-sdk/<other-plugin>`
  import를 피해야 합니다. 헬퍼가 정말로 공유되어야 한다면, 두 Plugin을 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, 또는 다른
  capability 지향 surface 같은 중립 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

- [Entry Points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry` 옵션
- [Runtime Helpers](/ko/plugins/sdk-runtime) — 전체 `api.runtime` 네임스페이스 참조
- [Setup and Config](/ko/plugins/sdk-setup) — 패키징, 매니페스트, 구성 스키마
- [Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 lint 규칙
- [SDK Migration](/ko/plugins/sdk-migration) — 더 이상 사용되지 않는 surface에서의 마이그레이션
- [Plugin Internals](/ko/plugins/architecture) — 심층 아키텍처 및 capability 모델
