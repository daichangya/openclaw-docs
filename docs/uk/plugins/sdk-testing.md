---
read_when:
    - Ви пишете тести для plugin
    - Вам потрібні утиліти тестування з plugin SDK
    - Ви хочете зрозуміти контрактні тести для bundled plugin
sidebarTitle: Testing
summary: Утиліти тестування та шаблони для plugin OpenClaw
title: Тестування plugin
x-i18n:
    generated_at: "2026-04-05T18:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Тестування plugin

Довідник з утиліт тестування, шаблонів і контролю lint для plugin
OpenClaw.

<Tip>
  **Шукаєте приклади тестів?** Посібники містять готові приклади тестів:
  [Тести plugin каналів](/plugins/sdk-channel-plugins#step-6-test) і
  [Тести plugin провайдерів](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Утиліти тестування

**Імпорт:** `openclaw/plugin-sdk/testing`

Subpath для тестування експортує вузький набір helper для авторів plugin:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Доступні експорти

| Export                                 | Призначення                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Спільні тестові випадки для обробки помилок визначення цілей |
| `shouldAckReaction`                    | Перевіряє, чи має канал додавати ack-реакцію           |
| `removeAckReactionAfterReply`          | Видаляє ack-реакцію після доставки відповіді           |

### Типи

Subpath для тестування також повторно експортує типи, корисні у тестових файлах:

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

## Тестування визначення цілей

Використовуйте `installCommonResolveTargetErrorCases`, щоб додати стандартні випадки помилок для
визначення цілей каналу:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("визначення цілей my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Логіка визначення цілей вашого каналу
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Додайте тестові випадки, специфічні для каналу
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Шаблони тестування

### Модульне тестування plugin каналу

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin my-channel", () => {
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
    // Значення token не розкривається
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Модульне тестування plugin провайдера

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
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

### Мокання runtime plugin

Для коду, який використовує `createPluginRuntimeStore`, мокуйте runtime у тестах:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// У налаштуванні тестів
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

// Після тестів
store.clearRuntime();
```

### Тестування з per-instance stub

Надавайте перевагу per-instance stub замість мутації prototype:

```typescript
// Рекомендовано: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Уникайте: мутація prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Контрактні тести (plugin у репозиторії)

Bundled plugin мають контрактні тести, які перевіряють належність реєстрації:

```bash
pnpm test -- src/plugins/contracts/
```

Ці тести перевіряють:

- Які plugin реєструють які провайдери
- Які plugin реєструють які мовленнєві провайдери
- Коректність форми реєстрації
- Відповідність runtime-контракту

### Запуск scoped-тестів

Для конкретного plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Лише для контрактних тестів:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Контроль lint (plugin у репозиторії)

`pnpm check` застосовує три правила для plugin у репозиторії:

1. **Без монолітних імпортів із root** -- root barrel `openclaw/plugin-sdk` заборонено
2. **Без прямих імпортів `src/`** -- plugin не можуть напряму імпортувати `../../src/`
3. **Без self-import** -- plugin не можуть імпортувати власний subpath `plugin-sdk/<name>`

Зовнішні plugin не підпадають під ці правила lint, але дотримуватися тих самих
шаблонів рекомендується.

## Конфігурація тестів

OpenClaw використовує Vitest із порогами покриття V8. Для тестів plugin:

```bash
# Запустити всі тести
pnpm test

# Запустити тести конкретного plugin
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Запустити з фільтром за конкретною назвою тесту
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Запустити з покриттям
pnpm test:coverage
```

Якщо локальні запуски спричиняють тиск на пам’ять:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Пов’язане

- [SDK Overview](/plugins/sdk-overview) -- правила import
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- інтерфейс plugin каналу
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- hooks plugin провайдера
- [Building Plugins](/plugins/building-plugins) -- посібник для початку роботи
