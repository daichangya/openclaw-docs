---
read_when:
    - Quieres usar Fireworks con OpenClaw
    - Necesitas la variable de entorno de la clave API de Fireworks o el id del modelo predeterminado
summary: Configuración de Fireworks (auth + selección de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expone modelos open-weight y enrutados mediante una API compatible con OpenAI. OpenClaw incluye un Plugin de proveedor Fireworks integrado.

| Propiedad     | Valor                                                  |
| ------------- | ------------------------------------------------------ |
| Proveedor     | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatible con OpenAI                 |
| URL base      | `https://api.fireworks.ai/inference/v1`                |
| Modelo predeterminado | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Primeros pasos

<Steps>
  <Step title="Configurar la auth de Fireworks mediante el asistente de incorporación">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Esto almacena tu clave de Fireworks en la configuración de OpenClaw y establece el modelo inicial Fire Pass como predeterminado.

  </Step>
  <Step title="Verificar que el modelo esté disponible">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Ejemplo no interactivo

Para configuraciones con scripts o CI, pasa todos los valores en la línea de comandos:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Referencia de modelo                                   | Nombre                      | Entrada    | Contexto | Salida máxima | Notas                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144  | 262,144        | El modelo Kimi más reciente en Fireworks. Thinking está desactivado para solicitudes Fireworks K2.6; enruta directamente a través de Moonshot si necesitas la salida de thinking de Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000        | Modelo inicial integrado predeterminado en Fireworks                                                                                                  |

<Tip>
Si Fireworks publica un modelo más nuevo, como una nueva versión de Qwen o Gemma, puedes cambiar directamente a él usando su id de modelo de Fireworks sin esperar una actualización del catálogo integrado.
</Tip>

## Id de modelo personalizados de Fireworks

OpenClaw también acepta id de modelo dinámicos de Fireworks. Usa el id exacto del modelo o enrutador que muestra Fireworks y antepón `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Cómo funciona el prefijo del id de modelo">
    Cada referencia de modelo de Fireworks en OpenClaw empieza con `fireworks/` seguido del id exacto o la ruta del enrutador de la plataforma Fireworks. Por ejemplo:

    - Modelo de enrutador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo directo: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw elimina el prefijo `fireworks/` al construir la solicitud de la API y envía la ruta restante al endpoint de Fireworks.

  </Accordion>

  <Accordion title="Nota sobre el entorno">
    Si el Gateway se ejecuta fuera de tu shell interactivo, asegúrate de que `FIREWORKS_API_KEY` también esté disponible para ese proceso.

    <Warning>
    Una clave que esté solo en `~/.profile` no ayudará a un daemon launchd/systemd a menos que ese entorno también se importe allí. Configura la clave en `~/.openclaw/.env` o mediante `env.shellEnv` para asegurarte de que el proceso del gateway pueda leerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
