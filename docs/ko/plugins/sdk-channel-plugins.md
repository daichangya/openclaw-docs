---
read_when:
    - 새 메시징 채널 plugin을 구축하고 있습니다
    - OpenClaw를 메시징 플랫폼에 연결하고 싶습니다
    - ChannelPlugin adapter surface를 이해해야 합니다
sidebarTitle: Channel Plugins
summary: OpenClaw용 메시징 채널 plugin을 구축하는 단계별 가이드
title: 채널 Plugins 구축하기
x-i18n:
    generated_at: "2026-04-07T05:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ac0591d9b0ba401925b29ae4b9572f18b2cbffc2b6ca6ed5252740e7cf97e9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# 채널 Plugins 구축하기

이 가이드는 OpenClaw를 메시징 플랫폼에 연결하는 채널 plugin을 구축하는 과정을
안내합니다. 이 과정을 마치면 DM 보안, pairing, 응답 thread 처리, outbound 메시징을 갖춘
작동하는 채널을 얻게 됩니다.

<Info>
  아직 OpenClaw plugin을 한 번도 만들어 본 적이 없다면, 먼저
  기본 패키지 구조와 manifest 설정을 위해
  [Getting Started](/ko/plugins/building-plugins)를 읽어보세요.
</Info>

## 채널 plugins의 동작 방식

채널 plugins는 자체 send/edit/react 도구가 필요하지 않습니다. OpenClaw는 core에
공유 `message` 도구 하나를 유지합니다. plugin이 담당하는 항목은 다음과 같습니다:

- **Config** — 계정 해석 및 설정 마법사
- **보안** — DM policy 및 allowlist
- **Pairing** — DM 승인 흐름
- **Session 문법** — provider별 conversation id가 base chat, thread id, parent fallback으로 매핑되는 방식
- **Outbound** — 플랫폼으로 텍스트, media, poll 전송
- **Threading** — 응답을 thread로 처리하는 방식

core는 공유 message 도구, 프롬프트 연결, 외부 session-key 형태,
일반적인 `:thread:` bookkeeping, dispatch를 담당합니다.

플랫폼이 conversation id 안에 추가 범위를 저장한다면, 해당 파싱은
plugin 내부의 `messaging.resolveSessionConversation(...)`에 두세요. 이것이
`rawId`를 base conversation id, 선택적 thread
id, 명시적인 `baseConversationId`, 그리고 모든 `parentConversationCandidates`로 매핑하는
정식 hook입니다.
`parentConversationCandidates`를 반환할 때는 가장 좁은 parent부터
가장 넓은/base conversation까지 순서를 유지하세요.

채널 레지스트리가 부팅되기 전에 같은 파싱이 필요한 번들 plugins는
일치하는
`resolveSessionConversation(...)` export를 가진 최상위 `session-key-api.ts` 파일을 노출할 수도 있습니다. core는
런타임 plugin 레지스트리를 아직 사용할 수 없을 때만 이 bootstrap-safe surface를 사용합니다.

`messaging.resolveParentConversationCandidates(...)`는
plugin이 일반/raw id 위에 parent fallback만 필요할 때를 위한
레거시 호환 fallback으로 계속 제공됩니다. 두 hook이 모두 있으면 core는
먼저 `resolveSessionConversation(...).parentConversationCandidates`를 사용하고, 정식 hook이
이를 생략한 경우에만 `resolveParentConversationCandidates(...)`로 fallback합니다.

## 승인 및 채널 capability

대부분의 채널 plugins는 승인 전용 코드가 필요하지 않습니다.

- core는 same-chat `/approve`, 공유 승인 버튼 payload, 일반 fallback 전송을 담당합니다.
- 채널에 승인 전용 동작이 필요하면 채널 plugin에 `approvalCapability` 객체 하나를 두는 방식을 권장합니다.
- `approvalCapability.authorizeActorAction` 및 `approvalCapability.getActionAvailabilityState`가 정식 승인 인증 seam입니다.
- 채널이 네이티브 exec 승인을 노출한다면, 네이티브 전송이 전부 `approvalCapability.native` 아래에 있더라도 `approvalCapability.getActionAvailabilityState`를 구현하세요. core는 이 availability hook을 사용해 `enabled`와 `disabled`를 구분하고, 시작 채널이 네이티브 승인을 지원하는지 판단하며, 채널을 네이티브 클라이언트 fallback 안내에 포함합니다.
- 중복된 로컬 승인 프롬프트 숨기기나 전송 전 typing indicator 보내기 같은 채널별 payload 수명 주기 동작에는 `outbound.shouldSuppressLocalPayloadPrompt` 또는 `outbound.beforeDeliverPayload`를 사용하세요.
- `approvalCapability.delivery`는 네이티브 승인 라우팅 또는 fallback 억제에만 사용하세요.
- 채널이 공유 렌더러 대신 진짜로 커스텀 승인 payload가 필요할 때만 `approvalCapability.render`를 사용하세요.
- 채널이 비활성화 경로 응답에서 네이티브 exec 승인을 활성화하는 데 필요한 정확한 config knob을 설명하고 싶다면 `approvalCapability.describeExecApprovalSetup`을 사용하세요. 이 hook은 `{ channel, channelLabel, accountId }`를 받으며, 이름 있는 계정 채널은 최상위 기본값 대신 `channels.<channel>.accounts.<id>.execApprovals.*` 같은 계정 범위 경로를 렌더링해야 합니다.
- 채널이 기존 config에서 안정적인 소유자형 DM 식별성을 추론할 수 있다면, 승인 전용 core 로직을 추가하지 말고 `openclaw/plugin-sdk/approval-runtime`의 `createResolvedApproverActionAuthAdapter`를 사용해 same-chat `/approve`를 제한하세요.
- 채널에 네이티브 승인 전송이 필요하다면, 채널 코드는 대상 정규화와 전송 hook에 집중되도록 유지하세요. core가 요청 필터링, 라우팅, dedupe, 만료, gateway subscription을 담당할 수 있도록 `openclaw/plugin-sdk/approval-runtime`의 `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`, `createChannelNativeApprovalRuntime`를 사용하세요.
- 네이티브 승인 채널은 `accountId`와 `approvalKind`를 모두 이 helper들을 통해 라우팅해야 합니다. `accountId`는 다중 계정 승인 policy가 올바른 봇 계정 범위에 유지되도록 하고, `approvalKind`는 core에 하드코딩된 분기 없이 exec 승인과 plugin 승인 동작을 채널에서 사용할 수 있게 합니다.
- 전달된 approval id kind는 끝까지 그대로 보존하세요. 네이티브 클라이언트는 채널 로컬 상태에서 exec와 plugin 승인 라우팅을 추측하거나 다시 작성해서는 안 됩니다.
- 서로 다른 approval kind는 의도적으로 서로 다른 네이티브 surface를 노출할 수 있습니다.
  현재 번들 예시는 다음과 같습니다:
  - Slack은 exec 및 plugin id 모두에 대해 네이티브 승인 라우팅을 계속 제공합니다.
  - Matrix는 exec 승인에 대해서만 네이티브 DM/channel 라우팅을 유지하고,
    plugin 승인은 공유 same-chat `/approve` 경로에 맡깁니다.
- `createApproverRestrictedNativeApprovalAdapter`는 여전히 호환성 wrapper로 존재하지만, 새 코드에서는 capability builder를 선호하고 plugin에 `approvalCapability`를 노출해야 합니다.

핫 채널 entrypoint에서는 이 계열 중 일부만 필요하다면
더 좁은 런타임 subpath를 사용하는 것을 권장합니다:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

마찬가지로 더 넓은 umbrella
surface가 필요하지 않다면 `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, 그리고
`openclaw/plugin-sdk/reply-chunking`을 선호하세요.

설정 관련해서는 구체적으로 다음을 따르세요:

- `openclaw/plugin-sdk/setup-runtime`은 런타임에서 안전한 setup helper를 포함합니다:
  import-safe setup patch adapter(`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 그리고 위임형
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime`은
  `createEnvPatchedAccountSetupAdapter`를 위한 좁은 env 인식 adapter
  seam입니다
- `openclaw/plugin-sdk/channel-setup`은 선택적 설치 setup
  builder와 몇 가지 setup-safe 기본 요소를 포함합니다:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

채널이 env 기반 setup 또는 인증을 지원하고, 일반 시작/config
흐름이 런타임 로드 전에 해당 env 이름을 알아야 한다면
plugin manifest의 `channelEnvVars`에 선언하세요. 채널 런타임 `envVars` 또는 로컬
상수는 운영자용 복사용으로만 유지하세요.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, 그리고
`splitSetupEntries`

- 더 무거운 공유 setup/config helper인
  `moveSingleAccountChannelSectionToDefaultAccount(...)`도 필요할 때만
  더 넓은 `openclaw/plugin-sdk/setup` seam을 사용하세요

채널이 setup surface에서 단지 "먼저 이 plugin을 설치하세요"만 광고하고 싶다면
`createOptionalChannelSetupSurface(...)`를 선호하세요. 생성된
adapter/wizard는 config 쓰기와 finalization에서 fail closed하며, 검증, finalize, 문서 링크
복사 전반에 같은 설치 필요 메시지를 재사용합니다.

다른 핫 채널 경로에서도 더 넓은 레거시
surface보다 좁은 helper를 선호하세요:

- 다중 계정 config 및
  기본 계정 fallback에는 `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, 그리고
  `openclaw/plugin-sdk/account-helpers`
- inbound 경로/envelope 및
  record-and-dispatch 연결에는 `openclaw/plugin-sdk/inbound-envelope`와
  `openclaw/plugin-sdk/inbound-reply-dispatch`
- 대상 파싱/매칭에는 `openclaw/plugin-sdk/messaging-targets`
- media 로딩 및 outbound
  identity/send delegate에는 `openclaw/plugin-sdk/outbound-media`와
  `openclaw/plugin-sdk/outbound-runtime`
- thread-binding 수명 주기
  및 adapter 등록에는 `openclaw/plugin-sdk/thread-bindings-runtime`
- 레거시 agent/media
  payload 필드 레이아웃이 여전히 필요한 경우에만 `openclaw/plugin-sdk/agent-media-payload`
- Telegram 커스텀 명령
  정규화, 중복/충돌 검증, fallback-stable 명령
  config 계약에는 `openclaw/plugin-sdk/telegram-command-config`

인증 전용 채널은 보통 기본 경로만으로 충분합니다. core가 승인을 처리하고 plugin은 outbound/auth capability만 노출하면 됩니다. Matrix, Slack, Telegram, 커스텀 채팅 전송 같은 네이티브 승인 채널은 자체 승인 수명 주기를 직접 구현하지 말고 공유 네이티브 helper를 사용해야 합니다.

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지 및 manifest">
    표준 plugin 파일을 만드세요. `package.json`의 `channel` 필드가
    이것을 채널 plugin으로 만듭니다. 전체 패키지 메타데이터 surface는
    [Plugin Setup and Config](/ko/plugins/sdk-setup#openclawchannel)를
    참고하세요:

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
          "blurb": "OpenClaw를 Acme Chat에 연결합니다."
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

  <Step title="채널 plugin 객체 구축">
    `ChannelPlugin` 인터페이스에는 많은 선택적 adapter surface가 있습니다. 우선
    최소 구성인 `id`와 `setup`부터 시작하고, 필요에 따라 adapter를 추가하세요.

    `src/channel.ts`를 만드세요:

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
          message: "신원을 확인하려면 이 코드를 보내세요:",
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

    <Accordion title="createChatChannelPlugin이 제공하는 것">
      저수준 adapter 인터페이스를 수동으로 구현하는 대신
      선언적인 옵션을 전달하면 builder가 이를 조합해 줍니다:

      | Option | 연결되는 항목 |
      | --- | --- |
      | `security.dm` | config 필드에서 범위가 지정된 DM 보안 해석기 |
      | `pairing.text` | 코드 교환이 포함된 텍스트 기반 DM pairing 흐름 |
      | `threading` | 응답 모드 해석기(고정, 계정 범위, 또는 커스텀) |
      | `outbound.attachedResults` | 결과 메타데이터(message ID)를 반환하는 send 함수 |

      완전한 제어가 필요하다면 선언적 옵션 대신 원시 adapter 객체를 전달할 수도 있습니다.
    </Accordion>

  </Step>

  <Step title="entry point 연결">
    `index.ts`를 만드세요:

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

    채널 소유 CLI descriptor는 `registerCliMetadata(...)`에 두세요. 그래야 OpenClaw가
    전체 채널 런타임을 활성화하지 않고도 루트 help에 이를 표시할 수 있고,
    일반 전체 로드에서도 실제 명령 등록을 위해 동일한 descriptor를 가져갈 수 있습니다.
    런타임 전용 작업에는 `registerFull(...)`을 유지하세요.
    `registerFull(...)`이 gateway RPC method를 등록한다면
    plugin 전용 prefix를 사용하세요. core 관리 네임스페이스(`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 항상
    `operator.admin`으로 해석됩니다.
    `defineChannelPluginEntry`는 등록 모드 분리를 자동으로 처리합니다.
    모든 옵션은 [Entry Points](/ko/plugins/sdk-entrypoints#definechannelpluginentry)를 참고하세요.

  </Step>

  <Step title="setup entry 추가">
    온보딩 중 가볍게 로드할 수 있도록 `setup-entry.ts`를 만드세요:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw는 채널이 비활성화되어 있거나 구성되지 않았을 때 전체 entry 대신 이것을 로드합니다.
    이렇게 하면 설정 흐름 중 무거운 런타임 코드를 불러오지 않아도 됩니다.
    자세한 내용은 [Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참고하세요.

  </Step>

  <Step title="inbound 메시지 처리">
    plugin은 플랫폼에서 메시지를 받아 OpenClaw로 전달해야 합니다.
    일반적인 패턴은 요청을 검증하고 이를 채널의 inbound handler를 통해
    dispatch하는 webhook입니다:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Inbound 메시지 처리는 채널별로 다릅니다. 각 채널 plugin이
      자체 inbound 파이프라인을 담당합니다. 실제 패턴은
      번들 채널 plugins
      (예: Microsoft Teams 또는 Google Chat plugin 패키지)를 참고하세요.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="테스트">
`src/channel.test.ts`에 테스트를 함께 작성하세요:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("config에서 account를 해석한다", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("secret을 materialize하지 않고 account를 검사한다", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("누락된 config를 보고한다", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    공유 테스트 helper는 [Testing](/ko/plugins/sdk-testing)을 참고하세요.

  </Step>
</Steps>

## 파일 구조

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # config schema가 포함된 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 공개 export (선택 사항)
├── runtime-api.ts            # 내부 런타임 export (선택 사항)
└── src/
    ├── channel.ts            # createChatChannelPlugin을 통한 ChannelPlugin
    ├── channel.test.ts       # 테스트
    ├── client.ts             # 플랫폼 API client
    └── runtime.ts            # 런타임 store (필요한 경우)
```

## 고급 주제

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/ko/plugins/sdk-entrypoints#registration-mode">
    고정, 계정 범위, 또는 커스텀 응답 모드
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ko/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 및 action discovery
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ko/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, STT, media, subagent
  </Card>
</CardGroup>

<Note>
일부 번들 helper seam은 번들 plugin 유지보수와
호환성을 위해 여전히 남아 있습니다. 그러나 새 채널 plugins에 권장되는 패턴은 아닙니다.
해당 번들 plugin 계열을 직접 유지보수하는 경우가 아니라면
공통 SDK surface의 일반 channel/setup/reply/runtime subpath를 우선 사용하세요.
</Note>

## 다음 단계

- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — plugin이 model도 제공하는 경우
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [SDK Testing](/ko/plugins/sdk-testing) — 테스트 유틸리티 및 계약 테스트
- [Plugin Manifest](/ko/plugins/manifest) — 전체 manifest schema
