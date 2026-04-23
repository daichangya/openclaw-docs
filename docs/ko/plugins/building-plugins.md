---
read_when:
    - 새 OpenClaw Plugin을 만들려고 합니다
    - Plugin 개발을 위한 빠른 시작이 필요합니다
    - OpenClaw에 새 채널, provider, 도구 또는 기타 기능을 추가하는 중입니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw Plugin 만들기
title: Plugin 빌드하기
x-i18n:
    generated_at: "2026-04-23T06:04:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Plugin 빌드하기

Plugin은 OpenClaw에 새 기능을 추가합니다: 채널, 모델 provider,
음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성,
웹 가져오기, 웹 검색, 에이전트 도구 또는 이들의 조합.

Plugin을 OpenClaw 저장소에 추가할 필요는 없습니다.
[ClawHub](/ko/tools/clawhub) 또는 npm에 게시하면 사용자가
`openclaw plugins install <package-name>`로 설치할 수 있습니다.
OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 fallback합니다.

## 사전 요구 사항

- Node >= 22 및 패키지 관리자(npm 또는 pnpm)
- TypeScript(ESM)에 대한 이해
- 저장소 내부 Plugin의 경우: 저장소를 클론했고 `pnpm install` 완료

## 어떤 종류의 Plugin인가요?

<CardGroup cols={3}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼(Discord, IRC 등)에 연결
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 provider(LLM, 프록시 또는 사용자 지정 엔드포인트) 추가
  </Card>
  <Card title="도구 / hook Plugin" icon="wrench">
    에이전트 도구, 이벤트 hook 또는 서비스 등록 — 아래 계속
  </Card>
</CardGroup>

채널 Plugin이 선택 사항이고 온보딩/설정 실행 시점에 설치되어 있지 않을 수
있다면 `openclaw/plugin-sdk/channel-setup`의
`createOptionalChannelSetupSurface(...)`를 사용하세요. 이 함수는 설치
요구 사항을 알리고, Plugin이 설치되기 전까지 실제 config 쓰기에서는 fail closed하는
설정 어댑터 + wizard 쌍을 생성합니다.

## 빠른 시작: 도구 Plugin

이 안내에서는 에이전트 도구를 등록하는 최소 Plugin을 만듭니다. 채널 Plugin과
provider Plugin은 위에 링크된 전용 가이드가 있습니다.

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
      "description": "OpenClaw에 사용자 지정 도구를 추가합니다",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    모든 Plugin에는 config가 없어도 manifest가 필요합니다.
    전체 스키마는 [Manifest](/ko/plugins/manifest)를 참조하세요. 정식 ClawHub
    게시 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="진입점 작성">

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

    `definePluginEntry`는 비채널 Plugin용입니다. 채널에는
    `defineChannelPluginEntry`를 사용하세요 —
    [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.
    전체 진입점 옵션은 [진입점](/ko/plugins/sdk-entrypoints)을 참조하세요.

  </Step>

  <Step title="테스트 및 게시">

    **외부 Plugin:** ClawHub로 검증 및 게시 후 설치:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw는 `@myorg/openclaw-my-plugin` 같은 일반 패키지 지정자에 대해서도
    npm보다 먼저 ClawHub를 확인합니다.

    **저장소 내부 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 두면 자동으로 검색됩니다.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 기능

단일 Plugin은 `api` 객체를 통해 원하는 수의 기능을 등록할 수 있습니다.

| 기능 | 등록 메서드 | 상세 가이드 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| 텍스트 추론(LLM) | `api.registerProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins) |
| CLI 추론 backend | `api.registerCliBackend(...)` | [CLI Backends](/ko/gateway/cli-backends) |
| 채널 / 메시징 | `api.registerChannel(...)` | [채널 Plugin](/ko/plugins/sdk-channel-plugins) |
| 음성(TTS/STT) | `api.registerSpeechProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 전사 | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 실시간 음성 | `api.registerRealtimeVoiceProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 미디어 이해 | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 이미지 생성 | `api.registerImageGenerationProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 음악 생성 | `api.registerMusicGenerationProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 비디오 생성 | `api.registerVideoGenerationProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 가져오기 | `api.registerWebFetchProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 웹 검색 | `api.registerWebSearchProvider(...)` | [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 내장 Pi extension | `api.registerEmbeddedExtensionFactory(...)` | [SDK 개요](/ko/plugins/sdk-overview#registration-api) |
| 에이전트 도구 | `api.registerTool(...)` | 아래 |
| 사용자 지정 명령어 | `api.registerCommand(...)` | [진입점](/ko/plugins/sdk-entrypoints) |
| 이벤트 hook | `api.registerHook(...)` | [진입점](/ko/plugins/sdk-entrypoints) |
| HTTP 라우트 | `api.registerHttpRoute(...)` | [Internals](/ko/plugins/architecture#gateway-http-routes) |
| CLI 하위 명령어 | `api.registerCli(...)` | [진입점](/ko/plugins/sdk-entrypoints) |

전체 등록 API는 [SDK 개요](/ko/plugins/sdk-overview#registration-api)를 참조하세요.

Plugin이 최종 도구 결과 메시지가 출력되기 전의 비동기 `tool_result`
재작성 같은 Pi 네이티브 embedded-runner hook이 필요하면
`api.registerEmbeddedExtensionFactory(...)`를 사용하세요.
작업에 Pi extension 타이밍이 필요하지 않다면 일반 OpenClaw Plugin hook을 우선하세요.

Plugin이 사용자 지정 gateway RPC 메서드를 등록한다면
Plugin 전용 prefix를 유지하세요. 핵심 관리 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며,
Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 해석됩니다.

기억해 둘 hook guard 의미:

- `before_tool_call`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `before_tool_call`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `before_tool_call`: `{ requireApproval: true }`는 에이전트 실행을 일시 중지하고 exec 승인 오버레이, Telegram 버튼, Discord 상호작용 또는 모든 채널의 `/approve` 명령을 통해 사용자 승인을 요청합니다.
- `before_install`: `{ block: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `before_install`: `{ block: false }`는 결정 없음으로 처리됩니다.
- `message_sending`: `{ cancel: true }`는 종료 결정이며 더 낮은 우선순위 핸들러를 중단합니다.
- `message_sending`: `{ cancel: false }`는 결정 없음으로 처리됩니다.
- `message_received`: 인바운드 스레드/토픽 라우팅이 필요하면 타입 지정된 `threadId` 필드를 우선 사용하세요. `metadata`는 채널별 추가 정보용으로 유지하세요.
- `message_sending`: 채널별 metadata 키보다 타입 지정된 `replyToId` / `threadId` 라우팅 필드를 우선 사용하세요.

`/approve` 명령은 제한된 fallback으로 exec 승인과 Plugin 승인을 모두 처리합니다.
exec 승인 ID를 찾지 못하면 OpenClaw는 같은 ID를 Plugin 승인을 통해 다시 시도합니다.
Plugin 승인 전달은 config의 `approvals.plugin`을 통해 독립적으로 구성할 수 있습니다.

사용자 지정 승인 처리에서 동일한 제한된 fallback 사례를 감지해야 한다면,
승인 만료 문자열을 수동으로 매칭하지 말고
`openclaw/plugin-sdk/error-runtime`의 `isApprovalNotFoundError`를 사용하세요.

자세한 내용은
[SDK 개요 hook 결정 의미](/ko/plugins/sdk-overview#hook-decision-semantics)를 참조하세요.

## 에이전트 도구 등록

도구는 LLM이 호출할 수 있는 타입 지정 함수입니다. 필수(항상 사용 가능)일 수도 있고
선택 사항(사용자 opt-in)일 수도 있습니다.

```typescript
register(api) {
  // 필수 도구 — 항상 사용 가능
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 선택 도구 — 사용자가 allowlist에 추가해야 함
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

사용자는 config에서 선택 도구를 활성화합니다.

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 도구 이름은 핵심 도구와 충돌하면 안 됩니다(충돌 시 건너뜀)
- 부작용이 있거나 추가 바이너리 요구 사항이 있는 도구에는 `optional: true`를 사용하세요
- 사용자는 `tools.allow`에 Plugin id를 추가하여 해당 Plugin의 모든 도구를 활성화할 수 있습니다

## import 규칙

항상 집중된 `openclaw/plugin-sdk/<subpath>` 경로에서 import하세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 잘못된 예: 단일 루트 import(지원 중단, 제거 예정)
import { ... } from "openclaw/plugin-sdk";
```

전체 하위 경로 참조는 [SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

Plugin 내부에서는 내부 import에 로컬 barrel 파일(`api.ts`, `runtime-api.ts`)을 사용하세요.
자신의 Plugin을 SDK 경로를 통해 import하면 안 됩니다.

provider Plugin의 경우 provider별 helper는 그 경계가 정말 일반적이지 않은 한
해당 패키지 루트 barrel에 유지하세요. 현재 번들 예시:

- Anthropic: Claude 스트림 래퍼 및 `service_tier` / beta helper
- OpenAI: provider builder, 기본 모델 helper, 실시간 provider
- OpenRouter: provider builder와 온보딩/config helper

helper가 한 번들 provider 패키지 내부에서만 유용하다면,
이를 `openclaw/plugin-sdk/*`로 승격하지 말고 해당 패키지 루트 경계에 두세요.

번들 Plugin 유지보수 및 호환성을 위해 생성된 일부 `openclaw/plugin-sdk/<bundled-id>` helper 경계가 여전히 존재합니다. 예를 들어
`plugin-sdk/feishu-setup` 또는 `plugin-sdk/zalo-setup`가 있습니다. 이런 경계는
새 서드파티 Plugin의 기본 패턴이 아니라 예약된 표면으로 취급하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** manifest가 존재하고 유효함</Check>
<Check>진입점이 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 import가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 import가 SDK self-import가 아닌 로컬 모듈을 사용함</Check>
<Check>테스트 통과 (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` 통과 (저장소 내부 Plugin)</Check>

## 베타 릴리스 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 주시하고 `Watch` > `Releases`를 통해 구독하세요. 베타 태그는 `v2026.3.N-beta.1` 형식입니다. 릴리스 공지를 위해 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림도 켤 수 있습니다.
2. 베타 태그가 나타나는 즉시 해당 태그에 대해 Plugin을 테스트하세요. 안정 버전 전까지의 시간은 보통 몇 시간뿐입니다.
3. 테스트 후 `plugin-forum` Discord 채널의 해당 Plugin 스레드에 `all good` 또는 무엇이 깨졌는지 게시하세요. 아직 스레드가 없다면 새로 만드세요.
4. 문제가 생기면 `Beta blocker: <plugin-name> - <summary>` 제목으로 이슈를 열거나 업데이트하고 `beta-blocker` 라벨을 적용하세요. 해당 이슈 링크를 스레드에 넣으세요.
5. `main` 대상으로 `fix(<plugin-id>): beta blocker - <summary>` 제목의 PR을 열고, PR과 Discord 스레드 둘 다에 이슈를 링크하세요. 기여자는 PR에 라벨을 붙일 수 없으므로, 제목이 maintainer와 자동화를 위한 PR 측 신호가 됩니다. PR이 있는 blocker는 병합되지만, PR이 없는 blocker는 그대로 출시될 수 있습니다. maintainer는 베타 테스트 중 이 스레드들을 주시합니다.
6. 아무 말이 없으면 녹색 신호입니다. 이 창을 놓치면 수정 사항은 다음 주기에 반영될 가능성이 높습니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드하기
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 provider Plugin 빌드하기
  </Card>
  <Card title="SDK 개요" icon="book-open" href="/ko/plugins/sdk-overview">
    import 맵 및 등록 API 참조
  </Card>
  <Card title="런타임 helper" icon="settings" href="/ko/plugins/sdk-runtime">
    `api.runtime`를 통한 TTS, 검색, subagent
  </Card>
  <Card title="테스트" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ko/plugins/manifest">
    전체 manifest 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처 심층 설명
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
- [Manifest](/ko/plugins/manifest) — plugin manifest 형식
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 빌드하기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider Plugin 빌드하기
