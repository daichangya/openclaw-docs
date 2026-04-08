---
read_when:
    - 어느 SDK 하위 경로에서 import해야 하는지 알아야 할 때
    - OpenClawPluginApi의 모든 registration 메서드에 대한 참조가 필요할 때
    - 특정 SDK export를 찾고 있을 때
sidebarTitle: SDK Overview
summary: import map, registration API 참조, 및 SDK 아키텍처
title: Plugin SDK 개요
x-i18n:
    generated_at: "2026-04-08T02:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a41bd82d165dfbb7fbd6e4528cf322e9133a51efe55fa8518a7a0a626d9d30
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Plugin SDK 개요

plugin SDK는 plugins와 core 사이의 타입 지정 계약입니다. 이 페이지는
**무엇을 import할지**와 **무엇을 등록할 수 있는지**에 대한 참조입니다.

<Tip>
  **사용 방법 가이드를 찾고 있나요?**
  - 첫 plugin인가요? [Getting Started](/ko/plugins/building-plugins)부터 시작하세요
  - Channel plugin인가요? [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요
  - Provider plugin인가요? [Provider Plugins](/ko/plugins/sdk-provider-plugins)를 참조하세요
</Tip>

## import 규칙

항상 특정 하위 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

각 하위 경로는 작고 독립적인 모듈입니다. 이렇게 하면 시작 속도를 빠르게 유지하고
순환 의존성 문제를 방지할 수 있습니다. 채널별 entry/build helper의 경우
`openclaw/plugin-sdk/channel-core`를 우선 사용하고, 더 넓은 umbrella 표면과
`buildChannelConfigSchema` 같은 공통 helper에는
`openclaw/plugin-sdk/core`를 사용하세요.

`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` 같은
provider 이름이 붙은 편의 seam이나 채널 브랜딩 helper seam을 추가하거나 이에 의존하지 마세요.
번들 plugins는 generic
SDK 하위 경로를 자체 `api.ts` 또는 `runtime-api.ts` barrel 안에서 조합해야 하며, core는
그런 plugin 로컬 barrel을 사용하거나, 필요가 진정으로 cross-channel일 때에만
좁은 generic SDK 계약을 추가해야 합니다.

생성된 export map에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은
일부 번들 plugin helper seam이 포함되어 있습니다. 이러한
하위 경로는 번들 plugin 유지 관리와 호환성만을 위해 존재하며,
아래의 일반 표에서는 의도적으로 생략되었고 새로운 서드파티 plugins에 권장되는
import 경로가 아닙니다.

## 하위 경로 참조

가장 자주 사용되는 하위 경로를 목적별로 그룹화했습니다. 200개가 넘는
전체 하위 경로 목록은 생성된 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

예약된 번들 plugin helper 하위 경로도 이 생성 목록에 계속 표시됩니다.
문서 페이지에서 공개용으로 명시적으로 권장하지 않는 한, 이러한 경로는
구현 세부 사항/호환성 표면으로 취급하세요.

### Plugin entry

| 하위 경로                  | 주요 exports                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공통 setup wizard helper, allowlist 프롬프트, setup 상태 builder |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/action-gate helper, 기본 계정 fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 helper |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본 fallback helper |
    | `plugin-sdk/account-helpers` | 좁은 범위의 account-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 채널 config 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 fallback이 포함된 Telegram custom-command 정규화/검증 helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 공통 인바운드 route + envelope builder helper |
    | `plugin-sdk/inbound-reply-dispatch` | 공통 인바운드 record-and-dispatch helper |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/outbound-media` | 공통 아웃바운드 미디어 로딩 helper |
    | `plugin-sdk/outbound-runtime` | 아웃바운드 identity/send delegate helper |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 adapter helper |
    | `plugin-sdk/agent-media-payload` | 레거시 agent media payload builder |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 helper |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config snapshot helper |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 helper |
    | `plugin-sdk/channel-status` | 공통 채널 상태 snapshot/summary helper |
    | `plugin-sdk/channel-config-primitives` | 좁은 범위의 채널 config-schema primitive |
    | `plugin-sdk/channel-config-writes` | 채널 config 쓰기 권한 부여 helper |
    | `plugin-sdk/channel-plugin-common` | 공통 채널 plugin prelude exports |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config 편집/읽기 helper |
    | `plugin-sdk/group-access` | 공통 그룹 접근 결정 helper |
    | `plugin-sdk/direct-dm` | 공통 direct-DM 인증/guard helper |
    | `plugin-sdk/interactive-runtime` | interactive reply payload 정규화/축소 helper |
    | `plugin-sdk/channel-inbound` | 인바운드 debounce, 멘션 매칭, mention-policy helper, 그리고 envelope helper |
    | `plugin-sdk/channel-send-result` | reply 결과 타입 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/channel-contract` | 채널 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/반응 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, secret 대상 타입 같은 좁은 secret 계약 helper |
  </Accordion>

  <Accordion title="Provider 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 엄선된 로컬/자체 호스팅 provider setup helper |
    | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 자체 호스팅 provider setup helper |
    | `plugin-sdk/cli-backend` | CLI backend 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | provider plugins용 런타임 API 키 해석 helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 onboarding/profile-write helper |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result builder |
    | `plugin-sdk/provider-auth-login` | provider plugins용 공통 interactive login helper |
    | `plugin-sdk/provider-env-vars` | provider 인증 env-var 조회 helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공통 replay-policy builder, provider-endpoint helper, 그리고 `normalizeNativeXaiModelId` 같은 model-id 정규화 helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | generic provider HTTP/endpoint capability helper |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`, `WebFetchProviderPlugin` 같은 좁은 web-fetch config/selection 계약 helper |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 등록/캐시 helper |
    | `plugin-sdk/provider-web-search-contract` | `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정된 자격 증명 setter/getter 같은 좁은 web-search config/credential 계약 helper |
    | `plugin-sdk/provider-web-search` | web-search provider 등록/캐시/런타임 helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 wrapper 타입, 그리고 공통 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
    | `plugin-sdk/provider-onboard` | onboarding config patch helper |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache helper |
  </Accordion>

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, command registry helper, sender-authorization helper |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 same-chat action-auth helper |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 profile/filter helper |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 capability/delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 공통 승인 gateway-resolution helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot 채널 entrypoint용 경량 네이티브 승인 adapter 로딩 helper |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 handler 런타임 helper; 좁은 adapter/gateway seam으로 충분하다면 그것들을 우선 사용하세요 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + account-binding helper |
    | `plugin-sdk/approval-reply-runtime` | exec/plugin 승인 reply payload helper |
    | `plugin-sdk/command-auth-native` | 네이티브 command auth + 네이티브 session-target helper |
    | `plugin-sdk/command-detection` | 공통 command 감지 helper |
    | `plugin-sdk/command-surface` | command-body 정규화 및 command-surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 채널/plugin secret 표면용 좁은 secret 계약 수집 helper |
    | `plugin-sdk/secret-ref-runtime` | secret-contract/config 파싱용 좁은 `coerceSecretRef` 및 SecretRef 타이핑 helper |
    | `plugin-sdk/security-runtime` | 공통 신뢰, DM gating, external-content, secret-collection helper |
    | `plugin-sdk/ssrf-policy` | 호스트 allowlist 및 private-network SSRF policy helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF policy helper |
    | `plugin-sdk/secret-input` | secret 입력 파싱 helper |
    | `plugin-sdk/webhook-ingress` | webhook 요청/대상 helper |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/timeout helper |
  </Accordion>

  <Accordion title="런타임 및 저장소 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/runtime` | 넓은 범위의 런타임/로깅/백업/plugin-install helper |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env, logger, timeout, retry, backoff helper |
    | `plugin-sdk/channel-runtime-context` | generic 채널 runtime-context 등록 및 조회 helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공통 plugin command/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 공통 webhook/internal hook 파이프라인 helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 lazy 런타임 import/binding helper |
    | `plugin-sdk/process-runtime` | 프로세스 exec helper |
    | `plugin-sdk/cli-runtime` | CLI formatting, wait, version helper |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 채널 상태 patch helper |
    | `plugin-sdk/config-runtime` | Config 로드/쓰기 helper |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없더라도 Telegram command-name/description 정규화 및 중복/충돌 검사 |
    | `plugin-sdk/approval-runtime` | exec/plugin 승인 helper, 승인 capability builder, auth/profile helper, 네이티브 라우팅/런타임 helper |
    | `plugin-sdk/reply-runtime` | 공통 인바운드/reply 런타임 helper, 청킹, 디스패치, heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 reply dispatch/finalize helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공통 짧은 창 reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 텍스트/Markdown 청킹 helper |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at helper |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account binding helper |
    | `plugin-sdk/status-helpers` | 공통 채널/계정 상태 summary helper, runtime-state 기본값, issue 메타데이터 helper |
    | `plugin-sdk/target-resolver-runtime` | 공통 대상 resolver helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 helper |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 포함하는 timed command runner |
    | `plugin-sdk/param-readers` | 공통 tool/CLI param reader |
    | `plugin-sdk/tool-send` | tool 인수에서 canonical send target 필드 추출 |
    | `plugin-sdk/temp-path` | 공통 임시 다운로드 경로 helper |
    | `plugin-sdk/logging-core` | subsystem logger 및 redaction helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown 테이블 모드 helper |
    | `plugin-sdk/json-store` | 소규모 JSON 상태 읽기/쓰기 helper |
    | `plugin-sdk/file-lock` | 재진입 가능 파일 잠금 helper |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 dedupe 캐시 helper |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 reply-dispatch helper |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 agent 런타임 config-schema primitive |
    | `plugin-sdk/boolean-param` | 느슨한 boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 helper |
    | `plugin-sdk/device-bootstrap` | 디바이스 bootstrap 및 페어링 토큰 helper |
    | `plugin-sdk/extension-shared` | 공통 passive-channel, 상태, ambient proxy helper primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skills command 목록 helper |
    | `plugin-sdk/native-command-registry` | 네이티브 command registry/build/serialize helper |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 감지 helper |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/heartbeat helper |
    | `plugin-sdk/collection-runtime` | 소형 bounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 helper |
    | `plugin-sdk/error-runtime` | 오류 그래프, formatting, 공통 오류 분류 helper, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, proxy, pinned lookup helper |
    | `plugin-sdk/host-runtime` | 호스트명 및 SCP 호스트 정규화 helper |
    | `plugin-sdk/retry-runtime` | retry config 및 retry runner helper |
    | `plugin-sdk/agent-runtime` | agent 디렉터리/identity/workspace helper |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability 및 테스트 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공통 미디어 fetch/transform/store helper와 media payload builder |
    | `plugin-sdk/media-generation-runtime` | 공통 media-generation failover helper, 후보 선택, 누락된 모델 메시지 처리 |
    | `plugin-sdk/media-understanding` | media understanding provider 타입과 provider 대상 이미지/오디오 helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 제거, Markdown render/chunking/table helper, redaction helper, directive-tag helper, safe-text utility 같은 공통 텍스트/Markdown/로깅 helper |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 청킹 helper |
    | `plugin-sdk/speech` | speech provider 타입과 provider 대상 directive, registry, validation helper |
    | `plugin-sdk/speech-core` | 공통 speech provider 타입, registry, directive, 정규화 helper |
    | `plugin-sdk/realtime-transcription` | realtime transcription provider 타입 및 registry helper |
    | `plugin-sdk/realtime-voice` | realtime voice provider 타입 및 registry helper |
    | `plugin-sdk/image-generation` | image generation provider 타입 |
    | `plugin-sdk/image-generation-core` | 공통 image-generation 타입, failover, auth, registry helper |
    | `plugin-sdk/music-generation` | music generation provider/request/result 타입 |
    | `plugin-sdk/music-generation-core` | 공통 music-generation 타입, failover helper, provider lookup, model-ref 파싱 |
    | `plugin-sdk/video-generation` | video generation provider/request/result 타입 |
    | `plugin-sdk/video-generation-core` | 공통 video-generation 타입, failover helper, provider lookup, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | webhook 대상 registry 및 route-install helper |
    | `plugin-sdk/webhook-path` | webhook 경로 정규화 helper |
    | `plugin-sdk/web-media` | 공통 원격/로컬 미디어 로딩 helper |
    | `plugin-sdk/zod` | plugin SDK 소비자를 위한 재export된 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="메모리 하위 경로">
    | 하위 경로 | 주요 exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper를 위한 번들 memory-core helper 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 index/search 런타임 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation engine exports |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 embedding engine exports |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD engine exports |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 storage engine exports |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 multimodal helper |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 query helper |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret helper |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 event journal helper |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 core 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 helper |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 core 런타임 helper를 위한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 event journal helper를 위한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 helper를 위한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 plugins용 공통 managed-markdown helper |
    | `plugin-sdk/memory-host-search` | search-manager 접근용 활성 메모리 런타임 facade |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 helper를 위한 vendor-neutral 별칭 |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper 표면 |
  </Accordion>

  <Accordion title="예약된 번들 helper 하위 경로">
    | 계열 | 현재 하위 경로 | 의도된 용도 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 browser plugin 지원 helper (`browser-support`는 호환성 barrel로 유지됨) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix helper/런타임 표면 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE helper/런타임 표면 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC helper 표면 |
    | 채널별 helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 채널 호환성/helper seam |
    | 인증/plugin별 helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/plugin helper seam; `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export함 |
  </Accordion>
</AccordionGroup>

## Registration API

`register(api)` 콜백은 다음 메서드를 가진 `OpenClawPluginApi` 객체를 받습니다:

### Capability 등록

| 메서드                                           | 등록되는 항목                |
| ------------------------------------------------ | ---------------------------- |
| `api.registerProvider(...)`                      | 텍스트 추론 (LLM)            |
| `api.registerCliBackend(...)`                    | 로컬 CLI 추론 backend        |
| `api.registerChannel(...)`                       | 메시징 채널                  |
| `api.registerSpeechProvider(...)`                | 텍스트 음성 변환 / STT 합성  |
| `api.registerRealtimeTranscriptionProvider(...)` | 스트리밍 realtime transcription |
| `api.registerRealtimeVoiceProvider(...)`         | 양방향 realtime voice 세션   |
| `api.registerMediaUnderstandingProvider(...)`    | 이미지/오디오/비디오 분석    |
| `api.registerImageGenerationProvider(...)`       | 이미지 생성                  |
| `api.registerMusicGenerationProvider(...)`       | 음악 생성                    |
| `api.registerVideoGenerationProvider(...)`       | 비디오 생성                  |
| `api.registerWebFetchProvider(...)`              | 웹 fetch / scrape provider   |
| `api.registerWebSearchProvider(...)`             | 웹 검색                      |

### Tools 및 commands

| 메서드                          | 등록되는 항목                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | agent tool (필수 또는 `{ optional: true }`) |
| `api.registerCommand(def)`      | custom command (LLM 우회)                    |

### 인프라

| 메서드                                         | 등록되는 항목                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 이벤트 hook                             |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                      |
| `api.registerCli(registrar, opts?)`            | CLI 하위 명령                           |
| `api.registerService(service)`                 | 백그라운드 서비스                       |
| `api.registerInteractiveHandler(registration)` | interactive handler                     |
| `api.registerMemoryPromptSupplement(builder)`  | 추가형 메모리 인접 prompt 섹션          |
| `api.registerMemoryCorpusSupplement(adapter)`  | 추가형 메모리 검색/읽기 corpus          |

예약된 core admin namespace(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 plugin이 더 좁은 gateway method 범위를
할당하려고 해도 항상 `operator.admin`으로 유지됩니다. plugin 소유 method에는
plugin별 접두사를 사용하는 것이 좋습니다.

### CLI 등록 메타데이터

`api.registerCli(registrar, opts?)`는 두 종류의 최상위 메타데이터를 받습니다:

- `commands`: registrar가 소유하는 명시적인 command 루트
- `descriptors`: 루트 CLI 도움말,
  라우팅, lazy plugin CLI 등록에 사용되는 parse 시점 command descriptor

plugin command가 일반 루트 CLI 경로에서 lazy-loaded 상태로 유지되게 하려면,
해당 registrar가 노출하는 모든 최상위 command 루트를 포괄하는 `descriptors`를 제공하세요.

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
        description: "Matrix 계정, 검증, 디바이스, 프로필 상태 관리",
        hasSubcommands: true,
      },
    ],
  },
);
```

일반 루트 CLI 등록에 lazy 로딩이 필요하지 않은 경우에만 `commands`를 단독으로 사용하세요.
이 eager 호환성 경로는 계속 지원되지만, parse 시점 lazy 로딩을 위한
descriptor 기반 placeholder는 설치하지 않습니다.

### CLI backend 등록

`api.registerCliBackend(...)`를 사용하면 plugin이 `codex-cli` 같은 로컬
AI CLI backend의 기본 config를 소유할 수 있습니다.

- backend `id`는 `codex-cli/gpt-5` 같은 model ref의 provider 접두사가 됩니다.
- backend `config`는 `agents.defaults.cliBackends.<id>`와 같은 형태를 사용합니다.
- 사용자 config가 여전히 우선합니다. OpenClaw는 CLI를 실행하기 전에
  `agents.defaults.cliBackends.<id>`를 plugin 기본값 위에 병합합니다.
- backend가 병합 후 호환성 재작성 작업을 필요로 하는 경우
  (예: 오래된 플래그 형태 정규화) `normalizeConfig`를 사용하세요.

### 독점 슬롯

| 메서드                                     | 등록되는 항목                         |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 컨텍스트 엔진 (한 번에 하나만 활성)   |
| `api.registerMemoryCapability(capability)` | 통합 메모리 capability                |
| `api.registerMemoryPromptSection(builder)` | 메모리 prompt 섹션 builder            |
| `api.registerMemoryFlushPlan(resolver)`    | 메모리 flush plan resolver            |
| `api.registerMemoryRuntime(runtime)`       | 메모리 런타임 adapter                 |

### 메모리 임베딩 adapter

| 메서드                                         | 등록되는 항목                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 활성 plugin용 메모리 임베딩 adapter                |

- `registerMemoryCapability`가 권장되는 독점 메모리 plugin API입니다.
- `registerMemoryCapability`는 companion plugins가 특정
  메모리 plugin의 비공개 레이아웃에 접근하지 않고
  `openclaw/plugin-sdk/memory-host-core`를 통해 export된 메모리 artifact를 소비할 수 있도록
  `publicArtifacts.listArtifacts(...)`도 노출할 수 있습니다.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`,
  `registerMemoryRuntime`는 레거시 호환용 독점 메모리 plugin API입니다.
- `registerMemoryEmbeddingProvider`를 사용하면 활성 메모리 plugin이
  하나 이상의 임베딩 adapter id(예: `openai`, `gemini`, 또는 사용자 정의
  plugin 정의 id)를 등록할 수 있습니다.
- `agents.defaults.memorySearch.provider`,
  `agents.defaults.memorySearch.fallback` 같은 사용자 config는
  등록된 adapter id를 기준으로 해석됩니다.

### 이벤트 및 수명 주기

| 메서드                                       | 수행하는 작업              |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | 타입 지정 lifecycle hook   |
| `api.onConversationBindingResolved(handler)` | 대화 바인딩 콜백          |

### Hook 결정 의미

- `before_tool_call`: `{ block: true }`를 반환하면 최종 결정입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `before_tool_call`: `{ block: false }`를 반환하면 결정 없음으로 처리됩니다(`block`을 생략한 것과 동일). override로 처리되지 않습니다.
- `before_install`: `{ block: true }`를 반환하면 최종 결정입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `before_install`: `{ block: false }`를 반환하면 결정 없음으로 처리됩니다(`block`을 생략한 것과 동일). override로 처리되지 않습니다.
- `reply_dispatch`: `{ handled: true, ... }`를 반환하면 최종 결정입니다. 어떤 handler든 디스패치를 가져가면 더 낮은 우선순위 handler와 기본 모델 디스패치 경로는 건너뜁니다.
- `message_sending`: `{ cancel: true }`를 반환하면 최종 결정입니다. 어떤 handler든 이를 설정하면 더 낮은 우선순위 handler는 건너뜁니다.
- `message_sending`: `{ cancel: false }`를 반환하면 결정 없음으로 처리됩니다(`cancel`을 생략한 것과 동일). override로 처리되지 않습니다.

### API 객체 필드

| 필드                     | 타입                      | 설명                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Plugin id                                                                            |
| `api.name`               | `string`                  | 표시 이름                                                                            |
| `api.version`            | `string?`                 | Plugin 버전 (선택 사항)                                                              |
| `api.description`        | `string?`                 | Plugin 설명 (선택 사항)                                                              |
| `api.source`             | `string`                  | Plugin 소스 경로                                                                     |
| `api.rootDir`            | `string?`                 | Plugin 루트 디렉터리 (선택 사항)                                                     |
| `api.config`             | `OpenClawConfig`          | 현재 config snapshot (가능한 경우 활성 메모리 내 런타임 snapshot)                    |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config`의 plugin별 config                                      |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/ko/plugins/sdk-runtime)                                              |
| `api.logger`             | `PluginLogger`            | 범위 지정 logger (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | 현재 로드 모드; `"setup-runtime"`은 전체 entry 이전의 경량 시작/setup 구간입니다     |
| `api.resolvePath(input)` | `(string) => string`      | plugin 루트를 기준으로 경로 해석                                                     |

## 내부 모듈 규칙

plugin 내부에서는 내부 import에 로컬 barrel 파일을 사용하세요:

```
my-plugin/
  api.ts            # 외부 소비자를 위한 공개 exports
  runtime-api.ts    # 내부 전용 런타임 exports
  index.ts          # Plugin entry point
  setup-entry.ts    # 경량 setup 전용 entry (선택 사항)
```

<Warning>
  프로덕션 코드에서 자신의 plugin을 `openclaw/plugin-sdk/<your-plugin>`을 통해
  import하지 마세요. 내부 import는 `./api.ts` 또는
  `./runtime-api.ts`를 통해 처리하세요. SDK 경로는 외부 계약 전용입니다.
</Warning>

Facade로 로드되는 번들 plugin 공개 표면(`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, 및 유사한 공개 entry 파일)은 이제
OpenClaw가 이미 실행 중인 경우 활성 런타임 config snapshot을 우선 사용합니다. 아직 런타임
snapshot이 없으면, 디스크에서 해석된 config 파일로 대체합니다.

Provider plugins는 helper가 의도적으로 provider 전용이며 아직 generic SDK
하위 경로에 속하지 않을 때, 좁은 범위의 plugin 로컬 계약 barrel을 노출할 수도 있습니다. 현재 번들 예시:
Anthropic provider는 Anthropic beta-header와 `service_tier` 로직을 generic
`plugin-sdk/*` 계약으로 승격하는 대신 자체 공개 `api.ts` / `contract-api.ts` seam에
Claude stream helper를 유지합니다.

기타 현재 번들 예시:

- `@openclaw/openai-provider`: `api.ts`는 provider builder,
  default-model helper, realtime provider builder를 export합니다
- `@openclaw/openrouter-provider`: `api.ts`는 provider builder와
  onboarding/config helper를 export합니다

<Warning>
  extension 프로덕션 코드도 `openclaw/plugin-sdk/<other-plugin>`
  import를 피해야 합니다. helper가 진정으로 공유되어야 한다면,
  두 plugins를 결합시키는 대신
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, 또는 다른
  capability 지향 표면 같은 중립적인 SDK 하위 경로로 승격하세요.
</Warning>

## 관련 항목

- [Entry Points](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 및 `defineChannelPluginEntry` 옵션
- [Runtime Helpers](/ko/plugins/sdk-runtime) — 전체 `api.runtime` namespace 참조
- [Setup and Config](/ko/plugins/sdk-setup) — 패키징, manifest, config 스키마
- [Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 lint 규칙
- [SDK Migration](/ko/plugins/sdk-migration) — deprecated 표면에서 마이그레이션
- [Plugin Internals](/ko/plugins/architecture) — 심층 아키텍처 및 capability 모델
