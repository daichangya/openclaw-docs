---
read_when:
    - Plugin import에 적합한 plugin-sdk 하위 경로 선택하기
    - 번들 Plugin 하위 경로 및 도우미 표면 감사하기
summary: '영역별로 그룹화한 Plugin SDK 하위 경로 카탈로그: 어떤 import가 어디에 있는지'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-04-24T06:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753c7202a8a59ae9e420d436c7f3770ea455d810f2af52b716d438b84b8b986e
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 하위 경로 집합으로 노출됩니다.
  이 페이지는 자주 사용되는 하위 경로를 목적별로 묶어 정리한 카탈로그입니다. 생성된
  전체 200개 이상의 하위 경로 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며,
  예약된 번들 Plugin 도우미 하위 경로도 সেখানে 나타나지만
  문서 페이지에서 명시적으로 승격하지 않는 한 구현 세부 사항입니다.

  Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

  ## Plugin 엔트리

  | Subpath                     | Key exports                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Channel 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공유 setup 마법사 도우미, allowlist 프롬프트, setup 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/action-gate 도우미, 기본 계정 폴백 도우미 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 도우미 |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본값 폴백 도우미 |
    | `plugin-sdk/account-helpers` | 좁은 account-list/account-action 도우미 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | channel config 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 계약 폴백이 포함된 Telegram 사용자 지정 명령 정규화/검증 도우미 |
    | `plugin-sdk/command-gating` | 좁은 명령 인증 게이트 도우미 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, 드래프트 스트림 수명 주기/마무리 도우미 |
    | `plugin-sdk/inbound-envelope` | 공유 인바운드 라우트 + envelope 빌더 도우미 |
    | `plugin-sdk/inbound-reply-dispatch` | 공유 인바운드 기록 및 디스패치 도우미 |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 도우미 |
    | `plugin-sdk/outbound-media` | 공유 아웃바운드 미디어 로딩 도우미 |
    | `plugin-sdk/outbound-runtime` | 아웃바운드 identity, send delegate, 페이로드 계획 도우미 |
    | `plugin-sdk/poll-runtime` | 좁은 poll 정규화 도우미 |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 adapter 도우미 |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 페이로드 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, 페어링, 구성된 바인딩 도우미 |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 도우미 |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 해석 도우미 |
    | `plugin-sdk/channel-status` | 공유 channel 상태 스냅샷/요약 도우미 |
    | `plugin-sdk/channel-config-primitives` | 좁은 channel config 스키마 기본 요소 |
    | `plugin-sdk/channel-config-writes` | channel config 쓰기 인증 도우미 |
    | `plugin-sdk/channel-plugin-common` | 공유 channel Plugin prelude export |
    | `plugin-sdk/allowlist-config-edit` | allowlist config 편집/읽기 도우미 |
    | `plugin-sdk/group-access` | 공유 그룹 접근 결정 도우미 |
    | `plugin-sdk/direct-dm` | 공유 direct-DM 인증/가드 도우미 |
    | `plugin-sdk/interactive-runtime` | 의미 기반 메시지 표현, 전달, 레거시 대화형 응답 도우미. [Message Presentation](/ko/plugins/message-presentation) 참조 |
    | `plugin-sdk/channel-inbound` | 인바운드 debounce, mention 매칭, mention-policy 도우미, envelope 도우미를 위한 호환성 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 인바운드 debounce 도우미 |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 인바운드 런타임 표면 없이 사용하는 좁은 mention-policy 및 mention 텍스트 도우미 |
    | `plugin-sdk/channel-envelope` | 좁은 인바운드 envelope 서식 도우미 |
    | `plugin-sdk/channel-location` | channel 위치 컨텍스트 및 서식 도우미 |
    | `plugin-sdk/channel-logging` | 인바운드 드롭 및 타이핑/ack 실패를 위한 channel 로깅 도우미 |
    | `plugin-sdk/channel-send-result` | 응답 결과 타입 |
    | `plugin-sdk/channel-actions` | channel 메시지 작업 도우미와, Plugin 호환성을 위해 유지되는 더 이상 권장되지 않는 네이티브 스키마 도우미 |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 도우미 |
    | `plugin-sdk/channel-contract` | channel 계약 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/리액션 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, secret 대상 타입 같은 좁은 secret 계약 도우미 |
  </Accordion>

  <Accordion title="Provider 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 엄선된 로컬/셀프 호스팅 provider setup 도우미 |
    | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 셀프 호스팅 provider setup 도우미 |
    | `plugin-sdk/cli-backend` | CLI backend 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin용 런타임 API 키 해석 도우미 |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 도우미 |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth 인증 결과 빌더 |
    | `plugin-sdk/provider-auth-login` | provider Plugin용 공유 대화형 로그인 도우미 |
    | `plugin-sdk/provider-env-vars` | provider 인증 env var 조회 도우미 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, provider 엔드포인트 도우미, `normalizeNativeXaiModelId` 같은 model-id 정규화 도우미 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 오디오 전사용 multipart form 도우미를 포함한 일반 provider HTTP/엔드포인트 capability 도우미 |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`, `WebFetchProviderPlugin` 같은 좁은 web-fetch config/선택 계약 도우미 |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 등록/캐시 도우미 |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 연결이 필요 없는 provider를 위한 좁은 web-search config/자격 증명 도우미 |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 web-search config/자격 증명 계약 도우미 |
    | `plugin-sdk/provider-web-search` | web-search provider 등록/캐시/런타임 도우미 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환성 도우미 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 공유 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 도우미 |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch, transport 메시지 변환, 쓰기 가능한 transport 이벤트 스트림 같은 네이티브 provider transport 도우미 |
    | `plugin-sdk/provider-onboard` | 온보딩 config 패치 도우미 |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache 도우미 |
    | `plugin-sdk/group-activation` | 좁은 그룹 활성화 모드 및 명령 파싱 도우미 |
  </Accordion>

  <Accordion title="인증 및 보안 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 명령 레지스트리 도우미, 발신자 인증 도우미 |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`, `buildHelpMessage` 같은 명령/도움말 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 해석 및 동일 채팅 action-auth 도우미 |
    | `plugin-sdk/approval-client-runtime` | 네이티브 exec 승인 프로필/필터 도우미 |
    | `plugin-sdk/approval-delivery-runtime` | 네이티브 승인 capability/전달 adapter |
    | `plugin-sdk/approval-gateway-runtime` | 공유 승인 gateway 해석 도우미 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 핫 channel 엔트리 포인트용 경량 네이티브 승인 adapter 로딩 도우미 |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 핸들러 런타임 도우미. 더 좁은 adapter/gateway 경계로 충분하면 그것을 우선 사용 |
    | `plugin-sdk/approval-native-runtime` | 네이티브 승인 대상 + 계정 바인딩 도우미 |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 응답 페이로드 도우미 |
    | `plugin-sdk/reply-dedupe` | 좁은 인바운드 응답 중복 제거 초기화 도우미 |
    | `plugin-sdk/channel-contract-testing` | 넓은 테스트 barrel 없이 사용하는 좁은 channel 계약 테스트 도우미 |
    | `plugin-sdk/command-auth-native` | 네이티브 명령 인증 + 네이티브 세션 대상 도우미 |
    | `plugin-sdk/command-detection` | 공유 명령 감지 도우미 |
    | `plugin-sdk/command-primitives-runtime` | 핫 channel 경로용 경량 명령 텍스트 predicate |
    | `plugin-sdk/command-surface` | 명령 본문 정규화 및 명령 표면 도우미 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/Plugin secret 표면용 좁은 secret 계약 수집 도우미 |
    | `plugin-sdk/secret-ref-runtime` | secret 계약/config 파싱용 좁은 `coerceSecretRef` 및 SecretRef 타이핑 도우미 |
    | `plugin-sdk/security-runtime` | 공유 신뢰, DM 게이팅, 외부 콘텐츠, secret 수집 도우미 |
    | `plugin-sdk/ssrf-policy` | 호스트 allowlist 및 사설 네트워크 SSRF 정책 도우미 |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 infra 런타임 표면 없이 사용하는 좁은 pinned-dispatcher 도우미 |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF 정책 도우미 |
    | `plugin-sdk/secret-input` | secret 입력 파싱 도우미 |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 도우미 |
    | `plugin-sdk/webhook-request-guards` | 요청 본문 크기/타임아웃 도우미 |
  </Accordion>

  <Accordion title="런타임 및 저장소 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | 넓은 런타임/로깅/백업/Plugin 설치 도우미 |
    | `plugin-sdk/runtime-env` | 좁은 런타임 env, 로거, 타임아웃, 재시도, 백오프 도우미 |
    | `plugin-sdk/channel-runtime-context` | 일반 channel 런타임 컨텍스트 등록 및 조회 도우미 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공유 Plugin 명령/훅/http/대화형 도우미 |
    | `plugin-sdk/hook-runtime` | 공유 Webhook/내부 훅 파이프라인 도우미 |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 import/바인딩 도우미 |
    | `plugin-sdk/process-runtime` | 프로세스 exec 도우미 |
    | `plugin-sdk/cli-runtime` | CLI 서식, 대기, 버전 도우미 |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 channel 상태 패치 도우미 |
    | `plugin-sdk/config-runtime` | config 로드/쓰기 도우미 및 plugin-config 조회 도우미 |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram 계약 표면을 사용할 수 없을 때도 Telegram 명령 이름/설명 정규화 및 중복/충돌 검사 수행 |
    | `plugin-sdk/text-autolink-runtime` | 넓은 text-runtime barrel 없이 파일 참조 자동 링크 감지 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 도우미, approval capability 빌더, auth/profile 도우미, 네이티브 라우팅/런타임 도우미 |
    | `plugin-sdk/reply-runtime` | 공유 인바운드/응답 런타임 도우미, 청킹, 디스패치, Heartbeat, 응답 플래너 |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 응답 디스패치/마무리 도우미 |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공유 단기 응답 기록 도우미 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 텍스트/markdown 청킹 도우미 |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at 도우미 |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 도우미 |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 라우트/세션 키/계정 바인딩 도우미 |
    | `plugin-sdk/status-helpers` | 공유 channel/계정 상태 요약 도우미, 런타임 상태 기본값, 이슈 메타데이터 도우미 |
    | `plugin-sdk/target-resolver-runtime` | 공유 대상 해석 도우미 |
    | `plugin-sdk/string-normalization-runtime` | slug/문자열 정규화 도우미 |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | 정규화된 stdout/stderr 결과를 반환하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 매개변수 리더 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 페이로드 추출 |
    | `plugin-sdk/tool-send` | 도구 인수에서 정규화된 send 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공유 임시 다운로드 경로 도우미 |
    | `plugin-sdk/logging-core` | 서브시스템 로거 및 마스킹 도우미 |
    | `plugin-sdk/markdown-table-runtime` | markdown 표 모드 및 변환 도우미 |
    | `plugin-sdk/json-store` | 소규모 JSON 상태 읽기/쓰기 도우미 |
    | `plugin-sdk/file-lock` | 재진입 가능한 파일 잠금 도우미 |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 중복 제거 캐시 도우미 |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 응답 디스패치 도우미 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 import 없이 수행하는 읽기 전용 ACP 바인딩 해석 |
    | `plugin-sdk/agent-config-primitives` | 좁은 에이전트 런타임 config 스키마 기본 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 boolean 매개변수 리더 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 해석 도우미 |
    | `plugin-sdk/device-bootstrap` | 디바이스 bootstrap 및 페어링 토큰 도우미 |
    | `plugin-sdk/extension-shared` | 공유 passive-channel, 상태, ambient proxy 도우미 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/provider 응답 도우미 |
    | `plugin-sdk/skill-commands-runtime` | Skills 명령 목록 도우미 |
    | `plugin-sdk/native-command-registry` | 네이티브 명령 레지스트리/빌드/직렬화 도우미 |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 harness를 위한 실험적 trusted-plugin 표면: harness 타입, 활성 실행 steer/abort 도우미, OpenClaw 도구 브리지 도우미, 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 엔드포인트 감지 도우미 |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/Heartbeat 도우미 |
    | `plugin-sdk/collection-runtime` | 소규모 bounded cache 도우미 |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 도우미 |
    | `plugin-sdk/error-runtime` | 오류 그래프, 서식, 공유 오류 분류 도우미, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, proxy, pinned lookup 도우미 |
    | `plugin-sdk/runtime-fetch` | proxy/guarded-fetch import 없이 사용하는 dispatcher 인식 런타임 fetch |
    | `plugin-sdk/response-limit-runtime` | 넓은 media 런타임 표면 없이 사용하는 제한된 응답 본문 리더 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 페어링 저장소 없이 현재 대화 바인딩 상태 제공 |
    | `plugin-sdk/session-store-runtime` | 넓은 config 쓰기/유지보수 import 없이 사용하는 세션 저장소 읽기 도우미 |
    | `plugin-sdk/context-visibility-runtime` | 넓은 config/보안 import 없이 사용하는 컨텍스트 표시 해석 및 보조 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | markdown/로깅 import 없이 사용하는 좁은 기본 레코드/문자열 강제 변환 및 정규화 도우미 |
    | `plugin-sdk/host-runtime` | 호스트명 및 SCP 호스트 정규화 도우미 |
    | `plugin-sdk/retry-runtime` | 재시도 config 및 재시도 실행기 도우미 |
    | `plugin-sdk/agent-runtime` | 에이전트 디렉터리/식별성/workspace 도우미 |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 쿼리/중복 제거 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability 및 테스트 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공유 미디어 fetch/변환/저장 도우미와 미디어 페이로드 빌더 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 같은 좁은 미디어 저장소 도우미 |
    | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 failover 도우미, 후보 선택, 누락된 모델 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 provider 타입과 provider 대상 이미지/오디오 도우미 export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 제거, markdown 렌더링/청킹/표 도우미, 마스킹 도우미, directive-tag 도우미, 안전한 텍스트 유틸리티 같은 공유 텍스트/markdown/로깅 도우미 |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 청킹 도우미 |
    | `plugin-sdk/speech` | speech provider 타입과 provider 대상 directive, 레지스트리, 검증 도우미 |
    | `plugin-sdk/speech-core` | 공유 speech provider 타입, 레지스트리, directive, 정규화 도우미 |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 provider 타입, 레지스트리 도우미, 공유 WebSocket 세션 도우미 |
    | `plugin-sdk/realtime-voice` | 실시간 음성 provider 타입 및 레지스트리 도우미 |
    | `plugin-sdk/image-generation` | 이미지 생성 provider 타입 |
    | `plugin-sdk/image-generation-core` | 공유 이미지 생성 타입, failover, 인증, 레지스트리 도우미 |
    | `plugin-sdk/music-generation` | 음악 생성 provider/요청/결과 타입 |
    | `plugin-sdk/music-generation-core` | 공유 음악 생성 타입, failover 도우미, provider 조회, model-ref 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 provider/요청/결과 타입 |
    | `plugin-sdk/video-generation-core` | 공유 비디오 생성 타입, failover 도우미, provider 조회, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 라우트 설치 도우미 |
    | `plugin-sdk/webhook-path` | Webhook 경로 정규화 도우미 |
    | `plugin-sdk/web-media` | 공유 원격/로컬 미디어 로딩 도우미 |
    | `plugin-sdk/zod` | plugin SDK 소비자를 위한 `zod` 재export |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 하위 경로">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI 도우미를 위한 번들 memory-core 도우미 표면 |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 파사드 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 계약, 레지스트리 접근, 로컬 provider, 일반 batch/원격 도우미 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 export |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 export |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 도우미 |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 도우미 |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 도우미 |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 도우미 |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 도우미 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 도우미 |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 도우미 |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 도우미 |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 도우미를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 도우미를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 도우미를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-host-markdown` | memory 인접 Plugin을 위한 공유 managed-markdown 도우미 |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 파사드 |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 도우미를 위한 벤더 중립 별칭 |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 도우미 표면 |
  </Accordion>

  <Accordion title="예약된 번들 도우미 하위 경로">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 browser Plugin 지원 도우미(`browser-support`는 호환성 barrel로 유지) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix 도우미/런타임 표면 |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE 도우미/런타임 표면 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC 도우미 표면 |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 channel 호환성/도우미 경계 |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/Plugin 도우미 경계. `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export함 |
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
