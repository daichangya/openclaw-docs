---
read_when:
    - Añadiendo o modificando la CLI de modelos (`models list/set/scan/aliases/fallbacks`)
    - Cambiando el comportamiento de reserva del modelo o la experiencia de usuario de selección
    - Actualizando las sondas de escaneo de modelos (herramientas/imágenes)
summary: 'CLI de modelos: listar, establecer, alias, reservas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-22T04:21:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Consulta [/concepts/model-failover](/es/concepts/model-failover) para ver la
rotación de perfiles de autenticación, los periodos de enfriamiento y cómo eso interactúa con las reservas.
Resumen rápido de proveedores + ejemplos: [/concepts/model-providers](/es/concepts/model-providers).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

1. Modelo **primario** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Reservas** en `agents.defaults.model.fallbacks` (en orden).
3. La **reserva de autenticación del proveedor** ocurre dentro de un proveedor antes de pasar al
   siguiente modelo.

Relacionado:

- `agents.defaults.models` es la lista de permitidos/catálogo de modelos que OpenClaw puede usar (más alias).
- `agents.defaults.imageModel` se usa **solo cuando** el modelo primario no puede aceptar imágenes.
- `agents.defaults.pdfModel` lo usa la herramienta `pdf`. Si se omite, la herramienta
  recurre a `agents.defaults.imageModel` y luego al modelo resuelto de la sesión/predeterminado.
- `agents.defaults.imageGenerationModel` se usa para la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la API key de ese proveedor.
- `agents.defaults.musicGenerationModel` se usa para la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la API key de ese proveedor.
- `agents.defaults.videoGenerationModel` se usa para la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado de proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de id de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/la API key de ese proveedor.
- Los valores predeterminados por agente pueden sobrescribir `agents.defaults.model` mediante `agents.list[].model` más enlaces (consulta [/concepts/multi-agent](/es/concepts/multi-agent)).

## Política rápida de modelos

- Establece tu modelo primario como el modelo más potente y de última generación disponible para ti.
- Usa reservas para tareas sensibles a costo/latencia y chats de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelos más antiguos o más débiles.

## Onboarding (recomendado)

Si no quieres editar la configuración manualmente, ejecuta el onboarding:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluyendo **OpenAI Code (Codex)
subscription** (OAuth) y **Anthropic** (API key o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permitidos + alias + parámetros de proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

Las referencias de modelos se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan
a `zai/*`.

Los ejemplos de configuración de proveedores (incluyendo OpenCode) están en
[/providers/opencode](/es/providers/opencode).

## "El modelo no está permitido" (y por qué dejan de llegar respuestas)

Si `agents.defaults.models` está configurado, se convierte en la **lista de permitidos** para `/model` y para
las sobrescrituras de sesión. Cuando un usuario selecciona un modelo que no está en esa lista de permitidos,
OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la sensación
de que “no respondió”. La solución es una de estas:

- Añadir el modelo a `agents.defaults.models`, o
- Limpiar la lista de permitidos (quitar `agents.defaults.models`), o
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
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo más un paso Submit.
- `/model <#>` selecciona desde ese selector.
- `/model` conserva inmediatamente la nueva selección de sesión.
- Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto de reintento limpio.
- Si la actividad de herramientas o la salida de la respuesta ya comenzaron, el cambio pendiente puede quedar en cola hasta una oportunidad de reintento posterior o hasta el siguiente turno del usuario.
- `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).
- Las referencias de modelos se analizan dividiendo por la **primera** `/`. Usa `provider/model` al escribir `/model <ref>`.
- Si el propio ID del modelo contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
  1. coincidencia de alias
  2. coincidencia única de proveedor configurado para ese ID exacto de modelo sin prefijo
  3. reserva obsoleta al proveedor predeterminado configurado
     Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
     en su lugar recurre al primer proveedor/modelo configurado para evitar
     mostrar un valor predeterminado obsoleto de un proveedor eliminado.

Comportamiento/configuración completos del comando: [Comandos slash](/es/tools/slash-commands).

## Comandos de CLI

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
- `--provider <name>`: filtrar por proveedor
- `--plain`: un modelo por línea
- `--json`: salida legible por máquina

`--all` incluye filas estáticas del catálogo controlado por proveedores incluidos antes de que la autenticación esté
configurada, por lo que las vistas solo de descubrimiento pueden mostrar modelos no disponibles hasta
que añadas las credenciales del proveedor correspondientes.

### `models status`

Muestra el modelo primario resuelto, las reservas, el modelo de imagen y una vista general de autenticación
de los proveedores configurados. También muestra el estado de caducidad de OAuth para los perfiles encontrados
en el almacén de autenticación (advierte dentro de las 24 h por defecto). `--plain` imprime solo el
modelo primario resuelto.
El estado de OAuth siempre se muestra (y se incluye en la salida de `--json`). Si un proveedor configurado
no tiene credenciales, `models status` imprime una sección **Falta autenticación**.
El JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers`
(autenticación efectiva por proveedor, incluidas credenciales respaldadas por variables de entorno). `auth.oauth`
solo es el estado de salud de perfiles del almacén de autenticación; los proveedores solo con variables de entorno no aparecen ahí.
Usa `--check` para automatización (código de salida `1` cuando faltan/han caducado, `2` cuando caducan pronto).
Usa `--probe` para comprobaciones en vivo de autenticación; las filas de sondeo pueden venir de perfiles de autenticación, credenciales de entorno o `models.json`.
Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
`excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver
ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

La elección de autenticación depende del proveedor/la cuenta. Para hosts de gateway siempre activos, las API key
suelen ser la opción más predecible; también se admite reutilizar Claude CLI y perfiles existentes de OAuth/token de Anthropic.

Ejemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneo (modelos gratuitos de OpenRouter)

`openclaw models scan` inspecciona el **catálogo de modelos gratuitos** de OpenRouter y puede
opcionalmente sondear modelos para compatibilidad con herramientas e imágenes.

Indicadores principales:

- `--no-probe`: omitir sondeos en vivo (solo metadatos)
- `--min-params <b>`: tamaño mínimo de parámetros (miles de millones)
- `--max-age-days <days>`: omitir modelos más antiguos
- `--provider <name>`: filtro por prefijo de proveedor
- `--max-candidates <n>`: tamaño de la lista de reservas
- `--set-default`: establecer `agents.defaults.model.primary` en la primera selección
- `--set-image`: establecer `agents.defaults.imageModel.primary` en la primera selección de imagen

El sondeo requiere una API key de OpenRouter (de perfiles de autenticación o de
`OPENROUTER_API_KEY`). Sin clave, usa `--no-probe` para listar solo candidatos.

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Cantidad de parámetros

Entrada

- Lista `/models` de OpenRouter (filtro `:free`)
- Requiere API key de OpenRouter de perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [/environment](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondeo: `--timeout`, `--concurrency`

Cuando se ejecuta en un TTY, puedes seleccionar reservas de forma interactiva. En modo no interactivo,
pasa `--yes` para aceptar los valores predeterminados.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` bajo el
directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo
se fusiona de forma predeterminada a menos que `models.mode` esté establecido en `replace`.

Precedencia del modo de fusión para ID de proveedor coincidentes:

- `baseUrl` no vacío ya presente en el `models.json` del agente tiene prioridad.
- `apiKey` no vacía en el `models.json` del agente tiene prioridad solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
- Los valores `apiKey` de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de conservar secretos resueltos.
- Los valores de encabezado de proveedores gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
- `apiKey`/`baseUrl` vacíos o ausentes del agente recurren a la configuración `models.providers`.
- Los demás campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

La persistencia de marcadores es autoritativa desde el origen: OpenClaw escribe marcadores a partir de la instantánea de configuración de origen activa (previa a la resolución), no a partir de valores secretos resueltos en tiempo de ejecución.
Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas controladas por comandos como `openclaw agent`.

## Relacionado

- [Proveedores de modelos](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Reserva de modelos](/es/concepts/model-failover) — cadenas de reserva
- [Generación de imágenes](/es/tools/image-generation) — configuración de modelos de imagen
- [Generación de música](/es/tools/music-generation) — configuración de modelos de música
- [Generación de video](/es/tools/video-generation) — configuración de modelos de video
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) — claves de configuración de modelos
