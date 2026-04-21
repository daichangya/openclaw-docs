---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas enviar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto de Plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto de Plugin
x-i18n:
    generated_at: "2026-04-21T19:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304c08035724dfb1ce6349972729b621aafc00880d4d259db78c22b86e9056ba
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto de Plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de Plugin](/es/plugins/bundles).

Los formatos de paquetes compatibles usan archivos de manifiesto distintos:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json` o el diseño de componentes predeterminado de Claude sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan con el esquema `openclaw.plugin.json` descrito aquí.

Para los paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete junto con las raíces de skill declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete Claude, los valores predeterminados de LSP del paquete Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas de tiempo de ejecución de OpenClaw.

Todo plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la **raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración **sin ejecutar código del plugin**. Los manifiestos faltantes o no válidos se tratan como errores del plugin y bloquean la validación de configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de configuración
- metadatos de autenticación e incorporación que deben estar disponibles sin iniciar el tiempo de ejecución del plugin
- indicios de activación ligeros que las superficies del plano de control pueden inspeccionar antes de que se cargue el tiempo de ejecución
- descriptores de configuración ligeros que las superficies de configuración/incorporación pueden inspeccionar antes de que se cargue el tiempo de ejecución
- metadatos de alias y autoactivación que deben resolverse antes de que se cargue el tiempo de ejecución del plugin
- metadatos abreviados de pertenencia de familias de modelos que deben autoactivar el plugin antes de que se cargue el tiempo de ejecución
- instantáneas estáticas de pertenencia de capacidades usadas para el cableado de compatibilidad incluido y la cobertura de contratos
- metadatos ligeros del ejecutor de QA que el host compartido `openclaw qa` puede inspeccionar antes de que se cargue el tiempo de ejecución del plugin
- metadatos de configuración específicos del canal que deben integrarse en las superficies de catálogo y validación sin cargar el tiempo de ejecución
- indicios de UI para configuración

No lo uses para:

- registrar comportamiento en tiempo de ejecución
- declarar puntos de entrada de código
- metadatos de instalación de npm

Eso corresponde a tu código del plugin y a `package.json`.

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
  "description": "Plugin de proveedor OpenRouter",
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

| Campo | Obligatorio | Tipo | Qué significa |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | Sí | `string` | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`. |
| `configSchema` | Sí | `object` | Esquema JSON en línea para la configuración de este plugin. |
| `enabledByDefault` | No | `true` | Marca un plugin incluido como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada. |
| `legacyPluginIds` | No | `string[]` | IDs heredados que se normalizan a este ID canónico de plugin. |
| `autoEnableWhenConfiguredProviders` | No | `string[]` | IDs de proveedor que deben autohabilitar este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen. |
| `kind` | No | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`. |
| `channels` | No | `string[]` | IDs de canal propiedad de este plugin. Se usan para descubrimiento y validación de configuración. |
| `providers` | No | `string[]` | IDs de proveedor propiedad de este plugin. |
| `modelSupport` | No | `object` | Metadatos abreviados de familias de modelos, propiedad del manifiesto, usados para autocargar el plugin antes del tiempo de ejecución. |
| `providerEndpoints` | No | `object[]` | Metadatos de host/baseUrl de endpoints, propiedad del manifiesto, para rutas de proveedor que el núcleo debe clasificar antes de que se cargue el tiempo de ejecución del proveedor. |
| `cliBackends` | No | `string[]` | IDs de backends de inferencia de CLI propiedad de este plugin. Se usan para autoactivación al inicio a partir de referencias explícitas de configuración. |
| `syntheticAuthRefs` | No | `string[]` | Referencias de proveedor o backend de CLI cuyo hook de autenticación sintética, propiedad del plugin, debe sondearse durante el descubrimiento en frío de modelos antes de que se cargue el tiempo de ejecución. |
| `nonSecretAuthMarkers` | No | `string[]` | Valores de marcador de clave API, propiedad de plugins incluidos, que representan estado no secreto de credenciales locales, OAuth o ambientales. |
| `commandAliases` | No | `object[]` | Nombres de comando propiedad de este plugin que deben producir diagnósticos de configuración y CLI conscientes del plugin antes de que se cargue el tiempo de ejecución. |
| `providerAuthEnvVars` | No | `Record<string, string[]>` | Metadatos ligeros de variables de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del plugin. |
| `providerAuthAliases` | No | `Record<string, string>` | IDs de proveedor que deben reutilizar otro ID de proveedor para la búsqueda de autenticación; por ejemplo, un proveedor de coding que comparte la clave API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars` | No | `Record<string, string[]>` | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que los helpers genéricos de inicio/configuración deban ver. |
| `providerAuthChoices` | No | `object[]` | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI. |
| `activation` | No | `object` | Indicios ligeros de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el tiempo de ejecución del plugin sigue siendo el propietario del comportamiento real. |
| `setup` | No | `object` | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el tiempo de ejecución del plugin. |
| `qaRunners` | No | `object[]` | Descriptores ligeros de ejecutores de QA usados por el host compartido `openclaw qa` antes de que se cargue el tiempo de ejecución del plugin. |
| `contracts` | No | `object` | Instantánea estática de capacidades incluidas para speech, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `channelConfigs` | No | `Record<string, object>` | Metadatos de configuración de canal, propiedad del manifiesto, integrados en las superficies de descubrimiento y validación antes de que se cargue el tiempo de ejecución. |
| `skills` | No | `string[]` | Directorios de Skills que se cargarán, relativos a la raíz del plugin. |
| `name` | No | `string` | Nombre legible del plugin. |
| `description` | No | `string` | Resumen breve que se muestra en las superficies del plugin. |
| `version` | No | `string` | Versión informativa del plugin. |
| `uiHints` | No | `Record<string, object>` | Etiquetas de UI, placeholders e indicios de sensibilidad para campos de configuración. |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el tiempo de ejecución del proveedor.

| Campo | Obligatorio | Tipo | Qué significa |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | Sí | `string` | ID del proveedor al que pertenece esta opción. |
| `method` | Sí | `string` | ID del método de autenticación al que se enviará. |
| `choiceId` | Sí | `string` | ID estable de opción de autenticación usado por los flujos de incorporación y CLI. |
| `choiceLabel` | No | `string` | Etiqueta orientada al usuario. Si se omite, OpenClaw usa `choiceId` como valor de respaldo. |
| `choiceHint` | No | `string` | Texto breve de ayuda para el selector. |
| `assistantPriority` | No | `number` | Los valores más bajos se ordenan antes en los selectores interactivos impulsados por el asistente. |
| `assistantVisibility` | No | `"visible"` \| `"manual-only"` | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual por CLI. |
| `deprecatedChoiceIds` | No | `string[]` | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo. |
| `groupId` | No | `string` | ID opcional de grupo para agrupar opciones relacionadas. |
| `groupLabel` | No | `string` | Etiqueta orientada al usuario para ese grupo. |
| `groupHint` | No | `string` | Texto breve de ayuda para el grupo. |
| `optionKey` | No | `string` | Clave interna de opción para flujos simples de autenticación con una sola flag. |
| `cliFlag` | No | `string` | Nombre de la flag de CLI, como `--openrouter-api-key`. |
| `cliOption` | No | `string` | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`. |
| `cliDescription` | No | `string` | Descripción usada en la ayuda de CLI. |
| `onboardingScopes` | No | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin es propietario de un nombre de comando en tiempo de ejecución que los usuarios podrían poner por error en `plugins.allow` o intentar ejecutar como un comando CLI raíz. OpenClaw usa estos metadatos para diagnósticos sin importar código de tiempo de ejecución del plugin.

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

| Campo | Obligatorio | Tipo | Qué significa |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | Sí | `string` | Nombre del comando que pertenece a este plugin. |
| `kind` | No | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No | `string` | Comando CLI raíz relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin puede declarar de forma ligera qué eventos del plano de control deben activarlo más adelante.

## Referencia de `qaRunners`

Usa `qaRunners` cuando un plugin aporta uno o más ejecutores de transporte bajo la raíz compartida `openclaw qa`. Mantén estos metadatos ligeros y estáticos; el tiempo de ejecución del plugin sigue siendo el propietario del registro real de CLI a través de una superficie ligera `runtime-api.ts` que exporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Ejecuta la vía de QA en vivo de Matrix con Docker contra un servidor doméstico desechable"
    }
  ]
}
```

| Campo | Obligatorio | Tipo | Qué significa |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Sí | `string` | Subcomando montado bajo `openclaw qa`, por ejemplo `matrix`. |
| `description` | No | `string` | Texto de ayuda de respaldo usado cuando el host compartido necesita un comando simulado. |

Este bloque es solo metadatos. No registra comportamiento en tiempo de ejecución y no reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/plugin.
Los consumidores actuales lo usan como una pista de reducción antes de una carga más amplia del plugin, por lo que la ausencia de metadatos de activación normalmente solo cuesta rendimiento; no debería cambiar la corrección mientras sigan existiendo los respaldos heredados de pertenencia del manifiesto.

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

| Campo | Obligatorio | Tipo | Qué significa |
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders` | No | `string[]` | IDs de proveedor que deben activar este plugin cuando se soliciten. |
| `onCommands` | No | `string[]` | IDs de comando que deben activar este plugin. |
| `onChannels` | No | `string[]` | IDs de canal que deben activar este plugin. |
| `onRoutes` | No | `string[]` | Tipos de ruta que deben activar este plugin. |
| `onCapabilities` | No | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Indicios amplios de capacidad usados por la planificación de activación del plano de control. |

Consumidores activos actuales:

- la planificación de CLI activada por comandos usa como respaldo `commandAliases[].cliCommand` o `commandAliases[].name`
- la planificación de configuración/canal activada por canal usa como respaldo la pertenencia heredada `channels[]` cuando faltan metadatos explícitos de activación de canal
- la planificación de configuración/runtime activada por proveedor usa como respaldo la pertenencia heredada `providers[]` y `cliBackends[]` de nivel superior cuando faltan metadatos explícitos de activación de proveedor

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesiten metadatos ligeros, propiedad del plugin, antes de que se cargue el tiempo de ejecución.

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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo backends de inferencia de CLI. `setup.cliBackends` es la superficie de descriptor específica de configuración para flujos de configuración/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida, basada primero en descriptores, para la búsqueda de configuración. Si el descriptor solo reduce el plugin candidato y la configuración aún necesita hooks más completos de tiempo de configuración en tiempo de ejecución, establece `requiresRuntime: true` y conserva `setup-api` como ruta de ejecución de respaldo.

Como la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de `setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre los plugins detectados. La propiedad ambigua falla de forma cerrada en lugar de elegir un ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo | Obligatorio | Tipo | Qué significa |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | Sí | `string` | ID de proveedor expuesto durante la configuración o incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el tiempo de ejecución completo. |
| `envVars` | No | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el tiempo de ejecución del plugin. |

### Campos de `setup`

| Campo | Obligatorio | Tipo | Qué significa |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | No | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación. |
| `cliBackends` | No | `string[]` | IDs de backend en tiempo de configuración usados para búsqueda de configuración basada primero en descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este plugin. |
| `requiresRuntime` | No | `boolean` | Si la configuración aún necesita ejecutar `setup-api` después de la búsqueda por descriptor. |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeños indicios de renderizado.

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

Cada indicio de campo puede incluir:

| Campo | Tipo | Qué significa |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | Etiqueta del campo orientada al usuario. |
| `help` | `string` | Texto breve de ayuda. |
| `tags` | `string[]` | Etiquetas opcionales de UI. |
| `advanced` | `boolean` | Marca el campo como avanzado. |
| `sensitive` | `boolean` | Marca el campo como secreto o sensible. |
| `placeholder` | `string` | Texto placeholder para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede leer sin importar el tiempo de ejecución del plugin.

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

| Campo | Tipo | Qué significa |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders` | `string[]` | IDs de proveedores de speech que pertenecen a este plugin. |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedores de transcripción en tiempo real que pertenecen a este plugin. |
| `realtimeVoiceProviders` | `string[]` | IDs de proveedores de voz en tiempo real que pertenecen a este plugin. |
| `mediaUnderstandingProviders` | `string[]` | IDs de proveedores de comprensión de medios que pertenecen a este plugin. |
| `imageGenerationProviders` | `string[]` | IDs de proveedores de generación de imágenes que pertenecen a este plugin. |
| `videoGenerationProviders` | `string[]` | IDs de proveedores de generación de video que pertenecen a este plugin. |
| `webFetchProviders` | `string[]` | IDs de proveedores de web-fetch que pertenecen a este plugin. |
| `webSearchProviders` | `string[]` | IDs de proveedores de búsqueda web que pertenecen a este plugin. |
| `tools` | `string[]` | Nombres de herramientas del agente que pertenecen a este plugin para comprobaciones de contratos incluidos. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesita metadatos ligeros de configuración antes de que se cargue el tiempo de ejecución.

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
          "label": "URL del servidor doméstico",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Conexión al servidor doméstico Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo | Tipo | Qué significa |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | Esquema JSON para `channels.<id>`. Obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints` | `Record<string, object>` | Etiquetas de UI/placeholders/indicios de sensibilidad opcionales para esa sección de configuración del canal. |
| `label` | `string` | Etiqueta del canal integrada en las superficies de selector e inspección cuando los metadatos de tiempo de ejecución no están listos. |
| `description` | `string` | Descripción breve del canal para las superficies de inspección y catálogo. |
| `preferOver` | `string[]` | IDs heredados o de menor prioridad de plugins a los que este canal debe superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de IDs abreviados de modelos como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el tiempo de ejecución del plugin.

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
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si un plugin no incluido y un plugin incluido coinciden, gana el plugin no incluido
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo | Tipo | Qué significa |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra IDs abreviados de modelos. |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con IDs abreviados de modelos después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para mover `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal del manifiesto ya no trata esos campos de nivel superior como propiedad de capacidades.

## Manifiesto frente a `package.json`

Los dos archivos cumplen funciones distintas:

| Archivo | Úsalo para |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación e indicios de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json` | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, control de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si se trata de empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de `package.json` que afectan al descubrimiento

Algunos metadatos del plugin previos al tiempo de ejecución viven intencionalmente en `package.json`, dentro del bloque `openclaw`, en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo | Qué significa |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions` | Declara puntos de entrada nativos del plugin. |
| `openclaw.setupEntry` | Punto de entrada ligero solo de configuración usado durante la incorporación, el inicio diferido de canales y el descubrimiento de estado de canal/SecretRef de solo lectura. |
| `openclaw.channel` | Metadatos ligeros del catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección. |
| `openclaw.channel.configuredState` | Metadatos ligeros del verificador de estado configurado que pueden responder “¿ya existe una configuración solo por entorno?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.channel.persistedAuthState` | Metadatos ligeros del verificador de autenticación persistida que pueden responder “¿ya hay algo autenticado?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | Indicios de instalación/actualización para plugins incluidos y publicados externamente. |
| `openclaw.install.defaultChoice` | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles. |
| `openclaw.install.minHostVersion` | Versión mínima compatible del host de OpenClaw, usando un mínimo semver como `>=2026.3.22`. |
| `openclaw.install.allowInvalidConfigRecovery` | Permite una ruta de recuperación de reinstalación limitada para plugins incluidos cuando la configuración no es válida. |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes del plugin de canal completo durante el inicio. |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro de manifiestos. Los valores no válidos se rechazan; los valores más nuevos pero válidos omiten el plugin en hosts más antiguos.

Los plugins de canal deben proporcionar `openclaw.setupEntry` cuando el estado, la lista de canales o los análisis de SecretRef necesiten identificar cuentas configuradas sin cargar el tiempo de ejecución completo. La entrada de configuración debe exponer metadatos del canal junto con adaptadores de configuración, estado y secretos seguros para la configuración; mantén los clientes de red, listeners de Gateway y tiempos de ejecución de transporte en el punto de entrada principal de la extensión.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No hace instalables configuraciones arbitrariamente rotas. Hoy solo permite que los flujos de instalación se recuperen de fallos concretos de actualización de plugins incluidos obsoletos, como una ruta faltante del plugin incluido o una entrada obsoleta `channels.<id>` para ese mismo plugin incluido. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es metadato de paquete para un pequeño módulo verificador:

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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una comprobación ligera de autenticación sí/no antes de que se cargue el plugin de canal completo. La exportación de destino debe ser una función pequeña que lea solo el estado persistido; no la enrutes a través del barrel completo del tiempo de ejecución del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras de estado configurado solo por entorno:

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

Úsalo cuando un canal pueda responder al estado configurado desde el entorno u otras entradas mínimas que no sean de tiempo de ejecución. Si la comprobación necesita la resolución completa de configuración o el tiempo de ejecución real del canal, mantén esa lógica en el hook `config.hasConfiguredState` del plugin.

## Requisitos del esquema JSON

- **Todo plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de configuración, no en tiempo de ejecución.

## Comportamiento de validación

- Las claves desconocidas de `channels.*` son **errores**, a menos que el ID del canal esté declarado por un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*` deben hacer referencia a IDs de plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante, la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y se muestra una **advertencia** en Doctor + los registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El tiempo de ejecución sigue cargando el módulo del plugin por separado; el manifiesto es solo para descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita añadir aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta de metadatos ligera para sondeos de autenticación, validación de marcadores de entorno y superficies similares de autenticación de proveedor que no deberían iniciar el tiempo de ejecución del plugin solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que variantes de proveedor reutilicen las variables de entorno de autenticación, los perfiles de autenticación, la autenticación respaldada por configuración y la opción de incorporación con clave API de otro proveedor, sin codificar esa relación en el núcleo.
- `providerEndpoints` permite que los plugins de proveedor sean propietarios de metadatos simples de coincidencia de host/baseUrl de endpoints. Úsalo solo para clases de endpoints que el núcleo ya admite; el plugin sigue siendo el propietario del comportamiento en tiempo de ejecución.
- `syntheticAuthRefs` es la ruta de metadatos ligera para hooks de autenticación sintética, propiedad del proveedor, que deben ser visibles para el descubrimiento en frío de modelos antes de que exista el registro de tiempo de ejecución. Incluye solo referencias cuyo proveedor o backend de CLI en tiempo de ejecución implemente realmente `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` es la ruta de metadatos ligera para claves API de marcador de posición, propiedad de plugins incluidos, como marcadores de credenciales locales, OAuth o ambientales.
  El núcleo las trata como no secretas para la visualización de autenticación y las auditorías de secretos, sin codificar el proveedor propietario.
- `channelEnvVars` es la ruta de metadatos ligera para el respaldo por variables de entorno del shell, prompts de configuración y superficies similares de canal que no deberían iniciar el tiempo de ejecución del plugin solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta de metadatos ligera para selectores de opciones de autenticación, resolución de `--auth-choice`, mapeo de proveedor preferido y registro simple de flags de CLI de incorporación antes de que se cargue el tiempo de ejecución del proveedor. Para metadatos del asistente de tiempo de ejecución que requieren código del proveedor, consulta [Hooks de tiempo de ejecución del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine` (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un plugin no los necesite.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier requisito de lista de permitidos del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de Plugin](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de Plugin
