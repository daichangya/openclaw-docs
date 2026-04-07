---
read_when:
    - 어떤 SDK 서브패스에서 import해야 하는지 알아야 할 때
    - OpenClawPluginApi의 모든 등록 메서드에 대한 참조가 필요할 때
    - 특정 SDK export를 찾고 있을 때
sidebarTitle: SDK Overview
summary: Import 맵, 등록 API 참조 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-07T05:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe1fe41beaf73a7bdf807e281d181df7a5da5819343823c4011651fb234b0905
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK 개요

plugin SDK는 plugin과 core 사이의 타입 지정된 계약입니다. 이 페이지는 **무엇을 import해야 하는지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  **사용 방법 가이드를 찾고 있나요?**
  - 첫 plugin인가요? [시작하기](/ko/plugins/building-plugins)부터 시작하세요
  - Channel plugin인가요? [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요
  - Provider plugin인가요? [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참조하세요
</Tip>

## Import 규칙

항상 특정 서브패스에서 import하세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 서브패스는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도를 빠르게 유지하고
순환 의존성 문제를 방지할 수 있습니다. channel 전용 entry/build helper의 경우
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 넓은 umbrella 표면과
`buildChannelConfigSchema` 같은 공용 helper에는 `openclaw/plugin-sdk/core`를 유지하세요.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` 같은 provider 이름 기반 convenience seam이나
channel 브랜드 helper seam을 추가하거나 이에 의존하지 마세요. 번들 plugin은 일반적인
SDK 서브패스를 자체 `api.ts` 또는 `runtime-api.ts` 배럴 안에서 조합해야 하며, core는
plugin 로컬 배럴을 사용하거나, 필요가 진정으로 cross-channel일 때만 좁은 범용 SDK
계약을 추가해야 합니다.

생성된 export 맵에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은
번들 plugin helper seam의 작은 집합이 포함됩니다. 이러한 서브패스는 번들 plugin 유지 관리와
호환성을 위해서만 존재하며, 아래 일반 표에서는 의도적으로 제외되어 있고 새로운 서드파티 plugin에 권장되는
import 경로가 아닙니다.

## 서브패스 참조

용도별로 그룹화한 가장 자주 사용되는 서브패스입니다. 생성된 전체
200개 이상의 서브패스 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

예약된 번들 plugin helper 서브패스는 여전히 해당 생성 목록에 나타납니다.
문서 페이지에서 명시적으로 공개용으로 권장하지 않는 한, 이들은 구현 세부 사항/호환성 표면으로 취급하세요.

### Plugin entry

| Subpath                     | 주요 exports                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공용 setup wizard helper, 허용 목록 프롬프트, setup 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 구성/액션 게이트 helper, 기본 계정 폴백 helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 helper |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본 폴백 helper |
    | `plugin-sdk/account-helpers` | 좁은 범위의 account-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel config 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 폴백이 포함된 Telegram 커스텀 명령 정규화/검증 helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 공용 inbound route + envelope 빌더 helper |
    | `plugin-sdk/inbound-reply-dispatch` | 공용 inbound record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/outbound-media` | 공용 outbound 미디어 로딩 helper |
    | `plugin-sdk/outbound-runtime` | outbound ID/send delegate helper |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 adapter helper |
    | `plugin-sdk/agent-media-payload` | 레거시 agent 미디어 payload 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링 및 구성된 바인딩 helper |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 helper |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 helper |
    | `plugin-sdk/channel-status` | 공용 channel 상태 스냅샷/요약 helper |
    | `plugin-sdk/channel-config-primitives` | 좁은 범위의 channel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | channel config 쓰기 권한 부여 helper |
    | `plugin-sdk/channel-plugin-common` | 공용 channel plugin prelude exports |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 config 편집/읽기 helper |
    | `plugin-sdk/group-access` | 공용 group-access 결정 helper |
    | `plugin-sdk/direct-dm` | 공용 direct-DM 인증/가드 helper |
    | `plugin-sdk/interactive-runtime` | 인터랙티브 응답 payload 정규화/축소 helper |
    | `plugin-sdk/channel-inbound` | 디바운스, 멘션 매칭, envelope helper |
    | `plugin-sdk/channel-send-result` | 응답 결과 타입 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/channel-contract` | Channel 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/리액션 wiring |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 및 시크릿 대상 타입 같은 좁은 범위의 시크릿 계약 helper |
  </Accordion>

  <Accordion title="Provider 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 선별된 로컬/self-hosted provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 self-hosted provider setup 전용 helper |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | provider plugin용 런타임 API 키 해석 helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 helper |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result 빌더 |
    | `plugin-sdk/provider-auth-login` | provider plugin용 공용 인터랙티브 로그인 helper |
    | `plugin-sdk/provider-env-vars` | provider 인증 env-var 조회 helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy 빌더, provider-endpoint helper, `normalizeNativeXaiModelId` 같은 model-id 정규화 helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 범용 provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch` | 웹 fetch provider 등록/캐시 helper |
    | `plugin-sdk/provider-web-search-contract` | `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 credential setter/getter 같은 좁은 범위의 웹 검색 config/credential 계약 helper |
    | `plugin-sdk/provider-web-search` | 웹 검색 provider 등록/캐시/런타임 helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 타입, 그리고 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-onboard` | 온보딩 config patch helper |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache helper |
  </Accordion>

  <Accordion title="인증 및 보안 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 명령 레지스트리 helper, 발신자 권한 부여 helper |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 same-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 helper |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 capability/delivery adapter |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 승인 응답 payload helper |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증 + 네이티브 session-target helper |
    | `plugin-sdk/command-detection` | 공용 명령 감지 helper |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 command-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/plugin 시크릿 표면을 위한 좁은 범위의 시크릿 계약 수집 helper |
    | `plugin-sdk/security-runtime` | 공용 trust, DM 게이팅, external-content 및 시크릿 수집 helper |
    | `plugin-sdk/ssrf-policy` | 호스트 허용 목록 및 사설 네트워크 SSRF 정책 helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF 정책 helper |
    | `plugin-sdk/secret-input` | 시크릿 입력 파싱 helper |
    | `plugin-sdk/webhook-ingress` | 웹훅 요청/대상 helper |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/타임아웃 helper |
  </Accordion>

  <Accordion title="런타임 및 저장소 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/runtime` | 광범위한 런타임/로깅/백업/plugin-install helper |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env, logger, timeout, retry, backoff helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공용 plugin 명령/훅/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 공용 webhook/internal hook pipeline helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 lazy 런타임 import/바인딩 helper |
    | `plugin-sdk/process-runtime` | 프로세스 exec helper |
    | `plugin-sdk/cli-runtime` | CLI 포맷팅, 대기, 버전 helper |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 channel-status patch helper |
    | `plugin-sdk/config-runtime` | config 로드/쓰기 helper |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없는 경우에도 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사 |
    | `plugin-sdk/approval-runtime` | exec/plugin 승인 helper, 승인 capability 빌더, 인증/프로필 helper, 네이티브 라우팅/런타임 helper |
    | `plugin-sdk/reply-runtime` | 공용 inbound/reply 런타임 helper, 청킹, 디스패치, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 reply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공용 짧은 창 reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 text/markdown 청킹 helper |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at helper |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account 바인딩 helper |
    | `plugin-sdk/status-helpers` | 공용 channel/account 상태 요약 helper, 런타임 상태 기본값, 이슈 메타데이터 helper |
    | `plugin-sdk/target-resolver-runtime` | 공용 대상 해석 helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 helper |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | stdout/stderr 결과를 정규화한 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공용 tool/CLI 파라미터 리더 |
    | `plugin-sdk/tool-send` | tool 인수에서 정식 send 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공용 임시 다운로드 경로 helper |
    | `plugin-sdk/logging-core` | 서브시스템 logger 및 redaction helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown 테이블 모드 helper |
    | `plugin-sdk/json-store` | 소규모 JSON 상태 읽기/쓰기 helper |
    | `plugin-sdk/file-lock` | 재진입 가능한 파일 잠금 helper |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 dedupe 캐시 helper |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 reply-dispatch helper |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 agent 런타임 config-schema primitive |
    | `plugin-sdk/boolean-param` | 느슨한 불리언 파라미터 리더 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 helper |
    | `plugin-sdk/device-bootstrap` | 디바이스 bootstrap 및 pairing token helper |
    | `plugin-sdk/extension-shared` | 공용 passive-channel, status, ambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/provider 응답 helper |
    | `plugin-sdk/skill-commands-runtime` | Skills 명령 목록 helper |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/build/serialize helper |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 감지 helper |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/heartbeat helper |
    | `plugin-sdk/collection-runtime` | 소규모 bounded 캐시 helper |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 helper |
    | `plugin-sdk/error-runtime` | 오류 그래프, 포맷팅, 공용 오류 분류 helper, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, pinned lookup helper |
    | `plugin-sdk/host-runtime` | 호스트명 및 SCP 호스트 정규화 helper |
    | `plugin-sdk/retry-runtime` | retry config 및 retry runner helper |
    | `plugin-sdk/agent-runtime` | agent 디렉터리/ID/workspace helper |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 쿼리/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability 및 테스트 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공용 미디어 fetch/transform/store helper 및 미디어 payload 빌더 |
    | `plugin-sdk/media-generation-runtime` | 공용 미디어 생성 폴백 helper, 후보 선택 및 missing-model 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 provider 타입 및 provider 대상 이미지/오디오 helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 제거, markdown render/chunking/table helper, redaction helper, directive-tag helper, safe-text 유틸리티 같은 공용 text/markdown/logging helper |
    | `plugin-sdk/text-chunking` | outbound 텍스트 청킹 helper |
    | `plugin-sdk/speech` | 음성 provider 타입 및 provider 대상 directive, registry, 검증 helper |
    | `plugin-sdk/speech-core` | 공용 음성 provider 타입, registry, directive, 정규화 helper |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 provider 타입 및 registry helper |
    | `plugin-sdk/realtime-voice` | 실시간 음성 provider 타입 및 registry helper |
    | `plugin-sdk/image-generation` | 이미지 생성 provider 타입 |
    | `plugin-sdk/image-generation-core` | 공용 이미지 생성 타입, 폴백, 인증, registry helper |
    | `plugin-sdk/music-generation` | 음악 생성 provider/request/result 타입 |
    | `plugin-sdk/music-generation-core` | 공용 음악 생성 타입, 폴백 helper, provider 조회, model-ref 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 provider/request/result 타입 |
    | `plugin-sdk/video-generation-core` | 공용 비디오 생성 타입, 폴백 helper, provider 조회, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | 웹훅 대상 registry 및 route-install helper |
    | `plugin-sdk/webhook-path` | 웹훅 경로 정규화 helper |
    | `plugin-sdk/web-media` | 공용 원격/로컬 미디어 로딩 helper |
    | `plugin-sdk/zod` | plugin SDK 소비자를 위해 재export된 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="메모리 서브패스">
    | Subpath | 주요 exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | 관리자/config/file/CLI helper를 위한 번들 memory-core helper 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 export |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 export |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 export |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 helper |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 helper |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 시크릿 helper |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 helper |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 core 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 helper |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 core 런타임 helper용 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 helper용 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 helper용 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 plugin용 공용 managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager 액세스를 위한 활성 메모리 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 helper용 vendor-neutral 별칭 |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper 표면 |
  </Accordion>

  <Accordion title="예약된 bundled-helper 서브패스">
    | Family | 현재 서브패스 | 의도된 용도 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 browser plugin 지원 helper (`browser-support`는 호환성 배럴로 유지됨) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix helper/런타임 표면 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE helper/런타임 표면 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC helper 표면 |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 channel 호환성/helper seam |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/plugin helper seam; `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export합니다 |
  </Accordion>
</AccordionGroup>

## 등록 API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다.

### Capability 등록

| Method                                           | 등록 대상 |
| ------------------------------------------------ | --------- |
| `api.registerProvider(...)`                      | 텍스트 추론(LLM) |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 백엔드 |
| `api.registerChannel(...)`                       | 메시징 채널 |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성 |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 실시간 전사 |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 실시간 음성 세션 |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석 |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성 |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성 |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성 |
| `api.registerWebFetchProvider(...)`              | 웹 fetch / 스크레이프 provider |
| `api.registerWebSearchProvider(...)`             | 웹 검색 |

### 도구 및 명령

| Method                          | 등록 대상 |
| ------------------------------- | --------- |
| `api.registerTool(tool, opts?)` | agent 도구(필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | 커스텀 명령(LLM 우회) |

### 인프라

| Method                                         | 등록 대상 |
| ---------------------------------------------- | --------- |
| `api.registerHook(events, handler, opts?)`     | 이벤트 hook |
| `api.registerHttpRoute(params)`                | Gateway HTTP 엔드포인트 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 메서드 |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령 |
| `api.registerService(service)`                 | 백그라운드 서비스 |
| `api.registerInteractiveHandler(registration)` | 인터랙티브 핸들러 |
| `api.registerMemoryPromptSupplement(builder)`  | 추가형 메모리 인접 프롬프트 섹션 |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가형 메모리 검색/읽기 corpus |

예약된 core 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 plugin이 더 좁은 gateway method scope를 할당하려고 해도 항상
`operator.admin`으로 유지됩니다. plugin 소유 메서드에는 plugin 전용 접두사를 우선 사용하세요.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다.

- `commands`: registrar가 소유하는 명시적인 명령 루트
- `descriptors`: 루트 CLI 도움말,
  라우팅 및 lazy plugin CLI 등록에 사용되는 parse-time 명령 descriptor

plugin 명령이 일반 루트 CLI 경로에서 lazy-loaded 상태를 유지하게 하려면,
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
        description: "Matrix 계정, 검증, 디바이스 및 프로필 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

정상적인 루트 CLI 등록에서 lazy loading이 필요하지 않을 때만 `commands`를 단독으로 사용하세요.
이 eager 호환성 경로는 계속 지원되지만,
parse-time lazy loading을 위한 descriptor 기반 placeholder는 설치하지 않습니다.

### CLI 백엔드 등록

`api.registerCliBackend(...)`를 사용하면 plugin이 `codex-cli` 같은 로컬
AI CLI 백엔드의 기본 구성을 소유할 수 있습니다.

- 백엔드 `id`는 `codex-cli/gpt-5` 같은 model ref의 provider 접두사가 됩니다.
- 백엔드 `config`는 `agents.defaults.cliBackends.<id>`와 동일한 형태를 사용합니다.
- 사용자 config가 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에 plugin 기본값 위에
  `agents.defaults.cliBackends.<id>`를 병합합니다.
- 백엔드에 병합 후 호환성 재작성 작업이 필요하다면 `normalizeConfig`를 사용하세요
  (예: 오래된 플래그 형태 정규화).

### 독점 슬롯

| Method                                     | 등록 대상 |
| ------------------------------------------ | --------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진(한 번에 하나만 활성) |
| `api.registerMemoryPromptSection(builder)` | 메모리 프롬프트 섹션 빌더 |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 플러시 계획 해석기 |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 adapter |

### 메모리 임베딩 adapter

| Method                                         | 등록 대상 |
| ---------------------------------------------- | --------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 plugin용 메모리 임베딩 adapter |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`은 메모리 plugin 전용입니다.
- `registerMemoryEmbeddingProvider`는 활성 메모리 plugin이 하나 이상의
  임베딩 adapter ID(예: `openai`, `gemini`, 또는 커스텀
  plugin 정의 ID)를 등록할 수 있게 합니다.
- `agents.defaults.memorySearch.provider` 및
  `agents.defaults.memorySearch.fallback` 같은 사용자 config는
  등록된 해당 adapter ID를 기준으로 해석됩니다.

### 이벤트 및 수명 주기

| Method                                       | 동작 |
| -------------------------------------------- | ---- |
| `api.on(hookName, handler, opts?)`           | 타입 지정 수명 주기 hook |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백 |

### Hook 결정 의미론

- `before_tool_call`: `{ block: true }`를 반환하면 종료형입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 override가 아니라 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일).
- `before_install`: `{ block: true }`를 반환하면 종료형입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 override가 아니라 결정 없음으로 취급됩니다(`block`을 생략한 것과 동일).
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 종료형입니다. 어떤 핸들러든 디스패치를 주장하면 더 낮은 우선순위 핸들러와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 종료형입니다. 어떤 핸들러든 이를 설정하면 더 낮은 우선순위 핸들러는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 override가 아니라 결정 없음으로 취급됩니다(`cancel`을 생략한 것과 동일).

### API 객체 필드

| Field                    | Type                      | 설명 |
| ------------------------ | ------------------------- | ---- |
| `api.id`                 | `string`                  | Plugin ID |
| `api.name`               | `string`                  | 표시 이름 |
| `api.version`            | `string?`                 | Plugin 버전(선택 사항) |
| `api.description`        | `string?`                 | Plugin 설명(선택 사항) |
| `api.source`             | `string`                  | Plugin 소스 경로 |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리(선택 사항) |
| `api.config`             | `OpenClawConfig`          | 현재 config 스냅샷(사용 가능한 경우 활성 메모리 내 런타임 스냅샷) |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 plugin 전용 config |
| `api.runtime`            | `PluginRuntime`           | [런타임 helper](/ko/plugins/sdk-runtime) |
| `api.logger`             | `PluginLogger`            | 범위 지정 logger (`debug`, `info`, `warn`, `error`) |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드, `"setup-runtime"`은 가벼운 전체 entry 이전 시작/setup 구간 |
| `api.resolvePath(input)` | `(string) => string`      | plugin 루트를 기준으로 경로 해석 |

## 내부 모듈 규칙

plugin 내부에서는 내부 import에 로컬 배럴 파일을 사용하세요.

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 exports
  runtime-api.ts    # 내부 전용 런타임 exports
  index.ts          # Plugin entry point
  setup-entry.ts    # 가벼운 setup 전용 entry(선택 사항)
```

<Warning>
  프로덕션 코드에서 `openclaw/plugin-sdk/<your-plugin>`을 통해
  자신의 plugin을 import하지 마세요. 내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 라우팅하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

파사드 로드 번들 plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` 및 이와 유사한 공개 entry 파일)은 이제
OpenClaw가 이미 실행 중인 경우 활성 런타임 config 스냅샷을 우선 사용합니다. 아직 런타임
스냅샷이 없으면 디스크에서 해석된 config 파일로 폴백합니다.

Provider plugin은 helper가 의도적으로 provider 전용이고 아직 범용 SDK
서브패스에 속하지 않을 때 좁은 범위의 plugin 로컬 계약 배럴을 노출할 수도 있습니다. 현재 번들 예시:
Anthropic provider는 Anthropic 베타 헤더와 `service_tier` 로직을 범용
`plugin-sdk/*` 계약으로 승격하는 대신, Claude stream helper를 자체 공개 `api.ts` / `contract-api.ts`
seam에 유지합니다.

그 외 현재 번들 예시:

- `@openclaw/openai-provider`: `api.ts`는 provider 빌더,
  기본 모델 helper 및 실시간 provider 빌더를 export합니다
- `@openclaw/openrouter-provider`: `api.ts`는 provider 빌더와
  온보딩/config helper를 export합니다

<Warning>
  확장 프로덕션 코드는 `openclaw/plugin-sdk/<other-plugin>`
  import도 피해야 합니다. helper가 진정으로 공용이라면 두 plugin을 결합하는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` 또는 다른
  capability 지향 표면 같은 중립적인 SDK 서브패스로 승격하세요.
</Warning>

## 관련 항목

- [Entry Points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry` 옵션
- [런타임 Helpers](/ko/plugins/sdk-runtime) — 전체 `api.runtime` 네임스페이스 참조
- [Setup 및 Config](/ko/plugins/sdk-setup) — 패키징, 매니페스트, config 스키마
- [테스트](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 lint 규칙
- [SDK 마이그레이션](/ko/plugins/sdk-migration) — 사용 중단된 표면에서 마이그레이션
- [Plugin 내부 구조](/ko/plugins/architecture) — 심층 아키텍처 및 capability 모델
