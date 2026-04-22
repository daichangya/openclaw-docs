---
read_when:
    - Quieres usar Vercel AI Gateway con OpenClaw
    - Necesitas la variable de entorno de la clave API o la opción de autenticación de la CLI
summary: Configuración de Vercel AI Gateway (autenticación + selección de modelo)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) proporciona una API unificada para
acceder a cientos de modelos a través de un único endpoint.

| Propiedad    | Valor                            |
| ------------ | -------------------------------- |
| Proveedor    | `vercel-ai-gateway`              |
| Autenticación | `AI_GATEWAY_API_KEY`            |
| API          | Compatible con Anthropic Messages |
| Catálogo de modelos | Descubierto automáticamente mediante `/v1/models` |

<Tip>
OpenClaw descubre automáticamente el catálogo `/v1/models` del Gateway, por lo que
`/models vercel-ai-gateway` incluye referencias actuales de modelos como
`vercel-ai-gateway/openai/gpt-5.4` y
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Primeros pasos

<Steps>
  <Step title="Establecer la clave API">
    Ejecuta la incorporación y elige la opción de autenticación de AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Establecer un modelo predeterminado">
    Añade el modelo a tu configuración de OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verificar que el modelo está disponible">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones con scripts o en CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forma abreviada del ID de modelo

OpenClaw acepta referencias abreviadas de modelos Claude de Vercel y las normaliza en
runtime:

| Entrada abreviada                  | Referencia de modelo normalizada              |
| ---------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Puedes usar tanto la forma abreviada como la referencia completa del modelo en tu
configuración. OpenClaw resuelve automáticamente la forma canónica.
</Tip>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Variable de entorno para procesos daemon">
    Si el Gateway de OpenClaw se ejecuta como daemon (`launchd/systemd`), asegúrate de que
    `AI_GATEWAY_API_KEY` esté disponible para ese proceso.

    <Warning>
    Una clave establecida solo en `~/.profile` no será visible para un daemon de `launchd/systemd`
    a menos que ese entorno se importe explícitamente. Establece la clave en
    `~/.openclaw/.env` o mediante `env.shellEnv` para garantizar que el proceso del Gateway pueda
    leerla.
    </Warning>

  </Accordion>

  <Accordion title="Enrutamiento del proveedor">
    Vercel AI Gateway enruta las solicitudes al proveedor upstream según el prefijo
    de la referencia del modelo. Por ejemplo, `vercel-ai-gateway/anthropic/claude-opus-4.6` se enruta
    a través de Anthropic, mientras que `vercel-ai-gateway/openai/gpt-5.4` se enruta a través de
    OpenAI y `vercel-ai-gateway/moonshotai/kimi-k2.6` se enruta a través de
    MoonshotAI. Tu única `AI_GATEWAY_API_KEY` gestiona la autenticación para todos los
    proveedores upstream.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
