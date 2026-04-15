---
read_when:
    - Necesita la firma de tipo exacta de `definePluginEntry` o `defineChannelPluginEntry`
    - Quiere entender el modo de registro (completo vs configuración vs metadatos de CLI)
    - Está buscando opciones de punto de entrada
sidebarTitle: Entry Points
summary: Referencia de `definePluginEntry`, `defineChannelPluginEntry` y `defineSetupPluginEntry`
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Puntos de entrada de Plugin

Cada plugin exporta un objeto de entrada predeterminado. El SDK proporciona tres helpers para crearlos.

<Tip>
  **¿Busca una guía paso a paso?** Consulte [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins) para obtener guías paso a paso.
</Tip>

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedor, plugins de herramientas, plugins de hooks y cualquier cosa que **no** sea un canal de mensajería.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obligatorio | Predeterminado       |
| -------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`           | `string`                                                         | Sí          | —                    |
| `name`         | `string`                                                         | Sí          | —                    |
| `description`  | `string`                                                         | Sí          | —                    |
| `kind`         | `string`                                                         | No          | —                    |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | —                    |

- `id` debe coincidir con su manifiesto `openclaw.plugin.json`.
- `kind` es para ranuras exclusivas: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoiza ese esquema en el primer acceso, por lo que los constructores de esquemas costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico de canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una costura opcional de metadatos de CLI de ayuda raíz
y condiciona `registerFull` según el modo de registro.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obligatorio | Predeterminado       |
| --------------------- | ---------------------------------------------------------------- | ----------- | -------------------- |
| `id`                  | `string`                                                         | Sí          | —                    |
| `name`                | `string`                                                         | Sí          | —                    |
| `description`         | `string`                                                         | Sí          | —                    |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | —                    |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | —                    |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | —                    |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | —                    |

- `setRuntime` se llama durante el registro para que pueda almacenar la referencia del runtime
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura
  de metadatos de CLI.
- `registerCliMetadata` se ejecuta tanto durante `api.registrationMode === "cli-metadata"`
  como durante `api.registrationMode === "full"`.
  Úselo como el lugar canónico para descriptores de CLI propiedad del canal, de modo que la ayuda raíz
  permanezca sin activación mientras el registro normal de comandos de CLI sigue siendo compatible
  con las cargas completas de plugins.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoiza el esquema resuelto en el primer acceso.
- Para comandos de CLI raíz propiedad del plugin, prefiera `api.registerCli(..., { descriptors: [...] })`
  cuando quiera que el comando permanezca con carga diferida sin desaparecer del
  árbol de análisis de la CLI raíz. Para plugins de canal, prefiera registrar esos descriptores
  desde `registerCliMetadata(...)` y mantenga `registerFull(...)` enfocado en trabajo exclusivo del runtime.
- Si `registerFull(...)` también registra métodos RPC de Gateway, manténgalos en un
  prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
cableado de runtime ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulte
[Configuración y config](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combine `defineSetupPluginEntry(...)` con las familias
de helpers de configuración estrechos:

- `openclaw/plugin-sdk/setup-runtime` para helpers de configuración seguros para runtime, como
  adaptadores de parches de configuración seguros para importación, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para helpers de CLI/archivo/docs de configuración e instalación

Mantenga los SDK pesados, el registro de CLI y los servicios de runtime de larga duración en la entrada completa.

Los canales de workspace empaquetados que dividen las superficies de configuración y runtime pueden usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración conserve exportaciones de plugin/secrets seguras para configuración mientras sigue exponiendo un
setter de runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Use ese contrato empaquetado solo cuando los flujos de configuración realmente necesiten un setter de runtime ligero
antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` indica a su plugin cómo se cargó:

| Modo              | Cuándo                           | Qué registrar                                                                            |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal de Gateway         | Todo                                                                                     |
| `"setup-only"`    | Canal deshabilitado/sin configurar | Solo registro del canal                                                                  |
| `"setup-runtime"` | Flujo de configuración con runtime disponible | Registro del canal más solo el runtime ligero necesario antes de que se cargue la entrada completa |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos de CLI | Solo descriptores de CLI                                                                 |

`defineChannelPluginEntry` maneja esta división automáticamente. Si usa
`definePluginEntry` directamente para un canal, compruebe usted mismo el modo:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Trate `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en el runtime completo del canal empaquetado. Buenos casos son
el registro del canal, rutas HTTP seguras para configuración, métodos de Gateway seguros para configuración y
helpers de configuración delegados. Los servicios pesados en segundo plano, los registradores de CLI
y los arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para los registradores de CLI específicamente:

- use `descriptors` cuando el registrador posea uno o más comandos raíz y
  quiera que OpenClaw cargue de forma diferida el módulo CLI real en la primera invocación
- asegúrese de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- use solo `commands` para rutas de compatibilidad con carga anticipada

## Formas de plugin

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)      |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios pero sin capacidades |

Use `openclaw plugins inspect <id>` para ver la forma de un plugin.

## Relacionado

- [Descripción general del SDK](/es/plugins/sdk-overview) — API de registro y referencia de subrutas
- [Helpers de runtime](/es/plugins/sdk-runtime) — `api.runtime` y `createPluginRuntimeStore`
- [Configuración y config](/es/plugins/sdk-setup) — manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — registro de proveedores y hooks
