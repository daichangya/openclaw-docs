---
read_when:
    - Você está escrevendo testes para um plugin
    - Você precisa de utilitários de teste do SDK de plugin
    - Você quer entender testes de contrato para plugins empacotados
sidebarTitle: Testing
summary: Utilitários e padrões de teste para plugins do OpenClaw
title: Testes de Plugin
x-i18n:
    generated_at: "2026-04-05T12:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e95ed58ed180feadad17bb5138bd09e3b45f1f3ecdff4e2fba4874bb80099fe
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Testes de Plugin

Referência para utilitários de teste, padrões e aplicação de lint para
plugins do OpenClaw.

<Tip>
  **Procurando exemplos de teste?** Os guias práticos incluem exemplos de teste completos:
  [Testes de plugin de canal](/plugins/sdk-channel-plugins#step-6-test) e
  [Testes de plugin de provedor](/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilitários de teste

**Importação:** `openclaw/plugin-sdk/testing`

O subcaminho de teste exporta um conjunto restrito de helpers para autores de plugins:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Exportações disponíveis

| Exportação                            | Finalidade                                             |
| ------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casos de teste compartilhados para tratamento de erros de resolução de destino |
| `shouldAckReaction`                    | Verifica se um canal deve adicionar uma reação de ack  |
| `removeAckReactionAfterReply`          | Remove a reação de ack após a entrega da resposta      |

### Tipos

O subcaminho de teste também reexporta tipos úteis em arquivos de teste:

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

## Testando a resolução de destino

Use `installCommonResolveTargetErrorCases` para adicionar casos de erro padrão para
resolução de destino de canal:

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

## Padrões de teste

### Testando unitariamente um plugin de canal

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

### Testando unitariamente um plugin de provedor

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

### Simulando o runtime do plugin

Para código que usa `createPluginRuntimeStore`, simule o runtime nos testes:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("test runtime not set");

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

### Testando com stubs por instância

Prefira stubs por instância em vez de mutação de protótipo:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Testes de contrato (plugins no repositório)

Plugins empacotados têm testes de contrato que verificam a propriedade de registro:

```bash
pnpm test -- src/plugins/contracts/
```

Esses testes verificam:

- Quais plugins registram quais provedores
- Quais plugins registram quais provedores de fala
- Correção da forma de registro
- Conformidade com o contrato de runtime

### Executando testes com escopo

Para um plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Apenas para testes de contrato:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Aplicação de lint (plugins no repositório)

Três regras são aplicadas por `pnpm check` para plugins no repositório:

1. **Sem importações monolíticas da raiz** -- o barrel raiz `openclaw/plugin-sdk` é rejeitado
2. **Sem importações diretas de `src/`** -- plugins não podem importar `../../src/` diretamente
3. **Sem autoimportações** -- plugins não podem importar seu próprio subcaminho `plugin-sdk/<name>`

Plugins externos não estão sujeitos a essas regras de lint, mas seguir os mesmos
padrões é recomendado.

## Configuração de teste

O OpenClaw usa Vitest com limites de cobertura V8. Para testes de plugin:

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

Se as execuções locais causarem pressão de memória:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionado

- [Visão geral do SDK](/plugins/sdk-overview) -- convenções de importação
- [SDK Channel Plugins](/plugins/sdk-channel-plugins) -- interface de plugin de canal
- [SDK Provider Plugins](/plugins/sdk-provider-plugins) -- hooks de plugin de provedor
- [Criando Plugins](/plugins/building-plugins) -- guia de introdução
