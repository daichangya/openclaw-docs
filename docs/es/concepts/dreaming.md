---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de Dreaming
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de la memoria en segundo plano con fases ligeras, profundas y REM, además de un Diario de Sueños
title: Dreaming
x-i18n:
    generated_at: "2026-04-15T14:40:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bcaec80f62e7611ed533094ef1917bd72c885f57252824db910e1f0496adc6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming es el sistema de consolidación de memoria en segundo plano de `memory-core`.
Ayuda a OpenClaw a mover señales sólidas de corto plazo a una memoria duradera, al tiempo
que mantiene el proceso explicable y revisable.

Dreaming es **opcional** y está deshabilitado de forma predeterminada.

## Qué escribe Dreaming

Dreaming mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingestión, bloqueos).
- **Salida legible por humanos** en `DREAMS.md` (o el archivo `dreams.md` existente) y archivos opcionales de informe por fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Dreaming usa tres fases cooperativas:

| Fase | Propósito                                  | Escritura duradera |
| ----- | ------------------------------------------ | ------------------ |
| Ligera | Ordenar y preparar material reciente de corto plazo | No                 |
| Profunda  | Puntuar y promover candidatos duraderos      | Sí (`MEMORY.md`) |
| REM   | Reflexionar sobre temas e ideas recurrentes     | No                 |

Estas fases son detalles internos de implementación, no "modos" separados
configurables por el usuario.

### Fase ligera

La fase ligera ingiere señales recientes de memoria diaria y trazas de recuperación, las deduplica
y prepara líneas candidatas.

- Lee del estado de recuperación de corto plazo, archivos recientes de memoria diaria y transcripciones de sesiones redactadas cuando están disponibles.
- Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo para la clasificación profunda posterior.
- Nunca escribe en `MEMORY.md`.

### Fase profunda

La fase profunda decide qué se convierte en memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de control.
- Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que los fragmentos obsoletos o eliminados se omiten.
- Agrega las entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
- Escribe un bloque administrado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo REM usadas por la clasificación profunda.
- Nunca escribe en `MEMORY.md`.

## Ingestión de transcripciones de sesión

Dreaming puede ingerir transcripciones de sesiones redactadas en el corpus de Dreaming. Cuando
las transcripciones están disponibles, se incorporan a la fase ligera junto con señales
de memoria diaria y trazas de recuperación. El contenido personal y sensible se redacta
antes de la ingestión.

## Diario de Sueños

Dreaming también mantiene un **Diario de Sueños** narrativo en `DREAMS.md`.
Después de que cada fase tiene suficiente material, `memory-core` ejecuta un turno en segundo plano
de un subagente con el mejor esfuerzo (usando el modelo de ejecución predeterminado) y agrega una entrada breve al diario.

Este diario es para lectura humana en la IU de Dreams, no una fuente de promoción.
Los artefactos de diario/informe generados por Dreaming se excluyen de la
promoción de corto plazo. Solo los fragmentos de memoria fundamentados pueden promoverse a
`MEMORY.md`.

También hay un flujo fundamentado de relleno histórico para trabajo de revisión y recuperación:

- `memory rem-harness --path ... --grounded` previsualiza la salida fundamentada del diario a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` escribe entradas fundamentadas y reversibles del diario en `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duraderos fundamentados en el mismo almacén de evidencias de corto plazo que ya usa la fase profunda normal.
- `memory rem-backfill --rollback` y `--rollback-short-term` eliminan esos artefactos preparados del relleno sin tocar las entradas normales del diario ni la recuperación activa ordinaria de corto plazo.

La IU de Control expone el mismo flujo de relleno/restablecimiento del diario para que puedas inspeccionar
los resultados en la escena Dreams antes de decidir si los candidatos fundamentados
merecen promoción. La escena también muestra un carril fundamentado distinto para que puedas ver
qué entradas preparadas de corto plazo provienen de la reproducción histórica, qué elementos promovidos
fueron guiados por lo fundamentado, y limpiar solo las entradas preparadas exclusivamente fundamentadas sin
tocar el estado ordinario activo de corto plazo.

## Señales de clasificación profunda

La clasificación profunda usa seis señales base ponderadas más refuerzo por fase:

| Señal              | Peso | Descripción                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Frecuencia           | 0.24   | Cuántas señales de corto plazo acumuló la entrada |
| Relevancia           | 0.30   | Calidad promedio de recuperación de la entrada           |
| Diversidad de consultas     | 0.15   | Contextos distintos de consulta/día en los que apareció      |
| Recencia             | 0.15   | Puntuación de frescura con decaimiento temporal                      |
| Consolidación       | 0.10   | Fuerza de recurrencia en varios días                     |
| Riqueza conceptual | 0.06   | Densidad de etiquetas conceptuales del fragmento/ruta             |

Los impactos de las fases ligera y REM agregan un pequeño refuerzo con decaimiento por recencia desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente un trabajo de Cron para un barrido completo de Dreaming. Cada barrido ejecuta las fases en orden: ligera -> REM -> profunda.

Comportamiento predeterminado de la cadencia:

| Configuración              | Predeterminado     |
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

Habilitar Dreaming con una cadencia de barrido personalizada:

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

La instrucción manual `memory promote` usa los umbrales de la fase profunda de forma predeterminada, a menos que se reemplacen
con indicadores de la CLI.

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

Todas las configuraciones viven en `plugins.entries.memory-core.config.dreaming`.

| Clave         | Predeterminado     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación
(no son configuración orientada al usuario).

Consulta la [referencia de configuración de Memory](/es/reference/memory-config#dreaming)
para ver la lista completa de claves.

## IU de Dreams

Cuando está habilitada, la pestaña **Dreams** de Gateway muestra:

- estado actual de habilitación de Dreaming
- estado por fase y presencia de barrido administrado
- recuentos de corto plazo, fundamentados, de señales y promovidos hoy
- horario de la próxima ejecución programada
- un carril de escena fundamentado distinto para entradas preparadas de reproducción histórica
- un lector expandible del Diario de Sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/es/concepts/memory)
- [Búsqueda en Memory](/es/concepts/memory-search)
- [CLI de memory](/cli/memory)
- [referencia de configuración de Memory](/es/reference/memory-config)
