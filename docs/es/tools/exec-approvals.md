---
read_when:
    - Configuración de aprobaciones de ejecución o listas de permitidos
    - Implementación de la UX de aprobación de ejecución en la app de macOS
    - Revisión de los prompts de escape del sandbox y sus implicaciones
summary: Aprobaciones de ejecución, listas de permitidos y prompts de escape del sandbox
title: Aprobaciones de ejecución
x-i18n:
    generated_at: "2026-04-25T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Las aprobaciones de ejecución son la **protección de la app complementaria / host de Node** para permitir que un agente en sandbox ejecute comandos en un host real (`gateway` o `node`). Es un interbloqueo de seguridad: los comandos solo se permiten cuando la política + la lista de permitidos + la aprobación del usuario (opcional) coinciden. Las aprobaciones de ejecución se aplican **por encima** de la política de herramientas y del control elevado (a menos que el modo elevado se establezca en `full`, que omite las aprobaciones).

<Note>
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores predeterminados de approvals; si se omite un campo de approvals, se usa el valor de `tools.exec`. La ejecución en host también usa el estado local de approvals en esa máquina: un `ask: "always"` local en `~/.openclaw/exec-approvals.json` sigue mostrando prompts aunque los valores predeterminados de la sesión o la configuración pidan `ask: "on-miss"`.
</Note>

## Inspección de la política efectiva

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — muestran la política solicitada, las fuentes de política del host y el resultado efectivo.
- `openclaw exec-policy show` — vista combinada de la máquina local.
- `openclaw exec-policy set|preset` — sincroniza la política solicitada local con el archivo local de approvals del host en un solo paso.

Cuando un alcance local solicita `host=node`, `exec-policy show` informa ese alcance como gestionado por el node en tiempo de ejecución en lugar de fingir que el archivo local de approvals es la fuente de verdad.

Si la interfaz de la app complementaria **no está disponible**, cualquier solicitud que normalmente mostraría un prompt se resuelve mediante **ask fallback** (predeterminado: deny).

<Tip>
Los clientes nativos de aprobación en chat pueden sembrar atajos específicos del canal en el mensaje de aprobación pendiente. Por ejemplo, Matrix añade atajos de reacción (`✅`
permitir una vez, `❌` denegar, `♾️` permitir siempre) y aun así deja los comandos `/approve ...`
en el mensaje como alternativa.
</Tip>

## Dónde se aplica

Las aprobaciones de ejecución se aplican localmente en el host de ejecución:

- **host del gateway** → proceso `openclaw` en la máquina del gateway
- **host del node** → ejecutor del node (app complementaria de macOS o host de Node sin interfaz)

Nota sobre el modelo de confianza:

- Los llamadores autenticados en el Gateway son operadores de confianza para ese Gateway.
- Los nodes emparejados extienden esa capacidad de operador de confianza al host del node.
- Las aprobaciones de ejecución reducen el riesgo de ejecución accidental, pero no son un límite de autenticación por usuario.
- Las ejecuciones aprobadas en host de node vinculan el contexto canónico de ejecución: `cwd` canónico, `argv` exacto, vinculación de entorno cuando está presente y ruta de ejecutable fijada cuando corresponde.
- Para scripts de shell y llamadas directas a archivos de intérprete/runtime, OpenClaw también intenta vincular
  un único operando de archivo local concreto. Si ese archivo vinculado cambia después de la aprobación pero antes de la ejecución,
  la ejecución se deniega en lugar de ejecutar contenido desviado.
- Esta vinculación de archivos es intencionalmente de mejor esfuerzo, no un modelo semántico completo de cada
  ruta de cargador de intérprete/runtime. Si el modo de aprobación no puede identificar exactamente un archivo local concreto que vincular,
  se niega a emitir una ejecución respaldada por aprobación en lugar de fingir cobertura total.

Separación en macOS:

- **servicio host de node** reenvía `system.run` a la **app de macOS** mediante IPC local.
- **app de macOS** aplica las aprobaciones + ejecuta el comando en el contexto de la UI.

## Ajustes y almacenamiento

Las aprobaciones se guardan en un archivo JSON local en el host de ejecución:

`~/.openclaw/exec-approvals.json`

Ejemplo de esquema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modo "YOLO" sin aprobación

Si quieres que la ejecución en host se ejecute sin prompts de aprobación, debes abrir **ambas** capas de política:

- política de ejecución solicitada en la configuración de OpenClaw (`tools.exec.*`)
- política local de approvals del host en `~/.openclaw/exec-approvals.json`

Este es ahora el comportamiento predeterminado del host a menos que lo endurezcas explícitamente:

- `tools.exec.security`: `full` en `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinción importante:

- `tools.exec.host=auto` elige dónde se ejecuta `exec`: sandbox cuando está disponible; en caso contrario, gateway.
- YOLO elige cómo se aprueba la ejecución en host: `security=full` más `ask=off`.
- Los proveedores respaldados por CLI que exponen su propio modo de permisos no interactivo pueden seguir esta política.
  Claude CLI añade `--permission-mode bypassPermissions` cuando la política solicitada de ejecución de OpenClaw es
  YOLO. Sobrescribe ese comportamiento del backend con argumentos explícitos de Claude en
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, por ejemplo
  `--permission-mode default`, `acceptEdits` o `bypassPermissions`.
- En modo YOLO, OpenClaw no añade una capa separada de aprobación heurística por ofuscación de comandos ni una capa de rechazo previo de scripts por encima de la política configurada de ejecución en host.
- `auto` no convierte el enrutamiento por gateway en una sobrescritura gratuita desde una sesión en sandbox. Se permite una solicitud por llamada `host=node` desde `auto`, y `host=gateway` solo se permite desde `auto` cuando no hay ningún runtime de sandbox activo. Si quieres un valor predeterminado estable que no sea auto, establece `tools.exec.host` o usa `/exec host=...` explícitamente.

Si quieres una configuración más conservadora, vuelve a endurecer cualquiera de las dos capas a `allowlist` / `on-miss`
o `deny`.

Configuración persistente de host de gateway "nunca mostrar prompt":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Luego configura el archivo local de approvals del host para que coincida:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Atajo local para la misma política de host de gateway en la máquina actual:

```bash
openclaw exec-policy preset yolo
```

Ese atajo local actualiza ambos:

- `tools.exec.host/security/ask` local
- `~/.openclaw/exec-approvals.json` local en `defaults`

Es intencionalmente solo local. Si necesitas cambiar de forma remota approvals del host de gateway o del host de node,
sigue usando `openclaw approvals set --gateway` o
`openclaw approvals set --node <id|name|ip>`.

Para un host de node, aplica en su lugar el mismo archivo de approvals en ese node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Limitación importante solo local:

- `openclaw exec-policy` no sincroniza approvals de node
- `openclaw exec-policy set --host node` se rechaza
- las approvals de ejecución de node se obtienen del node en tiempo de ejecución, por lo que las actualizaciones dirigidas al node deben usar `openclaw approvals --node ...`

Atajo solo de sesión:

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite las aprobaciones de ejecución para esa sesión.

Si el archivo local de approvals del host sigue siendo más estricto que la configuración, la política más estricta del host sigue prevaleciendo.

## Controles de política

### Seguridad (`exec.security`)

- **deny**: bloquea todas las solicitudes de ejecución en host.
- **allowlist**: permite solo comandos incluidos en la lista de permitidos.
- **full**: permite todo (equivalente a elevado).

### Ask (`exec.ask`)

- **off**: nunca muestra prompts.
- **on-miss**: muestra prompt solo cuando no hay coincidencia en la lista de permitidos.
- **always**: muestra prompt en cada comando.
- la confianza duradera `allow-always` no suprime los prompts cuando el modo ask efectivo es `always`

### Ask fallback (`askFallback`)

Si se requiere un prompt pero no hay ninguna UI accesible, fallback decide:

- **deny**: bloquea.
- **allowlist**: permite solo si hay coincidencia en la lista de permitidos.
- **full**: permite.

### Endurecimiento de evaluación inline de intérpretes (`tools.exec.strictInlineEval`)

Cuando `tools.exec.strictInlineEval=true`, OpenClaw trata los formularios de evaluación de código inline como de solo aprobación incluso si el binario del intérprete en sí está en la lista de permitidos.

Ejemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Esto es defensa en profundidad para cargadores de intérpretes que no se asignan limpiamente a un único operando de archivo estable. En modo estricto:

- estos comandos siguen necesitando aprobación explícita;
- `allow-always` no conserva automáticamente nuevas entradas de lista de permitidos para ellos.

## Lista de permitidos (por agente)

Las listas de permitidos son **por agente**. Si existen varios agentes, cambia cuál estás
editando en la app de macOS. Los patrones son coincidencias glob.
Los patrones pueden ser globs de rutas resueltas de binarios o globs simples de nombres de comando. Los nombres simples
solo coinciden con comandos invocados mediante PATH, así que `rg` puede coincidir con `/opt/homebrew/bin/rg`
cuando el comando es `rg`, pero no con `./rg` ni `/tmp/rg`. Usa un glob de ruta cuando
quieras confiar en una ubicación binaria específica.
Las entradas heredadas `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen requiriendo que cada segmento de nivel superior cumpla las reglas de la lista de permitidos.

Ejemplos:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de la lista de permitidos registra:

- **id** UUID estable usado para identidad de UI (opcional)
- **último uso** marca de tiempo
- **último comando usado**
- **última ruta resuelta**

## Auto-permitir CLI de Skills

Cuando **Auto-allow skill CLIs** está habilitado, los ejecutables referenciados por Skills conocidas
se tratan como incluidos en la lista de permitidos en nodes (node de macOS o host de Node sin interfaz). Esto usa
`skills.bins` sobre el RPC del Gateway para obtener la lista de binarios de Skills. Desactívalo si quieres listas de permitidos manuales estrictas.

Notas importantes sobre confianza:

- Esta es una **lista de permitidos implícita de conveniencia**, separada de las entradas manuales de lista de permitidos por ruta.
- Está pensada para entornos de operadores de confianza donde Gateway y node están dentro del mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de lista de permitidos por ruta.

## Binarios seguros y reenvío de aprobaciones

Para binarios seguros (la ruta rápida solo con stdin), detalles de vinculación de intérpretes y cómo
reenviar prompts de aprobación a Slack/Discord/Telegram (o ejecutarlos como clientes nativos
de aprobación), consulta [Exec approvals — advanced](/es/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Edición en la UI de Control

Usa la tarjeta **UI de Control → Nodes → Exec approvals** para editar valores predeterminados, anulaciones
por agente y listas de permitidos. Elige un alcance (Predeterminados o un agente), ajusta la política,
añade/elimina patrones de lista de permitidos y luego **Guarda**. La UI muestra metadatos de **último uso**
por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (approvals locales) o un **Node**. Los nodes
deben anunciar `system.execApprovals.get/set` (app de macOS o host de Node sin interfaz).
Si un node todavía no anuncia exec approvals, edita directamente su
`~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite la edición de gateway o node (consulta [Approvals CLI](/es/cli/approvals)).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde `exec.approval.requested` a los clientes operadores.
La UI de Control y la app de macOS lo resuelven mediante `exec.approval.resolve`, y luego el gateway reenvía la
solicitud aprobada al host del node.

Para `host=node`, las solicitudes de aprobación incluyen una carga útil canónica `systemRunPlan`. El gateway usa
ese plan como contexto autoritativo de comando/`cwd`/sesión al reenviar solicitudes aprobadas de `system.run`.

Esto importa para la latencia de aprobación asíncrona:

- la ruta de ejecución de node prepara por adelantado un plan canónico
- el registro de aprobación almacena ese plan y sus metadatos de vinculación
- una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado
  en lugar de confiar en ediciones posteriores del llamador
- si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` después de crear la solicitud de aprobación, el gateway rechaza la
  ejecución reenviada por discrepancia de aprobación

## Eventos del sistema

El ciclo de vida de exec se expone como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral de aviso de ejecución en curso)
- `Exec finished`
- `Exec denied`

Estos se publican en la sesión del agente después de que el node informa del evento.
Las aprobaciones de ejecución en host de gateway emiten los mismos eventos de ciclo de vida cuando el comando termina (y opcionalmente cuando se ejecuta durante más tiempo que el umbral).
Las ejecuciones controladas por aprobación reutilizan el id de aprobación como `runId` en estos mensajes para facilitar la correlación.

## Comportamiento cuando se deniega una aprobación

Cuando se deniega una aprobación de ejecución asíncrona, OpenClaw impide que el agente reutilice
la salida de cualquier ejecución anterior del mismo comando en la sesión. El motivo de la denegación
se transmite con una indicación explícita de que no hay salida del comando disponible, lo que evita
que el agente afirme que hay una salida nueva o repita el comando denegado con
resultados obsoletos de una ejecución exitosa anterior.

## Implicaciones

- **full** es potente; prefiere listas de permitidos cuando sea posible.
- **ask** te mantiene informado y al mismo tiempo permite aprobaciones rápidas.
- Las listas de permitidos por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de ejecución en host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño. Para bloquear completamente la ejecución en host, establece la seguridad de approvals en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/es/tools/exec-approvals-advanced" icon="gear">
    Binarios seguros, vinculación de intérpretes y reenvío de aprobaciones al chat.
  </Card>
  <Card title="Herramienta Exec" href="/es/tools/exec" icon="terminal">
    Herramienta de ejecución de comandos de shell.
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated" icon="shield-exclamation">
    Ruta de emergencia que también omite las aprobaciones.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Modos de sandbox y acceso al workspace.
  </Card>
  <Card title="Seguridad" href="/es/gateway/security" icon="lock">
    Modelo de seguridad y endurecimiento.
  </Card>
  <Card title="Sandbox frente a política de herramientas frente a elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Cuándo recurrir a cada control.
  </Card>
  <Card title="Skills" href="/es/tools/skills" icon="sparkles">
    Comportamiento de auto-permisión respaldado por Skills.
  </Card>
</CardGroup>
