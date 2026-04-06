---
read_when:
    - Añadir o modificar la CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Cambiar el comportamiento de alternativas de modelos o la experiencia de selección
    - Actualizar las sondas de escaneo de modelos (herramientas/imágenes)
summary: 'CLI de modelos: listar, establecer, alias, alternativas, escanear, estado'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-06T03:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299602ccbe0c3d6bbdb2deab22bc60e1300ef6843ed0b8b36be574cc0213c155
    source_path: concepts/models.md
    workflow: 15
---

# CLI de modelos

Consulta [/concepts/model-failover](/es/concepts/model-failover) para la
rotación de perfiles de autenticación, los tiempos de enfriamiento y cómo eso
interactúa con las alternativas.
Resumen rápido de proveedores + ejemplos: [/concepts/model-providers](/es/concepts/model-providers).

## Cómo funciona la selección de modelos

OpenClaw selecciona modelos en este orden:

1. Modelo **principal** (`agents.defaults.model.primary` o `agents.defaults.model`).
2. **Alternativas** en `agents.defaults.model.fallbacks` (en orden).
3. La **conmutación por error de autenticación del proveedor** ocurre dentro de un proveedor antes de pasar al
   siguiente modelo.

Relacionado:

- `agents.defaults.models` es la lista permitida/catálogo de modelos que OpenClaw puede usar (más alias).
- `agents.defaults.imageModel` se usa **solo cuando** el modelo principal no puede aceptar imágenes.
- `agents.defaults.pdfModel` se usa con la herramienta `pdf`. Si se omite, la herramienta
  recurre a `agents.defaults.imageModel`, luego al modelo de sesión/predeterminado
  resuelto.
- `agents.defaults.imageGenerationModel` se usa para la capacidad compartida de generación de imágenes. Si se omite, `image_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de imágenes registrados en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- `agents.defaults.musicGenerationModel` se usa para la capacidad compartida de generación de música. Si se omite, `music_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de música registrados en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- `agents.defaults.videoGenerationModel` se usa para la capacidad compartida de generación de video. Si se omite, `video_generate` aún puede inferir un valor predeterminado del proveedor respaldado por autenticación. Primero prueba el proveedor predeterminado actual y luego los demás proveedores de generación de video registrados en orden de ID de proveedor. Si estableces un proveedor/modelo específico, configura también la autenticación/clave de API de ese proveedor.
- Los valores predeterminados por agente pueden sobrescribir `agents.defaults.model` mediante `agents.list[].model` más enlaces (consulta [/concepts/multi-agent](/es/concepts/multi-agent)).

## Política rápida de modelos

- Establece tu modelo principal en el modelo más sólido y de última generación que tengas disponible.
- Usa alternativas para tareas sensibles al costo/la latencia y para chat de menor importancia.
- Para agentes con herramientas habilitadas o entradas no confiables, evita niveles de modelos más antiguos o más débiles.

## Onboarding (recomendado)

Si no quieres editar la configuración a mano, ejecuta el onboarding:

```bash
openclaw onboard
```

Puede configurar modelo + autenticación para proveedores comunes, incluida la **suscripción a OpenAI Code (Codex)**
(OAuth) y **Anthropic** (clave de API o Claude CLI).

## Claves de configuración (resumen)

- `agents.defaults.model.primary` y `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` y `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` y `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` y `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` y `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista permitida + alias + parámetros del proveedor)
- `models.providers` (proveedores personalizados escritos en `models.json`)

Las referencias de modelo se normalizan a minúsculas. Los alias de proveedor como `z.ai/*` se normalizan
a `zai/*`.

Los ejemplos de configuración de proveedores (incluido OpenCode) se encuentran en
[/providers/opencode](/es/providers/opencode).

## "Model is not allowed" (y por qué se detienen las respuestas)

Si `agents.defaults.models` está establecido, se convierte en la **lista permitida** para `/model` y para
las sobrescrituras de sesión. Cuando un usuario selecciona un modelo que no está en esa lista permitida,
OpenClaw devuelve:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Esto ocurre **antes** de que se genere una respuesta normal, por lo que el mensaje puede dar la sensación
de que “no respondió”. La solución es una de estas:

- Añadir el modelo a `agents.defaults.models`, o
- Borrar la lista permitida (eliminar `agents.defaults.models`), o
- Elegir un modelo de `/model list`.

Ejemplo de configuración de lista permitida:

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
- En Discord, `/model` y `/models` abren un selector interactivo con menús desplegables de proveedor y modelo, además de un paso de envío.
- `/model <#>` selecciona desde ese selector.
- `/model` persiste inmediatamente la nueva selección de sesión.
- Si el agente está inactivo, la siguiente ejecución usa el nuevo modelo de inmediato.
- Si ya hay una ejecución activa, OpenClaw marca un cambio en vivo como pendiente y solo reinicia con el nuevo modelo en un punto limpio de reintento.
- Si la actividad de herramientas o la salida de respuesta ya comenzó, el cambio pendiente puede permanecer en cola hasta una oportunidad de reintento posterior o el siguiente turno del usuario.
- `/model status` es la vista detallada (candidatos de autenticación y, cuando está configurado, `baseUrl` del endpoint del proveedor + modo `api`).
- Las referencias de modelo se analizan dividiendo en el **primer** `/`. Usa `provider/model` al escribir `/model <ref>`.
- Si el ID del modelo en sí contiene `/` (estilo OpenRouter), debes incluir el prefijo del proveedor (ejemplo: `/model openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw resuelve la entrada en este orden:
  1. coincidencia de alias
  2. coincidencia única de proveedor configurado para ese ID exacto de modelo sin prefijo
  3. alternativa obsoleta al proveedor predeterminado configurado
     Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw
     en su lugar recurre al primer proveedor/modelo configurado para evitar
     mostrar un valor predeterminado obsoleto de un proveedor eliminado.

Comportamiento/configuración completa del comando: [Comandos de barra](/es/tools/slash-commands).

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

Muestra los modelos configurados de forma predeterminada. Indicadores útiles:

- `--all`: catálogo completo
- `--local`: solo proveedores locales
- `--provider <name>`: filtrar por proveedor
- `--plain`: un modelo por línea
- `--json`: salida legible por máquina

### `models status`

Muestra el modelo principal resuelto, las alternativas, el modelo de imagen y un resumen de autenticación
de los proveedores configurados. También muestra el estado de vencimiento de OAuth para los perfiles encontrados
en el almacén de autenticación (advierte dentro de las 24 h por defecto). `--plain` imprime solo el
modelo principal resuelto.
El estado de OAuth siempre se muestra (y se incluye en la salida `--json`). Si un proveedor configurado
no tiene credenciales, `models status` imprime una sección de **Missing auth**.
El JSON incluye `auth.oauth` (ventana de advertencia + perfiles) y `auth.providers`
(autenticación efectiva por proveedor, incluidas las credenciales respaldadas por variables de entorno). `auth.oauth`
es solo el estado de los perfiles del almacén de autenticación; los proveedores solo con variables de entorno no aparecen allí.
Usa `--check` para automatización (código de salida `1` cuando falta/está vencido, `2` cuando está por vencer).
Usa `--probe` para comprobaciones de autenticación en vivo; las filas de sondeo pueden provenir de perfiles de autenticación, credenciales de entorno
o `models.json`.
Si `auth.order.<provider>` explícito omite un perfil almacenado, el sondeo informa
`excluded_by_auth_order` en lugar de intentarlo. Si existe autenticación pero no se puede resolver
ningún modelo sondeable para ese proveedor, el sondeo informa `status: no_model`.

La elección de autenticación depende del proveedor/la cuenta. Para hosts de gateway siempre activos, las claves de API
suelen ser la opción más predecible; también se admite la reutilización de Claude CLI y los perfiles existentes de OAuth/token de Anthropic.

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
- `--max-candidates <n>`: tamaño de la lista de alternativas
- `--set-default`: establecer `agents.defaults.model.primary` en la primera selección
- `--set-image`: establecer `agents.defaults.imageModel.primary` en la primera selección de imagen

El sondeo requiere una clave de API de OpenRouter (de perfiles de autenticación o
`OPENROUTER_API_KEY`). Sin una clave, usa `--no-probe` para listar solo candidatos.

Los resultados del escaneo se clasifican por:

1. Compatibilidad con imágenes
2. Latencia de herramientas
3. Tamaño de contexto
4. Cantidad de parámetros

Entrada

- Lista `/models` de OpenRouter (filtro `:free`)
- Requiere la clave de API de OpenRouter desde perfiles de autenticación o `OPENROUTER_API_KEY` (consulta [/environment](/es/help/environment))
- Filtros opcionales: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondeo: `--timeout`, `--concurrency`

Cuando se ejecuta en un TTY, puedes seleccionar alternativas de forma interactiva. En modo no interactivo,
pasa `--yes` para aceptar los valores predeterminados.

## Registro de modelos (`models.json`)

Los proveedores personalizados en `models.providers` se escriben en `models.json` dentro del
directorio del agente (predeterminado `~/.openclaw/agents/<agentId>/agent/models.json`). Este archivo
se fusiona por defecto a menos que `models.mode` esté establecido en `replace`.

Precedencia del modo de fusión para ID de proveedor coincidentes:

- Gana `baseUrl` no vacío ya presente en el `models.json` del agente.
- `apiKey` no vacío en el `models.json` del agente gana solo cuando ese proveedor no está gestionado por SecretRef en el contexto actual de configuración/perfil de autenticación.
- Los valores `apiKey` del proveedor gestionados por SecretRef se actualizan desde marcadores de origen (`ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec) en lugar de persistir secretos resueltos.
- Los valores de encabezado del proveedor gestionados por SecretRef se actualizan desde marcadores de origen (`secretref-env:ENV_VAR_NAME` para referencias de entorno, `secretref-managed` para referencias de archivo/exec).
- `apiKey`/`baseUrl` vacíos o ausentes del agente recurren a la configuración `models.providers`.
- Otros campos del proveedor se actualizan desde la configuración y los datos normalizados del catálogo.

La persistencia de marcadores es autoritativa según el origen: OpenClaw escribe marcadores desde la instantánea de configuración de origen activa (pre-resolución), no desde valores secretos resueltos en runtime.
Esto se aplica siempre que OpenClaw regenera `models.json`, incluidas rutas impulsadas por comandos como `openclaw agent`.

## Relacionado

- [Model Providers](/es/concepts/model-providers) — enrutamiento de proveedores y autenticación
- [Model Failover](/es/concepts/model-failover) — cadenas de alternativas
- [Image Generation](/es/tools/image-generation) — configuración del modelo de imagen
- [Music Generation](/tools/music-generation) — configuración del modelo de música
- [Video Generation](/tools/video-generation) — configuración del modelo de video
- [Configuration Reference](/es/gateway/configuration-reference#agent-defaults) — claves de configuración del modelo
