---
read_when:
    - '`definePluginEntry` 또는 `defineChannelPluginEntry`의 정확한 타입 시그니처가 필요합니다'
    - 등록 모드 이해하기(full 대 setup 대 CLI 메타데이터)
    - 진입점 옵션을 찾고 있습니다
sidebarTitle: Entry Points
summary: '`definePluginEntry`, `defineChannelPluginEntry`, `defineSetupPluginEntry` 참조'
title: Plugin 진입점
x-i18n:
    generated_at: "2026-04-22T04:24:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Plugin 진입점

모든 Plugin은 기본 진입 객체를 export합니다. SDK는 이를 생성하기 위한 세 가지 헬퍼를 제공합니다.

설치된 Plugin의 경우 `package.json`은 가능한 경우 빌드된
JavaScript를 runtime 로딩 대상으로 가리켜야 합니다.

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

`extensions`와 `setupEntry`는 workspace 및 git
checkout 개발을 위한 유효한 소스 진입점으로 계속 유지됩니다. `runtimeExtensions`와 `runtimeSetupEntry`는 OpenClaw가 설치된 패키지를 로드할 때 우선 사용되며, npm 패키지가 runtime TypeScript 컴파일을 피할 수 있게 해줍니다. 설치된 패키지가 TypeScript
소스 진입점만 선언한 경우, OpenClaw는 일치하는 빌드된 `dist/*.js` peer가 있으면 이를 사용하고, 없으면 TypeScript 소스로 fallback합니다.

모든 진입 경로는 Plugin 패키지 디렉터리 내부에 있어야 합니다. Runtime 진입점과 추론된 빌드 JavaScript peer가 있더라도, 패키지 밖으로 벗어나는 `extensions` 또는
`setupEntry` 소스 경로가 유효해지지는 않습니다.

<Tip>
  **단계별 안내를 찾고 있나요?** [Channel Plugins](/ko/plugins/sdk-channel-plugins)
  또는 [Provider Plugins](/ko/plugins/sdk-provider-plugins)에서 단계별 가이드를 확인하세요.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

provider Plugin, 도구 Plugin, hook Plugin 및 메시징 채널이 **아닌**
모든 것에 사용합니다.

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

| 필드           | 타입                                                             | 필수 | 기본값              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 예   | —                   |
| `name`         | `string`                                                         | 예   | —                   |
| `description`  | `string`                                                         | 예   | —                   |
| `kind`         | `string`                                                         | 아니요 | —                 |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 schema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 예   | —                   |

- `id`는 `openclaw.plugin.json` manifest와 일치해야 합니다.
- `kind`는 배타적 슬롯용입니다: `"memory"` 또는 `"context-engine"`.
- `configSchema`는 지연 평가를 위한 함수일 수 있습니다.
- OpenClaw는 첫 접근 시 해당 schema를 확인하고 메모이제이션하므로, 비용이 큰 schema
  builder는 한 번만 실행됩니다.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

채널 전용 wiring을 포함해 `definePluginEntry`를 감쌉니다. 자동으로
`api.registerChannel({ plugin })`을 호출하고, 선택적 루트 도움말 CLI 메타데이터 seam을 노출하며, 등록 모드에 따라 `registerFull`을 게이트합니다.

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

| 필드                  | 타입                                                             | 필수 | 기본값              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 예   | —                   |
| `name`                | `string`                                                         | 예   | —                   |
| `description`         | `string`                                                         | 예   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 예   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 아니요 | 빈 객체 schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 아니요 | —                 |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 아니요 | —                 |

- `setRuntime`은 등록 중 호출되므로 runtime ref를 저장할 수 있습니다
  (보통 `createPluginRuntimeStore` 사용). CLI 메타데이터
  수집 중에는 건너뜁니다.
- `registerCliMetadata`는 `api.registrationMode === "cli-metadata"`
  및 `api.registrationMode === "full"` 모두에서 실행됩니다.
  루트 help가 비활성 로딩 상태를 유지하면서 일반 CLI 명령 등록이 전체 Plugin 로드와
  호환되도록 하기 위해, 채널 소유 CLI descriptor의 표준 위치로 사용하세요.
- `registerFull`은 `api.registrationMode === "full"`일 때만 실행됩니다. setup-only 로딩 중에는 건너뜁니다.
- `definePluginEntry`와 마찬가지로 `configSchema`는 지연 factory일 수 있고, OpenClaw는
  첫 접근 시 확인된 schema를 메모이제이션합니다.
- Plugin 소유 루트 CLI 명령의 경우, 명령이 루트 CLI parse tree에서 사라지지 않으면서 lazy-loaded 상태를 유지하길 원하면 `api.registerCli(..., { descriptors: [...] })`
  사용을 권장합니다. 채널 Plugin의 경우 이러한 descriptor는
  `registerCliMetadata(...)`에서 등록하고, `registerFull(...)`은 runtime 전용 작업에 집중하도록 하세요.
- `registerFull(...)`이 gateway RPC 메서드도 등록하는 경우, plugin별 prefix를 유지하세요. 예약된 core admin namespace(`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`)는 항상
  `operator.admin`으로 강제됩니다.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

가벼운 `setup-entry.ts` 파일용입니다. runtime 또는 CLI wiring 없이
`{ plugin }`만 반환합니다.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

채널이 비활성화되었거나, 구성되지 않았거나, deferred loading이 활성화된 경우
OpenClaw는 전체 진입점 대신 이것을 로드합니다. 이 동작 시점은
[Setup and Config](/ko/plugins/sdk-setup#setup-entry)를 참조하세요.

실제로는 `defineSetupPluginEntry(...)`를 다음과 같은 좁은 범위의 setup 헬퍼
계열과 함께 사용하는 것이 좋습니다.

- `openclaw/plugin-sdk/setup-runtime`: import-safe setup patch adapter, lookup-note 출력,
  `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 setup proxy 같은 runtime-safe setup helper
- `openclaw/plugin-sdk/channel-setup`: 선택적 설치 setup 표면
- `openclaw/plugin-sdk/setup-tools`: setup/install CLI/archive/docs helper

무거운 SDK, CLI 등록, 장시간 유지되는 runtime 서비스는 전체
진입점에 두세요.

setup과 runtime 표면을 분리하는 번들 workspace 채널은
대신 `openclaw/plugin-sdk/channel-entry-contract`의
`defineBundledChannelSetupEntry(...)`를 사용할 수 있습니다. 이 계약을 사용하면
setup 진입점이 setup-safe plugin/secrets export를 유지하면서도
runtime setter를 계속 노출할 수 있습니다.

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

이 번들 계약은 setup 흐름이 전체 채널 진입점이 로드되기 전에
가벼운 runtime setter를 정말로 필요로 할 때만 사용하세요.

## 등록 모드

`api.registrationMode`는 Plugin이 어떻게 로드되었는지를 알려줍니다.

| 모드              | 시점                              | 등록할 항목                                                                                |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | 일반 Gateway 시작                 | 모든 것                                                                                   |
| `"setup-only"`    | 비활성화되었거나 구성되지 않은 채널 | 채널 등록만                                                                              |
| `"setup-runtime"` | runtime 사용 가능한 setup 흐름    | 채널 등록 + 전체 진입점이 로드되기 전에 필요한 가벼운 runtime만                          |
| `"cli-metadata"`  | 루트 help / CLI 메타데이터 수집   | CLI descriptor만                                                                          |

`defineChannelPluginEntry`는 이 분기를 자동으로 처리합니다. 채널에
`definePluginEntry`를 직접 사용하는 경우에는 직접 모드를 확인하세요.

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 무거운 runtime 전용 등록
  api.registerService(/* ... */);
}
```

`"setup-runtime"`은 전체 번들 채널 runtime에 다시 진입하지 않고도
setup 전용 시작 표면이 존재해야 하는 구간으로 취급하세요. 적합한 예로는
채널 등록, setup-safe HTTP 라우트, setup-safe gateway 메서드, 위임된 setup helper가 있습니다. 무거운 백그라운드 서비스, CLI registrar, provider/client SDK 부트스트랩은 여전히 `"full"`에 속합니다.

CLI registrar에 대해서는 특히 다음을 따르세요.

- registrar가 하나 이상의 루트 명령을 소유하고 있고, 첫 호출 시
  OpenClaw가 실제 CLI 모듈을 lazy-load하길 원한다면 `descriptors`를 사용하세요
- 해당 descriptor가 registrar가 노출하는 모든 최상위 명령 루트를
  포함하는지 확인하세요
- eager 호환 경로에만 `commands` 단독 사용

## Plugin 형태

OpenClaw는 등록 동작에 따라 로드된 Plugin을 분류합니다.

| 형태                | 설명                                               |
| ------------------- | -------------------------------------------------- |
| **plain-capability**  | 하나의 capability 타입만 가짐(예: provider 전용)   |
| **hybrid-capability** | 여러 capability 타입을 가짐(예: provider + speech) |
| **hook-only**         | capability 없이 hook만 있음                        |
| **non-capability**    | capability 없이 tools/commands/services만 있음     |

Plugin의 형태를 보려면 `openclaw plugins inspect <id>`를 사용하세요.

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) — 등록 API 및 하위 경로 참조
- [Runtime Helpers](/ko/plugins/sdk-runtime) — `api.runtime` 및 `createPluginRuntimeStore`
- [Setup and Config](/ko/plugins/sdk-setup) — manifest, setup 진입점, deferred loading
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — `ChannelPlugin` 객체 만들기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider 등록 및 hooks
