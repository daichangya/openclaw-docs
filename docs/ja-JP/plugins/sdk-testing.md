---
read_when:
    - plugin のテストを書いている場合
    - plugin SDK のテストユーティリティが必要な場合
    - bundled plugin の contract test を理解したい場合
sidebarTitle: Testing
summary: OpenClaw plugin 向けのテストユーティリティとパターン
title: Plugin Testing
x-i18n:
    generated_at: "2026-04-05T12:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin Testing

OpenClaw plugin 向けのテストユーティリティ、パターン、および lint enforcement の
リファレンスです。

<Tip>
  **テスト例を探していますか?** ハウツーガイドには実際のテスト例が含まれています:
  [Channel plugin tests](/plugins/sdk-channel-plugins#step-6-test) と
  [Provider plugin tests](/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## テストユーティリティ

**import:** `openclaw/plugin-sdk/testing`

testing subpath は、plugin 作成者向けに絞られた helper 群を export します:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 利用可能な export

| Export                                 | Purpose                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | target 解決のエラーハンドリング用の共通テストケース |
| `shouldAckReaction`                    | channel が ack reaction を追加すべきか確認する     |
| `removeAckReactionAfterReply`          | reply 配信後に ack reaction を削除する               |

### 型

testing subpath は、テストファイルで便利な型も再 export します:

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

## target 解決のテスト

channel target 解決の標準エラーケースを追加するには、
`installCommonResolveTargetErrorCases` を使います:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // あなたの channel の target 解決ロジック
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // channel 固有のテストケースを追加
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## テストパターン

### channel plugin のユニットテスト

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
    // token 値は公開されない
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### provider plugin のユニットテスト

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

### plugin runtime のモック

`createPluginRuntimeStore` を使うコードでは、テスト内で runtime をモックします:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// テストセットアップ内
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... その他のモック
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... その他の namespace
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// テスト後
store.clearRuntime();
```

### インスタンスごとの stub を使ったテスト

prototype の変更ではなく、インスタンスごとの stub を推奨します:

```typescript
// 推奨: インスタンスごとの stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 非推奨: prototype の変更
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## contract test（repo 内 plugin）

bundled plugin には、登録の所有権を検証する contract test があります:

```bash
pnpm test -- src/plugins/contracts/
```

これらのテストは次を検証します:

- どの plugin がどの provider を登録するか
- どの plugin がどの speech provider を登録するか
- 登録形状の正しさ
- runtime contract への準拠

### スコープ付きテストの実行

特定の plugin 向け:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

contract test のみを実行する場合:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## lint enforcement（repo 内 plugin）

repo 内 plugin には、`pnpm check` により 3 つのルールが強制されます:

1. **単一ルート import の禁止** -- `openclaw/plugin-sdk` のルート barrel は拒否される
2. **直接の `src/` import の禁止** -- plugin は `../../src/` を直接 import できない
3. **self-import の禁止** -- plugin は自身の `plugin-sdk/<name>` subpath を import できない

外部 plugin はこれらの lint ルールの対象ではありませんが、同じ
パターンに従うことが推奨されます。

## テスト設定

OpenClaw は、V8 coverage threshold を持つ Vitest を使用します。plugin テストでは:

```bash
# すべてのテストを実行
pnpm test

# 特定の plugin テストを実行
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 特定のテスト名フィルターで実行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# coverage 付きで実行
pnpm test:coverage
```

ローカル実行でメモリー圧迫が起きる場合:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 関連

- [SDK Overview](/plugins/sdk-overview) -- import 規約
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- channel plugin interface
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- provider plugin hook
- [Building Plugins](/plugins/building-plugins) -- はじめにガイド
