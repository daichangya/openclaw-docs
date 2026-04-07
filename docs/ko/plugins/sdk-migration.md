---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시될 때'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시될 때'
    - plugin을 최신 plugin 아키텍처로 업데이트하고 있을 때
    - 외부 OpenClaw plugin을 유지 관리할 때
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 plugin SDK로 마이그레이션
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-07T05:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3691060e9dc00ca8bee49240a047f0479398691bd14fb96e9204cc9243fdb32c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 마이그레이션

OpenClaw는 광범위한 하위 호환성 계층에서, 집중되고 문서화된 import를 갖춘 최신 plugin
아키텍처로 이동했습니다. plugin이 새로운
아키텍처 이전에 만들어졌다면, 이 가이드가 마이그레이션에 도움이 됩니다.

## 무엇이 바뀌고 있나요

이전 plugin 시스템은 plugin이 단일 엔트리 포인트에서 필요한 모든 것을
import할 수 있도록 하는 두 개의 광범위한 surface를 제공했습니다:

- **`openclaw/plugin-sdk/compat`** — 수십 개의
  helper를 다시 내보내는 단일 import입니다. 새로운 plugin 아키텍처가 구축되는 동안
  오래된 hook 기반 plugins가 계속 동작하도록 도입되었습니다.
- **`openclaw/extension-api`** — plugin이 내장 agent runner 같은
  호스트 측 helper에 직접 접근할 수 있게 해 주는 브리지입니다.

이 두 surface는 이제 모두 **deprecated** 상태입니다. 런타임에서는 여전히 동작하지만, 새
plugins는 이를 사용하면 안 되며, 기존 plugins는 다음 major 릴리스에서 제거되기 전에
마이그레이션해야 합니다.

<Warning>
  하위 호환성 계층은 향후 major 릴리스에서 제거될 예정입니다.
  이 surface들에서 여전히 import하는 plugins는 그 시점에 깨지게 됩니다.
</Warning>

## 왜 바뀌었나요

이전 접근 방식은 다음과 같은 문제를 일으켰습니다:

- **느린 시작** — helper 하나를 import하면 관련 없는 수십 개의 모듈이 함께 로드됨
- **순환 의존성** — 광범위한 재내보내기로 인해 import cycle이 쉽게 생김
- **불명확한 API surface** — 어떤 export가 안정적인지, 어떤 것이 내부용인지 구분할 방법이 없음

최신 plugin SDK는 이를 해결합니다: 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 channel용 레거시 provider 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
channel 브랜드 helper seam,
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 plugin 계약이 아니라
비공개 mono-repo 바로가기였습니다. 대신 좁고 일반적인 SDK subpath를 사용하세요. 번들
plugin 워크스페이스 내부에서는 provider 소유 helper를 해당 plugin의 자체
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시:

- Anthropic은 Claude 전용 스트림 helper를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 provider 빌더, 기본 모델 helper, 실시간 provider
  빌더를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider 빌더와 onboarding/config helper를 자체
  `api.ts`에 유지합니다

## 마이그레이션 방법

<Steps>
  <Step title="Windows wrapper fallback 동작 점검">
    plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용한다면, 해결되지 않는 Windows
    `.cmd`/`.bat` wrapper는 이제 명시적으로
    `allowShellFallback: true`를 전달하지 않으면 실패를 닫힌 상태로 처리합니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 신뢰된 호환성 호출자이고 의도적으로
      // 셸 매개 fallback을 허용하는 경우에만 이것을 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 의도적으로 shell fallback에 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    plugin에서 deprecated surface 중 하나에서 import하는 부분을 검색하세요:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    이전 surface의 각 export는 특정 최신 import 경로에 매핑됩니다:

    ```typescript
    // Before (deprecated 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (최신 집중형 imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 helper의 경우, 직접 import하는 대신 주입된 plugin runtime을 사용하세요:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (주입된 runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 bridge helper에도 적용됩니다:

    | Old import | 최신 동등 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import 경로 참조

<Accordion title="일반적인 import 경로 표">
  | Import path | 용도 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 plugin 엔트리 helper | `definePluginEntry` |
  | `plugin-sdk/core` | channel 엔트리 정의/빌더용 레거시 umbrella 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider 엔트리 helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중형 channel 엔트리 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공용 setup wizard helper | Allowlist 프롬프트, setup 상태 빌더 |
  | `plugin-sdk/setup-runtime` | setup 시점 runtime helper | import-safe setup patch adapter, lookup-note helper, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임 setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 helper | 계정 목록/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 helper | 계정 조회 + 기본 fallback helper |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 helper | 계정 목록/계정 작업 helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing 기본 구성 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 응답 접두사 + typing 연결 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter 팩터리 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config 스키마 빌더 | Channel config 스키마 타입 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config helper | 명령 이름 정규화, 설명 다듬기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 추적 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 인바운드 envelope helper | 공용 route + envelope 빌더 helper |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 응답 helper | 공용 기록 및 디스패치 helper |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 helper |
  | `plugin-sdk/outbound-media` | 아웃바운드 media helper | 공용 아웃바운드 media 로딩 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 runtime helper | 아웃바운드 ID/전송 delegate helper |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding helper | thread-binding 수명 주기 및 adapter helper |
  | `plugin-sdk/agent-media-payload` | 레거시 media payload helper | 레거시 필드 레이아웃용 agent media payload 빌더 |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 channel runtime 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 응답 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 runtime helper | Runtime/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 좁은 범위의 runtime env helper | Logger/runtime env, timeout, retry, backoff helper |
  | `plugin-sdk/plugin-runtime` | 공용 plugin runtime helper | Plugin commands/hooks/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook pipeline helper | 공용 webhook/internal hook pipeline helper |
  | `plugin-sdk/lazy-runtime` | 지연 runtime helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 helper | 공용 exec helper |
  | `plugin-sdk/cli-runtime` | CLI runtime helper | 명령 포맷팅, 대기, 버전 helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway 클라이언트 및 channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | Config 로드/쓰기 helper |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 helper | 번들 Telegram 계약 surface를 사용할 수 없을 때의 fallback-stable Telegram 명령 검증 helper |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 helper | Exec/plugin 승인 payload, 승인 capability/profile helper, 네이티브 승인 라우팅/runtime helper |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 helper | 승인자 해석, 동일 채팅 작업 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 helper | 네이티브 exec 승인 profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 helper | 네이티브 승인 capability/전달 adapter |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 helper | 네이티브 승인 대상/계정 바인딩 helper |
  | `plugin-sdk/approval-reply-runtime` | 승인 응답 helper | Exec/plugin 승인 응답 payload helper |
  | `plugin-sdk/security-runtime` | 보안 helper | 공용 신뢰, DM 게이팅, 외부 콘텐츠, secret 수집 helper |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 helper | 호스트 allowlist 및 private-network 정책 helper |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime helper | Pinned-dispatcher, guarded fetch, SSRF 정책 helper |
  | `plugin-sdk/collection-runtime` | 제한된 캐시 helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 helper | `formatUncaughtError`, `isApprovalNotFoundError`, error graph helper |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/proxy helper | `resolveFetch`, proxy helper |
  | `plugin-sdk/host-runtime` | 호스트 정규화 helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry helper | `RetryConfig`, `retryAsync`, 정책 러너 |
  | `plugin-sdk/allow-from` | Allowlist 포맷팅 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 surface helper | `resolveControlCommandGate`, 발신자 인증 helper, 명령 레지스트리 helper |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | Secret 입력 helper |
  | `plugin-sdk/webhook-ingress` | webhook 요청 helper | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | webhook 본문 guard helper | 요청 본문 읽기/제한 helper |
  | `plugin-sdk/reply-runtime` | 공용 응답 runtime | 인바운드 디스패치, heartbeat, 응답 planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 응답 디스패치 helper | finalize + provider 디스패치 helper |
  | `plugin-sdk/reply-history` | 응답 기록 helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 응답 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 응답 chunk helper | 텍스트/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 helper | 저장소 경로 + updated-at helper |
  | `plugin-sdk/state-paths` | 상태 경로 helper | 상태 및 OAuth 디렉터리 helper |
  | `plugin-sdk/routing` | 라우팅/세션 키 helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 helper |
  | `plugin-sdk/status-helpers` | Channel 상태 helper | Channel/계정 상태 요약 빌더, runtime-state 기본값, 이슈 메타데이터 helper |
  | `plugin-sdk/target-resolver-runtime` | 대상 resolver helper | 공용 대상 resolver helper |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 helper | slug/문자열 정규화 helper |
  | `plugin-sdk/request-url` | 요청 URL helper | request 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 helper | stdout/stderr가 정규화된 시간 제한 명령 러너 |
  | `plugin-sdk/param-readers` | 파라미터 리더 | 공용 tool/CLI 파라미터 리더 |
  | `plugin-sdk/tool-send` | tool 전송 추출 | tool 인수에서 정규 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 helper | 공용 임시 다운로드 경로 helper |
  | `plugin-sdk/logging-core` | 로깅 helper | 서브시스템 logger 및 redaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 helper | Markdown 표 모드 helper |
  | `plugin-sdk/reply-payload` | 메시지 응답 타입 | 응답 payload 타입 |
  | `plugin-sdk/provider-setup` | 선별된 로컬/self-hosted provider setup helper | Self-hosted provider 탐지/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 집중형 OpenAI 호환 self-hosted provider setup helper | 동일한 self-hosted provider 탐지/config helper |
  | `plugin-sdk/provider-auth-runtime` | provider runtime 인증 helper | Runtime API 키 해석 helper |
  | `plugin-sdk/provider-auth-api-key` | provider API 키 setup helper | API 키 onboarding/profile-write helper |
  | `plugin-sdk/provider-auth-result` | provider auth-result helper | 표준 OAuth auth-result 빌더 |
  | `plugin-sdk/provider-auth-login` | provider 대화형 로그인 helper | 공용 대화형 로그인 helper |
  | `plugin-sdk/provider-env-vars` | provider env-var helper | Provider 인증 env-var 조회 helper |
  | `plugin-sdk/provider-model-shared` | 공용 provider 모델/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy 빌더, provider-endpoint helper, 모델 ID 정규화 helper |
  | `plugin-sdk/provider-catalog-shared` | 공용 provider 카탈로그 helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider onboarding patch | Onboarding config helper |
  | `plugin-sdk/provider-http` | provider HTTP helper | 일반 provider HTTP/엔드포인트 capability helper |
  | `plugin-sdk/provider-web-fetch` | provider 웹 fetch helper | 웹 fetch provider 등록/캐시 helper |
  | `plugin-sdk/provider-web-search-contract` | provider 웹 search 계약 helper | `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 범위의 웹 search config/자격 증명 계약 helper |
  | `plugin-sdk/provider-web-search` | provider 웹 search helper | 웹 search provider 등록/캐시/runtime helper |
  | `plugin-sdk/provider-tools` | provider tool/schema 호환 helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 helper |
  | `plugin-sdk/provider-usage` | provider 사용량 helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 그 외 provider 사용량 helper |
  | `plugin-sdk/provider-stream` | provider 스트림 wrapper helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 wrapper 타입, 그리고 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper helper |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 async 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공용 media helper | Media fetch/transform/store helper 및 media payload 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공용 media-generation helper | 공용 failover helper, 후보 선택, image/video/music generation용 누락 모델 메시지 |
  | `plugin-sdk/media-understanding` | media-understanding helper | Media understanding provider 타입 및 provider용 image/audio helper export |
  | `plugin-sdk/text-runtime` | 공용 텍스트 helper | assistant 표시 텍스트 제거, markdown 렌더/chunking/table helper, redaction helper, directive-tag helper, safe-text 유틸리티 및 관련 텍스트/로깅 helper |
  | `plugin-sdk/text-chunking` | 텍스트 chunking helper | 아웃바운드 텍스트 chunking helper |
  | `plugin-sdk/speech` | speech helper | Speech provider 타입 및 provider용 directive, registry, validation helper |
  | `plugin-sdk/speech-core` | 공용 speech core | Speech provider 타입, registry, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 helper | Provider 타입 및 registry helper |
  | `plugin-sdk/realtime-voice` | 실시간 음성 helper | Provider 타입 및 registry helper |
  | `plugin-sdk/image-generation-core` | 공용 image-generation core | Image-generation 타입, failover, 인증, registry helper |
  | `plugin-sdk/music-generation` | music-generation helper | Music-generation provider/request/result 타입 |
  | `plugin-sdk/music-generation-core` | 공용 music-generation core | Music-generation 타입, failover helper, provider 조회, model-ref 파싱 |
  | `plugin-sdk/video-generation` | video-generation helper | Video-generation provider/request/result 타입 |
  | `plugin-sdk/video-generation-core` | 공용 video-generation core | Video-generation 타입, failover helper, provider 조회, model-ref 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 응답 helper | 대화형 응답 payload 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | channel config 기본 구성 요소 | 좁은 범위의 channel config-schema 기본 구성 요소 |
  | `plugin-sdk/channel-config-writes` | channel config-write helper | Channel config-write 인증 helper |
  | `plugin-sdk/channel-plugin-common` | 공용 channel 프렐류드 | 공용 channel plugin 프렐류드 export |
  | `plugin-sdk/channel-status` | channel 상태 helper | 공용 channel 상태 스냅샷/요약 helper |
  | `plugin-sdk/allowlist-config-edit` | allowlist config helper | Allowlist config 편집/읽기 helper |
  | `plugin-sdk/group-access` | 그룹 접근 helper | 공용 그룹 접근 결정 helper |
  | `plugin-sdk/direct-dm` | direct-DM helper | 공용 direct-DM 인증/guard helper |
  | `plugin-sdk/extension-shared` | 공용 extension helper | passive-channel/status 및 ambient proxy helper 기본 구성 요소 |
  | `plugin-sdk/webhook-targets` | webhook 대상 helper | webhook 대상 레지스트리 및 route-install helper |
  | `plugin-sdk/webhook-path` | webhook 경로 helper | webhook 경로 정규화 helper |
  | `plugin-sdk/web-media` | 공용 웹 media helper | 원격/로컬 media 로딩 helper |
  | `plugin-sdk/zod` | Zod 재내보내기 | plugin SDK 소비자를 위한 재내보낸 `zod` |
  | `plugin-sdk/memory-core` | 번들 memory-core helper | Memory manager/config/file/CLI helper surface |
  | `plugin-sdk/memory-core-engine-runtime` | memory 엔진 runtime 파사드 | Memory index/search runtime 파사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | memory host foundation 엔진 | Memory host foundation engine exports |
  | `plugin-sdk/memory-core-host-engine-embeddings` | memory host embedding 엔진 | Memory host embedding engine exports |
  | `plugin-sdk/memory-core-host-engine-qmd` | memory host QMD 엔진 | Memory host QMD engine exports |
  | `plugin-sdk/memory-core-host-engine-storage` | memory host storage 엔진 | Memory host storage engine exports |
  | `plugin-sdk/memory-core-host-multimodal` | memory host 멀티모달 helper | Memory host multimodal helper |
  | `plugin-sdk/memory-core-host-query` | memory host query helper | Memory host query helper |
  | `plugin-sdk/memory-core-host-secret` | memory host secret helper | Memory host secret helper |
  | `plugin-sdk/memory-core-host-events` | memory host event journal helper | Memory host event journal helper |
  | `plugin-sdk/memory-core-host-status` | memory host 상태 helper | Memory host status helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | memory host CLI runtime | Memory host CLI runtime helper |
  | `plugin-sdk/memory-core-host-runtime-core` | memory host core runtime | Memory host core runtime helper |
  | `plugin-sdk/memory-core-host-runtime-files` | memory host 파일/runtime helper | Memory host file/runtime helper |
  | `plugin-sdk/memory-host-core` | memory host core runtime 별칭 | memory host core runtime helper용 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-events` | memory host event journal 별칭 | memory host event journal helper용 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-files` | memory host 파일/runtime 별칭 | memory host file/runtime helper용 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown helper | memory 인접 plugins용 공용 managed-markdown helper |
  | `plugin-sdk/memory-host-search` | 활성 memory 검색 파사드 | 지연 active-memory search-manager runtime 파사드 |
  | `plugin-sdk/memory-host-status` | memory host 상태 별칭 | memory host status helper용 vendor-neutral 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper | Memory-lancedb helper surface |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 helper 및 mock |
</Accordion>

이 표는 의도적으로 전체 SDK
surface가 아니라 일반적인 마이그레이션 하위 집합만 다룹니다. 200개가 넘는 전체 엔트리포인트 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들-plugin helper seam이 포함되어 있습니다. 이들은
번들-plugin 유지 관리 및 호환성을 위해 계속 export되지만, 일반적인 마이그레이션 표에서는 의도적으로
제외되어 있으며 새로운 plugin 코드에 권장되는 대상은 아닙니다.

같은 규칙이 다음과 같은 다른 번들 helper 계열에도 적용됩니다:

- browser 지원 helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은 번들 helper/plugin surface

`plugin-sdk/github-copilot-token`은 현재
좁은 범위의 token-helper surface인 `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| 시점 | 발생하는 일 |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금** | deprecated surface가 런타임 경고를 발생시킴 |
| **다음 major release** | deprecated surface가 제거되며, 여전히 이를 사용하는 plugins는 실패함 |

모든 core plugins는 이미 마이그레이션되었습니다. 외부 plugins는
다음 major 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 일시적인 탈출구일 뿐, 영구적인 해결책이 아닙니다.

## 관련

- [시작하기](/ko/plugins/building-plugins) — 첫 plugin 만들기
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — channel plugins 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider plugins 만들기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 분석
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마 참조
