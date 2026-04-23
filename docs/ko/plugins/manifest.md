---
read_when:
    - OpenClaw Plugin을 빌드하고 있습니다
    - plugin 구성 스키마를 제공하거나 plugin 검증 오류를 디버깅해야 합니다
summary: Plugin 매니페스트 + JSON 스키마 요구사항(엄격한 구성 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-23T06:05:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da8ce35aca4c12bf49a4c3e352fb7fc2b5768cb34157a00dabd247fe60b4f04
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin 매니페스트 (`openclaw.plugin.json`)

이 페이지는 **기본 OpenClaw plugin 매니페스트**만을 다룹니다.

호환 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참조하세요.

호환 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude 컴포넌트
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 이러한 번들 레이아웃도 자동 감지하지만, 여기서 설명하는 `openclaw.plugin.json` 스키마에 대해 검증되지는
않습니다.

호환 번들의 경우, OpenClaw는 현재 번들 메타데이터와 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 그리고 레이아웃이
OpenClaw 런타임 기대사항과 일치할 때 지원되는 hook pack을 읽습니다.

모든 기본 OpenClaw plugin은 반드시 **plugin 루트**에 `openclaw.plugin.json`
파일을 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 plugin 코드를 **실행하지 않고도**
구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면 plugin 오류로 처리되며
구성 검증이 차단됩니다.

전체 plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참조하세요.
기본 capability 모델과 현재 외부 호환성 지침은 다음을 참조하세요:
[Capability model](/ko/plugins/architecture#public-capability-model).

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 plugin 코드를 로드하기 전에 읽는
메타데이터입니다.

다음 용도로 사용하세요:

- plugin 식별
- 구성 검증
- plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- 런타임이 로드되기 전에 제어 평면 표면이 검사할 수 있는 가벼운 활성화 힌트
- 런타임이 로드되기 전에 설정/온보딩 표면이 검사할 수 있는 가벼운 설정 설명자
- plugin 런타임이 로드되기 전에 확인되어야 하는 별칭 및 자동 활성화 메타데이터
- plugin이 런타임이 로드되기 전에 자동 활성화되어야 하는 축약형 모델 계열 소유 메타데이터
- 번들 호환 wiring 및 계약 범위에 사용되는 정적 capability 소유 스냅샷
- 공유 `openclaw qa` 호스트가 plugin 런타임이 로드되기 전에 검사할 수 있는 가벼운 QA runner 메타데이터
- 런타임을 로드하지 않고도 카탈로그 및 검증 표면에 병합되어야 하는 채널별 구성 메타데이터
- 구성 UI 힌트

다음 용도로 사용하지 마세요:

- 런타임 동작 등록
- 코드 진입점 선언
- npm 설치 메타데이터

이것들은 plugin 코드와 `package.json`에 속합니다.

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

## 상세 예시

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

| 필드                                 | 필수 | 타입                             | 의미                                                                                                                                                                                                         |
| ------------------------------------ | ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | 예   | `string`                         | 정식 plugin id입니다. 이 id는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                        |
| `configSchema`                       | 예   | `object`                         | 이 plugin 구성용 인라인 JSON 스키마입니다.                                                                                                                                                                   |
| `enabledByDefault`                   | 아니오 | `true`                           | 번들 plugin이 기본적으로 활성화됨을 표시합니다. 기본적으로 비활성화된 상태로 두려면 이 필드를 생략하거나 `true`가 아닌 값을 설정하세요.                                                                     |
| `legacyPluginIds`                    | 아니오 | `string[]`                       | 이 정식 plugin id로 정규화되는 레거시 id입니다.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | 아니오 | `string[]`                       | 인증, 구성, 또는 모델 ref에서 이 provider id가 언급될 때 이 plugin을 자동 활성화해야 하는 provider id입니다.                                                                                                |
| `kind`                               | 아니오 | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용되는 배타적 plugin 종류를 선언합니다.                                                                                                                                              |
| `channels`                           | 아니오 | `string[]`                       | 이 plugin이 소유한 채널 id입니다. 검색 및 구성 검증에 사용됩니다.                                                                                                                                             |
| `providers`                          | 아니오 | `string[]`                       | 이 plugin이 소유한 provider id입니다.                                                                                                                                                                         |
| `modelSupport`                       | 아니오 | `object`                         | 런타임 전에 plugin을 자동 로드하는 데 사용되는 매니페스트 소유의 축약형 모델 계열 메타데이터입니다.                                                                                                         |
| `providerEndpoints`                  | 아니오 | `object[]`                       | provider 런타임이 로드되기 전에 코어가 분류해야 하는 provider 경로용 매니페스트 소유 endpoint host/baseUrl 메타데이터입니다.                                                                               |
| `cliBackends`                        | 아니오 | `string[]`                       | 이 plugin이 소유한 CLI 추론 백엔드 id입니다. 명시적 구성 ref로부터 시작 시 자동 활성화하는 데 사용됩니다.                                                                                                   |
| `syntheticAuthRefs`                  | 아니오 | `string[]`                       | 런타임이 로드되기 전에 콜드 모델 검색 중 plugin 소유 synthetic auth hook를 검사해야 하는 provider 또는 CLI backend ref입니다.                                                                                |
| `nonSecretAuthMarkers`               | 아니오 | `string[]`                       | 비시크릿 로컬, OAuth, 또는 ambient 자격 증명 상태를 나타내는 번들 plugin 소유 placeholder API 키 값입니다.                                                                                                 |
| `commandAliases`                     | 아니오 | `object[]`                       | 런타임이 로드되기 전에 plugin 인식 구성 및 CLI 진단을 생성해야 하는 이 plugin 소유 명령 이름입니다.                                                                                                         |
| `providerAuthEnvVars`                | 아니오 | `Record<string, string[]>`       | OpenClaw가 plugin 코드를 로드하지 않고도 검사할 수 있는 가벼운 provider 인증 env 메타데이터입니다.                                                                                                          |
| `providerAuthAliases`                | 아니오 | `Record<string, string>`         | 예를 들어 기본 provider API 키 및 인증 프로필을 공유하는 coding provider처럼, 인증 조회에 다른 provider id를 재사용해야 하는 provider id입니다.                                                            |
| `channelEnvVars`                     | 아니오 | `Record<string, string[]>`       | OpenClaw가 plugin 코드를 로드하지 않고도 검사할 수 있는 가벼운 채널 env 메타데이터입니다. env 기반 채널 설정 또는 일반적인 시작/구성 도우미가 확인해야 하는 인증 표면에는 이것을 사용하세요.               |
| `providerAuthChoices`                | 아니오 | `object[]`                       | 온보딩 선택기, 선호 provider 확인, 단순 CLI 플래그 wiring에 사용되는 가벼운 인증 선택 메타데이터입니다.                                                                                                    |
| `activation`                         | 아니오 | `object`                         | provider, 명령, 채널, 경로, capability 트리거 로딩을 위한 가벼운 활성화 힌트입니다. 메타데이터 전용이며, 실제 동작은 여전히 plugin 런타임이 담당합니다.                                                   |
| `setup`                              | 아니오 | `object`                         | 검색 및 설정 표면이 plugin 런타임을 로드하지 않고도 검사할 수 있는 가벼운 설정/온보딩 설명자입니다.                                                                                                         |
| `qaRunners`                          | 아니오 | `object[]`                       | plugin 런타임이 로드되기 전에 공유 `openclaw qa` 호스트가 사용하는 가벼운 QA runner 설명자입니다.                                                                                                          |
| `contracts`                          | 아니오 | `object`                         | speech, 실시간 transcription, 실시간 voice, media-understanding, image-generation, music-generation, video-generation, 웹 가져오기, 웹 검색, 도구 소유권을 위한 정적 번들 capability 스냅샷입니다.          |
| `mediaUnderstandingProviderMetadata` | 아니오 | `Record<string, object>`         | `contracts.mediaUnderstandingProviders`에 선언된 provider id용 가벼운 media-understanding 기본값입니다.                                                                                                     |
| `channelConfigs`                     | 아니오 | `Record<string, object>`         | 런타임이 로드되기 전에 검색 및 검증 표면에 병합되는 매니페스트 소유 채널 구성 메타데이터입니다.                                                                                                             |
| `skills`                             | 아니오 | `string[]`                       | plugin 루트를 기준으로 하는 로드할 Skills 디렉터리입니다.                                                                                                                                                    |
| `name`                               | 아니오 | `string`                         | 사람이 읽을 수 있는 plugin 이름입니다.                                                                                                                                                                        |
| `description`                        | 아니오 | `string`                         | plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                       |
| `version`                            | 아니오 | `string`                         | 정보 제공용 plugin 버전입니다.                                                                                                                                                                                |
| `uiHints`                            | 아니오 | `Record<string, object>`         | 구성 필드를 위한 UI 라벨, placeholder, 민감도 힌트입니다.                                                                                                                                                     |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| 필드                 | 필수 | 타입                                            | 의미                                                                                             |
| --------------------- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`            | 예   | `string`                                        | 이 선택이 속한 provider id입니다.                                                                |
| `method`              | 예   | `string`                                        | 디스패치할 인증 method id입니다.                                                                 |
| `choiceId`            | 예   | `string`                                        | 온보딩 및 CLI 흐름에서 사용하는 안정적인 auth-choice id입니다.                                  |
| `choiceLabel`         | 아니오 | `string`                                        | 사용자 대상 라벨입니다. 생략하면 OpenClaw는 `choiceId`로 대체합니다.                            |
| `choiceHint`          | 아니오 | `string`                                        | 선택기용 짧은 도움말 텍스트입니다.                                                               |
| `assistantPriority`   | 아니오 | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 더 앞에 정렬됩니다.                              |
| `assistantVisibility` | 아니오 | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 허용하면서 assistant 선택기에서는 이 선택을 숨깁니다.                           |
| `deprecatedChoiceIds` | 아니오 | `string[]`                                      | 사용자를 이 대체 선택으로 리디렉션해야 하는 레거시 choice id입니다.                              |
| `groupId`             | 아니오 | `string`                                        | 관련 선택을 그룹화하기 위한 선택적 그룹 id입니다.                                               |
| `groupLabel`          | 아니오 | `string`                                        | 해당 그룹의 사용자 대상 라벨입니다.                                                              |
| `groupHint`           | 아니오 | `string`                                        | 그룹용 짧은 도움말 텍스트입니다.                                                                 |
| `optionKey`           | 아니오 | `string`                                        | 단일 플래그 기반의 단순 인증 흐름용 내부 옵션 키입니다.                                         |
| `cliFlag`             | 아니오 | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                               |
| `cliOption`           | 아니오 | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                      |
| `cliDescription`      | 아니오 | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                |
| `onboardingScopes`    | 아니오 | `Array<"text-inference" \| "image-generation">` | 이 선택이 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.      |

## commandAliases 참조

사용자가 실수로 `plugins.allow`에 넣거나 루트 CLI 명령으로 실행하려고 할 수 있는 런타임 명령 이름을 plugin이 소유하는 경우 `commandAliases`를 사용하세요. OpenClaw는
plugin 런타임 코드를 import하지 않고 이 메타데이터를 진단에 사용합니다.

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

| 필드         | 필수 | 타입              | 의미                                                                  |
| ------------ | ---- | ----------------- | --------------------------------------------------------------------- |
| `name`       | 예   | `string`          | 이 plugin에 속한 명령 이름입니다.                                     |
| `kind`       | 아니오 | `"runtime-slash"` | 이 별칭이 루트 CLI 명령이 아니라 채팅 슬래시 명령임을 표시합니다.     |
| `cliCommand` | 아니오 | `string`          | 존재하는 경우, CLI 작업에 대해 제안할 관련 루트 CLI 명령입니다.       |

## activation 참조

plugin이 나중에 어떤 제어 평면 이벤트가 자신을 활성화해야 하는지를 가볍게 선언할 수 있는 경우 `activation`을 사용하세요.

## qaRunners 참조

plugin이 공유 `openclaw qa` 루트 아래에 하나 이상의 전송 runner를 제공하는 경우 `qaRunners`를 사용하세요. 이 메타데이터는 가볍고 정적으로 유지하세요. 실제 CLI 등록은 여전히 plugin
런타임이 `qaRunnerCliRegistrations`를 내보내는 경량
`runtime-api.ts` 표면을 통해 담당합니다.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 필드          | 필수 | 타입     | 의미                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 예   | `string` | `openclaw qa` 아래에 마운트되는 하위 명령입니다. 예: `matrix`.     |
| `description` | 아니오 | `string` | 공유 호스트가 스텁 명령을 필요로 할 때 사용하는 대체 도움말 텍스트입니다. |

이 블록은 메타데이터 전용입니다. 런타임 동작을 등록하지 않으며,
`register(...)`, `setupEntry`, 기타 런타임/plugin 진입점을 대체하지도 않습니다.
현재 소비자는 이를 더 넓은 plugin 로딩 전에 범위를 좁히는 힌트로 사용하므로,
activation 메타데이터가 없으면 일반적으로 성능 비용만 발생하고, 레거시 매니페스트 소유 대체 수단이 여전히 존재하는 동안에는 정확성이 바뀌지 않아야 합니다.

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

| 필드             | 필수 | 타입                                                 | 의미                                                          |
| ---------------- | ---- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `onProviders`    | 아니오 | `string[]`                                           | 요청될 때 이 plugin을 활성화해야 하는 provider id입니다.      |
| `onCommands`     | 아니오 | `string[]`                                           | 이 plugin을 활성화해야 하는 명령 id입니다.                    |
| `onChannels`     | 아니오 | `string[]`                                           | 이 plugin을 활성화해야 하는 채널 id입니다.                    |
| `onRoutes`       | 아니오 | `string[]`                                           | 이 plugin을 활성화해야 하는 경로 종류입니다.                  |
| `onCapabilities` | 아니오 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 제어 평면 활성화 계획에 사용되는 광범위한 capability 힌트입니다. |

현재 실사용 소비자:

- 명령 트리거 CLI 계획은 레거시
  `commandAliases[].cliCommand` 또는 `commandAliases[].name`으로 대체됩니다
- 채널 트리거 설정/채널 계획은 명시적 채널 activation 메타데이터가 없을 때 레거시 `channels[]`
  소유권으로 대체됩니다
- provider 트리거 설정/런타임 계획은 명시적 provider
  activation 메타데이터가 없을 때 레거시
  `providers[]` 및 최상위 `cliBackends[]` 소유권으로 대체됩니다

## setup 참조

설정 및 온보딩 표면이 런타임이 로드되기 전에 plugin 소유 메타데이터를 가볍게 필요로 할 때 `setup`을 사용하세요.

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
백엔드를 계속 설명합니다. `setup.cliBackends`는
메타데이터 전용으로 유지되어야 하는 제어 평면/설정 흐름용 setup 전용 설명자 표면입니다.

`setup.providers` 및 `setup.cliBackends`가 있으면, 설정 검색에는 이들이 우선되는
설명자 우선 조회 표면입니다. 설명자가 후보 plugin의 범위만 좁히고 설정에 여전히 더 풍부한 설정 시점 런타임
hook가 필요한 경우, `requiresRuntime: true`를 설정하고
`setup-api`를 대체 실행 경로로 유지하세요.

설정 조회는 plugin 소유 `setup-api` 코드를 실행할 수 있으므로, 정규화된
`setup.providers[].id` 및 `setup.cliBackends[]` 값은 검색된 plugin 전체에서 고유해야 합니다. 소유권이 모호하면 검색 순서에서 승자를 고르는 대신 닫힌 상태로 실패합니다.

### setup.providers 참조

| 필드          | 필수 | 타입       | 의미                                                                                |
| ------------- | ---- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | 예   | `string`   | 설정 또는 온보딩 중 노출되는 provider id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `authMethods` | 아니오 | `string[]` | 전체 런타임을 로드하지 않고 이 provider가 지원하는 setup/auth method id입니다.     |
| `envVars`     | 아니오 | `string[]` | plugin 런타임이 로드되기 전에 일반 설정/상태 표면이 확인할 수 있는 env var입니다.  |

### setup 필드

| 필드               | 필수 | 타입       | 의미                                                                                              |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 아니오 | `object[]` | 설정 및 온보딩 중 노출되는 provider 설정 설명자입니다.                                            |
| `cliBackends`      | 아니오 | `string[]` | 설명자 우선 setup 조회에 사용되는 설정 시점 backend id입니다. 정규화된 id는 전역적으로 고유하게 유지하세요. |
| `configMigrations` | 아니오 | `string[]` | 이 plugin의 setup 표면이 소유한 구성 마이그레이션 id입니다.                                       |
| `requiresRuntime`  | 아니오 | `boolean`  | 설명자 조회 후에도 setup에 여전히 `setup-api` 실행이 필요한지 여부입니다.                         |

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

각 필드 힌트에는 다음이 포함될 수 있습니다:

| 필드          | 타입       | 의미                                |
| ------------- | ---------- | ----------------------------------- |
| `label`       | `string`   | 사용자 대상 필드 라벨입니다.        |
| `help`        | `string`   | 짧은 도움말 텍스트입니다.           |
| `tags`        | `string[]` | 선택적 UI 태그입니다.               |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.    |
| `sensitive`   | `boolean`  | 필드를 시크릿 또는 민감한 값으로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트입니다. |

## contracts 참조

`contracts`는 OpenClaw가 plugin 런타임을 import하지 않고도
읽을 수 있는 정적 capability 소유 메타데이터에만 사용하세요.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

각 목록은 선택 사항입니다:

| 필드                             | 타입       | 의미                                                                |
| -------------------------------- | ---------- | ------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 번들 plugin이 팩토리를 등록할 수 있는 임베디드 런타임 id입니다.     |
| `speechProviders`                | `string[]` | 이 plugin이 소유한 speech provider id입니다.                        |
| `realtimeTranscriptionProviders` | `string[]` | 이 plugin이 소유한 실시간 transcription provider id입니다.          |
| `realtimeVoiceProviders`         | `string[]` | 이 plugin이 소유한 실시간 voice provider id입니다.                  |
| `mediaUnderstandingProviders`    | `string[]` | 이 plugin이 소유한 media-understanding provider id입니다.           |
| `imageGenerationProviders`       | `string[]` | 이 plugin이 소유한 image-generation provider id입니다.              |
| `videoGenerationProviders`       | `string[]` | 이 plugin이 소유한 video-generation provider id입니다.              |
| `webFetchProviders`              | `string[]` | 이 plugin이 소유한 web-fetch provider id입니다.                     |
| `webSearchProviders`             | `string[]` | 이 plugin이 소유한 web-search provider id입니다.                    |
| `tools`                          | `string[]` | 번들 계약 검사에 사용하는 이 plugin 소유 agent 도구 이름입니다.     |

## mediaUnderstandingProviderMetadata 참조

media-understanding provider에 기본 모델, 자동 인증 대체 우선순위, 또는 런타임이 로드되기 전에 일반 코어 도우미가 필요로 하는 기본 문서 지원이 있는 경우 `mediaUnderstandingProviderMetadata`를 사용하세요. 키는 반드시
`contracts.mediaUnderstandingProviders`에도 선언되어 있어야 합니다.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

각 provider 항목에는 다음이 포함될 수 있습니다:

| 필드                   | 타입                                | 의미                                                                    |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 이 provider가 노출하는 미디어 capability입니다.                         |
| `defaultModels`        | `Record<string, string>`            | 구성에서 모델을 지정하지 않았을 때 사용하는 capability별 기본 모델입니다. |
| `autoPriority`         | `Record<string, number>`            | 자동 자격 증명 기반 provider 대체에서 숫자가 낮을수록 먼저 정렬됩니다.   |
| `nativeDocumentInputs` | `"pdf"[]`                           | 이 provider가 지원하는 기본 문서 입력입니다.                            |

## channelConfigs 참조

채널 plugin이 런타임이 로드되기 전에 가벼운 구성 메타데이터가 필요한 경우 `channelConfigs`를 사용하세요.

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

각 채널 항목에는 다음이 포함될 수 있습니다:

| 필드          | 타입                     | 의미                                                                                   |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON 스키마입니다. 선언된 각 채널 구성 항목에 필수입니다.           |
| `uiHints`     | `Record<string, object>` | 해당 채널 구성 섹션에 대한 선택적 UI 라벨/placeholder/민감도 힌트입니다.              |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기와 점검 표면에 병합되는 채널 라벨입니다. |
| `description` | `string`                 | 점검 및 카탈로그 표면용 짧은 채널 설명입니다.                                          |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 plugin id입니다.      |

## modelSupport 참조

OpenClaw가 plugin 런타임이 로드되기 전에 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은 축약형 모델 id로부터 provider plugin을 추론해야 하는 경우 `modelSupport`를 사용하세요.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw는 다음 우선순위를 적용합니다:

- 명시적 `provider/model` ref는 소유 `providers` 매니페스트 메타데이터를 사용합니다
- `modelPatterns`가 `modelPrefixes`보다 우선합니다
- 번들이 아닌 plugin 하나와 번들 plugin 하나가 모두 일치하면 번들이 아닌
  plugin이 우선합니다
- 남은 모호성은 사용자 또는 구성이 provider를 지정할 때까지 무시됩니다

필드:

| 필드            | 타입       | 의미                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 id에 대해 `startsWith`로 매칭되는 접두사입니다.                     |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 축약형 모델 id에 대해 매칭되는 정규식 소스입니다.         |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로 이동하세요. 일반
매니페스트 로딩은 더 이상 이러한 최상위 필드를 capability
소유권으로 취급하지 않습니다.

## 매니페스트와 package.json

두 파일은 서로 다른 역할을 합니다:

| 파일                   | 용도                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | plugin 코드가 실행되기 전에 반드시 존재해야 하는 검색, 구성 검증, auth-choice 메타데이터, UI 힌트                           |
| `package.json`         | npm 메타데이터, 의존성 설치, 그리고 진입점, 설치 게이팅, 설정, 또는 카탈로그 메타데이터에 사용되는 `openclaw` 블록         |

어떤 메타데이터를 어디에 두어야 할지 확실하지 않다면 다음 규칙을 사용하세요:

- OpenClaw가 plugin 코드를 로드하기 전에 반드시 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, 진입 파일, 또는 npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 런타임 이전 plugin 메타데이터는 의도적으로 `openclaw.plugin.json` 대신
`package.json`의 `openclaw` 블록 아래에 있습니다.

중요한 예시:

| 필드                                                              | 의미                                                                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 기본 plugin 진입점을 선언합니다. plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                                                    |
| `openclaw.runtimeExtensions`                                      | 설치된 패키지용 빌드된 JavaScript 런타임 진입점을 선언합니다. plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                      |
| `openclaw.setupEntry`                                             | 온보딩, 지연 채널 시작, 읽기 전용 채널 상태/SecretRef 검색 중에 사용되는 경량 setup 전용 진입점입니다. plugin 패키지 디렉터리 내부에 있어야 합니다.                            |
| `openclaw.runtimeSetupEntry`                                      | 설치된 패키지용 빌드된 JavaScript setup 진입점을 선언합니다. plugin 패키지 디렉터리 내부에 있어야 합니다.                                                                       |
| `openclaw.channel`                                                | 라벨, 문서 경로, 별칭, 선택 복사 등 가벼운 채널 카탈로그 메타데이터입니다.                                                                                                       |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 “env 전용 설정이 이미 존재하는가?”에 답할 수 있는 경량 configured-state 검사기 메타데이터입니다.                                            |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 “이미 로그인된 항목이 있는가?”에 답할 수 있는 경량 persisted-auth 검사기 메타데이터입니다.                                                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 배포 plugin용 설치/업데이트 힌트입니다.                                                                                                                             |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                                                     |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22`와 같은 semver 하한을 사용하는 최소 지원 OpenClaw 호스트 버전입니다.                                                                                               |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` 같은 예상 npm dist integrity 문자열입니다. 설치 및 업데이트 흐름은 가져온 아티팩트를 이에 대해 검증합니다.                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | 구성이 유효하지 않을 때 제한된 번들 plugin 재설치 복구 경로를 허용합니다.                                                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 plugin보다 먼저 setup 전용 채널 표면을 로드할 수 있게 합니다.                                                                                                 |

매니페스트 메타데이터는 런타임이 로드되기 전에 온보딩에 어떤 provider/채널/setup 선택이 나타날지를 결정합니다. `package.json#openclaw.install`은
사용자가 그 선택 중 하나를 고를 때 온보딩이 해당 plugin을 어떻게 가져오거나 활성화할지 알려줍니다. 설치 힌트를 `openclaw.plugin.json`으로 옮기지 마세요.

`openclaw.install.minHostVersion`은 설치 및 매니페스트
레지스트리 로딩 중에 적용됩니다. 유효하지 않은 값은 거부되며, 더 최신이지만 유효한 값은 이전 호스트에서는 해당 plugin을 건너뜁니다.

정확한 npm 버전 고정은 이미 `npmSpec`에 있습니다. 예를 들면
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`와 같습니다. 가져온
npm 아티팩트가 더 이상 고정된 릴리스와 일치하지 않을 경우 업데이트 흐름이 닫힌 상태로 실패하게 하려면 여기에
`expectedIntegrity`를 함께 사용하세요. 대화형 온보딩은 `npmSpec`이 정확한 버전이고 `expectedIntegrity`가 있을 때만 신뢰된 카탈로그 메타데이터에서 npm 설치 선택지를 제공합니다. 그렇지 않으면 로컬 소스 또는 건너뛰기로 대체합니다.

채널 plugin은 상태, 채널 목록,
또는 SecretRef 스캔이 전체 런타임을 로드하지 않고도 구성된 계정을 식별해야 할 때 `openclaw.setupEntry`를 제공해야 합니다. setup 진입점은 채널 메타데이터와 setup-safe 구성,
상태, 시크릿 어댑터를 노출해야 합니다. 네트워크 클라이언트, Gateway 리스너, 전송 런타임은
메인 extension 진입점에 두세요.

런타임 진입점 필드는 소스
진입점 필드에 대한 package 경계 검사를 재정의하지 않습니다. 예를 들어,
`openclaw.runtimeExtensions`는 범위를 벗어나는 `openclaw.extensions` 경로를 로드 가능하게 만들 수 없습니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 범위가 좁습니다. 임의의 깨진 구성을 설치 가능하게 만들지
않습니다. 현재는 특정 오래된 번들 plugin 업그레이드 실패에서만 설치
흐름이 복구되도록 허용합니다. 예를 들면 누락된 번들 plugin 경로나, 그와 동일한
번들 plugin에 대한 오래된 `channels.<id>` 항목 같은 경우입니다.
관련 없는 구성 오류는 여전히 설치를 차단하고 운영자를
`openclaw doctor --fix`로 안내합니다.

`openclaw.channel.persistedAuthState`는 작은 검사기 모듈용 package 메타데이터입니다:

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
채널 plugin이 로드되기 전에 가벼운 예/아니오 인증 검사가 필요할 때 이를 사용하세요. 대상 export는
저장된 상태만 읽는 작은 함수여야 합니다. 전체
채널 런타임 barrel을 통해 연결하지 마세요.

`openclaw.channel.configuredState`는 가벼운 env 전용
configured 검사에 대해 동일한 형태를 따릅니다:

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

채널이 env 또는 기타 작은
비런타임 입력으로 configured-state에 답할 수 있을 때 이를 사용하세요. 검사에 전체 구성 확인이나 실제
채널 런타임이 필요하다면, 그 로직은 대신 plugin `config.hasConfiguredState`
hook에 두세요.

## 검색 우선순위(중복 plugin id)

OpenClaw는 여러 루트(번들, 전역 설치, workspace, 명시적 config 선택 경로)에서 plugin을 검색합니다. 두 검색 결과가 같은 `id`를 공유하면 **가장 높은 우선순위**의 매니페스트만 유지되고, 더 낮은 우선순위의 중복 항목은 나란히 로드되지 않고 제거됩니다.

우선순위, 높은 순서부터 낮은 순서:

1. **Config-selected** — `plugins.entries.<id>`에 명시적으로 고정된 경로
2. **Bundled** — OpenClaw와 함께 제공되는 plugin
3. **Global install** — 전역 OpenClaw plugin 루트에 설치된 plugin
4. **Workspace** — 현재 workspace를 기준으로 검색된 plugin

의미:

- workspace에 있는 번들 plugin의 포크나 오래된 사본은 번들 빌드를 가리지 못합니다.
- 번들 plugin을 로컬 plugin으로 실제로 재정의하려면 workspace 검색에 의존하지 말고 `plugins.entries.<id>`를 통해 고정해 우선순위로 이기게 하세요.
- 제거된 중복 항목은 로그에 기록되므로 Doctor와 시작 진단이 버려진 사본을 가리킬 수 있습니다.

## JSON 스키마 요구사항

- **모든 plugin은 JSON 스키마를 반드시 포함해야 하며**, 구성을 받지 않는 경우에도 마찬가지입니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 구성 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 채널 id가
  plugin 매니페스트에 선언되어 있지 않으면 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- plugin이 설치되어 있지만 매니페스트나 스키마가 깨졌거나 누락된 경우,
  검증은 실패하고 Doctor가 plugin 오류를 보고합니다.
- plugin 구성이 존재하지만 plugin이 **비활성화**되어 있으면 구성은 유지되고
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` 스키마는 [구성 참조](/ko/gateway/configuration)를 참조하세요.

## 참고

- 매니페스트는 로컬 파일 시스템 로드를 포함한 **기본 OpenClaw plugin에 필수**입니다.
- 런타임은 여전히 plugin 모듈을 별도로 로드합니다. 매니페스트는
  검색 + 검증 용도일 뿐입니다.
- 기본 매니페스트는 JSON5로 파싱되므로, 최종 값이 여전히 객체이기만 하면 주석, 후행 쉼표,
  따옴표 없는 키가 허용됩니다.
- 문서화된 매니페스트 필드만 매니페스트 로더가 읽습니다. 여기에
  사용자 정의 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 인증 검사, env-marker
  검증, 및 env 이름을 확인하기 위해 plugin
  런타임을 부팅해서는 안 되는 유사 provider-auth 표면을 위한 가벼운 메타데이터 경로입니다.
- `providerAuthAliases`는 core에 그 관계를 하드코딩하지 않고도 provider 변형이 다른 provider의 auth
  env var, auth 프로필, config 기반 인증, API-key 온보딩 선택을 재사용할 수 있게 합니다.
- `providerEndpoints`는 provider plugin이 단순 endpoint host/baseUrl
  매칭 메타데이터를 소유할 수 있게 합니다. core가 이미 지원하는 endpoint 클래스에만 사용하세요.
  실제 런타임 동작은 여전히 plugin이 담당합니다.
- `syntheticAuthRefs`는 provider 소유 synthetic
  auth hook가 런타임
  레지스트리가 존재하기 전에 콜드 모델 검색에 보여야 할 때 사용하는 가벼운 메타데이터 경로입니다. 실제로
  `resolveSyntheticAuth`를 구현하는 런타임 provider 또는 CLI backend ref만 나열하세요.
- `nonSecretAuthMarkers`는 로컬, OAuth, 또는 ambient 자격 증명 마커 같은
  번들 plugin 소유 placeholder API 키를 위한 가벼운 메타데이터 경로입니다.
  코어는 소유 provider를 하드코딩하지 않고도 인증 표시와 시크릿 감사에서 이를 비시크릿으로 취급합니다.
- `channelEnvVars`는 env 이름을 확인하기 위해 plugin 런타임을
  부팅해서는 안 되는 셸 env 대체 수단, setup
  프롬프트, 및 유사 채널 표면을 위한 가벼운 메타데이터 경로입니다. Env 이름은 메타데이터일 뿐이며,
  그 자체로 활성화가 아닙니다. 상태, 감사, Cron 전달 검증, 기타 읽기 전용
  표면은 여전히 env var를 구성된 채널로
  취급하기 전에 plugin 신뢰 및 유효 활성화 정책을 적용합니다.
- `providerAuthChoices`는 auth-choice 선택기,
  `--auth-choice` 확인, 선호 provider 매핑, provider 런타임이 로드되기 전의 단순 온보딩
  CLI 플래그 등록을 위한 가벼운 메타데이터 경로입니다. provider 코드가 필요한 런타임 wizard
  메타데이터는
  [Provider runtime hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.
- 배타적 plugin 종류는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다
    (기본값: 내장 `legacy`).
- `channels`, `providers`, `cliBackends`, `skills`는
  plugin에 필요하지 않으면 생략할 수 있습니다.
- plugin이 기본 모듈에 의존한다면, 빌드 단계와
  package-manager allowlist 요구사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.

## 관련 항목

- [Plugin 빌드](/ko/plugins/building-plugins) — plugin 시작하기
- [Plugin 아키텍처](/ko/plugins/architecture) — 내부 아키텍처
- [SDK 개요](/ko/plugins/sdk-overview) — Plugin SDK 참조
