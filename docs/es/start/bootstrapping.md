---
read_when:
    - Comprender qué ocurre en la primera ejecución del agente
    - Explicar dónde se encuentran los archivos de arranque
    - Depurar la configuración de identidad de incorporación
sidebarTitle: Bootstrapping
summary: Ritual de arranque del agente que inicializa el espacio de trabajo y los archivos de identidad
title: Arranque del agente
x-i18n:
    generated_at: "2026-04-25T13:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

El arranque es el ritual de la **primera ejecución** que prepara un espacio de trabajo del agente y
recopila detalles de identidad. Ocurre después de la incorporación, cuando el agente se inicia
por primera vez.

## Qué hace el arranque

En la primera ejecución del agente, OpenClaw inicializa el espacio de trabajo (por defecto
`~/.openclaw/workspace`):

- Inicializa `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Ejecuta un breve ritual de preguntas y respuestas (una pregunta a la vez).
- Escribe la identidad y las preferencias en `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Elimina `BOOTSTRAP.md` al finalizar para que solo se ejecute una vez.

## Omitir el arranque

Para omitir esto en un espacio de trabajo ya inicializado, ejecuta `openclaw onboard --skip-bootstrap`.

## Dónde se ejecuta

El arranque siempre se ejecuta en el **host del Gateway**. Si la aplicación de macOS se conecta a
un Gateway remoto, el espacio de trabajo y los archivos de arranque se encuentran en esa máquina
remota.

<Note>
Cuando el Gateway se ejecuta en otra máquina, edita los archivos del espacio de trabajo en el host del gateway
(por ejemplo, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentación relacionada

- Incorporación de la aplicación de macOS: [Incorporación](/es/start/onboarding)
- Estructura del espacio de trabajo: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
