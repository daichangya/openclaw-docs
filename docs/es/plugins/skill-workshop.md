---
read_when:
    - Quieres que los agentes conviertan correcciones o procedimientos reutilizables en Skills del workspace
    - Estás configurando la memoria procedural de Skills
    - Estás depurando el comportamiento de la herramienta `skill_workshop`
    - Estás decidiendo si habilitar la creación automática de Skills
summary: Captura experimental de procedimientos reutilizables como Skills del workspace con revisión, aprobación, cuarentena y actualización en caliente de Skills
title: Plugin de taller de Skills
x-i18n:
    generated_at: "2026-04-22T04:25:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin de taller de Skills

Skill Workshop es **experimental**. Está deshabilitado de forma predeterminada, sus
heurísticas de captura y prompts de revisión pueden cambiar entre versiones, y las
escrituras automáticas deben usarse solo en workspaces de confianza después de revisar primero la salida en modo pendiente.

Skill Workshop es memoria procedural para Skills del workspace. Permite que un agente convierta
flujos de trabajo reutilizables, correcciones del usuario, soluciones costosas de obtener y errores recurrentes
en archivos `SKILL.md` bajo:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Esto es diferente de la memoria a largo plazo:

- **Memory** almacena hechos, preferencias, entidades y contexto pasado.
- **Skills** almacenan procedimientos reutilizables que el agente debe seguir en tareas futuras.
- **Skill Workshop** es el puente entre un turno útil y una Skill duradera del workspace,
  con comprobaciones de seguridad y aprobación opcional.

Skill Workshop es útil cuando el agente aprende un procedimiento como:

- cómo validar recursos GIF animados obtenidos externamente
- cómo reemplazar recursos de capturas de pantalla y verificar dimensiones
- cómo ejecutar un escenario QA específico de un repositorio
- cómo depurar un fallo recurrente de proveedor
- cómo reparar una nota de flujo de trabajo local obsoleta

No está pensado para:

- hechos como “al usuario le gusta el azul”
- memoria autobiográfica amplia
- archivado de transcripciones sin procesar
- secretos, credenciales o texto oculto de prompts
- instrucciones puntuales que no se repetirán

## Estado predeterminado

El Plugin incluido es **experimental** y está **deshabilitado de forma predeterminada** a menos que se
habilite explícitamente en `plugins.entries.skill-workshop`.

El manifiesto del Plugin no establece `enabledByDefault: true`. El valor predeterminado `enabled: true`
dentro del esquema de configuración del Plugin se aplica solo después de que la entrada del Plugin ya haya sido seleccionada y cargada.

Experimental significa:

- el Plugin tiene suficiente soporte para pruebas opt-in y dogfooding
- el almacenamiento de propuestas, los umbrales del revisor y las heurísticas de captura pueden evolucionar
- la aprobación pendiente es el modo inicial recomendado
- la aplicación automática es para configuraciones personales/de workspace de confianza, no para entornos compartidos u hostiles con muchas entradas

## Habilitar

Configuración mínima segura:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Con esta configuración:

- la herramienta `skill_workshop` está disponible
- las correcciones reutilizables explícitas se ponen en cola como propuestas pendientes
- las pasadas del revisor basadas en umbrales pueden proponer actualizaciones de Skills
- no se escribe ningún archivo de Skill hasta que se aplique una propuesta pendiente

Usa escrituras automáticas solo en workspaces de confianza:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` sigue usando la misma ruta de escaneo y cuarentena. No
aplica propuestas con hallazgos críticos.

## Configuración

| Clave                | Predeterminado | Rango / valores                              | Significado                                                           |
| -------------------- | -------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `enabled`            | `true`         | boolean                                      | Habilita el Plugin después de cargar la entrada del Plugin.           |
| `autoCapture`        | `true`         | boolean                                      | Habilita captura/revisión posterior al turno en turnos exitosos del agente. |
| `approvalPolicy`     | `"pending"`    | `"pending"`, `"auto"`                        | Poner propuestas en cola o escribir automáticamente propuestas seguras. |
| `reviewMode`         | `"hybrid"`     | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"`  | Elige captura explícita de correcciones, revisor LLM, ambos o ninguno. |
| `reviewInterval`     | `15`           | `1..200`                                     | Ejecutar el revisor después de esta cantidad de turnos exitosos.      |
| `reviewMinToolCalls` | `8`            | `1..500`                                     | Ejecutar el revisor después de esta cantidad de llamadas a herramientas observadas. |
| `reviewTimeoutMs`    | `45000`        | `5000..180000`                               | Tiempo de espera de la ejecución del revisor incrustado.              |
| `maxPending`         | `50`           | `1..200`                                     | Máximo de propuestas pendientes/en cuarentena conservadas por workspace. |
| `maxSkillBytes`      | `40000`        | `1024..200000`                               | Tamaño máximo del archivo de Skill/de soporte generado.               |

Perfiles recomendados:

```json5
// Conservador: solo uso explícito de herramientas, sin captura automática.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Revisión primero: capturar automáticamente, pero requerir aprobación.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automatización de confianza: escribir propuestas seguras de inmediato.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Bajo costo: sin llamada LLM del revisor, solo frases explícitas de corrección.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Rutas de captura

Skill Workshop tiene tres rutas de captura.

### Sugerencias de herramienta

El modelo puede llamar directamente a `skill_workshop` cuando detecta un procedimiento reutilizable
o cuando el usuario le pide guardar/actualizar una Skill.

Esta es la ruta más explícita y funciona incluso con `autoCapture: false`.

### Captura heurística

Cuando `autoCapture` está habilitado y `reviewMode` es `heuristic` o `hybrid`, el
Plugin escanea turnos exitosos en busca de frases explícitas de corrección del usuario:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

La heurística crea una propuesta a partir de la última instrucción de usuario coincidente. Usa
pistas temáticas para elegir nombres de Skills para flujos de trabajo comunes:

- tareas de GIF animados -> `animated-gif-workflow`
- tareas de capturas de pantalla o recursos -> `screenshot-asset-workflow`
- tareas QA o de escenarios -> `qa-scenario-workflow`
- tareas de GitHub PR -> `github-pr-workflow`
- reserva -> `learned-workflows`

La captura heurística es intencionadamente limitada. Es para correcciones claras y
notas de proceso repetibles, no para resumen general de transcripciones.

### Revisor LLM

Cuando `autoCapture` está habilitado y `reviewMode` es `llm` o `hybrid`, el Plugin
ejecuta un revisor incrustado compacto cuando se alcanzan los umbrales.

El revisor recibe:

- el texto reciente de la transcripción, limitado a los últimos 12.000 caracteres
- hasta 12 Skills existentes del workspace
- hasta 2.000 caracteres de cada Skill existente
- instrucciones solo JSON

El revisor no tiene herramientas:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Puede devolver:

```json
{ "action": "none" }
```

o una propuesta de Skill:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

También puede anexar a una Skill existente:

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

O reemplazar texto exacto en una Skill existente:

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Prefiere `append` o `replace` cuando ya exista una Skill relevante. Usa `create`
solo cuando ninguna Skill existente encaje.

## Ciclo de vida de la propuesta

Cada actualización generada se convierte en una propuesta con:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` opcional
- `sessionId` opcional
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end` o `reviewer`
- `status`
- `change`
- `scanFindings` opcional
- `quarantineReason` opcional

Estados de propuesta:

- `pending` - esperando aprobación
- `applied` - escrita en `<workspace>/skills`
- `rejected` - rechazada por el operador/modelo
- `quarantined` - bloqueada por hallazgos críticos del escáner

El estado se almacena por workspace bajo el directorio de estado del Gateway:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Las propuestas pendientes y en cuarentena se desduplican por nombre de Skill y carga útil
de cambio. El almacén conserva las propuestas pendientes/en cuarentena más recientes hasta
`maxPending`.

## Referencia de la herramienta

El Plugin registra una herramienta del agente:

```text
skill_workshop
```

### `status`

Contar propuestas por estado para el workspace activo.

```json
{ "action": "status" }
```

Forma del resultado:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Listar propuestas pendientes.

```json
{ "action": "list_pending" }
```

Para listar otro estado:

```json
{ "action": "list_pending", "status": "applied" }
```

Valores válidos de `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Listar propuestas en cuarentena.

```json
{ "action": "list_quarantine" }
```

Úsalo cuando la captura automática parezca no hacer nada y los registros mencionen
`skill-workshop: quarantined <skill>`.

### `inspect`

Obtener una propuesta por id.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Crear una propuesta. Con `approvalPolicy: "pending"`, esto la pone en cola de forma predeterminada.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

Forzar una escritura segura:

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Forzar pendiente incluso en `approvalPolicy: "auto"`:

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Anexar a una sección:

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Reemplazar texto exacto:

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Aplicar una propuesta pendiente.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` rechaza propuestas en cuarentena:

```text
quarantined proposal cannot be applied
```

### `reject`

Marcar una propuesta como rechazada.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Escribir un archivo de soporte dentro de un directorio de Skill existente o propuesto.

Directorios de soporte permitidos de nivel superior:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Ejemplo:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Los archivos de soporte tienen alcance de workspace, se comprueba su ruta, están limitados en bytes por
`maxSkillBytes`, se escanean y se escriben de forma atómica.

## Escrituras de Skills

Skill Workshop escribe solo bajo:

```text
<workspace>/skills/<normalized-skill-name>/
```

Los nombres de Skills se normalizan:

- en minúsculas
- las secuencias no `[a-z0-9_-]` se convierten en `-`
- se eliminan los caracteres no alfanuméricos del inicio/final
- la longitud máxima es de 80 caracteres
- el nombre final debe coincidir con `[a-z0-9][a-z0-9_-]{1,79}`

Para `create`:

- si la Skill no existe, Skill Workshop escribe un nuevo `SKILL.md`
- si ya existe, Skill Workshop anexa el cuerpo a `## Workflow`

Para `append`:

- si la Skill existe, Skill Workshop anexa a la sección solicitada
- si no existe, Skill Workshop crea una Skill mínima y luego anexa

Para `replace`:

- la Skill ya debe existir
- `oldText` debe estar presente exactamente
- solo se reemplaza la primera coincidencia exacta

Todas las escrituras son atómicas y actualizan inmediatamente la instantánea de Skills en memoria, por lo que
la Skill nueva o actualizada puede hacerse visible sin reiniciar el Gateway.

## Modelo de seguridad

Skill Workshop tiene un escáner de seguridad sobre el contenido generado de `SKILL.md` y los archivos
de soporte.

Los hallazgos críticos ponen en cuarentena las propuestas:

| ID de regla                             | Bloquea contenido que...                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions`  | dice al agente que ignore instrucciones previas/de nivel superior        |
| `prompt-injection-system`               | hace referencia a prompts del sistema, mensajes del desarrollador o instrucciones ocultas |
| `prompt-injection-tool`                 | anima a omitir permisos/aprobación de herramientas                       |
| `shell-pipe-to-shell`                   | incluye `curl`/`wget` canalizado a `sh`, `bash` o `zsh`                 |
| `secret-exfiltration`                   | parece enviar datos de entorno/env de proceso por la red                |

Los hallazgos de advertencia se conservan pero no bloquean por sí solos:

| ID de regla           | Advierte sobre...                    |
| --------------------- | ------------------------------------ |
| `destructive-delete`  | comandos amplios de estilo `rm -rf`  |
| `unsafe-permissions`  | uso de permisos de estilo `chmod 777` |

Las propuestas en cuarentena:

- conservan `scanFindings`
- conservan `quarantineReason`
- aparecen en `list_quarantine`
- no pueden aplicarse mediante `apply`

Para recuperarte de una propuesta en cuarentena, crea una nueva propuesta segura con el
contenido inseguro eliminado. No edites a mano el JSON del almacén.

## Orientación de prompt

Cuando está habilitado, Skill Workshop inyecta una breve sección de prompt que indica al agente
que use `skill_workshop` para memoria procedural duradera.

La orientación enfatiza:

- procedimientos, no hechos/preferencias
- correcciones del usuario
- procedimientos exitosos no obvios
- errores recurrentes
- reparación de Skills obsoletas/superficiales/incorrectas mediante append/replace
- guardar procedimientos reutilizables después de bucles largos con herramientas o correcciones difíciles
- texto de Skill corto e imperativo
- sin volcados de transcripciones

El texto del modo de escritura cambia con `approvalPolicy`:

- modo pending: poner sugerencias en cola; aplicar solo tras aprobación explícita
- modo auto: aplicar actualizaciones seguras de Skills del workspace cuando sean claramente reutilizables

## Costos y comportamiento del tiempo de ejecución

La captura heurística no llama a ningún modelo.

La revisión LLM usa una ejecución incrustada en el modelo del agente activo/predeterminado. Está
basada en umbrales, por lo que no se ejecuta en cada turno de forma predeterminada.

El revisor:

- usa el mismo contexto configurado de proveedor/modelo cuando está disponible
- recurre a los valores predeterminados del agente en tiempo de ejecución
- tiene `reviewTimeoutMs`
- usa contexto de bootstrap ligero
- no tiene herramientas
- no escribe nada directamente
- solo puede emitir una propuesta que pasa por el escáner normal y la
  ruta de aprobación/cuarentena

Si el revisor falla, expira por tiempo o devuelve JSON no válido, el Plugin registra un
mensaje de advertencia/debug y omite esa pasada de revisión.

## Patrones operativos

Usa Skill Workshop cuando el usuario diga:

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

Buen texto de Skill:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Texto de Skill deficiente:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Razones por las que la versión deficiente no debería guardarse:

- tiene forma de transcripción
- no es imperativa
- incluye detalles puntuales ruidosos
- no le dice al siguiente agente qué hacer

## Depuración

Comprueba si el Plugin está cargado:

```bash
openclaw plugins list --enabled
```

Comprueba los recuentos de propuestas desde un contexto de agente/herramienta:

```json
{ "action": "status" }
```

Inspeccionar propuestas pendientes:

```json
{ "action": "list_pending" }
```

Inspeccionar propuestas en cuarentena:

```json
{ "action": "list_quarantine" }
```

Síntomas comunes:

| Síntoma                              | Causa probable                                                                       | Comprobar                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| La herramienta no está disponible    | La entrada del Plugin no está habilitada                                             | `plugins.entries.skill-workshop.enabled` y `openclaw plugins list`   |
| No aparece ninguna propuesta automática | `autoCapture: false`, `reviewMode: "off"` o no se alcanzaron los umbrales           | Configuración, estado de propuestas, registros del Gateway           |
| La heurística no capturó             | La redacción del usuario no coincidió con los patrones de corrección                 | Usa `skill_workshop.suggest` explícito o habilita el revisor LLM     |
| El revisor no creó una propuesta     | El revisor devolvió `none`, JSON no válido o expiró por tiempo                       | Registros del Gateway, `reviewTimeoutMs`, umbrales                   |
| La propuesta no se aplica            | `approvalPolicy: "pending"`                                                          | `list_pending`, luego `apply`                                        |
| La propuesta desapareció de pendientes | Se reutilizó una propuesta duplicada, poda por máximo pendiente o fue aplicada/rechazada/en cuarentena | `status`, `list_pending` con filtros de estado, `list_quarantine`    |
| El archivo de Skill existe pero el modelo no la detecta | La instantánea de Skills no se actualizó o la restricción de Skills la excluye | estado de `openclaw skills` y elegibilidad de Skills del workspace   |

Registros relevantes:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Escenarios QA

Escenarios QA respaldados por el repositorio:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Ejecutar la cobertura determinista:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Ejecutar la cobertura del revisor:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

El escenario del revisor está intencionadamente separado porque habilita
`reviewMode: "llm"` y ejercita la pasada del revisor incrustado.

## Cuándo no habilitar Auto Apply

Evita `approvalPolicy: "auto"` cuando:

- el workspace contiene procedimientos sensibles
- el agente trabaja con entradas no confiables
- las Skills se comparten entre un equipo amplio
- todavía estás ajustando prompts o reglas del escáner
- el modelo maneja con frecuencia contenido web/correo hostil

Usa primero el modo pending. Cambia al modo auto solo después de revisar el tipo de
Skills que el agente propone en ese workspace.

## Documentación relacionada

- [Skills](/es/tools/skills)
- [Plugins](/es/tools/plugin)
- [Pruebas](/es/reference/test)
