---
read_when:
    - Plugin 테스트를 작성하는 중입니다
    - Plugin SDK의 테스트 유틸리티가 필요합니다
    - 번들 Plugin의 계약 테스트를 이해하고 싶습니다
sidebarTitle: Testing
summary: OpenClaw Plugin을 위한 테스트 유틸리티 및 패턴
title: Plugin 테스트
x-i18n:
    generated_at: "2026-04-24T06:28:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw Plugin을 위한 테스트 유틸리티, 패턴, 린트 강제 적용에 대한 참조입니다.

<Tip>
  **테스트 예제를 찾고 있나요?** how-to 가이드에 실제 테스트 예제가 포함되어 있습니다:
  [채널 Plugin 테스트](/ko/plugins/sdk-channel-plugins#step-6-test) 및
  [Provider Plugin 테스트](/ko/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## 테스트 유틸리티

**import:** `openclaw/plugin-sdk/testing`

testing 하위 경로는 Plugin 작성자를 위한 좁은 범위의 헬퍼 세트를 내보냅니다:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 사용 가능한 export

| Export | 목적 |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | 대상 해석 오류 처리를 위한 공통 테스트 케이스 |
| `shouldAckReaction` | 채널이 ack 반응을 추가해야 하는지 확인 |
| `removeAckReactionAfterReply` | 응답 전달 후 ack 반응 제거 |

### 타입

testing 하위 경로는 테스트 파일에서 유용한 타입도 다시 내보냅니다:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## 대상 해석 테스트

채널 대상 해석에 대한 표준 오류 케이스를 추가하려면
`installCommonResolveTargetErrorCases`를 사용하세요:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 당신 채널의 대상 해석 로직
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 채널 전용 테스트 케이스 추가
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 테스트 패턴

### 채널 Plugin 단위 테스트

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 토큰 값은 노출되지 않음
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Provider Plugin 단위 테스트

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin 런타임 모킹

`createPluginRuntimeStore`를 사용하는 코드의 경우, 테스트에서 런타임을 모킹하세요:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// 테스트 설정에서
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 기타 mock
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... 기타 네임스페이스
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 테스트 후
store.clearRuntime();
```

### 인스턴스별 스텁으로 테스트하기

프로토타입 변형보다 인스턴스별 스텁을 선호하세요:

```typescript
// 권장: 인스턴스별 스텁
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 피할 것: 프로토타입 변형
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 계약 테스트(리포지토리 내부 Plugin)

번들 Plugin에는 등록 소유권을 검증하는 계약 테스트가 있습니다:

```bash
pnpm test -- src/plugins/contracts/
```

이 테스트는 다음을 단언합니다:

- 어떤 Plugin이 어떤 Provider를 등록하는지
- 어떤 Plugin이 어떤 음성 Provider를 등록하는지
- 등록 형태의 정확성
- 런타임 계약 준수

### 범위 지정 테스트 실행

특정 Plugin에 대해:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

계약 테스트만 실행:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## 린트 강제 적용(리포지토리 내부 Plugin)

`pnpm check`에서 리포지토리 내부 Plugin에 대해 다음 세 가지 규칙이 강제됩니다:

1. **모놀리식 루트 import 금지** -- `openclaw/plugin-sdk` 루트 barrel은 거부됨
2. **직접 `src/` import 금지** -- Plugin은 `../../src/`를 직접 import할 수 없음
3. **self-import 금지** -- Plugin은 자신의 `plugin-sdk/<name>` 하위 경로를 import할 수 없음

외부 Plugin은 이 린트 규칙의 대상은 아니지만, 동일한 패턴을 따르는 것이 권장됩니다.

## 테스트 구성

OpenClaw는 V8 커버리지 임계값과 함께 Vitest를 사용합니다. Plugin 테스트의 경우:

```bash
# 모든 테스트 실행
pnpm test

# 특정 Plugin 테스트 실행
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 특정 테스트 이름 필터와 함께 실행
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 커버리지와 함께 실행
pnpm test:coverage
```

로컬 실행에서 메모리 압박이 발생하면:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview) -- import 규칙
- [SDK 채널 Plugin](/ko/plugins/sdk-channel-plugins) -- 채널 Plugin 인터페이스
- [SDK Provider Plugin](/ko/plugins/sdk-provider-plugins) -- Provider Plugin hook
- [Plugin 만들기](/ko/plugins/building-plugins) -- 시작 가이드
