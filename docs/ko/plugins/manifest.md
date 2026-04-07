---
read_when:
    - OpenClaw plugin을 빌드할 때
    - plugin config schema를 배포하거나 plugin 검증 오류를 디버깅해야 할 때
summary: Plugin 매니페스트 + JSON schema 요구 사항(엄격한 config 검증)
title: Plugin 매니페스트
x-i18n:
    generated_at: "2026-04-07T05:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22d41b9f8748b1b1b066ee856be4a8f41e88b9a8bc073d74fc79d2bb0982f01a
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin 매니페스트 (openclaw.plugin.json)

이 페이지는 **네이티브 OpenClaw plugin 매니페스트**만을 위한 문서입니다.

호환되는 번들 레이아웃은 [Plugin bundles](/ko/plugins/bundles)를 참고하세요.

호환 번들 형식은 서로 다른 매니페스트 파일을 사용합니다:

- Codex 번들: `.codex-plugin/plugin.json`
- Claude 번들: `.claude-plugin/plugin.json` 또는 매니페스트가 없는 기본 Claude component
  레이아웃
- Cursor 번들: `.cursor-plugin/plugin.json`

OpenClaw는 해당 번들 레이아웃도 자동 감지하지만, 여기서 설명하는
`openclaw.plugin.json` schema에 대해 검증되지는 않습니다.

호환 번들의 경우 OpenClaw는 현재 번들 메타데이터와 선언된
skill 루트, Claude 명령 루트, Claude 번들 `settings.json` 기본값,
Claude 번들 LSP 기본값, 그리고 레이아웃이
OpenClaw 런타임 기대 사항과 일치할 때 지원되는 hook pack을 읽습니다.

모든 네이티브 OpenClaw plugin은 **plugin 루트**에 `openclaw.plugin.json` 파일을
반드시 포함해야 합니다. OpenClaw는 이 매니페스트를 사용해 plugin 코드를
**실행하지 않고도** 구성을 검증합니다. 매니페스트가 없거나 유효하지 않으면
plugin 오류로 처리되며 config 검증이 차단됩니다.

전체 plugin 시스템 가이드는 [Plugins](/ko/tools/plugin)를 참고하세요.
네이티브 capability 모델과 현재 외부 호환성 안내는
[Capability model](/ko/plugins/architecture#public-capability-model)을 참고하세요.

## 이 파일의 역할

`openclaw.plugin.json`은 OpenClaw가 plugin 코드를 로드하기 전에 읽는
메타데이터입니다.

다음 용도로 사용하세요:

- plugin 식별자
- config 검증
- plugin 런타임을 부팅하지 않고도 사용할 수 있어야 하는 인증 및 온보딩 메타데이터
- plugin 런타임이 로드되기 전에 해석되어야 하는 별칭 및 자동 활성화 메타데이터
- 런타임이 로드되기 전에 plugin을 자동 활성화해야 하는 축약형 모델 계열 소유 메타데이터
- 번들 compat 배선과 contract 커버리지에 사용되는 정적 capability 소유 스냅샷
- 런타임을 로드하지 않고 catalog 및 검증 표면에 병합되어야 하는 채널별 config 메타데이터
- config UI 힌트

다음 용도로는 사용하지 마세요:

- 런타임 동작 등록
- 코드 엔트리포인트 선언
- npm 설치 메타데이터

이러한 항목은 plugin 코드와 `package.json`에 속합니다.

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | 정식 plugin id입니다. 이 id는 `plugins.entries.<id>`에서 사용됩니다.                                                                                                                                         |
| `configSchema`                      | Yes      | `object`                         | 이 plugin config용 인라인 JSON Schema입니다.                                                                                                                                                                 |
| `enabledByDefault`                  | No       | `true`                           | 번들 plugin을 기본적으로 활성화된 것으로 표시합니다. 기본 비활성 상태로 두려면 생략하거나 `true`가 아닌 값을 설정하세요.                                                                                  |
| `legacyPluginIds`                   | No       | `string[]`                       | 이 정식 plugin id로 정규화되는 레거시 id입니다.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | 인증, config 또는 모델 참조에서 해당 provider id가 언급될 때 이 plugin을 자동 활성화해야 하는 provider id입니다.                                                                                           |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | `plugins.slots.*`에서 사용하는 배타적 plugin kind를 선언합니다.                                                                                                                                              |
| `channels`                          | No       | `string[]`                       | 이 plugin이 소유하는 채널 id입니다. 검색 및 config 검증에 사용됩니다.                                                                                                                                        |
| `providers`                         | No       | `string[]`                       | 이 plugin이 소유하는 provider id입니다.                                                                                                                                                                      |
| `modelSupport`                      | No       | `object`                         | 런타임 전에 plugin을 자동 로드하는 데 사용되는, 매니페스트 소유 축약형 모델 계열 메타데이터입니다.                                                                                                         |
| `cliBackends`                       | No       | `string[]`                       | 이 plugin이 소유하는 CLI 추론 backend id입니다. 명시적 config 참조에 따른 시작 시 자동 활성화에 사용됩니다.                                                                                                 |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | OpenClaw가 plugin 코드를 로드하지 않고도 확인할 수 있는 저비용 provider 인증 env 메타데이터입니다.                                                                                                          |
| `channelEnvVars`                    | No       | `Record<string, string[]>`       | OpenClaw가 plugin 코드를 로드하지 않고도 확인할 수 있는 저비용 채널 env 메타데이터입니다. 일반적인 시작/config 도우미가 확인해야 하는 env 기반 채널 설정 또는 인증 표면에 사용하세요.                    |
| `providerAuthChoices`               | No       | `object[]`                       | 온보딩 선택기, 선호 provider 해석, 간단한 CLI 플래그 연결을 위한 저비용 인증 선택 메타데이터입니다.                                                                                                         |
| `contracts`                         | No       | `object`                         | 음성, 실시간 전사, 실시간 음성, media-understanding, image-generation, music-generation, video-generation, web-fetch, 웹 검색, 도구 소유권에 대한 정적 번들 capability 스냅샷입니다.                       |
| `channelConfigs`                    | No       | `Record<string, object>`         | 런타임 로드 전에 검색 및 검증 표면에 병합되는, 매니페스트 소유 채널 config 메타데이터입니다.                                                                                                                |
| `skills`                            | No       | `string[]`                       | plugin 루트를 기준으로 한, 로드할 skill 디렉터리입니다.                                                                                                                                                      |
| `name`                              | No       | `string`                         | 사람이 읽을 수 있는 plugin 이름입니다.                                                                                                                                                                       |
| `description`                       | No       | `string`                         | plugin 표면에 표시되는 짧은 요약입니다.                                                                                                                                                                      |
| `version`                           | No       | `string`                         | 정보 제공용 plugin 버전입니다.                                                                                                                                                                               |
| `uiHints`                           | No       | `Record<string, object>`         | config 필드를 위한 UI 라벨, placeholder, 민감도 힌트입니다.                                                                                                                                                  |

## providerAuthChoices 참조

각 `providerAuthChoices` 항목은 하나의 온보딩 또는 인증 선택을 설명합니다.
OpenClaw는 provider 런타임이 로드되기 전에 이를 읽습니다.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | 이 선택이 속하는 provider id입니다.                                                                      |
| `method`              | Yes      | `string`                                        | 디스패치할 인증 방식 id입니다.                                                                           |
| `choiceId`            | Yes      | `string`                                        | 온보딩 및 CLI 흐름에서 사용되는 안정적인 인증 선택 id입니다.                                             |
| `choiceLabel`         | No       | `string`                                        | 사용자 대상 라벨입니다. 생략되면 OpenClaw는 `choiceId`로 폴백합니다.                                     |
| `choiceHint`          | No       | `string`                                        | 선택기를 위한 짧은 도움말 텍스트입니다.                                                                  |
| `assistantPriority`   | No       | `number`                                        | assistant 기반 대화형 선택기에서 값이 낮을수록 먼저 정렬됩니다.                                          |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | 수동 CLI 선택은 허용하면서 assistant 선택기에서는 이 선택을 숨깁니다.                                    |
| `deprecatedChoiceIds` | No       | `string[]`                                      | 사용자를 이 대체 선택으로 리디렉션해야 하는 레거시 choice id입니다.                                      |
| `groupId`             | No       | `string`                                        | 관련 선택을 그룹화하기 위한 선택적 group id입니다.                                                       |
| `groupLabel`          | No       | `string`                                        | 해당 그룹의 사용자 대상 라벨입니다.                                                                      |
| `groupHint`           | No       | `string`                                        | 그룹을 위한 짧은 도움말 텍스트입니다.                                                                    |
| `optionKey`           | No       | `string`                                        | 간단한 단일 플래그 인증 흐름용 내부 옵션 키입니다.                                                       |
| `cliFlag`             | No       | `string`                                        | `--openrouter-api-key` 같은 CLI 플래그 이름입니다.                                                       |
| `cliOption`           | No       | `string`                                        | `--openrouter-api-key <key>` 같은 전체 CLI 옵션 형태입니다.                                              |
| `cliDescription`      | No       | `string`                                        | CLI 도움말에 사용되는 설명입니다.                                                                        |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | 이 선택이 표시되어야 하는 온보딩 표면입니다. 생략하면 기본값은 `["text-inference"]`입니다.              |

## uiHints 참조

`uiHints`는 config 필드 이름에서 작은 렌더링 힌트로의 매핑입니다.

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

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 사용자 대상 필드 라벨.                  |
| `help`        | `string`   | 짧은 도움말 텍스트.                     |
| `tags`        | `string[]` | 선택적 UI 태그.                         |
| `advanced`    | `boolean`  | 필드를 고급 항목으로 표시합니다.        |
| `sensitive`   | `boolean`  | 필드를 비밀값 또는 민감 항목으로 표시합니다. |
| `placeholder` | `string`   | 폼 입력용 placeholder 텍스트.           |

## contracts 참조

`contracts`는 OpenClaw가 plugin 런타임을 import하지 않고도
읽을 수 있는 정적 capability 소유 메타데이터에만 사용하세요.

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

각 목록은 선택 사항입니다:

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | 이 plugin이 소유하는 음성 provider id입니다.                   |
| `realtimeTranscriptionProviders` | `string[]` | 이 plugin이 소유하는 실시간 전사 provider id입니다.            |
| `realtimeVoiceProviders`         | `string[]` | 이 plugin이 소유하는 실시간 음성 provider id입니다.            |
| `mediaUnderstandingProviders`    | `string[]` | 이 plugin이 소유하는 media-understanding provider id입니다.    |
| `imageGenerationProviders`       | `string[]` | 이 plugin이 소유하는 image-generation provider id입니다.       |
| `videoGenerationProviders`       | `string[]` | 이 plugin이 소유하는 video-generation provider id입니다.       |
| `webFetchProviders`              | `string[]` | 이 plugin이 소유하는 web-fetch provider id입니다.              |
| `webSearchProviders`             | `string[]` | 이 plugin이 소유하는 웹 검색 provider id입니다.                |
| `tools`                          | `string[]` | 번들 contract 검사용으로 이 plugin이 소유하는 agent 도구 이름입니다. |

## channelConfigs 참조

`channelConfigs`는 채널 plugin이 런타임 로드 전에
저비용 config 메타데이터를 필요로 할 때 사용하세요.

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

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`용 JSON Schema입니다. 선언된 각 채널 config 항목에 필요합니다.            |
| `uiHints`     | `Record<string, object>` | 해당 채널 config 섹션을 위한 선택적 UI 라벨/placeholder/민감도 힌트입니다.               |
| `label`       | `string`                 | 런타임 메타데이터가 준비되지 않았을 때 선택기 및 검사 표면에 병합되는 채널 라벨입니다.   |
| `description` | `string`                 | 검사 및 catalog 표면을 위한 짧은 채널 설명입니다.                                        |
| `preferOver`  | `string[]`               | 선택 표면에서 이 채널이 우선해야 하는 레거시 또는 낮은 우선순위 plugin id입니다.         |

## modelSupport 참조

`modelSupport`는 OpenClaw가 `gpt-5.4` 또는 `claude-sonnet-4.6` 같은
축약형 모델 id에서 plugin 런타임이 로드되기 전에
provider plugin을 추론해야 할 때 사용하세요.

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
- 번들되지 않은 plugin과 번들 plugin이 각각 하나씩 모두 일치하면, 번들되지 않은
  plugin이 우선합니다
- 남은 모호성은 사용자 또는 config가 provider를 지정할 때까지 무시됩니다

필드:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 축약형 모델 id에 대해 `startsWith`로 매칭되는 접두사입니다.                     |
| `modelPatterns` | `string[]` | 프로필 접미사 제거 후 축약형 모델 id에 대해 매칭되는 정규식 소스입니다.        |

레거시 최상위 capability 키는 더 이상 권장되지 않습니다. `openclaw doctor --fix`를 사용해
`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, `webSearchProviders`를 `contracts` 아래로
이동하세요. 일반 매니페스트 로딩은 더 이상 이러한 최상위 필드를
capability 소유권으로 취급하지 않습니다.

## 매니페스트와 package.json의 차이

두 파일은 서로 다른 역할을 합니다:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 검색, config 검증, 인증 선택 메타데이터, 그리고 plugin 코드 실행 전에 존재해야 하는 UI 힌트                                     |
| `package.json`         | npm 메타데이터, 의존성 설치, 그리고 엔트리포인트, 설치 게이팅, 설정 또는 catalog 메타데이터에 사용되는 `openclaw` 블록        |

어떤 메타데이터를 어디에 넣어야 할지 확실하지 않다면 다음 규칙을 사용하세요:

- OpenClaw가 plugin 코드를 로드하기 전에 알아야 한다면 `openclaw.plugin.json`에 넣으세요
- 패키징, 엔트리 파일, npm 설치 동작에 관한 것이라면 `package.json`에 넣으세요

### 검색에 영향을 주는 package.json 필드

일부 사전 런타임 plugin 메타데이터는 의도적으로 `openclaw.plugin.json`이 아니라
`package.json`의 `openclaw` 블록 아래에 위치합니다.

중요한 예시:

| Field                                                             | What it means                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 네이티브 plugin 엔트리포인트를 선언합니다.                                                                                                   |
| `openclaw.setupEntry`                                             | 온보딩 및 지연 채널 시작 중에 사용하는 가벼운 setup 전용 엔트리포인트입니다.                                                                 |
| `openclaw.channel`                                                | 라벨, 문서 경로, 별칭, 선택 복사본 같은 저비용 채널 catalog 메타데이터입니다.                                                                |
| `openclaw.channel.configuredState`                                | 전체 채널 런타임을 로드하지 않고도 "env만으로 된 설정이 이미 존재하는가?"에 답할 수 있는 가벼운 configured-state 검사기 메타데이터입니다.   |
| `openclaw.channel.persistedAuthState`                             | 전체 채널 런타임을 로드하지 않고도 "이미 로그인된 항목이 있는가?"에 답할 수 있는 가벼운 persisted-auth 검사기 메타데이터입니다.            |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 번들 및 외부 게시 plugin을 위한 설치/업데이트 힌트입니다.                                                                                    |
| `openclaw.install.defaultChoice`                                  | 여러 설치 소스를 사용할 수 있을 때 선호되는 설치 경로입니다.                                                                                 |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` 같은 semver 하한을 사용하는, 지원되는 최소 OpenClaw 호스트 버전입니다.                                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | config가 유효하지 않을 때 제한된 번들 plugin 재설치 복구 경로를 허용합니다.                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 시작 중 전체 채널 plugin보다 먼저 setup 전용 채널 표면이 로드되도록 합니다.                                                                  |

`openclaw.install.minHostVersion`은 설치와 매니페스트
레지스트리 로드 중에 적용됩니다. 잘못된 값은 거부되며, 더 새롭지만 유효한 값은
오래된 호스트에서 plugin을 건너뜁니다.

`openclaw.install.allowInvalidConfigRecovery`는 의도적으로 좁은 범위로 제한됩니다. 이것이
임의의 깨진 config를 설치 가능하게 만들지는 않습니다. 현재는
번들 plugin 경로 누락 또는 동일 번들 plugin에 대한 오래된 `channels.<id>` 항목 같은,
특정한 오래된 번들 plugin 업그레이드 실패에서 설치 흐름이 복구되도록만 허용합니다.
관련 없는 config 오류는 여전히 설치를 차단하고 운영자를
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

설정, doctor 또는 configured-state 흐름이 전체 채널 plugin이 로드되기 전에
저비용의 예/아니오 인증 프로브를 필요로 할 때 사용하세요. 대상 export는
저장된 상태만 읽는 작은 함수여야 하며, 전체 채널 런타임 배럴을 통해
연결하지 마세요.

`openclaw.channel.configuredState`는 저비용 env 전용
구성 확인을 위한 동일한 형태를 따릅니다:

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

채널이 env 또는 기타 작은 비런타임 입력만으로 configured-state에 답할 수 있을 때 사용하세요.
검사에 전체 config 해석 또는 실제
채널 런타임이 필요하다면, 그 로직은 대신 plugin `config.hasConfiguredState`
hook에 두세요.

## JSON Schema 요구 사항

- **모든 plugin은 JSON Schema를 반드시 포함해야 하며**, config를 전혀 받지 않는 경우에도 예외가 없습니다.
- 빈 schema도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- schema는 런타임이 아니라 config 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- 알 수 없는 `channels.*` 키는 **오류**입니다. 단, 해당 채널 id가
  plugin 매니페스트에 선언된 경우는 예외입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는
  **검색 가능한** plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- plugin이 설치되어 있지만 매니페스트 또는 schema가 깨졌거나 없으면,
  검증이 실패하고 Doctor가 plugin 오류를 보고합니다.
- plugin config가 존재하지만 plugin이 **비활성화**되어 있으면, 해당 config는 유지되고
  Doctor + 로그에 **경고**가 표시됩니다.

전체 `plugins.*` schema는 [Configuration reference](/ko/gateway/configuration)를 참고하세요.

## 참고

- 매니페스트는 로컬 파일 시스템 로드를 포함한 **네이티브 OpenClaw plugin에 필수**입니다.
- 런타임은 여전히 plugin 모듈을 별도로 로드합니다. 매니페스트는
  검색 + 검증 전용입니다.
- 네이티브 매니페스트는 JSON5로 파싱되므로 주석, trailing comma,
  따옴표 없는 키를 사용할 수 있으며, 최종 값이 여전히 객체이기만 하면 됩니다.
- 매니페스트 로더는 문서화된 매니페스트 필드만 읽습니다. 여기에
  커스텀 최상위 키를 추가하지 마세요.
- `providerAuthEnvVars`는 plugin 런타임을 부팅하지 않고도 env 이름을 확인해야 하는
  인증 프로브, env-marker 검증, 기타 유사한 provider 인증 표면을 위한
  저비용 메타데이터 경로입니다.
- `channelEnvVars`는 plugin 런타임을 부팅하지 않고도 env 이름을 확인해야 하는
  셸 env 폴백, setup 프롬프트, 기타 유사한 채널 표면을 위한
  저비용 메타데이터 경로입니다.
- `providerAuthChoices`는 provider 런타임이 로드되기 전에 인증 선택기,
  `--auth-choice` 해석, 선호 provider 매핑, 단순 온보딩
  CLI 플래그 등록을 위한 저비용 메타데이터 경로입니다. provider 코드가 필요한
  런타임 wizard 메타데이터는
  [Provider runtime hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참고하세요.
- 배타적 plugin kind는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택됩니다.
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`으로 선택됩니다
    (기본값: 내장 `legacy`).
- `channels`, `providers`, `cliBackends`, `skills`는
  plugin에 필요하지 않다면 생략할 수 있습니다.
- plugin이 네이티브 모듈에 의존한다면 빌드 단계와
  패키지 관리자 허용 목록 요구 사항을 문서화하세요(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## 관련 문서

- [Building Plugins](/ko/plugins/building-plugins) — plugin 시작하기
- [Plugin Architecture](/ko/plugins/architecture) — 내부 아키텍처
- [SDK Overview](/ko/plugins/sdk-overview) — Plugin SDK 참조
