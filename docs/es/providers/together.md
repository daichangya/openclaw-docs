---
read_when:
    - Quieres usar Together AI con OpenClaw
    - Necesitas la variable de entorno de la clave API o la opción de autenticación por CLI
summary: Configuración de Together AI (autenticación + selección de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-06T03:10:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68fdc15bfcac8d59e3e0c06a39162abd48d9d41a9a64a0ac622cd8e3f80a595
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) proporciona acceso a modelos líderes de código abierto, incluidos Llama, DeepSeek, Kimi y más, a través de una API unificada.

- Proveedor: `together`
- Autenticación: `TOGETHER_API_KEY`
- API: compatible con OpenAI
- URL base: `https://api.together.xyz/v1`

## Inicio rápido

1. Establece la clave API (recomendado: guardarla para el gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Establece un modelo predeterminado:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Ejemplo no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Esto establecerá `together/moonshotai/Kimi-K2.5` como modelo predeterminado.

## Nota sobre el entorno

Si el gateway se ejecuta como daemon (`launchd/systemd`), asegúrate de que `TOGETHER_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).

## Catálogo integrado

Actualmente, OpenClaw incluye este catálogo integrado de Together:

| Referencia de modelo                                         | Nombre                                 | Entrada     | Contexto   | Notas                            |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | texto, imagen | 262,144  | Modelo predeterminado; thinking habilitado |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | texto       | 202,752    | Modelo de texto de uso general   |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | texto       | 131,072    | Modelo rápido de instrucciones   |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | texto, imagen | 10,000,000 | Multimodal                     |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | texto, imagen | 20,000,000 | Multimodal                     |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | texto       | 131,072    | Modelo de texto general          |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | texto       | 131,072    | Modelo de razonamiento           |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | texto       | 262,144    | Modelo de texto Kimi secundario  |

El ajuste preestablecido de incorporación establece `together/moonshotai/Kimi-K2.5` como modelo predeterminado.

## Generación de video

El plugin integrado `together` también registra generación de video mediante la
herramienta compartida `video_generate`.

- Modelo de video predeterminado: `together/Wan-AI/Wan2.2-T2V-A14B`
- Modos: texto a video y flujos de referencia con una sola imagen
- Admite `aspectRatio` y `resolution`

Para usar Together como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

Consulta [Video Generation](/tools/video-generation) para ver los parámetros
compartidos de la herramienta, la selección de proveedor y el comportamiento de failover.
