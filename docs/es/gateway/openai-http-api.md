---
read_when:
    - Integrar herramientas que esperan OpenAI Chat Completions
summary: Exponer un endpoint HTTP `/v1/chat/completions` compatible con OpenAI desde el Gateway
title: Chat completions de OpenAI
x-i18n:
    generated_at: "2026-04-25T13:47:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

El Gateway de OpenClaw puede servir un pequeño endpoint Chat Completions compatible con OpenAI.

Este endpoint está **deshabilitado de forma predeterminada**. Primero habilítalo en la configuración.

- `POST /v1/chat/completions`
- Mismo puerto que el Gateway (multiplexación WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Cuando la superficie HTTP compatible con OpenAI del Gateway está habilitada, también sirve:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Internamente, las solicitudes se ejecutan como una ejecución normal de agente del Gateway (la misma ruta de código que `openclaw agent`), por lo que el enrutamiento/permisos/configuración coinciden con tu Gateway.

## Autenticación

Usa la configuración de autenticación del Gateway.

Rutas comunes de autenticación HTTP:

- autenticación con secreto compartido (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticación HTTP confiable con identidad (`gateway.auth.mode="trusted-proxy"`):
  enruta a través del proxy con reconocimiento de identidad configurado y deja que inyecte los
  encabezados de identidad necesarios
- autenticación abierta de ingreso privado (`gateway.auth.mode="none"`):
  no se requiere encabezado de autenticación

Notas:

- Cuando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Cuando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Cuando `gateway.auth.mode="trusted-proxy"`, la solicitud HTTP debe venir de una
  fuente de proxy confiable configurada que no sea loopback; los proxies loopback en el mismo host no
  satisfacen este modo.
- Si `gateway.auth.rateLimit` está configurado y se producen demasiados fallos de autenticación, el endpoint devuelve `429` con `Retry-After`.

## Límite de seguridad (importante)

Trata este endpoint como una superficie de **acceso completo de operador** para la instancia del gateway.

- La autenticación HTTP bearer aquí no es un modelo de alcance estrecho por usuario.
- Un token/contraseña de Gateway válido para este endpoint debe tratarse como una credencial de propietario/operador.
- Las solicitudes se ejecutan a través de la misma ruta de agente del plano de control que las acciones confiables del operador.
- No existe un límite separado de herramientas para no propietarios/por usuario en este endpoint; una vez que quien llama supera la autenticación del Gateway aquí, OpenClaw trata a esa persona como un operador confiable para este gateway.
- Para los modos de autenticación con secreto compartido (`token` y `password`), el endpoint restaura los valores predeterminados normales de operador completo incluso si quien llama envía un encabezado `x-openclaw-scopes` más restringido.
- Los modos HTTP confiables con identidad (por ejemplo, autenticación por proxy confiable o `gateway.auth.mode="none"`) respetan `x-openclaw-scopes` cuando está presente y, en caso contrario, recurren al conjunto normal predeterminado de alcances de operador.
- Si la política del agente de destino permite herramientas sensibles, este endpoint puede usarlas.
- Mantén este endpoint solo en loopback/tailnet/ingreso privado; no lo expongas directamente a Internet público.

Matriz de autenticación:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - demuestra posesión del secreto compartido de operador del gateway
  - ignora `x-openclaw-scopes` más restringidos
  - restaura el conjunto completo predeterminado de alcances de operador:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - trata los turnos de chat en este endpoint como turnos de remitente propietario
- modos HTTP confiables con identidad (por ejemplo, autenticación por proxy confiable o `gateway.auth.mode="none"` en ingreso privado)
  - autentican alguna identidad externa confiable o límite de implementación
  - respetan `x-openclaw-scopes` cuando el encabezado está presente
  - recurren al conjunto normal predeterminado de alcances de operador cuando el encabezado está ausente
  - solo pierden semántica de propietario cuando quien llama restringe explícitamente los alcances y omite `operator.admin`

Consulta [Seguridad](/es/gateway/security) y [Acceso remoto](/es/gateway/remote).

## Contrato agent-first de modelo

OpenClaw trata el campo OpenAI `model` como un **destino de agente**, no como un ID de modelo de proveedor sin procesar.

- `model: "openclaw"` enruta al agente predeterminado configurado.
- `model: "openclaw/default"` también enruta al agente predeterminado configurado.
- `model: "openclaw/<agentId>"` enruta a un agente específico.

Encabezados de solicitud opcionales:

- `x-openclaw-model: <provider/model-or-bare-id>` sobrescribe el modelo backend para el agente seleccionado.
- `x-openclaw-agent-id: <agentId>` sigue siendo compatible como sobrescritura por compatibilidad.
- `x-openclaw-session-key: <sessionKey>` controla completamente el enrutamiento de sesión.
- `x-openclaw-message-channel: <channel>` establece el contexto sintético del canal de ingreso para prompts y políticas con reconocimiento de canal.

Alias de compatibilidad que siguen aceptándose:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Habilitar el endpoint

Establece `gateway.http.endpoints.chatCompletions.enabled` en `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Deshabilitar el endpoint

Establece `gateway.http.endpoints.chatCompletions.enabled` en `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Comportamiento de sesión

De forma predeterminada, el endpoint es **sin estado por solicitud** (se genera una nueva clave de sesión en cada llamada).

Si la solicitud incluye una cadena OpenAI `user`, el Gateway deriva una clave de sesión estable a partir de ella, por lo que las llamadas repetidas pueden compartir una sesión de agente.

## Por qué importa esta superficie

Este es el conjunto de compatibilidad de mayor impacto para frontends y herramientas autoalojados:

- La mayoría de configuraciones de Open WebUI, LobeChat y LibreChat esperan `/v1/models`.
- Muchos sistemas RAG esperan `/v1/embeddings`.
- Los clientes de chat OpenAI existentes normalmente pueden empezar con `/v1/chat/completions`.
- Los clientes más nativos de agentes prefieren cada vez más `/v1/responses`.

## Lista de modelos y enrutamiento de agentes

<AccordionGroup>
  <Accordion title="¿Qué devuelve `/v1/models`?">
    Una lista de destinos de agentes de OpenClaw.

    Los IDs devueltos son entradas `openclaw`, `openclaw/default` y `openclaw/<agentId>`.
    Úsalos directamente como valores OpenAI `model`.

  </Accordion>
  <Accordion title="¿`/v1/models` lista agentes o subagentes?">
    Lista destinos de agentes de nivel superior, no modelos backend de proveedor ni subagentes.

    Los subagentes siguen siendo topología interna de ejecución. No aparecen como pseudomodelos.

  </Accordion>
  <Accordion title="¿Por qué se incluye `openclaw/default`?">
    `openclaw/default` es el alias estable para el agente predeterminado configurado.

    Esto significa que los clientes pueden seguir usando un ID predecible incluso si el ID real del agente predeterminado cambia entre entornos.

  </Accordion>
  <Accordion title="¿Cómo sobrescribo el modelo backend?">
    Usa `x-openclaw-model`.

    Ejemplos:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Si lo omites, el agente seleccionado se ejecuta con su elección normal de modelo configurado.

  </Accordion>
  <Accordion title="¿Cómo encajan los embeddings en este contrato?">
    `/v1/embeddings` usa los mismos IDs `model` de destino de agente.

    Usa `model: "openclaw/default"` o `model: "openclaw/<agentId>"`.
    Cuando necesites un modelo de embeddings específico, envíalo en `x-openclaw-model`.
    Sin ese encabezado, la solicitud pasa a la configuración normal de embeddings del agente seleccionado.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Establece `stream: true` para recibir Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Cada línea de evento es `data: <json>`
- El stream termina con `data: [DONE]`

## Configuración rápida de Open WebUI

Para una conexión básica de Open WebUI:

- URL base: `http://127.0.0.1:18789/v1`
- URL base de Docker en macOS: `http://host.docker.internal:18789/v1`
- Clave de API: tu token bearer del Gateway
- Modelo: `openclaw/default`

Comportamiento esperado:

- `GET /v1/models` debe listar `openclaw/default`
- Open WebUI debe usar `openclaw/default` como ID de modelo de chat
- Si quieres un proveedor/modelo backend específico para ese agente, establece el modelo predeterminado normal del agente o envía `x-openclaw-model`

Prueba rápida:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Si eso devuelve `openclaw/default`, la mayoría de configuraciones de Open WebUI pueden conectarse con la misma URL base y token.

## Ejemplos

Sin streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Con streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Listar modelos:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Obtener un modelo:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Crear embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Notas:

- `/v1/models` devuelve destinos de agentes de OpenClaw, no catálogos sin procesar de proveedores.
- `openclaw/default` siempre está presente para que un único ID estable funcione en distintos entornos.
- Las sobrescrituras de proveedor/modelo backend pertenecen a `x-openclaw-model`, no al campo OpenAI `model`.
- `/v1/embeddings` admite `input` como cadena o matriz de cadenas.

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [OpenAI](/es/providers/openai)
