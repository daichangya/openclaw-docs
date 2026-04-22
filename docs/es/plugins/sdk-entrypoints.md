---
read_when:
    - Necesitas la firma de tipo exacta de `definePluginEntry` o `defineChannelPluginEntry`
    - Quieres entender el modo de registro (completo frente a configuración frente a metadatos de CLI)
    - Estás consultando las opciones del punto de entrada
sidebarTitle: Entry Points
summary: Referencia de `definePluginEntry`, `defineChannelPluginEntry` y `defineSetupPluginEntry`
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Puntos de entrada de Plugin

Cada Plugin exporta un objeto de entrada predeterminado. El SDK ofrece tres asistentes para
crearlos.

Para plugins instalados, `package.json` debe apuntar la carga en tiempo de ejecución a
JavaScript compilado cuando esté disponible:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` y `setupEntry` siguen siendo entradas de código fuente válidas para desarrollo
en workspace y checkout de git. `runtimeExtensions` y `runtimeSetupEntry` son las opciones preferidas
cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la compilación
de TypeScript en tiempo de ejecución. Si un paquete instalado solo declara una entrada de fuente TypeScript,
OpenClaw usará un par compilado coincidente `dist/*.js` cuando exista, y luego
usará como respaldo la fuente TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del Plugin. Las entradas
de ejecución y los pares inferidos de JavaScript compilado no hacen válida una ruta de fuente
`extensions` o `setupEntry` que escape del paquete.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [plugins de canal](/es/plugins/sdk-channel-plugins)
  o [plugins de proveedor](/es/plugins/sdk-provider-plugins) para ver guías paso a paso.
</Tip>

## `definePluginEntry`

**Importar:** `openclaw/plugin-sdk/plugin-entry`

Para plugins de proveedor, plugins de herramientas, plugins de hooks y cualquier cosa que **no**
sea un canal de mensajería.

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

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para espacios exclusivos: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoriza ese esquema en el primer acceso, por lo que los generadores
  de esquemas costosos solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importar:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico del canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una costura opcional de metadatos CLI de ayuda raíz
y restringe `registerFull` según el modo de registro.

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

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de ejecución
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura
  de metadatos CLI.
- `registerCliMetadata` se ejecuta tanto durante `api.registrationMode === "cli-metadata"`
  como durante `api.registrationMode === "full"`.
  Úsalo como el lugar canónico para descriptores CLI propiedad del canal, para que la ayuda raíz
  siga siendo no activadora mientras el registro normal de comandos CLI sigue siendo compatible
  con cargas completas de plugins.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de configuración.
- Igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoriza el esquema resuelto en el primer acceso.
- Para comandos CLI raíz propiedad del Plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando permanezca con carga diferida sin desaparecer del
  árbol de análisis CLI raíz. Para plugins de canal, prefiere registrar esos descriptores
  desde `registerCliMetadata(...)` y mantén `registerFull(...)` centrado en trabajo exclusivo del tiempo de ejecución.
- Si `registerFull(...)` también registra métodos RPC del Gateway, mantenlos en un
  prefijo específico del Plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importar:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
cableado de ejecución ni de CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulta
[Configuración e instalación](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias estrechas de asistentes de configuración:

- `openclaw/plugin-sdk/setup-runtime` para asistentes de configuración seguros en tiempo de ejecución como
  adaptadores de parche de configuración seguros para importación, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies de configuración delegados
- `openclaw/plugin-sdk/channel-setup` para superficies de configuración de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para asistentes CLI/archivo/documentación de configuración/instalación

Mantén SDK pesados, registro de CLI y servicios de ejecución de larga duración en la entrada completa.

Los canales incluidos del workspace que dividen las superficies de configuración y de ejecución pueden usar
`defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en su lugar. Ese contrato permite que la
entrada de configuración conserve exportaciones de plugin/secrets seguras para configuración mientras sigue exponiendo un
setter de ejecución:

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

Usa ese contrato incluido solo cuando los flujos de configuración realmente necesiten un setter
de ejecución ligero antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` le indica a tu Plugin cómo fue cargado:

| Modo              | Cuándo                             | Qué registrar                                                                            |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del Gateway          | Todo                                                                                     |
| `"setup-only"`    | Canal deshabilitado/sin configurar | Solo registro del canal                                                                  |
| `"setup-runtime"` | Flujo de configuración con ejecución disponible | Registro del canal más solo la ejecución ligera necesaria antes de que se cargue la entrada completa |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos CLI | Solo descriptores CLI                                                                    |

`defineChannelPluginEntry` maneja esta división automáticamente. Si usas
`definePluginEntry` directamente para un canal, comprueba tú mismo el modo:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registros pesados solo de tiempo de ejecución
  api.registerService(/* ... */);
}
```

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de configuración deben
existir sin volver a entrar en la ejecución completa del canal incluido. Buenas opciones son
registro del canal, rutas HTTP seguras para configuración, métodos del Gateway seguros para configuración y
asistentes de configuración delegados. Los servicios pesados en segundo plano, registradores CLI
y arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Para los registradores CLI específicamente:

- usa `descriptors` cuando el registrador sea propietario de uno o más comandos raíz y quieras
  que OpenClaw cargue de forma diferida el módulo CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- usa solo `commands` para rutas de compatibilidad de carga anticipada

## Formas de plugins

OpenClaw clasifica los plugins cargados según su comportamiento de registro:

| Forma                | Descripción                                        |
| -------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej. solo proveedor)           |
| **hybrid-capability** | Varios tipos de capacidad (p. ej. proveedor + voz) |
| **hook-only**         | Solo hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios pero sin capacidades        |

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) — API de registro y referencia de subrutas
- [Asistentes de tiempo de ejecución](/es/plugins/sdk-runtime) — `api.runtime` y `createPluginRuntimeStore`
- [Configuración e instalación](/es/plugins/sdk-setup) — manifiesto, entrada de configuración, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — construcción del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — registro de proveedor y hooks
