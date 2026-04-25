---
read_when:
    - Crear o depurar clientes de Node (modo Node de iOS/Android/macOS)
    - Investigar fallos de emparejamiento o autenticación del bridge
    - Auditar la superficie de Node expuesta por el gateway
summary: 'Protocolo histórico de bridge (Nodes heredados): TCP JSONL, emparejamiento, RPC con alcance limitado'
title: Protocolo de bridge
x-i18n:
    generated_at: "2026-04-25T13:45:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
El bridge TCP ha sido **eliminado**. Las compilaciones actuales de OpenClaw no incluyen el listener del bridge y las claves de configuración `bridge.*` ya no están en el esquema. Esta página se conserva solo como referencia histórica. Usa el [Protocolo de Gateway](/es/gateway/protocol) para todos los clientes de Node/operador.
</Warning>

## Por qué existía

- **Límite de seguridad**: el bridge expone una pequeña lista de permitidos en lugar de
  toda la superficie de API de Gateway.
- **Emparejamiento + identidad de Node**: la admisión de nodos pertenece a Gateway y está vinculada
  a un token por Node.
- **UX de descubrimiento**: los nodos pueden descubrir gateways mediante Bonjour en la LAN, o conectarse
  directamente a través de una tailnet.
- **WS de loopback**: todo el plano de control WS permanece local salvo que se canalice por SSH.

## Transporte

- TCP, un objeto JSON por línea (JSONL).
- TLS opcional (cuando `bridge.tls.enabled` es true).
- El puerto de escucha predeterminado histórico era `18790` (las compilaciones actuales no inician un
  bridge TCP).

Cuando TLS está habilitado, los registros TXT de descubrimiento incluyen `bridgeTls=1` más
`bridgeTlsSha256` como pista no secreta. Ten en cuenta que los registros TXT de Bonjour/mDNS no están
autenticados; los clientes no deben tratar la huella anunciada como una fijación autorizada sin una intención explícita del usuario u otra verificación fuera de banda.

## Handshake + emparejamiento

1. El cliente envía `hello` con metadatos del Node + token (si ya está emparejado).
2. Si no está emparejado, Gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. El cliente envía `pair-request`.
4. Gateway espera aprobación y luego envía `pair-ok` y `hello-ok`.

Históricamente, `hello-ok` devolvía `serverName` y podía incluir
`canvasHostUrl`.

## Tramas

Cliente → Gateway:

- `req` / `res`: RPC de Gateway con alcance limitado (chat, sesiones, config, health, voicewake, skills.bins)
- `event`: señales del Node (transcripción de voz, solicitud de agente, suscripción de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: actualizaciones de chat para sesiones suscritas
- `ping` / `pong`: keepalive

La aplicación heredada de la lista de permitidos residía en `src/gateway/server-bridge.ts` (eliminado).

## Eventos del ciclo de vida de Exec

Los nodos pueden emitir eventos `exec.finished` o `exec.denied` para mostrar actividad de system.run.
Estos se asignan a eventos del sistema en Gateway. (Los nodos heredados aún pueden emitir `exec.started`.)

Campos de la carga útil (todos opcionales salvo indicación contraria):

- `sessionKey` (obligatorio): sesión del agente que recibirá el evento del sistema.
- `runId`: ID único de exec para agrupación.
- `command`: cadena de comando sin procesar o con formato.
- `exitCode`, `timedOut`, `success`, `output`: detalles de finalización (solo finished).
- `reason`: motivo de denegación (solo denied).

## Uso histórico de tailnet

- Vincula el bridge a una IP de tailnet: `bridge.bind: "tailnet"` en
  `~/.openclaw/openclaw.json` (solo histórico; `bridge.*` ya no es válido).
- Los clientes se conectan mediante nombre MagicDNS o IP de tailnet.
- Bonjour **no** cruza redes; usa host/puerto manual o DNS‑SD de área amplia
  cuando sea necesario.

## Versionado

El bridge era **v1 implícito** (sin negociación mín/máx). Esta sección es
solo referencia histórica; los clientes actuales de Node/operador usan el WebSocket
[Protocolo de Gateway](/es/gateway/protocol).

## Relacionado

- [Protocolo de Gateway](/es/gateway/protocol)
- [Nodos](/es/nodes)
