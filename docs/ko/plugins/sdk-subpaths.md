---
read_when:
    - Plugin import에 적합한 plugin-sdk 하위 경로 선택
    - 번들 Plugin 하위 경로 및 helper surface 감사
summary: 'Plugin SDK 하위 경로 카탈로그: 어떤 import가 어디에 있는지, 영역별로 그룹화됨'
title: Plugin SDK 하위 경로
x-i18n:
    generated_at: "2026-04-25T12:28:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK는 `openclaw/plugin-sdk/` 아래의 좁은 하위 경로 집합으로 노출됩니다.
  이 페이지는 일반적으로 사용되는 하위 경로를 용도별로 그룹화해 정리합니다. 생성된
  전체 200개 이상의 하위 경로 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며,
  예약된 번들 Plugin helper 하위 경로도 여기에 나타나지만 문서 페이지에서 명시적으로 승격하지 않는 한
  구현 세부 사항입니다.

  Plugin 작성 가이드는 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

  ## Plugin 엔트리

  | 하위 경로                  | 주요 export                                                                                                                            |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="채널 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 export (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 공통 설정 마법사 helper, 허용 목록 프롬프트, 설정 상태 빌더 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 다중 계정 config/동작 게이트 helper, 기본 계정 fallback helper |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, account-id 정규화 helper |
    | `plugin-sdk/account-resolution` | 계정 조회 + 기본 fallback helper |
    | `plugin-sdk/account-helpers` | 좁은 범위의 account-list/account-action helper |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | 채널 config 스키마 타입 |
    | `plugin-sdk/telegram-command-config` | 번들 contract fallback이 포함된 Telegram 사용자 지정 명령 정규화/검증 helper |
    | `plugin-sdk/command-gating` | 좁은 범위의 명령 권한 부여 게이트 helper |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, 초안 스트림 수명 주기/마무리 helper |
    | `plugin-sdk/inbound-envelope` | 공통 인바운드 라우트 + envelope 빌더 helper |
    | `plugin-sdk/inbound-reply-dispatch` | 공통 인바운드 기록 및 디스패치 helper |
    | `plugin-sdk/messaging-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/outbound-media` | 공통 아웃바운드 미디어 로딩 helper |
    | `plugin-sdk/outbound-runtime` | 아웃바운드 전달, ID, 전송 delegate, 세션, 포맷팅, payload 계획 helper |
    | `plugin-sdk/poll-runtime` | 좁은 범위의 poll 정규화 helper |
    | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 수명 주기 및 adapter helper |
    | `plugin-sdk/agent-media-payload` | 레거시 에이전트 미디어 payload 빌더 |
    | `plugin-sdk/conversation-runtime` | 대화/스레드 바인딩, pairing, 구성된 바인딩 helper |
    | `plugin-sdk/runtime-config-snapshot` | 런타임 config 스냅샷 helper |
    | `plugin-sdk/runtime-group-policy` | 런타임 그룹 정책 확인 helper |
    | `plugin-sdk/channel-status` | 공통 채널 상태 스냅샷/요약 helper |
    | `plugin-sdk/channel-config-primitives` | 좁은 범위의 채널 config 스키마 기본 요소 |
    | `plugin-sdk/channel-config-writes` | 채널 config 쓰기 권한 부여 helper |
    | `plugin-sdk/channel-plugin-common` | 공통 채널 Plugin 프렐류드 export |
    | `plugin-sdk/allowlist-config-edit` | 허용 목록 config 편집/읽기 helper |
    | `plugin-sdk/group-access` | 공통 그룹 접근 결정 helper |
    | `plugin-sdk/direct-dm` | 공통 direct-DM 인증/가드 helper |
    | `plugin-sdk/interactive-runtime` | 의미 기반 메시지 표시, 전달, 레거시 interactive reply helper. [메시지 표시](/ko/plugins/message-presentation) 참조 |
    | `plugin-sdk/channel-inbound` | 인바운드 debounce, 멘션 매칭, 멘션 정책 helper 및 envelope helper를 위한 호환성 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 좁은 범위의 인바운드 debounce helper |
    | `plugin-sdk/channel-mention-gating` | 더 넓은 인바운드 런타임 surface 없이 멘션 정책 및 멘션 텍스트 helper 제공 |
    | `plugin-sdk/channel-envelope` | 좁은 범위의 인바운드 envelope 포맷팅 helper |
    | `plugin-sdk/channel-location` | 채널 위치 컨텍스트 및 포맷팅 helper |
    | `plugin-sdk/channel-logging` | 인바운드 드롭 및 typing/ack 실패에 대한 채널 로깅 helper |
    | `plugin-sdk/channel-send-result` | reply 결과 타입 |
    | `plugin-sdk/channel-actions` | 채널 메시지 action helper와 Plugin 호환성을 위해 유지되는 지원 중단된 기본 스키마 helper |
    | `plugin-sdk/channel-targets` | 대상 파싱/매칭 helper |
    | `plugin-sdk/channel-contract` | 채널 contract 타입 |
    | `plugin-sdk/channel-feedback` | 피드백/리액션 연결 |
    | `plugin-sdk/channel-secret-runtime` | `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 같은 좁은 범위의 secret contract helper 및 secret target 타입 |
  </Accordion>

  <Accordion title="Provider 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 엄선된 로컬/셀프 호스팅 provider 설정 helper |
    | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 셀프 호스팅 provider 설정 전용 helper |
    | `plugin-sdk/cli-backend` | CLI 백엔드 기본값 + watchdog 상수 |
    | `plugin-sdk/provider-auth-runtime` | provider Plugin용 런타임 API 키 확인 helper |
    | `plugin-sdk/provider-auth-api-key` | `upsertApiKeyProfile` 같은 API 키 온보딩/프로필 쓰기 helper |
    | `plugin-sdk/provider-auth-result` | 표준 OAuth auth-result 빌더 |
    | `plugin-sdk/provider-auth-login` | provider Plugin용 공통 대화형 로그인 helper |
    | `plugin-sdk/provider-env-vars` | provider 인증 env-var 조회 helper |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공통 replay-policy 빌더, provider 엔드포인트 helper, `normalizeNativeXaiModelId` 같은 model-id 정규화 helper |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 일반 provider HTTP/엔드포인트 capability helper, provider HTTP 오류, audio transcription multipart form helper |
    | `plugin-sdk/provider-web-fetch-contract` | `enablePluginInConfig`, `WebFetchProviderPlugin` 같은 좁은 범위의 web-fetch config/선택 contract helper |
    | `plugin-sdk/provider-web-fetch` | web-fetch provider 등록/캐시 helper |
    | `plugin-sdk/provider-web-search-config-contract` | Plugin 활성화 연결이 필요 없는 provider용 좁은 범위의 web-search config/자격 증명 helper |
    | `plugin-sdk/provider-web-search-contract` | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위가 지정된 자격 증명 setter/getter 같은 좁은 범위의 web-search config/자격 증명 contract helper |
    | `plugin-sdk/provider-web-search` | web-search provider 등록/캐시/런타임 helper |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환성 helper |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 등 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 그리고 공통 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 helper |
    | `plugin-sdk/provider-transport-runtime` | guarded fetch, transport 메시지 변환, 쓰기 가능한 transport event stream 같은 기본 provider transport helper |
    | `plugin-sdk/provider-onboard` | 온보딩 config 패치 helper |
    | `plugin-sdk/global-singleton` | 프로세스 로컬 singleton/map/cache helper |
    | `plugin-sdk/group-activation` | 좁은 범위의 그룹 활성화 모드 및 명령 파싱 helper |
  </Accordion>

  <Accordion title="인증 및 보안 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 동적 인자 메뉴 포맷팅을 포함한 명령 레지스트리 helper, 발신자 권한 부여 helper |
    | `plugin-sdk/command-status` | `buildCommandsMessagePaginated`, `buildHelpMessage` 같은 명령/help 메시지 빌더 |
    | `plugin-sdk/approval-auth-runtime` | 승인자 확인 및 동일 채팅 action-auth helper |
    | `plugin-sdk/approval-client-runtime` | 기본 exec 승인 프로필/필터 helper |
    | `plugin-sdk/approval-delivery-runtime` | 기본 승인 capability/전달 adapter |
    | `plugin-sdk/approval-gateway-runtime` | 공통 승인 gateway 확인 helper |
    | `plugin-sdk/approval-handler-adapter-runtime` | hot 채널 엔트리포인트용 경량 기본 승인 adapter 로딩 helper |
    | `plugin-sdk/approval-handler-runtime` | 더 넓은 승인 handler 런타임 helper, 좁은 adapter/gateway seam으로 충분하면 그것을 우선 사용 |
    | `plugin-sdk/approval-native-runtime` | 기본 승인 대상 + 계정 바인딩 helper |
    | `plugin-sdk/approval-reply-runtime` | exec/Plugin 승인 reply payload helper |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 payload helper, 기본 승인 라우팅/런타임 helper, 그리고 `formatApprovalDisplayPath` 같은 구조화된 승인 표시 helper |
    | `plugin-sdk/reply-dedupe` | 좁은 범위의 인바운드 reply dedupe 재설정 helper |
    | `plugin-sdk/channel-contract-testing` | 넓은 testing barrel 없이 좁은 범위의 채널 contract 테스트 helper |
    | `plugin-sdk/command-auth-native` | 기본 명령 인증, 동적 인자 메뉴 포맷팅, 기본 session-target helper |
    | `plugin-sdk/command-detection` | 공통 명령 감지 helper |
    | `plugin-sdk/command-primitives-runtime` | hot 채널 경로용 경량 명령 텍스트 predicate |
    | `plugin-sdk/command-surface` | 명령 body 정규화 및 명령 surface helper |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 채널/Plugin secret surface를 위한 좁은 범위의 secret contract 수집 helper |
    | `plugin-sdk/secret-ref-runtime` | secret contract/config 파싱용 좁은 범위의 `coerceSecretRef` 및 SecretRef 타입 helper |
    | `plugin-sdk/security-runtime` | 공통 신뢰, DM 게이팅, 외부 콘텐츠, secret 수집 helper |
    | `plugin-sdk/ssrf-policy` | 호스트 허용 목록 및 private-network SSRF 정책 helper |
    | `plugin-sdk/ssrf-dispatcher` | 넓은 infra 런타임 surface 없이 좁은 범위의 pinned-dispatcher helper |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, SSRF 보호 fetch, SSRF 정책 helper |
    | `plugin-sdk/secret-input` | secret 입력 파싱 helper |
    | `plugin-sdk/webhook-ingress` | Webhook 요청/대상 helper |
    | `plugin-sdk/webhook-request-guards` | 요청 body 크기/타임아웃 helper |
  </Accordion>

  <Accordion title="런타임 및 저장소 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/runtime` | 폭넓은 런타임/로깅/백업/Plugin 설치 helper |
    | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env, 로거, 타임아웃, 재시도, backoff helper |
    | `plugin-sdk/channel-runtime-context` | 일반 채널 런타임 컨텍스트 등록 및 조회 helper |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 공통 Plugin 명령/hook/http/interactive helper |
    | `plugin-sdk/hook-runtime` | 공통 Webhook/내부 hook 파이프라인 helper |
    | `plugin-sdk/lazy-runtime` | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` 같은 지연 런타임 import/바인딩 helper |
    | `plugin-sdk/process-runtime` | 프로세스 exec helper |
    | `plugin-sdk/cli-runtime` | CLI 포맷팅, 대기, 버전, 인자 호출, 지연 명령 그룹 helper |
    | `plugin-sdk/gateway-runtime` | Gateway 클라이언트 및 채널 상태 패치 helper |
    | `plugin-sdk/config-runtime` | config 로드/쓰기 helper 및 Plugin config 조회 helper |
    | `plugin-sdk/telegram-command-config` | 번들 Telegram contract surface를 사용할 수 없을 때도 Telegram 명령 이름/설명 정규화와 중복/충돌 검사 제공 |
    | `plugin-sdk/text-autolink-runtime` | 넓은 text-runtime barrel 없이 파일 참조 autolink 감지 |
    | `plugin-sdk/approval-runtime` | exec/Plugin 승인 helper, 승인 capability 빌더, auth/profile helper, 기본 라우팅/런타임 helper, 구조화된 승인 표시 경로 포맷팅 |
    | `plugin-sdk/reply-runtime` | 공통 인바운드/reply 런타임 helper, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 reply dispatch/finalize 및 대화 레이블 helper |
    | `plugin-sdk/reply-history` | `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 공통 짧은 윈도우 reply-history helper |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 좁은 범위의 텍스트/Markdown chunking helper |
    | `plugin-sdk/session-store-runtime` | 세션 저장소 경로 + updated-at helper |
    | `plugin-sdk/state-paths` | 상태/OAuth 디렉터리 경로 helper |
    | `plugin-sdk/routing` | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` 같은 route/session-key/account 바인딩 helper |
    | `plugin-sdk/status-helpers` | 공통 채널/계정 상태 요약 helper, 런타임 상태 기본값, 이슈 메타데이터 helper |
    | `plugin-sdk/target-resolver-runtime` | 공통 대상 확인 helper |
    | `plugin-sdk/string-normalization-runtime` | slug/string 정규화 helper |
    | `plugin-sdk/request-url` | fetch/request 유사 입력에서 문자열 URL 추출 |
    | `plugin-sdk/run-command` | stdout/stderr 결과를 정규화하는 시간 제한 명령 실행기 |
    | `plugin-sdk/param-readers` | 공통 도구/CLI 파라미터 리더 |
    | `plugin-sdk/tool-payload` | 도구 결과 객체에서 정규화된 payload 추출 |
    | `plugin-sdk/tool-send` | 도구 인자에서 표준 send 대상 필드 추출 |
    | `plugin-sdk/temp-path` | 공통 임시 다운로드 경로 helper |
    | `plugin-sdk/logging-core` | 하위 시스템 로거 및 redaction helper |
    | `plugin-sdk/markdown-table-runtime` | Markdown 테이블 모드 및 변환 helper |
    | `plugin-sdk/json-store` | 작은 JSON 상태 읽기/쓰기 helper |
    | `plugin-sdk/file-lock` | 재진입 가능한 파일 잠금 helper |
    | `plugin-sdk/persistent-dedupe` | 디스크 기반 dedupe 캐시 helper |
    | `plugin-sdk/acp-runtime` | ACP 런타임/세션 및 reply-dispatch helper |
    | `plugin-sdk/acp-binding-resolve-runtime` | 수명 주기 시작 import 없이 읽기 전용 ACP 바인딩 확인 |
    | `plugin-sdk/agent-config-primitives` | 좁은 범위의 에이전트 런타임 config 스키마 기본 요소 |
    | `plugin-sdk/boolean-param` | 느슨한 boolean 파라미터 리더 |
    | `plugin-sdk/dangerous-name-runtime` | 위험한 이름 매칭 확인 helper |
    | `plugin-sdk/device-bootstrap` | 디바이스 부트스트랩 및 pairing 토큰 helper |
    | `plugin-sdk/extension-shared` | 공통 passive-channel, 상태, ambient proxy helper 기본 요소 |
    | `plugin-sdk/models-provider-runtime` | `/models` 명령/provider reply helper |
    | `plugin-sdk/skill-commands-runtime` | Skills 명령 목록 helper |
    | `plugin-sdk/native-command-registry` | 기본 명령 레지스트리/build/serialize helper |
    | `plugin-sdk/agent-harness` | 저수준 에이전트 harness를 위한 실험적 신뢰 Plugin surface: harness 타입, 활성 실행 steer/abort helper, OpenClaw 도구 브리지 helper, 도구 진행 포맷팅/세부 helper, 시도 결과 유틸리티 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 엔드포인트 감지 helper |
    | `plugin-sdk/infra-runtime` | 시스템 이벤트/Heartbeat helper |
    | `plugin-sdk/collection-runtime` | 작은 bounded cache helper |
    | `plugin-sdk/diagnostic-runtime` | 진단 플래그 및 이벤트 helper |
    | `plugin-sdk/error-runtime` | 오류 그래프, 포맷팅, 공통 오류 분류 helper, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 래핑된 fetch, 프록시, pinned lookup helper |
    | `plugin-sdk/runtime-fetch` | 프록시/guarded-fetch import 없는 dispatcher 인식 런타임 fetch |
    | `plugin-sdk/response-limit-runtime` | 넓은 미디어 런타임 surface 없이 bounded response-body 리더 |
    | `plugin-sdk/session-binding-runtime` | 구성된 바인딩 라우팅 또는 pairing 저장소 없이 현재 대화 바인딩 상태 |
    | `plugin-sdk/session-store-runtime` | 폭넓은 config 쓰기/유지보수 import 없는 session-store 읽기 helper |
    | `plugin-sdk/context-visibility-runtime` | 폭넓은 config/security import 없이 컨텍스트 가시성 확인 및 보조 컨텍스트 필터링 |
    | `plugin-sdk/string-coerce-runtime` | Markdown/로깅 import 없는 좁은 범위의 기본 record/string 강제 변환 및 정규화 helper |
    | `plugin-sdk/host-runtime` | 호스트 이름 및 SCP 호스트 정규화 helper |
    | `plugin-sdk/retry-runtime` | 재시도 config 및 재시도 실행 helper |
    | `plugin-sdk/agent-runtime` | agent 디렉터리/ID/workspace helper |
    | `plugin-sdk/directory-runtime` | config 기반 디렉터리 질의/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability 및 테스트 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 공통 미디어 fetch/transform/store helper 및 미디어 payload 빌더 |
    | `plugin-sdk/media-store` | `saveMediaBuffer` 같은 좁은 범위의 미디어 저장소 helper |
    | `plugin-sdk/media-generation-runtime` | 공통 미디어 생성 failover helper, 후보 선택, 누락된 모델 메시지 |
    | `plugin-sdk/media-understanding` | 미디어 이해 provider 타입 및 provider용 image/audio helper export |
    | `plugin-sdk/text-runtime` | assistant-visible-text 제거, Markdown 렌더/chunking/table helper, redaction helper, directive-tag helper, safe-text 유틸리티 같은 공통 텍스트/Markdown/로깅 helper |
    | `plugin-sdk/text-chunking` | 아웃바운드 텍스트 chunking helper |
    | `plugin-sdk/speech` | 음성 provider 타입 및 provider용 directive, 레지스트리, 검증, 음성 helper export |
    | `plugin-sdk/speech-core` | 공통 음성 provider 타입, 레지스트리, directive, 정규화, 음성 helper export |
    | `plugin-sdk/realtime-transcription` | 실시간 전사 provider 타입, 레지스트리 helper, 공통 WebSocket 세션 helper |
    | `plugin-sdk/realtime-voice` | 실시간 음성 provider 타입 및 레지스트리 helper |
    | `plugin-sdk/image-generation` | 이미지 생성 provider 타입 |
    | `plugin-sdk/image-generation-core` | 공통 이미지 생성 타입, failover, auth, 레지스트리 helper |
    | `plugin-sdk/music-generation` | 음악 생성 provider/request/result 타입 |
    | `plugin-sdk/music-generation-core` | 공통 음악 생성 타입, failover helper, provider 조회, model-ref 파싱 |
    | `plugin-sdk/video-generation` | 비디오 생성 provider/request/result 타입 |
    | `plugin-sdk/video-generation-core` | 공통 비디오 생성 타입, failover helper, provider 조회, model-ref 파싱 |
    | `plugin-sdk/webhook-targets` | Webhook 대상 레지스트리 및 경로 설치 helper |
    | `plugin-sdk/webhook-path` | Webhook 경로 정규화 helper |
    | `plugin-sdk/web-media` | 공통 원격/로컬 미디어 로딩 helper |
    | `plugin-sdk/zod` | Plugin SDK 소비자를 위한 `zod` 재export |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Memory 하위 경로">
    | 하위 경로 | 주요 export |
    | --- | --- |
    | `plugin-sdk/memory-core` | manager/config/file/CLI helper를 위한 번들 memory-core helper surface |
    | `plugin-sdk/memory-core-engine-runtime` | 메모리 인덱스/검색 런타임 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 export |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 contract, 레지스트리 접근, 로컬 provider, 일반 batch/remote helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 export |
    | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 export |
    | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 helper |
    | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 helper |
    | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret helper |
    | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 helper |
    | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 helper |
    | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 helper |
    | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 helper |
    | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 helper를 위한 벤더 중립 alias |
    | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 helper를 위한 벤더 중립 alias |
    | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 helper를 위한 벤더 중립 alias |
    | `plugin-sdk/memory-host-markdown` | 메모리 인접 Plugin을 위한 공통 managed-markdown helper |
    | `plugin-sdk/memory-host-search` | 검색 관리자 접근을 위한 Active Memory 런타임 facade |
    | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 helper를 위한 벤더 중립 alias |
    | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper surface |
  </Accordion>

  <Accordion title="예약된 번들 helper 하위 경로">
    | 계열 | 현재 하위 경로 | 의도된 용도 |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 번들 browser Plugin 지원 helper. `browser-profiles`는 정규화된 `browser.tabCleanup` 형태를 위한 `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, `ResolvedBrowserTabCleanupConfig`를 export합니다. `browser-support`는 호환성 barrel로 유지됩니다. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 번들 Matrix helper/런타임 surface |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 번들 LINE helper/런타임 surface |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 번들 IRC helper surface |
    | 채널별 helper | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 번들 채널 호환성/helper seam |
    | 인증/Plugin별 helper | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 번들 기능/Plugin helper seam; `plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 export합니다 |
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin SDK 개요](/ko/plugins/sdk-overview)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
