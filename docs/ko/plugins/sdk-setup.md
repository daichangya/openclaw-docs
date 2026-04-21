---
read_when:
    - Plugin에 설정 마법사를 추가하고 있습니다
    - setup-entry.ts와 index.ts의 차이를 이해해야 합니다
    - Plugin config schema 또는 package.json openclaw metadata를 정의하고 있습니다
sidebarTitle: Setup and Config
summary: 설정 마법사, setup-entry.ts, config schema, 그리고 package.json metadata
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-21T06:07:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Plugin 설정 및 구성

Plugin 패키징(`package.json` metadata), manifest
(`openclaw.plugin.json`), setup 엔트리, config schema에 대한 참고 문서입니다.

<Tip>
  **단계별 안내를 찾고 있나요?** 방법 가이드는 문맥 속에서 패키징을 다룹니다:
  [채널 Plugin](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및
  [Provider Plugin](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 metadata

`package.json`에는 Plugin 시스템에
Plugin이 무엇을 제공하는지 알려주는 `openclaw` 필드가 필요합니다:

**채널 Plugin:**

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

**Provider Plugin / ClawHub 게시 기준선:**

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

Plugin을 ClawHub에 외부 게시하는 경우, 이 `compat`와 `build`
필드는 필수입니다. 표준 게시 스니펫은
`docs/snippets/plugin-publish/`에 있습니다.

### `openclaw` 필드

| 필드 | 타입 | 설명 |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | 엔트리 포인트 파일(패키지 루트 기준 상대 경로) |
| `setupEntry` | `string` | 경량 setup 전용 엔트리(선택 사항) |
| `channel` | `object` | setup, picker, quickstart, 상태 표면용 채널 카탈로그 metadata |
| `providers` | `string[]` | 이 Plugin이 등록하는 provider ID |
| `install` | `object` | 설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup` | `object` | 시작 동작 플래그 |

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전 채널 탐색과 setup
표면을 위한 가벼운 패키지 metadata입니다.

| 필드 | 타입 | 의미 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | 표준 채널 ID |
| `label` | `string` | 기본 채널 라벨 |
| `selectionLabel` | `string` | `label`과 달라야 할 때 picker/setup 라벨 |
| `detailLabel` | `string` | 더 풍부한 채널 카탈로그와 상태 표면용 보조 상세 라벨 |
| `docsPath` | `string` | setup 및 선택 링크용 문서 경로 |
| `docsLabel` | `string` | 채널 ID와 달라야 할 때 문서 링크에 사용할 라벨 오버라이드 |
| `blurb` | `string` | 짧은 온보딩/카탈로그 설명 |
| `order` | `number` | 채널 카탈로그에서의 정렬 순서 |
| `aliases` | `string[]` | 채널 선택용 추가 조회 alias |
| `preferOver` | `string[]` | 이 채널이 더 높은 우선순위를 가져야 하는 낮은 우선순위 Plugin/채널 ID |
| `systemImage` | `string` | 채널 UI 카탈로그용 선택적 icon/system-image 이름 |
| `selectionDocsPrefix` | `string` | 선택 표면에서 문서 링크 앞에 붙는 접두 텍스트 |
| `selectionDocsOmitLabel` | `boolean` | 선택 복사에서 라벨이 붙은 문서 링크 대신 문서 경로를 직접 표시 |
| `selectionExtras` | `string[]` | 선택 복사에 덧붙이는 추가 짧은 문자열 |
| `markdownCapable` | `boolean` | 아웃바운드 포맷 결정에서 채널을 markdown 지원 채널로 표시 |
| `exposure` | `object` | setup, 구성된 목록, 문서 표면용 채널 가시성 제어 |
| `quickstartAllowFrom` | `boolean` | 이 채널을 표준 quickstart `allowFrom` setup 흐름에 opt in |
| `forceAccountBinding` | `boolean` | 계정이 하나뿐이어도 명시적인 계정 바인딩 요구 |
| `preferSessionLookupForAnnounceTarget` | `boolean` | 이 채널의 공지 대상 확인 시 세션 조회를 우선 |

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
      "blurb": "Webhook 기반 셀프 호스팅 채팅 통합.",
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

`exposure`는 다음을 지원합니다:

- `configured`: 채널을 구성됨/상태 스타일 목록 표면에 포함
- `setup`: 채널을 대화형 setup/configure picker에 포함
- `docs`: 채널을 문서/탐색 표면에서 공개 대상으로 표시

`showConfigured`와 `showInSetup`는 레거시 alias로 계속 지원됩니다. 가능하면
`exposure`를 사용하세요.

### `openclaw.install`

`openclaw.install`은 manifest metadata가 아니라 패키지 metadata입니다.

| 필드 | 타입 | 의미 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | 설치/업데이트 흐름용 표준 npm spec |
| `localPath` | `string` | 로컬 개발 또는 번들 설치 경로 |
| `defaultChoice` | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 선호되는 설치 소스 |
| `minHostVersion` | `string` | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전 |
| `allowInvalidConfigRecovery` | `boolean` | 번들 Plugin 재설치 흐름이 특정 오래된 config 실패를 복구하도록 허용 |

`minHostVersion`이 설정되면 설치와 manifest-registry 로딩 모두에서
이를 강제합니다. 더 오래된 호스트는 Plugin을 건너뛰며,
잘못된 버전 문자열은 거부됩니다.

`allowInvalidConfigRecovery`는 깨진 config를 위한 일반적인 우회가 아닙니다. 이는
누락된 번들 Plugin 경로 또는 같은 Plugin의 오래된 `channels.<id>`
항목 같은 알려진 업그레이드 잔여물을 재설치/setup으로 복구할 수 있게 하는
제한된 번들 Plugin 복구용입니다. 관련 없는 이유로 config가 깨졌다면 설치는
여전히 fail closed하며 운영자에게 `openclaw doctor --fix`를 실행하라고 안내합니다.

### 지연 전체 로드

채널 Plugin은 다음과 같이 지연 로드를 opt in할 수 있습니다:

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

활성화되면 OpenClaw는 이미 구성된 채널에 대해서도
listen 전 시작 단계에서는 `setupEntry`만 로드합니다.
전체 엔트리는 Gateway가 listen을 시작한 뒤 로드됩니다.

<Warning>
  지연 로드는 `setupEntry`가 Gateway가 listen을 시작하기 전에 필요한 모든 것을
  등록하는 경우에만 활성화하세요(채널 등록, HTTP 경로,
  Gateway 메서드). 전체 엔트리가 필수 시작 capability를 소유한다면
  기본 동작을 유지하세요.
</Warning>

setup/전체 엔트리가 Gateway RPC 메서드를 등록한다면,
Plugin 전용 접두사에 유지하세요. 예약된 core 관리 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 계속 core 소유이며 항상
`operator.admin`으로 확인됩니다.

## Plugin manifest

모든 기본 Plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다.
OpenClaw는 이를 사용해 Plugin 코드를 실행하지 않고도 config를 검증합니다.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClaw에 My Plugin capability를 추가합니다",
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

채널 Plugin의 경우 `kind`와 `channels`를 추가하세요:

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

config가 없는 Plugin도 schema를 반드시 포함해야 합니다. 빈 schema도 유효합니다:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 schema 참고 문서는 [Plugin Manifest](/ko/plugins/manifest)를 참고하세요.

## ClawHub 게시

Plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

레거시 skill 전용 게시 alias는 Skills용입니다. Plugin 패키지는
항상 `clawhub package publish`를 사용해야 합니다.

## Setup 엔트리

`setup-entry.ts` 파일은 OpenClaw가 setup 표면(온보딩, config 복구,
비활성 채널 검사)만 필요할 때 로드하는 `index.ts`의 경량 대안입니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 setup 흐름 중 무거운 런타임 코드(crypto 라이브러리, CLI 등록,
백그라운드 서비스)를 로드하지 않게 됩니다.

setup-safe export를 sidecar 모듈에 보관하는 번들 워크스페이스 채널은
`defineSetupPluginEntry(...)` 대신
`openclaw/plugin-sdk/channel-entry-contract`의 `defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다.
이 번들 계약은 선택적
`runtime` export도 지원하므로 setup 시점 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

**OpenClaw가 전체 엔트리 대신 `setupEntry`를 사용하는 경우:**

- 채널이 비활성화되었지만 setup/온보딩 표면이 필요한 경우
- 채널이 활성화되었지만 구성되지 않은 경우
- 지연 로드가 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`가 반드시 등록해야 하는 것:**

- 채널 Plugin 객체(`defineSetupPluginEntry`를 통해)
- Gateway listen 전에 필요한 모든 HTTP 경로
- 시작 중 필요한 모든 Gateway 메서드

이러한 시작 Gateway 메서드도 여전히 `config.*` 또는 `update.*` 같은
예약된 core 관리 네임스페이스는 피해야 합니다.

**`setupEntry`에 포함하면 안 되는 것:**

- CLI 등록
- 백그라운드 서비스
- 무거운 런타임 import(crypto, SDK)
- 시작 후에만 필요한 Gateway 메서드

### 좁은 setup 도우미 import

hot setup 전용 경로에서는 setup 표면의 일부만 필요할 때
더 넓은 `plugin-sdk/setup` umbrella 대신 좁은 setup 도우미 표면을 우선하세요:

| import 경로 | 사용 용도 | 주요 export |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | `setupEntry` / 지연 채널 시작에서도 계속 사용 가능한 setup 시점 런타임 도우미 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 계정 setup adapter | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | setup/install CLI/archive/docs 도우미 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

config patch 도우미인
`moveSingleAccountChannelSectionToDefaultAccount(...)`를 포함한
전체 공유 setup 도구 상자가 필요할 때는 더 넓은 `plugin-sdk/setup`
표면을 사용하세요.

setup patch adapter는 import 시에도 hot-path 안전성을 유지합니다. 이들의 번들
단일 계정 승격 계약 표면 조회는 지연 로드되므로,
`plugin-sdk/setup-runtime`을 import해도 adapter가 실제로 사용되기 전에
번들 계약 표면 탐색을 eager 로드하지 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 config에서
`channels.<id>.accounts.*`로 업그레이드할 때, 기본 공유 동작은 승격된
계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 setup
계약 표면을 통해 이 승격을 좁히거나 오버라이드할 수 있습니다:

- `singleAccountKeysToMove`: 승격된
  계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 이름 있는 계정이 이미 존재할 때는 이
  키만 승격된 계정으로 이동하며, 공유 정책/전달 키는 채널 루트에 남음
- `resolveSingleAccountPromotionTarget(...)`: 어떤 기존 계정이
  승격된 값을 받을지 선택

현재 번들 예시는 Matrix입니다. 정확히 하나의 이름 있는 Matrix 계정이 이미
존재하거나 `defaultAccount`가 `Ops` 같은 기존 비표준 키를 가리키면,
승격은 새 `accounts.default` 항목을 만드는 대신 그 계정을 유지합니다.

## Config schema

Plugin config는 manifest의 JSON Schema에 대해 검증됩니다. 사용자는 다음과 같이
Plugin을 구성합니다:

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

등록 중 Plugin은 이 config를 `api.pluginConfig`로 받습니다.

채널 전용 config에는 대신 채널 config 섹션을 사용하세요:

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

### 채널 config schema 만들기

`openclaw/plugin-sdk/core`의 `buildChannelConfigSchema`를 사용해
Zod schema를 OpenClaw가 검증하는 `ChannelConfigSchema`
래퍼로 변환하세요:

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

채널 Plugin은 `openclaw onboard`용 대화형 설정 마법사를 제공할 수 있습니다.
마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다:

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
      credentialLabel: "봇 토큰",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "환경의 MY_CHANNEL_BOT_TOKEN을 사용하시겠습니까?",
      keepPrompt: "현재 토큰을 유지하시겠습니까?",
      inputPrompt: "봇 토큰을 입력하세요:",
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
전체 예시는 번들 Plugin 패키지(예: Discord Plugin의 `src/channel.setup.ts`)를 참고하세요.

표준
`note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM 허용 목록 프롬프트에는
`openclaw/plugin-sdk/setup`의 공유 setup
도우미인 `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, 그리고
`createNestedChannelParsedAllowFromPrompt(...)`를 우선 사용하세요.

라벨, 점수, 선택적
추가 줄만 달라지는 채널 setup 상태 블록에는,
각 Plugin에서 같은 `status` 객체를 직접 만들기보다
`openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 우선 사용하세요.

특정 문맥에서만 보여야 하는 선택적 setup 표면에는
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요:

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

`plugin-sdk/channel-setup`은 선택적 설치 표면의 한쪽만 필요할 때를 위한
더 낮은 수준의 `createOptionalChannelSetupAdapter(...)`와
`createOptionalChannelSetupWizard(...)` 빌더도 노출합니다.

생성된 선택적 adapter/wizard는 실제 config 쓰기에서는 fail closed합니다. 이들은
`validateInput`,
`applyAccountConfig`, `finalize` 전반에서 하나의 설치 필요 메시지를 재사용하고,
`docsPath`가 설정되어 있으면 문서 링크를 덧붙입니다.

바이너리 기반 setup UI에는 같은 바이너리/상태 연결을 모든 채널에 복사하는 대신
공유 위임 도우미를 우선 사용하세요:

- 라벨,
  힌트, 점수, 바이너리 감지만 달라지는 상태 블록에는 `createDetectedBinaryStatus(...)`
- 경로 기반 텍스트 입력에는 `createCliPathTextInput(...)`
- `setupEntry`가 더 무거운 전체 마법사로 지연 전달해야 할 때는
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, 그리고
  `createDelegatedResolveConfigured(...)`
- `setupEntry`가 `textInputs[*].shouldPrompt` 결정만
  위임하면 될 때는 `createDelegatedTextInputShouldPrompt(...)`

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치하세요:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 폴백합니다. ClawHub를 명시적으로 강제할 수도 있습니다:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

이에 대응하는 `npm:` 오버라이드는 없습니다. ClawHub 폴백 이후 npm 경로를 원한다면
일반 npm 패키지 spec을 사용하세요:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**리포지토리 내부 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 두면
빌드 중 자동으로 탐색됩니다.

**사용자는 다음과 같이 설치할 수 있습니다:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm 소스 설치의 경우 `openclaw plugins install`은
  `npm install --ignore-scripts`를 실행합니다(수명 주기 스크립트 없음). Plugin 의존성
  트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

번들된 OpenClaw 소유 Plugin만 시작 복구 예외입니다. 패키지된 설치에서
Plugin config, 레거시 채널 config 또는 번들 기본 활성화 manifest에 의해 하나가 활성화된 것으로 보이면,
시작 시 import 전에 해당 Plugin의 누락된 런타임 의존성을 설치합니다.
서드파티 Plugin은 시작 설치에 의존하면 안 되며,
계속 명시적 Plugin 설치 프로그램을 사용해야 합니다.

## 관련 문서

- [SDK Entry Points](/ko/plugins/sdk-entrypoints) -- `definePluginEntry` 및 `defineChannelPluginEntry`
- [Plugin Manifest](/ko/plugins/manifest) -- 전체 manifest schema 참고 문서
- [Plugin 만들기](/ko/plugins/building-plugins) -- 단계별 시작 가이드
