---
read_when:
    - Integración de clientes que usan la API OpenResponses
    - Quieres entradas basadas en elementos, llamadas de herramientas del cliente o eventos SSE
summary: Exponer un endpoint HTTP `/v1/responses` compatible con OpenResponses desde el Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-25T13:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

El Gateway de OpenClaw puede servir un endpoint `POST /v1/responses` compatible con OpenResponses.

Este endpoint está **deshabilitado de forma predeterminada**. Habilítalo primero en la configuración.

- `POST /v1/responses`
- Mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal de agente del Gateway (misma ruta de código que
`openclaw agent`), por lo que el enrutamiento/permisos/configuración coinciden con tu Gateway.

## Autenticación, seguridad y enrutamiento

El comportamiento operativo coincide con [OpenAI Chat Completions](/es/gateway/openai-http-api):

- usa la ruta de autenticación HTTP del Gateway correspondiente:
  - autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - autenticación con proxy confiable (`gateway.auth.mode="trusted-proxy"`): cabeceras de proxy con reconocimiento de identidad desde una fuente de proxy confiable no loopback configurada
  - autenticación abierta de entrada privada (`gateway.auth.mode="none"`): sin cabecera de autenticación
- trata el endpoint como acceso completo de operador para la instancia del gateway
- para los modos de autenticación con secreto compartido (`token` y `password`), ignora los valores más restringidos declarados en bearer `x-openclaw-scopes` y restaura los valores predeterminados normales completos de operador
- para los modos HTTP confiables con identidad portadora (por ejemplo, autenticación con proxy confiable o `gateway.auth.mode="none"`), respeta `x-openclaw-scopes` cuando está presente y, en caso contrario, usa como respaldo el conjunto de alcances predeterminado normal de operador
- selecciona agentes con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` o `x-openclaw-agent-id`
- usa `x-openclaw-model` cuando quieras sobrescribir el modelo backend del agente seleccionado
- usa `x-openclaw-session-key` para enrutamiento explícito de sesión
- usa `x-openclaw-message-channel` cuando quieras un contexto de canal de entrada sintético no predeterminado

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más restringido
  - restaura el conjunto completo predeterminado de alcances de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos de remitente propietario
- modos HTTP confiables con identidad portadora (por ejemplo, autenticación con proxy confiable, o `gateway.auth.mode="none"` en entrada privada)
  - respetan `x-openclaw-scopes` cuando la cabecera está presente
  - usan como respaldo el conjunto predeterminado normal de alcances de operador cuando la cabecera está ausente
  - solo pierden la semántica de propietario cuando quien llama restringe explícitamente los alcances y omite `operator.admin`

Habilita o deshabilita este endpoint con `gateway.http.endpoints.responses.enabled`.

La misma superficie de compatibilidad también incluye:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Para la explicación canónica de cómo encajan los modelos dirigidos al agente, `openclaw/default`, el pass-through de embeddings y las sobrescrituras de modelo backend, consulta [OpenAI Chat Completions](/es/gateway/openai-http-api#agent-first-model-contract) y [Lista de modelos y enrutamiento de agentes](/es/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamiento de la sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena `user` de OpenResponses, el Gateway deriva de ella una clave de sesión estable,
para que las llamadas repetidas puedan compartir una sesión de agente.

## Forma de la solicitud (compatible)

La solicitud sigue la API de OpenResponses con entrada basada en elementos. Compatibilidad actual:

- `input`: cadena o arreglo de objetos de elemento.
- `instructions`: se fusiona en el prompt del sistema.
- `tools`: definiciones de herramientas del cliente (herramientas de función).
- `tool_choice`: filtrar o exigir herramientas del cliente.
- `stream`: habilita streaming SSE.
- `max_output_tokens`: límite de salida de mejor esfuerzo (según el proveedor).
- `user`: enrutamiento estable de sesión.

Aceptado pero **actualmente ignorado**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Compatible:

- `previous_response_id`: OpenClaw reutiliza la sesión de la respuesta anterior cuando la solicitud permanece dentro del mismo ámbito de agente/usuario/sesión solicitada.

## Elementos (`input`)

### `message`

Roles: `system`, `developer`, `user`, `assistant`.

- `system` y `developer` se agregan al prompt del sistema.
- El elemento `user` o `function_call_output` más reciente se convierte en el “mensaje actual”.
- Los mensajes anteriores de usuario/asistente se incluyen como historial para dar contexto.

### `function_call_output` (herramientas por turnos)

Envía resultados de herramientas de vuelta al modelo:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` y `item_reference`

Se aceptan por compatibilidad de esquema, pero se ignoran al construir el prompt.

## Herramientas (herramientas de función del lado del cliente)

Proporciona herramientas con `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Si el agente decide llamar a una herramienta, la respuesta devuelve un elemento de salida `function_call`.
Luego envías una solicitud de seguimiento con `function_call_output` para continuar el turno.

## Imágenes (`input_image`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipos MIME permitidos (actuales): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Tamaño máximo (actual): 10MB.

## Archivos (`input_file`)

Admite fuentes base64 o URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Tipos MIME permitidos (actuales): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Tamaño máximo (actual): 5MB.

Comportamiento actual:

- El contenido del archivo se decodifica y se agrega al **prompt del sistema**, no al mensaje del usuario,
  para que permanezca efímero (no persiste en el historial de la sesión).
- El texto del archivo decodificado se envuelve como **contenido externo no confiable** antes de agregarse,
  por lo que los bytes del archivo se tratan como datos, no como instrucciones confiables.
- El bloque inyectado usa marcadores de límite explícitos como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e incluye una
  línea de metadatos `Source: External`.
- Esta ruta de entrada de archivos omite intencionalmente el largo banner `SECURITY NOTICE:`
  para preservar presupuesto del prompt; los marcadores de límite y metadatos siguen presentes.
- Los PDF se analizan primero para extraer texto. Si se encuentra poco texto, las primeras páginas se
  rasterizan en imágenes y se pasan al modelo, y el bloque de archivo inyectado usa
  el marcador `[PDF content rendered to images]`.

El análisis de PDF lo proporciona el Plugin incluido `document-extract`, que usa la
compilación heredada de `pdfjs-dist` compatible con Node (sin worker). La compilación moderna de PDF.js
espera workers del navegador/globales DOM, por lo que no se usa en el Gateway.

Valores predeterminados de obtención por URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total de partes `input_file` + `input_image` basadas en URL por solicitud)
- Las solicitudes están protegidas (resolución DNS, bloqueo de IP privadas, límites de redirección, tiempos de espera).
- Se admiten listas de permitidos opcionales por hostname para cada tipo de entrada (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host exacto: `"cdn.example.com"`
  - Subdominios con comodín: `"*.assets.example.com"` (no coincide con el apex)
  - Las listas de permitidos vacías u omitidas significan que no hay restricción de lista de permitidos por hostname.
- Para deshabilitar por completo las obtenciones basadas en URL, establece `files.allowUrl: false` y/o `images.allowUrl: false`.

## Límites de archivos + imágenes (configuración)

Los valores predeterminados pueden ajustarse en `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Valores predeterminados si se omiten:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Las fuentes `input_image` HEIC/HEIF se aceptan y se normalizan a JPEG antes de la entrega al proveedor.

Nota de seguridad:

- Las listas de permitidos de URL se aplican antes de la obtención y en los saltos de redirección.
- Permitir un hostname no omite el bloqueo de IP privadas/internas.
- Para gateways expuestos a internet, aplica controles de egreso de red además de las protecciones a nivel de aplicación.
  Consulta [Seguridad](/es/gateway/security).

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `event: <type>` y `data: <json>`
- El stream termina con `data: [DONE]`

Tipos de eventos emitidos actualmente:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (en caso de error)

## Uso

`usage` se completa cuando el proveedor subyacente informa conteos de tokens.
OpenClaw normaliza alias comunes de estilo OpenAI antes de que esos contadores lleguen
a las superficies posteriores de estado/sesión, incluidos `input_tokens` / `output_tokens`
y `prompt_tokens` / `completion_tokens`.

## Errores

Los errores usan un objeto JSON como este:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casos comunes:

- `401` autenticación faltante/no válida
- `400` cuerpo de solicitud no válido
- `405` método incorrecto

## Ejemplos

Sin streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Con streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Relacionado

- [OpenAI chat completions](/es/gateway/openai-http-api)
- [OpenAI](/es/providers/openai)
