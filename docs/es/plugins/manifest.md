---
read_when:
    - Estás creando un Plugin de OpenClaw
    - Necesitas distribuir un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Manifiesto de Plugin + requisitos del esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto de Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de Plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugins](/es/plugins/bundles).

Los formatos de paquetes compatibles usan archivos de manifiesto distintos:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes Claude
  sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las
raíces declaradas de Skills, las raíces de comandos Claude, los valores predeterminados de `settings.json` del paquete Claude,
los valores predeterminados de LSP del paquete Claude y los paquetes de hooks admitidos cuando el diseño coincide con las expectativas de runtime de OpenClaw.

Todo Plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos ausentes o no válidos se tratan como
errores del plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de configuración
- metadatos de autenticación e incorporación que deban estar disponibles sin iniciar el runtime del plugin
- sugerencias de activación ligeras que las superficies del plano de control puedan inspeccionar antes de que se cargue el runtime
- descriptores ligeros de configuración que las superficies de configuración/incorporación puedan inspeccionar antes de que se cargue el runtime
- metadatos de alias y autoactivación que deban resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familia de modelos que deban autoactivar el
  plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad incluido y
  la cobertura de contratos
- metadatos ligeros del ejecutor de QA que el host compartido `openclaw qa` pueda inspeccionar
  antes de que se cargue el runtime del plugin
- metadatos de configuración específicos del canal que deban fusionarse en las superficies de catálogo y validación
  sin cargar el runtime
- sugerencias de IU de configuración

No lo uses para:

- registrar comportamiento de runtime
- declarar entrypoints de código
- metadatos de instalación de npm

Eso pertenece al código de tu plugin y a `package.json`.

## Ejemplo mínimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Ejemplo completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin proveedor de OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Clave API de OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Clave API de OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Referencia de campos de nivel superior

| Campo                               | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                 |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Sí          | `string`                         | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                       |
| `configSchema`                      | Sí          | `object`                         | JSON Schema en línea para la configuración de este plugin.                                                                                                                                                    |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                      |
| `legacyPluginIds`                   | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | IDs de proveedor que deben autoactivar este plugin cuando la autenticación, la configuración o las referencias de modelo los mencionan.                                                                     |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo de plugin exclusivo usado por `plugins.slots.*`.                                                                                                                                              |
| `channels`                          | No          | `string[]`                       | IDs de canal propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                            |
| `providers`                         | No          | `string[]`                       | IDs de proveedor propiedad de este plugin.                                                                                                                                                                    |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para autocargar el plugin antes del runtime.                                                                                      |
| `providerEndpoints`                 | No          | `object[]`                       | Metadatos de host/baseUrl de endpoints propiedad del manifiesto para rutas de proveedor que el core debe clasificar antes de que se cargue el runtime del proveedor.                                        |
| `cliBackends`                       | No          | `string[]`                       | IDs de backend de inferencia de CLI propiedad de este plugin. Se usan para autoactivación al iniciar a partir de referencias explícitas de configuración.                                                   |
| `syntheticAuthRefs`                 | No          | `string[]`                       | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética propiedad del plugin debe sondearse durante el descubrimiento en frío de modelos antes de que se cargue el runtime.          |
| `nonSecretAuthMarkers`              | No          | `string[]`                       | Valores de clave API de marcador de posición propiedad de plugins incluidos que representan estado de credencial local, OAuth o ambiental no secreto.                                                       |
| `commandAliases`                    | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deben producir diagnósticos de configuración y CLI con reconocimiento del plugin antes de que se cargue el runtime.                                         |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de autenticación del proveedor que OpenClaw puede inspeccionar sin cargar código del plugin.                                                                      |
| `providerAuthAliases`               | No          | `Record<string, string>`         | IDs de proveedor que deben reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de coding que comparte la clave API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                    | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que deban ver los ayudantes genéricos de inicio/configuración. |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y conexión simple de flags de CLI.                                                       |
| `activation`                        | No          | `object`                         | Sugerencias ligeras de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue encargándose del comportamiento real.              |
| `setup`                             | No          | `object`                         | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                             |
| `qaRunners`                         | No          | `object[]`                       | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el runtime del plugin.                                                                          |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades incluidas para voz, transcripción en tiempo real, voz en tiempo real, comprensión multimedia, generación de imágenes, generación de música, generación de video, obtención web, búsqueda web y propiedad de herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                                |
| `skills`                            | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                       |
| `name`                              | No          | `string`                         | Nombre del plugin legible para humanos.                                                                                                                                                                       |
| `description`                       | No          | `string`                         | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                   |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                               |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de IU, placeholders y sugerencias de sensibilidad para campos de configuración.                                                                                                                    |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                             |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se enviará.                                                          |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                        |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como respaldo.                     |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                     |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos dirigidos por el asistente.         |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en los selectores del asistente, aunque sigue permitiendo la selección manual por CLI.   |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.                  |
| `groupId`             | No          | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                                   |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                             |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                        |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola flag.                            |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                     |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                                   |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin sea propietario de un nombre de comando de runtime que los usuarios puedan
poner por error en `plugins.allow` o intentar ejecutar como un comando raíz de CLI. OpenClaw
usa estos metadatos para diagnósticos sin importar el código del runtime del plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Campo        | Obligatorio | Tipo              | Qué significa                                                           |
| ------------ | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                         |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando raíz de CLI. |
| `cliCommand` | No          | `string`          | Comando raíz de CLI relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin pueda declarar de forma ligera qué eventos del plano de control
deben activarlo más adelante.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un plugin aporte uno o más ejecutores de transporte bajo
la raíz compartida `openclaw qa`. Mantén estos metadatos ligeros y estáticos; el runtime del plugin
sigue siendo responsable del registro real de la CLI mediante una superficie ligera
`runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecutar la vía de QA en vivo de Matrix respaldada por Docker contra un homeserver desechable"
    }
  ]
}
```

| Campo         | Obligatorio | Tipo     | Qué significa                                                      |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí          | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`.       |
| `description` | No          | `string` | Texto de ayuda de respaldo usado cuando el host compartido necesita un comando de marcador de posición. |

Este bloque es solo metadatos. No registra comportamiento de runtime ni
reemplaza `register(...)`, `setupEntry` ni otros entrypoints de runtime/plugin.
Los consumidores actuales lo usan como una sugerencia de restricción antes de una carga más amplia de plugins, por lo que
la ausencia de metadatos de activación normalmente solo afecta al rendimiento; no debería
cambiar la corrección mientras sigan existiendo los respaldos heredados de propiedad del manifiesto.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo            | Obligatorio | Tipo                                                 | Qué significa                                                     |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | No          | `string[]`                                           | IDs de proveedor que deben activar este plugin cuando se solicitan. |
| `onCommands`     | No          | `string[]`                                           | IDs de comando que deben activar este plugin.                     |
| `onChannels`     | No          | `string[]`                                           | IDs de canal que deben activar este plugin.                       |
| `onRoutes`       | No          | `string[]`                                           | Tipos de ruta que deben activar este plugin.                      |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Sugerencias amplias de capacidades usadas por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comando recurre a `commandAliases[].cliCommand`
  o `commandAliases[].name` heredados
- la planificación de configuración/canales activada por canal recurre a la propiedad
  heredada de `channels[]` cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedor recurre a la propiedad heredada de
  `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos ligeros propiedad del plugin
antes de que se cargue el runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends
de inferencia de CLI. `setup.cliBackends` es la superficie de descriptor específica de configuración para
flujos de plano de control/configuración que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida
de búsqueda basada primero en descriptores para el descubrimiento de configuración. Si el descriptor solo
acota el plugin candidato y la configuración aún necesita hooks de runtime más ricos en tiempo de configuración,
establece `requiresRuntime: true` y mantén `setup-api` como
ruta de ejecución de respaldo.

Dado que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados
`setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre
los plugins detectados. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                        |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sí          | `string`   | ID de proveedor expuesto durante la configuración o la incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                       |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración del proveedor expuestos durante la configuración y la incorporación. |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este plugin.      |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración sigue necesitando la ejecución de `setup-api` después de la búsqueda del descriptor. |

## Referencia de `uiHints`

`uiHints` es un mapa desde nombres de campos de configuración a pequeñas sugerencias de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Clave API",
      "help": "Se usa para solicitudes de OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada sugerencia de campo puede incluir:

| Campo         | Tipo       | Qué significa                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Etiqueta de campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                   |
| `tags`        | `string[]` | Etiquetas opcionales de IU.             |
| `advanced`    | `boolean`  | Marca el campo como avanzado.           |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible. |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el runtime del plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Cada lista es opcional:

| Campo                            | Tipo       | Qué significa                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de proveedor de voz de los que este plugin es propietario. |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedor de transcripción en tiempo real de los que este plugin es propietario. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedor de voz en tiempo real de los que este plugin es propietario. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedor de comprensión multimedia de los que este plugin es propietario. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedor de generación de imágenes de los que este plugin es propietario. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedor de generación de video de los que este plugin es propietario. |
| `webFetchProviders`              | `string[]` | IDs de proveedor de obtención web de los que este plugin es propietario. |
| `webSearchProviders`             | `string[]` | IDs de proveedor de búsqueda web de los que este plugin es propietario. |
| `tools`                          | `string[]` | Nombres de herramientas del agente de los que este plugin es propietario para comprobaciones de contratos incluidos. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesite metadatos ligeros de configuración antes
de que se cargue el runtime.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL del homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexión al homeserver de Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo         | Tipo                     | Qué significa                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/sugerencias de sensibilidad opcionales de IU para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en las superficies de selector e inspección cuando los metadatos del runtime aún no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.               |
| `preferOver`  | `string[]`               | IDs heredados o de menor prioridad de plugins a los que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de
IDs abreviados de modelos como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifiesto `providers` del propietario
- `modelPatterns` prevalece sobre `modelPrefixes`
- si un plugin no incluido y uno incluido coinciden a la vez, gana el plugin
  no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos coincidentes con `startsWith` frente a IDs abreviados de modelos.      |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con IDs abreviados de modelos después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad
de capacidades.

## Manifiesto frente a package.json

Los dos archivos sirven para trabajos distintos:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y sugerencias de IU que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para entrypoints, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir un dato de metadatos, usa esta regla:

- si OpenClaw debe conocerlo antes de cargar el código del plugin, colócalo en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócalo en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos de plugins previos al runtime viven intencionadamente en `package.json` bajo el
bloque `openclaw` en lugar de en `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Declara entrypoints nativos del plugin. Deben permanecer dentro del directorio del paquete del plugin.                                                                              |
| `openclaw.runtimeExtensions`                                      | Declara entrypoints de runtime JavaScript compilados para paquetes instalados. Deben permanecer dentro del directorio del paquete del plugin.                                       |
| `openclaw.setupEntry`                                             | EntryPoint ligero solo de configuración usado durante incorporación, inicio diferido de canales y descubrimiento de estado de canal/SecretRef de solo lectura. Debe permanecer dentro del directorio del paquete del plugin. |
| `openclaw.runtimeSetupEntry`                                      | Declara el entrypoint de configuración JavaScript compilado para paquetes instalados. Debe permanecer dentro del directorio del paquete del plugin.                                 |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                                                                      |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del comprobador de estado configurado que pueden responder "¿ya existe una configuración solo por entorno?" sin cargar el runtime completo del canal.             |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del comprobador de autenticación persistida que pueden responder "¿ya hay algo con sesión iniciada?" sin cargar el runtime completo del canal.                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Sugerencias de instalación/actualización para plugins incluidos y publicados externamente.                                                                                          |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Versión mínima admitida del host de OpenClaw, usando un límite semver como `>=2026.3.22`.                                                                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación de reinstalación de plugins incluidos cuando la configuración no es válida.                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes que el plugin de canal completo durante el inicio.                                                      |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
del manifiesto. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
plugin en hosts más antiguos.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales
o los escaneos de SecretRef necesiten identificar cuentas configuradas sin cargar el
runtime completo. La entrada de configuración debe exponer metadatos del canal más adaptadores seguros para configuración
de configuración, estado y secretos; mantén los clientes de red, los listeners del Gateway y
los runtimes de transporte en el entrypoint principal de la extensión.

Los campos de entrypoint de runtime no reemplazan las comprobaciones de límite de paquete para
los campos de entrypoint fuente. Por ejemplo, `openclaw.runtimeExtensions` no puede hacer
cargable una ruta de `openclaw.extensions` que escape del paquete.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente limitado. No
hace instalables configuraciones rotas arbitrarias. Actualmente solo permite que los flujos de instalación
se recuperen de fallos concretos de actualización de plugins incluidos obsoletos, como una
ruta faltante de plugin incluido o una entrada `channels.<id>` obsoleta para ese mismo
plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un módulo comprobador
muy pequeño:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una sonda barata
de autenticación sí/no antes de que se cargue el plugin completo del canal. La exportación de destino debe ser una función pequeña
que lea solo el estado persistido; no la enrutes a través del barrel completo del
runtime del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones baratas de
estado configurado solo por entorno:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Úsalo cuando un canal pueda responder el estado configurado desde variables de entorno u otras entradas pequeñas
que no sean de runtime. Si la comprobación necesita resolución completa de configuración o el runtime
real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del plugin.

## Precedencia de descubrimiento (IDs duplicados de plugins)

OpenClaw descubre plugins desde varias raíces (incluidos, instalación global, workspace, rutas seleccionadas explícitamente por configuración). Si dos descubrimientos comparten el mismo `id`, solo se conserva el manifiesto de **mayor precedencia**; los duplicados de menor precedencia se descartan en lugar de cargarse junto a él.

Precedencia, de mayor a menor:

1. **Seleccionado por configuración** — una ruta fijada explícitamente en `plugins.entries.<id>`
2. **Incluido** — plugins distribuidos con OpenClaw
3. **Instalación global** — plugins instalados en la raíz global de plugins de OpenClaw
4. **Workspace** — plugins detectados en relación con el workspace actual

Implicaciones:

- Una copia bifurcada u obsoleta de un plugin incluido ubicada en el workspace no sustituirá a la compilación incluida.
- Para realmente reemplazar un plugin incluido por uno local, fíjalo mediante `plugins.entries.<id>` para que gane por precedencia en lugar de depender del descubrimiento del workspace.
- Los descartes por duplicado se registran para que Doctor y los diagnósticos de inicio puedan señalar la copia descartada.

## Requisitos de JSON Schema

- **Todo plugin debe incluir un JSON Schema**, aunque no acepte configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o ausente,
  la validación falla y Doctor informa del error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita añadir
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta ligera de metadatos para sondas de autenticación, validación
  de marcadores de variables de entorno y superficies similares de autenticación de proveedor que no deben iniciar el runtime del plugin solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que variantes de proveedor reutilicen la autenticación de otro proveedor
  con variables de entorno, perfiles de autenticación, autenticación respaldada por configuración y opción de incorporación de clave API
  sin codificar esa relación de forma fija en el core.
- `providerEndpoints` permite que los plugins de proveedor sean propietarios de metadatos simples de coincidencia
  de host/baseUrl de endpoint. Úsalo solo para clases de endpoint que el core ya admite;
  el plugin sigue siendo responsable del comportamiento de runtime.
- `syntheticAuthRefs` es la ruta ligera de metadatos para hooks de autenticación sintética
  propiedad del proveedor que deben ser visibles para el descubrimiento en frío de modelos antes de que exista el registro de runtime.
  Enumera solo referencias cuyo proveedor de runtime o backend de CLI realmente
  implemente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` es la ruta ligera de metadatos para marcadores de posición de clave API
  propiedad de plugins incluidos, como marcadores de credenciales locales, OAuth o ambientales.
  El core los trata como no secretos para la visualización de autenticación y las auditorías de secretos sin
  codificar de forma fija el proveedor propietario.
- `channelEnvVars` es la ruta ligera de metadatos para el respaldo por variables de entorno del shell, los prompts de configuración
  y superficies similares de canal que no deben iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno. Los nombres de variables de entorno son metadatos, no activación por
  sí mismos: estado, auditoría, validación de entrega de Cron y otras superficies de solo lectura
  siguen aplicando la confianza del plugin y la política de activación efectiva antes de
  tratar una variable de entorno como un canal configurado.
- `providerAuthChoices` es la ruta ligera de metadatos para selectores de opciones de autenticación,
  resolución de `--auth-choice`, asignación de proveedor preferido y registro simple de flags de CLI de incorporación antes de que se cargue el runtime del proveedor. Para metadatos del asistente de runtime
  que requieren código del proveedor, consulta
  [Hooks de runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` se pueden omitir cuando un
  plugin no los necesita.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de Plugins](/es/plugins/architecture) — arquitectura interna
- [Descripción general del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
