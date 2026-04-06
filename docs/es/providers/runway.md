---
read_when:
    - Quieres usar la generación de video de Runway en OpenClaw
    - Necesitas la configuración de clave API/entorno de Runway
    - Quieres convertir Runway en el proveedor de video predeterminado
summary: Configuración de generación de video con Runway en OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T03:10:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc615d1a26f7a4b890d29461e756690c858ecb05024cf3c4d508218022da6e76
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw incluye un proveedor `runway` empaquetado para generación de video alojada.

- ID del proveedor: `runway`
- Autenticación: `RUNWAYML_API_SECRET` (canónico) o `RUNWAY_API_KEY`
- API: generación de video basada en tareas de Runway (sondeo `GET /v1/tasks/{id}`)

## Inicio rápido

1. Configura la clave API:

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Configura Runway como proveedor de video predeterminado:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. Pídele al agente que genere un video. Runway se usará automáticamente.

## Modos compatibles

| Modo           | Modelo             | Entrada de referencia      |
| -------------- | ------------------ | -------------------------- |
| Texto a video  | `gen4.5` (predeterminado) | Ninguna               |
| Imagen a video | `gen4.5`           | 1 imagen local o remota    |
| Video a video  | `gen4_aleph`       | 1 video local o remoto     |

- Se admiten referencias locales de imagen y video mediante URI de datos.
- Actualmente, video a video requiere específicamente `runway/gen4_aleph`.
- Actualmente, las ejecuciones de solo texto exponen relaciones de aspecto `16:9` y `9:16`.

## Configuración

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Relacionado

- [Generación de video](/tools/video-generation) -- parámetros compartidos de herramientas, selección de proveedor y comportamiento asíncrono
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults)
