---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas entregar un esquema de configuración del plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del plugin + esquema JSON (validación estricta de la configuración)
title: Manifiesto del plugin
x-i18n:
    generated_at: "2026-04-12T05:11:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf666b0f41f07641375a248f52e29ba6a68c3ec20404bedb6b52a20a5cd92e91
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto del plugin (`openclaw.plugin.json`)

Esta página es solo para el **manifiesto nativo de plugin de OpenClaw**.

Para diseños de paquetes compatibles, consulta [Paquetes de plugins](/es/plugins/bundles).

Los formatos de paquete compatibles usan archivos de manifiesto diferentes:

- Paquete Codex: `.codex-plugin/plugin.json`
- Paquete Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Paquete Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de paquetes, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para los paquetes compatibles, OpenClaw actualmente lee los metadatos del paquete más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del paquete Claude,
los valores predeterminados de LSP del paquete Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del runtime de
OpenClaw.

Todo plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos faltantes o no válidos se tratan como
errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo de capacidades nativo y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de la configuración
- metadatos de autenticación e incorporación que deberían estar disponibles sin iniciar el runtime del plugin
- pistas de activación de bajo costo que las superficies del plano de control pueden inspeccionar antes de que se cargue el runtime
- descriptores de configuración de bajo costo que las superficies de configuración/incorporación pueden inspeccionar antes de que se cargue el runtime
- metadatos de alias y habilitación automática que deberían resolverse antes de que se cargue el runtime del plugin
- metadatos abreviados de propiedad de familias de modelos que deberían activar automáticamente el
  plugin antes de que se cargue el runtime
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad de paquetes integrados y la cobertura de contratos
- metadatos de configuración específicos del canal que deberían fusionarse en los catálogos y superficies de validación
  sin cargar el runtime
- pistas de UI de configuración

No lo uses para:

- registrar comportamiento del runtime
- declarar puntos de entrada de código
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
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
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
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
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

| Campo                               | Obligatorio | Tipo                             | Qué significa                                                                                                                                                                                                |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sí          | `string`                         | ID canónico del plugin. Este es el ID usado en `plugins.entries.<id>`.                                                                                                                                        |
| `configSchema`                      | Sí          | `object`                         | Esquema JSON en línea para la configuración de este plugin.                                                                                                                                                   |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin integrado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                     |
| `legacyPluginIds`                   | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico de plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | IDs de proveedor que deberían habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelos los mencionen.                                                    |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                              |
| `channels`                          | No          | `string[]`                       | IDs de canal propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                             |
| `providers`                         | No          | `string[]`                       | IDs de proveedor propiedad de este plugin.                                                                                                                                                                     |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familia de modelos propiedad del manifiesto usados para cargar automáticamente el plugin antes del runtime.                                                                            |
| `cliBackends`                       | No          | `string[]`                       | IDs de backend de inferencia de CLI propiedad de este plugin. Se usan para la activación automática al inicio desde referencias explícitas de configuración.                                                 |
| `commandAliases`                    | No          | `object[]`                       | Nombres de comandos propiedad de este plugin que deberían producir diagnósticos de configuración y de CLI con reconocimiento del plugin antes de que se cargue el runtime.                                   |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar el código del plugin.                                                                     |
| `providerAuthAliases`               | No          | `Record<string, string>`         | IDs de proveedor que deberían reutilizar otro ID de proveedor para la búsqueda de autenticación, por ejemplo un proveedor de programación que comparte la clave API y los perfiles de autenticación del proveedor base. |
| `channelEnvVars`                    | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de canal que OpenClaw puede inspeccionar sin cargar el código del plugin. Úsalo para superficies de configuración o autenticación de canal basadas en variables de entorno que los ayudantes genéricos de inicio/configuración deberían ver. |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y conexión simple de flags de CLI.                                                        |
| `activation`                        | No          | `object`                         | Pistas ligeras de activación para carga desencadenada por proveedor, comando, canal, ruta y capacidad. Solo metadatos; el runtime del plugin sigue siendo el dueño del comportamiento real.                  |
| `setup`                             | No          | `object`                         | Descriptores ligeros de configuración/incorporación que las superficies de descubrimiento y configuración pueden inspeccionar sin cargar el runtime del plugin.                                               |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades integradas para speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search y propiedad de herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto fusionados en las superficies de descubrimiento y validación antes de que se cargue el runtime.                                                 |
| `skills`                            | No          | `string[]`                       | Directorios de Skills que se deben cargar, relativos a la raíz del plugin.                                                                                                                                    |
| `name`                              | No          | `string`                         | Nombre legible del plugin.                                                                                                                                                                                     |
| `description`                       | No          | `string`                         | Resumen breve mostrado en las superficies del plugin.                                                                                                                                                          |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                                |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de UI, placeholders y pistas de sensibilidad para los campos de configuración.                                                                                                                       |

## Referencia de `providerAuthChoices`

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw lee esto antes de que se cargue el runtime del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                               |
| --------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                              |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se debe dirigir.                                                      |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y de CLI.                       |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como valor alternativo.             |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                      |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos guiados por el asistente.            |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción en los selectores del asistente mientras sigue permitiendo la selección manual por CLI.    |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deberían redirigir a los usuarios a esta opción de reemplazo.                |
| `groupId`             | No          | `string`                                        | ID de grupo opcional para agrupar opciones relacionadas.                                                    |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario de ese grupo.                                                              |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                         |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos de autenticación simples de una sola flag.                              |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                      |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de CLI.                                                                       |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debería aparecer esta opción. Si se omite, el valor predeterminado es `["text-inference"]`. |

## Referencia de `commandAliases`

Usa `commandAliases` cuando un plugin es propietario de un nombre de comando del runtime que los usuarios pueden
poner por error en `plugins.allow` o intentar ejecutar como un comando CLI raíz. OpenClaw
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

| Campo        | Obligatorio | Tipo              | Qué significa                                                            |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Sí          | `string`          | Nombre del comando que pertenece a este plugin.                          |
| `kind`       | No          | `"runtime-slash"` | Marca el alias como un comando slash de chat en lugar de un comando CLI raíz. |
| `cliCommand` | No          | `string`          | Comando CLI raíz relacionado que se debe sugerir para operaciones de CLI, si existe. |

## Referencia de `activation`

Usa `activation` cuando el plugin puede declarar de forma ligera qué eventos del plano de control
deberían activarlo más adelante.

Este bloque es solo metadatos. No registra comportamiento del runtime, y no
reemplaza `register(...)`, `setupEntry` ni otros puntos de entrada de runtime/plugin.

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
| `onProviders`    | No          | `string[]`                                           | IDs de proveedor que deberían activar este plugin cuando se soliciten. |
| `onCommands`     | No          | `string[]`                                           | IDs de comando que deberían activar este plugin.                  |
| `onChannels`     | No          | `string[]`                                           | IDs de canal que deberían activar este plugin.                    |
| `onRoutes`       | No          | `string[]`                                           | Tipos de ruta que deberían activar este plugin.                   |
| `onCapabilities` | No          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Pistas amplias de capacidad usadas por la planificación de activación del plano de control. |

## Referencia de `setup`

Usa `setup` cuando las superficies de configuración e incorporación necesitan metadatos ligeros propiedad del plugin
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

El `cliBackends` de nivel superior sigue siendo válido y continúa describiendo
los backends de inferencia de CLI. `setup.cliBackends` es la superficie de descriptor específica de configuración para
los flujos de configuración/plano de control que deben seguir siendo solo metadatos.

Cuando están presentes, `setup.providers` y `setup.cliBackends` son la superficie preferida de búsqueda basada primero en descriptores
para el descubrimiento de configuración. Si el descriptor solo
reduce el plugin candidato y la configuración aún necesita hooks de runtime más completos en tiempo de configuración,
establece `requiresRuntime: true` y mantén `setup-api` como la
ruta de ejecución de respaldo.

Debido a que la búsqueda de configuración puede ejecutar código `setup-api` propiedad del plugin, los valores normalizados de
`setup.providers[].id` y `setup.cliBackends[]` deben seguir siendo únicos entre
los plugins detectados. La propiedad ambigua falla de forma cerrada en lugar de elegir un
ganador según el orden de descubrimiento.

### Referencia de `setup.providers`

| Campo         | Obligatorio | Tipo       | Qué significa                                                                          |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Sí          | `string`   | ID de proveedor expuesto durante la configuración o la incorporación. Mantén los IDs normalizados globalmente únicos. |
| `authMethods` | No          | `string[]` | IDs de métodos de configuración/autenticación que este proveedor admite sin cargar el runtime completo. |
| `envVars`     | No          | `string[]` | Variables de entorno que las superficies genéricas de configuración/estado pueden comprobar antes de que se cargue el runtime del plugin. |

### Campos de `setup`

| Campo              | Obligatorio | Tipo       | Qué significa                                                                                         |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | No          | `object[]` | Descriptores de configuración de proveedor expuestos durante la configuración y la incorporación.     |
| `cliBackends`      | No          | `string[]` | IDs de backend en tiempo de configuración usados para la búsqueda de configuración basada primero en descriptores. Mantén los IDs normalizados globalmente únicos. |
| `configMigrations` | No          | `string[]` | IDs de migración de configuración propiedad de la superficie de configuración de este plugin.         |
| `requiresRuntime`  | No          | `boolean`  | Si la configuración aún necesita la ejecución de `setup-api` después de la búsqueda por descriptores. |

## Referencia de `uiHints`

`uiHints` es un mapa de nombres de campos de configuración a pequeñas pistas de renderizado.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Cada pista de campo puede incluir:

| Campo         | Tipo       | Qué significa                                  |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario.    |
| `help`        | `string`   | Texto breve de ayuda.                          |
| `tags`        | `string[]` | Etiquetas de UI opcionales.                    |
| `advanced`    | `boolean`  | Marca el campo como avanzado.                  |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.        |
| `placeholder` | `string`   | Texto de placeholder para entradas de formulario. |

## Referencia de `contracts`

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw puede
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

| Campo                            | Tipo       | Qué significa                                               |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de proveedor de speech propiedad de este plugin.        |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedor de realtime transcription propiedad de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedor de realtime voice propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedor de media-understanding propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedor de image-generation propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedor de video-generation propiedad de este plugin. |
| `webFetchProviders`              | `string[]` | IDs de proveedor de web-fetch propiedad de este plugin.     |
| `webSearchProviders`             | `string[]` | IDs de proveedor de web search propiedad de este plugin.    |
| `tools`                          | `string[]` | Nombres de herramientas del agente propiedad de este plugin para comprobaciones de contratos integrados. |

## Referencia de `channelConfigs`

Usa `channelConfigs` cuando un plugin de canal necesita metadatos ligeros de configuración antes
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
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Cada entrada de canal puede incluir:

| Campo         | Tipo                     | Qué significa                                                                                |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Esquema JSON para `channels.<id>`. Es obligatorio para cada entrada declarada de configuración de canal. |
| `uiHints`     | `Record<string, object>` | Etiquetas de UI, placeholders y pistas de sensibilidad opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal fusionada en las superficies de selector e inspección cuando los metadatos del runtime no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                   |
| `preferOver`  | `string[]`               | IDs de plugin heredados o de menor prioridad a los que este canal debería superar en las superficies de selección. |

## Referencia de `modelSupport`

Usa `modelSupport` cuando OpenClaw deba inferir tu plugin de proveedor a partir de
IDs abreviados de modelo como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue el runtime del plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw aplica esta precedencia:

- las referencias explícitas `provider/model` usan los metadatos del manifiesto `providers` propietario
- `modelPatterns` tienen prioridad sobre `modelPrefixes`
- si un plugin no integrado y un plugin integrado coinciden, gana el plugin no integrado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` contra IDs abreviados de modelo.           |
| `modelPatterns` | `string[]` | Orígenes de regex comparados contra IDs abreviados de modelo después de eliminar el sufijo del perfil. |

Las claves heredadas de capacidad de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad
de capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones diferentes:

| Archivo                | Úsalo para                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Descubrimiento, validación de la configuración, metadatos de opciones de autenticación y pistas de UI que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, restricción de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde pertenece una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan al descubrimiento

Algunos metadatos de plugin previos al runtime viven intencionalmente en `package.json` dentro del
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del plugin.                                                                                                |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo para configuración usado durante la incorporación y el inicio diferido de canales.                            |
| `openclaw.channel`                                                | Metadatos ligeros del catálogo de canales como etiquetas, rutas de documentación, alias y texto de selección.                             |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del verificador de estado configurado que pueden responder “¿ya existe una configuración solo con variables de entorno?” sin cargar el runtime completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del verificador de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el runtime completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Pistas de instalación/actualización para plugins integrados y plugins publicados externamente.                                             |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                          |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un mínimo semver como `>=2026.3.22`.                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación por reinstalación de plugin integrado cuando la configuración no es válida.                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes del plugin completo del canal durante el inicio.               |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más recientes omiten el
plugin en hosts más antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionalmente limitado. No
hace instalables configuraciones arbitrarias rotas. Actualmente solo permite que los
flujos de instalación se recuperen de fallos específicos de actualización de plugins integrados obsoletos, como una
ruta faltante de plugin integrado o una entrada obsoleta `channels.<id>` para ese mismo
plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` son metadatos de paquete para un pequeño
módulo verificador:

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

Úsalo cuando los flujos de configuración, doctor o estado configurado necesiten una
comprobación ligera de sí/no de autenticación antes de que se cargue el plugin completo del canal. La
exportación de destino debe ser una función pequeña que lea solo el estado persistido; no la encamines a través del barrel completo del runtime
del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras
de estado configurado solo por entorno:

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

Úsalo cuando un canal pueda responder al estado configurado desde variables de entorno u otras entradas pequeñas
que no pertenecen al runtime. Si la comprobación necesita la resolución completa de la configuración o el
runtime real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin en su lugar.

## Requisitos del esquema JSON

- **Todo plugin debe incluir un esquema JSON**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en tiempo de lectura/escritura de la configuración, no en tiempo de runtime.

## Comportamiento de validación

- Las claves desconocidas `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  se muestra una **advertencia** en Doctor + los registros.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para los plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El runtime sigue cargando el módulo del plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos de manifiesto documentados. Evita añadir
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta ligera de metadatos para sondeos de autenticación, validación
  de marcadores de variables de entorno y superficies similares de autenticación de proveedor que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthAliases` permite que las variantes de proveedor reutilicen las
  variables de entorno de autenticación, los perfiles de autenticación, la autenticación basada en configuración y la opción de incorporación de clave API
  de otro proveedor sin codificar esa relación en el núcleo.
- `channelEnvVars` es la ruta ligera de metadatos para la reserva de variables de entorno del shell, los prompts de configuración
  y superficies de canal similares que no deberían iniciar el runtime del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta ligera de metadatos para selectores de opciones de autenticación,
  resolución de `--auth-choice`, asignación de proveedor preferido y registro simple de flags de CLI
  antes de que se cargue el runtime del proveedor. Para metadatos del asistente del runtime
  que requieren código del proveedor, consulta
  [Hooks del runtime del proveedor](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugin se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers`, `cliBackends` y `skills` pueden omitirse cuando un
  plugin no los necesita.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista permitida del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Creación de plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Arquitectura de plugins](/es/plugins/architecture) — arquitectura interna
- [Resumen del SDK](/es/plugins/sdk-overview) — referencia del SDK de plugins
