---
read_when:
    - 새 메시징 채널 Plugin을 빌드하고 있습니다
    - OpenClaw를 메시징 플랫폼에 연결하고 싶으신 것입니다
    - ChannelPlugin 어댑터 표면을 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 Plugin 빌드 단계별 가이드
title: 채널 Plugin 빌드하기
x-i18n:
    generated_at: "2026-04-24T06:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

이 가이드는 OpenClaw를
메시징 플랫폼에 연결하는 채널 Plugin을 빌드하는 과정을 단계별로 설명합니다. 이 가이드를 마치면 DM 보안,
페어링, 답글 스레딩, 아웃바운드 메시징을 갖춘 작동하는 채널을 얻게 됩니다.

<Info>
  아직 OpenClaw Plugin을 한 번도 만들어 본 적이 없다면 먼저
  기본 패키지 구조와 manifest 설정을 위해
  [시작하기](/ko/plugins/building-plugins)를 읽으세요.
</Info>

## 채널 Plugin 작동 방식

채널 Plugins에는 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는
코어에 하나의 공유 `message` 도구를 유지합니다. Plugin이 담당하는 것은 다음과 같습니다.

- **구성** — 계정 확인 및 설정 마법사
- **보안** — DM 정책 및 허용 목록
- **페어링** — DM 승인 흐름
- **세션 문법** — provider별 대화 ID가 기본 채팅, 스레드 ID, 부모 폴백으로 어떻게 매핑되는지
- **아웃바운드** — 플랫폼으로 텍스트, 미디어, 투표 보내기
- **스레딩** — 답글이 어떻게 스레드화되는지
- **Heartbeat 타이핑** — Heartbeat 전달 대상용 선택적 입력 중/바쁨 신호

코어는 공유 메시지 도구, 프롬프트 연결, 바깥쪽 세션 키 형태,
일반적인 `:thread:` bookkeeping, dispatch를 담당합니다.

채널이 인바운드 답글 외부에서 타이핑 표시를 지원하는 경우
채널 Plugin에 `heartbeat.sendTyping(...)`을 노출하세요. 코어는
Heartbeat 모델 실행이 시작되기 전에 확인된 Heartbeat 전달 대상과 함께 이를 호출하고
공유 타이핑 keepalive/cleanup 수명 주기를 사용합니다. 플랫폼에 명시적인 중지 신호가 필요하면
`heartbeat.clearTyping(...)`을 추가하세요.

채널이 미디어 소스를 전달하는 message-tool 매개변수를 추가하는 경우
`describeMessageTool(...).mediaSourceParams`를 통해 해당
매개변수 이름을 노출하세요. 코어는 그 명시적 목록을 샌드박스 경로 정규화 및 아웃바운드 미디어 액세스
정책에 사용하므로 Plugins는 provider별
아바타, 첨부 파일, 커버 이미지 매개변수에 대해 공유 코어의 특별 분기가 필요하지 않습니다.
가급적
`{ "set-profile": ["avatarUrl", "avatarPath"] }`처럼 action별 맵을 반환하세요.
이렇게 하면 관련 없는 action이 다른 action의 미디어 인수를 상속하지 않습니다. 모든 노출된 action 전반에 의도적으로 공유되는 매개변수에는
평면 배열도 계속 사용할 수 있습니다.

플랫폼이 대화 ID 내부에 추가 범위를 저장하는 경우
해당 파싱은 Plugin 내부에 `messaging.resolveSessionConversation(...)`로 유지하세요. 이것이
`rawId`를 기본 대화 ID, 선택적 스레드
ID, 명시적 `baseConversationId`, 그리고 어떤 `parentConversationCandidates`로 매핑하는
정식 Hook입니다. `parentConversationCandidates`를 반환할 때는
가장 좁은 부모에서 가장 넓은/기본 대화 순서로 정렬하세요.

채널 레지스트리가 부팅되기 전에 동일한 파싱이 필요한 번들 Plugins는
일치하는
`resolveSessionConversation(...)` export가 있는 최상위 `session-key-api.ts` 파일도 노출할 수 있습니다. 코어는 런타임 Plugin 레지스트리를 아직 사용할 수 없을 때만 이 bootstrap-safe 표면을 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는
Plugin이 일반/raw ID 위에 부모 폴백만 필요로 할 때의 레거시 호환성 폴백으로 계속 사용할 수 있습니다.
두 Hook이 모두 존재하면 코어는 먼저
`resolveSessionConversation(...).parentConversationCandidates`를 사용하고, 정식 Hook이 이를 생략할 때만
`resolveParentConversationCandidates(...)`로 폴백합니다.

## 승인과 채널 capability

대부분의 채널 Plugins에는 승인 전용 코드가 필요하지 않습니다.

- 코어는 same-chat `/approve`, 공유 승인 버튼 페이로드, 일반적인 fallback 전달을 담당합니다.
- 채널에 승인 전용 동작이 필요할 때는 채널 Plugin에 하나의 `approvalCapability` 객체를 우선 사용하세요.
- `ChannelPlugin.approvals`는 제거되었습니다. 승인 전달/네이티브/렌더/인증 사실은 `approvalCapability`에 두세요.
- `plugin.auth`는 login/logout 전용입니다. 코어는 더 이상 그 객체에서 승인 인증 Hook을 읽지 않습니다.
- `approvalCapability.authorizeActorAction` 및 `approvalCapability.getActionAvailabilityState`가 정식 승인 인증 seam입니다.
- same-chat 승인 인증 가용성에는 `approvalCapability.getActionAvailabilityState`를 사용하세요.
- 채널이 네이티브 exec 승인을 노출한다면, 시작 표면/네이티브 클라이언트 상태가 same-chat 승인 인증과 다를 때 `approvalCapability.getExecInitiatingSurfaceState`를 사용하세요. 코어는 이 exec 전용 Hook을 사용해 `enabled`와 `disabled`를 구분하고, 시작 채널이 네이티브 exec 승인을 지원하는지 결정하며, 채널을 네이티브 클라이언트 fallback 안내에 포함합니다. `createApproverRestrictedNativeApprovalCapability(...)`는 일반적인 경우 이를 채워 줍니다.
- 중복 로컬 승인 프롬프트 숨기기나 전달 전 타이핑 표시 전송 같은 채널별 페이로드 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- 네이티브 승인 라우팅 또는 fallback 억제에만 `approvalCapability.delivery`를 사용하세요.
- 채널 소유 네이티브 승인 사실에는 `approvalCapability.nativeRuntime`을 사용하세요. 핫 채널 entrypoint에서는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`로 이를 지연화하세요. 이렇게 하면 코어가 승인 수명 주기를 조립할 수 있으면서도 필요 시 런타임 모듈을 동적으로 import할 수 있습니다.
- 공유 렌더러 대신 채널이 정말로 사용자 정의 승인 페이로드가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 비활성화 경로 응답에서 네이티브 exec 승인을 활성화하는 데 필요한 정확한 구성 노브를 채널이 설명하길 원한다면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 Hook은 `{ channel, channelLabel, accountId }`를 받으며, 이름 있는 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- 채널이 기존 구성으로부터 안정적인 owner 유사 DM identity를 추론할 수 있다면, 승인 전용 코어 로직을 추가하지 않고 same-chat `/approve`를 제한하기 위해 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용하세요.
- 채널에 네이티브 승인 전달이 필요하다면 채널 코드는 대상 정규화와 전송/presentation 사실에만 집중시키세요. `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`를 사용하세요. 채널별 사실은 `approvalCapability.nativeRuntime` 뒤에 두되, 가급적 `createChannelApprovalNativeRuntimeAdapter(...)` 또는 `createLazyChannelApprovalNativeRuntimeAdapter(...)`를 통해 두세요. 그러면 코어가 핸들러를 조립하고 요청 필터링, 라우팅, dedupe, 만료, Gateway 구독, routed-elsewhere 알림을 담당할 수 있습니다. `nativeRuntime`은 몇 개의 더 작은 seam으로 나뉩니다:
- `availability` — 계정이 구성되었는지와 요청을 처리해야 하는지
- `presentation` — 공유 승인 view model을 pending/resolved/expired 네이티브 페이로드 또는 최종 action으로 매핑
- `transport` — 대상 준비 및 네이티브 승인 메시지 전송/업데이트/삭제
- `interactions` — 네이티브 버튼 또는 반응을 위한 선택적 bind/unbind/clear-action Hook
- `observe` — 선택적 전달 진단 Hook
- 채널에 client, token, Bolt app, webhook receiver 같은 런타임 소유 객체가 필요하다면 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요. 일반적인 runtime-context 레지스트리는 코어가 승인 전용 wrapper glue를 추가하지 않고도 채널 시작 상태에서 capability 기반 핸들러를 bootstrap할 수 있게 합니다.
- capability 기반 seam으로 아직 충분히 표현되지 않을 때만 더 낮은 수준의 `createChannelApprovalHandler` 또는 `createChannelNativeApprovalRuntime`에 손을 대세요.
- 네이티브 승인 채널은 `accountId`와 `approvalKind`를 모두 해당 helper를 통해 라우팅해야 합니다. `accountId`는 다중 계정 승인 정책이 올바른 봇 계정 범위에 머물도록 하고, `approvalKind`는 코어의 하드코딩 분기 없이도 exec 대 Plugin 승인 동작을 채널에서 사용할 수 있게 합니다.
- 코어는 이제 승인 reroute 알림도 담당합니다. 채널 Plugins는 `createChannelNativeApprovalRuntime`에서 자체 “approval went to DMs / another channel” 후속 메시지를 보내지 말고, 공유 승인 capability helper를 통해 정확한 origin + approver-DM 라우팅을 노출한 뒤, 코어가 실제 전달을 집계한 후 시작 채팅으로 알림을 게시하게 하세요.
- 전달된 승인 ID 종류를 끝까지 보존하세요. 네이티브 클라이언트는
  채널 로컬 상태에서 exec 대 Plugin 승인 라우팅을 추측하거나 다시 써서는 안 됩니다.
- 서로 다른 승인 종류는 의도적으로 서로 다른 네이티브 표면을 노출할 수 있습니다.
  현재 번들 예시:
  - Slack은 exec와 Plugin ID 모두에 대해 네이티브 승인 라우팅을 유지합니다.
  - Matrix는 exec와 Plugin 승인 모두에 대해 동일한 네이티브 DM/채널 라우팅과 반응 UX를 유지하면서도, 승인 종류별로 auth가 달라지도록 둘 수 있습니다.
- `createApproverRestrictedNativeApprovalAdapter`는 여전히 호환성 wrapper로 존재하지만, 새 코드는 capability builder를 우선 사용하고 Plugin에서 `approvalCapability`를 노출해야 합니다.

핫 채널 entrypoint에는 전체 계열이 아니라 한 부분만 필요할 때
더 좁은 런타임 하위 경로를 우선 사용하세요.

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

마찬가지로 더 넓은 umbrella
표면이 필요하지 않다면 `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 그리고
`openclaw/plugin-sdk/reply-chunking`을 우선 사용하세요.

설정 관련해서는 특히:

- `openclaw/plugin-sdk/setup-runtime`은 런타임 안전 setup helper를 다룹니다:
  import-safe setup patch adapter(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`은 `createEnvPatchedAccountSetupAdapter`를 위한
  좁은 env 인식 adapter seam입니다
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 setup
  builder와 몇 가지 setup-safe primitive를 다룹니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env 기반 설정 또는 인증을 지원하고, 일반적인 시작/구성
흐름이 런타임 로드 전에 해당 env 이름을 알아야 한다면
Plugin manifest에 `channelEnvVars`로 선언하세요. 채널 런타임 `envVars` 또는 로컬
상수는 운영자 대상 복사용으로만 유지하세요.

채널이 Plugin 런타임이 시작되기 전에 `status`, `channels list`, `channels status`, 또는
SecretRef 스캔에 나타날 수 있다면 `package.json`에 `openclaw.setupEntry`를 추가하세요.
해당 entrypoint는 읽기 전용 명령 경로에서 안전하게 import 가능해야 하며,
채널 메타데이터, setup-safe config adapter, status
adapter, 그리고 해당 요약에 필요한 채널 secret 대상 메타데이터를 반환해야 합니다. setup entry에서는 client, listener, 전송 런타임을 시작하지 마세요.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 그리고
`splitSetupEntries`

- 더 무거운 공유 setup/config helper도 함께 필요할 때만
  더 넓은 `openclaw/plugin-sdk/setup` seam을 사용하세요. 예를 들어
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

채널이 설정 표면에서 “먼저 이 Plugin을 설치하세요”만 광고하고 싶다면
`createOptionalChannelSetupSurface(...)`를 우선 사용하세요. 생성된
adapter/wizard는 구성 쓰기와 finalization에서 닫힌 실패로 동작하며,
검증, finalize, docs-link 복사에서 동일한 설치 필요 메시지를 재사용합니다.

다른 핫 채널 경로에서도 더 넓은 레거시 표면보다 좁은 helper를 우선 사용하세요:

- 다중 계정 구성 및
  기본 계정 폴백에는 `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, 그리고
  `openclaw/plugin-sdk/account-helpers`
- 인바운드 라우트/envelope 및
  record-and-dispatch 연결에는 `openclaw/plugin-sdk/inbound-envelope`와
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/매칭에는 `openclaw/plugin-sdk/messaging-targets`
- 미디어 로딩과 아웃바운드
  identity/send delegate 및 payload 계획에는 `openclaw/plugin-sdk/outbound-media`와
  `openclaw/plugin-sdk/outbound-runtime`
- 아웃바운드 라우트가 명시적
  `replyToId`/`threadId`를 보존하거나 기본 세션 키가 여전히 일치한 뒤 현재 `:thread:` 세션을 복구해야 할 때는
  `openclaw/plugin-sdk/channel-core`의 `buildThreadAwareOutboundSessionRoute(...)`.
  Provider Plugins는 자신의 플랫폼에 네이티브 스레드 전달 의미 체계가 있을 때 우선순위, 접미 동작, 스레드 ID 정규화를 재정의할 수 있습니다.
- 스레드 바인딩 수명 주기
  및 어댑터 등록에는 `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 agent/media
  payload 필드 레이아웃이 여전히 필요할 때만 `openclaw/plugin-sdk/agent-media-payload`
- Telegram 사용자 정의 명령
  정규화, 중복/충돌 검증, fallback 안정 명령 구성 계약에는 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로에서 멈춰도 됩니다. 코어가 승인을 처리하고 Plugin은 아웃바운드/인증 capability만 노출하면 됩니다. Matrix, Slack, Telegram, 사용자 정의 채팅 전송 같은 네이티브 승인 채널은 자체 승인 수명 주기를 직접 구현하는 대신 공유 네이티브 helper를 사용해야 합니다.

## 인바운드 멘션 정책

인바운드 멘션 처리는 두 계층으로 나누어 유지하세요.

- Plugin 소유 증거 수집
- 공유 정책 평가

멘션 정책 결정에는 `openclaw/plugin-sdk/channel-mention-gating`을 사용하세요.
더 넓은 인바운드
helper 배럴이 필요할 때만 `openclaw/plugin-sdk/channel-inbound`를 사용하세요.

Plugin 로컬 로직에 잘 맞는 항목:

- bot에 대한 reply 감지
- bot 인용 감지
- 스레드 참여 여부 확인
- 서비스/시스템 메시지 제외
- bot 참여를 증명하는 데 필요한 플랫폼 네이티브 캐시

공유 helper에 잘 맞는 항목:

- `requireMention`
- 명시적 멘션 결과
- 암묵적 멘션 허용 목록
- 명령 우회
- 최종 건너뛰기 결정

권장 흐름:

1. 로컬 멘션 사실을 계산합니다.
2. 해당 사실을 `resolveInboundMentionDecision({ facts, policy })`에 전달합니다.
3. 인바운드 게이트에서 `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, `decision.shouldSkip`를 사용합니다.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions`는 이미 런타임 주입에 의존하는
번들 채널 Plugins에 동일한 공유 멘션 helper를 노출합니다.

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

`implicitMentionKindWhen`과
`resolveInboundMentionDecision`만 필요하다면
관련 없는 인바운드
런타임 helper를 로드하지 않도록 `openclaw/plugin-sdk/channel-mention-gating`에서 import하세요.

이전 `resolveMentionGating*` helper는
`openclaw/plugin-sdk/channel-inbound`에 호환성 export로만 남아 있습니다. 새 코드는
`resolveInboundMentionDecision({ facts, policy })`를 사용해야 합니다.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 manifest">
    표준 Plugin 파일을 생성하세요. `package.json`의 `channel` 필드는
    이것이 채널 Plugin임을 나타냅니다. 전체 패키지 메타데이터 표면은
    [Plugin 설정 및 구성](/ko/plugins/sdk-setup#openclaw-channel)을 참조하세요.

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="채널 Plugin 객체 빌드">
    `ChannelPlugin` 인터페이스에는 선택적 어댑터 표면이 많이 있습니다. 최소 구성인
    `id`와 `setup`부터 시작하고, 필요에 따라 어댑터를 추가하세요.

    `src/channel.ts` 생성:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="createChatChannelPlugin이 해주는 일">
      저수준 어댑터 인터페이스를 수동으로 구현하는 대신,
      선언적 옵션을 전달하면 builder가 이를 조합합니다:

      | 옵션 | 연결되는 항목 |
      | --- | --- |
      | `security.dm` | 구성 필드에서 범위 지정된 DM 보안 확인자 |
      | `pairing.text` | 코드 교환이 포함된 텍스트 기반 DM 페어링 흐름 |
      | `threading` | reply-to-mode 확인자(고정, 계정 범위, 또는 사용자 정의) |
      | `outbound.attachedResults` | 결과 메타데이터(메시지 ID)를 반환하는 send 함수 |

      완전한 제어가 필요하다면 선언적 옵션 대신 원시 어댑터 객체를
      전달할 수도 있습니다.
    </Accordion>

  </Step>

  <Step title="entry point 연결">
    `index.ts` 생성:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    채널 소유 CLI descriptor는 `registerCliMetadata(...)`에 두세요. 그러면 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 도움말에 이를 표시할 수 있고,
    정상적인 전체 로드에서도 실제 명령 등록에 동일한 descriptor를 사용할 수 있습니다.
    런타임 전용 작업에는 `registerFull(...)`을 유지하세요.
    `registerFull(...)`이 Gateway RPC 메서드를 등록한다면
    Plugin 전용 접두사를 사용하세요. 코어 admin 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상
    `operator.admin`으로 확인됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다. 모든
    옵션은 [Entry Points](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참조하세요.

  </Step>

  <Step title="setup entry 추가">
    온보딩 중 경량 로딩을 위해 `setup-entry.ts`를 생성하세요.

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw는 채널이 비활성화되었거나
    구성되지 않았을 때 전체 entry 대신 이것을 로드합니다. 설정 흐름 중 무거운 런타임 코드를 끌어오지 않게 해줍니다.
    자세한 내용은 [설정 및 구성](/ko/plugins/sdk-setup#setup-entry)을 참조하세요.

    setup-safe export를 사이드카
    모듈로 분리한 번들 워크스페이스 채널은
    명시적인 setup-time 런타임 setter도 필요할 때
    `openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.

  </Step>

  <Step title="인바운드 메시지 처리">
    Plugin은 플랫폼으로부터 메시지를 받아 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고
    채널의 인바운드 핸들러를 통해 dispatch하는 Webhook입니다:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (직접 서명 검증)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 인바운드 핸들러가 메시지를 OpenClaw로 디스패치합니다.
          // 정확한 연결 방식은 플랫폼 SDK에 따라 다릅니다 —
          // 실제 예시는 번들 Microsoft Teams 또는 Google Chat plugin 패키지를 참조하세요.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      인바운드 메시지 처리는 채널별입니다. 각 채널 Plugin은
      자체 인바운드 파이프라인을 소유합니다. 실제 패턴은 번들 채널 Plugins
      (예: Microsoft Teams 또는 Google Chat plugin 패키지)를 살펴보세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 함께 배치된 테스트를 작성하세요:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    공유 테스트 helper는 [테스팅](/ko/plugins/sdk-testing)을 참조하세요.

  </Step>
</Steps>

## 파일 구조

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 메타데이터
├── openclaw.plugin.json      # 구성 스키마가 포함된 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 공개 export (선택 사항)
├── runtime-api.ts            # 내부 런타임 export (선택 사항)
└── src/
    ├── channel.ts            # createChatChannelPlugin을 통한 ChannelPlugin
    ├── channel.test.ts       # 테스트
    ├── client.ts             # 플랫폼 API 클라이언트
    └── runtime.ts            # 런타임 저장소(필요한 경우)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="스레딩 옵션" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위, 또는 사용자 정의 reply 모드
  </Card>
  <Card title="메시지 도구 통합" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 action discovery
  </Card>
  <Card title="대상 확인" icon="crosshair" href="/ko/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="런타임 helper" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, STT, 미디어, subagent
  </Card>
</CardGroup>

<Note>
일부 번들 helper seam은 번들 Plugin 유지 관리 및
호환성을 위해 여전히 존재합니다. 이는 새 채널 Plugins에 권장되는 패턴이 아닙니다.
해당 번들 Plugin 계열을 직접 유지 관리하는 경우가 아니라면 공통 SDK
표면의 일반적인 channel/setup/reply/runtime 하위 경로를 우선 사용하세요.
</Note>

## 다음 단계

- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — Plugin이 모델도 제공하는 경우
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [SDK 테스팅](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 계약 테스트
- [Plugin Manifest](/ko/plugins/manifest) — 전체 Manifest 스키마

## 관련

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [Agent harness Plugins](/ko/plugins/sdk-agent-harness)
