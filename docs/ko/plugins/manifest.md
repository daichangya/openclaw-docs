---
read_when:
    - OpenClaw Plugin을 만들고 있습니다
    - Plugin 구성 스키마를 배포하거나 Plugin 검증 오류를 디버깅해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구 사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-24T06:26:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

이 페이지는 **네이티브 OpenClaw Plugin 매니페스트**만을 다룹니다.

호환 번들 레이아웃은 [Plugin 번들](/ko/plugins/bundles)을 참고하세요.

호환 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트 레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는 `openclaw.plugin.json` 스키마에 대해 검증되지는 않습니다.

호환 번들의 경우 OpenClaw는 현재 런타임 기대치와 레이아웃이 일치하면 번들 메타데이터와 선언된 skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값, Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 네이티브 OpenClaw Plugin은 **Plugin 루트**에 `openclaw.plugin.json` 파일을 반드시 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 **Plugin 코드를 실행하지 않고도** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면 Plugin 오류로 처리되며 구성 검증이 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참고하세요.
네이티브 기능 모델 및 현재 외부 호환성 지침은 [기능 모델](/ko/plugins/architecture#public-capability-model)을 참고하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 **Plugin 코드를 로드하기 전에** 읽는 메타데이터입니다. 아래의 모든 내용은 Plugin 런타임을 부팅하지 않고도 검사할 수 있을 만큼 가벼워야 합니다.

**다음 용도로 사용하세요:**

- Plugin 식별자, 구성 검증, 구성 UI 힌트
- 인증, 온보딩, 설정 메타데이터(alias, auto-enable, Provider env vars, auth choices)
- 제어 평면 표면을 위한 활성화 힌트
- 축약형 모델 계열 소유권
- 정적 기능 소유권 스냅샷(`contracts`)
- 공유 `openclaw qa` 호스트가 검사할 수 있는 QA 러너 메타데이터
- 카탈로그 및 검증 표면에 병합되는 채널별 구성 메타데이터

**다음 용도로는 사용하지 마세요:** 런타임 동작 등록, 코드 진입점 선언, npm 설치 메타데이터. 이런 것은 Plugin 코드와 `package.json`에 속합니다.

## 최소 예시

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 확장 예시

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 최상위 필드 참조

| 필드 | 필수 | 타입 | 의미 |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` | 예 | `string` | 표준 Plugin id입니다. 이 id는 `plugins.entries.<id>`에서 사용됩니다. |
| `configSchema` | 예 | `object` | 이 Plugin 구성에 대한 인라인 JSON Schema입니다. |
| `enabledByDefault` | 아니요 | `true` | 번들 Plugin을 기본 활성화 상태로 표시합니다. 생략하거나 `true`가 아닌 값을 설정하면 Plugin은 기본적으로 비활성화됩니다. |
| `legacyPluginIds` | 아니요 | `string[]` | 이 표준 Plugin id로 정규화되는 레거시 id입니다. |
| `autoEnableWhenConfiguredProviders` | 아니요 | `string[]` | 인증, 구성 또는 모델 참조에서 이 Provider id가 언급될 때 자동으로 Plugin을 활성화해야 하는 Provider id입니다. |
| `kind` | 아니요 | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin kind를 선언합니다. |
| `channels` | 아니요 | `string[]` | 이 Plugin이 소유한 채널 id입니다. 검색 및 구성 검증에 사용됩니다. |
| `providers` | 아니요 | `string[]` | 이 Plugin이 소유한 Provider id입니다. |
| `providerDiscoveryEntry` | 아니요 | `string` | 전체 Plugin 런타임을 활성화하지 않고 로드할 수 있는, 매니페스트 범위 Provider 카탈로그 메타데이터용 경량 Provider-discovery 모듈 경로입니다. Plugin 루트 기준 상대 경로입니다. |
| `modelSupport` | 아니요 | `object` | 런타임 전에 Plugin을 자동 로드하는 데 사용되는 매니페스트 소유 축약형 모델 계열 메타데이터입니다. |
| `providerEndpoints` | 아니요 | `object[]` | core가 Provider 런타임 로드 전에 분류해야 하는 Provider 경로에 대한 매니페스트 소유 endpoint host/baseUrl 메타데이터입니다. |
| `cliBackends` | 아니요 | `string[]` | 이 Plugin이 소유한 CLI Inference 백엔드 id입니다. 명시적 구성 참조에 의한 시작 시 자동 활성화에 사용됩니다. |
| `syntheticAuthRefs` | 아니요 | `string[]` | 런타임이 로드되기 전 cold model discovery 중 Plugin 소유 synthetic auth hook을 검사해야 하는 Provider 또는 CLI 백엔드 ref입니다. |
| `nonSecretAuthMarkers` | 아니요 | `string[]` | non-secret 로컬, OAuth 또는 ambient 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API 키 값입니다. |
| `commandAliases` | 아니요 | `object[]` | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는 이 Plugin 소유 명령 이름입니다. |
| `providerAuthEnvVars` | 아니요 | `Record<string, string[]>` | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 Provider 인증 env 메타데이터입니다. |
| `providerAuthAliases` | 아니요 | `Record<string, string>` | 인증 조회 시 다른 Provider id를 재사용해야 하는 Provider id입니다. 예를 들어 기본 Provider API 키와 auth profile을 공유하는 coding Provider 같은 경우입니다. |
| `channelEnvVars` | 아니요 | `Record<string, string[]>` | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 경량 채널 env 메타데이터입니다. env 기반 채널 설정 또는 일반 시작/구성 헬퍼가 봐야 하는 인증 표면에 사용하세요. |
| `providerAuthChoices` | 아니요 | `object[]` | 온보딩 선택기, 선호 Provider 해석, 간단한 CLI 플래그 연결용 경량 auth-choice 메타데이터입니다. |
| `activation` | 아니요 | `object` | Provider, 명령, 채널, 라우트, 기능 트리거 기반 로드를 위한 경량 활성화 플래너 메타데이터입니다. 메타데이터 전용이며 실제 동작은 여전히 Plugin 런타임이 소유합니다. |
| `setup` | 아니요 | `object` | 검색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 경량 setup/onboarding 설명자입니다. |
| `qaRunners` | 아니요 | `object[]` | Plugin 런타임이 로드되기 전에 공유 `openclaw qa` 호스트가 사용하는 경량 QA 러너 설명자입니다. |
| `contracts` | 아니요 | `object` | 외부 인증 훅, 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 음악 생성, 비디오 생성, web-fetch, 웹 검색, 도구 소유권에 대한 정적 번들 기능 스냅샷입니다. |
| `mediaUnderstandingProviderMetadata` | 아니요 | `Record<string, object>` | `contracts.mediaUnderstandingProviders`에 선언된 Provider id용 경량 미디어 이해 기본값입니다. |
| `channelConfigs` | 아니요 | `Record<string, object>` | 런타임이 로드되기 전에 검색 및 검증 표면에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다. |
| `skills` | 아니요 | `string[]` | Plugin 루트 기준 상대 경로인 로드할 Skill 디렉터리입니다. |
| `name` | 아니요 | `string` | 사람이 읽을 수 있는 Plugin 이름입니다. |
| `description` | 아니요 | `string` | Plugin 표면에 표시되는 짧은 요약입니다. |
| `version` | 아니요 | `string` | 정보용 Plugin 버전입니다. |
| `uiHints` | 아니요 | `Record<string, object>` | 구성 필드에 대한 UI 레이블, placeholder, 민감도 힌트입니다. |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 auth choice를 설명합니다.
OpenClaw는 Provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드 | 필수 | 타입 | 의미 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 예 | `string` | 이 choice가 속한 Provider id입니다. |
| `method` | 예 | `string` | 디스패치할 auth method id입니다. |
| `choiceId` | 예 | `string` | 온보딩 및 CLI 흐름에서 사용하는 안정적인 auth-choice id입니다. |
| `choiceLabel` | 아니요 | `string` | 사용자 표시 레이블입니다. 생략하면 OpenClaw는 `choiceId`로 폴백합니다. |
| `choiceHint` | 아니요 | `string` | 선택기에 표시할 짧은 도움말 텍스트입니다. |
| `assistantPriority` | 아니요 | `number` | 값이 낮을수록 어시스턴트 기반 대화형 선택기에서 먼저 정렬됩니다. |
| `assistantVisibility` | 아니요 | `"visible"` \| `"manual-only"` | 어시스턴트 선택기에서는 숨기되 수동 CLI 선택은 계속 허용합니다. |
| `deprecatedChoiceIds` | 아니요 | `string[]` | 사용자를 이 대체 choice로 리디렉션해야 하는 레거시 choice id입니다. |
| `groupId` | 아니요 | `string` | 관련 choice를 그룹화하기 위한 선택적 group id입니다. |
| `groupLabel` | 아니요 | `string` | 해당 그룹의 사용자 표시 레이블입니다. |
| `groupHint` | 아니요 | `string` | 그룹에 대한 짧은 도움말 텍스트입니다. |
| `optionKey` | 아니요 | `string` | 단일 플래그 auth 흐름을 위한 내부 옵션 키입니다. |
| `cliFlag` | 아니요 | `string` | `--openrouter-api-key` 같은 CLI 플래그 이름입니다. |
| `cliOption` | 아니요 | `string` | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다. |
| `cliDescription` | 아니요 | `string` | CLI 도움말에 사용되는 설명입니다. |
| `onboardingScopes` | 아니요 | `Array<"text-inference" \| "image-generation">` | 이 choice가 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다. |

## commandAliases 참조

Plugin이 사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려 할 수 있는 런타임 명령 이름을 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는 Plugin 런타임 코드를 import하지 않고도 진단을 위해 이 메타데이터를 사용합니다.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 필드 | 필수 | 타입 | 의미 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | 예 | `string` | 이 Plugin에 속한 명령 이름입니다. |
| `kind` | 아니요 | `"runtime-slash"` | 이 별칭을 루트 CLI 명령이 아니라 채팅 슬래시 명령으로 표시합니다. |
| `cliCommand` | 아니요 | `string` | 존재하는 경우 CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다. |

## activation 참조

Plugin이 어떤 제어 평면 이벤트에서 활성화/로드 계획에 포함되어야 하는지 경량으로 선언할 수 있을 때 `activation`을 사용하세요.

이 블록은 플래너 메타데이터이지 수명 주기 API가 아닙니다. 런타임 동작을 등록하지 않고, `register(...)`를 대체하지 않으며, Plugin 코드가 이미 실행되었음을 보장하지도 않습니다. 활성화 플래너는 이 필드를 사용해 기존 매니페스트 소유 메타데이터(`providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hooks`)로 폴백하기 전에 후보 Plugin을 좁힙니다.

이미 소유권을 설명하는 가장 좁은 메타데이터를 우선 사용하세요. 해당 관계를 `providers`, `channels`, `commandAliases`, setup 설명자 또는 `contracts`로 표현할 수 있다면 그것을 사용하세요. `activation`은 그 소유권 필드로 표현할 수 없는 추가 플래너 힌트에 사용하세요.

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며, `register(...)`, `setupEntry` 또는 기타 런타임/Plugin 진입점을 대체하지 않습니다. 현재 소비자는 이를 더 넓은 Plugin 로딩 전에 narrowing hint로 사용하므로, activation 메타데이터가 없으면 보통 성능 비용만 발생하며 기존 매니페스트 소유 폴백이 아직 존재하는 동안에는 정확성이 바뀌어서는 안 됩니다.
__OC_I18N_900003__
| 필드 | 필수 | 타입 | 의미 |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders` | 아니요 | `string[]` | 이 Plugin을 활성화/로드 계획에 포함해야 하는 Provider id입니다. |
| `onCommands` | 아니요 | `string[]` | 이 Plugin을 활성화/로드 계획에 포함해야 하는 명령 id입니다. |
| `onChannels` | 아니요 | `string[]` | 이 Plugin을 활성화/로드 계획에 포함해야 하는 채널 id입니다. |
| `onRoutes` | 아니요 | `string[]` | 이 Plugin을 활성화/로드 계획에 포함해야 하는 라우트 종류입니다. |
| `onCapabilities` | 아니요 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에 사용되는 넓은 기능 힌트입니다. 가능하면 더 좁은 필드를 우선하세요. |

현재 실제 소비자:

- 명령 트리거 CLI 계획은 레거시 `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 폴백합니다
- 채널 트리거 setup/channel 계획은 명시적 채널 activation 메타데이터가 없을 때 레거시 `channels[]` 소유권으로 폴백합니다
- Provider 트리거 setup/runtime 계획은 명시적 Provider activation 메타데이터가 없을 때 레거시 `providers[]` 및 최상위 `cliBackends[]` 소유권으로 폴백합니다

플래너 진단은 명시적 activation 힌트와 매니페스트 소유 폴백을 구분할 수 있습니다. 예를 들어 `activation-command-hint`는 `activation.onCommands`가 일치했음을 의미하고, `manifest-command-alias`는 플래너가 대신 `commandAliases` 소유권을 사용했음을 의미합니다. 이런 reason label은 호스트 진단 및 테스트용이며, Plugin 작성자는 계속 소유권을 가장 잘 설명하는 메타데이터를 선언해야 합니다.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 transport runner를 제공하는 경우 `qaRunners`를 사용하세요. 이 메타데이터는 가볍고 정적으로 유지하세요. 실제 CLI 등록은 여전히 `qaRunnerCliRegistrations`를 내보내는 경량 `runtime-api.ts` 표면을 통해 Plugin 런타임이 소유합니다.
__OC_I18N_900004__
| 필드 | 필수 | 타입 | 의미 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 예 | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`. |
| `description` | 아니요 | `string` | 공유 호스트가 스텁 명령을 필요로 할 때 사용하는 폴백 도움말 텍스트입니다. |

## setup 참조

설정 및 온보딩 표면이 런타임 로드 전에 Plugin 소유 경량 메타데이터를 필요로 할 때 `setup`을 사용하세요.
__OC_I18N_900005__
최상위 `cliBackends`는 여전히 유효하며 CLI Inference 백엔드를 계속 설명합니다. `setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는 제어 평면/설정 흐름을 위한 setup 전용 설명자 표면입니다.

`setup.providers`와 `setup.cliBackends`가 존재하면, 설정 검색에서 선호되는 descriptor-first 조회 표면이 됩니다. 설명자가 후보 Plugin을 좁히는 역할만 하고, 설정에 더 풍부한 setup 시점 런타임 훅이 여전히 필요하다면 `requiresRuntime: true`를 설정하고 `setup-api`를 폴백 실행 경로로 유지하세요.

설정 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로, 정규화된 `setup.providers[].id`와 `setup.cliBackends[]` 값은 검색된 Plugin 전체에서 고유해야 합니다. 소유권이 모호하면 검색 순서로 승자를 고르지 않고 실패 시 닫힘으로 처리합니다.

### setup.providers 참조

| 필드 | 필수 | 타입 | 의미 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 예 | `string` | 설정 또는 온보딩 중 노출되는 Provider id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요 | `string[]` | 전체 런타임을 로드하지 않고도 이 Provider가 지원하는 setup/auth method id입니다. |
| `envVars` | 아니요 | `string[]` | 일반 설정/상태 표면이 Plugin 런타임 로드 전에 확인할 수 있는 env vars입니다. |

### setup 필드

| 필드 | 필수 | 타입 | 의미 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 아니요 | `object[]` | 설정 및 온보딩 중 노출되는 Provider 설정 설명자입니다. |
| `cliBackends` | 아니요 | `string[]` | descriptor-first 설정 조회에 사용되는 setup 시점 백엔드 id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요 | `string[]` | 이 Plugin의 setup 표면이 소유한 구성 마이그레이션 id입니다. |
| `requiresRuntime` | 아니요 | `boolean` | descriptor 조회 후에도 setup이 여전히 `setup-api` 실행을 필요로 하는지 여부입니다. |

## uiHints 참조

`uiHints`는 구성 필드 이름을 작은 렌더링 힌트에 매핑하는 맵입니다.
__OC_I18N_900006__
각 필드 힌트에는 다음이 포함될 수 있습니다:

| 필드 | 타입 | 의미 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 사용자 표시 필드 레이블입니다. |
| `help` | `string` | 짧은 도움말 텍스트입니다. |
| `tags` | `string[]` | 선택적 UI 태그입니다. |
| `advanced` | `boolean` | 이 필드를 고급 항목으로 표시합니다. |
| `sensitive` | `boolean` | 이 필드를 시크릿 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string` | 폼 입력용 placeholder 텍스트입니다. |

## contracts 참조

`contracts`는 OpenClaw가 Plugin 런타임을 import하지 않고도 읽을 수 있는 정적 기능 소유권 메타데이터에만 사용하세요.
__OC_I18N_900007__
각 목록은 선택 사항입니다:

| 필드 | 타입 | 의미 |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | 번들 Plugin이 팩토리를 등록할 수 있는 내장 런타임 id입니다. |
| `externalAuthProviders` | `string[]` | 이 Plugin이 소유한 외부 auth profile hook의 Provider id입니다. |
| `speechProviders` | `string[]` | 이 Plugin이 소유한 음성 Provider id입니다. |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유한 실시간 전사 Provider id입니다. |
| `realtimeVoiceProviders` | `string[]` | 이 Plugin이 소유한 실시간 음성 Provider id입니다. |
| `memoryEmbeddingProviders` | `string[]` | 이 Plugin이 소유한 메모리 임베딩 Provider id입니다. |
| `mediaUnderstandingProviders` | `string[]` | 이 Plugin이 소유한 미디어 이해 Provider id입니다. |
| `imageGenerationProviders` | `string[]` | 이 Plugin이 소유한 이미지 생성 Provider id입니다. |
| `videoGenerationProviders` | `string[]` | 이 Plugin이 소유한 비디오 생성 Provider id입니다. |
| `webFetchProviders` | `string[]` | 이 Plugin이 소유한 web-fetch Provider id입니다. |
| `webSearchProviders` | `string[]` | 이 Plugin이 소유한 웹 검색 Provider id입니다. |
| `tools` | `string[]` | 번들 계약 검사에서 이 Plugin이 소유한 에이전트 도구 이름입니다. |

`resolveExternalAuthProfiles`를 구현하는 Provider Plugin은
`contracts.externalAuthProviders`를 선언해야 합니다. 이 선언이 없는 Plugin도
더 이상 권장되지 않는 호환성 폴백을 통해 여전히 동작하지만, 그 폴백은 더 느리고
마이그레이션 기간 이후 제거될 예정입니다.

번들 메모리 임베딩 Provider는 노출하는 모든 어댑터 id에 대해
`contracts.memoryEmbeddingProviders`를 선언해야 하며, `local` 같은 내장 어댑터도 포함해야 합니다. 독립형 CLI 경로는 전체 Gateway 런타임이 Provider를 등록하기 전에 이 매니페스트 계약을 사용해 소유 Plugin만 로드합니다.

## mediaUnderstandingProviderMetadata 참조

미디어 이해 Provider가 기본 모델, 자동 인증 폴백 우선순위, 또는 런타임 로드 전에 일반 core 헬퍼가 필요로 하는 네이티브 문서 지원을 갖는 경우 `mediaUnderstandingProviderMetadata`를 사용하세요. 키는 `contracts.mediaUnderstandingProviders`에도 선언되어 있어야 합니다.
__OC_I18N_900008__
각 Provider 항목에는 다음이 포함될 수 있습니다:

| 필드 | 타입 | 의미 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 이 Provider가 노출하는 미디어 기능입니다. |
| `defaultModels` | `Record<string, string>` | 구성에서 모델을 지정하지 않았을 때 사용하는 기능별 기본 모델입니다. |
| `autoPriority` | `Record<string, number>` | 자동 자격 증명 기반 Provider 폴백에서 숫자가 낮을수록 먼저 정렬됩니다. |
| `nativeDocumentInputs` | `"pdf"[]` | Provider가 지원하는 네이티브 문서 입력입니다. |

## channelConfigs 참조

채널 Plugin이 런타임 로드 전에 경량 구성 메타데이터를 필요로 할 때 `channelConfigs`를 사용하세요.
__OC_I18N_900009__
각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드 | 타입 | 의미 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>`용 JSON Schema입니다. 선언된 각 채널 구성 항목에 필수입니다. |
| `uiHints` | `Record<string, object>` | 해당 채널 구성 섹션을 위한 선택적 UI 레이블/placeholder/민감도 힌트입니다. |
| `label` | `string` | 런타임 메타데이터가 아직 준비되지 않았을 때 picker 및 inspect 표면에 병합되는 채널 레이블입니다. |
| `description` | `string` | inspect 및 카탈로그 표면용 짧은 채널 설명입니다. |
| `preferOver` | `string[]` | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 Plugin id입니다. |

## modelSupport 참조

OpenClaw가 Plugin 런타임 로드 전에 `gpt-5.5` 또는 `claude-sonnet-4.6` 같은 축약형 모델 id에서 Provider Plugin을 추론해야 할 때 `modelSupport`를 사용하세요.
__OC_I18N_900010__
OpenClaw는 다음 우선순위를 적용합니다:

- 명시적인 `provider/model` 참조는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin과 번들 Plugin이 둘 다 일치하면 번들되지 않은 Plugin이 우선합니다
- 남은 모호성은 사용자나 구성이 Provider를 지정할 때까지 무시됩니다

필드:

| 필드 | 타입 | 의미 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 id에 대해 `startsWith`로 일치하는 접두사입니다. |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 축약형 모델 id에 대해 일치하는 정규식 소스입니다. |

레거시 최상위 기능 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 옮기세요. 일반
매니페스트 로딩은 더 이상 이러한 최상위 필드를 기능 소유권으로 취급하지 않습니다.

## Manifest와 package.json의 차이

두 파일은 서로 다른 역할을 합니다:

| 파일 | 용도 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 존재해야 하는 검색, 구성 검증, auth-choice 메타데이터, UI 힌트 |
| `package.json` | npm 메타데이터, 의존성 설치, 진입점/설치 게이팅/설정/카탈로그 메타데이터에 사용되는 `openclaw` 블록 |

어떤 메타데이터를 어디에 둬야 할지 모르겠다면 다음 규칙을 사용하세요:

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, 진입 파일, npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라
`package.json`의 `openclaw` 블록 아래에 위치합니다.

중요한 예시:

| 필드 | 의미 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 네이티브 Plugin 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다. |
| `openclaw.runtimeExtensions` | 설치된 패키지용 빌드된 JavaScript 런타임 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다. |
| `openclaw.setupEntry` | 온보딩, 지연 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중에 사용되는 경량 setup 전용 진입점입니다. Plugin 패키지 디렉터리 내부에 있어야 합니다. |
| `openclaw.runtimeSetupEntry` | 설치된 패키지용 빌드된 JavaScript setup 진입점을 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다. |
| `openclaw.channel` | 레이블, 문서 경로, 별칭, 선택 복사문 같은 경량 채널 카탈로그 메타데이터입니다. |
| `openclaw.channel.configuredState` | 전체 채널 런타임을 로드하지 않고도 "env 전용 설정이 이미 존재하는가?"에 답할 수 있는 경량 configured-state checker 메타데이터입니다. |
| `openclaw.channel.persistedAuthState` | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 것이 있는가?"에 답할 수 있는 경량 persisted-auth checker 메타데이터입니다. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 번들 Plugin 및 외부 게시 Plugin의 설치/업데이트 힌트입니다. |
| `openclaw.install.defaultChoice` | 여러 설치 소스가 있을 때 선호되는 설치 경로입니다. |
| `openclaw.install.minHostVersion` | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다. |
| `openclaw.install.expectedIntegrity` | `sha512-...` 같은 예상 npm dist integrity 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이를 기준으로 검증합니다. |
| `openclaw.install.allowInvalidConfigRecovery` | 구성이 유효하지 않을 때 좁게 제한된 번들 Plugin 재설치 복구 경로를 허용합니다. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 Plugin보다 setup 전용 채널 표면을 먼저 로드할 수 있게 합니다. |

매니페스트 메타데이터는 런타임 로드 전에 온보딩에 어떤 Provider/채널/설정 선택이 나타날지 결정합니다. `package.json#openclaw.install`은 사용자가 이러한 선택 중 하나를 고를 때 온보딩이 해당 Plugin을 어떻게 가져오거나 활성화할지 알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 및 매니페스트 레지스트리 로딩 중 강제됩니다. 유효하지 않은 값은 거부되며, 더 새롭지만 유효한 값은 오래된 호스트에서 Plugin을 건너뜁니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 있으며, 예를 들어
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`와 같습니다. 가져온
npm 아티팩트가 더 이상 고정된 릴리스와 일치하지 않을 때 update 흐름이 실패 시 닫힘으로 동작하게 하려면 `expectedIntegrity`와 함께 사용하세요. 대화형 온보딩은 bare 패키지 이름과 dist-tag를 포함한 신뢰된 레지스트리 npm spec을 제공합니다. `expectedIntegrity`가 있으면 설치/업데이트 흐름이 이를 강제하고, 없으면 레지스트리 해석 결과가 integrity pin 없이 기록됩니다.

채널 Plugin은 상태, 채널 목록 또는 SecretRef 스캔이 전체 런타임을 로드하지 않고도 구성된 계정을 식별해야 할 때 `openclaw.setupEntry`를 제공해야 합니다. setup 진입점은 채널 메타데이터와 setup-safe 구성, 상태, 시크릿 어댑터를 노출해야 하며, 네트워크 클라이언트, Gateway 리스너, 전송 런타임은 메인 확장 진입점에 두세요.

런타임 진입점 필드는 소스 진입점 필드에 대한 패키지 경계 검사를 재정의하지 않습니다. 예를 들어 `openclaw.runtimeExtensions`는 경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 좁게 제한됩니다. 임의의 깨진 구성을 설치 가능하게 만들지는 않습니다. 현재는 번들 Plugin 경로가 누락되었거나 동일한 번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정한 오래된 번들 Plugin 업그레이드 실패에서만 설치 흐름이 복구되도록 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를 `openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 아주 작은 checker 모듈을 위한 패키지 메타데이터입니다:
__OC_I18N_900011__
setup, doctor 또는 configured-state 흐름이 전체 채널 Plugin 로드 전에 저렴한 yes/no 인증 프로브를 필요로 할 때 이를 사용하세요. 대상 export는 영속 상태만 읽는 작은 함수여야 하며, 전체 채널 런타임 barrel을 통해 라우팅하지 마세요.

`openclaw.channel.configuredState`도 동일한 형태를 따르며 저렴한 env 전용 configured 체크에 사용됩니다:
__OC_I18N_900012__
채널이 env 또는 다른 작은 비런타임 입력만으로 configured-state에 답할 수 있을 때 이를 사용하세요. 체크에 전체 구성 해석 또는 실제 채널 런타임이 필요하다면, 그 로직은 Plugin `config.hasConfiguredState` hook 안에 두세요.

## 검색 우선순위(중복 Plugin id)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적으로 구성 선택된 경로)에서 Plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면, **가장 높은 우선순위** 매니페스트만 유지되고 낮은 우선순위 중복은 함께 로드되지 않고 제거됩니다.

우선순위(높음 → 낮음):

1. **Config-selected** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **Bundled** — OpenClaw와 함께 제공되는 Plugin
3. **Global install** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **Workspace** — 현재 워크스페이스 기준으로 검색된 Plugin

의미:

- 워크스페이스에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 못합니다.
- 번들 Plugin을 로컬 것으로 실제 재정의하려면 워크스페이스 검색에 의존하지 말고 `plugins.entries.<id>`를 통해 고정해서 우선순위로 이기게 하세요.
- 제거된 중복은 로그에 기록되므로 Doctor와 시작 진단이 버려진 복사본을 가리킬 수 있습니다.

## JSON Schema 요구 사항

- **모든 Plugin은 JSON Schema를 반드시 제공해야 하며**, 구성을 전혀 받지 않더라도 예외가 없습니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 채널 id가 Plugin 매니페스트에 선언되어 있는 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 **검색 가능한** Plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- Plugin이 설치되어 있어도 매니페스트나 스키마가 깨졌거나 없으면, 검증은 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**되어 있으면, 구성은 유지되고 Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/gateway/configuration)를 참고하세요.

## 참고

- 매니페스트는 로컬 파일시스템 로드를 포함한 **네이티브 OpenClaw Plugin에 필수**입니다. 런타임은 여전히 Plugin 모듈을 별도로 로드하며, 매니페스트는 검색 + 검증만을 위한 것입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로 주석, trailing comma, 따옴표 없는 키가 허용됩니다. 단 최종 값은 여전히 객체여야 합니다.
- 문서화된 매니페스트 필드만 매니페스트 로더가 읽습니다. 사용자 지정 최상위 키는 피하세요.
- `channels`, `providers`, `cliBackends`, `skills`는 Plugin이 필요로 하지 않으면 모두 생략할 수 있습니다.
- `providerDiscoveryEntry`는 가벼운 상태를 유지해야 하며 광범위한 런타임 코드를 import해서는 안 됩니다. 정적 Provider 카탈로그 메타데이터나 좁은 검색 설명자에 사용하고, 요청 시점 실행에는 사용하지 마세요.
- 배타적 Plugin kind는 `plugins.slots.*`를 통해 선택됩니다: `kind: "memory"`는 `plugins.slots.memory`, `kind: "context-engine"`는 `plugins.slots.contextEngine`(기본값 `legacy`)을 통해 선택됩니다.
- env-var 메타데이터(`providerAuthEnvVars`, `channelEnvVars`)는 선언적일 뿐입니다. 상태, 감사, Cron 전달 검증, 기타 읽기 전용 표면은 env var를 구성된 것으로 취급하기 전에 여전히 Plugin 신뢰 및 유효 활성화 정책을 적용합니다.
- Provider 코드가 필요한 런타임 마법사 메타데이터는 [Provider 런타임 훅](/plugins/architecture-internals#provider-runtime-hooks)을 참고하세요.
- Plugin이 네이티브 모듈에 의존한다면, 빌드 단계와 패키지 관리자 허용 목록 요구 사항(예: pnpm `allow-build-scripts` + `pnpm rebuild <package>`)을 문서화하세요.

## 관련 문서

<CardGroup cols={3}>
  <Card title="Plugin 만들기" href="/ko/plugins/building-plugins" icon="rocket">
    Plugin 시작하기.
  </Card>
  <Card title="Plugin 아키텍처" href="/ko/plugins/architecture" icon="diagram-project">
    내부 아키텍처와 기능 모델.
  </Card>
  <Card title="SDK 개요" href="/ko/plugins/sdk-overview" icon="book">
    Plugin SDK 참조 및 하위 경로 import.
  </Card>
</CardGroup>
