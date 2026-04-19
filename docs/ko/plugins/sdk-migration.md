---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시됩니다'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시됩니다'
    - Plugin을 최신 플러그인 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리하고 있습니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 레이어에서 최신 Plugin SDK로 마이그레이션하세요
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-19T01:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 마이그레이션

OpenClaw는 광범위한 하위 호환성 레이어에서, 집중적이고 문서화된 import를 사용하는 최신 플러그인 아키텍처로 전환했습니다. 플러그인이 새 아키텍처 이전에 만들어졌다면, 이 가이드가 마이그레이션에 도움이 됩니다.

## 변경되는 내용

이전 플러그인 시스템은 플러그인이 단일 진입점에서 필요한 모든 것을 import할 수 있도록 하는 두 개의 광범위하게 열린 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** — 수십 개의 헬퍼를 다시 export하는 단일 import입니다. 새 플러그인 아키텍처가 구축되는 동안 오래된 hook 기반 플러그인이 계속 작동하도록 도입되었습니다.
- **`openclaw/extension-api`** — 내장 에이전트 러너 같은 호스트 측 헬퍼에 플러그인이 직접 접근할 수 있게 해주는 브리지입니다.

이제 두 표면 모두 **지원 중단**되었습니다. 런타임에서는 여전히 작동하지만, 새 Plugin은 이를 사용하면 안 되며, 기존 Plugin은 다음 메이저 릴리스에서 제거되기 전에 마이그레이션해야 합니다.

<Warning>
  하위 호환성 레이어는 향후 메이저 릴리스에서 제거될 예정입니다.
  여전히 이 표면에서 import하는 Plugin은 그 시점에 중단됩니다.
</Warning>

## 변경 이유

이전 접근 방식은 문제를 일으켰습니다.

- **느린 시작 속도** — 헬퍼 하나를 import하면 관련 없는 수십 개의 모듈이 로드되었습니다
- **순환 의존성** — 광범위한 재export 때문에 import cycle이 쉽게 만들어졌습니다
- **불명확한 API 표면** — 어떤 export가 안정적인지, 어떤 것이 내부용인지 구분할 방법이 없었습니다

최신 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는 명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널용 레거시 provider 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, 채널 브랜드 헬퍼 seam, 그리고 `openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 플러그인 계약이 아니라 비공개 mono-repo 단축 경로였습니다. 대신 좁고 일반적인 SDK 하위 경로를 사용하세요. 번들 플러그인 워크스페이스 내부에서는 provider 소유 헬퍼를 해당 Plugin의 자체 `api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시:

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` / `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, 기본 모델 헬퍼, realtime provider builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 온보딩/설정 헬퍼를 자체 `api.ts`에 유지합니다

## 마이그레이션 방법

<Steps>
  <Step title="승인 네이티브 핸들러를 capability fact로 마이그레이션">
    승인 기능이 있는 채널 Plugin은 이제 `approvalCapability.nativeRuntime`과 공유 runtime-context registry를 통해 네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를 `approvalCapability.nativeRuntime`으로 교체
    - 승인 전용 auth/delivery를 레거시 `plugin.auth` / `plugin.approvals` wiring에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin 계약에서 제거되었습니다. delivery/native/render 필드를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 채널 login/logout 흐름에만 남아 있으며, 그 안의 승인 auth hook은 더 이상 core에서 읽지 않습니다
    - 클라이언트, 토큰, Bolt app 같은 채널 소유 runtime 객체를 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 승인 핸들러에서 Plugin 소유 reroute 알림을 보내지 마세요. 이제 core가 실제 delivery 결과에서 routed-elsewhere 알림을 담당합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는 실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 stub은 거부됩니다

    현재 승인 capability 레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Windows wrapper fallback 동작 점검">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 해결되지 않은 Windows `.cmd`/`.bat` wrapper는 이제 `allowShellFallback: true`를 명시적으로 전달하지 않으면 fail-closed 동작을 합니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    호출자가 shell fallback에 의도적으로 의존하지 않는다면 `allowShellFallback`을 설정하지 말고, 대신 throw된 오류를 처리하세요.

  </Step>

  <Step title="지원 중단된 import 찾기">
    Plugin에서 두 지원 중단 표면 중 하나를 import하는 부분을 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    이전 표면의 각 export는 특정한 최신 import 경로에 매핑됩니다.

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼의 경우 직접 import하는 대신 주입된 플러그인 runtime을 사용하세요.

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    다른 레거시 브리지 헬퍼에도 동일한 패턴이 적용됩니다.

    | 이전 import | 최신 대응 항목 |
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
  | `plugin-sdk/plugin-entry` | 정식 플러그인 엔트리 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 엔트리 정의/빌더용 레거시 umbrella 재export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider 엔트리 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 엔트리 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공용 설정 마법사 헬퍼 | Allowlist 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 runtime 헬퍼 | import-safe 설정 patch adapter, lookup-note 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 proxy |
  | `plugin-sdk/setup-adapter-runtime` | 설정 adapter 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/config/action-gate 헬퍼 |
  | `plugin-sdk/account-id` | account-id 헬퍼 | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 fallback 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 헬퍼 | 계정 목록/계정 작업 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing 기본 구성 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 prefix + typing wiring | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Config adapter 팩토리 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Config 스키마 빌더 | 채널 config 스키마 타입 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config 헬퍼 | 명령 이름 정규화, 설명 trimming, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 추적 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 인바운드 envelope 헬퍼 | 공용 route + envelope builder 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 답장 헬퍼 | 공용 record-and-dispatch 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공용 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 runtime 헬퍼 | 아웃바운드 identity/send delegate 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding 헬퍼 | thread-binding 라이프사이클 및 adapter 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 payload 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 payload builder |
  | `plugin-sdk/channel-runtime` | 지원 중단된 호환성 shim | 레거시 채널 runtime 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 runtime 헬퍼 | runtime/logging/backup/plugin-install 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 범위의 runtime env 헬퍼 | logger/runtime env, timeout, retry, backoff 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공용 Plugin runtime 헬퍼 | Plugin commands/hooks/http/interactive 헬퍼 |
  | `plugin-sdk/hook-runtime` | hook 파이프라인 헬퍼 | 공용 Webhook/internal hook 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | lazy runtime 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공용 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI runtime 헬퍼 | 명령 포맷팅, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트 및 channel-status patch 헬퍼 |
  | `plugin-sdk/config-runtime` | Config 헬퍼 | config load/write 헬퍼 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때를 위한 fallback-stable Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | exec/plugin 승인 payload, approval capability/profile 헬퍼, 네이티브 승인 라우팅/runtime 헬퍼 |
  | `plugin-sdk/approval-auth-runtime` | 승인 auth 헬퍼 | approver 해석, 동일 채팅 action auth |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 exec 승인 profile/filter 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 delivery 헬퍼 | 네이티브 approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공용 승인 Gateway-resolution 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 adapter 헬퍼 | hot 채널 엔트리포인트를 위한 경량 네이티브 승인 adapter 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 광범위한 승인 핸들러 runtime 헬퍼. 더 좁은 adapter/gateway seam으로 충분하다면 그것을 우선 사용하세요 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | exec/plugin 승인 답장 payload 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 runtime-context 헬퍼 | 일반적인 채널 runtime-context register/get/watch 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공용 trust, DM gating, external-content, secret-collection 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 allowlist 및 private-network 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime 헬퍼 | pinned-dispatcher, guarded fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/collection-runtime` | bounded cache 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 gating 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/proxy 헬퍼 | `resolveFetch`, proxy 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry 헬퍼 | `RetryConfig`, `retryAsync`, 정책 러너 |
  | `plugin-sdk/allow-from` | Allowlist 포맷팅 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Allowlist 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 gating 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 권한 부여 헬퍼, 명령 registry 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | secret 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 guard 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공용 답장 runtime | 인바운드 dispatch, Heartbeat, 답장 planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 답장 dispatch 헬퍼 | finalize + provider dispatch 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 chunk 헬퍼 | 텍스트/markdown chunking 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 builder, runtime-state 기본값, issue 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 resolver 헬퍼 | 공용 대상 resolver 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | slug/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | request-like 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr를 포함한 시간 제한 명령 러너 |
  | `plugin-sdk/param-readers` | 파라미터 리더 | 공용 tool/CLI 파라미터 리더 |
  | `plugin-sdk/tool-payload` | tool payload 추출 | tool 결과 객체에서 정규화된 payload 추출 |
  | `plugin-sdk/tool-send` | tool send 추출 | tool 인수에서 정식 send 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공용 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | subsystem logger 및 redaction 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | Markdown-table 헬퍼 | Markdown table 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 payload 타입 |
  | `plugin-sdk/provider-setup` | 선별된 local/self-hosted provider 설정 헬퍼 | self-hosted provider 검색/config 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 self-hosted provider 설정 헬퍼 | 동일한 self-hosted provider 검색/config 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth 헬퍼 | runtime API-key 해석 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | provider API-key 설정 헬퍼 | API-key 온보딩/profile-write 헬퍼 |
  | `plugin-sdk/provider-auth-result` | provider auth-result 헬퍼 | 표준 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | provider 대화형 login 헬퍼 | 공용 대화형 login 헬퍼 |
  | `plugin-sdk/provider-env-vars` | provider env-var 헬퍼 | provider auth env-var 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공용 provider 모델/replay 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy builder, provider-endpoint 헬퍼, 모델 ID 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공용 provider 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider 온보딩 패치 | 온보딩 config 헬퍼 |
  | `plugin-sdk/provider-http` | provider HTTP 헬퍼 | 일반적인 provider HTTP/endpoint capability 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch 헬퍼 | web-fetch provider 등록/cache 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config 헬퍼 | Plugin enable wiring이 필요하지 않은 provider를 위한 좁은 범위의 web-search config/credential 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | provider web-search 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위가 지정된 credential setter/getter 등의 좁은 범위 web-search config/credential 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | provider web-search 헬퍼 | web-search provider 등록/cache/runtime 헬퍼 |
  | `plugin-sdk/provider-tools` | provider tool/schema compat 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + diagnostics, 그리고 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI compat 헬퍼 |
  | `plugin-sdk/provider-usage` | provider 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 그리고 기타 provider 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | provider 스트림 wrapper 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 wrapper 타입, 그리고 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | provider transport 헬퍼 | guarded fetch, transport message transform, writable transport event stream 등의 네이티브 provider transport 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서가 보장되는 async 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공용 미디어 헬퍼 | 미디어 fetch/transform/store 헬퍼와 미디어 payload builder |
  | `plugin-sdk/media-generation-runtime` | 공용 미디어 생성 헬퍼 | 이미지/비디오/음악 생성을 위한 공용 failover 헬퍼, 후보 선택, 누락된 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 provider 타입과 provider 대상 이미지/오디오 헬퍼 export |
  | `plugin-sdk/text-runtime` | 공용 텍스트 헬퍼 | assistant-visible-text 제거, markdown 렌더/chunking/table 헬퍼, redaction 헬퍼, directive-tag 헬퍼, safe-text 유틸리티 및 관련 텍스트/로깅 헬퍼 |
  | `plugin-sdk/text-chunking` | 텍스트 chunking 헬퍼 | 아웃바운드 텍스트 chunking 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 provider 타입과 provider 대상 directive, registry, 검증 헬퍼 |
  | `plugin-sdk/speech-core` | 공용 음성 코어 | 음성 provider 타입, registry, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | provider 타입 및 registry 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | provider 타입 및 registry 헬퍼 |
  | `plugin-sdk/image-generation-core` | 공용 이미지 생성 코어 | 이미지 생성 타입, failover, auth, registry 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 provider/request/result 타입 |
  | `plugin-sdk/music-generation-core` | 공용 음악 생성 코어 | 음악 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 provider/request/result 타입 |
  | `plugin-sdk/video-generation-core` | 공용 비디오 생성 코어 | 비디오 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 헬퍼 | 대화형 답장 payload 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 config 기본 구성 요소 | 좁은 범위의 채널 config-schema 기본 구성 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 config-write 헬퍼 | 채널 config-write 권한 부여 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공용 채널 prelude | 공용 채널 Plugin prelude export |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공용 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | Allowlist config 헬퍼 | Allowlist config 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공용 그룹 액세스 결정 헬퍼 |
  | `plugin-sdk/direct-dm` | direct-DM 헬퍼 | 공용 direct-DM auth/guard 헬퍼 |
  | `plugin-sdk/extension-shared` | 공용 extension 헬퍼 | passive-channel/status 및 ambient proxy 헬퍼 기본 구성 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 registry 및 route-install 헬퍼 |
  | `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
  | `plugin-sdk/web-media` | 공용 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
  | `plugin-sdk/zod` | Zod 재export | Plugin SDK 소비자를 위한 `zod` 재export |
  | `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | 메모리 관리자/config/file/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 runtime 파사드 | 메모리 인덱스/검색 runtime 파사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 | 메모리 호스트 foundation 엔진 export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, registry 액세스, local provider, 일반적인 batch/remote 헬퍼. 구체적인 remote provider는 해당 Plugin에 존재합니다 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 export |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 | 메모리 호스트 스토리지 엔진 export |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 헬퍼 | 메모리 호스트 secret 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 | 메모리 호스트 이벤트 저널 헬퍼 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI runtime | 메모리 호스트 CLI runtime 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 runtime | 메모리 호스트 코어 runtime 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/runtime 헬퍼 | 메모리 호스트 파일/runtime 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 runtime 별칭 | 메모리 호스트 코어 runtime 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/runtime 별칭 | 메모리 호스트 파일/runtime 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown 헬퍼 | 메모리 인접 Plugin을 위한 공용 managed-markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | lazy Active Memory search-manager runtime 파사드 |
  | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 메모리 호스트 상태 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 | memory-lancedb 헬퍼 표면 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 헬퍼 및 mock |
</Accordion>

이 표는 전체 SDK 표면이 아니라, 의도적으로 일반적인 마이그레이션 하위 집합만 담고 있습니다. 200개가 넘는 전체 엔트리포인트 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin 헬퍼 seam이 포함되어 있습니다. 이들은 번들 Plugin 유지 관리와 호환성을 위해 계속 export되지만, 일반적인 마이그레이션 표에서는 의도적으로 제외되며 새 Plugin 코드에 권장되는 대상은 아닙니다.

다음과 같은 다른 번들 헬퍼 계열에도 동일한 규칙이 적용됩니다.

- 브라우저 지원 헬퍼: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은 번들 헬퍼/Plugin 표면

`plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`이라는 좁은 범위의 토큰 헬퍼 표면을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면 `src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| 시점 | 발생하는 일 |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금** | 지원 중단된 표면이 런타임 경고를 출력합니다 |
| **다음 메이저 릴리스** | 지원 중단된 표면이 제거되며, 여전히 이를 사용하는 Plugin은 실패합니다 |

모든 core Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은 다음 메이저 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이것은 영구적인 해결책이 아니라 일시적인 우회 수단입니다.

## 관련 문서

- [시작하기](/ko/plugins/building-plugins) — 첫 번째 Plugin 만들기
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 빌드하기
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) — provider Plugin 빌드하기
- [Plugin 내부 구조](/ko/plugins/architecture) — 아키텍처 심층 설명
- [Plugin 매니페스트](/ko/plugins/manifest) — 매니페스트 스키마 참조
