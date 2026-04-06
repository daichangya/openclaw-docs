---
read_when:
    - Usar o modificar la herramienta exec
    - Depurar el comportamiento de stdin o TTY
summary: Uso de la herramienta exec, modos de stdin y compatibilidad con TTY
title: Herramienta Exec
x-i18n:
    generated_at: "2026-04-06T03:12:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28388971c627292dba9bf65ae38d7af8cde49a33bb3b5fc8b20da4f0e350bedd
    source_path: tools/exec.md
    workflow: 15
---

# Herramienta Exec

Ejecuta comandos de shell en el espacio de trabajo. Admite ejecución en primer plano y en segundo plano mediante `process`.
Si `process` no está permitido, `exec` se ejecuta de forma síncrona e ignora `yieldMs`/`background`.
Las sesiones en segundo plano tienen alcance por agente; `process` solo ve sesiones del mismo agente.

## Parámetros

- `command` (obligatorio)
- `workdir` (por defecto es cwd)
- `env` (anulaciones clave/valor)
- `yieldMs` (predeterminado 10000): pasa automáticamente a segundo plano después del retraso
- `background` (bool): pasa inmediatamente a segundo plano
- `timeout` (segundos, predeterminado 1800): se mata al expirar
- `pty` (bool): ejecutar en un pseudo-terminal cuando esté disponible (CLI solo TTY, agentes de codificación, interfaces de terminal)
- `host` (`auto | sandbox | gateway | node`): dónde ejecutar
- `security` (`deny | allowlist | full`): modo de aplicación para `gateway`/`node`
- `ask` (`off | on-miss | always`): solicitudes de aprobación para `gateway`/`node`
- `node` (string): ID/nombre del nodo para `host=node`
- `elevated` (bool): solicitar modo elevado (salir del sandbox hacia la ruta de host configurada); `security=full` solo se fuerza cuando elevated se resuelve como `full`

Notas:

- `host` usa por defecto `auto`: sandbox cuando el runtime de sandbox está activo para la sesión; en caso contrario, gateway.
- `auto` es la estrategia de enrutamiento predeterminada, no un comodín. Se permite `host=node` por llamada desde `auto`; `host=gateway` por llamada solo se permite cuando no hay un runtime de sandbox activo.
- Sin configuración adicional, `host=auto` sigue “simplemente funcionando”: sin sandbox se resuelve a `gateway`; con un sandbox activo se mantiene en el sandbox.
- `elevated` sale del sandbox hacia la ruta de host configurada: `gateway` por defecto, o `node` cuando `tools.exec.host=node` (o cuando el valor predeterminado de la sesión es `host=node`). Solo está disponible cuando el acceso elevado está habilitado para la sesión/proveedor actual.
- Las aprobaciones de `gateway`/`node` están controladas por `~/.openclaw/exec-approvals.json`.
- `node` requiere un nodo vinculado (app complementaria o host de nodo sin interfaz).
- Si hay varios nodos disponibles, establece `exec.node` o `tools.exec.node` para seleccionar uno.
- `exec host=node` es la única ruta de ejecución de shell para nodos; el wrapper heredado `nodes.run` se ha eliminado.
- En hosts que no son Windows, exec usa `SHELL` cuando está establecido; si `SHELL` es `fish`, prefiere `bash` (o `sh`)
  desde `PATH` para evitar scripts incompatibles con fish, y luego vuelve a `SHELL` si ninguno existe.
- En hosts Windows, exec prefiere descubrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432 y luego PATH),
  y después vuelve a Windows PowerShell 5.1.
- La ejecución en host (`gateway`/`node`) rechaza `env.PATH` y las anulaciones del cargador (`LD_*`/`DYLD_*`) para
  evitar secuestro de binarios o inyección de código.
- OpenClaw establece `OPENCLAW_SHELL=exec` en el entorno del comando generado (incluida la ejecución PTY y sandbox) para que las reglas de shell/perfil puedan detectar el contexto de la herramienta exec.
- Importante: el sandboxing está **desactivado por defecto**. Si el sandboxing está desactivado, `host=auto`
  implícito se resuelve a `gateway`. `host=sandbox` explícito sigue fallando en modo cerrado en lugar de
  ejecutarse silenciosamente en el host gateway. Habilita el sandboxing o usa `host=gateway` con aprobaciones.
- Las comprobaciones previas de scripts (para errores comunes de sintaxis de shell en Python/Node) solo inspeccionan archivos dentro del
  límite efectivo de `workdir`. Si una ruta de script se resuelve fuera de `workdir`, la comprobación previa se omite para
  ese archivo.
- Para trabajos de larga duración que empiezan ahora, inícialos una vez y confía en el
  despertar automático por finalización cuando esté habilitado y el comando emita salida o falle.
  Usa `process` para registros, estado, entrada o intervención; no emules
  la programación con bucles de sleep, bucles de timeout o sondeo repetido.
- Para trabajo que deba ocurrir más tarde o según una programación, usa cron en lugar de
  patrones de sleep/retraso con `exec`.

## Configuración

- `tools.exec.notifyOnExit` (predeterminado: true): cuando es true, las sesiones exec enviadas a segundo plano encolan un evento del sistema y solicitan un heartbeat al finalizar.
- `tools.exec.approvalRunningNoticeMs` (predeterminado: 10000): emite un único aviso “running” cuando un exec con aprobación tarda más que esto (0 lo desactiva).
- `tools.exec.host` (predeterminado: `auto`; se resuelve a `sandbox` cuando el runtime de sandbox está activo, `gateway` en caso contrario)
- `tools.exec.security` (predeterminado: `deny` para sandbox, `full` para gateway + node cuando no está configurado)
- `tools.exec.ask` (predeterminado: `off`)
- El exec en host sin aprobación es el valor predeterminado para gateway + node. Si quieres comportamiento de aprobaciones/allowlist, endurece tanto `tools.exec.*` como la política del host `~/.openclaw/exec-approvals.json`; consulta [Aprobaciones de exec](/es/tools/exec-approvals#no-approval-yolo-mode).
- YOLO proviene de los valores predeterminados de la política del host (`security=full`, `ask=off`), no de `host=auto`. Si quieres forzar el enrutamiento a gateway o node, establece `tools.exec.host` o usa `/exec host=...`.
- En modo `security=full` más `ask=off`, el exec en host sigue directamente la política configurada; no hay ningún prefiltro heurístico adicional de ofuscación de comandos.
- `tools.exec.node` (predeterminado: no establecido)
- `tools.exec.strictInlineEval` (predeterminado: false): cuando es true, las formas de evaluación inline del intérprete como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` y `osascript -e` siempre requieren aprobación explícita. `allow-always` aún puede persistir invocaciones benignas de intérprete/script, pero las formas inline-eval siguen solicitando aprobación en cada ocasión.
- `tools.exec.pathPrepend`: lista de directorios para anteponer a `PATH` en ejecuciones exec (solo gateway + sandbox).
- `tools.exec.safeBins`: binarios seguros de solo stdin que pueden ejecutarse sin entradas explícitas en allowlist. Para detalles del comportamiento, consulta [Safe bins](/es/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: directorios adicionales explícitos de confianza para las comprobaciones de ruta de ejecutables en `safeBins`. Las entradas de `PATH` nunca reciben confianza automática. Los valores predeterminados integrados son `/bin` y `/usr/bin`.
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

- `host=gateway`: fusiona tu `PATH` de shell de inicio de sesión en el entorno de exec. Las anulaciones de `env.PATH`
  se rechazan para la ejecución en host. El propio daemon sigue ejecutándose con un `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: ejecuta `sh -lc` (shell de inicio de sesión) dentro del contenedor, por lo que `/etc/profile` puede restablecer `PATH`.
  OpenClaw antepone `env.PATH` después de cargar el perfil mediante una variable de entorno interna (sin interpolación de shell);
  `tools.exec.pathPrepend` también se aplica aquí.
- `host=node`: solo se envían al nodo las anulaciones de entorno no bloqueadas que proporciones. Las anulaciones de `env.PATH`
  se rechazan para la ejecución en host y los hosts node las ignoran. Si necesitas entradas adicionales en PATH en un nodo,
  configura el entorno del servicio del host node (systemd/launchd) o instala herramientas en ubicaciones estándar.

Vinculación de nodo por agente (usa el índice de la lista de agentes en la configuración):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de control: la pestaña Nodes incluye un pequeño panel “Exec node binding” para la misma configuración.

## Anulaciones de sesión (`/exec`)

Usa `/exec` para establecer valores predeterminados **por sesión** para `host`, `security`, `ask` y `node`.
Envía `/exec` sin argumentos para mostrar los valores actuales.

Ejemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorización

`/exec` solo se respeta para **remitentes autorizados** (listas de permitidos/vinculación del canal más `commands.useAccessGroups`).
Actualiza **solo el estado de la sesión** y no escribe configuración. Para desactivar exec completamente, deniégalo mediante la
política de herramientas (`tools.deny: ["exec"]` o por agente). Las aprobaciones del host siguen aplicándose a menos que establezcas explícitamente
`security=full` y `ask=off`.

## Aprobaciones de exec (app complementaria / host de nodo)

Los agentes en sandbox pueden requerir aprobación por solicitud antes de que `exec` se ejecute en el host gateway o node.
Consulta [Aprobaciones de exec](/es/tools/exec-approvals) para ver la política, la allowlist y el flujo de UI.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente
`status: "approval-pending"` y un ID de aprobación. Una vez aprobada (o denegada / expirada),
el Gateway emite eventos del sistema (`Exec finished` / `Exec denied`). Si el comando sigue
ejecutándose después de `tools.exec.approvalRunningNoticeMs`, se emite un único aviso `Exec running`.
En los canales con tarjetas/botones nativos de aprobación, el agente debe confiar primero en esa
UI nativa y solo incluir un comando manual `/approve` cuando el resultado de la
herramienta indique explícitamente que las aprobaciones por chat no están disponibles o que la aprobación manual es la
única vía.

## Allowlist + safe bins

La aplicación manual de allowlist coincide **solo con rutas resueltas de binarios** (sin coincidencias por nombre base). Cuando
`security=allowlist`, los comandos de shell solo se permiten automáticamente si cada segmento de pipeline está
en allowlist o es un safe bin. El encadenamiento (`;`, `&&`, `||`) y las redirecciones se rechazan en
modo allowlist a menos que cada segmento de nivel superior satisfaga la allowlist (incluidos los safe bins).
Las redirecciones siguen sin estar admitidas.
La confianza duradera `allow-always` no evita esa regla: un comando encadenado sigue requiriendo que cada
segmento de nivel superior coincida.

`autoAllowSkills` es una ruta de conveniencia independiente en las aprobaciones de exec. No es lo mismo que
las entradas manuales de allowlist por ruta. Para una confianza estricta y explícita, mantén `autoAllowSkills` desactivado.

Usa los dos controles para trabajos distintos:

- `tools.exec.safeBins`: pequeños filtros de flujo de solo stdin.
- `tools.exec.safeBinTrustedDirs`: directorios adicionales explícitos de confianza para rutas ejecutables de safe-bin.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confianza explícita para rutas de ejecutables.

No trates `safeBins` como una allowlist genérica y no añadas binarios de intérprete/runtime (por ejemplo `python3`, `node`, `ruby`, `bash`). Si los necesitas, usa entradas explícitas de allowlist y mantén habilitadas las solicitudes de aprobación.
`openclaw security audit` avisa cuando faltan entradas explícitas de perfil para intérpretes/runtime en `safeBins`, y `openclaw doctor --fix` puede generar entradas faltantes de `safeBinProfiles` personalizados.
`openclaw security audit` y `openclaw doctor` también avisan cuando vuelves a añadir explícitamente bins de comportamiento amplio como `jq` a `safeBins`.
Si incluyes explícitamente intérpretes en allowlist, habilita `tools.exec.strictInlineEval` para que las formas de evaluación de código inline sigan requiriendo una aprobación nueva.

Para ver la política completa y ejemplos, consulta [Aprobaciones de exec](/es/tools/exec-approvals#safe-bins-stdin-only) y [Safe bins versus allowlist](/es/tools/exec-approvals#safe-bins-versus-allowlist).

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

El sondeo es para estado bajo demanda, no para bucles de espera. Si el despertar automático por finalización
está habilitado, el comando puede reactivar la sesión cuando emita salida o falle.

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

Pegar (entre corchetes por defecto):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` es una subherramienta de `exec` para ediciones estructuradas en varios archivos.
Está habilitada por defecto para modelos OpenAI y OpenAI Codex. Usa configuración solo
cuando quieras desactivarla o restringirla a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Notas:

- Solo está disponible para modelos OpenAI/OpenAI Codex.
- La política de herramientas sigue aplicándose; `allow: ["write"]` permite implícitamente `apply_patch`.
- La configuración vive en `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` usa por defecto `true`; establécelo en `false` para desactivar la herramienta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` usa por defecto `true` (contenido dentro del espacio de trabajo). Establécelo en `false` solo si intencionalmente quieres que `apply_patch` escriba/elimine fuera del directorio del espacio de trabajo.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — controles de aprobación para comandos de shell
- [Sandboxing](/es/gateway/sandboxing) — ejecutar comandos en entornos con sandbox
- [Proceso en segundo plano](/es/gateway/background-process) — ejecución prolongada y herramienta process
- [Seguridad](/es/gateway/security) — política de herramientas y acceso elevado
