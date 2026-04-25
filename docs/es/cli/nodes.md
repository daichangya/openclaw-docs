---
read_when:
    - Estás gestionando nodos emparejados (cámaras, screen, canvas)
    - Necesitas aprobar solicitudes o invocar comandos de Node
summary: Referencia de CLI para `openclaw nodes` (status, emparejamiento, invoke, camera/canvas/screen)
title: Nodos
x-i18n:
    generated_at: "2026-04-25T13:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gestiona nodos emparejados (dispositivos) e invoca capacidades de Node.

Relacionado:

- Resumen de Nodes: [Nodos](/es/nodes)
- Cámara: [Nodos de cámara](/es/nodes/camera)
- Imágenes: [Nodos de imágenes](/es/nodes/images)

Opciones comunes:

- `--url`, `--token`, `--timeout`, `--json`

## Comandos comunes

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tablas de pendientes/emparejados. Las filas emparejadas incluyen la antigüedad de la conexión más reciente (Última conexión).
Usa `--connected` para mostrar solo los nodos conectados actualmente. Usa `--last-connected <duration>` para
filtrar los nodos que se conectaron dentro de una duración (por ejemplo, `24h`, `7d`).

Nota sobre aprobación:

- `openclaw nodes pending` solo necesita alcance de emparejamiento.
- `gateway.nodes.pairing.autoApproveCidrs` puede omitir el paso de pendientes solo para
  el emparejamiento explícitamente confiable y por primera vez de dispositivos `role: node`. Está desactivado de
  forma predeterminada y no aprueba actualizaciones.
- `openclaw nodes approve <requestId>` hereda requisitos de alcance adicionales de la
  solicitud pendiente:
  - solicitud sin comando: solo emparejamiento
  - comandos de Node sin exec: emparejamiento + escritura
  - `system.run` / `system.run.prepare` / `system.which`: emparejamiento + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Indicadores de invoke:

- `--params <json>`: cadena de objeto JSON (predeterminado `{}`).
- `--invoke-timeout <ms>`: tiempo de espera de invocación de Node (predeterminado `15000`).
- `--idempotency-key <key>`: clave de idempotencia opcional.
- `system.run` y `system.run.prepare` están bloqueados aquí; usa la herramienta `exec` con `host=node` para la ejecución de shell.

Para la ejecución de shell en un Node, usa la herramienta `exec` con `host=node` en lugar de `openclaw nodes run`.
La CLI de `nodes` ahora está centrada en capacidades: RPC directo mediante `nodes invoke`, además de emparejamiento, cámara,
screen, ubicación, canvas y notificaciones.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodos](/es/nodes)
