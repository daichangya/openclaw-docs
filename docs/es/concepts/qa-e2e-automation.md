---
read_when:
    - Ampliar qa-lab o qa-channel
    - Agregar escenarios de QA respaldados por el repositorio
    - Crear automatización de QA más realista alrededor del panel del Gateway
summary: Estructura privada de automatización de QA para qa-lab, qa-channel, escenarios sembrados e informes de protocolo
title: Automatización E2E de QA
x-i18n:
    generated_at: "2026-04-06T03:06:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: df35f353d5ab0e0432e6a828c82772f9a88edb41c20ec5037315b7ba310b28e6
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatización E2E de QA

La pila privada de QA está pensada para probar OpenClaw de una manera más
realista y con forma de canal que una sola prueba unitaria.

Componentes actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de MD, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los
  escenarios base de QA.

El objetivo a largo plazo es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, mostrando la transcripción tipo Slack y el plan de escenarios.

Eso permite que un operador o un bucle de automatización le dé al agente una
misión de QA, observe el comportamiento real del canal y registre qué funcionó,
qué falló o qué siguió bloqueado.

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para las
personas como para el agente. La lista base debe seguir siendo lo bastante amplia como para cubrir:

- chat por MD y por canal
- comportamiento de hilos
- ciclo de vida de acciones sobre mensajes
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación como Lobster Invaders

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea de tiempo observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

## Documentación relacionada

- [Pruebas](/es/help/testing)
- [Canal de QA](/channels/qa-channel)
- [Panel](/web/dashboard)
