---
x-i18n:
    generated_at: "2026-04-06T03:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 15
---

# Recursos de i18n de la documentación de OpenClaw

Esta carpeta almacena la configuración de traducción para el repositorio fuente de la documentación.

Las páginas de configuración regional generadas y la memoria de traducción activa por configuración regional ahora se encuentran en el repositorio de publicación (`openclaw/docs`, checkout hermano local `~/Projects/openclaw-docs`).

## Archivos

- `glossary.<lang>.json` — asignaciones de términos preferidos (usadas en la guía del prompt).
- `<lang>.tm.jsonl` — memoria de traducción (caché) indexada por flujo de trabajo + modelo + hash de texto. En este repositorio, los archivos TM de configuración regional se generan bajo demanda.

## Formato del glosario

`glossary.<lang>.json` es una matriz de entradas:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Campos:

- `source`: frase en inglés (o idioma fuente) que se prefiere.
- `target`: salida de traducción preferida.

## Notas

- Las entradas del glosario se pasan al modelo como **guía del prompt** (sin reescrituras deterministas).
- `scripts/docs-i18n` sigue siendo responsable de la generación de traducciones.
- El repositorio fuente sincroniza la documentación en inglés con el repositorio de publicación; la generación por configuración regional se ejecuta allí para cada idioma al hacer push, según programación y mediante release dispatch.
