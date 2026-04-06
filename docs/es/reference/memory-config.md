---
read_when:
    - Quieres configurar proveedores de memory search o modelos de embeddings
    - Quieres configurar el backend QMD
    - Quieres ajustar la búsqueda híbrida, MMR o el decaimiento temporal
    - Quieres habilitar la indexación de memoria multimodal
summary: Todas las opciones de configuración para memory search, proveedores de embeddings, QMD, búsqueda híbrida e indexación multimodal
title: Referencia de configuración de memoria
x-i18n:
    generated_at: "2026-04-06T03:11:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0de0b85125443584f4e575cf673ca8d9bd12ecd849d73c537f4a17545afa93fd
    source_path: reference/memory-config.md
    workflow: 15
---

# Referencia de configuración de memoria

Esta página enumera todas las opciones de configuración para memory search de OpenClaw. Para
resúmenes conceptuales, consulta:

- [Resumen de memoria](/es/concepts/memory) -- cómo funciona la memoria
- [Motor integrado](/es/concepts/memory-builtin) -- backend predeterminado de SQLite
- [Motor QMD](/es/concepts/memory-qmd) -- sidecar local-first
- [Memory Search](/es/concepts/memory-search) -- pipeline de búsqueda y ajuste

Toda la configuración de memory search se encuentra en `agents.defaults.memorySearch` en
`openclaw.json`, salvo que se indique lo contrario.

---

## Selección de proveedor

| Clave      | Tipo      | Predeterminado  | Descripción                                                                                  |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `provider` | `string`  | detección automática    | ID del adaptador de embeddings: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | predeterminado del proveedor | Nombre del modelo de embeddings                                                                        |
| `fallback` | `string`  | `"none"`         | ID del adaptador de fallback cuando falla el principal                                                  |
| `enabled`  | `boolean` | `true`           | Habilitar o deshabilitar memory search                                                             |

### Orden de detección automática

Cuando `provider` no está establecido, OpenClaw selecciona el primero disponible:

1. `local` -- si `memorySearch.local.modelPath` está configurado y el archivo existe.
2. `openai` -- si se puede resolver una clave de OpenAI.
3. `gemini` -- si se puede resolver una clave de Gemini.
4. `voyage` -- si se puede resolver una clave de Voyage.
5. `mistral` -- si se puede resolver una clave de Mistral.
6. `bedrock` -- si se resuelve la cadena de credenciales del AWS SDK (rol de instancia, claves de acceso, perfil, SSO, identidad web o configuración compartida).

`ollama` es compatible, pero no se detecta automáticamente (debes establecerlo explícitamente).

### Resolución de claves de API

Los embeddings remotos requieren una clave de API. Bedrock usa en su lugar la cadena de credenciales
predeterminada del AWS SDK (roles de instancia, SSO, claves de acceso).

| Proveedor | Variable de entorno            | Clave de configuración                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | cadena de credenciales de AWS           | No necesita clave de API                 |
| Ollama   | `OLLAMA_API_KEY` (marcador de posición) | --                                |

Codex OAuth cubre solo chat/completions y no satisface
las solicitudes de embeddings.

---

## Configuración de endpoint remoto

Para endpoints personalizados compatibles con OpenAI o para sobrescribir valores predeterminados del proveedor:

| Clave              | Tipo     | Descripción                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | URL base personalizada de la API                                |
| `remote.apiKey`  | `string` | Sobrescribir la clave de API                                   |
| `remote.headers` | `object` | Encabezados HTTP adicionales (fusionados con los valores predeterminados del proveedor) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuración específica de Gemini

| Clave                    | Tipo     | Predeterminado                | Descripción                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | También admite `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 o 3072        |

<Warning>
Cambiar el modelo o `outputDimensionality` activa automáticamente una reindexación completa.
</Warning>

---

## Configuración de embeddings de Bedrock

Bedrock usa la cadena de credenciales predeterminada del AWS SDK; no se necesitan claves de API.
Si OpenClaw se ejecuta en EC2 con un rol de instancia con Bedrock habilitado, solo establece el
proveedor y el modelo:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Clave                    | Tipo     | Predeterminado                        | Descripción                     |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Cualquier ID de modelo de embeddings de Bedrock  |
| `outputDimensionality` | `number` | predeterminado del modelo                  | Para Titan V2: 256, 512 o 1024 |

### Modelos compatibles

Se admiten los siguientes modelos (con detección de familia y valores predeterminados
de dimensiones):

| ID de modelo                                   | Proveedor   | Dimensiones predeterminadas | Dimensiones configurables    |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

Las variantes con sufijo de rendimiento (por ejemplo, `amazon.titan-embed-text-v1:2:8k`) heredan
la configuración del modelo base.

### Autenticación

La autenticación de Bedrock usa el orden estándar de resolución de credenciales del AWS SDK:

1. Variables de entorno (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Caché de tokens SSO
3. Credenciales de token de identidad web
4. Archivos compartidos de credenciales y configuración
5. Credenciales de metadatos de ECS o EC2

La región se resuelve a partir de `AWS_REGION`, `AWS_DEFAULT_REGION`, el
`baseUrl` del proveedor `amazon-bedrock`, o usa por defecto `us-east-1`.

### Permisos de IAM

El rol o usuario de IAM necesita:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Para aplicar el principio de privilegio mínimo, limita `InvokeModel` al modelo específico:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configuración de embeddings locales

| Clave                   | Tipo     | Predeterminado                | Descripción                     |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | descargado automáticamente        | Ruta al archivo del modelo GGUF         |
| `local.modelCacheDir` | `string` | predeterminado de node-llama-cpp | Directorio de caché para modelos descargados |

Modelo predeterminado: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, descarga automática).
Requiere compilación nativa: `pnpm approve-builds` y luego `pnpm rebuild node-llama-cpp`.

---

## Configuración de búsqueda híbrida

Todo bajo `memorySearch.query.hybrid`:

| Clave                   | Tipo      | Predeterminado | Descripción                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Habilitar búsqueda híbrida BM25 + vectorial |
| `vectorWeight`        | `number`  | `0.7`   | Peso para puntuaciones vectoriales (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Peso para puntuaciones BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplicador del tamaño del conjunto de candidatos     |

### MMR (diversidad)

| Clave           | Tipo      | Predeterminado | Descripción                          |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Habilitar reclasificación MMR                |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = máxima diversidad, 1 = máxima relevancia |

### Decaimiento temporal (recencia)

| Clave                          | Tipo      | Predeterminado | Descripción               |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Habilitar impulso de recencia      |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | La puntuación se reduce a la mitad cada N días |

Los archivos permanentes (`MEMORY.md`, archivos no fechados en `memory/`) nunca se degradan.

### Ejemplo completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Rutas de memoria adicionales

| Clave          | Tipo       | Descripción                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Directorios o archivos adicionales para indexar |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Las rutas pueden ser absolutas o relativas al workspace. Los directorios se escanean
de forma recursiva en busca de archivos `.md`. El manejo de enlaces simbólicos depende del backend activo:
el motor integrado ignora los enlaces simbólicos, mientras que QMD sigue el comportamiento del escáner
subyacente de QMD.

Para la búsqueda de transcripciones entre agentes con ámbito de agente, usa
`agents.list[].memorySearch.qmd.extraCollections` en lugar de `memory.qmd.paths`.
Esas colecciones extra siguen la misma forma `{ path, name, pattern? }`, pero
se fusionan por agente y pueden conservar nombres compartidos explícitos cuando la ruta
apunta fuera del workspace actual.
Si la misma ruta resuelta aparece tanto en `memory.qmd.paths` como en
`memorySearch.qmd.extraCollections`, QMD conserva la primera entrada y omite el
duplicado.

---

## Memoria multimodal (Gemini)

Indexa imágenes y audio junto con Markdown usando Gemini Embedding 2:

| Clave                       | Tipo       | Predeterminado    | Descripción                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilitar indexación multimodal             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` o `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamaño máximo de archivo para indexación             |

Solo se aplica a los archivos en `extraPaths`. Las raíces de memoria predeterminadas siguen siendo solo Markdown.
Requiere `gemini-embedding-2-preview`. `fallback` debe ser `"none"`.

Formatos compatibles: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(imágenes); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Caché de embeddings

| Clave                | Tipo      | Predeterminado | Descripción                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Almacenar en caché embeddings de fragmentos en SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings en caché            |

Evita volver a generar embeddings de texto sin cambios durante la reindexación o actualizaciones de transcripciones.

---

## Indexación por lotes

| Clave                           | Tipo      | Predeterminado | Descripción                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Habilitar API de embeddings por lotes |
| `remote.batch.concurrency`    | `number`  | `2`     | Trabajos por lotes en paralelo        |
| `remote.batch.wait`           | `boolean` | `true`  | Esperar a que finalice el lote  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Intervalo de sondeo              |
| `remote.batch.timeoutMinutes` | `number`  | --      | Tiempo de espera del lote              |

Disponible para `openai`, `gemini` y `voyage`. Los lotes de OpenAI suelen ser
los más rápidos y baratos para rellenos grandes.

---

## Búsqueda de memoria de sesión (experimental)

Indexa transcripciones de sesión y muéstralas a través de `memory_search`:

| Clave                           | Tipo       | Predeterminado      | Descripción                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Habilitar indexación de sesiones                 |
| `sources`                     | `string[]` | `["memory"]` | Añade `"sessions"` para incluir transcripciones |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Umbral de bytes para reindexación              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Umbral de mensajes para reindexación           |

La indexación de sesiones es optativa y se ejecuta de forma asíncrona. Los resultados pueden estar
ligeramente desactualizados. Los registros de sesión viven en disco, así que trata el acceso al sistema de archivos como el
límite de confianza.

---

## Aceleración vectorial de SQLite (sqlite-vec)

| Clave                          | Tipo      | Predeterminado | Descripción                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Usar sqlite-vec para consultas vectoriales |
| `store.vector.extensionPath` | `string`  | empaquetado | Sobrescribir la ruta de sqlite-vec          |

Cuando sqlite-vec no está disponible, OpenClaw recurre automáticamente a similitud
de coseno en proceso.

---

## Almacenamiento del índice

| Clave                   | Tipo     | Predeterminado                               | Descripción                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Ubicación del índice (admite el token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizador FTS5 (`unicode61` o `trigram`)   |

---

## Configuración del backend QMD

Establece `memory.backend = "qmd"` para habilitarlo. Toda la configuración de QMD se encuentra en
`memory.qmd`:

| Clave                      | Tipo      | Predeterminado  | Descripción                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Ruta al ejecutable de QMD                          |
| `searchMode`             | `string`  | `search` | Comando de búsqueda: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Autoindexar `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | Rutas adicionales: `{ name, path, pattern? }`      |
| `sessions.enabled`       | `boolean` | `false`  | Indexar transcripciones de sesión                    |
| `sessions.retentionDays` | `number`  | --       | Retención de transcripciones                         |
| `sessions.exportDir`     | `string`  | --       | Directorio de exportación                             |

OpenClaw prefiere las formas actuales de colección QMD y de consulta MCP, pero mantiene
funcionando versiones anteriores de QMD recurriendo a indicadores heredados de colección `--mask`
y nombres anteriores de herramientas MCP cuando es necesario.

Las sobrescrituras de modelos de QMD permanecen del lado de QMD, no en la configuración de OpenClaw. Si necesitas
sobrescribir globalmente los modelos de QMD, establece variables de entorno como
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` y `QMD_GENERATE_MODEL` en el
entorno de runtime del gateway.

### Programación de actualizaciones

| Clave                       | Tipo      | Predeterminado | Descripción                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Intervalo de actualización                      |
| `update.debounceMs`       | `number`  | `15000` | Antirrebote de cambios de archivos                 |
| `update.onBoot`           | `boolean` | `true`  | Actualizar al iniciar                    |
| `update.waitForBootSync`  | `boolean` | `false` | Bloquear el inicio hasta que finalice la actualización |
| `update.embedInterval`    | `string`  | --      | Cadencia separada para embeddings                |
| `update.commandTimeoutMs` | `number`  | --      | Tiempo de espera para comandos de QMD              |
| `update.updateTimeoutMs`  | `number`  | --      | Tiempo de espera para operaciones de actualización de QMD     |
| `update.embedTimeoutMs`   | `number`  | --      | Tiempo de espera para operaciones de embeddings de QMD      |

### Límites

| Clave                       | Tipo     | Predeterminado | Descripción                |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults`       | `number` | `6`     | Máximo de resultados de búsqueda         |
| `limits.maxSnippetChars`  | `number` | --      | Limitar longitud del fragmento       |
| `limits.maxInjectedChars` | `number` | --      | Limitar total de caracteres inyectados |
| `limits.timeoutMs`        | `number` | `4000`  | Tiempo de espera de la búsqueda             |

### Alcance

Controla qué sesiones pueden recibir resultados de búsqueda de QMD. Mismo esquema que
[`session.sendPolicy`](/es/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

El valor predeterminado es solo DM. `match.keyPrefix` coincide con la clave de sesión normalizada;
`match.rawKeyPrefix` coincide con la clave sin procesar, incluida `agent:<id>:`.

### Citas

`memory.citations` se aplica a todos los backends:

| Valor            | Comportamiento                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (predeterminado) | Incluir pie `Source: <path#line>` en los fragmentos    |
| `on`             | Incluir siempre el pie                               |
| `off`            | Omitir el pie (la ruta aún se pasa al agente internamente) |

### Ejemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Sueños (experimental)

Sueños se configura en `plugins.entries.memory-core.config.dreaming`,
no en `agents.defaults.memorySearch`.

Sueños se ejecuta como un único barrido programado y usa fases internas ligera/profunda/REM como
detalle de implementación.

Para el comportamiento conceptual y los comandos de barra, consulta [Sueños](/concepts/dreaming).

### Configuración del usuario

| Clave         | Tipo      | Predeterminado     | Descripción                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Habilitar o deshabilitar por completo Sueños               |
| `frequency` | `string`  | `0 3 * * *` | Cadencia cron opcional para el barrido completo de Sueños |

### Ejemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Notas:

- Sueños escribe el estado de máquina en `memory/.dreams/`.
- Sueños escribe salida narrativa legible para humanos en `DREAMS.md` (o `dreams.md` existente).
- La política de fases ligera/profunda/REM y los umbrales son comportamiento interno, no configuración visible para el usuario.
