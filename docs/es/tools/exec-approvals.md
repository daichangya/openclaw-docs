---
read_when:
    - Configurando aprobaciones de exec o listas permitidas
    - Implementando la UX de aprobación de exec en la app de macOS
    - Revisando prompts de salida del sandbox y sus implicaciones
summary: Aprobaciones de exec, listas permitidas y prompts de salida del sandbox
title: Aprobaciones de exec
x-i18n:
    generated_at: "2026-04-06T03:13:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39e91cd5c7615bdb9a6b201a85bde7514327910f6f12da5a4b0532bceb229c22
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Aprobaciones de exec

Las aprobaciones de exec son la **protección de la app complementaria / host de nodo** para permitir que un agente en sandbox ejecute
comandos en un host real (`gateway` o `node`). Piensa en ello como un enclavamiento de seguridad:
los comandos solo se permiten cuando la política + la lista permitida + la aprobación del usuario (opcional) coinciden.
Las aprobaciones de exec son **adicionales** a la política de herramientas y al control elevated (a menos que elevated esté configurado en `full`, lo que omite las aprobaciones).
La política efectiva es la **más estricta** entre `tools.exec.*` y los valores predeterminados de aprobaciones; si se omite un campo de aprobaciones, se usa el valor de `tools.exec`.
La ejecución en host también usa el estado local de aprobaciones en esa máquina. Un valor local del host
`ask: "always"` en `~/.openclaw/exec-approvals.json` sigue mostrando prompts incluso si
la sesión o los valores predeterminados de configuración solicitan `ask: "on-miss"`.
Usa `openclaw approvals get`, `openclaw approvals get --gateway` o
`openclaw approvals get --node <id|name|ip>` para inspeccionar la política solicitada,
las fuentes de política del host y el resultado efectivo.

Si la UI de la app complementaria **no está disponible**, cualquier solicitud que requiera un prompt se
resuelve mediante el **fallback de ask** (predeterminado: denegar).

Los clientes nativos de aprobación de chat también pueden exponer affordances específicos del canal en el
mensaje de aprobación pendiente. Por ejemplo, Matrix puede sembrar atajos de reacciones en el
prompt de aprobación (`✅` permitir una vez, `❌` denegar y `♾️` permitir siempre cuando esté disponible)
mientras sigue dejando los comandos `/approve ...` en el mensaje como fallback.

## Dónde se aplica

Las aprobaciones de exec se aplican localmente en el host de ejecución:

- **host del gateway** → proceso `openclaw` en la máquina del gateway
- **host del nodo** → ejecutor del nodo (app complementaria de macOS o host de nodo sin interfaz)

Nota sobre el modelo de confianza:

- Los llamadores autenticados por el gateway son operadores de confianza para ese Gateway.
- Los nodos emparejados extienden esa capacidad de operador de confianza al host del nodo.
- Las aprobaciones de exec reducen el riesgo de ejecución accidental, pero no constituyen un límite de autenticación por usuario.
- Las ejecuciones aprobadas en el host del nodo vinculan un contexto de ejecución canónico: cwd canónico, argv exacto, vinculación de env
  cuando está presente y ruta del ejecutable fijada cuando corresponde.
- Para scripts de shell e invocaciones directas de archivos de intérprete/runtime, OpenClaw también intenta vincular
  un único operando concreto de archivo local. Si ese archivo vinculado cambia después de la aprobación y antes de la ejecución,
  la ejecución se deniega en lugar de ejecutar contenido que haya cambiado.
- Esta vinculación de archivos es intencionalmente de mejor esfuerzo, no un modelo semántico completo de todas las
  rutas de carga de intérpretes/runtime. Si el modo de aprobación no puede identificar exactamente un único archivo local concreto que vincular, se niega a emitir una ejecución respaldada por aprobación en lugar de fingir una cobertura total.

División en macOS:

- **el servicio del host del nodo** reenvía `system.run` a la **app de macOS** mediante IPC local.
- **la app de macOS** aplica las aprobaciones + ejecuta el comando en el contexto de la UI.

## Configuración y almacenamiento

Las aprobaciones se guardan en un archivo JSON local en el host de ejecución:

`~/.openclaw/exec-approvals.json`

Esquema de ejemplo:

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

- la política de exec solicitada en la configuración de OpenClaw (`tools.exec.*`)
- la política local de aprobaciones del host en `~/.openclaw/exec-approvals.json`

Este es ahora el comportamiento predeterminado del host a menos que lo restrinjas explícitamente:

- `tools.exec.security`: `full` en `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinción importante:

- `tools.exec.host=auto` elige dónde se ejecuta exec: en sandbox cuando está disponible, en caso contrario en gateway.
- YOLO elige cómo se aprueba la ejecución en host: `security=full` más `ask=off`.
- En modo YOLO, OpenClaw no añade una compuerta de aprobación heurística separada de ofuscación de comandos por encima de la política configurada de exec en host.
- `auto` no convierte el enrutamiento al gateway en una anulación libre desde una sesión en sandbox. Se permite una solicitud por llamada `host=node` desde `auto`, y `host=gateway` solo se permite desde `auto` cuando no hay un runtime de sandbox activo. Si quieres un valor predeterminado estable no automático, establece `tools.exec.host` o usa `/exec host=...` explícitamente.

Si quieres una configuración más conservadora, vuelve a restringir cualquiera de las capas a `allowlist` / `on-miss`
o `deny`.

Configuración persistente de "nunca pedir prompt" para el host del gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Luego configura el archivo de aprobaciones del host para que coincida:

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

Para un host de nodo, aplica en su lugar el mismo archivo de aprobaciones en ese nodo:

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

Atajo solo para la sesión:

- `/exec security=full ask=off` cambia solo la sesión actual.
- `/elevated full` es un atajo de emergencia que también omite las aprobaciones de exec para esa sesión.

Si el archivo de aprobaciones del host sigue siendo más estricto que la configuración, la política más estricta del host sigue prevaleciendo.

## Controles de política

### Seguridad (`exec.security`)

- **deny**: bloquea todas las solicitudes de exec en host.
- **allowlist**: permite solo comandos incluidos en la lista permitida.
- **full**: permite todo (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: no mostrar prompts nunca.
- **on-miss**: mostrar prompt solo cuando la lista permitida no coincida.
- **always**: mostrar prompt en cada comando.
- la confianza duradera `allow-always` no suprime los prompts cuando el modo ask efectivo es `always`

### Ask fallback (`askFallback`)

Si se requiere un prompt pero no hay ninguna UI accesible, fallback decide:

- **deny**: bloquear.
- **allowlist**: permitir solo si la lista permitida coincide.
- **full**: permitir.

### Refuerzo para eval en línea de intérprete (`tools.exec.strictInlineEval`)

Cuando `tools.exec.strictInlineEval=true`, OpenClaw trata las formas de evaluación de código en línea como solo-aprobación, incluso si el binario del intérprete en sí está en la lista permitida.

Ejemplos:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Esto es una defensa en profundidad para cargadores de intérpretes que no se asignan claramente a un operando de archivo estable. En modo estricto:

- estos comandos siguen necesitando aprobación explícita;
- `allow-always` no persiste automáticamente nuevas entradas de lista permitida para ellos.

## Lista permitida (por agente)

Las listas permitidas son **por agente**. Si existen varios agentes, cambia el agente que estás
editando en la app de macOS. Los patrones son **coincidencias glob sin distinción entre mayúsculas y minúsculas**.
Los patrones deben resolverse a **rutas binarias** (las entradas solo con basename se ignoran).
Las entradas heredadas `agents.default` se migran a `agents.main` al cargar.
Las cadenas de shell como `echo ok && pwd` siguen necesitando que cada segmento de nivel superior satisfaga las reglas de la lista permitida.

Ejemplos:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Cada entrada de la lista permitida registra:

- **id** UUID estable usado para identidad en la UI (opcional)
- **último uso** marca de tiempo
- **último comando usado**
- **última ruta resuelta**

## Auto-allow para CLI de Skills

Cuando **Auto-allow skill CLIs** está habilitado, los ejecutables referenciados por Skills conocidos
se tratan como incluidos en la lista permitida en nodos (nodo de macOS o host de nodo sin interfaz). Esto usa
`skills.bins` sobre el RPC del Gateway para obtener la lista de binarios de Skills. Desactiva esto si quieres listas permitidas manuales estrictas.

Notas importantes de confianza:

- Esta es una **lista permitida implícita de conveniencia**, separada de las entradas manuales de rutas en lista permitida.
- Está pensada para entornos de operadores de confianza donde Gateway y nodo están en el mismo límite de confianza.
- Si necesitas confianza explícita estricta, mantén `autoAllowSkills: false` y usa solo entradas manuales de rutas en lista permitida.

## Bins seguros (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por ejemplo `cut`)
que pueden ejecutarse en modo allowlist **sin** entradas explícitas de lista permitida. Los bins seguros rechazan
argumentos posicionales de archivo y tokens similares a rutas, por lo que solo pueden operar sobre el flujo entrante.
Trata esto como una vía rápida limitada para filtros de flujo, no como una lista general de confianza.
**No** añadas binarios de intérprete o runtime (por ejemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Si un comando puede evaluar código, ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la lista permitida y mantén habilitados los prompts de aprobación.
Los bins seguros personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia del sistema de archivos del host), lo cual
evita el comportamiento de oráculo de existencia de archivos a partir de diferencias entre permitir/denegar.
Las opciones orientadas a archivos se deniegan para los bins seguros predeterminados (por ejemplo `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Los bins seguros también aplican una política explícita por binario para flags que rompen el comportamiento
de solo stdin (por ejemplo `sort -o/--output/--compress-program` y flags recursivos de grep).
Las opciones largas se validan de forma cerrada a fallos en modo safe-bin: los flags desconocidos y las abreviaturas ambiguas se rechazan.
Flags denegados por perfil de safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los bins seguros también fuerzan que los tokens argv se traten como **texto literal** en tiempo de ejecución (sin globbing
ni expansión de `$VARS`) para segmentos solo stdin, de modo que patrones como `*` o `$HOME/...` no puedan
usarse para introducir lecturas de archivos.
Los bins seguros también deben resolverse desde directorios binarios de confianza (predeterminados del sistema más
`tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca se consideran de confianza automáticamente.
Los directorios predeterminados de confianza para safe-bin son intencionalmente mínimos: `/bin`, `/usr/bin`.
Si tu ejecutable safe-bin vive en rutas de usuario o de gestores de paquetes (por ejemplo
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas explícitamente
a `tools.exec.safeBinTrustedDirs`.
El encadenamiento de shell y las redirecciones no se permiten automáticamente en modo allowlist.

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior satisface la lista permitida
(incluidos safe bins o auto-allow de Skills). Las redirecciones siguen sin ser compatibles en modo allowlist.
La sustitución de comandos (`$()` / backticks) se rechaza durante el análisis de la lista permitida, incluso dentro de
comillas dobles; usa comillas simples si necesitas texto literal `$()`.
En las aprobaciones de la app complementaria de macOS, el texto shell sin procesar que contiene sintaxis de control o expansión del shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de lista permitida a menos que
el propio binario de shell esté en la lista permitida.
Para envolturas de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de env con alcance de solicitud se reducen a una
pequeña lista permitida explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Para decisiones `allow-always` en modo allowlist, los wrappers de despacho conocidos
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten las rutas de los ejecutables internos en lugar de las rutas de los wrappers. Los multiplexores de shell (`busybox`, `toybox`) también se desempaquetan para applets de shell (`sh`, `ash`,
etc.) de modo que se persistan los ejecutables internos en lugar de los binarios del multiplexor. Si un wrapper o
multiplexor no puede desempaquetarse de forma segura, no se persiste automáticamente ninguna entrada de lista permitida.
Si incluyes intérpretes como `python3` o `node` en la lista permitida, prefiere `tools.exec.strictInlineEval=true` para que el eval en línea siga requiriendo aprobación explícita. En modo estricto, `allow-always` todavía puede persistir invocaciones benignas de intérprete/script, pero los portadores de eval en línea no se persisten automáticamente.

Bins seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si optas por incluirlos, mantén entradas explícitas en la lista permitida para
sus flujos de trabajo que no sean solo stdin.
Para `grep` en modo safe-bin, proporciona el patrón con `-e`/`--regexp`; la forma posicional del patrón se
rechaza para que no se puedan introducir operandos de archivo como posicionales ambiguos.

### Safe bins frente a lista permitida

| Tema             | `tools.exec.safeBins`                                  | Lista permitida (`exec-approvals.json`)                      |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objetivo         | Permitir automáticamente filtros estrechos de stdin    | Confiar explícitamente en ejecutables específicos            |
| Tipo de coincidencia | Nombre del ejecutable + política argv de safe-bin | Patrón glob de la ruta resuelta del ejecutable               |
| Alcance de argumentos | Restringido por el perfil safe-bin y reglas de tokens literales | Solo coincidencia de ruta; los argumentos son por lo demás tu responsabilidad |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados       |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines  | Cualquier herramienta con comportamiento más amplio o efectos secundarios |

Ubicación de configuración:

- `safeBins` proviene de la configuración (`tools.exec.safeBins` o `agents.list[].tools.exec.safeBins` por agente).
- `safeBinTrustedDirs` proviene de la configuración (`tools.exec.safeBinTrustedDirs` o `agents.list[].tools.exec.safeBinTrustedDirs` por agente).
- `safeBinProfiles` proviene de la configuración (`tools.exec.safeBinProfiles` o `agents.list[].tools.exec.safeBinProfiles` por agente). Las claves de perfil por agente anulan las claves globales.
- las entradas de la lista permitida viven en `~/.openclaw/exec-approvals.json` local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando bins de intérprete/runtime aparecen en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes `safeBinProfiles.<bin>` como `{}` (revísalas y restríngelas después). Los bins de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900004__
Si incluyes explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo safe-bin
para que `jq -n env` no pueda volcar el entorno del proceso del host sin una ruta explícita en lista permitida
o un prompt de aprobación.

## Edición en Control UI

Usa la tarjeta **Control UI → Nodes → Exec approvals** para editar valores predeterminados, anulaciones por agente
y listas permitidas. Elige un alcance (Predeterminados o un agente), ajusta la política,
añade/elimina patrones de lista permitida y luego **Save**. La UI muestra metadatos de **último uso**
por patrón para que puedas mantener la lista ordenada.

El selector de destino elige **Gateway** (aprobaciones locales) o un **Node**. Los nodos
deben anunciar `system.execApprovals.get/set` (app de macOS o host de nodo sin interfaz).
Si un nodo aún no anuncia aprobaciones de exec, edita directamente su
`~/.openclaw/exec-approvals.json` local.

CLI: `openclaw approvals` admite edición del gateway o del nodo (consulta [Approvals CLI](/cli/approvals)).

## Flujo de aprobación

Cuando se requiere un prompt, el gateway difunde `exec.approval.requested` a los clientes operadores.
Control UI y la app de macOS lo resuelven mediante `exec.approval.resolve`, y luego el gateway reenvía la
solicitud aprobada al host del nodo.

Para `host=node`, las solicitudes de aprobación incluyen un payload canónico `systemRunPlan`. El gateway usa
ese plan como el contexto autoritativo de comando/cwd/sesión al reenviar solicitudes aprobadas de `system.run`.

Esto importa para la latencia de aprobación asíncrona:

- la ruta de exec del nodo prepara un único plan canónico por adelantado
- el registro de aprobación almacena ese plan y sus metadatos de vinculación
- una vez aprobado, la llamada final reenviada de `system.run` reutiliza el plan almacenado
  en lugar de confiar en ediciones posteriores del llamador
- si el llamador cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` después de que se haya creado la solicitud de aprobación, el gateway rechaza la
  ejecución reenviada por discrepancia de aprobación

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- El contexto exacto de argv/cwd/env siempre queda vinculado.
- Las formas de script shell directo y archivo directo de runtime se vinculan con mejor esfuerzo a una instantánea de un archivo local concreto.
- Las formas comunes de wrapper de gestores de paquetes que aún se resuelven a un único archivo local directo (por ejemplo
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desempaquetan antes de la vinculación.
- Si OpenClaw no puede identificar exactamente un único archivo local concreto para un comando de intérprete/runtime
  (por ejemplo scripts de paquetes, formas eval, cadenas de cargadores específicas de runtime o formas ambiguas de varios archivos),
  la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no
  tiene.
- Para esos flujos de trabajo, prefiere sandboxing, un límite de host separado o un flujo explícito de
  allowlist/full de confianza donde el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un ID de aprobación. Usa ese ID para
correlacionar eventos posteriores del sistema (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes del
tiempo de espera, la solicitud se trata como un timeout de aprobación y aparece como motivo de denegación.

### Comportamiento de entrega de seguimiento

Después de que finaliza una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento de `agent` a la misma sesión.

- Si existe un destino externo válido de entrega (canal entregable más destino `to`), la entrega de seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin destino externo, la entrega de seguimiento permanece solo en sesión (`deliver: false`).
- Si un llamador solicita explícitamente una entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no puede resolverse ningún canal externo, la entrega se degrada a solo sesión en lugar de fallar.

El cuadro de diálogo de confirmación incluye:

- comando + args
- cwd
- id del agente
- ruta resuelta del ejecutable
- host + metadatos de política

Acciones:

- **Allow once** → ejecutar ahora
- **Always allow** → añadir a la lista permitida + ejecutar
- **Deny** → bloquear

## Reenvío de aprobaciones a canales de chat

Puedes reenviar prompts de aprobación de exec a cualquier canal de chat (incluidos canales de plugin) y aprobarlos
con `/approve`. Esto usa la canalización normal de entrega saliente.

Configuración:
__OC_I18N_900005__
Responder en el chat:
__OC_I18N_900006__
El comando `/approve` gestiona tanto aprobaciones de exec como aprobaciones de plugin. Si el ID no coincide con una aprobación de exec pendiente, comprueba automáticamente las aprobaciones de plugin en su lugar.

### Reenvío de aprobaciones de plugin

El reenvío de aprobaciones de plugin usa la misma canalización de entrega que las aprobaciones de exec, pero tiene su propia
configuración independiente bajo `approvals.plugin`. Habilitar o deshabilitar una no afecta a la otra.
__OC_I18N_900007__
La forma de configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` y `targets` funcionan del mismo modo.

Los canales que admiten respuestas interactivas compartidas renderizan los mismos botones de aprobación para aprobaciones de exec y
de plugin. Los canales sin UI interactiva compartida recurren a texto sin formato con instrucciones de
`/approve`.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o de plugin se origina desde una superficie de chat entregable, ese mismo chat
ahora puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y
Microsoft Teams, además de los flujos ya existentes de Web UI y terminal UI.

Esta ruta compartida de comandos de texto usa el modelo normal de autenticación del canal para esa conversación. Si el
chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un
adaptador nativo de entrega independiente solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su
lista resuelta de aprobadores para autorización incluso cuando la entrega nativa de aprobaciones está deshabilitada.

Para Telegram y otros clientes nativos de aprobación que llaman directamente al Gateway,
este fallback está intencionalmente acotado a fallos de tipo "approval not found". Una denegación/error real de
aprobación de exec no reintenta silenciosamente como aprobación de plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación. Los clientes nativos añaden DMs de aprobadores, fanout al chat de origen y UX interactiva de aprobación específica del canal por encima del flujo compartido de
`/approve` en el mismo chat.

Cuando hay disponibles tarjetas/botones nativos de aprobación, esa UI nativa es la ruta principal
orientada al agente. El agente no debería además repetir un comando plano duplicado
`/approve` en el chat a menos que el resultado de la herramienta diga que las aprobaciones por chat no están disponibles o que la aprobación manual es la única ruta restante.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de prompts de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente nativo de aprobación

Los clientes nativos de aprobación habilitan automáticamente la entrega primero por DM cuando se cumplen todas estas condiciones:

- el canal admite entrega nativa de aprobaciones
- los aprobadores pueden resolverse desde `execApprovals.approvers` explícito o desde las
  fuentes de fallback documentadas de ese canal
- `channels.<channel>.execApprovals.enabled` no está establecido o es `"auto"`

Establece `enabled: false` para deshabilitar explícitamente un cliente nativo de aprobación. Establece `enabled: true` para forzarlo
cuando se resuelvan aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante
`channels.<channel>.execApprovals.target`.

Preguntas frecuentes: [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes nativos de aprobación añaden enrutamiento de DM y fanout opcional al canal por encima del flujo compartido de
`/approve` en el mismo chat y de los botones compartidos de aprobación.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal
  para `/approve` en el mismo chat
- cuando un cliente nativo de aprobación se habilita automáticamente, el destino nativo predeterminado de entrega son los DMs de aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferidos desde `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferidos desde la configuración existente del propietario (`allowFrom`, más `defaultTo` de mensaje directo cuando sea compatible)
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferidos desde `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de ID de aprobación, por lo que los IDs `plugin:` pueden resolver aprobaciones de plugin
  sin una segunda capa local de fallback de Slack
- el enrutamiento nativo de DM/canal de Matrix es solo para exec; las aprobaciones de plugin en Matrix permanecen en la ruta compartida
  de `/approve` en el mismo chat y en las rutas opcionales de reenvío `approvals.plugin`
- el solicitante no necesita ser un aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones nativos de aprobación de Discord enrutan por tipo de ID de aprobación: los IDs `plugin:` van
  directamente a aprobaciones de plugin, todo lo demás va a aprobaciones de exec
- los botones nativos de aprobación de Telegram siguen el mismo fallback acotado de exec a plugin que `/approve`
- cuando `target` nativo habilita la entrega al chat de origen, los prompts de aprobación incluyen el texto del comando
- las aprobaciones de exec pendientes caducan después de 30 minutos de forma predeterminada
- si ninguna UI de operador o cliente de aprobación configurado puede aceptar la solicitud, el prompt recurre a `askFallback`

Telegram usa por defecto DMs de aprobadores (`target: "dm"`). Puedes cambiarlo a `channel` o `both` cuando
quieras que los prompts de aprobación aparezcan también en el chat/tema de Telegram de origen. Para temas de foros de Telegram, OpenClaw conserva el tema para el prompt de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC en macOS
__OC_I18N_900008__
Notas de seguridad:

- Modo del socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de par del mismo UID.
- Desafío/respuesta (nonce + token HMAC + hash de solicitud) + TTL corto.

## Eventos del sistema

El ciclo de vida de exec aparece como mensajes del sistema:

- `Exec running` (solo si el comando supera el umbral del aviso de ejecución)
- `Exec finished`
- `Exec denied`

Estos se publican en la sesión del agente después de que el nodo informe del evento.
Las aprobaciones de exec del host del gateway emiten los mismos eventos de ciclo de vida cuando el comando termina (y opcionalmente cuando sigue ejecutándose más allá del umbral).
Las ejecuciones protegidas por aprobación reutilizan el ID de aprobación como `runId` en estos mensajes para facilitar la correlación.

## Comportamiento al denegar la aprobación

Cuando se deniega una aprobación de exec asíncrona, OpenClaw impide que el agente reutilice
la salida de cualquier ejecución anterior del mismo comando en la sesión. El motivo de denegación
se transmite con orientación explícita de que no hay salida de comando disponible, lo que evita
que el agente afirme que hay una nueva salida o repita el comando denegado con
resultados obsoletos de una ejecución previa exitosa.

## Implicaciones

- **full** es potente; prefiere listas permitidas cuando sea posible.
- **ask** te mantiene al tanto mientras sigue permitiendo aprobaciones rápidas.
- Las listas permitidas por agente evitan que las aprobaciones de un agente se filtren a otros.
- Las aprobaciones solo se aplican a solicitudes de exec en host de **remitentes autorizados**. Los remitentes no autorizados no pueden emitir `/exec`.
- `/exec security=full` es una comodidad a nivel de sesión para operadores autorizados y omite las aprobaciones por diseño.
  Para bloquear por completo la ejecución en host, establece la seguridad de aprobaciones en `deny` o deniega la herramienta `exec` mediante la política de herramientas.

Relacionado:

- [Exec tool](/es/tools/exec)
- [Elevated mode](/es/tools/elevated)
- [Skills](/es/tools/skills)

## Relacionado

- [Exec](/es/tools/exec) — herramienta de ejecución de comandos shell
- [Sandboxing](/es/gateway/sandboxing) — modos de sandbox y acceso al espacio de trabajo
- [Security](/es/gateway/security) — modelo de seguridad y endurecimiento
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — cuándo usar cada uno
