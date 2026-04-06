---
read_when:
    - Quieres usar la generación de video Wan de Alibaba en OpenClaw
    - Necesitas la configuración de la clave API de Model Studio o DashScope para la generación de video
summary: Generación de video Wan de Alibaba Model Studio en OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-06T03:09:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 97a1eddc7cbd816776b9368f2a926b5ef9ee543f08d151a490023736f67dc635
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw incluye un proveedor integrado de generación de video `alibaba` para modelos Wan en
Alibaba Model Studio / DashScope.

- Proveedor: `alibaba`
- Autenticación preferida: `MODELSTUDIO_API_KEY`
- También se aceptan: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: generación asíncrona de video de DashScope / Model Studio

## Inicio rápido

1. Establece una clave API:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. Establece un modelo de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "alibaba/wan2.6-t2v",
      },
    },
  },
}
```

## Modelos Wan integrados

Actualmente, el proveedor integrado `alibaba` registra:

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## Límites actuales

- Hasta **1** video de salida por solicitud
- Hasta **1** imagen de entrada
- Hasta **4** videos de entrada
- Hasta **10 segundos** de duración
- Admite `size`, `aspectRatio`, `resolution`, `audio` y `watermark`
- Actualmente, el modo de imagen/video de referencia requiere **URL http(s) remotas**

## Relación con Qwen

El proveedor integrado `qwen` también usa endpoints de DashScope alojados por Alibaba para
la generación de video Wan. Usa:

- `qwen/...` cuando quieras la superficie canónica del proveedor Qwen
- `alibaba/...` cuando quieras la superficie directa de video Wan gestionada por el proveedor

## Relacionado

- [Video Generation](/tools/video-generation)
- [Qwen](/es/providers/qwen)
- [Configuration Reference](/es/gateway/configuration-reference#agent-defaults)
