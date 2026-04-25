---
read_when:
    - Quieres crear un Plugin nuevo de OpenClaw
    - Necesitas una guía de inicio rápido para el desarrollo de Plugins
    - Estás añadiendo un nuevo canal, proveedor, herramienta u otra capacidad a OpenClaw
sidebarTitle: Getting Started
summary: Crea tu primer Plugin de OpenClaw en minutos
title: Crear Plugins
x-i18n:
    generated_at: "2026-04-25T13:50:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Los Plugins amplían OpenClaw con nuevas capacidades: canales, proveedores de modelos,
voz, transcripción en tiempo real, voz en tiempo real, comprensión de multimedia, generación de imágenes,
generación de vídeo, captura web, búsqueda web, herramientas de agente o cualquier
combinación.

No necesitas añadir tu Plugin al repositorio de OpenClaw. Publícalo en
[ClawHub](/es/tools/clawhub) o npm y los usuarios lo instalan con
`openclaw plugins install <package-name>`. OpenClaw intenta primero con ClawHub y
recurre automáticamente a npm.

## Requisitos previos

- Node >= 22 y un gestor de paquetes (npm o pnpm)
- Familiaridad con TypeScript (ESM)
- Para Plugins dentro del repositorio: repositorio clonado y `pnpm install` ejecutado

## ¿Qué tipo de Plugin?

<CardGroup cols={3}>
  <Card title="Plugin de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Conecta OpenClaw a una plataforma de mensajería (Discord, IRC, etc.)
  </Card>
  <Card title="Plugin de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Añade un proveedor de modelos (LLM, proxy o endpoint personalizado)
  </Card>
  <Card title="Plugin de herramienta / hook" icon="wrench" href="/es/plugins/hooks">
    Registra herramientas de agente, hooks de eventos o servicios — continúa abajo
  </Card>
</CardGroup>

Para un Plugin de canal cuya instalación no esté garantizada cuando se ejecuta onboarding/setup,
usa `createOptionalChannelSetupSurface(...)` de
`openclaw/plugin-sdk/channel-setup`. Produce un adaptador de configuración + un par de asistente
que anuncia el requisito de instalación y falla de forma cerrada en escrituras reales de configuración
hasta que el Plugin esté instalado.

## Inicio rápido: Plugin de herramienta

Este recorrido crea un Plugin mínimo que registra una herramienta de agente. Los Plugins de canal
y de proveedor tienen guías específicas enlazadas arriba.

<Steps>
  <Step title="Crea el paquete y el manifiesto">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Todo Plugin necesita un manifiesto, incluso sin configuración. Consulta
    [Manifiesto](/es/plugins/manifest) para ver el esquema completo. Los fragmentos canónicos
    de publicación en ClawHub viven en `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Escribe el punto de entrada">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` es para Plugins que no son de canal. Para canales, usa
    `defineChannelPluginEntry`; consulta [Plugins de canal](/es/plugins/sdk-channel-plugins).
    Para ver todas las opciones del punto de entrada, consulta [Puntos de entrada](/es/plugins/sdk-entrypoints).

  </Step>

  <Step title="Prueba y publica">

    **Plugins externos:** valida y publica con ClawHub, luego instala:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw también comprueba ClawHub antes que npm para especificaciones de paquete simples como
    `@myorg/openclaw-my-plugin`.

    **Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de Plugins incluidos; se detectan automáticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capacidades del Plugin

Un solo Plugin puede registrar cualquier número de capacidades mediante el objeto `api`:

| Capacidad             | Método de registro                              | Guía detallada                                                                  |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencia de texto (LLM)   | `api.registerProvider(...)`                      | [Plugins de proveedor](/es/plugins/sdk-provider-plugins)                               |
| Backend de inferencia CLI  | `api.registerCliBackend(...)`                    | [Backends CLI](/es/gateway/cli-backends)                                           |
| Canal / mensajería    | `api.registerChannel(...)`                       | [Plugins de canal](/es/plugins/sdk-channel-plugins)                                 |
| Voz (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transcripción en tiempo real | `api.registerRealtimeTranscriptionProvider(...)` | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voz en tiempo real         | `api.registerRealtimeVoiceProvider(...)`         | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensión de multimedia    | `api.registerMediaUnderstandingProvider(...)`    | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de imágenes       | `api.registerImageGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de música       | `api.registerMusicGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generación de vídeo       | `api.registerVideoGenerationProvider(...)`       | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Captura web              | `api.registerWebFetchProvider(...)`              | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Búsqueda web             | `api.registerWebSearchProvider(...)`             | [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware de resultado de herramienta | `api.registerAgentToolResultMiddleware(...)`     | [Resumen del SDK](/es/plugins/sdk-overview#registration-api)                          |
| Herramientas de agente            | `api.registerTool(...)`                          | Más abajo                                                                           |
| Comandos personalizados        | `api.registerCommand(...)`                       | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Hooks de Plugin           | `api.on(...)`                                    | [Hooks de Plugin](/es/plugins/hooks)                                                  |
| Hooks de eventos internos   | `api.registerHook(...)`                          | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |
| Rutas HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/es/plugins/architecture-internals#gateway-http-routes)                |
| Subcomandos CLI        | `api.registerCli(...)`                           | [Puntos de entrada](/es/plugins/sdk-entrypoints)                                        |

Para ver la API de registro completa, consulta [Resumen del SDK](/es/plugins/sdk-overview#registration-api).

Los Plugins incluidos pueden usar `api.registerAgentToolResultMiddleware(...)` cuando
necesitan reescritura asíncrona del resultado de herramientas antes de que el modelo vea la salida. Declara los
runtimes objetivo en `contracts.agentToolResultMiddleware`, por ejemplo
`["pi", "codex"]`. Este es un punto de integración de confianza para Plugins incluidos; los
Plugins externos deberían preferir hooks normales de Plugin de OpenClaw salvo que OpenClaw amplíe una
política de confianza explícita para esta capacidad.

Si tu Plugin registra métodos RPC personalizados del gateway, mantenlos en un
prefijo específico del Plugin. Los espacios de nombres administrativos del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecen reservados y siempre resuelven a
`operator.admin`, incluso si un Plugin solicita un ámbito más limitado.

Semántica de guardias de hooks que conviene tener en cuenta:

- `before_tool_call`: `{ block: true }` es terminal y detiene los manejadores de prioridad inferior.
- `before_tool_call`: `{ block: false }` se trata como ausencia de decisión.
- `before_tool_call`: `{ requireApproval: true }` pausa la ejecución del agente y solicita la aprobación del usuario mediante la superposición de aprobación de exec, botones de Telegram, interacciones de Discord o el comando `/approve` en cualquier canal.
- `before_install`: `{ block: true }` es terminal y detiene los manejadores de prioridad inferior.
- `before_install`: `{ block: false }` se trata como ausencia de decisión.
- `message_sending`: `{ cancel: true }` es terminal y detiene los manejadores de prioridad inferior.
- `message_sending`: `{ cancel: false }` se trata como ausencia de decisión.
- `message_received`: prefiere el campo tipado `threadId` cuando necesites enrutamiento entrante por hilo/tema. Conserva `metadata` para extras específicos del canal.
- `message_sending`: prefiere los campos de enrutamiento tipados `replyToId` / `threadId` frente a claves de metadatos específicas del canal.

El comando `/approve` gestiona tanto aprobaciones de exec como de Plugin con un respaldo acotado: cuando no se encuentra un id de aprobación de exec, OpenClaw reintenta el mismo id a través de las aprobaciones del Plugin. El reenvío de aprobaciones de Plugin puede configurarse independientemente mediante `approvals.plugin` en la configuración.

Si la lógica personalizada de aprobaciones necesita detectar ese mismo caso de respaldo acotado,
prefiere `isApprovalNotFoundError` de `openclaw/plugin-sdk/error-runtime`
en lugar de buscar manualmente cadenas de expiración de aprobación.

Consulta [Hooks de Plugin](/es/plugins/hooks) para ver ejemplos y la referencia de hooks.

## Registrar herramientas de agente

Las herramientas son funciones tipadas que el LLM puede invocar. Pueden ser obligatorias (siempre
disponibles) u opcionales (activación voluntaria del usuario):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Los usuarios habilitan herramientas opcionales en la configuración:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Los nombres de herramientas no deben entrar en conflicto con herramientas del núcleo (los conflictos se omiten)
- Usa `optional: true` para herramientas con efectos secundarios o requisitos binarios adicionales
- Los usuarios pueden habilitar todas las herramientas de un Plugin añadiendo el id del Plugin a `tools.allow`

## Convenciones de importación

Importa siempre desde rutas específicas `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Para la referencia completa de subrutas, consulta [Resumen del SDK](/es/plugins/sdk-overview).

Dentro de tu Plugin, usa archivos barrel locales (`api.ts`, `runtime-api.ts`) para
importaciones internas; nunca importes tu propio Plugin a través de su ruta del SDK.

Para Plugins de proveedor, mantén los auxiliares específicos del proveedor en esos
barrels de raíz del paquete, salvo que el punto de integración sea realmente genérico. Ejemplos incluidos actuales:

- Anthropic: envoltorios de stream de Claude y auxiliares de `service_tier` / beta
- OpenAI: constructores de proveedor, auxiliares de modelos predeterminados, proveedores en tiempo real
- OpenRouter: constructor de proveedor más auxiliares de onboarding/configuración

Si un auxiliar solo es útil dentro de un único paquete de proveedor incluido, mantenlo en ese
punto de integración de raíz del paquete en lugar de promocionarlo a `openclaw/plugin-sdk/*`.

Algunos puntos de integración auxiliares generados `openclaw/plugin-sdk/<bundled-id>` siguen existiendo para
mantenimiento y compatibilidad de Plugins incluidos, por ejemplo
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trátalos como
superficies reservadas, no como el patrón predeterminado para nuevos Plugins de terceros.

## Lista de verificación previa al envío

<Check>**package.json** tiene metadatos `openclaw` correctos</Check>
<Check>El manifiesto **openclaw.plugin.json** está presente y es válido</Check>
<Check>El punto de entrada usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Todas las importaciones usan rutas específicas `plugin-sdk/<subpath>`</Check>
<Check>Las importaciones internas usan módulos locales, no autoimportaciones del SDK</Check>
<Check>Las pruebas pasan (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` pasa (Plugins dentro del repositorio)</Check>

## Pruebas de versión beta

1. Vigila las etiquetas de publicación de GitHub en [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) y suscríbete mediante `Watch` > `Releases`. Las etiquetas beta tienen este aspecto: `v2026.3.N-beta.1`. También puedes activar notificaciones para la cuenta oficial de OpenClaw en X [@openclaw](https://x.com/openclaw) para anuncios de publicación.
2. Prueba tu Plugin con la etiqueta beta en cuanto aparezca. La ventana antes de estable suele ser de solo unas horas.
3. Publica en el hilo de tu Plugin en el canal `plugin-forum` de Discord después de probar con `all good` o explicando qué se rompió. Si aún no tienes un hilo, crea uno.
4. Si algo se rompe, abre o actualiza una incidencia titulada `Beta blocker: <plugin-name> - <summary>` y aplica la etiqueta `beta-blocker`. Pon el enlace de la incidencia en tu hilo.
5. Abre un PR a `main` titulado `fix(<plugin-id>): beta blocker - <summary>` y enlaza la incidencia tanto en el PR como en tu hilo de Discord. Los colaboradores no pueden etiquetar PR, así que el título es la señal del lado del PR para mantenedores y automatización. Los bloqueadores con un PR se fusionan; los bloqueadores sin uno podrían publicarse igualmente. Los mantenedores vigilan estos hilos durante las pruebas beta.
6. El silencio significa verde. Si pierdes la ventana, tu corrección probablemente llegue en el siguiente ciclo.

## Siguientes pasos

<CardGroup cols={2}>
  <Card title="Plugins de canal" icon="messages-square" href="/es/plugins/sdk-channel-plugins">
    Crea un Plugin de canal de mensajería
  </Card>
  <Card title="Plugins de proveedor" icon="cpu" href="/es/plugins/sdk-provider-plugins">
    Crea un Plugin de proveedor de modelos
  </Card>
  <Card title="Resumen del SDK" icon="book-open" href="/es/plugins/sdk-overview">
    Referencia del mapa de importación y de la API de registro
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/es/plugins/sdk-runtime">
    TTS, búsqueda, subagente mediante api.runtime
  </Card>
  <Card title="Pruebas" icon="test-tubes" href="/es/plugins/sdk-testing">
    Utilidades y patrones de prueba
  </Card>
  <Card title="Manifiesto de Plugin" icon="file-json" href="/es/plugins/manifest">
    Referencia completa del esquema de manifiesto
  </Card>
</CardGroup>

## Relacionado

- [Arquitectura de Plugins](/es/plugins/architecture) — análisis interno en profundidad de la arquitectura
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugins
- [Manifiesto](/es/plugins/manifest) — formato del manifiesto de Plugin
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — crear Plugins de canal
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — crear Plugins de proveedor
