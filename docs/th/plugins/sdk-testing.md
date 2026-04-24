---
read_when:
    - คุณกำลังเขียนการทดสอบสำหรับ Plugin
    - คุณต้องการยูทิลิตีทดสอบจาก Plugin SDK
    - คุณต้องการทำความเข้าใจการทดสอบสัญญาสำหรับ bundled plugin
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugin ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-04-24T09:26:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

ข้อมูลอ้างอิงสำหรับยูทิลิตีทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ Plugin
ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่?** คู่มือแบบ how-to มีตัวอย่างการทดสอบที่ทำไว้แล้ว:
  [การทดสอบ Channel plugin](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Provider plugin](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีทดสอบ

**Import:** `openclaw/plugin-sdk/testing`

subpath สำหรับการทดสอบจะ export ชุดตัวช่วยที่เจาะจงสำหรับผู้เขียน Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### export ที่พร้อมใช้งาน

| Export                                 | จุดประสงค์                                              |
| -------------------------------------- | ------------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | เคสทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดของการ resolve target |
| `shouldAckReaction`                    | ตรวจสอบว่า channel ควรเพิ่ม ack reaction หรือไม่        |
| `removeAckReactionAfterReply`          | ลบ ack reaction หลังจากส่งการตอบกลับแล้ว               |

### ชนิดข้อมูล

subpath สำหรับการทดสอบยัง re-export ชนิดข้อมูลที่มีประโยชน์ในไฟล์ทดสอบด้วย:

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

## การทดสอบการ resolve target

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มเคสข้อผิดพลาดมาตรฐานสำหรับ
การ resolve target ของ channel:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## รูปแบบการทดสอบ

### การทดสอบหน่วยของ Channel plugin

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
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### การทดสอบหน่วยของ Provider plugin

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

### การ mock รันไทม์ของ Plugin

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ mock รันไทม์ในการทดสอบ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### การทดสอบด้วย stub รายอินสแตนซ์

ควรใช้ stub รายอินสแตนซ์แทนการแก้ไข prototype:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugin ภายในรีโพซิทอรี)

bundled plugin มีการทดสอบสัญญาเพื่อยืนยันความเป็นเจ้าของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยันว่า:

- Plugin ใดลงทะเบียนผู้ให้บริการใดบ้าง
- Plugin ใดลงทะเบียนผู้ให้บริการเสียงพูดใดบ้าง
- ความถูกต้องของรูปแบบการลงทะเบียน
- การสอดคล้องกับสัญญาของรันไทม์

### การรันการทดสอบแบบเจาะจง

สำหรับ Plugin เฉพาะ:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับการทดสอบสัญญาเท่านั้น:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## การบังคับใช้ lint (Plugin ภายในรีโพซิทอรี)

มีกฎ 3 ข้อที่ถูกบังคับใช้โดย `pnpm check` สำหรับ Plugin ภายในรีโพซิทอรี:

1. **ห้าม import จาก monolithic root** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugin ไม่สามารถ import `../../src/` โดยตรงได้
3. **ห้าม self-import** -- Plugin ไม่สามารถ import subpath `plugin-sdk/<name>` ของตัวเองได้

Plugin ภายนอกไม่อยู่ภายใต้กฎ lint เหล่านี้ แต่แนะนำให้ทำตามรูปแบบเดียวกัน

## การตั้งค่าการทดสอบ

OpenClaw ใช้ Vitest พร้อมเกณฑ์ coverage ของ V8 สำหรับการทดสอบ Plugin:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

หากการรันภายในเครื่องทำให้เกิดแรงกดดันด้านหน่วยความจำ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [SDK Overview](/th/plugins/sdk-overview) -- ข้อตกลงการ import
- [SDK Channel Plugins](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซของ Channel plugin
- [SDK Provider Plugins](/th/plugins/sdk-provider-plugins) -- hook ของ Provider plugin
- [Building Plugins](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
