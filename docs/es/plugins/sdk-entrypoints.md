---
read_when:
    - Necesitas la firma de tipo exacta de `definePluginEntry` o `defineChannelPluginEntry`
    - Quieres entender el modo de registro (full frente a setup frente a metadatos de CLI)
    - Buscas opciones de puntos de entrada
sidebarTitle: Entry Points
summary: Referencia de `definePluginEntry`, `defineChannelPluginEntry` y `defineSetupPluginEntry`
title: Puntos de entrada de Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Cada Plugin exporta un objeto de entrada predeterminado. El SDK proporciona tres ayudantes para
crearlos.

Para Plugins instalados, `package.json` debe apuntar la carga en tiempo de ejecución al
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

`extensions` y `setupEntry` siguen siendo entradas de origen válidas para desarrollo
en espacio de trabajo y checkout de git. `runtimeExtensions` y `runtimeSetupEntry` se prefieren
cuando OpenClaw carga un paquete instalado y permiten que los paquetes npm eviten la compilación
de TypeScript en tiempo de ejecución. Si un paquete instalado solo declara una entrada de origen TypeScript,
OpenClaw usará un par `dist/*.js` compilado correspondiente cuando
exista, y luego recurrirá al origen TypeScript.

Todas las rutas de entrada deben permanecer dentro del directorio del paquete del Plugin. Las entradas de tiempo de ejecución
y los pares inferidos de JavaScript compilado no hacen válida una ruta de origen `extensions` o
`setupEntry` que escape del paquete.

<Tip>
  **¿Buscas una guía paso a paso?** Consulta [Plugins de canal](/es/plugins/sdk-channel-plugins)
  o [Plugins de proveedor](/es/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Importación:** `openclaw/plugin-sdk/plugin-entry`

Para Plugins de proveedor, Plugins de herramientas, Plugins de Hook y cualquier cosa que **no** sea
un canal de mensajería.

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

| Campo          | Tipo                                                             | Obligatorio | Predeterminado      |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Sí          | —                   |
| `name`         | `string`                                                         | Sí          | —                   |
| `description`  | `string`                                                         | Sí          | —                   |
| `kind`         | `string`                                                         | No          | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sí          | —                   |

- `id` debe coincidir con tu manifiesto `openclaw.plugin.json`.
- `kind` es para ranuras exclusivas: `"memory"` o `"context-engine"`.
- `configSchema` puede ser una función para evaluación diferida.
- OpenClaw resuelve y memoiza ese esquema en el primer acceso, así que los constructores de esquemas costosos
  solo se ejecutan una vez.

## `defineChannelPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Envuelve `definePluginEntry` con cableado específico de canal. Llama automáticamente a
`api.registerChannel({ plugin })`, expone una interfaz opcional de metadatos de CLI de ayuda raíz
y controla `registerFull` según el modo de registro.

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

| Campo                 | Tipo                                                             | Obligatorio | Predeterminado      |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Sí          | —                   |
| `name`                | `string`                                                         | Sí          | —                   |
| `description`         | `string`                                                         | Sí          | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Sí          | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No          | Esquema de objeto vacío |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No          | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No          | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No          | —                   |

- `setRuntime` se llama durante el registro para que puedas almacenar la referencia de tiempo de ejecución
  (normalmente mediante `createPluginRuntimeStore`). Se omite durante la captura
  de metadatos de CLI.
- `registerCliMetadata` se ejecuta durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` y
  `api.registrationMode === "full"`.
  Úsalo como lugar canónico para descriptores CLI propiedad del canal, de modo que la ayuda raíz
  no active el canal, las instantáneas de descubrimiento incluyan metadatos estáticos de comandos,
  y el registro normal de comandos CLI siga siendo compatible con cargas completas del Plugin.
- El registro de descubrimiento no activa, pero no está libre de importaciones. OpenClaw puede
  evaluar la entrada del Plugin de confianza y el módulo del Plugin de canal para construir la
  instantánea, así que mantén las importaciones de nivel superior libres de efectos secundarios y pon sockets,
  clientes, workers y servicios detrás de rutas exclusivas de `"full"`.
- `registerFull` solo se ejecuta cuando `api.registrationMode === "full"`. Se omite
  durante la carga solo de setup.
- Al igual que `definePluginEntry`, `configSchema` puede ser una fábrica diferida y OpenClaw
  memoiza el esquema resuelto en el primer acceso.
- Para comandos CLI raíz propiedad de un Plugin, prefiere `api.registerCli(..., { descriptors: [...] })`
  cuando quieras que el comando siga cargándose de forma diferida sin desaparecer del
  árbol de análisis de la CLI raíz. Para Plugins de canal, prefiere registrar esos descriptores
  desde `registerCliMetadata(...)` y mantén `registerFull(...)` centrado en trabajo exclusivo del tiempo de ejecución.
- Si `registerFull(...)` también registra métodos RPC del Gateway, mantenlos en un
  prefijo específico del Plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) siempre se fuerzan a
  `operator.admin`.

## `defineSetupPluginEntry`

**Importación:** `openclaw/plugin-sdk/channel-core`

Para el archivo ligero `setup-entry.ts`. Devuelve solo `{ plugin }` sin
cableado de tiempo de ejecución ni CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw carga esto en lugar de la entrada completa cuando un canal está deshabilitado,
sin configurar o cuando la carga diferida está habilitada. Consulta
[Setup y configuración](/es/plugins/sdk-setup#setup-entry) para saber cuándo importa esto.

En la práctica, combina `defineSetupPluginEntry(...)` con las familias de ayudantes
estrechos de setup:

- `openclaw/plugin-sdk/setup-runtime` para ayudantes de setup seguros en tiempo de ejecución, como
  adaptadores de parche de setup seguros para importación, salida de notas de búsqueda,
  `promptResolvedAllowFrom`, `splitSetupEntries` y proxies delegados de setup
- `openclaw/plugin-sdk/channel-setup` para superficies de setup de instalación opcional
- `openclaw/plugin-sdk/setup-tools` para ayudantes CLI/de archivo/de documentación de setup/instalación

Mantén los SDK pesados, el registro de CLI y los servicios de tiempo de ejecución de larga duración en la entrada completa.

Los canales incluidos del espacio de trabajo que dividen las superficies de setup y tiempo de ejecución pueden usar
`defineBundledChannelSetupEntry(...)` desde
`openclaw/plugin-sdk/channel-entry-contract`. Ese contrato permite que la
entrada de setup conserve exportaciones seguras de plugin/secretos para setup mientras sigue exponiendo un
setter de tiempo de ejecución:

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

Usa ese contrato incluido solo cuando los flujos de setup realmente necesiten un setter ligero de tiempo de ejecución
antes de que se cargue la entrada completa del canal.

## Modo de registro

`api.registrationMode` indica a tu Plugin cómo fue cargado:

| Modo              | Cuándo                              | Qué registrar                                                                                                           |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Inicio normal del Gateway           | Todo                                                                                                                    |
| `"discovery"`     | Descubrimiento de capacidades de solo lectura | Registro de canal más descriptores CLI estáticos; el código de entrada puede cargarse, pero omite sockets, workers, clientes y servicios |
| `"setup-only"`    | Canal deshabilitado/sin configurar  | Solo registro de canal                                                                                                  |
| `"setup-runtime"` | Flujo de setup con tiempo de ejecución disponible | Registro de canal más solo el tiempo de ejecución ligero necesario antes de cargar la entrada completa            |
| `"cli-metadata"`  | Ayuda raíz / captura de metadatos de CLI | Solo descriptores CLI                                                                                               |

`defineChannelPluginEntry` maneja esta división automáticamente. Si usas
`definePluginEntry` directamente para un canal, comprueba tú mismo el modo:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

El modo discovery crea una instantánea del registro que no activa nada. Aun así, puede evaluar
la entrada del Plugin y el objeto del Plugin de canal para que OpenClaw pueda registrar
capacidades del canal y descriptores CLI estáticos. Trata la evaluación del módulo en discovery como
de confianza pero ligera: sin clientes de red, subprocesos, listeners, conexiones a base de datos,
workers en segundo plano, lecturas de credenciales ni otros efectos secundarios activos de tiempo de ejecución en el nivel superior.

Trata `"setup-runtime"` como la ventana en la que las superficies de inicio solo de setup deben
existir sin volver a entrar en el tiempo de ejecución completo del canal incluido. Son adecuados
el registro de canal, rutas HTTP seguras para setup, métodos Gateway seguros para setup y
ayudantes delegados de setup. Los servicios pesados en segundo plano, registradores de CLI y
arranques de SDK de proveedor/cliente siguen perteneciendo a `"full"`.

Específicamente para registradores de CLI:

- usa `descriptors` cuando el registrador sea dueño de uno o más comandos raíz y quieras
  que OpenClaw cargue diferidamente el módulo CLI real en la primera invocación
- asegúrate de que esos descriptores cubran cada raíz de comando de nivel superior expuesta por el
  registrador
- mantén los nombres de comandos de descriptor con letras, números, guion y guion bajo, empezando por una letra o número; OpenClaw rechaza nombres de descriptor fuera de
  esa forma y elimina secuencias de control del terminal de las descripciones antes de
  renderizar la ayuda
- usa solo `commands` para rutas de compatibilidad ansiosas

## Formas de Plugin

OpenClaw clasifica los Plugins cargados según su comportamiento de registro:

| Forma                 | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un tipo de capacidad (p. ej., solo proveedor)      |
| **hybrid-capability** | Varios tipos de capacidad (p. ej., proveedor + voz) |
| **hook-only**         | Solo Hooks, sin capacidades                        |
| **non-capability**    | Herramientas/comandos/servicios pero sin capacidades |

Usa `openclaw plugins inspect <id>` para ver la forma de un Plugin.

## Relacionado

- [Resumen del SDK](/es/plugins/sdk-overview) — API de registro y referencia de subrutas
- [Ayudantes de tiempo de ejecución](/es/plugins/sdk-runtime) — `api.runtime` y `createPluginRuntimeStore`
- [Setup y configuración](/es/plugins/sdk-setup) — manifiesto, entrada de setup, carga diferida
- [Plugins de canal](/es/plugins/sdk-channel-plugins) — creación del objeto `ChannelPlugin`
- [Plugins de proveedor](/es/plugins/sdk-provider-plugins) — registro de proveedores y Hooks
