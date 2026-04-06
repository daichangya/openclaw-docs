---
read_when:
    - Quieres usar modelos Grok en OpenClaw
    - Estás configurando la autenticación de xAI o los IDs de modelo
summary: Usa modelos Grok de xAI en OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-06T03:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64bc899655427cc10bdc759171c7d1ec25ad9f1e4f9d803f1553d3d586c6d71d
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw incluye un plugin de proveedor `xai` para modelos Grok.

## Configuración

1. Crea una clave API en la consola de xAI.
2. Establece `XAI_API_KEY`, o ejecuta:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Elige un modelo como:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw ahora usa la API xAI Responses como transporte xAI incluido. La misma
`XAI_API_KEY` también puede alimentar `web_search` respaldado por Grok, `x_search`
de primera clase y `code_execution` remoto.
Si almacenas una clave de xAI en `plugins.entries.xai.config.webSearch.apiKey`,
el proveedor de modelos xAI incluido ahora también reutiliza esa clave como fallback.
La configuración de `code_execution` se encuentra en `plugins.entries.xai.config.codeExecution`.

## Catálogo actual de modelos incluidos

OpenClaw ahora incluye estas familias de modelos xAI listas para usar:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

El plugin también resuelve hacia adelante IDs más nuevos `grok-4*` y `grok-code-fast*` cuando
siguen la misma forma de API.

Notas sobre modelos rápidos:

- `grok-4-fast`, `grok-4-1-fast` y las variantes `grok-4.20-beta-*` son las
  referencias Grok con capacidad de imagen actuales en el catálogo incluido.
- `/fast on` o `agents.defaults.models["xai/<model>"].params.fastMode: true`
  reescriben las solicitudes nativas de xAI del siguiente modo:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Los alias heredados de compatibilidad siguen normalizándose a los IDs canónicos incluidos. Por
ejemplo:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Búsqueda web

El proveedor incluido de búsqueda web `grok` también usa `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Generación de video

El plugin incluido `xai` también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `xai/grok-imagine-video`
- Modos: texto a video, imagen a video y flujos remotos de edición/extensión de video
- Admite `aspectRatio` y `resolution`
- Límite actual: no se aceptan búferes de video locales; usa URL remotas `http(s)`
  para entradas de referencia/edición de video

Para usar xAI como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

Consulta [Video Generation](/tools/video-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Límites conocidos

- La autenticación hoy es solo mediante clave API. OpenClaw todavía no tiene flujo OAuth/código de dispositivo para xAI.
- `grok-4.20-multi-agent-experimental-beta-0304` no es compatible en la ruta normal del proveedor xAI porque requiere una superficie de API upstream distinta del transporte estándar xAI de OpenClaw.

## Notas

- OpenClaw aplica automáticamente correcciones de compatibilidad específicas de xAI para esquemas de herramientas y llamadas a herramientas en la ruta del ejecutor compartido.
- Las solicitudes nativas de xAI usan `tool_stream: true` de forma predeterminada. Establece
  `agents.defaults.models["xai/<model>"].params.tool_stream` en `false` para
  desactivarlo.
- La envoltura xAI incluida elimina indicadores estrictos de esquema de herramientas no compatibles y
  claves de payload de razonamiento antes de enviar solicitudes nativas de xAI.
- `web_search`, `x_search` y `code_execution` se exponen como herramientas de OpenClaw. OpenClaw habilita el componente integrado específico de xAI que necesita dentro de cada solicitud de herramienta en lugar de adjuntar todas las herramientas nativas a cada turno de chat.
- `x_search` y `code_execution` pertenecen al plugin xAI incluido en lugar de estar codificados de forma rígida en el tiempo de ejecución del modelo del núcleo.
- `code_execution` es ejecución remota en el sandbox de xAI, no [`exec`](/es/tools/exec) local.
- Para ver la descripción general más amplia de proveedores, consulta [Model providers](/es/providers/index).
