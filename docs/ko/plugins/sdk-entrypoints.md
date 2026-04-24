---
read_when:
    - '`definePluginEntry` 또는 `defineChannelPluginEntry`의 정확한 타입 시그니처가 필요한 경우'
    - 등록 모드(full vs setup vs CLI metadata)를 이해하려는 경우
    - 엔트리 포인트 옵션을 확인하려는 경우
sidebarTitle: Entry Points
summary: '`definePluginEntry`, `defineChannelPluginEntry`, `defineSetupPluginEntry` 참조'
title: Plugin 엔트리 포인트
x-i18n:
    generated_at: "2026-04-24T06:27:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

모든 Plugin은 기본 엔트리 객체를 export합니다. SDK는 이를 만들기 위한 세 가지 helper를 제공합니다.

설치된 Plugin의 경우 `package.json`은 가능하면 런타임 로딩이 빌드된
JavaScript를 가리키도록 해야 합니다.

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions`와 `setupEntry`는 워크스페이스 및 git
checkout 개발을 위한 유효한 소스 엔트리로 계속 유지됩니다. `runtimeExtensions`와
`runtimeSetupEntry`는 OpenClaw가 설치된 패키지를 로드할 때 우선되며, npm 패키지가 런타임
TypeScript 컴파일을 피할 수 있게 합니다. 설치된 패키지가 TypeScript
소스 엔트리만 선언한 경우 OpenClaw는 일치하는 빌드된 `dist/*.js` peer가 있으면 이를 사용하고,
없으면 TypeScript 소스로 대체합니다.

모든 엔트리 경로는 Plugin 패키지 디렉터리 내부에 있어야 합니다. 런타임 엔트리와
추론된 빌드 JavaScript peer가 있다고 해도, 패키지 밖으로 나가는 `extensions` 또는
`setupEntry` 소스 경로가 유효해지는 것은 아닙니다.

<Tip>
  **단계별 안내가 필요하신가요?** [Channel Plugins](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugins](/ko/plugins/sdk-provider-plugins)에서 단계별 가이드를 확인하세요.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

provider Plugin, tool Plugin, hook Plugin, 그리고 메시징
채널이 **아닌** 모든 Plugin에 사용합니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 필드 | 타입 | 필수 | 기본값 |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 예 | — |
| `name` | `string` | 예 | — |
| `description` | `string` | 예 | — |
| `kind` | `string` | 아니요 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마 |
| `register` | `(api: OpenClawPluginApi) => void` | 예 | — |

- `id`는 `openclaw.plugin.json` manifest와 일치해야 합니다.
- `kind`는 `"memory"` 또는 `"context-engine"` 같은 배타적 슬롯용입니다.
- `configSchema`는 지연 평가를 위한 함수일 수 있습니다.
- OpenClaw는 첫 접근 시 해당 스키마를 확인하고 메모이즈하므로, 비용이 큰 스키마
  빌더도 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

채널별 연결을 포함한 `definePluginEntry` 래퍼입니다. 자동으로
`api.registerChannel({ plugin })`를 호출하고, 선택적 root-help CLI metadata
seam을 노출하며, 등록 모드에 따라 `registerFull`을 제어합니다.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 필드 | 타입 | 필수 | 기본값 |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id` | `string` | 예 | — |
| `name` | `string` | 예 | — |
| `description` | `string` | 예 | — |
| `plugin` | `ChannelPlugin` | 예 | — |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 스키마 |
| `setRuntime` | `(runtime: PluginRuntime) => void` | 아니요 | — |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void` | 아니요 | — |
| `registerFull` | `(api: OpenClawPluginApi) => void` | 아니요 | — |

- `setRuntime`는 등록 중 호출되므로 런타임 참조를 저장할 수 있습니다
  (보통 `createPluginRuntimeStore`를 통해). CLI metadata
  캡처 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`
  와 `api.registrationMode === "full"` 모두에서 실행됩니다.
  이를 채널 소유 CLI descriptor의 정식 위치로 사용하면 root help가
  활성화 없이 유지되면서도 일반 CLI 명령 등록은 전체 Plugin 로드와
  호환 상태를 유지할 수 있습니다.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다.
  setup-only 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 lazy factory일 수 있고 OpenClaw는
  확인된 스키마를 첫 접근 시 메모이즈합니다.
- Plugin 소유 root CLI 명령의 경우, 명령을 지연 로드 상태로 유지하면서도
  루트 CLI 파싱 트리에서 사라지지 않게 하려면
  `api.registerCli(..., { descriptors: [...] })`를 선호하세요. 채널 Plugin의 경우, 해당 descriptor는
  `registerCliMetadata(...)`에서 등록하고 `registerFull(...)`은 런타임 전용 작업에 집중시키는 것이 좋습니다.
- `registerFull(...)`이 gateway RPC 메서드도 등록하는 경우, 해당 메서드는
  Plugin 전용 접두사 아래에 유지하세요. 예약된 core 관리자 네임스페이스(`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`)는 항상
  `operator.admin`으로 강제됩니다.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일용입니다. 런타임이나 CLI 연결 없이
`{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw는 채널이 비활성화, 미구성 상태이거나 지연 로딩이 활성화된 경우
전체 엔트리 대신 이것을 로드합니다.
언제 이것이 중요한지는 [Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참조하세요.

실제로는 `defineSetupPluginEntry(...)`를 다음과 같은 좁은 setup helper
패밀리와 함께 사용하는 것이 좋습니다.

- import-safe setup patch adapter, lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy 같은 런타임 안전 setup helper를 위한
  `openclaw/plugin-sdk/setup-runtime`
- 선택적 설치 setup 표면을 위한 `openclaw/plugin-sdk/channel-setup`
- setup/install CLI/archive/docs helper를 위한 `openclaw/plugin-sdk/setup-tools`

무거운 SDK, CLI 등록, 장기 실행 런타임 서비스는 전체
엔트리에 두세요.

setup과 runtime 표면을 분리하는 번들 워크스페이스 채널은 대신
`openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약은
setup 엔트리가 setup-safe plugin/secrets export를 유지하면서도
런타임 setter를 노출할 수 있게 합니다.

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

이 번들 계약은 setup 흐름이 전체 채널 엔트리가 로드되기 전에
정말로 가벼운 런타임 setter가 필요할 때만 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떤 방식으로 로드되었는지 알려줍니다.

| 모드 | 시점 | 등록할 내용 |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"` | 일반 gateway 시작 | 모든 것 |
| `"setup-only"` | 비활성화/미구성 채널 | 채널 등록만 |
| `"setup-runtime"` | 런타임이 사용 가능한 setup 흐름 | 채널 등록 + 전체 엔트리가 로드되기 전에 필요한 가벼운 런타임만 |
| `"cli-metadata"` | root help / CLI metadata 캡처 | CLI descriptor만 |

`defineChannelPluginEntry`는 이 분리를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우 모드를 직접 확인하세요.

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

`"setup-runtime"`은 setup-only 시작 표면이
전체 번들 채널 런타임에 다시 들어가지 않고도 존재해야 하는 창으로 취급하세요. 적합한 대상은
채널 등록, setup-safe HTTP routes, setup-safe gateway 메서드,
delegated setup helper입니다. 무거운 백그라운드 서비스, CLI registrar,
provider/client SDK bootstrap은 여전히 `"full"`에 속합니다.

특히 CLI registrar의 경우:

- registrar가 하나 이상의 root 명령을 소유하고 있고
  OpenClaw가 첫 호출 시 실제 CLI 모듈을 지연 로드하게 하려면 `descriptors`를 사용하세요
- 해당 descriptor가 registrar가 노출하는 모든 최상위 명령 root를
  포괄하는지 확인하세요
- eager 호환 경로에는 `commands`만 사용하세요

## Plugin 형태

OpenClaw는 로드된 Plugin을 등록 동작에 따라 다음과 같이 분류합니다.

| 형태 | 설명 |
| --------------------- | -------------------------------------------------- |
| **plain-capability** | 하나의 capability 유형만 가짐(예: provider 전용) |
| **hybrid-capability** | 여러 capability 유형을 가짐(예: provider + speech) |
| **hook-only** | capability 없이 hooks만 가짐 |
| **non-capability** | capability 없이 tools/commands/services를 가짐 |

`openclaw plugins inspect <id>`를 사용하면 Plugin의 형태를 볼 수 있습니다.

## 관련 항목

- [SDK Overview](/ko/plugins/sdk-overview) — 등록 API 및 subpath 참조
- [Runtime Helpers](/ko/plugins/sdk-runtime) — `api.runtime` 및 `createPluginRuntimeStore`
- [Setup and Config](/ko/plugins/sdk-setup) — manifest, setup entry, 지연 로딩
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — `ChannelPlugin` 객체 빌드
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider 등록 및 hooks
