---
read_when:
    - Quieres usar Qwen con OpenClaw
    - Antes usabas OAuth de Qwen
summary: Usa Qwen Cloud mediante el proveedor `qwen` empaquetado de OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-06T03:11:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f175793693ab6a4c3f1f4d42040e673c15faf7603a500757423e9e06977c989d
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Se eliminó OAuth de Qwen.** La integración OAuth del nivel gratuito
(`qwen-portal`) que usaba endpoints de `portal.qwen.ai` ya no está disponible.
Consulta [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
obtener contexto.

</Warning>

## Recomendado: Qwen Cloud

OpenClaw ahora trata a Qwen como un proveedor empaquetado de primera clase con el id canónico
`qwen`. El proveedor empaquetado apunta a los endpoints de Qwen Cloud / Alibaba DashScope y
Coding Plan, y mantiene los id heredados `modelstudio` funcionando como alias
de compatibilidad.

- Proveedor: `qwen`
- Variable de entorno preferida: `QWEN_API_KEY`
- También se aceptan por compatibilidad: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatible con OpenAI

Si quieres `qwen3.6-plus`, prefiere el endpoint **Standard (pay-as-you-go)**.
La compatibilidad con Coding Plan puede ir por detrás del catálogo público.

```bash
# Endpoint global de Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint de Coding Plan para China
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint global Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint para China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Los id heredados de `auth-choice` `modelstudio-*` y las referencias de modelo `modelstudio/...` todavía
funcionan como alias de compatibilidad, pero los nuevos flujos de configuración deben preferir los id canónicos
de `auth-choice` `qwen-*` y las referencias de modelo `qwen/...`.

Después del onboarding, establece un modelo predeterminado:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Tipos de plan y endpoints

| Plan                       | Región | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

El proveedor selecciona automáticamente el endpoint según tu `auth choice`. Las opciones canónicas
usan la familia `qwen-*`; `modelstudio-*` sigue siendo solo de compatibilidad.
Puedes sobrescribirlo con un `baseUrl` personalizado en la configuración.

Los endpoints nativos de Model Studio anuncian compatibilidad de uso de streaming en el
transporte compartido `openai-completions`. OpenClaw ahora basa esto en las capacidades del endpoint,
por lo que los id personalizados de proveedores compatibles con DashScope que apunten a los
mismos hosts nativos heredan el mismo comportamiento de uso de streaming en lugar de
requerir específicamente el id del proveedor integrado `qwen`.

## Obtén tu clave de API

- **Gestionar claves**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentación**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catálogo integrado

OpenClaw actualmente incluye este catálogo empaquetado de Qwen:

| Referencia de modelo        | Entrada     | Contexto  | Notas                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagen | 1,000,000 | Modelo predeterminado                              |
| `qwen/qwen3.6-plus`         | texto, imagen | 1,000,000 | Prefiere endpoints Standard cuando necesites este modelo |
| `qwen/qwen3-max-2026-01-23` | texto        | 262,144   | Línea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texto        | 262,144   | Código                                             |
| `qwen/qwen3-coder-plus`     | texto        | 1,000,000 | Código                                             |
| `qwen/MiniMax-M2.5`         | texto        | 1,000,000 | Razonamiento habilitado                            |
| `qwen/glm-5`                | texto        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagen | 262,144   | Moonshot AI a través de Alibaba                    |

La disponibilidad aún puede variar según el endpoint y el plan de facturación incluso cuando un modelo
está presente en el catálogo empaquetado.

La compatibilidad de uso de streaming nativo se aplica tanto a los hosts de Coding Plan como a
los hosts Standard compatibles con DashScope:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilidad de Qwen 3.6 Plus

`qwen3.6-plus` está disponible en los endpoints de Model Studio Standard (pay-as-you-go):

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Si los endpoints de Coding Plan devuelven un error de "unsupported model" para
`qwen3.6-plus`, cambia a Standard (pay-as-you-go) en lugar del par
endpoint/clave de Coding Plan.

## Plan de capacidades

La extensión `qwen` se está posicionando como el hogar del proveedor para toda la superficie de Qwen
Cloud, no solo para modelos de código/texto.

- Modelos de texto/chat: ya incluidos
- Llamada de herramientas, salida estructurada, thinking: heredados del transporte compatible con OpenAI
- Generación de imágenes: planificada en la capa de plugins de proveedor
- Comprensión de imágenes/video: ya incluida en el endpoint Standard
- Voz/audio: planificada en la capa de plugins de proveedor
- Embeddings/reranking de memoria: planificados a través de la superficie del adaptador de embeddings
- Generación de video: ya incluida mediante la capacidad compartida de generación de video

## Complementos multimodales

La extensión `qwen` ahora también expone:

- Comprensión de video mediante `qwen-vl-max-latest`
- Generación de video Wan mediante:
  - `wan2.6-t2v` (predeterminado)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Estas superficies multimodales usan los endpoints DashScope **Standard**, no los
endpoints de Coding Plan.

- URL base de Standard global/intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL base de Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Para la generación de video, OpenClaw asigna la región de Qwen configurada al host
AIGC de DashScope correspondiente antes de enviar el trabajo:

- Global/Intl: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Eso significa que un `models.providers.qwen.baseUrl` normal que apunte a cualquiera de los
hosts de Qwen de Coding Plan o Standard sigue manteniendo la generación de video en el endpoint
regional correcto de video de DashScope.

Para la generación de video, establece explícitamente un modelo predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Límites actuales de generación de video del Qwen empaquetado:

- Hasta **1** video de salida por solicitud
- Hasta **1** imagen de entrada
- Hasta **4** videos de entrada
- Hasta **10 segundos** de duración
- Admite `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
- El modo de imagen/video de referencia actualmente requiere **URLs remotas http(s)**. Las
  rutas de archivos locales se rechazan de entrada porque el endpoint de video de DashScope no
  acepta buffers locales subidos para esas referencias.

Consulta [Generación de video](/tools/video-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.

## Nota sobre el entorno

Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `QWEN_API_KEY` esté
disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
