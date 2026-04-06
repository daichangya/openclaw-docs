---
read_when:
    - Quieres entender qué herramientas proporciona OpenClaw
    - Necesitas configurar, permitir o denegar herramientas
    - Estás decidiendo entre herramientas integradas, Skills y plugins
summary: 'Resumen de herramientas y plugins de OpenClaw: qué puede hacer el agente y cómo ampliarlo'
title: Herramientas y plugins
x-i18n:
    generated_at: "2026-04-06T03:12:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2371239316997b0fe389bfa2ec38404e1d3e177755ad81ff8035ac583d9adeb
    source_path: tools/index.md
    workflow: 15
---

# Herramientas y plugins

Todo lo que hace el agente más allá de generar texto ocurre mediante **herramientas**.
Las herramientas son la forma en que el agente lee archivos, ejecuta comandos, navega por la web, envía
mensajes e interactúa con dispositivos.

## Herramientas, Skills y plugins

OpenClaw tiene tres capas que funcionan juntas:

<Steps>
  <Step title="Las herramientas son lo que invoca el agente">
    Una herramienta es una función tipada que el agente puede invocar (por ejemplo `exec`, `browser`,
    `web_search`, `message`). OpenClaw incluye un conjunto de **herramientas integradas** y
    los plugins pueden registrar otras adicionales.

    El agente ve las herramientas como definiciones estructuradas de funciones enviadas a la API del modelo.

  </Step>

  <Step title="Las Skills enseñan al agente cuándo y cómo">
    Una Skill es un archivo markdown (`SKILL.md`) inyectado en el prompt del sistema.
    Las Skills proporcionan al agente contexto, restricciones y orientación paso a paso para
    usar las herramientas con eficacia. Las Skills viven en tu workspace, en carpetas compartidas
    o se incluyen dentro de plugins.

    [Referencia de Skills](/es/tools/skills) | [Creación de Skills](/es/tools/creating-skills)

  </Step>

  <Step title="Los plugins lo empaquetan todo junto">
    Un plugin es un paquete que puede registrar cualquier combinación de capacidades:
    canales, proveedores de modelos, herramientas, Skills, voz, transcripción en tiempo real,
    voz en tiempo real, comprensión de medios, generación de imágenes, generación de video,
    obtención web, búsqueda web y más. Algunos plugins son **core** (incluidos con
    OpenClaw), otros son **externos** (publicados en npm por la comunidad).

    [Instalar y configurar plugins](/es/tools/plugin) | [Crea el tuyo](/es/plugins/building-plugins)

  </Step>
</Steps>

## Herramientas integradas

Estas herramientas vienen con OpenClaw y están disponibles sin instalar ningún plugin:

| Herramienta                                   | Qué hace                                                          | Página                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Ejecutar comandos de shell, gestionar procesos en segundo plano                       | [Exec](/es/tools/exec)                         |
| `code_execution`                           | Ejecutar análisis remoto en Python dentro de sandbox                                  | [Code Execution](/es/tools/code-execution)     |
| `browser`                                  | Controlar un navegador Chromium (navegar, hacer clic, captura de pantalla)              | [Browser](/es/tools/browser)                   |
| `web_search` / `x_search` / `web_fetch`    | Buscar en la web, buscar publicaciones de X, obtener contenido de páginas                    | [Web](/es/tools/web)                           |
| `read` / `write` / `edit`                  | E/S de archivos en el workspace                                             |                                             |
| `apply_patch`                              | Parches de archivos de múltiples bloques                                               | [Apply Patch](/es/tools/apply-patch)           |
| `message`                                  | Enviar mensajes a través de todos los canales                                     | [Agent Send](/es/tools/agent-send)             |
| `canvas`                                   | Controlar Canvas de nodo (presentar, evaluar, instantánea)                           |                                             |
| `nodes`                                    | Descubrir y seleccionar dispositivos emparejados                                    |                                             |
| `cron` / `gateway`                         | Gestionar trabajos programados; inspeccionar, aplicar parches, reiniciar o actualizar el gateway |                                             |
| `image` / `image_generate`                 | Analizar o generar imágenes                                            | [Image Generation](/es/tools/image-generation) |
| `music_generate`                           | Generar pistas musicales                                                 | [Music Generation](/tools/music-generation) |
| `video_generate`                           | Generar videos                                                       | [Video Generation](/tools/video-generation) |
| `tts`                                      | Conversión puntual de texto a voz                                    | [TTS](/es/tools/tts)                           |
| `sessions_*` / `subagents` / `agents_list` | Gestión de sesiones, estado y orquestación de subagentes               | [Sub-agents](/es/tools/subagents)              |
| `session_status`                           | Lectura ligera tipo `/status` y sobrescritura de modelo por sesión       | [Session Tools](/es/concepts/session-tool)     |

Para trabajo con imágenes, usa `image` para análisis e `image_generate` para generación o edición. Si apuntas a `openai/*`, `google/*`, `fal/*` u otro proveedor de imágenes no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo con música, usa `music_generate`. Si apuntas a `google/*`, `minimax/*` u otro proveedor de música no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para trabajo con video, usa `video_generate`. Si apuntas a `qwen/*` u otro proveedor de video no predeterminado, configura primero la autenticación/clave de API de ese proveedor.

Para generación de audio basada en flujos de trabajo, usa `music_generate` cuando un plugin como
ComfyUI lo registre. Esto es independiente de `tts`, que es texto a voz.

`session_status` es la herramienta ligera de estado/lectura del grupo de sesiones.
Responde preguntas al estilo de `/status` sobre la sesión actual y puede
opcionalmente establecer una sobrescritura de modelo por sesión; `model=default` elimina esa
sobrescritura. Al igual que `/status`, puede completar retroactivamente contadores escasos de tokens/caché y la
etiqueta del modelo de runtime activo a partir de la última entrada de uso en la transcripción.

`gateway` es la herramienta de runtime solo para propietarios para operaciones del gateway:

- `config.schema.lookup` para un subárbol de configuración acotado a una ruta antes de editar
- `config.get` para la instantánea de configuración actual + hash
- `config.patch` para actualizaciones parciales de configuración con reinicio
- `config.apply` solo para reemplazo completo de la configuración
- `update.run` para autoactualización explícita + reinicio

Para cambios parciales, prefiere `config.schema.lookup` y luego `config.patch`. Usa
`config.apply` solo cuando quieras reemplazar intencionalmente toda la configuración.
La herramienta también se niega a cambiar `tools.exec.ask` o `tools.exec.security`;
los alias heredados `tools.bash.*` se normalizan a las mismas rutas protegidas de exec.

### Herramientas proporcionadas por plugins

Los plugins pueden registrar herramientas adicionales. Algunos ejemplos:

- [Lobster](/es/tools/lobster) — runtime de flujo de trabajo tipado con aprobaciones reanudables
- [LLM Task](/es/tools/llm-task) — paso LLM solo JSON para salida estructurada
- [Music Generation](/tools/music-generation) — herramienta compartida `music_generate` con proveedores respaldados por flujos de trabajo
- [Diffs](/es/tools/diffs) — visor y renderizador de diferencias
- [OpenProse](/es/prose) — orquestación de flujos de trabajo con enfoque markdown

## Configuración de herramientas

### Listas de permitidas y denegadas

Controla qué herramientas puede invocar el agente mediante `tools.allow` / `tools.deny` en la
configuración. Denegar siempre prevalece sobre permitir.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Perfiles de herramientas

`tools.profile` establece una lista base de permitidas antes de aplicar `allow`/`deny`.
Sobrescritura por agente: `agents.list[].tools.profile`.

| Perfil     | Qué incluye                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Sin restricciones (igual que sin establecer)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Solo `session_status`                                                                                                                             |

### Grupos de herramientas

Usa los atajos `group:*` en listas de permitidas/denegadas:

| Grupo              | Herramientas                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` se acepta como alias de `exec`)                                 |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Todas las herramientas integradas de OpenClaw (excluye herramientas de plugins)                                                       |

`sessions_history` devuelve una vista de recuperación acotada y filtrada por seguridad. Elimina
etiquetas de thinking, andamiaje `<relevant-memories>`, payloads XML
de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
andamiaje degradado de llamadas a herramientas, tokens filtrados de control del modelo en ASCII/ancho completo
y XML malformado de llamadas a herramientas de MiniMax del texto del asistente, y luego aplica
redacción/truncamiento y posibles marcadores de posición de filas sobredimensionadas en lugar de actuar
como un volcado sin procesar de la transcripción.

### Restricciones específicas por proveedor

Usa `tools.byProvider` para restringir herramientas para proveedores específicos sin
cambiar los valores globales predeterminados:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
