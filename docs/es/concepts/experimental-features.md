---
read_when:
    - Ves una clave de configuración `.experimental` y quieres saber si es estable
    - Quieres probar funciones de runtime en vista previa sin confundirlas con los valores predeterminados normales
    - Quieres un lugar donde encontrar las flags experimentales documentadas actualmente
summary: Qué significan las flags experimentales en OpenClaw y cuáles están documentadas actualmente
title: Funciones experimentales
x-i18n:
    generated_at: "2026-04-15T14:40:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d1c7b3d4cd56ef8a0bdab1deb9918e9b2c9a33f956d63193246087f8633dcf3
    source_path: concepts/experimental-features.md
    workflow: 15
---

# Funciones experimentales

Las funciones experimentales en OpenClaw son **superficies de vista previa de activación opcional**. Están
detrás de flags explícitas porque todavía necesitan uso en condiciones reales antes de
merecer un valor predeterminado estable o un contrato público duradero.

Trátalas de forma distinta a la configuración normal:

- Mantenlas **desactivadas de forma predeterminada** a menos que la documentación relacionada te indique probar una.
- Espera que **la forma y el comportamiento cambien** más rápido que en la configuración estable.
- Prefiere primero la ruta estable cuando ya exista una.
- Si vas a implementar OpenClaw de forma amplia, prueba las flags experimentales en un entorno
  más pequeño antes de incorporarlas a una línea base compartida.

## Flags documentadas actualmente

| Superficie               | Clave                                                     | Úsala cuando                                                                                                   | Más información                                                                               |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime de modelo local  | `agents.defaults.experimental.localModelLean`             | Un backend local más pequeño o más estricto se atraganta con toda la superficie de herramientas predeterminada de OpenClaw | [Modelos locales](/es/gateway/local-models)                                                      |
| Búsqueda de memoria      | `agents.defaults.memorySearch.experimental.sessionMemory` | Quieres que `memory_search` indexe transcripciones de sesiones anteriores y aceptas el costo adicional de almacenamiento/indexación | [Referencia de configuración de memoria](/es/reference/memory-config#session-memory-search-experimental) |
| Herramienta de planificación estructurada | `tools.experimental.planTool`                             | Quieres que la herramienta estructurada `update_plan` esté expuesta para el seguimiento de trabajo de varios pasos en runtimes y UIs compatibles | [Referencia de configuración de Gateway](/es/gateway/configuration-reference#toolsexperimental)         |

## Modo ligero de modelo local

`agents.defaults.experimental.localModelLean: true` es una válvula de escape
para configuraciones más débiles de modelos locales. Reduce herramientas predeterminadas pesadas como
`browser`, `cron` y `message` para que la forma del prompt sea más pequeña y menos frágil
para backends compatibles con OpenAI de contexto pequeño o más estrictos.

Intencionalmente **esa no** es la ruta normal. Si tu backend maneja el runtime completo
sin problemas, déjalo desactivado.

## Experimental no significa oculto

Si una función es experimental, OpenClaw debería decirlo claramente en la documentación y en la
propia ruta de configuración. Lo que **no** debería hacer es introducir comportamiento de vista previa en una
opción predeterminada con apariencia estable y fingir que eso es normal. Así es como las
superficies de configuración se vuelven desordenadas.
