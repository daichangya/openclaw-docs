---
read_when:
    - You are writing tests for a plugin
    - คุณต้องการยูทิลิตีการทดสอบจาก Plugin SDK
    - คุณต้องการเข้าใจการทดสอบสัญญาสำหรับ Plugins ที่บันเดิลมา
sidebarTitle: Testing
summary: ยูทิลิตีและรูปแบบการทดสอบสำหรับ Plugins ของ OpenClaw
title: การทดสอบ Plugin
x-i18n:
    generated_at: "2026-04-23T05:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# การทดสอบ Plugin

เอกสารอ้างอิงสำหรับยูทิลิตีการทดสอบ รูปแบบ และการบังคับใช้ lint สำหรับ
Plugins ของ OpenClaw

<Tip>
  **กำลังมองหาตัวอย่างการทดสอบอยู่หรือไม่?** คู่มือแบบ how-to มีตัวอย่างการทดสอบที่ทำเสร็จแล้ว:
  [การทดสอบ Channel plugin](/th/plugins/sdk-channel-plugins#step-6-test) และ
  [การทดสอบ Provider plugin](/th/plugins/sdk-provider-plugins#step-6-test)
</Tip>

## ยูทิลิตีการทดสอบ

**Import:** `openclaw/plugin-sdk/testing`

subpath สำหรับการทดสอบจะ export helper ชุดเล็กสำหรับผู้เขียน Plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### exports ที่มีให้

| Export                                 | วัตถุประสงค์                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | ชุดกรณีทดสอบที่ใช้ร่วมกันสำหรับการจัดการข้อผิดพลาดในการ resolve เป้าหมาย |
| `shouldAckReaction`                    | ตรวจสอบว่าช่องทางควรเพิ่ม ack reaction หรือไม่     |
| `removeAckReactionAfterReply`          | ลบ ack reaction หลังจากส่งคำตอบแล้ว               |

### Types

subpath สำหรับการทดสอบยัง re-export types ที่มีประโยชน์ในไฟล์ทดสอบ:

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

## การทดสอบการ resolve เป้าหมาย

ใช้ `installCommonResolveTargetErrorCases` เพื่อเพิ่มกรณีข้อผิดพลาดมาตรฐานสำหรับ
การ resolve เป้าหมายของช่องทาง:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // ตรรกะการ resolve เป้าหมายของช่องทางคุณ
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // เพิ่มกรณีทดสอบเฉพาะของช่องทาง
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## รูปแบบการทดสอบ

### การทดสอบ unit สำหรับ channel plugin

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
    // ไม่มีการเปิดเผยค่า token
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### การทดสอบ unit สำหรับ provider plugin

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

### การ mock plugin runtime

สำหรับโค้ดที่ใช้ `createPluginRuntimeStore` ให้ mock runtime ในการทดสอบ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// ในการตั้งค่าการทดสอบ
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... mocks อื่น
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... namespaces อื่น
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// หลังจบการทดสอบ
store.clearRuntime();
```

### การทดสอบด้วย per-instance stubs

ควรใช้ per-instance stubs แทนการแก้ prototype:

```typescript
// ควรใช้: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// หลีกเลี่ยง: การแก้ prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## การทดสอบสัญญา (Plugins ใน repo)

Plugins ที่บันเดิลมามีการทดสอบสัญญาที่ตรวจสอบ ownership ของการลงทะเบียน:

```bash
pnpm test -- src/plugins/contracts/
```

การทดสอบเหล่านี้ยืนยันว่า:

- Plugins ใดลงทะเบียน providers ใด
- Plugins ใดลงทะเบียน speech providers ใด
- ความถูกต้องของรูปทรงการลงทะเบียน
- การปฏิบัติตามสัญญา runtime

### การรันทดสอบแบบเจาะจงขอบเขต

สำหรับ Plugin หนึ่งตัว:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

สำหรับเฉพาะการทดสอบสัญญา:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## การบังคับใช้ lint (Plugins ใน repo)

มีกฎสามข้อที่ `pnpm check` บังคับใช้สำหรับ Plugins ใน repo:

1. **ห้าม import จาก root แบบรวมทุกอย่าง** -- root barrel `openclaw/plugin-sdk` จะถูกปฏิเสธ
2. **ห้าม import `src/` โดยตรง** -- Plugins ห้าม import `../../src/` โดยตรง
3. **ห้าม self-imports** -- Plugins ห้าม import subpath `plugin-sdk/<name>` ของตัวเอง

Plugins ภายนอกไม่ถูกบังคับด้วยกฎ lint เหล่านี้ แต่แนะนำให้ทำตามรูปแบบเดียวกัน

## การกำหนดค่าการทดสอบ

OpenClaw ใช้ Vitest พร้อมเกณฑ์ V8 coverage สำหรับการทดสอบ Plugin:

```bash
# รันทดสอบทั้งหมด
pnpm test

# รันทดสอบเฉพาะ Plugin
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# รันโดยใช้ตัวกรองชื่อการทดสอบเฉพาะ
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# รันพร้อม coverage
pnpm test:coverage
```

หากการรันในเครื่องทำให้เกิดแรงกดดันด้านหน่วยความจำ:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## ที่เกี่ยวข้อง

- [ภาพรวม SDK](/th/plugins/sdk-overview) -- ธรรมเนียมการ import
- [SDK Channel Plugins](/th/plugins/sdk-channel-plugins) -- อินเทอร์เฟซของ channel plugin
- [SDK Provider Plugins](/th/plugins/sdk-provider-plugins) -- hooks ของ provider plugin
- [การสร้าง Plugins](/th/plugins/building-plugins) -- คู่มือเริ่มต้นใช้งาน
