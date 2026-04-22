---
read_when:
    - Quieres el catálogo Go de OpenCode
    - Necesitas las referencias de modelo de tiempo de ejecución para los modelos alojados en Go
summary: Usa el catálogo Go de OpenCode con la configuración compartida de OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:26:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go es el catálogo Go dentro de [OpenCode](/es/providers/opencode).
Usa la misma `OPENCODE_API_KEY` que el catálogo Zen, pero mantiene el id del proveedor de tiempo de ejecución
`opencode-go` para que el enrutamiento ascendente por modelo siga siendo correcto.

| Propiedad        | Valor                           |
| ---------------- | ------------------------------- |
| Proveedor de tiempo de ejecución | `opencode-go`                   |
| Autenticación    | `OPENCODE_API_KEY`              |
| Configuración principal | [OpenCode](/es/providers/opencode) |

## Modelos compatibles

OpenClaw obtiene el catálogo Go del registro de modelos Pi incluido. Ejecuta
`openclaw models list --provider opencode-go` para ver la lista actual de modelos.

Según el catálogo Pi incluido, el proveedor incluye:

| Referencia de modelo      | Nombre                |
| ------------------------- | --------------------- |
| `opencode-go/glm-5`       | GLM-5                 |
| `opencode-go/glm-5.1`     | GLM-5.1               |
| `opencode-go/kimi-k2.5`   | Kimi K2.5             |
| `opencode-go/kimi-k2.6`   | Kimi K2.6 (límites 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni         |
| `opencode-go/mimo-v2-pro` | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5         |
| `opencode-go/minimax-m2.7` | MiniMax M2.7         |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus         |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus         |

## Primeros pasos

<Tabs>
  <Tab title="Interactivo">
    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Configura un modelo Go como predeterminado">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="No interactivo">
    <Steps>
      <Step title="Pasa la clave directamente">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verifica que los modelos estén disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Ejemplo de configuración

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Comportamiento de enrutamiento">
    OpenClaw gestiona automáticamente el enrutamiento por modelo cuando la referencia de modelo usa
    `opencode-go/...`. No se requiere ninguna configuración adicional del proveedor.
  </Accordion>

  <Accordion title="Convención de referencias de tiempo de ejecución">
    Las referencias de tiempo de ejecución siguen siendo explícitas: `opencode/...` para Zen, `opencode-go/...` para Go.
    Esto mantiene correcto el enrutamiento ascendente por modelo en ambos catálogos.
  </Accordion>

  <Accordion title="Credenciales compartidas">
    La misma `OPENCODE_API_KEY` es usada por los catálogos Zen y Go. Introducir
    la clave durante la configuración almacena credenciales para ambos proveedores de tiempo de ejecución.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/es/providers/opencode) para ver el resumen compartido de incorporación y la referencia completa
de los catálogos Zen + Go.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="OpenCode (principal)" href="/es/providers/opencode" icon="server">
    Incorporación compartida, resumen del catálogo y notas avanzadas.
  </Card>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de failover.
  </Card>
</CardGroup>
