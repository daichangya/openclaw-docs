---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfen aus dem Plugin SDK
    - Sie möchten Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-04-05T12:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin-Tests

Referenz für Testhilfen, Muster und Lint-Durchsetzung für OpenClaw-
Plugins.

<Tip>
  **Sie suchen nach Testbeispielen?** Die Schritt-für-Schritt-Leitfäden enthalten ausgearbeitete Testbeispiele:
  [Kanal-Plugin-Tests](/plugins/sdk-channel-plugins#step-6-test) und
  [Provider-Plugin-Tests](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfen

**Import:** `openclaw/plugin-sdk/testing`

Der Testing-Subpfad exportiert eine gezielte Menge von Hilfsfunktionen für Plugin-Autorinnen und -Autoren:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Verfügbare Exporte

| Export                                 | Zweck                                                   |
| -------------------------------------- | ------------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung |
| `shouldAckReaction`                    | Prüfen, ob ein Kanal eine Ack-Reaktion hinzufügen sollte |
| `removeAckReactionAfterReply`          | Ack-Reaktion nach der Zustellung einer Antwort entfernen |

### Typen

Der Testing-Subpfad exportiert auch Typen erneut, die in Testdateien nützlich sind:

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

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für
die Zielauflösung von Kanälen hinzuzufügen:

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
    // Kein Token-Wert wird offengelegt
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

### Die Plugin-Laufzeit mocken

Für Code, der `createPluginRuntimeStore` verwendet, sollten Sie die Laufzeit in Tests mocken:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

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

### Mit instanzspezifischen Stubs testen

Bevorzugen Sie instanzspezifische Stubs gegenüber Prototyp-Mutation:

```typescript
// Bevorzugt: instanzspezifischer Stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermeiden: Prototyp-Mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (Plugins im Repository)

Gebündelte Plugins haben Vertragstests, die die Besitzerschaft der Registrierung verifizieren:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Speech-Provider registrieren
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

Drei Regeln werden durch `pnpm check` für Plugins im Repository erzwungen:

1. **Keine monolithischen Root-Imports** -- Das Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Imports** -- Plugins dürfen `../../src/` nicht direkt importieren
3. **Keine Selbstimporte** -- Plugins dürfen ihren eigenen Subpfad `plugin-sdk/<name>` nicht importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, aber es wird empfohlen,
denselben Mustern zu folgen.

## Testkonfiguration

OpenClaw verwendet Vitest mit V8-Coverage-Schwellenwerten. Für Plugin-Tests:

```bash
# Alle Tests ausführen
pnpm test

# Tests für ein bestimmtes Plugin ausführen
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Mit einem Filter für einen bestimmten Testnamen ausführen
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Mit Coverage ausführen
pnpm test:coverage
```

Wenn lokale Läufe zu Speicherdruck führen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandt

- [SDK-Überblick](/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK-Provider-Plugins](/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/plugins/building-plugins) -- Einstiegsleitfaden
