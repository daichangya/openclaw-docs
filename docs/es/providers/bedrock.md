---
read_when:
    - Quieres usar modelos de Amazon Bedrock con OpenClaw
    - Necesitas la configuración de credenciales/región de AWS para llamadas a modelos
summary: Usa modelos de Amazon Bedrock (API Converse) con OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-06T03:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70bb29fe9199084b1179ced60935b5908318f5b80ced490bf44a45e0467c4929
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw puede usar modelos de **Amazon Bedrock** mediante el proveedor de streaming **Bedrock Converse**
de pi‑ai. La autenticación de Bedrock usa la **cadena de credenciales predeterminada del AWS SDK**,
no una clave de API.

## Qué admite pi-ai

- Proveedor: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Autenticación: credenciales de AWS (variables de entorno, configuración compartida o rol de instancia)
- Región: `AWS_REGION` o `AWS_DEFAULT_REGION` (predeterminado: `us-east-1`)

## Descubrimiento automático de modelos

OpenClaw puede descubrir automáticamente modelos de Bedrock que admiten **streaming**
y **salida de texto**. El descubrimiento usa `bedrock:ListFoundationModels` y
`bedrock:ListInferenceProfiles`, y los resultados se almacenan en caché (predeterminado: 1 hora).

Cómo se habilita el proveedor implícito:

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` es `true`,
  OpenClaw intentará el descubrimiento incluso cuando no haya ningún marcador de entorno de AWS presente.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` no está establecido,
  OpenClaw solo añade automáticamente el
  proveedor implícito de Bedrock cuando ve uno de estos marcadores de autenticación de AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` o `AWS_PROFILE`.
- La ruta real de autenticación de runtime de Bedrock sigue usando la cadena predeterminada del AWS SDK, por lo que
  la configuración compartida, SSO y la autenticación de rol de instancia IMDS pueden funcionar incluso cuando el descubrimiento
  necesitó `enabled: true` para activarse.

Las opciones de configuración se encuentran en `plugins.entries.amazon-bedrock.config.discovery`:

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

Notas:

- `enabled` usa por defecto el modo automático. En modo automático, OpenClaw solo habilita el
  proveedor implícito de Bedrock cuando ve un marcador de entorno de AWS compatible.
- `region` usa por defecto `AWS_REGION` o `AWS_DEFAULT_REGION`, y luego `us-east-1`.
- `providerFilter` coincide con nombres de proveedor de Bedrock (por ejemplo `anthropic`).
- `refreshInterval` está en segundos; establécelo en `0` para desactivar el almacenamiento en caché.
- `defaultContextWindow` (predeterminado: `32000`) y `defaultMaxTokens` (predeterminado: `4096`)
  se usan para los modelos descubiertos (sobrescríbelos si conoces los límites de tu modelo).
- Para entradas explícitas `models.providers["amazon-bedrock"]`, OpenClaw aún puede
  resolver tempranamente la autenticación de Bedrock basada en marcadores de entorno a partir de marcadores de entorno de AWS como
  `AWS_BEARER_TOKEN_BEDROCK` sin forzar la carga completa de autenticación de runtime. La
  ruta real de autenticación para llamadas al modelo sigue usando la cadena predeterminada del AWS SDK.

## Onboarding

1. Asegúrate de que las credenciales de AWS estén disponibles en el **host del gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Opcional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Opcional (clave de API/bearer token de Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Añade un proveedor y un modelo de Bedrock a tu configuración (no se requiere `apiKey`):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## Roles de instancia de EC2

Cuando OpenClaw se ejecuta en una instancia EC2 con un rol de IAM adjunto, el AWS SDK
puede usar el servicio de metadatos de instancia (IMDS) para autenticación. Para el descubrimiento de modelos de Bedrock,
OpenClaw solo habilita automáticamente el proveedor implícito a partir de marcadores de entorno de AWS
a menos que establezcas explícitamente
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configuración recomendada para hosts respaldados por IMDS:

- Establece `plugins.entries.amazon-bedrock.config.discovery.enabled` en `true`.
- Establece `plugins.entries.amazon-bedrock.config.discovery.region` (o exporta `AWS_REGION`).
- **No** necesitas una clave de API falsa.
- Solo necesitas `AWS_PROFILE=default` si específicamente quieres un marcador de entorno
  para el modo automático o para las superficies de estado.

```bash
# Recomendado: habilitación explícita del descubrimiento + región
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Opcional: añade un marcador de entorno si quieres el modo automático sin habilitación explícita
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permisos de IAM requeridos** para el rol de instancia de EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (para descubrimiento automático)
- `bedrock:ListInferenceProfiles` (para descubrimiento de perfiles de inferencia)

O adjunta la política administrada `AmazonBedrockFullAccess`.

## Configuración rápida (ruta de AWS)

```bash
# 1. Crear rol de IAM y perfil de instancia
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Adjuntarlo a tu instancia EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. En la instancia EC2, habilitar explícitamente el descubrimiento
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: añade un marcador de entorno si quieres el modo automático sin habilitación explícita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifica que se descubran los modelos
openclaw models list
```

## Perfiles de inferencia

OpenClaw descubre **perfiles de inferencia regionales y globales** junto con
los modelos fundacionales. Cuando un perfil se asigna a un modelo fundacional conocido, el
perfil hereda las capacidades de ese modelo (ventana de contexto, tokens máximos,
razonamiento, visión) y la región correcta de solicitud de Bedrock se inyecta
automáticamente. Esto significa que los perfiles de Claude entre regiones funcionan sin sobrescrituras manuales
del proveedor.

Los ID de perfiles de inferencia tienen un formato como `us.anthropic.claude-opus-4-6-v1:0` (regional)
o `anthropic.claude-opus-4-6-v1:0` (global). Si el modelo subyacente ya está
en los resultados del descubrimiento, el perfil hereda su conjunto completo de capacidades;
de lo contrario, se aplican valores predeterminados seguros.

No se necesita configuración adicional. Siempre que el descubrimiento esté habilitado y el principal de IAM
tenga `bedrock:ListInferenceProfiles`, los perfiles aparecen junto con
los modelos fundacionales en `openclaw models list`.

## Notas

- Bedrock requiere que el **acceso al modelo** esté habilitado en tu cuenta/región de AWS.
- El descubrimiento automático necesita los permisos `bedrock:ListFoundationModels` y
  `bedrock:ListInferenceProfiles`.
- Si dependes del modo automático, establece uno de los marcadores de entorno de autenticación de AWS compatibles en el
  host del gateway. Si prefieres autenticación IMDS/configuración compartida sin marcadores de entorno, establece
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw muestra la fuente de credenciales en este orden: `AWS_BEARER_TOKEN_BEDROCK`,
  luego `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, luego `AWS_PROFILE`, y después la
  cadena predeterminada del AWS SDK.
- La compatibilidad con razonamiento depende del modelo; consulta la tarjeta del modelo de Bedrock para
  conocer las capacidades actuales.
- Si prefieres un flujo con clave administrada, también puedes colocar un proxy
  compatible con OpenAI delante de Bedrock y configurarlo como proveedor de OpenAI en su lugar.

## Guardrails

Puedes aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
a todas las invocaciones de modelos de Bedrock añadiendo un objeto `guardrail` a la
configuración del plugin `amazon-bedrock`. Guardrails te permiten aplicar filtrado de contenido,
denegación de temas, filtros de palabras, filtros de información sensible y comprobaciones de
fundamentación contextual.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // ID de guardrail o ARN completo
            guardrailVersion: "1", // número de versión o "DRAFT"
            streamProcessingMode: "sync", // opcional: "sync" o "async"
            trace: "enabled", // opcional: "enabled", "disabled" o "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (obligatorio) acepta un ID de guardrail (por ejemplo `abc123`) o un
  ARN completo (por ejemplo `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (obligatorio) especifica qué versión publicada usar, o
  `"DRAFT"` para el borrador de trabajo.
- `streamProcessingMode` (opcional) controla si la evaluación del guardrail se ejecuta
  de forma síncrona (`"sync"`) o asíncrona (`"async"`) durante el streaming. Si
  se omite, Bedrock usa su comportamiento predeterminado.
- `trace` (opcional) habilita la salida de trazas del guardrail en la respuesta de la API. Establécelo en
  `"enabled"` o `"enabled_full"` para depuración; omítelo o establécelo en `"disabled"` para
  producción.

El principal de IAM usado por el gateway debe tener el permiso `bedrock:ApplyGuardrail`
además de los permisos estándar de invocación.

## Embeddings para memory search

Bedrock también puede servir como proveedor de embeddings para
[memory search](/es/concepts/memory-search). Esto se configura por separado del
proveedor de inferencia: establece `agents.defaults.memorySearch.provider` en `"bedrock"`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0", // predeterminado
      },
    },
  },
}
```

Los embeddings de Bedrock usan la misma cadena de credenciales del AWS SDK que la inferencia (roles de
instancia, SSO, claves de acceso, configuración compartida e identidad web). No se
necesita una clave de API. Cuando `provider` es `"auto"`, Bedrock se detecta automáticamente si esa
cadena de credenciales se resuelve correctamente.

Los modelos de embeddings compatibles incluyen Amazon Titan Embed (v1, v2), Amazon Nova
Embed, Cohere Embed (v3, v4) y TwelveLabs Marengo. Consulta
[Referencia de configuración de memoria — Bedrock](/es/reference/memory-config#bedrock-embedding-config)
para ver la lista completa de modelos y las opciones de dimensiones.
