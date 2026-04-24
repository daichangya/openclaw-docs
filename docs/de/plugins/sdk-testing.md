---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Test-Utilities aus dem Plugin SDK
    - Sie möchten Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Test-Utilities und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-04-24T06:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1b8f24cdb846190ee973b01fcd466b6fb59367afbaf6abc2c370fae17ccecab
    source_path: plugins/sdk-testing.md
    workflow: 15
---

Referenz für Test-Utilities, Muster und Lint-Durchsetzung für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die How-to-Guides enthalten ausgearbeitete Testbeispiele:
  [Channel plugin tests](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Provider plugin tests](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test-Utilities

**Import:** `openclaw/plugin-sdk/testing`

Der Testing-Subpfad exportiert eine schmale Menge an Helfern für Plugin-Autoren:

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
| `installCommonResolveTargetErrorCases` | Gemeinsame Testfälle für Fehlerbehandlung bei der Zielauflösung |
| `shouldAckReaction`                    | Prüfen, ob ein Kanal eine Ack-Reaktion hinzufügen sollte |
| `removeAckReactionAfterReply`          | Ack-Reaktion nach Antwortzustellung entfernen          |

### Typen

Der Testing-Subpfad re-exportiert außerdem Typen, die in Testdateien nützlich sind:

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

## Testen der Zielauflösung

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für
die Kanal-Zielauflösung hinzuzufügen:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Zielauflösungslogik Ihres Kanals
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanalspezifische Testfälle hinzufügen
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Testmuster

### Unit-Tests für ein Kanal-Plugin

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
    // Kein Token-Wert offengelegt
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
      // ... Kontext
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... Kontext
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mocking der Plugin-Laufzeit

Für Code, der `createPluginRuntimeStore` verwendet, mocken Sie die Laufzeit in Tests:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// Im Test-Setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... weitere Mocks
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... weitere Namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Nach den Tests
store.clearRuntime();
```

### Testen mit Stubs pro Instanz

Bevorzugen Sie Stubs pro Instanz statt Prototyp-Mutation:

```typescript
// Bevorzugt: Stub pro Instanz
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermeiden: Prototyp-Mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (Plugins im Repo)

Gebündelte Plugins haben Vertragstests, die die Registrierungs-Eigentümerschaft prüfen:

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

## Lint-Durchsetzung (Plugins im Repo)

Drei Regeln werden von `pnpm check` für Plugins im Repo durchgesetzt:

1. **Keine monolithischen Root-Importe** -- das Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins dürfen `../../src/` nicht direkt importieren
3. **Keine Selbstimporte** -- Plugins dürfen ihren eigenen Subpfad `plugin-sdk/<name>` nicht importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, aber es wird empfohlen, denselben
Mustern zu folgen.

## Testkonfiguration

OpenClaw verwendet Vitest mit V8-Coverage-Schwellenwerten. Für Plugin-Tests:

```bash
# Alle Tests ausführen
pnpm test

# Tests für ein bestimmtes Plugin ausführen
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Mit einem bestimmten Testnamenfilter ausführen
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Mit Coverage ausführen
pnpm test:coverage
```

Wenn lokale Läufe Speicherdruck verursachen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandt

- [SDK Overview](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK Channel Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK Provider Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Building Plugins](/de/plugins/building-plugins) -- Anleitung für den Einstieg
