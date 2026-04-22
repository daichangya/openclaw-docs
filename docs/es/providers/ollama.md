---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas orientación para la instalación y configuración de Ollama
    - Quieres modelos de visión de Ollama para comprensión de imágenes
summary: Ejecutar OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos cloud alojados y servidores de Ollama locales/autoalojados. Puedes usar Ollama en tres modos: `Cloud + Local` a través de un host de Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host de Ollama accesible.

<Warning>
**Usuarios de Ollama remoto**: no uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe las llamadas a herramientas y los modelos pueden emitir JSON bruto de herramientas como texto plano. Usa en su lugar la URL de la API nativa de Ollama: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

## Primeros pasos

Elige tu método de configuración y modo preferidos.

<Tabs>
  <Tab title="Onboarding (recomendado)">
    **Ideal para:** el camino más rápido hacia una configuración funcional de Ollama cloud o local.

    <Steps>
      <Step title="Ejecutar onboarding">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** de la lista de proveedores.
      </Step>
      <Step title="Elegir tu modo">
        - **Cloud + Local** — host local de Ollama más modelos cloud enrutados a través de ese host
        - **Cloud only** — modelos alojados de Ollama mediante `https://ollama.com`
        - **Local only** — solo modelos locales
      </Step>
      <Step title="Seleccionar un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` piden una URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado si todavía no está disponible. `Cloud + Local` también comprueba si ese host de Ollama ha iniciado sesión para acceso cloud.
      </Step>
      <Step title="Verificar que el modelo esté disponible">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Modo no interactivo

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Opcionalmente especifica una URL base o modelo personalizado:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuración manual">
    **Ideal para:** control total sobre la configuración cloud o local.

    <Steps>
      <Step title="Elegir cloud o local">
        - **Cloud + Local**: instala Ollama, inicia sesión con `ollama signin` y enruta las solicitudes cloud a través de ese host
        - **Cloud only**: usa `https://ollama.com` con una `OLLAMA_API_KEY`
        - **Local only**: instala Ollama desde [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Descargar un modelo local (solo local)">
        ```bash
        ollama pull gemma4
        # o
        ollama pull gpt-oss:20b
        # o
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Activar Ollama para OpenClaw">
        Para `Cloud only`, usa tu `OLLAMA_API_KEY` real. Para configuraciones respaldadas por host, cualquier valor de marcador sirve:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Solo local
        export OLLAMA_API_KEY="ollama-local"

        # O configúralo en tu archivo de configuración
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspeccionar y configurar tu modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        O configura el valor predeterminado en la configuración:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelos cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa un host de Ollama accesible como punto de control tanto para modelos locales como cloud. Este es el flujo híbrido preferido por Ollama.

    Usa **Cloud + Local** durante la configuración. OpenClaw solicita la URL base de Ollama, detecta modelos locales desde ese host y comprueba si el host ha iniciado sesión para acceso cloud con `ollama signin`. Cuando el host ha iniciado sesión, OpenClaw también sugiere valores predeterminados alojados como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host todavía no ha iniciado sesión, OpenClaw mantiene la configuración en modo solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Cloud only** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, configura `baseUrl: "https://ollama.com"` y precarga la lista de modelos cloud alojados. Esta ruta **no** requiere un servidor local de Ollama ni `ollama signin`.

    La lista de modelos cloud mostrada durante `openclaw onboard` se llena en vivo desde `https://ollama.com/api/tags`, con un máximo de 500 entradas, para que el selector refleje el catálogo alojado actual en lugar de una lista estática. Si `ollama.com` no es accesible o no devuelve modelos durante la configuración, OpenClaw recurre a las sugerencias codificadas anteriores para que el onboarding siga completándose.

  </Tab>

  <Tab title="Local only">
    En modo solo local, OpenClaw detecta modelos desde la instancia de Ollama configurada. Esta ruta es para servidores de Ollama locales o autoalojados.

    Actualmente, OpenClaw sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Detección de modelos (proveedor implícito)

Cuando configuras `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama`, OpenClaw detecta modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Comportamiento       | Detalle                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta de catálogo | Consulta `/api/tags`                                                                                                                                                 |
| Detección de capacidades | Usa búsquedas best-effort de `/api/show` para leer `contextWindow` y detectar capacidades (incluida visión)                                                     |
| Modelos de visión    | Los modelos con capacidad `vision` informada por `/api/show` se marcan como compatibles con imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta imágenes automáticamente en el prompt |
| Detección de razonamiento | Marca `reasoning` con una heurística basada en el nombre del modelo (`r1`, `reasoning`, `think`)                                                               |
| Límites de tokens    | Configura `maxTokens` con el límite máximo predeterminado de tokens de Ollama usado por OpenClaw                                                                    |
| Costos               | Configura todos los costos en `0`                                                                                                                                    |

Esto evita entradas manuales de modelos al tiempo que mantiene el catálogo alineado con la instancia local de Ollama.

```bash
# Ver qué modelos están disponibles
ollama list
openclaw models list
```

Para añadir un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El nuevo modelo se detectará automáticamente y estará disponible para usar.

<Note>
Si configuras `models.providers.ollama` explícitamente, la detección automática se omite y debes definir los modelos manualmente. Consulta la sección de configuración explícita a continuación.
</Note>

## Visión y descripción de imágenes

El Plugin incluido de Ollama registra Ollama como proveedor de comprensión de medios compatible con imágenes. Esto permite que OpenClaw enrute solicitudes explícitas de descripción de imágenes y valores predeterminados configurados de modelos de imagen a través de modelos de visión de Ollama locales o alojados.

Para visión local, descarga un modelo que admita imágenes:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Luego verifica con el CLI de inferencia:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` debe ser una referencia completa `<provider/model>`. Cuando se configura, `openclaw infer image describe` ejecuta ese modelo directamente en lugar de omitir la descripción porque el modelo admite visión nativa.

Para hacer que Ollama sea el modelo predeterminado de comprensión de imágenes para medios entrantes, configura `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Si defines `models.providers.ollama.models` manualmente, marca los modelos de visión con compatibilidad de entrada de imagen:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rechaza solicitudes de descripción de imágenes para modelos que no estén marcados como compatibles con imágenes. Con detección implícita, OpenClaw lee esto de Ollama cuando `/api/show` informa una capacidad de visión.

## Configuración

<Tabs>
  <Tab title="Básica (detección implícita)">
    La ruta más sencilla para activar el modo solo local es mediante variable de entorno:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está configurada, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw la completará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa configuración explícita cuando quieras una configuración cloud alojada, Ollama se ejecute en otro host/puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones totalmente manuales de modelos.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL base personalizada">
    Si Ollama se está ejecutando en otro host o puerto (la configuración explícita desactiva la detección automática, así que define los modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    No añadas `/v1` a la URL. La ruta `/v1` usa el modo compatible con OpenAI, donde las llamadas a herramientas no son fiables. Usa la URL base de Ollama sin un sufijo de ruta.
    </Warning>

  </Tab>
</Tabs>

### Selección de modelo

Una vez configurado, todos tus modelos de Ollama estarán disponibles:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Búsqueda web de Ollama

OpenClaw admite **Ollama Web Search** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host de Ollama configurado (`models.providers.ollama.baseUrl` cuando está configurado; de lo contrario `http://127.0.0.1:11434`) |
| Autenticación | Sin clave                                                                                                         |
| Requisito   | Ollama debe estar en ejecución y haber iniciado sesión con `ollama signin`                                         |

Elige **Ollama Web Search** durante `openclaw onboard` o `openclaw configure --section web`, o configura:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Para ver la configuración completa y los detalles de comportamiento, consulta [Ollama Web Search](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **Las llamadas a herramientas no son fiables en el modo compatible con OpenAI.** Usa este modo solo si necesitas formato OpenAI para un proxy y no dependes del comportamiento nativo de llamadas a herramientas.
    </Warning>

    Si necesitas usar en su lugar el endpoint compatible con OpenAI (por ejemplo, detrás de un proxy que solo admite formato OpenAI), configura `api: "openai-completions"` explícitamente:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Es posible que este modo no admita streaming y llamadas a herramientas simultáneamente. Puede que necesites desactivar el streaming con `params: { streaming: false }` en la configuración del modelo.

    Cuando se usa `api: "openai-completions"` con Ollama, OpenClaw inyecta `options.num_ctx` de forma predeterminada para que Ollama no vuelva silenciosamente a una ventana de contexto de 4096. Si tu proxy/origen rechaza campos `options` desconocidos, desactiva este comportamiento:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Ventanas de contexto">
    Para los modelos detectados automáticamente, OpenClaw usa la ventana de contexto informada por Ollama cuando está disponible; de lo contrario, vuelve a la ventana de contexto predeterminada de Ollama usada por OpenClaw.

    Puedes sobrescribir `contextWindow` y `maxTokens` en la configuración explícita del proveedor:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modelos de razonamiento">
    OpenClaw trata los modelos con nombres como `deepseek-r1`, `reasoning` o `think` como compatibles con razonamiento de forma predeterminada.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional: OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama es gratuito y se ejecuta localmente, por lo que todos los costos de los modelos se establecen en $0. Esto se aplica tanto a los modelos detectados automáticamente como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de Memory">
    El Plugin incluido de Ollama registra un proveedor de embeddings de Memory para [búsqueda de Memory](/es/concepts/memory). Usa la URL base de Ollama y la clave API configuradas.

    | Propiedad      | Valor               |
    | ------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Descarga automática   | Sí — el modelo de embeddings se descarga automáticamente si no está presente localmente |

    Para seleccionar Ollama como proveedor de embeddings de búsqueda de Memory:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuración de streaming">
    La integración de Ollama de OpenClaw usa la **API nativa de Ollama** (`/api/chat`) de forma predeterminada, que admite completamente streaming y llamadas a herramientas al mismo tiempo. No se necesita ninguna configuración especial.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" de arriba. Es posible que el streaming y las llamadas a herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Ollama no detectado">
    Asegúrate de que Ollama esté en ejecución, de haber configurado `OLLAMA_API_KEY` (o un perfil de autenticación) y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece en la lista, descárgalo localmente o defínelo explícitamente en `models.providers.ollama`.

    ```bash
    ollama list  # Ver qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # O cualquier otro modelo
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    Verifica que Ollama esté ejecutándose en el puerto correcto:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [FAQ](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Ollama Web Search" href="/es/tools/ollama-search" icon="magnifying-glass">
    Configuración completa y detalles de comportamiento para la búsqueda web impulsada por Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
