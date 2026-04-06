---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Descripción general de la memoria
x-i18n:
    generated_at: "2026-04-06T03:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d19d4fa9c4b3232b7a97f7a382311d2a375b562040de15e9fe4a0b1990b825e7
    source_path: concepts/memory.md
    workflow: 15
---

# Descripción general de la memoria

OpenClaw recuerda cosas escribiendo **archivos Markdown sin formato** en el
espacio de trabajo de tu agente. El modelo solo "recuerda" lo que se guarda en
el disco; no hay ningún estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** -- memoria a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de mensaje directo.
- **`memory/YYYY-MM-DD.md`** -- notas diarias. Contexto continuo y observaciones.
  Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (experimental, opcional) -- diario de sueños y resúmenes de
  barridos de sueños para revisión humana.

Estos archivos viven en el espacio de trabajo del agente (predeterminado:
`~/.openclaw/workspace`).

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: "Recuerda que prefiero
TypeScript." Lo escribirá en el archivo apropiado.
</Tip>

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`** -- encuentra notas relevantes usando búsqueda semántica,
  incluso cuando la redacción difiere del original.
- **`memory_get`** -- lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el plugin de memoria activo
(predeterminado: `memory-core`).

## Búsqueda en memoria

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda
híbrida**: combina similitud vectorial (significado semántico) con coincidencia
de palabras clave (términos exactos como IDs y símbolos de código). Esto
funciona de inmediato una vez que tienes una API key para cualquier proveedor
compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las API
keys disponibles. Si tienes configurada una clave de OpenAI, Gemini, Voyage o
Mistral, la búsqueda en memoria se habilita automáticamente.
</Info>

Para ver detalles sobre cómo funciona la búsqueda, las opciones de ajuste y la
configuración del proveedor, consulta
[Búsqueda en memoria](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave,
similitud vectorial y búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reranking, expansión de consultas y la capacidad de
indexar directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica
y conciencia multiagente. Instalación mediante plugin.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que la [compactación](/es/concepts/compaction) resuma tu conversación,
OpenClaw ejecuta un turno silencioso que le recuerda al agente guardar el
contexto importante en archivos de memoria. Esto está activado de forma
predeterminada; no necesitas configurar nada.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante la compactación. Si
tu agente tiene hechos importantes en la conversación que todavía no se han
escrito en un archivo, se guardarán automáticamente antes de que ocurra el
resumen.
</Tip>

## Soñar (experimental)

Soñar es un proceso opcional de consolidación de memoria en segundo plano.
Recopila señales a corto plazo, puntúa candidatos y promueve solo los elementos
que cumplen los requisitos a la memoria a largo plazo (`MEMORY.md`).

Está diseñado para mantener alta la señal de la memoria a largo plazo:

- **Participación voluntaria**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` administra
  automáticamente un trabajo cron recurrente para un barrido completo de sueños.
- **Con umbrales**: las promociones deben superar filtros de puntuación,
  frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas del diario se escriben en
  `DREAMS.md` para revisión humana.

Para consultar el comportamiento por fases, las señales de puntuación y los
detalles del diario de sueños, consulta
[Soñar (experimental)](/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Consultar el estado del índice y el proveedor
openclaw memory search "query"  # Buscar desde la línea de comandos
openclaw memory index --force   # Reconstruir el índice
```

## Lecturas adicionales

- [Builtin Memory Engine](/es/concepts/memory-builtin) -- backend SQLite predeterminado
- [QMD Memory Engine](/es/concepts/memory-qmd) -- sidecar local-first avanzado
- [Honcho Memory](/es/concepts/memory-honcho) -- memoria entre sesiones nativa de IA
- [Búsqueda en memoria](/es/concepts/memory-search) -- canalización de búsqueda, proveedores y
  ajuste
- [Soñar (experimental)](/concepts/dreaming) -- promoción en segundo plano
  del recuerdo a corto plazo a la memoria a largo plazo
- [Referencia de configuración de memoria](/es/reference/memory-config) -- todas las opciones de configuración
- [Compactación](/es/concepts/compaction) -- cómo interactúa la compactación con la memoria
