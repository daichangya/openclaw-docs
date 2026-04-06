---
read_when:
    - Quieres configurar QMD como tu backend de memoria
    - Quieres funciones de memoria avanzadas como reranking o rutas indexadas adicionales
summary: Sidecar de búsqueda local-first con BM25, vectores, reranking y expansión de consultas
title: Motor de memoria QMD
x-i18n:
    generated_at: "2026-04-06T03:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36642c7df94b88f562745dd2270334379f2aeeef4b363a8c13ef6be42dadbe5c
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Motor de memoria QMD

[QMD](https://github.com/tobi/qmd) es un sidecar de búsqueda local-first que se ejecuta
junto a OpenClaw. Combina BM25, búsqueda vectorial y reranking en un solo
binario, y puede indexar contenido más allá de los archivos de memoria de tu espacio de trabajo.

## Qué añade frente al integrado

- **Reranking y expansión de consultas** para una mejor recuperación.
- **Indexa directorios adicionales** -- documentación del proyecto, notas del equipo, cualquier cosa en disco.
- **Indexa transcripciones de sesiones** -- recupera conversaciones anteriores.
- **Totalmente local** -- se ejecuta con Bun + node-llama-cpp, descarga automáticamente modelos GGUF.
- **Respaldo automático** -- si QMD no está disponible, OpenClaw vuelve al
  motor integrado sin interrupciones.

## Primeros pasos

### Requisitos previos

- Instala QMD: `npm install -g @tobilu/qmd` o `bun install -g @tobilu/qmd`
- Compilación de SQLite que permita extensiones (`brew install sqlite` en macOS).
- QMD debe estar en el `PATH` del gateway.
- macOS y Linux funcionan de forma inmediata. Windows tiene mejor soporte mediante WSL2.

### Habilitar

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw crea un directorio de inicio de QMD autocontenido en
`~/.openclaw/agents/<agentId>/qmd/` y gestiona el ciclo de vida del sidecar
automáticamente -- las colecciones, actualizaciones y ejecuciones de embeddings se gestionan por ti.
Prefiere las formas actuales de colecciones de QMD y consultas MCP, pero aún recurre a las
marcas heredadas de colección `--mask` y a nombres de herramientas MCP más antiguos cuando es necesario.

## Cómo funciona el sidecar

- OpenClaw crea colecciones a partir de los archivos de memoria de tu espacio de trabajo y de cualquier
  `memory.qmd.paths` configurado, luego ejecuta `qmd update` + `qmd embed` al iniciar
  y periódicamente (cada 5 minutos por defecto).
- La actualización al arranque se ejecuta en segundo plano para no bloquear el inicio del chat.
- Las búsquedas usan el `searchMode` configurado (predeterminado: `search`; también admite
  `vsearch` y `query`). Si un modo falla, OpenClaw reintenta con `qmd query`.
- Si QMD falla por completo, OpenClaw vuelve al motor integrado de SQLite.

<Info>
La primera búsqueda puede ser lenta -- QMD descarga automáticamente modelos GGUF (~2 GB) para
reranking y expansión de consultas en la primera ejecución de `qmd query`.
</Info>

## Reemplazos de modelo

Las variables de entorno de modelos de QMD se transfieren sin cambios desde el proceso
del gateway, para que puedas ajustar QMD globalmente sin añadir nueva configuración de OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Después de cambiar el modelo de embeddings, vuelve a ejecutar los embeddings para que el índice coincida con el
nuevo espacio vectorial.

## Indexar rutas adicionales

Haz que QMD apunte a directorios adicionales para que se puedan buscar:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Los fragmentos de rutas adicionales aparecen como `qmd/<collection>/<relative-path>` en
los resultados de búsqueda. `memory_get` entiende este prefijo y lee desde la raíz correcta
de la colección.

## Indexar transcripciones de sesiones

Habilita la indexación de sesiones para recuperar conversaciones anteriores:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Las transcripciones se exportan como turnos saneados de Usuario/Asistente a una colección de QMD dedicada
en `~/.openclaw/agents/<id>/qmd/sessions/`.

## Alcance de búsqueda

De forma predeterminada, los resultados de búsqueda de QMD solo se muestran en sesiones de DM (no en grupos ni
canales). Configura `memory.qmd.scope` para cambiar esto:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Cuando el alcance deniega una búsqueda, OpenClaw registra una advertencia con el canal derivado y
el tipo de chat para que los resultados vacíos sean más fáciles de depurar.

## Citas

Cuando `memory.citations` es `auto` o `on`, los fragmentos de búsqueda incluyen un
pie `Source: <path#line>`. Establece `memory.citations = "off"` para omitir el pie
mientras la ruta sigue pasándose internamente al agente.

## Cuándo usarlo

Elige QMD cuando necesites:

- Reranking para obtener resultados de mayor calidad.
- Buscar documentación del proyecto o notas fuera del espacio de trabajo.
- Recuperar conversaciones de sesiones pasadas.
- Búsqueda totalmente local sin claves de API.

Para configuraciones más simples, el [motor integrado](/es/concepts/memory-builtin) funciona bien
sin dependencias adicionales.

## Solución de problemas

**¿QMD no se encuentra?** Asegúrate de que el binario esté en el `PATH` del gateway. Si OpenClaw
se ejecuta como servicio, crea un enlace simbólico:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**¿La primera búsqueda es muy lenta?** QMD descarga modelos GGUF en el primer uso. Precaliéntalo
con `qmd query "test"` usando los mismos directorios XDG que usa OpenClaw.

**¿La búsqueda agota el tiempo de espera?** Aumenta `memory.qmd.limits.timeoutMs` (predeterminado: 4000ms).
Establécelo en `120000` para hardware más lento.

**¿Resultados vacíos en chats grupales?** Comprueba `memory.qmd.scope` -- el valor predeterminado solo
permite sesiones de DM.

**¿Repositorios temporales visibles para el espacio de trabajo que provocan `ENAMETOOLONG` o indexación rota?**
Actualmente, el recorrido de QMD sigue el comportamiento subyacente del escáner de QMD en lugar de
las reglas integradas de enlaces simbólicos de OpenClaw. Mantén los checkouts temporales de monorepos en
directorios ocultos como `.tmp/` o fuera de las raíces QMD indexadas hasta que QMD exponga
un recorrido seguro ante ciclos o controles de exclusión explícitos.

## Configuración

Para ver toda la superficie de configuración (`memory.qmd.*`), los modos de búsqueda, los intervalos de actualización,
las reglas de alcance y todos los demás ajustes, consulta la
[referencia de configuración de memoria](/es/reference/memory-config).
