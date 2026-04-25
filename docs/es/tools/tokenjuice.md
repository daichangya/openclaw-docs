---
read_when:
    - Quieres resultados más cortos de las herramientas `exec` o `bash` en OpenClaw
    - Quieres habilitar el plugin Tokenjuice incluido
    - Necesitas entender qué cambia Tokenjuice y qué deja sin procesar
summary: Compactar resultados ruidosos de las herramientas exec y bash con un Plugin incluido opcionalmente
title: Tokenjuice
x-i18n:
    generated_at: "2026-04-25T13:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04328cc7a13ccd64f8309ddff867ae893387f93c26641dfa1a4013a4c3063962
    source_path: tools/tokenjuice.md
    workflow: 15
---

`tokenjuice` es un plugin incluido opcional que compacta los resultados ruidosos de las herramientas `exec` y `bash`
después de que el comando ya se haya ejecutado.

Cambia el `tool_result` devuelto, no el comando en sí. Tokenjuice no
reescribe la entrada del shell, no vuelve a ejecutar comandos ni cambia los códigos de salida.

Hoy esto se aplica a ejecuciones incrustadas de Pi y a herramientas dinámicas de OpenClaw en el arnés app-server de Codex.
Tokenjuice se engancha al middleware de resultados de herramientas de OpenClaw y
recorta la salida antes de que vuelva a la sesión activa del arnés.

## Habilitar el plugin

Ruta rápida:

```bash
openclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalente:

```bash
openclaw plugins enable tokenjuice
```

OpenClaw ya incluye el plugin. No hay un paso separado de `plugins install`
ni `tokenjuice install openclaw`.

Si prefieres editar la configuración directamente:

```json5
{
  plugins: {
    entries: {
      tokenjuice: {
        enabled: true,
      },
    },
  },
}
```

## Qué cambia tokenjuice

- Compacta los resultados ruidosos de `exec` y `bash` antes de que se devuelvan a la sesión.
- Mantiene intacta la ejecución original del comando.
- Conserva las lecturas exactas de contenido de archivos y otros comandos que tokenjuice debe dejar sin procesar.
- Sigue siendo opcional: desactiva el plugin si quieres salida literal en todas partes.

## Verificar que funciona

1. Habilita el plugin.
2. Inicia una sesión que pueda llamar a `exec`.
3. Ejecuta un comando ruidoso como `git status`.
4. Comprueba que el resultado devuelto por la herramienta sea más corto y más estructurado que la salida sin procesar del shell.

## Deshabilitar el plugin

```bash
openclaw config set plugins.entries.tokenjuice.enabled false
```

O bien:

```bash
openclaw plugins disable tokenjuice
```

## Relacionado

- [Exec tool](/es/tools/exec)
- [Thinking levels](/es/tools/thinking)
- [Context engine](/es/concepts/context-engine)
