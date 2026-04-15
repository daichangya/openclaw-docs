---
read_when:
    - Está agregando un asistente de configuración a un Plugin
    - Necesita comprender `setup-entry.ts` frente a `index.ts`
    - Está definiendo esquemas de configuración del Plugin o metadatos de `openclaw` en `package.json`
sidebarTitle: Setup and Config
summary: Asistentes de configuración, `setup-entry.ts`, esquemas de configuración y metadatos de `package.json`
title: Configuración e instalación del Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuración e instalación del Plugin

Referencia para el empaquetado de plugins (metadatos de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
  **¿Busca una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Su `package.json` necesita un campo `openclaw` que indique al sistema de plugins lo
que proporciona su Plugin:

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

**Plugin de proveedor / referencia base para publicación en ClawHub:**

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

Si publica el Plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos canónicos de publicación se encuentran en
`docs/snippets/plugin-publish/`.

### Campos de `openclaw`

| Campo        | Tipo       | Descripción                                                                                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                          |
| `setupEntry` | `string`   | Entrada ligera solo para configuración (opcional)                                                       |
| `channel`    | `object`   | Metadatos del catálogo de canales para superficies de configuración, selector, inicio rápido y estado   |
| `providers`  | `string[]` | ID de proveedores registrados por este Plugin                                                           |
| `install`    | `object`   | Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento de inicio                                                                 |

### `openclaw.channel`

`openclaw.channel` son metadatos ligeros del paquete para el descubrimiento de canales y las
superficies de configuración antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta del selector/configuración cuando debe diferir de `label`.            |
| `detailLabel`                          | `string`   | Etiqueta de detalle secundaria para catálogos de canales y superficies de estado más completos. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.               |
| `docsLabel`                            | `string`   | Etiqueta de reemplazo usada para enlaces de documentación cuando debe diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción breve para onboarding/catálogo.                                    |
| `order`                                | `number`   | Orden de clasificación en los catálogos de canales.                            |
| `aliases`                              | `string[]` | Alias de búsqueda adicionales para la selección del canal.                     |
| `preferOver`                           | `string[]` | ID de plugins/canales de menor prioridad que este canal debe superar.          |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos de UI de canales.         |
| `selectionDocsPrefix`                  | `string`   | Texto de prefijo antes de los enlaces a documentación en las superficies de selección. |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con markdown para decisiones de formato de salida. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para configuración, listas configuradas y superficies de documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Incluye este canal en el flujo estándar de configuración rápida `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Requiere una vinculación explícita de cuenta incluso cuando solo existe una cuenta. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesión al resolver objetivos de anuncio para este canal. |

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

- `configured`: incluye el canal en superficies de listado de estilo configurado/estado
- `setup`: incluye el canal en selectores interactivos de configuración/configurar
- `docs`: marca el canal como orientado al público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como alias heredados. Prefiera
`exposure`.

### `openclaw.install`

`openclaw.install` son metadatos del paquete, no metadatos del manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                     |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación canónica de npm para flujos de instalación/actualización.          |
| `localPath`                  | `string`             | Ruta de instalación local de desarrollo o empaquetada.                            |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                   |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw con el formato `>=x.y.z`.                   |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de plugins empaquetados se recuperen de fallos específicos de configuración obsoleta. |

Si se establece `minHostVersion`, tanto la instalación como la carga del registro de manifiestos la
aplican. Los hosts más antiguos omiten el Plugin; las cadenas de versión no válidas se rechazan.

`allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es
solo para recuperación limitada de plugins empaquetados, para que la reinstalación/configuración pueda reparar restos conocidos de actualizaciones, como una ruta faltante del plugin empaquetado o una entrada obsoleta `channels.<id>`
de ese mismo Plugin. Si la configuración está rota por motivos no relacionados, la instalación
sigue fallando de forma segura e indica al operador que ejecute `openclaw doctor --fix`.

### Carga completa diferida

Los Plugins de canal pueden optar por la carga diferida con:

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de inicio previa a la escucha,
incluso para canales ya configurados. La entrada completa se carga después de que el
Gateway empiece a escuchar.

<Warning>
  Habilite la carga diferida solo cuando su `setupEntry` registre todo lo que el
  Gateway necesita antes de que empiece a escuchar (registro del canal, rutas HTTP,
  métodos del Gateway). Si la entrada completa contiene capacidades de inicio requeridas, mantenga
  el comportamiento predeterminado.
</Warning>

Si su entrada de configuración/completa registra métodos RPC del Gateway, manténgalos en un
prefijo específico del Plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen perteneciendo al núcleo y siempre se resuelven
a `operator.admin`.

## Manifiesto del Plugin

Todo Plugin nativo debe incluir un `openclaw.plugin.json` en la raíz del paquete.
OpenClaw usa esto para validar la configuración sin ejecutar código del Plugin.

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

Para Plugins de canal, agregue `kind` y `channels`:

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

Incluso los Plugins sin configuración deben incluir un esquema. Un esquema vacío es válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Manifiesto del Plugin](/es/plugins/manifest) para ver la referencia completa del esquema.

## Publicación en ClawHub

Para los paquetes de Plugin, use el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para Skills es para Skills. Los paquetes de Plugin
siempre deben usar `clawhub package publish`.

## Entrada de configuración

El archivo `setup-entry.ts` es una alternativa ligera a `index.ts` que
OpenClaw carga cuando solo necesita superficies de configuración (onboarding, reparación de configuración,
inspección de canales deshabilitados).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Esto evita cargar código pesado de runtime (bibliotecas de criptografía, registros de CLI,
servicios en segundo plano) durante los flujos de configuración.

Los canales empaquetados del workspace que mantienen exportaciones seguras para la configuración en módulos auxiliares pueden
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en lugar de
`defineSetupPluginEntry(...)`. Ese contrato empaquetado también admite una exportación opcional
`runtime` para que el cableado del runtime en tiempo de configuración siga siendo ligero y explícito.

**Cuándo OpenClaw usa `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado, pero necesita superficies de configuración/onboarding
- El canal está habilitado, pero no está configurado
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto del Plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP necesaria antes de que el Gateway empiece a escuchar
- Cualquier método del Gateway necesario durante el inicio

Esos métodos del Gateway de inicio deben seguir evitando los espacios de nombres administrativos reservados del núcleo
como `config.*` o `update.*`.

**Qué NO debe incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Importaciones pesadas de runtime (crypto, SDK)
- Métodos del Gateway necesarios solo después del inicio

### Importaciones limitadas de ayudantes de configuración

Para rutas activas que solo son de configuración, prefiera las interfaces limitadas de ayudantes de configuración en lugar de la interfaz más amplia
`plugin-sdk/setup` cuando solo necesite una parte de la superficie de configuración:

| Ruta de importación                 | Úsela para                                                                               | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`          | ayudantes de runtime en tiempo de configuración que siguen disponibles en `setupEntry` / inicio diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`  | adaptadores de configuración de cuenta con reconocimiento del entorno                    | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`            | ayudantes de CLI/archivo/docs para configuración e instalación                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Use la interfaz más amplia `plugin-sdk/setup` cuando quiera la caja de herramientas compartida completa de configuración,
incluidos ayudantes de parcheo de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parcheo de configuración siguen siendo seguros para rutas activas al importar. Su búsqueda de la superficie de contrato de promoción de cuenta única empaquetada es diferida, por lo que importar
`plugin-sdk/setup-runtime` no carga de forma anticipada el descubrimiento de la superficie de contrato empaquetada antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de cuenta única a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover los
valores promovidos con ámbito de cuenta a `accounts.default`.

Los canales empaquetados pueden limitar o sobrescribir esa promoción mediante su superficie de contrato
de configuración:

- `singleAccountKeysToMove`: claves adicionales de nivel superior que deben moverse a la
  cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz
  del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promovidos

Matrix es el ejemplo empaquetado actual. Si ya existe exactamente una cuenta de Matrix con nombre,
o si `defaultAccount` apunta a una clave no canónica existente
como `Ops`, la promoción conserva esa cuenta en lugar de crear una nueva entrada
`accounts.default`.

## Esquema de configuración

La configuración del Plugin se valida con el esquema JSON del manifiesto. Los usuarios
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

Su Plugin recibe esta configuración como `api.pluginConfig` durante el registro.

Para configuración específica de canal, use en su lugar la sección de configuración del canal:

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

### Creación de esquemas de configuración de canal

Use `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para convertir un
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

Los Plugins de canal pueden proporcionar asistentes de configuración interactivos para `openclaw onboard`.
El asistente es un objeto `ChannelSetupWizard` en el `ChannelPlugin`:

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
Consulte los paquetes de plugins empaquetados (por ejemplo, el Plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para solicitudes de lista de permitidos de MD que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiera los ayudantes compartidos de configuración
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas
adicionales opcionales, prefiera `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de crear manualmente el mismo objeto `status` en
cada plugin.

Para superficies de configuración opcionales que solo deben aparecer en ciertos contextos, use
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
`createOptionalChannelSetupWizard(...)` cuando solo necesita una de las dos mitades de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla de forma segura en escrituras reales de configuración. Reutiliza un mismo mensaje de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y añade un enlace a la documentación cuando `docsPath` está
establecido.

Para interfaces de configuración respaldadas por binarios, prefiera los ayudantes compartidos delegados en lugar de
copiar la misma lógica de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas,
  sugerencias, puntuaciones y detección de binarios
- `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar a
  un asistente completo más pesado de forma diferida
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publique en [ClawHub](/es/tools/clawhub) o npm, luego instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero con ClawHub y recurre a npm automáticamente. También puede
forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

No existe una anulación equivalente `npm:`. Use la especificación normal de paquete npm cuando
quiera la ruta de npm después del respaldo de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colóquelos bajo el árbol de workspace de plugins empaquetados y se descubrirán automáticamente
durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones obtenidas desde npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantenga el árbol de dependencias del plugin
  en JS/TS puro y evite paquetes que requieran compilaciones en `postinstall`.
</Info>

## Relacionado

- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) -- `definePluginEntry` y `defineChannelPluginEntry`
- [Manifiesto del Plugin](/es/plugins/manifest) -- referencia completa del esquema del manifiesto
- [Creación de Plugins](/es/plugins/building-plugins) -- guía paso a paso para comenzar
