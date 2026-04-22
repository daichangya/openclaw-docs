---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - Plugin 구성 스키마를 제공하거나 Plugin 검증 오류를 디버깅해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구 사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-22T04:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin 매니페스트 (`openclaw.plugin.json`)

이 페이지는 **기본 OpenClaw Plugin 매니페스트**만 다룹니다.

호환되는 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참조하세요.

호환되는 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는
`openclaw.plugin.json` 스키마에 대해 검증되지는 않습니다.

호환 번들의 경우, OpenClaw는 현재 번들 메타데이터와 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 그리고 레이아웃이 OpenClaw 런타임 기대와 일치할 때
지원되는 hook pack을 읽습니다.

모든 기본 OpenClaw Plugin은 **반드시** **Plugin 루트**에 `openclaw.plugin.json`
파일을 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 Plugin 코드를 **실행하지 않고도**
구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면 Plugin 오류로 처리되며
구성 검증이 차단됩니다.

전체 Plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
기본 capability 모델과 현재 외부 호환성 가이드는
[Capability model](/ko/plugins/architecture#public-capability-model)을 참조하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 Plugin 코드를 로드하기 전에 읽는
메타데이터입니다.

다음 용도로 사용하세요:

- Plugin ID
- 구성 검증
- Plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- 런타임이 로드되기 전에 제어 플레인 표면이 검사할 수 있는 저비용 활성화 힌트
- 런타임이 로드되기 전에 설정/온보딩 표면이 검사할 수 있는 저비용 설정 설명자
- Plugin 런타임이 로드되기 전에 확인되어야 하는 별칭 및 자동 활성화 메타데이터
- 런타임이 로드되기 전에 Plugin을 자동 활성화해야 하는 축약형 모델 패밀리 소유 메타데이터
- 번들 호환 wiring 및 계약 커버리지에 사용되는 정적 capability 소유 스냅샷
- 공유 `openclaw qa` 호스트가 Plugin 런타임을 로드하기 전에 검사할 수 있는 저비용 QA 러너 메타데이터
- 런타임을 로드하지 않고 카탈로그 및 검증 표면에 병합되어야 하는 채널별 구성 메타데이터
- 구성 UI 힌트

다음 용도로는 사용하지 마세요:

- 런타임 동작 등록
- 코드 entrypoint 선언
- npm 설치 메타데이터

이들은 Plugin 코드와 `package.json`에 속합니다.

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
  "description": "OpenRouter provider Plugin",
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
      "choiceLabel": "OpenRouter API 키",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API 키",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API 키",
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

| 필드                               | 필수 여부 | 타입                             | 의미                                                                                                                                                                                                         |
| ---------------------------------- | --------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                               | 예        | `string`                         | 정식 Plugin ID입니다. 이 ID는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                         |
| `configSchema`                     | 예        | `object`                         | 이 Plugin 구성용 인라인 JSON 스키마입니다.                                                                                                                                                                   |
| `enabledByDefault`                 | 아니요    | `true`                           | 번들 Plugin이 기본적으로 활성화됨을 표시합니다. 생략하거나 `true`가 아닌 값을 설정하면 Plugin은 기본적으로 비활성화된 상태로 유지됩니다.                                                                      |
| `legacyPluginIds`                  | 아니요    | `string[]`                       | 이 정식 Plugin ID로 정규화되는 레거시 ID입니다.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`| 아니요    | `string[]`                       | 인증, 구성 또는 모델 참조에서 이 provider ID가 언급될 때 이 Plugin을 자동 활성화해야 하는 경우를 지정합니다.                                                                                                 |
| `kind`                             | 아니요    | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 Plugin 종류를 선언합니다.                                                                                                                                              |
| `channels`                         | 아니요    | `string[]`                       | 이 Plugin이 소유한 채널 ID입니다. 탐지 및 구성 검증에 사용됩니다.                                                                                                                                             |
| `providers`                        | 아니요    | `string[]`                       | 이 Plugin이 소유한 provider ID입니다.                                                                                                                                                                         |
| `modelSupport`                     | 아니요    | `object`                         | 런타임 전에 Plugin을 자동 로드하는 데 사용되는 매니페스트 소유 축약형 모델 패밀리 메타데이터입니다.                                                                                                           |
| `providerEndpoints`                | 아니요    | `object[]`                       | 코어가 provider 런타임이 로드되기 전에 분류해야 하는 provider 경로용 매니페스트 소유 endpoint host/baseUrl 메타데이터입니다.                                                                                   |
| `cliBackends`                      | 아니요    | `string[]`                       | 이 Plugin이 소유한 CLI 추론 백엔드 ID입니다. 명시적 구성 참조에서 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                      |
| `syntheticAuthRefs`                | 아니요    | `string[]`                       | 런타임이 로드되기 전에 cold 모델 탐색 중 Plugin 소유 synthetic 인증 hook를 프로브해야 하는 provider 또는 CLI backend 참조입니다.                                                                               |
| `nonSecretAuthMarkers`             | 아니요    | `string[]`                       | 비밀이 아닌 로컬, OAuth 또는 주변 자격 증명 상태를 나타내는 번들 Plugin 소유 placeholder API 키 값입니다.                                                                                                     |
| `commandAliases`                   | 아니요    | `object[]`                       | 런타임이 로드되기 전에 Plugin 인식 구성 및 CLI 진단을 생성해야 하는, 이 Plugin이 소유한 명령 이름입니다.                                                                                                      |
| `providerAuthEnvVars`              | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 provider 인증 env 메타데이터입니다.                                                                                                            |
| `providerAuthAliases`              | 아니요    | `Record<string, string>`         | 인증 조회에 다른 provider ID를 재사용해야 하는 provider ID입니다. 예: 기본 provider API 키와 인증 프로필을 공유하는 coding provider.                                                                           |
| `channelEnvVars`                   | 아니요    | `Record<string, string[]>`       | OpenClaw가 Plugin 코드를 로드하지 않고도 검사할 수 있는 저비용 채널 env 메타데이터입니다. env 기반 채널 설정이나 일반적인 시작/구성 helper가 확인해야 하는 인증 표면에는 이것을 사용하세요.                    |
| `providerAuthChoices`              | 아니요    | `object[]`                       | 온보딩 선택기, 선호 provider 확인, 단순 CLI 플래그 wiring을 위한 저비용 인증 선택 메타데이터입니다.                                                                                                           |
| `activation`                       | 아니요    | `object`                         | provider, 명령, 채널, 경로, capability 트리거 로드를 위한 저비용 활성화 힌트입니다. 메타데이터 전용이며, 실제 동작은 여전히 Plugin 런타임이 소유합니다.                                                       |
| `setup`                            | 아니요    | `object`                         | 탐색 및 설정 표면이 Plugin 런타임을 로드하지 않고도 검사할 수 있는 저비용 설정/온보딩 설명자입니다.                                                                                                           |
| `qaRunners`                        | 아니요    | `object[]`                       | 공유 `openclaw qa` 호스트가 Plugin 런타임이 로드되기 전에 사용하는 저비용 QA 러너 설명자입니다.                                                                                                                |
| `contracts`                        | 아니요    | `object`                         | 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 음악 생성, 비디오 생성, 웹 가져오기, 웹 검색, 도구 소유권을 위한 정적 번들 capability 스냅샷입니다.                                                |
| `channelConfigs`                   | 아니요    | `Record<string, object>`         | 런타임이 로드되기 전에 탐색 및 검증 표면에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다.                                                                                                                |
| `skills`                           | 아니요    | `string[]`                       | Plugin 루트를 기준으로 한, 로드할 skill 디렉터리입니다.                                                                                                                                                       |
| `name`                             | 아니요    | `string`                         | 사람이 읽을 수 있는 Plugin 이름입니다.                                                                                                                                                                        |
| `description`                      | 아니요    | `string`                         | Plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                       |
| `version`                          | 아니요    | `string`                         | 정보 제공용 Plugin 버전입니다.                                                                                                                                                                                |
| `uiHints`                          | 아니요    | `Record<string, object>`         | 구성 필드용 UI 라벨, placeholder, 민감도 힌트입니다.                                                                                                                                                          |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드                 | 필수 여부 | 타입                                            | 의미                                                                                                      |
| -------------------- | --------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`           | 예        | `string`                                        | 이 선택이 속한 provider ID입니다.                                                                         |
| `method`             | 예        | `string`                                        | 디스패치할 인증 메서드 ID입니다.                                                                          |
| `choiceId`           | 예        | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 인증 선택 ID입니다.                                              |
| `choiceLabel`        | 아니요    | `string`                                        | 사용자에게 표시되는 라벨입니다. 생략하면 OpenClaw는 `choiceId`로 폴백합니다.                               |
| `choiceHint`         | 아니요    | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                                        |
| `assistantPriority`  | 아니요    | `number`                                        | assistant 기반 인터랙티브 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                       |
| `assistantVisibility`| 아니요    | `"visible"` \| `"manual-only"`                  | assistant 선택기에서는 이 선택을 숨기되, 수동 CLI 선택은 계속 허용합니다.                                  |
| `deprecatedChoiceIds`| 아니요    | `string[]`                                      | 사용자를 이 대체 선택으로 리디렉션해야 하는 레거시 선택 ID입니다.                                          |
| `groupId`            | 아니요    | `string`                                        | 관련 선택을 그룹화하기 위한 선택적 그룹 ID입니다.                                                          |
| `groupLabel`         | 아니요    | `string`                                        | 해당 그룹의 사용자 대상 라벨입니다.                                                                       |
| `groupHint`          | 아니요    | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                                          |
| `optionKey`          | 아니요    | `string`                                        | 단일 플래그 기반의 단순 인증 흐름용 내부 옵션 키입니다.                                                    |
| `cliFlag`            | 아니요    | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                         |
| `cliOption`          | 아니요    | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                                |
| `cliDescription`     | 아니요    | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                         |
| `onboardingScopes`   | 아니요    | `Array<"text-inference" \| "image-generation">` | 이 선택이 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.                 |

## commandAliases 참조

사용자가 실수로 런타임 명령 이름을 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려고 할 수 있고,
그 명령을 Plugin이 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는
Plugin 런타임 코드를 가져오지 않고도 진단에 이 메타데이터를 사용합니다.

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

| 필드         | 필수 여부 | 타입              | 의미                                                                     |
| ------------ | --------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | 예        | `string`          | 이 Plugin에 속한 명령 이름입니다.                                        |
| `kind`       | 아니요    | `"runtime-slash"` | 루트 CLI 명령이 아니라 chat 슬래시 명령으로 이 별칭을 표시합니다.        |
| `cliCommand` | 아니요    | `string`          | 존재하는 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.          |

## activation 참조

Plugin이 나중에 자신을 활성화해야 하는 제어 플레인 이벤트를 저비용으로 선언할 수 있을 때
`activation`을 사용하세요.

## qaRunners 참조

Plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 러너를 기여하는 경우
`qaRunners`를 사용하세요. 이 메타데이터는 저비용이고 정적으로 유지하세요. 실제 CLI 등록은 여전히 Plugin
런타임이 `qaRunnerCliRegistrations`를 export하는 경량
`runtime-api.ts` 표면을 통해 소유합니다.

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

| 필드          | 필수 여부 | 타입     | 의미                                                                 |
| ------------- | --------- | -------- | -------------------------------------------------------------------- |
| `commandName` | 예        | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.       |
| `description` | 아니요    | `string` | 공유 호스트에 스텁 명령이 필요할 때 사용되는 폴백 도움말 텍스트입니다. |

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry` 또는 다른 런타임/Plugin entrypoint를 대체하지도 않습니다.
현재 소비자는 더 넓은 Plugin 로드 전에 이를 좁히기 힌트로 사용하므로,
activation 메타데이터가 없으면 일반적으로 성능 비용만 발생하며,
레거시 매니페스트 소유권 폴백이 여전히 존재하는 동안에는 정확성이 바뀌면 안 됩니다.

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

| 필드             | 필수 여부 | 타입                                                 | 의미                                                              |
| ---------------- | --------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | 아니요    | `string[]`                                           | 요청될 때 이 Plugin을 활성화해야 하는 provider ID입니다.          |
| `onCommands`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 명령 ID입니다.                        |
| `onChannels`     | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 채널 ID입니다.                        |
| `onRoutes`       | 아니요    | `string[]`                                           | 이 Plugin을 활성화해야 하는 경로 종류입니다.                      |
| `onCapabilities` | 아니요    | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 플레인 활성화 계획에 사용되는 광범위한 capability 힌트입니다. |

현재 실제 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 폴백합니다
- 채널 트리거 설정/채널 계획은 명시적 채널 activation 메타데이터가 없을 때
  레거시 `channels[]` 소유권으로 폴백합니다
- provider 트리거 설정/런타임 계획은 명시적 provider
  activation 메타데이터가 없을 때 레거시
  `providers[]` 및 최상위 `cliBackends[]` 소유권으로 폴백합니다

## setup 참조

런타임이 로드되기 전에 설정 및 온보딩 표면에 저비용 Plugin 소유 메타데이터가 필요할 때
`setup`을 사용하세요.

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

최상위 `cliBackends`는 계속 유효하며 CLI 추론
백엔드를 계속 설명합니다. `setup.cliBackends`는 메타데이터 전용으로 유지되어야 하는
제어 플레인/설정 흐름용 설정 전용 설명자 표면입니다.

존재하는 경우 `setup.providers`와 `setup.cliBackends`는
설정 탐색을 위한 선호되는 설명자 우선 lookup 표면입니다. 설명자가 후보 Plugin만 좁히고
설정에 여전히 더 풍부한 설정 시점 런타임 hook가 필요하면 `requiresRuntime: true`를 설정하고
폴백 실행 경로로 `setup-api`를 유지하세요.

설정 lookup은 Plugin 소유 `setup-api` 코드를 실행할 수 있으므로,
정규화된 `setup.providers[].id`와 `setup.cliBackends[]` 값은
탐지된 Plugin 전체에서 고유해야 합니다. 소유권이 모호하면 탐지 순서에서 승자를 고르는 대신
fail-closed합니다.

### setup.providers 참조

| 필드          | 필수 여부 | 타입       | 의미                                                                 |
| ------------- | --------- | ---------- | -------------------------------------------------------------------- |
| `id`          | 예        | `string`   | 설정 또는 온보딩 중 노출되는 provider ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니요    | `string[]` | 전체 런타임을 로드하지 않고도 이 provider가 지원하는 설정/인증 메서드 ID입니다. |
| `envVars`     | 아니요    | `string[]` | 일반적인 설정/상태 표면이 Plugin 런타임이 로드되기 전에 확인할 수 있는 env 변수입니다. |

### setup 필드

| 필드               | 필수 여부 | 타입       | 의미                                                                                          |
| ------------------ | --------- | ---------- | --------------------------------------------------------------------------------------------- |
| `providers`        | 아니요    | `object[]` | 설정 및 온보딩 중 노출되는 provider 설정 설명자입니다.                                        |
| `cliBackends`      | 아니요    | `string[]` | 설명자 우선 설정 lookup에 사용되는 설정 시점 backend ID입니다. 정규화된 ID는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니요    | `string[]` | 이 Plugin의 설정 표면이 소유한 구성 마이그레이션 ID입니다.                                     |
| `requiresRuntime`  | 아니요    | `boolean`  | 설명자 lookup 후에도 설정에 `setup-api` 실행이 필요한지 여부입니다.                            |

## uiHints 참조

`uiHints`는 구성 필드 이름에서 작은 렌더링 힌트로의 맵입니다.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 키",
      "help": "OpenRouter 요청에 사용됩니다",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

각 필드 힌트에는 다음이 포함될 수 있습니다:

| 필드          | 타입       | 의미                                  |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | 사용자 대상 필드 라벨입니다.          |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.             |
| `tags`        | `string[]` | 선택적 UI 태그입니다.                 |
| `advanced`    | `boolean`  | 이 필드를 고급 항목으로 표시합니다.   |
| `sensitive`   | `boolean`  | 이 필드를 비밀 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다.   |

## contracts 참조

OpenClaw가 Plugin 런타임을 가져오지 않고도 읽을 수 있는
정적 capability 소유 메타데이터에만 `contracts`를 사용하세요.

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

각 목록은 모두 선택 사항입니다:

| 필드                            | 타입       | 의미                                                             |
| ------------------------------- | ---------- | ---------------------------------------------------------------- |
| `speechProviders`               | `string[]` | 이 Plugin이 소유한 음성 provider ID입니다.                       |
| `realtimeTranscriptionProviders`| `string[]` | 이 Plugin이 소유한 실시간 전사 provider ID입니다.                |
| `realtimeVoiceProviders`        | `string[]` | 이 Plugin이 소유한 실시간 음성 provider ID입니다.                |
| `mediaUnderstandingProviders`   | `string[]` | 이 Plugin이 소유한 미디어 이해 provider ID입니다.                |
| `imageGenerationProviders`      | `string[]` | 이 Plugin이 소유한 이미지 생성 provider ID입니다.                |
| `videoGenerationProviders`      | `string[]` | 이 Plugin이 소유한 비디오 생성 provider ID입니다.                |
| `webFetchProviders`             | `string[]` | 이 Plugin이 소유한 웹 가져오기 provider ID입니다.                |
| `webSearchProviders`            | `string[]` | 이 Plugin이 소유한 웹 검색 provider ID입니다.                    |
| `tools`                         | `string[]` | 번들 계약 검사에 사용되는, 이 Plugin이 소유한 에이전트 도구 이름입니다. |

## channelConfigs 참조

채널 Plugin이 런타임이 로드되기 전에 저비용 구성 메타데이터를 필요로 할 때
`channelConfigs`를 사용하세요.

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
      "description": "Matrix homeserver 연결",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드          | 타입                     | 의미                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON 스키마입니다. 선언된 각 채널 구성 항목에 필수입니다.            |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션용 선택적 UI 라벨/placeholder/민감도 힌트입니다.                  |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 표면에 병합되는 채널 라벨입니다. |
| `description` | `string`                 | 검사 및 카탈로그 표면용 짧은 채널 설명입니다.                                         |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 더 우선해야 하는 레거시 또는 낮은 우선순위 Plugin ID입니다.    |

## modelSupport 참조

OpenClaw가 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은
축약형 모델 ID에서 Plugin 런타임이 로드되기 전에
provider Plugin을 추론해야 하는 경우 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적 `provider/model` 참조는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들되지 않은 Plugin 하나와 번들 Plugin 하나가 모두 일치하면 번들되지 않은
  Plugin이 우선합니다
- 남은 모호성은 사용자가 또는 구성이 provider를 지정할 때까지 무시됩니다

필드:

| 필드            | 타입       | 의미                                                                          |
| --------------- | ---------- | ----------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 ID에 대해 `startsWith`로 일치시키는 접두사입니다.                 |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 축약형 모델 ID에 대해 일치시키는 정규식 소스입니다.     |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요.
일반 매니페스트 로드는 더 이상 이러한 최상위 필드를 capability
소유권으로 취급하지 않습니다.

## 매니페스트와 package.json 비교

두 파일은 서로 다른 역할을 합니다:

| 파일                   | 용도                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin 코드가 실행되기 전에 존재해야 하는 탐지, 구성 검증, 인증 선택 메타데이터, UI 힌트                                         |
| `package.json`         | npm 메타데이터, 의존성 설치, entrypoint, 설치 게이트, 설정, 카탈로그 메타데이터에 사용되는 `openclaw` 블록                     |

어떤 메타데이터를 어디에 넣어야 할지 확실하지 않다면 다음 규칙을 사용하세요:

- OpenClaw가 Plugin 코드를 로드하기 전에 알아야 하면 `openclaw.plugin.json`에 넣으세요
- 패키징, 엔트리 파일, npm 설치 동작에 관한 것이면 `package.json`에 넣으세요

### 탐지에 영향을 주는 package.json 필드

일부 사전 런타임 Plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라
`package.json`의 `openclaw` 블록 아래에 있습니다.

중요한 예시:

| 필드                                                             | 의미                                                                                                                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                            | 기본 Plugin entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                                |
| `openclaw.runtimeExtensions`                                     | 설치된 패키지용 빌드된 JavaScript 런타임 entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                   |
| `openclaw.setupEntry`                                            | 온보딩, 지연 채널 시작, 읽기 전용 채널 상태/SecretRef 탐지 중에 사용하는 경량 설정 전용 entrypoint입니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                         |
| `openclaw.runtimeSetupEntry`                                     | 설치된 패키지용 빌드된 JavaScript 설정 entrypoint를 선언합니다. Plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                     |
| `openclaw.channel`                                               | 라벨, 문서 경로, 별칭, 선택용 문구 같은 저비용 채널 카탈로그 메타데이터입니다.                                                                                                    |
| `openclaw.channel.configuredState`                               | 전체 채널 런타임을 로드하지 않고도 "환경 변수 전용 설정이 이미 존재하는가?"를 답할 수 있는 경량 configured-state 검사기 메타데이터입니다.                                       |
| `openclaw.channel.persistedAuthState`                            | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"를 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.                                                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`        | 번들 Plugin 및 외부 게시 Plugin용 설치/업데이트 힌트입니다.                                                                                                                       |
| `openclaw.install.defaultChoice`                                 | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                       |
| `openclaw.install.minHostVersion`                                | `>=2026.3.22` 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                    | 구성이 유효하지 않을 때 제한적인 번들 Plugin 재설치 복구 경로를 허용합니다.                                                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`| 시작 중 전체 채널 Plugin보다 먼저 설정 전용 채널 표면이 로드되도록 합니다.                                                                                                         |

`openclaw.install.minHostVersion`은 설치 및 매니페스트
레지스트리 로드 중에 강제됩니다. 잘못된 값은 거부되며, 더 새롭지만 유효한 값은
오래된 호스트에서 Plugin을 건너뜁니다.

채널 Plugin은 상태, 채널 목록,
또는 SecretRef 스캔이 전체 런타임을 로드하지 않고도 구성된 계정을 식별해야 하는 경우 `openclaw.setupEntry`를 제공해야 합니다.
setup entry는 채널 메타데이터와 setup-safe 구성,
상태, secrets 어댑터를 노출해야 하며, 네트워크 클라이언트, gateway 리스너,
전송 런타임은 메인 extension entrypoint에 유지하세요.

런타임 entrypoint 필드는 소스
entrypoint 필드에 대한 패키지 경계 검사를 재정의하지 않습니다. 예를 들어, `openclaw.runtimeExtensions`는
경계를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 제한적입니다. 이 설정이
임의의 깨진 구성을 설치 가능하게 만들지는 않습니다. 현재는
누락된 번들 Plugin 경로나 동일한
번들 Plugin에 대한 오래된 `channels.<id>` 항목 같은 특정한 오래된 번들 Plugin 업그레이드 실패에서만
설치 흐름이 복구되도록 허용합니다. 관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를
`openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기
모듈을 위한 패키지 메타데이터입니다:

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

설정, doctor, 또는 configured-state 흐름이 전체
채널 Plugin이 로드되기 전에 저비용 yes/no 인증 프로브를 필요로 할 때 사용하세요. 대상 export는
지속된 상태만 읽는 작은 함수여야 하며, 전체
채널 런타임 배럴을 통해 연결하지 마세요.

`openclaw.channel.configuredState`는 저비용 환경 변수 전용
configured-state 검사를 위한 동일한 형태를 따릅니다:

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

채널이 환경 변수 또는 기타 작은
비런타임 입력에서 configured-state를 답할 수 있을 때 사용하세요. 검사가 전체 구성 확인 또는 실제
채널 런타임을 필요로 한다면, 그 로직은 대신 Plugin `config.hasConfiguredState`
hook에 유지하세요.

## 탐지 우선순위(중복 Plugin ID)

OpenClaw는 여러 루트(번들, 전역 설치, 워크스페이스, 명시적 구성 선택 경로)에서 Plugin을 탐지합니다. 두 탐지 항목이 동일한 `id`를 공유하면, **가장 높은 우선순위**의 매니페스트만 유지되고 더 낮은 우선순위의 중복 항목은 나란히 로드되지 않고 제거됩니다.

우선순위, 높은 순서부터 낮은 순서까지:

1. **구성 선택됨** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **번들됨** — OpenClaw와 함께 제공되는 Plugin
3. **전역 설치** — 전역 OpenClaw Plugin 루트에 설치된 Plugin
4. **워크스페이스** — 현재 워크스페이스를 기준으로 탐지된 Plugin

의미:

- 워크스페이스에 있는 번들 Plugin의 포크 또는 오래된 복사본은 번들 빌드를 가리지 못합니다.
- 번들 Plugin을 실제로 로컬 Plugin으로 재정의하려면, 워크스페이스 탐지에 의존하지 말고 `plugins.entries.<id>`를 통해 고정하여 우선순위로 이기도록 하세요.
- 중복 제거는 로그에 기록되므로 Doctor 및 시작 진단이 제거된 복사본을 가리킬 수 있습니다.

## JSON 스키마 요구 사항

- **모든 Plugin은 JSON 스키마를 포함해야 하며**, 구성을 전혀 받지 않는 경우에도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 해당 채널 ID가
  Plugin 매니페스트에 선언된 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **탐지 가능한** Plugin ID를 참조해야 합니다. 알 수 없는 ID는 **오류**입니다.
- Plugin이 설치되어 있지만 매니페스트나 스키마가 손상되었거나 없으면,
  검증이 실패하고 Doctor가 Plugin 오류를 보고합니다.
- Plugin 구성이 존재하지만 Plugin이 **비활성화**되어 있으면, 구성은 유지되고
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- 매니페스트는 로컬 파일 시스템 로드를 포함한 **기본 OpenClaw Plugin에 필수**입니다.
- 런타임은 여전히 Plugin 모듈을 별도로 로드하며, 매니페스트는
  탐지 + 검증 전용입니다.
- 기본 매니페스트는 JSON5로 파싱되므로, 최종 값이 여전히 객체이기만 하면
  주석, 후행 쉼표, 따옴표 없는 키를 사용할 수 있습니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 여기에
  사용자 정의 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 인증 프로브, env-marker
  검증 및 env 이름을 검사하기 위해 Plugin
  런타임을 부팅해서는 안 되는 유사 provider 인증 표면을 위한 저비용 메타데이터 경로입니다.
- `providerAuthAliases`는 provider 변형이 다른 provider의 인증
  env 변수, 인증 프로필, 구성 기반 인증, API 키 온보딩 선택을
  코어에 해당 관계를 하드코딩하지 않고 재사용할 수 있게 합니다.
- `providerEndpoints`는 provider Plugin이 단순 endpoint host/baseUrl
  일치 메타데이터를 소유할 수 있게 합니다. 코어가 이미 지원하는 endpoint 클래스에만
  사용하세요. 런타임 동작은 여전히 Plugin이 소유합니다.
- `syntheticAuthRefs`는 provider 소유 synthetic
  인증 hook를 위한 저비용 메타데이터 경로이며, 런타임
  레지스트리가 존재하기 전에 cold 모델 탐색에서 보여야 합니다. 런타임 provider 또는 CLI backend가 실제로
  `resolveSyntheticAuth`를 구현하는 참조만 나열하세요.
- `nonSecretAuthMarkers`는 번들 Plugin 소유
  placeholder API 키(예: 로컬, OAuth 또는 주변 자격 증명 마커)를 위한 저비용 메타데이터 경로입니다.
  코어는 소유 provider를 하드코딩하지 않고도
  인증 표시와 비밀 감사에서 이를 비비밀로 취급합니다.
- `channelEnvVars`는 쉘 환경 변수 폴백, 설정
  프롬프트 및 env 이름을 검사하기 위해 Plugin 런타임을 부팅해서는 안 되는 유사 채널 표면을 위한 저비용 메타데이터 경로입니다.
  환경 변수 이름은 메타데이터이며, 그 자체로 활성화는 아닙니다. 상태, 감사, Cron 전달 검증 및 기타 읽기 전용
  표면은 여전히 Plugin 신뢰 및 유효 활성화 정책을 적용한 후에야
  환경 변수를 구성된 채널로 취급합니다.
- `providerAuthChoices`는 인증 선택 선택기,
  `--auth-choice` 확인, 선호 provider 매핑, 단순 온보딩
  CLI 플래그 등록을 위한 저비용 메타데이터 경로이며 provider 런타임이 로드되기 전에 사용됩니다. provider 코드가 필요한 런타임 wizard
  메타데이터는
  [Provider runtime hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.
- 배타적 Plugin 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다
    (기본값: 내장 `legacy`).
- Plugin에 필요하지 않다면 `channels`, `providers`, `cliBackends`, `skills`는
  생략할 수 있습니다.
- Plugin이 기본 모듈에 의존하는 경우 빌드 단계와
  패키지 관리자 허용 목록 요구 사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

- [Plugin 빌드하기](/ko/plugins/building-plugins) — Plugin 시작하기
- [Plugin 아키텍처](/ko/plugins/architecture) — 내부 아키텍처
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
