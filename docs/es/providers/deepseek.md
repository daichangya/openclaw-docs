---
read_when:
    - Quieres usar DeepSeek con OpenClaw
    - Necesitas la variable de entorno de la clave API o la opción de autenticación de la CLI
summary: Configuración de DeepSeek (autenticación + selección de modelo)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) ofrece potentes modelos de IA con una API compatible con OpenAI.

| Propiedad | Valor                      |
| --------- | -------------------------- |
| Proveedor | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | Compatible con OpenAI      |
| URL base  | `https://api.deepseek.com` |

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave API">
    Crea una clave API en [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Esto solicitará tu clave API y establecerá `deepseek/deepseek-v4-flash` como modelo predeterminado.

  </Step>
  <Step title="Verifica que los modelos estén disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Para inspeccionar el catálogo estático incluido sin requerir un Gateway en ejecución,
    usa:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuración no interactiva">
    Para instalaciones con scripts o sin interfaz, pasa todas las flags directamente:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si el Gateway se ejecuta como un daemon (launchd/systemd), asegúrate de que `DEEPSEEK_API_KEY`
esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante
`env.shellEnv`).
</Warning>

## Catálogo integrado

| Referencia del modelo        | Nombre            | Entrada | Contexto  | Salida máx. | Notas                                      |
| ---------------------------- | ----------------- | ------- | --------- | ------------ | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000      | Modelo predeterminado; superficie V4 con capacidad de thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000      | Superficie V4 con capacidad de thinking    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192        | Superficie sin thinking de DeepSeek V3.2   |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536       | Superficie V3.2 con razonamiento habilitado |

<Tip>
Los modelos V4 admiten el control `thinking` de DeepSeek. OpenClaw también vuelve a enviar
`reasoning_content` de DeepSeek en los turnos de seguimiento para que las sesiones de thinking con llamadas a herramientas
puedan continuar.
</Tip>

## Thinking y herramientas

Las sesiones de thinking de DeepSeek V4 tienen un contrato de reproducción más estricto que la mayoría de los
proveedores compatibles con OpenAI: cuando un mensaje del asistente con thinking habilitado incluye
llamadas a herramientas, DeepSeek espera que el `reasoning_content` previo del asistente se envíe
de vuelta en la solicitud de seguimiento. OpenClaw maneja esto dentro del Plugin de DeepSeek,
por lo que el uso normal de herramientas en varios turnos funciona con `deepseek/deepseek-v4-flash` y
`deepseek/deepseek-v4-pro`.

Si cambias una sesión existente desde otro proveedor compatible con OpenAI a un
modelo DeepSeek V4, es posible que los turnos anteriores de llamadas a herramientas del asistente no tengan
`reasoning_content` nativo de DeepSeek. OpenClaw completa ese campo faltante para las solicitudes de thinking de DeepSeek V4
para que el proveedor pueda aceptar el historial reproducido de llamadas a herramientas
sin requerir `/new`.

Cuando el thinking está deshabilitado en OpenClaw (incluida la selección **None** de la UI),
OpenClaw envía a DeepSeek `thinking: { type: "disabled" }` y elimina el
`reasoning_content` reproducido del historial saliente. Esto mantiene las sesiones con thinking deshabilitado
en la ruta de DeepSeek sin thinking.

Usa `deepseek/deepseek-v4-flash` para la ruta rápida predeterminada. Usa
`deepseek/deepseek-v4-pro` cuando quieras el modelo V4 más potente y puedas aceptar
un mayor costo o latencia.

## Pruebas en vivo

La suite directa de modelos en vivo incluye DeepSeek V4 en el conjunto de modelos moderno. Para
ejecutar solo las comprobaciones directas de modelos DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Esa comprobación en vivo verifica que ambos modelos V4 puedan completarse y que los turnos
de seguimiento de thinking/herramientas conserven la carga de reproducción que DeepSeek requiere.

## Ejemplo de configuración

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
