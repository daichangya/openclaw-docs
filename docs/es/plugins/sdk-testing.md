---
read_when:
    - Estás escribiendo pruebas para un Plugin
    - Necesitas utilidades de prueba del SDK del Plugin
    - Quieres comprender las pruebas de contrato para plugins integrados
sidebarTitle: Testing
summary: Utilidades y patrones de prueba para plugins de OpenClaw
title: Pruebas de Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Pruebas de Plugin

Referencia de utilidades de prueba, patrones y aplicación de lint para plugins de OpenClaw.

<Tip>
  **¿Buscas ejemplos de pruebas?** Las guías prácticas incluyen ejemplos de pruebas desarrollados:
  [Pruebas de plugins de canal](/es/plugins/sdk-channel-plugins#step-6-test) y
  [Pruebas de plugins de proveedor](/es/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Utilidades de prueba

**Importación:** `openclaw/plugin-sdk/testing`

La subruta de pruebas exporta un conjunto acotado de helpers para autores de plugins:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### Exportaciones disponibles

| Exportación                           | Propósito                                              |
| ------------------------------------- | ------------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | Casos de prueba compartidos para el manejo de errores de resolución de destino |
| `shouldAckReaction`                    | Comprueba si un canal debe agregar una reacción de acuse |
| `removeAckReactionAfterReply`          | Elimina la reacción de acuse después de entregar la respuesta |

### Tipos

La subruta de pruebas también vuelve a exportar tipos útiles en archivos de prueba:

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

## Pruebas de resolución de destino

Usa `installCommonResolveTargetErrorCases` para agregar casos de error estándar para la resolución de destino del canal:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("resolución de destino de mi canal", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // La lógica de resolución de destino de tu canal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Agrega casos de prueba específicos del canal
  it("debería resolver destinos @username", () => {
    // ...
  });
});
```

## Patrones de prueba

### Pruebas unitarias de un Plugin de canal

```typescript
import { describe, it, expect, vi } from "vitest";

describe("plugin de mi canal", () => {
  it("debería resolver la cuenta a partir de la configuración", () => {
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

  it("debería inspeccionar la cuenta sin materializar secretos", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No se expone el valor del token
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Pruebas unitarias de un Plugin de proveedor

```typescript
import { describe, it, expect } from "vitest";

describe("plugin de mi proveedor", () => {
  it("debería resolver modelos dinámicos", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... contexto
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("debería devolver el catálogo cuando la clave de API esté disponible", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... contexto
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Simulación del runtime del Plugin

Para código que usa `createPluginRuntimeStore`, simula el runtime en las pruebas:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// En la configuración de prueba
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... otras simulaciones
  },
  config: {
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... otros espacios de nombres
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Después de las pruebas
store.clearRuntime();
```

### Pruebas con stubs por instancia

Prefiere stubs por instancia en lugar de mutación de prototipos:

```typescript
// Preferido: stub por instancia
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Evita: mutación de prototipo
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Pruebas de contrato (plugins en el repositorio)

Los plugins integrados tienen pruebas de contrato que verifican la propiedad del registro:

```bash
pnpm test -- src/plugins/contracts/
```

Estas pruebas verifican:

- Qué plugins registran qué proveedores
- Qué plugins registran qué proveedores de voz
- Corrección de la forma del registro
- Cumplimiento del contrato de runtime

### Ejecución de pruebas acotadas

Para un plugin específico:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Solo para pruebas de contrato:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Aplicación de lint (plugins en el repositorio)

`pnpm check` aplica tres reglas para los plugins en el repositorio:

1. **Sin importaciones monolíticas desde la raíz** -- se rechaza el barrel raíz `openclaw/plugin-sdk`
2. **Sin importaciones directas de `src/`** -- los plugins no pueden importar `../../src/` directamente
3. **Sin autoimportaciones** -- los plugins no pueden importar su propia subruta `plugin-sdk/<name>`

Los plugins externos no están sujetos a estas reglas de lint, pero se recomienda seguir los mismos patrones.

## Configuración de pruebas

OpenClaw usa Vitest con umbrales de cobertura V8. Para pruebas de plugins:

```bash
# Ejecuta todas las pruebas
pnpm test

# Ejecuta pruebas de un plugin específico
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Ejecuta con un filtro por nombre de prueba específico
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Ejecuta con cobertura
pnpm test:coverage
```

Si las ejecuciones locales generan presión de memoria:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) -- convenciones de importación
- [Plugins de canal del SDK](/es/plugins/sdk-channel-plugins) -- interfaz de plugins de canal
- [Plugins de proveedor del SDK](/es/plugins/sdk-provider-plugins) -- hooks de plugins de proveedor
- [Creación de plugins](/es/plugins/building-plugins) -- guía de introducción
