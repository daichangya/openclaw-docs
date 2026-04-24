---
read_when:
    - Plugin에 설정 마법사를 추가하는 경우
    - '`setup-entry.ts`와 `index.ts`의 차이를 이해해야 하는 경우'
    - Plugin 설정 스키마 또는 `package.json`의 openclaw 메타데이터를 정의하는 경우
sidebarTitle: Setup and Config
summary: 설정 마법사, `setup-entry.ts`, 설정 스키마, `package.json` 메타데이터
title: Plugin 설정 및 구성
x-i18n:
    generated_at: "2026-04-24T06:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin 패키징(`package.json` 메타데이터), manifest
(`openclaw.plugin.json`), setup 엔트리, 설정 스키마에 대한 참조입니다.

<Tip>
  **단계별 안내가 필요하신가요?** how-to 가이드에서 패키징을 문맥과 함께 다룹니다:
  [Channel Plugins](/ko/plugins/sdk-channel-plugins#step-1-package-and-manifest) 및
  [Provider Plugins](/ko/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## 패키지 메타데이터

`package.json`에는 Plugin 시스템에 Plugin이 무엇을 제공하는지 알려주는 `openclaw` 필드가 필요합니다.

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
      "blurb": "Short description of the channel."
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

Plugin을 ClawHub에 외부 게시하는 경우 `compat` 및 `build`
필드는 필수입니다. 정식 게시 스니펫은
`docs/snippets/plugin-publish/`에 있습니다.

### `openclaw` 필드

| 필드 | 타입 | 설명 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 엔트리 포인트 파일(패키지 루트 기준 상대 경로) |
| `setupEntry` | `string` | 가벼운 setup 전용 엔트리(선택 사항) |
| `channel` | `object` | setup, picker, quickstart, status 표면용 채널 카탈로그 메타데이터 |
| `providers` | `string[]` | 이 Plugin이 등록하는 provider id |
| `install` | `object` | 설치 힌트: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup` | `object` | 시작 동작 플래그 |

### `openclaw.channel`

`openclaw.channel`은 런타임이 로드되기 전 채널 discovery 및 setup
표면을 위한 가벼운 패키지 메타데이터입니다.

| 필드 | 타입 | 의미 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | 정식 채널 id |
| `label` | `string` | 기본 채널 레이블 |
| `selectionLabel` | `string` | `label`과 달라야 할 때 picker/setup 레이블 |
| `detailLabel` | `string` | 더 풍부한 채널 카탈로그 및 상태 표면을 위한 보조 detail 레이블 |
| `docsPath` | `string` | setup 및 selection 링크용 문서 경로 |
| `docsLabel` | `string` | 문서 링크에 사용되는 레이블을 채널 id와 다르게 할 때 재정의 |
| `blurb` | `string` | 짧은 온보딩/카탈로그 설명 |
| `order` | `number` | 채널 카탈로그 내 정렬 순서 |
| `aliases` | `string[]` | 채널 선택을 위한 추가 lookup 별칭 |
| `preferOver` | `string[]` | 이 채널이 우선해야 하는 낮은 우선순위 Plugin/채널 id |
| `systemImage` | `string` | 채널 UI 카탈로그용 선택적 icon/system-image 이름 |
| `selectionDocsPrefix` | `string` | selection 표면에서 문서 링크 앞에 붙는 접두사 텍스트 |
| `selectionDocsOmitLabel` | `boolean` | selection 복사에서 레이블이 붙은 문서 링크 대신 문서 경로를 직접 표시 |
| `selectionExtras` | `string[]` | selection 복사에 추가되는 짧은 문자열 |
| `markdownCapable` | `boolean` | 아웃바운드 포맷 결정에서 채널을 markdown 가능으로 표시 |
| `exposure` | `object` | setup, configured 목록, 문서 표면용 채널 가시성 제어 |
| `quickstartAllowFrom` | `boolean` | 이 채널을 표준 quickstart `allowFrom` setup 흐름에 포함 |
| `forceAccountBinding` | `boolean` | 계정이 하나뿐이어도 명시적 account binding 요구 |
| `preferSessionLookupForAnnounceTarget` | `boolean` | 이 채널의 announce target 확인 시 session lookup 우선 |

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
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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
- `docs`: 문서/내비게이션 표면에서 채널을 public-facing으로 표시

`showConfigured`와 `showInSetup`은 레거시 별칭으로 계속 지원됩니다. 가능하면
`exposure`를 사용하세요.

### `openclaw.install`

`openclaw.install`은 manifest 메타데이터가 아니라 패키지 메타데이터입니다.

| 필드 | 타입 | 의미 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | install/update 흐름용 정식 npm spec |
| `localPath` | `string` | 로컬 개발 또는 번들 설치 경로 |
| `defaultChoice` | `"npm"` \| `"local"` | 둘 다 사용 가능할 때 선호되는 설치 소스 |
| `minHostVersion` | `string` | `>=x.y.z` 형식의 최소 지원 OpenClaw 버전 |
| `expectedIntegrity` | `string` | 보통 `sha512-...` 형식의 pinned install용 예상 npm dist integrity 문자열 |
| `allowInvalidConfigRecovery` | `boolean` | 번들 Plugin 재설치 흐름이 특정 오래된 설정 실패에서 복구할 수 있게 함 |

대화형 온보딩도 설치 시 선택적
표면에 `openclaw.install`을 사용합니다. Plugin이 provider 인증 선택 또는 채널 setup/카탈로그
메타데이터를 런타임 로드 전에 노출한다면, 온보딩은 해당 선택을 표시하고,
npm vs local 설치를 묻고, Plugin을 설치 또는 활성화한 뒤, 선택된
흐름을 계속 진행할 수 있습니다. npm 온보딩 선택에는 신뢰된 카탈로그 메타데이터와 registry
`npmSpec`가 필요하며, 정확한 버전과 `expectedIntegrity`는 선택적 핀입니다.
`expectedIntegrity`가 있으면 install/update 흐름이 이를 강제합니다. "무엇을
보여줄지" 메타데이터는 `openclaw.plugin.json`에 두고, "어떻게 설치할지"
메타데이터는 `package.json`에 두세요.

`minHostVersion`이 설정되어 있으면 install과 manifest-registry 로딩 모두
이를 강제합니다. 더 오래된 호스트는 Plugin을 건너뛰며, 잘못된 버전 문자열은 거부됩니다.

pinned npm install의 경우 정확한 버전을 `npmSpec`에 유지하고
예상 artifact integrity를 추가하세요.

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

`allowInvalidConfigRecovery`는 깨진 설정을 위한 일반 우회 수단이 아닙니다. 이것은
누락된 번들 Plugin 경로나 같은 Plugin에 대한 오래된 `channels.<id>`
항목 같은 알려진 업그레이드 잔재를 재설치/setup으로 복구하기 위한 좁은 번들 Plugin 전용 기능입니다. 관련 없는 이유로 설정이 깨진 경우 install은 여전히 안전하게 실패하며 operator에게 `openclaw doctor --fix`를 실행하라고 안내합니다.

### 전체 로드 지연

채널 Plugin은 다음과 같이 지연 로딩을 선택할 수 있습니다.

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

활성화되면 OpenClaw는 이미 구성된 채널이라도 pre-listen 시작
단계에서는 `setupEntry`만 로드합니다. 전체 엔트리는 gateway가 listening을 시작한 뒤 로드됩니다.

<Warning>
  gateway가 listening을 시작하기 전에 필요한 모든 것을
  `setupEntry`가 등록할 때만 지연 로딩을 활성화하세요(채널 등록, HTTP routes,
  gateway 메서드). 전체 엔트리가 필요한 시작 capability를 소유한다면
  기본 동작을 유지하세요.
</Warning>

setup/full 엔트리가 gateway RPC 메서드도 등록한다면, 해당 메서드는
Plugin 전용 접두사 아래에 유지하세요. 예약된 core 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 여전히 core가 소유하며 항상
`operator.admin`으로 확인됩니다.

## Plugin manifest

모든 네이티브 Plugin은 패키지 루트에 `openclaw.plugin.json`을 포함해야 합니다.
OpenClaw는 이를 사용해 Plugin 코드를 실행하지 않고 설정을 검증합니다.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

채널 Plugin의 경우 `kind`와 `channels`를 추가하세요.

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

설정이 없는 Plugin도 스키마를 포함해야 합니다. 빈 스키마도 유효합니다.

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

전체 스키마 참조는 [Plugin Manifest](/ko/plugins/manifest)를 참조하세요.

## ClawHub 게시

Plugin 패키지에는 패키지 전용 ClawHub 명령을 사용하세요.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

레거시 skill 전용 publish 별칭은 Skills용입니다. Plugin 패키지는
항상 `clawhub package publish`를 사용해야 합니다.

## Setup 엔트리

`setup-entry.ts` 파일은 `index.ts`의 가벼운 대체물로,
OpenClaw가 setup 표면만 필요할 때(온보딩, 설정 복구,
비활성화된 채널 점검) 로드합니다.

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

이렇게 하면 setup 흐름 중 무거운 런타임 코드(crypto 라이브러리, CLI 등록,
백그라운드 서비스)를 로드하지 않아도 됩니다.

사이드카 모듈에 setup-safe export를 유지하는 번들 워크스페이스 채널은
`defineSetupPluginEntry(...)` 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 번들 계약은
선택적 `runtime` export도 지원하므로 setup 시점 런타임 연결을 가볍고 명시적으로 유지할 수 있습니다.

**OpenClaw가 전체 엔트리 대신 `setupEntry`를 사용하는 경우:**

- 채널이 비활성화되어 있지만 setup/온보딩 표면이 필요한 경우
- 채널이 활성화되어 있지만 아직 구성되지 않은 경우
- 지연 로딩이 활성화된 경우(`deferConfiguredChannelFullLoadUntilAfterListen`)

**`setupEntry`가 반드시 등록해야 하는 것:**

- 채널 Plugin 객체(`defineSetupPluginEntry`를 통해)
- gateway listen 전에 필요한 모든 HTTP route
- 시작 중 필요한 모든 gateway 메서드

이러한 시작용 gateway 메서드도 여전히 `config.*`나 `update.*` 같은
예약된 core 관리자 네임스페이스는 피해야 합니다.

**`setupEntry`에 포함하면 안 되는 것:**

- CLI 등록
- 백그라운드 서비스
- 무거운 런타임 import(crypto, SDK)
- 시작 후에만 필요한 gateway 메서드

### 좁은 setup helper import

hot setup-only 경로에서는 setup 표면의 일부만 필요할 경우 더 넓은
`plugin-sdk/setup` umbrella 대신 좁은 setup helper seam을 선호하세요.

| Import 경로 | 용도 | 주요 export |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | `setupEntry` / 지연 채널 시작에서도 계속 사용 가능한 setup 시점 런타임 helper | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 환경 인식 account setup adapter | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | setup/install CLI/archive/docs helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

`moveSingleAccountChannelSectionToDefaultAccount(...)` 같은
config-patch helper를 포함해 전체 공용 setup
도구 상자가 필요할 때는 더 넓은 `plugin-sdk/setup` seam을 사용하세요.

setup patch adapter는 import 시에도 hot-path 안전 상태를 유지합니다. 번들된
single-account 승격 contract-surface 확인은 lazy이므로,
`plugin-sdk/setup-runtime`을 import한다고 해서 adapter가 실제로 사용되기 전에
번들 contract-surface discovery를 eagerly 로드하지는 않습니다.

### 채널 소유 단일 계정 승격

채널이 단일 계정 최상위 설정에서
`channels.<id>.accounts.*`로 업그레이드될 때, 기본 공용 동작은 승격된
계정 범위 값을 `accounts.default`로 이동하는 것입니다.

번들 채널은 setup
계약 표면을 통해 이 승격을 좁히거나 재정의할 수 있습니다.

- `singleAccountKeysToMove`: 승격된
  계정으로 이동해야 하는 추가 최상위 키
- `namedAccountPromotionKeys`: 명명된 계정이 이미 존재하는 경우
  이 키들만 승격된 계정으로 이동하며, 공용 정책/전달 키는 채널 루트에 남음
- `resolveSingleAccountPromotionTarget(...)`: 어떤 기존 계정이
  승격된 값을 받을지 선택

현재 번들 예시는 Matrix입니다. 정확히 하나의 명명된 Matrix 계정이 이미 존재하거나,
`defaultAccount`가 `Ops` 같은 기존의 비정규 키를 가리키고 있다면,
승격은 새 `accounts.default` 항목을 만드는 대신 해당 계정을 보존합니다.

## 설정 스키마

Plugin 설정은 manifest의 JSON Schema에 따라 검증됩니다. 사용자는
다음과 같이 Plugin을 구성합니다.

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

Plugin은 등록 중 이 설정을 `api.pluginConfig`로 받습니다.

채널별 설정의 경우 대신 채널 설정 섹션을 사용하세요.

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

### 채널 설정 스키마 만들기

`openclaw/plugin-sdk/core`의 `buildChannelConfigSchema`를 사용하면
Zod 스키마를 OpenClaw가 검증하는 `ChannelConfigSchema`
래퍼로 변환할 수 있습니다.

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
마법사는 `ChannelPlugin`의 `ChannelSetupWizard` 객체입니다.

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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
전체 예시는 번들 Plugin 패키지(예: Discord Plugin의 `src/channel.setup.ts`)를 참조하세요.

표준
`note -> prompt -> parse -> merge -> patch` 흐름만 필요한 DM allowlist 프롬프트의 경우, `openclaw/plugin-sdk/setup`의 공용 setup
helper인 `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`,
`createNestedChannelParsedAllowFromPrompt(...)`를 사용하세요.

레이블, 점수, 선택적 추가 줄만 달라지는 채널 setup status 블록의 경우,
각 Plugin에서 동일한 `status` 객체를 직접 만들기보다
`openclaw/plugin-sdk/setup`의 `createStandardChannelSetupStatus(...)`를 선호하세요.

특정 컨텍스트에서만 나타나야 하는 선택적 setup 표면의 경우,
`openclaw/plugin-sdk/channel-setup`의 `createOptionalChannelSetupSurface`를 사용하세요.

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

`plugin-sdk/channel-setup`은 더 낮은 수준의
`createOptionalChannelSetupAdapter(...)` 및
`createOptionalChannelSetupWizard(...)` 빌더도 제공합니다. optional-install 표면의
한쪽만 필요할 때 사용하세요.

생성된 선택적 adapter/wizard는 실제 config write에서는 안전하게 실패합니다. 이들은
`validateInput`,
`applyAccountConfig`, `finalize` 전반에서 하나의 install-required 메시지를 재사용하고, `docsPath`가
설정되어 있으면 문서 링크를 추가합니다.

바이너리 기반 setup UI의 경우, 각 채널에 같은 binary/status glue를
복사하는 대신 공용 delegated helper를 선호하세요.

- 레이블,
  힌트, 점수, 바이너리 감지만 달라지는 status 블록용 `createDetectedBinaryStatus(...)`
- 경로 기반 text input용 `createCliPathTextInput(...)`
- `setupEntry`가 더 무거운 전체 wizard로 지연 전달해야 할 때
  `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`,
  `createDelegatedResolveConfigured(...)`
- `setupEntry`가 `textInputs[*].shouldPrompt` 결정만
  위임하면 될 때 `createDelegatedTextInputShouldPrompt(...)`

## 게시 및 설치

**외부 Plugin:** [ClawHub](/ko/tools/clawhub) 또는 npm에 게시한 뒤 설치:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw는 먼저 ClawHub를 시도하고 자동으로 npm으로 대체합니다. ClawHub만
명시적으로 강제할 수도 있습니다.

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

이에 대응하는 `npm:` 재정의는 없습니다. ClawHub 대체 이후 npm 경로를 원하면
일반 npm 패키지 spec을 사용하세요.

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**저장소 내부 Plugin:** 번들 Plugin 워크스페이스 트리 아래에 두면 빌드 중
자동으로 discovery됩니다.

**사용자 설치:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm 기반 설치의 경우 `openclaw plugins install`은
  `npm install --ignore-scripts`를 실행합니다(lifecycle script 없음). Plugin 의존성
  트리는 순수 JS/TS로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.
</Info>

번들된 OpenClaw 소유 Plugin만 시작 시 수리 예외입니다. 패키지된 설치에서
Plugin 설정, 레거시 채널 설정, 또는 번들 기본 활성화 manifest 때문에 하나가 활성화된 것으로 보이면,
시작 시 import 전에 해당 Plugin의 누락된 런타임 의존성을 설치합니다. 서드파티 Plugin은
시작 시 설치에 의존하지 말고 계속 명시적 Plugin 설치기를 사용하세요.

## 관련 항목

- [SDK Entry Points](/ko/plugins/sdk-entrypoints) -- `definePluginEntry` 및 `defineChannelPluginEntry`
- [Plugin Manifest](/ko/plugins/manifest) -- 전체 manifest 스키마 참조
- [Building Plugins](/ko/plugins/building-plugins) -- 단계별 시작 가이드
