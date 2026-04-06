---
read_when:
    - Quieres usar modelos MiniMax en OpenClaw
    - Necesitas orientación para configurar MiniMax
summary: Usar modelos MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-06T03:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ca35c43cdde53f6f09d9e12d48ce09e4c099cf8cbe1407ac6dbb45b1422507e
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

El proveedor MiniMax de OpenClaw usa por defecto **MiniMax M2.7**.

MiniMax también ofrece:

- síntesis de voz integrada mediante T2A v2
- comprensión de imágenes integrada mediante `MiniMax-VL-01`
- generación de música integrada mediante `music-2.5+`
- `web_search` integrado mediante la API de búsqueda de MiniMax Coding Plan

División del proveedor:

- `minimax`: proveedor de texto con clave de API, además de generación de imágenes, comprensión de imágenes, voz y búsqueda web integradas
- `minimax-portal`: proveedor de texto con OAuth, además de generación de imágenes y comprensión de imágenes integradas

## Línea de modelos

- `MiniMax-M2.7`: modelo de razonamiento alojado predeterminado.
- `MiniMax-M2.7-highspeed`: nivel de razonamiento M2.7 más rápido.
- `image-01`: modelo de generación de imágenes (generación y edición de imagen a imagen).

## Generación de imágenes

El plugin de MiniMax registra el modelo `image-01` para la herramienta `image_generate`. Admite:

- **Generación de texto a imagen** con control de relación de aspecto.
- **Edición de imagen a imagen** (referencia de sujeto) con control de relación de aspecto.
- Hasta **9 imágenes de salida** por solicitud.
- Hasta **1 imagen de referencia** por solicitud de edición.
- Relaciones de aspecto admitidas: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Para usar MiniMax para generación de imágenes, configúralo como proveedor de generación de imágenes:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

El plugin usa la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto. No se necesita configuración adicional si MiniMax ya está configurado.

Tanto `minimax` como `minimax-portal` registran `image_generate` con el mismo
modelo `image-01`. Las configuraciones con clave de API usan `MINIMAX_API_KEY`; las configuraciones con OAuth pueden usar
la ruta de autenticación integrada `minimax-portal`.

Cuando el onboarding o la configuración con clave de API escriben entradas explícitas de `models.providers.minimax`,
OpenClaw materializa `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` con `input: ["text", "image"]`.

El catálogo de texto integrado de MiniMax en sí mismo sigue siendo metadatos solo de texto hasta
que exista esa configuración explícita del proveedor. La comprensión de imágenes se expone por separado
a través del proveedor multimedia `MiniMax-VL-01`, propiedad del plugin.

Consulta [Generación de imágenes](/es/tools/image-generation) para ver los
parámetros compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Generación de música

El plugin integrado `minimax` también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `minimax/music-2.5+`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles de prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

Para usar MiniMax como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

Consulta [Generación de música](/tools/music-generation) para ver los parámetros compartidos de la herramienta,
la selección de proveedor y el comportamiento de failover.

## Generación de video

El plugin integrado `minimax` también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modos: flujos de texto a video y de referencia de una sola imagen
- Admite `aspectRatio` y `resolution`

Para usar MiniMax como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

Consulta [Generación de video](/tools/video-generation) para ver los parámetros compartidos de la herramienta,
la selección de proveedor y el comportamiento de failover.

## Comprensión de imágenes

El plugin de MiniMax registra la comprensión de imágenes por separado del
catálogo de texto:

- `minimax`: modelo de imagen predeterminado `MiniMax-VL-01`
- `minimax-portal`: modelo de imagen predeterminado `MiniMax-VL-01`

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo del proveedor de texto integrado sigue mostrando referencias de chat M2.7 solo de texto.

## Búsqueda web

El plugin de MiniMax también registra `web_search` mediante la API de búsqueda de MiniMax Coding Plan.

- Id del proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptado: `MINIMAX_CODING_API_KEY`
- Alternativa de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a un token de coding plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URL base del proveedor MiniMax
- La búsqueda permanece en el id de proveedor `minimax`; la configuración OAuth CN/global todavía puede dirigir indirectamente la región mediante `models.providers.minimax-portal.baseUrl`

La configuración vive en `plugins.entries.minimax.config.webSearch.*`.
Consulta [MiniMax Search](/es/tools/minimax-search).

## Elegir una configuración

### OAuth de MiniMax (Coding Plan) - recomendado

**Ideal para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin necesidad de clave de API.

Autentícate con la opción explícita de OAuth regional:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# or
openclaw onboard --auth-choice minimax-cn-oauth
```

Correspondencia de opciones:

- `minimax-global-oauth`: usuarios internacionales (`api.minimax.io`)
- `minimax-cn-oauth`: usuarios en China (`api.minimaxi.com`)

Consulta el README del paquete del plugin MiniMax en el repositorio de OpenClaw para más detalles.

### MiniMax M2.7 (clave de API)

**Ideal para:** MiniMax alojado con API compatible con Anthropic.

Configura mediante la CLI:

- Onboarding interactivo:

```bash
openclaw onboard --auth-choice minimax-global-api
# or
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: usuarios internacionales (`api.minimax.io`)
- `minimax-cn-api`: usuarios en China (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

En la ruta de streaming compatible con Anthropic, OpenClaw ahora desactiva el
thinking de MiniMax de forma predeterminada, a menos que establezcas `thinking` explícitamente tú mismo. El
endpoint de streaming de MiniMax emite `reasoning_content` en fragmentos delta de estilo OpenAI
en lugar de bloques de thinking nativos de Anthropic, lo que puede filtrar el razonamiento interno
a la salida visible si se deja habilitado implícitamente.

### MiniMax M2.7 como fallback (ejemplo)

**Ideal para:** mantener tu modelo más potente y reciente como primario y hacer failover a MiniMax M2.7.
El ejemplo siguiente usa Opus como primario concreto; sustitúyelo por tu modelo primario de última generación preferido.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Configurar mediante `openclaw configure`

Usa el asistente interactivo de configuración para establecer MiniMax sin editar JSON:

1. Ejecuta `openclaw configure`.
2. Selecciona **Model/auth**.
3. Elige una opción de autenticación de **MiniMax**.
4. Selecciona tu modelo predeterminado cuando se te solicite.

Opciones actuales de autenticación MiniMax en el asistente/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Opciones de configuración

- `models.providers.minimax.baseUrl`: prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para cargas compatibles con OpenAI.
- `models.providers.minimax.api`: prefiere `anthropic-messages`; `openai-completions` es opcional para cargas compatibles con OpenAI.
- `models.providers.minimax.apiKey`: clave de API de MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: asigna alias a los modelos que quieras en la lista de permitidos.
- `models.mode`: mantén `merge` si quieres agregar MiniMax junto con los integrados.

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave de API: `minimax/<model>`
  - Configuración con OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- En `api: "anthropic-messages"`, OpenClaw inyecta
  `thinking: { type: "disabled" }` a menos que thinking ya esté establecido explícitamente en
  params/config.
- `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a
  `MiniMax-M2.7-highspeed` en la ruta de stream compatible con Anthropic.
- El onboarding y la configuración directa con clave de API escriben definiciones explícitas de modelo con
  `input: ["text", "image"]` para ambas variantes de M2.7
- El catálogo del proveedor integrado actualmente expone las referencias de chat como
  metadatos solo de texto hasta que exista una configuración explícita del proveedor MiniMax
- API de uso de Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requiere una clave de coding plan).
- OpenClaw normaliza el uso de coding plan de MiniMax al mismo formato de `% restante` usado
  por otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax corresponden a
  cuota restante, no cuota consumida, por lo que OpenClaw los invierte.
  Los campos basados en recuento tienen prioridad cuando están presentes. Cuando la API devuelve `model_remains`,
  OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana de
  `start_time` / `end_time` cuando es necesario, e incluye el nombre del modelo seleccionado
  en la etiqueta del plan para que las ventanas de coding plan sean más fáciles de distinguir.
- Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la
  misma superficie de cuota MiniMax, y prefieren el OAuth de MiniMax almacenado antes de recurrir
  a las variables de entorno de clave de Coding Plan.
- Actualiza los valores de precio en `models.json` si necesitas un seguimiento exacto de costos.
- Enlace de referencia para MiniMax Coding Plan (10% de descuento): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Consulta [/concepts/model-providers](/es/concepts/model-providers) para ver las reglas de proveedores.
- Usa `openclaw models list` para confirmar el id actual del proveedor y luego cambia con
  `openclaw models set minimax/MiniMax-M2.7` o
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Resolución de problemas

### "Unknown model: minimax/MiniMax-M2.7"

Esto normalmente significa que el **proveedor MiniMax no está configurado** (no hay una
entrada de proveedor coincidente y no se encontró ningún perfil/clave de entorno de autenticación MiniMax). Hay una corrección para esta
detección en **2026.1.12**. Soluciónalo así:

- Actualiza a **2026.1.12** (o ejecuta desde la rama `main` del código fuente), luego reinicia el gateway.
- Ejecuta `openclaw configure` y selecciona una opción de autenticación de **MiniMax**, o
- Agrega manualmente el bloque coincidente `models.providers.minimax` o
  `models.providers.minimax-portal`, o
- Establece `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación MiniMax
  para que pueda inyectarse el proveedor coincidente.

Asegúrate de que el id del modelo **distingue mayúsculas de minúsculas**:

- Ruta con clave de API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
- Ruta con OAuth: `minimax-portal/MiniMax-M2.7` o
  `minimax-portal/MiniMax-M2.7-highspeed`

Luego vuelve a comprobar con:

```bash
openclaw models list
```
