---
read_when:
    - Vous écrivez des tests pour un plugin
    - Vous avez besoin d’utilitaires de test du SDK plugin
    - Vous voulez comprendre les tests de contrat pour les plugins intégrés
sidebarTitle: Testing
summary: Utilitaires et modèles de test pour les plugins OpenClaw
title: Tests de plugins
x-i18n:
    generated_at: "2026-04-05T12:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Tests de plugins

Référence pour les utilitaires de test, les modèles et l’application des règles lint pour les
plugins OpenClaw.

<Tip>
  **Vous cherchez des exemples de tests ?** Les guides pratiques incluent des exemples de tests détaillés :
  [Tests de plugin de canal](/plugins/sdk-channel-plugins#step-6-test) et
  [Tests de plugin de provider](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitaires de test

**Import :** `openclaw/plugin-sdk/testing`

Le sous-chemin de test exporte un ensemble restreint d’assistants pour les auteurs de plugins :

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Exports disponibles

| Export                                 | But                                                   |
| -------------------------------------- | ----------------------------------------------------- |
| `installCommonResolveTargetErrorCases` | Cas de test partagés pour la gestion des erreurs de résolution de cible |
| `shouldAckReaction`                    | Vérifie si un canal doit ajouter une réaction d’ack   |
| `removeAckReactionAfterReply`          | Supprime la réaction d’ack après la livraison de la réponse |

### Types

Le sous-chemin de test réexporte également des types utiles dans les fichiers de test :

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

## Tester la résolution de cible

Utilisez `installCommonResolveTargetErrorCases` pour ajouter des cas d’erreur standard à la
résolution de cible d’un canal :

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("résolution de cible my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logique de résolution de cible de votre canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Ajouter des cas de test spécifiques au canal
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Modèles de test

### Tester unitaire un plugin de canal

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
    // Aucune valeur de jeton exposée
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Tester unitaire un plugin de provider

```typescript
import { describe, it, expect } from "vitest";

describe("plugin my-provider", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contexte
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexte
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simuler le runtime du plugin

Pour le code qui utilise `createPluginRuntimeStore`, simulez le runtime dans les tests :

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

// Dans la configuration du test
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... autres simulations
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... autres espaces de noms
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Après les tests
store.clearRuntime();
```

### Tester avec des stubs par instance

Préférez les stubs par instance à la mutation de prototype :

```typescript
// Préféré : stub par instance
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// À éviter : mutation du prototype
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Tests de contrat (plugins dans le dépôt)

Les plugins intégrés ont des tests de contrat qui vérifient la propriété de l’enregistrement :

```bash
pnpm test -- src/plugins/contracts/
```

Ces tests vérifient :

- Quels plugins enregistrent quels providers
- Quels plugins enregistrent quels providers de parole
- La correction de la forme d’enregistrement
- La conformité du contrat d’exécution

### Exécuter des tests ciblés

Pour un plugin spécifique :

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Pour les tests de contrat uniquement :

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Application des règles lint (plugins dans le dépôt)

Trois règles sont appliquées par `pnpm check` pour les plugins dans le dépôt :

1. **Pas d’imports racine monolithiques** -- la racine `openclaw/plugin-sdk` est rejetée
2. **Pas d’imports directs `src/`** -- les plugins ne peuvent pas importer directement `../../src/`
3. **Pas d’auto-imports** -- les plugins ne peuvent pas importer leur propre sous-chemin `plugin-sdk/<name>`

Les plugins externes ne sont pas soumis à ces règles lint, mais il est recommandé de suivre les mêmes
modèles.

## Configuration des tests

OpenClaw utilise Vitest avec des seuils de couverture V8. Pour les tests de plugin :

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests d’un plugin spécifique
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Exécuter avec un filtre sur un nom de test spécifique
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Exécuter avec la couverture
pnpm test:coverage
```

Si les exécutions locales provoquent une pression mémoire :

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Liens associés

- [SDK Overview](/plugins/sdk-overview) -- conventions d’import
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- interface des plugins de canal
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- hooks des plugins de provider
- [Building Plugins](/plugins/building-plugins) -- guide de démarrage
