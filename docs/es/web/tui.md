---
read_when:
    - Quieres una guía amigable para principiantes de la TUI
    - Necesitas la lista completa de funciones, comandos y atajos de la TUI
summary: 'Interfaz de terminal (TUI): conéctate al Gateway o ejecútala localmente en modo integrado'
title: TUI
x-i18n:
    generated_at: "2026-04-25T13:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6eaa938fb3a50b7478341fe51cafb09e352f6d3cb402373222153ed93531a5f5
    source_path: web/tui.md
    workflow: 15
---

## Inicio rápido

### Modo Gateway

1. Inicia Gateway.

```bash
openclaw gateway
```

2. Abre la TUI.

```bash
openclaw tui
```

3. Escribe un mensaje y presiona Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Usa `--password` si tu Gateway usa autenticación por contraseña.

### Modo local

Ejecuta la TUI sin un Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Notas:

- `openclaw chat` y `openclaw terminal` son alias de `openclaw tui --local`.
- `--local` no puede combinarse con `--url`, `--token` ni `--password`.
- El modo local usa directamente el tiempo de ejecución del agente integrado. La mayoría de las herramientas locales funcionan, pero las funciones exclusivas de Gateway no están disponibles.
- `openclaw` y `openclaw crestodian` también usan esta shell de TUI, con Crestodian como backend local de configuración y reparación por chat.

## Qué ves

- Encabezado: URL de conexión, agente actual, sesión actual.
- Registro del chat: mensajes del usuario, respuestas del asistente, avisos del sistema, tarjetas de herramientas.
- Línea de estado: estado de conexión/ejecución (conectando, ejecutando, transmitiendo, inactivo, error).
- Pie: estado de conexión + agente + sesión + modelo + think/fast/verbose/trace/reasoning + recuento de tokens + deliver.
- Entrada: editor de texto con autocompletado.

## Modelo mental: agentes + sesiones

- Los agentes son slugs únicos (por ejemplo, `main`, `research`). Gateway expone la lista.
- Las sesiones pertenecen al agente actual.
- Las claves de sesión se almacenan como `agent:<agentId>:<sessionKey>`.
  - Si escribes `/session main`, la TUI lo expande a `agent:<currentAgent>:main`.
  - Si escribes `/session agent:other:main`, cambias explícitamente a la sesión de ese agente.
- Alcance de sesión:
  - `per-sender` (predeterminado): cada agente tiene muchas sesiones.
  - `global`: la TUI siempre usa la sesión `global` (el selector puede estar vacío).
- El agente actual + la sesión actual siempre son visibles en el pie.

## Envío + entrega

- Los mensajes se envían a Gateway; la entrega a los proveedores está desactivada de forma predeterminada.
- Activa la entrega:
  - `/deliver on`
  - o el panel de Configuración
  - o inicia con `openclaw tui --deliver`

## Selectores + superposiciones

- Selector de modelo: enumera los modelos disponibles y establece la sobrescritura de sesión.
- Selector de agente: elige otro agente.
- Selector de sesión: muestra solo las sesiones del agente actual.
- Configuración: alterna deliver, la expansión de la salida de herramientas y la visibilidad de thinking.

## Atajos de teclado

- Enter: enviar mensaje
- Esc: abortar la ejecución activa
- Ctrl+C: borrar entrada (presiona dos veces para salir)
- Ctrl+D: salir
- Ctrl+L: selector de modelo
- Ctrl+G: selector de agente
- Ctrl+P: selector de sesión
- Ctrl+O: alternar la expansión de la salida de herramientas
- Ctrl+T: alternar la visibilidad de thinking (recarga el historial)

## Comandos con barra

Núcleo:

- `/help`
- `/status`
- `/agent <id>` (o `/agents`)
- `/session <key>` (o `/sessions`)
- `/model <provider/model>` (o `/models`)

Controles de sesión:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Ciclo de vida de la sesión:

- `/new` o `/reset` (reiniciar la sesión)
- `/abort` (abortar la ejecución activa)
- `/settings`
- `/exit`

Solo modo local:

- `/auth [provider]` abre el flujo de autenticación/inicio de sesión del proveedor dentro de la TUI.

Otros comandos con barra de Gateway (por ejemplo, `/context`) se reenvían a Gateway y se muestran como salida del sistema. Consulta [Comandos con barra](/es/tools/slash-commands).

## Comandos de shell locales

- Antepon `!` a una línea para ejecutar un comando de shell local en el host de la TUI.
- La TUI solicita una vez por sesión permiso para la ejecución local; si lo rechazas, `!` queda deshabilitado para la sesión.
- Los comandos se ejecutan en una shell nueva y no interactiva en el directorio de trabajo de la TUI (sin `cd`/env persistente).
- Los comandos de shell locales reciben `OPENCLAW_SHELL=tui-local` en su entorno.
- Un `!` solo se envía como mensaje normal; los espacios iniciales no activan la ejecución local.

## Reparar configuraciones desde la TUI local

Usa el modo local cuando la configuración actual ya sea válida y quieras que el
agente integrado la inspeccione en la misma máquina, la compare con la documentación
y ayude a reparar desviaciones sin depender de un Gateway en ejecución.

Si `openclaw config validate` ya está fallando, empieza primero con `openclaw configure`
o `openclaw doctor --fix`. `openclaw chat` no omite la protección contra
configuración inválida.

Bucle típico:

1. Inicia el modo local:

```bash
openclaw chat
```

2. Pide al agente lo que quieres comprobar, por ejemplo:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Usa comandos de shell locales para obtener evidencia exacta y validación:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplica cambios precisos con `openclaw config set` o `openclaw configure`, y luego vuelve a ejecutar `!openclaw config validate`.
5. Si Doctor recomienda una migración o reparación automática, revísala y ejecuta `!openclaw doctor --fix`.

Sugerencias:

- Prefiere `openclaw config set` o `openclaw configure` en lugar de editar manualmente `openclaw.json`.
- `openclaw docs "<query>"` busca en el índice activo de documentación desde la misma máquina.
- `openclaw config validate --json` es útil cuando quieres errores estructurados de esquema y de SecretRef/resolubilidad.

## Salida de herramientas

- Las llamadas de herramientas se muestran como tarjetas con argumentos + resultados.
- Ctrl+O alterna entre vistas contraída/expandida.
- Mientras las herramientas se ejecutan, las actualizaciones parciales se transmiten a la misma tarjeta.

## Colores del terminal

- La TUI mantiene el texto del cuerpo del asistente con el color de primer plano predeterminado de tu terminal para que tanto los terminales oscuros como los claros sigan siendo legibles.
- Si tu terminal usa un fondo claro y la detección automática falla, establece `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forzar la paleta oscura original, establece `OPENCLAW_THEME=dark`.

## Historial + transmisión

- Al conectarse, la TUI carga el historial más reciente (200 mensajes de forma predeterminada).
- Las respuestas en streaming se actualizan en su lugar hasta finalizarse.
- La TUI también escucha eventos de herramientas del agente para mostrar tarjetas de herramientas más ricas.

## Detalles de la conexión

- La TUI se registra en Gateway como `mode: "tui"`.
- Las reconexiones muestran un mensaje del sistema; los huecos de eventos se muestran en el registro.

## Opciones

- `--local`: Ejecutar contra el tiempo de ejecución del agente integrado local
- `--url <url>`: URL WebSocket de Gateway (por defecto, la configuración o `ws://127.0.0.1:<port>`)
- `--token <token>`: token de Gateway (si es necesario)
- `--password <password>`: contraseña de Gateway (si es necesaria)
- `--session <key>`: clave de sesión (predeterminada: `main`, o `global` cuando el alcance es global)
- `--deliver`: Entregar respuestas del asistente al proveedor (desactivado de forma predeterminada)
- `--thinking <level>`: Sobrescribir el nivel de thinking para los envíos
- `--message <text>`: Enviar un mensaje inicial después de conectarse
- `--timeout-ms <ms>`: tiempo de espera del agente en ms (usa como valor predeterminado `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entradas del historial que se cargarán (predeterminado `200`)

Nota: cuando estableces `--url`, la TUI no usa como respaldo las credenciales de configuración o del entorno.
Pasa `--token` o `--password` explícitamente. La falta de credenciales explícitas es un error.
En modo local, no pases `--url`, `--token` ni `--password`.

## Solución de problemas

No hay salida después de enviar un mensaje:

- Ejecuta `/status` en la TUI para confirmar que Gateway está conectado y en estado inactivo/ocupado.
- Revisa los registros de Gateway: `openclaw logs --follow`.
- Confirma que el agente puede ejecutarse: `openclaw status` y `openclaw models status`.
- Si esperas mensajes en un canal de chat, habilita la entrega (`/deliver on` o `--deliver`).

## Solución de problemas de conexión

- `disconnected`: asegúrate de que Gateway esté en ejecución y de que `--url/--token/--password` sean correctos.
- No hay agentes en el selector: revisa `openclaw agents list` y tu configuración de enrutamiento.
- Selector de sesión vacío: puede que estés en alcance global o que todavía no tengas sesiones.

## Relacionado

- [Control UI](/es/web/control-ui) — interfaz de control basada en web
- [Config](/es/cli/config) — inspeccionar, validar y editar `openclaw.json`
- [Doctor](/es/cli/doctor) — comprobaciones guiadas de reparación y migración
- [Referencia de CLI](/es/cli) — referencia completa de comandos de CLI
