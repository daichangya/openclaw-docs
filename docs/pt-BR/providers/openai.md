---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer autenticação por assinatura Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agente GPT-5 mais rigoroso
summary: Use OpenAI com chaves de API ou assinatura Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T05:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775a937680731ff09181dd58d2be1ca1a751c9193ac299ba6657266490a6a9b7
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  A OpenAI oferece APIs para desenvolvedores para modelos GPT. O OpenClaw oferece suporte a duas rotas de autenticação:

  - **Chave de API** — acesso direto à OpenAI Platform com cobrança por uso (modelos `openai/*`)
  - **Assinatura Codex** — login do ChatGPT/Codex com acesso por assinatura (modelos `openai-codex/*`)

  A OpenAI oferece suporte explicitamente ao uso de OAuth por assinatura em ferramentas e fluxos externos como o OpenClaw.

  ## Cobertura de recursos do OpenClaw

  | Capacidade da OpenAI      | Superfície do OpenClaw                     | Status                                                 |
  | ------------------------- | ------------------------------------------ | ------------------------------------------------------ |
  | Chat / Responses          | provider de modelo `openai/<model>`        | Sim                                                    |
  | Modelos com assinatura Codex | provider de modelo `openai-codex/<model>` | Sim                                                    |
  | Pesquisa web no servidor  | Ferramenta nativa OpenAI Responses         | Sim, quando a pesquisa web está ativada e nenhum provider está fixado |
  | Imagens                   | `image_generate`                           | Sim                                                    |
  | Vídeos                    | `video_generate`                           | Sim                                                    |
  | Texto para fala           | `messages.tts.provider: "openai"` / `tts`  | Sim                                                    |
  | Fala para texto em lote   | `tools.media.audio` / compreensão de mídia | Sim                                                    |
  | Fala para texto por streaming | Voice Call `streaming.provider: "openai"` | Sim                                                 |
  | Voz em tempo real         | Voice Call `realtime.provider: "openai"`   | Sim                                                    |
  | Embeddings                | provider de embeddings de memória          | Sim                                                    |

  ## Primeiros passos

  Escolha seu método de autenticação preferido e siga as etapas de configuração.

  <Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Melhor para:** acesso direto à API e cobrança por uso.

    <Steps>
      <Step title="Obter sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Executar o onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou passe a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref de modelo | Rota | Autenticação |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API direta da OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API direta da OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    O login do ChatGPT/Codex é roteado por `openai-codex/*`, não por `openai/*`.
    </Note>

    ### Exemplo de config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da API. Requisições live à API da OpenAI rejeitam esse modelo. Spark é exclusivo do Codex.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Melhor para:** usar sua assinatura do ChatGPT/Codex em vez de uma chave de API separada. O Codex cloud exige login no ChatGPT.

    <Steps>
      <Step title="Executar OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="Definir o modelo padrão">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verificar se o modelo está disponível">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Resumo da rota

    | Ref de modelo | Rota | Autenticação |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth do ChatGPT/Codex | login do Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth do ChatGPT/Codex | login do Codex (dependente de entitlement) |

    <Note>
    Esta rota é intencionalmente separada de `openai/gpt-5.4`. Use `openai/*` com uma chave de API para acesso direto à Platform e `openai-codex/*` para acesso por assinatura Codex.
    </Note>

    ### Exemplo de config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Se o onboarding reutilizar um login existente do Codex CLI, essas credenciais continuarão sendo gerenciadas pelo Codex CLI. Ao expirar, o OpenClaw relê primeiro a fonte externa do Codex e grava a credencial atualizada de volta no armazenamento do Codex.
    </Tip>

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores separados.

    Para `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - limite padrão de `contextTokens` do runtime: `272000`

    O limite padrão menor tem melhores características de latência e qualidade na prática. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens` para limitar o orçamento de contexto do runtime.
    </Note>

  </Tab>
</Tabs>

## Geração de imagem

O plugin `openai` empacotado registra geração de imagem por meio da ferramenta `image_generate`.

| Capacidade                | Valor                              |
| ------------------------- | ---------------------------------- |
| Modelo padrão             | `openai/gpt-image-2`               |
| Máximo de imagens por solicitação | 4                           |
| Modo de edição            | Ativado (até 5 imagens de referência) |
| Sobrescritas de tamanho   | Compatível, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhadas para a OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de imagem](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

`gpt-image-2` é o padrão tanto para geração de imagem a partir de texto da OpenAI quanto para edição de imagem. `gpt-image-1` continua utilizável como uma sobrescrita explícita de modelo, mas novos fluxos de imagem da OpenAI devem usar `openai/gpt-image-2`.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Um pôster de lançamento refinado para o OpenClaw no macOS" size=3840x2160 count=1
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve o formato do objeto, mude o material para vidro translúcido" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeo

O plugin `openai` empacotado registra geração de vídeo por meio da ferramenta `video_generate`.

| Capacidade       | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Modelo padrão    | `openai/sora-2`                                                                   |
| Modos            | Texto para vídeo, imagem para vídeo, edição de vídeo único                        |
| Entradas de referência | 1 imagem ou 1 vídeo                                                         |
| Sobrescritas de tamanho | Compatível                                                                  |
| Outras sobrescritas  | `aspectRatio`, `resolution`, `audio`, `watermark` são ignorados com um aviso da ferramenta |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provider e comportamento de failover.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt do GPT-5 para execuções da família GPT-5 em todos os providers. Ela é aplicada por id de modelo, então `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` e outros refs compatíveis de GPT-5 recebem a mesma camada adicional. Modelos mais antigos GPT-4.x não recebem.

O provider empacotado do harness nativo Codex (`codex/*`) usa o mesmo comportamento de GPT-5 e a mesma camada adicional de Heartbeat por meio de instruções de desenvolvedor do servidor de aplicativo do Codex, para que sessões `codex/gpt-5.x` mantenham a mesma orientação de acompanhamento e Heartbeat proativo, mesmo que o Codex controle o restante do prompt do harness.

A contribuição do GPT-5 adiciona um contrato de comportamento com tags para persistência de persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de conclusão e verificação. O comportamento de resposta específico do canal e de mensagem silenciosa permanece no prompt de sistema compartilhado do OpenClaw e na política de entrega de saída. A orientação do GPT-5 está sempre ativada para modelos correspondentes. A camada de estilo de interação amigável é separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão)  | Ativa a camada de estilo de interação amigável |
| `"on"`                 | Alias para `"friendly"`                     |
| `"off"`                | Desativa apenas a camada de estilo amigável |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas em runtime, então `"Off"` e `"off"` desativam a camada de estilo amigável.
</Tip>

<Note>
`plugins.entries.openai.config.personality` legado ainda é lido como fallback de compatibilidade quando a configuração compartilhada `agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin `openai` empacotado registra síntese de fala para a superfície `messages.tts`.

    | Configuração | Caminho de config | Padrão |
    |---------|------------|---------|
    | Modelo | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voz | `messages.tts.providers.openai.voice` | `coral` |
    | Velocidade | `messages.tts.providers.openai.speed` | (não definido) |
    | Instruções | `messages.tts.providers.openai.instructions` | (não definido, somente `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` para notas de voz, `mp3` para arquivos |
    | Chave de API | `messages.tts.providers.openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para sobrescrever a base URL de TTS sem afetar o endpoint da API de chat.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O plugin `openai` empacotado registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Compatível com o OpenClaw em qualquer lugar onde a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canais

    Para forçar a OpenAI para transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Dicas de idioma e prompt são encaminhadas para a OpenAI quando fornecidas pela
    config compartilhada de mídia de áudio ou por solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O plugin `openai` empacotado registra transcrição em tempo real para o plugin Voice Call.

    | Configuração | Caminho de config | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma | `...openai.language` | (não definido) |
    | Prompt | `...openai.prompt` | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs` | `800` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` com áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Este provider de streaming é para o caminho de transcrição em tempo real do Voice Call; a voz do Discord atualmente grava segmentos curtos e usa o caminho em lote de transcrição `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin `openai` empacotado registra voz em tempo real para o plugin Voice Call.

    | Configuração | Caminho de config | Padrão |
    |---------|------------|---------|
    | Modelo | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voz | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Limiar de VAD | `...openai.vadThreshold` | `0.5` |
    | Duração do silêncio | `...openai.silenceDurationMs` | `500` |
    | Chave de API | `...openai.apiKey` | Usa fallback para `OPENAI_API_KEY` |

    <Note>
    Oferece suporte ao Azure OpenAI por meio das chaves de config `azureEndpoint` e `azureDeployment`. Oferece suporte a chamada de ferramentas bidirecional. Usa formato de áudio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Transporte (WebSocket vs SSE)">
    O OpenClaw usa WebSocket primeiro com fallback para SSE (`"auto"`) tanto para `openai/*` quanto para `openai-codex/*`.

    No modo `"auto"`, o OpenClaw:
    - tenta novamente uma falha inicial de WebSocket antes de usar fallback para SSE
    - após uma falha, marca o WebSocket como degradado por ~60 segundos e usa SSE durante o período de resfriamento
    - anexa cabeçalhos estáveis de identidade de sessão e turno para novas tentativas e reconexões
    - normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre variantes de transporte

    | Valor | Comportamento |
    |-------|----------|
    | `"auto"` (padrão) | WebSocket primeiro, fallback para SSE |
    | `"sse"` | Força somente SSE |
    | `"websocket"` | Força somente WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Aquecimento de WebSocket">
    O OpenClaw ativa o aquecimento de WebSocket por padrão para `openai/*` para reduzir a latência do primeiro turno.

    ```json5
    // Desativar o aquecimento
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw expõe uma alternância compartilhada de modo rápido para `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para processamento prioritário da OpenAI (`service_tier = "priority"`). Valores existentes de `service_tier` são preservados, e o modo rápido não reescreve `reasoning` nem `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Sobrescritas de sessão têm prioridade sobre a config. Limpar a sobrescrita da sessão na interface de Sessões retorna a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI expõe processamento prioritário por `service_tier`. Defina por modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` só é encaminhado para endpoints nativos da OpenAI (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`). Se você rotear qualquer um desses providers por um proxy, o OpenClaw deixa `service_tier` inalterado.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no servidor (Responses API)">
    Para modelos diretos OpenAI Responses (`openai/*` em `api.openai.com`), o OpenClaw ativa automaticamente Compaction no servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` padrão: 70% de `contextWindow` (ou `80000` quando indisponível)

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis como Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desativar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`. Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT agentic estrito">
    Para execuções da família GPT-5 em `openai/*` e `openai-codex/*`, o OpenClaw pode usar um contrato de execução incorporado mais estrito:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Com `strict-agentic`, o OpenClaw:
    - não trata mais um turno apenas de plano como progresso bem-sucedido quando uma ação de ferramenta está disponível
    - tenta novamente o turno com uma orientação para agir agora
    - ativa automaticamente `update_plan` para trabalho substancial
    - exibe um estado explícito de bloqueio se o modelo continuar planejando sem agir

    <Note>
    Restrito apenas a execuções da família GPT-5 da OpenAI e Codex. Outros providers e famílias de modelos mais antigas mantêm o comportamento padrão.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas vs compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, Codex e Azure OpenAI de forma diferente de proxies genéricos compatíveis com OpenAI em `/v1`:

    **Rotas nativas** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - mantêm `reasoning: { effort: "none" }` apenas para modelos que oferecem suporte ao esforço `none` da OpenAI
    - omitem raciocínio desativado para modelos ou proxies que rejeitam `reasoning.effort: "none"`
    - usam esquemas de ferramenta em modo estrito por padrão
    - anexam cabeçalhos ocultos de atribuição apenas em hosts nativos verificados
    - mantêm modelagem de requisição exclusiva da OpenAI (`service_tier`, `store`, compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas de proxy/compatíveis:**
    - usam comportamento de compatibilidade mais flexível
    - não forçam esquemas de ferramenta estritos nem cabeçalhos exclusivos de rotas nativas

    O Azure OpenAI usa transporte nativo e comportamento de compatibilidade nativo, mas não recebe os cabeçalhos ocultos de atribuição.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados de ferramenta de imagem e seleção de provider.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados de ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>
