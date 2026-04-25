---
read_when:
    - Ejecutar el host Node sin interfaz
    - Emparejar un Node que no es macOS para `system.run`
summary: Referencia de la CLI para `openclaw node` (host Node sin interfaz)
title: Node
x-i18n:
    generated_at: "2026-04-25T13:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d8c4b4697da3c0a4594dedd0033a114728ec599a7d33089a33e290e3cfafa5cd
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Ejecuta un **host Node sin interfaz** que se conecta al WebSocket del Gateway y expone
`system.run` / `system.which` en esta máquina.

## ¿Por qué usar un host Node?

Usa un host Node cuando quieras que los agentes **ejecuten comandos en otras máquinas** de tu
red sin instalar allí una aplicación complementaria completa para macOS.

Casos de uso habituales:

- Ejecutar comandos en equipos Linux/Windows remotos (servidores de compilación, máquinas de laboratorio, NAS).
- Mantener exec **aislado** en el Gateway, pero delegar ejecuciones aprobadas a otros hosts.
- Proporcionar un destino de ejecución ligero y sin interfaz para nodos de automatización o CI.

La ejecución sigue protegida por **aprobaciones de exec** y listas de permitidos por agente en el
host Node, para que puedas mantener el acceso a comandos limitado y explícito.

## Proxy del navegador (configuración cero)

Los hosts Node anuncian automáticamente un proxy del navegador si `browser.enabled` no está
deshabilitado en el nodo. Esto permite que el agente use automatización del navegador en ese nodo
sin configuración adicional.

De forma predeterminada, el proxy expone la superficie normal de perfiles del navegador del nodo. Si
estableces `nodeHost.browserProxy.allowProfiles`, el proxy pasa a ser restrictivo:
se rechaza el direccionamiento a perfiles que no estén en la lista de permitidos, y las rutas de
crear/eliminar perfiles persistentes se bloquean a través del proxy.

Desactívalo en el nodo si es necesario:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Ejecutar (primer plano)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usa TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: reemplaza el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: reemplaza el nombre visible del nodo

## Autenticación del Gateway para el host Node

`openclaw node run` y `openclaw node install` resuelven la autenticación del Gateway desde la configuración/entorno (sin indicadores `--token`/`--password` en los comandos node):

- Primero se comprueban `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Luego el respaldo de configuración local: `gateway.auth.token` / `gateway.auth.password`.
- En modo local, el host Node intencionadamente no hereda `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no puede resolverse, la resolución de autenticación del nodo falla de forma cerrada (sin enmascaramiento mediante respaldo remoto).
- En `gateway.mode=remote`, los campos del cliente remoto (`gateway.remote.token` / `gateway.remote.password`) también pueden usarse según las reglas de precedencia remota.
- La resolución de autenticación del host Node solo respeta variables de entorno `OPENCLAW_GATEWAY_*`.

Para un nodo que se conecta a un Gateway `ws://` no loopback en una red privada de confianza,
establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sin ello, el arranque del nodo falla de forma cerrada
y te pide usar `wss://`, un túnel SSH o Tailscale.
Esto es una aceptación explícita mediante entorno de proceso, no una clave de configuración de `openclaw.json`.
`openclaw node install` la conserva en el servicio supervisado del nodo cuando está
presente en el entorno del comando de instalación.

## Servicio (segundo plano)

Instala un host Node sin interfaz como servicio de usuario.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opciones:

- `--host <host>`: host WebSocket del Gateway (predeterminado: `127.0.0.1`)
- `--port <port>`: puerto WebSocket del Gateway (predeterminado: `18789`)
- `--tls`: usa TLS para la conexión con el Gateway
- `--tls-fingerprint <sha256>`: huella esperada del certificado TLS (sha256)
- `--node-id <id>`: reemplaza el id del nodo (borra el token de emparejamiento)
- `--display-name <name>`: reemplaza el nombre visible del nodo
- `--runtime <runtime>`: runtime del servicio (`node` o `bun`)
- `--force`: reinstala/sobrescribe si ya está instalado

Gestiona el servicio:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Usa `openclaw node run` para un host Node en primer plano (sin servicio).

Los comandos de servicio aceptan `--json` para salida legible por máquina.

## Emparejamiento

La primera conexión crea una solicitud pendiente de emparejamiento de dispositivo (`role: node`) en el Gateway.
Apruébala mediante:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

En redes de nodos estrechamente controladas, el operador del Gateway puede habilitar explícitamente
la aprobación automática del emparejamiento inicial de nodos desde CIDR de confianza:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está deshabilitado de forma predeterminada. Solo se aplica a emparejamientos nuevos `role: node`
sin ámbitos solicitados. Los clientes de operador/navegador, la UI de Control, WebChat y las mejoras de rol,
ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

Si el nodo reintenta el emparejamiento con detalles de autenticación cambiados (rol/ámbitos/clave pública),
la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` de nuevo antes de aprobar.

El host Node almacena su id de nodo, token, nombre visible e información de conexión del Gateway en
`~/.openclaw/node.json`.

## Aprobaciones de exec

`system.run` está protegido por aprobaciones locales de exec:

- `~/.openclaw/exec-approvals.json`
- [Aprobaciones de exec](/es/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (editar desde el Gateway)

Para exec asíncrono de nodo aprobado, OpenClaw prepara un `systemRunPlan`
canónico antes de solicitar confirmación. El reenvío posterior de `system.run` aprobado reutiliza ese plan almacenado,
por lo que las ediciones de los campos command/cwd/session después de que se creó la solicitud de aprobación
se rechazan en lugar de cambiar lo que ejecuta el nodo.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Nodes](/es/nodes)
