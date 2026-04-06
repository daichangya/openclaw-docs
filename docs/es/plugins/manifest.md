---
read_when:
    - Estás creando un plugin de OpenClaw
    - Necesitas distribuir un esquema de configuración de plugin o depurar errores de validación del plugin
summary: Requisitos del manifiesto del plugin + esquema JSON (validación estricta de configuración)
title: Manifiesto del plugin
x-i18n:
    generated_at: "2026-04-06T03:09:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f915a761cdb5df77eba5d2ccd438c65445bd2ab41b0539d1200e63e8cf2c3a
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifiesto del plugin (openclaw.plugin.json)

Esta página es solo para el **manifiesto nativo de plugins de OpenClaw**.

Para diseños de bundles compatibles, consulta [Plugin bundles](/es/plugins/bundles).

Los formatos de bundles compatibles usan distintos archivos de manifiesto:

- Bundle de Codex: `.codex-plugin/plugin.json`
- Bundle de Claude: `.claude-plugin/plugin.json` o el diseño predeterminado de componentes de Claude
  sin manifiesto
- Bundle de Cursor: `.cursor-plugin/plugin.json`

OpenClaw también detecta automáticamente esos diseños de bundles, pero no se validan
contra el esquema de `openclaw.plugin.json` descrito aquí.

Para bundles compatibles, OpenClaw actualmente lee los metadatos del bundle más las
raíces de Skills declaradas, las raíces de comandos de Claude, los valores predeterminados de `settings.json` del bundle de Claude,
los valores predeterminados de LSP del bundle de Claude y los paquetes de hooks compatibles cuando el diseño coincide con las expectativas del tiempo de ejecución de OpenClaw.

Todo plugin nativo de OpenClaw **debe** incluir un archivo `openclaw.plugin.json` en la
**raíz del plugin**. OpenClaw usa este manifiesto para validar la configuración
**sin ejecutar código del plugin**. Los manifiestos faltantes o no válidos se tratan como
errores del plugin y bloquean la validación de la configuración.

Consulta la guía completa del sistema de plugins: [Plugins](/es/tools/plugin).
Para el modelo nativo de capacidades y la guía actual de compatibilidad externa:
[Modelo de capacidades](/es/plugins/architecture#public-capability-model).

## Qué hace este archivo

`openclaw.plugin.json` son los metadatos que OpenClaw lee antes de cargar el
código de tu plugin.

Úsalo para:

- identidad del plugin
- validación de configuración
- metadatos de autenticación e incorporación que deben estar disponibles sin iniciar el tiempo de ejecución
  del plugin
- metadatos de alias y autoactivación que deben resolverse antes de que se cargue el tiempo de ejecución del plugin
- metadatos abreviados de propiedad de familias de modelos que deben activar automáticamente el
  plugin antes de que se cargue el tiempo de ejecución
- instantáneas estáticas de propiedad de capacidades usadas para el cableado de compatibilidad
  integrado y la cobertura de contratos
- metadatos de configuración específicos del canal que deben fusionarse en el catálogo y en las superficies
  de validación sin cargar el tiempo de ejecución
- sugerencias de IU para la configuración

No lo uses para:

- registrar comportamiento en tiempo de ejecución
- declarar puntos de entrada del código
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

## Ejemplo enriquecido

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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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
| `configSchema`                      | Sí          | `object`                         | JSON Schema inline para la configuración de este plugin.                                                                                                                                                      |
| `enabledByDefault`                  | No          | `true`                           | Marca un plugin integrado como habilitado de forma predeterminada. Omítelo, o establece cualquier valor distinto de `true`, para dejar el plugin deshabilitado de forma predeterminada.                     |
| `legacyPluginIds`                   | No          | `string[]`                       | IDs heredados que se normalizan a este ID canónico del plugin.                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders` | No          | `string[]`                       | IDs de proveedores que deben habilitar automáticamente este plugin cuando la autenticación, la configuración o las referencias de modelo los mencionan.                                                      |
| `kind`                              | No          | `"memory"` \| `"context-engine"` | Declara un tipo exclusivo de plugin usado por `plugins.slots.*`.                                                                                                                                              |
| `channels`                          | No          | `string[]`                       | IDs de canales propiedad de este plugin. Se usan para descubrimiento y validación de configuración.                                                                                                           |
| `providers`                         | No          | `string[]`                       | IDs de proveedores propiedad de este plugin.                                                                                                                                                                  |
| `modelSupport`                      | No          | `object`                         | Metadatos abreviados de familias de modelos propiedad del manifiesto usados para cargar automáticamente el plugin antes del tiempo de ejecución.                                                              |
| `providerAuthEnvVars`               | No          | `Record<string, string[]>`       | Metadatos ligeros de variables de entorno de autenticación de proveedor que OpenClaw puede inspeccionar sin cargar código del plugin.                                                                         |
| `providerAuthChoices`               | No          | `object[]`                       | Metadatos ligeros de opciones de autenticación para selectores de incorporación, resolución de proveedor preferido y cableado simple de flags de CLI.                                                        |
| `contracts`                         | No          | `object`                         | Instantánea estática de capacidades integradas para voz, transcripción en tiempo real, voz en tiempo real, comprensión de medios, generación de imágenes, generación de música, generación de video, web-fetch, búsqueda web y propiedad de herramientas. |
| `channelConfigs`                    | No          | `Record<string, object>`         | Metadatos de configuración de canal propiedad del manifiesto que se fusionan en las superficies de descubrimiento y validación antes de que se cargue el tiempo de ejecución.                                |
| `skills`                            | No          | `string[]`                       | Directorios de Skills que se cargarán, relativos a la raíz del plugin.                                                                                                                                         |
| `name`                              | No          | `string`                         | Nombre legible del plugin.                                                                                                                                                                                    |
| `description`                       | No          | `string`                         | Resumen breve que se muestra en las superficies del plugin.                                                                                                                                                    |
| `version`                           | No          | `string`                         | Versión informativa del plugin.                                                                                                                                                                               |
| `uiHints`                           | No          | `Record<string, object>`         | Etiquetas de IU, placeholders y sugerencias de sensibilidad para los campos de configuración.                                                                                                                 |

## Referencia de providerAuthChoices

Cada entrada de `providerAuthChoices` describe una opción de incorporación o autenticación.
OpenClaw la lee antes de que se cargue el tiempo de ejecución del proveedor.

| Campo                 | Obligatorio | Tipo                                            | Qué significa                                                                                              |
| --------------------- | ----------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `provider`            | Sí          | `string`                                        | ID del proveedor al que pertenece esta opción.                                                             |
| `method`              | Sí          | `string`                                        | ID del método de autenticación al que se enviará.                                                          |
| `choiceId`            | Sí          | `string`                                        | ID estable de opción de autenticación usado por los flujos de incorporación y CLI.                        |
| `choiceLabel`         | No          | `string`                                        | Etiqueta visible para el usuario. Si se omite, OpenClaw usa `choiceId` como respaldo.                     |
| `choiceHint`          | No          | `string`                                        | Texto breve de ayuda para el selector.                                                                     |
| `assistantPriority`   | No          | `number`                                        | Los valores más bajos se ordenan antes en los selectores interactivos controlados por el asistente.       |
| `assistantVisibility` | No          | `"visible"` \| `"manual-only"`                  | Oculta la opción de los selectores del asistente, pero sigue permitiendo la selección manual por CLI.     |
| `deprecatedChoiceIds` | No          | `string[]`                                      | IDs heredados de opciones que deben redirigir a los usuarios a esta opción de reemplazo.                  |
| `groupId`             | No          | `string`                                        | ID opcional de grupo para agrupar opciones relacionadas.                                                   |
| `groupLabel`          | No          | `string`                                        | Etiqueta visible para el usuario para ese grupo.                                                           |
| `groupHint`           | No          | `string`                                        | Texto breve de ayuda para el grupo.                                                                        |
| `optionKey`           | No          | `string`                                        | Clave de opción interna para flujos simples de autenticación con una sola flag.                            |
| `cliFlag`             | No          | `string`                                        | Nombre de la flag de CLI, como `--openrouter-api-key`.                                                     |
| `cliOption`           | No          | `string`                                        | Forma completa de la opción de CLI, como `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No          | `string`                                        | Descripción usada en la ayuda de la CLI.                                                                   |
| `onboardingScopes`    | No          | `Array<"text-inference" \| "image-generation">` | En qué superficies de incorporación debe aparecer esta opción. Si se omite, usa por defecto `["text-inference"]`. |

## Referencia de uiHints

`uiHints` es un mapa de nombres de campos de configuración a pequeñas sugerencias de renderizado.

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

Cada sugerencia de campo puede incluir:

| Campo         | Tipo       | Qué significa                            |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etiqueta del campo visible para el usuario. |
| `help`        | `string`   | Texto breve de ayuda.                    |
| `tags`        | `string[]` | Etiquetas opcionales de IU.              |
| `advanced`    | `boolean`  | Marca el campo como avanzado.            |
| `sensitive`   | `boolean`  | Marca el campo como secreto o sensible.  |
| `placeholder` | `string`   | Texto placeholder para entradas de formulario. |

## Referencia de contracts

Usa `contracts` solo para metadatos estáticos de propiedad de capacidades que OpenClaw pueda
leer sin importar el tiempo de ejecución del plugin.

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

| Campo                            | Tipo       | Qué significa                                                     |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | IDs de proveedores de voz propiedad de este plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | IDs de proveedores de transcripción en tiempo real de este plugin. |
| `realtimeVoiceProviders`         | `string[]` | IDs de proveedores de voz en tiempo real propiedad de este plugin. |
| `mediaUnderstandingProviders`    | `string[]` | IDs de proveedores de comprensión de medios propiedad de este plugin. |
| `imageGenerationProviders`       | `string[]` | IDs de proveedores de generación de imágenes propiedad de este plugin. |
| `videoGenerationProviders`       | `string[]` | IDs de proveedores de generación de video propiedad de este plugin. |
| `webFetchProviders`              | `string[]` | IDs de proveedores de web-fetch propiedad de este plugin.         |
| `webSearchProviders`             | `string[]` | IDs de proveedores de búsqueda web propiedad de este plugin.      |
| `tools`                          | `string[]` | Nombres de herramientas de agente propiedad de este plugin para comprobaciones de contratos integrados. |

## Referencia de channelConfigs

Usa `channelConfigs` cuando un plugin de canal necesita metadatos ligeros de configuración antes
de que se cargue el tiempo de ejecución.

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

| Campo         | Tipo                     | Qué significa                                                                                 |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema para `channels.<id>`. Obligatorio para cada entrada de configuración de canal declarada. |
| `uiHints`     | `Record<string, object>` | Etiquetas/placeholders/sugerencias de sensibilidad de IU opcionales para esa sección de configuración del canal. |
| `label`       | `string`                 | Etiqueta del canal que se fusiona en las superficies de selector e inspección cuando los metadatos del tiempo de ejecución no están listos. |
| `description` | `string`                 | Descripción breve del canal para las superficies de inspección y catálogo.                    |
| `preferOver`  | `string[]`               | IDs de plugins heredados o de menor prioridad a los que este canal debe superar en las superficies de selección. |

## Referencia de modelSupport

Usa `modelSupport` cuando OpenClaw debe inferir tu plugin de proveedor a partir de
IDs abreviados de modelo como `gpt-5.4` o `claude-sonnet-4.6` antes de que se cargue
el tiempo de ejecución del plugin.

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
- si un plugin no integrado y uno integrado coinciden, gana el plugin no integrado
- la ambigüedad restante se ignora hasta que el usuario o la configuración especifiquen un proveedor

Campos:

| Campo           | Tipo       | Qué significa                                                                      |
| --------------- | ---------- | ---------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefijos comparados con `startsWith` frente a IDs abreviados de modelo.            |
| `modelPatterns` | `string[]` | Fuentes regex comparadas con IDs abreviados de modelo después de quitar sufijos de perfil. |

Las claves heredadas de capacidades de nivel superior están obsoletas. Usa `openclaw doctor --fix` para
mover `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` y `webSearchProviders` bajo `contracts`; la carga normal
del manifiesto ya no trata esos campos de nivel superior como propiedad de
capacidades.

## Manifiesto frente a package.json

Los dos archivos cumplen funciones distintas:

| Archivo                | Úsalo para                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Descubrimiento, validación de configuración, metadatos de opciones de autenticación y sugerencias de IU que deben existir antes de que se ejecute el código del plugin |
| `package.json`         | Metadatos de npm, instalación de dependencias y el bloque `openclaw` usado para puntos de entrada, controles de instalación, configuración o metadatos de catálogo |

Si no estás seguro de dónde debe ir una pieza de metadatos, usa esta regla:

- si OpenClaw debe conocerla antes de cargar el código del plugin, colócala en `openclaw.plugin.json`
- si trata sobre empaquetado, archivos de entrada o comportamiento de instalación de npm, colócala en `package.json`

### Campos de package.json que afectan el descubrimiento

Parte de los metadatos de plugins previos al tiempo de ejecución viven intencionadamente en `package.json` dentro del
bloque `openclaw` en lugar de `openclaw.plugin.json`.

Ejemplos importantes:

| Campo                                                             | Qué significa                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Declara puntos de entrada nativos del plugin.                                                                                                |
| `openclaw.setupEntry`                                             | Punto de entrada ligero solo para configuración usado durante la incorporación y el inicio diferido de canales.                             |
| `openclaw.channel`                                                | Metadatos ligeros de catálogo de canales, como etiquetas, rutas de documentación, alias y texto de selección.                              |
| `openclaw.channel.configuredState`                                | Metadatos ligeros del comprobador de estado configurado que pueden responder “¿ya existe una configuración solo con variables de entorno?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.channel.persistedAuthState`                             | Metadatos ligeros del comprobador de autenticación persistida que pueden responder “¿ya hay algo con sesión iniciada?” sin cargar el tiempo de ejecución completo del canal. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Sugerencias de instalación/actualización para plugins integrados y publicados externamente.                                                 |
| `openclaw.install.defaultChoice`                                  | Ruta de instalación preferida cuando hay varias fuentes de instalación disponibles.                                                         |
| `openclaw.install.minHostVersion`                                 | Versión mínima compatible del host OpenClaw, usando un límite inferior semver como `>=2026.3.22`.                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | Permite una ruta limitada de recuperación mediante reinstalación de plugin integrado cuando la configuración es inválida.                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permite que las superficies de canal solo de configuración se carguen antes del plugin completo del canal durante el inicio.               |

`openclaw.install.minHostVersion` se aplica durante la instalación y la carga del registro
de manifiestos. Los valores no válidos se rechazan; los valores válidos pero más nuevos omiten el
plugin en hosts más antiguos.

`openclaw.install.allowInvalidConfigRecovery` es intencionadamente limitado. No
hace instalables configuraciones arbitrariamente rotas. Hoy solo permite que los flujos de instalación
se recuperen de fallos concretos y obsoletos de actualización de plugins integrados, como una
ruta faltante de plugin integrado o una entrada obsoleta `channels.<id>` para ese mismo
plugin integrado. Los errores de configuración no relacionados siguen bloqueando la instalación y envían a los operadores
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` es un metadato de paquete para un pequeño
módulo de comprobación:

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

Úsalo cuando la configuración, doctor o los flujos de estado configurado necesiten una
comprobación ligera de sí/no sobre autenticación antes de que se cargue el plugin completo del canal. La exportación de destino debe ser una pequeña
función que lea solo el estado persistido; no la enrutes a través del barrel completo
del tiempo de ejecución del canal.

`openclaw.channel.configuredState` sigue la misma forma para comprobaciones ligeras de estado
configurado solo con variables de entorno:

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

Úsalo cuando un canal pueda responder el estado configurado a partir de variables de entorno u otras entradas
mínimas no relacionadas con el tiempo de ejecución. Si la comprobación necesita resolución completa de configuración o el
tiempo de ejecución real del canal, mantén esa lógica en el hook `config.hasConfiguredState`
del plugin.

## Requisitos de JSON Schema

- **Todo plugin debe incluir un JSON Schema**, incluso si no acepta configuración.
- Se acepta un esquema vacío (por ejemplo, `{ "type": "object", "additionalProperties": false }`).
- Los esquemas se validan en el momento de lectura/escritura de la configuración, no en tiempo de ejecución.

## Comportamiento de validación

- Las claves desconocidas de `channels.*` son **errores**, a menos que el ID del canal esté declarado por
  un manifiesto de plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` y `plugins.slots.*`
  deben hacer referencia a IDs de plugin **detectables**. Los IDs desconocidos son **errores**.
- Si un plugin está instalado pero tiene un manifiesto o esquema roto o faltante,
  la validación falla y Doctor informa el error del plugin.
- Si existe configuración del plugin pero el plugin está **deshabilitado**, la configuración se conserva y
  aparece una **advertencia** en Doctor + logs.

Consulta [Referencia de configuración](/es/gateway/configuration) para ver el esquema completo de `plugins.*`.

## Notas

- El manifiesto es **obligatorio para plugins nativos de OpenClaw**, incluidas las cargas desde el sistema de archivos local.
- El tiempo de ejecución sigue cargando el módulo del plugin por separado; el manifiesto es solo para
  descubrimiento + validación.
- Los manifiestos nativos se analizan con JSON5, por lo que se aceptan comentarios, comas finales y
  claves sin comillas siempre que el valor final siga siendo un objeto.
- El cargador de manifiestos solo lee los campos documentados del manifiesto. Evita añadir
  aquí claves personalizadas de nivel superior.
- `providerAuthEnvVars` es la ruta de metadatos ligera para sondeos de autenticación, validación
  de marcadores de variables de entorno y superficies similares de autenticación de proveedores que no deberían iniciar el tiempo de ejecución del plugin
  solo para inspeccionar nombres de variables de entorno.
- `providerAuthChoices` es la ruta de metadatos ligera para selectores de opciones de autenticación,
  resolución de `--auth-choice`, mapeo de proveedor preferido y registro simple
  de flags de CLI de incorporación antes de que se cargue el tiempo de ejecución del proveedor. Para metadatos
  del asistente de tiempo de ejecución que requieren código del proveedor, consulta
  [Provider runtime hooks](/es/plugins/architecture#provider-runtime-hooks).
- Los tipos exclusivos de plugins se seleccionan mediante `plugins.slots.*`.
  - `kind: "memory"` se selecciona mediante `plugins.slots.memory`.
  - `kind: "context-engine"` se selecciona mediante `plugins.slots.contextEngine`
    (predeterminado: `legacy` integrado).
- `channels`, `providers` y `skills` pueden omitirse cuando un
  plugin no los necesita.
- Si tu plugin depende de módulos nativos, documenta los pasos de compilación y cualquier
  requisito de lista permitida del gestor de paquetes (por ejemplo, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Relacionado

- [Building Plugins](/es/plugins/building-plugins) — primeros pasos con plugins
- [Plugin Architecture](/es/plugins/architecture) — arquitectura interna
- [SDK Overview](/es/plugins/sdk-overview) — referencia del Plugin SDK
