---
read_when:
    - Estás añadiendo un asistente de configuración a un Plugin
    - Necesitas entender `setup-entry.ts` frente a `index.ts`
    - Estás definiendo esquemas de configuración de Plugins o metadatos `openclaw` en package.json
sidebarTitle: Setup and Config
summary: Asistentes de configuración, setup-entry.ts, esquemas de configuración y metadatos de package.json
title: Configuración y setup de Plugins
x-i18n:
    generated_at: "2026-04-25T13:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referencia para el empaquetado de Plugins (metadatos de `package.json`), manifiestos
(`openclaw.plugin.json`), entradas de configuración y esquemas de configuración.

<Tip>
  **¿Buscas una guía paso a paso?** Las guías prácticas cubren el empaquetado en contexto:
  [Plugins de canal](/es/plugins/sdk-channel-plugins#step-1-package-and-manifest) y
  [Plugins de proveedor](/es/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadatos del paquete

Tu `package.json` necesita un campo `openclaw` que indique al sistema de Plugins qué
proporciona tu Plugin:

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
      "blurb": "Descripción breve del canal."
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

Si publicas el Plugin externamente en ClawHub, esos campos `compat` y `build`
son obligatorios. Los fragmentos canónicos de publicación están en
`docs/snippets/plugin-publish/`.

### Campos de `openclaw`

| Campo        | Tipo       | Descripción                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Archivos de punto de entrada (relativos a la raíz del paquete)                                                              |
| `setupEntry` | `string`   | Entrada ligera solo para configuración (opcional)                                                                           |
| `channel`    | `object`   | Metadatos del catálogo del canal para superficies de configuración, selector, inicio rápido y estado                        |
| `providers`  | `string[]` | IDs de proveedor registrados por este Plugin                                                                                |
| `install`    | `object`   | Sugerencias de instalación: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Indicadores de comportamiento de arranque                                                                                   |

### `openclaw.channel`

`openclaw.channel` es metadato barato del paquete para superficies de descubrimiento y configuración
del canal antes de que se cargue el runtime.

| Campo                                  | Tipo       | Qué significa                                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canónico del canal.                                                         |
| `label`                                | `string`   | Etiqueta principal del canal.                                                  |
| `selectionLabel`                       | `string`   | Etiqueta de selector/configuración cuando debe diferir de `label`.             |
| `detailLabel`                          | `string`   | Etiqueta secundaria de detalle para catálogos de canal y superficies de estado más ricas. |
| `docsPath`                             | `string`   | Ruta de documentación para enlaces de configuración y selección.               |
| `docsLabel`                            | `string`   | Etiqueta de reemplazo usada para enlaces de documentación cuando debe diferir del ID del canal. |
| `blurb`                                | `string`   | Descripción breve de incorporación/catálogo.                                   |
| `order`                                | `number`   | Orden de clasificación en catálogos de canales.                                |
| `aliases`                              | `string[]` | Alias adicionales de búsqueda para selección de canal.                         |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de menor prioridad que este canal debe superar.            |
| `systemImage`                          | `string`   | Nombre opcional de icono/system-image para catálogos de UI del canal.          |
| `selectionDocsPrefix`                  | `string`   | Texto prefijo antes de enlaces de documentación en superficies de selección.   |
| `selectionDocsOmitLabel`               | `boolean`  | Muestra la ruta de documentación directamente en lugar de un enlace etiquetado en el texto de selección. |
| `selectionExtras`                      | `string[]` | Cadenas cortas adicionales añadidas al texto de selección.                     |
| `markdownCapable`                      | `boolean`  | Marca el canal como compatible con Markdown para decisiones de formato saliente. |
| `exposure`                             | `object`   | Controles de visibilidad del canal para superficies de configuración, listas configuradas y documentación. |
| `quickstartAllowFrom`                  | `boolean`  | Habilita este canal en el flujo estándar de configuración `allowFrom` de inicio rápido. |
| `forceAccountBinding`                  | `boolean`  | Requiere vinculación explícita de cuenta incluso cuando solo existe una cuenta. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefiere la búsqueda de sesión al resolver destinos de anuncio para este canal. |

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
      "blurb": "Integración de chat autohospedada basada en webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guía:",
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

- `configured`: incluir el canal en superficies de listado configurado/de tipo estado
- `setup`: incluir el canal en selectores interactivos de configuración
- `docs`: marcar el canal como público en superficies de documentación/navegación

`showConfigured` y `showInSetup` siguen siendo compatibles como aliases heredados. Prefiere
`exposure`.

### `openclaw.install`

`openclaw.install` es metadato de paquete, no metadato de manifiesto.

| Campo                        | Tipo                 | Qué significa                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificación npm canónica para flujos de instalación/actualización.            |
| `localPath`                  | `string`             | Ruta local de desarrollo o instalación incluida.                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | Fuente de instalación preferida cuando ambas están disponibles.                  |
| `minHostVersion`             | `string`             | Versión mínima compatible de OpenClaw en la forma `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Cadena esperada de integridad dist de npm, normalmente `sha512-...`, para instalaciones fijadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que los flujos de reinstalación de Plugins incluidos se recuperen de fallos específicos de configuración obsoleta. |

La incorporación interactiva también usa `openclaw.install` para superficies de instalación bajo demanda.
Si tu Plugin expone opciones de autenticación de proveedor o metadatos de configuración/catálogo de canal antes de que se cargue el runtime, la incorporación puede mostrar esa opción, pedir npm frente a instalación local, instalar o habilitar el Plugin y luego continuar el flujo seleccionado. Las opciones de incorporación por npm requieren metadatos de catálogo de confianza con un `npmSpec` de registro; las versiones exactas y `expectedIntegrity` son pines opcionales. Si `expectedIntegrity` está presente, los flujos de instalación/actualización lo aplican. Mantén los metadatos de “qué mostrar” en `openclaw.plugin.json` y los metadatos de “cómo instalarlo” en `package.json`.

Si se configura `minHostVersion`, tanto la instalación como la carga del registro de manifiestos la aplican.
Los hosts más antiguos omiten el Plugin; las cadenas de versión no válidas se rechazan.

Para instalaciones npm fijadas, mantén la versión exacta en `npmSpec` y añade la
integridad esperada del artefacto:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` no es una omisión general para configuraciones rotas. Es
para recuperación estrecha de Plugins incluidos únicamente, de modo que la reinstalación/configuración pueda reparar restos conocidos de actualizaciones, como una ruta faltante del Plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo Plugin. Si la configuración está rota por razones no relacionadas, la instalación sigue fallando en modo cerrado y le indica al operador que ejecute `openclaw doctor --fix`.

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

Cuando está habilitado, OpenClaw carga solo `setupEntry` durante la fase de arranque
previa a listen, incluso para canales ya configurados. La entrada completa se carga después de que el
gateway empiece a escuchar.

<Warning>
  Habilita la carga diferida solo cuando `setupEntry` registre todo lo que el
  gateway necesita antes de empezar a escuchar (registro del canal, rutas HTTP,
  métodos del gateway). Si la entrada completa es propietaria de capacidades de arranque necesarias, mantén
  el comportamiento predeterminado.
</Warning>

Si tu entrada de configuración/completa registra métodos RPC del gateway, mantenlos bajo un
prefijo específico del Plugin. Los espacios de nombres administrativos reservados del núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) siguen siendo propiedad del núcleo y siempre se resuelven
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

Para Plugins de canal, añade `kind` y `channels`:

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

Consulta [Plugin Manifest](/es/plugins/manifest) para la referencia completa del esquema.

## Publicación en ClawHub

Para paquetes de Plugins, usa el comando específico de ClawHub para paquetes:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

El alias heredado de publicación solo para Skills es para Skills. Los paquetes de Plugins
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

Esto evita cargar código pesado de runtime (bibliotecas criptográficas, registros de CLI,
servicios en segundo plano) durante los flujos de configuración.

Los canales incluidos del espacio de trabajo que mantienen exportaciones seguras para configuración en módulos auxiliares pueden
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` en lugar de
`defineSetupPluginEntry(...)`. Ese contrato incluido también admite una exportación
opcional `runtime` para que la conexión de runtime en tiempo de configuración siga siendo ligera y explícita.

**Cuándo usa OpenClaw `setupEntry` en lugar de la entrada completa:**

- El canal está deshabilitado pero necesita superficies de configuración/incorporación
- El canal está habilitado pero no configurado
- La carga diferida está habilitada (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Qué debe registrar `setupEntry`:**

- El objeto del Plugin de canal (mediante `defineSetupPluginEntry`)
- Cualquier ruta HTTP necesaria antes de que el gateway haga listen
- Cualquier método del gateway necesario durante el arranque

Esos métodos de gateway de arranque deben seguir evitando espacios de nombres administrativos reservados del núcleo
como `config.*` o `update.*`.

**Qué NO debería incluir `setupEntry`:**

- Registros de CLI
- Servicios en segundo plano
- Importaciones pesadas de runtime (crypto, SDKs)
- Métodos del gateway necesarios solo después del arranque

### Importaciones estrechas de helpers de configuración

Para rutas activas solo de configuración, prefiere las costuras estrechas de helpers de configuración frente al
barrel más amplio `plugin-sdk/setup` cuando solo necesites una parte de la superficie de configuración:

| Ruta de importación                 | Úsala para                                                                               | Exportaciones clave                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime en tiempo de configuración que siguen disponibles en `setupEntry` / arranque diferido de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de configuración de cuenta conscientes del entorno                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helpers de CLI/archivo/documentación para configuración/instalación                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Usa la costura más amplia `plugin-sdk/setup` cuando quieras toda la caja de herramientas compartida de configuración,
incluidos helpers de parche de configuración como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Los adaptadores de parche de configuración siguen siendo seguros para la ruta activa al importarlos. Su búsqueda de superficie contractual incluida para promoción de cuenta única es perezosa, por lo que importar
`plugin-sdk/setup-runtime` no carga anticipadamente el descubrimiento de superficie contractual incluida antes de que el adaptador se use realmente.

### Promoción de cuenta única propiedad del canal

Cuando un canal se actualiza desde una configuración de nivel superior de cuenta única a
`channels.<id>.accounts.*`, el comportamiento compartido predeterminado es mover
los valores promovidos con alcance de cuenta a `accounts.default`.

Los canales incluidos pueden acotar o sobrescribir esa promoción mediante su
superficie contractual de configuración:

- `singleAccountKeysToMove`: claves extra de nivel superior que deben moverse a la
  cuenta promovida
- `namedAccountPromotionKeys`: cuando ya existen cuentas con nombre, solo estas
  claves se mueven a la cuenta promovida; las claves compartidas de política/entrega permanecen en la raíz del canal
- `resolveSingleAccountPromotionTarget(...)`: elige qué cuenta existente
  recibe los valores promovidos

Matrix es el ejemplo incluido actual. Si ya existe exactamente una cuenta Matrix con nombre,
o si `defaultAccount` apunta a una clave existente no canónica como `Ops`,
la promoción conserva esa cuenta en lugar de crear una nueva
entrada `accounts.default`.

## Esquema de configuración

La configuración del Plugin se valida contra el esquema JSON de tu manifiesto. Los usuarios
configuran Plugins mediante:

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

Tu Plugin recibe esta configuración como `api.pluginConfig` durante el registro.

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

Usa `buildChannelConfigSchema` para convertir un esquema Zod en el
wrapper `ChannelConfigSchema` usado por artefactos de configuración propiedad del Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Para Plugins de terceros, el contrato de ruta fría sigue siendo el manifiesto del Plugin:
refleja el esquema JSON generado en `openclaw.plugin.json#channelConfigs` para
que la configuración del esquema, la configuración y las superficies de UI puedan inspeccionar `channels.<id>` sin
cargar código de runtime.

## Asistentes de configuración

Los Plugins de canal pueden proporcionar asistentes interactivos de configuración para `openclaw onboard`.
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
Consulta los paquetes de Plugins incluidos (por ejemplo el Plugin de Discord `src/channel.setup.ts`) para ver
ejemplos completos.

Para solicitudes de lista de permitidos de mensajes directos que solo necesitan el flujo estándar
`note -> prompt -> parse -> merge -> patch`, prefiere los helpers compartidos de configuración
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` y
`createNestedChannelParsedAllowFromPrompt(...)`.

Para bloques de estado de configuración de canal que solo varían por etiquetas, puntuaciones y líneas extra opcionales, prefiere `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` en lugar de crear a mano el mismo objeto `status` en
cada Plugin.

Para superficies opcionales de configuración que solo deben aparecer en ciertos contextos, usa
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Devuelve { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` también expone los constructores de nivel inferior
`createOptionalChannelSetupAdapter(...)` y
`createOptionalChannelSetupWizard(...)` cuando solo necesitas una mitad de
esa superficie de instalación opcional.

El adaptador/asistente opcional generado falla en modo cerrado en escrituras reales de configuración. Reutiliza un único mensaje de instalación requerida en `validateInput`,
`applyAccountConfig` y `finalize`, y añade un enlace de documentación cuando `docsPath` está configurado.

Para UIs de configuración respaldadas por binarios, prefiere los helpers delegados compartidos en lugar de
copiar el mismo pegamento de binario/estado en cada canal:

- `createDetectedBinaryStatus(...)` para bloques de estado que solo varían por etiquetas,
  sugerencias, puntuaciones y detección de binarios
- `createCliPathTextInput(...)` para entradas de texto respaldadas por rutas
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` y
  `createDelegatedResolveConfigured(...)` cuando `setupEntry` necesita reenviar a
  un asistente completo más pesado de forma perezosa
- `createDelegatedTextInputShouldPrompt(...)` cuando `setupEntry` solo necesita
  delegar una decisión `textInputs[*].shouldPrompt`

## Publicación e instalación

**Plugins externos:** publica en [ClawHub](/es/tools/clawhub) o npm y luego instala:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw intenta primero con ClawHub y usa npm como respaldo automáticamente. También puedes
forzar ClawHub explícitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Solo ClawHub
```

No existe una anulación equivalente `npm:`. Usa la especificación normal del paquete npm cuando
quieras la ruta npm después del respaldo de ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins dentro del repositorio:** colócalos bajo el árbol del espacio de trabajo de Plugins incluidos y se descubrirán automáticamente durante la compilación.

**Los usuarios pueden instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalaciones obtenidas desde npm, `openclaw plugins install` ejecuta
  `npm install --ignore-scripts` (sin scripts de ciclo de vida). Mantén los árboles de dependencias
  de Plugins en JS/TS puro y evita paquetes que requieran compilaciones `postinstall`.
</Info>

Los Plugins incluidos propiedad de OpenClaw son la única excepción de reparación al iniciar: cuando una
instalación empaquetada detecta uno habilitado por configuración del Plugin, configuración heredada del canal o
su manifiesto incluido habilitado por defecto, el inicio instala las dependencias de runtime
faltantes de ese Plugin antes de importarlo. Los Plugins de terceros no deberían depender de
instalaciones al iniciar; sigue usando el instalador explícito de Plugins.

## Relacionado

- [Puntos de entrada del SDK](/es/plugins/sdk-entrypoints) — `definePluginEntry` y `defineChannelPluginEntry`
- [Manifiesto del Plugin](/es/plugins/manifest) — referencia completa del esquema del manifiesto
- [Crear Plugins](/es/plugins/building-plugins) — guía paso a paso para empezar
