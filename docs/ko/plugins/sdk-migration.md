---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시됨'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시됨'
    - 최신 Plugin 아키텍처로 Plugin을 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리하고 있습니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션하기
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-22T04:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Plugin SDK 마이그레이션

OpenClaw는 광범위한 하위 호환성 계층에서, 목적이 분명하고 문서화된 import를 사용하는 최신 Plugin
아키텍처로 이동했습니다. 새 아키텍처 이전에 Plugin을 만들었다면
이 가이드가 마이그레이션에 도움이 됩니다.

## 변경되는 내용

기존 Plugin 시스템은 Plugin이 단일 엔트리 포인트에서
필요한 거의 모든 것을 import할 수 있도록 하는 두 개의 광범위한 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** — 수십 개의
  헬퍼를 다시 export하는 단일 import입니다. 새 Plugin 아키텍처를 구축하는 동안
  오래된 hook 기반 Plugin이 계속 작동하도록 도입되었습니다.
- **`openclaw/extension-api`** — 내장 에이전트 실행기 같은
  호스트 측 헬퍼에 Plugin이 직접 접근할 수 있게 하는 브리지입니다.

이제 두 표면 모두 **deprecated**되었습니다. 런타임에서는 여전히 작동하지만, 새
Plugin은 이를 사용해서는 안 되며, 기존 Plugin도 다음 주요 릴리스에서 제거되기 전에
마이그레이션해야 합니다.

<Warning>
  하위 호환성 계층은 향후 주요 릴리스에서 제거됩니다.
  여전히 이 표면에서 import하는 Plugin은 그 시점에 깨집니다.
</Warning>

## 왜 변경되었나

기존 접근 방식은 다음과 같은 문제를 일으켰습니다.

- **느린 시작** — 헬퍼 하나를 import하면 관련 없는 수십 개 모듈이 로드됨
- **순환 의존성** — 광범위한 재export 때문에 import cycle을 쉽게 만들 수 있었음
- **불명확한 API 표면** — 어떤 export가 안정적인지, 어떤 것이 내부용인지 구분할 방법이 없었음

최신 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
목적이 분명하고 계약이 문서화된 작고 독립적인 모듈입니다.

번들 채널용 레거시 프로바이더 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
채널 브랜드 헬퍼 seam, 그리고
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 Plugin 계약이 아니라
비공개 mono-repo 지름길이었습니다. 대신 좁고 일반적인 SDK 하위 경로를 사용하세요. 번들 Plugin 워크스페이스 내부에서는 프로바이더 소유 헬퍼를 해당 Plugin의 자체
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 프로바이더 예시:

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 프로바이더 빌더, 기본 모델 헬퍼, realtime provider
  builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 프로바이더 빌더와 onboarding/config 헬퍼를 자체
  `api.ts`에 유지합니다

## 마이그레이션 방법

<Steps>
  <Step title="승인 네이티브 핸들러를 capability fact로 마이그레이션">
    승인 가능한 채널 Plugin은 이제
    `approvalCapability.nativeRuntime`과 공유 runtime-context registry를 통해
    네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`으로 교체합니다
    - 승인 전용 auth/delivery를 레거시 `plugin.auth` /
      `plugin.approvals` wiring에서 분리하여 `approvalCapability`로 이동합니다
    - `ChannelPlugin.approvals`는 공개 채널 Plugin
      계약에서 제거되었습니다. delivery/native/render 필드를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 채널 login/logout 흐름에만 남아 있습니다. 여기에 있는 승인 auth
      훅은 더 이상 코어에서 읽지 않습니다
    - 클라이언트, 토큰, Bolt
      앱 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요
    - 네이티브 승인 핸들러에서 Plugin 소유 재라우팅 알림을 보내지 마세요.
      이제 코어가 실제 전달 결과에서 나온 routed-elsewhere 알림을 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 스텁은 거부됩니다.

    현재 승인 기능 레이아웃은 `/plugins/sdk-channel-plugins`를 참고하세요.

  </Step>

  <Step title="Windows wrapper fallback 동작 감사">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우,
    확인되지 않은 Windows `.cmd`/`.bat` wrapper는 이제 명시적으로 `allowShellFallback: true`를 전달하지 않으면 fail-closed됩니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 신뢰된 호환성 호출자이며
      // shell 중개 fallback을 의도적으로 허용하는 경우에만 이것을 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 shell fallback에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    Plugin에서 deprecated 표면 둘 중 하나를 import하는 부분을 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    기존 표면의 각 export는 특정 최신 import 경로에 매핑됩니다.

    ```typescript
    // Before (deprecated 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (최신 집중형 import)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼는 직접 import하는 대신
    주입된 Plugin 런타임을 사용하세요.

    ```typescript
    // Before (deprecated extension-api 브리지)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (주입된 런타임)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다.

    | Old import | 최신 대응 항목 |
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
  | Import path | 목적 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 Plugin 엔트리 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 엔트리 정의/빌더용 레거시 umbrella 재export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 구성 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 프로바이더 엔트리 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 엔트리 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 wizard 헬퍼 | 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | import-safe 설정 patch 어댑터, lookup-note 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 설정 어댑터 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/구성/액션 게이트 헬퍼 |
  | `plugin-sdk/account-id` | account-id 헬퍼 | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 폴백 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 헬퍼 | 계정 목록/계정 액션 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 wizard 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 응답 접두사 + 입력 중 표시 wiring | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 구성 어댑터 팩토리 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 구성 스키마 빌더 | 채널 구성 스키마 타입 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 구성 헬퍼 | 명령 이름 정규화, 설명 자르기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 draft 스트림 lifecycle 헬퍼 | `createAccountStatusSink`, draft 미리보기 마무리 헬퍼 |
  | `plugin-sdk/inbound-envelope` | 인바운드 엔벨로프 헬퍼 | 공유 라우트 + 엔벨로프 빌더 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 응답 헬퍼 | 공유 기록 및 디스패치 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 런타임 헬퍼 | 아웃바운드 ID/전송 delegate 및 페이로드 계획 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 lifecycle 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 응답 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env 헬퍼 | 로거/런타임 env, 타임아웃, 재시도, 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/훅/http/interactive 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 로딩 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 포맷팅, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트 및 channel-status patch 헬퍼 |
  | `plugin-sdk/config-runtime` | 구성 헬퍼 | 구성 로드/쓰기 헬퍼 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때의 fallback-stable Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | exec/Plugin 승인 페이로드, 승인 capability/profile 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 해석, 동일 채팅 액션 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 exec 승인 profile/filter 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 capability/delivery 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 gateway-resolution 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 핫 채널 엔트리포인트용 경량 네이티브 승인 어댑터 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 광범위한 승인 핸들러 런타임 헬퍼. 더 좁은 adapter/gateway seam으로 충분하면 그것을 우선 사용 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/account 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 응답 헬퍼 | exec/Plugin 승인 응답 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 runtime-context 헬퍼 | 일반 채널 runtime-context register/get/watch 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 외부 콘텐츠, 비밀 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | pinned-dispatcher, guarded fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/collection-runtime` | 제한된 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 포맷팅 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 허용 목록 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 권한 부여 헬퍼, 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 입력 파싱 | 비밀 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 응답 런타임 | 인바운드 디스패치, Heartbeat, 응답 플래너, 청킹 |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 응답 디스패치 헬퍼 | 마무리 + 프로바이더 디스패치 헬퍼 |
  | `plugin-sdk/reply-history` | reply-history 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 응답 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 응답 청크 헬퍼 | 텍스트/markdown 청킹 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, runtime-state 기본값, 이슈 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석 헬퍼 | 공유 대상 해석 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | slug/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | request-like 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 측정 명령 헬퍼 | 정규화된 stdout/stderr를 갖는 시간 측정 명령 실행기 |
  | `plugin-sdk/param-readers` | 파라미터 리더 | 공통 tool/CLI 파라미터 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 정식 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공유 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 서브시스템 로거 및 마스킹 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 헬퍼 | Markdown 표 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 응답 타입 | 응답 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 엄선된 로컬/자체 호스팅 프로바이더 설정 헬퍼 | 자체 호스팅 프로바이더 발견/구성 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 자체 호스팅 프로바이더 설정 헬퍼 | 동일한 자체 호스팅 프로바이더 발견/구성 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | 프로바이더 런타임 인증 헬퍼 | 런타임 API 키 해석 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | 프로바이더 API 키 설정 헬퍼 | API 키 온보딩/profile-write 헬퍼 |
  | `plugin-sdk/provider-auth-result` | 프로바이더 auth-result 헬퍼 | 표준 OAuth auth-result 빌더 |
  | `plugin-sdk/provider-auth-login` | 프로바이더 대화형 로그인 헬퍼 | 공유 대화형 로그인 헬퍼 |
  | `plugin-sdk/provider-env-vars` | 프로바이더 env-var 헬퍼 | 프로바이더 인증 env-var 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공유 프로바이더 모델/replay 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, provider-endpoint 헬퍼, 모델 id 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공유 프로바이더 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | 프로바이더 온보딩 패치 | 온보딩 구성 헬퍼 |
| `plugin-sdk/provider-http` | 프로바이더 HTTP 헬퍼 | 일반 프로바이더 HTTP/엔드포인트 기능 헬퍼 |
| `plugin-sdk/provider-web-fetch` | 프로바이더 web-fetch 헬퍼 | web-fetch 프로바이더 등록/캐시 헬퍼 |
| `plugin-sdk/provider-web-search-config-contract` | 프로바이더 web-search 구성 헬퍼 | Plugin 활성화 wiring이 필요 없는 프로바이더용 좁은 범위의 web-search 구성/자격 증명 헬퍼 |
| `plugin-sdk/provider-web-search-contract` | 프로바이더 web-search 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 범위의 web-search 구성/자격 증명 계약 헬퍼 |
| `plugin-sdk/provider-web-search` | 프로바이더 web-search 헬퍼 | web-search 프로바이더 등록/캐시/런타임 헬퍼 |
| `plugin-sdk/provider-tools` | 프로바이더 도구/스키마 호환성 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환성 헬퍼 |
| `plugin-sdk/provider-usage` | 프로바이더 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 기타 프로바이더 사용량 헬퍼 |
| `plugin-sdk/provider-stream` | 프로바이더 스트림 래퍼 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 공유 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
| `plugin-sdk/provider-transport-runtime` | 프로바이더 전송 헬퍼 | guarded fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 프로바이더 전송 헬퍼 |
| `plugin-sdk/keyed-async-queue` | 순서 보장 비동기 큐 | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | 공유 미디어 헬퍼 | 미디어 fetch/transform/store 헬퍼와 미디어 페이로드 빌더 |
| `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 헬퍼 | 이미지/비디오/음악 생성을 위한 공유 failover 헬퍼, 후보 선택, 누락 모델 메시지 |
| `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 프로바이더 타입과 프로바이더 대상 이미지/오디오 헬퍼 export |
| `plugin-sdk/text-runtime` | 공유 텍스트 헬퍼 | assistant-visible-text 제거, markdown 렌더/청킹/표 헬퍼, 마스킹 헬퍼, directive-tag 헬퍼, safe-text 유틸리티, 관련 텍스트/로깅 헬퍼 |
| `plugin-sdk/text-chunking` | 텍스트 청킹 헬퍼 | 아웃바운드 텍스트 청킹 헬퍼 |
| `plugin-sdk/speech` | 음성 헬퍼 | 음성 프로바이더 타입과 프로바이더 대상 directive, 레지스트리, 검증 헬퍼 |
| `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 프로바이더 타입, 레지스트리, directive, 정규화 |
| `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | 프로바이더 타입과 레지스트리 헬퍼 |
| `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | 프로바이더 타입과 레지스트리 헬퍼 |
| `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, failover, 인증, 레지스트리 헬퍼 |
| `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 프로바이더/요청/결과 타입 |
| `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, failover 헬퍼, 프로바이더 조회, model-ref 파싱 |
| `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 프로바이더/요청/결과 타입 |
| `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 타입, failover 헬퍼, 프로바이더 조회, model-ref 파싱 |
| `plugin-sdk/interactive-runtime` | 대화형 응답 헬퍼 | 대화형 응답 페이로드 정규화/축소 |
| `plugin-sdk/channel-config-primitives` | 채널 구성 기본 요소 | 좁은 범위의 채널 config-schema 기본 요소 |
| `plugin-sdk/channel-config-writes` | 채널 config-write 헬퍼 | 채널 config-write 권한 부여 헬퍼 |
| `plugin-sdk/channel-plugin-common` | 공유 채널 프렐류드 | 공유 채널 Plugin 프렐류드 export |
| `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공유 채널 상태 스냅샷/요약 헬퍼 |
| `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 헬퍼 | 허용 목록 구성 편집/읽기 헬퍼 |
| `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공유 그룹 액세스 결정 헬퍼 |
| `plugin-sdk/direct-dm` | Direct-DM 헬퍼 | 공유 direct-DM 인증/가드 헬퍼 |
| `plugin-sdk/extension-shared` | 공유 extension 헬퍼 | passive-channel/status 및 ambient proxy 헬퍼 기본 요소 |
| `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 route-install 헬퍼 |
| `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
| `plugin-sdk/web-media` | 공유 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
| `plugin-sdk/zod` | Zod 재export | Plugin SDK 소비자를 위한 재export된 `zod` |
| `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | 메모리 관리자/구성/파일/CLI 헬퍼 표면 |
| `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 인덱스/검색 런타임 파사드 |
| `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 파운데이션 엔진 | 메모리 호스트 파운데이션 엔진 export |
| `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 액세스, 로컬 프로바이더, 일반 배치/원격 헬퍼. 구체적인 원격 프로바이더는 해당 Plugin에 존재 |
| `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 export |
| `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 | 메모리 호스트 저장소 엔진 export |
| `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
| `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
| `plugin-sdk/memory-core-host-secret` | 메모리 호스트 비밀 헬퍼 | 메모리 호스트 비밀 헬퍼 |
| `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 | 메모리 호스트 이벤트 저널 헬퍼 |
| `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
| `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
| `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
| `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
| `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 헬퍼용 vendor-neutral 별칭 |
| `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 헬퍼용 vendor-neutral 별칭 |
| `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 별칭 | 메모리 호스트 파일/런타임 헬퍼용 vendor-neutral 별칭 |
| `plugin-sdk/memory-host-markdown` | 관리형 markdown 헬퍼 | 메모리 인접 Plugin용 공유 관리형 markdown 헬퍼 |
| `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | 지연 로딩 Active Memory search-manager 런타임 파사드 |
| `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 메모리 호스트 상태 헬퍼용 vendor-neutral 별칭 |
| `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 | memory-lancedb 헬퍼 표면 |
| `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 헬퍼 및 mock |
</Accordion>

이 표는 의도적으로 일반적인 마이그레이션 부분집합만 담고 있으며, 전체 SDK
표면은 아닙니다. 200개가 넘는 전체 엔트리포인트 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

해당 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin 헬퍼 seam이 포함되어 있습니다. 이들은 번들 Plugin 유지보수 및 호환성을 위해 계속 export되지만,
의도적으로 일반 마이그레이션 표에서는 제외되며 새 Plugin 코드에 권장되는 대상이 아닙니다.

같은 규칙이 다음과 같은 다른 번들 헬퍼 계열에도 적용됩니다.

- 브라우저 지원 헬퍼: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은 번들 헬퍼/Plugin 표면

`plugin-sdk/github-copilot-token`은 현재
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`이라는 좁은 범위의 토큰 헬퍼
표면을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| 시점 | 발생하는 일 |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금** | deprecated 표면이 런타임 경고를 출력함 |
| **다음 주요 릴리스** | deprecated 표면이 제거되며, 여전히 이를 사용하는 Plugin은 실패함 |

모든 코어 Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은
다음 주요 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 영구 해결책이 아니라 일시적인 이스케이프 해치입니다.

## 관련 항목

- [Getting Started](/ko/plugins/building-plugins) — 첫 Plugin 만들기
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 프로바이더 Plugin 만들기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 설명
- [Plugin Manifest](/ko/plugins/manifest) — 매니페스트 스키마 참조
