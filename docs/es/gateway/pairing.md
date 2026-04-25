---
read_when:
    - Implementar aprobaciones de emparejamiento de Node sin interfaz de macOS
    - Agregar flujos de CLI para aprobar nodos remotos
    - Extender el protocolo del gateway con gestión de nodos
summary: Emparejamiento de Node propiedad del Gateway (Opción B) para iOS y otros nodos remotos
title: Emparejamiento propiedad del Gateway
x-i18n:
    generated_at: "2026-04-25T13:47:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

En el emparejamiento propiedad del Gateway, el **Gateway** es la fuente de verdad sobre qué nodos
tienen permitido unirse. Las interfaces (app de macOS, futuros clientes) son solo frontends que
aprueban o rechazan solicitudes pendientes.

**Importante:** los nodos WS usan **emparejamiento de dispositivo** (rol `node`) durante `connect`.
`node.pair.*` es un almacén de emparejamiento independiente y **no** controla el handshake de WS.
Solo los clientes que llaman explícitamente a `node.pair.*` usan este flujo.

## Conceptos

- **Solicitud pendiente**: un nodo pidió unirse; requiere aprobación.
- **Nodo emparejado**: nodo aprobado con un token de autenticación emitido.
- **Transporte**: el endpoint WS del Gateway reenvía solicitudes, pero no decide
  la pertenencia. (El soporte heredado del puente TCP ha sido eliminado).

## Cómo funciona el emparejamiento

1. Un nodo se conecta al WS del Gateway y solicita emparejamiento.
2. El Gateway almacena una **solicitud pendiente** y emite `node.pair.requested`.
3. Apruebas o rechazas la solicitud (CLI o UI).
4. Al aprobar, el Gateway emite un **nuevo token** (los tokens rotan al volver a emparejar).
5. El nodo se reconecta usando el token y ahora queda “emparejado”.

Las solicitudes pendientes caducan automáticamente después de **5 minutos**.

## Flujo de trabajo de la CLI (apto para entornos sin interfaz)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` muestra nodos emparejados/conectados y sus capacidades.

## Superficie de API (protocolo del gateway)

Eventos:

- `node.pair.requested` — se emite cuando se crea una nueva solicitud pendiente.
- `node.pair.resolved` — se emite cuando una solicitud se aprueba/rechaza/caduca.

Métodos:

- `node.pair.request` — crea o reutiliza una solicitud pendiente.
- `node.pair.list` — lista nodos pendientes + emparejados (`operator.pairing`).
- `node.pair.approve` — aprueba una solicitud pendiente (emite token).
- `node.pair.reject` — rechaza una solicitud pendiente.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Notas:

- `node.pair.request` es idempotente por nodo: las llamadas repetidas devuelven la misma
  solicitud pendiente.
- Las solicitudes repetidas para el mismo nodo pendiente también actualizan los metadatos
  almacenados del nodo y la instantánea más reciente de comandos declarados permitidos para visibilidad del operador.
- La aprobación **siempre** genera un token nuevo; nunca se devuelve un token desde
  `node.pair.request`.
- Las solicitudes pueden incluir `silent: true` como sugerencia para flujos de autoaprobación.
- `node.pair.approve` usa los comandos declarados de la solicitud pendiente para aplicar
  alcances adicionales de aprobación:
  - solicitud sin comandos: `operator.pairing`
  - solicitud de comando sin exec: `operator.pairing` + `operator.write`
  - solicitud de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- El emparejamiento de nodos es un flujo de confianza/identidad más emisión de tokens.
- **No** fija la superficie activa de comandos del nodo por nodo.
- Los comandos activos del nodo provienen de lo que el nodo declara al conectarse después de aplicar
  la política global de comandos de nodos del gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La política `allow/ask` de `system.run` por nodo vive en el nodo en
  `exec.approvals.node.*`, no en el registro de emparejamiento.

## Control de comandos de nodo (2026.3.31+)

<Warning>
**Cambio importante:** A partir de `2026.3.31`, los comandos de nodo están deshabilitados hasta que se apruebe el emparejamiento del nodo. El emparejamiento de dispositivo por sí solo ya no es suficiente para exponer los comandos declarados del nodo.
</Warning>

Cuando un nodo se conecta por primera vez, el emparejamiento se solicita automáticamente. Hasta que la solicitud de emparejamiento se apruebe, todos los comandos de nodo pendientes de ese nodo se filtran y no se ejecutarán. Una vez que la confianza se establece mediante la aprobación del emparejamiento, los comandos declarados del nodo pasan a estar disponibles sujetos a la política normal de comandos.

Esto significa:

- Los nodos que antes dependían solo del emparejamiento de dispositivo para exponer comandos ahora deben completar el emparejamiento de nodo.
- Los comandos encolados antes de la aprobación del emparejamiento se descartan, no se difieren.

## Límites de confianza de eventos de nodo (2026.3.31+)

<Warning>
**Cambio importante:** Las ejecuciones originadas por nodos ahora permanecen en una superficie de confianza reducida.
</Warning>

Los resúmenes originados por nodos y los eventos de sesión relacionados están restringidos a la superficie de confianza prevista. Los flujos activados por notificaciones o por nodos que antes dependían de un acceso más amplio a herramientas del host o de la sesión pueden requerir ajustes. Este endurecimiento garantiza que los eventos de nodo no puedan escalar a acceso a herramientas a nivel del host más allá de lo que permite el límite de confianza del nodo.

## Autoaprobación (app de macOS)

La app de macOS puede intentar opcionalmente una **aprobación silenciosa** cuando:

- la solicitud está marcada como `silent`, y
- la app puede verificar una conexión SSH al host del gateway usando el mismo usuario.

Si la aprobación silenciosa falla, recurre al prompt normal de “Approve/Reject”.

## Autoaprobación de dispositivos con CIDR confiable

El emparejamiento de dispositivos WS para `role: node` sigue siendo manual por defecto. Para redes privadas
de nodos donde el Gateway ya confía en la ruta de red, los operadores pueden
optar explícitamente por CIDR específicos o IP exactas:

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

Límite de seguridad:

- Deshabilitado cuando `gateway.nodes.pairing.autoApproveCidrs` no está definido.
- No existe un modo general de autoaprobación para LAN o red privada.
- Solo es apto para emparejamiento de dispositivo `role: node` nuevo sin alcances solicitados.
- Los clientes de operador, navegador, Control UI y WebChat siguen siendo manuales.
- Las actualizaciones de rol, alcance, metadatos y clave pública siguen siendo manuales.
- Las rutas de encabezado de proxy confiable de loopback en el mismo host no son aptas porque esa
  ruta puede ser falsificada por llamadores locales.

## Autoaprobación de actualización de metadatos

Cuando un dispositivo ya emparejado se vuelve a conectar con solo cambios no sensibles de
metadatos (por ejemplo, nombre visible o pistas de plataforma del cliente), OpenClaw trata
eso como una `metadata-upgrade`. La autoaprobación silenciosa es limitada: se aplica solo
a reconexiones confiables de CLI/helper local que ya demostraron posesión del
token compartido o contraseña por loopback. Los clientes de navegador/Control UI y los clientes remotos
siguen usando el flujo explícito de nueva aprobación. Las actualizaciones de alcance (de lectura a
escritura/admin) y los cambios de clave pública **no** son aptos para autoaprobación de actualización
de metadatos: siguen siendo solicitudes explícitas de nueva aprobación.

## Helpers de emparejamiento por QR

`/pair qr` renderiza el payload de emparejamiento como multimedia estructurada para que
clientes móviles y de navegador puedan escanearlo directamente.

Eliminar un dispositivo también limpia cualquier solicitud de emparejamiento pendiente obsoleta para ese
id de dispositivo, de modo que `nodes pending` no muestre filas huérfanas después de una revocación.

## Localidad y encabezados reenviados

El emparejamiento del Gateway trata una conexión como loopback solo cuando tanto el socket sin procesar
como cualquier evidencia de proxy ascendente coinciden. Si una solicitud llega por loopback pero
lleva encabezados `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` que apuntan
a un origen no local, esa evidencia de encabezados reenviados invalida la afirmación de localidad loopback. La ruta de emparejamiento entonces requiere aprobación explícita en lugar de tratar silenciosamente la solicitud como una conexión desde el mismo host. Consulta
[Trusted Proxy Auth](/es/gateway/trusted-proxy-auth) para la regla equivalente en autenticación de
operador.

## Almacenamiento (local, privado)

El estado de emparejamiento se almacena bajo el directorio de estado del Gateway (predeterminado `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si sobrescribes `OPENCLAW_STATE_DIR`, la carpeta `nodes/` se mueve con él.

Notas de seguridad:

- Los tokens son secretos; trata `paired.json` como sensible.
- Rotar un token requiere nueva aprobación (o eliminar la entrada del nodo).

## Comportamiento del transporte

- El transporte es **sin estado**; no almacena pertenencia.
- Si el Gateway está desconectado o el emparejamiento está deshabilitado, los nodos no pueden emparejarse.
- Si el Gateway está en modo remoto, el emparejamiento sigue ocurriendo contra el almacén del Gateway remoto.

## Relacionado

- [Emparejamiento de canales](/es/channels/pairing)
- [Nodes](/es/nodes)
- [CLI de dispositivos](/es/cli/devices)
