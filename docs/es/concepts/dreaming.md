---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`.
Ayuda a OpenClaw a mover señales fuertes de corto plazo hacia memoria duradera, al tiempo que mantiene el proceso explicable y revisable.

Dreaming es **optativo** y está deshabilitado de forma predeterminada.

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingesta, bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o `dreams.md` existente) y archivos opcionales de informe de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                 | Escritura duradera |
| ----- | ----------------------------------------- | ------------------ |
| Ligera | Clasificar y preparar material reciente de corto plazo | No                 |
| Profunda  | Puntuar y promover candidatos duraderos      | Sí (`MEMORY.md`)   |
| REM   | Reflexionar sobre temas e ideas recurrentes     | No                 |

Estas fases son detalles internos de implementación, no "modos"
configurables por separado para el usuario.

### Fase ligera

La fase ligera ingiere señales recientes de memoria diaria y trazas de recuperación, las deduplica
y prepara líneas candidatas.

- Lee del estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesión redactadas cuando están disponibles.
- Escribe un bloque gestionado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo para una clasificación profunda posterior.
- Nunca escribe en `MEMORY.md`.

### Fase profunda

La fase profunda decide qué pasa a formar parte de la memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de validación.
- Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, de modo que se omiten los fragmentos obsoletos/eliminados.
- Anexa las entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y, opcionalmente, escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
- Escribe un bloque gestionado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo REM usadas por la clasificación profunda.
- Nunca escribe en `MEMORY.md`.

## Ingesta de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesión redactadas en el corpus de Dreaming. Cuando
las transcripciones están disponibles, se incorporan a la fase ligera junto con las señales
de memoria diaria y las trazas de recuperación. El contenido personal y sensible se redacta
antes de la ingesta.

## Diario de sueños

Dreaming también mantiene un **Diario de sueños** narrativo en `DREAMS.md`.
Después de que cada fase tenga suficiente material, `memory-core` ejecuta, con el mejor esfuerzo,
un turno de subagente en segundo plano (usando el modelo de runtime predeterminado) y anexa una entrada breve del diario.

Este diario es para lectura humana en la interfaz de Dreams, no una fuente de promoción.
Los artefactos de diario/informe generados por Dreaming quedan excluidos de la
promoción de corto plazo. Solo los fragmentos de memoria fundamentados pueden promoverse a
`MEMORY.md`.

También hay una vía fundamentada de relleno histórico para trabajo de revisión y recuperación:

- `memory rem-harness --path ... --grounded` previsualiza la salida fundamentada del diario a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` escribe entradas reversibles fundamentadas del diario en `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencias de corto plazo que ya usa la fase profunda normal.
- `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos de relleno preparados sin tocar las entradas ordinarias del diario ni la recuperación activa normal de corto plazo.

La interfaz de control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar
los resultados en la escena de Dreams antes de decidir si los candidatos fundamentados
merecen promoción. La escena también muestra una vía fundamentada diferenciada para que puedas ver
qué entradas preparadas de corto plazo proceden de una reproducción histórica, qué elementos promovidos fueron impulsados por lo fundamentado, y limpiar solo las entradas preparadas solo fundamentadas sin
tocar el estado ordinario activo de corto plazo.

## Señales de clasificación profunda

La clasificación profunda usa seis señales base ponderadas más el refuerzo por fase:

| Señal              | Peso | Descripción                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frecuencia           | 0.24   | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia           | 0.30   | Calidad media de recuperación de la entrada           |
| Diversidad de consultas     | 0.15   | Contextos distintos de consulta/día en que apareció      |
| Recencia             | 0.15   | Puntuación de frescura con decaimiento temporal                      |
| Consolidación       | 0.10   | Fuerza de recurrencia en varios días                     |
| Riqueza conceptual | 0.06   | Densidad de etiquetas conceptuales del fragmento/ruta             |

Los aciertos de las fases ligera y REM añaden un pequeño refuerzo con decaimiento de recencia desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` gestiona automáticamente un trabajo de Cron para una barrida completa de Dreaming. Cada barrida ejecuta las fases en orden: ligera -> REM -> profunda.

Comportamiento de cadencia predeterminado:

| Ajuste              | Predeterminado |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Inicio rápido

Habilitar Dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Habilitar Dreaming con una cadencia de barrida personalizada:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flujo de trabajo de la CLI

Usa la promoción por CLI para previsualizar o aplicar manualmente:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa los umbrales de la fase profunda de forma predeterminada, salvo que se reemplacen
con opciones de la CLI.

Explica por qué un candidato específico se promovería o no:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Previsualiza reflexiones REM, verdades candidatas y la salida de promoción profunda sin
escribir nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valores predeterminados clave

Todas las opciones viven bajo `plugins.entries.memory-core.config.dreaming`.

| Clave         | Predeterminado |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La política de fases, los umbrales y el comportamiento del almacenamiento son detalles internos de implementación
(no son configuración orientada al usuario).

Consulta la [referencia de configuración de Memory](/es/reference/memory-config#dreaming)
para ver la lista completa de claves.

## Interfaz de Dreams

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de habilitación de Dreaming
- estado a nivel de fase y presencia de barrida gestionada
- recuentos de corto plazo, fundamentados, señales y promovidos hoy
- momento de la siguiente ejecución programada
- una vía de escena fundamentada diferenciada para entradas preparadas de reproducción histórica
- un lector expandible del Diario de sueños respaldado por `doctor.memory.dreamDiary`

## Solución de problemas

### Dreaming nunca se ejecuta (el estado muestra bloqueado)

El Cron gestionado de Dreaming depende del Heartbeat del agente predeterminado. Si el Heartbeat no se activa para ese agente, el Cron pone en cola un evento del sistema que nadie consume y Dreaming silenciosamente no se ejecuta. Tanto `openclaw memory status` como `/dreaming status` informarán `blocked` en ese caso e indicarán el agente cuyo Heartbeat es el bloqueo.

Dos causas comunes:

- Otro agente declara un bloque `heartbeat:` explícito. Cuando cualquier entrada de `agents.list` tiene su propio bloque `heartbeat`, solo esos agentes emiten Heartbeat; los valores predeterminados dejan de aplicarse al resto, por lo que el agente predeterminado puede quedar en silencio. Mueve la configuración de Heartbeat a `agents.defaults.heartbeat`, o añade un bloque `heartbeat` explícito al agente predeterminado. Consulta [Ámbito y precedencia](/es/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` es `0`, vacío o no se puede analizar. El Cron no tiene un intervalo con el que programarse, por lo que el Heartbeat queda efectivamente deshabilitado. Establece `every` en una duración positiva, como `30m`. Consulta [Valores predeterminados](/es/gateway/heartbeat#defaults).

## Relacionado

- [Heartbeat](/es/gateway/heartbeat)
- [Memory](/es/concepts/memory)
- [Memory Search](/es/concepts/memory-search)
- [CLI de memory](/cli/memory)
- [Referencia de configuración de Memory](/es/reference/memory-config)
