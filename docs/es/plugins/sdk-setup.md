---
read_when:
    - Estás agregando un asistente de configuración a un plugin
    - Necesitas entender setup-entry.ts frente a index.ts
    - Estás definiendo esquemas de configuración de plugins o metadatos openclaw en package.json
sidebarTitle: Setup and Config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración y config de plugins
x-i18n:
    generated_at: "2026-04-06T03:10:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: eac2586516d27bcd94cc4c259fe6274c792b3f9938c7ddd6dbf04a6dbb988dc9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuración y config de plugins

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
  **¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que le indique al sistema de plugins qué
proporciona tu plugin:

**Plugin de canal:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin de proveedor / línea base de publicación en ClawHub:**

```json openclaw-clawhub-package.json
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

Si publicas el plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos de publicación canónicos están en
`docs/snippets/plugin-publish/`.

### Campos de `openclaw`

| Campo        | Tipo       | Descripción                                                                                         |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                      |
| `setupEntry` | `string`   | Entrada ligera solo para configuración (opcional)                                                   |
| `channel`    | `object`   | Metadatos de catálogo de canales para superficies de configuración, selector, inicio rápido y estado |
| `providers`  | `string[]` | IDs de proveedores registrados por este plugin                                                      |
| `install`    | `object`   | Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento al inicio                                                             |

### `openclaw.channel`

`openclaw.channel` son metadatos ligeros de paquete para el descubrimiento de canales y las
superficies de configuración antes de que se cargue el tiempo de ejecución.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta de selector/configuración cuando debe diferir de `label`.             |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canales y superficies de estado más completos. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.               |
| `docsLabel`                            | `string`   | Sobrescribe la etiqueta usada para los enlaces de documentación cuando debe diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                   |
| `order`                                | `number`   | Orden de clasificación en los catálogos de canales.                            |
| `aliases`                              | `string[]` | Alias adicionales de búsqueda para la selección del canal.                     |
| `preferOver`                           | `string[]` | IDs de plugins/canales de menor prioridad que este canal debe superar.         |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos de IU de canales.         |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces de documentación en superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración rápida de `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Requiere una vinculación explícita de cuenta incluso cuando solo existe una cuenta. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda por sesión al resolver destinos de anuncio para este canal. |

Ejemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` admite:

- `configured`: incluye el canal en superficies de listado configurado/estilo de estado
- `setup`: incluye el canal en selectores interactivos de configuración
- `docs`: marca el canal como orientado al público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Se prefiere
`exposure`.

### `openclaw.install`

`openclaw.install` son metadatos del paquete, no metadatos del manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación canónica de npm para flujos de instalación/actualización.          |
| `localPath`                  | `string`             | Ruta local de desarrollo o instalación integrada.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                   |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z`.                   |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins integrados se recuperen de fallos concretos de configuración obsoleta. |

Si se establece `minHostVersion`, tanto la instalación como la carga del registro de manifiestos la
aplican. Los hosts más antiguos omiten el plugin; las cadenas de versión no válidas se rechazan.

`allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es
solo para recuperación limitada de plugins integrados, de modo que la reinstalación/configuración pueda reparar restos conocidos de actualizaciones, como una ruta faltante del plugin integrado o una entrada obsoleta `channels.<id>`
para ese mismo plugin. Si la configuración está rota por motivos no relacionados, la instalación
sigue fallando de forma segura e indica al operador que ejecute `openclaw doctor --fix`.

### Carga completa diferida

Los plugins de canal pueden optar por la carga diferida con:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio
previa a la escucha, incluso para canales ya configurados. La entrada completa se carga después de que el
gateway empieza a escuchar.

<Warning>
  Habilita la carga diferida solo cuando tu `setupEntry` registra todo lo que el
  gateway necesita antes de empezar a escuchar (registro de canal, rutas HTTP,
  métodos del gateway). Si la entrada completa es propietaria de capacidades de inicio obligatorias, mantén
  el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC del gateway, mantenlos en un
prefijo específico del plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven
a `operator.admin`.

## Manifiesto del plugin

Todo plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete.
OpenClaw lo usa para validar la configuración sin ejecutar código del plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Para plugins de canal, agrega `kind` y `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Incluso los plugins sin configuración deben incluir un esquema. Un esquema vacío es válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulta [Plugin Manifest](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para Skills es para Skills. Los paquetes de plugins
siempre deben usar `clawhub package publish`.

## Entrada de configuración

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que
OpenClaw carga cuando solo necesita superficies de configuración (incorporación, reparación de configuración,
inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de tiempo de ejecución (bibliotecas criptográficas, registros de CLI,
servicios en segundo plano) durante los flujos de configuración.

**Cuándo OpenClaw usa `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de configuración/incorporación
- El canal está habilitado pero sin configurar
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto plugin del canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP necesaria antes de que el gateway empiece a escuchar
- Cualquier método del gateway necesario durante el inicio

Esos métodos del gateway de inicio deben seguir evitando espacios de nombres administrativos reservados del núcleo
como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Imports pesados de tiempo de ejecución (cripto, SDKs)
- Métodos del gateway necesarios solo después del inicio

### Imports de ayudantes de configuración reducidos

Para rutas activas solo de configuración, prefiere las uniones reducidas de ayudantes de configuración frente a la unión más amplia
`plugin-sdk/setup` cuando solo necesitas parte de la superficie de configuración:

| Ruta de importación                 | Úsala para                                                                              | Exportaciones clave                                                                                                                                                                                                                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | ayudantes de tiempo de ejecución en tiempo de configuración que siguen disponibles en `setupEntry` / inicio diferido del canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuenta conscientes del entorno                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                           |
| `plugin-sdk/setup-tools`           | ayudantes de CLI/instalación/archivado/documentación para configuración                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Usa la unión más amplia `plugin-sdk/setup` cuando quieras la caja completa de herramientas compartidas de configuración,
incluidos ayudantes de parches de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de configuración siguen siendo seguros para importación en rutas activas. Su búsqueda de superficie de contrato integrada
para promoción de cuenta única es diferida, por lo que importar
`plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de superficies de contrato integradas antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de una sola cuenta a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los valores promovidos
con alcance de cuenta a `accounts.default`.

Los canales integrados pueden reducir o sobrescribir esa promoción a través de su superficie de contrato
de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la
  cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del
  canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promovidos

Matrix es el ejemplo integrado actual. Si ya existe exactamente una cuenta de Matrix con nombre,
o si `defaultAccount` apunta a una clave no canónica existente como `Ops`,
la promoción conserva esa cuenta en lugar de crear una nueva entrada
`accounts.default`.

## Esquema de configuración

La configuración del plugin se valida frente al JSON Schema de tu manifiesto. Los usuarios
configuran plugins mediante:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Tu plugin recibe esta configuración como `api.pluginConfig` durante el registro.

Para configuración específica del canal, usa en su lugar la sección de configuración del canal:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Crear esquemas de configuración de canal

Usa `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un
esquema Zod en el envoltorio `ChannelConfigSchema` que OpenClaw valida:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Asistentes de configuración

Los plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`.
El asistente es un objeto `ChannelSetupWizard` en `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

El tipo `ChannelSetupWizard` admite `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` y más.
Consulta los paquetes de plugins integrados (por ejemplo, el plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para prompts de lista permitida de mensajes directos que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiere los ayudantes compartidos de configuración
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas adicionales opcionales,
prefiere `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de rehacer a mano el mismo objeto `status` en
cada plugin.

Para superficies de configuración opcionales que solo deben aparecer en ciertos contextos, usa
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` también expone los constructores de nivel inferior
`createOptionalChannelSetupAdapter(...)` y
`createOptionalChannelSetupWizard(...)` cuando solo necesitas una de las dos mitades de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla de forma segura en escrituras reales de configuración. Reutiliza un mensaje de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y añade un enlace de documentación cuando `docsPath` está
establecido.

Para IU de configuración respaldadas por binarios, prefiere los ayudantes delegados compartidos en lugar de
copiar el mismo pegamento de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas,
  sugerencias, puntuaciones y detección binaria
- `createCliPathTextInput(...)` para entradas de texto respaldadas por ruta
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar de forma diferida a
  un asistente completo más pesado
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión de `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publícalos en [ClawHub](/es/tools/clawhub) o npm, luego instálalos:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero con ClawHub y recurre a npm automáticamente. También puedes
forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una sobrescritura equivalente `npm:`. Usa la especificación normal del paquete npm cuando
quieras la ruta de npm después del fallback de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colócalos bajo el árbol de workspace de plugins integrados y se descubrirán automáticamente
durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones provenientes de npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantén los árboles de dependencias del plugin en JS/TS puro y evita paquetes que requieran compilaciones en `postinstall`.
</Info>

## Relacionado

- [SDK Entry Points](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Plugin Manifest](/es/plugins/manifest) -- referencia completa del esquema del manifiesto
- [Building Plugins](/es/plugins/building-plugins) -- guía paso a paso para comenzar
