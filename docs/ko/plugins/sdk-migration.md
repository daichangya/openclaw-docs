---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시되는 경우'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시되는 경우'
    - Plugin을 최신 Plugin 아키텍처로 업데이트하는 경우
    - 외부 OpenClaw Plugin을 유지 관리하는 경우
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션하기
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-24T06:27:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw는 광범위한 하위 호환성 계층에서 집중적이고 문서화된 import를 갖는 최신 Plugin
아키텍처로 이동했습니다. Plugin이 새
아키텍처 이전에 만들어졌다면, 이 가이드가 마이그레이션에 도움이 됩니다.

## 무엇이 바뀌는가

이전 Plugin 시스템은 Plugin이
단일 진입점에서 필요한 모든 것을 import할 수 있도록 하는 두 개의 넓은 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** — 수십 개의
  헬퍼를 재export하는 단일 import입니다. 새 Plugin 아키텍처가 구축되는 동안 오래된 hook 기반 Plugins를 계속 동작시키기 위해 도입되었습니다.
- **`openclaw/extension-api`** — 임베디드 에이전트 실행기 같은
  호스트 측 헬퍼에 Plugin이 직접 접근할 수 있게 해 주는 브리지입니다.

이 두 표면은 이제 모두 **deprecated**입니다. 런타임에서는 여전히 동작하지만, 새
Plugins는 이를 사용해서는 안 되며, 기존 Plugins도 다음 major 릴리스에서 제거되기 전에 마이그레이션해야 합니다.

OpenClaw는 대체 수단을 도입하는 같은 변경에서 문서화된 Plugin 동작을 제거하거나 재해석하지 않습니다. 호환성이 깨지는 계약 변경은 먼저 호환성 어댑터, 진단, 문서, deprecation 기간을 거쳐야 합니다.
이는 SDK import, manifest 필드, setup API, Hooks, 런타임
등록 동작에 모두 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 major 릴리스에서 제거될 예정입니다.
  여전히 이 표면에서 import하는 Plugins는 그 시점에 깨지게 됩니다.
</Warning>

## 왜 바뀌었는가

이전 접근 방식은 다음과 같은 문제를 일으켰습니다.

- **느린 시작** — 헬퍼 하나를 import해도 관련 없는 수십 개 모듈이 로드됨
- **순환 의존성** — 광범위한 재export로 import cycle을 쉽게 만들 수 있었음
- **불명확한 API 표면** — 어떤 export가 안정적이고 어떤 것이 내부용인지 구분할 방법이 없었음

최신 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널용 레거시 provider 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
채널 브랜드 헬퍼 seam, 그리고
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 Plugin 계약이 아니라
비공개 모노레포 바로가기였습니다. 대신 좁고 일반적인 SDK 서브패스를 사용하세요. 번들 Plugin 워크스페이스 내부에서는 provider 소유 헬퍼를 해당 Plugin의
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시:

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, default-model 헬퍼, realtime provider
  builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 onboarding/config 헬퍼를 자체
  `api.ts`에 유지합니다

## 호환성 정책

외부 Plugins에 대해 호환성 작업은 다음 순서를 따릅니다.

1. 새 계약 추가
2. 호환성 어댑터를 통해 기존 동작 유지
3. 이전 경로와 대체 수단을 명시하는 진단 또는 경고 출력
4. 테스트에서 두 경로 모두 커버
5. deprecation 및 마이그레이션 경로 문서화
6. 공지된 마이그레이션 기간(보통 major 릴리스) 이후에만 제거

manifest 필드가 아직 허용된다면, 문서와 진단이 달리 말하기 전까지 Plugin 작성자는 계속 사용할 수 있습니다. 새 코드는 문서화된 대체 수단을 선호해야 하지만, 기존 Plugins가 일반적인 minor
릴리스 동안 깨져서는 안 됩니다.

## 마이그레이션 방법

<Steps>
  <Step title="승인 네이티브 핸들러를 capability 사실 기반으로 마이그레이션">
    승인 가능한 채널 Plugins는 이제
    `approvalCapability.nativeRuntime`과 공용 런타임 컨텍스트 레지스트리를 통해 네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`으로 교체
    - 승인 전용 auth/delivery를 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin
      계약에서 제거되었습니다. delivery/native/render 필드를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 채널 login/logout 흐름에만 남아 있으며, 그 안의 승인
      auth hook는 더 이상 core에서 읽지 않습니다
    - 클라이언트, token, Bolt
      앱 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 승인 핸들러에서 Plugin 소유 reroute 알림을 보내지 마세요.
      이제 core가 실제 전달 결과에서 발생한 routed-elsewhere 알림을 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 stub은 거부됩니다.

    현재 승인 capability
    레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Windows wrapper fallback 동작 감사">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우,
    확인되지 않는 Windows `.cmd`/`.bat` wrapper는
    명시적으로 `allowShellFallback: true`를 전달하지 않으면 이제 fail closed됩니다.

    ```typescript
    // 이전
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 이후
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 신뢰된 호환성 호출자에서 의도적으로
      // 셸 중개 fallback을 허용할 때만 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 셸 fallback에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    Plugin에서 deprecated 표면 둘 중 하나로부터의 import를 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    이전 표면의 각 export는 특정 최신 import 경로에 매핑됩니다.

    ```typescript
    // 이전(deprecated 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 이후(최신 집중형 import)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼는 직접 import하지 말고 주입된 Plugin 런타임을 사용하세요.

    ```typescript
    // 이전(deprecated extension-api 브리지)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 이후(주입된 런타임)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다.

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

## Import 경로 참조

  <Accordion title="일반적인 import 경로 표">
  | Import 경로 | 목적 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 Plugin entry 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 entry 정의/빌더용 레거시 umbrella 재export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider entry 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 entry 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공용 setup wizard 헬퍼 | Allowlist 프롬프트, setup status 빌더 |
  | `plugin-sdk/setup-runtime` | setup 시점 런타임 헬퍼 | import-safe setup patch adapter, lookup-note 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 setup 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup 툴링 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 list/config/action-gate 헬퍼 |
  | `plugin-sdk/account-id` | account-id 헬퍼 | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본값 fallback 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 account 헬퍼 | account list/account-action 헬퍼 |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 원시 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 응답 prefix + 타이핑 배선 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config 스키마 빌더 | 채널 config 스키마 타입 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config 헬퍼 | 명령 이름 정규화, 설명 trim, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 확인 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 draft stream 수명 주기 헬퍼 | `createAccountStatusSink`, draft preview finalization 헬퍼 |
  | `plugin-sdk/inbound-envelope` | 인바운드 envelope 헬퍼 | 공용 route + envelope 빌더 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 응답 헬퍼 | 공용 record-and-dispatch 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공용 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 런타임 헬퍼 | 아웃바운드 식별/send delegate 및 payload planning 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 adapter 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 payload 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 payload 빌더 |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | send 결과 타입 | 응답 결과 타입 |
  | `plugin-sdk/runtime-store` | 영속 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/plugin-install 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 런타임 env 헬퍼 | logger/runtime env, timeout, retry, backoff 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공용 Plugin 런타임 헬퍼 | Plugin commands/hooks/http/interactive 헬퍼 |
  | `plugin-sdk/hook-runtime` | Hook 파이프라인 헬퍼 | 공용 webhook/internal Hook 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | lazy 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공용 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 포맷팅, wait, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway client 및 channel-status patch 헬퍼 |
  | `plugin-sdk/config-runtime` | config 헬퍼 | config load/write 헬퍼 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때의 fallback-stable Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | exec/plugin 승인 payload, approval capability/profile 헬퍼, native approval 라우팅/런타임 헬퍼 |
  | `plugin-sdk/approval-auth-runtime` | 승인 auth 헬퍼 | approver 확인, same-chat action auth |
  | `plugin-sdk/approval-client-runtime` | 승인 client 헬퍼 | native exec 승인 profile/filter 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 delivery 헬퍼 | native approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | 승인 gateway 헬퍼 | 공용 승인 gateway-resolution 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 adapter 헬퍼 | 뜨거운 채널 entrypoint용 경량 native approval adapter 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 handler 헬퍼 | 더 넓은 승인 handler 런타임 헬퍼. 좁은 adapter/gateway seam으로 충분하면 그것을 선호하세요 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | native approval target/account binding 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 응답 헬퍼 | exec/plugin 승인 응답 payload 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 runtime-context 헬퍼 | 일반 채널 runtime-context register/get/watch 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공용 trust, DM 게이팅, external-content, secret-collection 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 allowlist 및 private-network 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | pinned-dispatcher, guarded fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/collection-runtime` | bounded cache 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, error graph 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/proxy 헬퍼 | `resolveFetch`, proxy 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | allowlist 포맷팅 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 인증 헬퍼, 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/help 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | secret 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공용 응답 런타임 | 인바운드 디스패치, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 응답 디스패치 헬퍼 | finalize + provider 디스패치 헬퍼 |
  | `plugin-sdk/reply-history` | reply-history 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply reference planning | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 응답 chunk 헬퍼 | 텍스트/markdown chunking 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, runtime-state 기본값, issue 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 확인 헬퍼 | 공용 대상 확인 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | slug/string 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | request 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr를 가진 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | param reader | 공용 tool/CLI param reader |
  | `plugin-sdk/tool-payload` | tool payload 추출 | tool 결과 객체에서 정규화된 payload 추출 |
  | `plugin-sdk/tool-send` | tool send 추출 | tool 인수에서 정규 send 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공용 temp-download 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 하위 시스템 logger 및 마스킹 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | markdown-table 헬퍼 | markdown table 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 응답 타입 | 응답 payload 타입 |
  | `plugin-sdk/provider-setup` | 엄선된 로컬/셀프 호스팅 provider setup 헬퍼 | 셀프 호스팅 provider 검색/config 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 집중된 OpenAI 호환 셀프 호스팅 provider setup 헬퍼 | 동일한 셀프 호스팅 provider 검색/config 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | provider 런타임 auth 헬퍼 | 런타임 API-key 확인 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup 헬퍼 | API-key 온보딩/profile-write 헬퍼 |
  | `plugin-sdk/provider-auth-result` | provider auth-result 헬퍼 | 표준 OAuth auth-result 빌더 |
  | `plugin-sdk/provider-auth-login` | provider 대화형 login 헬퍼 | 공용 대화형 login 헬퍼 |
  | `plugin-sdk/provider-selection-runtime` | provider 선택 헬퍼 | configured-or-auto provider 선택 및 raw provider config 병합 |
  | `plugin-sdk/provider-env-vars` | provider env-var 헬퍼 | provider auth env-var 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공용 provider model/replay 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy 빌더, provider-endpoint 헬퍼, model-id 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공용 provider 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider 온보딩 patch | 온보딩 config 헬퍼 |
  | `plugin-sdk/provider-http` | provider HTTP 헬퍼 | 오디오 전사 multipart form 헬퍼를 포함한 일반 provider HTTP/엔드포인트 capability 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | provider web-fetch 헬퍼 | Web-fetch provider 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | provider web-search config 헬퍼 | Plugin 활성화 wiring이 필요 없는 provider용 좁은 web-search config/자격 증명 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | provider web-search 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 좁은 web-search config/자격 증명 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | provider web-search 헬퍼 | Web-search provider 등록/캐시/런타임 헬퍼 |
  | `plugin-sdk/provider-tools` | provider 도구/스키마 compat 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI compat 헬퍼 |
  | `plugin-sdk/provider-usage` | provider 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 provider 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | provider stream wrapper 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 타입, 공용 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | provider 전송 헬퍼 | guarded fetch, 전송 메시지 transform, 쓰기 가능한 전송 이벤트 stream 같은 native provider 전송 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 async 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공용 미디어 헬퍼 | 미디어 fetch/transform/store 헬퍼와 미디어 payload 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공용 미디어 생성 헬퍼 | 이미지/비디오/음악 생성용 공용 failover 헬퍼, 후보 선택, missing-model 메시징 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 provider 타입과 provider 대상 이미지/오디오 헬퍼 export |
  | `plugin-sdk/text-runtime` | 공용 텍스트 헬퍼 | 어시스턴트 표시 텍스트 제거, markdown 렌더/chunking/table 헬퍼, 마스킹 헬퍼, directive-tag 헬퍼, safe-text 유틸리티, 관련 텍스트/로깅 헬퍼 |
  | `plugin-sdk/text-chunking` | 텍스트 chunking 헬퍼 | 아웃바운드 텍스트 chunking 헬퍼 |
  | `plugin-sdk/speech` | speech 헬퍼 | speech provider 타입과 provider 대상 directive, 레지스트리, 검증 헬퍼 |
  | `plugin-sdk/speech-core` | 공용 speech 코어 | speech provider 타입, 레지스트리, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | provider 타입, 레지스트리 헬퍼, 공용 WebSocket 세션 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | provider 타입, 레지스트리/확인 헬퍼, 브리지 세션 헬퍼 |
  | `plugin-sdk/image-generation-core` | 공용 이미지 생성 코어 | 이미지 생성 타입, failover, auth, 레지스트리 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 provider/request/result 타입 |
  | `plugin-sdk/music-generation-core` | 공용 음악 생성 코어 | 음악 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 provider/request/result 타입 |
  | `plugin-sdk/video-generation-core` | 공용 비디오 생성 코어 | 비디오 생성 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/interactive-runtime` | Interactive reply 헬퍼 | Interactive reply payload 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 config 원시 요소 | 좁은 채널 config-schema 원시 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 config-write 헬퍼 | 채널 config-write 인증 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공용 채널 prelude | 공용 채널 Plugin prelude export |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공용 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | allowlist config 헬퍼 | allowlist config 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공용 그룹 액세스 결정 헬퍼 |
  | `plugin-sdk/direct-dm` | direct-DM 헬퍼 | 공용 direct-DM auth/guard 헬퍼 |
  | `plugin-sdk/extension-shared` | 공용 extension 헬퍼 | passive-channel/status 및 ambient proxy 헬퍼 원시 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 route-install 헬퍼 |
  | `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
  | `plugin-sdk/web-media` | 공용 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
  | `plugin-sdk/zod` | Zod 재export | Plugin SDK 소비자를 위한 재export된 `zod` |
  | `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | 메모리 manager/config/file/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 facade | 메모리 index/search 런타임 facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 | 메모리 호스트 foundation 엔진 export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 접근, 로컬 provider, 일반 batch/원격 헬퍼. 구체적인 원격 provider는 해당 owning Plugin에 존재 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 export |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 | 메모리 호스트 저장소 엔진 export |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 시크릿 헬퍼 | 메모리 호스트 시크릿 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 | 메모리 호스트 이벤트 저널 헬퍼 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 별칭 | 메모리 호스트 파일/런타임 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown 헬퍼 | 메모리 인접 Plugins용 공용 managed-markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 facade | lazy Active Memory search-manager 런타임 facade |
  | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 메모리 호스트 상태 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 | memory-lancedb 헬퍼 표면 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 헬퍼 및 mock |
</Accordion>

이 표는 의도적으로 전체 SDK
표면이 아니라 일반적인 마이그레이션 하위 집합만 다룹니다. 200개가 넘는 전체 entrypoint 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin 헬퍼 seam이 포함되어 있습니다. 이들은
번들 Plugin 유지 관리와 호환성을 위해 계속 export되지만, 의도적으로 일반 마이그레이션 표에서는
제외되었으며 새 Plugin 코드에 권장되는 대상이 아닙니다.

같은 규칙이 다른 번들 헬퍼 계열에도 적용됩니다. 예:

- 브라우저 지원 헬퍼: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- 번들 헬퍼/Plugin 표면: `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token`은 현재 좁은 token-헬퍼
표면 `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| 시점                   | 발생 내용                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| **지금**               | deprecated 표면이 런타임 경고를 출력함                                 |
| **다음 major release** | deprecated 표면이 제거되며, 이를 계속 사용하는 Plugins는 실패하게 됨   |

모든 core Plugins는 이미 마이그레이션되었습니다. 외부 Plugins는
다음 major 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 임시 탈출구일 뿐, 영구적인 해결책은 아닙니다.

## 관련

- [시작하기](/ko/plugins/building-plugins) — 첫 Plugin 만들기
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 서브패스 import 참조
- [채널 Plugins](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider Plugin 만들기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 설명
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마 참조
