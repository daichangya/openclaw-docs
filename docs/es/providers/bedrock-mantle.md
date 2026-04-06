---
read_when:
    - Quieres usar modelos OSS alojados en Bedrock Mantle con OpenClaw
    - Necesitas el endpoint compatible con OpenAI de Mantle para GPT-OSS, Qwen, Kimi o GLM
summary: Usa modelos de Amazon Bedrock Mantle (compatibles con OpenAI) con OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-06T03:10:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e5b33ede4067fb7de02a046f3e375cbd2af4bf68e7751c8dd687447f1a78c86
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw incluye un proveedor empaquetado de **Amazon Bedrock Mantle** que se conecta al
endpoint compatible con OpenAI de Mantle. Mantle aloja modelos de código abierto y de
terceros (GPT-OSS, Qwen, Kimi, GLM y similares) a través de una superficie estándar de
`/v1/chat/completions` respaldada por la infraestructura de Bedrock.

## Qué admite OpenClaw

- Proveedor: `amazon-bedrock-mantle`
- API: `openai-completions` (compatible con OpenAI)
- Autenticación: `AWS_BEARER_TOKEN_BEDROCK` explícito o generación de bearer token mediante la cadena de credenciales de IAM
- Región: `AWS_REGION` o `AWS_DEFAULT_REGION` (predeterminado: `us-east-1`)

## Descubrimiento automático de modelos

Cuando `AWS_BEARER_TOKEN_BEDROCK` está establecido, OpenClaw lo usa directamente. En caso contrario,
OpenClaw intenta generar un bearer token de Mantle a partir de la cadena de credenciales
predeterminada de AWS, incluidos perfiles compartidos de credenciales/configuración, SSO, identidad web y roles de instancia o tarea. Después descubre los modelos de Mantle
disponibles consultando el endpoint regional `/v1/models`. Los resultados del descubrimiento se
almacenan en caché durante 1 hora, y los bearer tokens derivados de IAM se actualizan cada hora.

Regiones compatibles: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Elige una ruta de autenticación en el **host del gateway**:

Bearer token explícito:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Optional (defaults to us-east-1):
export AWS_REGION="us-west-2"
```

Credenciales de IAM:

```bash
# Any AWS SDK-compatible auth source works here, for example:
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. Verifica que se descubran los modelos:

```bash
openclaw models list
```

Los modelos descubiertos aparecen bajo el proveedor `amazon-bedrock-mantle`. No
se requiere configuración adicional a menos que quieras sobrescribir los valores predeterminados.

## Configuración manual

Si prefieres una configuración explícita en lugar del descubrimiento automático:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Notas

- OpenClaw puede generar el bearer token de Mantle por ti a partir de credenciales de IAM
  compatibles con AWS SDK cuando `AWS_BEARER_TOKEN_BEDROCK` no está establecido.
- El bearer token es el mismo `AWS_BEARER_TOKEN_BEDROCK` usado por el proveedor estándar de
  [Amazon Bedrock](/es/providers/bedrock).
- La compatibilidad con razonamiento se infiere a partir de IDs de modelo que contienen patrones como
  `thinking`, `reasoner` o `gpt-oss-120b`.
- Si el endpoint de Mantle no está disponible o no devuelve modelos, el proveedor se
  omite silenciosamente.
