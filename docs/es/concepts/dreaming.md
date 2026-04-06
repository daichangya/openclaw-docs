---
read_when:
    - Quieres que la promoción de memoria se ejecute automáticamente
    - Quieres entender qué hace cada fase de sueño
    - Quieres ajustar la consolidación sin contaminar `MEMORY.md`
summary: Consolidación de memoria en segundo plano con fases ligera, profunda y REM, además de un Diario de Sueños
title: Sueños (experimental)
x-i18n:
    generated_at: "2026-04-06T03:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f27da718176bebf59fe8a80fddd4fb5b6d814ac5647f6c1e8344bcfb328db9de
    source_path: concepts/dreaming.md
    workflow: 15
---

# Sueños (experimental)

Sueños es el sistema de consolidación de memoria en segundo plano de `memory-core`.
Ayuda a OpenClaw a mover señales sólidas de corto plazo hacia memoria duradera mientras
mantiene el proceso explicable y revisable.

Sueños es **optativo** y está deshabilitado de forma predeterminada.

## Qué escribe Sueños

Sueños mantiene dos tipos de salida:

- **Estado de máquina** en `memory/.dreams/` (almacén de recuperación, señales de fase, puntos de control de ingestión, bloqueos).
- **Salida legible para humanos** en `DREAMS.md` (o `dreams.md` existente) y archivos opcionales de informes de fase en `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promoción a largo plazo sigue escribiendo solo en `MEMORY.md`.

## Modelo de fases

Sueños usa tres fases cooperativas:

| Fase | Propósito                                  | Escritura duradera |
| ----- | ------------------------------------------ | ------------------ |
| Ligera | Ordenar y preparar material reciente de corto plazo | No                 |
| Profunda  | Puntuar y promover candidatos duraderos      | Sí (`MEMORY.md`) |
| REM   | Reflexionar sobre temas e ideas recurrentes     | No                 |

Estas fases son detalles internos de implementación, no "modos"
separados configurados por el usuario.

### Fase ligera

La fase ligera ingiere señales recientes de memoria diaria y trazas de recuperación, las desduplica
y prepara líneas candidatas.

- Lee del estado de recuperación a corto plazo y de archivos recientes de memoria diaria.
- Escribe un bloque administrado `## Light Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo para una clasificación profunda posterior.
- Nunca escribe en `MEMORY.md`.

### Fase profunda

La fase profunda decide qué se convierte en memoria a largo plazo.

- Clasifica candidatos usando puntuación ponderada y umbrales de control.
- Requiere que `minScore`, `minRecallCount` y `minUniqueQueries` se cumplan.
- Rehidrata fragmentos desde archivos diarios activos antes de escribir, por lo que se omiten fragmentos obsoletos o eliminados.
- Agrega entradas promovidas a `MEMORY.md`.
- Escribe un resumen `## Deep Sleep` en `DREAMS.md` y opcionalmente escribe `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM extrae patrones y señales reflexivas.

- Construye resúmenes de temas y reflexiones a partir de trazas recientes de corto plazo.
- Escribe un bloque administrado `## REM Sleep` cuando el almacenamiento incluye salida en línea.
- Registra señales de refuerzo REM usadas por la clasificación profunda.
- Nunca escribe en `MEMORY.md`.

## Diario de Sueños

Sueños también mantiene un **Diario de Sueños** narrativo en `DREAMS.md`.
Después de que cada fase tiene suficiente material, `memory-core` ejecuta en segundo plano, con el mejor esfuerzo,
un turno de subagente (usando el modelo de runtime predeterminado) y agrega una breve entrada de diario.

Este diario es para lectura humana en la interfaz de Sueños, no una fuente de promoción.

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

Los aciertos de las fases ligera y REM agregan un pequeño impulso con decaimiento temporal desde
`memory/.dreams/phase-signals.json`.

## Programación

Cuando está habilitado, `memory-core` administra automáticamente una tarea cron para un barrido
completo de sueños. Cada barrido ejecuta las fases en orden: ligera -> REM -> profunda.

Comportamiento predeterminado de la cadencia:

| Configuración              | Predeterminado     |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Inicio rápido

Habilitar Sueños:

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

Habilitar Sueños con una cadencia de barrido personalizada:

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

Usa la promoción de la CLI para vista previa o aplicación manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

`memory promote` manual usa los umbrales de la fase profunda de forma predeterminada, a menos que se reemplacen
con indicadores de la CLI.

## Valores predeterminados clave

Toda la configuración se encuentra en `plugins.entries.memory-core.config.dreaming`.

| Clave         | Predeterminado     |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La política de fases, los umbrales y el comportamiento de almacenamiento son detalles internos de implementación
(no son configuración visible para el usuario).

Consulta la [referencia de configuración de Memory](/es/reference/memory-config#dreaming-experimental)
para ver la lista completa de claves.

## Interfaz de Sueños

Cuando está habilitada, la pestaña **Dreams** del Gateway muestra:

- estado actual de habilitación de Sueños
- estado por fase y presencia del barrido administrado
- recuentos de corto plazo, largo plazo y promociones de hoy
- hora de la siguiente ejecución programada
- un lector expandible del Diario de Sueños respaldado por `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/es/concepts/memory)
- [Memory Search](/es/concepts/memory-search)
- [memory CLI](/cli/memory)
- [referencia de configuración de Memory](/es/reference/memory-config)
