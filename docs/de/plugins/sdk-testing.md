---
read_when:
    - Sie schreiben Tests für ein Plugin.
    - Sie benötigen Testhilfsprogramme aus dem Plugin SDK.
    - Sie möchten Vertragstests für gebündelte Plugins verstehen.
sidebarTitle: Testing
summary: Testhilfsprogramme und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-04-15T19:41:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin-Tests

Referenz für Testhilfsprogramme, Muster und Lint-Durchsetzung für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Schritt-für-Schritt-Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Channel-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsprogramme

**Import:** `openclaw/plugin-sdk/testing`

Der Testing-Subpath exportiert einen eingeschränkten Satz von Hilfsfunktionen für Plugin-Autorinnen und -Autoren:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Verfügbare Exporte

| Export                                 | Zweck                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung |
| `shouldAckReaction`                    | Prüfen, ob ein Channel eine Ack-Reaktion hinzufügen sollte |
| `removeAckReactionAfterReply`          | Ack-Reaktion nach der Zustellung der Antwort entfernen |

### Typen

Der Testing-Subpath exportiert außerdem Typen erneut, die in Testdateien nützlich sind:

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

## Zielauflösung testen

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die Channel-Zielauflösung hinzuzufügen:

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

## Testmuster

### Unit-Tests für ein Channel-Plugin

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

### Unit-Tests für ein Provider-Plugin

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

### Die Plugin-Laufzeit mocken

Für Code, der `createPluginRuntimeStore` verwendet, mocken Sie die Laufzeit in Tests:

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

### Mit instanzspezifischen Stubs testen

Bevorzugen Sie instanzspezifische Stubs statt Prototyp-Mutation:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (Plugins im Repository)

Gebündelte Plugins haben Vertragstests, die die Besitzverhältnisse bei der Registrierung überprüfen:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprach-Provider registrieren
- Korrektheit der Registrierungsform
- Einhaltung des Laufzeitvertrags

### Scoped Tests ausführen

Für ein bestimmtes Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Nur für Vertragstests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint-Durchsetzung (Plugins im Repository)

Drei Regeln werden durch `pnpm check` für Plugins im Repository durchgesetzt:

1. **Keine monolithischen Root-Importe** -- die Root-Barrel-Datei `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins dürfen `../../src/` nicht direkt importieren
3. **Keine Selbstimporte** -- Plugins dürfen nicht ihren eigenen Subpath `plugin-sdk/<name>` importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, aber es wird empfohlen, dieselben
Muster zu befolgen.

## Testkonfiguration

OpenClaw verwendet Vitest mit V8-Coverage-Schwellenwerten. Für Plugin-Tests:

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

Wenn lokale Ausführungen zu Speicherdruck führen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK Overview](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK Channel Plugins](/de/plugins/sdk-channel-plugins) -- Channel-Plugin-Schnittstelle
- [SDK Provider Plugins](/de/plugins/sdk-provider-plugins) -- Provider-Plugin-Hooks
- [Building Plugins](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
