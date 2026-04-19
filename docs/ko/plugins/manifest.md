---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin 구성 스키마를 배포하거나 Plugin 유효성 검사 오류를 디버그해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구사항(엄격한 구성 유효성 검사)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-19T01:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2dfc00759108ddee7bfcda8c42acf7f2d47451676447ba3caf8b5950f8a1c181
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin 매니페스트(`openclaw.plugin.json`)

이 페이지는 **네이티브 OpenClaw Plugin 매니페스트**만 다룹니다.

호환 번들 레이아웃은 [Plugin 번들](/ko/plugins/bundles)을 참조하세요.

호환 번들 형식은 서로 다른 매니페스트 파일을 사용합니다.

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동으로 감지하지만, 여기에서 설명하는 `openclaw.plugin.json` 스키마를 기준으로 유효성 검사를 하지는 않습니다.

호환 번들의 경우, OpenClaw는 현재 레이아웃이 OpenClaw 런타임 기대사항과 일치하면 번들 메타데이터와 선언된 skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값, Claude 번들 LSP 기본값, 지원되는 hook pack을 읽습니다.

모든 네이티브 OpenClaw Plugin은 **plugin 루트**에 `openclaw.plugin.json` 파일을 **반드시** 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 **Plugin 코드를 실행하지 않고도** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면 Plugin 오류로 처리되며 구성 유효성 검사가 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
네이티브 기능 모델과 현재 외부 호환성 가이드는
[기능 모델](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 Plugin 코드를 로드하기 전에 읽는 메타데이터입니다.

다음 용도로 사용하세요.

- Plugin 식별 정보
- 구성 유효성 검사
- Plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- 런타임이 로드되기 전에 컨트롤 플레인 표면에서 확인할 수 있는 가벼운 활성화 힌트
- 런타임이 로드되기 전에 설정/온보딩 표면에서 확인할 수 있는 가벼운 설정 디스크립터
- Plugin 런타임이 로드되기 전에 해석되어야 하는 별칭 및 자동 활성화 메타데이터
- 런타임이 로드되기 전에 Plugin을 자동 활성화해야 하는 단축형 모델 패밀리 소유 메타데이터
- 번들된 호환 배선 및 계약 범위에 사용되는 정적 기능 소유 스냅샷
- 공유 `openclaw qa` 호스트가 Plugin 런타임이 로드되기 전에 확인할 수 있는 가벼운 QA 러너 메타데이터
- 런타임을 로드하지 않고도 카탈로그 및 유효성 검사 표면에 병합되어야 하는 채널별 구성 메타데이터
- 구성 UI 힌트

다음 용도로는 사용하지 마세요.

- 런타임 동작 등록
- 코드 엔트리포인트 선언
- npm 설치 메타데이터

이들은 Plugin 코드와 `package.json`에 속합니다.

## 최소 예제

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

## 확장 예제

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

| 필드                                | 필수 여부 | 유형                             | 의미                                                                                                                                                                                                         |
| ----------------------------------- | --------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | 예        | `string`                         | 정식 Plugin id입니다. `plugins.entries.<id>`에서 사용하는 id입니다.                                                                                                                                          |
| `configSchema`                      | 예        | `object`                         | 이 Plugin 구성에 대한 인라인 JSON 스키마입니다.                                                                                                                                                              |
| `enabledByDefault`                  | 아니요    | `true`                           | 번들된 Plugin을 기본적으로 활성화된 상태로 표시합니다. 기본적으로 비활성화된 상태로 두려면 이 필드를 생략하거나 `true`가 아닌 값을 설정하세요.                                                             |
| `legacyPluginIds`                   | 아니요    | `string[]`                       | 이 정식 Plugin id로 정규화되는 레거시 id입니다.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | 아니요    | `string[]`                       | 인증, 구성 또는 모델 참조에서 이 provider id가 언급되면 이 Plugin을 자동 활성화해야 하는 provider id입니다.                                                                                                 |
| `kind`                              | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin 종류를 선언합니다.                                                                                                                                              |
| `channels`                          | 아니요    | `string[]`                       | 이 Plugin이 소유한 채널 id입니다. 검색 및 구성 유효성 검사에 사용됩니다.                                                                                                                                     |
| `providers`                         | 아니요    | `string[]`                       | 이 Plugin이 소유한 provider id입니다.                                                                                                                                                                         |
| `modelSupport`                      | 아니요    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는 매니페스트 소유 단축형 모델 패밀리 메타데이터입니다.                                                                                                         |
| `providerEndpoints`                 | 아니요    | `object[]`                       | provider 런타임이 로드되기 전에 코어가 분류해야 하는 provider 경로에 대한 매니페스트 소유 endpoint host/baseUrl 메타데이터입니다.                                                                          |
| `cliBackends`                       | 아니요    | `string[]`                       | 이 Plugin이 소유한 CLI 추론 backend id입니다. 명시적 구성 참조로부터 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                 |
| `syntheticAuthRefs`                 | 아니요    | `string[]`                       | 런타임이 로드되기 전, 콜드 모델 검색 중에 Plugin 소유 synthetic auth hook을 프로브해야 하는 provider 또는 CLI backend 참조입니다.                                                                           |
| `nonSecretAuthMarkers`              | 아니요    | `string[]`                       | 비밀이 아닌 로컬, OAuth 또는 ambient 자격 증명 상태를 나타내는 번들된 Plugin 소유 placeholder API 키 값입니다.                                                                                              |
| `commandAliases`                    | 아니요    | `object[]`                       | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는, 이 Plugin이 소유한 명령 이름입니다.                                                                                                    |
| `providerAuthEnvVars`               | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 확인할 수 있는 가벼운 provider 인증 env 메타데이터입니다.                                                                                                          |
| `providerAuthAliases`               | 아니요    | `Record<string, string>`         | 인증 조회 시 다른 provider id를 재사용해야 하는 provider id입니다. 예를 들어, 기본 provider API 키 및 인증 프로필을 공유하는 코딩 provider가 이에 해당합니다.                                            |
| `channelEnvVars`                    | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 확인할 수 있는 가벼운 채널 env 메타데이터입니다. env 기반 채널 설정이나 일반적인 시작/구성 도우미가 확인해야 하는 인증 표면에 이것을 사용하세요.                 |
| `providerAuthChoices`               | 아니요    | `object[]`                       | 온보딩 선택기, 선호 provider 확인, 단순 CLI 플래그 연결을 위한 가벼운 인증 선택 메타데이터입니다.                                                                                                          |
| `activation`                        | 아니요    | `object`                         | provider, 명령, 채널, 경로 및 기능 트리거 로딩을 위한 가벼운 활성화 힌트입니다. 메타데이터 전용이며 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                         |
| `setup`                             | 아니요    | `object`                         | 검색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 확인할 수 있는 가벼운 설정/온보딩 디스크립터입니다.                                                                                                    |
| `qaRunners`                         | 아니요    | `object[]`                       | 공유 `openclaw qa` 호스트가 Plugin 런타임을 로드하기 전에 사용하는 가벼운 QA 러너 디스크립터입니다.                                                                                                        |
| `contracts`                         | 아니요    | `object`                         | speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, 웹 검색 및 도구 소유권에 대한 정적 번들 기능 스냅샷입니다.          |
| `channelConfigs`                    | 아니요    | `Record<string, object>`         | 런타임이 로드되기 전에 검색 및 유효성 검사 표면에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다.                                                                                                     |
| `skills`                            | 아니요    | `string[]`                       | Plugin 루트를 기준으로 한 상대 경로의 Skills 디렉터리입니다.                                                                                                                                                 |
| `name`                              | 아니요    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                       |
| `description`                       | 아니요    | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                      |
| `version`                           | 아니요    | `string`                         | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                               |
| `uiHints`                           | 아니요    | `Record<string, object>`         | 구성 필드에 대한 UI 레이블, placeholder 및 민감도 힌트입니다.                                                                                                                                                |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드                 | 필수 여부 | 유형                                            | 의미                                                                                             |
| -------------------- | --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`           | 예        | `string`                                        | 이 선택이 속한 provider id입니다.                                                                |
| `method`             | 예        | `string`                                        | 디스패치할 인증 메서드 id입니다.                                                                 |
| `choiceId`           | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 id입니다.                                     |
| `choiceLabel`        | 아니요    | `string`                                        | 사용자 대상 레이블입니다. 생략하면 OpenClaw는 `choiceId`를 대체값으로 사용합니다.               |
| `choiceHint`         | 아니요    | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                               |
| `assistantPriority`  | 아니요    | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                 |
| `assistantVisibility`| 아니요    | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 허용하면서 assistant 선택기에서는 이 선택을 숨깁니다.                           |
| `deprecatedChoiceIds`| 아니요    | `string[]`                                      | 사용자를 이 대체 선택으로 리디렉션해야 하는 레거시 선택 id입니다.                               |
| `groupId`            | 아니요    | `string`                                        | 관련 선택을 묶기 위한 선택적 그룹 id입니다.                                                      |
| `groupLabel`         | 아니요    | `string`                                        | 해당 그룹의 사용자 대상 레이블입니다.                                                            |
| `groupHint`          | 아니요    | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                                 |
| `optionKey`          | 아니요    | `string`                                        | 단일 플래그 기반의 간단한 인증 흐름용 내부 옵션 키입니다.                                        |
| `cliFlag`            | 아니요    | `string`                                        | `--openrouter-api-key`와 같은 CLI 플래그 이름입니다.                                             |
| `cliOption`          | 아니요    | `string`                                        | `--openrouter-api-key <key>`와 같은 전체 CLI 옵션 형식입니다.                                   |
| `cliDescription`     | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                |
| `onboardingScopes`   | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택이 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.      |

## commandAliases 참조

Plugin이 런타임 명령 이름을 소유하고 있고, 사용자가 이를 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려 할 수 있는 경우 `commandAliases`를 사용하세요. OpenClaw는 Plugin 런타임 코드를 import하지 않고도 진단에 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 유형              | 의미                                                                      |
| ------------ | --------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | 예        | `string`          | 이 Plugin에 속하는 명령 이름입니다.                                       |
| `kind`       | 아니요    | `"runtime-slash"` | 이 별칭이 루트 CLI 명령이 아니라 채팅 슬래시 명령임을 표시합니다.         |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우 CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.            |

## activation 참조

Plugin이 이후 어떤 컨트롤 플레인 이벤트가 자신을 활성화해야 하는지 가볍게 선언할 수 있을 때 `activation`을 사용하세요.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 러너를 제공하는 경우 `qaRunners`를 사용하세요. 이 메타데이터는 가볍고 정적으로 유지해야 합니다. 실제 CLI 등록은 여전히 `qaRunnerCliRegistrations`를 내보내는 경량 `runtime-api.ts` 표면을 통해 Plugin 런타임이 소유합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "폐기 가능한 homeserver를 대상으로 Docker 기반 Matrix 라이브 QA 레인을 실행합니다"
    }
  ]
}
```

| 필드          | 필수 여부 | 유형     | 의미                                                               |
| ------------- | --------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.     |
| `description` | 아니요    | `string` | 공유 호스트에 스텁 명령이 필요할 때 사용되는 대체 도움말 텍스트입니다. |

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며, `register(...)`, `setupEntry` 또는 기타 런타임/Plugin 엔트리포인트를 대체하지도 않습니다. 현재 소비자는 이를 더 넓은 Plugin 로딩 전에 범위를 좁히기 위한 힌트로 사용하므로, activation 메타데이터가 누락되어도 일반적으로 성능에만 영향을 주며, 레거시 매니페스트 소유권 대체 동작이 여전히 존재하는 동안에는 정확성은 바뀌지 않아야 합니다.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 필드             | 필수 여부 | 유형                                                 | 의미                                                               |
| ---------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | 아니요    | `string[]`                                           | 요청 시 이 Plugin을 활성화해야 하는 provider id입니다.             |
| `onCommands`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 명령 id입니다.                         |
| `onChannels`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 채널 id입니다.                         |
| `onRoutes`       | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 경로 종류입니다.                       |
| `onCapabilities` | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 컨트롤 플레인 활성화 계획에 사용되는 광범위한 기능 힌트입니다.     |

현재 실제 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체됩니다
- 채널 트리거 설정/채널 계획은 명시적 채널 activation 메타데이터가 없을 때 레거시 `channels[]`
  소유권으로 대체됩니다
- provider 트리거 설정/런타임 계획은 명시적 provider
  activation 메타데이터가 없을 때 레거시
  `providers[]` 및 최상위 `cliBackends[]` 소유권으로 대체됩니다

## setup 참조

설정 및 온보딩 표면이 런타임이 로드되기 전에 Plugin 소유의 가벼운 메타데이터를 필요로 하는 경우 `setup`을 사용하세요.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

최상위 `cliBackends`는 계속 유효하며 CLI 추론 backend를 계속 설명합니다. `setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는 컨트롤 플레인/설정 흐름을 위한 설정 전용 디스크립터 표면입니다.

존재하는 경우 `setup.providers`와 `setup.cliBackends`는 설정 검색을 위한 우선 디스크립터 우선 조회 표면입니다. 디스크립터가 후보 Plugin만 좁히고 설정에 여전히 더 풍부한 설정 시점 런타임 hook이 필요하다면 `requiresRuntime: true`로 설정하고 대체 실행 경로로 `setup-api`를 유지하세요.

설정 조회는 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로, 정규화된 `setup.providers[].id` 및 `setup.cliBackends[]` 값은 검색된 Plugin 전체에서 고유해야 합니다. 소유권이 모호하면 검색 순서에서 승자를 고르는 대신 실패 시 닫힌 방식으로 처리됩니다.

### setup.providers 참조

| 필드          | 필수 여부 | 유형       | 의미                                                                                     |
| ------------- | --------- | ---------- | ---------------------------------------------------------------------------------------- |
| `id`          | 예        | `string`   | 설정 또는 온보딩 중 노출되는 provider id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요    | `string[]` | 전체 런타임을 로드하지 않고도 이 provider가 지원하는 설정/인증 메서드 id입니다.         |
| `envVars`     | 아니요    | `string[]` | Plugin 런타임이 로드되기 전에 일반 설정/상태 표면이 확인할 수 있는 env var입니다.       |

### setup 필드

| 필드               | 필수 여부 | 유형       | 의미                                                                                              |
| ------------------ | --------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중 노출되는 provider 설정 디스크립터입니다.                                        |
| `cliBackends`      | 아니요    | `string[]` | 디스크립터 우선 설정 조회에 사용되는 설정 시점 backend id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 표면이 소유하는 구성 마이그레이션 id입니다.                                      |
| `requiresRuntime`  | 아니요    | `boolean`  | 디스크립터 조회 후에도 설정에 `setup-api` 실행이 여전히 필요한지 여부입니다.                     |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로 매핑되는 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다.

| 필드          | 유형       | 의미                                    |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 사용자 대상 필드 레이블입니다.          |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.               |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                   |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.        |
| `sensitive`   | `boolean`  | 필드를 비밀 또는 민감 정보로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다.     |

## contracts 참조

OpenClaw가 Plugin 런타임을 import하지 않고도 읽을 수 있는 정적 기능 소유 메타데이터에만 `contracts`를 사용하세요.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

각 목록은 선택 사항입니다.

| 필드                             | 유형       | 의미                                                            |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `speechProviders`                | `string[]` | 이 Plugin이 소유한 speech provider id입니다.                    |
| `realtimeTranscriptionProviders` | `string[]` | 이 Plugin이 소유한 realtime-transcription provider id입니다.    |
| `realtimeVoiceProviders`         | `string[]` | 이 Plugin이 소유한 realtime-voice provider id입니다.            |
| `mediaUnderstandingProviders`    | `string[]` | 이 Plugin이 소유한 media-understanding provider id입니다.       |
| `imageGenerationProviders`       | `string[]` | 이 Plugin이 소유한 image-generation provider id입니다.          |
| `videoGenerationProviders`       | `string[]` | 이 Plugin이 소유한 video-generation provider id입니다.          |
| `webFetchProviders`              | `string[]` | 이 Plugin이 소유한 web-fetch provider id입니다.                 |
| `webSearchProviders`             | `string[]` | 이 Plugin이 소유한 web-search provider id입니다.                |
| `tools`                          | `string[]` | 번들 계약 검사를 위해 이 Plugin이 소유한 에이전트 도구 이름입니다. |

## channelConfigs 참조

채널 Plugin이 런타임이 로드되기 전에 가벼운 구성 메타데이터를 필요로 하는 경우 `channelConfigs`를 사용하세요.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 채널 항목에는 다음이 포함될 수 있습니다.

| 필드          | 유형                     | 의미                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON 스키마입니다. 선언된 각 채널 구성 항목에 필수입니다.                  |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션에 대한 선택적 UI 레이블/placeholder/민감도 힌트입니다.                  |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 inspect 표면에 병합되는 채널 레이블입니다. |
| `description` | `string`                 | inspect 및 카탈로그 표면용 짧은 채널 설명입니다.                                            |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 Plugin id입니다.            |

## modelSupport 참조

OpenClaw가 Plugin 런타임이 로드되기 전에 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은 단축형 모델 id로부터 provider Plugin을 추론해야 하는 경우 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다.

- 명시적 `provider/model` 참조는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들된 Plugin 하나가 모두 일치하면 번들되지 않은
  Plugin이 우선합니다
- 남아 있는 모호성은 사용자가 provider를 지정하거나 구성에서 지정할 때까지 무시됩니다

필드:

| 필드            | 유형       | 의미                                                                                   |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 단축형 모델 id에 대해 `startsWith`로 일치시키는 접두사입니다.                         |
| `modelPatterns` | `string[]` | 프로필 접미사를 제거한 뒤 단축형 모델 id에 대해 일치시키는 정규식 소스입니다.         |

레거시 최상위 기능 키는 더 이상 권장되지 않습니다. `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하려면 `openclaw doctor --fix`를 사용하세요. 일반 매니페스트 로딩은 더 이상 이러한 최상위 필드를 기능 소유권으로 처리하지 않습니다.

## 매니페스트와 package.json 비교

두 파일은 서로 다른 역할을 합니다.

| 파일                   | 용도                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 반드시 존재해야 하는 검색, 구성 유효성 검사, 인증 선택 메타데이터, UI 힌트                         |
| `package.json`         | npm 메타데이터, 의존성 설치, 엔트리포인트, 설치 게이팅, 설정 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록              |

어떤 메타데이터를 어디에 둘지 확신이 없다면 다음 규칙을 사용하세요.

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 하면 `openclaw.plugin.json`에 넣으세요
- 패키징, 엔트리 파일 또는 npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라 `package.json`의 `openclaw` 블록에 위치합니다.

중요한 예시는 다음과 같습니다.

| 필드                                                              | 의미                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 네이티브 Plugin 엔트리포인트를 선언합니다.                                                                                               |
| `openclaw.setupEntry`                                             | 온보딩 및 지연된 채널 시작 중에 사용되는 경량 설정 전용 엔트리포인트입니다.                                                              |
| `openclaw.channel`                                                | 레이블, 문서 경로, 별칭, 선택용 문구 같은 가벼운 채널 카탈로그 메타데이터입니다.                                                        |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env 전용 설정이 이미 존재하는가?"에 답할 수 있는 가벼운 configured-state 검사기 메타데이터입니다. |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 상태가 있는가?"에 답할 수 있는 가벼운 persisted-auth 검사기 메타데이터입니다.        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 배포 Plugin을 위한 설치/업데이트 힌트입니다.                                                                                |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                             |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 유효하지 않을 때 좁은 범위의 번들 Plugin 재설치 복구 경로를 허용합니다.                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 Plugin보다 먼저 설정 전용 채널 표면을 로드할 수 있게 합니다.                                                          |

`openclaw.install.minHostVersion`은 설치 중과 매니페스트 레지스트리 로딩 중에 적용됩니다. 유효하지 않은 값은 거부되며, 더 최신이지만 유효한 값은 오래된 호스트에서 Plugin을 건너뜁니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 매우 제한적입니다. 임의의 손상된 구성을 설치 가능하게 만들지는 않습니다. 현재는 번들 Plugin 경로 누락이나 동일한 번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정한 오래된 번들 Plugin 업그레이드 실패에서 설치 흐름이 복구되도록만 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를 `openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기 모듈을 위한 패키지 메타데이터입니다.

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

설정, doctor 또는 configured-state 흐름이 전체 채널 Plugin이 로드되기 전에 가벼운 예/아니오 인증 프로브를 필요로 할 때 이것을 사용하세요. 대상 export는 persisted state만 읽는 작은 함수여야 하며, 전체 채널 런타임 배럴을 통해 연결하지 마세요.

`openclaw.channel.configuredState`는 가벼운 env 전용 configured 검사에 동일한 형태를 따릅니다.

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

채널이 env 또는 기타 작은 비런타임 입력만으로 configured-state에 답할 수 있을 때 이것을 사용하세요. 검사에 전체 구성 확인이나 실제 채널 런타임이 필요하다면, 대신 Plugin `config.hasConfiguredState` hook에 그 로직을 유지하세요.

## JSON 스키마 요구사항

- **모든 Plugin은 JSON 스키마를 반드시 포함해야 합니다**, 구성을 전혀 받지 않는 경우에도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 유효성 검사를 합니다.

## 유효성 검사 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 채널 id가
  Plugin 매니페스트에 선언되어 있는 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** Plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- Plugin이 설치되어 있지만 매니페스트나 스키마가 손상되었거나 누락된 경우
  유효성 검사가 실패하며 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**되어 있는 경우 구성은 유지되며
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- 매니페스트는 로컬 파일시스템 로드를 포함한 **네이티브 OpenClaw Plugin에 필수**입니다.
- 런타임은 여전히 Plugin 모듈을 별도로 로드합니다. 매니페스트는 검색 + 유효성 검사 전용입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로 최종 값이 여전히 객체이기만 하면 주석, 후행 쉼표, 따옴표 없는 키를 허용합니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 여기에 사용자 정의 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 인증 프로브, env-marker 유효성 검사 및 env 이름만 확인하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사 provider 인증 표면을 위한 가벼운 메타데이터 경로입니다.
- `providerAuthAliases`를 사용하면 provider 변형이 코어에 그 관계를 하드코딩하지 않고도 다른 provider의 인증 env var, 인증 프로필, 구성 기반 인증, API 키 온보딩 선택을 재사용할 수 있습니다.
- `providerEndpoints`를 사용하면 provider Plugin이 단순 endpoint host/baseUrl 일치 메타데이터를 소유할 수 있습니다. 코어가 이미 지원하는 endpoint 클래스에만 이것을 사용하세요. 실제 런타임 동작은 여전히 Plugin이 소유합니다.
- `syntheticAuthRefs`는 런타임 레지스트리가 존재하기 전에 콜드 모델 검색에서 보여야 하는 provider 소유 synthetic auth hook을 위한 가벼운 메타데이터 경로입니다. 런타임 provider 또는 CLI backend가 실제로 `resolveSyntheticAuth`를 구현하는 참조만 나열하세요.
- `nonSecretAuthMarkers`는 로컬, OAuth 또는 ambient 자격 증명 마커 같은 번들 Plugin 소유 placeholder API 키를 위한 가벼운 메타데이터 경로입니다. 코어는 소유 provider를 하드코딩하지 않고도 인증 표시 및 secret 감사에서 이를 비밀이 아닌 값으로 처리합니다.
- `channelEnvVars`는 env 이름만 확인하기 위해 Plugin 런타임을 부팅해서는 안 되는 shell-env 대체, 설정 프롬프트 및 유사 채널 표면을 위한 가벼운 메타데이터 경로입니다.
- `providerAuthChoices`는 provider 런타임이 로드되기 전에 인증 선택 선택기, `--auth-choice` 확인, 선호 provider 매핑, 단순 온보딩 CLI 플래그 등록을 위한 가벼운 메타데이터 경로입니다. provider 코드가 필요한 런타임 wizard 메타데이터는 [Provider 런타임 hook](/ko/plugins/architecture#provider-runtime-hooks)을 참조하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다
    (기본값: 내장 `legacy`).
- Plugin에 필요하지 않은 경우 `channels`, `providers`, `cliBackends`, `skills`는 생략할 수 있습니다.
- Plugin이 네이티브 모듈에 의존하는 경우 빌드 단계와 모든 패키지 관리자 허용 목록 요구사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins) — Plugin 시작하기
- [Plugin 아키텍처](/ko/plugins/architecture) — 내부 아키텍처
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
