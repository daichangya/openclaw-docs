---
read_when:
    - 새 OpenClaw plugin을 만들고 싶을 때
    - plugin 개발을 위한 빠른 시작 가이드가 필요할 때
    - OpenClaw에 새 channel, provider, tool 또는 다른 capability를 추가하고 있을 때
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw plugin 만들기
title: Plugins 만들기
x-i18n:
    generated_at: "2026-04-07T05:57:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugins 만들기

Plugins는 OpenClaw를 새로운 기능으로 확장합니다: channels, model providers,
speech, 실시간 전사, 실시간 음성, media understanding, image
generation, video generation, 웹 fetch, 웹 search, agent tools, 또는
이들의 조합.

plugin을 OpenClaw 리포지토리에 추가할 필요는 없습니다.
[ClawHub](/ko/tools/clawhub) 또는 npm에 배포하면 사용자는
`openclaw plugins install <package-name>`으로 설치할 수 있습니다. OpenClaw는 먼저 ClawHub를 시도하고
그다음 자동으로 npm으로 fallback합니다.

## 전제 조건

- Node >= 22 및 패키지 관리자(npm 또는 pnpm)
- TypeScript (ESM)에 대한 익숙함
- 리포지토리 내 plugins의 경우: 리포지토리 클론 완료 및 `pnpm install` 실행 완료

## 어떤 종류의 plugin인가요?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결합니다
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    model provider(LLM, proxy 또는 custom endpoint)를 추가합니다
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    agent tools, event hooks 또는 서비스를 등록합니다 — 아래로 계속
  </Card>
</CardGroup>

channel plugin이 선택 사항이고 onboarding/setup 실행 시
설치되어 있지 않을 수 있다면,
`openclaw/plugin-sdk/channel-setup`의
`createOptionalChannelSetupSurface(...)`를 사용하세요. 이것은 설치 요구 사항을 알리고, plugin이 설치되기 전까지 실제 config 쓰기에서는 닫힌 상태로 실패하는 setup adapter + wizard 쌍을 생성합니다.

## 빠른 시작: tool plugin

이 안내는 agent tool을 등록하는 최소 plugin을 만듭니다. Channel
및 provider plugins는 위에 링크된 전용 가이드가 있습니다.

<Steps>
  <Step title="패키지와 manifest 만들기">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    모든 plugin에는 config가 없어도 manifest가 필요합니다.
    전체 스키마는 [Manifest](/ko/plugins/manifest)를 참조하세요. 정식 ClawHub
    publish 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="엔트리 포인트 작성">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry`는 channel이 아닌 plugins용입니다. channels에는
    `defineChannelPluginEntry`를 사용하세요 — [Channel Plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요.
    전체 엔트리 포인트 옵션은 [Entry Points](/ko/plugins/sdk-entrypoints)를 참조하세요.

  </Step>

  <Step title="테스트 및 배포">

    **외부 plugins:** ClawHub로 검증 및 배포한 다음 설치합니다:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw는 `@myorg/openclaw-my-plugin` 같은
    기본 패키지 지정에 대해서도 npm보다 먼저 ClawHub를 확인합니다.

    **리포지토리 내 plugins:** 번들 plugin 워크스페이스 트리 아래에 배치하면 자동으로 검색됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin capabilities

하나의 plugin은 `api` 객체를 통해 원하는 수의 capabilities를 등록할 수 있습니다:

| Capability             | 등록 메서드                                      | 상세 가이드                                                                    |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| 텍스트 추론 (LLM)      | `api.registerProvider(...)`                      | [Provider Plugins](/ko/plugins/sdk-provider-plugins)                             |
| CLI 추론 백엔드        | `api.registerCliBackend(...)`                    | [CLI Backends](/ko/gateway/cli-backends)                                         |
| Channel / 메시징       | `api.registerChannel(...)`                       | [Channel Plugins](/ko/plugins/sdk-channel-plugins)                               |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 전사            | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 음성            | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 이미지 생성            | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 음악 생성              | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 비디오 생성            | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 fetch               | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 search              | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Agent tools            | `api.registerTool(...)`                          | 아래                                                                          |
| Custom 명령            | `api.registerCommand(...)`                       | [Entry Points](/ko/plugins/sdk-entrypoints)                                      |
| Event hooks            | `api.registerHook(...)`                          | [Entry Points](/ko/plugins/sdk-entrypoints)                                      |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/ko/plugins/architecture#gateway-http-routes)                        |
| CLI 하위 명령          | `api.registerCli(...)`                           | [Entry Points](/ko/plugins/sdk-entrypoints)                                      |

전체 등록 API는 [SDK Overview](/ko/plugins/sdk-overview#registration-api)를 참조하세요.

plugin이 custom gateway RPC 메서드를 등록한다면,
plugin 전용 prefix를 유지하세요. core admin 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, plugin이 더 좁은 scope를 요청하더라도 항상
`operator.admin`으로 해석됩니다.

알아두어야 할 hook guard 시맨틱:

- `before_tool_call`: `{ block: true }`는 종료 동작이며 더 낮은 우선순위 핸들러를 중지합니다.
- `before_tool_call`: `{ block: false }`는 결정을 내리지 않은 것으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 agent 실행을 일시 중지하고 exec approval overlay, Telegram 버튼, Discord 상호작용 또는 모든 channel의 `/approve` 명령을 통해 사용자 승인을 요청합니다.
- `before_install`: `{ block: true }`는 종료 동작이며 더 낮은 우선순위 핸들러를 중지합니다.
- `before_install`: `{ block: false }`는 결정을 내리지 않은 것으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종료 동작이며 더 낮은 우선순위 핸들러를 중지합니다.
- `message_sending`: `{ cancel: false }`는 결정을 내리지 않은 것으로 처리됩니다.

`/approve` 명령은 exec 및 plugin 승인 둘 다를 제한된 fallback으로 처리합니다. exec approval id를 찾지 못하면 OpenClaw는 같은 id를 plugin approvals를 통해 다시 시도합니다. plugin approval 전달은 config의 `approvals.plugin`을 통해 독립적으로 구성할 수 있습니다.

custom approval 연결 로직에서 동일한 제한된 fallback 사례를 감지해야 한다면,
approval 만료 문자열을 수동으로 매칭하는 대신
`openclaw/plugin-sdk/error-runtime`의 `isApprovalNotFoundError`를 우선 사용하세요.

자세한 내용은 [SDK Overview hook decision semantics](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## agent tools 등록하기

Tools는 LLM이 호출할 수 있는 타입 지정 함수입니다. 필수일 수도 있고(항상
사용 가능), 선택 사항일 수도 있습니다(사용자 opt-in):

```typescript
register(api) {
  // 필수 tool — 항상 사용 가능
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 선택적 tool — 사용자가 allowlist에 추가해야 함
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

사용자는 config에서 선택적 tools를 활성화합니다:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool 이름은 core tools와 충돌하면 안 됩니다(충돌은 건너뜁니다)
- 부작용이 있거나 추가 바이너리 요구 사항이 있는 tools에는 `optional: true`를 사용하세요
- 사용자는 `tools.allow`에 plugin id를 추가하여 plugin의 모든 tools를 활성화할 수 있습니다

## import 규칙

항상 집중된 `openclaw/plugin-sdk/<subpath>` 경로에서 import하세요:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 잘못된 예: 단일 루트(monolithic root) (사용 중단 예정, 제거될 예정)
import { ... } from "openclaw/plugin-sdk";
```

전체 하위 경로 참조는 [SDK Overview](/ko/plugins/sdk-overview)를 참조하세요.

plugin 내부에서는 내부 import에 로컬 배럴 파일(`api.ts`, `runtime-api.ts`)을 사용하세요 — 절대로 SDK 경로를 통해 자기 자신의 plugin을 import하지 마세요.

provider plugins의 경우, 해당 seam이 정말로 일반적인 경우가 아니라면 provider별 helper는 그 패키지 루트
배럴에 유지하세요. 현재 번들 예시:

- Anthropic: Claude 스트림 래퍼 및 `service_tier` / 베타 helper
- OpenAI: provider 빌더, 기본 모델 helper, 실시간 providers
- OpenRouter: provider 빌더와 onboarding/config helpers

helper가 하나의 번들 provider 패키지 안에서만 유용하다면,
이를 `openclaw/plugin-sdk/*`로 승격하지 말고 해당
패키지 루트 seam에 유지하세요.

일부 생성된 `openclaw/plugin-sdk/<bundled-id>` helper seam은 여전히
번들 plugin 유지 관리 및 호환성을 위해 존재합니다. 예를 들어
`plugin-sdk/feishu-setup` 또는 `plugin-sdk/zalo-setup`이 있습니다. 이런 것은
새로운 서드파티 plugins의 기본 패턴이 아니라 예약된
surface로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** manifest가 존재하며 유효함</Check>
<Check>엔트리 포인트가 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 import가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 import는 SDK self-import가 아닌 로컬 모듈을 사용함</Check>
<Check>테스트 통과 (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` 통과 (리포지토리 내 plugins)</Check>

## 베타 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 확인하고 `Watch` > `Releases`를 통해 구독하세요. 베타 태그는 `v2026.3.N-beta.1` 형태입니다. 릴리스 공지를 위해 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림을 켤 수도 있습니다.
2. 베타 태그가 나타나면 가능한 한 빨리 해당 베타 태그로 plugin을 테스트하세요. 안정 버전 전까지의 창은 일반적으로 몇 시간밖에 되지 않습니다.
3. 테스트 후 `plugin-forum` Discord 채널의 plugin 스레드에 `all good` 또는 무엇이 깨졌는지 게시하세요. 아직 스레드가 없다면 만드세요.
4. 문제가 발생하면 `Beta blocker: <plugin-name> - <summary>` 제목의 이슈를 열거나 업데이트하고 `beta-blocker` 레이블을 적용하세요. 이슈 링크를 스레드에 넣으세요.
5. `main` 대상으로 `fix(<plugin-id>): beta blocker - <summary>` 제목의 PR을 열고, PR과 Discord 스레드 둘 다에 이슈를 연결하세요. 기여자는 PR에 레이블을 붙일 수 없으므로 제목이 유지 관리자와 자동화를 위한 PR 측 신호입니다. PR이 있는 blocker는 병합되고, 없는 blocker는 그대로 출시될 수 있습니다. 유지 관리자들은 베타 테스트 중 이 스레드들을 확인합니다.
6. 아무 말이 없으면 정상입니다. 이 창을 놓치면 수정 사항은 다음 주기에 반영될 가능성이 높습니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 channel plugin 만들기
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    model provider plugin 만들기
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ko/plugins/sdk-overview">
    import 맵 및 등록 API 참조
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ko/plugins/sdk-runtime">
    `api.runtime`를 통한 TTS, search, subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ko/plugins/manifest">
    전체 manifest 스키마 참조
  </Card>
</CardGroup>

## 관련

- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처 심층 분석
- [SDK Overview](/ko/plugins/sdk-overview) — Plugin SDK 참조
- [Manifest](/ko/plugins/manifest) — plugin manifest 형식
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — channel plugins 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider plugins 만들기
