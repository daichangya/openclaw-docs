---
read_when:
    - Estás aprobando solicitudes de emparejamiento de dispositivos
    - Necesitas rotar o revocar tokens de dispositivos
summary: Referencia de CLI para `openclaw devices` (emparejamiento de dispositivos + rotación/revocación de tokens)
title: Dispositivos
x-i18n:
    generated_at: "2026-04-25T13:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

Gestiona las solicitudes de emparejamiento de dispositivos y los tokens con alcance de dispositivo.

## Comandos

### `openclaw devices list`

Lista las solicitudes de emparejamiento pendientes y los dispositivos emparejados.

```
openclaw devices list
openclaw devices list --json
```

La salida de solicitudes pendientes muestra el acceso solicitado junto al acceso actualmente
aprobado del dispositivo cuando el dispositivo ya está emparejado. Esto hace que las
actualizaciones de alcance/rol sean explícitas en lugar de parecer que se perdió el emparejamiento.

### `openclaw devices remove <deviceId>`

Elimina una entrada de dispositivo emparejado.

Cuando te autenticas con un token de dispositivo emparejado, quienes llaman sin privilegios de administrador
solo pueden eliminar la entrada de **su propio** dispositivo. Eliminar otro dispositivo requiere
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

Elimina en bloque los dispositivos emparejados.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

Aprueba una solicitud pendiente de emparejamiento de dispositivo por `requestId` exacto. Si se omite
`requestId` o se pasa `--latest`, OpenClaw solo imprime la solicitud pendiente seleccionada
y sale; vuelve a ejecutar la aprobación con el ID exacto de solicitud después de verificar
los detalles.

Nota: si un dispositivo vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol, alcances o clave
pública), OpenClaw reemplaza la entrada pendiente anterior y emite un nuevo
`requestId`. Ejecuta `openclaw devices list` justo antes de aprobar para usar el
ID actual.

Si el dispositivo ya está emparejado y solicita alcances más amplios o un rol más amplio,
OpenClaw mantiene la aprobación existente y crea una nueva solicitud de actualización
pendiente. Revisa las columnas `Requested` y `Approved` en `openclaw devices list`
o usa `openclaw devices approve --latest` para obtener una vista previa de la actualización exacta antes de
aprobarla.

Si el Gateway está configurado explícitamente con
`gateway.nodes.pairing.autoApproveCidrs`, las solicitudes iniciales de `role: node` de
IP de cliente coincidentes pueden aprobarse antes de aparecer en esta lista. Esa política
está desactivada de forma predeterminada y nunca se aplica a clientes de operador/navegador ni a solicitudes
de actualización.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

Rechaza una solicitud pendiente de emparejamiento de dispositivo.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

Rota un token de dispositivo para un rol específico (opcionalmente actualizando los alcances).
El rol de destino ya debe existir en el contrato de emparejamiento aprobado de ese dispositivo;
la rotación no puede emitir un nuevo rol no aprobado.
Si omites `--scope`, las reconexiones posteriores con el token rotado almacenado reutilizan los
alcances aprobados en caché de ese token. Si pasas valores explícitos de `--scope`, esos
se convierten en el conjunto de alcances almacenado para futuras reconexiones con token en caché.
Quienes llaman con dispositivo emparejado y sin privilegios de administrador solo pueden rotar el token de **su propio**
dispositivo. Además, cualquier valor explícito de `--scope` debe permanecer dentro de los propios
alcances de operador de la sesión de quien llama; la rotación no puede emitir un token de operador más amplio que el que la persona que llama
ya tiene.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

Devuelve la nueva carga útil del token como JSON.

### `openclaw devices revoke --device <id> --role <role>`

Revoca un token de dispositivo para un rol específico.

Quienes llaman con dispositivo emparejado y sin privilegios de administrador solo pueden revocar el token de **su propio**
dispositivo. Revocar el token de otro dispositivo requiere `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

Devuelve el resultado de la revocación como JSON.

## Opciones comunes

- `--url <url>`: URL de WebSocket del Gateway (usa como valor predeterminado `gateway.remote.url` cuando está configurado).
- `--token <token>`: token del Gateway (si es necesario).
- `--password <password>`: contraseña del Gateway (autenticación por contraseña).
- `--timeout <ms>`: tiempo de espera de RPC.
- `--json`: salida JSON (recomendado para scripts).

Nota: cuando configuras `--url`, la CLI no usa como respaldo las credenciales de configuración o del entorno.
Pasa `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

## Notas

- La rotación de tokens devuelve un nuevo token (sensible). Trátalo como un secreto.
- Estos comandos requieren el alcance `operator.pairing` (o `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` es una política opcional del Gateway para
  el emparejamiento inicial de dispositivos Node únicamente; no cambia la autoridad de aprobación de la CLI.
- La rotación de tokens se mantiene dentro del conjunto de roles de emparejamiento aprobado y de la línea base
  de alcances aprobados para ese dispositivo. Una entrada accidental de token en caché no concede un nuevo
  objetivo de rotación.
- Para sesiones de token de dispositivo emparejado, la gestión entre dispositivos es solo para administradores:
  `remove`, `rotate` y `revoke` son solo sobre el propio dispositivo, a menos que quien llama tenga
  `operator.admin`.
- `devices clear` está intencionalmente protegido por `--yes`.
- Si el alcance de emparejamiento no está disponible en local loopback (y no se pasa `--url` explícitamente), `list`/`approve` pueden usar un respaldo local de emparejamiento.
- `devices approve` requiere un ID de solicitud explícito antes de emitir tokens; omitir `requestId` o pasar `--latest` solo muestra una vista previa de la solicitud pendiente más reciente.

## Lista de verificación para recuperación de desincronización de tokens

Usa esto cuando la Control UI u otros clientes sigan fallando con `AUTH_TOKEN_MISMATCH` o `AUTH_DEVICE_TOKEN_MISMATCH`.

1. Confirma la fuente actual del token del Gateway:

```bash
openclaw config get gateway.auth.token
```

2. Lista los dispositivos emparejados e identifica el ID del dispositivo afectado:

```bash
openclaw devices list
```

3. Rota el token de operador para el dispositivo afectado:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. Si la rotación no es suficiente, elimina el emparejamiento obsoleto y aprueba de nuevo:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. Vuelve a intentar la conexión del cliente con el token/contraseña compartidos actuales.

Notas:

- La precedencia normal de autenticación de reconexión es primero token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado y después token de arranque.
- La recuperación confiable de `AUTH_TOKEN_MISMATCH` puede enviar temporalmente tanto el token compartido como el token de dispositivo almacenado juntos para ese único reintento limitado.

Relacionado:

- [Solución de problemas de autenticación del panel](/es/web/dashboard#if-you-see-unauthorized-1008)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting#dashboard-control-ui-connectivity)

## Relacionado

- [Referencia de CLI](/es/cli)
- [Nodes](/es/nodes)
