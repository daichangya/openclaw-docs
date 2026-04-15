---
read_when:
    - Quieres entender cómo funciona la memoria
    - Quieres saber qué archivos de memoria escribir
summary: Cómo OpenClaw recuerda cosas entre sesiones
title: Resumen de la memoria
x-i18n:
    generated_at: "2026-04-15T14:40:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad1adafe1d81f1703d24f48a9c9da2b25a0ebbd4aad4f65d8bde5df78195d55b
    source_path: concepts/memory.md
    workflow: 15
---

# Resumen de la memoria

OpenClaw recuerda cosas escribiendo **archivos Markdown sin formato** en el
espacio de trabajo de tu agente. El modelo solo "recuerda" lo que se guarda en
el disco; no hay estado oculto.

## Cómo funciona

Tu agente tiene tres archivos relacionados con la memoria:

- **`MEMORY.md`** -- memoria a largo plazo. Hechos duraderos, preferencias y
  decisiones. Se carga al inicio de cada sesión de DM.
- **`memory/YYYY-MM-DD.md`** -- notas diarias. Contexto continuo y observaciones.
  Las notas de hoy y de ayer se cargan automáticamente.
- **`DREAMS.md`** (opcional) -- Diario de sueños y resúmenes de barridos de
  Dreaming para revisión humana, incluidas entradas históricas de relleno con base.

Estos archivos viven en el espacio de trabajo del agente (predeterminado `~/.openclaw/workspace`).

<Tip>
Si quieres que tu agente recuerde algo, solo pídeselo: "Recuerda que prefiero
TypeScript". Lo escribirá en el archivo adecuado.
</Tip>

## Herramientas de memoria

El agente tiene dos herramientas para trabajar con la memoria:

- **`memory_search`** -- encuentra notas relevantes mediante búsqueda semántica,
  incluso cuando la redacción difiere del original.
- **`memory_get`** -- lee un archivo de memoria específico o un rango de líneas.

Ambas herramientas las proporciona el Plugin de memoria activo (predeterminado: `memory-core`).

## Plugin complementario Memory Wiki

Si quieres que la memoria duradera se comporte más como una base de conocimiento
mantenida que como simples notas sin procesar, usa el Plugin integrado `memory-wiki`.

`memory-wiki` compila el conocimiento duradero en un depósito wiki con:

- estructura de páginas determinista
- afirmaciones y evidencia estructuradas
- seguimiento de contradicciones y vigencia
- paneles generados
- resúmenes compilados para consumidores del agente/runtime
- herramientas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` y `wiki_lint`

No reemplaza al Plugin de memoria activo. El Plugin de memoria activo sigue
siendo responsable de la recuperación, la promoción y Dreaming. `memory-wiki`
agrega una capa de conocimiento rica en procedencia junto a él.

Consulta [Memory Wiki](/es/plugins/memory-wiki).

## Búsqueda de memoria

Cuando se configura un proveedor de embeddings, `memory_search` usa **búsqueda
híbrida**: combina similitud vectorial (significado semántico) con coincidencia
de palabras clave (términos exactos como ID y símbolos de código). Esto funciona
de inmediato una vez que tienes una clave de API para cualquier proveedor compatible.

<Info>
OpenClaw detecta automáticamente tu proveedor de embeddings a partir de las
claves de API disponibles. Si tienes configurada una clave de OpenAI, Gemini,
Voyage o Mistral, la búsqueda de memoria se habilita automáticamente.
</Info>

Para obtener detalles sobre cómo funciona la búsqueda, opciones de ajuste y
configuración del proveedor, consulta
[Memory Search](/es/concepts/memory-search).

## Backends de memoria

<CardGroup cols={3}>
<Card title="Integrado (predeterminado)" icon="database" href="/es/concepts/memory-builtin">
Basado en SQLite. Funciona de inmediato con búsqueda por palabras clave,
similitud vectorial y búsqueda híbrida. Sin dependencias adicionales.
</Card>
<Card title="QMD" icon="search" href="/es/concepts/memory-qmd">
Sidecar local-first con reordenación, expansión de consultas y capacidad para indexar
directorios fuera del espacio de trabajo.
</Card>
<Card title="Honcho" icon="brain" href="/es/concepts/memory-honcho">
Memoria entre sesiones nativa de IA con modelado de usuario, búsqueda semántica
y conciencia multiagente. Instalación mediante Plugin.
</Card>
</CardGroup>

## Capa wiki de conocimiento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/es/plugins/memory-wiki">
Compila la memoria duradera en un depósito wiki rico en procedencia con
afirmaciones, paneles, modo puente y flujos de trabajo compatibles con Obsidian.
</Card>
</CardGroup>

## Vaciado automático de memoria

Antes de que [Compaction](/es/concepts/compaction) resuma tu conversación, OpenClaw
ejecuta un turno silencioso que le recuerda al agente guardar el contexto
importante en archivos de memoria. Esto está activado de forma predeterminada;
no necesitas configurar nada.

<Tip>
El vaciado de memoria evita la pérdida de contexto durante Compaction. Si tu
agente tiene hechos importantes en la conversación que todavía no se han escrito
en un archivo, se guardarán automáticamente antes de que ocurra el resumen.
</Tip>

## Dreaming

Dreaming es un proceso opcional de consolidación en segundo plano para la
memoria. Recopila señales a corto plazo, puntúa candidatos y promueve solo los
elementos aptos a la memoria a largo plazo (`MEMORY.md`).

Está diseñado para mantener alta la señal de la memoria a largo plazo:

- **Optativo**: desactivado de forma predeterminada.
- **Programado**: cuando está activado, `memory-core` gestiona automáticamente
  un trabajo de Cron recurrente para un barrido completo de Dreaming.
- **Con umbrales**: las promociones deben superar umbrales de puntuación,
  frecuencia de recuperación y diversidad de consultas.
- **Revisable**: los resúmenes de fase y las entradas del diario se escriben en
  `DREAMS.md` para revisión humana.

Para el comportamiento por fases, las señales de puntuación y los detalles del
Diario de sueños, consulta
[Dreaming](/es/concepts/dreaming).

## Relleno con base y promoción en vivo

El sistema de Dreaming ahora tiene dos vías de revisión estrechamente relacionadas:

- **Dreaming en vivo** trabaja desde el almacén de Dreaming a corto plazo en
  `memory/.dreams/` y es lo que usa la fase profunda normal al decidir qué
  puede graduarse a `MEMORY.md`.
- **Relleno con base** lee notas históricas `memory/YYYY-MM-DD.md` como
  archivos diarios independientes y escribe salida de revisión estructurada en `DREAMS.md`.

El relleno con base es útil cuando quieres reproducir notas antiguas e
inspeccionar qué considera el sistema duradero sin editar manualmente `MEMORY.md`.

Cuando usas:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

los candidatos duraderos con base no se promueven directamente. Se preparan en
el mismo almacén de Dreaming a corto plazo que ya usa la fase profunda normal.
Eso significa que:

- `DREAMS.md` sigue siendo la superficie de revisión humana.
- el almacén a corto plazo sigue siendo la superficie de clasificación orientada a la máquina.
- `MEMORY.md` sigue escribiéndose solo mediante promoción profunda.

Si decides que la reproducción no fue útil, puedes eliminar los artefactos
preparados sin tocar las entradas normales del diario ni el estado normal de recuperación:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Comprobar el estado del índice y el proveedor
openclaw memory search "query"  # Buscar desde la línea de comandos
openclaw memory index --force   # Reconstruir el índice
```

## Lecturas adicionales

- [Builtin Memory Engine](/es/concepts/memory-builtin) -- backend predeterminado de SQLite
- [QMD Memory Engine](/es/concepts/memory-qmd) -- sidecar avanzado local-first
- [Honcho Memory](/es/concepts/memory-honcho) -- memoria entre sesiones nativa de IA
- [Memory Wiki](/es/plugins/memory-wiki) -- depósito de conocimiento compilado y herramientas nativas de wiki
- [Memory Search](/es/concepts/memory-search) -- canalización de búsqueda, proveedores y
  ajuste
- [Dreaming](/es/concepts/dreaming) -- promoción en segundo plano
  desde la recuperación a corto plazo hasta la memoria a largo plazo
- [Memory configuration reference](/es/reference/memory-config) -- todos los ajustes de configuración
- [Compaction](/es/concepts/compaction) -- cómo interactúa Compaction con la memoria
