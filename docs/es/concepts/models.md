---
read_when:
    - Agregar o modificar la CLI de modelos (`models list`/`set`/`scan`/`aliases`/`fallbacks`)
    - Cambio del comportamiento de respaldo de modelos o de la experiencia de selección
    - Actualización de sondas de exploración de modelos (`tools`/`images`)
summary: 'CLI de modelos: `list`, `set`, alias, respaldos, `scan`, `status`'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-25T13:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Consulta [/concepts/model-failover](/es/concepts/model-failover) para la
rotación de perfiles de autenticación, los tiempos de enfriamiento y cómo eso interactúa con los respaldos.
Resumen rápido de proveedores + ejemplos: [/concepts/model-providers](/es/concepts/model-providers).
Las referencias de modelo eligen un proveedor y un modelo. Por lo general, no eligen el
runtime de agente de bajo nivel. Por ejemplo, `openai/gpt-5.5` puede ejecutarse a través de la
ruta normal del proveedor OpenAI o a través del runtime del servidor de la app Codex, según
`agents.defaults.embeddedHarness.runtime`. Consulta
[/concepts/agent-runtimes](/es/concepts/agent-runtimes).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

1. Modelo **primario** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Respaldos** en `agents.defaults.model.fallbacks` (en orden).
3. El **failover de autenticación del proveedor** ocurre dentro de un proveedor antes de pasar al
   siguiente modelo.

Relacionado:

- `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias).
- `agents.defaults.imageModel` se usa **solo cuando** el modelo primario no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta
  usa como respaldo `agents.defaults.imageModel`, y luego el modelo de sesión/predeterminado resuelto.
- `agents.defaults.imageGenerationModel` lo usa la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores de generación de imágenes registrados restantes en orden por id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- `agents.defaults.musicGenerationModel` lo usa la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores de generación de música registrados restantes en orden por id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- `agents.defaults.videoGenerationModel` lo usa la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor con autenticación. Primero prueba el proveedor predeterminado actual y luego los proveedores de generación de video registrados restantes en orden por id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la clave API de ese proveedor.
- Los valores predeterminados por agente pueden sobrescribir `agents.defaults.model` mediante `agents.list[].model` más enlaces (consulta [/concepts/multi-agent](/es/concepts/multi-agent)).

## Política rápida de modelos

- Establece tu modelo primario en el modelo de última generación más potente que tengas disponible.
- Usa respaldos para tareas sensibles al costo/la latencia y chats de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelo más antiguos o más débiles.

## Incorporación (recomendada)

Si no quieres editar la configuración manualmente, ejecuta la incorporación:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluyendo la **suscripción a OpenAI Code (Codex)**
(OAuth) y **Anthropic** (clave API o CLI de Claude).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

Las referencias de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan
a `zai/*`.

Los ejemplos de configuración de proveedor (incluido OpenCode) están en
[/providers/opencode](/es/providers/opencode).

### Ediciones seguras de la lista de permitidos

Usa escrituras aditivas al actualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege los mapas de modelos/proveedores contra sobrescrituras accidentales. Una
asignación de objeto simple a `agents.defaults.models`, `models.providers` o
`models.providers.<id>.models` se rechaza cuando eliminaría entradas existentes.
Usa `--merge` para cambios aditivos; usa `--replace` solo cuando el
valor proporcionado deba convertirse en el valor completo de destino.

La configuración interactiva del proveedor y `openclaw configure --section model` también fusionan
las selecciones con alcance de proveedor en la lista de permitidos existente, por lo que agregar Codex,
Ollama u otro proveedor no elimina entradas de modelo no relacionadas.
Configure conserva un valor existente de `agents.defaults.model.primary` cuando se vuelve a aplicar la
autenticación del proveedor. Los comandos explícitos para establecer el valor predeterminado, como
`openclaw models auth login --provider <id> --set-default` y
`openclaw models set <model>`, siguen reemplazando `agents.defaults.model.primary`.

## "Model is not allowed" (y por qué las respuestas se detienen)

Si `agents.defaults.models` está establecido, se convierte en la **lista de permitidos** para `/model` y para
las sobrescrituras de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos,
OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esto sucede **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la sensación
de que “no respondió”. La solución es una de estas:

- Agregar el modelo a `agents.defaults.models`, o
- Borrar la lista de permitidos (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

Ejemplo de configuración de lista de permitidos:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Cambiar modelos en el chat (`/model`)

Puedes cambiar modelos para la sesión actual sin reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Notas:

- `/model` (y `/model list`) es un selector compacto numerado (familia de modelos + proveedores disponibles).
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso de envío.
- `/models add` está obsoleto y ahora devuelve un mensaje de obsolescencia en lugar de registrar modelos desde el chat.
- `/model <#>` selecciona desde ese selector.
- `/model` conserva inmediatamente la nueva selección de sesión.
- Si el agente está inactivo, la siguiente ejecución usa enseguida el nuevo modelo.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya comenzaron, el cambio pendiente puede permanecer en cola hasta una oportunidad posterior de reintento o el siguiente turno del usuario.
- `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).
- Las referencias de modelo se analizan separando en la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
- Si el propio id del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
  1. coincidencia de alias
  2. coincidencia única de proveedor configurado para ese id de modelo exacto sin prefijo
  3. respaldo obsoleto al proveedor predeterminado configurado
     Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
     usa en su lugar como respaldo el primer proveedor/modelo configurado para evitar
     mostrar un valor predeterminado obsoleto de proveedor eliminado.

Comportamiento/configuración completos del comando: [Comandos slash](/es/tools/slash-commands).

## Comandos de la CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sin subcomando) es un atajo para `models status`.

### `models list`

Muestra de forma predeterminada los modelos configurados. Indicadores útiles:

- `--all`: catálogo completo
- `--local`: solo proveedores locales
- `--provider <id>`: filtrar por id de proveedor, por ejemplo `moonshot`; no se aceptan
  etiquetas visibles de selectores interactivos
- `--plain`: un modelo por línea
- `--json`: salida legible por máquina

`--all` incluye filas de catálogo estático incluidas y propiedad del proveedor antes de que se configure la
autenticación, por lo que las vistas solo de descubrimiento pueden mostrar modelos que no están disponibles hasta
que agregues credenciales de proveedor coincidentes.

### `models status`

Muestra el modelo primario resuelto, los respaldos, el modelo de imágenes y una vista general de autenticación
de los proveedores configurados. También muestra el estado de vencimiento de OAuth para los perfiles encontrados
en el almacén de autenticación (avisa dentro de las 24 h de forma predeterminada). `--plain` imprime solo el
modelo primario resuelto.
El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado
no tiene credenciales, `models status` imprime una sección **Missing auth**.
JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers`
(autenticación efectiva por proveedor, incluidas las credenciales basadas en entorno). `auth.oauth`
es solo la salud de los perfiles del almacén de autenticación; los proveedores solo de entorno no aparecen allí.
Usa `--check` para automatización (código de salida `1` cuando falta/está vencido, `2` cuando está por vencer).
Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden venir de perfiles de autenticación, credenciales de entorno o `models.json`.
Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
`excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no puede resolverse
ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

La elección de autenticación depende del proveedor/la cuenta. Para hosts de gateway siempre activos, las
claves API suelen ser la opción más predecible; también se admite reutilizar la CLI de Claude y perfiles existentes de OAuth/token de Anthropic.

Ejemplo (CLI de Claude):

```bash
claude auth login
openclaw models status
```

## Exploración (`scan`) (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y puede
opcionalmente sondear modelos para compatibilidad con herramientas e imágenes.

Indicadores principales:

- `--no-probe`: omitir sondeos en vivo (solo metadatos)
- `--min-params <b>`: tamaño mínimo de parámetros (miles de millones)
- `--max-age-days <days>`: omitir modelos más antiguos
- `--provider <name>`: filtro por prefijo de proveedor
- `--max-candidates <n>`: tamaño de la lista de respaldos
- `--set-default`: establecer `agents.defaults.model.primary` en la primera selección
- `--set-image`: establecer `agents.defaults.imageModel.primary` en la primera selección de imágenes

El catálogo `/models` de OpenRouter es público, por lo que las exploraciones solo de metadatos pueden listar
candidatos gratuitos sin una clave. Los sondeos y la inferencia siguen requiriendo una
clave API de OpenRouter (de perfiles de autenticación o `OPENROUTER_API_KEY`). Si no hay ninguna clave
disponible, `openclaw models scan` usa como respaldo una salida solo de metadatos y deja la
configuración sin cambios. Usa `--no-probe` para solicitar explícitamente el modo solo de metadatos.

Los resultados de la exploración se ordenan por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Cantidad de parámetros

Entrada

- Lista `/models` de OpenRouter (filtro `:free`)
- Los sondeos en vivo requieren una clave API de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [/environment](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitud/sondeo: `--timeout`, `--concurrency`

Cuando los sondeos en vivo se ejecutan en un TTY, puedes seleccionar respaldos de forma interactiva. En
modo no interactivo, pasa `--yes` para aceptar los valores predeterminados. Los resultados solo de metadatos son
informativos; `--set-default` y `--set-image` requieren sondeos en vivo para que
OpenClaw no configure un modelo de OpenRouter sin clave e inutilizable.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el
directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo
se fusiona de forma predeterminada a menos que `models.mode` esté configurado como `replace`.

Precedencia del modo de fusión para ids de proveedor coincidentes:

- Un `baseUrl` no vacío ya presente en el `models.json` del agente tiene prioridad.
- Un `apiKey` no vacío en el `models.json` del agente tiene prioridad solo cuando ese proveedor no está administrado por SecretRef en el contexto actual de configuración/perfil de autenticación.
- Los valores `apiKey` de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de conservar secretos resueltos.
- Los valores de cabeceras de proveedores administrados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
- Los valores `apiKey`/`baseUrl` vacíos o ausentes del agente usan como respaldo `models.providers` de la configuración.
- Los demás campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

La persistencia de marcadores es autoritativa según la fuente: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (antes de la resolución), no desde valores secretos resueltos en tiempo de ejecución.
Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas las rutas impulsadas por comandos como `openclaw agent`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento y autenticación del proveedor
- [Runtimes de agentes](/es/concepts/agent-runtimes) — Pi, Codex y otros runtimes de bucle de agente
- [Failover de modelos](/es/concepts/model-failover) — cadenas de respaldo
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imágenes
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — claves de configuración de modelos
