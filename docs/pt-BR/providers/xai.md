---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação xAI ou IDs de modelo
summary: Use modelos Grok da xAI no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T05:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

O OpenClaw inclui um Plugin de provider `xai` empacotado para modelos Grok.

## Primeiros passos

<Steps>
  <Step title="Crie uma chave de API">
    Crie uma chave de API no [console da xAI](https://console.x.ai/).
  </Step>
  <Step title="Defina sua chave de API">
    Defina `XAI_API_KEY` ou execute:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Escolha um modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
O OpenClaw usa a API Responses da xAI como transporte xAI empacotado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com Grok, `x_search` de primeira classe
e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provider de modelo xAI empacotado também reutiliza essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo de modelos empacotado

O OpenClaw inclui estas famílias de modelos xAI prontas para uso:

| Família        | IDs de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

O Plugin também resolve por encaminhamento IDs mais novos `grok-4*` e `grok-code-fast*` quando
eles seguem o mesmo formato de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
referências atuais do Grok com capacidade de imagem no catálogo empacotado.
</Tip>

## Cobertura de recursos do OpenClaw

O Plugin empacotado mapeia a superfície atual da API pública da xAI para os contratos compartilhados
de provider e tool do OpenClaw quando o comportamento se encaixa de forma limpa.

| Capacidade da xAI          | Superfície do OpenClaw                    | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | model provider `xai/<model>`              | Sim                                                                 |
| Pesquisa na web no servidor     | provider `grok` de `web_search`           | Sim                                                                 |
| Pesquisa no X no servidor       | tool `x_search`                           | Sim                                                                 |
| Execução de código no servidor | tool `code_execution`                     | Sim                                                                 |
| Imagens                     | `image_generate`                          | Sim                                                                 |
| Vídeos                     | `video_generate`                          | Sim                                                                 |
| Texto para fala em lote       | `messages.tts.provider: "xai"` / `tts`    | Sim                                                                 |
| TTS por streaming              | —                                         | Não exposto; o contrato de TTS do OpenClaw retorna buffers completos de áudio |
| Fala para texto em lote       | `tools.media.audio` / compreensão de mídia | Sim                                                                 |
| Fala para texto por streaming   | Voice Call `streaming.provider: "xai"`    | Sim                                                                 |
| Voz em tempo real             | —                                         | Ainda não exposto; contrato diferente de sessão/WebSocket               |
| Arquivos / lotes            | Apenas compatibilidade genérica com API de modelo      | Não é uma tool de primeira classe do OpenClaw                                     |

<Note>
O OpenClaw usa as APIs REST de imagem/vídeo/TTS/STT da xAI para geração de mídia,
fala e transcrição em lote, o WebSocket de STT por streaming da xAI para
transcrição ao vivo de chamada de voz e a API Responses para modelo, pesquisa e
tools de execução de código. Recursos que exigem contratos diferentes do OpenClaw, como
sessões de voz em tempo real, são documentados aqui como capacidades upstream em vez de
comportamento oculto do Plugin.
</Note>

### Mapeamentos de modo rápido

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescreve requisições nativas da xAI da seguinte forma:

| Modelo de origem | Destino do modo rápido |
| ---------------- | ---------------------- |
| `grok-3`         | `grok-3-fast`         |
| `grok-3-mini`    | `grok-3-mini-fast`    |
| `grok-4`         | `grok-4-fast`         |
| `grok-4-0709`    | `grok-4-fast`         |

### Aliases legados de compatibilidade

Aliases legados ainda são normalizados para os IDs canônicos empacotados:

| Alias legado              | ID canônico                            |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Recursos

<AccordionGroup>
  <Accordion title="Pesquisa na web">
    O provider empacotado de pesquisa na web `grok` também usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeo">
    O Plugin empacotado `xai` registra geração de vídeo por meio da tool compartilhada
    `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo, edição remota de vídeo e extensão remota
      de vídeo
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resoluções: `480P`, `720P`
    - Duração: 1 a 15 segundos para geração/imagem para vídeo, 2 a 10 segundos para
      extensão

    <Warning>
    Buffers locais de vídeo não são aceitos. Use URLs remotas `http(s)` para
    entradas de edição/extensão de vídeo. Imagem para vídeo aceita buffers locais de imagem porque
    o OpenClaw pode codificá-los como URLs de dados para a xAI.
    </Warning>

    Para usar xAI como provider padrão de vídeo:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Veja [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da tool,
    seleção de provider e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de imagem">
    O Plugin empacotado `xai` registra geração de imagem por meio da tool compartilhada
    `image_generate`.

    - Modelo de imagem padrão: `xai/grok-imagine-image`
    - Modelo adicional: `xai/grok-imagine-image-pro`
    - Modos: texto para imagem e edição com imagem de referência
    - Entradas de referência: uma `image` ou até cinco `images`
    - Proporções: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resoluções: `1K`, `2K`
    - Quantidade: até 4 imagens

    O OpenClaw solicita à xAI respostas de imagem `b64_json` para que a mídia gerada possa ser
    armazenada e entregue pelo caminho normal de anexos do canal. Imagens locais de
    referência são convertidas em URLs de dados; referências remotas `http(s)` são
    repassadas.

    Para usar xAI como provider padrão de imagem:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    A xAI também documenta `quality`, `mask`, `user` e proporções nativas adicionais
    como `1:2`, `2:1`, `9:20` e `20:9`. Hoje o OpenClaw encaminha apenas os
    controles de imagem compartilhados entre providers; controles não compatíveis e exclusivos do provider
    intencionalmente não são expostos por `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Texto para fala">
    O Plugin empacotado `xai` registra texto para fala por meio da superfície compartilhada do
    provider `tts`.

    - Vozes: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voz padrão: `eve`
    - Formatos: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Idioma: código BCP-47 ou `auto`
    - Velocidade: sobrescrita de velocidade nativa do provider
    - O formato nativo de nota de voz Opus não é compatível

    Para usar xAI como provider padrão de TTS:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    O OpenClaw usa o endpoint em lote `/v1/tts` da xAI. A xAI também oferece TTS por streaming
    via WebSocket, mas o contrato atual de provider de fala do OpenClaw espera
    um buffer de áudio completo antes da entrega da resposta.
    </Note>

  </Accordion>

  <Accordion title="Fala para texto">
    O Plugin empacotado `xai` registra fala para texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `grok-stt`
    - Endpoint: REST `/v1/stt` da xAI
    - Caminho de entrada: upload multipart de arquivo de áudio
    - Compatível com o OpenClaw em qualquer lugar em que a transcrição de áudio de entrada use
      `tools.media.audio`, incluindo segmentos de canal de voz do Discord e
      anexos de áudio de canal

    Para forçar xAI na transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    O idioma pode ser fornecido por meio da configuração compartilhada de mídia de áudio ou por requisição
    individual de transcrição. Dicas de prompt são aceitas pela superfície compartilhada do OpenClaw,
    mas a integração REST de STT da xAI encaminha apenas arquivo, modelo e
    idioma porque esses campos se mapeiam de forma limpa ao endpoint público atual da xAI.

  </Accordion>

  <Accordion title="Fala para texto por streaming">
    O Plugin empacotado `xai` também registra um provider de transcrição em tempo real
    para áudio de chamada de voz ao vivo.

    - Endpoint: WebSocket da xAI `wss://api.x.ai/v1/stt`
    - Codificação padrão: `mulaw`
    - Taxa de amostragem padrão: `8000`
    - Endpointing padrão: `800ms`
    - Transcrições intermediárias: habilitadas por padrão

    O stream de mídia do Twilio da Voice Call envia quadros de áudio G.711 µ-law, então o
    provider xAI pode encaminhar esses quadros diretamente sem transcodificação:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    A configuração pertencente ao provider fica em
    `plugins.entries.voice-call.config.streaming.providers.xai`. As
    chaves compatíveis são `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` ou
    `alaw`), `interimResults`, `endpointingMs` e `language`.

    <Note>
    Esse provider de streaming é para o caminho de transcrição em tempo real da Voice Call.
    A voz do Discord atualmente grava segmentos curtos e usa o caminho em lote de transcrição
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O Plugin empacotado xAI expõe `x_search` como uma tool do OpenClaw para pesquisar
    conteúdo do X (antigo Twitter) por meio do Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Chave              | Tipo    | Padrão             | Descrição                            |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Habilita ou desabilita `x_search`    |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para requisições de `x_search` |
    | `inlineCitations`  | boolean | —                  | Inclui citações inline nos resultados |
    | `maxTurns`         | number  | —                  | Máximo de turnos de conversa         |
    | `timeoutSeconds`   | number  | —                  | Timeout da requisição em segundos    |
    | `cacheTtlMinutes`  | number  | —                  | Tempo de vida do cache em minutos    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de execução de código">
    O Plugin empacotado xAI expõe `code_execution` como uma tool do OpenClaw para
    execução remota de código no ambiente de sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Chave             | Tipo    | Padrão                   | Descrição                                |
    | ----------------- | ------- | ------------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se a chave estiver disponível) | Habilita ou desabilita a execução de código |
    | `model`           | string  | `grok-4-1-fast`          | Modelo usado para requisições de execução de código |
    | `maxTurns`        | number  | —                        | Máximo de turnos de conversa             |
    | `timeoutSeconds`  | number  | —                        | Timeout da requisição em segundos        |

    <Note>
    Esta é execução remota em sandbox da xAI, não [`exec`](/pt-BR/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites conhecidos">
    - A autenticação é apenas por chave de API no momento. Ainda não há fluxo de OAuth nem código de dispositivo da xAI no
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` não é compatível no
      caminho normal do provider xAI porque exige uma superfície de API upstream
      diferente do transporte xAI padrão do OpenClaw.
    - A voz em tempo real da xAI ainda não está registrada como provider do OpenClaw. Ela
      precisa de um contrato diferente de sessão de voz bidirecional do que STT em lote ou
      transcrição por streaming.
    - `quality` de imagem da xAI, `mask` de imagem e proporções extras exclusivas nativas
      não são expostas até que a tool compartilhada `image_generate` tenha
      controles correspondentes entre providers.
  </Accordion>

  <Accordion title="Observações avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para schema de tool e chamada de tool
      no caminho compartilhado do runner.
    - Requisições nativas da xAI usam por padrão `tool_stream: true`. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
      desabilitar isso.
    - O wrapper empacotado da xAI remove flags não compatíveis de schema estrito de tool e
      chaves de payload de raciocínio antes de enviar requisições nativas da xAI.
    - `web_search`, `x_search` e `code_execution` são expostos como
      tools do OpenClaw. O OpenClaw habilita o built-in específico da xAI de que precisa dentro de cada
      requisição de tool em vez de anexar todas as tools nativas a cada turno de chat.
    - `x_search` e `code_execution` pertencem ao Plugin empacotado xAI, e não estão
      hardcoded no runtime central de modelo.
    - `code_execution` é execução remota em sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Testes ao vivo

Os caminhos de mídia da xAI são cobertos por testes unitários e suítes ao vivo opcionais. Os comandos
ao vivo carregam secrets do seu shell de login, incluindo `~/.profile`, antes de
verificar `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

O arquivo ao vivo específico do provider sintetiza TTS normal, TTS PCM amigável para telefonia,
transcreve áudio por meio do STT em lote da xAI, envia o mesmo PCM por streaming através do STT em
tempo real da xAI, gera saída de texto para imagem e edita uma imagem de referência. O
arquivo ao vivo compartilhado de imagem verifica o mesmo provider xAI por meio da
seleção em runtime, fallback, normalização e caminho de anexo de mídia do OpenClaw.

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo providers, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da tool de vídeo e seleção de provider.
  </Card>
  <Card title="Todos os providers" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla de providers.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
