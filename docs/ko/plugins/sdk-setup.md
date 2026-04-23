---
read_when:
    - plugin에 설정 마법사를 추가하는 경우
    - '`setup-entry.ts`와 `index.ts`의 차이를 이해해야 하는 경우'
    - plugin 구성 스키마 또는 `package.json`의 openclaw 메타데이터를 정의하는 경우
sidebarTitle: Setup and Config
summary: 설정 마법사, `setup-entry.ts`, 구성 스키마, 그리고 `package.json` 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-23T06:06:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin 설정 및 구성

plugin 패키징(`package.json` 메타데이터), manifest
(`openclaw.plugin.json`), setup entry, 구성 스키마에 대한 참조입니다.

<Tip>
  **단계별 가이드를 찾고 있나요?** how-to 가이드는 문맥 속 패키징을 다룹니다:
  [Channel Plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및
  [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 plugin 시스템에
plugin이 무엇을 제공하는지 알려 주는 `openclaw` 필드가 필요합니다.

**채널 plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "채널에 대한 짧은 설명."
    }
  }
}
```

**provider plugin / ClawHub 게시 기준선:**

```json openclaw-clawhub-package.json
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

plugin을 ClawHub에 외부 게시하는 경우, 해당 `compat` 및 `build`
필드는 필수입니다. 표준 게시 스니펫은
`docs/snippets/plugin-publish/`에 있습니다.

### `openclaw` 필드

| Field        | Type       | 설명 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 진입점 파일(패키지 루트 기준 상대 경로) |
| `setupEntry` | `string`   | 경량 setup 전용 진입점(선택 사항) |
| `channel`    | `object`   | setup, picker, quickstart, 상태 표면을 위한 채널 카탈로그 메타데이터 |
| `providers`  | `string[]` | 이 plugin이 등록하는 provider id |
| `install`    | `object`   | 설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | 시작 동작 플래그 |

### `openclaw.channel`

`openclaw.channel`은 런타임 로드 전에 채널 탐색 및 setup
표면을 위한 저비용 패키지 메타데이터입니다.

| Field                                  | Type       | 의미 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 표준 채널 id |
| `label`                                | `string`   | 기본 채널 레이블 |
| `selectionLabel`                       | `string`   | `label`과 달라야 할 때 picker/setup에 표시할 레이블 |
| `detailLabel`                          | `string`   | 더 풍부한 채널 카탈로그 및 상태 표면을 위한 보조 상세 레이블 |
| `docsPath`                             | `string`   | setup 및 선택 링크용 문서 경로 |
| `docsLabel`                            | `string`   | 채널 id와 달라야 할 때 문서 링크에 사용할 재정의 레이블 |
| `blurb`                                | `string`   | 짧은 온보딩/카탈로그 설명 |
| `order`                                | `number`   | 채널 카탈로그에서의 정렬 순서 |
| `aliases`                              | `string[]` | 채널 선택용 추가 조회 별칭 |
| `preferOver`                           | `string[]` | 이 채널이 우선해야 하는 더 낮은 우선순위 plugin/channel id |
| `systemImage`                          | `string`   | 채널 UI 카탈로그용 선택적 icon/system-image 이름 |
| `selectionDocsPrefix`                  | `string`   | 선택 표면에서 문서 링크 앞에 붙는 접두 텍스트 |
| `selectionDocsOmitLabel`               | `boolean`  | 선택 문구에서 레이블이 붙은 문서 링크 대신 문서 경로를 직접 표시 |
| `selectionExtras`                      | `string[]` | 선택 문구에 덧붙는 추가 짧은 문자열 |
| `markdownCapable`                      | `boolean`  | 발신 형식 결정용으로 이 채널이 markdown 가능함을 표시 |
| `exposure`                             | `object`   | setup, 구성됨 목록, 문서 표면용 채널 가시성 제어 |
| `quickstartAllowFrom`                  | `boolean`  | 이 채널을 표준 quickstart `allowFrom` setup 흐름에 포함 |
| `forceAccountBinding`                  | `boolean`  | 계정이 하나뿐이어도 명시적 계정 바인딩을 요구 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 이 채널의 announce 대상 해석 시 세션 조회를 우선 |

예시:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook 기반 self-hosted 채팅 통합.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "가이드:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure`는 다음을 지원합니다.

- `configured`: 구성됨/상태 스타일 목록 표면에 채널 포함
- `setup`: 대화형 setup/configure picker에 채널 포함
- `docs`: 문서/탐색 표면에서 채널을 공개 대상으로 표시

`showConfigured`와 `showInSetup`도 레거시 별칭으로 계속 지원됩니다. 가능하면
`exposure`를 사용하세요.

### `openclaw.install`

`openclaw.install`은 manifest 메타데이터가 아니라 패키지 메타데이터입니다.

| Field                        | Type                 | 의미 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 설치/업데이트 흐름용 표준 npm spec |
| `localPath`                  | `string`             | 로컬 개발 또는 번들 설치 경로 |
| `defaultChoice`              | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 우선 설치 소스 |
| `minHostVersion`             | `string`             | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전 |
| `expectedIntegrity`          | `string`             | 고정 설치용으로 기대되는 npm dist integrity 문자열, 보통 `sha512-...` |
| `allowInvalidConfigRecovery` | `boolean`            | 번들 plugin 재설치 흐름이 특정 오래된 구성 실패를 복구하도록 허용 |

대화형 온보딩도 주문형 설치 표면에 `openclaw.install`을 사용합니다.
plugin이 런타임 로드 전에 provider 인증 선택 또는 채널 setup/카탈로그
메타데이터를 노출하면, 온보딩은 해당 선택을 보여 주고, npm 대 local 설치를 묻고,
plugin을 설치하거나 활성화한 뒤, 선택된 흐름을 계속 진행할 수 있습니다. Npm 온보딩 선택은
정확한 `npmSpec` 버전과 `expectedIntegrity`가 있는 신뢰된 카탈로그 메타데이터가 필요합니다.
고정되지 않은 패키지 이름과 dist-tag는 자동 온보딩 설치 대상으로 제공되지 않습니다.
“무엇을 보여 줄지” 메타데이터는 `openclaw.plugin.json`에,
“어떻게 설치할지” 메타데이터는 `package.json`에 두세요.

`minHostVersion`이 설정되어 있으면, 설치와 manifest registry 로드가 모두 이를 강제합니다.
더 오래된 호스트는 plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.

고정된 npm 설치의 경우, `npmSpec`에 정확한 버전을 유지하고
기대되는 아티팩트 integrity를 추가하세요.

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`는 손상된 구성을 위한 일반 우회 수단이 아닙니다. 이는
알려진 업그레이드 잔여물(예: 누락된 번들 plugin 경로 또는 같은 plugin에 대한 오래된 `channels.<id>`
항목)을 재설치/setup이 복구할 수 있도록 하는, 제한된 번들 plugin 복구 전용입니다.
구성이 다른 이유로 손상된 경우, 설치는 여전히 fail closed되며
운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.

### 지연된 전체 로드

채널 plugin은 다음과 같이 지연 로드를 opt-in할 수 있습니다.

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

활성화하면 OpenClaw는 이미 구성된 채널이라도 pre-listen 시작
단계에서는 `setupEntry`만 로드합니다. 전체 진입점은 gateway가 리슨을 시작한 후 로드됩니다.

<Warning>
  gateway가 리슨을 시작하기 전에 필요한 모든 것(채널 등록, HTTP 경로,
  gateway 메서드)을 `setupEntry`가 등록하는 경우에만 지연 로드를 활성화하세요. 전체 진입점이 필수 시작 기능을 소유한다면, 기본 동작을 유지하세요.
</Warning>

setup/full entry가 gateway RPC 메서드를 등록한다면, 이를
plugin 전용 접두사 아래에 두세요. 예약된 코어 관리 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 계속 코어 소유이며 항상
`operator.admin`으로 해석됩니다.

## Plugin manifest

모든 네이티브 plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다.
OpenClaw는 plugin 코드를 실행하지 않고도 구성을 검증하기 위해 이를 사용합니다.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClaw에 My Plugin 기능을 추가합니다",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook 검증 비밀"
      }
    }
  }
}
```

채널 plugin의 경우, `kind`와 `channels`를 추가하세요.

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

구성이 전혀 없는 plugin도 스키마를 포함해야 합니다. 빈 스키마도 유효합니다.

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin Manifest](/ko/plugins/manifest)를 참고하세요.

## ClawHub 게시

plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

레거시 Skills 전용 게시 별칭은 Skills용입니다. plugin 패키지는
항상 `clawhub package publish`를 사용해야 합니다.

## Setup entry

`setup-entry.ts` 파일은 OpenClaw가 setup 표면(온보딩, 구성 복구,
비활성화된 채널 검사)만 필요로 할 때 로드하는 `index.ts`의 경량 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 setup 흐름 중에 무거운 런타임 코드(암호화 라이브러리, CLI 등록,
백그라운드 서비스)를 로드하지 않아도 됩니다.

setup 안전 export를 사이드카 모듈에 유지하는 번들 워크스페이스 채널은
`defineSetupPluginEntry(...)` 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은
선택적 `runtime` export도 지원하므로 setup 시점의 런타임 배선을 가볍고 명시적으로 유지할 수 있습니다.

**OpenClaw가 전체 entry 대신 `setupEntry`를 사용하는 경우:**

- 채널이 비활성화되어 있지만 setup/온보딩 표면이 필요한 경우
- 채널이 활성화되어 있지만 아직 구성되지 않은 경우
- 지연 로드가 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`가 반드시 등록해야 하는 것:**

- 채널 plugin 객체(`defineSetupPluginEntry`를 통해)
- gateway가 listen하기 전에 필요한 모든 HTTP 경로
- 시작 중 필요한 모든 gateway 메서드

이러한 시작용 gateway 메서드도 `config.*`나 `update.*` 같은
예약된 코어 관리 네임스페이스는 피해야 합니다.

**`setupEntry`에 포함하면 안 되는 것:**

- CLI 등록
- 백그라운드 서비스
- 무거운 런타임 import(crypto, SDK)
- 시작 후에만 필요한 gateway 메서드

### 좁은 범위의 setup helper import

hot setup 전용 경로에서는 setup 표면의 일부만 필요하다면, 더 넓은
`plugin-sdk/setup` umbrella 대신 더 좁은 setup helper seam을 우선 사용하세요.

| Import path                        | 사용 목적 | 주요 export |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 지연 채널 시작에서도 계속 사용 가능한 setup 시점 런타임 helper | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 account setup adapter | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은
구성 패치 helper를 포함한 전체 공유 setup
toolbox가 필요하다면 더 넓은 `plugin-sdk/setup` seam을 사용하세요.

setup patch adapter는 import 시 hot-path 안전성을 유지합니다. 번들된
single-account 승격 계약 표면 조회는 lazy이므로,
`plugin-sdk/setup-runtime`을 import해도 adapter가 실제로 사용되기 전에는
번들 계약 표면 탐색을 eager하게 로드하지 않습니다.

### 채널 소유 single-account 승격

채널이 단일 account 최상위 구성에서
`channels.<id>.accounts.*`로 업그레이드될 때, 기본 공유 동작은 승격된
account 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 자신의 setup
계약 표면을 통해 이 승격을 좁히거나 재정의할 수 있습니다.

- `singleAccountKeysToMove`: 승격된
  account로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 명명된 account가 이미 존재하는 경우,
  이 키들만 승격된 account로 이동하며, 공유 정책/전달 키는 채널 루트에 남음
- `resolveSingleAccountPromotionTarget(...)`: 승격된 값을 받을 기존 account를 선택

현재 번들 예시는 Matrix입니다. 정확히 하나의 명명된 Matrix account가
이미 존재하거나 `defaultAccount`가 `Ops` 같은 기존 비표준 키를 가리키는 경우,
승격은 새 `accounts.default` 항목을 만들지 않고 해당 account를 유지합니다.

## 구성 스키마

plugin 구성은 manifest의 JSON Schema에 대해 검증됩니다. 사용자는 다음과 같이
plugin을 구성합니다.

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

plugin은 등록 중 이 구성을 `api.pluginConfig`로 받습니다.

채널별 구성에는 대신 채널 구성 섹션을 사용하세요.

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### 채널 구성 스키마 만들기

`openclaw/plugin-sdk/core`의 `buildChannelConfigSchema`를 사용해
Zod 스키마를 OpenClaw가 검증하는 `ChannelConfigSchema` 래퍼로 변환하세요.

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## 설정 마법사

채널 plugin은 `openclaw onboard`용 대화형 설정 마법사를 제공할 수 있습니다.
이 마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다.

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "연결됨",
    unconfiguredLabel: "구성되지 않음",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot 토큰",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "환경 변수의 MY_CHANNEL_BOT_TOKEN을 사용하시겠습니까?",
      keepPrompt: "현재 토큰을 유지하시겠습니까?",
      inputPrompt: "bot 토큰을 입력하세요:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 타입은 `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` 등을 지원합니다.
전체 예시는 번들 plugin 패키지(예: Discord plugin의 `src/channel.setup.ts`)를 참고하세요.

표준
`note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트에는
`openclaw/plugin-sdk/setup`의 공유 setup
helper인 `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`,
`createNestedChannelParsedAllowFromPrompt(...)`를 우선 사용하세요.

레이블, 점수, 선택적
추가 줄만 달라지는 채널 setup 상태 블록에는 각 plugin에서 같은 `status` 객체를
직접 만드는 대신
`openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 우선 사용하세요.

특정 문맥에서만 나타나야 하는 선택적 setup 표면에는
`openclaw/plugin-sdk/channel-setup`의
`createOptionalChannelSetupSurface`를 사용하세요.

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup`은 그 선택적 설치 표면의 한쪽만 필요할 때 사용할 수 있는
더 낮은 수준의
`createOptionalChannelSetupAdapter(...)`와
`createOptionalChannelSetupWizard(...)` 빌더도 노출합니다.

생성된 선택적 adapter/wizard는 실제 구성 쓰기에서는 fail closed됩니다.
이들은 `validateInput`,
`applyAccountConfig`, `finalize` 전반에서 하나의 동일한 설치 필요 메시지를 재사용하고,
`docsPath`가 설정되어 있으면 문서 링크를 덧붙입니다.

바이너리 기반 setup UI에는 모든 채널에 동일한 바이너리/상태 glue를
복사하는 대신 공유 delegated helper를 우선 사용하세요.

- 레이블,
  힌트, 점수, 바이너리 탐지만 달라지는 상태 블록에는 `createDetectedBinaryStatus(...)`
- 경로 기반 텍스트 입력에는 `createCliPathTextInput(...)`
- `setupEntry`가 더 무거운 전체 마법사로 lazy 전달해야 할 때는
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`,
  `createDelegatedResolveConfigured(...)`
- `setupEntry`가 `textInputs[*].shouldPrompt` 판단만
  위임하면 될 때는 `createDelegatedTextInputShouldPrompt(...)`

## 게시 및 설치

**외부 plugin:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치합니다.

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 대체합니다. ClawHub만
명시적으로 강제할 수도 있습니다.

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

이에 대응하는 `npm:` 재정의는 없습니다. ClawHub 대체 이후 npm 경로를
원할 때는 일반 npm package spec을 사용하세요.

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**리포지토리 내부 plugin:** 번들 plugin 워크스페이스 트리 아래에 두면 빌드 중 자동으로
탐지됩니다.

**사용자 설치:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm 소스 설치의 경우, `openclaw plugins install`은
  `npm install --ignore-scripts`(수명 주기 스크립트 없음)를 실행합니다. plugin 의존성
  트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

번들된 OpenClaw 소유 plugin만이 유일한 시작 복구 예외입니다. 패키지된 설치가
plugin 구성, 레거시 채널 구성, 또는 번들 기본 활성화 manifest에 의해 활성화된 것을 보면,
시작 시 import 전에 해당 plugin의 누락된 런타임 의존성을 설치합니다.
서드파티 plugin은 시작 시 설치에 의존해서는 안 되며, 계속 명시적 plugin 설치 프로그램을 사용해야 합니다.

## 관련 항목

- [SDK Entry Points](/ko/plugins/sdk-entrypoints) -- `definePluginEntry` 및 `defineChannelPluginEntry`
- [Plugin Manifest](/ko/plugins/manifest) -- 전체 manifest 스키마 참조
- [Building Plugins](/ko/plugins/building-plugins) -- 단계별 시작 가이드
