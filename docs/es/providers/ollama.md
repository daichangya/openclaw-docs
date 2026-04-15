---
read_when:
    - Quieres ejecutar OpenClaw con modelos en la nube o locales mediante Ollama
    - Necesitas instrucciones para la configuración e instalación de Ollama
summary: Ejecuta OpenClaw con Ollama (modelos en la nube y locales)
title: Ollama
x-i18n:
    generated_at: "2026-04-15T14:40:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 098e083e0fc484bddb5270eb630c55d7832039b462d1710372b6afece5cefcdf
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw se integra con la API nativa de Ollama (`/api/chat`) para modelos en la nube alojados y servidores de Ollama locales o autoalojados. Puedes usar Ollama en tres modos: `Cloud + Local` a través de un host de Ollama accesible, `Cloud only` contra `https://ollama.com`, o `Local only` contra un host de Ollama accesible.

<Warning>
**Usuarios de Ollama remoto**: No uses la URL compatible con OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Esto rompe la llamada de herramientas y los modelos pueden generar JSON de herramientas sin procesar como texto plano. Usa la URL de la API nativa de Ollama en su lugar: `baseUrl: "http://host:11434"` (sin `/v1`).
</Warning>

## Primeros pasos

Elige tu método y modo de configuración preferidos.

<Tabs>
  <Tab title="Incorporación (recomendado)">
    **Ideal para:** la forma más rápida de tener una configuración funcional de Ollama en la nube o local.

    <Steps>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        ```

        Selecciona **Ollama** de la lista de proveedores.
      </Step>
      <Step title="Elige tu modo">
        - **Cloud + Local** — host local de Ollama más modelos en la nube enrutados a través de ese host
        - **Cloud only** — modelos alojados de Ollama mediante `https://ollama.com`
        - **Local only** — solo modelos locales
      </Step>
      <Step title="Selecciona un modelo">
        `Cloud only` solicita `OLLAMA_API_KEY` y sugiere valores predeterminados alojados en la nube. `Cloud + Local` y `Local only` solicitan una URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado si todavía no está disponible. `Cloud + Local` también comprueba si ese host de Ollama inició sesión para acceso en la nube.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
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

    De manera opcional, especifica una URL base o un modelo personalizados:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuración manual">
    **Ideal para:** control total sobre la configuración en la nube o local.

    <Steps>
      <Step title="Elige nube o local">
        - **Cloud + Local**: instala Ollama, inicia sesión con `ollama signin` y enruta las solicitudes en la nube a través de ese host
        - **Cloud only**: usa `https://ollama.com` con una `OLLAMA_API_KEY`
        - **Local only**: instala Ollama desde [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Descarga un modelo local (solo local)">
        ```bash
        ollama pull gemma4
        # o
        ollama pull gpt-oss:20b
        # o
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Habilita Ollama para OpenClaw">
        Para `Cloud only`, usa tu `OLLAMA_API_KEY` real. Para configuraciones basadas en host, cualquier valor de marcador de posición funciona:

        ```bash
        # Nube
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Solo local
        export OLLAMA_API_KEY="ollama-local"

        # O configúralo en tu archivo de configuración
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecciona y establece tu modelo">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        O establece el valor predeterminado en la configuración:

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

## Modelos en la nube

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa un host de Ollama accesible como punto de control tanto para modelos locales como para modelos en la nube. Este es el flujo híbrido preferido por Ollama.

    Usa **Cloud + Local** durante la configuración. OpenClaw solicita la URL base de Ollama, detecta los modelos locales de ese host y comprueba si el host inició sesión para acceso en la nube con `ollama signin`. Cuando el host ha iniciado sesión, OpenClaw también sugiere valores predeterminados alojados en la nube como `kimi-k2.5:cloud`, `minimax-m2.7:cloud` y `glm-5.1:cloud`.

    Si el host todavía no ha iniciado sesión, OpenClaw mantiene la configuración como solo local hasta que ejecutes `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` se ejecuta contra la API alojada de Ollama en `https://ollama.com`.

    Usa **Cloud only** durante la configuración. OpenClaw solicita `OLLAMA_API_KEY`, establece `baseUrl: "https://ollama.com"` y inicializa la lista de modelos alojados en la nube. Esta ruta **no** requiere un servidor local de Ollama ni `ollama signin`.

  </Tab>

  <Tab title="Local only">
    En modo solo local, OpenClaw detecta modelos desde la instancia configurada de Ollama. Esta ruta es para servidores de Ollama locales o autoalojados.

    OpenClaw actualmente sugiere `gemma4` como valor predeterminado local.

  </Tab>
</Tabs>

## Detección de modelos (proveedor implícito)

Cuando estableces `OLLAMA_API_KEY` (o un perfil de autenticación) y **no** defines `models.providers.ollama`, OpenClaw detecta modelos desde la instancia local de Ollama en `http://127.0.0.1:11434`.

| Comportamiento         | Detalle                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta del catálogo  | Consulta `/api/tags`                                                                                                                                                 |
| Detección de capacidades | Usa búsquedas de `/api/show` con el mejor esfuerzo para leer `contextWindow` y detectar capacidades (incluida visión)                                           |
| Modelos de visión      | Los modelos con una capacidad `vision` informada por `/api/show` se marcan como aptos para imágenes (`input: ["text", "image"]`), por lo que OpenClaw inyecta imágenes automáticamente en el prompt |
| Detección de razonamiento | Marca `reasoning` con una heurística de nombre de modelo (`r1`, `reasoning`, `think`)                                                                           |
| Límites de tokens      | Establece `maxTokens` en el límite máximo de tokens predeterminado de Ollama usado por OpenClaw                                                                   |
| Costos                 | Establece todos los costos en `0`                                                                                                                                   |

Esto evita entradas manuales de modelos mientras mantiene el catálogo alineado con la instancia local de Ollama.

```bash
# Ve qué modelos están disponibles
ollama list
openclaw models list
```

Para agregar un modelo nuevo, simplemente descárgalo con Ollama:

```bash
ollama pull mistral
```

El modelo nuevo se detectará automáticamente y estará disponible para usar.

<Note>
Si estableces `models.providers.ollama` explícitamente, se omite la detección automática y debes definir los modelos manualmente. Consulta la sección de configuración explícita más abajo.
</Note>

## Configuración

<Tabs>
  <Tab title="Básica (detección implícita)">
    La ruta más sencilla para habilitar solo local mediante variable de entorno es:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` está definida, puedes omitir `apiKey` en la entrada del proveedor y OpenClaw la completará para las comprobaciones de disponibilidad.
    </Tip>

  </Tab>

  <Tab title="Explícita (modelos manuales)">
    Usa la configuración explícita cuando quieras una configuración alojada en la nube, Ollama se ejecute en otro host o puerto, quieras forzar ventanas de contexto o listas de modelos específicas, o quieras definiciones de modelos completamente manuales.

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
    Si Ollama se ejecuta en un host o puerto distintos (la configuración explícita desactiva la detección automática, así que define los modelos manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sin /v1 - usa la URL de la API nativa de Ollama
            api: "ollama", // Establécelo explícitamente para garantizar el comportamiento nativo de llamada de herramientas
          },
        },
      },
    }
    ```

    <Warning>
    No agregues `/v1` a la URL. La ruta `/v1` usa el modo compatible con OpenAI, donde la llamada de herramientas no es fiable. Usa la URL base de Ollama sin un sufijo de ruta.
    </Warning>

  </Tab>
</Tabs>

### Selección de modelo

Una vez configurados, todos tus modelos de Ollama están disponibles:

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

## Ollama Web Search

OpenClaw admite **Ollama Web Search** como proveedor `web_search` incluido.

| Propiedad   | Detalle                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa tu host de Ollama configurado (`models.providers.ollama.baseUrl` cuando está definido, de lo contrario `http://127.0.0.1:11434`) |
| Autenticación | No requiere clave                                                                                                  |
| Requisito   | Ollama debe estar ejecutándose y haber iniciado sesión con `ollama signin`                                           |

Elige **Ollama Web Search** durante `openclaw onboard` o `openclaw configure --section web`, o establece:

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
Para ver los detalles completos de configuración y comportamiento, consulta [Ollama Web Search](/es/tools/ollama-search).
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo heredado compatible con OpenAI">
    <Warning>
    **La llamada de herramientas no es fiable en el modo compatible con OpenAI.** Usa este modo solo si necesitas el formato de OpenAI para un proxy y no dependes del comportamiento nativo de llamada de herramientas.
    </Warning>

    Si necesitas usar en su lugar el endpoint compatible con OpenAI (por ejemplo, detrás de un proxy que solo admite el formato de OpenAI), establece `api: "openai-completions"` explícitamente:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // predeterminado: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Es posible que este modo no admita streaming y llamada de herramientas al mismo tiempo. Es posible que tengas que desactivar el streaming con `params: { streaming: false }` en la configuración del modelo.

    Cuando `api: "openai-completions"` se usa con Ollama, OpenClaw inyecta `options.num_ctx` de forma predeterminada para que Ollama no vuelva silenciosamente a una ventana de contexto de 4096. Si tu proxy/upstream rechaza campos `options` desconocidos, desactiva este comportamiento:

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
    OpenClaw trata por defecto como capaces de razonar a los modelos con nombres como `deepseek-r1`, `reasoning` o `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    No se necesita configuración adicional: OpenClaw los marca automáticamente.

  </Accordion>

  <Accordion title="Costos de modelos">
    Ollama es gratuito y se ejecuta localmente, por lo que todos los costos de los modelos se establecen en $0. Esto se aplica tanto a los modelos detectados automáticamente como a los definidos manualmente.
  </Accordion>

  <Accordion title="Embeddings de memoria">
    El Plugin Ollama incluido registra un proveedor de embeddings de memoria para
    [búsqueda de memoria](/es/concepts/memory). Usa la URL base configurada de Ollama
    y la clave de API.

    | Propiedad     | Valor               |
    | ------------- | ------------------- |
    | Modelo predeterminado | `nomic-embed-text`  |
    | Descarga automática    | Sí — el modelo de embeddings se descarga automáticamente si no está presente localmente |

    Para seleccionar Ollama como proveedor de embeddings para búsqueda de memoria:

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
    La integración de Ollama de OpenClaw usa por defecto la **API nativa de Ollama** (`/api/chat`), que admite por completo el streaming y la llamada de herramientas simultáneamente. No se necesita ninguna configuración especial.

    <Tip>
    Si necesitas usar el endpoint compatible con OpenAI, consulta la sección "Modo heredado compatible con OpenAI" anterior. Es posible que el streaming y la llamada de herramientas no funcionen simultáneamente en ese modo.
    </Tip>

  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Ollama no detectado">
    Asegúrate de que Ollama se esté ejecutando, de haber establecido `OLLAMA_API_KEY` (o un perfil de autenticación), y de que **no** hayas definido una entrada explícita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica que la API sea accesible:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No hay modelos disponibles">
    Si tu modelo no aparece en la lista, descarga el modelo localmente o defínelo explícitamente en `models.providers.ollama`.

    ```bash
    ollama list  # Ver qué está instalado
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # O otro modelo
    ```

  </Accordion>

  <Accordion title="Conexión rechazada">
    Comprueba que Ollama se esté ejecutando en el puerto correcto:

    ```bash
    # Comprobar si Ollama se está ejecutando
    ps aux | grep ollama

    # O reiniciar Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
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
    Configuración completa y detalles de comportamiento para la búsqueda web con Ollama.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
