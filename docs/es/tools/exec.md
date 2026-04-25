---
read_when:
    - Usar o modificar la herramienta Exec
    - Depurar el comportamiento de stdin o TTY
summary: Uso de la herramienta Exec, modos de stdin y compatibilidad con TTY
title: Herramienta Exec
x-i18n:
    generated_at: "2026-04-25T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano y en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

<ParamField path="command" type="string" required>
Comando de shell que se va a ejecutar.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directorio de trabajo para el comando.
</ParamField>

<ParamField path="env" type="object">
Anulaciones de entorno clave/valor combinadas sobre el entorno heredado.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Pasa automáticamente el comando a segundo plano después de este retraso (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Pasa el comando a segundo plano inmediatamente en lugar de esperar `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Mata el comando después de este número de segundos.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Ejecuta en un pseudoterminal cuando esté disponible. Úsalo para CLIs que solo funcionan con TTY, agentes de programación e interfaces de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dónde ejecutar. `auto` se resuelve como `sandbox` cuando un runtime sandbox está activo y como `gateway` en caso contrario.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Modo de aplicación para la ejecución en `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportamiento del prompt de aprobación para la ejecución en `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nombre del Node cuando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Solicita modo elevado: salir del sandbox hacia la ruta del host configurada. `security=full` solo se fuerza cuando elevated se resuelve como `full`.
</ParamField>

Notas:

- `host` usa `auto` de forma predeterminada: sandbox cuando un runtime sandbox está activo para la sesión, y `gateway` en caso contrario.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay ningún runtime sandbox activo.
- Sin configuración adicional, `host=auto` sigue “simplemente funcionando”: sin sandbox se resuelve como `gateway`; con un sandbox activo permanece en el sandbox.
- `elevated` sale del sandbox hacia la ruta del host configurada: `gateway` de forma predeterminada, o `node` cuando `tools.exec.host=node` (o el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` están controladas por `~/.openclaw/exec-approvals.json`.
- `node` requiere un node emparejado (app complementaria o host node sin interfaz).
- Si hay varios nodes disponibles, configura `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodes; el wrapper heredado `nodes.run` se ha eliminado.
- En hosts no Windows, exec usa `SHELL` cuando está definido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  de `PATH` para evitar scripts incompatibles con fish, y luego vuelve a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere detectar PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y luego recurre a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y las anulaciones del cargador (`LD_*`/`DYLD_*`) para
  evitar el secuestro de binarios o la inyección de código.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución con PTY y sandbox) para que las reglas del shell/perfil puedan detectar el contexto de la herramienta exec.
- Importante: el sandbox está **desactivado de forma predeterminada**. Si el sandbox está desactivado, `host=auto`
  implícito se resuelve como `gateway`. `host=sandbox` explícito sigue fallando de forma segura en lugar de ejecutarse
  silenciosamente en el host gateway. Habilita el sandbox o usa `host=gateway` con aprobaciones.
- Las comprobaciones preliminares de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, la comprobación preliminar se omite para
  ese archivo.
- Para trabajo de larga duración que empieza ahora, inícialo una vez y confía en la
  reactivación automática al completarse cuando esté habilitada y el comando emita salida o falle.
  Usa `process` para logs, estado, entrada o intervención; no emules la
  programación con bucles de sleep, bucles de timeout o sondeo repetido.
- Para trabajo que debe ocurrir más tarde o según una programación, usa Cron en lugar de
  patrones de sleep/retraso con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec en segundo plano ponen en cola un evento del sistema y solicitan un Heartbeat al salir.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso de “en ejecución” cuando un exec protegido por aprobación se ejecuta más tiempo que esto (0 lo desactiva).
- `tools.exec.host` (predeterminado: `auto`; se resuelve como `sandbox` cuando un runtime sandbox está activo y como `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está definido)
- `tools.exec.ask` (predeterminado: `off`)
- La ejecución en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento de aprobaciones/lista de permitidos, endurece tanto `tools.exec.*` como la política del host `~/.openclaw/exec-approvals.json`; consulta [Aprobaciones de Exec](/es/tools/exec-approvals#no-approval-yolo-mode).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento a gateway o node, configura `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, la ejecución en host sigue directamente la política configurada; no hay una capa adicional de prefiltro heurístico de ofuscación de comandos ni de rechazo de comprobación preliminar de scripts.
- `tools.exec.node` (predeterminado: no definido)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas de evaluación en línea del intérprete como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` aún puede conservar invocaciones benignas de intérpretes/scripts, pero las formas de evaluación en línea siguen mostrando el prompt cada vez.
- `tools.exec.pathPrepend`: lista de directorios que se anteponen a `PATH` para ejecuciones de exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros solo de stdin que pueden ejecutarse sin entradas explícitas en la lista de permitidos. Para detalles del comportamiento, consulta [Safe bins](/es/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para comprobaciones de ruta de ejecutables de `safeBins`. Las entradas de `PATH` nunca se consideran automáticamente de confianza. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
- `tools.exec.safeBinProfiles`: política opcional personalizada de argv por safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Ejemplo:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Manejo de PATH

- `host=gateway`: combina tu `PATH` del shell de inicio de sesión en el entorno de exec. Las anulaciones de `env.PATH`
  se rechazan para la ejecución en host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación del shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo las anulaciones de entorno no bloqueadas que pases se envían al node. Las anulaciones de `env.PATH`
  se rechazan para la ejecución en host y los hosts node las ignoran. Si necesitas entradas PATH adicionales en un node,
  configura el entorno del servicio host node (systemd/launchd) o instala herramientas en ubicaciones estándar.

Vinculación de node por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interfaz de control: la pestaña Nodes incluye un pequeño panel “Exec node binding” para la misma configuración.

## Anulaciones de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/emparejamiento del canal más `commands.useAccessGroups`).
Actualiza **solo el estado de la sesión** y no escribe configuración. Para desactivar exec por completo, deniégalo mediante la
política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose a menos que establezcas explícitamente
`security=full` y `ask=off`.

## Aprobaciones de Exec (app complementaria / host node)

Los agentes con sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host gateway o node.
Consulta [Aprobaciones de Exec](/es/tools/exec-approvals) para la política, la lista de permitidos y el flujo de la interfaz.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un ID de aprobación. Una vez aprobada (o denegada / agotado el tiempo),
el Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
ejecutándose después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En canales con tarjetas/botones de aprobación nativos, el agente debe confiar primero en esa
interfaz nativa y solo incluir un comando manual `/approve` cuando el resultado de la herramienta
indique explícitamente que las aprobaciones en el chat no están disponibles o que la aprobación manual es la
única vía.

## Lista de permitidos + safe bins

La aplicación manual de la lista de permitidos coincide con globs de rutas de binarios resueltas y globs
de nombres simples de comandos. Los nombres simples solo coinciden con comandos invocados mediante PATH, así que `rg` puede coincidir con
`/opt/homebrew/bin/rg` cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`.
Cuando `security=allowlist`, los comandos de shell se permiten automáticamente solo si cada segmento de la canalización
está en la lista de permitidos o es un safe bin. El encadenamiento (`;`, `&&`, `||`) y las redirecciones
se rechazan en modo allowlist a menos que cada segmento de nivel superior satisfaga la
lista de permitidos (incluidos los safe bins). Las redirecciones siguen sin estar admitidas.
La confianza persistente `allow-always` no evita esa regla: un comando encadenado sigue requiriendo que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia independiente en las aprobaciones de exec. No es lo mismo que
las entradas manuales de la lista de permitidos por ruta. Para una confianza estricta y explícita, mantén `autoAllowSkills` desactivado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: pequeños filtros de flujo, solo stdin.
- `tools.exec.safeBinTrustedDirs`: directorios explícitos adicionales de confianza para rutas de ejecutables de safe bins.
- `tools.exec.safeBinProfiles`: política argv explícita para safe bins personalizados.
- lista de permitidos: confianza explícita para rutas de ejecutables.

No trates `safeBins` como una lista de permitidos genérica y no agregues binarios de intérpretes/runtime (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas en la lista de permitidos y mantén habilitados los prompts de aprobación.
`openclaw security audit` advierte cuando faltan entradas explícitas de perfiles para entradas `safeBins` de intérpretes/runtime, y `openclaw doctor --fix` puede generar entradas personalizadas faltantes en `safeBinProfiles`.
`openclaw security audit` y `openclaw doctor` también advierten cuando vuelves a agregar explícitamente binarios de comportamiento amplio como `jq` a `safeBins`.
Si incluyes intérpretes explícitamente en la lista de permitidos, habilita `tools.exec.strictInlineEval` para que las formas de evaluación de código en línea sigan requiriendo una aprobación nueva.

Para ver los detalles completos de la política y ejemplos, consulta [Aprobaciones de Exec](/es/tools/exec-approvals-advanced#safe-bins-stdin-only) y [Safe bins versus lista de permitidos](/es/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ejemplos

Primer plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + sondeo:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

El sondeo es para estado bajo demanda, no para bucles de espera. Si la reactivación automática al completarse
está habilitada, el comando puede reactivar la sesión cuando emita salida o falle.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Pegar (con delimitación predeterminada):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas de varios archivos.
Está habilitada de forma predeterminada para los modelos OpenAI y OpenAI Codex. Usa la configuración solo
cuando quieras desactivarla o restringirla a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Notas:

- Solo está disponible para modelos OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- La configuración se encuentra en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa `true` de forma predeterminada; establécelo en `false` para desactivar la herramienta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa `true` de forma predeterminada (contenido dentro del espacio de trabajo). Establécelo en `false` solo si intencionalmente quieres que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.

## Relacionado

- [Aprobaciones de Exec](/es/tools/exec-approvals) — compuertas de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecutar comandos en entornos con sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — exec de larga duración y herramienta process
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
