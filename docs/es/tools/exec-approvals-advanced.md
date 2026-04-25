---
read_when:
    - Configurar binarios seguros o perfiles personalizados de binarios seguros
    - Reenviar aprobaciones a Slack/Discord/Telegram u otros canales de chat
    - Implementar un cliente nativo de aprobaciones para un canal
summary: 'Aprobaciones avanzadas de exec: binarios seguros, enlace del intérprete, reenvío de aprobaciones, entrega nativa'
title: Aprobaciones de exec — avanzadas
x-i18n:
    generated_at: "2026-04-25T13:58:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Temas avanzados de aprobación de exec: la vía rápida `safeBins`, el enlace de intérprete/runtime y el reenvío de aprobaciones a canales de chat (incluida la entrega nativa). Para la política central y el flujo de aprobación, consulta [Aprobaciones de exec](/es/tools/exec-approvals).

## Binarios seguros (solo stdin)

`tools.exec.safeBins` define una pequeña lista de binarios **solo stdin** (por ejemplo `cut`) que pueden ejecutarse en modo de allowlist **sin** entradas explícitas en la allowlist. Los binarios seguros rechazan argumentos posicionales de archivo y tokens con forma de ruta, por lo que solo pueden operar sobre el flujo de entrada. Trátalo como una vía rápida limitada para filtros de flujo, no como una lista general de confianza.

<Warning>
**No** añadas binarios de intérprete o runtime (por ejemplo `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`. Si un comando puede evaluar código, ejecutar subcomandos o leer archivos por diseño, prefiere entradas explícitas en la allowlist y mantén habilitados los avisos de aprobación. Los binarios seguros personalizados deben definir un perfil explícito en `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binarios seguros predeterminados:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` y `sort` no están en la lista predeterminada. Si los habilitas explícitamente, mantén entradas explícitas en la allowlist para sus flujos que no sean solo stdin. Para `grep` en modo de binario seguro, proporciona el patrón con `-e`/`--regexp`; la forma posicional del patrón se rechaza para que no puedan introducirse operandos de archivo como posicionales ambiguos.

### Validación de argv y flags denegadas

La validación es determinista solo a partir de la forma de argv (sin comprobaciones de existencia en el sistema de archivos del host), lo que evita comportamiento de oráculo de existencia de archivos por diferencias entre permitir/denegar. Las opciones orientadas a archivos se deniegan para los binarios seguros predeterminados; las opciones largas se validan con fallo cerrado (las flags desconocidas y abreviaturas ambiguas se rechazan).

Flags denegadas por perfil de binario seguro:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Los binarios seguros también fuerzan que los tokens de argv se traten como **texto literal** en tiempo de ejecución (sin globbing ni expansión de `$VARS`) para segmentos solo stdin, de modo que patrones como `*` o `$HOME/...` no puedan usarse para introducir lecturas de archivos.

### Directorios de binarios de confianza

Los binarios seguros deben resolverse desde directorios de binarios de confianza (los valores predeterminados del sistema más `tools.exec.safeBinTrustedDirs` opcional). Las entradas de `PATH` nunca son de confianza automáticamente. Los directorios de confianza predeterminados son intencionalmente mínimos: `/bin`, `/usr/bin`. Si tu ejecutable de binario seguro vive en rutas de usuario o de gestores de paquetes (por ejemplo `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), añádelas explícitamente a `tools.exec.safeBinTrustedDirs`.

### Encadenamiento de shell, wrappers y multiplexores

El encadenamiento de shell (`&&`, `||`, `;`) está permitido cuando cada segmento de nivel superior satisface la allowlist (incluidos safe bins o auto-permisión de skill). Las redirecciones siguen sin ser compatibles en modo allowlist. La sustitución de comandos (`$()` / acentos graves) se rechaza durante el análisis de la allowlist, incluso dentro de comillas dobles; usa comillas simples si necesitas texto literal `$()`.

En aprobaciones de la app complementaria de macOS, el texto de shell sin procesar que contiene sintaxis de control o expansión de shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de allowlist a menos que el propio binario de shell esté en la allowlist.

Para wrappers de shell (`bash|sh|zsh ... -c/-lc`), las anulaciones de entorno con alcance de solicitud se reducen a una pequeña allowlist explícita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Para decisiones `allow-always` en modo allowlist, los wrappers de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persisten la ruta del ejecutable interno en lugar de la ruta del wrapper. Los multiplexores de shell (`busybox`, `toybox`) se desempaquetan para applets de shell (`sh`, `ash`, etc.) del mismo modo. Si un wrapper o multiplexor no puede desempaquetarse con seguridad, no se persiste automáticamente ninguna entrada en la allowlist.

Si pones en allowlist intérpretes como `python3` o `node`, prefiere `tools.exec.strictInlineEval=true` para que la evaluación en línea siga requiriendo una aprobación explícita. En modo estricto, `allow-always` aún puede persistir invocaciones benignas de intérprete/script, pero los portadores de evaluación en línea no se persisten automáticamente.

### Binarios seguros frente a allowlist

| Tema             | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                                              |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Objetivo         | Permitir automáticamente filtros limitados de stdin   | Confiar explícitamente en ejecutables específicos                              |
| Tipo de coincidencia | Nombre del ejecutable + política argv del binario seguro | Glob de ruta del ejecutable resuelto, o glob de nombre de comando simple para comandos invocados por PATH |
| Alcance de argumentos | Restringido por el perfil del binario seguro y reglas de tokens literales | Solo coincidencia de ruta; los argumentos son por lo demás tu responsabilidad  |
| Ejemplos típicos | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, CLIs personalizados                         |
| Mejor uso        | Transformaciones de texto de bajo riesgo en pipelines | Cualquier herramienta con comportamiento más amplio o efectos secundarios       |

Ubicación de la configuración:

- `safeBins` proviene de la configuración (`tools.exec.safeBins` o por agente en `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` proviene de la configuración (`tools.exec.safeBinTrustedDirs` o por agente en `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` proviene de la configuración (`tools.exec.safeBinProfiles` o por agente en `agents.list[].tools.exec.safeBinProfiles`). Las claves por agente sobrescriben las claves globales.
- las entradas de la allowlist viven en `~/.openclaw/exec-approvals.json` local del host bajo `agents.<id>.allowlist` (o mediante Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` advierte con `tools.exec.safe_bins_interpreter_unprofiled` cuando binarios de intérprete/runtime aparecen en `safeBins` sin perfiles explícitos.
- `openclaw doctor --fix` puede generar entradas faltantes `safeBinProfiles.<bin>` como `{}` (revísalas y ajústalas después). Los binarios de intérprete/runtime no se generan automáticamente.

Ejemplo de perfil personalizado:
__OC_I18N_900000__
Si habilitas explícitamente `jq` en `safeBins`, OpenClaw sigue rechazando el builtin `env` en modo de binario seguro para que `jq -n env` no pueda volcar el entorno del proceso del host sin una ruta explícita en la allowlist o un aviso de aprobación.

## Comandos de intérprete/runtime

Las ejecuciones de intérprete/runtime respaldadas por aprobación son intencionalmente conservadoras:

- El contexto exacto de argv/cwd/env siempre está enlazado.
- Las formas directas de script de shell y de archivo directo de runtime se enlazan, en el mejor esfuerzo, a una instantánea concreta de un archivo local.
- Las formas comunes de wrapper de gestor de paquetes que aún resuelven a un único archivo local directo (por ejemplo `pnpm exec`, `pnpm node`, `npm exec`, `npx`) se desempaquetan antes del enlace.
- Si OpenClaw no puede identificar exactamente un archivo local concreto para un comando de intérprete/runtime (por ejemplo scripts de paquetes, formas de eval, cadenas de loaders específicas del runtime o formas ambiguas de varios archivos), la ejecución respaldada por aprobación se deniega en lugar de afirmar una cobertura semántica que no tiene.
- Para esos flujos, prefiere sandboxing, un límite de host separado o una allowlist/flujo completo de confianza explícito en el que el operador acepte la semántica más amplia del runtime.

Cuando se requieren aprobaciones, la herramienta exec devuelve inmediatamente un id de aprobación. Usa ese id para correlacionar eventos posteriores del sistema (`Exec finished` / `Exec denied`). Si no llega ninguna decisión antes del tiempo límite, la solicitud se trata como un tiempo de espera de aprobación y se muestra como motivo de denegación.

### Comportamiento de entrega de seguimientos

Después de que termine una ejecución asíncrona aprobada, OpenClaw envía un turno de seguimiento `agent` a la misma sesión.

- Si existe un destino externo válido de entrega (canal entregable más `to` de destino), la entrega del seguimiento usa ese canal.
- En flujos solo de webchat o de sesión interna sin destino externo, la entrega del seguimiento permanece solo en la sesión (`deliver: false`).
- Si un llamador solicita explícitamente entrega externa estricta sin un canal externo resoluble, la solicitud falla con `INVALID_REQUEST`.
- Si `bestEffortDeliver` está habilitado y no puede resolverse un canal externo, la entrega se degrada a solo sesión en lugar de fallar.

## Reenvío de aprobaciones a canales de chat

Puedes reenviar avisos de aprobación de exec a cualquier canal de chat (incluidos canales de Plugin) y aprobarlos con `/approve`. Esto usa el pipeline normal de entrega saliente.

Configuración:
__OC_I18N_900001__
Responder en el chat:
__OC_I18N_900002__
El comando `/approve` maneja tanto aprobaciones de exec como aprobaciones de plugins. Si el ID no coincide con una aprobación pendiente de exec, automáticamente comprueba las aprobaciones de plugins en su lugar.

### Reenvío de aprobaciones de plugins

El reenvío de aprobaciones de plugins usa el mismo pipeline de entrega que las aprobaciones de exec, pero tiene su propia configuración independiente en `approvals.plugin`. Habilitar o deshabilitar uno no afecta al otro.
__OC_I18N_900003__
La forma de la configuración es idéntica a `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` y `targets` funcionan igual.

Los canales que admiten respuestas interactivas compartidas muestran los mismos botones de aprobación tanto para aprobaciones de exec como de plugins. Los canales sin IU interactiva compartida vuelven a texto plano con instrucciones de `/approve`.

### Aprobaciones en el mismo chat en cualquier canal

Cuando una solicitud de aprobación de exec o Plugin se origina desde una superficie de chat entregable, ese mismo chat ahora puede aprobarla con `/approve` de forma predeterminada. Esto se aplica a canales como Slack, Matrix y Microsoft Teams además de los flujos existentes de Web UI y TUI.

Esta ruta compartida de comando de texto usa el modelo normal de autenticación del canal para esa conversación. Si el chat de origen ya puede enviar comandos y recibir respuestas, las solicitudes de aprobación ya no necesitan un adaptador separado de entrega nativa solo para permanecer pendientes.

Discord y Telegram también admiten `/approve` en el mismo chat, pero esos canales siguen usando su lista resuelta de aprobadores para la autorización incluso cuando la entrega nativa de aprobación está deshabilitada.

Para Telegram y otros clientes nativos de aprobación que llaman directamente a Gateway, este mecanismo alternativo está intencionalmente limitado a fallos de “aprobación no encontrada”. Una denegación/error real de aprobación de exec no reintenta silenciosamente como una aprobación de Plugin.

### Entrega nativa de aprobaciones

Algunos canales también pueden actuar como clientes nativos de aprobación. Los clientes nativos añaden MD de aprobadores, fanout al chat de origen y UX de aprobación interactiva específica del canal además del flujo compartido `/approve` en el mismo chat.

Cuando hay disponibles tarjetas/botones nativos de aprobación, esa IU nativa es la vía principal orientada al agente. El agente no debe repetir además un comando de chat plano `/approve` duplicado, a menos que el resultado de la herramienta indique que las aprobaciones por chat no están disponibles o que la aprobación manual sea la única ruta restante.

Modelo genérico:

- la política de exec del host sigue decidiendo si se requiere aprobación de exec
- `approvals.exec` controla el reenvío de avisos de aprobación a otros destinos de chat
- `channels.<channel>.execApprovals` controla si ese canal actúa como cliente nativo de aprobación

Los clientes nativos de aprobación habilitan automáticamente la entrega prioritaria por DM cuando se cumplen todas estas condiciones:

- el canal admite entrega nativa de aprobación
- los aprobadores pueden resolverse a partir de `execApprovals.approvers` explícito o de las fuentes de respaldo documentadas para ese canal
- `channels.<channel>.execApprovals.enabled` no está establecido o es `"auto"`

Establece `enabled: false` para deshabilitar explícitamente un cliente nativo de aprobación. Establece `enabled: true` para forzarlo cuando se resuelvan aprobadores. La entrega pública al chat de origen sigue siendo explícita mediante `channels.<channel>.execApprovals.target`.

FAQ: [¿Por qué hay dos configuraciones de aprobación de exec para aprobaciones por chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Estos clientes nativos de aprobación añaden enrutamiento a MD y fanout opcional al canal además del flujo compartido `/approve` en el mismo chat y de los botones de aprobación compartidos.

Comportamiento compartido:

- Slack, Matrix, Microsoft Teams y chats entregables similares usan el modelo normal de autenticación del canal para `/approve` en el mismo chat
- cuando un cliente nativo de aprobación se habilita automáticamente, el destino predeterminado de la entrega nativa son las MD de los aprobadores
- para Discord y Telegram, solo los aprobadores resueltos pueden aprobar o denegar
- los aprobadores de Discord pueden ser explícitos (`execApprovals.approvers`) o inferidos a partir de `commands.ownerAllowFrom`
- los aprobadores de Telegram pueden ser explícitos (`execApprovals.approvers`) o inferidos a partir de la configuración existente del propietario (`allowFrom`, además de `defaultTo` de mensajes directos cuando sea compatible)
- los aprobadores de Slack pueden ser explícitos (`execApprovals.approvers`) o inferidos a partir de `commands.ownerAllowFrom`
- los botones nativos de Slack conservan el tipo de id de aprobación, de modo que los ids `plugin:` pueden resolver aprobaciones de plugins sin una segunda capa local de respaldo de Slack
- el enrutamiento nativo de MD/canal de Matrix y los accesos directos por reacción manejan tanto aprobaciones de exec como de plugins; la autorización de plugins sigue viniendo de `channels.matrix.dm.allowFrom`
- quien realiza la solicitud no necesita ser un aprobador
- el chat de origen puede aprobar directamente con `/approve` cuando ese chat ya admite comandos y respuestas
- los botones nativos de aprobación de Discord enrutan según el tipo de id de aprobación: los ids `plugin:` van directamente a aprobaciones de plugins; todo lo demás va a aprobaciones de exec
- los botones nativos de aprobación de Telegram siguen el mismo respaldo acotado de exec a Plugin que `/approve`
- cuando `target` nativo habilita la entrega al chat de origen, los avisos de aprobación incluyen el texto del comando
- las aprobaciones pendientes de exec caducan después de 30 minutos de forma predeterminada
- si ninguna IU de operador ni cliente de aprobación configurado puede aceptar la solicitud, el aviso vuelve a `askFallback`

Telegram usa por defecto las MD de aprobadores (`target: "dm"`). Puedes cambiarlo a `channel` o `both` cuando quieras que los avisos de aprobación también aparezcan en el chat/tema de Telegram de origen. Para temas de foros de Telegram, OpenClaw conserva el tema para el aviso de aprobación y el seguimiento posterior a la aprobación.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flujo IPC de macOS
__OC_I18N_900004__
Notas de seguridad:

- Modo de socket Unix `0600`, token almacenado en `exec-approvals.json`.
- Comprobación de peer con el mismo UID.
- Challenge/response (nonce + token HMAC + hash de solicitud) + TTL corto.

## Relacionado

- [Aprobaciones de exec](/es/tools/exec-approvals) — política central y flujo de aprobación
- [Herramienta exec](/es/tools/exec)
- [Modo elevado](/es/tools/elevated)
- [Skills](/es/tools/skills) — comportamiento de auto-permisión respaldado por Skills
