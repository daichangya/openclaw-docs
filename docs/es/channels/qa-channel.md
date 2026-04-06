---
read_when:
    - Estás conectando el transporte sintético de QA a una ejecución de prueba local o de CI
    - Necesitas la superficie de configuración del `qa-channel` incluido
    - Estás iterando sobre la automatización de QA de extremo a extremo
summary: Plugin de canal sintético de clase Slack para escenarios de QA deterministas de OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-06T03:05:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b88cd73df2f61b34ad1eb83c3450f8fe15a51ac69fbb5a9eca0097564d67a06
    source_path: channels/qa-channel.md
    workflow: 15
---

# Canal de QA

`qa-channel` es un transporte de mensajes sintético incluido para la QA automatizada de OpenClaw.

No es un canal de producción. Existe para ejercitar el mismo límite de plugin de canal
utilizado por los transportes reales, mientras mantiene el estado determinista y
completamente inspeccionable.

## Qué hace hoy

- Gramática de destino de clase Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus sintético respaldado por HTTP para:
  - inyección de mensajes entrantes
  - captura de transcripciones salientes
  - creación de hilos
  - reacciones
  - ediciones
  - eliminaciones
  - acciones de búsqueda y lectura
- Ejecutor de autoverificación incluido del lado del host que escribe un informe en Markdown

## Configuración

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Claves de cuenta compatibles:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Ejecutor

Corte vertical actual:

```bash
pnpm qa:e2e
```

Ahora esto se enruta a través de la extensión `qa-lab` incluida. Inicia el
bus de QA dentro del repositorio, arranca el segmento de ejecución incluido de `qa-channel`, ejecuta una
autoverificación determinista y escribe un informe en Markdown en `.artifacts/qa-e2e/`.

UI privada de depuración:

```bash
pnpm qa:lab:build
pnpm openclaw qa ui
```

Suite completa de QA respaldada por el repositorio:

```bash
pnpm openclaw qa suite
```

Eso inicia el depurador privado de QA en una URL local, separado del
bundle publicado de la UI de Control.

## Alcance

El alcance actual es intencionalmente limitado:

- bus + transporte de plugin
- gramática de enrutamiento con hilos
- acciones de mensajes propias del canal
- informes en Markdown

El trabajo de seguimiento añadirá:

- orquestación de OpenClaw en Docker
- ejecución de matriz de proveedor/modelo
- detección de escenarios más rica
- orquestación nativa de OpenClaw más adelante
